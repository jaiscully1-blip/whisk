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
