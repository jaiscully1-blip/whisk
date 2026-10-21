// Regional postcards: a country can have several scenes, and a dish gets the one for the part of the country it
// comes from (Provence for ratatouille, the Alps for fondue …). Matched on the dish title (then its ingredients);
// anything unmatched keeps the country's main landmark (lib/landmarks.js). Same drawing rules as landmarks:
// each draw(x) returns SVG standing on the ground line y = 150, centred on x, about ±100 wide.
// Plain strings.

import { V, INK, hz, tx, q, along, lerp, recede, sil, hills, range, land, water, foam, fog, birds, ribbon, rows as vrows, line, pine as vpine, cypress as vcyp, palm as vpalm, bush as vbush, tree as vtree, boat as vboat, house as vhouse, block as vblock, farTown, put, frontShore } from './art/vista.js';

export const O = "stroke='#3B2C24' stroke-width='2.2' stroke-linejoin='round' stroke-linecap='round'";
export const o = "stroke='#3B2C24' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'";
export const at = (x, body) => `<g transform='translate(${x} 0)'>${body}</g>`;
export const map = (a, f) => a.map(f).join('');

// ---- little parts ----
export const pine = (x, s = 1, c = '#3F6E3A') => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0v-6' stroke='#6B4A2B' stroke-width='3'/><path d='M-12-6l12-34 12 34z' fill='${c}' ${O}/></g>`;
export const cypress = (x, s = 1) => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0q-9-34 0-66 9 32 0 66z' fill='#3F6E3A' ${O}/></g>`;
export const palm = (x, s = 1) => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0q4-30-2-58' fill='none' stroke='#8A5A34' stroke-width='5' stroke-linecap='round'/><g fill='#4F9A4A' ${o}><path d='M-2-58q-20-8-32 6 16-4 32-6z'/><path d='M-2-58q20-10 32 4-16-4-32-4z'/><path d='M-2-58q-10-18-26-14 14 4 26 14z'/><path d='M-2-58q12-18 26-12-14 2-26 12z'/></g></g>`;
export const bush = (x, s = 1, c = '#5E9C4F') => `<g transform='translate(${x} 150) scale(${s})'><path d='M-14 0q-4-16 8-18 4-10 14-4 12-2 10 14 4 6-2 8z' fill='${c}' ${O}/></g>`;
export const mtn = (x, w, h, c = '#8DA3C4', snow = true) => `<path d='M${x - w} 150L${x} ${150 - h}L${x + w} 150z' fill='${c}' ${O}/>${snow ? `<path d='M${x - w * 0.28} ${150 - h * 0.72}L${x} ${150 - h}L${x + w * 0.28} ${150 - h * 0.72}l-6 4-6-6-6 6-6-6z' fill='#FFFFFF' ${o}/>` : ''}`;
export const hill = (x0, x1, top, c) => `<path d='M${x0} 150Q${(x0 + x1) / 2} ${top} ${x1} 150z' fill='${c}' ${O}/>`;
export const boat = (x, y, c = '#D9452B', s = 1) => `<g transform='translate(${x} ${y}) scale(${s})'><path d='M-18 0h36l-6 8h-24z' fill='${c}' ${o}/><path d='M0 0v-24l14 20z' fill='#FFFFFF' ${o}/></g>`;
export const house = (x, w, h, wall, roof, win = '#6E8FA8') => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${wall}' ${O}/><path d='M${x - w / 2 - 5} ${152 - h}L${x} ${150 - h - w * 0.42}L${x + w / 2 + 5} ${152 - h}z' fill='${roof}' ${O}/><rect x='${x - 5}' y='${150 - h * 0.55}' width='10' height='${h * 0.55}' fill='${win}' ${o}/>`;
export const cube = (x, w, h, c = '#FFFFFF', door = '#2F6DB5') => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${c}' ${O}/><rect x='${x - 4}' y='${150 - h * 0.5}' width='8' height='${h * 0.5}' fill='${door}' ${o}/>`;
export const rows = (x0, x1, n, top, c) => map([...Array(n).keys()], (i) => { const y = 150 - (i + 1) * ((150 - top) / (n + 1)); return `<path d='M${x0 + i * 6} ${y}H${x1 - i * 6}' stroke='${c}' stroke-width='4' stroke-linecap='round'/>`; });
export const sun = (x, y, r = 12) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#FFD36B' ${o}/>`;

// ---- France ----
const provence = (x) => at(x, `<path d='M-104 150q60-42 120-32t96 12v20z' fill='#B69AD8' ${O}/>${map([0, 1, 2, 3, 4], (i) => `<path d='M${-96 + i * 10} 150q${40 + i * 8} -${26 - i * 4} ${100 + i * 14} -${22 - i * 3}' fill='none' stroke='#7C5BB8' stroke-width='5' stroke-linecap='round'/>`)}${house(46, 50, 32, '#E9D3A8', '#D07A4E')}${cypress(-62)}${cypress(82, 0.7)}`);
const brittany = (x) => at(x, `<path d='M-40 150v-60q20-14 60-12 50 2 70 16v56h-20q0-30-26-30t-26 30z' fill='#F4EFE4' ${O}/><path d='M-40 90q30-14 130 4' fill='none' stroke='#7FB069' stroke-width='6'/><path d='M-96 150l18-34 14 34z' fill='#F4EFE4' ${O}/><path d='M-30 112h30M40 104h30M-20 132h20' stroke='#C9BFA9' stroke-width='2'/>`);
const marseille = (x) => at(x, `<path d='M-104 150q2-40 24-58 20 8 30 58z' fill='#E6DCC8' ${O}/><path d='M40 150q4-56 30-70 26 16 32 70z' fill='#E6DCC8' ${O}/><path d='M-82 110q8-4 14 4M60 100q8-4 14 4' stroke='#B8AC92' stroke-width='2' fill='none'/>${pine(-60, 0.6, '#4F7E3E')}${pine(86, 0.55, '#4F7E3E')}${boat(-10, 136, '#2F6DB5')}${boat(22, 140, '#D9452B', 0.8)}`);
const alps = (x) => at(x, `${mtn(-50, 60, 96)}${mtn(10, 70, 114, '#9AAED0')}<rect x='22' y='112' width='46' height='38' fill='#B07A48' ${O}/><path d='M14 114l31-24 31 24z' fill='#7A4A2A' ${O}/><rect x='34' y='124' width='10' height='10' fill='#FFE08A' ${o}/>${pine(-86)}${pine(-62, 0.8)}${pine(96, 0.9)}`);
const burgundy = (x) => at(x, `<path d='M-104 150q50-50 110-44t104 20v24z' fill='#9CBF5E' ${O}/>${map([0, 1, 2, 3, 4, 5], (i) => `<path d='M${-92 + i * 30} 150l${10 + i * 2} -${30 - i * 2}' stroke='#5E7F34' stroke-width='4' stroke-linecap='round'/>`)}<rect x='-20' y='70' width='60' height='34' fill='#E8DCC2' ${O}/>${map([-24, 36], (d) => `<rect x='${d}' y='58' width='12' height='46' fill='#E8DCC2' ${O}/><path d='M${d - 3} 60l9-18 9 18z' fill='#4F5E8A' ${O}/>`)}<path d='M0 104v-16a10 10 0 0 1 20 0v16z' fill='#6B4A2B' ${O}/>${map([-70, 60, 90], (d) => `<circle cx='${d}' cy='126' r='4' fill='#6B2A5A' ${o}/>`)}`);
const alsace = (x) => at(x, map([[-62, '#F2C9A0', '#B5452E'], [-18, '#F6E6A8', '#8A3B2A'], [26, '#BFD8E8', '#B5452E'], [70, '#F4D2D9', '#7A4A2A']], ([d, w, r], i) => { const h = 52 + (i % 2) * 10; return `<rect x='${d - 20}' y='${150 - h}' width='40' height='${h}' fill='${w}' ${O}/><path d='M${d - 24} ${152 - h}L${d} ${150 - h - 30}L${d + 24} ${152 - h}z' fill='${r}' ${O}/><path d='M${d - 20} ${150 - h * 0.5}h40M${d - 12} ${150 - h}v${h}M${d + 12} ${150 - h}v${h}M${d - 20} ${150 - h}l24 ${h * 0.5}' stroke='#5A3A26' stroke-width='2' fill='none'/><rect x='${d - 6}' y='${132}' width='12' height='18' fill='#6B4A2B' ${o}/>`; }));
const carcassonne = (x) => at(x, `<path d='M-100 150q50-30 200 0z' fill='#9CBF5E' ${O}/><rect x='-70' y='92' width='140' height='34' fill='#D9C7A3' ${O}/>${map([-70, -24, 24, 70], (d, i) => { const h = 70 + (i % 2) * 14; return `<rect x='${d - 11}' y='${126 - h}' width='22' height='${h}' fill='#D9C7A3' ${O}/><path d='M${d - 14} ${128 - h}l14-26 14 26z' fill='#5A6E9A' ${O}/>`; })}${map([-50, -36, 36, 50], (d) => `<rect x='${d - 3}' y='86' width='6' height='6' fill='#D9C7A3' ${o}/>`)}<path d='M-8 126v-14a8 8 0 0 1 16 0v14z' fill='#6B4A2B' ${o}/>`);

// ---- Italy ----
const colosseum = (x) => at(x, `<path d='M-86 150v-74q86-26 172 0v74z' fill='#E2C89A' ${O}/><path d='M-86 76q86-26 172 0v-12q-86-26-172 0z' fill='#D4B47E' ${O}/>${map([0, 1, 2], (r) => map([-66, -40, -14, 12, 38, 64], (d) => `<path d='M${d} ${146 - r * 24}v-12a6 6 0 0 1 12 0v12z' fill='#8C6A4E' ${o}/>`))}${cypress(-96, 0.7)}`);
const vesuvius = (x) => at(x, `<path d='M-104 150l60-74q14-8 28 0l64 74z' fill='#8E8A86' ${O}/><path d='M-44 76q14-8 28 0' fill='none' stroke='#5E5A56' stroke-width='3'/><path d='M-36 70q-6-14 4-20 2-10 12-6' fill='none' stroke='#C9C3BE' stroke-width='4' stroke-linecap='round'/>${map([[40, 40, '#F6D7A8'], [64, 30, '#F2B9A0'], [86, 44, '#F6E6A8']], ([d, h, c]) => cube(d, 22, h, c, '#3F6E8A'))}${boat(-60, 140, '#2F6DB5', 0.8)}`);
const cinqueTerre = (x) => at(x, `<path d='M-104 150q10-70 70-86 60 4 100 30l38 56z' fill='#7FA95E' ${O}/>${map([[-70, 118, '#F2C14E'], [-50, 108, '#E8735A'], [-30, 98, '#F4D2D9'], [-10, 92, '#86B7D9'], [10, 100, '#F2C14E'], [30, 110, '#E8735A'], [50, 122, '#F6E6A8'], [-60, 136, '#86B7D9'], [-38, 128, '#F2C14E'], [-14, 120, '#E8735A'], [12, 126, '#F4D2D9'], [36, 134, '#86B7D9']], ([d, y, c]) => `<rect x='${d - 9}' y='${y}' width='18' height='${150 - y}' fill='${c}' ${o}/><rect x='${d - 3}' y='${y + 5}' width='6' height='6' fill='#3B5E7A'/>`)}`);
const tuscany = (x) => at(x, `${hill(-104, 30, 70, '#B9C76A')}${hill(-30, 110, 84, '#9CBF5E')}${rows(-80, 10, 4, 112, '#8FA84E')}${house(54, 40, 26, '#E8C99A', '#C0503A')}${map([-96, -84, 20, 84, 96], (d, i) => cypress(d, 0.6 + (i % 2) * 0.2))}<path d='M-60 150q30-20 60-14t40 14' fill='none' stroke='#E8D9B0' stroke-width='5'/>`);
const venice = (x) => at(x, `${map([[-74, 50, '#F2B9A0'], [-40, 66, '#F6D7A8'], [-6, 56, '#E8735A'], [28, 70, '#F6E6A8'], [62, 52, '#F4D2D9']], ([d, h, c]) => `<rect x='${d - 16}' y='${136 - h}' width='32' height='${h}' fill='${c}' ${O}/>${map([-8, 8], (w) => `<path d='M${d + w - 4} ${136 - h + 22}v-8a4 4 0 0 1 8 0v8z' fill='#3B5E7A'/>`)}`)}<path d='M-50 146q30 6 64 0l4-6q-36 8-72 0z' fill='#2E2420' ${o}/><path d='M-4 140l-12-26' stroke='#3B2C24' stroke-width='2'/><path d='M-30 136v-14' stroke='#3B2C24' stroke-width='3'/><circle cx='-30' cy='118' r='4' fill='#3B2C24'/><path d='M80 150v-50' stroke='#3B2C24' stroke-width='3'/><path d='M80 100v50' stroke='#FFFFFF' stroke-width='2' stroke-dasharray='5 5'/>`);
const bologna = (x) => at(x, `<rect x='-60' y='108' width='110' height='42' fill='#E0A67C' ${O}/>${map([-46, -22, 2, 26], (d) => `<path d='M${d - 8} 150v-22a8 8 0 0 1 16 0v22z' fill='#8C5236' ${o}/>`)}<path d='M-66 108h122l-8-10h-106z' fill='#B5684A' ${O}/><rect x='-40' y='36' width='40' height='114' fill='#B5684A' ${O}/><path d='M-44 36h48l-4-8h-6v-6h-6v6h-6v-6h-6v6h-6v-6h-6v6h-4z' fill='#9C5236' ${O}/>${map([52, 76, 100], (d) => `<rect x='-34' y='${d - 20}' width='28' height='4' fill='#9C5236' ${o}/>`)}${map([46, 80, 112], (d) => `<path d='M-24 ${d + 14}v-14a4 4 0 0 1 8 0v14z' fill='#3B2C24'/>`)}<g transform='rotate(4 36 150)'><rect x='20' y='80' width='30' height='70' fill='#C47A58' ${O}/><path d='M16 80h38l-3-7h-32z' fill='#9C5236' ${O}/>${map([100, 124], (d) => `<path d='M31 ${d + 12}v-12a4 4 0 0 1 8 0v12z' fill='#3B2C24'/>`)}</g>`);

// ---- Japan ----
const tokyo = (x) => at(x, `${map([[-80, 54, '#9AB0C8'], [-56, 80, '#B7C6D6'], [40, 66, '#9AB0C8'], [66, 90, '#B7C6D6'], [90, 48, '#9AB0C8']], ([d, h, c]) => `<rect x='${d - 11}' y='${150 - h}' width='22' height='${h}' fill='${c}' ${O}/>${map([0, 1, 2, 3], (r) => `<path d='M${d - 6} ${150 - h + 10 + r * 12}h12' stroke='#FFF3C4' stroke-width='3'/>`)}`)}<path d='M-14 150l10-112h8l10 112z' fill='#E8EEF4' ${O}/><path d='M-10 104h20M-8 78h16' stroke='#3B2C24' stroke-width='2'/><rect x='-9' y='60' width='18' height='8' fill='#8FB8D9' ${o}/><path d='M0 38v-18' stroke='#3B2C24' stroke-width='2'/>`);
const kyoto = (x) => at(x, `${map([-100, -86, -72, 74, 88, 100], (d) => `<path d='M${d} 150V${44 + (Math.abs(d) % 3) * 6}' stroke='#5E9C4F' stroke-width='7'/><path d='M${d} 100l10-8M${d} 70l-10-8' stroke='#7FBF6A' stroke-width='4' stroke-linecap='round'/>`)}${map([[150, 76, 20], [124, 58, 18], [100, 42, 16]], ([y, w, h]) => `<rect x='${-w / 2 + 8}' y='${y - h}' width='${w - 16}' height='${h}' fill='#C7563E' ${O}/><path d='M${-w / 2 - 6} ${y - h}q${w / 2 + 6} -10 ${w + 12} 0l-6 -6h${-(w)}z' fill='#3B3B46' ${O}/>`)}<path d='M0 76v-14' stroke='#3B2C24' stroke-width='2'/>`);
const osaka = (x) => at(x, `<path d='M-56 150l8-30h96l8 30z' fill='#B7AE9F' ${O}/><rect x='-36' y='88' width='72' height='32' fill='#FFFFFF' ${O}/><path d='M-46 90q46-14 92 0l-8-10h-76z' fill='#4F8E86' ${O}/><rect x='-24' y='60' width='48' height='22' fill='#FFFFFF' ${O}/><path d='M-34 62q34-12 68 0l-8-12h-52z' fill='#4F8E86' ${O}/><path d='M-18 48q18-10 36 0l-6-12h-24z' fill='#4F8E86' ${O}/><circle cx='0' cy='32' r='3' fill='#E2B33E'/>${map([-86, 86], (d) => `<path d='M${d} 150v-40' stroke='#3B2C24' stroke-width='2'/><ellipse cx='${d}' cy='104' rx='9' ry='12' fill='#E2523B' ${o}/>`)}`);
const hokkaido = (x) => at(x, `<path d='M-104 150q40-30 100-24t108 6v18z' fill='#FFFFFF' ${O}/>${mtn(-40, 70, 86, '#B8C9DE')}${pine(-90, 0.9, '#2F5E3A')}${pine(70, 1, '#2F5E3A')}${pine(92, 0.7, '#2F5E3A')}${map([-90, 70, 92], (d) => `<path d='M${d - 8} ${126}l8-16 8 16z' fill='#FFFFFF' opacity='.85'/>`)}<rect x='14' y='118' width='40' height='32' fill='#C99A63' ${O}/><path d='M8 120l26-22 26 22z' fill='#FFFFFF' ${O}/><path d='M34 132q-4-10 4-16M44 132q-4-10 4-16' stroke='#FFFFFF' stroke-width='2' fill='none'/>`);

// ---- Mexico ----
const mxDesert = (x) => at(x, `<path d='M-104 150v-46h40l10 46zM30 150l8-62h52l8 62z' fill='#D9845A' ${O}/><path d='M-104 104h40M38 88h52' stroke='#B5603A' stroke-width='3'/>${map([[-30, 1], [0, 0.7], [110, 0.8]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><path d='M-5 0v-46a5 5 0 0 1 10 0v46z' fill='#5E9C4F' ${O}/><path d='M-5-20h-8v-14a4 4 0 0 1 8 0M5-28h8v-12a4 4 0 0 0-8 0' fill='#5E9C4F' ${O}/></g>`)}`);
const puebla = (x) => at(x, `${mtn(-40, 64, 96, '#8E8A9A')}<rect x='18' y='96' width='64' height='54' fill='#F2D9A4' ${O}/><path d='M30 96q20-34 40 0z' fill='#E2B33E' ${O}/><path d='M50 62v-12M44 56h12' stroke='#3B2C24' stroke-width='2'/>${map([22, 78], (d) => `<rect x='${d - 6}' y='74' width='12' height='22' fill='#E8735A' ${O}/><path d='M${d - 7} 76l7-12 7 12z' fill='#2F6DB5' ${o}/>`)}<path d='M42 150v-20a8 8 0 0 1 16 0v20z' fill='#6B4A2B' ${o}/>`);
const jalisco = (x) => at(x, `${hill(-104, 110, 90, '#A9C76A')}${map([[-80, 136], [-50, 128], [-20, 124], [10, 126], [40, 132], [70, 138], [-64, 146], [-34, 142], [-4, 140], [26, 144], [56, 148]], ([d, y]) => `<g transform='translate(${d} ${y})'><path d='M0 0l-10-14M0 0l-4-18M0 0l4-18M0 0l10-14M0 0l-14-6M0 0l14-6' stroke='#4F8E86' stroke-width='3.4' stroke-linecap='round'/></g>`)}${mtn(70, 36, 76, '#8E9AB0', false)}`);
const mxCity = (x) => at(x, `${map([[-80, 50, '#E8735A'], [-48, 62, '#F2C14E'], [-16, 54, '#4FB3A6'], [16, 66, '#E86A9A'], [48, 52, '#86B7D9'], [80, 60, '#F2C14E']], ([d, h, c]) => `<rect x='${d - 16}' y='${150 - h}' width='32' height='${h}' fill='${c}' ${O}/><rect x='${d - 6}' y='${150 - h * 0.5}' width='12' height='${h * 0.5}' fill='#5A3A26' ${o}/>`)}<path d='M-104 70q52 16 104 0t104 0' fill='none' stroke='#3B2C24' stroke-width='1.6'/>${map([-90, -64, -38, -12, 14, 40, 66, 92], (d, i) => `<path d='M${d - 8} ${72 + Math.abs(Math.sin(d)) * 4}h16l-2 14h-12z' fill='${['#E8735A', '#F2C14E', '#4FB3A6', '#E86A9A'][i % 4]}' ${o}/>`)}`);
const mxBeach = (x) => at(x, `<path d='M-104 150q60-20 208-6v6z' fill='#F2DFA6' ${O}/>${palm(-70, 1.1)}${palm(-40, 0.85)}${palm(80, 1)}${boat(20, 138, '#E8735A', 0.9)}<path d='M40 130q10-14 22 0z' fill='#E8735A' ${o}/><path d='M51 130v20' stroke='#3B2C24' stroke-width='2'/>`);

// ---- India ----
const kerala = (x) => at(x, `${palm(-84, 1.1)}${palm(-60, 0.9)}${palm(70, 1.05)}${palm(94, 0.85)}<path d='M-34 132q34 10 70 0l-4 8q-32 8-62 0z' fill='#6B4A2B' ${O}/><path d='M-26 132q30-26 54 0z' fill='#C99A63' ${O}/><path d='M-20 128q24-18 42 0' stroke='#8A5A34' stroke-width='2' fill='none'/>`);
const punjab = (x) => at(x, `<path d='M-104 150q60-30 208-10v10z' fill='#E2C25A' ${O}/>${rows(-96, 96, 3, 128, '#C9A43E')}<rect x='-40' y='92' width='80' height='40' fill='#F2C14E' ${O}/><path d='M-20 92q20-36 40 0z' fill='#F2C14E' ${O}/><path d='M0 56v-8' stroke='#3B2C24' stroke-width='2'/>${map([-34, 34], (d) => `<path d='M${d - 6} 92q6-16 12 0z' fill='#F2C14E' ${o}/>`)}`);
const mumbai = (x) => at(x, `<rect x='-60' y='70' width='120' height='66' fill='#D9B98A' ${O}/><path d='M-20 136v-36a20 20 0 0 1 40 0v36z' fill='#7A5A3E' ${O}/>${map([-60, 48], (d) => `<rect x='${d}' y='52' width='12' height='18' fill='#D9B98A' ${O}/><path d='M${d - 2} 54l8-12 8 12z' fill='#C7944A' ${o}/>`)}<path d='M-60 70h120' stroke='#B8925E' stroke-width='3'/>${map([-46, 40], (d) => `<path d='M${d - 6} 120v-14a6 6 0 0 1 12 0v14z' fill='#7A5A3E' ${o}/>`)}${boat(80, 140, '#E8735A', 0.7)}`);
const charminar = (x) => at(x, `<rect x='-46' y='86' width='92' height='64' fill='#E8D9BC' ${O}/><path d='M-24 150v-34a24 24 0 0 1 48 0v34z' fill='#B8925E' ${O}/>${map([-46, 46], (d) => `<rect x='${d - 7}' y='34' width='14' height='116' fill='#EDE2CA' ${O}/><path d='M${d - 9} 36q9-20 18 0z' fill='#C7944A' ${o}/><path d='M${d - 9} 70h18M${d - 9} 100h18' stroke='#3B2C24' stroke-width='1.6'/>`)}<path d='M-46 86h92' stroke='#B8925E' stroke-width='3'/>`);
const rajasthan = (x) => at(x, `<path d='M-104 150q50-24 100-8t104-4v12z' fill='#E9C27A' ${O}/><path d='M-80 128v-46h40v-10h20v10h50v-14h20v14h30v46z' fill='#D9845A' ${O}/>${map([-62, -14, 30, 62], (d) => `<path d='M${d - 6} 110v-10a6 6 0 0 1 12 0v10z' fill='#7A3A2A'/>`)}${map([-50, 0, 46], (d) => `<path d='M${d - 6} 72q6-10 12 0z' fill='#E8735A' ${o}/>`)}`);

// ---- China ----
const greatWall = (x) => at(x, `${hill(-104, 30, 66, '#7FA95E')}${hill(-20, 110, 80, '#6E9F5B')}<path d='M-104 128q30-30 60-44t60 10 80-14' fill='none' stroke='#C9B48A' stroke-width='12' stroke-linejoin='round'/><path d='M-104 128q30-30 60-44t60 10 80-14' fill='none' stroke='#3B2C24' stroke-width='1.6' stroke-dasharray='4 4' transform='translate(0 -6)'/>${map([[-44, 84], [66, 76]], ([d, y]) => `<rect x='${d - 10}' y='${y - 22}' width='20' height='24' fill='#C9B48A' ${O}/><path d='M${d - 12} ${y - 22}h24' stroke='#3B2C24' stroke-width='2' stroke-dasharray='4 3'/>`)}`);
const sichuan = (x) => at(x, `${mtn(-60, 50, 90, '#6E9F7A', false)}${mtn(0, 54, 108, '#5E8F6A', false)}<path d='M-40 98q30-8 70-2' stroke='#FFFFFF' stroke-width='6' opacity='.7' stroke-linecap='round'/>${map([60, 74, 88, 100], (d) => `<path d='M${d} 150V${60 + (d % 3) * 6}' stroke='#5E9C4F' stroke-width='6'/><path d='M${d} 96l9-7M${d} 76l-9-7' stroke='#7FBF6A' stroke-width='4' stroke-linecap='round'/>`)}`);
const shanghai = (x) => at(x, `${map([[-84, 46], [-60, 70], [44, 84], [70, 60], [94, 72]], ([d, h]) => `<rect x='${d - 10}' y='${138 - h}' width='20' height='${h}' fill='#9AB0C8' ${O}/>`)}<path d='M-4 138v-46M4 138v-46' stroke='#3B2C24' stroke-width='3'/><circle cx='0' cy='86' r='14' fill='#E86A9A' ${O}/><path d='M-3 72v-26h6v26' fill='#C9CFD9' ${o}/><circle cx='0' cy='44' r='7' fill='#E86A9A' ${O}/><path d='M0 37v-16' stroke='#3B2C24' stroke-width='2'/><path d='M-22 138l18-22M22 138l-18-22' stroke='#3B2C24' stroke-width='2.4'/>`);
const canton = (x) => at(x, `${map([[-90, 60], [-66, 84], [-42, 54], [60, 70], [86, 92]], ([d, h]) => `<rect x='${d - 11}' y='${134 - h}' width='22' height='${h}' fill='#B7C6D6' ${O}/>`)}${mtn(-60, 50, 40, '#6E9F5B', false).replace(/150/g, '134')}<path d='M-20 134q20 8 44 0l-4 8h-36z' fill='#8A5A34' ${O}/><path d='M-6 134v-36M10 134v-30' stroke='#3B2C24' stroke-width='2'/><path d='M-6 98q-14 10-12 32h12zM10 104q12 8 12 26h-12z' fill='#D9452B' ${o}/>`);

// ---- United States ----
const texas = (x) => at(x, `<path d='M-104 150v-40h50v40zM20 150l10-56h60l10 56z' fill='#C9734A' ${O}/>${map([[-30, 0.9], [110, 0.7]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><path d='M-5 0v-46a5 5 0 0 1 10 0v46z' fill='#5E9C4F' ${O}/><path d='M-5-20h-8v-14a4 4 0 0 1 8 0M5-28h8v-12a4 4 0 0 0-8 0' fill='#5E9C4F' ${O}/></g>`)}<path d='M-14 150v-26h4v26M14 150v-26h-4v26M-12 128h24' stroke='#6B4A2B' stroke-width='3' fill='none'/><circle cx='0' cy='108' r='14' fill='none' stroke='#8A5A34' stroke-width='3'/>`);
const newEngland = (x) => at(x, `<path d='M-104 150q20-30 70-28 30 0 46 28z' fill='#8C8A86' ${O}/><path d='M-60 122l6-72h16l6 72z' fill='#FFFFFF' ${O}/><g fill='#D9452B'><path d='M-58 106h24l1 10h-26z'/><path d='M-56 80h20l1 10h-22z'/></g><rect x='-58' y='40' width='20' height='10' fill='#FFE08A' ${o}/><path d='M-60 40l12-10 12 10z' fill='#3B2C24'/>${house(54, 44, 30, '#E8E2D4', '#5A6E9A')}${pine(90, 0.8, '#2F5E3A')}${boat(10, 140, '#2F6DB5', 0.8)}`);
const chicago = (x) => at(x, `${map([[-84, 60], [-60, 86], [-34, 50], [-8, 110], [20, 70], [46, 96], [72, 56], [94, 76]], ([d, h]) => `<rect x='${d - 11}' y='${150 - h}' width='22' height='${h}' fill='${h > 90 ? '#5E6E86' : '#9AB0C8'}' ${O}/>${map([0, 1, 2], (r) => `<path d='M${d - 6} ${150 - h + 12 + r * 14}h12' stroke='#FFF3C4' stroke-width='2.6'/>`)}`)}<path d='M-12 40v-14M-4 40v-14' stroke='#3B2C24' stroke-width='2'/>`);
const farm = (x) => at(x, `<path d='M-104 150q60-26 208-8v8z' fill='#A9C76A' ${O}/><rect x='-24' y='96' width='60' height='54' fill='#C7463A' ${O}/><path d='M-30 98l36-28 36 28z' fill='#8A2E26' ${O}/><path d='M-6 150v-30h24v30M-6 120l24 30M18 120l-24 30' stroke='#FFFFFF' stroke-width='2.4' fill='none'/><rect x='46' y='70' width='18' height='80' fill='#B7C6D6' ${O}/><path d='M44 72q11-14 22 0z' fill='#8E9AB0' ${O}/>${map([-96, -84, -72, -60, 76, 88, 100], (d) => `<path d='M${d} 150v-30' stroke='#6E8F3E' stroke-width='3'/><path d='M${d} 132q-6-4-6-10M${d} 128q6-4 6-10' stroke='#6E8F3E' stroke-width='2' fill='none'/><ellipse cx='${d + 2}' cy='118' rx='2.5' ry='6' fill='#F2C14E'/>`)}`);
const california = (x) => at(x, `<path d='M-104 118h208' stroke='#C8462E' stroke-width='6'/>${map([-50, 50], (d) => `<rect x='${d - 7}' y='40' width='14' height='96' fill='#C8462E' ${O}/><path d='M${d - 7} 66h14M${d - 7} 90h14' stroke='#8A2E1E' stroke-width='3'/>`)}<path d='M-104 70q54 54 104 46t104-46' fill='none' stroke='#C8462E' stroke-width='3'/><path d='M-50 44q50 70 100 0' fill='none' stroke='#C8462E' stroke-width='3'/>${map([-30, -15, 0, 15, 30], (d) => `<path d='M${d} ${118}v-${18 - Math.abs(d) / 3}' stroke='#C8462E' stroke-width='1.4'/>`)}${palm(96, 0.8)}`);
const hawaii = (x) => at(x, `${mtn(-40, 70, 70, '#5E8F4F', false).replace(/L(-?\d+) 150z/, 'L$1 134z').replace(/M(-?\d+) 150L/, 'M$1 134L')}<path d='M-104 150q50-16 120-12t88 12z' fill='#F2DFA6' ${O}/>${palm(50, 1.1)}${palm(80, 0.9)}<path d='M-70 144q30-10 50 0' fill='none' stroke='#FFFFFF' stroke-width='2'/>`);

// ---- Spain ----
const valencia = (x) => at(x, `${rows(-100, 100, 2, 112, '#9CBF5E')}<rect x='-30' y='96' width='60' height='34' fill='#FFFFFF' ${O}/><path d='M-38 98l38-30 38 30z' fill='#E8D9A0' ${O}/><path d='M-6 130v-16h12v16z' fill='#2F6DB5' ${o}/>${palm(76, 0.9)}${map([-86, -64, 50], (d) => `<path d='M${d} 130v-10' stroke='#5E9C4F' stroke-width='2'/>`)}`);
const andalusia = (x) => at(x, `${hill(-104, 110, 70, '#C9B07A')}${map([[-50, 104, 22, 18], [-26, 96, 22, 22], [0, 90, 24, 20], [26, 98, 22, 18], [48, 108, 20, 16]], ([d, y, w, h]) => `<rect x='${d - w / 2}' y='${y}' width='${w}' height='${h}' fill='#FFFFFF' ${o}/><rect x='${d - 3}' y='${y + 6}' width='6' height='6' fill='#3B5E7A'/><path d='M${d - w / 2} ${y}h${w}' stroke='#C0503A' stroke-width='3'/>`)}<rect x='-4' y='64' width='14' height='26' fill='#FFFFFF' ${O}/><path d='M-6 66l10-12 10 12z' fill='#C0503A' ${o}/>${map([-86, -70, 74, 92], (d) => `<g transform='translate(${d} 150)'><path d='M0 0v-14' stroke='#6B4A2B' stroke-width='3'/><ellipse cx='0' cy='-20' rx='10' ry='8' fill='#8A9A5E' ${o}/></g>`)}`);
const galicia = (x) => at(x, `<path d='M-104 150q10-40 50-46 40 6 60 46z' fill='#6E9F5B' ${O}/><path d='M-70 104l6-56h14l6 56z' fill='#E8E2D4' ${O}/><rect x='-68' y='38' width='18' height='12' fill='#FFE08A' ${o}/><path d='M-70 38l11-10 11 10z' fill='#3B2C24'/>${boat(30, 138, '#2F6DB5')}${boat(70, 142, '#F2C14E', 0.8)}<path d='M50 150v-20M60 150v-20M70 150v-20' stroke='#6B4A2B' stroke-width='2'/>`);
const asturias = (x) => at(x, `${mtn(-50, 60, 90, '#7FA95E', false)}${mtn(20, 70, 104, '#6E9F5B', true)}<path d='M-104 150q60-20 208-4v4z' fill='#8FC06A' ${O}/>${house(62, 40, 26, '#E8DCC2', '#7A4A2A')}${map([-90, 92], (d) => `<g transform='translate(${d} 150)'><path d='M0 0v-14' stroke='#6B4A2B' stroke-width='3'/><circle cx='0' cy='-22' r='11' fill='#5E9C4F' ${o}/><circle cx='-4' cy='-24' r='2.4' fill='#E2523B'/><circle cx='4' cy='-19' r='2.4' fill='#E2523B'/></g>`)}`);
const madrid = (x) => at(x, `<rect x='-80' y='86' width='160' height='64' fill='#E8DCC2' ${O}/>${map([-60, -36, -12, 12, 36, 60], (d) => `<path d='M${d - 7} 150v-20a7 7 0 0 1 14 0v20z' fill='#8C6A4E' ${o}/><rect x='${d - 5}' y='96' width='10' height='14' fill='#6E8FA8' ${o}/>`)}${map([-80, 80], (d) => `<rect x='${d - 10}' y='64' width='20' height='22' fill='#E8DCC2' ${O}/><path d='M${d - 12} 66l12-20 12 20z' fill='#4F5E8A' ${O}/>`)}<path d='M-80 86h160' stroke='#C29C5E' stroke-width='3'/><path d='M0 64v-10' stroke='#3B2C24' stroke-width='2'/><path d='M0 54h10l-3 4 3 4h-10' fill='#C7463A'/>`);

// ---- Thailand ----
const chiangmai = (x) => at(x, `${mtn(-40, 70, 90, '#5E8F6A', false)}${mtn(50, 60, 70, '#6E9F7A', false)}<path d='M-104 150q60-16 208-4v4z' fill='#7FBF6A' ${O}/><rect x='-26' y='110' width='52' height='26' fill='#F2C14E' ${O}/><path d='M-36 112l36-30 36 30z' fill='#C7463A' ${O}/><path d='M-26 96l26-22 26 22' fill='none' stroke='#F2C14E' stroke-width='3'/><path d='M0 74l0-14' stroke='#F2C14E' stroke-width='3'/>${map([-84, 90], (d) => pine(d, 0.8, '#4F8E4A'))}`);
const isaan = (x) => at(x, `<path d='M-104 150q60-36 208-14v14z' fill='#9CCF6A' ${O}/>${rows(-96, 96, 3, 120, '#7FB85A')}${palm(-70, 0.9)}${palm(80, 1)}<path d='M10 118l14-22h14l14 22z' fill='#C99A63' ${O}/><path d='M20 118v-10M46 118v-10' stroke='#6B4A2B' stroke-width='3'/><path d='M4 98l27-16 27 16z' fill='#8A5A34' ${O}/><path d='M-30 116q-4-10 4-14 10-2 8 10' fill='#E8D9A0' ${o}/>`);
const thIsland = (x) => at(x, `<path d='M-90 126q-10-70 22-80 30 12 20 80z' fill='#5E9C67' ${O}/><path d='M40 126q0-46 20-52 18 8 16 52z' fill='#4F8A5B' ${O}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/><path d='M-20 132q30 6 64 0l4-6q-34 4-72 0z' fill='#8A5A34' ${o}/><path d='M-24 126q6-10 12-6' stroke='#E8735A' stroke-width='3' fill='none'/><path d='M44 128l10-8' stroke='#3B2C24' stroke-width='2'/>${palm(92, 0.8)}`);
const floatingMarket = (x) => at(x, `${map([[-80, '#C99A63'], [80, '#C99A63']], ([d, c]) => `<rect x='${d - 22}' y='92' width='44' height='32' fill='${c}' ${O}/><path d='M${d - 28} 94l28-18 28 18z' fill='#8A5A34' ${O}/>`)}${map([[-30, 132, '#F2C14E'], [20, 138, '#E8735A']], ([d, y, c]) => `<path d='M${d - 22} ${y}q22 8 44 0l-4 6h-36z' fill='#6B4A2B' ${o}/><circle cx='${d - 8}' cy='${y - 4}' r='4' fill='${c}' ${o}/><circle cx='${d + 2}' cy='${y - 4}' r='4' fill='#7FBF6A' ${o}/><path d='M${d + 10} ${y - 2}l6-10h6l6 10z' fill='#E8D9A0' ${o}/>`)}`);

// ---- Greece ----
const acropolis = (x) => at(x, `<path d='M-104 150q20-30 60-36h88q40 6 60 36z' fill='#C9B48A' ${O}/><rect x='-64' y='104' width='128' height='10' fill='#F2E9D8' ${O}/>${map([-56, -40, -24, -8, 8, 24, 40, 56], (d) => `<rect x='${d - 4}' y='68' width='8' height='36' fill='#F6EEDF' ${o}/>`)}<rect x='-66' y='60' width='132' height='8' fill='#F2E9D8' ${O}/><path d='M-66 60l66-18 66 18z' fill='#F6EEDF' ${O}/>${map([-90, 88], (d) => cypress(d, 0.6))}`);
const meteora = (x) => at(x, `<path d='M-96 150q-6-60 6-86 18-8 24 10 6 30 4 76z' fill='#B8A08A' ${O}/><path d='M-30 150q-8-80 10-104 22-6 26 14 6 40 2 90z' fill='#C7AE94' ${O}/><path d='M40 150q-2-50 14-66 20 0 20 20 2 22 0 46z' fill='#B8A08A' ${O}/><rect x='-28' y='34' width='34' height='16' fill='#F2E2C4' ${O}/><path d='M-30 36l19-12 19 12z' fill='#C0503A' ${o}/><rect x='44' y='74' width='24' height='12' fill='#F2E2C4' ${o}/><path d='M42 76l14-9 14 9z' fill='#C0503A' ${o}/>${pine(10, 0.6)}${pine(92, 0.7)}`);
const groves = (x) => at(x, `${hill(-104, 110, 92, '#C9C08A')}${map([[-80, 150, 1], [-46, 140, 0.9], [-12, 132, 0.8], [22, 136, 0.85], [56, 146, 0.95], [88, 150, 1]], ([d, y, s]) => `<g transform='translate(${d} ${y}) scale(${s})'><path d='M0 0q-2-10 2-18' stroke='#6B4A2B' stroke-width='4' fill='none'/><ellipse cx='1' cy='-26' rx='15' ry='11' fill='#8A9A5E' ${o}/><circle cx='-4' cy='-24' r='1.8' fill='#3B3B2A'/><circle cx='5' cy='-28' r='1.8' fill='#3B3B2A'/></g>`)}${cube(30, 26, 22, '#FFFFFF', '#2F6DB5')}`);

// sky keys: day | warm | dusk | sand (lib/landmarks.js SKY). ground [top, bottom]. sea: strip of water behind.
export const G = { green: ['#8CC56B', '#6FAA52'], lush: ['#7FBF6A', '#5E9F4F'], dry: ['#D9C98A', '#C2B06E'], sand: ['#EBC98A', '#D9B26A'], snow: ['#EEF3F8', '#D8E2EC'], stone: ['#E8E2D4', '#D8CFBD'], beach: ['#F2DFA6', '#E6CB85'], red: ['#D9A070', '#C2865A'] };
export const R = (draw, sky, ground, sea, buddy, name) => [draw, sky, G[ground], sea, buddy, name];
// iso → [[title pattern, scene], …] in priority order (first match wins), matched on the dish title only
// ---- the same places as whole views in perspective (lib/art/vista.js) ----
const GRASS = (c) => (c.gid ? `url(#${c.gid})` : c.ground[0]);
const farHills = (c, H, col = '#8FB07A', t = 0.5, amp = 12) => hills(c, [[-20, H - amp * 0.4], [70, H - amp], [160, H - amp * 0.3], [250, H - amp * 1.1], [330, H - amp * 0.5], [420, H - amp]], col, t, false, H + 4);
const flatLand = (c, y = 128, col) => land(c, [[-20, y + 2], [120, y - 2], [260, y + 1], [420, y - 2]], col || GRASS(c));
const sea = (c, H = 118, col) => water(c, H, 200, col);
const row = (p0, p1, n, s0, s1, f, k) => line(p0, p1, n, s0, s1, f, k);
const stuccoRow = (p0, p1, n, s0, s1, cols, roof = '#C0503A') => row(p0, p1, n, s0, s1, (x, y, s, i) => tx(x, y, s, vhouse(x, y, 26, 24 + (i % 3) * 6, cols[i % cols.length], roof)));

// France
const provenceV = V((c) => { const H = 116;
  return `${farHills(c, H, '#A99BC8', 0.5, 14)}${land(c, [[-20, H + 6], [420, H + 4]], '#B69AD8')}${vrows(c, 230, H - 4, H + 6, [-200, -120, -40, 40, 120, 200, 280, 360, 440, 520, 600], '#7C5BB8', 7)}
${row([380, 132], [280, H + 6], 4, 0.9, 0.35, (x, y, s) => vcyp(x, y, s, '#3F6E3A'))}${tx(330, 128, 0.8, vhouse(330, 128, 54, 30, '#E9D3A8', '#D07A4E'))}${vcyp(40, 150, 1.2)}${vcyp(64, 148, 1)}${birds([[150, 60], [166, 52, 0.8]])}`; });
const brittanyV = V((c) => { const H = 116;
  return `${sea(c, H, '#4F98C6')}${hills(c, [[-20, 70], [40, 66], [110, 80], [160, 118], [200, 160], [200, 200]], '#E8E2D4', 0, true)}<path d='M-20 74q60-6 120 8' fill='none' stroke='#7FB069' stroke-width='7'/>
${row([230, 140], [360, H + 2], 4, 0.9, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x - 14} ${y}l6-30h16l6 30z' fill='#E8E2D4' ${O}/>`))}
${tx(120, 72, 1, `<path d='M104 72v-18h18v18' fill='#F6F0E4' ${O}/><path d='M100 54l13-10 13 10z' fill='#5A6B7E' ${O}/>`)}${foam(196, 152, 18)}${frontShore(c, '#E6D8B0', 152)}${vboat(270, 140, 0.8)}`; });
const marseilleV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 6], [80, H - 20], [200, H - 6], [300, H - 24], [420, H - 10]], '#C9BFA9', 0.5, false, H + 4)}<path d='M300 ${H - 24}v-14M296 ${H - 34}h8' stroke='${hz(c, '#8A7A6A', 0.4)}' stroke-width='3'/>
${sea(c, H, '#3E8FCF')}${row([170, 150], [360, 124], 6, 1, 0.35, (x, y, s, i) => vboat(x, y, s, ['#D9452B', '#2F6DB5', '#F2C14E'][i % 3]))}
${land(c, [[-20, 112], [40, 116], [110, 126], [150, 152], [150, 200]], '#E6DCC8')}${stuccoRow([20, 122], [130, 142], 5, 0.7, 1, ['#F2D7A8', '#E9C38E', '#F6E2C0'])}${frontShore(c, '#D8CDB8', 152)}`; });
const alpsV = V((c) => { const H = 124;
  return `${range(c, H, [[20, 80, 70], [130, 100, 80], [250, 84, 74], [360, 104, 84]], '#C3CFE2', 0.45, { snow: true })}${range(c, H + 4, [[-10, 76, 80], [100, 98, 90], [215, 86, 80], [330, 104, 96], [420, 80, 80]], '#9AAED0', 0.12, { snow: true, ink: true })}
${land(c, [[-20, 150], [40, 120], [120, 132], [250, 126], [420, 134]], '#86B866')}<path d='${sil([[-20, 160], [80, 138], [200, 144], [420, 144]])}' fill='#6FA650' opacity='.8'/>
${tx(83, 132, 1, `<rect x='60' y='104' width='46' height='28' fill='#B07A48' ${O}/><path d='M52 106l31-24 31 24z' fill='#7A4A2A' ${O}/><rect x='76' y='114' width='10' height='18' fill='#5A3A22'/><rect x='92' y='112' width='9' height='9' fill='#FFE08A' ${o}/>`)}
${vpine(18, 140, 1.1, '#2F5E3A')}${vpine(40, 136, 0.9, '#3F6E3A')}${vpine(150, 136, 0.8, '#2F5E3A')}${vpine(176, 134, 1.0, '#3F6E3A')}${vpine(384, 140, 1.0, '#2F5E3A')}`; });
const burgundyV = V((c) => { const H = 116;
  return `${farHills(c, H, '#9CB06A', 0.5)}${land(c, [[-20, H + 6], [420, H + 4]], '#9CBF5E')}${vrows(c, 210, H - 6, H + 6, [-260, -170, -80, 10, 100, 190, 280, 370, 460, 550], '#5E7F34', 5)}
${tx(300, H + 8, 0.6, `<rect x='270' y='${H - 26}' width='60' height='34' fill='#E8DCC2' ${O}/>${[262, 330].map((d) => `<rect x='${d}' y='${H - 38}' width='12' height='46' fill='#E8DCC2' ${O}/><path d='M${d - 2} ${H - 38}l8-12 8 12z' fill='#7E5A8A' ${O}/>`).join('')}<path d='M266 ${H - 26}l34-14 34 14z' fill='#B5452E' ${O}/>`)}${vtree(30, 150, 1.1, '#6FAA5A')}`; });
const alsaceV = V((c) => { const H = 118;
  const half = (x, y, s, i) => tx(x, y, s, `<rect x='${x - 15}' y='${y - 40}' width='30' height='40' fill='${['#F6E6D2', '#F2C9A8', '#E8F0D8', '#F6D7E0'][i % 4]}' ${O}/><path d='M${x - 15} ${y - 26}h30M${x - 15} ${y - 13}h30M${x - 8} ${y - 40}l8 14 8-14M${x} ${y - 26}v26' stroke='#7A4A2A' stroke-width='2'/><path d='M${x - 19} ${y - 39}L${x} ${y - 66}L${x + 19} ${y - 39}z' fill='#B5452E' ${O}/>`);
  return `${farHills(c, H, '#7FA866', 0.5)}<path d='M330 ${H}v-38l5-12 5 12v38z' fill='${hz(c, '#C29C8A', 0.45)}'/>
${land(c, [[-20, H + 4], [420, H + 4]], '#D8CCB4')}${ribbon([[200, 212, 96], [214, 168, 46], [226, 140, 20], [232, H + 6, 6]], '#C4B79C', false)}
${row([150, 150], [210, H + 8], 6, 1.05, 0.25, half)}${row([330, 152], [246, H + 8], 6, 1.05, 0.25, half)}`; });
const carcassonneV = V((c) => { const H = 120;
  return `${farHills(c, H, '#8FAE6A', 0.5)}${land(c, [[-20, 132], [200, 126], [420, 130]])}${vrows(c, 300, H - 8, 132, [240, 360, 480, 600], '#7FAE5A', 3)}
${hills(c, [[-20, 150], [30, 124], [110, 112], [190, 124], [230, 150], [230, 200]], '#9CBF5E', 0, true)}${put(carcassonne, 108, 130, 0.8)}${vcyp(214, 150, 0.8)}`; });
// Italy
const colosseumV = V((c) => { const H = 118;
  return `${farTown(c, -10, 420, H + 1, '#E2C9A6', 0.45, 14, 4)}<path d='M300 ${H}v-28h12v28zM290 ${H - 28}q16-20 32 0z' fill='${hz(c, '#E8DCC2', 0.4)}'/>
${land(c, [[-20, 126], [420, 126]], '#D8C8A8')}${vrows(c, 150, H - 20, 126, [-100, 0, 100, 200, 300, 400], '#C4B48E', 2)}
${row([370, 150], [250, 128], 5, 1, 0.4, (x, y, s) => vtree(x, y, s * 0.9, '#5E8F4F'))}${row([330, 158], [230, 130], 5, 1, 0.4, (x, y, s) => vcyp(x, y, s * 0.8))}${put(colosseum, 112, 144, 1.0)}`; });
const vesuviusV = V((c) => { const H = 118;
  return `<path d='M60 ${H}L150 52q30-12 60 0L300 ${H}z' fill='${hz(c, '#6E6A76', 0.3)}'/><path d='M168 50q-6-18 6-26 8-12 20-6' stroke='${hz(c, '#C9C3BE', 0.2)}' stroke-width='6' fill='none' stroke-linecap='round'/>
${sea(c, H, '#3E8FCF')}${farTown(c, 20, 330, H + 1, '#F2D7C0', 0.4, 10, 6)}
${land(c, [[-20, 128], [50, 132], [120, 150], [120, 200]], '#E6DCC8')}${stuccoRow([10, 134], [90, 148], 4, 0.7, 1, ['#F2B9A0', '#F6D7A8', '#E8735A'])}${row([150, 150], [300, 128], 5, 0.9, 0.35, (x, y, s, i) => vboat(x, y, s, ['#2F6DB5', '#D9452B'][i % 2]))}${frontShore(c, '#E6DCC8', 152)}`; });
const cinqueTerreV = V((c) => { const H = 116;
  const cliffTown = (x, y, s) => tx(x, y, s, [0, 1, 2, 3, 4, 5, 6].map((i) => { const cx = x - 42 + (i % 4) * 26 + (i > 3 ? 13 : 0), cy = y - (i > 3 ? 34 : 0); return vblock(cx, cy, 24, 30, ['#F2C14E', '#E8735A', '#F4D2D9', '#86B7D9', '#F6E6A8', '#E8735A', '#9CC4A8'][i]); }).join(''));
  return `${sea(c, H, '#3E8FCF')}${hills(c, [[180, H + 2], [240, 92], [300, 80], [360, 96], [420, 84]], '#5E8F4F', 0.45, false, H + 3)}${cliffTown(320, H, 0.4)}
${hills(c, [[-20, 50], [60, 60], [140, 90], [190, 130], [210, 160], [210, 200]], '#6E9F5B', 0, true)}${ribbon([[0, 74, 7], [70, 96, 9], [120, 118, 11], [160, 146, 13], [195, 185, 18]], '#E4D6B8', false)}${[[24, 0.7, 0], [52, 0.78, 1], [82, 0.88, 2], [108, 0.96, 3], [134, 1.02, 4], [156, 1.05, 5]].map(([x, k, i]) => { const P = [[-20, 50], [60, 60], [140, 90], [190, 130]]; let y = 50; for (let j = 0; j < 3; j++) if (x >= P[j][0] && x <= P[j + 1][0]) y = P[j][1] + (P[j + 1][1] - P[j][1]) * (x - P[j][0]) / (P[j + 1][0] - P[j][0]); y += 14 * k; return tx(x, y, k, vblock(x, y, 24, 30, ['#F2C14E', '#E8735A', '#F4D2D9', '#86B7D9', '#F6E6A8', '#9CC4A8'][i])); }).join('')}${foam(200, 152, 18)}${frontShore(c, '#D8CDB8', 152)}${vboat(250, 142, 0.8)}`; });
const tuscanyV = V((c) => { const H = 112;
  return `${hills(c, [[-20, H], [80, H - 14], [180, H - 4], [290, H - 16], [420, H - 4]], '#B7B98A', 0.55, false, H + 6)}${hills(c, [[-20, H + 10], [120, H - 2], [240, H + 8], [420, H - 2]], '#A9C07A', 0.3, false, H + 14)}
${land(c, [[-20, 132], [100, 124], [220, 130], [420, 126]])}${ribbon([[220, 210, 40], [180, 168, 22], [230, 146, 12], [270, 132, 6], [300, 124, 3]], '#E3CFA0', false)}
${row([210, 168], [300, 124], 7, 1, 0.3, (x, y, s) => vcyp(x - 18 * s, y, s * 0.9))}${tx(320, 126, 0.7, vhouse(320, 126, 50, 30, '#E9C79A', '#C0503A'))}${vcyp(40, 152, 1.25)}${vcyp(62, 150, 1)}`; });
const veniceV = V((c) => { const H = 118;
  const pal = (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 32, 56 + (i % 3) * 8, ['#F2B9A0', '#F6D7A8', '#E8735A', '#F6E6A8'][i % 4])}<path d='M${x - 10} ${y - 30}v-8a4 4 0 0 1 8 0v8M${x + 2} ${y - 30}v-8a4 4 0 0 1 8 0v8' fill='none' stroke='${INK}' stroke-width='1.4'/>`);
  return `${land(c, [[-20, H], [420, H]], '#D8C8B0')}${ribbon([[200, 214, 210], [204, 168, 120], [210, 140, 56], [214, 124, 18], [216, H + 1, 6]], '#4FA3B8', false)}
${row([60, 160], [176, H + 4], 6, 1.15, 0.25, pal)}${row([346, 160], [252, H + 4], 6, 1.15, 0.25, pal)}
<path d='M180 132q34-18 68 0' fill='none' stroke='${INK}' stroke-width='2'/><path d='M178 134q36-16 72 0v4q-36-14-72 0z' fill='#F2E6D0' ${o}/>
${tx(200, 160, 1, `<path d='M168 160q32 10 64 0l-4-6h-56z' fill='#2A2A3A' ${o}/><path d='M228 154l8-10' stroke='#2A2A3A' stroke-width='3'/>`)}${tx(166, 168, 1, `<path d='M166 168v-56' stroke='#E74C3C' stroke-width='5'/><path d='M166 168v-56' stroke='#FFFFFF' stroke-width='5' stroke-dasharray='6 6'/>`)}`; });
const bolognaV = V((c) => { const H = 122;
  return `${farTown(c, -10, 420, H + 1, '#D9A07A', 0.45, 12, 6)}${land(c, [[-20, H + 2], [420, H + 2]], '#D8B898')}
${row([20, 158], [170, H + 6], 7, 1, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 18}' y='${y - 40}' width='36' height='40' fill='#C9744A' ${O}/><path d='M${x - 14} ${y}v-20a14 14 0 0 1 28 0v20' fill='#8A4A2A' ${o}/>`))}
${row([400, 158], [250, H + 6], 7, 1, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 18}' y='${y - 40}' width='36' height='40' fill='#D98A5A' ${O}/><path d='M${x - 14} ${y}v-20a14 14 0 0 1 28 0v20' fill='#8A4A2A' ${o}/>`))}
${put(bologna, 210, 140, 0.8)}`; });
// Japan
const tokyoV = V((c) => { const H = 122;
  let s = 5, sky = ''; for (let x = -10; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 10 + (s % 12), h = 20 + (s % 60); sky += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#9AB0C8', 0.45)}'/>`; x += w + 2; }
  return `${sky}<path d='M84 ${H}l6-80 6 80z' fill='${hz(c, '#E8E8F0', 0.2)}'/><rect x='84' y='${H - 56}' width='12' height='5' fill='${hz(c, '#9AB0C8', 0.1)}'/>
${land(c, [[-20, H + 2], [420, H + 2]], '#8C8C98')}${ribbon([[200, 214, 230], [200, 160, 110], [200, 136, 44], [200, H + 4, 10]], '#5E5E6A', false)}${vrows(c, 200, H + 2, 140, [120, 160, 240, 280], '#FFFFFF', 3)}
${row([30, 160], [150, H + 6], 6, 1, 0.3, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 34, 80 + (i % 2) * 16, ['#B7C6D6', '#C9D4E0'][i % 2])}<rect x='${x - 12}' y='${y - 70}' width='24' height='16' fill='${['#E74C3C', '#F2C14E', '#4FC3D6'][i % 3]}' ${o}/>`))}${row([370, 160], [250, H + 6], 6, 1, 0.3, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 34, 72 + (i % 2) * 20, ['#C9D4E0', '#B7C6D6'][i % 2])}<rect x='${x - 12}' y='${y - 62}' width='24' height='14' fill='${['#F2C14E', '#E86A9A', '#4FC3D6'][i % 3]}' ${o}/>`))}`; });
const kyotoV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 16], [100, H - 30], [220, H - 18], [330, H - 32], [420, H - 18]], '#7FA07A', 0.5, false, H + 4)}${tx(300, H + 2, 0.55, `${[[0, 0, 56, 18], [0, -20, 46, 16], [0, -38, 36, 14], [0, -54, 28, 12]].map(([, dy, w, h]) => `<rect x='${300 - w / 2 + 6}' y='${H + 2 + dy - h}' width='${w - 12}' height='${h}' fill='#F3D9A4' ${o}/><path d='M${300 - w / 2 - 8} ${H + 4 + dy - h}q${w / 2 + 8} -10 ${w + 16} 0l-6-8h${-w - 4}z' fill='#5A4A3A' ${o}/>`).join('')}`)}
${land(c, [[-20, H + 6], [420, H + 6]], '#D8CCB4')}${ribbon([[200, 212, 120], [210, 166, 60], [222, 138, 24], [228, H + 8, 8]], '#BFB49C', false)}
${row([150, 160], [212, H + 8], 7, 1.1, 0.25, (x, y, s) => tx(x, y, s, vblock(x, y, 30, 26, '#8A5A3A') + `<path d='M${x - 20} ${y - 24}h40l-6-10h-28z' fill='#4A4A52' ${o}/>`))}${row([310, 160], [244, H + 8], 7, 1.1, 0.25, (x, y, s) => tx(x, y, s, vblock(x, y, 30, 26, '#7A4A2A') + `<path d='M${x - 20} ${y - 24}h40l-6-10h-28z' fill='#4A4A52' ${o}/>`))}
${tx(130, 108, 1, `<path d='M130 104v-8' stroke='${INK}' stroke-width='1.6'/><ellipse cx='130' cy='110' rx='7' ry='9' fill='#E74C3C' ${o}/>`)}`; });
const osakaV = V((c) => { const H = 120;
  return `${farTown(c, -10, 420, H + 1, '#B7C6D6', 0.45, 30, 8)}${water(c, H + 2, 150, '#5E8FA8')}${land(c, [[-20, 128], [60, 124], [200, 126], [200, 200], [-20, 200]], '#9DB56A')}${frontShore(c, '#B9AE9C', 150)}
${row([230, 142], [380, 126], 6, 1, 0.4, (x, y, s) => vtree(x, y, s * 0.9, '#F7C6D6'))}${put(osaka, 104, 136, 0.82)}`; });
const hokkaidoV = V((c) => { const H = 120;
  return `${range(c, H, [[60, 70, 90], [210, 92, 100], [350, 74, 90]], '#B7C4D8', 0.4, { snow: true })}
${land(c, [[-20, H + 4], [420, H + 4]], '#F4F8FB')}${ribbon([[200, 212, 100], [224, 166, 46], [240, 140, 18], [248, H + 6, 6]], '#D8E2EC', false)}
${row([380, 160], [268, H + 6], 6, 1.1, 0.3, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${row([40, 160], [190, H + 6], 6, 1.1, 0.3, (x, y, s) => vpine(x, y, s, '#3F6E3A'))}
${tx(110, 140, 1, `<rect x='86' y='112' width='48' height='28' fill='#B07A48' ${O}/><path d='M78 114l32-24 32 24z' fill='#F4F8FB' ${O}/><rect x='104' y='122' width='10' height='18' fill='#5A3A22'/><rect x='120' y='120' width='9' height='9' fill='#FFE08A' ${o}/><path d='M128 98v-10' stroke='#7A4A2A' stroke-width='5'/>`)}`; });
// Mexico
const mxDesertV = V((c) => { const H = 118;
  return `${tx(300, H + 2, 0.6, `<path d='M260 ${H + 2}l6-50h48l6 50z' fill='#C7633A'/>`)}${hills(c, [[-20, H - 4], [100, H - 12], [240, H - 2], [420, H - 10]], '#D9A07A', 0.5, false, H + 4)}<path d='M120 ${H + 2}l8-46h56l8 46z' fill='${hz(c, '#C7633A', 0.35)}'/>
${land(c, [[-20, H + 6], [420, H + 6]], '#E3A876')}${ribbon([[200, 212, 110], [214, 166, 48], [224, 140, 18], [228, H + 8, 4]], '#8A7A6A', false)}<path d='M214 210L228 ${H + 8}' stroke='#F2C14E' stroke-width='2' stroke-dasharray='8 8'/>
${row([60, 160], [196, H + 8], 6, 1.2, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x - 4} ${y}v-36c0-6 8-6 8 0v36zM${x - 4} ${y - 16}h-6v-10c0-4 4-4 4 0v6M${x + 4} ${y - 20}h6v-10c0-4-4-4-4 0' fill='#4E9A3A' ${o}/>`))}${row([350, 162], [254, H + 8], 5, 1.1, 0.3, (x, y, s) => vbush(x, y, s, '#8A9A5A'))}`; });
const pueblaV = V((c) => { const H = 118;
  return `<path d='M200 ${H}L268 44q18-8 36 0L380 ${H}z' fill='${hz(c, '#8E8A9A', 0.35)}'/><path d='M268 44q18-8 36 0l10 14-10-4-8 6-8-6-8 6-6-6-8 4z' fill='${hz(c, '#FFFFFF', 0.2)}'/>
${farTown(c, -10, 420, H + 1, '#E8C9A0', 0.35, 10, 2)}${land(c, [[-20, H + 4], [420, H + 4]], '#D8B898')}${vrows(c, 200, H - 10, H + 4, [-100, 0, 100, 200, 300, 400, 500], '#C49C7A', 2)}
${row([30, 162], [170, H + 6], 5, 1.1, 0.35, (x, y, s, i) => tx(x, y, s, vblock(x, y, 32, 30, ['#F2C14E', '#E8735A', '#86B7D9', '#F4D2D9'][i % 4])))}${tx(110, 150, 1, `<rect x='78' y='96' width='64' height='54' fill='#F2D9A4' ${O}/>${[78, 142].map((d) => `<rect x='${d - 8}' y='70' width='16' height='80' fill='#F2D9A4' ${O}/><path d='M${d - 9} 70q9-16 18 0z' fill='#E8735A' ${O}/>`).join('')}<path d='M98 150v-24a12 12 0 0 1 24 0v24z' fill='#7A4A2A' ${O}/><path d='M100 96q10-18 20 0z' fill='#2F6DB5' ${O}/>`)}`; });
const jaliscoV = V((c) => { const H = 116;
  const agave = (x, y, s, t) => tx(x, y, s, `<g fill='${hz(c, '#5E9C8A', t)}' stroke='${t < 0.2 ? INK : 'none'}' stroke-width='1.2' stroke-linejoin='round'>${[-70, -40, -15, 0, 15, 40, 70].map((a) => `<path d='M${x} ${y}q-5-14 0-26q5 12 0 26z' transform='rotate(${a} ${x} ${y})'/>`).join('')}</g>`);
  return `<path d='M220 ${H}L290 52l70 ${H - 52}z' fill='${hz(c, '#7E8EA8', 0.4)}'/>${farHills(c, H, '#8FAE6A', 0.5)}${land(c, [[-20, H + 4], [420, H + 4]], '#C9A27A')}
${ribbon([[170, 212, 90], [176, 160, 40], [186, 136, 16], [196, H + 8, 5]], '#B58A62', false)}${line([300, 134], [215, H + 8], 6, 1, 0.45, (x, y, s, i) => tx(x, y, s, vhouse(x, y, 34, 24, ['#E8C9A0', '#E8735A', '#F2C14E', '#F4D2D9'][i % 4], '#B5452E')))}${tx(120, H + 12, 1, `<rect x='96' y='72' width='46' height='42' fill='#F2E2C4' ${O}/><rect x='142' y='52' width='14' height='62' fill='#F2E2C4' ${O}/><path d='M140 52l9-16 9 16z' fill='#B5452E' ${O}/><path d='M108 114v-16a11 11 0 0 1 22 0v16z' fill='#6E4A32'/><path d='M94 74h50l-25-14z' fill='#B5452E' ${O}/>`)}${[40, 330, 360].map((x0, i) => row([x0, 172], [lerp(x0, 200, 0.5), 150], 3, 1.2, 0.8, (x, y, s, j, t) => agave(x, y, s * 1.6, t * 0.2))).join('')}`; });
const mxCityV = V((c) => { const H = 118;
  return `<path d='M240 ${H}L300 56q12-6 24 0L390 ${H}z' fill='${hz(c, '#8E8A9A', 0.45)}'/>${farTown(c, -10, 420, H + 1, '#C9B8A6', 0.4, 18, 3)}
${land(c, [[-20, H + 4], [420, H + 4]], '#D8CCB4')}${ribbon([[200, 212, 260], [200, 160, 130], [200, 134, 50], [200, H + 6, 14]], '#C4B79C', false)}${vrows(c, 200, H + 4, 136, [40, 120, 280, 360], '#B8A888', 2)}
${row([30, 162], [150, H + 8], 6, 1.1, 0.3, (x, y, s, i) => tx(x, y, s, vblock(x, y, 34, 40 + (i % 2) * 10, ['#E8735A', '#F2C14E', '#86B7D9', '#E86A9A'][i % 4])))}${row([370, 162], [250, H + 8], 6, 1.1, 0.3, (x, y, s, i) => tx(x, y, s, vblock(x, y, 34, 36 + (i % 2) * 14, ['#F2C14E', '#4FC3D6', '#E8735A', '#9CC86A'][i % 4])))}
${tx(200, 136, 1, `<path d='M200 136v-40' stroke='#6B4A2B' stroke-width='3'/><path d='M200 98h24v14h-24z' fill='#3F8C3A' ${o}/><path d='M208 98h8v14h-8z' fill='#FFFFFF'/><path d='M216 98h8v14h-8z' fill='#C8352F'/>`)}`; });
const mxBeachV = V((c) => { const H = 118;
  return `${sea(c, H, '#3FB0D0')}${hills(c, [[200, H + 2], [280, H - 10], [360, H - 4], [420, H - 14]], '#5E9F55', 0.45, false, H + 3)}${frontShore(c, '#F6E6BF', 146)}
${row([30, 150], [300, 126], 7, 1.1, 0.25, (x, y, s) => vpalm(x, y, s * 0.85))}${tx(180, 146, 1, `<path d='M180 146v-30' stroke='#8A5A34' stroke-width='3'/><path d='M156 118q24-14 48 0z' fill='#E8735A' ${o}/>`)}${foam(120, 150, 60)}${vboat(250, 136, 0.8)}`; });
// India
const keralaV = V((c) => { const H = 118;
  return `${row([420, H + 2], [200, H + 1], 8, 0.6, 0.3, (x, y, s) => vpalm(x, y, s * 0.7))}${water(c, H + 2, 200, '#4F9A8A')}
${land(c, [[-20, 132], [80, 128], [150, 140], [170, 200], [-20, 200]])}${row([20, 150], [140, 132], 4, 1.2, 0.8, (x, y, s) => vpalm(x, y, s))}${frontShore(c, '#9DB56A', 150)}
${tx(260, 150, 1, `<path d='M210 150q50 12 100 0l-8-8h-84z' fill='#7A4A2A' ${O}/><path d='M226 142q34-26 68 0z' fill='#D9B26A' ${O}/><path d='M232 142q28-18 56 0' fill='none' stroke='#A9864D' stroke-width='1.6'/>`)}${foam(260, 156, 50)}`; });
const punjabV = V((c) => { const H = 116;
  return `${farHills(c, H, '#B9C76A', 0.5, 6)}${land(c, [[-20, H + 4], [420, H + 4]], '#E8C860')}${vrows(c, 210, H - 4, H + 4, [-240, -160, -80, 0, 80, 160, 240, 320, 400, 480, 560, 640], '#C9A23E', 5)}
${tx(310, H + 6, 0.55, `<rect x='278' y='${H - 24}' width='64' height='30' fill='#F2C14E' ${o}/><path d='M290 ${H - 24}q20-24 40 0z' fill='#F2C14E' ${o}/><rect x='270' y='${H + 2}' width='80' height='6' fill='#BFE6F7'/>`)}${vtree(40, 150, 1.2, '#6FA65A')}${vtree(170, 138, 0.8, '#7FAE5A')}`; });
const mumbaiV = V((c) => { const H = 118;
  return `${(() => { let s = 4, out = ''; for (let x = 180; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 9 + (s % 10), h = 16 + (s % 44); out += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#9AB0C8', 0.45)}'/>`; x += w + 2; } return out; })()}${sea(c, H, '#4F98B6')}
<path d='M-20 138q120 0 190 4 60 6 100 0t150-8v66H-20z' fill='#B8A688' ${O}/>${row([400, 132], [220, 124], 10, 0.6, 0.25, (x, y, s) => `<circle cx='${x}' cy='${y - 12 * s}' r='${2.6 * s + 1}' fill='#FFE08A'/><path d='M${x} ${y}v-${12 * s}' stroke='#5A5A5A' stroke-width='1.4'/>`)}
${put(mumbai, 100, 140, 0.92)}`; });
const charminarV = V((c) => { const H = 120;
  return `${farTown(c, -10, 420, H + 1, '#E8D9BC', 0.45, 14, 2)}${land(c, [[-20, H + 4], [420, H + 4]], '#D8C8A8')}${ribbon([[200, 212, 260], [200, 160, 130], [200, 136, 50], [200, H + 6, 14]], '#C4B48E', false)}
${row([40, 162], [160, H + 8], 6, 1, 0.3, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 32, 36, ['#F2D7A8', '#E9C38E'][i % 2])}<path d='M${x - 16} ${y - 36}h32v-6h-32z' fill='#E8735A' ${o}/>`))}${row([360, 162], [240, H + 8], 6, 1, 0.3, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 32, 36, ['#E9C38E', '#F2D7A8'][i % 2])}<path d='M${x - 16} ${y - 36}h32v-6h-32z' fill='#2F8A6A' ${o}/>`))}
${put(charminar, 200, 140, 0.9)}`; });
const rajasthanV = V((c) => { const H = 120;
  return `${hills(c, [[-20, H + 2], [80, H - 12], [200, H - 2], [320, H - 14], [420, H - 2]], '#E3B98E', 0.45, false, H + 4)}${tx(300, H, 0.55, `<rect x='250' y='${H - 30}' width='100' height='30' fill='#E8C9A0' ${o}/>${[262, 296, 330].map((d) => `<path d='M${d - 8} ${H - 30}q8-12 16 0z' fill='#E8C9A0' ${o}/>`).join('')}`)}
${land(c, [[-20, H + 6], [140, H + 2], [420, H + 6]], '#E9C98A')}${hills(c, [[-20, 160], [100, 146], [220, 154], [420, 144]], '#E2B66B', 0, true)}
${row([180, 150], [320, 128], 5, 0.9, 0.35, (x, y, s) => tx(x, y, s, `<path d='M${x - 22} ${y}v-14c-4-2-4-8 0-10 4-8 12-8 14-2 4-6 12-6 14 0 4 2 6 6 4 10v16M${x - 10} ${y}v-12M${x + 8} ${y}v-12' fill='#C99A5A' ${o}/>`), 0.8)}${put(rajasthan, 90, 140, 0.8)}`; });
// China
const greatWallV = V((c) => { const P = [[-20, 146], [40, 132], [92, 114], [150, 98], [205, 84], [265, 66], [330, 50], [420, 32]]; const W = [17, 15, 13, 11, 9, 7, 5.5, 4];
  const top = P.map(([x, y]) => [x, y + 3]); let segs = '';
  for (let i = 0; i < P.length - 1; i++) { const [a, b] = [P[i], P[i + 1]]; segs += `<path d='M${a[0]} ${a[1] - 3}L${b[0]} ${b[1] - 3}' stroke='${INK}' stroke-width='${W[i] + 3}' stroke-linecap='round'/><path d='M${a[0]} ${a[1] - 3}L${b[0]} ${b[1] - 3}' stroke='#D8BE96' stroke-width='${W[i]}' stroke-linecap='round'/><path d='M${a[0]} ${a[1] - 3 - W[i] * 0.4}L${b[0]} ${b[1] - 3 - W[i] * 0.4}' stroke='#B8976A' stroke-width='${W[i] * 0.35}' stroke-dasharray='${W[i] * 0.3} ${W[i] * 0.3}' fill='none'/>`; }
  const tw = (px, py, s) => tx(px, py, s, `<g ${O}><rect x='${px - 10}' y='${py - 24}' width='20' height='26' fill='#C9A982'/><rect x='${px - 13}' y='${py - 30}' width='26' height='8' fill='#B78C5E'/><path d='M${px - 14} ${py - 30}l14-9 14 9z' fill='#8C5A3A'/><rect x='${px - 3}' y='${py - 16}' width='6' height='8' fill='#5A4636'/></g>`);
  return `${hills(c, [[-20, 80], [30, 56], [80, 76], [130, 46], [190, 72], [250, 40], [310, 70], [370, 44], [420, 62]], '#B7C6D2', 0.4, false, 150)}${hills(c, [[-20, 104], [50, 82], [110, 98], [180, 70], [240, 96], [300, 76], [360, 96], [420, 80]], '#9DB5A6', 0.2, false, 150)}
<path d='${sil([...top, [420, 150]], 200)}' fill='#7FB569' ${O}/><path d='${sil([...top.map(([x, y]) => [x, y + 22]), [420, 160]], 200)}' fill='#6BA258' opacity='.75'/>${land(c, [[-20, 156], [200, 150], [420, 148]])}
${segs}${tw(92, 111, 1)}${tw(205, 81, 0.78)}${tw(330, 47, 0.52)}${vpine(12, 150, 0.9, '#3F6E3A')}${vpine(44, 148, 0.75, '#4F7E3E')}${vpine(124, 128, 0.6, '#3F6E3A')}${vpine(252, 102, 0.45, '#4F7E3E')}`; });
const sichuanV = V((c) => { const H = 122;
  return `${hills(c, [[-20, 70], [40, 46], [90, 76], [150, 40], [210, 78], [270, 50], [340, 80], [420, 56]], '#8FAE9A', 0.55, false, H)}${fog([[120, 84, 90, 8], [300, 90, 80, 8]])}${hills(c, [[-20, 100], [70, 80], [150, 104], [240, 82], [330, 102], [420, 86]], '#6F9C6A', 0.3, false, H + 4)}
${land(c, [[-20, 132], [200, 126], [420, 130]])}${[0, 1, 2].map((i) => `<path d='M${-20 + i * 14} 132q${120 - i * 20} -${16 + i * 4} ${240 - i * 20} -4' fill='none' stroke='#5E9F4F' stroke-width='3'/>`).join('')}
${row([20, 160], [140, 128], 5, 1.1, 0.5, (x, y, s) => tx(x, y, s, `${[-8, 0, 8].map((d) => `<path d='M${x + d} ${y}V${y - 66}' stroke='#5E9C4F' stroke-width='4'/><path d='M${x + d} ${y - 20}h-2M${x + d} ${y - 40}h-2' stroke='#3F6E3A' stroke-width='5'/><path d='M${x + d} ${y - 60}q8-4 12 2M${x + d} ${y - 50}q-8-4-12 2' fill='none' stroke='#6FAA5A' stroke-width='3'/>`).join('')}`))}`; });
const shanghaiV = V((c) => { const H = 116;
  return `${(() => { let s = 7, out = ''; for (let x = 120; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 10 + (s % 12), h = 24 + (s % 60); out += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#9AB0C8', 0.4)}'/>`; x += w + 3; } return out; })()}${tx(180, H, 0.9, put(shanghai, 180, H + 34, 0.9))}
${water(c, H + 2, 200, '#7A9A8E')}<path d='M-20 164q120-20 240-24t200-6v66H-20z' fill='#D8C8A8' ${O}/>${row([10, 158], [150, 134], 6, 1, 0.4, (x, y, s) => tx(x, y, s, vblock(x, y, 30, 40, '#E8DCC2')))}${vboat(260, 140, 0.8, '#C8352F')}`; });
const cantonV = V((c) => { const H = 118;
  return `${hills(c, [[160, H], [240, H - 34], [300, H - 20], [360, H - 40], [420, H - 26]], '#6E9068', 0.45, false, H + 2)}${(() => { let s = 2, out = ''; for (let x = 150; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 9 + (s % 10), h = 20 + (s % 56); out += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#A9B8C8', 0.35)}'/>`; x += w + 2; } return out; })()}
${sea(c, H, '#4F98B6')}${tx(110, 150, 1.1, `<path d='M70 150h80l-10 12h-60z' fill='#7A4A2A' ${O}/><path d='M86 148V92q20 8 22 54zM116 148V102q16 8 18 44z' fill='#C8452B' ${O}/><path d='M88 104h16M88 118h18M88 132h18M118 114h12M118 128h14' stroke='#8E2A1A' stroke-width='1.4'/>`)}${foam(110, 166, 50)}${frontShore(c, '#B8A688', 152)}`; });
// USA
const texasV = V((c) => { const H = 120;
  return `${hills(c, [[-20, H], [120, H - 4], [260, H + 1], [420, H - 4]], '#D9B98A', 0.5, false, H + 3)}${land(c, [[-20, H + 4], [420, H + 4]], '#D9B87A')}${ribbon([[220, 212, 120], [216, 160, 44], [214, 136, 16], [213, H + 6, 4]], '#8A7A6A', false)}<path d='M220 210L213 ${H + 6}' stroke='#F2C14E' stroke-width='2' stroke-dasharray='10 8'/>
${row([340, 166], [232, H + 8], 7, 1, 0.25, (x, y, s) => `<path d='M${x} ${y}v-${18 * s}' stroke='#7A4A2A' stroke-width='${3 * s}'/>`)}${row([350, 158], [234, H + 8], 2, 1, 0.3, () => '')}<path d='M${340} ${148}L232 ${H + 6}' stroke='#7A4A2A' stroke-width='1.2'/>
${tx(90, 140, 1, `<rect x='60' y='108' width='60' height='32' fill='#B5452E' ${O}/><path d='M54 110l36-22 36 22z' fill='#8A2E1E' ${O}/><rect x='80' y='118' width='20' height='22' fill='#F6E6D2' ${o}/><path d='M80 118l20 22M100 118l-20 22' stroke='#B5452E' stroke-width='2'/>`)}${tx(168, 140, 1, `<path d='M156 140l8-58M180 140l-8-58M158 124h20M161 104h14' stroke='#6E6E6E' stroke-width='2.4' fill='none'/><circle cx='168' cy='80' r='3' fill='#6E6E6E'/>${[0, 45, 90, 135].map((a) => `<path d='M168 80l-2-18h4z' fill='#C9C9C9' stroke='#3B2C24' stroke-width='1.2' transform='rotate(${a} 168 80)'/><path d='M168 80l-2-18h4z' fill='#C9C9C9' stroke='#3B2C24' stroke-width='1.2' transform='rotate(${a + 180} 168 80)'/>`).join('')}<path d='M168 80h18l5-5v10l-5-5' fill='#B5452E' stroke='#3B2C24' stroke-width='1.2'/>`)}${row([30, 160], [60, 150], 2, 1, 0.9, (x, y, s) => tx(x, y, s, `<path d='M${x - 4} ${y}v-32c0-6 8-6 8 0v32zM${x - 4} ${y - 14}h-6v-10c0-4 4-4 4 0v6M${x + 4} ${y - 18}h6v-10c0-4-4-4-4 0' fill='#4E9A3A' ${o}/>`))}`; });
const newEnglandV = V((c) => { const H = 118;
  return `${sea(c, H, '#4F86B0')}${hills(c, [[160, H + 2], [240, H - 10], [320, H - 4], [420, H - 14]], '#7E9F6A', 0.45, false, H + 3)}${row([250, H + 2], [380, H - 2], 5, 0.4, 0.25, (x, y, s) => vpine(x, y, s, hz(c, '#3F6E3A', 0.4), false))}
${hills(c, [[-20, 100], [60, 96], [130, 110], [180, 150], [200, 200]], '#8A8A7A', 0, true)}${hills(c, [[-20, 118], [80, 114], [150, 128], [180, 160], [180, 200]], '#7FA866', 0, true)}${put(newEngland, 90, 124, 0.8)}${foam(190, 152, 22)}${frontShore(c, '#D8CDB8', 152)}${vboat(250, 140, 0.8, '#2F6DB5')}`; });
const chicagoV = V((c) => { const H = 116;
  let s = 13, far = ''; for (let x = -10; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 10 + (s % 12), h = 30 + (s % 50); far += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#9AAAC0', 0.45)}'/>`; x += w + 2; }
  return `${far}${water(c, H + 2, 200, '#4F7FA8')}<path d='M-20 160q140-14 240-16t200 2v54H-20z' fill='#9DB56A' ${O}/>
${tx(110, 132, 1, `${vblock(70, 132, 24, 92, '#7A8494')}${vblock(100, 132, 30, 118, '#4A5262')}<path d='M94 14v-8M106 14v-8' stroke='${INK}' stroke-width='2'/>${vblock(134, 132, 26, 84, '#9AA5B4')}${vblock(160, 132, 22, 66, '#B7C6D6')}${vblock(44, 132, 22, 60, '#B7C6D6')}`)}<rect x='20' y='130' width='180' height='6' fill='#8A8A8A' ${o}/>${vboat(260, 146, 0.8, '#FFFFFF')}`; });
const farmV = V((c) => { const H = 118;
  return `${farHills(c, H, '#9CB06A', 0.5, 6)}${land(c, [[-20, H + 4], [420, H + 4]], '#E8C860')}${vrows(c, 220, H - 6, H + 4, [-200, -120, -40, 40, 120, 200, 280, 360, 440, 520, 600], '#C9A23E', 4)}
${row([300, H + 6], [400, H + 4], 3, 0.5, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 20}' y='${y - 26}' width='40' height='26' fill='#B5452E'/><path d='M${x - 24} ${y - 24}l24-14 24 14z' fill='#8A2E1E'/>`))}
${tx(90, 142, 1, `<rect x='56' y='104' width='60' height='38' fill='#C0392B' ${O}/><path d='M50 106l36-26 36 26z' fill='#8A2E1E' ${O}/><rect x='74' y='116' width='24' height='26' fill='#F6E6D2' ${o}/><path d='M74 116l24 26M98 116l-24 26' stroke='#C0392B' stroke-width='2'/><rect x='122' y='70' width='18' height='72' rx='9' fill='#D9DEE5' ${O}/><path d='M122 79a9 9 0 0 1 18 0' fill='#9AA5B4' ${o}/>`)}`; });
const californiaV = V((c) => { const DECK = [[-30, 122], [72, 114], [250, 108], [420, 104]]; const OR = '#D8512B', ORD = '#9E3516';
  const tower = (d, base, s) => tx(d, base, s, `<g ${O} fill='${OR}'><rect x='${d - 15}' y='22' width='10' height='${base - 28}'/><rect x='${d + 5}' y='22' width='10' height='${base - 28}'/>${[40, 62, 84, 106].map((y) => `<rect x='${d - 5}' y='${y}' width='10' height='7'/>`).join('')}<rect x='${d - 18}' y='16' width='36' height='8' rx='2'/></g><rect x='${d - 24}' y='${base - 14}' width='48' height='14' rx='3' fill='#B9AE9C' ${O}/>`);
  const cable = (p0, cc, p1, n, w = 3) => `<path d='M${p0} Q${cc} ${p1}' fill='none' stroke='${OR}' stroke-width='${w}' stroke-linecap='round'/>` + Array.from({ length: n }, (_, i) => { const [px, py] = q(p0, cc, p1, (i + 0.5) / n); const dy = along(DECK, px); return py < dy ? `<path d='M${px.toFixed(1)} ${py.toFixed(1)}V${dy.toFixed(1)}' stroke='${ORD}' stroke-width='${(w * 0.4).toFixed(2)}'/>` : ''; }).join('');
  const seg = (a, b, w) => `<path d='M${a} L${b}' stroke='${ORD}' stroke-width='${w + 2}'/><path d='M${a} L${b}' stroke='#F0B7A0' stroke-width='${w}'/>`;
  return `${water(c, 118, 200, '#4FA9D6')}<g opacity='.75'><path d='M262 120q30-30 70-22 30 6 40-10 20-6 60 20v12H262z' fill='${hz(c, '#9DB3A0', 0.3)}'/>${farTown(c, 300, 420, 120, '#E9E2D4', 0.3, 10, 4)}</g>
<g opacity='.85'>${tower(250, 126, 0.5)}</g>${seg([-30, 122], [72, 114], 9)}${seg([72, 114], [250, 108], 5)}${seg([250, 108], [420, 104], 3)}
<g opacity='.9'>${cable([72, 22], [168, 124], [250, 60], 22, 2.2)}${cable([250, 60], [335, 88], [420, 100], 9, 1.6)}</g>${tower(72, 150, 0.86)}${cable([-30, 98], [26, 70], [72, 22], 11, 3)}${cable([72, 22], [168, 130], [250, 60], 1, 3)}
${foam(72, 152, 30)}${foam(250, 127, 12)}${fog([[372, 112, 44, 7], [300, 120, 34, 5]])}${frontShore(c, '#F2DFA6', 152)}${vboat(160, 142, 0.85, '#2F6DB5')}${birds([[120, 54], [150, 44, 0.8], [196, 58, 0.9]])}`; });
const hawaiiV = V((c) => { const H = 118;
  return `${sea(c, H, '#3FB0D0')}<path d='M140 ${H}q40-60 90-66 50 8 80 66z' fill='${hz(c, '#4F7F4A', 0.4)}'/><path d='M200 70q10 20 6 48M240 66q-6 26 2 52' stroke='${hz(c, '#3F6E3A', 0.4)}' stroke-width='2' fill='none'/>
${frontShore(c, '#F6E6BF', 144)}${foam(160, 148, 120)}${row([30, 150], [140, 132], 4, 1.15, 0.6, (x, y, s) => vpalm(x, y, s))}${tx(120, 150, 1, `<path d='M98 150l4-30h36l4 30z' fill='#C99A63' ${O}/><path d='M92 122l28-18 28 18z' fill='#D9B26A' ${O}/>`)}${tx(220, 140, 0.9, `<path d='M200 140h60' stroke='#F2C14E' stroke-width='5' stroke-linecap='round'/><path d='M246 138l-4-28' stroke='${INK}' stroke-width='1.6'/>`)}`; });
// Spain
const valenciaV = V((c) => { const H = 116;
  return `${sea(c, H - 4, '#4FA9D6')}${land(c, [[-20, H + 2], [420, H + 2]], '#A9C07A')}${[0, 1, 2, 3].map((i) => `<path d='${sil([[-20, H + 10 + i * 10], [420, H + 8 + i * 10]], H + 16 + i * 10)}' fill='${hz(c, '#BFE6F7', 0.2 - i * 0.05)}' opacity='.7'/>`).join('')}${vrows(c, 220, H - 6, H + 2, [-200, -100, 0, 100, 200, 300, 400, 500, 600], '#7FAE5A', 3)}
${tx(110, 142, 1, `<rect x='76' y='110' width='68' height='32' fill='#FFFFFF' ${O}/><path d='M70 112l40-26 40 26z' fill='#E9D3A8' ${O}/><rect x='102' y='122' width='16' height='20' fill='#2F6DB5' ${o}/>`)}${vpalm(186, 150, 0.85)}`; });
const andalusiaV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 6], [80, H - 20], [190, H - 10], [300, H - 26], [420, H - 10]], '#C9B48A', 0.5, false, H + 4)}${tx(300, H - 14, 0.5, [0, 1, 2, 3, 4, 5].map((i) => vblock(260 + i * 16, H - 14 - (i % 2) * 8, 16, 12, '#FFFFFF', false)).join(''))}
${land(c, [[-20, H + 4], [420, H + 4]], '#C9B07A')}${[-180, -60, 60, 180, 300, 420, 540].map((x0) => row([x0, 170], [lerp(x0, 210, 0.9), H + 8], 6, 1, 0.25, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}q-2-10 2-16' stroke='#6B4A2B' stroke-width='3' fill='none'/><g fill='#7C9A55' ${o}><circle cx='${x - 7}' cy='${y - 20}' r='8'/><circle cx='${x + 7}' cy='${y - 22}' r='9'/><circle cx='${x}' cy='${y - 28}' r='8'/></g>`))).join('')}
${tx(90, 132, 1, [0, 1, 2, 3, 4].map((i) => vblock(60 + i * 16, 132 - (i % 2) * 10, 18, 22, '#FFFFFF')).join('') + `<path d='M88 100v-16l6-6 6 6v16' fill='#F2D7A8' ${o}/>`)}`; });
const galiciaV = V((c) => { const H = 118;
  return `${sea(c, H, '#3E7FAF')}${hills(c, [[160, H + 2], [240, H - 16], [320, H - 8], [420, H - 20]], '#5E8F4F', 0.45, false, H + 3)}${fog([[300, H - 8, 70, 6]])}
${hills(c, [[-20, 100], [50, 96], [110, 112], [160, 150], [170, 200]], '#5E8F4F', 0, true)}${put(galicia, 70, 122, 0.85)}${vboat(250, 140, 0.8, '#2F6DB5')}${foam(170, 152, 20)}${frontShore(c, '#B8A688', 152)}`; });
const asturiasV = V((c) => { const H = 120;
  return `${range(c, H, [[60, 80, 80], [190, 96, 90], [330, 84, 90]], '#9AAEB0', 0.4, { snow: true })}${hills(c, [[-20, H - 4], [90, H - 16], [200, H - 2], [300, H - 14], [420, H - 4]], '#6E9F5B', 0.25, false, H + 4)}
${land(c, [[-20, 132], [200, 126], [420, 130]])}${row([380, 150], [260, 128], 4, 1, 0.4, (x, y, s) => tx(x, y, s, `<rect x='${x - 12}' y='${y - 18}' width='24' height='18' fill='#FFFFFF' ${o}/><circle cx='${x - 6}' cy='${y - 10}' r='3' fill='${INK}'/><circle cx='${x + 6}' cy='${y - 6}' r='2.5' fill='${INK}'/>`))}${put(asturias, 90, 140, 0.9)}`; });
const madridV = V((c) => { const H = 120;
  return `${farTown(c, -10, 420, H + 1, '#E8C9A0', 0.45, 12, 9)}${land(c, [[-20, H + 4], [420, H + 4]], '#D8C8A8')}${vrows(c, 200, H - 30, H + 4, [-200, -100, 0, 100, 200, 300, 400, 500, 600], '#C4B48E', 2)}
${row([30, 162], [150, H + 6], 5, 1, 0.35, (x, y, s) => tx(x, y, s, `${vblock(x, y, 40, 42, '#C9744A')}<path d='M${x - 14} ${y}v-14a7 7 0 0 1 14 0v14M${x + 2} ${y}v-14a7 7 0 0 1 14 0v14' fill='#8A4A2A' ${o}/>`))}${row([370, 162], [250, H + 6], 5, 1, 0.35, (x, y, s) => tx(x, y, s, `${vblock(x, y, 40, 42, '#D98A5A')}<path d='M${x - 14} ${y}v-14a7 7 0 0 1 14 0v14M${x + 2} ${y}v-14a7 7 0 0 1 14 0v14' fill='#8A4A2A' ${o}/>`))}
${tx(200, 140, 1, `<rect x='194' y='110' width='12' height='30' fill='#8A8A8A' ${o}/><path d='M188 104h24l-4 8h-16z' fill='#5A5A5A' ${o}/><path d='M200 104l-6-10h12z' fill='#5A5A5A' ${o}/>`)}`; });
// Thailand
const chiangmaiV = V((c) => { const H = 118;
  return `${hills(c, [[-20, 74], [60, 54], [140, 80], [220, 50], [300, 78], [380, 56], [420, 70]], '#6E9068', 0.5, false, H)}${fog([[200, 92, 120, 8]])}${hills(c, [[-20, 104], [80, 90], [180, 108], [280, 92], [420, 104]], '#5E8F4F', 0.25, false, H + 4)}
${land(c, [[-20, 132], [200, 126], [420, 130]])}${put(chiangmai, 110, 146, 1.0)}${row([300, 150], [380, 130], 3, 0.9, 0.5, (x, y, s) => vpalm(x, y, s * 0.7))}`; });
const isaanV = V((c) => { const H = 118;
  return `${farHills(c, H, '#8FAE6A', 0.55, 8)}${land(c, [[-20, H + 4], [420, H + 4]], '#8FC86A')}${[0, 1, 2, 3, 4].map((i) => { const t = recede(5, 0.7)[4 - i]; const y = lerp(158, H + 8, t); return `<path d='M-20 ${y}L420 ${y - 2}' stroke='#6FAA4A' stroke-width='${lerp(4, 1.2, t)}'/>`; }).join('')}<path d='${sil([[-20, H + 10], [420, H + 8]], H + 14)}' fill='${hz(c, '#BFE6F7', 0.2)}' opacity='.6'/>
${row([300, 146], [390, 124], 4, 0.9, 0.35, (x, y, s) => vpalm(x, y, s * 0.75))}${tx(110, 146, 1, `<path d='M80 146v-20M140 146v-20' stroke='#6B4A2B' stroke-width='3'/><rect x='76' y='108' width='68' height='20' fill='#C99A63' ${O}/><path d='M68 110l42-24 42 24z' fill='#8A5A34' ${O}/>`)}${tx(210, 148, 1, `<path d='M200 148q6-16 0-28' stroke='${INK}' stroke-width='1.4' fill='none'/><path d='M190 122q10-10 20 0z' fill='#E8C9A0' ${o}/>`)}`; });
const thIslandV = V((c) => { const H = 118;
  const karst = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 18} ${y}q-6-50 8-64 14-6 18 10 8 30 6 54z' fill='${hz(c, '#4F8A5B', t)}' ${t < 0.2 ? O : ''}/>`);
  return `${water(c, H, 200, '#3FC0C8')}${karst(330, H + 2, 0.5, 0.5)}${karst(280, H + 2, 0.6, 0.45)}${karst(380, H + 2, 0.4, 0.55)}
${hills(c, [[-20, 70], [30, 62], [70, 90], [100, 150], [110, 200]], '#4F8A5B', 0, true)}${frontShore(c, '#F6E6BF', 146)}${foam(200, 148, 90)}${row([140, 146], [260, 134], 3, 1, 0.6, (x, y, s) => vpalm(x, y, s * 0.85))}
${tx(220, 146, 1.1, `<path d='M180 146q40 10 80 0l-6-6h-68z' fill='#7A4A2A' ${O}/><path d='M188 140l-8-14' stroke='#E74C3C' stroke-width='3'/><path d='M250 140v-12h-20v12' fill='#E0A93B' ${o}/>`)}`; });
const floatingMarketV = V((c) => { const H = 118;
  const hut = (x, y, s) => tx(x, y, s, `<path d='M${x - 18} ${y}v-10M${x + 18} ${y}v-10' stroke='#6B4A2B' stroke-width='3'/><rect x='${x - 20}' y='${y - 30}' width='40' height='20' fill='#C99A63' ${O}/><path d='M${x - 26} ${y - 28}l26-16 26 16z' fill='#8A5A34' ${O}/>`);
  return `${row([420, H + 2], [200, H + 1], 6, 0.6, 0.3, (x, y, s) => vpalm(x, y, s * 0.7))}${land(c, [[-20, H + 2], [420, H + 2]], '#7FAE5A')}${ribbon([[200, 214, 300], [204, 166, 160], [210, 140, 70], [214, H + 4, 16]], '#8FAE7A', false)}
${row([40, 150], [176, H + 6], 5, 1.1, 0.3, hut)}${row([360, 150], [244, H + 6], 5, 1.1, 0.3, hut)}${row([150, 164], [210, 128], 4, 1.1, 0.4, (x, y, s, i) => tx(x, y, s, `<path d='M${x - 24} ${y}q24 8 48 0l-4-6h-40z' fill='#7A4A2A' ${o}/><circle cx='${x - 8}' cy='${y - 9}' r='5' fill='${['#F2C14E', '#E8735A', '#9CC86A'][i % 3]}' ${o}/><circle cx='${x + 4}' cy='${y - 9}' r='5' fill='${['#E8735A', '#9CC86A', '#F2C14E'][i % 3]}' ${o}/><path d='M${x + 14} ${y - 6}q6-16 0-20' fill='#E8C9A0' ${o}/>`))}`; });
// Greece
const acropolisV = V((c) => { const H = 122;
  return `${farTown(c, -10, 420, H + 1, '#F2EEE6', 0.35, 10, 5)}${hills(c, [[260, H], [320, H - 26], [360, H - 34], [400, H - 20], [420, H]], '#A9B49A', 0.45, false, H + 2)}<path d='M358 ${H - 34}v-8' stroke='${hz(c, '#FFFFFF', 0.3)}' stroke-width='3'/>
${land(c, [[-20, H + 4], [420, H + 4]], '#E8E2D4')}${farTown(c, -10, 420, H + 14, '#F6F2EA', 0.15, 12, 2)}${land(c, [[-20, 146], [420, 144]], GRASS(c))}${put(acropolis, 110, 134, 1.0)}${vcyp(220, 150, 0.8)}`; });
const meteoraV = V((c) => { const H = 122;
  const rock = (x, y, w, h, t, mon) => `<path d='M${x - w} ${y}q-4-${h * 0.7} ${w * 0.3} -${h}q${w * 0.7} -10 ${w * 1.2} 4q${w * 0.4} ${h * 0.5} ${w * 0.5} ${h - 4}z' fill='${hz(c, '#B49A80', t)}' ${t < 0.2 ? O : ''}/>${mon ? tx(x, y - h + 2, mon, `<rect x='${x - 12}' y='${y - h - 14}' width='24' height='14' fill='#F2E6D0' ${o}/><path d='M${x - 15} ${y - h - 13}l15-9 15 9z' fill='#C0503A' ${o}/>`) : ''}`;
  return `${farHills(c, H, '#8FAE7A', 0.5, 10)}${rock(320, H + 4, 26, 60, 0.45, 0.5)}${rock(260, H + 4, 22, 46, 0.4, 0)}${rock(380, H + 4, 20, 40, 0.5, 0)}
${land(c, [[-20, 134], [200, 128], [420, 132]])}${rock(80, 150, 40, 118, 0, 1)}${rock(170, 146, 30, 80, 0.05, 0)}${vpine(16, 152, 0.9, '#3F6E3A')}${vpine(214, 146, 0.7, '#3F6E3A')}`; });
const grovesV = V((c) => { const H = 116;
  const olive = (x, y, s, t) => tx(x, y, s, `<path d='M${x} ${y}q-2-10 2-18' stroke='#6B4A2B' stroke-width='4' fill='none'/><g fill='${hz(c, '#7C9A55', t)}' ${t < 0.2 ? o : ''}><circle cx='${x - 8}' cy='${y - 22}' r='10'/><circle cx='${x + 8}' cy='${y - 24}' r='11'/><circle cx='${x}' cy='${y - 32}' r='10'/></g>`);
  return `${water(c, H - 8, H + 2, '#4FA9D6')}${land(c, [[-20, H + 2], [420, H + 2]], '#C9B07A')}${[-60, 40, 140, 240, 340, 440].map((x0) => row([x0, 160], [lerp(x0, 200, 0.85), H + 6], 6, 1, 0.25, (x, y, s) => olive(x, y, s, lerp(0, 0.4, 1 - s)))).join('')}${tx(60, 140, 1, `<rect x='36' y='112' width='46' height='28' fill='#FFFFFF' ${O}/><rect x='50' y='122' width='12' height='18' fill='#2F6DB5' ${o}/>`)}`; });

export const REGIONS = {
  FR: [
    [/fondue|raclette|tartiflette|reblochon|dauphinois|beaufort/i, R(alpsV, 'day', 'green', false, 'cheese', 'the French Alps')],
    [/bouillabaisse|ni[cç]oise|a[iï]oli|socca|pan bagnat|soupe de poisson|tapenade/i, R(marseilleV, 'day', 'stone', true, 'lemon', 'Marseille')],
    [/ratatouille|pistou|proven[cç]|herbes de provence|daube/i, R(provenceV, 'warm', 'dry', false, 'herbs', 'Provence')],
    [/cr[eê]pe|galette|moules|mussel|camembert|cid(re|er)|calvados|far breton|kouign/i, R(brittanyV, 'day', 'green', true, 'croissant', 'Brittany & Normandy')],
    [/bourguignon|coq au vin|escargot|dijon|goug[eè]re|jambon persill/i, R(burgundyV, 'dusk', 'green', false, 'cheese', 'Burgundy')],
    [/quiche|lorraine|choucroute|flammek|tarte flamb|kougel|kouglof|baeckeoffe|madeleine/i, R(alsaceV, 'day', 'green', false, 'bread', 'Alsace & Lorraine')],
    [/cassoulet|confit|magret|foie gras|aligot/i, R(carcassonneV, 'warm', 'dry', false, 'garlic', 'Carcassonne')]
  ],
  IT: [
    [/carbonara|cacio|amatriciana|gricia|suppl[iì]|saltimbocca|carciofi|alfredo|maritozz|porchetta/i, R(colosseumV, 'warm', 'dry', false, 'tomato', 'Rome')],
    [/pizza|margherita|marinara|calzone|sfogliatell|caprese|parmigiana|ragù napol|limoncello/i, R(vesuviusV, 'day', 'stone', true, 'tomato', 'Naples')],
    [/pesto|focaccia|genove|trofie|farinata|cinque/i, R(cinqueTerreV, 'day', 'stone', true, 'herbs', 'Cinque Terre')],
    [/lasagn|bolognese|ragù|ragu|tortellin|tagliatelle|mortadella|fettuccine/i, R(bolognaV, 'warm', 'stone', false, 'cheese', 'Bologna')],
    [/tirami|risotto|sarde in saor|bigoli|polenta|osso ?buco|milanese|fegato|panettone|baccal/i, R(veniceV, 'dusk', 'stone', true, 'cheese', 'Venice & the north')],
    [/bruschetta|ribollita|minestrone|bistecca|panzanella|cantucci|pappa al|crostini|pici/i, R(tuscanyV, 'warm', 'dry', false, 'olive', 'Tuscany')]
  ],
  JP: [
    [/okonomiyaki|takoyaki|kushikatsu|yakisoba|kitsune/i, R(osakaV, 'warm', 'green', false, 'lantern', 'Osaka')],
    [/ramen|miso butter|jingisukan|kani|crab|hokkaido|soup curry/i, R(hokkaidoV, 'day', 'snow', false, 'bowlsticks', 'Hokkaido')],
    [/matcha|yudofu|kaiseki|tofu|soba|udon|wagashi|mochi/i, R(kyotoV, 'warm', 'lush', false, 'greentea', 'Kyoto')],
    [/sushi|tempura|tonkatsu|teriyaki|curry|monja|katsu|yakitori|karaage/i, R(tokyoV, 'dusk', 'stone', false, 'chopsticks', 'Tokyo')]
  ],
  MX: [
    [/pibil|panucho|salbut|sopa de lima|papadzul|yucat/i, null],   // Chichén Itzá (the main landmark) is already Yucatán
    [/ceviche|aguachile|pescado|camar[oó]n|shrimp|fish taco|coctel|zarandeado/i, R(mxBeachV, 'day', 'beach', true, 'palm', 'the Pacific coast')],
    [/mole|chiles en nogada|chalupa|cemita|chiles? rellen|tlayuda|oaxac|mezcal/i, R(pueblaV, 'warm', 'dry', false, 'chili', 'Puebla & Oaxaca')],
    [/pozole|birria|tequila|torta ahogada|carne en su jugo/i, R(jaliscoV, 'warm', 'dry', false, 'lime', 'Jalisco')],
    [/carne asada|burrito|machaca|charros|cabrito|chimichanga|flour tortilla|sonor/i, R(mxDesertV, 'sand', 'red', false, 'cactus', 'the northern desert')],
    [/pastor|taco|elote|esquite|chilaquil|churro|enchilad|tamal|quesadilla|sope|huarache|torta/i, R(mxCityV, 'day', 'stone', false, 'avocado', 'Mexico City')]
  ],
  IN: [
    [/dosa|idli|sambar|appam|avial|uttapam|rasam|kerala|meen|coconut|payasam/i, R(keralaV, 'day', 'lush', true, 'banana', 'Kerala')],
    [/biryani|haleem|hyderab/i, R(charminarV, 'warm', 'sand', false, 'naan', 'Hyderabad')],
    [/pani puri|vada pav|pav bhaji|bhel|sev puri|misal|dabeli/i, R(mumbaiV, 'dusk', 'stone', true, 'chaicup', 'Mumbai')],
    [/dal baati|laal maas|ker sangri|ghevar|gatte|rajasth/i, R(rajasthanV, 'sand', 'sand', false, 'camel', 'Rajasthan')],
    [/butter chicken|tikka|naan|paneer|sarson|chole|chana|lassi|tandoor|makhani|paratha|kulcha|rajma/i, R(punjabV, 'warm', 'dry', false, 'chaicup', 'Punjab')]
  ],
  CN: [
    [/peking|beijing|jiaozi|zhajiang|jianbing|scallion pancake|baozi/i, R(greatWallV, 'day', 'green', false, 'panda', 'the Great Wall')],
    [/kung pao|mapo|dan ?dan|hot ?pot|sichuan|szechuan|twice.cooked|chongqing|hot and sour|fish.fragrant|chili oil/i, R(sichuanV, 'warm', 'lush', false, 'panda', 'Sichuan')],
    [/xiaolongbao|soup dumpling|shengjian|red.braised|hong shao|drunken/i, R(shanghaiV, 'dusk', 'stone', true, 'teapot', 'Shanghai')],
    [/char siu|dim sum|har gow|siu mai|cantonese|congee|egg tart|wonton|sweet and sour|chow mein|fried rice|lo mai|cheung fun/i, R(cantonV, 'day', 'stone', true, 'teapot', 'Hong Kong & Canton')]
  ],
  US: [
    [/poke|spam|loco moco|kalua|hawai|malasada/i, R(hawaiiV, 'day', 'beach', true, 'pineapple', 'Hawaii')],
    [/clam|chowder|lobster|cranberr|apple pie|boston|whoopie/i, R(newEnglandV, 'day', 'stone', true, 'coffee', 'New England')],
    [/bbq|barbecue|brisket|chili|tex.mex|fajita|ribs|queso|kolache/i, R(texasV, 'sand', 'red', false, 'cactus', 'Texas')],
    [/deep.dish|chicago|italian beef|hot dog/i, R(chicagoV, 'dusk', 'stone', false, 'ketchup', 'Chicago')],
    [/avocado toast|cobb|sourdough|cioppino|california|fish taco|burrito bowl/i, R(californiaV, 'warm', 'beach', true, 'avocado', 'San Francisco')],
    [/mac and cheese|mac ?n|ranch|meatloaf|casserole|pancake|corn|pot roast|biscuit|pie/i, R(farmV, 'day', 'green', false, 'corn', 'the Midwest')]
  ],
  ES: [
    [/paella|horchata|fideu|all i pebre|arroz/i, R(valenciaV, 'day', 'lush', true, 'lemon', 'Valencia')],
    [/pulpo|galleg|empanada gallega|padr[oó]n|percebe|lac[oó]n|tarta de santiago/i, R(galiciaV, 'day', 'green', true, 'lemon', 'Galicia')],
    [/fabada|cachopo|asturian|cabrales|sidra/i, R(asturiasV, 'day', 'green', false, 'cheese', 'Asturias')],
    [/gazpacho|salmorejo|pesca[ií]to|flamenqu|ajo ?blanco|gambas|rabo de toro|espinacas/i, R(andalusiaV, 'warm', 'dry', false, 'olive', 'Andalusia')],
    [/bravas|tortilla|croqueta|cocido|bocadillo|callos|churro|madrile/i, R(madridV, 'day', 'stone', false, 'chili', 'Madrid')]
  ],
  TH: [
    [/khao soi|sai ua|nam prik|hang ?lay|northern/i, R(chiangmaiV, 'warm', 'lush', false, 'elephant', 'Chiang Mai')],
    [/som ?tam|papaya salad|gai yang|nam tok|larb|laab|sticky rice(?! with)/i, R(isaanV, 'warm', 'lush', false, 'chili', 'Isaan')],
    [/massaman|tom yum|seafood|prawn|kua kling|gaeng som|phuket|goong|pla /i, R(thIslandV, 'day', 'beach', true, 'palm', 'the southern islands')],
    [/boat noodle|kuay|mango sticky|coconut|iced tea/i, R(floatingMarketV, 'warm', 'lush', true, 'pineapple', 'a floating market')]
  ],
  GR: [
    [/souvlaki|gyro|moussaka|pastitsio|baklava|loukoum|tzatziki|kebab/i, R(acropolisV, 'warm', 'dry', false, 'olive', 'Athens')],
    [/spanakopita|bougatsa|pita|pie|avgolemono|tiropita/i, R(meteoraV, 'day', 'green', false, 'teapot', 'Meteora')],
    [/greek salad|horiatiki|dakos|olive|fasolada|gemista|dolma|cretan|crete/i, R(grovesV, 'warm', 'dry', false, 'olive', 'the olive groves')]
  ]
};

// the scene for a dish in this country, or null (use the main landmark)
export function regionFor(iso, title) {
  const list = REGIONS[String(iso || '').toUpperCase()]; if (!list || !title) return null;
  const t = String(title);
  for (const [re, sc] of list) if (re.test(t)) return sc;
  return null;
}
