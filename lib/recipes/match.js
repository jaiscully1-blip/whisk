// Ingredient matching shared by the app and the seed script. Plain ESM, no imports.
// canon() turns a grocery name ("Long grain white rice", "Frozen shrimp") into one key ("rice", "shrimp")
// so pantry items and recipe ingredients compare the same way.

export const STAPLES = new Set(['salt', 'pepper', 'oil', 'water', 'sugar']);

const CANON = [
  [/green onion|scallion/, 'scallions'], [/chicken (broth|stock)|beef (broth|stock)|vegetable (broth|stock)|^broth|^stock|\bbroth\b|\bstock\b/, 'broth'],
  [/chicken/, 'chicken'], [/ground lamb|\blamb\b/, 'lamb'], [/sausage|andouille/, 'sausage'], [/bacon/, 'bacon'],
  [/ground pork|pork/, 'pork'], [/ground beef|\bbeef\b|steak/, 'beef'], [/shrimp|prawn/, 'shrimp'], [/salmon|\bfish\b|cod|tilapia/, 'fish'],
  [/tomato paste/, 'tomato paste'], [/tomato|passata/, 'tomatoes'],
  [/cheddar|shredded cheese|mexican cheese|monterey|colby|^cheese$/, 'cheddar'], [/cream cheese/, 'cream cheese'], [/cannellini|white bean/, 'white beans'], [/parmesan|parmigiano/, 'parmesan'], [/mozzarella/, 'mozzarella'],
  [/yog(h)?urt/, 'yogurt'], [/heavy cream|cream\b/, 'cream'], [/coconut milk/, 'coconut milk'], [/\bmilk\b/, 'milk'], [/butter|ghee/, 'butter'],
  [/rice noodle|vermicelli|rice stick/, 'rice noodles'], [/sweet potato noodle|glass noodle/, 'glass noodles'], [/\brice\b|basmati|jasmine/, 'rice'],
  [/spaghetti|macaroni|penne|\bpasta\b|linguine|fettuccine|ditalini|ziti/, 'pasta'], [/egg noodle|lo mein|^noodles$/, 'noodles'], [/lasagna/, 'lasagna sheets'], [/tortilla/, 'tortillas'], [/taco shell/, 'taco shells'],
  [/black bean/, 'black beans'], [/kidney bean|red bean/, 'kidney beans'], [/chickpea|garbanzo/, 'chickpeas'], [/lentil|\bdal\b/, 'lentils'],
  [/bell pepper/, 'bell peppers'], [/sweet potato/, 'sweet potatoes'], [/potato/, 'potatoes'], [/eggplant/, 'eggplant'], [/\beggs?\b/, 'eggs'],
  [/onion/, 'onion'], [/garlic/, 'garlic'], [/ginger/, 'ginger'], [/lemon/, 'lemon'], [/\blime/, 'lime'], [/soy sauce|tamari/, 'soy sauce'],
  [/flour/, 'flour'], [/carrot/, 'carrots'], [/cucumber/, 'cucumber'], [/spinach/, 'spinach'], [/peanut/, 'peanuts'], [/tofu/, 'tofu'],
  [/salsa/, 'salsa'], [/pita/, 'pita'], [/mushroom|shiitake/, 'mushrooms'], [/\bpeas\b/, 'peas'], [/celery/, 'celery'], [/cabbage/, 'cabbage'], [/lettuce/, 'lettuce'],
  [/bun\b|buns\b/, 'buns']
];
const STRIP = /\b(fresh|frozen|canned|can of|dry|dried|large|small|medium|shredded|grated|raw|boneless|skinless|extra virgin|plain|full fat|low-sodium|baby|silken|firm|organic|whole)\b/g;

export function canon(name) {
  const n = String(name || '').toLowerCase().replace(/\(.*?\)/g, ' ').trim();
  if (/fish sauce/.test(n)) return 'fish sauce';
  if (/olive oil|\boil\b/.test(n) && !/boil/.test(n)) return 'oil';
  for (const [re, key] of CANON) if (re.test(n)) return key;
  return n.replace(STRIP, ' ').replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim().replace(/s$/, '');
}

// Frozen meat or seafood needs thawing before cooking. Whisk reads the item's name and category.
export const MEAT = /\b(chicken|beef|pork|lamb|turkey|sausages?|bacon|shrimp|prawns?|fish|salmon|tuna|cod|tilapia|steaks?|ground|meat|wings|ribs|chops?|meatballs?|ham|duck)\b/i;
export const THAW_HOURS = 24; // in the fridge: about 24 hours per 4–5 lb (USDA)
export const isFrozen = (p) => p.category === 'Frozen' || /\bfrozen\b/i.test(p.name);
export const isFrozenMeat = (p) => isFrozen(p) && MEAT.test(p.name);
export function thawState(p, nowMs = Date.now()) {
  if (!isFrozenMeat(p) || p.status === 'out') return null;
  if (!p.thaw_started_at) return { state: 'frozen' };
  const left = THAW_HOURS * 3600e3 - (nowMs - new Date(p.thaw_started_at).getTime());
  return left > 0 ? { state: 'thawing', hoursLeft: Math.max(1, Math.ceil(left / 3600e3)) } : { state: 'thawed' };
}

// Swaps a home cook would make when they're out of something (canonical names, see canon()). 'water' and 'oil' are
// always in the house, so broth and butter can always be covered.
export const SUBS = {
  butter: ['oil'], milk: ['cream', 'yogurt', 'coconut milk', 'water'], cream: ['milk', 'yogurt', 'coconut milk'], yogurt: ['sour cream', 'milk'], 'sour cream': ['yogurt'],
  broth: ['bouillon', 'water'], pasta: ['noodles', 'ramen noodle', 'rice noodles'], noodles: ['pasta', 'ramen noodle', 'rice noodles'], 'rice noodles': ['noodles', 'pasta'],
  tortillas: ['pita', 'bread'], pita: ['tortillas', 'bread'], buns: ['bread'], bread: ['buns', 'tortillas'],
  cheddar: ['mozzarella', 'parmesan', 'cheese', 'american cheese'], mozzarella: ['cheddar'], parmesan: ['cheddar'],
  chicken: ['turkey', 'pork', 'tofu'], beef: ['pork', 'turkey', 'lamb'], pork: ['chicken', 'beef', 'turkey'], lamb: ['beef'], shrimp: ['fish', 'chicken'], fish: ['shrimp', 'tuna', 'canned tuna'],
  lemon: ['lime', 'vinegar'], lime: ['lemon', 'vinegar'], onion: ['scallions', 'shallot', 'red onion'], scallions: ['onion'], garlic: ['garlic powder'],
  tomatoes: ['tomato paste', 'salsa', 'tomato sauce'], 'tomato paste': ['tomatoes', 'tomato sauce', 'ketchup'],
  'black beans': ['kidney beans', 'white beans', 'pinto bean', 'chickpeas'], 'kidney beans': ['black beans', 'pinto bean', 'white beans'], 'white beans': ['chickpeas', 'kidney beans', 'black beans'], chickpeas: ['white beans'],
  spinach: ['kale', 'cabbage', 'collard green', 'lettuce'], cabbage: ['spinach', 'kale'], 'bell peppers': ['jalapeno', 'poblano'], 'sweet potatoes': ['potatoes'], potatoes: ['sweet potatoes'],
  'soy sauce': ['fish sauce'], 'fish sauce': ['soy sauce'], rice: ['quinoa', 'couscous'], 'cream cheese': ['sour cream']
};

/** Which of a recipe's main ingredients the pantry has, can swap (subs: [{ need, use }]), is missing, and still needs to thaw. */
export function checkRecipe(recipe, pantry, nowMs = Date.now()) {
  const inStock = pantry.filter((p) => p.status !== 'out');
  const have = new Set(inStock.map((p) => canon(p.name)));
  const byCanon = new Map(inStock.map((p) => [canon(p.name), p.name]));
  const subs = [], used = new Set();
  const missing = recipe.key.filter((k) => {
    const c = canon(k); if (STAPLES.has(c) || have.has(c)) return false;
    const alt = (SUBS[c] || []).map(canon).find((a) => (STAPLES.has(a) || a === 'water' || have.has(a)) && !used.has(a) && !recipe.key.some((x) => canon(x) === a));
    if (alt) { used.add(alt); subs.push({ need: k, use: byCanon.get(alt) || alt }); return false; }
    return true;
  });
  const frozen = inStock.filter((p) => { const t = thawState(p, nowMs); return t && t.state !== 'thawed' && recipe.key.some((k) => canon(k) === canon(p.name)); });
  return { missing, subs, frozen, ok: missing.length === 0 };
}

export const difficulty = (r) => Math.round(30 * Math.min(r.minutes, 120) / 120 + 30 * r.technique / 5 + 15 * r.prep / 5 + 15 * Math.min((r.effort_steps ?? r.steps.length) * 2, 15) / 15 + 10 * r.precision / 5);

/** Pantry-only web searches: unlimited ideas built from what you have. */
export function searchLinks(query) {
  const qs = encodeURIComponent(query + ' recipe');
  return [
    ['Google', `https://www.google.com/search?q=${qs}`], ['YouTube', `https://www.youtube.com/results?search_query=${qs}`],
    ['TikTok', `https://www.tiktok.com/search?q=${qs}`], ['Reddit', `https://www.reddit.com/search/?q=${qs}`]
  ];
}
export function pantryCombos(names, seed, count) {
  let x = (Math.abs(seed) * 2654435761 + 1) >>> 0;
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const out = []; const seen = new Set();
  for (let tries = 0; out.length < count && tries < count * 20 && names.length >= 2; tries++) {
    const k = 2 + Math.floor(rnd() * 2); const c = []; const p = [...names];
    while (c.length < k && p.length) c.push(p.splice(Math.floor(rnd() * p.length), 1)[0]);
    const key = [...c].sort().join('|'); if (seen.has(key)) continue; seen.add(key); out.push(c);
  }
  return out;
}

// Pantry items a recipe would use up that go bad within 3 days (not already expired), soonest first.
// Lists that care ("use it before it goes bad") put these recipes first.
export function usesSoon(recipe, pantry, days = 3) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const keys = new Set(recipe.key.map(canon));
  return pantry.filter((p) => p.status !== 'out' && p.expires_on && keys.has(canon(p.name)))
    .map((p) => ({ p, left: Math.round((new Date(p.expires_on + 'T00:00:00') - today) / 864e5) }))
    .filter((x) => x.left >= 0 && x.left <= days).sort((a, b) => a.left - b.left).map((x) => x.p);
}

// Everything you'd still need to buy for a recipe, in the recipe's own order: every ingredient line (salt, pepper,
// butter, thyme, garlic powder …), not just the main ones. Water is skipped. "Garlic powder" isn't covered by fresh
// garlic, and "kosher salt" / "black pepper" count as salt and pepper.
const SPICEY = /\b(powder|flakes|seasoning|dried|ground (?!beef|pork|turkey|chicken|lamb|meat|sausage))\b/;
function shopKey(name) {
  const n = String(name || '').toLowerCase().replace(/\(.*?\)/g, ' ');
  if (/\bsalt\b/.test(n) && !/salted|salt pork/.test(n)) return 'salt';
  if (/black pepper|peppercorn|^\s*pepper\s*$|white pepper/.test(n)) return 'pepper';
  return `${canon(n)}${SPICEY.test(n) ? ' ·dry' : ''}`;
}
export function shoppingNeeds(recipe, pantry) {
  const have = new Set((pantry || []).filter((p) => p.status !== 'out').map((p) => shopKey(p.name)));
  // the recipe's ingredient lines first, then any main ingredient they don't mention ("crusty bread to serve")
  const lines = [...(recipe.ingredients?.length ? recipe.ingredients.map((g) => g.item) : []), ...(recipe.key || []), ...(recipe.ingredients?.length ? [] : recipe.minor || [])];
  const seen = new Set(), out = [];
  const nLines = recipe.ingredients?.length || 0;
  for (const [i, raw] of lines.entries()) {
    const item = String(raw || '').trim(); if (!item || /^(warm |cold |hot |ice |boiling )?water\b/i.test(item)) continue;
    const k = shopKey(item); const c = canon(item);
    if (seen.has(k) || (i >= nLines && seen.has(`c:${c}`))) continue;   // an extra main ingredient only if no line already covers it
    seen.add(k); seen.add(`c:${c}`);
    if (!have.has(k)) out.push(item.charAt(0).toUpperCase() + item.slice(1));
  }
  return out;
}
