// Reads a cooking video's description (free, no AI): its chapters ("3:10 Make the sauce"), the ingredient list and the
// written steps when the YouTuber included them, and a link to the full recipe. Also judges whether a video is about
// cooking at all, so vlogs, Q&As and announcements stay off the channel page. Pure functions: shared by the app and
// Whisk Play. Nothing here is invented: if the description has no recipe, the result says so.

const STAMP = /^[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?\s*(?:[-–—:|•·]\s*)?(.{2,90})$/;
const STAMP_END = /^(.{2,90}?)\s*[-–—:|•·]?\s*[([]?((?:\d{1,2}:)?\d{1,2}:\d{2})[)\]]?$/;
const NOT_COOKING = /\b(intro(duction)?|hello|welcome|sponsor(ed)?|ad\b|advert|thanks?|thank you|outro|subscribe|merch|giveaway|channel update|bloopers?|q\s*&\s*a|end(ing)?|credits)\b/i;
const AFTER_COOKING = /\b(taste test|tasting|verdict|review|final thoughts|outro|end screen|bloopers?|thanks for watching|see you)\b/i;
const ING_HEAD = /^(?:\W{0,3})(ingredients?|ingredient list|you(?:'|’)?ll need|what you need|shopping list)\b[^a-z]*$/i;
const STEP_HEAD = /^(?:\W{0,3})(method|instructions?|directions?|steps?|how to make(?: it)?|preparation|procedure)\b[^a-z]*$/i;
const GROUP = /^(?:\W{0,3})(for the [^:]{2,30}|[a-z][a-z ]{2,24}):\s*$/i;
const QTY = /^(?:[-•*·▪︎▫️✔️]\s*)?(?:\d+(?:[./,]\d+)?|\d+\s*[-–]\s*\d+|[½¼¾⅓⅔⅛]|a |an |one |two |three |half )\s*(?:[½¼¾⅓⅔⅛])?\s*(?:g|kg|grams?|ml|l|litres?|liters?|cups?|c\.|tbsps?|tbs|tsps?|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|cloves?|pinch(?:es)?|cans?|tins?|sticks?|slices?|large|medium|small|whole|bunch(?:es)?|handful|sprigs?|x)?\b/i;
const SOCIAL = /(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitter\.com|x\.com|facebook\.com|patreon\.com|discord\.gg|twitch\.tv|linktr\.ee|amzn\.to|amazon\.|spotify\.com|threads\.net|snapchat\.com|bit\.ly\/merch|shop\.|merch)/i;
const URL_RE = /https:\/\/[^\s<>"')\]]+/g;
const STOP = /^(follow|subscribe|my (socials?|gear|equipment|cookbook|book)|music|business|contact|sponsor|links?|instagram|tiktok|twitter|facebook|patreon|merch|#|—{2,}|-{3,}|_{3,}|\*{3,})/i;

export const toSeconds = (s) => s.split(':').map(Number).reduce((a, n) => a * 60 + n, 0);
const clean = (l) => l.replace(/^\s*(?:[-•*·▪︎▫️✔️➡️👉]+|\d{1,2}[.)]|step\s*\d+\s*[:.)-]?)\s*/i, '').replace(/\s+/g, ' ').trim();

export function parseDescription(desc) {
  const lines = String(desc || '').slice(0, 6000).split(/\r?\n/).map((l) => l.trim());
  const chapters = [];
  for (const l of lines) {
    let m = l.match(STAMP); if (m) { chapters.push({ t: toSeconds(m[1]), title: clean(m[2]).slice(0, 80) }); continue; }
    m = l.match(STAMP_END); if (m && !/^https?:/i.test(l)) chapters.push({ t: toSeconds(m[2]), title: clean(m[1]).slice(0, 80) });
  }
  // A real chapter list starts at 0:00 and goes up; anything else is just a time mentioned in passing.
  const ch = chapters.length >= 2 && chapters[0].t === 0 && chapters.every((c, i) => i === 0 || c.t > chapters[i - 1].t) ? chapters : [];

  const ingredients = []; const steps = []; let mode = null; let group = null; let blank = 0;
  for (const raw of lines) {
    if (!raw) { blank++; if (blank >= 2 && mode) mode = null; continue; }
    blank = 0;
    if (ING_HEAD.test(raw)) { mode = 'ing'; group = null; continue; }
    if (STEP_HEAD.test(raw)) { mode = 'step'; continue; }
    if (STOP.test(raw) || /https?:\/\//.test(raw) || STAMP.test(raw)) { if (mode) mode = null; continue; }
    if (mode === 'ing') {
      const g = raw.match(GROUP); if (g) { group = g[1].replace(/^for the /i, 'For the ').slice(0, 30); continue; }
      if (raw.length <= 90) ingredients.push({ text: clean(raw).slice(0, 90), group });
      continue;
    }
    if (mode === 'step') { if (raw.length >= 6) steps.push(clean(raw).slice(0, 400)); continue; }
    // No heading: lines that start with an amount still count as ingredients ("2 cups flour").
    if (QTY.test(raw) && raw.length <= 80 && !/[.!?]$/.test(raw.replace(/\b(tsp|tbsp|oz|lb|g|ml)\.$/i, ''))) ingredients.push({ text: clean(raw), group: null });
  }

  const cooking = ch.filter((c) => !NOT_COOKING.test(c.title) && !AFTER_COOKING.test(c.title));
  const firstCook = cooking[0] || null;
  const afterIdx = firstCook ? ch.findIndex((c) => c.t > firstCook.t && AFTER_COOKING.test(c.title)) : -1;
  const end = afterIdx > 0 ? ch[afterIdx].t : null;

  // The full recipe: a link on a line that says "recipe", else the first link that isn't social media or shopping.
  let link = null;
  for (const l of lines) { const u = (l.match(URL_RE) || []).find((x) => !SOCIAL.test(x)); if (u && /recipe/i.test(l)) { link = u; break; } }
  if (!link) for (const l of lines) { const u = (l.match(URL_RE) || []).find((x) => !SOCIAL.test(x)); if (u) { link = u; break; } }
  if (link) { try { const x = new URL(link); link = x.protocol === 'https:' ? x.href.slice(0, 300) : null; } catch { link = null; } }

  return {
    chapters: ch,
    cookStart: firstCook ? firstCook.t : 0,
    cookEnd: end,
    // Written steps from the description; else the cooking chapters, so the screen still walks through the video.
    steps: steps.length >= 2 ? steps.map((text) => ({ text, t: null })) : cooking.map((c) => ({ text: c.title, t: c.t })),
    stepsFrom: steps.length >= 2 ? 'description' : cooking.length ? 'chapters' : null,
    ingredients: ingredients.length >= 2 ? ingredients.slice(0, 60) : [],
    link
  };
}

const YES = /\b(recipes?|cook(ing|ed)?|bake[sd]?|baking|fr(y|ied|ies)|grill(ed)?|roast(ed)?|braise[d]?|sauce|soup|stew|curry|pasta|noodles?|ramen|chicken|beef|pork|steak|fish|salmon|shrimp|tofu|rice|bread|cake|cookies?|pie|pizza|burger|tacos?|sandwich|salad|breakfast|dinner|lunch|dessert|meal|dish|kitchen|homemade|how to make|ingredients?|tbsp|tsp|cups?|grams?)\b/i;
const NO = /\b(vlog|q\s*&\s*a|podcast|reacts?|reaction|unboxing|haul|tier list|merch|giveaway|livestream|live stream|trailer|announcement|channel update|behind the scenes|bloopers|my (wedding|house|car)|travel vlog|mukbang)\b/i;
// Is this video about cooking? (A recipe or chapters in the description count for a lot.)
export function isCooking(v, parsed) {
  const text = `${v.title || ''}\n${String(v.description || '').slice(0, 1500)}`;
  if (NO.test(v.title || '')) return false;
  if (parsed && (parsed.ingredients.length || parsed.stepsFrom === 'description')) return true;
  return YES.test(text);
}
