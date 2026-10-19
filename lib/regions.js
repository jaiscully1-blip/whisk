// Regional postcards: a country can have several scenes, and a dish gets the one for the part of the country it
// comes from (Provence for ratatouille, the Alps for fondue …). Matched on the dish title (then its ingredients);
// anything unmatched keeps the country's main landmark (lib/landmarks.js). Same drawing rules as landmarks:
// each draw(x) returns SVG standing on the ground line y = 150, centred on x, about ±100 wide.
// Plain strings, no imports.

const O = "stroke='#3B2C24' stroke-width='2.2' stroke-linejoin='round' stroke-linecap='round'";
const o = "stroke='#3B2C24' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'";
const at = (x, body) => `<g transform='translate(${x} 0)'>${body}</g>`;
const map = (a, f) => a.map(f).join('');

// ---- little parts ----
const pine = (x, s = 1, c = '#3F6E3A') => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0v-6' stroke='#6B4A2B' stroke-width='3'/><path d='M-12-6l12-34 12 34z' fill='${c}' ${O}/></g>`;
const cypress = (x, s = 1) => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0q-9-34 0-66 9 32 0 66z' fill='#3F6E3A' ${O}/></g>`;
const palm = (x, s = 1) => `<g transform='translate(${x} 150) scale(${s})'><path d='M0 0q4-30-2-58' fill='none' stroke='#8A5A34' stroke-width='5' stroke-linecap='round'/><g fill='#4F9A4A' ${o}><path d='M-2-58q-20-8-32 6 16-4 32-6z'/><path d='M-2-58q20-10 32 4-16-4-32-4z'/><path d='M-2-58q-10-18-26-14 14 4 26 14z'/><path d='M-2-58q12-18 26-12-14 2-26 12z'/></g></g>`;
const bush = (x, s = 1, c = '#5E9C4F') => `<g transform='translate(${x} 150) scale(${s})'><path d='M-14 0q-4-16 8-18 4-10 14-4 12-2 10 14 4 6-2 8z' fill='${c}' ${O}/></g>`;
const mtn = (x, w, h, c = '#8DA3C4', snow = true) => `<path d='M${x - w} 150L${x} ${150 - h}L${x + w} 150z' fill='${c}' ${O}/>${snow ? `<path d='M${x - w * 0.28} ${150 - h * 0.72}L${x} ${150 - h}L${x + w * 0.28} ${150 - h * 0.72}l-6 4-6-6-6 6-6-6z' fill='#FFFFFF' ${o}/>` : ''}`;
const hill = (x0, x1, top, c) => `<path d='M${x0} 150Q${(x0 + x1) / 2} ${top} ${x1} 150z' fill='${c}' ${O}/>`;
const boat = (x, y, c = '#D9452B', s = 1) => `<g transform='translate(${x} ${y}) scale(${s})'><path d='M-18 0h36l-6 8h-24z' fill='${c}' ${o}/><path d='M0 0v-24l14 20z' fill='#FFFFFF' ${o}/></g>`;
const house = (x, w, h, wall, roof, win = '#6E8FA8') => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${wall}' ${O}/><path d='M${x - w / 2 - 5} ${152 - h}L${x} ${150 - h - w * 0.42}L${x + w / 2 + 5} ${152 - h}z' fill='${roof}' ${O}/><rect x='${x - 5}' y='${150 - h * 0.55}' width='10' height='${h * 0.55}' fill='${win}' ${o}/>`;
const cube = (x, w, h, c = '#FFFFFF', door = '#2F6DB5') => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${c}' ${O}/><rect x='${x - 4}' y='${150 - h * 0.5}' width='8' height='${h * 0.5}' fill='${door}' ${o}/>`;
const rows = (x0, x1, n, top, c) => map([...Array(n).keys()], (i) => { const y = 150 - (i + 1) * ((150 - top) / (n + 1)); return `<path d='M${x0 + i * 6} ${y}H${x1 - i * 6}' stroke='${c}' stroke-width='4' stroke-linecap='round'/>`; });
const sun = (x, y, r = 12) => `<circle cx='${x}' cy='${y}' r='${r}' fill='#FFD36B' ${o}/>`;

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
const bologna = (x) => at(x, `<rect x='-34' y='22' width='26' height='128' fill='#B5684A' ${O}/><rect x='-38' y='22' width='34' height='8' fill='#9C5236' ${O}/><g transform='rotate(4 18 150)'><rect x='8' y='70' width='26' height='80' fill='#C47A58' ${O}/><rect x='4' y='70' width='34' height='8' fill='#9C5236' ${O}/></g>${map([-90, -66, 52, 76], (d) => `<rect x='${d - 12}' y='112' width='24' height='38' fill='#D99A6C' ${O}/><path d='M${d - 8} 150v-14a8 8 0 0 1 16 0v14z' fill='#8C5236' ${o}/>`)}`);

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
const G = { green: ['#8CC56B', '#6FAA52'], lush: ['#7FBF6A', '#5E9F4F'], dry: ['#D9C98A', '#C2B06E'], sand: ['#EBC98A', '#D9B26A'], snow: ['#EEF3F8', '#D8E2EC'], stone: ['#E8E2D4', '#D8CFBD'], beach: ['#F2DFA6', '#E6CB85'], red: ['#D9A070', '#C2865A'] };
const R = (draw, sky, ground, sea, buddy, name) => [draw, sky, G[ground], sea, buddy, name];
// iso → [[title pattern, scene], …] in priority order (first match wins), matched on the dish title only
export const REGIONS = {
  FR: [
    [/fondue|raclette|tartiflette|reblochon|dauphinois|beaufort/i, R(alps, 'day', 'green', false, 'cheese', 'the French Alps')],
    [/bouillabaisse|ni[cç]oise|a[iï]oli|socca|pan bagnat|soupe de poisson|tapenade/i, R(marseille, 'day', 'stone', true, 'lemon', 'Marseille')],
    [/ratatouille|pistou|proven[cç]|herbes de provence|daube/i, R(provence, 'warm', 'dry', false, 'herbs', 'Provence')],
    [/cr[eê]pe|galette|moules|mussel|camembert|cid(re|er)|calvados|far breton|kouign/i, R(brittany, 'day', 'green', true, 'croissant', 'Brittany & Normandy')],
    [/bourguignon|coq au vin|escargot|dijon|goug[eè]re|jambon persill/i, R(burgundy, 'dusk', 'green', false, 'cheese', 'Burgundy')],
    [/quiche|lorraine|choucroute|flammek|tarte flamb|kougel|kouglof|baeckeoffe|madeleine/i, R(alsace, 'day', 'green', false, 'bread', 'Alsace & Lorraine')],
    [/cassoulet|confit|magret|foie gras|aligot/i, R(carcassonne, 'warm', 'dry', false, 'garlic', 'Carcassonne')]
  ],
  IT: [
    [/carbonara|cacio|amatriciana|gricia|suppl[iì]|saltimbocca|carciofi|alfredo|maritozz|porchetta/i, R(colosseum, 'warm', 'dry', false, 'tomato', 'Rome')],
    [/pizza|margherita|marinara|calzone|sfogliatell|caprese|parmigiana|ragù napol|limoncello/i, R(vesuvius, 'day', 'stone', true, 'tomato', 'Naples')],
    [/pesto|focaccia|genove|trofie|farinata|cinque/i, R(cinqueTerre, 'day', 'stone', true, 'herbs', 'Cinque Terre')],
    [/lasagn|bolognese|ragù|ragu|tortellin|tagliatelle|mortadella|fettuccine/i, R(bologna, 'warm', 'stone', false, 'cheese', 'Bologna')],
    [/tirami|risotto|sarde in saor|bigoli|polenta|osso ?buco|milanese|fegato|panettone|baccal/i, R(venice, 'dusk', 'stone', true, 'cheese', 'Venice & the north')],
    [/bruschetta|ribollita|minestrone|bistecca|panzanella|cantucci|pappa al|crostini|pici/i, R(tuscany, 'warm', 'dry', false, 'olive', 'Tuscany')]
  ],
  JP: [
    [/okonomiyaki|takoyaki|kushikatsu|yakisoba|kitsune/i, R(osaka, 'warm', 'green', false, 'lantern', 'Osaka')],
    [/ramen|miso butter|jingisukan|kani|crab|hokkaido|soup curry/i, R(hokkaido, 'day', 'snow', false, 'bowlsticks', 'Hokkaido')],
    [/matcha|yudofu|kaiseki|tofu|soba|udon|wagashi|mochi/i, R(kyoto, 'warm', 'lush', false, 'greentea', 'Kyoto')],
    [/sushi|tempura|tonkatsu|teriyaki|curry|monja|katsu|yakitori|karaage/i, R(tokyo, 'dusk', 'stone', false, 'chopsticks', 'Tokyo')]
  ],
  MX: [
    [/pibil|panucho|salbut|sopa de lima|papadzul|yucat/i, null],   // Chichén Itzá (the main landmark) is already Yucatán
    [/ceviche|aguachile|pescado|camar[oó]n|shrimp|fish taco|coctel|zarandeado/i, R(mxBeach, 'day', 'beach', true, 'palm', 'the Pacific coast')],
    [/mole|chiles en nogada|chalupa|cemita|chiles? rellen|tlayuda|oaxac|mezcal/i, R(puebla, 'warm', 'dry', false, 'chili', 'Puebla & Oaxaca')],
    [/pozole|birria|tequila|torta ahogada|carne en su jugo/i, R(jalisco, 'warm', 'dry', false, 'lime', 'Jalisco')],
    [/carne asada|burrito|machaca|charros|cabrito|chimichanga|flour tortilla|sonor/i, R(mxDesert, 'sand', 'red', false, 'cactus', 'the northern desert')],
    [/pastor|taco|elote|esquite|chilaquil|churro|enchilad|tamal|quesadilla|sope|huarache|torta/i, R(mxCity, 'day', 'stone', false, 'avocado', 'Mexico City')]
  ],
  IN: [
    [/dosa|idli|sambar|appam|avial|uttapam|rasam|kerala|meen|coconut|payasam/i, R(kerala, 'day', 'lush', true, 'banana', 'Kerala')],
    [/biryani|haleem|hyderab/i, R(charminar, 'warm', 'sand', false, 'naan', 'Hyderabad')],
    [/pani puri|vada pav|pav bhaji|bhel|sev puri|misal|dabeli/i, R(mumbai, 'dusk', 'stone', true, 'chaicup', 'Mumbai')],
    [/dal baati|laal maas|ker sangri|ghevar|gatte|rajasth/i, R(rajasthan, 'sand', 'sand', false, 'camel', 'Rajasthan')],
    [/butter chicken|tikka|naan|paneer|sarson|chole|chana|lassi|tandoor|makhani|paratha|kulcha|rajma/i, R(punjab, 'warm', 'dry', false, 'chaicup', 'Punjab')]
  ],
  CN: [
    [/peking|beijing|jiaozi|zhajiang|jianbing|scallion pancake|baozi/i, R(greatWall, 'day', 'green', false, 'panda', 'the Great Wall')],
    [/kung pao|mapo|dan ?dan|hot ?pot|sichuan|szechuan|twice.cooked|chongqing|hot and sour|fish.fragrant|chili oil/i, R(sichuan, 'warm', 'lush', false, 'panda', 'Sichuan')],
    [/xiaolongbao|soup dumpling|shengjian|red.braised|hong shao|drunken/i, R(shanghai, 'dusk', 'stone', true, 'teapot', 'Shanghai')],
    [/char siu|dim sum|har gow|siu mai|cantonese|congee|egg tart|wonton|sweet and sour|chow mein|fried rice|lo mai|cheung fun/i, R(canton, 'day', 'stone', true, 'teapot', 'Hong Kong & Canton')]
  ],
  US: [
    [/poke|spam|loco moco|kalua|hawai|malasada/i, R(hawaii, 'day', 'beach', true, 'pineapple', 'Hawaii')],
    [/clam|chowder|lobster|cranberr|apple pie|boston|whoopie/i, R(newEngland, 'day', 'stone', true, 'coffee', 'New England')],
    [/bbq|barbecue|brisket|chili|tex.mex|fajita|ribs|queso|kolache/i, R(texas, 'sand', 'red', false, 'cactus', 'Texas')],
    [/deep.dish|chicago|italian beef|hot dog/i, R(chicago, 'dusk', 'stone', false, 'ketchup', 'Chicago')],
    [/avocado toast|cobb|sourdough|cioppino|california|fish taco|burrito bowl/i, R(california, 'warm', 'beach', true, 'avocado', 'San Francisco')],
    [/mac and cheese|mac ?n|ranch|meatloaf|casserole|pancake|corn|pot roast|biscuit|pie/i, R(farm, 'day', 'green', false, 'corn', 'the Midwest')]
  ],
  ES: [
    [/paella|horchata|fideu|all i pebre|arroz/i, R(valencia, 'day', 'lush', true, 'lemon', 'Valencia')],
    [/pulpo|galleg|empanada gallega|padr[oó]n|percebe|lac[oó]n|tarta de santiago/i, R(galicia, 'day', 'green', true, 'lemon', 'Galicia')],
    [/fabada|cachopo|asturian|cabrales|sidra/i, R(asturias, 'day', 'green', false, 'cheese', 'Asturias')],
    [/gazpacho|salmorejo|pesca[ií]to|flamenqu|ajo ?blanco|gambas|rabo de toro|espinacas/i, R(andalusia, 'warm', 'dry', false, 'olive', 'Andalusia')],
    [/bravas|tortilla|croqueta|cocido|bocadillo|callos|churro|madrile/i, R(madrid, 'day', 'stone', false, 'chili', 'Madrid')]
  ],
  TH: [
    [/khao soi|sai ua|nam prik|hang ?lay|northern/i, R(chiangmai, 'warm', 'lush', false, 'elephant', 'Chiang Mai')],
    [/som ?tam|papaya salad|gai yang|nam tok|larb|laab|sticky rice(?! with)/i, R(isaan, 'warm', 'lush', false, 'chili', 'Isaan')],
    [/massaman|tom yum|seafood|prawn|kua kling|gaeng som|phuket|goong|pla /i, R(thIsland, 'day', 'beach', true, 'palm', 'the southern islands')],
    [/boat noodle|kuay|mango sticky|coconut|iced tea/i, R(floatingMarket, 'warm', 'lush', true, 'pineapple', 'a floating market')]
  ],
  GR: [
    [/souvlaki|gyro|moussaka|pastitsio|baklava|loukoum|tzatziki|kebab/i, R(acropolis, 'warm', 'dry', false, 'olive', 'Athens')],
    [/spanakopita|bougatsa|pita|pie|avgolemono|tiropita/i, R(meteora, 'day', 'green', false, 'teapot', 'Meteora')],
    [/greek salad|horiatiki|dakos|olive|fasolada|gemista|dolma|cretan|crete/i, R(groves, 'warm', 'dry', false, 'olive', 'the olive groves')]
  ]
};

// the scene for a dish in this country, or null (use the main landmark)
export function regionFor(iso, title) {
  const list = REGIONS[String(iso || '').toUpperCase()]; if (!list || !title) return null;
  const t = String(title);
  for (const [re, sc] of list) if (re.test(t)) return sc;
  return null;
}
