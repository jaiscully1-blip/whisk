// Yoke's own world recipes: one compact record per dish (lib/recipes/world/<ISO>.json), expanded here into the same
// shape as the web recipes so the recipe sheet, cook mode, scaling and swaps all work unchanged.
// Plain ESM, no imports besides the formatter: used by the server route and the SQL generator.
import { formatQty } from './scale.js';

export const WORLD_SOURCE = 'Yoke Kitchen';
export const WORLD_URL = 'https://whisk-7fgo.vercel.app/';
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const isWorldId = (id) => typeof id === 'string' && /^w-[a-z]{2}-/.test(id);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Ids for a country's records, in order: w-it-spaghetti-carbonara (a repeat in the same country gets -2). */
export function worldIds(iso, records) {
  const seen = new Map();
  return records.map((r) => {
    const base = `w-${iso.toLowerCase()}-${fold(r.dish).slice(0, 56) || 'dish'}`;
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    return n > 1 ? `${base}-${n}` : base;
  });
}

const amountText = (g) => (g[1] == null ? 'to taste' : [formatQty(g[1]), g[2]].filter(Boolean).join(' ') + (g[3] ? ` (${g[3]})` : ''));

export function expandWorld(iso, countryName, r, id) {
  const key = r.ing.filter((g) => g[4] === 1), minor = r.ing.filter((g) => g[4] !== 1);
  const amounts = {}; for (const g of key) amounts[cap(g[0])] = amountText(g);
  const effort = Math.max(1, r.st.filter((s) => s[1] == null).length);
  return {
    id, title: r.dish, cuisine: countryName, source: WORLD_SOURCE, url: WORLD_URL,
    minutes: r.min, servings: r.sv,
    key: key.map((g) => cap(g[0])), minor: minor.map((g) => cap(g[0])), amounts,
    steps: r.st.map((s) => [s[0], s[1]]),
    technique: r.tc, prep: r.pp, precision: r.pr, nutrition: null, video: null,
    country: iso, effort_steps: effort,
    note: Array.isArray(r.nt) && r.nt[0] ? { how: r.nt[0], swap: String(r.nt[1] || '').replace(/^best swap:\s*/i, '') } : null,
    ingredients: r.ing.map((g) => { const o = { item: g[0] }; if (g[1] != null) o.qty = g[1]; if (g[2]) o.unit = g[2]; if (g[3]) o.note = g[3]; return o; })
  };
}

/** The id a dish gets in its country (matches worldIds for the first dish of that name). */
export const worldIdFor = (iso, dish) => `w-${String(iso).toLowerCase()}-${fold(dish).slice(0, 56) || 'dish'}`;
