// Sends web push notifications (server only). Ready when the three env vars are set in Vercel:
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (make both on the admin page) and PUSH_SECRET (any long random
//   string; its fingerprint goes in the database, see supabase/setup/14). No paid service: browsers' own push.
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

export const pushReady = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && (process.env.PUSH_SECRET || '').length >= 24);
export const anonDb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
export function secretOk(given) {
  const want = process.env.PUSH_SECRET || '';
  if (!want || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest(), b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

// messages: [{ endpoint, p256dh, auth, title, body, url }] → sends them; tells the database which phones are gone.
export async function sendAll(db, messages) {
  if (!messages?.length) return { sent: 0, gone: 0 };
  webpush.setVapidDetails(process.env.PUSH_CONTACT || 'mailto:hello@whisk.app', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const gone = []; let sent = 0;
  await Promise.all(messages.map(async (m) => {
    try {
      await webpush.sendNotification({ endpoint: m.endpoint, keys: { p256dh: m.p256dh, auth: m.auth } },
        JSON.stringify({ title: m.title, body: m.body, url: m.url }), { TTL: 6 * 3600, urgency: 'normal', timeout: 8000 });
      sent++;
    } catch (e) { if (e?.statusCode === 404 || e?.statusCode === 410) gone.push(m.endpoint); }
  }));
  if (gone.length) await db.rpc('push_gone', { p_secret: process.env.PUSH_SECRET, p_endpoints: gone });
  return { sent, gone: gone.length };
}
