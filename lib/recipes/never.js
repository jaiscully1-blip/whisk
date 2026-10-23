// "Never show me": allergen groups and single ingredients a player never wants to see. Shared by the app, the
// server (world recipes, party challenges via the SQL copy in supabase/migrations/0064) and Whisk Play.
//
// A recipe is checked against every ingredient name it has (the measured list, its main and minor ingredients) and
// its title. For each hit:
//   • a safe swap exists (gluten-free spaghetti for spaghetti, tamari for soy sauce, oat milk for milk …) → the
//     recipe stays, rewritten with the swap, and the sheet says what was changed;
//   • it's a small extra (a garnish, a pinch of something) with no swap → the recipe stays, with "leave out …";
//   • it's what the dish is made of (salmon in a salmon dish, eggs in an omelet) and nothing safe replaces it → hidden.
// A swap is only used when the swap itself doesn't hit anything else on the player's list (soy sauce is no swap for
// fish sauce if they avoid soy or gluten; coconut aminos is).
// This reads ingredient NAMES only: packaged foods can hide allergens a recipe doesn't name, so the app tells
// players to keep checking labels.

// Each group: the words that mean it's in there. Kept broad on purpose (a false "hidden" is fine; a miss is not).
export const ALLERGENS = {
  peanuts: ['peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut', 'satay'],
  'tree nuts': ['almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'macadamia', 'pine nut', 'pine nuts', 'brazil nut', 'nut', 'nuts', 'praline', 'marzipan', 'nutella', 'pesto', 'frangipane', 'amaretto', 'baklava'],
  shellfish: ['shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'crawfish', 'langoustine', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'oyster sauce', 'scallop', 'scallops', 'squid', 'calamari', 'octopus', 'shellfish', 'shrimp paste', 'dried shrimp', 'conch', 'gambas', 'scampi'],
  fish: ['fish', 'fish sauce', 'anchovy', 'anchovies', 'salmon', 'tuna', 'cod', 'saltfish', 'bacalao', 'bacalhau', 'tilapia', 'sardine', 'sardines', 'mackerel', 'trout', 'haddock', 'halibut', 'snapper', 'bonito', 'dashi', 'worcestershire', 'caesar', 'catfish', 'herring', 'swordfish', 'sea bass', 'branzino', 'mahi', 'pollock', 'hake', 'carp', 'eel', 'roe', 'caviar', 'kipper', 'katsuobushi', 'nam pla', 'patis', 'ceviche', 'shark', 'grouper', 'flounder', 'sole', 'perch', 'pike', 'monkfish', 'skate', 'whitebait', 'smelt', 'barramundi', 'kingfish', 'yellowtail', 'bream', 'sea bream', 'mullet', 'tarama', 'pomfret', 'hilsa', 'rohu', 'kapenta', 'dagaa', 'omena', 'lox', 'gravlax', 'surimi', 'pilchard', 'pilchards', 'sprat', 'sprats', 'turbot', 'plaice', 'whiting', 'mahi mahi', 'stockfish', 'bombil', 'sashimi', 'codfish', 'whitefish', 'monkfish', 'flatfish', 'fishcake', 'fishcakes', 'fishball', 'fishballs', 'fishfingers', 'fish fingers', 'fish sticks'],
  eggs: ['egg', 'eggs', 'egg yolk', 'egg yolks', 'egg white', 'egg whites', 'mayonnaise', 'mayo', 'aioli', 'meringue', 'egg noodles', 'omelet', 'omelette', 'frittata', 'custard', 'hollandaise', 'béarnaise', 'bearnaise'],
  dairy: ['milk', 'butter', 'buttermilk', 'cheese', 'cheddar', 'parmesan', 'parmigiano', 'pecorino', 'mozzarella', 'feta', 'halloumi', 'gruyere', 'colby', 'havarti', 'ricotta', 'mascarpone', 'brie', 'gouda', 'paneer', 'cream', 'heavy cream', 'sour cream', 'crème fraîche', 'creme fraiche', 'yogurt', 'yoghurt', 'labneh', 'ghee', 'whey', 'queso', 'cotija', 'tzatziki', 'condensed milk', 'evaporated milk', 'ice cream', 'kefir'],
  'gluten / wheat': ['flour', 'wheat', 'bread', 'breadcrumbs', 'bread crumbs', 'panko', 'pasta', 'spaghetti', 'penne', 'ziti', 'macaroni', 'fettuccine', 'linguine', 'rigatoni', 'tagliatelle', 'orzo', 'lasagna', 'lasagne', 'ditalini', 'gnocchi', 'noodles', 'noodle', 'lo mein', 'udon', 'ramen', 'couscous', 'bulgur', 'barley', 'rye', 'semolina', 'tortilla', 'tortillas', 'pita', 'naan', 'roti', 'chapati', 'baguette', 'bun', 'buns', 'rolls', 'croutons', 'pastry', 'puff pastry', 'phyllo', 'filo', 'pie crust', 'soy sauce', 'hoisin', 'teriyaki', 'beer', 'malt', 'seitan', 'farro', 'spelt', 'cracker', 'crackers', 'graham', 'digestive biscuits', 'biscuit', 'biscuits', 'cookie', 'cookies', 'wafer', 'wafers', 'pretzel', 'pretzels', 'croissant', 'croissants', 'bagel', 'bagels', 'brioche', 'dumpling wrappers', 'wonton wrappers', 'egg roll wrappers', 'spring roll wrappers', 'vermicelli']
  ,
  soy: ['soy', 'soy sauce', 'soya', 'soybean', 'soybeans', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh', 'hoisin', 'teriyaki', 'natto'],
  sesame: ['sesame', 'sesame oil', 'sesame seeds', 'tahini', 'hummus', 'halva', 'za’atar', "za'atar", 'zaatar', 'furikake', 'gomashio', 'dukkah']
};
export const ALLERGEN_LABELS = { peanuts: 'Peanuts', 'tree nuts': 'Tree nuts', shellfish: 'Shellfish', fish: 'Fish', eggs: 'Eggs', dairy: 'Dairy', 'gluten / wheat': 'Gluten / wheat', soy: 'Soy', sesame: 'Sesame' };

// Words that look like a group's word but aren't in it. Per group, so "almond milk" is fine for dairy but still
// hidden for tree nuts, and "peanut butter" isn't dairy but is peanuts.
const NOT_IN = {
  dairy: /\b(dairy[- ]free|vegan|plant[- ]based) [^,;()]+|\b(coconut|almond|oat|soy|rice|cashew|hemp) (milk|cream|butter|yogurt|yoghurt|cheese)s?\b|\b(peanut|nut|almond|cashew|sunflower|apple|cocoa|shea|seed) butter\b|\bcream of tartar\b|\bbutternut\b|\bbutter beans?\b|\bbutterhead\b|\bmilk thistle\b|\bcoconut milk\b|\bcream soda\b/g,
  'tree nuts': /\b(nutmeg|butternut|coconut|doughnut|donut|water chestnuts?|nutritional yeast|tiger nuts?|nut[- ]free [^,;()]+)\b/g,
  peanuts: /\bpeanut[- ]free [^,;()]+\b/g,
  eggs: /\b(eggplants?|egg ?plants?|egg[- ]free [^,;()]+|vegan mayo(nnaise)?)\b/g,
  fish: /\b(fish[- ]free [^,;()]+|vegan worcestershire( sauce)?|anchovy[- ]free [^,;()]+|kombu dashi|swedish fish|catfish? ?mint)\b/g,
  shellfish: /\b(mushroom stir[- ]fry sauce|vegan oyster sauce|oyster mushrooms?)\b/g,
  'gluten / wheat': /\b(rice|corn|chickpea|coconut|cassava|tapioca|potato|almond|oat|buckwheat|sorghum|teff|gram|besan|millet|quinoa|arrowroot|banana|glass|cellophane|mung bean|sweet potato|kelp|shirataki) (flour|noodles?|pasta|tortillas?|starch|bread|crackers?|cakes?|wrappers|vermicelli|sticks)\b|\bgluten[- ]free [^,;()]+|\bcorn tortillas?\b|\b(ginger|root) beer\b|\brice paper\b|\bcornflour\b|\bcornstarch\b|\bcoconut aminos\b|\btamari\b|\bbuckwheat\b|\bsoba\b(?= \(100% buckwheat\))|\bglass noodles\b|\bvermicelli rice\b/g,
  soy: /\b(soy[- ]free [^,;()]+|coconut aminos)\b/g,
  sesame: /\bsesame[- ]free [^,;()]+\b/g
};

// Swaps that are safe for an allergy (not just for taste). [pattern, group, ok when it's a main ingredient, swaps…]
// Each swap: [name, why]. The first swap that doesn't hit the player's list is used.
const SWAPS = [
  // gluten ("flour tortillas" before "flour")
  [/\b(flour )?tortillas?\b/, 'gluten / wheat', true, [['corn tortillas', 'warm them so they bend without cracking']]],
  [/\b(all[- ]purpose |plain |white |self[- ]rising |cake |bread |pastry )?flour\b/, 'gluten / wheat', true, [['gluten-free 1:1 baking flour', 'same amount; look for one with xanthan gum']]],
  [/\b(spaghetti|penne|ziti|macaroni|fettuccine|linguine|rigatoni|tagliatelle|orzo|ditalini|pasta|lasagna|lasagne)( noodles| sheets)?\b/, 'gluten / wheat', true, [['+gluten-free', 'cook it a minute less than the box says']]],
  [/\b(egg noodles?|lo mein( noodles?)?|udon( noodles?)?|ramen( noodles?)?|noodles?)\b/, 'gluten / wheat', true, [['rice noodles', 'soak or boil as the packet says']]],
  [/\bgnocchi\b/, 'gluten / wheat', true, [['+gluten-free', 'same cooking time']]],
  [/\b(panko|bread ?crumbs|breadcrumbs|croutons)\b/, 'gluten / wheat', true, [['gluten-free breadcrumbs', 'same amount']]],
  [/\b(baguettes?|bread|buns?|(dinner |bread |small |sandwich |hoagie |sub |kaiser )?rolls|sourdough|ciabatta|toast)\b/, 'gluten / wheat', true, [['+gluten-free', 'same amount']]],
  [/\b(pita|naan|roti|chapati|flatbread|lavash)\b/, 'gluten / wheat', true, [['gluten-free flatbread', 'or corn tortillas']]],
  [/\b(couscous|bulgur)\b/, 'gluten / wheat', true, [['quinoa', 'cook as the packet says, fluff with a fork']]],
  [/\b(barley|farro|spelt)\b/, 'gluten / wheat', true, [['brown rice', 'cook separately until tender, then add']]],
  [/\bsemolina\b/, 'gluten / wheat', true, [['fine cornmeal (polenta)', 'same amount']]],
  [/\b(puff pastry|pie crust|pastry|phyllo|filo)\b/, 'gluten / wheat', true, [['+gluten-free', 'sold frozen; same baking time']]],
  [/\b(dumpling|wonton) wrappers\b/, 'gluten / wheat', true, [['rice paper', 'soften in warm water first']]],
  [/\b(graham cracker|digestive biscuit|cracker|biscuit|cookie|wafer|pretzel|croissant|bagel|brioche)s?( crumbs)?\b/, 'gluten / wheat', true, [['+gluten-free', 'same amount']]],
  [/\b(dark |light |lager )?beer\b/, 'gluten / wheat', true, [['gluten-free beer', 'same amount'], ['stock', 'same amount']]],
  [/\bmalt( vinegar)?\b/, 'gluten / wheat', false, [['cider vinegar', 'same amount']]],
  // soy sauce family: gluten, soy (and stand-ins for fish sauce)
  [/\b(dark |light |low[- ]sodium )?(soy sauce|shoyu)\b/, 'gluten / wheat', true, [['tamari', 'same amount; brewed without wheat'], ['coconut aminos', 'same amount; a little sweeter, add a pinch of salt']]],
  [/\b(dark |light |low[- ]sodium )?(soy sauce|shoyu|tamari)\b/, 'soy', true, [['coconut aminos', 'same amount; a little sweeter, add a pinch of salt']]],
  [/\bhoisin( sauce)?\b/, null, false, [['gluten-free hoisin sauce', 'check the label'], ['coconut aminos + a little honey', '1 tbsp aminos + 1 tsp honey for each tbsp']]],
  [/\bteriyaki( sauce)?\b/, null, true, [['tamari + honey', '2 parts tamari to 1 part honey'], ['coconut aminos + honey', '2 parts aminos to 1 part honey']]],
  [/\bmiso( paste)?\b/, 'soy', false, [['chickpea miso', 'same amount; soy-free']]],
  [/\bedamame\b/, 'soy', true, [['green peas', 'same amount']]],
  // fish / shellfish in sauces (the fish itself has no swap)
  [/\b(fish sauce|nam pla|patis)\b/, 'fish', true, [['soy sauce + a squeeze of lime', 'same amount'], ['coconut aminos + a pinch of salt', 'same amount']]],
  [/\bworcestershire( sauce)?\b/, 'fish', true, [['vegan Worcestershire sauce', 'anchovy-free; check the label'], ['coconut aminos + a dash of vinegar', 'same amount']]],
  [/\banchov(y|ies)( fillets| paste)?\b/, 'fish', false, [['capers, finely chopped', '1 tsp for each 2 fillets']]],
  [/\b(dashi|bonito( flakes)?|katsuobushi)\b/, 'fish', true, [['kombu dashi', 'seaweed-only stock, same amount']]],
  [/\bcaesar( dressing)?\b/, 'fish', true, [['anchovy-free caesar dressing', 'check the label']]],
  [/\boyster sauce\b/, 'shellfish', true, [['vegan oyster sauce', 'made from mushrooms; check the label'], ['mushroom stir-fry sauce', 'same amount']]],
  [/\b(shrimp paste|dried shrimp)\b/, 'shellfish', true, [['miso paste', 'half the amount'], ['a pinch of salt', 'for the savory note']]],
  // dairy (the specific ones first: "sour cream" before "cream", "cream cheese" before "cheese")
  [/\bbuttermilk\b/, 'dairy', true, [['oat milk + 1 tbsp lemon juice per cup', 'rest 5 minutes before using']]],
  [/\bcondensed milk\b/, 'dairy', true, [['sweetened condensed coconut milk', 'same amount']]],
  [/\bevaporated milk\b/, 'dairy', true, [['full-fat coconut milk', 'same amount']]],
  [/\bice cream\b/, 'dairy', true, [['dairy-free ice cream', 'same amount']]],
  [/\b(sour cream|crème fraîche|creme fraiche|yogh?urt|labneh)\b/, 'dairy', true, [['dairy-free yogurt', 'same amount; plain and unsweetened']]],
  [/\bkefir\b/, 'dairy', true, [['dairy-free yogurt thinned with a little water', 'same amount']]],
  [/\btzatziki\b/, 'dairy', true, [['dairy-free tzatziki', 'dairy-free yogurt + grated cucumber + garlic']]],
  [/\b(ricotta( salata)?|mascarpone|cream cheese)\b/, 'dairy', true, [['dairy-free cream cheese', 'same amount']]],
  [/\b(whole |skim |2% |low[- ]fat )?milk\b/, 'dairy', true, [['oat milk', 'same amount; unsweetened'], ['coconut milk (carton)', 'same amount']]],
  [/\b(heavy |double |whipping |single |light )?cream\b/, 'dairy', true, [['full-fat coconut cream', 'same amount']]],
  [/\b(unsalted |salted )?butter\b/, 'dairy', true, [['dairy-free butter', 'same amount'], ['olive oil', '3/4 the amount (not for baking)']]],
  [/\bghee\b/, 'dairy', true, [['coconut oil', 'same amount']]],
  [/\b(cheddar|mozzarella|parmesan|parmigiano( reggiano)?|pecorino( romano)?|gruyere|colby|havarti|gouda|brie|queso( fresco)?|cotija|feta|monterey jack|provolone|swiss|cheese)( cheese)?\b/, 'dairy', true, [['+dairy-free', 'melts best when grated fine'], ['nutritional yeast', '2 tbsp for each 1/4 cup cheese (for a cheesy taste)']]],
  [/\bpaneer\b/, 'dairy', true, [['extra-firm tofu', 'press it dry first'], ['chickpeas', 'same weight']]],
  // eggs (only when they're not the dish itself)
  [/\b(mayonnaise|mayo)\b/, 'eggs', true, [['vegan mayo', 'same amount; egg-free']]],
  [/\baioli\b/, 'eggs', false, [['vegan mayo + crushed garlic', 'same amount']]],
  [/\b(large |whole |beaten )?eggs?( yolks?| whites?)?\b/, 'eggs', false, [['flax egg', '1 tbsp ground flaxseed + 3 tbsp water per egg, rest 5 minutes; for baking and binding']]],
  // nuts, peanuts, sesame
  [/\bpeanut butter\b/, 'peanuts', true, [['sunflower seed butter', 'same amount']]],
  [/\b(roasted |chopped |crushed )?peanuts?\b/, 'peanuts', false, [['toasted sunflower seeds', 'same amount']]],
  [/\bpeanut oil\b/, 'peanuts', true, [['vegetable oil', 'same amount']]],
  [/\bpesto\b/, 'tree nuts', true, [['nut-free pesto', 'blend basil, olive oil, garlic and salt (add parmesan if you can have it)']]],
  [/\b(almonds?|cashews?|walnuts?|pecans?|pistachios?|hazelnuts?|macadamias?|pine nuts?|nuts)\b/, 'tree nuts', false, [['toasted pumpkin seeds', 'same amount']]],
  [/\b(toasted )?sesame oil\b/, 'sesame', false, [['olive oil', 'same amount']]],
  [/\btahini\b/, 'sesame', true, [['sunflower seed butter', 'same amount']]],
  [/\bsesame seeds?\b/, 'sesame', false, [['toasted sunflower seeds', 'same amount']]]
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const groupOf = (w) => (ALLERGENS[w] ? w : null);
// One matcher per thing on the list: its words, and what isn't it.
function compile(never) {
  const out = [];
  for (const raw of never || []) {
    const w = String(raw || '').trim().toLowerCase(); if (!w) continue;
    const words = ALLERGENS[w] || [w];
    out.push({ item: w, group: groupOf(w), re: new RegExp(`\\b(${[...new Set(words.map((x) => x.toLowerCase()))].map(esc).join('|')})(e?s)?\\b`, 'i'), not: NOT_IN[w] || null });
  }
  return out;
}
const cache = new Map();
function matchers(never) {
  const key = (never || []).join('|');
  if (!cache.has(key)) { if (cache.size > 50) cache.clear(); cache.set(key, compile(never)); }
  return cache.get(key);
}
// The first thing on the list this text uses: { item, group, word } or null.
function hitIn(text, ms) {
  const lower = String(text || '').toLowerCase();
  for (const m of ms) {
    const t = m.not ? lower.replace(m.not, ' ') : lower;
    const x = t.match(m.re); if (x) return { item: m.item, group: m.group, word: x[1] };
  }
  return null;
}
const has = (text, never) => !!hitIn(text, matchers(never));

/** The first never-show word a recipe uses (ingredients or title), or null. `never` holds group keys and/or plain words. */
export function blockedBy(recipe, never) {
  const ms = matchers(never); if (!ms.length) return null;
  for (const n of names(recipe)) { const h = hitIn(n, ms); if (h) return h.word; }
  return null;
}
function names(r) {
  return [r.title, ...(r.ingredients || []).map((i) => i.item), ...(r.key || []), ...(r.minor || [])].filter(Boolean);
}

// Is this ingredient one of the dish's main ones (or what the title is named after)?
const norm = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
function isMain(name, r) {
  const n = norm(name); if (!n) return false;
  return (r.key || []).some((k) => { const kk = norm(k); return kk && (n === kk || n.includes(kk) || kk.includes(n)); });
}

// Find a swap for one ingredient name. → { to, why } | { leave: true } | null (no safe way around it)
function swapFor(name, hit, main, never) {
  const lower = String(name).toLowerCase();
  for (const [re, group, mainOk, alts] of SWAPS) {
    if (group && hit.group && group !== hit.group) continue;
    const m = lower.match(re); if (!m) continue;
    if (main && !mainOk) continue;
    for (const [to0, why] of alts) {
      // '+gluten-free' → "gluten-free hamburger buns" (the whole ingredient, as written), else the swap replaces the matched words
      const whole = to0.startsWith('+') ? `${to0.slice(1)} ${String(name).toLowerCase().replace(/\s*\(.*?\)/g, '').trim()}` : null;
      const to = whole || to0.replace('$&', m[0].trim()).replace('$1', (m[1] || m[0]).trim());
      if (!has(to, never)) return { to, why, from: whole ? String(name).replace(/\s*\(.*?\)/g, '').trim() : m[0].trim() };
    }
  }
  return main ? null : { leave: true };
}

const memo = new WeakMap();
/**
 * Make a recipe fit the player's list. → { ok, swaps: [{ from, to, why, leave }], recipe }
 * ok = false: something the dish is built on is on the list with no safe swap (hide it).
 * recipe: the same recipe with swapped ingredient names (and the steps that name them), or the original if nothing changed.
 */
export function adapt(r, never) {
  if (!r || !never || !never.length) return { ok: true, swaps: [], recipe: r };
  const key = (never || []).join('|');
  const m0 = memo.get(r); if (m0 && m0.key === key) return m0.out;
  const ms = matchers(never);
  const swaps = []; let ok = true; let why = null;
  const seen = new Map();   // lower name → swap result (the same ingredient appears in the list and in key/minor)
  const fix = (name, main) => {
    const lk = norm(name); if (seen.has(lk)) return seen.get(lk);
    const hit = hitIn(name, ms); if (!hit) { seen.set(lk, null); return null; }
    const s = swapFor(name, hit, main, never);
    if (!s) { if (ok) why = name; ok = false; seen.set(lk, false); return false; }
    const row = s.leave ? { from: String(name), leave: true, why: 'a small extra; the dish works without it' } : { from: s.from, to: s.to, why: s.why };
    if (!swaps.some((x) => x.from.toLowerCase() === row.from.toLowerCase())) swaps.push(row);
    seen.set(lk, s); return s;
  };
  // the title first: "Salmon Teriyaki" is a salmon dish whatever the list says
  const th = hitIn(r.title, ms);
  if (th) { const s = swapFor(th.word, th, true, never); if (!s) { ok = false; why = th.word; } }
  for (const k of r.key || []) fix(k, true);
  for (const k of r.minor || []) fix(k, false);
  for (const g of r.ingredients || []) fix(g.item, isMain(g.item, r));
  let out;
  if (!ok) out = { ok: false, swaps, recipe: r, why };
  else if (!swaps.length) out = { ok: true, swaps, recipe: r };
  else {
    const rename = (name) => { const s = seen.get(norm(name)); if (!s || s.leave) return name; return String(name).replace(new RegExp(esc(s.from), 'i'), s.to); };
    const gone = (name) => { const s = seen.get(norm(name)); return !!(s && s.leave); };
    const stepSwaps = swaps.filter((x) => !x.leave);
    const fixText = (t) => (typeof t === 'string' ? stepSwaps.reduce((acc, x) => acc.replace(new RegExp(`\\b${esc(x.from)}\\b`, 'gi'), x.to), t) : t);
    out = { ok: true, swaps, recipe: {
      ...r, adapted: swaps,
      key: (r.key || []).filter((k) => !gone(k)).map(rename),
      minor: (r.minor || []).filter((k) => !gone(k)).map(rename),
      ingredients: r.ingredients ? r.ingredients.filter((g) => !gone(g.item)).map((g) => { const to = rename(g.item); return to === g.item ? g : { ...g, item: to, swappedFrom: g.item }; }) : r.ingredients,
      steps: Array.isArray(r.steps) ? r.steps.map((s) => (Array.isArray(s) ? [fixText(s[0]), ...s.slice(1)] : fixText(s))) : r.steps
    } };
  }
  memo.set(r, { key, out });
  return out;
}
export const allowed = (recipe, never) => adapt(recipe, never).ok;
/** Just the recipes a player can see (rewritten with their swaps). */
export const fitAll = (list, never) => (!never || !never.length || !list ? list : list.reduce((acc, r) => { const a = adapt(r, never); if (a.ok) acc.push(a.recipe); return acc; }, []));
/** A short tag for a list (added to list requests so a changed setting never gets an old cached answer). */
export function nvTag(never) {
  if (!never || !never.length) return '';
  let h = 5381; for (const c of never.join('|')) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h.toString(36);
}
// The signed-in player's list, for pantry matching (lib/recipes/match.js): what's on it in the pantry doesn't count
// toward a recipe (regular spaghetti doesn't make the gluten-free version "ready"), and is never offered as a swap.
let ACTIVE = [];
export function setActiveNever(never) { ACTIVE = never || []; }
export const isUnsafe = (name, never = ACTIVE) => !!(never && never.length && has(name, never));
