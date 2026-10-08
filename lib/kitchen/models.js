// Kitchen models: every fridge, freezer, pantry, cabinet, upper cabinet and drawer type Whisk can draw, named by what
// it looks like (not brand or year). Pure data + drawing math, shared by the 3D scene, the flat pictures and search.
// A "piece" saved in a kitchen is { id, mid, x, y, w, d, h, z, fin, tfin } — floor cells are 1 ft, heights in ft.
export const C = 26, HU = 24, GW = 12, GD = 8;
function rgb(h) { h = String(h || '#888888').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
export function mix(h, a) { var c = rgb(h), t = a < 0 ? 0 : 255, p = Math.abs(a); return 'rgb(' + c.map(function (v) { return Math.round(v + (t - v) * p); }).join(',') + ')'; }
export function lum(h) { var c = rgb(h); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000; }
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export const TEX = {
  steel: { label: 'Brushed steel', css: function () { return 'repeating-linear-gradient(90deg,rgba(255,255,255,.13) 0 1px,rgba(0,0,0,.04) 1px 3px),linear-gradient(180deg,rgba(255,255,255,.3),rgba(255,255,255,0) 45%,rgba(0,0,0,.1))'; } },
  matte: { label: 'Matte', css: function () { return 'linear-gradient(180deg,rgba(255,255,255,.07),rgba(0,0,0,.07))'; } },
  gloss: { label: 'Gloss', css: function () { return 'linear-gradient(118deg,rgba(255,255,255,.5) 0,rgba(255,255,255,.12) 34%,rgba(255,255,255,0) 35%),linear-gradient(180deg,rgba(255,255,255,.1),rgba(0,0,0,.08))'; } },
  wood: { label: 'Wood grain', css: function () { return 'repeating-linear-gradient(90deg,rgba(70,35,10,.11) 0 1px,rgba(0,0,0,0) 1px 5px),repeating-linear-gradient(90deg,rgba(255,235,205,.09) 0 2px,rgba(0,0,0,0) 2px 9px,rgba(70,35,10,.06) 9px 12px,rgba(0,0,0,0) 12px 17px),radial-gradient(ellipse 22% 7% at 32% 38%,rgba(70,35,10,.2),rgba(0,0,0,0) 70%),radial-gradient(ellipse 18% 5% at 70% 74%,rgba(70,35,10,.16),rgba(0,0,0,0) 70%)'; } },
  painted: { label: 'Painted', css: function () { return 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.05))'; } },
  marble: { label: 'Marble', css: function (c) { var v = lum(c) > 120 ? '105,105,115' : '235,235,240'; return 'linear-gradient(116deg,rgba(0,0,0,0) 28%,rgba(' + v + ',.32) 29%,rgba(0,0,0,0) 30.5%),linear-gradient(62deg,rgba(0,0,0,0) 52%,rgba(' + v + ',.24) 53%,rgba(0,0,0,0) 54.2%),linear-gradient(152deg,rgba(0,0,0,0) 68%,rgba(' + v + ',.22) 68.6%,rgba(0,0,0,0) 69.6%),linear-gradient(20deg,rgba(0,0,0,0) 80%,rgba(' + v + ',.16) 80.6%,rgba(0,0,0,0) 81.4%),radial-gradient(ellipse at 25% 30%,rgba(255,255,255,.4),rgba(255,255,255,0) 60%)'; } },
  granite: { label: 'Granite', css: function () { return 'radial-gradient(circle,rgba(0,0,0,.4) 0 1px,rgba(0,0,0,0) 1.5px) 0 0/6px 6px,radial-gradient(circle,rgba(255,255,255,.4) 0 1px,rgba(0,0,0,0) 1.5px) 3px 2px/8px 8px,radial-gradient(circle,rgba(130,85,60,.35) 0 1.3px,rgba(0,0,0,0) 1.8px) 1px 5px/11px 11px'; } },
  quartz: { label: 'Quartz', css: function () { return 'radial-gradient(circle,rgba(255,255,255,.6) 0 .8px,rgba(0,0,0,0) 1.2px) 0 0/5px 5px,radial-gradient(circle,rgba(0,0,0,.14) 0 .8px,rgba(0,0,0,0) 1.2px) 2px 3px/7px 7px,linear-gradient(135deg,rgba(255,255,255,.25),rgba(255,255,255,0) 50%)'; } },
  butcher: { label: 'Butcher block', css: function () { return 'repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 9px,rgba(70,35,10,.22) 9px 10px),repeating-linear-gradient(90deg,rgba(255,225,180,.14) 0 4px,rgba(0,0,0,0) 4px 20px,rgba(90,45,15,.12) 20px 30px)'; } },
  concrete: { label: 'Concrete', css: function () { return 'radial-gradient(circle at 22% 30%,rgba(0,0,0,.09),rgba(0,0,0,0) 32%),radial-gradient(circle at 72% 64%,rgba(255,255,255,.14),rgba(0,0,0,0) 36%),radial-gradient(circle,rgba(0,0,0,.13) 0 .6px,rgba(0,0,0,0) 1px) 0 0/4px 4px'; } },
  laminate: { label: 'Laminate', css: function () { return 'linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,0) 60%)'; } }
};
export const GROUPS = { appliance: ['steel', 'matte', 'gloss'], cabinet: ['wood', 'painted', 'gloss'], top: ['marble', 'granite', 'quartz', 'butcher', 'concrete', 'laminate'] };
var PAINT = [['#F3F1EC', 'White'], ['#A9B8A0', 'Sage'], ['#2F4058', 'Navy'], ['#3C3F44', 'Charcoal'], ['#E8C1B5', 'Blush'], ['#7FA7B5', 'Blue'], ['#F2E6C8', 'Cream']];
var COLORS = {
  'appliance:steel': [['#C9CDD2', 'Stainless'], ['#4A4D52', 'Black stainless'], ['#8E949B', 'Graphite']],
  'appliance:matte': [['#F4F4F2', 'White'], ['#222326', 'Black'], ['#6F7378', 'Slate'], ['#2F4058', 'Navy'], ['#A8DCC6', 'Mint'], ['#F2E6C8', 'Cream']],
  'appliance:gloss': [['#F4F4F2', 'White'], ['#222326', 'Black'], ['#D9473F', 'Red'], ['#A8DCC6', 'Mint'], ['#9CC9E8', 'Sky'], ['#F2E6C8', 'Cream'], ['#F2C94C', 'Butter']],
  'cabinet:wood': [['#C89B63', 'Oak'], ['#7A5233', 'Walnut'], ['#E0C08E', 'Maple'], ['#A2553A', 'Cherry'], ['#E8DCC6', 'White ash'], ['#4B3426', 'Espresso']],
  'cabinet:painted': PAINT, 'cabinet:gloss': PAINT,
  'top:marble': [['#EEEDEA', 'Carrara'], ['#F5F0E6', 'Calacatta'], ['#2B2B2E', 'Nero'], ['#C9C3B8', 'Taupe']],
  'top:granite': [['#3A3634', 'Black pearl'], ['#8C847C', 'Grey'], ['#D8CFC2', 'White'], ['#5E4B3C', 'Brown']],
  'top:quartz': [['#F4F3F0', 'White'], ['#BDBAB4', 'Grey'], ['#2E2E30', 'Black'], ['#E6DCCB', 'Sand']],
  'top:butcher': [['#C99A5E', 'Maple'], ['#8E5D34', 'Walnut'], ['#E2BC85', 'Birch']],
  'top:concrete': [['#A7A6A1', 'Grey'], ['#6E6D69', 'Dark'], ['#CFCBC3', 'Light']],
  'top:laminate': [['#F1EFEA', 'White'], ['#3B3B3D', 'Black'], ['#B9B2A6', 'Stone'], ['#7E8F7A', 'Green']]
};
export function skin(fin, sh) {
  var o = sh < 0 ? 'linear-gradient(rgba(0,0,0,' + (-sh) + '),rgba(0,0,0,' + (-sh) + ')),' : sh > 0 ? 'linear-gradient(rgba(255,255,255,' + sh + '),rgba(255,255,255,' + sh + ')),' : '';
  var t = TEX[fin.tex] ? TEX[fin.tex].css(fin.color) + ',' : '';
  return 'background:' + o + t + fin.color + ';';
}

export const CATS = [
  { id: 'fridge', label: 'Fridges', color: '#7CC7EC' }, { id: 'freezer', label: 'Freezers', color: '#9FB7FF' },
  { id: 'pantry', label: 'Pantries', color: '#FFAD3B' }, { id: 'cabinet', label: 'Cabinets', color: '#F2A65A' },
  { id: 'upper', label: 'Upper cabinets', color: '#B79CFF' }, { id: 'drawers', label: 'Drawers', color: '#8CD46A' }
];
export const MODELS = [], MODEL = {};
function M(id, cat, desc, gen, w, d, h, o) {
  o = o || {};
  var grp = o.grp || (cat === 'fridge' || cat === 'freezer' ? 'appliance' : 'cabinet');
  var top = o.top != null ? o.top : (cat === 'cabinet' || cat === 'drawers');
  var m = { id: id, cat: cat, desc: desc, gen: gen, w: w, d: d, h: h, z: o.z || 0, grp: grp, top: top, pop: o.pop || 1, kw: o.kw || '', nick: o.nick || desc, round: !!o.round,
    fin: o.fin || (grp === 'appliance' ? { tex: 'steel', color: '#C9CDD2' } : { tex: 'wood', color: '#C89B63' }),
    tfin: o.tfin || { tex: 'marble', color: '#EEEDEA' } };
  MODELS.push(m); MODEL[id] = m;
}
M('ff', 'fridge', 'French-door fridge with freezer drawer', 'french', 3, 2, 6, { pop: 10, kw: 'refrigerator icebox two doors bottom freezer', nick: 'Fridge' });
M('sbs', 'fridge', 'Side-by-side fridge with water dispenser', 'side', 3, 2, 6, { pop: 8, kw: 'refrigerator ice maker two doors', nick: 'Fridge' });
M('tf', 'fridge', 'Fridge with freezer on top', 'topf', 3, 2, 5.5, { pop: 9, kw: 'refrigerator icebox top freezer classic', nick: 'Fridge' });
M('bf', 'fridge', 'Fridge with freezer drawer on the bottom', 'botf', 3, 2, 6, { pop: 7, kw: 'refrigerator bottom freezer single door', nick: 'Fridge' });
M('f4', 'fridge', 'Four-door fridge with middle drawer', 'four', 3, 2, 6, { pop: 5, kw: 'refrigerator 4 door flex drawer', nick: 'Fridge' });
M('col', 'fridge', 'Tall single-door column fridge', 'one', 2, 2, 7, { pop: 3, kw: 'refrigerator built in narrow all fridge', nick: 'Fridge' });
M('mini', 'fridge', 'Mini fridge with one door', 'one', 2, 2, 3, { pop: 6, kw: 'small dorm compact refrigerator beverage', nick: 'Mini fridge' });
M('retro', 'fridge', 'Retro fridge with rounded top', 'retro', 2, 2, 5, { pop: 4, kw: 'vintage colorful colourful smeg refrigerator', nick: 'Fridge', round: true, fin: { tex: 'gloss', color: '#A8DCC6' } });
M('wine', 'fridge', 'Under-counter wine fridge with glass door', 'wine', 2, 2, 3, { pop: 3, kw: 'wine cooler beverage glass drinks', nick: 'Wine fridge' });
M('panel', 'fridge', 'Built-in fridge that matches the cabinets', 'botf', 3, 2, 7, { pop: 2, kw: 'panel ready integrated hidden refrigerator wood', nick: 'Fridge', grp: 'cabinet' });
M('chest', 'freezer', 'Chest freezer with lift-up lid', 'chest', 4, 2, 3, { pop: 8, kw: 'deep freeze box garage', nick: 'Freezer', fin: { tex: 'matte', color: '#F4F4F2' } });
M('upf', 'freezer', 'Upright freezer with one door', 'one', 2, 2, 6, { pop: 6, kw: 'tall standing deep freeze', nick: 'Freezer' });
M('fdr', 'freezer', 'Under-counter freezer with 2 drawers', 'two', 2, 2, 3, { pop: 3, kw: 'drawer freezer small', nick: 'Freezer' });
M('p2', 'pantry', 'Tall pantry with 2 doors', 'doors2', 3, 2, 7, { pop: 9, kw: 'larder cupboard tall cabinet food', nick: 'Pantry' });
M('p1', 'pantry', 'Tall pantry with 1 door', 'one', 2, 2, 7, { pop: 7, kw: 'larder cupboard tall cabinet', nick: 'Pantry' });
M('ppo', 'pantry', 'Pull-out pantry tower', 'pull', 1, 2, 7, { pop: 5, kw: 'slide out sliding narrow larder', nick: 'Pull-out pantry' });
M('pdr', 'pantry', 'Tall pantry with doors on top and drawers below', 'pantryDr', 3, 2, 7, { pop: 4, kw: 'larder cupboard drawers', nick: 'Pantry' });
M('pop', 'pantry', 'Open pantry shelves, no doors', 'open', 3, 1, 7, { pop: 5, kw: 'shelf shelving rack walk in', nick: 'Pantry shelves' });
M('b1', 'cabinet', 'Base cabinet with 1 door', 'one', 2, 2, 3, { pop: 7, kw: 'cupboard lower under counter', nick: 'Cabinet' });
M('b2', 'cabinet', 'Base cabinet with 2 doors', 'doors2', 3, 2, 3, { pop: 8, kw: 'cupboard lower under counter double', nick: 'Cabinet' });
M('bdd', 'cabinet', 'Base cabinet with a drawer over 2 doors', 'drawerDoors', 3, 2, 3, { pop: 10, kw: 'cupboard lower counter', nick: 'Cabinet' });
M('sink', 'cabinet', 'Sink cabinet with 2 doors', 'sink', 3, 2, 3, { pop: 6, kw: 'under sink cupboard', nick: 'Sink cabinet' });
M('corner', 'cabinet', 'Corner cabinet with lazy susan', 'susan', 3, 3, 3, { pop: 4, kw: 'turntable spinning rotating cupboard', nick: 'Corner cabinet' });
M('bop', 'cabinet', 'Base cabinet with open shelves', 'open', 2, 2, 3, { pop: 3, kw: 'cupboard no doors shelf', nick: 'Open cabinet' });
M('isl', 'cabinet', 'Kitchen island with drawers and doors', 'island', 4, 2, 3, { pop: 6, kw: 'center centre counter block', nick: 'Island', fin: { tex: 'painted', color: '#A9B8A0' }, tfin: { tex: 'butcher', color: '#C99A5E' } });
M('u1', 'upper', 'Upper cabinet with 1 door', 'one', 2, 1, 2.5, { z: 4.5, pop: 7, kw: 'wall cupboard overhead', nick: 'Upper cabinet' });
M('u2', 'upper', 'Upper cabinet with 2 doors', 'doors2', 3, 1, 2.5, { z: 4.5, pop: 9, kw: 'wall cupboard overhead double', nick: 'Upper cabinet' });
M('ug', 'upper', 'Upper cabinet with glass doors', 'glass2', 3, 1, 2.5, { z: 4.5, pop: 5, kw: 'wall cupboard display china', nick: 'Glass cabinet' });
M('ul', 'upper', 'Upper cabinet with lift-up door', 'lift', 3, 1, 1.5, { z: 5.5, pop: 3, kw: 'flip up wall cupboard over fridge', nick: 'Lift-up cabinet' });
M('uo', 'upper', 'Open wall shelves', 'open', 3, 1, 2, { z: 5, pop: 4, kw: 'floating shelf rack', nick: 'Wall shelves' });
M('d3', 'drawers', 'Cabinet with 3 sliding drawers', 'dr3', 2, 2, 3, { pop: 10, kw: 'drawer stack chest', nick: 'Drawers' });
M('d4', 'drawers', 'Cabinet with 4 sliding drawers', 'dr4', 2, 2, 3, { pop: 6, kw: 'drawer stack utensil', nick: 'Drawers' });
M('dp', 'drawers', 'Cabinet with 2 deep pot drawers', 'two', 3, 2, 3, { pop: 5, kw: 'pots pans deep drawer', nick: 'Pot drawers' });
M('ds', 'drawers', 'Narrow pull-out spice rack', 'pull', 1, 2, 3, { pop: 4, kw: 'spice slide out sliding narrow', nick: 'Spice pull-out' });

export function cold(m) { return m.grp === 'appliance' || m.id === 'panel'; }
export function toe(m) { if (m.gen === 'chest') return 0.06; return { fridge: .035, freezer: .045, pantry: .04, cabinet: .11, drawers: .11, upper: 0 }[m.cat] || 0; }

export function gen(m, w, h) {
  var ts = m.top ? 0.06 : 0, tb = toe(m), hr = h * (1 - ts - tb);
  var f = [], t = [];
  function R_(fr) { return Math.max(1, Math.round(fr * hr / 1.25)); }
  function D(x, y, ww, hh, hinge, rows, name, deco, inner) { f.push({ k: 'door', x: x, y: y, w: ww, h: hh, hinge: hinge, rows: rows, name: name, deco: deco || [], inner: inner || '' }); }
  function Dr(x, y, ww, hh, name) { f.push({ k: 'drawer', x: x, y: y, w: ww, h: hh, rows: 1, name: name, deco: [] }); }
  function O(x, y, ww, hh, rows, name) { f.push({ k: 'open', x: x, y: y, w: ww, h: hh, rows: rows, name: name, deco: [] }); }
  function P(x, y, ww, hh, rows, name) { f.push({ k: 'pull', x: x, y: y, w: ww, h: hh, rows: rows, name: name, deco: [] }); }
  function F(x, y, ww, hh) { f.push({ k: 'panel', x: x, y: y, w: ww, h: hh, rows: 0, name: 'panel', deco: [] }); }
  function across(n, y, hh, rows, deco) {
    var names = n === 1 ? ['door'] : n === 2 ? ['left door', 'right door'] : n === 3 ? ['left door', 'middle door', 'right door'] : [];
    for (var i = 0; i < n; i++) D(i / n, y, 1 / n, hh, n === 1 ? 'r' : (i < n / 2 ? 'l' : 'r'), rows, names[i] || ('door ' + (i + 1)), deco);
  }
  switch (m.gen) {
    case 'french': D(0, 0, .5, .66, 'l', R_(.66), 'left door'); D(.5, 0, .5, .66, 'r', R_(.66), 'right door'); Dr(0, .66, 1, .34, 'freezer drawer'); break;
    case 'four': D(0, 0, .5, .6, 'l', R_(.6), 'left door'); D(.5, 0, .5, .6, 'r', R_(.6), 'right door'); Dr(0, .6, 1, .17, 'middle drawer'); Dr(0, .77, 1, .23, 'freezer drawer'); break;
    case 'side': D(0, 0, .42, 1, 'l', R_(1), 'freezer side', ['disp']); D(.42, 0, .58, 1, 'r', R_(1), 'fridge side'); break;
    case 'topf': D(0, 0, 1, .3, 'r', 1, 'freezer'); D(0, .3, 1, .7, 'r', R_(.7), 'fridge'); break;
    case 'retro': D(0, 0, 1, .26, 'r', 1, 'freezer'); D(0, .26, 1, .74, 'r', R_(.74), 'fridge'); break;
    case 'botf': D(0, 0, 1, .68, 'r', R_(.68), 'fridge'); Dr(0, .68, 1, .32, 'freezer drawer'); break;
    case 'one': D(0, 0, 1, 1, 'r', R_(1), 'door'); break;
    case 'wine': D(0, 0, 1, 1, 'r', R_(1) + 1, 'glass door', ['wine']); break;
    case 'chest': t.push({ k: 'lid', x: 0, y: 0, w: 1, h: 1, hinge: 't', rows: 1, cols: 2, name: 'lid', deco: [] }); break;
    case 'two': Dr(0, 0, 1, .5, 'top drawer'); Dr(0, .5, 1, .5, 'bottom drawer'); break;
    case 'doors2': across(2, 0, 1, R_(1)); break;
    case 'glass2': across(2, 0, 1, R_(1), ['glass']); break;
    case 'pull': P(0, 0, 1, 1, R_(1), 'pull-out'); break;
    case 'pantryDr': across(2, 0, .66, R_(.66)); Dr(0, .66, 1, .17, 'top drawer'); Dr(0, .83, 1, .17, 'bottom drawer'); break;
    case 'open': O(0, 0, 1, 1, R_(1), 'shelves'); break;
    case 'drawerDoors': Dr(0, 0, 1, .24, 'top drawer'); across(2, .24, .76, R_(.76)); break;
    case 'sink': F(0, 0, 1, .24); across(2, .24, .76, 1); break;
    case 'susan': D(0, 0, 1, 1, 'r', 2, 'lazy susan', [], 'susan'); break;
    case 'island': var n = clamp(Math.round(w / 2), 1, 3), dn = ['left drawer', 'middle drawer', 'right drawer'];
      if (n === 1) Dr(0, 0, 1, .24, 'top drawer'); else for (var i = 0; i < n; i++) Dr(i / n, 0, 1 / n, .24, n === 2 ? (i ? 'right drawer' : 'left drawer') : dn[i]);
      across(n, .24, .76, R_(.76)); break;
    case 'lift': D(0, 0, 1, 1, 't', R_(1), 'lift-up door'); break;
    case 'dr3': Dr(0, 0, 1, .27, 'top drawer'); Dr(0, .27, 1, .33, 'middle drawer'); Dr(0, .6, 1, .4, 'bottom drawer'); break;
    case 'dr4': Dr(0, 0, 1, .22, 'top drawer'); Dr(0, .22, 1, .24, 'drawer 2'); Dr(0, .46, 1, .26, 'drawer 3'); Dr(0, .72, 1, .28, 'bottom drawer'); break;
  }
  var span = 1 - ts - tb;
  f.forEach(function (c) { c.y = ts + c.y * span; c.h = c.h * span; });
  return { front: f, top: t, ts: ts, tb: tb };
}

export function rowName(r, rows) {
  if (rows <= 1) return '';
  if (rows === 2) return ['top shelf', 'bottom shelf'][r];
  if (rows === 3) return ['top shelf', 'middle shelf', 'bottom shelf'][r];
  return r === 0 ? 'top shelf' : r === rows - 1 ? 'bottom shelf' : 'shelf ' + (r + 1);
}
export function spotDefs(c, wft) {
  if (c.k === 'panel') return [];
  if (c.k === 'drawer') return [{ r: 0, col: 0, rows: 1, cols: 1, sub: '' }];
  var rows = c.rows || 1, cols = c.k === 'lid' ? 2 : (c.k !== 'pull' && c.w * wft >= 2.6 ? 2 : 1), out = [];
  for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) {
    var cn = cols === 2 ? ['left', 'right'][k] : '';
    var sub = c.k === 'lid' ? cn + ' side' : [rowName(r, rows), cn].filter(Boolean).join(', ');
    out.push({ r: r, col: k, rows: rows, cols: cols, sub: sub });
  }
  return out;
}
export function doorBins(c, m) {
  if (c.k !== 'door' || !cold(m) || m.gen === 'wine') return [];
  return c.h >= 0.5 ? ['top door shelf', 'middle door shelf', 'bottom door shelf'] : ['door shelf'];
}
export function index(blocks) {
  var count = {}, seen = {}, map = {}, nick = {}, total = 0;
  blocks.forEach(function (b) { var n = MODEL[b.mid].nick; count[n] = (count[n] || 0) + 1; });
  blocks.forEach(function (b) {
    var m = MODEL[b.mid], n = m.nick; seen[n] = (seen[n] || 0) + 1;
    var name = count[n] > 1 ? n + ' ' + seen[n] : n; nick[b.id] = name;
    var g = gen(m, b.w, b.h), comps = g.front.concat(g.top);
    comps.forEach(function (c, ci) {
      spotDefs(c, b.w).forEach(function (sd, si) {
        map[b.id + '|' + ci + '|' + si] = { bid: b.id, ci: ci, label: name + ' · ' + c.name + (sd.sub ? ' · ' + sd.sub : ''), short: name + ' · ' + c.name };
        total++;
      });
      // fridge & freezer doors have shelves on the inside too (spots 50, 51, 52)
      doorBins(c, m).forEach(function (bn, i) {
        map[b.id + '|' + ci + '|' + (50 + i)] = { bid: b.id, ci: ci, label: name + ' · ' + c.name + ' · ' + bn, short: name + ' · ' + c.name + ' door', door: true };
        total++;
      });
    });
  });
  return { map: map, nick: nick, total: total };
}

export function barCss(m, fin) {
  if (m.grp === 'appliance') return 'background:linear-gradient(90deg,#f5f6f7,#9ea4ab);border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.4)';
  return lum(fin.color) > 110 ? 'background:linear-gradient(90deg,#4a423b,#1f1a16);border-radius:3px;box-shadow:0 1px 1px rgba(0,0,0,.35)' : 'background:linear-gradient(90deg,#f0e4c8,#b39a63);border-radius:3px;box-shadow:0 1px 1px rgba(0,0,0,.45)';
}
export function pct(x, y, w, h) { return 'left:' + (x * 100).toFixed(2) + '%;top:' + (y * 100).toFixed(2) + '%;width:' + (w * 100).toFixed(2) + '%;height:' + (h * 100).toFixed(2) + '%;'; }
export function decoFor(c, m, fin, hft) {
  var out = [], bar = barCss(m, fin), ap = m.grp === 'appliance', cft = c.h * hft;
  function add(x, y, w, h, css) { out.push({ st: pct(x, y, w, h) + css }); }
  (c.deco || []).forEach(function (d) {
    if (d === 'glass') add(.15, .1, .7, .8, 'border-radius:2px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),inset 0 0 0 2px rgba(0,0,0,.15);background:linear-gradient(125deg,rgba(255,255,255,.55) 0 18%,rgba(255,255,255,0) 19% 45%,rgba(255,255,255,.25) 46% 52%,rgba(255,255,255,0) 53%),repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 46%,rgba(120,90,60,.55) 46% 50%),radial-gradient(ellipse 16% 20% at 28% 28%,#f7f7f2 0 60%,rgba(0,0,0,0) 62%),radial-gradient(ellipse 16% 20% at 50% 28%,#e9eef0 0 60%,rgba(0,0,0,0) 62%),radial-gradient(ellipse 10% 14% at 40% 80%,#f3e9dc 0 60%,rgba(0,0,0,0) 62%),linear-gradient(#cfe0e6,#b9cfd7)');
    if (d === 'wine') add(.1, .07, .8, .86, 'border-radius:2px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.25);background:linear-gradient(125deg,rgba(255,255,255,.3) 0 15%,rgba(255,255,255,0) 16%),repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 11%,rgba(150,115,80,.8) 11% 12.5%),radial-gradient(circle at 50% 50%,#6b1d2a 0 34%,#2a0c12 36% 46%,rgba(0,0,0,0) 48%) 0 0/25% 12.5%,#141012');
    if (d === 'disp') add(.2, .2, .6, .2, 'background:linear-gradient(#3b3f45,#1d2024);border-radius:6px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.12)');
  });
  if (c.k === 'door') {
    if (c.hinge === 't') add(.38, .8, .24, .07, bar);
    else if (ap) { var tall = cft >= 2.4; add(c.hinge === 'l' ? .84 : .1, tall ? .14 : .22, .06, tall ? .5 : .52, bar); }
    else { var hh = clamp(.55 / cft, .1, .34); add(c.hinge === 'l' ? .82 : .13, m.cat === 'upper' ? .88 - hh : cft > 3.5 ? .45 - hh / 2 : .1, .05, hh, bar); }
  } else if (c.k === 'drawer') {
    if (ap) add(.18, .1, .64, .1, bar);
    else { var dh = clamp(.12 / cft, .06, .2); add(.36, cft < 1.1 ? .5 - dh / 2 : .16, .28, dh, bar); }
  } else if (c.k === 'pull') add(.3, .04, .4, .025, bar);
  return out;
}
export function faceDeco(m, fin, tfin, ts, tb) {
  var out = [];
  function add(css) { out.push({ st: css }); }
  if (ts) add('left:-2%;top:0;width:104%;height:' + ts * 100 + '%;' + skin(tfin, .04) + 'border-radius:2px;box-shadow:0 2px 2px rgba(0,0,0,.25);');
  if (tb) {
    if (m.grp === 'appliance' && m.gen !== 'chest') add('left:6%;width:88%;bottom:0;height:' + tb * 100 + '%;background:repeating-linear-gradient(90deg,#2b2e32 0 2px,#50555c 2px 4px);border-radius:2px;');
    else if (m.gen === 'chest') add('left:3%;width:94%;bottom:0;height:' + tb * 100 + '%;background:#3a3d42;border-radius:2px;');
    else add('left:3%;width:94%;bottom:0;height:' + tb * 100 + '%;background:linear-gradient(#1e1915,#3a322b);');
  }
  if (m.gen === 'chest') {
    add('left:0;top:0;width:100%;height:14%;background:rgba(0,0,0,.06);border-bottom:2px solid rgba(0,0,0,.14);');
    add('left:40%;top:3%;width:20%;height:7%;' + barCss(m, fin) + ';');
    add('left:78%;top:62%;width:15%;height:22%;background:repeating-linear-gradient(180deg,rgba(0,0,0,.35) 0 2px,rgba(0,0,0,0) 2px 5px);');
  }
  return out;
}
export function liner(m, fin) { return cold(m) ? '#EEF3F6' : fin.tex === 'wood' ? mix(fin.color, .45) : '#F1ECE3'; }
export function interior(c, m, fin) {
  if (m.gen === 'wine') return 'background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 11%,rgba(150,115,80,.9) 11% 12.5%),radial-gradient(circle,#6b1d2a 0 34%,#2a0c12 36% 46%,rgba(0,0,0,0) 48%) 0 0/25% 12.5%,#1b1416;';
  var rows = c.k === 'drawer' ? 1 : (c.rows || 1), P = (100 / rows).toFixed(3);
  var shelf = cold(m) ? 'rgba(140,185,210,.85)' : fin.tex === 'wood' ? mix(fin.color, -.12) : '#D8CDBB';
  var lines = c.k === 'drawer' ? '' : 'repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 calc(' + P + '% - 3px),' + shelf + ' calc(' + P + '% - 3px) ' + P + '%),';
  if (c.inner === 'susan') lines = 'radial-gradient(ellipse 44% 10% at 50% 34%,' + shelf + ' 0 95%,rgba(0,0,0,0) 100%),radial-gradient(ellipse 44% 10% at 50% 86%,' + shelf + ' 0 95%,rgba(0,0,0,0) 100%),';
  var light = cold(m) ? 'radial-gradient(ellipse 70% 35% at 50% 0,rgba(255,255,255,.95),rgba(255,255,255,0)),' : '';
  return 'background:' + light + lines + liner(m, fin) + ';box-shadow:inset 0 8px 10px -5px rgba(0,0,0,.3),inset 7px 0 8px -7px rgba(0,0,0,.25),inset -7px 0 8px -7px rgba(0,0,0,.25);';
}
export function panel(c, m, fin) {
  var shaker = m.grp === 'cabinet' && c.k !== 'pull' ? ',inset 0 0 0 5px rgba(0,0,0,.06),inset 0 0 0 6px rgba(255,255,255,.16)' : '';
  return skin(fin, 0) + 'border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.22)' + shaker + ';';
}
export function flat(m, w, h, fin, tfin, boxW, boxH) {
  var S = Math.min(boxW / w, boxH / h), Wp = Math.round(w * S), Hp = Math.round(h * S);
  var g = gen(m, w, h);
  var st = 'width:' + Wp + 'px;height:' + Hp + 'px;' + skin(fin, 0) + 'border-radius:' + (m.round ? '40% 40% 5px 5px/16% 16% 5px 5px' : '3px') + ';box-shadow:inset 0 0 0 1px rgba(0,0,0,.2),0 2px 0 rgba(0,0,0,.08);';
  return {
    st: st, W: Wp, H: Hp, face: faceDeco(m, fin, tfin, g.ts, g.tb),
    comps: g.front.map(function (c) { return { st: pct(c.x, c.y, c.w, c.h) + (c.k === 'open' ? interior(c, m, fin) : panel(c, m, fin)), deco: c.k === 'open' ? [] : decoFor(c, m, fin, h) }; })
  };
}
export function colorsFor(grp, tex) { return COLORS[grp + ':' + tex] || COLORS['top:' + tex] || []; }

export function score(m, q) {
  q = q.trim().toLowerCase(); if (!q) return m.pop;
  var d = m.desc.toLowerCase(), hay = d + ' ' + m.kw.toLowerCase();
  if (d.indexOf(q) === 0) return 1000 + m.pop;
  var words = q.split(/\s+/).filter(Boolean);
  if (words.every(function (w) { return hay.indexOf(w) >= 0; })) return 500 + m.pop + ((' ' + hay).indexOf(' ' + words[0]) >= 0 ? 100 : 0);
  var wp = words.filter(function (w) { return (' ' + hay).indexOf(' ' + w.slice(0, 3)) >= 0; }).length;
  if (wp) return 200 + wp * 40 + m.pop;
  var qq = q.replace(/\s/g, ''), i = 0;
  for (var j = 0; j < d.length && i < qq.length; j++) if (d[j] === qq[i]) i++;
  return i === qq.length ? 50 + m.pop : -1;
}


export const newId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
export function piece(mid, at = {}) {
const m = MODEL[mid];
return { id: newId(), mid, x: 0, y: 0, w: m.w, d: m.d, h: m.h, z: m.z, fin: { ...m.fin }, tfin: { ...m.tfin }, ...at };
}
// Keep only what we know how to draw (old or hand-edited data can't break the page).
export function cleanPieces(list) {
return (Array.isArray(list) ? list : []).filter((p) => p && MODEL[p.mid] && /^[A-Za-z0-9_-]{1,24}$/.test(p.id)).map((p) => {
  const m = MODEL[p.mid];
  const n = (v, a, b, dflt) => (Number.isFinite(+v) ? clamp(+v, a, b) : dflt);
  const hex = (c, dflt) => (/^#[0-9a-fA-F]{6}$/.test(c?.color || '') && TEX[c?.tex] ? { tex: c.tex, color: c.color } : dflt);
  const w = Math.round(n(p.w, 1, GW, m.w)), d = Math.round(n(p.d, 1, GD, m.d));
  return { id: p.id, mid: p.mid, w, d, x: Math.round(n(p.x, 0, GW - w, 0)), y: Math.round(n(p.y, 0, GD - d, 0)), h: n(p.h, 1, 9, m.h), z: n(p.z, 0, 8, m.z),
    fin: hex(p.fin, { ...m.fin }), tfin: hex(p.tfin, { ...m.tfin }) };
});
}
export function clash(pieces, nb) {
if (nb.x < 0 || nb.y < 0 || nb.x + nb.w > GW || nb.y + nb.d > GD) return true;
return pieces.some((b) => b.id !== nb.id && nb.x < b.x + b.w && b.x < nb.x + nb.w && nb.y < b.y + b.d && b.y < nb.y + nb.d && nb.z < b.z + b.h && b.z < nb.z + nb.h);
}
export function placeFree(pieces, nb) {
for (let y = 0; y <= GD - nb.d; y++) for (let x = 0; x <= GW - nb.w; x++) { const t = { ...nb, x, y }; if (!clash(pieces, t)) return t; }
return null;
}
// A ready-made kitchen for "New" → Starter, and for players who just want to start dragging food in.
export function starterKitchen() {
const oak = { tex: 'wood', color: '#C89B63' }, marble = { tex: 'marble', color: '#EEEDEA' };
return [
  piece('ff', { x: 0, y: 0 }), piece('p2', { x: 3, y: 0, w: 2, fin: oak }), piece('bdd', { x: 5, y: 0, fin: oak, tfin: marble }),
  piece('d3', { x: 8, y: 0, fin: oak, tfin: marble }), piece('sink', { x: 10, y: 0, w: 2, fin: oak, tfin: marble }),
  piece('u2', { x: 5, y: 0, fin: oak }), piece('ug', { x: 8, y: 0, w: 2, fin: oak }), piece('u1', { x: 10, y: 0, fin: oak }),
  piece('isl', { x: 4, y: 5 })
];
}
// Which spots hold which items, for one kitchen.
export function spotsOf(pieces, items) {
const idx = index(pieces), at = {};
for (const it of items || []) if (it.spot && idx.map[it.spot]) (at[it.spot] ||= []).push(it);
return { idx, at };
}
