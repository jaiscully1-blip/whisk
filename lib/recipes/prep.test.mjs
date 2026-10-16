import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bowlOf, prepGroups, hasBowls } from './prep.js';
const t = (item, want, note) => assert.equal(bowlOf({ item, note }), want, `${item} → ${want}`);
for (const [i, w] of [['all-purpose flour','dry'],['sugar','dry'],['kosher salt','dry'],['garlic powder','dry'],['baking soda','dry'],['smoked paprika','dry'],['chili powder','dry'],
  ['olive oil','wet'],['whole milk','wet'],['eggs','wet'],['egg yolks','wet'],['unsalted butter','wet'],['beef broth','wet'],['soy sauce','wet'],['vanilla extract','wet'],['honey','wet'],['lemon juice','wet'],
  ['ground beef','cook'],['chicken thighs','cook'],['yellow onion','cook'],['garlic','cook'],['macaroni','cook'],['white rice','cook'],['broccoli','cook'],['shredded cheddar','cook'],['tomato sauce','wet']]) t(i, w);
const g = prepGroups([{ item: 'flour' }, { item: 'milk' }, { item: 'onion' }, { item: 'salt' }]);
assert.deepEqual(g.map((x) => x.id), ['wet', 'dry', 'cook']);
assert.equal(hasBowls([{ item: 'rice' }, { item: 'onion' }, { item: 'broccoli' }, { item: 'carrot' }]), false);
// every real recipe: every ingredient lands in exactly one bowl; report the spread
const all = [...JSON.parse(readFileSync(new URL('./web.json', import.meta.url))), ...JSON.parse(readFileSync(new URL('./more.json', import.meta.url)))];
let n = 0, shown = 0; const tally = { wet: 0, dry: 0, cook: 0 };
for (const r of all) { const ing = r.ingredients || []; const gs = prepGroups(ing); assert.equal(gs.reduce((a, b) => a + b.items.length, 0), ing.length, r.title); n += ing.length; if (hasBowls(ing)) shown++; for (const x of gs) tally[x.id] += x.items.length; }
console.log(`prep ok: ${all.length} recipes, ${n} ingredients, switch shown on ${shown}`, tally);
