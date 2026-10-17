// Backup file: your pantry, shopping list, saved recipes and your own recipes as a small JSON file you keep.
// Coins, streaks, levels and the closet are held by the server and come back with "Back up your game" (account link),
// never from a file, so a file can't be edited to give coins.
const KIND = 'yoke-backup', VERSION = 1;
const clean = (s, n) => String(s ?? '').slice(0, n);

export async function makeBackup(supabase) {
  const get = async (t, cols) => { const { data, error } = await supabase.from(t).select(cols); if (error) return []; return data || []; };
  const [pantry, list, saved, mine] = await Promise.all([
    get('pantry_items', 'name, category, status, quantity, expires_on'),
    get('shopping_items', 'name, category, checked'),
    get('saved_recipes', 'recipe_id, rating'),
    get('my_recipes', 'title, servings, minutes, ingredients, steps')
  ]);
  return { kind: KIND, version: VERSION, saved_at: new Date().toISOString(), pantry, list, saved, mine };
}

export function parseBackup(text) {
  let j; try { j = JSON.parse(text); } catch { return null; }
  if (!j || j.kind !== KIND || j.version !== VERSION) return null;
  const arr = (a, max) => (Array.isArray(a) ? a.slice(0, max) : []);
  const date = (d) => (/^\d{4}-\d{2}-\d{2}/.test(d || '') ? d.slice(0, 10) : null);
  return {
    pantry: arr(j.pantry, 300).filter((p) => p && p.name).map((p) => ({ name: clean(p.name, 60), category: clean(p.category || 'Other', 40), status: ['stocked', 'good', 'low', 'out'].includes(p.status) ? p.status : 'stocked', quantity: p.quantity ? clean(p.quantity, 30) : null, expires_on: date(p.expires_on) })),
    list: arr(j.list, 300).filter((p) => p && p.name).map((p) => ({ name: clean(p.name, 60), category: clean(p.category || 'Other', 40), checked: !!p.checked })),
    saved: arr(j.saved, 500).filter((s) => s && s.recipe_id).map((s) => ({ recipe_id: clean(s.recipe_id, 80), rating: s.rating === 'up' || s.rating === 'down' ? s.rating : null })),
    mine: arr(j.mine, 100).filter((m) => m && m.title && Array.isArray(m.ingredients) && Array.isArray(m.steps)).map((m) => ({ title: clean(m.title, 120), servings: Number(m.servings) > 0 ? Math.min(100, Math.round(Number(m.servings))) : null, minutes: Number(m.minutes) > 0 ? Math.min(1440, Math.round(Number(m.minutes))) : null, ingredients: m.ingredients.slice(0, 80), steps: m.steps.slice(0, 80) }))
  };
}

// Adds what's missing; never deletes or overwrites what you already have. Returns counts.
export async function restoreBackup(supabase, b) {
  const out = { pantry: 0, list: 0, saved: 0, mine: 0 };
  const names = async (t) => new Set(((await supabase.from(t).select('name')).data || []).map((x) => x.name.toLowerCase()));
  const havePantry = await names('pantry_items'), haveList = await names('shopping_items');
  const np = b.pantry.filter((p) => !havePantry.has(p.name.toLowerCase())); if (np.length && !(await supabase.from('pantry_items').insert(np)).error) out.pantry = np.length;
  const nl = b.list.filter((p) => !haveList.has(p.name.toLowerCase())); if (nl.length && !(await supabase.from('shopping_items').insert(nl)).error) out.list = nl.length;
  const haveSaved = new Set(((await supabase.from('saved_recipes').select('recipe_id')).data || []).map((x) => x.recipe_id));
  const ns = b.saved.filter((x) => !haveSaved.has(x.recipe_id)); if (ns.length && !(await supabase.from('saved_recipes').insert(ns)).error) out.saved = ns.length;
  const haveMine = new Set(((await supabase.from('my_recipes').select('title')).data || []).map((x) => x.title.toLowerCase()));
  const nm = b.mine.filter((m) => !haveMine.has(m.title.toLowerCase())); if (nm.length && !(await supabase.from('my_recipes').insert(nm)).error) out.mine = nm.length;
  return out;
}
