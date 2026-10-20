// Adds new dishes (written by category into data-staging/<name>.json) to lib/recipes/world/<ISO>.json and lib/dishes/data.json.
// Staging record: { iso, type, about, dish, min, sv, ing, st, tc, pp, pr, nt }. Bad or duplicate records are dropped and reported.
// Usage: node scripts/merge-new-recipes.mjs data-staging/desserts.json [...]
import fs from 'node:fs';
import { checkFile } from './validate-world.mjs';
const root = new URL('../', import.meta.url);
const P = (f) => new URL(f, root);
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const TYPES = new Set(['soup', 'main', 'bread', 'dessert', 'street food', 'breakfast', 'side', 'drink', 'sauce', 'snack', 'salad', 'board', 'dumpling', 'sushi', 'pastry']);
const dataPath = P('lib/dishes/data.json');
let dishes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const backup = {}; const wp = (iso) => P(`lib/recipes/world/${iso}.json`);
const world = {}; const getW = (iso) => (world[iso] ||= (backup[iso] = fs.readFileSync(wp(iso), 'utf8'), JSON.parse(backup[iso])));
const dataBackup = JSON.stringify(dishes);
const seen = new Set(); for (const l of Object.values(dishes)) for (const d of l) seen.add(fold(d[0]));   // a dish name is unique across the whole list
const report = { added: 0, dropped: [] };
const added = {};   // iso → [indexes of new records]
for (const f of process.argv.slice(2)) {
  for (const r of JSON.parse(fs.readFileSync(f, 'utf8'))) {
    const why = !dishes[r.iso] ? 'unknown country' : !TYPES.has(r.type) ? `type ${r.type}` : seen.has(fold(r.dish)) ? 'duplicate name' : !r.about ? 'no about' : null;
    if (why) { report.dropped.push(`${r.iso} ${r.dish}: ${why}`); continue; }
    const w = getW(r.iso);
    const { iso, type, about, ...rec } = r;
    const keys = rec.ing.filter((g) => g[4] === 1).map((g) => String(g[0]).toLowerCase()).slice(0, 8);
    w.push(rec); dishes[iso].push([r.dish, type, keys, about]); seen.add(fold(r.dish));
    (added[iso] ||= []).push(w.length - 1);
  }
}
const writeAll = () => { for (const iso in world) fs.writeFileSync(wp(iso), JSON.stringify(world[iso])); fs.writeFileSync(dataPath, JSON.stringify(dishes)); };
for (let round = 0; round < 6; round++) {
  writeAll();
  let bad = 0; const drop = {};
  for (const iso of Object.keys(world)) {
    for (const e of checkFile(iso)) {
      const m = /^[A-Z]{2} #(\d+) /.exec(e);
      if (m && (added[iso] || []).includes(+m[1])) { (drop[iso] ||= new Set()).add(+m[1]); report.dropped.push(e); } else { console.log('NON-NEW ERROR', e); bad++; }
    }
  }
  if (bad) { for (const iso in backup) fs.writeFileSync(wp(iso), backup[iso]); fs.writeFileSync(dataPath, dataBackup); console.log('restored; aborting'); process.exit(1); }
  if (!Object.keys(drop).length) break;
  for (const iso in drop) {
    world[iso] = world[iso].filter((_, i) => !drop[iso].has(i));
    dishes[iso] = dishes[iso].filter((_, i) => !drop[iso].has(i));
    added[iso] = [];   // indexes shift; re-derive below
    const base = JSON.parse(backup[iso]).length; for (let i = base; i < world[iso].length; i++) added[iso].push(i);
  }
}
report.added = Object.values(added).reduce((a, l) => a + l.length, 0);
fs.writeFileSync(P('data-staging/last-merge.json'), JSON.stringify(report, null, 1));
console.log(`added ${report.added}, dropped ${report.dropped.length}`); report.dropped.slice(0, 25).forEach((d) => console.log(' -', d));
