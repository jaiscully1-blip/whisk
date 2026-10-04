// Free dish search. No AI and no paid API: it searches Whisk's own list of 1,787 dishes from all 193 countries.
// Type a country ("Albania", "albanian food"), a dish ("pho"), a kind of food ("sauce", "soup") or an ingredient ("chickpeas").
// Shared by the server route and Whisk Play, so it takes the data as arguments and imports nothing.

export const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// Words people use for a country that don't start with its name.
const IRREGULAR = {
  american: 'US', america: 'US', usa: 'US', us: 'US', 'united states of america': 'US', texan: 'US', southern: 'US',
  british: 'GB', english: 'GB', england: 'GB', scottish: 'GB', scotland: 'GB', welsh: 'GB', wales: 'GB', uk: 'GB', britain: 'GB', 'great britain': 'GB',
  french: 'FR', greek: 'GR', dutch: 'NL', holland: 'NL', swiss: 'CH', danish: 'DK', finnish: 'FI', irish: 'IE', spanish: 'ES', persian: 'IR',
  filipino: 'PH', pinoy: 'PH', korean: 'KR', korea: 'KR', burmese: 'MM', burma: 'MM', khmer: 'KH', congolese: 'CD', nigerian: 'NG', nigerien: 'NE',
  dominican: 'DO', emirati: 'AE', uae: 'AE', emirates: 'AE', bajan: 'BB', barbadian: 'BB', trini: 'TT', trinidadian: 'TT', turkey: 'TR', turkish: 'TR',
  malagasy: 'MG', ivorian: 'CI', 'ivory coast': 'CI', 'cote divoire': 'CI', 'cape verde': 'CV', 'cape verdean': 'CV', swazi: 'SZ', swaziland: 'SZ',
  czech: 'CZ', 'czech republic': 'CZ', macedonian: 'MK', macedonia: 'MK', kiwi: 'NZ', aussie: 'AU', lao: 'LA', laotian: 'LA', thai: 'TH', yemeni: 'YE',
  kyrgyz: 'KG', uzbek: 'UZ', kazakh: 'KZ', tajik: 'TJ', turkmen: 'TM', basotho: 'LS', mosotho: 'LS', motswana: 'BW', batswana: 'BW', salvadoran: 'SV',
  'sri lanka': 'LK', ceylon: 'LK', 'east timor': 'TL', timorese: 'TL', 'north korean': 'KP', 'south korean': 'KR', vatican: null
};
const ENDINGS = [/ians?$/, /eans?$/, /ese$/, /ans?$/, /ish$/, /ic$/, /i$/, /n$/];
const FILLER = /\b(a|an|and|with|in|for|my|some|best|easy|how to|make|food|foods|cuisine|cuisines|dish|dishes|recipe|recipes|meal|meals|traditional|classic|national|authentic|from|style|cooking|the|of)\b/g;

export function makeIndex(data, countries) {
  // data: { ISO2: [[name, type, ingredients[], about], ...] }   countries: [[iso, name, ...], ...]
  const names = countries.map((c) => ({ iso: c[0], name: c[1], f: fold(c[1]) }));
  const byIso = Object.fromEntries(countries.map((c) => [c[0], c[1]]));
  const dishes = []; const seen = new Map();
  for (const iso of Object.keys(data)) for (const [n, t, i, d] of data[iso]) {
    const key = fold(n);
    if (seen.has(key)) { const x = seen.get(key); if (!x.countries.includes(iso)) x.countries.push(iso); continue; }
    const x = { name: n, type: t, ingredients: i, about: d, countries: [iso], f: key, fi: i.map(fold), fd: fold(d) };
    seen.set(key, x); dishes.push(x);
  }
  return { data, names, byIso, dishes };
}

// "albanian food" → AL. Returns null when the words aren't a country.
export function countryOf(ix, words) {
  const f0 = fold(words); const exact0 = ix.names.find((c) => c.f === f0); if (exact0) return exact0.iso;
  const q = f0.replace(FILLER, ' ').replace(/\s+/g, ' ').trim(); if (!q) return null;
  if (q in IRREGULAR) return IRREGULAR[q];
  const exact = ix.names.find((c) => c.f === q); if (exact) return exact.iso;
  const starts = (stem) => ix.names.filter((c) => c.f.startsWith(stem)).sort((a, b) => a.f.length - b.f.length)[0];
  if (q.length >= 4) { const s = starts(q); if (s && s.f.length - q.length <= 4) return s.iso; }
  for (const re of ENDINGS) {
    if (!re.test(q)) continue;
    let stem = q.replace(re, '');
    while (stem.length >= 4) { const s = starts(stem); if (s) return s.iso; stem = stem.slice(0, -1); if (q.length - stem.length > 4) break; }
  }
  return null;
}

const TYPES = { sauce: 'sauce', sauces: 'sauce', dip: 'sauce', dips: 'sauce', condiment: 'sauce', condiments: 'sauce', salsa: 'sauce', soup: 'soup', soups: 'soup', stew: 'soup',
  dessert: 'dessert', desserts: 'dessert', sweet: 'dessert', sweets: 'dessert', cake: 'dessert', bread: 'bread', breads: 'bread', breakfast: 'breakfast', brunch: 'breakfast',
  salad: 'salad', salads: 'salad', snack: 'snack', snacks: 'snack', drink: 'drink', drinks: 'drink', beverage: 'drink', side: 'side', sides: 'side',
  'street food': 'street food', street: 'street food', main: 'main', mains: 'main', dinner: 'main', lunch: 'main' };
const sing = (w) => w.replace(/(ies)$/, 'y').replace(/(oes|ses|xes|ches|shes)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, '$1');

// Returns { country, dishes: [{ name, type, ingredients, about, countries }] } best match first.
export function searchDishes(ix, query, limit = 200) {
  const raw = fold(query).slice(0, 80); if (!raw) return { country: null, dishes: [] };
  const whole = countryOf(ix, raw);
  if (whole) return { country: whole, dishes: ix.data[whole].map(([n]) => ix.dishes.find((d) => d.f === fold(n))).filter(Boolean).slice(0, limit).map(pub) };
  // A country word inside a longer search ("mexican soup", "rice from japan") narrows to that country.
  let words = raw.replace(FILLER, ' ').split(' ').filter(Boolean); let inCountry = null;
  for (let k = 0; k < words.length && !inCountry; k++) for (const span of [2, 1]) {
    const w = words.slice(k, k + span).join(' '); const c = w.length >= 3 && countryOf(ix, w);
    if (c) { inCountry = c; words.splice(k, span); break; }
  }
  let type = null; const q2 = words.join(' ');
  if (TYPES[q2]) { type = TYPES[q2]; words = []; } else words = words.filter((w) => { if (TYPES[w] && words.length > 1) { type = TYPES[w]; return false; } return true; });
  const phrase = words.join(' ');
  if (!phrase && !type && !inCountry) return { country: null, dishes: [] };
  const terms = words.map(sing).filter((w) => w.length > 1);
  const scored = [];
  for (const d of ix.dishes) {
    if (inCountry && !d.countries.includes(inCountry)) continue;
    if (type && d.type !== type) continue;
    let s = 0;
    if (phrase) {
      if (d.f === phrase) s += 200; else if (d.f.startsWith(phrase)) s += 120; else if ((' ' + d.f + ' ').includes(' ' + phrase)) s += 90; else if (d.f.includes(phrase)) s += 50;
      let all = true;
      for (const t of terms) {
        const inName = (' ' + d.f).includes(' ' + t); const inIng = d.fi.some((x) => (' ' + x).includes(' ' + t)); const inAbout = (' ' + d.fd).includes(' ' + t);
        if (inName) s += 30; if (inIng) s += 18; if (inAbout) s += 8; if (!inName && !inIng && !inAbout) all = false;
      }
      if (!all && s < 50) continue;
      if (!s) continue;
    } else s = 1;
    scored.push([s, d]);
  }
  scored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name));
  return { country: inCountry, dishes: scored.slice(0, limit).map(([, d]) => pub(d)) };
}
const pub = (d) => ({ name: d.name, type: d.type, ingredients: d.ingredients, about: d.about, countries: d.countries });

export function findDish(ix, name) { const f = fold(name); const d = ix.dishes.find((x) => x.f === f); return d ? pub(d) : null; }

// Bingo cells match on a meal's cuisine text, so a dish meal carries the bingo words for its country (same as the database list).
const BINGO = { US: 'American Southern', MX: 'Mexican', IT: 'Italian Mediterranean', CN: 'Chinese', JP: 'Japanese', KR: 'Korean', TH: 'Thai', IN: 'Indian', VN: 'Vietnamese', FR: 'French', GR: 'Greek Mediterranean', ES: 'Spanish Mediterranean', BR: 'Brazilian', ET: 'Ethiopian', GB: 'British',
  JM: 'Caribbean', CU: 'Caribbean', TT: 'Caribbean', BB: 'Caribbean', BS: 'Caribbean', DO: 'Caribbean', HT: 'Caribbean', DM: 'Caribbean', GD: 'Caribbean', KN: 'Caribbean', LC: 'Caribbean', VC: 'Caribbean', AG: 'Caribbean',
  LB: 'Middle Eastern Mediterranean', SY: 'Middle Eastern', JO: 'Middle Eastern', IQ: 'Middle Eastern', IL: 'Middle Eastern Mediterranean', SA: 'Middle Eastern', AE: 'Middle Eastern', YE: 'Middle Eastern', OM: 'Middle Eastern', QA: 'Middle Eastern', KW: 'Middle Eastern', BH: 'Middle Eastern', IR: 'Middle Eastern',
  TR: 'Mediterranean Middle Eastern', CY: 'Mediterranean', MT: 'Mediterranean', HR: 'Mediterranean', TN: 'Mediterranean', MA: 'Mediterranean' };
export const cuisineFor = (iso, countryName) => (countryName + (BINGO[iso] ? ' · ' + BINGO[iso] : '')).slice(0, 40);
