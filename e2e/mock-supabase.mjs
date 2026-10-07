// Local stand-in for Supabase (auth, a PostgREST subset, RPC, storage) and the Anthropic Messages API,
// backed by PGlite running the real migrations — so RLS and every SQL function run for real.
// For local end-to-end tests only. Never deploy this.
//   node e2e/mock-supabase.mjs        → http://localhost:54321
import http from 'node:http';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const PORT = Number(process.env.MOCK_PORT || 54321);
export const E2E_USER = { id: 'e2e00000-0000-4000-8000-000000000001', email: 'cook@whisk.test', password: 'whisk-e2e-pass' };
const ID_RE = /^[a-z_][a-z0-9_]*$/;
const id = (s) => { if (!ID_RE.test(s)) throw Object.assign(new Error(`bad identifier ${s}`), { status: 400 }); return `"${s}"`; };

const db = new PGlite();
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth; create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant execute on function auth.jwt() to anon, authenticated;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, owner_id text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated; grant select, insert, delete on storage.objects to authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
for (const f of ['0001_whisk_schema.sql', '0002_whisk_seed.sql', '0003_whisk_features.sql', '0004_whisk_web_recipes.sql', '0005_web_recipes_seed.sql', '0006_whisk_coins_reset.sql', '0007_bingo_five_days.sql', '0008_passport_countries.sql', '0009_local_calendar.sql', '0010_hockey_helmet.sql', '0011_activity_onboarding_admin.sql', '0012_dishes_and_stamp_coins.sql', '0013_one_phone_play.sql', '0014_recipe_steps.sql', '0015_free_chef_coat_pilot_coat_xp.sql', '0016_bingo_weekly_with_challenges.sql', '0017_cookoff_and_invites.sql', '0018_cookoff_judges.sql', '0019_safety_streaks_sharing.sql'].filter((f) => !process.env.MOCK_UPTO || f <= process.env.MOCK_UPTO)) {   // MOCK_UPTO=0018_… : a database that hasn't run the newer SQL yet
  await db.exec(fs.readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), 'utf8').replace('create extension if not exists pgcrypto;', ''));
}
await db.exec(`insert into auth.users (id, email) values ('${E2E_USER.id}', '${E2E_USER.email}')`);
// A realistic starting pantry (same as Whisk Play), including frozen ground beef that needs thawing.
const START = [['Eggs', 'Dairy & Eggs'], ['Tomatoes', 'Produce'], ['Scallions', 'Produce'], ['Spaghetti', 'Carbs & Grains'], ['Garlic', 'Produce'], ['Olive oil', 'Sauces & Oils'],
  ['Parmesan', 'Dairy & Eggs'], ['Rice', 'Carbs & Grains'], ['Black beans', 'Canned & Jarred'], ['Salsa', 'Sauces & Oils'], ['Cheddar', 'Dairy & Eggs'], ['Potatoes', 'Produce'],
  ['Onion', 'Produce'], ['Chicken thighs', 'Proteins'], ['Soy sauce', 'Sauces & Oils'], ['Lentils', 'Canned & Jarred'], ['Chickpeas', 'Canned & Jarred'], ['Ginger', 'Produce'],
  ['Tomato paste', 'Canned & Jarred'], ['Lemon', 'Produce'], ['Ground beef', 'Frozen'], ['Bell peppers', 'Produce'], ['Spinach', 'Produce'], ['Butter', 'Dairy & Eggs'],
  ['Milk', 'Dairy & Eggs'], ['Flour', 'Baking'], ['Tortillas', 'Carbs & Grains'], ['Chicken broth', 'Canned & Jarred'], ['Carrots', 'Produce']];
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_e2e';
await db.exec(`insert into private.app_secrets (name, sha256_hex) values ('payments_webhook', encode(sha256(convert_to('${WEBHOOK_SECRET}', 'UTF8')), 'hex'))`);
await db.exec(`insert into public.pantry_items (user_id, name, category) values ${START.map(([n, c]) => `('${E2E_USER.id}', '${n}', '${c}')`).join(', ')}`);

// One PGlite connection → run requests one at a time.
let chain = Promise.resolve();
const serial = (fn) => (chain = chain.then(fn, fn));
const asUser = (uid, fn) => serial(() => db.transaction(async (tx) => {
  await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid || '']);
  await tx.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid || null, amr: amrByUid.get(uid) || [] })]);
  await tx.exec(`set local role ${uid ? 'authenticated' : 'anon'}`);
  return fn(tx);
}));

// ---------- auth ----------
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const tokens = new Map(); // access_token → uid
function session(uid) {
  const now = Math.floor(Date.now() / 1000);
  const access = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: uid, email: E2E_USER.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600, session_id: randomUUID() })}.mock`;
  tokens.set(access, uid);
  return { access_token: access, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: randomUUID(), user: userObj(uid) };
}
const userObj = (uid) => ({ id: uid, aud: 'authenticated', role: 'authenticated', email: E2E_USER.email, email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' });
const uidFrom = (req) => tokens.get((req.headers.authorization || '').replace(/^Bearer /, '')) || null;
const refreshes = new Map();   // refresh token → user (so a second phone stays its own player)
const amrByUid = new Map(); let anonSignups = 0;

// ---------- PostgREST subset ----------
function splitTop(s) { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; }
async function fkCol(tx, base, rel) {
  const r = await tx.query(`select a.attname from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and c.conrelid = ('public.' || $1)::regclass and c.confrelid = ('public.' || $2)::regclass limit 1`, [base, rel]);
  return r.rows[0]?.attname;
}
async function selectList(tx, table, sel) {
  const parts = [];
  for (const p of splitTop(sel || '*')) {
    const m = p.match(/^([a-z_][a-z0-9_]*)(?:!inner)?\((.*)\)$/);
    if (m) {
      const [, rel, inner] = m; const col = await fkCol(tx, table, rel);
      if (!col) throw Object.assign(new Error(`no relation ${rel}`), { status: 400 });
      const cols = splitTop(inner).map((c) => (c === '*' ? 'e.*' : `e.${id(c)}`)).join(', ');
      parts.push(`(select row_to_json(x) from (select ${cols} from public.${id(rel)} e where e.id = b.${id(col)}) x) as ${id(rel)}`);
    } else if (p === '*') parts.push('b.*');
    else { const [alias, col] = p.includes(':') ? p.split(':') : [p, p]; parts.push(`b.${id(col)} as ${id(alias)}`); }
  }
  return parts.join(', ');
}
function where(params, values) {
  const conds = [];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(k)) continue;
    const m = v.match(/^(not\.)?(eq|neq|gt|gte|lt|lte|like|ilike|is|in)\.(.*)$/s);
    if (!m) throw Object.assign(new Error(`bad filter ${k}=${v}`), { status: 400 });
    const [, not, op, raw] = m; let c;
    if (op === 'is') c = `b.${id(k)} is ${raw === 'null' ? 'null' : raw === 'true' ? 'true' : 'false'}`;
    else if (op === 'in') { values.push(`{${raw.replace(/^\(|\)$/g, '').split(',').map((x) => `"${x.replace(/^"|"$/g, '').replace(/"/g, '')}"`).join(',')}}`); c = `b.${id(k)} = any($${values.length})`; }
    else { values.push(raw); c = `b.${id(k)} ${{ eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'like', ilike: 'ilike' }[op]} $${values.length}`; }
    conds.push(not ? `not (${c})` : c);
  }
  return conds.length ? `where ${conds.join(' and ')}` : '';
}
function orderBy(o) {
  if (!o) return '';
  return 'order by ' + o.split(',').map((t) => { const [col, dir, nulls] = t.split('.'); return `b.${id(col)} ${dir === 'desc' ? 'desc' : 'asc'}${nulls === 'nullsfirst' ? ' nulls first' : nulls === 'nullslast' ? ' nulls last' : ''}`; }).join(', ');
}
async function rest(req, res, uid, table, url, body) {
  const params = [...url.searchParams.entries()];
  const prefer = req.headers.prefer || '';
  const wantObj = (req.headers.accept || '').includes('vnd.pgrst.object');
  const values = [];
  const out = await asUser(uid, async (tx) => {
    const t = `public.${id(table)}`;
    if (req.method === 'GET' || req.method === 'HEAD') {
      const w = where(params, values);
      const lim = url.searchParams.get('limit') ? `limit ${Number(url.searchParams.get('limit'))}` : '';
      const off = url.searchParams.get('offset') ? `offset ${Number(url.searchParams.get('offset'))}` : '';
      let count = null;
      if (prefer.includes('count=')) count = (await tx.query(`select count(*)::int n from ${t} b ${w}`, values)).rows[0].n;
      if (req.method === 'HEAD') return { rows: [], count };
      const cols = await selectList(tx, table, url.searchParams.get('select'));
      const r = await tx.query(`select ${cols} from ${t} b ${w} ${orderBy(url.searchParams.get('order'))} ${lim} ${off}`, values);
      return { rows: r.rows, count };
    }
    if (req.method === 'POST') {
      const rows = Array.isArray(body) ? body : [body];
      const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      const tuples = rows.map((r) => `(${keys.map((k) => (k in r ? (values.push(r[k] !== null && typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k]), `$${values.length}`) : 'default')).join(', ')})`);
      const r = await tx.query(`insert into ${t} as b (${keys.map(id).join(', ')}) values ${tuples.join(', ')} returning ${await selectList(tx, table, url.searchParams.get('select'))}`, values);
      return { rows: r.rows, created: true };
    }
    if (req.method === 'PATCH') {
      const sets = Object.entries(body).map(([k, v]) => (values.push(v !== null && typeof v === 'object' ? JSON.stringify(v) : v), `${id(k)} = $${values.length}`));
      const w = where(params, values);
      const r = await tx.query(`update ${t} b set ${sets.join(', ')} ${w} returning ${await selectList(tx, table, url.searchParams.get('select'))}`, values);
      return { rows: r.rows };
    }
    if (req.method === 'DELETE') {
      const w = where(params, values);
      const r = await tx.query(`delete from ${t} b ${w} returning b.*`, values);
      return { rows: r.rows };
    }
    throw Object.assign(new Error('method'), { status: 405 });
  });
  const headers = {};
  if (out.count !== null && out.count !== undefined) headers['Content-Range'] = `${out.rows.length ? `0-${out.rows.length - 1}` : '*'}/${out.count}`;
  if (req.method === 'HEAD') return send(res, 200, null, headers);
  const returnRep = req.method === 'GET' || prefer.includes('return=representation');
  if (!returnRep) return send(res, out.created ? 201 : 204, null, headers);
  if (wantObj) {
    if (out.rows.length !== 1) return send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${out.rows.length} rows`, hint: null });
    return send(res, out.created ? 201 : 200, out.rows[0], headers);
  }
  return send(res, out.created ? 201 : 200, out.rows, headers);
}
async function rpc(res, uid, fn, args, wantObj) {
  const out = await asUser(uid, async (tx) => {
    const meta = (await tx.query(`select p.proretset, p.proargnames, array(select format_type(t, null) from unnest(p.proargtypes) t) as types
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1`, [fn])).rows[0];
    if (!meta) throw Object.assign(new Error(`Could not find the function public.${fn}`), { status: 404, code: 'PGRST202' });
    const values = [], named = [];
    for (const [k, v] of Object.entries(args || {})) {
      const i = (meta.proargnames || []).indexOf(k);
      if (i < 0) throw Object.assign(new Error(`unknown argument ${k}`), { status: 404, code: 'PGRST202' });
      values.push(Array.isArray(v) && meta.types[i].endsWith('[]') ? `{${v.map((x) => `"${String(x).replace(/["\\]/g, '')}"`).join(',')}}` : v !== null && typeof v === 'object' ? JSON.stringify(v) : v); named.push(`${id(k)} => $${values.length}::${meta.types[i]}`);
    }
    const call = `public.${id(fn)}(${named.join(', ')})`;
    if (meta.proretset) return (await tx.query(`select * from ${call} t`, values)).rows;
    return (await tx.query(`select to_json(${call}) as j`, values)).rows[0].j;
  });
  if (wantObj && Array.isArray(out)) return send(res, 200, out[0] ?? null);
  return send(res, 200, out);
}

// ---------- storage ----------
const files = new Map();
const sessions = new Map(), sessionsByIdem = new Map();
async function storage(req, res, uid, path, buf) {
  let m;
  if (req.method === 'POST' && (m = path.match(/^\/storage\/v1\/object\/sign\/([^/]+)$/))) {
    const { paths = [], expiresIn } = JSON.parse(buf.toString() || '{}');
    const bucket = m[1];
    const visible = await asUser(uid, (tx) => tx.query(`select name from storage.objects where bucket_id = $1 and name = any($2)`, [bucket, `{${paths.map((p) => `"${p}"`).join(',')}}`]));
    const ok = new Set(visible.rows.map((r) => r.name));
    return send(res, 200, paths.map((p) => (ok.has(p) ? { path: p, signedURL: `/object/sign/${bucket}/${p}?token=mock&exp=${expiresIn}`, error: null } : { path: p, signedURL: null, error: 'Object not found' })));
  }
  if (req.method === 'GET' && (m = path.match(/^\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/))) {
    const f = files.get(`${m[1]}/${decodeURIComponent(m[2])}`);
    if (!f) return send(res, 404, { error: 'not found' });
    res.writeHead(200, { 'Content-Type': f.type, ...cors(req) }); return res.end(f.buf);
  }
  // list a folder (POST /object/list/:bucket {prefix, limit}) and remove files (DELETE /object/:bucket {prefixes}), as the user
  if (req.method === 'POST' && (m = path.match(/^\/storage\/v1\/object\/list\/([^/]+)$/))) {
    const { prefix = '', limit = 100 } = JSON.parse(buf.toString() || '{}');
    const r = await asUser(uid, (tx) => tx.query(`select name from storage.objects where bucket_id = $1 and name like $2 order by name limit $3`, [m[1], `${prefix.replace(/\/$/, '')}/%`, limit]));
    return send(res, 200, r.rows.map((x) => ({ name: x.name.slice(prefix.replace(/\/$/, '').length + 1), id: randomUUID() })));
  }
  if (req.method === 'DELETE' && (m = path.match(/^\/storage\/v1\/object\/([^/]+)$/))) {
    const { prefixes = [] } = JSON.parse(buf.toString() || '{}');
    if (!uid) return send(res, 403, { error: 'Unauthorized' });
    const own = prefixes.filter((p) => p.split('/')[0] === uid);
    if (own.length) await db.query(`delete from storage.objects where bucket_id = $1 and name = any($2)`, [m[1], own]);
    own.forEach((p) => files.delete(`${m[1]}/${p}`));
    return send(res, 200, own.map((name) => ({ name })));
  }
  if ((req.method === 'POST' || req.method === 'PUT') && (m = path.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/))) {
    const [, bucket, name] = m; const objName = decodeURIComponent(name);
    if (!uid) return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
    await asUser(uid, (tx) => tx.query(`insert into storage.objects (bucket_id, name, owner, owner_id) values ($1, $2, $3::uuid, $3::text)`, [bucket, objName, uid]));
    files.set(`${bucket}/${objName}`, { buf, type: req.headers['content-type'] || 'application/octet-stream' });
    return send(res, 200, { Key: `${bucket}/${objName}`, Id: randomUUID(), path: objName, id: randomUUID(), fullPath: `${bucket}/${objName}` });
  }
  return send(res, 404, { error: 'not found' });
}

// ---------- Anthropic stand-in ----------
export const anthropicCalls = [];
const wikiCalls = [], ytCalls = [];
function fakeRecipe(title, cuisine, fromPantry) {
  return { title, cuisine, summary: `A quick ${cuisine.toLowerCase()} dinner.`, prep_minutes: 10, cook_minutes: 20, servings: 2, technique: 2, prep_level: 2, precision: 2, equipment: ['stove'],
    ingredients: [{ item: fromPantry[0] || 'Eggs', amount: '2', from_pantry: true }, { item: 'Fresh basil', amount: '1 handful', from_pantry: false }],
    steps: [{ text: 'Prep everything.', timer_minutes: null }, { text: 'Simmer gently.', timer_minutes: 1 }], substitutions: [{ for: 'Fresh basil', use: 'Dried oregano' }], tips: 'Taste as you go.', leftovers: 'Wrap it in a tortilla tomorrow.',
    nutrition: { calories: 520, protein_g: 32, carbs_g: 48, fat_g: 18 } };
}
function anthropic(body) {
  const names = (body.tools || []).map((t) => t.name);
  if (names.includes('web_search')) anthropicCalls.push('web_search');   // must never happen now: dish search is free
  const tool = body.tools?.[0]?.name; anthropicCalls.push(tool);
  let input;
  if (tool === 'groceries') input = { store: 'Mock Mart', items: [{ name: 'Chicken thighs', category: 'Proteins', quantity: '2 lb' }, { name: 'Spinach', category: 'Produce', quantity: null }, { name: 'Greek yogurt', category: 'Dairy & Eggs', quantity: '500 g' }] };
  else input = { recipes: [fakeRecipe('Mock Pad Thai', 'Thai', ['Eggs']), fakeRecipe('Mock Tacos', 'Mexican', ['Eggs'])] };
  return { id: 'msg_mock', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'tool_use', id: 'toolu_mock', name: tool, input }], stop_reason: 'tool_use', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } };
}

// ---------- server ----------
const cors = (req) => ({ 'Access-Control-Allow-Origin': req.headers.origin || '*', 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS', 'Access-Control-Expose-Headers': 'Content-Range' });
let curReq;
function send(res, status, json, headers = {}) {
  res.writeHead(status, { ...cors(curReq), ...(json === null ? {} : { 'Content-Type': 'application/json' }), ...headers });
  res.end(json === null ? undefined : JSON.stringify(json));
}
const server = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const buf = Buffer.concat(chunks);
  curReq = req;
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, cors(req)); return res.end(); }
  const json = () => { try { return JSON.parse(buf.toString() || 'null'); } catch { return null; } };
  try {
    if (path === '/auth/v1/token') {
      const b = json() || {};
      if (url.searchParams.get('grant_type') === 'password') {
        if (b.email !== E2E_USER.email || b.password !== E2E_USER.password) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        const s = session(E2E_USER.id); refreshes.set(s.refresh_token, E2E_USER.id); return send(res, 200, s);
      }
      if (url.searchParams.get('grant_type') === 'refresh_token') { const who = refreshes.get(b.refresh_token) || E2E_USER.id; const s = session(who); refreshes.set(s.refresh_token, who); if (who !== E2E_USER.id) s.user = { ...s.user, email: '', is_anonymous: true }; return send(res, 200, s); }
      return send(res, 400, { msg: 'unsupported grant' });
    }
    if (path === '/auth/v1/signup' && req.method === 'POST') {
      // "Start playing": Supabase anonymous sign-in (no email, no password). The test player is the anonymous user here.
      const b = json() || {}; if (b.email || b.password) return send(res, 422, { code: 422, error_code: 'email_provider_disabled', msg: 'Email signups are disabled' });
      anonSignups++;
      // The first "Start playing" is the main test player; any later one (a friend's phone) is a brand-new player with the same starter pantry.
      let who = E2E_USER.id;
      if (anonSignups > 1) { who = randomUUID(); await db.exec(`insert into auth.users (id, email) values ('${who}', null)`); await db.exec(`insert into public.pantry_items (user_id, name, category) values ${START.map(([n, c]) => `('${who}', '${n.replace(/'/g, "''")}', '${c}')`).join(', ')}`); }
      amrByUid.set(who, [{ method: 'anonymous', timestamp: Math.floor(Date.now() / 1000) }]);
      const s = session(who); s.user = { ...s.user, email: '', is_anonymous: true, app_metadata: { provider: 'anonymous', providers: ['anonymous'] } }; refreshes.set(s.refresh_token, who); return send(res, 200, s);
    }
    if (path === '/__e2e/anon-signups') return send(res, 200, { n: anonSignups });
    if (path === '/auth/v1/user') { const uid = uidFrom(req); return uid ? send(res, 200, userObj(uid)) : send(res, 401, { code: 401, error_code: 'bad_jwt', msg: 'invalid JWT' }); }
    if (path === '/auth/v1/logout') return send(res, 204, null);
    if (path === '/anthropic/v1/messages' && req.method === 'POST') return send(res, 200, anthropic(json()));
    if (path === '/__e2e/calls') return send(res, 200, anthropicCalls);
    // ---- Stripe stand-in (Checkout Sessions API, form-encoded like the real one) ----
    let bm;
    if (path === '/stripe/v1/checkout/sessions' && req.method === 'POST') {
      if (req.headers.authorization !== 'Bearer sk_test_e2e') return send(res, 401, { error: { code: 'invalid_api_key' } });
      const f = Object.fromEntries(new URLSearchParams(buf.toString()));
      const idem = req.headers['idempotency-key']; if (idem && sessionsByIdem.has(idem)) return send(res, 200, sessionsByIdem.get(idem));
      const id = 'cs_test_' + randomUUID().replace(/-/g, '').slice(0, 20);
      const sess = { id, object: 'checkout.session', url: `http://localhost:${PORT}/stripe-checkout/${id}`, mode: f.mode, currency: f['line_items[0][price_data][currency]'], amount_total: Number(f['line_items[0][price_data][unit_amount]']),
        metadata: { order_id: f['metadata[order_id]'] }, client_reference_id: f.client_reference_id, payment_status: 'unpaid', success_url: f.success_url, name: f['line_items[0][price_data][product_data][name]'] };
      sessions.set(id, sess); if (idem) sessionsByIdem.set(idem, sess); return send(res, 200, sess);
    }
    if ((bm = path.match(/^\/stripe\/v1\/checkout\/sessions\/([^/]+)$/))) { if (req.headers.authorization !== 'Bearer sk_test_e2e') return send(res, 401, {}); const s2 = sessions.get(bm[1]); return s2 ? send(res, 200, s2) : send(res, 404, { error: { code: 'resource_missing' } }); }
    if ((bm = path.match(/^\/stripe-checkout\/([^/]+)$/))) { const s2 = sessions.get(bm[1]); res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(`<!doctype html><title>Stripe test checkout</title><h1>Pay $${(s2?.amount_total || 0) / 100} with Apple Pay</h1><p>${s2?.name || ''}</p>`); }
    if ((bm = path.match(/^\/__e2e\/stripe-pay\/([^/]+)$/))) { const s2 = sessions.get(bm[1]); if (s2) s2.payment_status = 'paid'; return send(res, 200, s2 || {}); }
    if (path === '/__e2e/stripe-sessions') return send(res, 200, [...sessions.values()]);
    if (path === '/__e2e/events') { const r = await db.query(`select kind, page, target, value from app_events order by id`); return send(res, 200, r.rows); }
    if (path === '/__e2e/make-admin') { await db.exec(`update profiles set is_admin = true where id = '${E2E_USER.id}'`); return send(res, 200, { ok: true }); }
    // ---- Wikipedia stand-in ----
    if (path === '/wiki/w/api.php') {
      wikiCalls.push(Object.fromEntries(url.searchParams));
      const p = url.searchParams;
      if (p.get('action') === 'query') {
        const q = (p.get('gsrsearch') || '').toLowerCase();
        if (!q.includes('macha')) return send(res, 200, { batchcomplete: true });
        return send(res, 200, { query: { pages: [
          { pageid: 777, title: 'Macha (film)', index: 1, description: '1990 film', categories: [{ title: 'Category:1990 films' }] },
          { pageid: 778, title: 'Salsa macha', index: 2, description: 'Mexican sauce', categories: [{ title: 'Category:Mexican sauces' }] },
          { pageid: 779, title: 'List of sauces', index: 3, description: 'Wikimedia list article', categories: [{ title: 'Category:Sauces' }] }
        ] } });
      }
      if (p.get('action') === 'parse' && p.get('pageid') === '778') return send(res, 200, { parse: { title: 'Salsa macha', pageid: 778, wikitext: '{{Infobox food\n| name = Salsa macha\n| country = [[Mexico]]\n| main_ingredient = [[Chili pepper|Dried chiles]], [[garlic]], {{hlist|[[peanut]]s|sesame seeds}}, [[olive oil]]<ref>x</ref>\n| variations = \n}}\nSalsa macha is a sauce.' } });
      return send(res, 404, { error: 'mock' });
    }
    // ---- YouTube Data API stand-in ----
    if (path.startsWith('/yt/youtube/v3/')) {
      if (url.searchParams.get('key') !== 'e2e-yt-key') return send(res, 403, { error: { code: 403, message: 'bad key' } });
      // a channel's uploads (Your channels → channel page)
      if (path.endsWith('/channels')) {
        if (url.searchParams.get('forHandle')?.toLowerCase() !== '@mockkitchen') return send(res, 200, { items: [] });
        return send(res, 200, { items: [{ id: 'UCmockkitchen000000000aa', snippet: { title: 'Mock Kitchen', thumbnails: { default: { url: 'https://yt3.ggpht.com/mock=s88' } } }, contentDetails: { relatedPlaylists: { uploads: 'UUmockkitchen000000000aa' } } }] });
      }
      if (path.endsWith('/playlistItems')) return send(res, 200, { items: ['RECIPEvid01', 'VLOGvid0001', 'CHAPTERS001'].map((v) => ({ contentDetails: { videoId: v } })) });
      if (path.endsWith('/videos') && (url.searchParams.get('part') || '').includes('contentDetails')) {
        const D = {
          RECIPEvid01: ['Crispy Honey Garlic Chicken', 'The crispiest chicken.\n\nFULL RECIPE: https://mockkitchen.example/recipes/honey-chicken\n\nIngredients\nFor the chicken:\n4 chicken thighs\n1 tsp salt\nFor the sauce:\n3 cloves garlic\n½ cup honey\n\nMethod\n1. Pat the chicken dry and salt it.\n2. Sear skin side down for 12 minutes.\n3. Pour over the honey garlic sauce.\n\n0:00 Intro\n0:45 Prep\n2:10 Searing\n4:30 Sauce\n7:05 Taste test\n\nInstagram https://instagram.com/mock', 'PT9M12S'],
          VLOGvid0001: ['Q&A: answering your questions', 'Thanks for 1M!', 'PT14M'],
          CHAPTERS001: ['Weeknight Carbonara', 'Quick pasta.\n\n00:00 Intro\n01:12 Boiling the pasta\n03:40 Making the sauce\n06:00 Plating\n07:30 Thanks for watching', 'PT8M']
        };
        return send(res, 200, { items: (url.searchParams.get('id') || '').split(',').filter((i) => D[i]).map((i) => ({ id: i, snippet: { title: D[i][0], description: D[i][1], publishedAt: '2026-09-30T12:00:00Z', thumbnails: { medium: { url: `https://i.ytimg.com/vi/${i}/mqdefault.jpg` } } }, contentDetails: { duration: D[i][2] } })) });
      }
      if (path.endsWith('/search')) {
        ytCalls.push(url.searchParams.get('q'));
        const q = url.searchParams.get('q').toLowerCase();
        if (q.startsWith('fli ')) return send(res, 200, { items: [{ id: { kind: 'youtube#video', videoId: 'UNRELATED01' } }] });   // nothing really about it
        return send(res, 200, { items: ['UNRELATED01', 'SMALLmatch1', 'BIGmatch001', 'bad id!'].map((v) => ({ id: { kind: 'youtube#video', videoId: v } })) });
      }
      if (path.endsWith('/videos')) {
        const dish = (ytCalls.at(-1) || '').replace(/ recipe$/, '');
        const all = { UNRELATED01: ['Top 10 funniest cats', 99000000], SMALLmatch1: [`${dish} the easy way`, 1200], BIGmatch001: [`How to make ${dish} | Grandma's recipe`, 2500000] };
        const ids = (url.searchParams.get('id') || '').split(',');
        return send(res, 200, { items: ids.filter((i) => all[i]).map((i) => ({ id: i, snippet: { title: all[i][0], channelTitle: 'Mock Kitchen' }, statistics: { viewCount: String(all[i][1]) } })) });
      }
    }
    if (path === '/__e2e/free-calls') return send(res, 200, { wiki: wikiCalls.length, youtube: ytCalls, anthropic: anthropicCalls });
    if (path === '/__e2e/seed-meals') {
      // n meals from one country, for the stamp test (only the 10th needs to come through the app)
      const c = url.searchParams.get('country'), n = Number(url.searchParams.get('n'));
      if (!/^[A-Z]{2}$/.test(c) || !(n > 0 && n < 20)) return send(res, 400, {});
      const cu = String(url.searchParams.get('cuisine') || 'Seed').slice(0, 40);   // optional: count toward a bingo box
      for (let k = 0; k < n; k++) await db.query(`insert into meals (user_id, title, cuisine, country, photo_path) values ($1, 'Seed', $4, $2, $3)`, [E2E_USER.id, c, `${E2E_USER.id}/seed${k}.jpg`, cu]);
      return send(res, 200, { ok: true });
    }
    if (path.startsWith('/rest/v1/rpc/')) return await rpc(res, uidFrom(req), path.slice('/rest/v1/rpc/'.length), json(), (req.headers.accept || '').includes('vnd.pgrst.object'));
    if (path.startsWith('/rest/v1/')) return await rest(req, res, uidFrom(req), path.slice('/rest/v1/'.length), url, json());
    if (path.startsWith('/storage/v1/')) return await storage(req, res, uidFrom(req), path, buf);
    return send(res, 404, { message: `mock: no route ${req.method} ${path}` });
  } catch (e) {
    const code = e.code || 'XX000';
    const status = e.status || (code === '42501' ? 403 : code === 'P0001' ? 400 : 400);
    if (!process.env.QUIET) console.error('mock error', req.method, path, code, e.message);
    return send(res, status, { code, message: e.message, details: e.detail || null, hint: e.hint || null });
  }
});
server.listen(PORT, () => console.log(`mock supabase on http://localhost:${PORT}`));
