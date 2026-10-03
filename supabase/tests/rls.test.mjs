import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const results = [];
const check = (name, ok, detail = '') => { results.push([ok ? 'PASS' : 'FAIL', name, detail]); };

async function as(uid, fn) {
  await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
async function expectFail(name, uid, sql) {
  try { await as(uid, () => db.query(sql)); check(name, false, 'should have failed'); }
  catch (e) { check(name, true, e.message.split('\n')[0]); }
}

// --- Supabase stand-ins ---
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth; create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
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

const schema = fs.readFileSync('./supabase/migrations/0001_whisk_schema.sql', 'utf8').replace('create extension if not exists pgcrypto;', '');
const seed = fs.readFileSync('./supabase/migrations/0002_whisk_seed.sql', 'utf8');
try { await db.exec(schema); check('schema migration runs', true); } catch (e) { check('schema migration runs', false, e.message); console.log(results); process.exit(1); }
try { await db.exec(seed); check('seed runs', true); } catch (e) { check('seed runs', false, e.message); }
// run twice: migrations should be re-runnable
try { await db.exec(schema); await db.exec(seed); check('migration is re-runnable', true); } catch (e) { check('migration is re-runnable', false, e.message); }

await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@x.com'), ('${B}', 'b@x.com');`);
const prof = await db.query(`select coins, xp from public.profiles where id = '${A}'`);
check('signup trigger creates profile with 1,500 welcome coins', prof.rows[0]?.coins === 1500);

// counts
const counts = await db.query(`select (select count(*) from items)::int as items, (select count(*) from challenge_meals)::int as meals`);
check('105 items and 26 meals seeded', counts.rows[0].items === 105 && counts.rows[0].meals === 26, JSON.stringify(counts.rows[0]));
const tiers = await db.query(`select count(*) filter (where score < 35)::int s, count(*) filter (where score between 35 and 64)::int m, count(*) filter (where score between 65 and 79)::int b65, count(*) filter (where score >= 80)::int b80 from challenge_meals_scored`);
check('every challenge tier has meals', Object.values(tiers.rows[0]).every((n) => n > 0), JSON.stringify(tiers.rows[0]));
const wellington = await db.query(`select score, coins from challenge_meals_scored where name = 'Beef Wellington'`);
check('SQL formula matches JS (Beef Wellington = 100 / 1000)', wellington.rows[0].score === 100 && wellington.rows[0].coins === 1000);
const oats = await db.query(`select score, coins from challenge_meals_scored where name = 'Overnight oats'`);
check('SQL formula matches JS (Overnight oats = 15 / 100)', oats.rows[0].score === 15 && oats.rows[0].coins === 100, JSON.stringify(oats.rows[0]));

// --- RLS: pantry ---
await as(A, () => db.query(`insert into pantry_items (name, category) values ('Eggs', 'Dairy & Eggs')`));
check('A can add to own pantry', true);
await expectFail('A cannot add a pantry item for B', A, `insert into pantry_items (user_id, name) values ('${B}', 'Sneaky')`);
const bSees = await as(B, () => db.query(`select * from pantry_items`));
check('B cannot see A pantry', bSees.rows.length === 0);
const bUpd = await as(B, () => db.query(`update pantry_items set name = 'hacked' returning id`));
check('B cannot update A pantry', bUpd.rows.length === 0);
const xpA = await db.query(`select xp from profiles where id = '${A}'`);
check('pantry add gives +5 XP', xpA.rows[0].xp === 5, String(xpA.rows[0].xp));
for (let i = 0; i < 25; i++) await as(A, () => db.query(`insert into pantry_items (name) values ('Item ${i}')`));
const xpCap = await db.query(`select xp from profiles where id = '${A}'`);
check('pantry XP capped at 20/day (100 XP)', xpCap.rows[0].xp === 100, String(xpCap.rows[0].xp));

// --- profiles: cannot mint coins/xp ---
await expectFail('A cannot set own coins', A, `update profiles set coins = 999999 where id = '${A}'`);
await expectFail('A cannot set own xp', A, `update profiles set xp = 999999 where id = '${A}'`);
await as(A, () => db.query(`update profiles set theme_pref = 'night' where id = '${A}'`));
const th = await db.query(`select theme_pref from profiles where id = '${A}'`);
check('A can change theme', th.rows[0].theme_pref === 'night');
const bProf = await as(B, () => db.query(`select * from profiles where id = '${A}'`));
check('B cannot read A profile', bProf.rows.length === 0);

// --- internal functions & locked tables ---
await expectFail('players cannot call _award_xp', A, `select public._award_xp('${A}', 'x', 1000, null)`);
await expectFail('players cannot insert into inventory', A, `insert into inventory (user_id, item_id) values ('${A}', 'hat-halo')`);
await expectFail('players cannot insert meals directly', A, `insert into meals (user_id, title, photo_path) values ('${A}', 'x', 'y')`);
await expectFail('players cannot complete challenges directly', A, `update weekly_challenges set completed_at = now()`);
try { await db.exec(`set role anon;`); await db.query(`select * from items`); check('signed-out (anon) cannot read items', false); } catch (e) { check('signed-out (anon) cannot read items', true, e.message.split('\n')[0]); } finally { await db.exec('reset role;'); }

// --- login popups ---
const r1 = await as(A, () => db.query(`select public.record_login(current_date, 14, 'test') as r`));
check('record_login counts a login', r1.rows[0].r.new_session === true);
const r2 = await as(A, () => db.query(`select public.record_login(current_date, 22, 'test') as r`));
check('late-night popup at 22:00', r2.rows[0].r.popup === 'late', JSON.stringify(r2.rows[0].r));
const r3 = await as(A, () => db.query(`select public.record_login(current_date, 23, 'test') as r`));
check('late-night popup only once per night', r3.rows[0].r.popup === null, JSON.stringify(r3.rows[0].r));
const r4 = await as(A, () => db.query(`select public.record_login(current_date, 10, 'test') as r`));
check('no popup at 10:00', r4.rows[0].r.popup === null);
await expectFail('record_login rejects bad hour', A, `select public.record_login(current_date, 30, 'x')`);
const lc = await db.query(`select login_count, first_login_at is not null as f from profiles where id = '${A}'`);
check('login_count = 1 (repeat opens within 30 min are one session)', lc.rows[0].login_count === 1 && lc.rows[0].f, JSON.stringify(lc.rows[0]));

// --- challenges + meal logging ---
const ch = await as(A, () => db.query(`select * from public.get_weekly_challenges()`));
check('3 weekly challenges created', ch.rows.length === 3, ch.rows.map((r) => `${r.slot}:${r.meal_name}=${r.coins}`).join(' | '));
const ch2 = await as(A, () => db.query(`select * from public.get_weekly_challenges()`));
check('same challenges on second look', ch2.rows.map((r) => r.id).join() === ch.rows.map((r) => r.id).join());
const big = ch.rows.find((r) => r.slot === 3);
check('slot 3 pays 800–1000', big.coins >= 800 && big.coins <= 1000, String(big.coins));

await expectFail('log_meal needs a real uploaded photo', A, `select public.log_meal('Toast', '${A}/missing.jpg')`);
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${B}/b.jpg'), ('meal-photos', '${A}/a.jpg'), ('meal-photos', '${A}/a2.jpg')`);
await expectFail('log_meal rejects someone else\'s photo', A, `select public.log_meal('Toast', '${B}/b.jpg')`);
const coinsBefore = (await db.query(`select coins, xp from profiles where id = '${A}'`)).rows[0];
const lm = await as(A, () => db.query(`select public.log_meal('${big.meal_name.replace(/'/g, "''")}', '${A}/a.jpg', null, '${big.id}', 'Italian', 'yum') as r`));
const after = (await db.query(`select coins, xp, last_meal_at is not null as m, streak_days from profiles where id = '${A}'`)).rows[0];
check('challenge meal pays its coins', after.coins === coinsBefore.coins + big.coins, `${coinsBefore.coins} → ${after.coins} (${JSON.stringify(lm.rows[0].r)})`);
check('meal gives XP (cook 50 + cuisine 40 + streak 10 + challenge 100)', lm.rows[0].r.xp === 200, JSON.stringify(lm.rows[0].r));
check('streak starts at 1', after.streak_days === 1 && after.m);
const again = await as(A, () => db.query(`select public.log_meal('Again', '${A}/a2.jpg', null, '${big.id}', 'Italian') as r`));
check('a challenge pays only once', again.rows[0].r.coins === 0, JSON.stringify(again.rows[0].r));
check('same cuisine does not re-award the stamp', again.rows[0].r.xp === 50, JSON.stringify(again.rows[0].r));
const steal = await as(B, () => db.query(`select public.log_meal('x', '${B}/b.jpg', null, '${big.id}') as r`));
check('B logging with A challenge id earns no coins', steal.rows[0].r.coins === 0 && steal.rows[0].r.challenge_completed === false, JSON.stringify(steal.rows[0].r));
const bCh = (await db.query(`select coins from profiles where id = '${B}'`)).rows[0].coins;
check('B coins unchanged by A challenge', bCh === 1500);

// --- shop ---
await expectFail('cannot buy what you cannot afford (mythic)', B, `select public.buy_item('hat-halo')`);
const buy = await as(B, () => db.query(`select public.buy_item('top-polo-shirt') as r`));
check('B buys a common with welcome coins', buy.rows[0].r.coins === 0, JSON.stringify(buy.rows[0].r));
await expectFail('cannot buy the same item twice', B, `select public.buy_item('top-polo-shirt')`);
await as(B, () => db.query(`select public.equip_item('top', 'top-polo-shirt')`));
const lo = await as(B, () => db.query(`select top_id from loadouts`));
check('equip owned item', lo.rows[0]?.top_id === 'top-polo-shirt');
await expectFail('cannot equip an unowned item', B, `select public.equip_item('hat', 'hat-halo')`);
await expectFail('cannot equip into the wrong slot', B, `select public.equip_item('hat', 'top-polo-shirt')`);
await expectFail('bad slot name rejected', B, `select public.equip_item('top_id; drop table items; --', null)`);
const loA = await as(A, () => db.query(`select * from loadouts`));
check('A sees only own loadout', loA.rows.length === 1 && loA.rows[0].user_id === A);

// --- storage policies ---
await expectFail('A cannot upload into B folder', A, `insert into storage.objects (bucket_id, name) values ('meal-photos', '${B}/evil.jpg')`);
const aObjs = await as(A, () => db.query(`select name from storage.objects`));
check('A only lists own photos', aObjs.rows.every((r) => r.name.startsWith(A)), aObjs.rows.map((r) => r.name).join(','));

const fails = results.filter((r) => r[0] === 'FAIL');
results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? '  — ' + d : ''}`));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
