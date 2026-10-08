// Draws a recipe the way it really looks (no emoji): the right vessel — plate, bowl, skillet, terracotta cazuela,
// Korean earthenware pot, baking dish, injera — with the right food on it, from the recipe's name and main
// ingredients (gambas al ajillo = shrimp, garlic and chili in sizzling oil in a clay dish; doro wat = a dark red stew with
// a boiled egg on injera; oyakodon = egg and chicken over rice in a bowl …).
// dishArt({ title, key }) → SVG drawn around (0, 0): about 130 wide, from y = -62 to y = 26 (plate bottom).
import { O, INK, bit } from './food.js';

const o = `stroke='${INK}' stroke-width='1.4' stroke-linejoin='round' stroke-linecap='round'`;
function rng(seed) { let x = 0; for (const c of String(seed)) x = Math.imul(x ^ c.charCodeAt(0), 2654435761) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

// ---------- vessels ----------
const shadow = (rx = 60, y = 22) => `<ellipse cx='0' cy='${y}' rx='${rx}' ry='7' fill='#000' opacity='.16'/>`;
const plate = (rx = 58) => `${shadow(rx + 2)}<ellipse cx='0' cy='12' rx='${rx}' ry='15' fill='#FFFFFF' ${O}/><ellipse cx='0' cy='12' rx='${rx * 0.74}' ry='10.5' fill='#F1EEE8'/>`;
const bowl = (color = '#FFFFFF', band = '#2F6DB5', w = 46) => ({
  back: `${shadow(w)}<path d='M${-w} 0Q${-w + 3} 28 0 30Q${w - 3} 28 ${w} 0Z' fill='${color}' ${O}/><path d='M${-w + 6} 14Q0 24 ${w - 6} 14' fill='none' stroke='${band}' stroke-width='3'/><ellipse cx='0' cy='0' rx='${w}' ry='11' fill='${color}' ${O}/>`,
  area: { cx: 0, cy: 0, rx: w - 6, ry: 8 }
});
const fill = (a, c) => `<ellipse cx='${a.cx}' cy='${a.cy}' rx='${a.rx}' ry='${a.ry}' fill='${c}'/><ellipse cx='${a.cx - a.rx * 0.3}' cy='${a.cy - a.ry * 0.3}' rx='${a.rx * 0.35}' ry='${a.ry * 0.3}' fill='#FFFFFF' opacity='.18'/>`;
const skillet = () => ({
  back: `${shadow(52)}<path d='M44 4l40-8c4-1 6 4 2 6l-38 10z' fill='#2E2B2B' ${O}/><path d='M-50 4q2 18 50 20 48-2 50-20z' fill='#3A3636' ${O}/><ellipse cx='0' cy='4' rx='50' ry='14' fill='#2E2B2B' ${O}/>`,
  area: { cx: 0, cy: 3, rx: 43, ry: 10.5 }
});
const cazuela = () => ({
  back: `${shadow(50)}<path d='M-48 2q2 18 48 20 46-2 48-20z' fill='#A64A26' ${O}/><ellipse cx='0' cy='2' rx='48' ry='14' fill='#C2603A' ${O}/><path d='M-50 2c-6-2-8 4-2 6M50 2c6-2 8 4 2 6' fill='none' stroke='${INK}' stroke-width='2'/>`,
  area: { cx: 0, cy: 2, rx: 41, ry: 10 }
});
const ttukbaegi = () => ({
  back: `${shadow(44)}<ellipse cx='0' cy='18' rx='46' ry='9' fill='#4A3A33' ${O}/><path d='M-38 -4Q-40 26 0 28Q40 26 38 -4Z' fill='#3E2C25' ${O}/><path d='M-36 10q36 10 72 0' stroke='#6E5446' stroke-width='2' fill='none'/><ellipse cx='0' cy='-4' rx='38' ry='10' fill='#3E2C25' ${O}/>`,
  area: { cx: 0, cy: -4, rx: 32, ry: 7.5 }
});
const bakingDish = (color = '#FFFFFF') => ({
  back: `${shadow(62)}<path d='M-60 2v10q0 10 12 10h96q12 0 12-10V2' fill='${color === '#FFFFFF' ? '#ECE8DF' : color}' ${O}/><rect x='-60' y='-14' width='120' height='30' rx='11' fill='${color}' ${O}/><path d='M-66-2h6M60-2h6' stroke='${INK}' stroke-width='5' stroke-linecap='round'/>`,
  area: { cx: 0, cy: 1, rx: 52, ry: 11 }
});
const injera = () => `${shadow(62)}<ellipse cx='0' cy='12' rx='62' ry='16' fill='#D9D2C4' ${O}/><ellipse cx='0' cy='9' rx='56' ry='13' fill='#C9A97A' ${O}/>`;
const injeraDots = (r) => Array.from({ length: 26 }, () => { const a = r() * 6.28, d = Math.sqrt(r()); return `<circle cx='${(Math.cos(a) * d * 52).toFixed(1)}' cy='${(9 + Math.sin(a) * d * 11).toFixed(1)}' r='1.1' fill='#A88658'/>`; }).join('');

// ---------- food on top ----------
function scatter(r, kinds, n, a, s = 1, spread = 0.82) {
  const out = []; const list = Array.isArray(kinds) ? kinds : [kinds];
  for (let i = 0; i < n; i++) {
    const t = r() * 6.283, d = Math.sqrt(r()) * spread;
    out.push(bit(list[i % list.length], +(a.cx + Math.cos(t) * a.rx * d).toFixed(1), +(a.cy + Math.sin(t) * a.ry * d).toFixed(1), s, Math.round(r() * 60 - 30)));
  }
  const y = (p) => Number((p.match(/translate\([^ ]+ ([^)]+)\)/) || [0, 0])[1]);
  return out.filter(Boolean).sort((p, q) => y(p) - y(q)).join('');
}
const mound = (x, y, w, h, color, grains = '') => `<path d='M${x - w} ${y}q${w * 0.15} ${-h} ${w} ${-h}t${w} ${h}z' fill='${color}' ${O}/>${grains}`;
const rice = (r, x, y, w = 30, h = 20, color = '#FFFFFF') => mound(x, y, w, h, color) + Array.from({ length: 12 }, () => { const px = x + (r() - 0.5) * w * 1.3, py = y - r() * h * 0.75 - 2; return `<path d='M${px.toFixed(1)} ${py.toFixed(1)}h2.6' stroke='${color === '#FFFFFF' ? '#E4DFD4' : 'rgba(0,0,0,.18)'}' stroke-width='1.6' stroke-linecap='round'/>`; }).join('');
const noodles = (x, y, w, h, color, line) => `${mound(x, y, w, h, color)}${Array.from({ length: 6 }, (_, i) => { const yy = y - 3 - i * (h / 7); const ww = w * (1 - i / 8); return `<path d='M${x - ww} ${yy.toFixed(1)}q${ww / 4} -5 ${ww / 2} 0t${ww / 2} 0 ${ww / 2} 0 ${ww / 2} 0' fill='none' stroke='${line}' stroke-width='1.8'/>`; }).join('')}`;
const spaghetti = (x, y, color, line) => `<ellipse cx='${x}' cy='${y - 6}' rx='34' ry='13' fill='${color}' ${O}/>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx='${x + (i % 2 ? 3 : -2)}' cy='${y - 7 - i}' rx='${30 - i * 5}' ry='${11 - i * 1.6}' fill='none' stroke='${line}' stroke-width='1.6'/>`).join('')}`;
const penne = (r, a, color, n = 14) => Array.from({ length: n }, () => { const t = r() * 6.28, d = Math.sqrt(r()) * 0.8; const x = a.cx + Math.cos(t) * a.rx * d, y = a.cy + Math.sin(t) * a.ry * d - 3; return `<g transform='translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${Math.round(r() * 160)})'><rect x='-6' y='-2.4' width='12' height='4.8' rx='1.2' fill='${color}' ${o}/><path d='M-3-2l-2 4M1-2l-2 4M5-2l-2 4' stroke='#D9A94E' stroke-width='.8'/></g>`; }).join('');
const elbows = (r, a, color, n = 16) => Array.from({ length: n }, () => { const t = r() * 6.28, d = Math.sqrt(r()) * 0.8; const x = a.cx + Math.cos(t) * a.rx * d, y = a.cy + Math.sin(t) * a.ry * d - 2; return `<path d='M${(x - 4).toFixed(1)} ${y.toFixed(1)}a4 4 0 0 1 8 0' transform='rotate(${Math.round(r() * 300)} ${x.toFixed(1)} ${y.toFixed(1)})' fill='none' stroke='${INK}' stroke-width='4.4' stroke-linecap='round'/><path d='M${(x - 4).toFixed(1)} ${y.toFixed(1)}a4 4 0 0 1 8 0' transform='rotate(${Math.round(r() * 300)} ${x.toFixed(1)} ${y.toFixed(1)})' fill='none' stroke='${color}' stroke-width='2.4' stroke-linecap='round'/>`; }).join('');
const drizzle = (a, c, w = 2) => `<path d='M${a.cx - a.rx * 0.6} ${a.cy}q${a.rx * 0.2} -6 ${a.rx * 0.4} 0t${a.rx * 0.4} 0 ${a.rx * 0.4} 0' fill='none' stroke='${c}' stroke-width='${w}' stroke-linecap='round'/>`;
const pita = (x, y, rot = -12) => `<g transform='translate(${x} ${y}) rotate(${rot})'><path d='M-18 4c0-10 8-16 18-16s18 6 18 16z' fill='#E9C98A' ${O}/>${[[-8, -4], [2, -8], [8, -2]].map(([a, b]) => `<circle cx='${a}' cy='${b}' r='1.4' fill='#C99A55'/>`).join('')}</g>`;
const breadSlice = (x, y, rot = 0) => `<g transform='translate(${x} ${y}) rotate(${rot})'><path d='M-14 8v-14c0-6 4-10 14-10s14 4 14 10v14z' fill='#D9984A' ${O}/><path d='M-10 6v-11c0-4 3-7 10-7s10 3 10 7v11z' fill='#F6DFA8'/></g>`;
const skewer = (x, y, pieces, rot = -6) => `<g transform='translate(${x} ${y}) rotate(${rot})'><path d='M-44 0h88' stroke='#8A5A34' stroke-width='2.4'/>${pieces.map((c, i) => `<rect x='${-36 + i * 15}' y='-6' width='13' height='12' rx='4' fill='${c}' ${o}/>`).join('')}</g>`;

// sauce / soup colours by what's in it
const COL = { tomato: '#D9472B', curry: '#E0892E', butter: '#E77A33', dal: '#F0B23A', dark: '#7A3A24', brown: '#8E5432', cream: '#F2E2B4', cheese: '#F6C24A', green: '#7BAA4A', black: '#3A2E2E', red_oil: '#C2361F', broth: '#EBC77E', lemon: '#FBE7A0', bean: '#D08A4A', wine: '#6E2430', soy: '#7A4423' };

const MAKERS = [
  [/gambas|garlic shrimp/, (r) => { const v = cazuela(); return v.back + fill(v.area, '#E9B24A') + scatter(r, ['garlic', 'chili', 'herb'], 9, v.area, 1) + scatter(r, 'shrimp', 6, v.area, 1.25) + breadSlice(-58, 6, -14); }],
  [/gyeranjjim|steamed egg/, (r) => { const v = ttukbaegi(); return v.back + `<path d='M-32-4q0-22 32-24 32 2 32 24z' fill='#FFD84A' ${O}/><path d='M-20-14q8-8 18-8' stroke='#FFF0A8' stroke-width='3' fill='none'/>` + scatter(r, 'scallion', 7, { cx: 0, cy: -12, rx: 22, ry: 6 }, 1.1) + bit('sesame', 6, -16) + bit('sesame', -8, -10); }],
  [/gyeran.?mari|rolled omelet/, (r) => plate() + [-24, -8, 8, 24].map((x) => `<g transform='translate(${x} 2)'><rect x='-7' y='-14' width='14' height='18' rx='6' fill='#FFD84A' ${O}/><path d='M-3-10a3 3 0 1 0 6 2' fill='none' stroke='#E8B21A' stroke-width='1.4'/>${bit('carrot', -2, -2, 0.5)}${bit('scallion', 3, -6, 0.6)}</g>`).join('') + bit('herb', 34, 6)],
  [/omurice/, () => plate() + `<path d='M-40 8q-2-26 40-28 42 2 40 28z' fill='#FFCF3A' ${O}/><path d='M-26-6q10-10 24-10' stroke='#FFE98A' stroke-width='3' fill='none'/><path d='M-24-8l8-6 8 6 8-6 8 6 8-6 8 6' fill='none' stroke='#C8262A' stroke-width='3.4' stroke-linecap='round'/>` + bit('herb', 20, -14)],
  [/kai jeow|thai omelet/, (r) => plate() + rice(r, -14, 10, 26, 16) + `<path d='M-6 8c-4-10 4-20 18-20 12 0 22 6 22 14 0 8-10 10-22 10-8 0-16 2-18-4z' fill='#F2B33A' ${O}/><path d='M4-4q8-6 18-4M8 2q6-3 12-2' stroke='#D98C1A' stroke-width='1.6' fill='none'/>` + bit('chili', 30, 4) + bit('cucumber', -40, 8)],
  [/tomato egg/, (r) => { const a = { cx: 0, cy: 6, rx: 38, ry: 9 }; return plate() + scatter(r, 'scramble', 9, a, 1.3) + scatter(r, 'tomato', 7, a, 1.3) + scatter(r, 'scallion', 6, a, 1.1); }],
  [/shrimp and eggs/, (r) => { const a = { cx: 0, cy: 6, rx: 38, ry: 9 }; return plate() + scatter(r, 'scramble', 10, a, 1.3) + scatter(r, 'shrimp', 5, a, 1.2) + scatter(r, 'scallion', 6, a, 1.1); }],
  [/tortilla espa|spanish omelet/, () => plate() + `<path d='M-36 6v-8q0-10 36-10t36 10v8q0 10-36 10t-36-10z' fill='#E9A93A' ${O}/><ellipse cx='0' cy='-2' rx='36' ry='10' fill='#F6C04E' ${O}/><path d='M0-2l30 8v8l-30-8z' fill='#FFE7A0' ${O}/>${[[8, 2], [16, 4], [22, 6]].map(([x, y]) => `<rect x='${x}' y='${y}' width='4' height='3' fill='#F2D38A' ${o}/>`).join('')}`],
  [/shakshuka/, (r) => { const v = skillet(); return v.back + fill(v.area, COL.tomato) + scatter(r, 'pepper_red', 5, v.area, 1) + [[-18, 0], [14, -2], [-2, 6], [24, 6]].map(([x, y]) => bit('fried_egg', x, y, 1.15)).join('') + scatter(r, 'herb', 6, v.area, 0.9); }],
  [/menemen|strapatsada/, (r) => { const v = skillet(); return v.back + fill(v.area, '#E4743A') + scatter(r, 'scramble', 10, v.area, 1.3) + scatter(r, ['pepper_green', 'tomato'], 6, v.area, 1) + (/strapatsada/.test(r.title) ? scatter(r, 'feta', 6, v.area, 1.1) : scatter(r, 'herb', 4, v.area)); }],
  [/firfir/, (r) => injera() + injeraDots(r) + scatter(r, 'scramble', 9, { cx: 0, cy: 4, rx: 30, ry: 7 }, 1.3) + scatter(r, 'tomato', 5, { cx: 0, cy: 4, rx: 30, ry: 7 }) + bit('chili', 26, 2)],
  [/doro wat/, (r) => injera() + injeraDots(r) + `<path d='M-30 6q2-16 30-18 28 2 30 18z' fill='${COL.dark}' ${O}/>` + bit('chicken', -10, -2, 1.5) + bit('half_egg', 10, -2, 1.3) + bit('half_egg', -2, 4, 1.1)],
  [/misir wat/, (r) => injera() + injeraDots(r) + `<path d='M-28 6q2-14 28-16 26 2 28 16z' fill='#B8361F' ${O}/>` + scatter(r, 'herb', 3, { cx: 0, cy: 0, rx: 18, ry: 4 }, 0.8)],
  [/kik alicha/, (r) => injera() + injeraDots(r) + `<path d='M-28 6q2-14 28-16 26 2 28 16z' fill='#EFC23A' ${O}/>` + scatter(r, 'herb', 3, { cx: 0, cy: 0, rx: 18, ry: 4 }, 0.8)],
  [/atakilt/, (r) => injera() + injeraDots(r) + `<path d='M-30 6q2-14 30-16 28 2 30 16z' fill='#F0B83A' ${O}/>` + scatter(r, ['potato', 'carrot', 'cabbage'], 10, { cx: 0, cy: 0, rx: 22, ry: 5 }, 1.1)],
  [/\bwat\b|ethiopian|injera/, (r) => injera() + injeraDots(r) + [[-24, '#B8361F'], [0, '#EFC23A'], [24, '#7A9A3A']].map(([x, c]) => `<path d='M${x - 14} 8q1-10 14-11 13 1 14 11z' fill='${c}' ${O}/>`).join('')],
  [/pad thai/, (r) => { const a = { cx: 0, cy: -6, rx: 30, ry: 8 }; return plate() + noodles(0, 10, 38, 22, '#E8B56A', '#C98E3E') + scatter(r, ['shrimp', 'chicken'], 5, a, 1.1) + scatter(r, ['sprout', 'peanut', 'scallion'], 10, a, 1) + bit('lime', 36, 8, 1.2); }],
  [/lo mein|chow mein/, (r) => { const a = { cx: 0, cy: -6, rx: 30, ry: 8 }; return plate() + noodles(0, 10, 38, 22, '#C98B3E', '#8E5A22') + scatter(r, ['chicken', 'cabbage', 'carrot_strip', 'scallion'], 14, a, 1.1); }],
  [/japchae/, (r) => { const a = { cx: 0, cy: -6, rx: 30, ry: 8 }; return plate() + noodles(0, 10, 38, 20, '#B39A86', '#7E6658') + scatter(r, ['spinach', 'carrot_strip', 'mushroom', 'pepper_red', 'beef'], 13, a, 1.05) + scatter(r, 'sesame', 10, a); }],
  [/vermicelli|vietnamese noodle|\bbun\b/, (r) => { const v = bowl('#FFFFFF', '#2F6DB5'); return v.back + noodles(0, 2, 34, 14, '#FBF6EA', '#E3DAC6') + scatter(r, ['lettuce', 'carrot_strip', 'herb'], 7, v.area, 1) + scatter(r, 'chicken', 5, { ...v.area, cy: -6 }, 1.2) + scatter(r, 'peanut', 4, { ...v.area, cy: -8 }, 1); }],
  [/pho|ramen|udon|noodle soup/, (r) => { const v = bowl('#FFFFFF', '#C8352F'); return v.back + fill(v.area, COL.broth) + noodles(0, 2, 28, 8, '#F6E7B6', '#D9C27A') + scatter(r, ['beef', 'scallion', 'herb'], 9, v.area, 1.1) + bit('half_egg', 18, -2, 1.2); }],
  [/fideo/, (r) => { const v = bowl('#F6E3B4', '#1F7A8C'); return v.back + fill(v.area, '#D9572E') + scatter(r, 'carrot_strip', 0, v.area) + Array.from({ length: 12 }, () => `<path d='M${(r() * 60 - 30).toFixed(1)} ${(r() * 10 - 5).toFixed(1)}q3-3 6 0' stroke='#F6D47A' stroke-width='2' fill='none'/>`).join('') + scatter(r, ['herb', 'avocado'], 5, v.area, 1); }],
  [/pasta e fagioli/, (r) => { const v = bowl('#FFFFFF', '#6B8F3E'); return v.back + fill(v.area, '#C9743A') + scatter(r, ['bean_white', 'carrot', 'herb'], 12, v.area, 1.05) + penne(r, v.area, '#F6D47A', 6); }],
  [/chili mac/, (r) => { const v = skillet(); return v.back + fill(v.area, '#B8542E') + elbows(r, v.area, '#F6C24A', 14) + scatter(r, ['mince', 'melt'], 8, v.area, 1); }],
  [/mac and cheese|macaroni/, (r) => { const v = bakingDish(); return v.back + fill(v.area, COL.cheese) + elbows(r, v.area, '#FFDF7A', 22) + `<path d='M-30-2q10-6 22 0' stroke='#E39B2F' stroke-width='3' fill='none' opacity='.6'/>`; }],
  [/lasagn/, () => plate() + `<path d='M-28 10l8-26h40l8 26z' fill='#E9A93A' ${O}/>${[-12, -4, 4].map((y, i) => `<path d='M${-26 + i} ${y + 6}h${54 - i * 2}' stroke='${i % 2 ? '#F2E2B4' : COL.tomato}' stroke-width='4'/>`).join('')}<path d='M-20-16h40l-4 4h-32z' fill='#F6C24A' ${O}/><path d='M-14-14l6 4 4-4 6 4' stroke='#D9472B' stroke-width='2' fill='none'/>` + bit('basil', 18, -18, 1.1)],
  [/aglio|olio/, (r) => { const a = { cx: 0, cy: -8, rx: 26, ry: 7 }; return plate() + spaghetti(0, 10, '#F2D27A', '#D9AE4E') + scatter(r, ['garlic', 'chili', 'herb', 'parm'], 12, a, 1); }],
  [/bolognese|meat sauce/, (r) => plate() + spaghetti(0, 10, '#F2D27A', '#D9AE4E') + `<path d='M-18-6q2-12 18-12 16 0 18 12-8 4-18 4t-18-4z' fill='#9C3A22' ${O}/>` + scatter(r, ['mince', 'parm'], 8, { cx: 0, cy: -10, rx: 14, ry: 4 }, 1) + bit('basil', 10, -18, 1.1)],
  [/arrabbiata|penne/, (r) => { const a = { cx: 0, cy: 4, rx: 38, ry: 9 }; return plate() + `<ellipse cx='0' cy='4' rx='40' ry='11' fill='${COL.tomato}'/>` + penne(r, a, '#F2C96A', 16) + scatter(r, ['chili', 'basil', 'parm'], 8, a, 1); }],
  [/prawn|shrimp.*pasta|pasta.*shrimp/, (r) => { const a = { cx: 0, cy: -8, rx: 26, ry: 7 }; return plate() + spaghetti(0, 10, '#F0A35A', '#D9572E') + scatter(r, 'shrimp', 5, a, 1.3) + scatter(r, ['herb', 'chili'], 6, a); }],
  [/spinach pasta|bacon and spinach/, (r) => { const a = { cx: 0, cy: 4, rx: 38, ry: 9 }; return plate() + `<ellipse cx='0' cy='4' rx='40' ry='11' fill='${COL.cream}'/>` + penne(r, a, '#F2C96A', 14) + scatter(r, ['bacon', 'spinach', 'parm'], 12, a, 1.1); }],
  [/cajun.*pasta|creamy.*pasta/, (r) => { const a = { cx: 0, cy: 4, rx: 38, ry: 9 }; return plate() + `<ellipse cx='0' cy='4' rx='40' ry='11' fill='#EFA05A'/>` + penne(r, a, '#F2C96A', 14) + scatter(r, ['chicken', 'pepper_red', 'herb'], 10, a, 1.1); }],
  [/spaghetti|pasta|linguine|fettuccine/, (r) => plate() + spaghetti(0, 10, '#F2D27A', '#D9AE4E') + `<path d='M-16-6q2-10 16-10 14 0 16 10-8 3-16 3t-16-3z' fill='${COL.tomato}' ${O}/>` + bit('basil', 8, -16, 1.1) + bit('parm', -4, -10)],
  [/crispy.*taco|hard.*taco|beef taco/, (r) => plate() + [-30, 0, 30].map((x) => `<g transform='translate(${x} 2)'><path d='M-15 8a15 15 0 0 1 30 0z' fill='#F2C14E' ${O}/><path d='M-12 2q12-14 24 0' fill='#7A3E26'/>${bit('lettuce', -4, -6, 0.8)}${bit('cheese', 4, -6)}${bit('tomato', 0, -2, 0.8)}<path d='M-15 8a15 15 0 0 1 30 0' fill='none' ${O}/></g>`).join('')],
  [/taco/, (r) => plate() + [-30, 0, 30].map((x) => `<g transform='translate(${x} 4)'><path d='M-16 6q0-18 16-18t16 18z' fill='#EFD8A0' ${O}/><path d='M-12 2q2-10 12-10t12 10z' fill='#B8542E'/>${bit('onion_ring', -4, -4, 0.7)}${bit('herb', 4, -6, 0.9)}${bit('lime', 8, 0, 0.6)}<path d='M-16 6q0-18 16-18t16 18' fill='none' ${O}/></g>`).join('')],
  [/enchilad|enfrijolad/, (r) => { const v = bakingDish('#FFFFFF'); const black = /frijol/.test(r.title); return v.back + fill(v.area, black ? COL.black : '#B8361F') + [-36, -12, 12, 36].map((x) => `<rect x='${x - 10}' y='-10' width='20' height='22' rx='8' fill='${black ? '#E9D3A0' : '#E9A060'}' ${O}/>`).join('') + `<path d='M-44-2q10-6 22 0t22 0 22 0 22 0' stroke='${black ? '#F4EFE4' : '#F6C24A'}' stroke-width='4' fill='none' stroke-linecap='round'/>` + scatter(r, ['herb', 'onion_ring'], 6, { cx: 0, cy: -2, rx: 40, ry: 6 }, 1); }],
  [/quesadilla/, (r) => plate() + [[-22, 0, -10], [6, 2, 12], [26, -2, -4]].map(([x, y, rot]) => `<g transform='translate(${x} ${y}) rotate(${rot})'><path d='M-16 8l16-22 16 22z' fill='#E9B65E' ${O}/><path d='M-12 6h24' stroke='#FFC94A' stroke-width='4'/>${bit('bean_black', -2, 3, 0.8)}${bit('corn', 4, 3, 0.8)}</g>`).join('') + bit('lime', 40, 10)],
  [/burrito bowl|bowl.*burrito/, (r) => { const v = bowl('#FFFFFF', '#E0A93B'); return v.back + `<ellipse cx='0' cy='0' rx='40' ry='8' fill='#FFFFFF'/>` + scatter(r, 'bean_black', 8, { cx: -20, cy: 0, rx: 12, ry: 4 }, 1.1) + scatter(r, 'tomato', 5, { cx: 6, cy: -2, rx: 10, ry: 4 }, 1) + scatter(r, 'cheese', 6, { cx: 22, cy: 1, rx: 10, ry: 4 }) + bit('avocado', -2, 4, 1.1); }],
  [/sloppy joe|burger/, () => plate() + `<path d='M-30 4q0-8 30-8t30 8v4h-60z' fill='#E5A55A' ${O}/><path d='M-32 0q8 6 16 0t16 2 16-2 16 2v-6q-32-8-64 0z' fill='#9C3A22' ${O}/><path d='M-30-4q0-22 30-22t30 22z' fill='#E39B4A' ${O}/>${[[-14, -16], [0, -20], [12, -14]].map(([x, y]) => `<ellipse cx='${x}' cy='${y}' rx='2' ry='1.2' fill='#FFF6DE'/>`).join('')}`],
  [/croque|cheese on toast|grilled cheese|toast/, () => plate() + `<path d='M-30 10v-8l6-22h48l6 22v8z' fill='#D9984A' ${O}/><path d='M-28 2l6-20h44l6 20z' fill='#F6C24A' ${O}/><path d='M-20-8q6-4 12 0M2-12q6 4 12 0M-4 0q8-4 14 0' stroke='#D98C1A' stroke-width='2.4' fill='none'/>`],
  [/shepherd|cottage pie/, (r) => { const v = bakingDish('#C9603A'); return v.back + fill(v.area, '#F6DDA0') + Array.from({ length: 6 }, (_, i) => `<path d='M${-44 + i * 16} 2q4-10 8 0' stroke='#D9A04E' stroke-width='3' fill='none'/>`).join('') + bit('herb', 30, -6); }],
  [/pot pie|\bpie\b/, () => `${shadow(54)}<path d='M-50 0q2 18 50 20 48-2 50-20z' fill='#E8E2D4' ${O}/><ellipse cx='0' cy='0' rx='50' ry='14' fill='#E9A94E' ${O}/><path d='M-48 0q8 5 16 0t16 0 16 0 16 0 16 0 16 0' stroke='#C98A3A' stroke-width='3' fill='none'/><path d='M-8-6l6 4M4-8l4 6M-14 2l8-2' stroke='#9C6A2A' stroke-width='2.4'/>`],
  [/toad in the hole/, (r) => { const v = bakingDish(); return v.back + `<path d='M-52 4q4-20 26-14 6-12 26-8 20-6 28 8 22 0 24 14z' fill='#E9B04E' ${O}/>` + [-28, -6, 16, 36].map((x, i) => bit('link', x, -2 + (i % 2) * 4, 0.9, i * 10 - 10)).join(''); }],
  [/bangers|mash/, (r) => plate() + `<path d='M-40 10q0-22 22-24 22 2 22 24z' fill='#FBF0D2' ${O}/><path d='M-30-2q8-6 16 0' stroke='#E9D9AE' stroke-width='3' fill='none'/>` + bit('link', 18, -2, 1.3, -10) + bit('link', 22, 8, 1.3, 6) + `<path d='M-10 8q20 6 44 0' stroke='#7A4423' stroke-width='6' fill='none' stroke-linecap='round'/>` + scatter(r, 'pea', 6, { cx: -32, cy: 12, rx: 10, ry: 3 })],
  [/grits/, (r) => { const v = bowl('#FFFFFF', '#2F6DB5'); return v.back + fill(v.area, '#FBF0CF') + scatter(r, 'shrimp', 5, v.area, 1.3) + scatter(r, ['scallion', 'bacon'], 8, v.area, 1); }],
  [/gratin|dauphinoise/, (r) => { const v = bakingDish('#FFFFFF'); return v.back + fill(v.area, '#F2C46A') + Array.from({ length: 9 }, (_, i) => `<path d='M${-44 + i * 11} 6q5-12 10 0' fill='#F6DDA0' ${o}/>`).join('') + `<path d='M-30-4q8-4 14 2M8-6q6 6 14 2' stroke='#C9822E' stroke-width='3' fill='none'/>` + bit('herb', 30, -4); }],
  [/tonkatsu|cutlet|schnitzel/, (r) => plate() + scatter(r, 'cabbage', 14, { cx: 26, cy: 4, rx: 14, ry: 6 }, 1.2) + [-34, -20, -6, 8].map((x) => `<g transform='translate(${x} 2) rotate(-8)'><rect x='-6' y='-12' width='12' height='18' rx='3' fill='#D9953E' ${O}/><rect x='-3' y='-9' width='6' height='12' fill='#F7EBD8'/></g>`).join('') + bit('lemon', 40, 12)],
  [/falafel/, (r) => plate() + pita(-30, 4) + [[-2, 0], [12, -4], [24, 2], [8, 6]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='7' fill='#8E5A2A' ${O}/><circle cx='${x - 2}' cy='${y - 2}' r='1.4' fill='#5E9C3A'/>`).join('') + `<path d='M-2 12q12 4 28 0' stroke='#F4EBD8' stroke-width='3.4' fill='none' stroke-linecap='round'/>` + bit('tomato', 36, 8) + bit('cucumber', 40, 2)],
  [/shawarma|gyro|wrap/, (r) => plate() + `<g transform='rotate(-14)'><path d='M-30 6l52-18c6 0 8 8 2 12l-50 16z' fill='#EFD8A0' ${O}/><path d='M18-8c6-2 10 2 8 6l-6 2' fill='#D9A55A' ${O}/>${bit('chicken', 18, -4)}${bit('lettuce', 22, -8, 0.6)}${bit('tomato', 26, -4, 0.6)}</g>` + bit('cucumber', 30, 12) + bit('onion_ring', 40, 8)],
  [/souvlaki/, () => plate() + skewer(0, -4, ['#D9A55A', '#D9A55A', '#E9C27A', '#D9A55A', '#D9A55A']) + pita(-28, 12, 0) + `<ellipse cx='28' cy='10' rx='12' ry='5' fill='#F4F1EA' ${O}/>` + bit('herb', 28, 8, 0.7) + bit('lemon', 46, 6)],
  [/kofta|kebab/, () => plate() + skewer(0, -6, ['#8E4A2A', '#8E4A2A', '#8E4A2A', '#8E4A2A'], -4) + skewer(4, 6, ['#9C552E', '#9C552E', '#9C552E', '#9C552E'], 4) + bit('onion_ring', -36, 12) + bit('herb', 36, 12) + bit('tomato', 40, 4)],
  [/mapo/, (r) => { const v = bowl('#FFFFFF', '#C8352F'); return v.back + fill(v.area, COL.red_oil) + scatter(r, 'tofu', 9, v.area, 1.4) + scatter(r, ['mince', 'scallion', 'chili'], 9, v.area, 1); }],
  [/kung pao/, (r) => { const a = { cx: 0, cy: 6, rx: 38, ry: 9 }; return plate() + `<ellipse cx='0' cy='6' rx='38' ry='9' fill='#8E4423' opacity='.85'/>` + scatter(r, 'chicken', 8, a, 1.2) + scatter(r, ['peanut', 'chili_whole', 'scallion'], 10, a, 1); }],
  [/cashew/, (r) => { const a = { cx: 0, cy: 6, rx: 38, ry: 9 }; return plate() + `<ellipse cx='0' cy='6' rx='38' ry='9' fill='#A0602E' opacity='.8'/>` + scatter(r, 'chicken', 8, a, 1.2) + scatter(r, ['cashew', 'pepper_red', 'scallion', 'pepper_green'], 11, a, 1); }],
  [/basil chicken|kra ?pao|krapow/, (r) => plate() + rice(r, -16, 10, 24, 18) + `<path d='M2 8q2-12 18-12t18 12z' fill='#7A4423' ${O}/>` + scatter(r, ['mince', 'basil', 'chili'], 9, { cx: 20, cy: 2, rx: 14, ry: 4 }, 1) + bit('fried_egg', -14, -12, 1.2)],
  [/oyakodon/, (r) => { const v = bowl('#2E2B2B', '#C8352F'); return v.back + `<ellipse cx='0' cy='0' rx='40' ry='8' fill='#FFFFFF'/>` + `<path d='M-34 0q10-10 34-10t34 10q-10 6-34 6t-34-6z' fill='#F6CB4A' ${O}/>` + scatter(r, ['chicken', 'onion_ring', 'scallion'], 10, { cx: 0, cy: -2, rx: 28, ry: 5 }, 1.05); }],
  [/soboro/, (r) => { const v = bowl('#2E2B2B', '#C8352F'); return v.back + `<ellipse cx='0' cy='0' rx='40' ry='8' fill='#FFFFFF'/><path d='M-38 0q10-8 22-8v14q-14 0-22-6z' fill='#FFD84A' ${o}/><path d='M-16-8h30v14h-30z' fill='#9C6A3E' ${o}/><path d='M14-8q14 0 24 8-8 6-24 6z' fill='#7BC25A' ${o}/>`; }],
  [/caramel.*pork|pork bowl/, (r) => { const v = bowl('#FFFFFF', '#1F6F78'); return v.back + `<ellipse cx='0' cy='0' rx='40' ry='8' fill='#FFFFFF'/>` + `<path d='M-8-2q2-10 22-10t22 10z' fill='#8A4A22' ${O}/>` + scatter(r, ['herb', 'chili', 'cucumber', 'carrot_strip'], 8, v.area, 1); }],
  [/fried rice|khao pad|nasi goreng/, (r) => plate() + rice(r, 0, 10, 36, 24, /khao|thai/.test(r.title) ? '#F6E7C0' : '#F2DFA8') + scatter(r, ['pea', 'carrot', 'scramble', 'scallion'], 14, { cx: 0, cy: -2, rx: 24, ry: 8 }, 0.9) + (/khao|thai/.test(r.title) ? bit('lime', 40, 10) + bit('cucumber', -40, 10) : '')],
  [/jambalaya/, (r) => { const v = skillet(); return v.back + fill(v.area, '#D9773A') + scatter(r, ['sausage', 'shrimp', 'chicken', 'scallion', 'pepper_green'], 16, v.area, 1); }],
  [/red beans and rice/, (r) => plate() + rice(r, -10, 10, 26, 18) + `<path d='M2 10q2-14 20-14t20 14z' fill='#8E3A2A' ${O}/>` + scatter(r, ['bean_red', 'sausage', 'scallion'], 10, { cx: 20, cy: 4, rx: 14, ry: 4 }, 1)],
  [/rice and peas/, (r) => plate() + rice(r, 0, 10, 36, 22) + scatter(r, 'bean_red', 12, { cx: 0, cy: -2, rx: 24, ry: 8 }, 1) + bit('herb', 28, 0)],
  [/arroz con pollo|paella/, (r) => { const v = skillet(); return v.back + fill(v.area, '#F2C14E') + scatter(r, ['chicken', 'pea', 'pepper_red', 'olive'], 16, v.area, 1.1) }],
  [/dirty rice/, (r) => { const v = skillet(); return v.back + fill(v.area, '#A8743E') + scatter(r, ['mince', 'pepper_green', 'scallion'], 16, v.area, 1); }],
  [/hashweh/, (r) => plate() + rice(r, 0, 10, 36, 22, '#C99A62') + scatter(r, ['mince', 'pine', 'herb'], 14, { cx: 0, cy: -2, rx: 24, ry: 8 }, 1.1)],
  [/mujadara/, (r) => plate() + rice(r, 0, 10, 36, 22, '#B08A5E') + scatter(r, 'crispy_onion', 12, { cx: 0, cy: -6, rx: 22, ry: 6 }, 1.2)],
  [/spanakorizo/, (r) => { const v = bowl('#FFFFFF', '#2F6DB5'); return v.back + fill(v.area, '#C9D9A0') + scatter(r, ['spinach', 'herb'], 9, v.area, 1) + bit('lemon', 22, -2, 1.1) + scatter(r, 'feta', 3, v.area); }],
  [/shrimp and rice|shrimp.*rice/, (r) => { const v = skillet(); return v.back + fill(v.area, '#F6E2B0') + scatter(r, ['shrimp', 'pea', 'pepper_red'], 15, v.area, 1.1); }],
  [/chicken and rice|chicken.*rice/, (r) => { const v = skillet(); return v.back + fill(v.area, '#F2DFA8') + scatter(r, 'chicken', 6, v.area, 1.6) + scatter(r, ['spinach', 'herb'], 6, v.area, 1); }],
  [/rice/, (r) => { const v = bowl('#FFFFFF', '#3F7F25'); return v.back + rice(r, 0, 2, 32, 14) + bit('garlic', 6, -10) + bit('herb', -6, -8); }],
  [/dumpling/, (r) => { const v = bowl('#FFFFFF', '#2F6DB5'); return v.back + fill(v.area, COL.cream) + scatter(r, ['chicken', 'carrot', 'herb'], 8, v.area, 1) + [[-14, -2], [6, -4], [18, 2]].map(([x, y]) => `<path d='M${x - 8} ${y + 2}q0-8 8-8t8 8z' fill='#FBF3DE' ${o}/>`).join(''); }],
  [/feijoada/, (r) => { const v = bowl('#4A3A33', '#C2603A'); return v.back + fill(v.area, COL.black) + scatter(r, ['sausage', 'bacon', 'pork', 'bean_black'], 12, v.area, 1.1) + bit('herb', -24, -2); }],
  [/ful medames|fava/, (r) => { const v = bowl('#F6E3B4', '#1F6F78'); return v.back + fill(v.area, '#9C6A3A') + scatter(r, 'fava', 10, v.area, 1.1) + drizzle(v.area, '#E9C440') + scatter(r, ['herb', 'tomato'], 4, v.area); }],
  [/soup|shorbet|avgolemono|fasolada|chowder|caldo/, (r) => { const t = r.title; const v = bowl('#FFFFFF', '#2F6DB5');
    const col = /hamburger|tomato/.test(t) ? '#C9542E' : /lentil|adas/.test(t) ? '#F0A23A' : /cheesy|potato|chowder/.test(t) ? '#F6D27A' : /avgolemono|lemon/.test(t) ? '#FBE7A0' : /fasolada|bean/.test(t) ? '#D98A4A' : '#F2D58A';
    const tops = /hamburger/.test(t) ? ['mince', 'potato', 'carrot', 'herb'] : /lentil|adas/.test(t) ? ['herb', 'lemon'] : /cheesy|potato/.test(t) ? ['bacon', 'scallion', 'cheese'] : /avgolemono/.test(t) ? ['chicken', 'herb'] : /fasolada|bean/.test(t) ? ['bean_white', 'carrot', 'herb'] : ['chicken', 'carrot', 'herb', 'pea'];
    return v.back + fill(v.area, col) + scatter(r, tops, 10, v.area, 1.05); }],
  [/curry|masala|makhani|tikka|keema|tadka|\bdal\b|chana|korma|vindaloo/, (r) => { const t = r.title;
    const col = /butter|makhani|tikka/.test(t) ? COL.butter : /dal|tadka/.test(t) ? COL.dal : /keema/.test(t) ? '#8A4A2E' : /chana/.test(t) ? '#B5652E' : /jamaican/.test(t) ? '#E9B23A' : COL.curry;
    const tops = /egg/.test(t) ? ['half_egg', 'herb'] : /dal|tadka/.test(t) ? ['herb', 'chili', 'garlic'] : /keema/.test(t) ? ['mince', 'pea', 'herb'] : /chana/.test(t) ? ['chickpea', 'onion_ring', 'herb'] : /jamaican/.test(t) ? ['chicken', 'potato', 'carrot'] : ['chicken', 'herb'];
    const v = bowl('#C9CDD2', '#9AA0A6', 30);
    return plate(60) + rice(r, -32, 14, 20, 14) + `<g transform='translate(14 -2)'>${v.back}${fill(v.area, col)}${/butter|makhani/.test(t) ? drizzle(v.area, '#FFF6E0') : ''}${scatter(r, tops, 9, v.area, 1.05)}</g>`; }],
  [/stew|creole|fricass|coq au vin|stroganoff|picadillo|goulash|smothered/, (r) => { const t = r.title;
    const col = /coq au vin/.test(t) ? COL.wine : /fricass/.test(t) ? COL.cream : /stroganoff/.test(t) ? '#E59A6A' : /picadillo/.test(t) ? '#8A4A2E' : /smothered/.test(t) ? '#A8743E' : COL.tomato;
    const tops = /coq au vin/.test(t) ? ['chicken', 'mushroom', 'bacon', 'herb'] : /fricass/.test(t) ? ['chicken', 'mushroom', 'herb'] : /stroganoff/.test(t) ? ['chicken', 'mushroom', 'potato'] : /picadillo/.test(t) ? ['mince', 'olive', 'potato', 'pepper_green'] : /shrimp|creole/.test(t) ? ['shrimp', 'pepper_green', 'herb'] : /smothered/.test(t) ? ['chicken', 'onion_ring', 'herb'] : ['chicken', 'potato', 'carrot'];
    const v = bowl('#FFFFFF', '#C2603A'); return v.back + fill(v.area, col) + scatter(r, tops, 10, v.area, 1.15); }],
  [/teriyaki|bulgogi|garlic pepper chicken|caramel.*chicken|ginger chicken|lemon pepper|stir.?fr|dakbokkeum|braised/, (r) => { const t = r.title;
    const col = /lemon pepper/.test(t) ? '#E9C27A' : /dakbokkeum|braised/.test(t) ? '#C2361F' : COL.soy;
    const tops = /bulgogi/.test(t) ? ['beef', 'beef', 'onion_ring', 'carrot_strip', 'scallion', 'sesame'] : /lemon pepper/.test(t) ? ['chicken', 'chicken', 'lemon', 'cucumber', 'herb'] : /dakbokkeum|braised/.test(t) ? ['chicken', 'potato', 'carrot', 'scallion'] : ['chicken', 'chicken', 'scallion', 'sesame', 'garlic'];
    const a = { cx: 12, cy: 4, rx: 24, ry: 7 };
    return plate() + rice(r, -30, 12, 18, 14) + `<ellipse cx='12' cy='5' rx='26' ry='8' fill='${col}' opacity='.9'/>` + scatter(r, tops, 12, a, 1.2); }]
];
// anything else: what the ingredients say, on a plate
function generic(r, key) {
  const k = (key || []).join(' ').toLowerCase();
  const prot = /shrimp|prawn/.test(k) ? 'shrimp' : /beef|steak/.test(k) ? 'beef' : /pork/.test(k) ? 'pork' : /sausage/.test(k) ? 'sausage' : /chicken|turkey/.test(k) ? 'chicken' : /tofu/.test(k) ? 'tofu' : /egg/.test(k) ? 'scramble' : /bean|lentil|chickpea/.test(k) ? 'chickpea' : 'potato';
  const veg = ['herb', /tomato/.test(k) ? 'tomato' : 'carrot', /pepper/.test(k) ? 'pepper_red' : 'pea', /spinach|greens/.test(k) ? 'spinach' : 'scallion'];
  const a = { cx: 10, cy: 4, rx: 26, ry: 7 };
  return plate() + rice(r, -28, 12, 18, 14, /potato/.test(k) ? '#FBF0D2' : '#FFFFFF') + scatter(r, prot, 7, a, 1.4) + scatter(r, veg, 8, a, 1);
}
const DRUM = (x, y) => `<g transform='translate(${x} ${y}) rotate(-20)'><path d='M6 0h10' stroke='${INK}' stroke-width='6' stroke-linecap='round'/><path d='M6 0h10' stroke='#F7EEDC' stroke-width='3' stroke-linecap='round'/><ellipse cx='-2' cy='0' rx='10' ry='7' fill='#C9772E' ${o}/></g>`;

export function dishArt({ title, key } = {}) {
  const t = String(title || '').toLowerCase();
  const r = rng(t); r.title = t;
  const m = MAKERS.find(([re]) => re.test(t));
  let svg = m ? m[1](r) : generic(r, key);
  if (/arroz con pollo/.test(t)) svg += DRUM(-14, -2) + DRUM(16, 2);
  return svg;
}
