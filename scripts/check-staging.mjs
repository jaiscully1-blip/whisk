// Checks a staging file of new dishes (data-staging/<name>.json) without touching any real data.
// Usage: node scripts/check-staging.mjs data-staging/desserts.json
import fs from 'node:fs';
import { checkRecord } from './validate-world.mjs';
const root = new URL('../', import.meta.url);
const dishes = JSON.parse(fs.readFileSync(new URL('lib/dishes/data.json', root), 'utf8'));
const TYPES = ['soup', 'main', 'bread', 'dessert', 'street food', 'breakfast', 'side', 'drink', 'sauce', 'snack', 'salad', 'board', 'dumpling', 'sushi', 'pastry'];
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const existing = new Set(Object.values(dishes).flat().map((d) => fold(d[0])));
let rows; try { rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); } catch (e) { console.log('BAD JSON', e.message); process.exit(1); }
const errs = []; const names = new Set(); const per = {};
rows.forEach((r, i) => {
  const at = `#${i} ${r.iso} ${r.dish}`;
  if (!dishes[r.iso]) errs.push(`${at}: unknown country code`);
  if (!TYPES.includes(r.type)) errs.push(`${at}: type "${r.type}" not allowed`);
  if (!r.about || r.about.length > 90) errs.push(`${at}: about must be 1-90 chars`);
  if (existing.has(fold(r.dish)) || names.has(fold(r.dish))) errs.push(`${at}: name already exists`);
  names.add(fold(r.dish)); per[r.iso] = (per[r.iso] || 0) + 1;
  if (r.nt === undefined) errs.push(`${at}: nt is required`);
  const keys = (r.ing || []).filter((g) => g[4] === 1).map((g) => String(g[0]).toLowerCase());
  checkRecord(errs, at, r, keys);
});
console.log(errs.length ? errs.slice(0, 60).join('\n') : `ok: ${rows.length} dishes in ${Object.keys(per).length} countries`);
process.exit(errs.length ? 1 : 0);
