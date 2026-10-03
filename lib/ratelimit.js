import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis/cloudflare';

// 100 requests per minute per IP on /api/*.
// On Vercel, serverless instances don't share memory, so production uses Upstash Redis.
// Without Upstash env vars (e.g. localhost) it falls back to an in-memory window per instance.
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const LIMIT = 100;
const WINDOW_MS = 60_000;

let upstash = null;
if (REDIS_URL && REDIS_TOKEN) {
  upstash = new Ratelimit({
    redis: new Redis({ url: REDIS_URL, token: REDIS_TOKEN }),
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

// AI recipe calls cost money: 20 per user per day.
let recipeLimiter = null;
if (REDIS_URL && REDIS_TOKEN) {
  recipeLimiter = new Ratelimit({
    redis: new Redis({ url: REDIS_URL, token: REDIS_TOKEN }),
    limiter: Ratelimit.slidingWindow(20, '1 d'),
    prefix: 'whisk:recipes'
  });
}
const recipeMemory = new Map();
export async function limitRecipes(userId) {
  if (recipeLimiter) { const r = await recipeLimiter.limit(userId); return { success: r.success, remaining: r.remaining }; }
  const now = Date.now();
  const hits = (recipeMemory.get(userId) || []).filter((t) => now - t < 86_400_000);
  hits.push(now); recipeMemory.set(userId, hits);
  return { success: hits.length <= 20, remaining: Math.max(0, 20 - hits.length) };
}

export function clientIp(req) {
  // Vercel sets x-forwarded-for; the first entry is the client.
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
