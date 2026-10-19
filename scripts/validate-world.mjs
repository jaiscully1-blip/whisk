// Checks lib/recipes/world/<ISO>.json against the dish list in lib/dishes/data.json.
// Usage: node scripts/validate-world.mjs IT [US ...]   (no args = every file that exists)
import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const dishes = JSON.parse(fs.readFileSync(new URL('lib/dishes/data.json', root), 'utf8'));
export const UNITS = new Set(['', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'fl oz', 'g', 'kg', 'ml', 'l', 'clove', 'can', 'piece', 'pinch', 'bunch', 'sprig', 'slice', 'stick', 'head', 'stalk', 'fillet', 'sheet', 'packet', 'handful', 'dash']);
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
export function checkFile(iso) {
  const errs = [];
  const p = new URL(`lib/recipes/world/${iso}.json`, root);
  if (!fs.existsSync(p)) return [`${iso}: file missing`];
  let a; try { a = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return [`${iso}: bad JSON ${e.message}`]; }
  const want = dishes[iso]; if (!want) return [`${iso}: unknown country`];
  if (!Array.isArray(a) || a.length !== want.length) errs.push(`${iso}: expected ${want.length} recipes, got ${a?.length}`);
  want.forEach(([name, , ing], i) => {
    const r = a?.[i]; const at = `${iso} #${i} ${name}`;
    if (!r) { errs.push(`${at}: missing`); return; }
    if (r.dish !== name) errs.push(`${at}: dish name is "${r.dish}" (must match exactly, same order)`);
    if (!Number.isInteger(r.min) || r.min < 5 || r.min > 600) errs.push(`${at}: min`);
    if (!Number.isInteger(r.sv) || r.sv < 1 || r.sv > 12) errs.push(`${at}: sv`);
    for (const k of ['tc', 'pp', 'pr']) if (!Number.isInteger(r[k]) || r[k] < 1 || r[k] > 5) errs.push(`${at}: ${k} must be 1-5`);
    if (!Array.isArray(r.ing) || r.ing.length < 3 || r.ing.length > 30) { errs.push(`${at}: ing needs 3-30 rows`); return; }
    const seen = new Set(); let keys = 0;
    for (const g of r.ing) {
      if (!Array.isArray(g) || g.length !== 5) { errs.push(`${at}: ingredient row must be [item, qty, unit, note, key]: ${JSON.stringify(g)}`); continue; }
      const [item, qty, unit, note, key] = g;
      if (typeof item !== 'string' || !item.trim() || item.length > 60) errs.push(`${at}: bad item ${JSON.stringify(item)}`);
      if (qty !== null && !(typeof qty === 'number' && qty > 0 && qty < 5000)) errs.push(`${at}: bad qty for ${item}`);
      if (!UNITS.has(unit)) errs.push(`${at}: unit "${unit}" not allowed (${item})`);
      if (typeof note !== 'string' || note.length > 80) errs.push(`${at}: note`);
      if (key !== 0 && key !== 1) errs.push(`${at}: key flag must be 0 or 1 (${item})`);
      if (seen.has(fold(item))) errs.push(`${at}: duplicate ingredient ${item}`); seen.add(fold(item));
      keys += key === 1;
    }
    if (keys < 2 || keys > 10) errs.push(`${at}: needs 2-10 key ingredients, has ${keys}`);
    const names = r.ing.map((g) => fold(g[0]));
    const hit = ing.filter((w) => names.some((n) => n.includes(fold(w)) || fold(w).includes(n))).length;
    if (hit < Math.ceil(ing.length * 0.5)) errs.push(`${at}: only ${hit}/${ing.length} of the listed ingredients (${ing.join(', ')}) are used`);
    if (!Array.isArray(r.st) || r.st.length < 5 || r.st.length > 14) { errs.push(`${at}: needs 5-14 steps`); return; }
    r.st.forEach((s, j) => {
      if (!Array.isArray(s) || s.length !== 2 || typeof s[0] !== 'string') { errs.push(`${at} step ${j}: must be [text, timerMinutes|null]`); return; }
      if (s[0].length < 25 || s[0].length > 420) errs.push(`${at} step ${j}: length ${s[0].length}`);
      if (s[1] !== null && !(Number.isInteger(s[1]) && s[1] >= 1 && s[1] <= 600)) errs.push(`${at} step ${j}: timer`);
      const open = (s[0].match(/\[\[/g) || []).length, close = (s[0].match(/\]\]/g) || []).length;
      if (open !== close) errs.push(`${at} step ${j}: unbalanced [[ ]]`);
      for (const m of s[0].matchAll(/\[\[(.*?)\]\]/g)) if (!/^\d/.test(m[1])) errs.push(`${at} step ${j}: [[${m[1]}]] must start with a number`);
      if (/\b\d+(\.\d+)?\s*(cups?|tbsp|tsp|oz|lb|g|kg|ml)\b/i.test(s[0].replace(/\[\[.*?\]\]/g, ''))) errs.push(`${at} step ${j}: measured amount outside [[ ]]`);
    });
  });
  return errs;
}
if (process.argv[1] && process.argv[1].endsWith('validate-world.mjs')) {
  const isos = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(new URL('lib/recipes/world/', root)).filter((f) => /^[A-Z]{2}\.json$/.test(f)).map((f) => f.slice(0, 2));
  let bad = 0; for (const iso of isos) { const e = checkFile(iso); if (e.length) { bad += e.length; console.log(e.slice(0, 40).join('\n')); } else console.log(`${iso}: ok`); }
  process.exit(bad ? 1 : 0);
}
