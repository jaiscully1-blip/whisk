// Find a recipe from a few key words, the way you'd remember it: "steak", "chicken rice", "thai curry".
// Every word has to turn up somewhere in the recipe (its name, its main ingredients, its cuisine or type).
// Recipes you opened lately and that match come first, newest first; then name matches; then ingredient matches.
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const stem = (w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);

export function findRecipes(query, all = [], recents = [], limit = 8) {
  const words = norm(query).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
  if (!words.length || words.join('').length < 2) return [];
  const rank = new Map((recents || []).map((r, i) => [r.id, i]));
  const seen = new Set();
  const out = [];
  for (const r of [...(recents || []), ...(all || [])]) {
    if (!r || !r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    const title = norm(r.title);
    const stuff = norm([...(r.key || []), ...(r.minor || []), r.cuisine, r.type].filter(Boolean).join(' '));
    let inTitle = 0;
    let ok = true;
    for (const w of words) {
      if (title.includes(w)) inTitle += 1;
      else if (!stuff.includes(w)) { ok = false; break; }
    }
    if (!ok) continue;
    // lower is better: recents first (by how lately), then all words in the name, then some, then ingredients only
    const score = (rank.has(r.id) ? rank.get(r.id) : 100) + (inTitle === words.length ? 0 : inTitle ? 20 : 40) + (title.startsWith(words[0]) ? -1 : 0);
    out.push([score, r]);
  }
  return out.sort((a, b) => a[0] - b[0]).slice(0, limit).map((x) => x[1]);
}
