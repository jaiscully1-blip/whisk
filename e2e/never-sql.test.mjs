// Never show me on the server (SQL 0064): the word lists, and party challenges picked around every member's list.
// Run: node e2e/never-sql.test.mjs
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const src = fs.readFileSync('/home/claude/whisk/e2e/mock-supabase.mjs', 'utf8');
const files = [...src.match(/for \(const f of \[([^\]]+)\]/)[1].matchAll(/'([^']+\.sql)'/g)].map((m) => m[1]);
const pre = src.slice(src.indexOf('await db.exec(`') + 'await db.exec(`'.length, src.indexOf('`);', src.indexOf('await db.exec(`')));
const db = new PGlite();
await db.exec(pre);
for (const f of files) await db.exec(fs.readFileSync('/home/claude/whisk/supabase/migrations/' + f, 'utf8').replace('create extension if not exists pgcrypto;', ''));
const one = async (q, p) => (await db.query(q, p)).rows;
console.log('regex:', (await one(`select _never_regex(array['fish','gluten / wheat','cilantro']) r`))[0].r.slice(0, 80) + '…');
const t = async (title, key, list) => (await one(`select _never_plain($1) ~* _never_regex($2::text[]) hit`, [`${title} ${JSON.stringify(key)}`, list]))[0].hit;
const cases = [
  ['Salmon Teriyaki', ['Salmon'], ['fish'], true], ['Chicken Curry', ['Chicken', 'Coconut milk'], ['dairy'], false], ['Moussaka', ['Eggplant', 'Lamb'], ['eggs'], false],
  ['Garlic Bread', ['Bread'], ['gluten / wheat'], true], ['Rice Bowl', ['Rice', 'Gluten-free soy sauce'], ['gluten / wheat'], false], ['Tacos', ['Beef', 'Cilantro'], ['cilantro'], true],
  ['Fish Tacos', ['Tilapia'], ['fish'], true], ['Codfish', ['Codfish'], ['fish'], true],
];
for (const [ti, k, l, want] of cases) { const got = await t(ti, k, l); assert.equal(got, want, `${ti} vs ${l.join('+')}`); }
// party flow
const [u1, u2] = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'];
await db.exec(`insert into auth.users (id, email) values ('${u1}', 'a@x.io'), ('${u2}', 'b@x.io')`);
await db.exec(`insert into profiles (id) values ('${u1}'), ('${u2}') on conflict do nothing`);
const g = (await one(`insert into chat_groups (name, owner, party) values ('P', '${u1}', true) returning id`))[0].id;
await db.exec(`insert into chat_members (group_id, user_id) values ('${g}', '${u1}'), ('${g}', '${u2}')`);
const as = async (u, q, p) => { await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [u]); return one(q, p); };
const clash = async () => (await one(`select pc.slot, r.title, not _party_can_eat('${g}', r.title, r.data->'key') clash from party_challenges pc join web_recipes r on r.id = pc.recipe_id where pc.group_id = '${g}' order by slot`));
console.log('active recipes', (await one(`select count(*) n from web_recipes where active`))[0].n);
// 1. a member avoids fish + gluten before the week's dishes are picked
await db.exec(`update profiles set never_show = array['fish','gluten / wheat'] where id = '${u2}'`);
let res = (await as(u1, `select get_party_challenges($1) j`, [g]))[0].j;
console.log('picked:', res.items.map((i) => `${i.slot}:${i.title}`).join(' | '));
assert.equal((await clash()).filter((x) => x.clash).length, 0, 'picked around the list');
// 2. force a clashing dish into slot 2, then another look re-picks it (nobody has cooked it)
const fishy = (await one(`select id, title from web_recipes where active and score >= 35 and score < 65 and (title ~* 'fish|salmon|tuna|shrimp|pasta|spaghetti|bread|noodle') limit 1`))[0];
await db.exec(`update party_challenges set recipe_id = '${fishy.id}' where group_id = '${g}' and slot = 2`);
console.log('forced slot 2 →', fishy.title, '| clash now:', (await clash()).find((x) => x.slot === 2).clash);
res = (await as(u2, `select get_party_challenges($1) j`, [g]))[0].j;
assert.equal((await clash()).filter((x) => x.clash).length, 0, 'a clashing dish is swapped');
// 3. a dish someone already cooked stays put even if it clashes
await db.exec(`update party_challenges set recipe_id = '${fishy.id}' where group_id = '${g}' and slot = 1`);
await db.exec(`insert into party_challenge_done (group_id, week_start, slot, user_id) select group_id, week_start, 1, '${u1}' from party_challenges where group_id = '${g}' and slot = 1`);
res = (await as(u1, `select get_party_challenges($1) j`, [g]))[0].j;
assert.equal(res.items[0].title, fishy.title, 'a cooked dish stays');
console.log('never-sql: all checks passed');
