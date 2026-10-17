// Turns the text read from a recipe photo into a title, ingredients and steps. Works on lines: { text, conf } (conf 0-100,
// how sure the reader was). Nothing is guessed silently: every line the reader was unsure about comes back with low: true,
// so the review screen can highlight it for the player to check.
const UNITS = '(?:cups?|c\\.?|tbsps?\\.?|tablespoons?|tsps?\\.?|teaspoons?|oz\\.?|ounces?|lbs?\\.?|pounds?|g|grams?|kg|ml|l|liters?|litres?|pints?|quarts?|qt|gal|gallons?|cloves?|cans?|sticks?|slices?|pinch(?:es)?|dash(?:es)?|large|medium|small|bunch(?:es)?|packages?|pkgs?|heads?|sprigs?|stalks?)';
const FRAC = '[¼½¾⅓⅔⅛⅜⅝⅞]';
const QTY = `(?:\\d+\\s+\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+(?:[.,]\\d+)?(?:\\s*-\\s*\\d+(?:[.,]\\d+)?)?\\s*${FRAC}?|${FRAC})`;
const BULLET = /^[\s•·●○◦▪■□*\-–—»«©¢®>~]+(?=\S)/;
const HEAD_ING = /^(?:ingredients?|what you(?:'|’)?ll need|you(?:'|’)?ll need|you will need|shopping list)\s*:?\s*$/i;
const HEAD_STEP = /^(?:directions?|instructions?|method|steps?|preparation|procedure|how to make(?: it)?|to make|cooking)\s*:?\s*$/i;

// Common reading slips: l/2 → 1/2, O → 0 inside numbers, stray spaces in fractions.
export function fixDigits(t) {
  return t
    .replace(/(^|[\s(])[lI|](?=\s*\/\s*\d)/g, '$11')            // l/2 cup → 1/2 cup
    .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2')                      // 1 / 2 → 1/2
    .replace(/(?<=\d)[Oo](?=\d|\s*\/|\s+(?:g|ml|oz|lb|cup|tbsp|tsp))/g, '0')   // 1O0 g → 100 g
    .replace(/(^|[\s(])[Oo](?=\d)/g, '$10')                      // O5 → 05
    .replace(/(?<=\d)[lI|](?=\s*(?:g|ml|oz|lb|cup|tbsp|tsp)\b)/gi, '1')   // 2l tbsp
    .replace(/(\d\s*)0z\b/gi, '$1oz')                          // 8 0z → 8 oz (zero for the letter o)
    .replace(/(\d\s*)(?:tbsp|tbs)\b/gi, '$1tbsp')
    .replace(/\s{2,}/g, ' ').trim();
}
const clean = (t) => fixDigits(t.replace(BULLET, '').replace(/[“”]/g, '"'));
const startsQty = (t) => new RegExp(`^${QTY}(?:\\s|$|[a-zA-Z])`).test(t);
const looksIngredient = (t) => startsQty(t) && !/^\d+\s*[.)]\s+\S/.test(t) && t.length <= 90 && (new RegExp(`^${QTY}\\s*${UNITS}\\b`, 'i').test(t) || /^\S+\s+\S/.test(t) && !/[.!?]$/.test(t) || t.length < 40);
const numbered = (t) => /^(?:step\s*)?\d{1,2}\s*[.):\-]\s*\S/i.test(t) && !new RegExp(`^\\d{1,2}\\s*[.):]\\s*${UNITS}\\b`, 'i').test(t);
const stripNum = (t) => t.replace(/^(?:step\s*)?\d{1,2}\s*[.):\-]\s*/i, '');
// A line that ends mid-thought ("... all-purpose" / "flour") continues on the next line. A line that is a complete
// item ("2 tbsp butter" / "salt") does not, so short ingredients aren't glued together.
const DANGLING = /(?:[,\-–&]|\b(?:and|or|of|with|extra|all-purpose|fresh|freshly|ground|chopped|dried|unsalted|salted|whole|skim|brown|white|black|red|green|light|dark|plain|heavy|sweet|sour|hot|cold|warm|large|medium|small|baking|self-rising|granulated|powdered|confectioners'?|coarse|kosher|sea|vanilla|lemon|lime|olive|vegetable|canola|sesame|soy|fish|chicken|beef|vegetable))\s*$/i;
const dangling = (t) => DANGLING.test(t);
const titleCase = (t) => (t === t.toUpperCase() && /[A-Z]{3}/.test(t) ? t.toLowerCase().replace(/(^|\s)([a-z])/g, (m, a, c) => a + c.toUpperCase()) : t);

export function parseRecipeText(lines) {
  const L = lines.map((l) => (typeof l === 'string' ? { text: l, conf: 100 } : l)).map((l) => ({ text: clean(l.text || ''), conf: l.conf ?? 100 })).filter((l) => l.text && /[A-Za-z0-9]/.test(l.text));
  let servings = null, minutes = null; const meta = new Set();
  L.forEach((l, i) => {
    const s = l.text.match(/\b(?:serves|servings?|yields?|makes|portions?)\s*[:\-]?\s*(\d{1,3})\b/i) || l.text.match(/^\s*(\d{1,3})\s+(?:servings?|portions?)\b/i);
    if (s && !servings && l.text.length < 60) { servings = +s[1]; meta.add(i); }
    const t = l.text.match(/\b(?:total|ready in|cook(?:ing)?|prep(?:aration)?)?\s*time\s*[:\-]?\s*(?:(\d+)\s*(?:hours?|hrs?|h)\s*)?(?:(\d+)\s*(?:minutes?|mins?|m)\b)?/i);
    if (t && (t[1] || t[2]) && l.text.length < 60) { const m = (+t[1] || 0) * 60 + (+t[2] || 0); if (m) { minutes = Math.max(minutes || 0, m); meta.add(i); } }
  });
  const iIng = L.findIndex((l) => HEAD_ING.test(l.text)), iStep = L.findIndex((l) => HEAD_STEP.test(l.text));
  const ing = [], steps = [];
  const push = (arr, l, join) => { if (join && arr.length) { const p = arr[arr.length - 1]; p.text += ` ${l.text}`; p.conf = Math.min(p.conf, l.conf); } else arr.push({ text: l.text, conf: l.conf }); };
  let title = null, mode = iIng >= 0 || iStep >= 0 ? 'head' : 'auto';
  L.forEach((l, i) => {
    if (meta.has(i)) return;
    if (HEAD_ING.test(l.text)) { mode = 'ing'; return; }
    if (HEAD_STEP.test(l.text)) { mode = 'step'; return; }
    if (mode === 'head') { if (!title) title = l; return; }
    if (mode === 'ing') { const wrap = ing.length && /^[a-z(]/.test(l.text) && !startsQty(l.text) && dangling(ing[ing.length - 1].text); push(ing, l, wrap); return; }
    if (mode === 'step') { const prev = steps[steps.length - 1]; const wrap = prev && !numbered(l.text) && !/[.!?]["')]?$/.test(prev.text); push(steps, { ...l, text: stripNum(l.text) }, wrap); return; }
    // no headings: sort line by line
    if (steps.length) { const prev = steps[steps.length - 1]; const wrap = !numbered(l.text) && !/[.!?]["')]?$/.test(prev.text); push(steps, { ...l, text: stripNum(l.text) }, wrap); return; }
    if (looksIngredient(l.text)) { push(ing, l, false); return; }
    if (numbered(l.text) || l.text.length > 70 || /[.!?]$/.test(l.text)) { push(steps, { ...l, text: stripNum(l.text) }, false); return; }
    if (!title && !ing.length) { title = l; return; }
    if (ing.length && /^[a-z(]/.test(l.text) && dangling(ing[ing.length - 1].text)) { push(ing, l, true); return; }
    push(ing, l, false);   // a plain line among ingredients ("salt", "olive oil") is an ingredient
  });
  const mark = (a) => a.map((x) => ({ text: x.text, low: x.conf < 72 }));
  return { title: title ? { text: titleCase(title.text.replace(/[:.]+$/, '')), low: title.conf < 72 } : { text: '', low: false }, servings, minutes, ingredients: mark(ing), steps: mark(steps) };
}

// "1 1/2 cups flour, sifted" → { qty: 1.5, unit: 'cups', item: 'flour', note: 'sifted' }. Lines it can't split keep the whole line as the item.
const GLYPH = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
export function parseIngredient(line) {
  const t = fixDigits(line.trim());
  const m = t.match(new RegExp(`^(${QTY})\\s*(${UNITS})?\\.?\\s+(.*)$`, 'i')) || t.match(new RegExp(`^(${QTY})\\s*()(.*)$`));
  if (!m) return { item: t };
  let q = m[1].trim(), qty = 0;
  const g = q.match(new RegExp(FRAC)); if (g) { qty += GLYPH[g[0]]; q = q.replace(g[0], '').trim(); }
  const mixed = q.match(/^(\d+)\s+(\d+)\/(\d+)$/), frac = q.match(/^(\d+)\/(\d+)$/), range = q.match(/^(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)$/);
  if (mixed) qty += +mixed[1] + +mixed[2] / +mixed[3]; else if (frac) qty += +frac[1] / +frac[2]; else if (range) qty += +range[2].replace(',', '.'); else if (q) qty += +q.replace(',', '.');
  if (!qty) return { item: t };
  let rest = m[3].trim(), unit = (m[2] || '').replace(/\.$/, '') || undefined;
  rest = rest.replace(/^of\s+/i, '');
  const [item, ...noteBits] = rest.split(/\s*,\s*|\s+\((?=[^)]*\))/);
  const note = noteBits.join(', ').replace(/\)$/, '').trim() || undefined;
  return { qty: Math.round(qty * 1000) / 1000, ...(unit ? { unit } : {}), item: (item || rest).trim(), ...(note ? { note } : {}) };
}
