import 'server-only';
import crypto from 'node:crypto';

// Coin packs through RevenueCat. On the web, players pay on RevenueCat's own checkout page (pay.rev.cat), which runs
// on your Stripe account and shows Apple Pay / Google Pay / card. In the phone app later, the same products are sold
// with Apple / Google in-app purchase. Either way RevenueCat calls our webhook and the coins are credited once.
// No monthly fee. All values are server-only env vars (see LAUNCH.md §3c):
//   REVENUECAT_PURCHASE_LINK   the Web Purchase Link, e.g. https://pay.rev.cat/abc123def456 (production link)
//   REVENUECAT_WEBHOOK_AUTH    a long random value; RevenueCat sends it in the Authorization header (its SHA-256
//                              also goes in the database, setup 20b)
//   REVENUECAT_SECRET_KEY      secret API key (sk_…); used to double-check every purchase with RevenueCat
//   REVENUECAT_ALLOW_SANDBOX   "1" only while testing (sandbox purchases then credit coins too)
const API = () => String(process.env.REVENUECAT_API_URL || 'https://api.revenuecat.com').replace(/\/+$/, '');
const LINK_ORIGIN = () => process.env.REVENUECAT_LINK_ORIGIN || 'https://pay.rev.cat';
const link = () => String(process.env.REVENUECAT_PURCHASE_LINK || '').replace(/\/+$/, '');
const auth = () => String(process.env.REVENUECAT_WEBHOOK_AUTH || '').replace(/^Bearer\s+/i, '');

function linkOk() {
  try { const u = new URL(link()); return u.origin === LINK_ORIGIN() && /^\/[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)?$/.test(u.pathname) && !u.search; } catch { return false; }
}
export const rcReady = () => linkOk() && auth().length >= 24 && /^sk_[A-Za-z0-9_]+$/.test(process.env.REVENUECAT_SECRET_KEY || '');
export const webhookSecret = () => auth();
export const sandboxAllowed = () => process.env.REVENUECAT_ALLOW_SANDBOX === '1';

// The checkout link for this player and pack: https://pay.rev.cat/<token>/<player id>?package_id=<pack>[&email=…]
export function purchaseLink(userId, packId, email) {
  const u = new URL(`${link()}/${encodeURIComponent(userId)}`);
  u.searchParams.set('package_id', packId);
  if (email && /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(email)) u.searchParams.set('email', email);
  if (u.origin !== LINK_ORIGIN()) throw new Error('unexpected checkout link');
  return u.toString();
}

// The Authorization header RevenueCat sends, compared in constant time (with or without "Bearer ").
export function authOk(header) {
  const want = auth();
  if (!want || typeof header !== 'string') return false;
  const given = header.replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(given).digest(), b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

// Ask RevenueCat itself whether this player really has this one-time purchase (a forged webhook can't pass this,
// because it needs our secret API key). Returns the purchase or null; throws when RevenueCat can't be reached.
export async function findPurchase(userId, productId, transactionId) {
  const res = await fetch(`${API()}/v1/subscribers/${encodeURIComponent(userId)}`, {
    cache: 'no-store', signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}`, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`revenuecat ${res.status}`);
  const json = await res.json().catch(() => ({}));
  const list = json?.subscriber?.non_subscriptions?.[productId];
  if (!Array.isArray(list)) return null;
  return list.find((p) => p && (p.store_transaction_id === transactionId || p.id === transactionId)) || null;
}
