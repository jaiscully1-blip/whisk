import 'server-only';
import crypto from 'node:crypto';

// Coin packs paid with Stripe Checkout: Apple Pay on iPhone/Safari, Google Pay on Android/Chrome, or a card.
// No monthly fee; Stripe keeps a small cut of each sale. All values are server-only env vars:
//   STRIPE_SECRET_KEY      sk_live_… (or sk_test_… while testing)
//   STRIPE_WEBHOOK_SECRET  whsec_… from the webhook you add in Stripe (also unlocks crediting in the database)
const API = () => String(process.env.STRIPE_API_URL || 'https://api.stripe.com').replace(/\/+$/, '');
const CHECKOUT_ORIGIN = () => process.env.STRIPE_CHECKOUT_ORIGIN || 'https://checkout.stripe.com';
export const stripeReady = () => /^sk_(live|test)_/.test(process.env.STRIPE_SECRET_KEY || '') && /^whsec_/.test(process.env.STRIPE_WEBHOOK_SECRET || '');

function form(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object') form(v, key, out); else if (v != null) out.append(key, String(v));
  }
  return out;
}
async function call(path, { method = 'GET', body, idem } = {}) {
  const res = await fetch(API() + path, {
    method, cache: 'no-store', signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(idem ? { 'Idempotency-Key': idem } : {}) },
    body: body ? form(body).toString() : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`stripe ${res.status} ${json?.error?.code || ''}`);
  return json;
}

export async function createCheckout({ orderId, usd, coins, site }) {
  const s = await call('/v1/checkout/sessions', {
    method: 'POST', idem: `whisk-order-${orderId}`,
    body: {
      mode: 'payment', client_reference_id: orderId, metadata: { order_id: orderId },
      payment_intent_data: { metadata: { order_id: orderId } },
      line_items: { 0: { quantity: 1, price_data: { currency: 'usd', unit_amount: Math.round(Number(usd) * 100), product_data: { name: `${Number(coins).toLocaleString('en-US')} Whisk coins` } } } },
      success_url: `${site}/me?paid=1`, cancel_url: `${site}/me`
    }
  });
  // Only ever send the player to Stripe's own checkout page.
  if (!s?.url || new URL(s.url).origin !== CHECKOUT_ORIGIN()) throw new Error('unexpected checkout link');
  return s;
}
export const getCheckout = (id) => call(`/v1/checkout/sessions/${encodeURIComponent(id)}`);

/** Stripe-Signature: "t=<unix>,v1=<hex HMAC-SHA256 of `${t}.${body}`>", within 5 minutes, compared in constant time. */
export function verifyStripeSignature(rawBody, header, now = Math.floor(Date.now() / 1000)) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
  if (!secret || !header) return false;
  const parts = header.split(',').map((p) => p.trim().split('='));
  const t = Number(parts.find(([k]) => k === 't')?.[1]);
  if (!Number.isFinite(t) || Math.abs(now - t) > 300) return false;
  const want = Buffer.from(crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`, 'utf8').digest('hex'));
  return parts.filter(([k]) => k === 'v1').some(([, v]) => { const got = Buffer.from(String(v)); return got.length === want.length && crypto.timingSafeEqual(got, want); });
}
