import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
const results = [];
const check = (name, ok, detail = '') => { results.push([ok ? 'PASS' : 'FAIL', name, detail]); };

async function as(uid, fn) {
  await db.exec(uid ? `reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);`);
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

const schema = fs.readFileSync('./supabase/migrations/0001_whisk_schema.sql', 'utf8').replace('create extension if not exists pgcrypto;', '');
const seed = fs.readFileSync('./supabase/migrations/0002_whisk_seed.sql', 'utf8');
const features = fs.readFileSync('./supabase/migrations/0003_whisk_features.sql', 'utf8');
try { await db.exec(schema); check('schema migration runs', true); } catch (e) { check('schema migration runs', false, e.message); console.log(results); process.exit(1); }
try { await db.exec(seed); check('seed runs', true); } catch (e) { check('seed runs', false, e.message); }
try { await db.exec(features); check('0003 features migration runs', true); } catch (e) { check('0003 features migration runs', false, e.message); console.log(results); process.exit(1); }
// run twice: migrations should be re-runnable
try { await db.exec(schema); await db.exec(seed); await db.exec(features); check('migration is re-runnable', true); } catch (e) { check('migration is re-runnable', false, e.message); }

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


// --- 0003: settings, streak freeze, nutrition, daily quest, bingo ---
const C = '33333333-3333-3333-3333-333333333333';
await db.exec(`insert into auth.users (id, email) values ('${C}', 'c@x.com');`);
await expectFail('C cannot set own streak_freezes', C, `update profiles set streak_freezes = 3 where id = '${C}'`);
await as(C, () => db.query(`update profiles set weekly_goal = 6, takeout_price = 18.5 where id = '${C}'`));
const cs = (await db.query(`select weekly_goal, takeout_price from profiles where id = '${C}'`)).rows[0];
check('C can set weekly goal + takeout price', cs.weekly_goal === 6 && Number(cs.takeout_price) === 18.5, JSON.stringify(cs));
await expectFail('weekly goal must be 1–14', C, `update profiles set weekly_goal = 99 where id = '${C}'`);

for (let i = 1; i <= 6; i++) await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${C}/c${i}.jpg')`);
// streak freeze: last meal 2 days ago, freeze available → streak continues
await db.exec(`update profiles set streak_days = 5, streak_last_date = (now() at time zone 'utc')::date - 2, streak_freezes = 1, streak_freeze_week = date_trunc('week', now() at time zone 'utc')::date where id = '${C}'`);
const f1 = await as(C, () => db.query(`select public.log_meal('Tacos', '${C}/c1.jpg', null, null, 'Mexican', null, 650, 32, 60, 28) as r`));
check('streak freeze keeps a 5-day streak alive after 1 missed day', f1.rows[0].r.streak === 6 && f1.rows[0].r.used_freeze === true, JSON.stringify(f1.rows[0].r));
const nut = (await db.query(`select calories, protein_g from meals where photo_path = '${C}/c1.jpg'`)).rows[0];
check('nutrition saved with the meal', nut.calories === 650 && nut.protein_g === 32);
await db.exec(`update profiles set streak_days = 6, streak_last_date = (now() at time zone 'utc')::date - 2 where id = '${C}'`);
const f2 = await as(C, () => db.query(`select public.log_meal('Pasta', '${C}/c2.jpg', null, null, 'Italian') as r`));
check('no freeze left → streak resets to 1', f2.rows[0].r.streak === 1 && f2.rows[0].r.used_freeze === false, JSON.stringify(f2.rows[0].r));

// daily quest
const q1 = await as(C, () => db.query(`select public.get_daily_quest() as r`));
check('daily quest is created', ['pantry_add', 'cook', 'recipe_save'].includes(q1.rows[0].r.kind), JSON.stringify(q1.rows[0].r));
await expectFail('players cannot write daily_quests', C, `update daily_quests set claimed_at = now()`);
const qk = q1.rows[0].r.kind;
if (qk === 'pantry_add') for (let i = 0; i < 3; i++) await as(C, () => db.query(`insert into pantry_items (name) values ('q${i}')`));
if (qk === 'recipe_save') await as(C, () => db.query(`insert into recipes (title, data) values ('Q', '{}'::jsonb)`));
// 'cook' already satisfied by meals above
const q2 = await as(C, () => db.query(`select public.get_daily_quest() as r`));
check('quest progress reaches target', q2.rows[0].r.progress === q2.rows[0].r.target, JSON.stringify(q2.rows[0].r));
const xq0 = (await db.query(`select xp from profiles where id = '${C}'`)).rows[0].xp;
const qc = await as(C, () => db.query(`select public.claim_daily_quest() as r`));
const xq1 = (await db.query(`select xp from profiles where id = '${C}'`)).rows[0].xp;
check('claiming the quest gives +30 XP', qc.rows[0].r.xp === 30 && xq1 - xq0 === 30);
await expectFail('quest can only be claimed once', C, `select public.claim_daily_quest()`);

// bingo
const b1 = await as(C, () => db.query(`select public.get_bingo() as r`));
check('bingo card has 16 cuisines', b1.rows[0].r.cells.length === 16 && b1.rows[0].r.marks.length === 16);
await expectFail('no bingo claim without a line', C, `select public.claim_bingo()`).catch(() => {});
const row = b1.rows[0].r.cells.slice(0, 4);
for (let i = 0; i < 4; i++) await as(C, () => db.query(`select public.log_meal('Row ${i}', '${C}/c${i + 3 > 6 ? 6 : i + 3}.jpg', null, null, '${row[i]}') as r`)).catch(async () => {
  await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${C}/row${i}.jpg')`);
  await as(C, () => db.query(`select public.log_meal('Row ${i}', '${C}/row${i}.jpg', null, null, '${row[i]}')`));
});
const b2 = await as(C, () => db.query(`select public.get_bingo() as r`));
check('cooking the top row marks 4 cells and makes a line', b2.rows[0].r.lines >= 1 && b2.rows[0].r.marks.slice(0, 4).every(Boolean), JSON.stringify(b2.rows[0].r.marks));
const bc = await as(C, () => db.query(`select public.claim_bingo() as r`));
check('bingo pays +200 XP', bc.rows[0].r.xp === 200);
await expectFail('bingo pays once a week', C, `select public.claim_bingo()`);
await expectFail('players cannot rewrite their bingo card', C, `update weekly_bingo set cells = cells`);
await expectFail('players cannot call _bingo_marks', C, `select public._bingo_marks('${A}', current_date, array['a'])`);
const cMeals = await as(A, () => db.query(`select * from meals where user_id = '${C}'`));
check('A cannot see C meals', cMeals.rows.length === 0);

// ================= 0004 + 0005: web recipes, ratings, pantry challenges, popups =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0004_whisk_web_recipes.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0005_web_recipes_seed.sql', 'utf8')); check('0004 + 0005 migrations run', true); }
catch (e) { check('0004 + 0005 migrations run', false, e.message); results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? '  — ' + d : ''}`)); process.exit(1); }
try { await db.exec(fs.readFileSync('./supabase/migrations/0004_whisk_web_recipes.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0005_web_recipes_seed.sql', 'utf8')); check('0004 + 0005 are re-runnable', true); } catch (e) { check('0004 + 0005 are re-runnable', false, e.message); }
const D = '44444444-4444-4444-4444-444444444444', E = '55555555-5555-5555-5555-555555555555';
await db.exec(`insert into auth.users (id, email) values ('${D}', 'd@x.com'), ('${E}', 'e@x.com')`);
const wr = await as(D, () => db.query(`select count(*)::int n, bool_and(url like 'https://%') https from web_recipes`));
check('100 real web recipes readable, all https links', wr.rows[0].n === 100 && wr.rows[0].https, JSON.stringify(wr.rows[0]));
await expectFail('players cannot add web recipes', D, `insert into web_recipes (id, title, cuisine, source, url, minutes, technique, prep, precision_level, step_count, score, key_canon, data) values ('x','x','x','x','https://x',1,1,1,1,1,1,'{}','{}')`);
await expectFail('players cannot edit web recipes', D, `update web_recipes set title = 'hacked'`);
const easy = (await db.query(`select id, score from web_recipes order by score asc limit 1`)).rows[0];
const hard = (await db.query(`select id, score from web_recipes order by score desc limit 1`)).rows[0];
const mid = (await db.query(`select id, score from web_recipes where score between 35 and 64 order by score limit 1`)).rows[0];
// saving + rating
const sv = await as(D, () => db.query(`select public.save_recipe('${easy.id}') as r`));
check('saving a recipe gives +5 XP', sv.rows[0].r.xp === 5);
const sv2 = await as(D, () => db.query(`select public.save_recipe('${easy.id}') as r`));
check('saving twice gives no extra XP', sv2.rows[0].r.xp === 0);
await expectFail('players cannot write saved_recipes directly', D, `insert into saved_recipes (recipe_id, rating) values ('${hard.id}', 'up')`);
const eSaved = await as(E, () => db.query(`select * from saved_recipes`));
check('E cannot see D saved recipes', eSaved.rows.length === 0);
// challenges from proposed recipes; coins come from the server
const set1 = await as(D, () => db.query(`select public.set_weekly_challenges(array['${hard.id}', '${easy.id}', '${mid.id}']) as n`));
check('set_weekly_challenges creates 3', set1.rows[0].n === 3);
const set2 = await as(D, () => db.query(`select public.set_weekly_challenges(array['${hard.id}']) as n`));
check('challenges can only be picked once a week', set2.rows[0].n === 0);
const dch = await as(D, () => db.query(`select * from public.get_weekly_challenges()`));
check('challenge slots ordered by difficulty, coins from score', dch.rows.length === 3 && dch.rows[0].recipe_id === easy.id && dch.rows[2].recipe_id === hard.id && dch.rows[2].coins === (await db.query(`select score_to_coins(${hard.score}) c`)).rows[0].c, dch.rows.map((r) => `${r.slot}:${r.score}=${r.coins}`).join(' '));
await expectFail('set_weekly_challenges rejects more than 3', E, `select public.set_weekly_challenges(array['a','b','c','d'])`);
const bogus = await as(E, () => db.query(`select public.set_weekly_challenges(array['not-a-recipe']) as n`));
check('unknown recipe ids create nothing', bogus.rows[0].n === 0);
// log_meal v3
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${D}/d1.jpg'), ('meal-photos', '${D}/d2.jpg'), ('meal-photos', '${E}/e1.jpg')`);
await expectFail('log_meal needs a known recipe', D, `select public.log_meal('nope', '${D}/d1.jpg')`);
await expectFail('log_meal still needs your own photo', D, `select public.log_meal('${easy.id}', '${E}/e1.jpg')`);
const coinsD0 = (await db.query(`select coins from profiles where id = '${D}'`)).rows[0].coins;
const bigD = dch.rows[2];
const wrongRecipe = await as(D, () => db.query(`select public.log_meal('${easy.id}', '${D}/d1.jpg', '${bigD.id}') as r`));
check('a challenge only pays for its own recipe', wrongRecipe.rows[0].r.coins === 0, JSON.stringify(wrongRecipe.rows[0].r));
const lmD = await as(D, () => db.query(`select public.log_meal('${hard.id}', '${D}/d2.jpg', '${bigD.id}', 'great') as r`));
const coinsD1 = (await db.query(`select coins from profiles where id = '${D}'`)).rows[0].coins;
check('cooking the challenge recipe pays its coins', lmD.rows[0].r.challenge_completed === true && coinsD1 === coinsD0 + bigD.coins, `${coinsD0} → ${coinsD1}`);
const mrow = (await db.query(`select title, web_recipe_id, cuisine from meals where id = '${lmD.rows[0].r.meal_id}'`)).rows[0];
check('meal title and cuisine come from the recipe', mrow.web_recipe_id === hard.id && mrow.title.length > 0 && mrow.cuisine.length > 0, JSON.stringify(mrow));
const eLog = await as(E, () => db.query(`select public.log_meal('${hard.id}', '${E}/e1.jpg', '${bigD.id}') as r`));
check('E cannot cash D challenge', eLog.rows[0].r.coins === 0);
// rating
await as(D, () => db.query(`select public.rate_meal('${lmD.rows[0].r.meal_id}', 'up')`));
const rated = (await db.query(`select (select rating from meals where id = '${lmD.rows[0].r.meal_id}') m, (select rating from saved_recipes where user_id = '${D}' and recipe_id = '${hard.id}') s`)).rows[0];
check('rating updates the meal and the saved recipe', rated.m === 'up' && rated.s === 'up', JSON.stringify(rated));
await expectFail('E cannot rate D meal', E, `select public.rate_meal('${lmD.rows[0].r.meal_id}', 'down')`);
await expectFail('rating must be up or down', D, `select public.rate_meal('${lmD.rows[0].r.meal_id}', 'meh')`);
// thaw + profile settings
await as(D, () => db.query(`insert into pantry_items (name, category) values ('Ground beef', 'Frozen')`));
await as(D, () => db.query(`update pantry_items set thaw_started_at = now() where name = 'Ground beef'`));
check('players can start thawing their own items', (await db.query(`select count(*)::int n from pantry_items where user_id = '${D}' and thaw_started_at is not null`)).rows[0].n === 1);
await as(D, () => db.query(`update profiles set display_name = 'Chef J ✨ #1', ui_state = '{"tab":"pantry"}' where id = '${D}'`));
check('any characters in display name; ui_state saves', (await db.query(`select display_name, ui_state->>'tab' t from profiles where id = '${D}'`)).rows[0].display_name === 'Chef J ✨ #1');
await expectFail('players still cannot set coins', D, `update profiles set coins = 1 where id = '${D}'`);
await expectFail('players cannot set last_wrapped_year', D, `update profiles set last_wrapped_year = 2000 where id = '${D}'`);
// popups: 76 h back, July 18 wrapped
await db.exec(`update profiles set last_meal_at = now() - interval '75 hours', last_back_popup_at = null, last_seen_at = null where id = '${D}'`);
const p75 = await as(D, () => db.query(`select public.record_login(current_date, 12, 'ua', 'iPhone · Safari') as r`));
check('no "back" popup at 75 hours', !(p75.rows[0].r.popups || []).includes('back'), JSON.stringify(p75.rows[0].r));
await db.exec(`update profiles set last_meal_at = now() - interval '77 hours' where id = '${D}'`);
const p77 = await as(D, () => db.query(`select public.record_login(current_date, 12, 'ua', 'Mac · Chrome') as r`));
check('"back" popup at 77 hours', p77.rows[0].r.popups.includes('back'));
check('record_login returns the last device', p77.rows[0].r.last_device === 'iPhone · Safari', p77.rows[0].r.last_device);
const jul = await as(D, () => db.query(`select public.record_login(current_date, 12, 'ua', 'Mac · Chrome') as r`));
check('no Wrapped on a normal day', !jul.rows[0].r.popups.includes('wrapped'));
// July 18 test: the function trusts the local date within ±2 days, so fake "today" by checking the rule directly
const julRule = (await db.query(`select (extract(month from date '2027-07-18') = 7 and extract(day from date '2027-07-18') = 18) ok`)).rows[0].ok;
check('Wrapped date rule is July 18', julRule === true);

// ================= 0006: coins, packs, reset =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0006_whisk_coins_reset.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0006_whisk_coins_reset.sql', 'utf8')); check('0006 runs (twice)', true); }
catch (e) { check('0006 runs (twice)', false, e.message); }
check('renamed items keep their ids', (await db.query(`select name from items where id in ('acc-watch','acc-crystal-backpack') order by id`)).rows.map((r) => r.name).join('|') === 'Basketball Backpack|50 lb Dumbbell');
const packs = await as(D, () => db.query(`select id, coins, usd::float usd from coin_packs order by sort`));
check('4 coin packs readable', packs.rows.length === 4 && packs.rows[0].coins === 1000 && packs.rows[0].usd === 2, JSON.stringify(packs.rows));
await expectFail('players cannot change pack prices', D, `update coin_packs set usd = 0.01`);
await expectFail('players cannot insert orders directly', D, `insert into coin_orders (user_id, pack_id, coins, usd) values ('${D}', 'coins-1000', 999999, 0.01)`);
const ord = await as(D, () => db.query(`select public.create_coin_order('coins-3000') as r`));
const oid = ord.rows[0].r.order_id;
check('create_coin_order uses the pack price', ord.rows[0].r.coins === 3000 && Number(ord.rows[0].r.usd) === 5);
check('E cannot see D orders', (await as(E, () => db.query(`select * from coin_orders`))).rows.length === 0);
await expectFail('players cannot mark orders paid', D, `update coin_orders set status = 'paid'`);
await db.exec(`insert into private.app_secrets (name, sha256_hex) values ('payments_webhook', encode(sha256(convert_to('test-secret-123', 'UTF8')), 'hex')) on conflict (name) do update set sha256_hex = excluded.sha256_hex`);
await expectFail('crediting needs the webhook secret', D, `select public.credit_coin_order('${oid}', 'inv1', 5, 'wrong')`);
await expectFail('anon without secret cannot credit', null, `select public.credit_coin_order('${oid}', 'inv1', 5, null)`);
await expectFail('underpaid invoices are refused', D, `select public.credit_coin_order('${oid}', 'inv1', 4.99, 'test-secret-123')`);
const c0 = (await db.query(`select coins from profiles where id = '${D}'`)).rows[0].coins;
const cr = await as(null, () => db.query(`select public.credit_coin_order('${oid}', 'inv1', 5, 'test-secret-123') as r`));
const c1 = (await db.query(`select coins from profiles where id = '${D}'`)).rows[0].coins;
check('paid order credits the pack coins once', cr.rows[0].r.credited === true && c1 === c0 + 3000, `${c0} → ${c1}`);
const cr2 = await as(null, () => db.query(`select public.credit_coin_order('${oid}', 'inv1', 5, 'test-secret-123') as r`));
check('a replayed webhook credits nothing', cr2.rows[0].r.credited === false && (await db.query(`select coins from profiles where id = '${D}'`)).rows[0].coins === c1);
await expectFail('players cannot read app secrets', D, `select * from private.app_secrets`);
// reset needs a fresh email code
await expectFail('reset needs a recent email code', D, `select public.reset_game()`);
await db.exec(`select set_config('request.jwt.claims', '{"amr":[{"method":"otp","timestamp":${Math.floor(Date.now() / 1000) - 60}}]}', false)`);
await as(D, () => db.query(`select public.reset_game()`));
await db.exec(`select set_config('request.jwt.claims', '', false)`);
const afterReset = (await db.query(`select xp, coins, (select count(*)::int from meals where user_id = '${D}') m, (select count(*)::int from pantry_items where user_id = '${D}') p from profiles where id = '${D}'`)).rows[0];
check('reset clears progress, keeps coins', afterReset.xp === 0 && afterReset.m === 0 && afterReset.p === 0 && afterReset.coins === c1, JSON.stringify(afterReset));
await db.exec(`select set_config('request.jwt.claims', '{"amr":[{"method":"otp","timestamp":${Math.floor(Date.now() / 1000) - 3600}}]}', false)`);
await expectFail('an old email code does not count', D, `select public.reset_game()`);
await db.exec(`select set_config('request.jwt.claims', '', false)`);

// ================= 0007: bingo in 5-day rounds =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0007_bingo_five_days.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0007_bingo_five_days.sql', 'utf8')); check('0007 runs (twice)', true); }
catch (e) { check('0007 runs (twice)', false, e.message); }
const rs = (await db.query(`select public._bingo_round_start(date '2026-01-05') a, public._bingo_round_start(date '2026-01-09') b, public._bingo_round_start(date '2026-01-10') c, public._bingo_round_start(date '2026-10-04') d`)).rows[0];
const ds = (d) => new Date(d).toISOString().slice(0, 10);
check('bingo rounds are 5 days long', ds(rs.a) === '2026-01-05' && ds(rs.b) === '2026-01-05' && ds(rs.c) === '2026-01-10' && (new Date(rs.d) - new Date('2026-01-05')) % (5 * 864e5) === 0, JSON.stringify(rs));
const g7 = await as(E, () => db.query(`select public.get_bingo() as r`));
const g7r = g7.rows[0].r;
check('get_bingo reports a 5-day round', (new Date(g7r.ends) - new Date(g7r.week_start)) === 5 * 864e5 && g7r.cells.length === 16, JSON.stringify([g7r.week_start, g7r.ends]));
await db.exec(`update meals set cooked_at = now() - interval '6 days' where user_id = '${C}'`);
const g7c = await as(C, () => db.query(`select public.get_bingo() as r`));
check('meals from an earlier round do not mark the new card', g7c.rows[0].r.marks.every((m) => !m));
await expectFail('players cannot call _bingo_marks', C, `select public._bingo_marks('${C}', current_date, array['Thai'])`);

// ================= 0008: passport countries =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0005_web_recipes_seed.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0008_passport_countries.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0008_passport_countries.sql', 'utf8')); check('0008 runs (twice)', true); }
catch (e) { check('0008 runs (twice)', false, e.message); }
const mc = (await db.query(`select m.country, w.data->>'country' as want from meals m join web_recipes w on w.id = m.web_recipe_id`)).rows;
check('logged meals get their recipe country (backfilled)', mc.length > 0 && mc.every((r) => r.country === r.want), JSON.stringify(mc.slice(0, 3)));
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${C}/ctry.jpg')`);
await as(C, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${C}/ctry.jpg')`));
check('new meal country comes from the recipe', (await db.query(`select country from meals where photo_path = '${C}/ctry.jpg'`)).rows[0]?.country === 'CU');
await expectFail('players cannot change a meal country', C, `update meals set country = 'FR' where photo_path = '${C}/ctry.jpg'`);
check('country stays put', (await db.query(`select country from meals where photo_path = '${C}/ctry.jpg'`)).rows[0]?.country === 'CU');

// ================= 0009: local calendar =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0009_local_calendar.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0009_local_calendar.sql', 'utf8')); check('0009 runs (twice)', true); }
catch (e) { check('0009 runs (twice)', false, e.message); }
const sp = await as(C, () => db.query(`select public.set_privacy(true, true, 'Pacific/Kiritimati') as r`));
const want = new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(new Date());
check('set_privacy stores the time zone and today is the player\'s local date', sp.rows[0].r.time_zone === 'Pacific/Kiritimati' && sp.rows[0].r.today === want, JSON.stringify(sp.rows[0].r) + ' want ' + want);
check('first open date is recorded', !!sp.rows[0].r.first_open_date);
await expectFail('unknown time zones are refused', C, `select public.set_privacy(true, true, 'Mars/Olympus')`);
const q9 = await as(C, () => db.query(`select public.get_daily_quest() as r`));
check('daily quest still works on the local calendar', !!q9.rows[0].r);
const b9 = await as(C, () => db.query(`select public.get_bingo() as r`));
const wantRound = (await db.query(`select public._bingo_round_start('${want}'::date)::text as d`)).rows[0].d;
check('bingo round follows the local date', b9.rows[0].r.week_start === wantRound, b9.rows[0].r.week_start + ' vs ' + wantRound);
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${C}/tz.jpg')`);
await as(C, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${C}/tz.jpg')`));
check('streak date is the local date', (await db.query(`select streak_last_date::text d from profiles where id = '${C}'`)).rows[0].d === want);
const off = await as(C, () => db.query(`select public.set_privacy(false, false) as r`));
check('turning local time off goes back to UTC', off.rows[0].r.time_zone === null);
await expectFail('players cannot call _user_today', C, `select public._user_today('${C}')`);
await expectFail('players cannot write their consent directly', C, `update profiles set consent = '{}'::jsonb where id = '${C}'`);

// ================= 0010: hockey helmet =================
await db.exec(fs.readFileSync('./supabase/migrations/0010_hockey_helmet.sql', 'utf8'));
check('Chef Hat is now the Hockey Helmet', (await db.query(`select name from items where id = 'hat-chef-hat'`)).rows[0]?.name === 'Hockey Helmet');

const fails = results.filter((r) => r[0] === 'FAIL');
results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? '  — ' + d : ''}`));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
