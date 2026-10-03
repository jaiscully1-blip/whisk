import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 100 requests per minute per IP on /api/*.
// On Vercel, serverless instances don't share memory, so production uses Upstash Redis.
// Without Upstash env vars (e.g. localhost) it falls back to an in-memory window per instance.
const LIMIT = 100;
const WINDOW_MS = 60_000;

let upstash = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  upstash = new Ratelimit({
    redis: new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN }),
    limiter: Ratelimit.slidingWindow(LIMIT, '60 s'),
    prefix: 'whisk:api',
    analytics: false
  });
}

const memory = new Map();
function memoryLimit(key) {
  const now = Date.now();
  const hits = (memory.get(key) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  memory.set(key, hits);
  if (memory.size > 5000) memory.clear();
  const remaining = Math.max(0, LIMIT - hits.length);
  return { success: hits.length <= LIMIT, limit: LIMIT, remaining, reset: now + WINDOW_MS };
}

export async function limitByIp(ip) {
  const key = ip || 'unknown';
  if (upstash) {
    const r = await upstash.limit(key);
    return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  }
  return memoryLimit(key);
}

export function clientIp(req) {
  // Vercel sets x-forwarded-for; the first entry is the client.
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
