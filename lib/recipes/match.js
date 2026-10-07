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

/** Which of a recipe's main ingredients the pantry has, is missing, and still needs to thaw. */
export function checkRecipe(recipe, pantry, nowMs = Date.now()) {
  const inStock = pantry.filter((p) => p.status !== 'out');
  const have = new Set(inStock.map((p) => canon(p.name)));
  const missing = recipe.key.filter((k) => { const c = canon(k); return !STAPLES.has(c) && !have.has(c); });
  const frozen = inStock.filter((p) => { const t = thawState(p, nowMs); return t && t.state !== 'thawed' && recipe.key.some((k) => canon(k) === canon(p.name)); });
  return { missing, frozen, ok: missing.length === 0 };
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
