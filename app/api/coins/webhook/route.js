import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripeReady, getCheckout, verifyStripeSignature } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Stripe calls this when a checkout finishes. Coins are credited only when:
//   1. the Stripe-Signature matches our webhook secret (and is under 5 minutes old), and
//   2. Stripe itself (re-fetched with our secret key) says the checkout is paid, in USD, for one of our orders.
// The database then checks the amount and credits each order once, however many times Stripe retries.
const PAID_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);
export async function POST(req) {
  if (!stripeReady()) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 64_000 || !verifyStripeSignature(raw, req.headers.get('stripe-signature'))) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  let evt; try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }
  const sid = evt?.data?.object?.id;
  if (!PAID_EVENTS.has(evt?.type) || typeof sid !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(sid)) return NextResponse.json({ ok: true, ignored: evt?.type || 'unknown' });

  let s;
  try { s = await getCheckout(sid); } catch (e) { console.error('stripe get session', e?.message); return NextResponse.json({ error: 'retry' }, { status: 502 }); }
  const orderId = s?.metadata?.order_id;
  if (s?.payment_status !== 'paid' || s?.currency !== 'usd' || !/^[0-9a-f-]{36}$/i.test(orderId || '')) return NextResponse.json({ ok: true, ignored: 'not a paid Whisk order' });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('credit_coin_order', { p_order_id: orderId, p_invoice_id: s.id, p_paid_usd: Number(s.amount_total) / 100, p_secret: process.env.STRIPE_WEBHOOK_SECRET });
  if (error) { console.error('credit_coin_order', error.message); return NextResponse.json({ error: 'not credited' }, { status: 400 }); }
  return NextResponse.json({ ok: true, credited: !!data?.credited });
}
