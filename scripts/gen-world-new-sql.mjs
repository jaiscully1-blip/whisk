// NEW dishes only (index at or past lib/recipes/world-base.json). Writes migrations/0055_world_recipes_more.sql + setup/48-world-recipes-more.sql.
// Generates the SQL for Yoke's world recipes from lib/recipes/world/<ISO>.json.
// The database only needs a light row per recipe (so saving, cooking, stamps and challenges work); the steps and
// amounts are served from the app (app/api/world-recipe). Writes supabase/migrations/0055_world_recipes_more.sql and
// supabase/setup/48-world-recipes-more.sql.
import fs from 'node:fs';
import { canon, difficulty } from '../lib/recipes/match.js';
import { expandWorld, worldIds } from '../lib/recipes/worldExpand.js';

const root = new URL('../', import.meta.url);
const dishes = JSON.parse(fs.readFileSync(new URL('lib/dishes/data.json', root), 'utf8'));
const src = fs.readFileSync(new URL('lib/passport/countries.js', root), 'utf8');
const names = {}; for (const m of src.matchAll(/\["([A-Z]{2})","([^"]+)"/g)) names[m[1]] = m[2];
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`;
const base = JSON.parse(fs.readFileSync(new URL('lib/recipes/world-base.json', root), 'utf8'));
const rows = [];
for (const iso of Object.keys(dishes).sort()) {
  const recs = JSON.parse(fs.readFileSync(new URL(`lib/recipes/world/${iso}.json`, root), 'utf8'));
  const ids = worldIds(iso, recs);
  recs.forEach((rec, i) => {
    if (i < (base[iso] ?? 0)) return;
    const r = expandWorld(iso, names[iso], rec, ids[i]);
    rows.push(`(${q(r.id)}, ${q(r.title.slice(0, 160))}, ${q(r.cuisine)}, 'Yoke Kitchen', 'https://whisk-7fgo.vercel.app/', ${r.minutes}, ${r.servings}, ${r.technique}, ${r.prep}, ${r.precision}, ${r.steps.length}, ${difficulty(r)}, ${arr([...new Set(r.key.map(canon))])}, '{"country":"${iso}","world":true}'::jsonb)`);
  });
}
const head = (a, b, n, of) => `-- Yoke world recipes${of > 1 ? ` (part ${n} of ${of})` : ''}: ${b - a} light rows. The steps and amounts live in the app; these rows let you save, cook and earn stamps for them.
-- Safe to run more than once.
insert into public.web_recipes (id, title, cuisine, source, url, minutes, servings, technique, prep, precision_level, step_count, score, key_canon, data) values
`;
const tail = `
on conflict (id) do update set title = excluded.title, cuisine = excluded.cuisine, minutes = excluded.minutes, servings = excluded.servings, technique = excluded.technique,
  prep = excluded.prep, precision_level = excluded.precision_level, step_count = excluded.step_count, score = excluded.score, key_canon = excluded.key_canon, data = excluded.data, active = true;
`;
const chunk = (a, b, n, of) => head(a, b, n, of) + rows.slice(a, b).join(',\n') + tail;
fs.writeFileSync(new URL('supabase/migrations/0055_world_recipes_more.sql', root), chunk(0, rows.length, 1, 1));
fs.copyFileSync(new URL('supabase/migrations/0055_world_recipes_more.sql', root), new URL('supabase/setup/48-world-recipes-more.sql', root));
console.log(`${rows.length} rows`);
