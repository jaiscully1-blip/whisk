// Security checks against the whole current database (every migration, same stand-ins as e2e/mock-supabase.mjs).
// Run: node supabase/tests/hardening.test.mjs   (exits 1 if anything fails)
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const mock = fs.readFileSync(new URL('../../e2e/mock-supabase.mjs', import.meta.url), 'utf8');
const standIns = mock.slice(mock.indexOf('await db.exec(`') + 15, mock.indexOf('`);', mock.indexOf('await db.exec(`')));
const files = JSON.parse(mock.match(/for \(const f of (\[[^\]]+\])/)[1].replace(/'/g, '"'));

const db = new PGlite();
await db.exec(standIns);
for (const f of files) await db.exec(fs.readFileSync(new URL(`../migrations/${f}`, import.meta.url), 'utf8').replace('create extension if not exists pgcrypto;', ''));
await db.query("select set_config('yoke.lucky', '0', false)");

const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@x.test'), ('${B}', 'b@x.test') on conflict do nothing;
  insert into profiles (id) values ('${A}'), ('${B}') on conflict do nothing;`);

const results = [];
const check = (name, ok, detail = '') => results.push([ok ? 'PASS' : 'FAIL', name, detail]);
async function as(uid, fn) {
  await db.exec(uid ? `reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);` : `reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
async function fails(name, uid, sql) {
  try { await as(uid, () => db.query(sql)); check(name, false, 'should have failed'); } catch (e) { check(name, true, e.message.split('\n')[0]); }
}
const one = async (sql) => (await db.query(sql)).rows[0];
const coins = async (u) => (await one(`select coins from profiles where id = '${u}'`)).coins;
const meal = (u, c, i) => `insert into meals (user_id, title, photo_path, country, cuisine) values ('${u}', 'Dish ${i}', '${u}/m${i}.jpg', '${c}', 'Italian')`;

// --- players can't touch the economy or admin flags directly
await fails('player can\'t set their own coins', A, `update profiles set coins = 999999 where id = '${A}'`);
await fails('player can\'t set their own XP', A, `update profiles set xp = 999999 where id = '${A}'`);
await fails('player can\'t make themselves admin', A, `update profiles set is_admin = true where id = '${A}'`);
await fails('player can\'t fake a reset date', A, `update profiles set last_reset_at = null where id = '${A}'`);
await fails('player can\'t call the internal pay function', A, `select * from _pay('${A}', 'quest', 99999, null)`);
await fails('player can\'t call the internal XP function', A, `select _award_xp('${A}', 'quest', 99999, null)`);
await fails('player can\'t read the reward ledger', A, `select * from reward_ledger`);
await fails('player can\'t write the reward ledger', A, `delete from reward_ledger`);
await fails('player can\'t wipe a table (truncate)', A, `truncate pantry_items`);
await fails('player can\'t use the old coin-order credit', A, `select credit_coin_order(gen_random_uuid(), 'x', 1, 'guess')`);
await fails('a webhook call with the wrong secret credits nothing', null, `select rc_credit('wrong', '${A}', 't1', 'p', 'stripe', false, 1, 1)`);

// --- other players' data
await db.exec(`insert into pantry_items (user_id, name) values ('${B}', 'B secret eggs')`);
const seen = await as(A, () => db.query(`select count(*)::int n from pantry_items where user_id = '${B}'`));
check('player can\'t read another player\'s pantry', seen.rows[0].n === 0);
await as(A, () => db.query(`update pantry_items set name = 'hacked' where user_id = '${B}'`));
check('player can\'t change another player\'s pantry', (await one(`select name from pantry_items where user_id = '${B}'`)).name === 'B secret eggs');
await fails('player can\'t move their pantry row onto someone else', A, `insert into pantry_items (user_id, name) values ('${B}', 'planted')`);

// --- signed-out callers
for (const f of ['start_party(\'x\')', 'get_parties()', 'ping()']) await fails(`signed out can't call ${f.split('(')[0]}`, null, `select ${f}`);

// --- push: only real push services
await fails('push to a random site is refused', A, `select save_push('https://evil.example/hook', repeat('a', 87), repeat('b', 22))`);
await fails('push to an internal address is refused', A, `select save_push('http://169.254.169.254/latest', repeat('a', 87), repeat('b', 22))`);
try { await as(A, () => db.query(`select save_push('https://fcm.googleapis.com/fcm/send/abc', repeat('a', 87), repeat('b', 22))`)); check('push to Google\'s push service works', true); }
catch (e) { check('push to Google\'s push service works', false, e.message); }

// --- reset can't farm coins
for (let i = 1; i <= 5; i++) await db.exec(meal(A, 'IT', i));
const afterFirst = await coins(A);
check('finishing a country pays the bonus once', (await one(`select count(*)::int n from country_done where user_id = '${A}' and meal_id is not null`)).n === 1);
await as(A, () => db.query('select reset_game()'));
const afterReset = await coins(A);
check('coins are kept through a reset', afterReset === afterFirst);
for (let i = 6; i <= 10; i++) await db.exec(meal(A, 'IT', i));
check('finishing the same country after a reset pays nothing', (await coins(A)) === afterReset, `${afterReset} → ${await coins(A)}`);
check('…but it still shows as done', (await one(`select count(*)::int n from country_done where user_id = '${A}' and country = 'IT'`)).n === 1);
check('the cuisine stamp is remembered through a reset', (await one(`select count(*)::int n from reward_ledger where user_id = '${A}' and kind = 'cuisine' and key = 'italian'`)).n === 1);
await fails('a second reset within a week is refused', A, 'select reset_game()');

const bad = results.filter((r) => r[0] === 'FAIL');
for (const r of results) console.log(r[0], r[1], r[2] ? `· ${r[2]}` : '');
console.log(`\n${results.length - bad.length}/${results.length} passed`);
process.exit(bad.length ? 1 : 0);
