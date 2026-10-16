import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { swapsFor, SWAP_KEYS } from './subs.js';
const want = (item, first) => { const s = swapsFor(item); assert.ok(s.length > 0, `${item} has swaps`); if (first) assert.match(s.map((x) => x.name).join('|'), new RegExp(first, 'i'), item); };
want('buttermilk', 'milk'); want('large eggs', 'flax'); want('egg', 'flax'); want('unsalted butter', 'olive oil'); want('brown sugar', 'molasses'); want('garlic', 'garlic powder');
want('fresh parsley', 'dried'); want('dried oregano', 'fresh'); want('whole milk', 'oat'); want('soy sauce', 'tamari'); want('long grain white rice, uncooked', 'brown rice'); want('green onions', 'chives');
// things that must NOT match
for (const bad of ['egg noodles', 'egg yolks', 'butternut squash', 'sugar snap peas', 'ginger ale', 'chocolate milk']) assert.equal(swapsFor(bad).length, 0, `${bad} should have no swaps`);
assert.ok(!swapsFor('garlic powder').some((s) => /jarred/.test(s.name)), 'garlic powder is not garlic cloves');
// every option is well-formed
const all = [...JSON.parse(readFileSync(new URL('./web.json', import.meta.url))), ...JSON.parse(readFileSync(new URL('./more.json', import.meta.url)))];
let total = 0, hit = 0; const miss = new Map();
for (const r of all) for (const g of r.ingredients || []) { total++; const s = swapsFor(g.item); if (s.length) { hit++; for (const o of s) { assert.ok(o.name && o.how, g.item); assert.ok(o.ratio == null || (o.ratio > 0 && o.ratio <= 3), `${g.item} ratio`); } } else miss.set(g.item.toLowerCase(), (miss.get(g.item.toLowerCase()) || 0) + 1); }
const recipesWith = all.filter((r) => (r.ingredients || []).some((g) => swapsFor(g.item).length)).length;
console.log(`subs ok: ${SWAP_KEYS} entries; ${hit}/${total} recipe ingredients have swaps; ${recipesWith}/${all.length} recipes have at least one`);
