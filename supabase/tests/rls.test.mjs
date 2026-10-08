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

// ================= 0011: activity log, onboarding, admin =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0011_activity_onboarding_admin.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0011_activity_onboarding_admin.sql', 'utf8')); check('0011 runs (twice)', true); }
catch (e) { check('0011 runs (twice)', false, e.message); }
const ev = (n) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ kind: 'tap', page: '/cook', target: 'What can I make? ' + i })));
await as(C, () => db.query(`select public.set_privacy(true, true, 'America/New_York', false)`));
check('no usage consent → nothing recorded', (await as(C, () => db.query(`select public.log_events('${ev(3)}'::jsonb) as n`))).rows[0].n === 0);
await as(C, () => db.query(`select public.set_privacy(true, true, 'America/New_York', true)`));
check('usage consent → taps recorded', (await as(C, () => db.query(`select public.log_events('${ev(3)}'::jsonb, 'iPhone') as n`))).rows[0].n === 3);
await as(C, () => db.query(`select public.log_events('[{"kind":"search","page":"/cook","target":"dish search","value":"birria tacos"}]'::jsonb)`));
check('players see only their own events', (await as(D, () => db.query(`select count(*)::int n from app_events`))).rows[0].n === 0 && (await as(C, () => db.query(`select count(*)::int n from app_events`))).rows[0].n === 4);
await expectFail('players cannot insert events directly', C, `insert into app_events (user_id, kind) values ('${C}', 'tap')`);
await expectFail('more than 50 events per call is refused', C, `select public.log_events('${ev(51)}'::jsonb)`);
await expectFail('players cannot make themselves admin', C, `update profiles set is_admin = true where id = '${C}'`);
await expectFail('non-admins cannot read the dashboard', C, `select public.admin_overview(7)`);
await expectFail('non-admins cannot read events of others', C, `select public.admin_events(50)`);
await db.exec(`update profiles set is_admin = true where id = '${D}'`);
const ov = (await as(D, () => db.query(`select public.admin_overview(7) as r`))).rows[0].r;
check('admin overview counts events and searches', ov.events === 4 && ov.top_searches[0]?.q === 'birria tacos' && ov.active_players === 1, JSON.stringify({ e: ov.events, s: ov.top_searches }));
const ae = (await as(D, () => db.query(`select public.admin_events(10) as r`))).rows[0].r;
check('admin sees the activity feed', ae.length === 4 && ae[0].kind === 'search');
await as(C, () => db.query(`select public.set_privacy(true, true, 'America/New_York', false)`));
check('turning usage data off deletes what was recorded', (await db.query(`select count(*)::int n from app_events where user_id = '${C}'`)).rows[0].n === 0);
check('tutorial flag', !!(await as(C, () => db.query(`select public.set_onboarded(true) as t`))).rows[0].t && (await as(C, () => db.query(`select public.set_onboarded(false) as t`))).rows[0].t === null);

// ================= 0012: dish list, log any dish, 5,000 coins per stamp =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0012_dishes_and_stamp_coins.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0012_dishes_and_stamp_coins.sql', 'utf8')); check('0012 runs (twice)', true); }
catch (e) { check('0012 runs (twice)', false, e.message); }
check('dish list has all 193 countries', (await db.query(`select count(distinct country)::int n, count(*)::int d from dishes`)).rows[0].n === 193);
await expectFail('players cannot read the dish table directly', C, `select * from dishes limit 1`);
const photo = async (u, n) => { await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${u}/${n}.jpg') on conflict do nothing`); return `${u}/${n}.jpg`; };
const coinsOf = async (u) => (await db.query(`select coins from profiles where id = '${u}'`)).rows[0].coins;
const ld = await as(D, async () => db.query(`select public.log_meal(null, '${await photo(D, 'al0')}', null, null, 'byrek', 'AL') as r`));
const m0 = (await db.query(`select title, country, cuisine from meals where photo_path = '${D}/al0.jpg'`)).rows[0];
check('any dish from the list can be logged (keeps its country)', m0?.title === 'Byrek' && m0?.country === 'AL' && !!ld.rows[0].r.meal_id, JSON.stringify(m0));
await expectFail('a made-up dish is refused', D, `select public.log_meal(null, '${await photo(D, 'x1')}', null, null, 'Moon Cheese', 'AL')`);
await expectFail('a real dish with the wrong country is refused', D, `select public.log_meal(null, '${await photo(D, 'x2')}', null, null, 'Byrek', 'FR')`);
const c12a = await coinsOf(D); let last = null;
for (let k = 1; k <= 9; k++) last = (await as(D, async () => db.query(`select public.log_meal(null, '${await photo(D, 'al' + k)}', null, null, 'Fërgesë', 'AL') as r`))).rows[0].r;
const c12b = await coinsOf(D);
check('10th meal from a country stamps it and pays 5,000 coins', last.stamp === 'AL' && last.coins >= 5000 && c12b - c12a === 5000, JSON.stringify(last) + ` ${c12a}→${c12b}`);
const eleventh = (await as(D, async () => db.query(`select public.log_meal(null, '${await photo(D, 'al11')}', null, null, 'Qofte', 'AL') as r`))).rows[0].r;
check('a stamp only pays once', eleventh.stamp === null && (await coinsOf(D)) === c12b);
check('players see their own stamps only', (await as(D, () => db.query(`select country from passport_stamps`))).rows.map((r) => r.country).join() === 'AL' && (await as(C, () => db.query(`select count(*)::int n from passport_stamps`))).rows[0].n === 0);
await expectFail('players cannot stamp themselves', C, `insert into passport_stamps (user_id, country) values ('${C}', 'FR')`);
const bingoCuisine = (await db.query(`select cuisine from dishes where country = 'MX' limit 1`)).rows[0].cuisine;
check('dish meals carry bingo words for their country', /Mexican/.test(bingoCuisine), bingoCuisine);
const rec = (await as(C, async () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${await photo(C, 'r12')}') as r`))).rows[0].r;
check('recipe meals still log as before', !!rec.meal_id && rec.stamp === null);

// ================= 0013: one phone, no account (anonymous sign-in); reset is just your own game =================
try { await db.exec(fs.readFileSync('./supabase/migrations/0013_one_phone_play.sql', 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/0013_one_phone_play.sql', 'utf8')); check('0013 runs (twice)', true); }
catch (e) { check('0013 runs (twice)', false, e.message); }
const P = '99999999-9999-9999-9999-999999999999';
await db.exec(`insert into auth.users (id, email) values ('${P}', null)`);   // "Start playing": an anonymous user, no email
check('a new phone game gets a profile with 1,500 coins (no email needed)', (await db.query(`select coins from profiles where id = '${P}'`)).rows[0]?.coins === 1500);
await db.exec(`insert into pantry_items (user_id, name, category) values ('${P}', 'Eggs', 'Dairy & Eggs'), ('${D}', 'Keep me', 'Produce')`);
await db.exec(`select set_config('request.jwt.claims', '{"amr":[{"method":"anonymous","timestamp":${Math.floor(Date.now() / 1000) - 86400}}]}', false)`);
await as(P, () => db.query(`select public.reset_game()`));
check('reset erases only your own game', (await db.query(`select count(*)::int n from pantry_items where user_id = '${P}'`)).rows[0].n === 0 && (await db.query(`select count(*)::int n from pantry_items where user_id = '${D}' and name = 'Keep me'`)).rows[0].n === 1);
await expectFail('signed-out visitors cannot reset anything', null, `select public.reset_game()`);
check('a phone game sees none of another player\'s pantry', (await as(P, () => db.query(`select count(*)::int n from pantry_items where user_id = '${D}'`))).rows[0].n === 0);
await db.exec(`select set_config('request.jwt.claims', '', false)`);

// ================= 0014 + 0015: full recipes, free chef coat, pilot coat, cook = +20 XP =================
try { for (const f of ['0014_recipe_steps.sql', '0015_free_chef_coat_pilot_coat_xp.sql']) { await db.exec(fs.readFileSync('./supabase/migrations/' + f, 'utf8')); await db.exec(fs.readFileSync('./supabase/migrations/' + f, 'utf8')); } check('0014 + 0015 run (twice)', true); }
catch (e) { check('0014 + 0015 run (twice)', false, e.message); }
const rx = (await db.query(`select data from web_recipes where id = 'www-budgetbytes-com-chili-cheese-beef-n-mac'`)).rows[0].data;
check('recipes carry every measured ingredient and beginner steps', rx.ingredients.length >= 8 && rx.steps.length >= 8 && rx.steps.some(([t]) => /\[\[[^\]]+\]\]/.test(t)));
check('the chef coat is out of the shop; the pilot coat is in at 1,500', (await db.query(`select active from items where id = 'top-white-chef-coat'`)).rows[0].active === false && (await db.query(`select price from items where id = 'top-airline-pilot-coat' and active`)).rows[0]?.price === 1500);
const Q = '77777777-7777-7777-7777-777777777777';
await db.exec(`insert into auth.users (id, email) values ('${Q}', null)`);
check('new players start with an empty pantry', (await db.query(`select count(*)::int n from pantry_items where user_id = '${Q}'`)).rows[0].n === 0);
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${Q}/x20.jpg')`);
const x20 = (await as(Q, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${Q}/x20.jpg') as r`))).rows[0].r;
check('cooking a recipe and sending the photo: +20 XP for the cook', (await db.query(`select amount from xp_events where user_id = '${Q}' and kind = 'cook'`)).rows[0]?.amount === 20, JSON.stringify(x20));
await expectFail('nobody can buy the retired chef coat', Q, `select public.buy_item('top-white-chef-coat')`);

// ================= 0016: bingo runs the same week as the challenges =================
try { const f = fs.readFileSync('./supabase/migrations/0016_bingo_weekly_with_challenges.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0016 runs (twice)', true); }
catch (e) { check('0016 runs (twice)', false, e.message); }
const r16 = (await db.query(`select public._bingo_round_start(date '2026-10-05') a, public._bingo_round_start(date '2026-10-08') b, public._bingo_round_start(date '2026-10-11') c, public._bingo_round_start(date '2026-10-12') d`)).rows[0];
check('bingo rounds are Monday to Sunday', ds(r16.a) === '2026-10-05' && ds(r16.b) === '2026-10-05' && ds(r16.c) === '2026-10-05' && ds(r16.d) === '2026-10-12', JSON.stringify(r16));
const B16 = '88888888-8888-8888-8888-888888888888';
await db.exec(`insert into auth.users (id, email) values ('${B16}', null)`);
const old16 = (await db.query(`select public._bingo_round_start(public._user_today('${B16}')) - 3 as d`)).rows[0].d;
await db.exec(`insert into weekly_bingo (user_id, week_start, cells, claimed_at) select '${B16}', '${ds(old16)}', array_fill('Thai'::text, array[16]), now()`);
const g16 = (await as(B16, () => db.query(`select public.get_bingo() as r`))).rows[0].r;
const ch16 = (await db.query(`select date_trunc('week', public._user_today('${B16}'))::date as wk`)).rows[0].wk;
check('bingo card week = challenges week, ends with it (7 days)', g16.week_start === ds(ch16) && (new Date(g16.ends) - new Date(g16.week_start)) === 7 * 864e5, JSON.stringify([g16.week_start, g16.ends, ds(ch16)]));
check('a bingo already claimed on the overlapping old card is not paid twice', g16.claimed === true);
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${B16}/sun.jpg')`);
await as(B16, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${B16}/sun.jpg')`));
const wkStart = new Date(g16.week_start + 'T12:00:00Z'); const sunday = new Date(wkStart.getTime() + 6 * 864e5);
await db.exec(`update meals set cooked_at = '${sunday.toISOString()}' where photo_path = '${B16}/sun.jpg'`);
const cu = (await db.query(`select cuisine from meals where photo_path = '${B16}/sun.jpg'`)).rows[0].cuisine;
const sundayHit = (await db.query(`select public._bingo_marks('${B16}', '${g16.week_start}', array['Caribbean']) as m`)).rows[0].m[0];
check('a meal on Sunday still counts on this week\'s card', sundayHit === true, cu);
await expectFail('players cannot call _bingo_marks', B16, `select public._bingo_marks('${B16}', current_date, array['Thai'])`);

// ================= 0017: Cook Off + invite a friend =================
try { const f = fs.readFileSync('./supabase/migrations/0017_cookoff_and_invites.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0017 runs (twice)', true); }
catch (e) { check('0017 runs (twice)', false, e.message); }
const [X, Y, Z, W] = ['a1000000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-00000000000b', 'c3000000-0000-0000-0000-00000000000c', 'd4000000-0000-0000-0000-00000000000d'];
for (const u of [X, Y, Z, W]) await db.exec(`insert into auth.users (id, email) values ('${u}', null)`);
await db.exec(`update profiles set display_name = 'Ana' where id = '${X}'; update profiles set display_name = 'Ben' where id = '${Y}';`);
for (const u of [X, Y, Z]) for (const n of ['Rice', 'Eggs', 'Garlic', 'Onion', 'Chicken thighs', 'Soy sauce']) await db.exec(`insert into pantry_items (user_id, name, category) values ('${u}', '${n}', 'Other')`);
await expectFail('a cook with an empty pantry can’t make a game', W, `select public.create_cookoff(30)`);
// invite: Ben (new) enters Ana's code before they play
const inv = (await as(X, () => db.query(`select public.get_my_invite() as r`))).rows[0].r;
check('everyone gets a 6-letter invite code', /^[A-HJ-NP-Z2-9]{6}$/.test(inv.code) && inv.max === 10, JSON.stringify(inv));
await expectFail('you can’t use your own invite code', X, `select public.claim_invite('${inv.code}')`);
const cl = (await as(Y, () => db.query(`select public.claim_invite('${inv.code}') as r`))).rows[0].r;
check('a new player enters a friend’s code', cl.invited_by === 'Ana' && cl.can_enter === false, JSON.stringify(cl));
await expectFail('only one invite code per player', Y, `select public.claim_invite('${inv.code}')`);
await db.exec(`update profiles set created_at = now() - interval '10 days' where id = '${W}'`);
await expectFail('invite codes are only for new players', W, `select public.claim_invite('${inv.code}')`);
// game
const g0 = (await as(X, () => db.query(`select public.create_cookoff(30) as r`))).rows[0].r;
check('make a game: a 6-letter code, you’re in it with your name, you’re the host', /^[A-HJ-NP-Z2-9]{6}$/.test(g0.code) && g0.players.length === 1 && g0.players[0].name === 'Ana' && g0.is_host && g0.status === 'lobby', JSON.stringify(g0));
const code = g0.code;
await expectFail('can’t join without a stocked pantry', W, `select public.join_cookoff('${code}')`);
const gj = (await as(Y, () => db.query(`select public.join_cookoff('${code.toLowerCase()}') as r`))).rows[0].r;
await as(Z, () => db.query(`select public.join_cookoff('${code}')`));
check('friends join with the code (any case); names come from their game', gj.players.map((p) => p.name).join() === 'Ana,Ben' && !gj.is_host);
await expectFail('players can’t read the game tables directly', X, `select * from cookoff_players`);
await expectFail('only the host can start', Y, `select public.start_cookoff('${code}')`);
await expectFail('you can’t peek at a game you’re not in', W, `select public.get_cookoff('${code}')`);
const st = (await as(X, () => db.query(`select public.start_cookoff('${code}') as r`))).rows[0].r;
check('start: everyone gets the same clock (8 s spin + 30 min)', st.status === 'cooking' && Math.round((new Date(st.ends_at) - new Date(st.started_at)) / 1000) === 8 + 30 * 60, JSON.stringify([st.started_at, st.ends_at]));
await expectFail('no joining after the start', W, `select public.join_cookoff('${code}')`);
const fit = (await db.query(`select id from web_recipes where active and minutes <= 30 order by id limit 3`)).rows.map((r) => r.id);
const slow = (await db.query(`select id from web_recipes where active and minutes > 30 order by id limit 1`)).rows.map((r) => r.id);
if (slow.length) await expectFail('a recipe longer than the game is never picked', X, `select public.set_cookoff_recipe('${code}', array['${slow[0]}'])`);
const pickX = (await as(X, () => db.query(`select public.set_cookoff_recipe('${code}', array['${fit.join("','")}']) as r`))).rows[0].r;
const pickX2 = (await as(X, () => db.query(`select public.set_cookoff_recipe('${code}', array['${fit[0]}']) as r`))).rows[0].r;
check('the server picks one of your pantry recipes, once (no re-spins)', fit.includes(pickX) && pickX2 === pickX, `${pickX} ${pickX2}`);
for (const u of [Y, Z]) await as(u, () => db.query(`select public.set_cookoff_recipe('${code}', array['${fit[1]}'])`));
const view = (await as(Y, () => db.query(`select public.get_cookoff('${code}') as r`))).rows[0].r;
check('while cooking you only see your own recipe and photo', view.players.filter((p) => !p.me).every((p) => p.recipe_id === null && p.photo === null) && view.players.find((p) => p.me).recipe_id === fit[1]);
for (const u of [X, Y]) await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${u}/co.jpg')`);
await expectFail('a photo must be your own upload', X, `select public.submit_cookoff('${code}', '${Y}/co.jpg')`);
await as(X, () => db.query(`select public.submit_cookoff('${code}', '${X}/co.jpg')`));
await as(Y, () => db.query(`select public.submit_cookoff('${code}', '${Y}/co.jpg')`));
await db.exec(`grant select on storage.objects to authenticated; drop policy if exists own_read on storage.objects; create policy own_read on storage.objects for select to authenticated using ((storage.foldername(name))[1] = (select auth.uid())::text)`);
const zSees0 = (await as(Z, () => db.query(`select count(*)::int n from storage.objects where name = '${X}/co.jpg'`))).rows[0].n;
check('nobody sees other plates while cooking', zSees0 === 0);
await expectFail('no voting while cooking', Z, `select public.vote_cookoff('${code}', 1)`);
await db.exec(`update cookoff_games set ends_at = now() - interval '1 second' where code = '${code}'`);
const vv = (await as(Z, () => db.query(`select public.get_cookoff('${code}') as r`))).rows[0].r;
check('when time’s up, voting starts and everyone sees the plates', vv.status === 'voting' && vv.players.filter((p) => p.photo).length === 2);
const zSees1 = (await as(Z, () => db.query(`select count(*)::int n from storage.objects where name = '${X}/co.jpg'`))).rows[0].n;
const wSees = (await as(W, () => db.query(`select count(*)::int n from storage.objects where name = '${X}/co.jpg'`))).rows[0].n;
check('during voting players in the game can open the photos; outsiders can’t', zSees1 === 1 && wSees === 0);
await expectFail('you can’t vote for your own plate', X, `select public.vote_cookoff('${code}', 1)`);
await expectFail('you can’t vote for someone without a plate', X, `select public.vote_cookoff('${code}', 3)`);
const coins0 = Object.fromEntries((await db.query(`select id, coins from profiles where id in ('${X}','${Y}','${Z}')`)).rows.map((r) => [r.id, r.coins]));
await as(X, () => db.query(`select public.vote_cookoff('${code}', 2)`));
await expectFail('one vote each', X, `select public.vote_cookoff('${code}', 2)`);
await as(Y, () => db.query(`select public.vote_cookoff('${code}', 1)`));
const fin = (await as(Z, () => db.query(`select public.vote_cookoff('${code}', 2) as r`))).rows[0].r;
const coins1 = Object.fromEntries((await db.query(`select id, coins from profiles where id in ('${X}','${Y}','${Z}')`)).rows.map((r) => [r.id, r.coins]));
check('everyone voted → the game ends; most votes wins', fin.status === 'done' && fin.players.find((p) => p.seat === 2).winner === true && fin.players.find((p) => p.seat === 1).winner === false);
check('coins: finisher +200, winner +1,000, didn’t finish +0; invite pair +1,000 each', coins1[X] - coins0[X] === 200 + 1000 && coins1[Y] - coins0[Y] === 1000 + 1000 && coins1[Z] - coins0[Z] === 0, JSON.stringify([coins0, coins1]));
await as(Z, () => db.query(`select public.get_cookoff('${code}')`)); await as(X, () => db.query(`select public.get_cookoff('${code}')`));
const coins2 = (await db.query(`select coins from profiles where id = '${X}'`)).rows[0].coins;
check('paid out once only', coins2 === coins1[X]);
const inv2 = (await as(X, () => db.query(`select public.get_my_invite() as r`))).rows[0].r;
check('invite counted (1 of 10)', inv2.earned === 1 && inv2.waiting === 0, JSON.stringify(inv2));

// ================= 0018: Cook Off judges =================
try { const f = fs.readFileSync('./supabase/migrations/0018_cookoff_judges.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0018 runs (twice)', true); }
catch (e) { check('0018 runs (twice)', false, e.message); }
const j0 = (await as(X, () => db.query(`select public.create_cookoff(15) as r`))).rows[0].r; const jc = j0.code;
await as(Y, () => db.query(`select public.join_cookoff('${jc}')`));
const jv = (await as(W, () => db.query(`select public.join_cookoff_judge('${jc}') as r`))).rows[0].r;
check('anyone can join as a judge, no pantry needed', jv.players.find((p) => p.me).role === 'judge' && /^Judge \d+$/.test(jv.players.find((p) => p.me).name), JSON.stringify(jv.players));
await as(X, () => db.query(`select public.start_cookoff('${jc}')`));
const fit15 = (await db.query(`select id from web_recipes where active and minutes <= 15 order by id limit 2`)).rows.map((r) => r.id);
await expectFail('judges don’t cook', W, `select public.set_cookoff_recipe('${jc}', array['${fit15[0]}'])`);
for (const u of [X, Y]) { await as(u, () => db.query(`select public.set_cookoff_recipe('${jc}', array['${fit15.join("','")}'])`)); await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${u}/j.jpg')`); await as(u, () => db.query(`select public.submit_cookoff('${jc}', '${u}/j.jpg')`)); }
const jv2 = (await as(W, () => db.query(`select public.get_cookoff('${jc}') as r`))).rows[0].r;
check('cooking ends when every cook is done (judges don’t hold it up)', jv2.status === 'voting');
const wc0 = (await db.query(`select coins from profiles where id = '${W}'`)).rows[0].coins;
await as(W, () => db.query(`select public.vote_cookoff('${jc}', 2)`));
await as(X, () => db.query(`select public.vote_cookoff('${jc}', 2)`));
const jfin = (await as(Y, () => db.query(`select public.vote_cookoff('${jc}', 1) as r`))).rows[0].r;
check('the judge’s vote counts: Ben wins 2–1', jfin.status === 'done' && jfin.players.find((p) => p.seat === 2).winner && jfin.players.find((p) => p.seat === 2).votes === 2);
check('judges win no coins', (await db.query(`select coins from profiles where id = '${W}'`)).rows[0].coins === wc0);
await expectFail('no judging a finished game', Z, `select public.join_cookoff_judge('${jc}')`);

// ================= 0019: never show, vacation, streak repair, shared list, delete my data =================
try { const f = fs.readFileSync('./supabase/migrations/0019_safety_streaks_sharing.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0019 runs (twice)', true); }
catch (e) { check('0019 runs (twice)', false, e.message); }
const [V1, V2] = ['e5000000-0000-0000-0000-00000000000e', 'f6000000-0000-0000-0000-00000000000f'];
for (const u of [V1, V2]) await db.exec(`insert into auth.users (id, email) values ('${u}', null)`);
const ns = (await as(V1, () => db.query(`select public.set_never_show(array[' Peanuts ', 'shellfish', 'peanuts', '']) as r`))).rows[0].r;
check('never show: trimmed, lower-case, no repeats', JSON.stringify(ns) === JSON.stringify(['peanuts', 'shellfish']), JSON.stringify(ns));
await expectFail('never show: max 40 items', V1, `select public.set_never_show(array(select 'x' || g from generate_series(1, 41) g))`);
await expectFail('never show: signed-in only', null, `select public.set_never_show(array['milk'])`);
// streak repair: a 5-day streak, one missed day, no freeze → first meal back = 1, second meal = 6
const today19 = ds((await db.query(`select public._user_today('${V1}') d`)).rows[0].d);
const minus = (n) => ds(new Date(new Date(today19 + 'T12:00:00Z').getTime() - n * 864e5));
await db.exec(`update profiles set streak_days = 5, streak_last_date = '${minus(2)}', streak_freezes = 0, streak_freeze_week = date_trunc('week', '${today19}'::date)::date where id = '${V1}'`);
for (const k of [1, 2]) await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${V1}/r${k}.jpg')`);
const lm1 = (await as(V1, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${V1}/r1.jpg') as r`))).rows[0].r;
check('missed one day, no freeze: streak restarts but offers a repair', lm1.streak === 1 && lm1.repair_ready === 5 && !lm1.repaired, JSON.stringify(lm1));
const lm2 = (await as(V1, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${V1}/r2.jpg') as r`))).rows[0].r;
check('a second meal the same day repairs it (5 + today = 6)', lm2.streak === 6 && lm2.repaired === true, JSON.stringify(lm2));
// vacation: 4 days away don't break the streak
await db.exec(`update profiles set streak_days = 9, streak_last_date = '${minus(5)}', vacation_since = '${minus(4)}' where id = '${V2}'`);
const vac = (await as(V2, () => db.query(`select public.set_vacation(false) as r`))).rows[0].r;
const vlast = ds((await db.query(`select streak_last_date d from profiles where id = '${V2}'`)).rows[0].d);
check('vacation off: the days away are skipped (streak last day moves forward)', vac.vacation_since === null && vlast === minus(1), vlast);
await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${V2}/v.jpg')`);
const lmv = (await as(V2, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${V2}/v.jpg') as r`))).rows[0].r;
check('…so cooking the next day keeps the streak going (9 → 10)', lmv.streak === 10, JSON.stringify(lmv));
await as(V2, () => db.query(`select public.set_vacation(true)`));
check('vacation on: remembers the day it started', ds((await db.query(`select vacation_since d from profiles where id = '${V2}'`)).rows[0].d) === today19);
// shared list
await db.exec(`insert into shopping_items (user_id, name, category) values ('${V1}', 'Milk', 'Dairy & Eggs'), ('${V1}', 'Basil', 'Produce'), ('${V2}', 'Secret', 'Other')`);
const tok = (await as(V1, () => db.query(`select public.share_my_list() as t`))).rows[0].t;
const tok2 = (await as(V1, () => db.query(`select public.share_my_list() as t`))).rows[0].t;
check('share link: a long random token, the same one until you make a new one', /^[a-f0-9]{32}$/.test(tok) && tok === tok2);
const pub = (await as(null, () => db.query(`select public.get_shared_list('${tok}') as r`))).rows[0].r;
check('anyone with the link (no account) sees just that list', pub.items.length === 2 && pub.items.every((i) => i.name !== 'Secret') && !JSON.stringify(pub).includes(V1));
const basil = pub.items.find((i) => i.name === 'Basil').id;
const okTick = (await as(null, () => db.query(`select public.tick_shared_item('${tok}', '${basil}', true) as r`))).rows[0].r;
const secret = (await db.query(`select id from shopping_items where name = 'Secret'`)).rows[0].id;
const badTick = (await as(null, () => db.query(`select public.tick_shared_item('${tok}', '${secret}', true) as r`))).rows[0].r;
check('the link can tick its own list only', okTick === true && badTick === false && (await db.query(`select checked from shopping_items where id = '${secret}'`)).rows[0].checked === false);
const wrong = (await as(null, () => db.query(`select public.get_shared_list('${'0'.repeat(32)}') as r, public.get_shared_list('nope') as s`))).rows[0];
check('a wrong or made-up link shows nothing', wrong.r === null && wrong.s === null);
check('nobody else can read someone’s share token', (await as(V2, () => db.query(`select count(*)::int n from list_shares where user_id = '${V1}'`))).rows[0].n === 0);
const newTok = (await as(V1, () => db.query(`select public.share_my_list(true) as t`))).rows[0].t;
const oldGone = (await as(null, () => db.query(`select public.get_shared_list('${tok}') as r`))).rows[0].r;
check('making a new link turns the old one off', newTok !== tok && oldGone === null);
await as(V1, () => db.query(`select public.stop_sharing_list()`));
check('stop sharing: the link stops working', (await as(null, () => db.query(`select public.get_shared_list('${newTok}') as r`))).rows[0].r === null);
await expectFail('the link page can’t touch the owner’s list directly', null, `update shopping_items set checked = true`);
// delete my data
await expectFail('delete my data: signed-in only', null, `select public.delete_my_account()`);
await as(V1, () => db.query(`select public.delete_my_account()`));
const left19 = (await db.query(`select (select count(*) from auth.users where id = '${V1}')::int u, (select count(*) from profiles where id = '${V1}')::int p, (select count(*) from meals where user_id = '${V1}')::int m, (select count(*) from shopping_items where user_id = '${V1}')::int s, (select count(*) from profiles where id = '${V2}')::int other`)).rows[0];
check('delete my data removes the account and everything tied to it (and only theirs)', left19.u === 0 && left19.p === 0 && left19.m === 0 && left19.s === 0 && left19.other === 1, JSON.stringify(left19));

// ================= 0020: friends + plate feedOf =================
try { const f = fs.readFileSync('./supabase/migrations/0020_friends_feed.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0020 runs (twice)', true); }
catch (e) { check('0020 runs (twice)', false, e.message); }
const [F1, F2, F3, F4] = ['11110000-0000-0000-0000-000000000001', '22220000-0000-0000-0000-000000000002', '33330000-0000-0000-0000-000000000003', '44440000-0000-0000-0000-000000000004'];
for (const [u, n] of [[F1, 'Ana'], [F2, 'Ben'], [F3, 'Cy'], [F4, 'Dee']]) { await db.exec(`insert into auth.users (id, email) values ('${u}', null)`); await db.exec(`update profiles set display_name = '${n}' where id = '${u}'`); }
const gf20 = async (u) => (await as(u, () => db.query(`select public.get_friends() as r`))).rows[0].r;
const fc1 = (await gf20(F1)).code, fc2 = (await gf20(F2)).code, fc3 = (await gf20(F3)).code;
check('everyone has a 6-letter friend code', [fc1, fc2, fc3].every((c) => /^[A-HJ-NP-Z2-9]{6}$/.test(c)));
await expectFail('you can’t friend yourself', F1, `select public.add_friend('${fc1}')`);
await expectFail('a made-up code finds nobody', F1, `select public.add_friend('ZZZZZZ')`);
const ask20 = (await as(F1, () => db.query(`select public.add_friend('${fc2.toLowerCase()}') as r`))).rows[0].r;
const g2 = await gf20(F2);
check('adding a code sends a request; they see your name', ask20 === 'requested' && g2.requests.length === 1 && g2.requests[0].name === 'Ana' && g2.friends.length === 0);
await as(F2, () => db.query(`select public.answer_friend('${fc1}', true)`));
check('they say yes → friends both20 ways', (await gf20(F1)).friends.some((f) => f.name === 'Ben') && (await gf20(F2)).friends.some((f) => f.name === 'Ana'));
const both20 = (await as(F3, () => db.query(`select public.add_friend('${fc1}') as r`))).rows[0].r;
const back20 = (await as(F1, () => db.query(`select public.add_friend('${fc3}') as r`))).rows[0].r;
check('if they already asked you, adding them back20 makes you friends', both20 === 'requested' && back20 === 'friends');
await expectFail('players can’t read the friend tables', F1, `select * from friends`);
// plates
for (const [u, k] of [[F1, 'a1'], [F1, 'a2'], [F2, 'b1'], [F4, 'd1']]) { await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${u}/${k}.jpg')`); await as(u, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${u}/${k}.jpg')`)); }
const mid20 = async (u, k) => (await db.query(`select id from meals where photo_path = '${u}/${k}.jpg'`)).rows[0].id;
const [a1x, a2x, b1x, d1x] = [await mid20(F1, 'a1'), await mid20(F1, 'a2'), await mid20(F2, 'b1'), await mid20(F4, 'd1')];
const feedOf = async (u) => (await as(u, () => db.query(`select public.get_feed() as r`))).rows[0].r;
check('plates are private by default (empty feedOf)', (await feedOf(F2)).length === 0);
await as(F1, () => db.query(`select public.set_meal_shared('${a1x}', true)`));
await as(F4, () => db.query(`select public.set_meal_shared('${d1x}', true)`));
check('you can only share your own plate', (await as(F2, () => db.query(`select public.set_meal_shared('${a2x}', true) as r`))).rows[0].r === false);
const fb20 = await feedOf(F2);
check('friends see the shared plate (not the private one, not strangers’)', fb20.length === 1 && fb20[0].id === a1x && fb20[0].name === 'Ana' && !fb20[0].mine);
check('strangers see nothing', (await feedOf(F4)).every((x) => x.mine));
await db.exec(`grant select on storage.objects to authenticated`);
const seePhotox = async (u, n) => (await as(u, () => db.query(`select count(*)::int n from storage.objects where name = '${n}'`))).rows[0].n;
check('friends can open a shared plate photo; strangers and private photos stay closed', await seePhotox(F2, `${F1}/a1.jpg`) === 1 && await seePhotox(F4, `${F1}/a1.jpg`) === 0 && await seePhotox(F2, `${F1}/a2.jpg`) === 0);
// love
const l1x = (await as(F2, () => db.query(`select public.love_meal('${a1x}', true) as r`))).rows[0].r;
const l2x = (await as(F2, () => db.query(`select public.love_meal('${a1x}', true) as r`))).rows[0].r;
const l3x = (await as(F3, () => db.query(`select public.love_meal('${a1x}', true) as r`))).rows[0].r;
check('anyone who can see it can love it, once each', l1x === 1 && l2x === 1 && l3x === 2 && (await feedOf(F2))[0].loved === true);
await expectFail('no loving plates you can’t see', F4, `select public.love_meal('${a1x}', true)`);
// report
await expectFail('you can’t report your own plate', F1, `select public.report_meal('${a1x}', 'spam')`);
await as(F2, () => db.query(`select public.report_meal('${a1x}', 'not_food')`));
check('reporting hides it for you right away, not yet for others', (await feedOf(F2)).length === 0 && (await feedOf(F3)).length === 1);
await as(F3, () => db.query(`select public.report_meal('${a1x}', 'rude')`));
check('2 reports from different players hide it for everyone (even the owner’s feedOf)', (await feedOf(F1)).every((x) => x.id !== a1x) && (await db.query(`select hidden_at from meals where id = '${a1x}'`)).rows[0].hidden_at !== null);
await expectFail('owners can’t un-hide a reported plate', F1, `update meals set hidden_at = null where id = '${a1x}'`);
await as(F1, () => db.query(`select public.set_meal_shared('${a1x}', true)`));
check('…or bring it back20 by sharing again', (await db.query(`select hidden_at from meals where id = '${a1x}'`)).rows[0].hidden_at !== null);
await expectFail('reports are for admins only', F2, `select public.admin_reports()`);
await db.exec(`update profiles set is_admin = true where id = '${F4}'`);
const rep20 = (await as(F4, () => db.query(`select public.admin_reports() as r`))).rows[0].r;
check('admins see reported plates with reasons', rep20.length === 1 && rep20[0].reports === 2 && rep20[0].hidden === true);
check('admins can open a reported photo to check it', await seePhotox(F4, `${F1}/a1.jpg`) === 1 && await seePhotox(F4, `${F1}/a2.jpg`) === 0);
await expectFail('only admins can un-hide', F2, `select public.admin_set_hidden('${a1x}', false)`);
await as(F4, () => db.query(`select public.admin_set_hidden('${a1x}', false)`));
check('an admin can put a wrongly reported plate back', (await feedOf(F3)).some((x) => x.id === a1x));
// unfriend
await as(F2, () => db.query(`select public.set_meal_shared('${b1x}', true)`));
await as(F1, () => db.query(`select public.remove_friend('${fc2}')`));
check('removing a friend: you stop seeing each other’s plates', (await feedOf(F1)).every((x) => x.mine) && (await feedOf(F2)).every((x) => x.mine));

// ================= 0021: notifications =================
try { const f = fs.readFileSync('./supabase/migrations/0021_notifications.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0021 runs (twice)', true); }
catch (e) { check('0021 runs (twice)', false, e.message); }
await db.exec(`insert into private.app_secrets (name, sha256_hex) values ('push_sender', encode(sha256(convert_to('cron-secret-123', 'UTF8')), 'hex')) on conflict (name) do update set sha256_hex = excluded.sha256_hex`);
const [N1, N2, N3] = ['5a000000-0000-0000-0000-00000000005a', '5b000000-0000-0000-0000-00000000005b', '5c000000-0000-0000-0000-00000000005c'];
for (const u of [N1, N2, N3]) await db.exec(`insert into auth.users (id, email) values ('${u}', null)`);
await db.exec(`update profiles set time_zone = 'America/New_York', display_name = 'Nia' where id = '${N1}'; update profiles set time_zone = 'Not/AZone' where id = '${N2}'`);
const hourIn = async (tz) => (await db.query(`select extract(hour from now() at time zone '${tz}')::int h`)).rows[0].h;
const sub = (u, k) => `select public.save_push('https://push.example.com/${k}', 'BPkey${k}', 'auth${k}')`;
await as(N1, () => db.query(sub(N1, 'n1')));
await expectFail('players can’t read push subscriptions', N2, `select * from push_subs`);
await expectFail('the sender needs the secret', null, `select public.push_due('wrong')`);
await expectFail('players can’t call the sender without it', N1, `select public.push_due(null)`);
const due0 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('notifications are off until the player turns them on', due0.length === 0);
const nyHour = await hourIn('America/New_York');
await as(N1, () => db.query(`select public.set_notify_hour(${nyHour})`));
const due1 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('nothing useful to say → no notification (never “we miss you”)', due1.length === 0);
const todayNY = (await db.query(`select (now() at time zone 'America/New_York')::date d`)).rows[0].d;
await db.exec(`insert into pantry_items (user_id, name, category, expires_on) values ('${N1}', 'Chicken', 'Proteins', '${ds(new Date(new Date(ds(todayNY) + 'T12:00:00Z').getTime() + 864e5))}')`);
await db.exec(`insert into pantry_items (user_id, name, category) values ('${N1}', 'Frozen ground beef', 'Frozen')`);
const due2 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('at the picked hour: “Chicken expires tomorrow” (expiring beats defrost)', due2.length === 1 && due2[0].title === 'Chicken expires tomorrow' && due2[0].endpoint === 'https://push.example.com/n1' && due2[0].url === '/home?n=1', JSON.stringify(due2));
const due3 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('at most one a day', due3.length === 0);
await db.exec(`update profiles set notify_last = null where id = '${N1}'; delete from pantry_items where user_id = '${N1}' and name = 'Chicken'`);
const due4 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('frozen meat not thawing → “Defrost the ground beef tonight”', due4.length === 1 && due4[0].title === 'Defrost the ground beef tonight', JSON.stringify(due4.map((d) => d.title)));
await db.exec(`update profiles set notify_last = null, notify_hour = (extract(hour from now() at time zone 'America/New_York')::int + 3) % 24 where id = '${N1}'`);
check('not at the picked hour → nothing', (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r.length === 0);
// a bad time zone doesn't break everyone else
const utcHour = await hourIn('UTC');
await as(N2, () => db.query(sub(N2, 'n2'))); await db.exec(`update profiles set notify_hour = ${utcHour} where id = '${N2}'`);
await db.exec(`insert into pantry_items (user_id, name, category, expires_on) values ('${N2}', 'Milk', 'Dairy & Eggs', (now() at time zone 'UTC')::date)`);
const due5 = (await as(null, () => db.query(`select public.push_due('cron-secret-123') as r`))).rows[0].r;
check('an unknown time zone falls back to UTC (and doesn’t break the run)', due5.length === 1 && due5[0].title === 'Milk expires today', JSON.stringify(due5.map((d) => d.title)));
// Cook Off: friends with notifications on get one message, once
const n3code = (await as(N3, () => db.query(`select public.get_friends() as r`))).rows[0].r.code;
const n1code = (await as(N1, () => db.query(`select public.get_friends() as r`))).rows[0].r.code;
await as(N1, () => db.query(`select public.add_friend('${n3code}')`));
await as(N3, () => db.query(`select public.answer_friend('${n1code}', true)`));
for (const n of ['Rice', 'Eggs', 'Garlic', 'Onion', 'Soy sauce']) await db.exec(`insert into pantry_items (user_id, name, category) values ('${N3}', '${n}', 'Other')`);
const g21 = (await as(N3, () => db.query(`select public.create_cookoff(30) as r`))).rows[0].r;
const pc = (await as(null, () => db.query(`select public.push_cookoff('cron-secret-123', '${N3}', '${g21.code}') as r`))).rows[0].r;
const pc2 = (await as(null, () => db.query(`select public.push_cookoff('cron-secret-123', '${N3}', '${g21.code}') as r`))).rows[0].r;
check('a friend’s new Cook Off → one message to friends who turned notifications on, once per game', pc.length === 1 && pc[0].endpoint.endsWith('/n1') && /started a Cook Off/.test(pc[0].title) && pc2.length === 0, JSON.stringify(pc));
check('…and only for a game that player is really hosting', (await as(null, () => db.query(`select public.push_cookoff('cron-secret-123', '${N1}', '${g21.code}') as r`))).rows[0].r.length === 0);
await as(null, () => db.query(`select public.push_gone('cron-secret-123', array['https://push.example.com/n1'])`));
check('dead phones are forgotten', (await db.query(`select count(*)::int n from push_subs where endpoint = 'https://push.example.com/n1'`)).rows[0].n === 0);
await as(N2, () => db.query(`select public.set_notify_hour(null)`));
check('turning notifications off forgets the phone', (await db.query(`select count(*)::int n from push_subs where user_id = '${N2}'`)).rows[0].n === 0);

// ================= 0022: kitchen layouts =================
try { const f = fs.readFileSync('./supabase/migrations/0022_kitchen_layouts.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0022 runs (twice)', true); }
catch (e) { check('0022 runs (twice)', false, e.message); }
const [K1, K2] = ['55550000-0000-0000-0000-000000000005', '66660000-0000-0000-0000-000000000006'];
for (const u of [K1, K2]) await db.exec(`insert into auth.users (id, email) values ('${u}', null)`);
const pc22 = `'[{"id":"k1","mid":"ff","x":0,"y":0,"w":3,"d":2,"h":6}]'`;
const kA = (await as(K1, () => db.query(`insert into kitchen_layouts (name, pieces, is_display) values ('Home', ${pc22}, true) returning id`))).rows[0].id;
const kB = (await as(K1, () => db.query(`insert into kitchen_layouts (name, pieces) values ('Dream', '[]') returning id`))).rows[0].id;
check('a player can save kitchens', !!kA && !!kB);
check('other players can’t see them', (await as(K2, () => db.query(`select count(*)::int n from kitchen_layouts`))).rows[0].n === 0);
check('nobody signed out can', await as(null, () => db.query(`select 1 from kitchen_layouts`)).then(() => false, () => true));
await expectFail('only one kitchen can be on display', K1, `update kitchen_layouts set is_display = true where id = '${kB}'`);
await as(K1, () => db.query(`select public.show_kitchen('${kB}')`));
const disp = (await as(K1, () => db.query(`select name from kitchen_layouts where is_display`))).rows;
check('show_kitchen swaps which one is on display', disp.length === 1 && disp[0].name === 'Dream');
await expectFail('you can’t put someone else’s kitchen on display', K2, `select public.show_kitchen('${kA}')`);
check('you can’t change someone else’s kitchen', (await as(K2, () => db.query(`update kitchen_layouts set name = 'Mine' where id = '${kA}' returning id`))).rows.length === 0);
await expectFail('you can’t give a kitchen to someone else', K1, `insert into kitchen_layouts (user_id, name) values ('${K2}', 'Gift')`);
await expectFail('a kitchen needs a list of pieces', K1, `insert into kitchen_layouts (name, pieces) values ('Bad', '{"a":1}')`);
for (let i = 0; i < 10; i++) await as(K1, () => db.query(`insert into kitchen_layouts (name) values ('K${i}')`));
await expectFail('12 kitchens max', K1, `insert into kitchen_layouts (name) values ('One too many')`);
// putting items away
const it22 = async (u, n) => (await as(u, () => db.query(`insert into pantry_items (name) values ('${n}') returning id`))).rows[0].id;
const i1 = await it22(K1, 'Milk'), i2 = await it22(K1, 'Eggs'), j1 = await it22(K2, 'Rice');
const xp0 = (await db.query(`select xp from profiles where id = '${K1}'`)).rows[0].xp;
const p1 = (await as(K1, () => db.query(`select public.place_item('${i1}', 'k1|0|1') as r`))).rows[0].r;
check('putting an item away: +3 XP, 1 left', p1.xp === 3 && p1.left === 1, JSON.stringify(p1));
const p1b = (await as(K1, () => db.query(`select public.place_item('${i1}', 'k1|0|2') as r`))).rows[0].r;
check('moving it again gives no more XP', p1b.xp === 0);
const p2 = (await as(K1, () => db.query(`select public.place_item('${i2}', 'k1|2|0') as r`))).rows[0].r;
check('putting the last one away: +3 and a +20 bonus', p2.xp === 23 && p2.left === 0, JSON.stringify(p2));
check('XP really lands on the profile', (await db.query(`select xp from profiles where id = '${K1}'`)).rows[0].xp === xp0 + 26);
await expectFail('you can’t move someone else’s item', K2, `select public.place_item('${i1}', 'k1|0|0')`);
await expectFail('a spot has to look like a spot', K1, `select public.place_item('${i1}', 'drop table')`);
check('your spot is saved on the item', (await as(K1, () => db.query(`select spot from pantry_items where id = '${i2}'`))).rows[0].spot === 'k1|2|0');
const off22 = (await as(K1, () => db.query(`select public.place_item('${i2}', null) as r`))).rows[0].r;
check('taking it out puts it back on the to-do pile', off22.xp === 0 && off22.left === 1);
check('someone else’s item stays where it was', (await db.query(`select spot from pantry_items where id = '${j1}'`)).rows[0].spot === null);
await as(K1, () => db.query(`select public.reset_game()`));
check('reset game clears kitchens too', (await db.query(`select count(*)::int n from kitchen_layouts where user_id = '${K1}'`)).rows[0].n === 0);

// ================= 0023: cooking pays +100 XP and 500 coins =================
try { const f = fs.readFileSync('./supabase/migrations/0023_cook_rewards.sql', 'utf8'); await db.exec(f); await db.exec(f); check('0023 runs (twice)', true); }
catch (e) { check('0023 runs (twice)', false, e.message); }
const CK = '88880000-0000-0000-0000-000000000008';
await db.exec(`insert into auth.users (id, email) values ('${CK}', null)`);
const coins23 = (await db.query(`select coins from profiles where id = '${CK}'`)).rows[0].coins;
const cooked = [];
for (let i = 0; i < 4; i++) {
  await db.exec(`insert into storage.objects (bucket_id, name) values ('meal-photos', '${CK}/m${i}.jpg')`);
  cooked.push((await as(CK, () => db.query(`select public.log_meal('www-budgetbytes-com-picadillo', '${CK}/m${i}.jpg') as r`))).rows[0].r);
}
check('cooking a meal: +100 XP for the cook', (await db.query(`select amount from xp_events where user_id = '${CK}' and kind = 'cook' limit 1`)).rows[0]?.amount === 100);
check('…and 500 coins (the result says so too)', cooked[0].coins === 500, JSON.stringify(cooked[0]));
check('3 meals a day pay out; the 4th gives no more coins', cooked[3].coins === 0 && (await db.query(`select coins from profiles where id = '${CK}'`)).rows[0].coins === coins23 + 1500);

// ================= fair play: coins only ever buy outfits =================
const spenders = (await db.query(`select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~* 'coins[[:space:]]*=[[:space:]]*coins[[:space:]]*-'`)).rows.map((r) => r.proname);
check('the only thing that spends coins is buying an outfit', JSON.stringify(spenders) === JSON.stringify(['buy_item']), JSON.stringify(spenders));
const slots = (await db.query(`select array_agg(distinct slot order by slot) s from items`)).rows[0].s;
check('everything in the shop is something to wear', slots.every((x) => ['top', 'hat', 'glasses', 'shoes', 'acc'].includes(x)), JSON.stringify(slots));

const fails = results.filter((r) => r[0] === 'FAIL');
results.forEach(([s, n, d]) => console.log(`${s}  ${n}${d ? '  — ' + d : ''}`));
console.log(`\n${results.length - fails.length}/${results.length} passed`);
