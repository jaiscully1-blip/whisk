import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rcReady, authOk, findPurchase, webhookSecret, sandboxAllowed } from '@/lib/revenuecat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// RevenueCat calls this after every purchase and refund (web checkout now, App Store / Google Play later).
// Coins are credited only when:
//   1. the Authorization header matches our webhook secret (constant-time), and
//   2. RevenueCat itself (asked with our secret API key) confirms this player owns this purchase, and
//   3. the database, with the same secret, finds the product in the coin-pack map; each transaction pays once.
// Any non-200 makes RevenueCat retry (5 times, up to 80 minutes apart), so errors that a retry can fix return 5xx.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ok = (extra) => NextResponse.json({ ok: true, ...extra });

export async function POST(req) {
  if (!rcReady()) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  if (!authOk(req.headers.get('authorization'))) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: 'too big' }, { status: 413 });
  let e; try { e = JSON.parse(raw)?.event; } catch { return NextResponse.json({ error: 'bad body' }, { status: 400 }); }
  if (!e || typeof e !== 'object') return NextResponse.json({ error: 'bad body' }, { status: 400 });
  if (e.type === 'TEST') return ok({ test: true });

  const sandbox = e.environment === 'SANDBOX';
  if (sandbox && !sandboxAllowed()) return ok({ ignored: 'sandbox' });
  const txn = typeof e.transaction_id === 'string' ? e.transaction_id : '';
  if (!/^[A-Za-z0-9._:-]{1,200}$/.test(txn)) return ok({ ignored: 'no transaction' });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  if (e.type === 'CANCELLATION') {   // a one-time purchase is "cancelled" when it's refunded
    const { data, error } = await db.rpc('rc_refund', { p_secret: webhookSecret(), p_txn: txn });
    if (error) { console.error('rc_refund', error.message); return NextResponse.json({ error: 'retry' }, { status: 500 }); }
    return ok({ refunded: !!data?.refunded });
  }
  if (e.type !== 'NON_RENEWING_PURCHASE') return ok({ ignored: String(e.type || 'unknown').slice(0, 40) });

  // Whisk links use the Supabase user id as the RevenueCat App User ID; anonymous RevenueCat ids are skipped.
  const user = [e.app_user_id, e.original_app_user_id, ...(Array.isArray(e.aliases) ? e.aliases : [])].find((x) => typeof x === 'string' && UUID.test(x));
  const product = typeof e.product_id === 'string' ? e.product_id : '';
  if (!user || !/^[A-Za-z0-9._-]{1,100}$/.test(product)) { console.error('revenuecat purchase without a Whisk player', txn); return ok({ ignored: 'no player' }); }

  let real;
  try { real = await findPurchase(user, product, txn); } catch (err) { console.error('revenuecat check', err?.message); return NextResponse.json({ error: 'retry' }, { status: 502 }); }
  if (!real) { console.error('revenuecat purchase not confirmed', txn); return NextResponse.json({ error: 'not confirmed' }, { status: 409 }); }

  const { data, error } = await db.rpc('rc_credit', {
    p_secret: webhookSecret(), p_user: user, p_txn: txn, p_product: product, p_store: String(e.store || 'UNKNOWN'),
    p_sandbox: sandbox, p_usd: Number.isFinite(e.price) ? e.price : null, p_quantity: Number.isInteger(e.quantity) ? e.quantity : 1
  });
  if (error) { console.error('rc_credit', error.message); return NextResponse.json({ error: 'not credited' }, { status: 500 }); }
  return ok({ credited: !!data?.credited });
}
