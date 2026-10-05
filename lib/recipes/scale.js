// Scale recipe amounts by any number of servings multiplier (1x, 2x, 3x, 1.5x …).
// Step text marks every measured amount like "Add [[1 1/2 cups]] broth" so only real measurements change.
// Shared by the app and Whisk Play: no imports.
const UNI = { '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
const NUM = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)`;
const LEAD = new RegExp(String.raw`^\s*(${NUM})(?:\s*(?:-|–|to)\s*(${NUM}))?`);
export function toNumber(s) {
  s = String(s).trim();
  let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/); if (m) return +m[1] + m[2] / m[3];
  m = s.match(/^(\d+)\/(\d+)$/); if (m) return m[1] / m[2];
  return parseFloat(s);
}
const FR = [[0, ''], [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'], [1, '']];
// 1.5 → "1½", 0.333 → "⅓", 2.4 → "2.4", 12 → "12"
export function formatQty(n) {
  if (!isFinite(n) || n <= 0) return String(n);
  if (n >= 20) return String(Math.round(n));
  const whole = Math.floor(n), frac = n - whole;
  let best = null; for (const [v, g] of FR) { const d = Math.abs(frac - v); if (!best || d < best[0]) best = [d, v, g]; }
  if (best[0] <= 0.03) { const w = whole + (best[1] === 1 ? 1 : 0); return best[2] ? (w ? `${w}${best[2]}` : best[2]) : String(w); }
  return String(Math.round(n * 10) / 10);
}
// "1 1/2 cups" ×2 → "3 cups"; "2-3 cloves" ×2 → "4–6 cloves"; "a pinch" stays.
export function scaleAmount(text, factor) {
  let t = String(text).replace(/[¼½¾⅓⅔⅛⅜⅝⅞]/g, (c, i, s) => (/\d/.test(s[i - 1] || '') ? ' ' : '') + UNI[c]);
  const m = t.match(LEAD); if (!m || factor === 1) return factor === 1 ? text : t;
  const a = formatQty(toNumber(m[1]) * factor), b = m[2] ? formatQty(toNumber(m[2]) * factor) : null;
  return (b ? `${a}–${b}` : a) + plural(t.slice(m[0].length), toNumber(m[2] || m[1]) * factor);
}
// "1 cups" → "1 cup", "2 cup" → "2 cups"
const UNITS = ['cup', 'clove', 'sprig', 'rib', 'can', 'jar', 'bottle', 'package', 'bag', 'box', 'sheet', 'handful', 'stalk', 'slice', 'piece', 'bunch', 'stick', 'head', 'fillet', 'thigh', 'breast', 'link', 'egg'];
function plural(rest, n) {
  return rest.replace(/^(\s+)([a-z]+)\b/i, (all, sp, w) => {
    const lw = w.toLowerCase(); const base = UNITS.includes(lw) ? lw : UNITS.includes(lw.slice(0, -1)) && lw.endsWith('s') ? lw.slice(0, -1) : lw.endsWith('es') && UNITS.includes(lw.slice(0, -2)) ? lw.slice(0, -2) : null;
    if (!base) return all;
    return sp + (n > 1 ? (base === 'bunch' ? 'bunches' : base + 's') : base);
  });
}
// Split step text into plain and measured pieces: [{ text, amount: bool }]
export function stepParts(text, factor = 1) {
  const out = []; let last = 0;
  for (const m of String(text).matchAll(/\[\[(.*?)\]\]/g)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), amount: false });
    out.push({ text: scaleAmount(m[1], factor), amount: true }); last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), amount: false });
  return out;
}
export const plainStep = (text, factor = 1) => stepParts(text, factor).map((p) => p.text).join('');
// One ingredient line: { qty, qtyMax, unit, item, note } ×factor → "3 cups beef broth, divided"
export function ingredientLine(g, factor = 1) {
  const q = g.qty == null ? '' : formatQty(g.qty * factor) + (g.qtyMax != null ? `–${formatQty(g.qtyMax * factor)}` : '');
  const unit = g.unit ? plural(' ' + g.unit, (g.qtyMax ?? g.qty ?? 1) * factor).trim() : '';
  return [q, unit, g.item].filter(Boolean).join(' ') + (g.note ? `, ${g.note}` : '');
}
// "3" / "3x" / "1.5" → 3 / 3 / 1.5 ; anything silly → null
export function parseFactor(v) {
  const n = toNumber(String(v).replace(/[x×\s]+$/i, '').trim());
  return isFinite(n) && n > 0 && n <= 50 ? Math.round(n * 100) / 100 : null;
}
