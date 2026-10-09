// Turns the text read off a grocery receipt into pantry items. Pure and offline: no AI, nothing leaves the phone.
// Receipts print short codes ("GV WHL MLK 1G", "BNLS SKNLS CHKN BRST"), so each line is cleaned (prices, item
// numbers, tax flags and sizes come off), the common store abbreviations are spelled out, and the line is kept if
// it names a food. Anything it can't make sense of still shows up, unticked, for the player to fix or skip.
import { guessCategory, isGrocery } from '../game.js';

// Lines that are never groceries: totals, payment, store info, savings, bags.
const SKIP = /\b(sub ?total|total|tax|balance|change|cash|tender|visa|master ?card|amex|discover|debit|credit|card|ebt|snap|auth|approval|approved|ref(erence)?|trans(action)?|terminal|term|cashier|register|lane|store|manager|phone|tel|www|http|\.com|thank|receipt|survey|feedback|return|policy|items? sold|# ?items|savings?|saved|you saved|coupon|discount|promo|rewards?|points?|member|loyalty|club card|bag fee|bags?|bottle dep|deposit|crv|refund|void|price override|regular price|was \$?|date|time|open|hours|welcome|customer|copy|signature|chip read|contactless|aid|tvr|tsi|pin|verified)\b/i;
// The store's own brand and loyalty prefixes, dropped from the front of an item ("GV" Great Value, "KS" Kirkland…)
const BRANDS = new Set(['gv', 'ks', 'ksig', 'mm', 'heb', 'pub', 'publix', 'kro', 'krog', 'kroger', 'tj', 'tjs', 'gg', 'sb', 'hh', 'wf', '365', 'wfm', 'smrt', 'sig', 'sel', 'fs', 'cs', 'pc', 'bc', 'mkt', 'mp', 'clx', 'aldi', 'lidl', 'eg', 'ec', 'fm', 'mrkt']);
// Store abbreviations, spelled out. Keys are lowercase words as printed; values are what a person would say.
const ABBR = {
  // dairy and eggs
  mlk: 'milk', mk: 'milk', whl: 'whole', wh: 'whole', skm: 'skim', '2pct': '2%', rf: 'reduced fat', lf: 'low fat', ff: 'fat free', chs: 'cheese', chz: 'cheese', ches: 'cheese', ched: 'cheddar', chdr: 'cheddar', mozz: 'mozzarella', parm: 'parmesan', shrd: 'shredded', shred: 'shredded', sl: 'sliced', slcd: 'sliced', amer: 'american', ygrt: 'yogurt', yog: 'yogurt', yogt: 'yogurt', grk: 'greek', btr: 'butter', bttr: 'butter', unsltd: 'unsalted', sltd: 'salted', crm: 'cream', hvy: 'heavy', whp: 'whipping', sr: 'sour', cr: 'cream', egg: 'eggs', eggs: 'eggs', lg: 'large', xlg: 'extra large', dz: 'dozen', doz: 'dozen', hlf: 'half', hf: 'half', cot: 'cottage',
  // meat and fish
  chkn: 'chicken', chk: 'chicken', ckn: 'chicken', chick: 'chicken', bnls: 'boneless', bnl: 'boneless', sknls: 'skinless', skls: 'skinless', brst: 'breast', bst: 'breast', thgh: 'thighs', thg: 'thighs', thi: 'thighs', drmstk: 'drumsticks', wng: 'wings', wngs: 'wings', grnd: 'ground', grd: 'ground', gr: 'ground', bf: 'beef', bef: 'beef', pk: 'pork', prk: 'pork', chp: 'chops', chps: 'chops', stk: 'steak', rbeye: 'ribeye', sirl: 'sirloin', tky: 'turkey', trky: 'turkey', bcn: 'bacon', sausg: 'sausage', saus: 'sausage', ssg: 'sausage', hm: 'ham', slmn: 'salmon', salm: 'salmon', shrmp: 'shrimp', shrp: 'shrimp', tilap: 'tilapia', tna: 'tuna', fsh: 'fish', frks: 'franks', hotdg: 'hot dogs',
  // produce
  bnna: 'bananas', ban: 'bananas', bana: 'bananas', bnns: 'bananas', appl: 'apples', apls: 'apples', org: '', orgnc: '', organic: '', tom: 'tomatoes', toms: 'tomatoes', tmto: 'tomatoes', onn: 'onions', onio: 'onions', yel: 'yellow', ylw: 'yellow', wht: 'white', rd: 'red', grn: 'green', pot: 'potatoes', pots: 'potatoes', ptto: 'potatoes', rsst: 'russet', swt: 'sweet', avoc: 'avocado', avo: 'avocado', lmn: 'lemons', lme: 'limes', grlc: 'garlic', grlic: 'garlic', gng: 'ginger', brcc: 'broccoli', broc: 'broccoli', lett: 'lettuce', rom: 'romaine', spin: 'spinach', spnch: 'spinach', crt: 'carrots', crrt: 'carrots', carr: 'carrots', cel: 'celery', cuc: 'cucumber', cuke: 'cucumber', mush: 'mushrooms', mshrm: 'mushrooms', bell: 'bell', pep: 'peppers', ppr: 'peppers', pepr: 'peppers', jal: 'jalapeno', cil: 'cilantro', strwb: 'strawberries', strw: 'strawberries', blub: 'blueberries', blueb: 'blueberries', rasp: 'raspberries', grp: 'grapes', grps: 'grapes', orng: 'oranges', ornge: 'oranges', pnapl: 'pineapple', wmln: 'watermelon', sld: 'salad', prdc: '', prod: '', vegg: 'vegetables', veg: 'vegetables', vgt: 'vegetables', frt: 'fruit',
  // pantry
  brd: 'bread', brea: 'bread', wht_brd: 'white bread', whtbrd: 'white bread', wht_wht: 'whole wheat', ww: 'whole wheat', whl_wht: 'whole wheat', tort: 'tortillas', trtla: 'tortillas', rce: 'rice', ric: 'rice', jsm: 'jasmine', bsmt: 'basmati', pst: 'pasta', psta: 'pasta', spag: 'spaghetti', spgti: 'spaghetti', mac: 'macaroni', ndl: 'noodles', ndls: 'noodles', crl: 'cereal', cer: 'cereal', oatml: 'oatmeal', flr: 'flour', flo: 'flour', ap: 'all-purpose', sgr: 'sugar', sug: 'sugar', brn: 'brown', bns: 'beans', bn: 'beans', blk: 'black', pnto: 'pinto', kdny: 'kidney', chkpea: 'chickpeas', sp: 'soup', brth: 'broth', bth: 'broth', stck: 'stock', sce: 'sauce', sauc: 'sauce', sc: 'sauce', tom_sce: 'tomato sauce', pste: 'paste', pnt: 'peanut', pb: 'peanut butter', jly: 'jelly', ketch: 'ketchup', ktchp: 'ketchup', mayo: 'mayonnaise', mstrd: 'mustard', vin: 'vinegar', vngr: 'vinegar', evoo: 'extra virgin olive oil', olv: 'olive', ol: 'oil', veg_oil: 'vegetable oil', cnla: 'canola', soy: 'soy', hny: 'honey', syr: 'syrup', slt: 'salt', ppr_blk: 'black pepper', snsg: 'seasoning', ssn: 'seasoning', spc: 'spice', cin: 'cinnamon', cumn: 'cumin', pprk: 'paprika', vanl: 'vanilla', bkg: 'baking', sda: 'soda', pwdr: 'powder', yst: 'yeast', crn: 'corn', frz: 'frozen', frzn: 'frozen', fz: 'frozen', ic: 'ice', icecrm: 'ice cream', pza: 'pizza', piz: 'pizza', chp_s: 'chips', chps_: 'chips', crkr: 'crackers', cof: 'coffee', cff: 'coffee', jce: 'juice', jc: 'juice', oj: 'orange juice', wtr: 'water'
};
// sizes and counts on the line become the quantity ("1G" → 1 gal, "16OZ" → 16 oz, "12CT" → 12 ct)
const SIZE = /\b(\d+(?:\.\d+)?)\s?(oz|fl ?oz|lb|lbs|g|gal|gl|ga|qt|pt|ml|l|ltr|kg|ct|pk|pck|ea)\b/i;
const UNIT = { g: 'gal', gl: 'gal', ga: 'gal', ltr: 'l', lbs: 'lb', pck: 'pk', 'fl oz': 'fl oz', floz: 'fl oz' };

function titleCase(s) { return s.replace(/\b([a-z])([a-z']*)/g, (_, a, b) => a.toUpperCase() + b).replace(/\b(And|Of|With)\b/g, (w) => w.toLowerCase()); }

export function parseLine(raw) {
  let line = String(raw || '').replace(/[|_~`^*=<>{}[\]\\()]/g, ' ').replace(/\s+/g, ' ').trim();
  // common misreads on receipt paper: "80Z" → 8 oz, "1b" → lb, "[OTAL" → total
  line = line.replace(/(\d)\s?[0O]Z\b/gi, '$1 oz').replace(/(\d|\/)\s?1b\b/gi, '$1 lb');
  if (!line || SKIP.test(line) || /\b\W?otal\b|\bubtotal\b|\d+(\.\d+)?\s?%/i.test(line)) return null;
  // weighed items: "1.23 lb @ 2.99 /lb"
  let quantity = null;
  const weighed = line.match(/(\d+(?:\.\d+)?)\s?(lb|lbs|kg)\s?@/i);
  if (weighed) { quantity = `${weighed[1]} ${weighed[2].toLowerCase().replace('lbs', 'lb')}`; line = line.replace(/(\d+(?:\.\d+)?)\s?(lb|lbs|kg)\s?@.*$/i, ''); }
  // "2 @ 1.99" or "QTY 2"
  const multi = line.match(/(?:^|\s)(\d{1,2})\s?@\s?\$?\d+[.,]\d{2}/) || line.match(/\bqty\.?\s?(\d{1,2})\b/i);
  if (multi) { quantity = quantity || `x${multi[1]}`; line = line.replace(/(?:^|\s)\d{1,2}\s?@\s?\$?\d+[.,]\d{2}(\s?\/?\s?ea)?/i, ' ').replace(/\bqty\.?\s?\d{1,2}\b/i, ' '); }
  const priced = /\d+[.,]\s?\d{2}/.test(line);
  // prices, tax flags and item numbers
  line = line.replace(/-?\$?\s?\d+[.,]\s?\d{2}\s?-?\s?[A-Z]{0,2}\s*$/i, '');   // price (and flags like "F", "N", "TX") at the end
  line = line.replace(/\$?\d+[.,]\d{2}/g, ' ');                              // any other prices
  line = line.replace(/\b\d{4,}\b/g, ' ');                                     // item / PLU / UPC numbers
  const size = line.match(SIZE);
  if (size) { const u = size[2].toLowerCase().replace(/\s/g, ' '); quantity = quantity || `${size[1]} ${UNIT[u] || UNIT[u.replace(' ', '')] || u}`; line = line.replace(SIZE, ' '); }
  // spell out the words
  const words = line.toLowerCase().replace(/[^a-z0-9%'& ]/g, ' ').split(/\s+/).filter(Boolean);
  while (words.length > 1 && (BRANDS.has(words[0]) || (/^[a-z]$/.test(words[0]) && words[0] !== 'a'))) words.shift();   // store brands, stray letters
  while (words.length > 1 && /^[a-z]{1,2}$/.test(words[words.length - 1]) && !ABBR[words[words.length - 1]]) words.pop();   // tax flags ("F", "N", "KF")
  const out = [];
  for (let w of words) {
    if (/^\d+$/.test(w)) continue;
    if (/[a-z]/.test(w) && /[015]/.test(w)) w = w.replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's');   // "M0ZZ" → mozz
    const v = Object.prototype.hasOwnProperty.call(ABBR, w) ? ABBR[w] : w;
    if (v) out.push(v);
  }
  const name = titleCase(out.join(' ').replace(/\s+/g, ' ').trim()).slice(0, 60);
  if (name.replace(/[^a-z]/gi, '').length < 3) return quantity ? { qtyOnly: quantity } : null;
  const food = isGrocery(name);
  if (!food && !priced) return null;   // store name, slogans, addresses: no price, not food
  return { name, category: guessCategory(name), quantity, on: food, raw: String(raw).trim().slice(0, 80) };
}

// all the groceries on a receipt, in order, with repeats of the same item merged ("x2")
export function parseReceipt(text) {
  const items = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    const it = parseLine(raw); if (!it) continue;
    // a line that's only a weight or count ("2.13 lb @ 0.58/lb", "2 @ 1.29") belongs to the item above it
    if (it.qtyOnly) { const prev = items[items.length - 1]; if (prev) prev.quantity = it.qtyOnly; continue; }
    const same = items.find((x) => x.name.toLowerCase() === it.name.toLowerCase());
    if (same) { same.count = (same.count || 1) + 1; same.quantity = `x${same.count}`; continue; }
    items.push(it);
  }
  return items.slice(0, 80);
}
