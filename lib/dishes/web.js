import 'server-only';
import { fold } from './search';

// Free outside sources only (no AI, no paid API):
//  • Wikipedia, for dishes that aren't in Whisk's own list (free, no key).
//  • YouTube Data API, to pick a video (free tier: 10,000 units a day; one new dish costs 101 units, so ~99 new dishes a day.
//    Every answer is cached for a week and shared by all players, so popular dishes cost nothing after the first look).
// Both base URLs can be pointed at a local stand-in for tests.
const WIKI = () => process.env.WIKI_API_URL || 'https://en.wikipedia.org/w/api.php';
const YT = () => process.env.YOUTUBE_API_URL || 'https://www.googleapis.com/youtube/v3';
const UA = 'WhiskCookingGame/1.0 (+https://github.com/jaiscully1-blip/whisk)';
const WEEK = 7 * 86400;

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA, Accept: 'application/json' }, next: { revalidate: WEEK }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.status = res.status; throw e; }
  return res.json();
}

const FOOD_CAT = /\b(dishes|foods|cuisine|sauces|condiments|soups|stews|breads|desserts|pastries|cakes|cookies|biscuits|snack foods|street food|salads|dips|noodles|sandwiches|dumplings|curries|puddings|confectionery|spreads|beverages|cocktails|cheeses)\b/i;
const NOT_DISH = /^(list of|outline of|history of|cuisine of)|\bcuisine$|\b(restaurant|chef|company|brand|festival|album|song|film)\b/i;
export function typeFrom(text) {
  const t = String(text || '').toLowerCase();
  if (/sauce|condiment|\bdip\b|dressing|salsa|paste|relish|chutney/.test(t)) return 'sauce';
  if (/soup|stew|broth|chowder/.test(t)) return 'soup';
  if (/dessert|cake|pastry|pastries|sweet|cookie|biscuit|pudding|confection|pie\b|tart/.test(t)) return 'dessert';
  if (/bread|flatbread|bun\b|roll\b/.test(t)) return 'bread';
  if (/salad/.test(t)) return 'salad';
  if (/drink|beverage|cocktail|\btea\b|coffee|juice/.test(t)) return 'drink';
  if (/snack|street food/.test(t)) return 'snack';
  return 'main';
}

// Dishes on Wikipedia matching the words. Only articles filed under food categories count.
export async function wikiDishes(q) {
  const u = new URL(WIKI());
  u.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', generator: 'search', gsrsearch: q, gsrlimit: '20', gsrnamespace: '0', prop: 'categories|description', cllimit: 'max', clshow: '!hidden', origin: '*' });
  const j = await getJson(u);
  const pages = (j?.query?.pages || []).slice().sort((a, b) => (a.index || 0) - (b.index || 0));
  return pages
    .filter((p) => p && Number.isInteger(p.pageid) && typeof p.title === 'string' && !NOT_DISH.test(p.title) && (p.categories || []).some((c) => FOOD_CAT.test(String(c.title || ''))))
    .slice(0, 15)
    .map((p) => ({ name: p.title.replace(/\s*\(.*\)$/, '').slice(0, 80), type: typeFrom(p.description), ingredients: [], about: String(p.description || '').slice(0, 80), countries: [], wiki: p.pageid }));
}

// Main ingredients from a dish article's infobox ("main_ingredient = ...").
export function ingredientsFromWikitext(text) {
  const m = String(text || '').match(/\|\s*main[_ ]ingredients?\s*=\s*([\s\S]*?)(?=\n\s*\||\n\}\})/i); if (!m) return [];
  let v = m[1].replace(/<ref[^>]*\/>/gi, '').replace(/<ref[\s\S]*?<\/ref>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  v = v.replace(/\{\{\s*(?:hlist|flatlist|plainlist|ubl|unbulleted list)\s*\|([\s\S]*?)\}\}/gi, (_, x) => x.replace(/\|/g, ','));
  v = v.replace(/\{\{[\s\S]*?\}\}/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/<br\s*\/?>/gi, ',').replace(/'''?/g, '');
  return [...new Set(v.split(/[,;*\n]|\band\b|\bor\b/).map((x) => x.replace(/\(.*?\)/g, '').replace(/[^\p{L}\p{N} '-]/gu, '').trim().toLowerCase()).filter((x) => x.length > 1 && x.length < 40))].slice(0, 9);
}
export async function wikiIngredients(pageid) {
  const u = new URL(WIKI());
  u.search = new URLSearchParams({ action: 'parse', format: 'json', formatversion: '2', pageid: String(pageid), prop: 'wikitext', section: '0', origin: '*' });
  const j = await getJson(u);
  return ingredientsFromWikitext(j?.parse?.wikitext);
}

// The most-watched video that is really about this dish. Popular dishes get their big videos;
// a very specific dish gets whatever smaller video actually matches. Nothing matching → null (button greys out).
const STOP = new Set(['a', 'al', 'and', 'the', 'with', 'de', 'del', 'di', 'da', 'do', 'la', 'le', 'les', 'el', 'en', 'e', 'of', 'in', 'du', 'des', 'au', 'aux', 'y', 'con', 'na', 'ng']);
export const videoId = (id) => (typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null);
export function pickVideo(dish, items) {
  const words = fold(dish).split(' ').filter((w) => w && !STOP.has(w));
  const need = words.length <= 2 ? words.length : Math.ceil(words.length * 0.6);
  let best = null;
  for (const v of items || []) {
    const id = videoId(v?.id); if (!id) continue;
    const text = ' ' + fold(`${v.snippet?.title || ''} ${(v.snippet?.tags || []).join(' ')}`) + ' ';
    const hit = words.filter((w) => text.includes(' ' + w) || (w.length > 4 && text.includes(w.slice(0, -1)))).length;
    if (!words.length || hit < need) continue;
    const views = Number(v.statistics?.viewCount || 0);
    if (!best || views > best.views) best = { url: `https://www.youtube.com/watch?v=${id}`, title: String(v.snippet?.title || '').slice(0, 120), channel: String(v.snippet?.channelTitle || '').slice(0, 60), views };
  }
  return best;
}
export async function bestVideo(dish) {
  const key = process.env.YOUTUBE_API_KEY; if (!key) return { configured: false };
  const s = new URL(YT() + '/search');
  s.search = new URLSearchParams({ part: 'snippet', q: `${dish} recipe`, type: 'video', maxResults: '15', safeSearch: 'strict', key });
  const found = await getJson(s);
  const ids = (found?.items || []).map((x) => videoId(x?.id?.videoId)).filter(Boolean);
  if (!ids.length) return { configured: true, video: null };
  const d = new URL(YT() + '/videos');
  d.search = new URLSearchParams({ part: 'snippet,statistics', id: ids.join(','), key });
  const det = await getJson(d);
  return { configured: true, video: pickVideo(dish, det?.items) };
}
export const youtubeSearchUrl = (dish) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${dish} recipe`)}`;
