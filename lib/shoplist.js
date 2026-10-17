import { guessCategory } from '@/lib/game';
import { canon } from '@/lib/recipes/match';

// Put ingredient names on the shopping list, skipping anything already there and any repeats across recipes.
// Returns how many were added, or -1 if the save failed.
export async function addToShoppingList(supabase, names) {
  const { data: list } = await supabase.from('shopping_items').select('name');
  const have = new Set((list || []).map((l) => canon(l.name)));
  const add = [];
  for (const n of names) { const k = canon(n); if (!k || have.has(k)) continue; have.add(k); add.push(n); }
  if (!add.length) return 0;
  const { error } = await supabase.from('shopping_items').insert(add.map((m) => ({ name: m.slice(0, 60), category: guessCategory(m) })));
  return error ? -1 : add.length;
}
export const listMsg = (n) => (n < 0 ? 'Couldn’t add to your list.' : n ? `Added ${n} to your shopping list` : 'Already on your list');
