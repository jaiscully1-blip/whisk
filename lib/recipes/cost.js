// Rough cost of a recipe per serving (US grocery prices, 2026), from its main ingredients. Each price is about what
// one recipe's worth of that ingredient costs (not the whole package). It's an estimate to sort by, not a receipt.
import { canon, difficulty } from './match.js';

const PRICE = [
  [/lobster/, 25], [/steak|beef tenderloin|filet|ribeye|strip/, 14], [/cognac|brandy/, 6], [/lamb|goat/, 9], [/shrimp|prawn/, 9], [/salmon(?! can)|fish|cod|tilapia/, 7],
  [/beef/, 6], [/chicken/, 5], [/pork|ham hock|ham\b/, 5], [/smoked turkey|turkey/, 5], [/sausage|bacon|chorizo/, 4.5], [/spam|canned salmon|corned beef/, 4], [/hot dog|frank|bologna/, 3],
  [/tuna/, 1.5], [/tofu/, 2.5], [/egg/, 1.5],
  [/parmesan|pecorino|gruy/, 3], [/cheddar|mozzarella|cheese/, 2.5], [/cream cheese|sour cream|heavy cream|cream/, 2.5], [/yogurt/, 1.5], [/butter|ghee/, 1.2], [/milk|buttermilk/, 1],
  [/ramen/, 0.6], [/rice|cornmeal|grits|flour|oats/, 0.7], [/pasta|noodles|macaroni|spaghetti|linguine/, 1.5], [/bread|buns|biscuit|tortilla|pita/, 2.5],
  [/bean|lentil|chickpea|pea\b|peas|dal/, 1], [/potato|cassava|plantain|yam/, 1.5], [/cabbage|carrot|onion|celery/, 0.8], [/garlic|ginger|scallion|chili|jalape/, 0.5],
  [/tomato paste|tomato sauce/, 0.8], [/tomato/, 2], [/spinach|kale|collard|greens|leaves|lettuce/, 2.5], [/mushroom/, 2.5], [/bell pepper|pepper/, 1.5], [/avocado/, 2],
  [/lemon|lime/, 0.5], [/broth|stock|bouillon/, 1.5], [/coconut milk/, 2], [/palm oil|peanut butter|peanut/, 1], [/soy sauce|fish sauce|vinegar/, 0.3], [/kimchi/, 3], [/wine/, 4]
];
const priceOf = (name) => { const n = String(name).toLowerCase(); for (const [re, p] of PRICE) if (re.test(n)) return p; return canon(n) ? 1.5 : 0; };

const memo = new Map();
export function costPerServing(r) {
  if (memo.has(r.id)) return memo.get(r.id);
  const total = (r.key || []).reduce((s, k) => s + priceOf(k), 0) + 0.6;   // + oil, salt and spices
  const v = Math.max(0.5, total / Math.max(1, r.servings || 4));
  memo.set(r.id, v); return v;
}
// $ Pocket change · $$ Weeknight · $$$ Treat yourself · $$$$ Big spender
export const PRICE_TIERS = [
  { id: 1, tag: '$', name: 'Pocket change', note: 'under $2', max: 2 },
  { id: 2, tag: '$$', name: 'Weeknight', note: '$2–4', max: 4 },
  { id: 3, tag: '$$$', name: 'Treat yourself', note: '$4–7', max: 7 },
  { id: 4, tag: '$$$$', name: 'Big spender', note: '$7+', max: Infinity }
];
export const priceTier = (r) => PRICE_TIERS.find((t) => costPerServing(r) < t.max).id;

// how hard: from the recipe's time, technique, prep, steps and precision (0–100)
export const LEVELS = [
  { id: 'any', name: 'Any', flames: 0 },
  { id: 'easy', name: 'Easy', flames: 1, test: (s) => s < 38 },
  { id: 'medium', name: 'Medium', flames: 2, test: (s) => s >= 38 && s < 55 },
  { id: 'chef', name: 'Chef mode', flames: 3, test: (s) => s >= 55 }
];
export const scoreOf = (r) => (Number.isFinite(r.score) ? r.score : (() => { try { return difficulty(r); } catch { return 40; } })());
export const levelOf = (r) => LEVELS.slice(1).find((l) => l.test(scoreOf(r))).id;
