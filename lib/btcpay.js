import 'server-only';
import crypto from 'node:crypto';

// BTCPay Server (Greenfield API). All values are server-only env vars; nothing here reaches the browser.
//   BTCPAY_URL            e.g. https://pay.example.com  (your BTCPay Server)
//   BTCPAY_STORE_ID       the store's id
//   BTCPAY_API_KEY        API key with "Create invoice" + "View invoices" permissions for that store
//   BTCPAY_WEBHOOK_SECRET the secret you set on the store's webhook (also used to unlock crediting in the database)
const base = () => String(process.env.BTCPAY_URL || '').replace(/\/+$/, '');
export const btcpayReady = () => (/^https:\/\//.test(base()) || /^http:\/\/localhost(:\d+)?(\/|$)/.test(base())) && !!process.env.BTCPAY_STORE_ID && !!process.env.BTCPAY_API_KEY && !!process.env.BTCPAY_WEBHOOK_SECRET;

async function call(path, init = {}) {
  const res = await fetch(`${base()}/api/v1/stores/${encodeURIComponent(process.env.BTCPAY_STORE_ID)}${path}`, {
    ...init,
    headers: { Authorization: `token ${process.env.BTCPAY_API_KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`btcpay ${res.status}`);
  return res.json();
}

export async function createInvoice({ orderId, usd, coins, redirectURL }) {
  const inv = await call('/invoices', {
    method: 'POST',
    body: JSON.stringify({ amount: Number(usd).toFixed(2), currency: 'USD', metadata: { orderId, itemDesc: `${coins.toLocaleString('en-US')} Whisk coins` }, checkout: { redirectURL, redirectAutomatically: true } })
  });
  // Only ever send the player to our own BTCPay Server.
  if (!inv?.checkoutLink || new URL(inv.checkoutLink).origin !== new URL(base()).origin) throw new Error('unexpected checkout link');
  return inv;
}

export const getInvoice = (id) => call(`/invoices/${encodeURIComponent(id)}`);

/** BTCPay-Sig: "sha256=" + lowercase hex HMAC-SHA256 of the exact request body, compared in constant time. */
export function verifySignature(rawBody, header) {
  const secret = process.env.BTCPAY_WEBHOOK_SECRET || '';
  if (!secret || !header || !header.startsWith('sha256=')) return false;
  const want = Buffer.from('sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex'));
  const got = Buffer.from(header);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
