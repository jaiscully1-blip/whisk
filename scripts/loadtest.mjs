// Load test for Yoke's shared features. Simulates N players (default 1000) who each sign in anonymously, then
// open a chat group, send messages and read them, over about a minute. Reports how many calls worked, how many
// failed, and the 50th / 95th / 99th percentile time per call.
//
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=<anon key> USERS=1000 node scripts/loadtest.mjs
//
// IMPORTANT: run it against a spare Supabase project, not your live one. It creates N throwaway anonymous users,
// and on the free plan Realtime caps at 200 live connections at once (Pro 500, Team 10,000), so this test uses
// ordinary calls only, which is also how Yoke works when the live link is full. Anonymous sign-ins are rate limited
// per IP by Supabase (default 30 an hour per IP), so raise that under Authentication > Rate limits for the test,
// or the sign-ins will fail with 429. Nothing here uses a secret key.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_ANON_KEY;
const N = Number(process.env.USERS || 1000), SECONDS = Number(process.env.SECONDS || 60);
if (!URL || !KEY) { console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY.'); process.exit(1); }
const times = []; let ok = 0, bad = 0; const errs = new Map();
async function timed(label, p) {
  const t = performance.now(); const r = await p; const ms = performance.now() - t; times.push(ms);
  if (r.error) { bad++; const k = `${label}: ${String(r.error.message).slice(0, 60)}`; errs.set(k, (errs.get(k) || 0) + 1); } else ok++;
  return r;
}
const pct = (p) => { const s = [...times].sort((a, b) => a - b); return Math.round(s[Math.min(s.length - 1, Math.floor(s.length * p))] || 0); };

const players = [];
for (let i = 0; i < N; i += 25) {   // sign in 25 at a time so the start is not one giant spike
  await Promise.all(Array.from({ length: Math.min(25, N - i) }, async () => {
    const c = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 1 } } });
    const { data, error } = await c.auth.signInAnonymously();
    if (error) { bad++; errs.set(`sign in: ${error.message.slice(0, 60)}`, (errs.get('sign in: ' + error.message.slice(0, 60)) || 0) + 1); return; }
    players.push({ c, id: data.user.id });
  }));
}
console.log(`${players.length} of ${N} players signed in`);

// each player makes their own group and chats there (friendships between 1,000 throwaway users would need setup of their own),
const end = Date.now() + SECONDS * 1000;
await Promise.all(players.map(async (p, i) => {
  await new Promise((r) => setTimeout(r, Math.random() * 3000));
  const g = await timed('create_chat', p.c.rpc('create_chat', { p_name: `Load ${i}`, p_codes: [] }));
  const gid = g.data; if (!gid) return;
  while (Date.now() < end) {
    await timed('send_chat', p.c.rpc('send_chat', { p_group: gid, p_kind: 'text', p_body: `hello ${i} ${Date.now()}` }));
    await timed('get_chat', p.c.rpc('get_chat', { p_group: gid }));
    await timed('get_chats', p.c.rpc('get_chats'));
    await new Promise((r) => setTimeout(r, 2500 + Math.random() * 3000));
  }
  await timed('leave_chat', p.c.rpc('leave_chat', { p_group: gid }));
}));

console.log(`calls: ${ok} ok, ${bad} failed (${(100 * bad / Math.max(1, ok + bad)).toFixed(2)}%)`);
console.log(`time per call: median ${pct(0.5)} ms, 95th ${pct(0.95)} ms, 99th ${pct(0.99)} ms`);
for (const [k, v] of errs) console.log(`  ${v} x ${k}`);
process.exit(bad / Math.max(1, ok + bad) > 0.01 ? 1 : 0);
