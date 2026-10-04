export const LEVELS = [
  [0, 'Kitchen Rookie'], [100, 'Toast Technician'], [250, 'Line Cook'], [450, 'Sauce Boss'], [700, 'Sous Chef'],
  [1000, 'Head Chef'], [1400, 'Air Fryer Wizard'], [1900, 'Spice Sorcerer'], [2500, 'Executive Chef'], [3200, 'Kitchen Legend']
];
export function levelFor(xp = 0) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
  const [base, title] = LEVELS[i];
  const next = LEVELS[i + 1] ? LEVELS[i + 1][0] : null;
  return { level: i + 1, title, base, next, pct: next ? Math.round(((xp - base) / (next - base)) * 100) : 100 };
}
export const CATEGORIES = ['Proteins', 'Produce', 'Dairy & Eggs', 'Carbs & Grains', 'Canned & Jarred', 'Sauces & Oils', 'Spices & Seasonings', 'Frozen', 'Baking', 'Other'];
export const fmt = (n) => Number(n || 0).toLocaleString('en-US');
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T23:59:59');
  return Math.ceil((d - new Date()) / 86400000);
}
export function freshness(item) {
  const left = daysUntil(item.expires_on);
  if (left === null) return null;
  if (left < 0) return { pct: 0, label: 'Expired', tone: 'bad' };
  if (left <= 1) return { pct: 15, label: left === 0 ? 'Today' : '1 day left', tone: 'bad' };
  if (left <= 3) return { pct: 40, label: `${left} days`, tone: 'warn' };
  if (left <= 7) return { pct: 70, label: `${left} days`, tone: 'fresh' };
  return { pct: 100, label: `${left} days`, tone: 'fresh' };
}
export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\b(fresh|large|small|chopped|diced|minced|sliced|boneless|skinless)\b/g, '').replace(/s\b/g, '').trim();
export function inPantry(pantryNames, ingredient) {
  const n = norm(ingredient);
  return pantryNames.some((p) => n && (n.includes(p) || p.includes(n)));
}
export const SEARCH_LINKS = (title) => {
  const q = encodeURIComponent(title + ' recipe');
  const tag = encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]/g, ''));
  return [
    { label: 'TikTok', href: `https://www.tiktok.com/search?q=${q}` },
    { label: 'Instagram', href: `https://www.instagram.com/explore/tags/${tag}/` },
    { label: 'YouTube', href: `https://www.youtube.com/results?search_query=${q}` }
  ];
};

// The 20 cuisines used by bingo and the passport (must match 0003_whisk_features.sql).
export const CUISINES = ['American', 'Mexican', 'Italian', 'Chinese', 'Japanese', 'Korean', 'Thai', 'Indian', 'Vietnamese', 'Mediterranean',
  'Middle Eastern', 'French', 'Greek', 'Spanish', 'Caribbean', 'Cajun', 'Southern', 'Brazilian', 'Ethiopian', 'British'];
// Same loose match as public._cuisine_match: "Northern Thai" counts for Thai.
export const cuisineMatch = (meal, cell) => { const a = String(meal || '').trim().toLowerCase(), b = cell.toLowerCase(); return !!a && (a.includes(b) || b.includes(a)); };
// Monday 00:00 local time of the current week.
export function weekStart(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
// Rough cost of cooking a home meal, used for the "saved vs takeout" estimate.
export const HOME_MEAL_COST = 5;

// Best-guess aisle for a typed item, e.g. "chicken thighs" → Proteins. Falls back to Other.
const GUESS = [
  ['Frozen', /\bfrozen\b/],
  ['Proteins', /\b(chicken|beef|pork|steak|mince|turkey|lamb|bacon|sausage|ham|fish|salmon|tuna|shrimp|prawn|tofu|tempeh|lentil|chickpea|bean)s?\b/],
  ['Dairy & Eggs', /\b(milk|cheese|cheddar|parmesan|mozzarella|yog(h)?urt|butter|egg|cream|feta)s?\b/],
  ['Frozen', /\b(ice cream|peas)\b/],
  ['Produce', /\b(apple|banana|lemon|lime|orange|onion|garlic|tomato|potato|carrot|pepper|spinach|lettuce|kale|cucumber|avocado|herb|basil|cilantro|parsley|ginger|mushroom|broccoli|zucchini|berr(y|ies)|celery|scallion)(e?s)?\b/],
  ['Carbs & Grains', /\b(bread|pasta|spaghetti|rice|noodle|tortilla|oats?|flour|quinoa|couscous|bagel|bun|wrap)s?\b/],
  ['Canned & Jarred', /\b(canned|tin(ned)?|jar|stock|broth|passata|coconut milk)\b/],
  ['Sauces & Oils', /\b(oil|vinegar|soy|sauce|ketchup|mayo(nnaise)?|mustard|honey|sriracha|pesto|dressing|salsa)\b/],
  ['Spices & Seasonings', /\b(salt|pepper(corns)?|cumin|paprika|chili|chilli|oregano|thyme|cinnamon|spice|seasoning|curry powder|turmeric)\b/],
  ['Baking', /\b(sugar|baking|yeast|vanilla|cocoa|chocolate chips?)\b/]
];
export function guessCategory(name) { const n = String(name || '').toLowerCase(); return GUESS.find(([, re]) => re.test(n))?.[0] || 'Other'; }
