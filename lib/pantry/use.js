// When you post a meal, the ingredients it used come off your pantry: a full 2 lb of chicken, a recipe that needs 1 lb → 1 lb left.
// Only amounts that can be compared are changed (weight with weight, volume with volume, count with count). Anything else is left alone.
import { canon } from '@/lib/recipes/match';
import { parseIngredient } from '@/lib/recipes/parseText';
import { toNumber, formatQty } from '@/lib/recipes/scale';

const VOL = { tsp: 4.93, tbsp: 14.79, cup: 236.6, 'fl oz': 29.57, ml: 1, l: 1000, pint: 473, quart: 946, gallon: 3785 };
const WT = { oz: 28.35, lb: 453.6, g: 1, kg: 1000 };
const COUNT = { '': 1, piece: 1, dozen: 12, clove: 1, slice: 1, stick: 1, can: 1, head: 1, bunch: 1, sprig: 1, stalk: 1, fillet: 1, sheet: 1, packet: 1, handful: 1 };
const ALIAS = { teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp', tablespoon: 'tbsp', tablespoons: 'tbsp', tbsps: 'tbsp', cups: 'cup', c: 'cup', ounce: 'oz', ounces: 'oz', lbs: 'lb', pound: 'lb', pounds: 'lb',
  gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg', milliliter: 'ml', milliliters: 'ml', liter: 'l', liters: 'l', litre: 'l', litres: 'l', pints: 'pint', pt: 'pint', quarts: 'quart', qt: 'quart', gallons: 'gallon', gal: 'gallon',
  pieces: 'piece', pcs: 'piece', cloves: 'clove', slices: 'slice', sticks: 'stick', cans: 'can', heads: 'head', bunches: 'bunch', sprigs: 'sprig', stalks: 'stalk', fillets: 'fillet', sheets: 'sheet', packets: 'packet', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', floz: 'fl oz' };
const norm = (u) => { u = String(u || '').toLowerCase().replace(/\./g, '').trim(); return ALIAS[u] || u; };
const family = (u) => (u in VOL ? ['vol', VOL[u]] : u in WT ? ['wt', WT[u]] : u in COUNT ? ['count', COUNT[u]] : null);

// "2 lb" → { n: 907.2, fam: 'wt', unit: 'lb' } (n in base units); null when it can't be read
export function readAmount(qty, unit) {
  const f = family(norm(unit)); if (!f || !(qty > 0)) return null;
  return { n: qty * f[1], fam: f[0], unit: norm(unit) };
}
export function readPantryQty(text) {
  const t = String(text || '').trim().toLowerCase(); if (!t) return null;
  const m = t.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)|[¼½¾])\s*([a-z. ]*)$/);
  if (!m) return null;
  const num = m[1] === '¼' ? 0.25 : m[1] === '½' ? 0.5 : m[1] === '¾' ? 0.75 : toNumber(m[1]);
  const a = readAmount(num, m[2].trim()); return a && { ...a, raw: m[2].trim() };
}
const show = (base, unit, raw) => { const f = family(unit); const u = raw ?? unit; const v = base / f[1]; return v >= 20 || Number.isInteger(v) ? `${Math.round(v * 100) / 100}` + (u ? ` ${u}` : '') : `${formatQty(v)}${u ? ` ${u}` : ''}`; };

// A fifth gone each time: "80% left", "60% left" ... A number with a unit we can't compare ("1 stick") loses a fifth of the number.
const PCT = /^(\d{1,3})\s*% left$/i;
function fifth(p) {
  const q = String(p.quantity || '').trim(); const m = PCT.exec(q);
  const left = m ? +m[1] - 20 : 80;
  if (!m && q) {
    const n = /^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))\s*(.*)$/.exec(q);
    if (n) { const v = toNumber(n[1]) * 0.8; const out = `${Math.round(v * 100) / 100}${n[2] ? ` ${n[2]}` : ''}`; return { id: p.id, name: p.name, from: q, to: out, patch: { quantity: out, ...(v < 0.25 ? { status: 'low' } : {}) } }; }
  }
  if (left <= 0) return { id: p.id, name: p.name, from: q || null, to: null, patch: { status: 'out', quantity: null } };
  return { id: p.id, name: p.name, from: q || null, to: `${left}% left`, patch: { quantity: `${left}% left`, ...(left <= 20 ? { status: 'low' } : {}) } };
}

export function recipeNeeds(ingredients, factor = 1) {
  const out = [];
  for (const g of ingredients || []) {
    const o = typeof g === 'string' ? parseIngredient(g) : g; if (!o?.item || !(o.qty > 0)) continue;
    const a = readAmount(o.qty * (factor || 1), o.unit || ''); if (a) out.push({ item: o.item, ...a });
  }
  return out;
}

// pantry: [{ id, name, quantity, status }] → [{ id, name, from, to, patch }]
export function planUse(ingredients, factor, pantry) {
  const plan = []; const taken = new Set();
  for (const need of recipeNeeds(ingredients, factor)) {
    const c = canon(need.item); if (!c) continue;
    if (/^water$/.test(c)) continue;
    const p = (pantry || []).find((x) => !taken.has(x.id) && x.status !== 'out' && (canon(x.name) === c || (c.length >= 4 && canon(x.name).includes(c)) || (canon(x.name).length >= 4 && c.includes(canon(x.name)))));
    if (!p) continue;
    taken.add(p.id);
    const have = readPantryQty(p.quantity);
    if (!have || have.fam !== need.fam) { plan.push(fifth(p)); continue; }   // can't compare the amounts (a stick of butter vs 4 tbsp, or no amount at all): use up a fifth
    const left = have.n - need.n;
    if (left <= have.n * 0.02) plan.push({ id: p.id, name: p.name, from: p.quantity, to: null, patch: { status: 'out', quantity: null } });
    else plan.push({ id: p.id, name: p.name, from: p.quantity, to: show(left, have.unit, have.raw), patch: { quantity: show(left, have.unit, have.raw), ...(left < have.n * 0.25 ? { status: 'low' } : {}) } });
  }
  return plan;
}
