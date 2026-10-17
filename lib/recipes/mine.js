import { parseIngredient } from './parseText.js';

// A recipe the player imported or typed, in the same shape as the catalog recipes so Cook mode, scaling and the
// "have it / missing" checks all work on it. Ingredients are stored as the player's own lines (so what they reviewed is
// exactly what is saved) and split into amount / unit / item only when shown.
const minutesIn = (t) => { const m = t.match(/(\d+)(?:\s*(?:-|to|–)\s*(\d+))?\s*(?:minutes?|mins?)\b/i); const h = t.match(/(\d+)\s*(?:hours?|hrs?)\b/i); const n = m ? +(m[2] || m[1]) : 0; return n || (h ? +h[1] * 60 : 0); };
export function toRecipe(row) {
  const ingredients = (row.ingredients || []).map((x) => (typeof x === 'string' ? parseIngredient(x) : x));
  return {
    id: `mine-${row.id}`, mineId: row.id, title: row.title, cuisine: 'My recipe', source: 'My recipe', url: null,
    minutes: row.minutes || 30, servings: row.servings || 4,
    ingredients, key: ingredients.map((g) => g.item), minor: [],
    steps: (row.steps || []).map((t) => { const m = minutesIn(t); return [t, m > 0 && m <= 120 ? m : null]; }),
  };
}
