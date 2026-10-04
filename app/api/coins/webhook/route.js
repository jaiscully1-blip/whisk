import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { btcpayReady, getInvoice, verifySignature } from '@/lib/btcpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// BTCPay calls this when an invoice changes. Coins are credited only when:
//   1. the BTCPay-Sig signature matches our webhook secret, and
//   2. BTCPay itself (re-fetched with our API key) says the invoice is Settled, in USD, for one of our orders.
// The database then checks the amount and credits each order once.
export async function POST(req) {
  if (!btcpayReady()) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 64_000 || !verifySignature(raw, req.headers.get('btcpay-sig'))) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  let evt; try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }
  if (evt?.type !== 'InvoiceSettled' || typeof evt.invoiceId !== 'string') return NextResponse.json({ ok: true, ignored: evt?.type || 'unknown' });
  if (evt.storeId && evt.storeId !== process.env.BTCPAY_STORE_ID) return NextResponse.json({ error: 'wrong store' }, { status: 400 });

  let inv;
  try { inv = await getInvoice(evt.invoiceId); } catch (e) { console.error('btcpay get invoice', e?.message); return NextResponse.json({ error: 'retry' }, { status: 502 }); }
  const orderId = inv?.metadata?.orderId;
  if (inv?.status !== 'Settled' || inv?.currency !== 'USD' || !/^[0-9a-f-]{36}$/i.test(orderId || '')) return NextResponse.json({ ok: true, ignored: 'not a settled Whisk order' });

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('credit_coin_order', { p_order_id: orderId, p_invoice_id: inv.id, p_paid_usd: Number(inv.amount), p_secret: process.env.BTCPAY_WEBHOOK_SECRET });
  if (error) { console.error('credit_coin_order', error.message); return NextResponse.json({ error: 'not credited' }, { status: 400 }); }
  return NextResponse.json({ ok: true, credited: !!data?.credited });
}
