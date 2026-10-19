// Levels 0-100. A player who earns about 300 XP a day (a good cooking day) reaches Level 100 in about a year:
// Level 100 = 109,500 XP. Level 1 is your first meal (100 XP). From there the gaps grow slowly (the "marathon" ramp),
// so the early levels come fast and the late ones are earned. XP amounts live in the database (economy_rules).
export const MAX_LEVEL = 100;
export const LEVEL_100_XP = 109500;
const gapRaw = (k) => 120 + 10 * Math.pow(k, 1.5);
function build() {
  let raw = 0; for (let k = 2; k <= MAX_LEVEL; k++) raw += gapRaw(k);
  const scale = (LEVEL_100_XP - 100) / raw;
  const step = (x) => (x < 1000 ? 10 : x < 10000 ? 50 : 100);
  const xp = [0, 100]; let acc = 100;
  for (let k = 2; k <= MAX_LEVEL; k++) { acc += gapRaw(k) * scale; const st = step(acc); xp.push(Math.max(xp[k - 1] + st, Math.round(acc / st) * st)); }
  xp[MAX_LEVEL] = LEVEL_100_XP;
  return xp;
}
// The name tag changes every ten levels. Levels 90-94 and 95-99 are the two top tags before the last level.
const TAGS = [
  [0, 'Kitchen Rookie'], [1, 'Air Fryer Enthusiast'], [10, 'Toast Technician'], [20, 'Butter Baron'], [30, 'Sizzle Sensei'],
  [40, 'Oven Whisperer'], [50, 'Flavor Dealer'], [60, 'Snack Smuggler'], [70, 'Spice Fiend'], [80, 'Kitchen Menace'],
  [90, 'Grill Gremlin'], [95, 'Wok Wizard'], [100, 'Grandmaster of Grub']
];
export const tagFor = (level) => { let t = TAGS[0][1]; for (const [from, name] of TAGS) if (level >= from) t = name; return t; };
// Name-pill colour: the last digit of your level (0 plain white, 1 bronze, 2 silver, 3 gold, 4 emerald, 5 sapphire,
// 6 ruby, 7 amethyst, 8 rose gold, 9 platinum). Level 100 gets the rainbow "legend" pill.
export const tierFor = (level) => (level >= MAX_LEVEL ? 'legend' : String(level % 10));
export const LEVELS = build().map((xp, level) => [level, xp, tagFor(level)]);   // [level, xp to reach it, title]
export function levelFor(xp = 0) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][1]) i++;
  const [level, base, title] = LEVELS[i];
  const next = LEVELS[i + 1] ? LEVELS[i + 1][1] : null;
  return { level, title, base, next, tier: tierFor(level), pct: next ? Math.floor(((xp - base) / (next - base)) * 100) : 100 };
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

// Best-guess aisle for a typed item, e.g. "chicken thighs" → Proteins. Falls back to Other. The rules live in lib/pantry/rules.js.
export { guessCategory, isGrocery, categorizeProduct, shelve, learn as learnAisle, catKey } from './pantry/rules.js';

/** The player's calendar date (YYYY-MM-DD) in their time zone; UTC if they didn't allow local time. */
export function localDate(tz, d = new Date()) { try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); } catch { return d.toISOString().slice(0, 10); } }
/** Day 1 is the day you first opened Yoke. Opening and closing the app never changes it; midnight does. */
export function dayNumber(profile) {
  const tz = profile?.time_zone || 'UTC';
  const raw = profile?.first_open_date || (profile?.first_login_at ? localDate(tz, new Date(profile.first_login_at)) : null);
  const first = raw ? String(raw).slice(0, 10) : null;
  if (!first || !/^\d{4}-\d{2}-\d{2}$/.test(first)) return 1;
  return Math.max(1, Math.round((Date.parse(localDate(tz) + 'T00:00:00Z') - Date.parse(first + 'T00:00:00Z')) / 864e5) + 1);
}
