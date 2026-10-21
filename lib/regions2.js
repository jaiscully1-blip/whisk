// Regional postcards, batch 2 (see lib/regions.js for how they're matched and drawn).
import { O, o, at, map, pine, cypress, palm, bush, mtn, hill, boat, house, cube, rows, sun, R } from './regions.js';
import { V, INK, hz, tx, q, lerp, recede, sil, hills, range, land, water, foam, fog, birds, ribbon, rows as vrows, line, pine as vpine, cypress as vcyp, palm as vpalm, bush as vbush, tree as vtree, boat as vboat, house as vhouse, block as vblock, farTown, put, frontShore, grass, skyline, minaret, cow as vcow, sheep, camel, llama, balloon, acacia, terraces } from './art/vista.js';
import { limaCoastV } from './art/places.js';

export const gate = (x, w, h, wall, roof) => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${wall}' ${O}/><path d='M${x - w / 2 - 8} ${152 - h}q${w / 2 + 8} -14 ${w + 16} 0l-6 -8h${-(w + 4)}z' fill='${roof}' ${O}/>`;
export const tower = (x, h, w, c) => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${c}' ${O}/>`;
export const dome = (x, y, r, c) => `<path d='M${x - r} ${y}a${r} ${r} 0 0 1 ${r * 2} 0z' fill='${c}' ${O}/>`;
export const wave = (y) => `<path d='M-104 ${y}q13-5 26 0t26 0 26 0 26 0 26 0 26 0 26 0 26 0' fill='none' stroke='#BFE6F7' stroke-width='2'/>`;
export const cow = (x) => `<g transform='translate(${x} 150)'><rect x='-12' y='-18' width='24' height='12' rx='4' fill='#FFFFFF' ${o}/><circle cx='-6' cy='-14' r='3' fill='#3B2C24'/><rect x='-10' y='-6' width='3' height='6' fill='#3B2C24'/><rect x='7' y='-6' width='3' height='6' fill='#3B2C24'/><circle cx='14' cy='-17' r='5' fill='#FFFFFF' ${o}/></g>`;
export const dune = (c = '#E2B66B') => `<path d='M-104 150q50-34 100-14t108-18v32z' fill='${c}' ${O}/>`;

// ---- South Korea ----
const seoul = (x) => at(x, `${map([[-84, 56], [-62, 80], [66, 70], [90, 52]], ([d, h]) => tower(d, h, 20, '#9AB0C8'))}${mtn(0, 70, 56, '#7FA95E', false)}<path d='M-8 150l5-92h6l5 92z' fill='#E8EEF4' ${O}/><circle cx='0' cy='64' r='8' fill='#E8EEF4' ${O}/><path d='M0 56v-14' stroke='#3B2C24' stroke-width='2'/><path d='M-36 150l28-6M36 150l-28-6' stroke='#3B2C24' stroke-width='2'/>`);
const busan = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#4FA9D6' ${o}/>${map([-86, -60, -34, -8, 18, 44, 70, 94], (d, i) => `<rect x='${d - 11}' y='${100 - (i % 3) * 10}' width='22' height='${50 + (i % 3) * 10}' fill='${['#F2C14E', '#E8735A', '#86B7D9', '#F4D2D9'][i % 4]}' ${o}/>`)}${boat(-20, 142, '#D9452B', 0.9)}`);
const jeju = (x) => at(x, `${hill(-104, 60, 70, '#6E9F5B')}${mtn(-30, 60, 70, '#5E8F6A', false)}<path d='M-48 84q18-8 36 0' fill='none' stroke='#3F6E3A' stroke-width='5'/>${map([40, 60, 80], (d) => `<circle cx='${d}' cy='128' r='11' fill='#F2A33A' ${o}/><path d='M${d} 118l4-8' stroke='#4E9A3A' stroke-width='3'/>`)}<rect x='-104' y='140' width='208' height='10' fill='#4FA9D6' ${o}/>`);
const hanok = (x) => at(x, `<path d='M-90 150q40-14 180 0z' fill='#C9B48A' ${o}/><rect x='-60' y='108' width='120' height='34' fill='#F2E2C4' ${O}/><path d='M-76 110q76-26 152 0l-10-10q-66-16-132 0z' fill='#5A5A66' ${O}/>${map([-36, 0, 36], (d) => `<rect x='${d - 10}' y='116' width='20' height='26' fill='#E8D5B0' ${o}/>`)}${map([-86, 88], (d) => pine(d, 0.9))}`);

// ---- Vietnam ----
const hanoi = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#6FAF9A' ${o}/><path d='M-36 136v-24h44v24' fill='#C0503A' ${O}/><path d='M-44 114q30-16 60 0l-6-10h-48z' fill='#E2B33E' ${O}/>${map([-78, 70, 90], (d, i) => `<rect x='${d - 12}' y='${96 - i * 6}' width='24' height='${54 + i * 6}' fill='${['#F2C14E', '#86B7D9', '#E8735A'][i]}' ${O}/>`)}`);
const hoian = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#8FB8A6' ${o}/>${map([[-60, 56, '#F2C14E'], [-4, 64, '#F6E6A8'], [52, 54, '#F2C14E']], ([d, h, c]) => `<rect x='${d - 24}' y='${136 - h}' width='48' height='${h}' fill='${c}' ${O}/><path d='M${d - 28} ${138 - h}h56l-6-10h-44z' fill='#B5452E' ${O}/><rect x='${d - 5}' y='${136 - h * 0.5}' width='10' height='${h * 0.5}' fill='#6B4A2B' ${o}/>`)}${map([-40, -20, 0, 20, 40], (d, i) => `<path d='M${d} 84v8' stroke='#3B2C24' stroke-width='1.4'/><ellipse cx='${d}' cy='98' rx='6' ry='8' fill='${['#E2523B', '#F2C14E', '#E86A9A'][i % 3]}' ${o}/>`)}${boat(80, 144, '#8A5A34', 0.9)}`);
const mekong = (x) => at(x, `<rect x='-104' y='124' width='208' height='26' fill='#C9A870' ${o}/>${map([-70, -40, 60, 90], (d) => palm(d, 0.9))}<path d='M-50 134q50 10 100 0l-8 8q-40 8-84 0z' fill='#6B4A2B' ${O}/><path d='M-20 132q20-28 44-4z' fill='#E8D9A0' ${O}/><path d='M24 128l12-12' stroke='#3B2C24' stroke-width='2'/>`);
const sapa = (x) => at(x, `${map([[-30, 0, 70], [10, 22, 90], [50, 50, 70]], ([d, dx, h], i) => `<path d='M-104 ${150 - i * 14}q60-${h} 208 ${-4 + i * 4}v${14 + i * 14}h-208z' fill='${['#9CCF6A', '#7FBF6A', '#5E9F4F'][i]}' ${O}/>`)}${map([0, 1, 2, 3], (i) => `<path d='M-96 ${128 - i * 12}q90-${22 - i * 2} 190 -${6 + i * 3}' fill='none' stroke='#E8F2B0' stroke-width='3'/>`)}${house(-60, 30, 22, '#C99A63', '#8A5A34')}`);

// ---- Turkey ----
const istanbul = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#4FA9D6' ${o}/>${dome(0, 100, 38, '#9AB0C8')}<rect x='-38' y='100' width='76' height='36' fill='#E8DCC2' ${O}/>${map([-62, 62], (d) => `<rect x='${d - 6}' y='56' width='12' height='80' fill='#F2E6D0' ${O}/><path d='M${d - 8} 58l8-22 8 22z' fill='#2E8A8F' ${o}/>`)}${map([-44, 44], (d) => dome(d, 100, 14, '#B7C6D6'))}${boat(-86, 144, '#D9452B', 0.8)}`);
const cappadocia = (x) => at(x, `${dune('#E8C99A')}${map([[-70, 54], [-34, 76], [4, 94], [44, 66], [78, 50]], ([d, h]) => `<path d='M${d - 14} 150q0-${h * 0.6} 4-${h * 0.8} 6-${h * 0.2} 10 0 4 ${h * 0.2} 4 ${h * 0.8}z' fill='#D9A877' ${O}/><path d='M${d - 6} ${150 - h * 0.5}v8' stroke='#6B4A2B' stroke-width='3'/>`)}${map([-60, -10, 50], (d, i) => `<ellipse cx='${d}' cy='${38 + i * 6}' rx='11' ry='15' fill='${['#E8735A', '#F2C14E', '#4FB3A6'][i]}' ${o}/><rect x='${d - 5}' y='${52 + i * 6}' width='10' height='6' fill='#8A5A34' ${o}/>`)}`);
const aegeanTR = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/>${map([[-50, 30], [-10, 40], [30, 28]], ([d, h]) => `<rect x='${d - 18}' y='${128 - h}' width='36' height='${h}' fill='#FFFFFF' ${O}/><rect x='${d - 4}' y='${128 - h * 0.5}' width='8' height='${h * 0.5}' fill='#2F6DB5' ${o}/>`)}${boat(70, 136, '#FFFFFF', 1)}${cypress(-86, 0.8)}${palm(94, 0.8)}`);
const anatolia = (x) => at(x, `<path d='M-104 150q50-30 100-20t108-8v28z' fill='#D9C98A' ${O}/>${rows(-90, 90, 3, 118, '#C2B06E')}${mtn(0, 60, 60, '#9AAFC6', true)}${house(-60, 36, 24, '#E8C99A', '#8A5A34')}<g transform='translate(52 150)'><rect x='-14' y='-22' width='28' height='14' rx='5' fill='#F2E9D8' ${o}/><circle cx='-12' cy='-26' r='5' fill='#F2E9D8' ${o}/><path d='M-8-8v8M8-8v8' stroke='#3B2C24' stroke-width='3'/></g>`);

// ---- Lebanon ----
const cedars = (x) => at(x, `${mtn(0, 74, 80, '#9AAFC6', true)}${map([-78, -52, 46, 74], (d, i) => `<g transform='translate(${d} 150) scale(${0.9 + (i % 2) * 0.25})'><path d='M0 0v-22' stroke='#6B4A2B' stroke-width='4'/><path d='M-24-18q24-14 48 0-6 4-24 2t-24-2zM-18-30q18-12 36 0-4 4-18 2t-18-2z' fill='#3F6E3A' ${O}/></g>`)}`);
const beirut = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#4FA9D6' ${o}/>${map([[-84, 60], [-60, 90], [-34, 54], [40, 80], [66, 56], [92, 70]], ([d, h]) => tower(d, h, 22, '#E8DCC2'))}<path d='M-14 136q-4-34 14-44 18 10 14 44z' fill='#F2C14E' ${O}/><path d='M-50 142q-6-30 4-40' stroke='#5E8F4F' stroke-width='4' fill='none'/>${boat(10, 144, '#FFFFFF', 0.8)}`);
const bekaa = (x) => at(x, `${dune('#D9C98A')}${rows(-90, 90, 3, 118, '#B8A04E')}${map([-70, -50, -30, -10, 10, 30, 50, 70], (d, i) => `<g transform='translate(${d} ${136 + (i % 2) * 6})'><path d='M0 0v-8' stroke='#6B4A2B' stroke-width='3'/><ellipse cx='0' cy='-14' rx='8' ry='6' fill='#6B2A5A' ${o}/></g>`)}${tower(86, 74, 14, '#E8DCC2')}${tower(60, 60, 14, '#E8DCC2')}<path d='M53 90h14M79 76h14' stroke='#3B2C24' stroke-width='2'/>`);

// ---- Brazil ----
const bahia = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${palm(-76, 1.1)}${palm(-50, 0.9)}${palm(78, 1)}${map([[-20, '#F2C14E'], [10, '#E8735A'], [40, '#86B7D9']], ([d, c]) => `<rect x='${d - 12}' y='104' width='24' height='38' fill='${c}' ${O}/><path d='M${d - 15} 106l15-14 15 14z' fill='#B5452E' ${o}/>`)}`);
const amazon = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#8A7A4E' ${o}/>${map([-90, -66, -42, -18, 40, 64, 88], (d, i) => `<g transform='translate(${d} 128)'><path d='M0 0v-${40 + (i % 3) * 12}' stroke='#6B4A2B' stroke-width='5'/><circle cx='0' cy='-${50 + (i % 3) * 12}' r='${18 + (i % 2) * 4}' fill='${['#3F7E3A', '#4F9A4A'][i % 2]}' ${O}/></g>`)}<path d='M-24 138q28 8 54 0l-6 6q-24 6-42 0z' fill='#8A5A34' ${O}/><path d='M-40 120q16-10 30 0' fill='none' stroke='#E86A9A' stroke-width='4'/>`);
const saoPaulo = (x) => at(x, `${map([[-86, 60], [-62, 96], [-36, 70], [-10, 112], [18, 82], [44, 100], [70, 66], [94, 88]], ([d, h], i) => `${tower(d, h, 22, i % 2 ? '#9AB0C8' : '#B7C6D6')}${map([0, 1, 2, 3], (r) => `<path d='M${d - 6} ${150 - h + 10 + r * 12}h12' stroke='#FFF3C4' stroke-width='2.6'/>`)}`)}`);
const gaucho = (x) => at(x, `<path d='M-104 150q60-20 208-6v6z' fill='#9CCF6A' ${O}/><path d='M-104 130q90-24 208 0' fill='none' stroke='#8FBE5A' stroke-width='3'/>${cow(-50)}${cow(-10)}${cow(60)}${house(80, 36, 24, '#E8DCC2', '#B5452E')}${tower(-86, 30, 4, '#6B4A2B')}`);

// ---- Peru ----
const machuPicchu = (x) => at(x, `${mtn(-30, 70, 120, '#6E9F7A', false)}${mtn(64, 44, 90, '#7FA95E', false)}<path d='M-80 150q30-22 70-12t80 12z' fill='#8FBE5A' ${O}/>${map([0, 1, 2, 3], (i) => `<path d='M${-70 + i * 14} ${142 - i * 7}h${70 - i * 6}' stroke='#C9C3BE' stroke-width='6'/>`)}${map([[-30, 112], [-6, 106], [20, 112]], ([d, y]) => `<rect x='${d - 8}' y='${y}' width='16' height='10' fill='#B8B0A0' ${o}/>`)}<g transform='translate(96 150)'><rect x='-9' y='-20' width='18' height='10' rx='4' fill='#E8DCC2' ${o}/><circle cx='-9' cy='-26' r='4' fill='#E8DCC2' ${o}/><path d='M-5-10v10M5-10v10' stroke='#3B2C24' stroke-width='3'/></g>`);
const limaCoast = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FA9D6' ${o}/><path d='M-104 128q40-40 100-44 50 4 80 44z' fill='#D9C79A' ${O}/>${map([[-50, 100], [-24, 92], [4, 96], [32, 104]], ([d, y], i) => `<rect x='${d - 10}' y='${y}' width='20' height='${128 - y}' fill='${['#F2C14E', '#E8735A', '#86B7D9', '#F4D2D9'][i]}' ${o}/>`)}${boat(70, 138, '#2F6DB5', 0.9)}${wave(134)}`);
const andes = (x) => at(x, `${mtn(-60, 70, 100)}${mtn(20, 80, 120, '#9AAED0')}${mtn(90, 40, 70)}<path d='M-104 150q60-20 208-6v6z' fill='#B9C76A' ${O}/>${map([[-90, 1], [-70, 0.8]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><rect x='-10' y='-22' width='20' height='12' rx='5' fill='#F2E9D8' ${o}/><circle cx='-11' cy='-30' r='5' fill='#F2E9D8' ${o}/><path d='M-6-10v10M6-10v10' stroke='#3B2C24' stroke-width='3'/></g>`)}`);

// ---- Morocco ----
const marrakech = (x) => at(x, `${dune('#E8C99A')}<rect x='-20' y='50' width='40' height='100' fill='#D9845A' ${O}/><path d='M-24 50h48M-20 36h40l-4 14h-32z' fill='#C7633A' ${O}/><path d='M0 36v-14' stroke='#3B2C24' stroke-width='2'/><circle cx='0' cy='20' r='3' fill='#E2B33E'/>${map([-30, 0, 30], (d) => `<path d='M${d - 4} 96h8' stroke='#3B2C24' stroke-width='2'/>`)}${map([-80, 80], (d) => palm(d, 0.9))}`);
const chefchaouen = (x) => at(x, `${hill(-104, 110, 74, '#B7C6D6')}${map([[-70, 44], [-36, 60], [0, 50], [36, 66], [70, 46]], ([d, h], i) => `<rect x='${d - 18}' y='${150 - h}' width='36' height='${h}' fill='${['#86B7D9', '#9CC6E4', '#6FA6D4'][i % 3]}' ${O}/><rect x='${d - 5}' y='${150 - h * 0.45}' width='10' height='${h * 0.45}' fill='#2F6DB5' ${o}/>`)}${map([-50, 54], (d) => `<ellipse cx='${d}' cy='96' rx='6' ry='5' fill='#E8735A' ${o}/>`)}`);
const sahara = (x) => at(x, `${dune('#EBC98A')}<path d='M-104 150q70-50 140-14t72 14z' fill='#E2B66B' ${O}/>${map([[-30, 0.9], [-8, 0.9], [14, 0.9]], ([d, s]) => `<g transform='translate(${d} 138) scale(${s})'><ellipse cx='0' cy='-14' rx='13' ry='8' fill='#C99A63' ${o}/><path d='M-3-20q3-10 6 0' fill='#C99A63' ${o}/><path d='M12-18q6-8 10-18' stroke='#C99A63' stroke-width='5' stroke-linecap='round' fill='none'/><path d='M-8-8v10M8-8v10' stroke='#3B2C24' stroke-width='3'/></g>`)}<path d='M70 150l12-18 12 18z' fill='#E8DCC2' ${O}/>`);
const essaouira = (x) => at(x, `<rect x='-104' y='132' width='208' height='18' fill='#4FA9D6' ${o}/><path d='M-104 132h208v-34h-208z' fill='#F2E2C4' ${O}/>${map([-90, -66, -42, -18, 6, 30, 54, 78], (d) => `<rect x='${d - 4}' y='90' width='8' height='8' fill='#F2E2C4' ${o}/>`)}${map([-60, 0, 60], (d) => `<path d='M${d - 8} 132v-12a8 8 0 0 1 16 0v12z' fill='#2F6DB5' ${o}/>`)}${boat(-30, 142, '#2F6DB5', 0.9)}${boat(40, 144, '#F2C14E', 0.8)}`);

// ---- United Kingdom ----
const highlands = (x) => at(x, `${mtn(-50, 70, 80, '#8E7AA0', false)}${mtn(40, 70, 96, '#9A86AE', false)}<path d='M-104 150q60-16 208-4v4z' fill='#8FA84E' ${O}/><rect x='-104' y='138' width='60' height='12' fill='#6FAFD0' ${o}/><rect x='-92' y='96' width='40' height='30' fill='#B8AC92' ${O}/>${map([-92, -72, -56], (d) => `<rect x='${d}' y='88' width='8' height='8' fill='#B8AC92' ${o}/>`)}${bush(60, 1, '#B58AB0')}${bush(80, 0.8, '#B58AB0')}`);
const cornwall = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#4FA9D6' ${o}/><path d='M-104 150q10-40 50-40l30 8q30 14 24 32z' fill='#7FB069' ${O}/>${house(-40, 40, 28, '#E8E2D4', '#5A6E9A')}${map([[30, 40], [60, 52], [90, 36]], ([d, h]) => cube(d, 26, h, '#F6E6D2', '#2F6DB5'))}${boat(50, 142, '#D9452B', 0.9)}`);
const cotswolds = (x) => at(x, `${hill(-104, 60, 84, '#A9C76A')}${hill(-20, 110, 70, '#8CC56B')}${map([-70, -30, 20, 66], (d, i) => house(d, 34, 26 + (i % 2) * 6, '#E2C58A', '#7A5A3E'))}${map([-92, 94], (d) => bush(d, 1.1, '#4F8E4A'))}<path d='M-100 148q60-10 200 0' stroke='#B8AC92' stroke-width='3' fill='none'/>`);
const london2 = (x) => at(x, `<rect x='-104' y='138' width='208' height='12' fill='#6FAFD0' ${o}/><path d='M-60 138v-22h120v22' fill='#B7C6D6' ${O}/>${map([-60, 60], (d) => `<rect x='${d - 7}' y='64' width='14' height='74' fill='#C9B79A' ${O}/><path d='M${d - 9} 66l9-20 9 20z' fill='#5A6B4E' ${o}/>`)}<path d='M-60 100h120' stroke='#3B2C24' stroke-width='3'/>${map([-34, 0, 34], (d) => `<path d='M${d} 100v-10' stroke='#3B2C24' stroke-width='2'/>`)}${map([-86, 90], (d, i) => tower(d, 58 + i * 12, 18, '#9AB0C8'))}`);

// ---- Germany ----
const bavaria = (x) => at(x, `${mtn(-60, 60, 80)}${mtn(10, 70, 100, '#9AAED0')}<path d='M-104 150q60-16 208-4v4z' fill='#8CC56B' ${O}/>${gate(50, 36, 30, '#F6E6D2', '#B5452E')}<path d='M50 92v-14M44 86h12' stroke='#3B2C24' stroke-width='2'/>${pine(-86)}${pine(92, 0.9)}`);
const berlin = (x) => at(x, `<rect x='-62' y='120' width='124' height='30' fill='#E2D5B8' ${O}/>${map([-48, -32, -16, 0, 16, 32, 48], (d) => `<rect x='${d - 4}' y='86' width='8' height='34' fill='#F2E9D8' ${o}/>`)}<rect x='-66' y='78' width='132' height='10' fill='#E2D5B8' ${O}/><path d='M-30 78v-12h60v12' fill='#E2D5B8' ${O}/><path d='M-14 66l14-18 14 18z' fill='#C9B79A' ${o}/>`);
const blackForest = (x) => at(x, `${hill(-104, 60, 80, '#4F7E3E')}${hill(-30, 110, 90, '#3F6E3A')}${map([-84, -64, -44, 40, 64, 88], (d, i) => pine(d, 1 + (i % 2) * 0.3, '#2F5E3A'))}<rect x='-14' y='108' width='46' height='34' fill='#B07A48' ${O}/><path d='M-22 110l31-26 31 26z' fill='#7A4A2A' ${O}/><rect x='4' y='122' width='10' height='20' fill='#6B4A2B' ${o}/>`);
const rhine = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#6FAFD0' ${o}/>${hill(-104, 30, 76, '#9CBF5E')}${rows(-90, 0, 3, 100, '#6E8F3E')}${map([[-10, 56], [40, 74], [84, 48]], ([d, h]) => `<rect x='${d - 16}' y='${134 - h}' width='32' height='${h}' fill='#C9B79A' ${O}/><path d='M${d - 20} ${136 - h}l20-24 20 24z' fill='#5A5A66' ${o}/>`)}`);

// ---- Argentina ----
const pampas = (x) => at(x, `<path d='M-104 150q60-14 208-2v2z' fill='#B9C76A' ${O}/><path d='M-104 132q90-12 208 0' fill='none' stroke='#9CAE50' stroke-width='3'/>${cow(-60)}${cow(-20)}${cow(26)}<g transform='translate(84 150)'><path d='M0 0v-30' stroke='#6B4A2B' stroke-width='4'/><path d='M-14-24q14-12 28 0' fill='#8A9A5E' ${O}/></g><path d='M-96 150v-22M-90 150v-22' stroke='#6B4A2B' stroke-width='3'/>`);
const buenosAires = (x) => at(x, `${map([[-80, 54, '#F2C14E'], [-48, 70, '#E8735A'], [-16, 58, '#86B7D9'], [16, 72, '#F6E6A8'], [48, 54, '#E86A9A'], [80, 66, '#4FB3A6']], ([d, h, c]) => `<rect x='${d - 15}' y='${150 - h}' width='30' height='${h}' fill='${c}' ${O}/><rect x='${d - 5}' y='${150 - h + 10}' width='10' height='12' fill='#3B5E7A'/>`)}<path d='M-8 150v-84h16v84z' fill='#F6EEDF' ${O}/><path d='M-10 66l10-18 10 18z' fill='#C9B79A' ${o}/>`);
const patagonia = (x) => at(x, `${mtn(-60, 44, 110, '#B8C9DE')}${mtn(-14, 40, 140, '#A8BCD4')}${mtn(40, 44, 96, '#B8C9DE')}<rect x='-104' y='132' width='208' height='18' fill='#6FD0E0' ${o}/>${map([-86, 90], (d) => pine(d, 1, '#2F5E3A'))}`);

// ---- Portugal ----
const lisbon = (x) => at(x, `<rect x='-104' y='138' width='208' height='12' fill='#4FA9D6' ${o}/>${map([-70, -40, 56, 84], (d, i) => `<rect x='${d - 14}' y='${100 - (i % 2) * 12}' width='28' height='${38 + (i % 2) * 12}' fill='${['#F2C14E', '#F4D2D9', '#E8DCC2', '#86B7D9'][i]}' ${O}/><path d='M${d - 18} ${102 - (i % 2) * 12}l18-12 18 12z' fill='#C0503A' ${o}/>`)}<rect x='-14' y='60' width='28' height='78' fill='#E8DCC2' ${O}/><path d='M-18 62l18-26 18 26z' fill='#E8DCC2' ${O}/><path d='M-6 138v-18M6 138v-18' stroke='#3B2C24' stroke-width='2'/>`);
const algarve = (x) => at(x, `<rect x='-104' y='130' width='208' height='20' fill='#4FC3D6' ${o}/><path d='M-104 130q20-44 60-48 36 4 40 48z' fill='#E2B66B' ${O}/><path d='M24 130q8-36 36-40 30 4 44 40z' fill='#D9A877' ${O}/><path d='M-60 130q0-16 10-22 10 6 10 22z' fill='#4FC3D6' ${o}/>${boat(0, 142, '#D9452B')}`);
const porto = (x) => at(x, `<rect x='-104' y='138' width='208' height='12' fill='#6FAFD0' ${o}/><path d='M-104 138q60-60 110-50t98 50z' fill='#B9C76A' ${O}/>${map([-64, -36, -8, 20, 48, 76], (d, i) => `<rect x='${d - 12}' y='${104 + (i % 3) * 6}' width='24' height='${34 - (i % 3) * 6}' fill='${['#F2C14E', '#E8735A', '#86B7D9'][i % 3]}' ${o}/>`)}<path d='M-30 78q50-30 100 0' fill='none' stroke='#3B2C24' stroke-width='3'/><path d='M-30 78v54M70 78v54' stroke='#3B2C24' stroke-width='3'/>`);

// ---- Indonesia ----
const bali = (x) => at(x, `${mtn(0, 50, 70, '#6E9F7A', false).replace('150', '150')}${map([0, 1, 2, 3, 4], (i) => `<path d='M${-90 + i * 4} ${150 - i * 10}q${90 - i * 6} -${26 - i * 2} ${188 - i * 10} 0' fill='none' stroke='#9CCF6A' stroke-width='7'/>`)}${gate(-46, 22, 60, '#B8AC92', '#6B4A2B')}${gate(-46, 32, 18, '#B8AC92', '#6B4A2B')}${palm(40, 1.1)}${palm(64, 0.85)}${palm(92, 1)}`);
const java = (x) => at(x, `${mtn(-30, 60, 100, '#6E7A8A', false)}<path d='M-48 52q18-16 36 0' fill='none' stroke='#C9C3BE' stroke-width='5' stroke-linecap='round'/><path d='M-104 150q60-16 208-4v4z' fill='#7FBF6A' ${O}/>${map([[50, 20], [62, 40], [74, 56]], ([d, h]) => `<path d='M${d - 20 + (d - 50)} ${150 - h}h${40 - (d - 50) * 2}v${h}h${-(40 - (d - 50) * 2)}z' fill='#B8AC92' ${O}/>`)}`);
const sumatra = (x) => at(x, `<rect x='-104' y='130' width='208' height='20' fill='#6FAF9A' ${o}/>${map([-86, -62, -38, 50, 74, 96], (d, i) => palm(d, 0.9 + (i % 2) * 0.2))}<path d='M-24 130h48v-18h-48z' fill='#C99A63' ${O}/><path d='M-30 112q30-22 60 0z' fill='#8A5A34' ${O}/><path d='M-18 112v-6M18 112v-6' stroke='#3B2C24' stroke-width='2'/>${boat(0, 144, '#8A5A34', 0.9)}`);

// ---- Philippines ----
const palawan = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-90 128q-6-60 20-76 28 14 16 76z' fill='#7E9C6A' ${O}/><path d='M30 128q0-40 24-44 22 6 20 44z' fill='#7E9C6A' ${O}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${boat(-10, 138, '#E8735A', 1)}${palm(86, 0.9)}`);
const manila = (x) => at(x, `${map([[-80, 56], [-54, 78], [-28, 50], [50, 70], [78, 52]], ([d, h]) => tower(d, h, 22, '#9AB0C8'))}<rect x='-20' y='108' width='64' height='42' fill='#E8DCC2' ${O}/>${map([-8, 8, 24, 40].map((d) => d), (d) => `<rect x='${d - 3}' y='116' width='6' height='12' fill='#3B5E7A'/>`)}<path d='M-24 110l36-22 36 22z' fill='#C0503A' ${O}/><path d='M-96 138q22-16 52-6' stroke='#E86A9A' stroke-width='5' fill='none'/>`);
const chocolateHills = (x) => at(x, `${map([-80, -56, -30, -4, 22, 48, 74], (d, i) => `<path d='M${d - 22} 150q22-${34 + (i % 3) * 10} 44 0z' fill='${['#A9C76A', '#9CBF5E', '#B9C76A'][i % 3]}' ${O}/>`)}${map([-60, 40], (d) => palm(d, 0.8))}${house(88, 22, 18, '#C99A63', '#8A5A34')}`);

// ---- Nigeria ----
const lagos = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#6FAF9A' ${o}/>${map([[-80, 70], [-56, 94], [-30, 60], [44, 84], [70, 62], [94, 76]], ([d, h]) => tower(d, h, 20, '#9AB0C8'))}${boat(0, 144, '#8A5A34', 1)}<path d='M-14 136q14-12 28 0z' fill='#F2C14E' ${o}/>${palm(-96, 0.8)}`);
const sahel = (x) => at(x, `${dune('#E2C080')}${map([[-50, 40, '#C99A63'], [0, 50, '#D9B07A'], [50, 36, '#C99A63']], ([d, h, c]) => `<path d='M${d - 20} 150v-${h}l20-14 20 14v${h}z' fill='${c}' ${O}/><path d='M${d - 6} 150v-18a6 6 0 0 1 12 0v18z' fill='#6B4A2B' ${o}/>`)}${palm(-90, 0.8)}${palm(94, 0.8)}`);
const niger = (x) => at(x, `<rect x='-104' y='126' width='208' height='24' fill='#8FB8A6' ${o}/>${map([-90, -66, 64, 90], (d, i) => palm(d, 1 + (i % 2) * 0.2))}<path d='M-50 138q50 10 100 0l-8 8q-42 8-84 0z' fill='#8A5A34' ${O}/>${map([-20, 0, 20], (d) => `<circle cx='${d}' cy='130' r='7' fill='${['#E8735A', '#F2C14E', '#4FB3A6'][(d + 20) / 20]}' ${o}/>`)}`);

// ---- Jamaica ----
const bluemtn = (x) => at(x, `${mtn(-30, 70, 96, '#6E8FB0', false)}${mtn(50, 60, 70, '#7FA0C0', false)}<path d='M-104 150q60-16 208-4v4z' fill='#5E9F4F' ${O}/>${map([-86, -60, 60, 88], (d, i) => palm(d, 0.9 + (i % 2) * 0.2))}${house(0, 30, 20, '#F2C14E', '#C0503A')}`);
const montegoBay = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${palm(-70, 1.1)}${palm(80, 1)}${boat(-10, 138, '#E8735A')}<path d='M50 124q10-14 22 0z' fill='#E8735A' ${o}/><path d='M61 124v18' stroke='#3B2C24' stroke-width='2'/>`);

// ---- Cuba ----
const havana = (x) => at(x, `${map([[-80, 56, '#F2C14E'], [-46, 68, '#4FB3A6'], [-12, 60, '#F4D2D9'], [22, 70, '#E8735A'], [56, 58, '#86B7D9'], [88, 64, '#F6E6A8']], ([d, h, c]) => `<rect x='${d - 17}' y='${150 - h}' width='34' height='${h}' fill='${c}' ${O}/>${map([-9, 3], (w) => `<rect x='${d + w}' y='${150 - h + 10}' width='7' height='14' fill='#3B5E7A'/>`)}<path d='M${d - 17} ${150 - h + 8}h34' stroke='#3B2C24' stroke-width='1.6'/>`)}<g transform='translate(0 150)'><path d='M-34-8h68l-6-12h-48z' fill='#D9452B' ${O}/><circle cx='-20' cy='-6' r='6' fill='#3B2C24'/><circle cx='20' cy='-6' r='6' fill='#3B2C24'/></g>`);
const vinales = (x) => at(x, `<path d='M-104 150q60-14 208-2v2z' fill='#9CCF6A' ${O}/>${map([-76, -30, 22, 74], (d, i) => `<path d='M${d - 22} 150q0-${50 + (i % 2) * 20} 22-${56 + (i % 2) * 20} 22 6 22 ${56 + (i % 2) * 20}z' fill='#6E8F6A' ${O}/>`)}${palm(-50, 0.8)}${palm(50, 0.9)}${house(0, 34, 22, '#E8C99A', '#8A5A34')}`);
const varadero = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${palm(-66, 1.1)}${palm(-40, 0.85)}${palm(82, 1)}${boat(10, 138, '#FFFFFF', 1)}`);

// ---- Australia ----
const sydney = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#4FA9D6' ${o}/>${map([0, 1, 2], (i) => `<path d='M${-50 + i * 24} 136q-2-40 ${24} -44 ${-8 + 0} 20 ${4} 44z' fill='#F6EEDF' ${O}/>`)}${map([0, 1], (i) => `<path d='M${-6 + i * 22} 136q0-30 20-34 -4 18 -4 34z' fill='#FFFFFF' ${O}/>`)}<path d='M54 136q0-60 10-70 8 10 10 70z' fill='none'/><path d='M60 136v-60M92 136v-52' stroke='#6B4A2B' stroke-width='3'/><path d='M60 78q16-18 32 6' fill='none' stroke='#3B2C24' stroke-width='3'/>`);
const outback = (x) => at(x, `${dune('#D9845A')}<path d='M-30 150q-4-50 4-56 36-6 62 0 4 6 0 56z' fill='#C7633A' ${O}/><path d='M-26 112h56M-24 128h50' stroke='#9C4A28' stroke-width='3'/>${map([[-80, 0.8], [88, 0.7]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><path d='M0 0v-40' stroke='#6B4A2B' stroke-width='5'/><path d='M0-30q-22-6-30 8M0-30q22-6 30 8M0-40q-12-14-26-10M0-40q12-14 26-10' stroke='#7FA95E' stroke-width='5' stroke-linecap='round' fill='none'/></g>`)}<g transform='translate(60 150)'><ellipse cx='0' cy='-12' rx='8' ry='11' fill='#B5683A' ${o}/><circle cx='4' cy='-26' r='5' fill='#B5683A' ${o}/><path d='M-6-2l-8 4' stroke='#B5683A' stroke-width='5'/></g>`);
const reef = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${palm(-70, 1.1)}${palm(-44, 0.85)}${palm(84, 1)}${boat(4, 138, '#E8735A')}${wave(134)}<path d='M40 144q12-10 26 0' fill='none' stroke='#E8735A' stroke-width='3'/>`);

// ---- Canada ----
const quebec = (x) => at(x, `<path d='M-104 150q10-50 60-56l60 0q36 8 44 56z' fill='#B7C6D6' ${O}/><rect x='-40' y='70' width='80' height='40' fill='#C9B79A' ${O}/>${map([-40, 0, 40].map((d) => d), (d) => `<rect x='${d - 8}' y='34' width='16' height='38' fill='#C9B79A' ${O}/><path d='M${d - 11} 36l11-22 11 22z' fill='#4F8E86' ${o}/>`)}<rect x='-104' y='140' width='208' height='10' fill='#6FAFD0' ${o}/>`);
const rockies = (x) => at(x, `${mtn(-60, 64, 100)}${mtn(10, 74, 124, '#9AAED0')}${mtn(84, 40, 76)}<rect x='-104' y='134' width='208' height='16' fill='#6FD0C0' ${o}/>${map([-90, -70, -46, 40, 66], (d, i) => pine(d, 1 + (i % 2) * 0.3, '#2F5E3A'))}`);
const prairie = (x) => at(x, `<path d='M-104 150q60-14 208-2v2z' fill='#E2C25A' ${O}/>${rows(-96, 96, 3, 126, '#C9A43E')}<rect x='24' y='72' width='26' height='78' fill='#E8E2D4' ${O}/><path d='M22 72q15-14 30 0z' fill='#B8AC92' ${O}/><rect x='54' y='90' width='20' height='60' fill='#E8E2D4' ${O}/><path d='M52 90q12-12 24 0z' fill='#B8AC92' ${O}/>${house(-60, 44, 26, '#C7463A', '#7A2E26')}`);
const maritimes = (x) => at(x, `<rect x='-104' y='132' width='208' height='18' fill='#4FA9D6' ${o}/><path d='M-104 132q40-30 90-24t88 24z' fill='#8CC56B' ${O}/>${map([-60, -20, 20], (d, i) => `<rect x='${d - 12}' y='104' width='24' height='28' fill='${['#E8735A', '#F2C14E', '#86B7D9'][i]}' ${O}/><path d='M${d - 15} 106l15-14 15 14z' fill='#5A5A66' ${o}/>`)}${boat(66, 140, '#D9452B', 1)}<path d='M54 136l-6-28' stroke='#3B2C24' stroke-width='2'/>`);

// ---- Russia ----
const onion = (x, y, r, col) => `<path d='M${x - r} ${y}C${x - r * 1.3} ${y - r * 0.9} ${x - r * 0.5} ${y - r * 1.1} ${x} ${y - r * 2}C${x + r * 0.5} ${y - r * 1.1} ${x + r * 1.3} ${y - r * 0.9} ${x + r} ${y}z' fill='${col}' ${O}/><path d='M${x - r * 0.55} ${y - r * 0.1}Q${x - r * 0.2} ${y - r * 1.1} ${x} ${y - r * 1.9}M${x + r * 0.55} ${y - r * 0.1}Q${x + r * 0.2} ${y - r * 1.1} ${x} ${y - r * 1.9}' fill='none' stroke='#FFFFFF' stroke-width='1.6' opacity='.7'/><path d='M${x} ${y - r * 2}v-5M${x - 2} ${y - r * 2 - 3}h4' stroke='#E2B33E' stroke-width='1.6'/>`;
const drum = (x, y, w, h) => `<rect x='${x - w / 2}' y='${y - h}' width='${w}' height='${h}' fill='#EFE3C8' ${O}/><path d='M${x - 2} ${y - h + 2}v${h - 4}' stroke='#8A6A4A' stroke-width='2.4'/>`;
// St Basil's-style cathedral: a broad brick base, a wide tent roof in the middle and onion domes of different sizes around it
const moscow = (x) => at(x, `<rect x='-66' y='122' width='132' height='28' fill='#B8452F' ${O}/>${map([-52, -36, -20, -4, 12, 28, 44], (d) => `<path d='M${d - 4} 150v-10q4-6 8 0v10z' fill='#EFE3C8' ${o}/>`)}<path d='M-66 122h132' stroke='#EFE3C8' stroke-width='3'/><rect x='-46' y='102' width='92' height='20' fill='#EFE3C8' ${O}/>${map([-34, -14, 6, 26], (d) => `<rect x='${d - 3}' y='108' width='6' height='10' rx='3' fill='#7E8EA8' ${o}/>`)}${map([[-54, 122, 10, '#2E8A8F'], [54, 122, 10, '#4F8E4A']], ([d, y, r, c]) => `${drum(d, y, 12, 9)}${onion(d, y - 9, r, c)}`)}${map([[-32, 102, 12, '#F2C14E'], [32, 102, 12, '#D9452B']], ([d, y, r, c]) => `${drum(d, y, 14, 10)}${onion(d, y - 10, r, c)}`)}<rect x='-12' y='80' width='24' height='22' fill='#EFE3C8' ${O}/><path d='M-14 80L0 46 14 80z' fill='#4F8E4A' ${O}/><path d='M-8 80L0 54 8 80' fill='none' stroke='#F2E6D0' stroke-width='1.6'/>${onion(0, 48, 5, '#F2C14E')}`);
const siberia = (x) => at(x, `<path d='M-104 150q60-16 208-4v4z' fill='#FFFFFF' ${O}/>${map([-90, -66, -42, -18, 40, 66, 90], (d, i) => pine(d, 1.1 + (i % 3) * 0.25, '#2F5E3A'))}${map([-90, -66, 66], (d) => `<path d='M${d - 10} 118l10-16 10 16z' fill='#FFFFFF' opacity='.9'/>`)}<rect x='-14' y='112' width='34' height='30' fill='#B07A48' ${O}/><path d='M-22 114l25-20 25 20z' fill='#FFFFFF' ${O}/><path d='M6 100q-4-12 6-18' stroke='#E8E8EE' stroke-width='3' fill='none'/>`);
const stPete = (x) => at(x, `<rect x='-104' y='138' width='208' height='12' fill='#6FAFD0' ${o}/><rect x='-80' y='88' width='160' height='50' fill='#9AD0C0' ${O}/>${map([-64, -44, -24, -4, 16, 36, 56], (d) => `<rect x='${d - 4}' y='100' width='8' height='24' fill='#FFFFFF' ${o}/>`)}<path d='M-80 88h160' stroke='#E2B33E' stroke-width='4'/>${dome(0, 88, 22, '#E2B33E')}<path d='M0 66v-12M-5 60h10' stroke='#E2B33E' stroke-width='3'/>`);

// ---- Poland ----
const krakow = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#9CBF5E' ${o}/>${tower(-40, 96, 20, '#B5452E')}<path d='M-52 54l12-22 12 22z' fill='#B5452E' ${O}/>${tower(0, 76, 18, '#B5452E')}<path d='M-11 74l11-20 11 20z' fill='#B5452E' ${O}/>${map([-86, 40, 70, 96], (d, i) => `<rect x='${d - 12}' y='${100 + (i % 2) * 10}' width='24' height='${36 - (i % 2) * 10}' fill='${['#F2C14E', '#F4D2D9', '#86B7D9', '#E8DCC2'][i]}' ${o}/>`)}`);
const tatras = (x) => at(x, `${mtn(-50, 60, 100)}${mtn(14, 70, 120, '#9AAED0')}${mtn(84, 40, 70)}${map([-88, -66, 56, 92], (d, i) => pine(d, 1 + (i % 2) * 0.2, '#2F5E3A'))}<rect x='-20' y='118' width='44' height='30' fill='#B07A48' ${O}/><path d='M-28 120l30-26 30 26z' fill='#7A4A2A' ${O}/>`);
const baltic = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#6FAFD0' ${o}/><path d='M-104 150q50-12 110-6t98 6z' fill='#F6E6BF' ${O}/>${map([-70, -40, 50, 80], (d, i) => pine(d, 1 + (i % 2) * 0.25, '#3F6E3A'))}${boat(0, 142, '#E8735A', 0.9)}<rect x='-14' y='112' width='20' height='24' fill='#E8E2D4' ${o}/>`);

// ---- Sweden ----
const stockholm = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#6FAFD0' ${o}/>${map([-70, -34, 4, 40, 76], (d, i) => `<rect x='${d - 16}' y='${96 - (i % 2) * 8}' width='32' height='${40 + (i % 2) * 8}' fill='${['#E8735A', '#F2C14E', '#E8C99A', '#C9B79A', '#E2A57A'][i]}' ${O}/><path d='M${d - 19} ${98 - (i % 2) * 8}l19-14 19 14z' fill='#5A6E7A' ${o}/>`)}${boat(0, 144, '#2F6DB5', 0.9)}`);
const dalarna = (x) => at(x, `${hill(-104, 110, 74, '#8CC56B')}${map([[-40, 38], [30, 44]], ([d, w]) => `<rect x='${d - w / 2}' y='116' width='${w}' height='30' fill='#B5452E' ${O}/><path d='M${d - w / 2 - 4} 118l${w / 2 + 4} -22 ${w / 2 + 4} 22z' fill='#3B3B46' ${o}/><rect x='${d - 4}' y='128' width='8' height='18' fill='#FFFFFF' ${o}/><path d='M${d - w / 2} 116v30M${d + w / 2} 116v30' stroke='#FFFFFF' stroke-width='3'/>`)}${map([-90, -70, 70, 92], (d) => pine(d, 1, '#2F5E3A'))}`);
const lapland = (x) => at(x, `<path d='M-104 150q60-16 208-4v4z' fill='#FFFFFF' ${O}/>${map([-86, -62, 70, 92], (d, i) => pine(d, 1 + (i % 2) * 0.25, '#2F5E3A'))}<path d='M-104 54q60-26 110-6t98 0' fill='none' stroke='#7FE0A0' stroke-width='10' opacity='.55'/><path d='M-104 66q60-26 110-6t98 0' fill='none' stroke='#B58AE0' stroke-width='7' opacity='.5'/><path d='M-24 150l24-30 24 30z' fill='#E8735A' ${O}/><path d='M-8 150l8-12 8 12z' fill='#FFE08A' ${o}/>`);

// ---- Israel ----
const jerusalem = (x) => at(x, `${hill(-104, 110, 80, '#E8D9B0')}<rect x='-70' y='100' width='140' height='38' fill='#E8D9B0' ${O}/>${dome(-6, 100, 26, '#E2B33E')}<rect x='-30' y='100' width='48' height='38' fill='#4F7EB0' ${O}/>${tower(60, 60, 14, '#E8D9B0')}<path d='M53 90l7-14 7 14z' fill='#C9B79A' ${o}/>${map([-56, 40, 52].map((d) => d), (d) => `<path d='M${d - 4} 138v-10a4 4 0 0 1 8 0v10z' fill='#8C6A4E'/>`)}`);
const telAviv = (x) => at(x, `<rect x='-104' y='132' width='208' height='18' fill='#4FA9D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${map([[-70, 76], [-40, 100], [-10, 66], [24, 90], [58, 70], [86, 56]], ([d, h]) => tower(d, h, 20, '#E8EEF4').replace(/150/g, '134'))}${wave(138)}`);
const negev = (x) => at(x, `${dune('#E2B66B')}${map([[-60, 70], [0, 94], [60, 62]], ([d, h]) => `<path d='M${d - 40} 150l12-${h * 0.6} 18-${h * 0.4} 18 ${h * 0.2} 14 ${h * 0.8}z' fill='#C99A63' ${O}/>`)}<g transform='translate(88 150) scale(0.8)'><ellipse cx='0' cy='-14' rx='13' ry='8' fill='#C99A63' ${o}/><path d='M12-18q6-8 10-18' stroke='#C99A63' stroke-width='5' stroke-linecap='round' fill='none'/><path d='M-8-8v10M8-8v10' stroke='#3B2C24' stroke-width='3'/></g>`);

// ---- Iran ----
const isfahan = (x) => at(x, `<rect x='-60' y='116' width='120' height='34' fill='#E8D9B0' ${O}/>${dome(0, 116, 36, '#2E8A8F')}${map([-50, 50], (d) => `<rect x='${d - 5}' y='60' width='10' height='56' fill='#E8D9B0' ${O}/><path d='M${d - 7} 62q7-14 14 0z' fill='#2E8A8F' ${o}/>`)}${map([0, 1, 2], (i) => `<path d='M${-22 + i * 22} 116v-24' stroke='#E8F2F0' stroke-width='3'/>`)}${map([-30, 0, 30], (d) => `<path d='M${d - 6} 150v-14a6 6 0 0 1 12 0v14z' fill='#2F6DB5' ${o}/>`)}`);
const persepolis = (x) => at(x, `${dune('#D9C98A')}<rect x='-80' y='128' width='160' height='12' fill='#C9B79A' ${O}/>${map([-62, -34, -6, 22, 50, 78], (d, i) => `<rect x='${d - 5}' y='${60 + (i % 2) * 22}' width='10' height='${68 - (i % 2) * 22}' fill='#E2D5B8' ${O}/><path d='M${d - 8} ${62 + (i % 2) * 22}h16' stroke='#3B2C24' stroke-width='3'/>`)}${mtn(-90, 30, 40, '#B8AC92', false)}`);
const caspian = (x) => at(x, `<rect x='-104' y='130' width='208' height='20' fill='#4F9AB0' ${o}/>${mtn(-40, 70, 96, '#6E9F7A', false)}${mtn(40, 60, 76, '#5E8F6A', false)}${map([-90, -70, 70, 92], (d, i) => pine(d, 1 + (i % 2) * 0.2, '#2F5E3A'))}${map([-30, -16, -2, 12, 26].map((d) => d), (d, i) => `<path d='M${d} 128v-${8 + (i % 2) * 4}' stroke='#7FBF6A' stroke-width='3'/>`)}`);

// ---- South Africa ----
const capeTown = (x) => at(x, `<rect x='-104' y='136' width='208' height='14' fill='#4FA9D6' ${o}/><path d='M-60 136q0-60 4-70h112q4 10 4 70z' fill='#8E9AB0' ${O}/><path d='M-52 80q60-10 112 0' fill='none' stroke='#FFFFFF' stroke-width='8' opacity='.85' stroke-linecap='round'/>${map([-86, 76, 92], (d) => `<rect x='${d - 8}' y='116' width='16' height='20' fill='#F6E6D2' ${o}/>`)}${boat(0, 144, '#D9452B', 0.9)}`);
const safari = (x) => at(x, `${dune('#E8C070')}<g transform='translate(-50 150)'><path d='M0 0q-6-30 0-52M0-52q-26-6-34 8M0-52q26-6 34 8' stroke='#6B4A2B' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M-34-44q34-24 68 0-18 6-34 4t-34-4z' fill='#6E8F3E' ${O}/></g><g transform='translate(34 150) scale(1.2)'><ellipse cx='0' cy='-18' rx='18' ry='12' fill='#9AA0A8' ${O}/><circle cx='20' cy='-22' r='8' fill='#9AA0A8' ${O}/><path d='M26-20q8 8 4 16' stroke='#9AA0A8' stroke-width='4' fill='none'/><path d='M-10-6v10M8-6v10' stroke='#3B2C24' stroke-width='4'/></g>`);
const winelands = (x) => at(x, `${mtn(-30, 70, 90, '#8E7A9A', false)}<path d='M-104 150q60-30 208-8v8z' fill='#9CBF5E' ${O}/>${rows(-90, 90, 4, 100, '#5E7F34')}<rect x='30' y='104' width='46' height='30' fill='#FFFFFF' ${O}/><path d='M24 106q29-22 58 0z' fill='#FFFFFF' ${O}/>`);

// ---- Colombia ----
const cartagena = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#4FC3D6' ${o}/>${map([[-80, 50, '#F2C14E'], [-46, 62, '#E8735A'], [-12, 54, '#86B7D9'], [22, 66, '#F4D2D9'], [56, 52, '#4FB3A6'], [90, 60, '#F2C14E']], ([d, h, c]) => `<rect x='${d - 16}' y='${134 - h}' width='32' height='${h}' fill='${c}' ${O}/><rect x='${d - 4}' y='${134 - h + 10}' width='8' height='12' fill='#3B5E7A'/><rect x='${d - 12}' y='${134 - h * 0.35}' width='24' height='4' fill='#6B4A2B'/>`)}${palm(-96, 0.8)}`);
const coffeeAxis = (x) => at(x, `${map([0, 1, 2, 3], (i) => `<path d='M-104 ${150 - i * 12}q60-${30 + i * 4} 208 ${-6 + i * 3}v${12}h-208z' fill='${['#7FBF6A', '#6FAF5A', '#5E9F4F', '#4F8F44'][i]}' ${O}/>`)}${map([-70, -40, -10, 20, 50, 80], (d, i) => `<g transform='translate(${d} ${132 - (i % 3) * 8})'><circle cx='0' cy='-6' r='8' fill='#3F7E3A' ${o}/><circle cx='-3' cy='-8' r='2' fill='#D9311F'/><circle cx='3' cy='-4' r='2' fill='#D9311F'/></g>`)}${house(60, 38, 24, '#F2E2C4', '#B5452E')}${palm(-92, 0.9)}`);
const medellin = (x) => at(x, `${hill(-104, 110, 70, '#7FA95E')}${map([-76, -52, -28, -4, 20, 44, 68, 92], (d, i) => `<rect x='${d - 10}' y='${100 + (i % 3) * 8}' width='20' height='${50 - (i % 3) * 8}' fill='${['#E8735A', '#F2C14E', '#E8DCC2'][i % 3]}' ${o}/>`)}<path d='M-40 56l60 24M20 80l60-12' stroke='#3B2C24' stroke-width='2'/><rect x='-6' y='64' width='14' height='10' fill='#E2523B' ${o}/>`);

// ---- Egypt ----
const nile = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#6FAF9A' ${o}/>${map([-86, -66, 74, 94], (d, i) => palm(d, 1 + (i % 2) * 0.2))}<path d='M-14 134q22 8 44 0l-4 6q-18 6-36 0z' fill='#8A5A34' ${O}/><path d='M0 134v-30l20 26z' fill='#FFFFFF' ${O}/><path d='M-4 104v30' stroke='#3B2C24' stroke-width='2'/>${dune('#E8C070').replace('q50-34 100-14t108-18v32z', 'q50-20 100-8t108-10v18z')}`);
const cairo = (x) => at(x, `${map([-80, -56, 58, 84], (d, i) => tower(d, 60 + (i % 2) * 20, 18, '#E8D9B0'))}${map([-30, 0, 30], (d) => `<rect x='${d - 4}' y='34' width='8' height='70' fill='#F2E6D0' ${O}/><path d='M${d - 6} 36l6-16 6 16z' fill='#2E8A8F' ${o}/>`)}<rect x='-44' y='100' width='88' height='50' fill='#E8D9B0' ${O}/>${dome(0, 100, 24, '#C7944A')}`);
const alex = (x) => at(x, `<rect x='-104' y='132' width='208' height='18' fill='#4FA9D6' ${o}/><path d='M-104 132h208v-8q-104-12-208 0z' fill='#E8D9B0' ${O}/>${map([-70, -40, -10, 20, 50, 80], (d, i) => `<rect x='${d - 12}' y='${96 + (i % 2) * 6}' width='24' height='${36 - (i % 2) * 6}' fill='${['#F6E6D2', '#F2C14E', '#E8DCC2'][i % 3]}' ${o}/>`)}<path d='M-6 124l6-62 6 62z' fill='#F6EEDF' ${O}/><circle cx='0' cy='56' r='5' fill='#FFE08A' ${o}/>${boat(70, 142, '#2F6DB5', 0.9)}`);

// ---- the same places as whole views in perspective (lib/art/vista.js) ----
const farHills = (c, H, col = '#8FB07A', t = 0.5, amp = 12) => hills(c, [[-20, H - amp * 0.4], [70, H - amp], [160, H - amp * 0.3], [250, H - amp * 1.1], [330, H - amp * 0.5], [420, H - amp]], col, t, false, H + 4);
const flat = (c, y = 128, col) => land(c, [[-20, y + 2], [120, y - 2], [260, y + 1], [420, y - 2]], col || grass(c));
const street = (c, H, col = '#C4B79C', w = 120) => ribbon([[200, 214, w * 2], [204, 166, w], [210, 140, w * 0.45], [214, H + 4, w * 0.12]], col, false);
const sideRows = (H, f, nL = 6, nR = 6, sL = 1, sR = 1) => `${line([40, 152], [176, H + 6], nL, sL, 0.25, f)}${line([360, 152], [242, H + 6], nR, sR, 0.25, f)}`;
const facade = (cols, h = 44, w = 30, roof) => (x, y, s, i) => tx(x, y, s, `${vblock(x, y, w, h + (i % 3) * 6, cols[i % cols.length])}${roof ? `<path d='M${x - w / 2 - 2} ${y - h - (i % 3) * 6}h${w + 4}l-3-6h-${w - 2}z' fill='${roof}' ${o}/>` : ''}`);
const karst = (c, x, y, s, t, col = '#4F8A5B') => tx(x, y, s, `<path d='M${x - 18} ${y}q-6-50 8-64 14-6 18 10 8 30 6 54z' fill='${hz(c, col, t)}' ${t < 0.2 ? O : ''}/>`);
const palmsAlong = (p0, p1, n, s0 = 1, s1 = 0.35) => line(p0, p1, n, s0, s1, (x, y, s) => vpalm(x, y, s * 0.85));

// Korea
const seoulV = V((c) => { const H = 120;
  return `${skyline(c, -10, 420, H, { hmax: 44, seed: 3 })}${hills(c, [[60, H], [110, 74], [170, 70], [230, H]], '#6F9C5E', 0.15, true, H + 4)}<path d='M140 72V30' stroke='${INK}' stroke-width='3'/><rect x='134' y='38' width='12' height='10' rx='2' fill='#E8E8F0' ${o}/><path d='M140 30v-10' stroke='${INK}' stroke-width='1.6'/>
${water(c, H + 4, 200, '#5E9CC8')}<path d='M-20 150q140-8 260-6t180-4v60H-20z' fill='#9DB56A' ${O}/>${line([-20, 132], [420, 128], 1, 1, 1, () => '')}<path d='M-20 134L420 126' stroke='#8A94A2' stroke-width='5'/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d='M${10 + i * 60} 134v10' stroke='#8A94A2' stroke-width='4'/>`).join('')}${vboat(250, 146, 0.7, '#2F6DB5')}`; });
const busanV = V((c) => { const H = 116;
  return `${skyline(c, 220, 420, H, { hmin: 30, hmax: 70, seed: 9, col: '#B7C6D6', t: 0.3 })}${water(c, H, 200, '#3FA0D0')}
${hills(c, [[-20, 62], [60, 64], [120, 84], [170, 126], [190, 160], [190, 200]], '#7FA866', 0, true)}${line([20, 76], [150, 128], 10, 0.8, 0.45, (x, y, s, i) => tx(x, y, s, vblock(x, y, 20, 16, ['#F2C14E', '#86B7D9', '#E86A9A', '#9CC86A', '#F6E6A8'][i % 5])), 0.9)}
${frontShore(c, '#F6E6BF', 146)}${foam(260, 150, 90)}${line([230, 146], [380, 132], 4, 1, 0.5, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}v-24' stroke='#8A5A34' stroke-width='2'/><path d='M${x - 16} ${y - 22}q16-12 32 0z' fill='#E8735A' ${o}/>`))}`; });
const jejuV = V((c) => { const H = 118;
  return `<path d='M100 ${H}Q200 40 320 ${H}z' fill='${hz(c, '#6E7F6A', 0.45)}'/><path d='M180 64q20-8 40 0' stroke='${hz(c, '#FFFFFF', 0.3)}' stroke-width='5' fill='none'/>
${flat(c, H + 2, '#7FB569')}${[-160, -60, 40, 140, 240, 340, 440].map((x0) => line([x0, 166], [lerp(x0, 210, 0.9), H + 6], 6, 1, 0.25, (x, y, s) => vtree(x, y, s * 0.9, '#3F8C3A') + tx(x, y, s, `<circle cx='${x - 4}' cy='${y - 26}' r='2.6' fill='#F28C28'/><circle cx='${x + 5}' cy='${y - 22}' r='2.6' fill='#F28C28'/><circle cx='${x + 1}' cy='${y - 32}' r='2.6' fill='#F28C28'/>`))).join('')}
<path d='M-20 160q120-14 220-12' fill='none' stroke='#5A5A5A' stroke-width='6' stroke-dasharray='8 3'/>`; });
const hanokV = V((c) => { const H = 116;
  const hk = (x, y, s, i) => tx(x, y, s, `<rect x='${x - 26}' y='${y - 24}' width='52' height='24' fill='#F2E2C4' ${O}/><path d='M${x - 22} ${y - 24}v24M${x + 22} ${y - 24}v24' stroke='#8A5A3A' stroke-width='3'/><path d='M${x - 36} ${y - 22}q36-16 72 0l-6-10q-30-10-60 0z' fill='#4A4A52' ${O}/>`);
  return `${range(c, H + 2, [[80, 52, 90], [240, 70, 110], [380, 48, 80]], '#7FA07A', 0.5, { snow: false })}${skyline(c, 120, 300, H + 1, { hmin: 8, hmax: 26, col: '#B7C6D6', t: 0.5 })}
${flat(c, H + 2, '#D8CCB4')}${street(c, H, '#BFB49C', 90)}${sideRows(H, hk, 6, 6, 1.1, 1.1)}`; });
// Vietnam
const hanoiV = V((c) => { const H = 118;
  return `${skyline(c, -10, 420, H, { hmin: 8, hmax: 26, col: '#B7C6D6', t: 0.45 })}${line([60, H + 2], [380, H + 2], 9, 0.5, 0.5, (x, y, s) => vtree(x, y, s, hz(c, '#4F8A44', 0.35), false), 1)}${water(c, H + 4, 200, '#6FAF9A')}
${tx(320, 134, 0.7, `<rect x='300' y='112' width='40' height='22' fill='#E8DCC2' ${o}/><path d='M296 112l24-14 24 14z' fill='#C0503A' ${o}/><rect x='310' y='98' width='20' height='8' fill='#E8DCC2' ${o}/>`)}
<path d='M-20 172C60 160 120 156 170 146S250 134 290 130' fill='none' stroke='${INK}' stroke-width='9' stroke-linecap='round'/><path d='M-20 172C60 160 120 156 170 146S250 134 290 130' fill='none' stroke='#D9452B' stroke-width='6' stroke-linecap='round'/>${line([10, 168], [270, 132], 9, 1, 0.4, (x, y, s) => `<path d='M${x} ${y}v-${10 * s}' stroke='#8E2A1A' stroke-width='${2 * s}'/>`)}
${land(c, [[-20, 154], [60, 150], [120, 160], [120, 200]])}${vtree(30, 156, 1.2, '#5E9C4F')}`; });
const hoianV = V((c) => { const H = 118;
  const shop = (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 32, 40, ['#F2C14E', '#F6E6A8', '#E9C94E'][i % 3])}<path d='M${x - 19} ${y - 40}h38l-4-8h-30z' fill='#9C5A3A' ${O}/><ellipse cx='${x - 8}' cy='${y - 18}' rx='5' ry='6' fill='${['#E74C3C', '#F28C28', '#E86A9A'][i % 3]}' ${o}/><ellipse cx='${x + 8}' cy='${y - 18}' rx='5' ry='6' fill='${['#F28C28', '#E86A9A', '#E74C3C'][i % 3]}' ${o}/>`);
  return `${flat(c, H, '#D8CCB4')}${ribbon([[300, 214, 300], [290, 166, 160], [260, 138, 70], [236, H + 2, 16]], '#8FB8A6', false)}
${line([20, 160], [200, H + 4], 7, 1.15, 0.25, shop)}${line([240, 160], [330, 148], 3, 0.9, 0.6, (x, y, s, i) => tx(x, y, s, `<path d='M${x - 22} ${y}q22 8 44 0l-4-6h-36z' fill='#7A4A2A' ${o}/><circle cx='${x}' cy='${y - 8}' r='4' fill='${['#E74C3C', '#F28C28', '#F2C14E'][i % 3]}' opacity='.9'/>`))}`; });
const mekongV = V((c) => { const H = 118;
  const stilt = (x, y, s) => tx(x, y, s, `<path d='M${x - 16} ${y}v-14M${x + 16} ${y}v-14M${x} ${y}v-14' stroke='#6B4A2B' stroke-width='3'/><rect x='${x - 20}' y='${y - 32}' width='40' height='18' fill='#C99A63' ${O}/><path d='M${x - 26} ${y - 30}l26-14 26 14z' fill='#8A7A4A' ${O}/>`);
  return `${palmsAlong([420, H + 2], [160, H + 1], 8, 0.55, 0.3)}${water(c, H + 2, 200, '#B9935E')}${line([20, 150], [150, H + 6], 5, 1.1, 0.3, stilt)}${palmsAlong([10, 164], [130, H + 4], 4, 1.1, 0.4)}
${line([220, 162], [320, 130], 4, 1.1, 0.35, (x, y, s) => tx(x, y, s, `<path d='M${x - 26} ${y}q26 8 52 0l-4-6h-44z' fill='#5A3A22' ${o}/><path d='M${x - 6} ${y - 6}q6-12 12 0' fill='#E8C9A0' ${o}/>`))}${frontShore(c, '#9DB56A', 156)}`; });
const sapaV = V((c) => { const H = 112;
  return `${range(c, H, [[60, 70, 100], [220, 86, 110], [380, 70, 90]], '#7F9C8A', 0.5, { snow: false })}${fog([[150, H - 4, 120, 7], [330, H - 10, 80, 6]])}${terraces(c, 168, H + 4, 7, ['#9CCF6A', '#7FBF6A', '#B6D97A', '#8CC86A'], 34)}
${tx(90, 132, 1, `<rect x='70' y='116' width='40' height='18' fill='#C99A63' ${O}/><path d='M62 118l28-16 28 16z' fill='#6B5A3A' ${O}/>`)}`; });
// Turkey
const istanbulV = V((c) => { const H = 118;
  return `${hills(c, [[160, H], [260, H - 10], [340, H - 6], [420, H - 14]], '#9AAA90', 0.5, false, H + 2)}${skyline(c, 170, 420, H, { hmin: 6, hmax: 18, col: '#E9E2D4', t: 0.45 })}${water(c, H, 200, '#3E8FB8')}
${hills(c, [[-20, 112], [60, 106], [150, 112], [210, 150], [220, 200]], '#C9B488', 0, true)}${tx(100, 110, 1, `${dome(100, 104, 30, '#9AB0C8')}${dome(70, 108, 14, '#9AB0C8')}${dome(130, 108, 14, '#9AB0C8')}<rect x='56' y='104' width='88' height='12' fill='#E8DCC2' ${O}/>${minaret(44, 116, 70, '#E8DCC2', '#9AB0C8', 6)}${minaret(156, 116, 70, '#E8DCC2', '#9AB0C8', 6)}${minaret(30, 118, 56, '#E8DCC2', '#9AB0C8', 5)}${minaret(170, 118, 56, '#E8DCC2', '#9AB0C8', 5)}<path d='M100 74v-10' stroke='#C9A04B' stroke-width='2.4'/>`)}
${tx(270, 150, 1, `<path d='M230 150h80l-8 8h-64z' fill='#FFFFFF' ${O}/><rect x='244' y='140' width='48' height='10' fill='#E8DCC2' ${o}/><path d='M268 140v-8' stroke='${INK}' stroke-width='2'/>`)}${foam(270, 160, 40)}${frontShore(c, '#B8A688', 156)}${birds([[230, 70], [246, 62, 0.8]])}`; });
const cappadociaV = V((c) => { const H = 122;
  const chim = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 12} ${y}q-4-36 6-56h12q10 20 6 56z' fill='${hz(c, '#E2C08E', t)}' ${t < 0.2 ? O : ''}/><path d='M${x - 14} ${y - 54}q14-18 28 0z' fill='${hz(c, '#9C7A5A', t)}' ${t < 0.2 ? O : ''}/>${t < 0.2 ? `<rect x='${x - 3}' y='${y - 30}' width='6' height='8' rx='3' fill='#6B4A2B'/>` : ''}`);
  return `${hills(c, [[-20, H - 6], [100, H - 16], [240, H - 4], [420, H - 14]], '#D9B98A', 0.5, false, H + 4)}${line([360, H + 6], [220, H + 4], 6, 0.6, 0.3, (x, y, s, i, t) => chim(x, y, s, 0.35 + t * 0.2))}
${flat(c, H + 8, '#E2C9A0')}${line([30, 162], [180, H + 10], 6, 1.15, 0.4, (x, y, s, i, t) => chim(x, y, s, t * 0.3))}
${balloon(150, 46, 1, '#E8735A')}${balloon(250, 30, 0.6, '#F2C14E', 0.25, c)}${balloon(320, 66, 0.45, '#4FC3D6', 0.35, c)}${balloon(90, 22, 0.5, '#E86A9A', 0.3, c)}${balloon(380, 40, 0.35, '#9CC86A', 0.45, c)}`; });
const aegeanTRV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3FA8D0')}${hills(c, [[260, H], [330, H - 14], [420, H - 6]], '#9AAA90', 0.5, false, H + 2)}
${hills(c, [[-20, 92], [60, 96], [140, 112], [200, 148], [210, 200]], '#C9B488', 0, true)}${ribbon([[10, 100, 8], [70, 108, 10], [120, 124, 12], [165, 150, 14], [190, 190, 22]], '#EADFC4', false)}${[[22, 0.7], [50, 0.75], [84, 0.85], [110, 0.9], [138, 1], [156, 1.05]].map(([x, s]) => { const P = [[-20, 92], [60, 96], [140, 112], [200, 148]]; let y = 92; for (let k = 0; k < 3; k++) { if (x >= P[k][0] && x <= P[k + 1][0]) y = P[k][1] + (P[k + 1][1] - P[k][1]) * (x - P[k][0]) / (P[k + 1][0] - P[k][0]); } y += 10 * s; return tx(x, y, s, `${vblock(x, y, 26, 24, '#FFFFFF')}<rect x='${x - 4}' y='${y - 12}' width='8' height='12' fill='#2F6DB5' ${o}/>`); }).join('')}${line([360, 120], [240, 136], 4, 0.5, 0.9, (x, y, s) => vboat(x, y, s, '#FFFFFF'), 1)}${frontShore(c, '#E8E2D4', 154)}`; });
const anatoliaV = V((c) => { const H = 118;
  return `${range(c, H, [[300, 92, 100]], '#A8A0B0', 0.4, { snow: true, cap: 60 })}${farHills(c, H, '#C9B07A', 0.45, 8)}${flat(c, H + 4, '#C9C06A')}
${ribbon([[220, 210, 50], [200, 170, 26], [230, 144, 12], [262, H + 6, 4]], '#D9C9A0', false)}${line([60, 156], [170, H + 10], 6, 1, 0.3, (x, y, s) => sheep(x, y, s))}
${tx(90, 136, 1, `${vhouse(80, 136, 34, 22, '#E8DCC2', '#B5452E')}${vhouse(124, 134, 28, 18, '#F2E6D0', '#B5452E')}`)}`; });
// Lebanon
const cedarsV = V((c) => { const H = 116;
  const cedar = (x, y, s, t) => tx(x, y, s, `<path d='M${x} ${y}v-18' stroke='#6B4A2B' stroke-width='5'/>${[0, 1, 2].map((k) => `<path d='M${x - 34 + k * 8} ${y - 14 - k * 16}q${34 - k * 8} -12 ${68 - k * 16} 0q-${34 - k * 8} 6 -${68 - k * 16} 0z' fill='${hz(c, '#3F6E3A', t)}' ${t < 0.2 ? O : ''}/>`).join('')}`);
  return `${range(c, H, [[120, 90, 120], [320, 74, 110]], '#B7C4D8', 0.35, { snow: true, cap: 60 })}${flat(c, H + 6, '#9CB06A')}${line([360, 150], [250, H + 8], 5, 0.9, 0.3, (x, y, s, i, t) => cedar(x, y, s, t * 0.4))}${cedar(90, 156, 1.3, 0)}${cedar(186, 146, 0.8, 0.05)}`; });
const beirutV = V((c) => { const H = 116;
  return `${range(c, H, [[300, 50, 140]], '#9AAA90', 0.5, { snow: true, cap: 40 })}${skyline(c, 140, 420, H, { hmin: 20, hmax: 60, seed: 4, col: '#E9E2D4', t: 0.3 })}${water(c, H, 200, '#3E8FCF')}
${tx(90, 150, 1, `<path d='M50 152q-4-50 20-60 20 6 22 60z' fill='#C9B488' ${O}/><path d='M96 152q2-30 16-36 14 6 14 36z' fill='#C9B488' ${O}/><path d='M66 152q6-20 14-20t8 20' fill='#3E8FCF'/>`)}${foam(90, 154, 50)}
<path d='M180 150q120-8 260-10v60H180z' fill='#E8DCC2' ${O}/>${line([200, 150], [400, 140], 6, 1, 0.6, (x, y, s) => vpalm(x, y, s * 0.6))}`; });
const bekaaV = V((c) => { const H = 116;
  return `${range(c, H, [[60, 50, 110], [300, 60, 130]], '#A9A0A0', 0.5, { snow: true, cap: 40 })}${tx(320, H + 2, 0.5, [0, 1, 2, 3, 4, 5].map((i) => `<rect x='${300 + i * 12}' y='${H - 46}' width='6' height='48' fill='#E8D9B0' ${o}/>`).join('') + `<rect x='296' y='${H - 52}' width='76' height='6' fill='#E8D9B0' ${o}/>`)}
${flat(c, H + 4, '#9CBF5E')}${vrows(c, 210, H - 6, H + 4, [-260, -170, -80, 10, 100, 190, 280, 370, 460, 550], '#5E7F34', 5)}`; });
// Brazil
const bahiaV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3FA8C8')}${hills(c, [[-20, 70], [80, 74], [170, 100], [230, 140], [240, 200]], '#7FA866', 0, true)}${line([10, 86], [200, 136], 9, 0.85, 1, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 24, 26, ['#F2C14E', '#4FB3A6', '#E86A9A', '#86B7D9', '#E8735A'][i % 5])}<path d='M${x - 13} ${y - 26}h26l-3-5h-20z' fill='#C0503A' ${o}/>`), 1)}
${tx(70, 84, 1, `<rect x='58' y='54' width='24' height='30' fill='#FFFFFF' ${O}/>${minaret(54, 84, 46, '#FFFFFF', '#C9A04B', 8)}${minaret(86, 84, 46, '#FFFFFF', '#C9A04B', 8)}`)}${frontShore(c, '#F2DFA6', 152)}${palmsAlong([300, 150], [400, 136], 3, 0.9, 0.6)}`; });
const amazonV = V((c) => { const H = 116;
  const canopy = (y, col, t, ink) => `<path d='${sil(Array.from({ length: 23 }, (_, i) => [-20 + i * 20, y - 6 - (i * 37 % 11)]), 200)}' fill='${hz(c, col, t)}' ${ink ? O : ''}/>`;
  return `${canopy(H - 4, '#3F7F4A', 0.5)}${canopy(H + 6, '#4F8F4A', 0.3)}${ribbon([[150, 214, 280], [190, 170, 150], [250, 140, 60], [280, H + 8, 14]], '#B9935E', false)}
${hills(c, [[-20, 132], [30, 118], [80, 126], [120, 150], [130, 200]], '#3F7F3A', 0, true)}${hills(c, [[300, 200], [320, 140], [360, 124], [420, 128]], '#4F8F44', 0, true)}${vtree(20, 150, 1.4, '#3F8C3A')}${vtree(70, 146, 1.1, '#4F9A44')}${vtree(380, 150, 1.2, '#3F8C3A')}
${tx(210, 166, 1.1, `<path d='M180 166q30 8 60 0l-4-6h-52z' fill='#7A4A2A' ${o}/><path d='M200 160v-10h20v10' fill='#E0A93B' ${o}/>`)}`; });
const saoPauloV = V((c) => { const H = 122;
  return `${skyline(c, -10, 420, H, { hmin: 30, hmax: 80, seed: 6, t: 0.55, col: '#A9B8C8', gap: 1 })}${skyline(c, -10, 420, H + 8, { hmin: 30, hmax: 70, seed: 11, t: 0.3, col: '#9AB0C8', gap: 3 })}
${flat(c, H + 10, '#8C8C98')}${street(c, H + 6, '#6E6E7A', 110)}${sideRows(H + 6, (x, y, s, i) => tx(x, y, s, vblock(x, y, 34, 90 + (i % 3) * 14, ['#B7C6D6', '#C9D4E0', '#9AA5B4'][i % 3])), 5, 5)}`; });
const gauchoV = V((c) => { const H = 120;
  return `${farHills(c, H, '#A9C07A', 0.5, 4)}${flat(c, H + 2, '#B9C76A')}${ribbon([[300, 210, 60], [270, 166, 30], [250, 140, 12], [242, H + 4, 3]], '#D9C9A0', false)}
${line([20, 168], [222, H + 6], 9, 1, 0.25, (x, y, s) => `<path d='M${x} ${y}v-${18 * s}' stroke='#7A4A2A' stroke-width='${3 * s}'/>`)}<path d='M20 154L222 ${H + 2}M20 160L222 ${H + 4}' stroke='#7A4A2A' stroke-width='1.2'/>
${line([300, 150], [390, 128], 4, 1, 0.4, (x, y, s) => vcow(x, y, s, '#8A5A3A'))}${tx(110, 140, 1, vhouse(110, 140, 46, 24, '#F6E6D2', '#B5452E'))}${vtree(160, 140, 1, '#5E9C4F')}`; });
// Peru
const machuPicchuV = V((c) => { const H = 126;
  return `${range(c, H, [[60, 80, 90], [360, 70, 90]], '#7F9C8A', 0.5, { snow: false })}<path d='M220 ${H}q10-80 40-96 14-4 22 10 18 40 30 86z' fill='${hz(c, '#4F7F4A', 0.15)}' ${O}/><path d='M250 40q10 30 6 60' fill='none' stroke='#3F6E3A' stroke-width='2'/>
${fog([[120, H - 20, 90, 7]])}${terraces(c, 168, H, 6, ['#8FBE6A', '#7FB05A', '#9CC86A'], 18)}
${tx(140, 140, 1, `${[0, 1, 2, 3].map((i) => `<rect x='${80 + i * 34}' y='${118 - (i % 2) * 6}' width='28' height='20' fill='#C9BFA9' ${O}/><path d='M${76 + i * 34} ${120 - (i % 2) * 6}l18-12 18 12z' fill='#8A7A4A' ${o}/>`).join('')}`)}${llama(320, 158, 1)}`; });
const andesV = V((c) => { const H = 124;
  return `${range(c, H - 4, [[60, 76, 70], [190, 96, 90], [320, 84, 80], [420, 70, 70]], '#B7C4D8', 0.45)}${range(c, H, [[-10, 64, 80], [120, 84, 90], [260, 72, 90], [380, 60, 70]], '#8E7AA0', 0.15, { ink: true, cap: 60 })}
${land(c, [[-20, 140], [100, 132], [250, 136], [420, 130]], '#B9C76A')}${ribbon([[260, 210, 60], [230, 168, 26], [250, 146, 10], [270, 136, 3]], '#D9C9A0', false)}${llama(70, 156, 1.1)}${llama(110, 150, 0.8, '#C99A63')}${llama(310, 146, 0.6)}`; });
// Morocco
const marrakechV = V((c) => { const H = 118;
  return `${range(c, H - 2, [[80, 46, 110], [260, 56, 130], [400, 44, 90]], '#C9B4C8', 0.5, { snow: true, cap: 40 })}${flat(c, H, '#E3B98E')}
${[0, 1, 2].map((r) => { const t = [0.8, 0.5, 0.15][r]; return skyline(c, -10, 420, lerp(150, H + 4, t), { hmin: 8, hmax: 14, col: '#D9845A', t: t * 0.4, seed: 3 + r, wmin: 14 + (1 - t) * 10, gap: 3 }); }).join('')}
${palmsAlong([20, 160], [70, 140], 2, 1.1, 0.8)}${tx(150, 150, 1, `<rect x='134' y='50' width='32' height='100' fill='#D9845A' ${O}/><path d='M130 50h40M134 38h32l-3 12h-26z' fill='#C9744A' ${O}/><rect x='142' y='22' width='16' height='16' fill='#D9845A' ${O}/><path d='M150 22v-10' stroke='#C9A04B' stroke-width='3'/><path d='M140 70h20M140 92h20' stroke='#2E8A6A' stroke-width='3'/>`)}`; });
const chefchaouenV = V((c) => { const H = 112;
  const blue = (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 34, 44 + (i % 2) * 8, ['#7FB2E0', '#9CC4EC', '#6FA0D6'][i % 3])}<rect x='${x - 6}' y='${y - 18}' width='12' height='18' rx='6' fill='#2F5FA8' ${o}/>`);
  return `${range(c, H + 4, [[200, 70, 160]], '#8EA48E', 0.5, { snow: false })}${land(c, [[-20, H + 6], [420, H + 6]], '#9CC4EC')}
${ribbon([[210, 214, 110], [212, 170, 56], [214, 140, 24], [216, H + 8, 8]], '#BFDAF2', false)}${[0, 1, 2, 3, 4, 5].map((i) => { const t = recede(6, 0.72)[i]; const y = lerp(196, H + 10, t); return `<path d='M${lerp(155, 212, t)} ${y}h${lerp(110, 8, t)}' stroke='#6FA0D6' stroke-width='${lerp(2, 0.8, t)}'/>`; }).join('')}
${line([40, 168], [190, H + 10], 6, 1.15, 0.25, blue)}${line([370, 168], [236, H + 10], 6, 1.15, 0.25, blue)}${tx(320, 152, 1, `<path d='M312 152c-8-6-8-14 0-16 8 2 8 10 0 16z' fill='#E74C3C' ${o}/><path d='M312 152v-6' stroke='#3F6E3A' stroke-width='2'/>`)}`; });
const saharaV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 2], [80, H - 16], [200, H - 4], [300, H - 20], [420, H - 6]], '#E8B878', 0.5, false, H + 4)}${hills(c, [[-20, H + 10], [120, H - 6], [240, H + 8], [360, H - 4], [420, H + 6]], '#E2A866', 0.25, false, H + 14)}
${land(c, [[-20, 160], [80, 132], [200, 140], [320, 128], [420, 146]], '#E9B870')}<path d='M80 132q40 10 60 40M320 128q-30 14-50 46' fill='none' stroke='#D99A50' stroke-width='2'/>
${line([60, 150], [300, 118], 6, 1.1, 0.25, (x, y, s) => camel(x, y, s))}`; });
const essaouiraV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3E8FCF')}${skyline(c, 240, 420, H, { hmin: 8, hmax: 20, col: '#F2EEE6', t: 0.3 })}
<path d='M-20 120h200l20 30v60H-20z' fill='#D8C8A8' ${O}/>${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x='${-14 + i * 26}' y='112' width='14' height='8' fill='#D8C8A8' ${o}/>`).join('')}<rect x='120' y='86' width='34' height='34' fill='#D8C8A8' ${O}/><path d='M116 86h42' stroke='${INK}' stroke-width='2'/>
${line([220, 160], [360, 128], 5, 1.1, 0.4, (x, y, s) => tx(x, y, s, `<path d='M${x - 20} ${y}q20 8 40 0l-4-6h-32z' fill='#2F6DB5' ${o}/>`))}${frontShore(c, '#E6D8B0', 160)}${birds([[200, 70], [216, 62, 0.8], [240, 74, 0.7]])}`; });
// Britain
const highlandsV = V((c) => { const H = 120;
  return `${range(c, H, [[40, 70, 100], [200, 86, 110], [360, 74, 100]], '#8E7AA0', 0.45, { snow: false })}${range(c, H + 6, [[-20, 60, 90], [120, 50, 80], [300, 64, 100], [420, 56, 80]], '#7E8A6A', 0.15, { snow: false, ink: true })}
${ribbon([[260, 214, 260], [250, 170, 130], [240, 140, 50], [236, H + 8, 12]], '#6F98B0', false)}${land(c, [[-20, 160], [60, 142], [140, 150], [170, 200]], '#8A9A5A')}${land(c, [[330, 200], [350, 150], [420, 142]], '#8A9A5A')}
${tx(80, 148, 1, `<rect x='56' y='110' width='34' height='38' fill='#B8AC9C' ${O}/><path d='M56 110v-6h6v6m4 0v-6h6v6m4 0v-6h6v6m4 0v-6h6v6' fill='none' stroke='${INK}' stroke-width='2'/><rect x='90' y='124' width='28' height='24' fill='#A89C8C' ${O}/>`)}${tx(380, 150, 1, `<path d='M366 150c0-10 4-16 14-16s14 6 14 16' fill='#C9744A' ${o}/><path d='M372 134l-4-8M388 134l4-8' stroke='#E8DCC2' stroke-width='2'/>`)}`; });
const cornwallV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3E8FB8')}${line([420, H + 2], [200, H + 1], 1, 1, 1, () => '')}
${hills(c, [[180, 200], [200, 118], [260, 112], [320, 116], [420, 110]], '#7FA866', 0.4, false)}<path d='M200 118q60-6 220-8' fill='none' stroke='${hz(c, '#8A8A7A', 0.4)}' stroke-width='4'/>
${hills(c, [[-20, 90], [60, 86], [130, 96], [170, 150], [180, 200]], '#8A8A7A', 0, true)}${hills(c, [[-20, 98], [70, 94], [140, 104], [160, 130], [150, 200]], '#7FA866', 0, true)}
${line([20, 108], [130, 120], 4, 1, 0.8, (x, y, s) => tx(x, y, s, vhouse(x, y, 26, 18, '#F6F0E4', '#5A6B7E')), 1)}${foam(180, 152, 26)}${frontShore(c, '#E6D8B0', 154)}${vboat(260, 140, 0.8, '#2F6DB5')}`; });
const cotswoldsV = V((c) => { const H = 116;
  const cot = (x, y, s) => tx(x, y, s, `<rect x='${x - 18}' y='${y - 30}' width='36' height='30' fill='#E3C78E' ${O}/><path d='M${x - 22} ${y - 28}L${x} ${y - 52}L${x + 22} ${y - 28}z' fill='#8A7A5A' ${O}/><rect x='${x - 4}' y='${y - 16}' width='8' height='16' fill='#5A6B7E' ${o}/>`);
  return `${farHills(c, H, '#8FB07A', 0.5)}${flat(c, H + 4)}${street(c, H, '#D9C9A0', 70)}${sideRows(H, cot, 6, 6, 1.1, 1.1)}${tx(330, H + 4, 0.4, `<rect x='320' y='${H - 60}' width='20' height='64' fill='#E3C78E' ${o}/><path d='M318 ${H - 60}l12-26 12 26z' fill='#8A7A5A' ${o}/>`)}`; });
const london2V = V((c) => { const H = 118;
  const tower = (x, y, s, t) => tx(x, y, s, `<rect x='${x - 14}' y='${y - 76}' width='28' height='76' fill='${hz(c, '#D9C9A0', t)}' ${t < 0.2 ? O : ''}/><path d='M${x - 18} ${y - 76}l4-8h28l4 8zM${x - 18} ${y - 84}l18-22 18 22z' fill='${hz(c, '#5A6B7E', t)}' ${t < 0.2 ? O : ''}/>${t < 0.2 ? `<path d='M${x - 6} ${y - 40}v-14h12v14M${x - 6} ${y - 64}v-6h12v6' fill='none' stroke='${INK}' stroke-width='1.6'/>` : ''}`);
  return `${skyline(c, -10, 420, H, { hmin: 10, hmax: 40, seed: 8, t: 0.5, col: '#A9A8B8' })}${water(c, H + 2, 200, '#6E9FB8')}
${tower(250, 128, 0.55, 0.3)}<path d='M250 ${128 - 76 * 0.55 + 8}L100 ${150 - 76 + 12}' stroke='${INK}' stroke-width='3'/><path d='M250 ${128 - 76 * 0.55 + 6}L100 ${150 - 76 + 8}' stroke='#9AB0C8' stroke-width='3'/>
<path d='M-20 120L100 112L250 116L420 114' stroke='${INK}' stroke-width='8'/><path d='M-20 120L100 112L250 116L420 114' stroke='#9AB0C8' stroke-width='5'/>${tower(100, 152, 1, 0)}${foam(100, 154, 24)}${foam(250, 130, 10)}${frontShore(c, '#B8A688', 158)}`; });
// Germany
const bavariaV = V((c) => { const H = 120;
  return `${range(c, H, [[60, 80, 90], [200, 98, 100], [350, 86, 100]], '#B7C4D8', 0.4)}${flat(c, H + 4, '#86B866')}<path d='${sil([[-20, 160], [100, 142], [260, 150], [420, 140]])}' fill='#6FA650' opacity='.8'/>
${tx(110, 146, 1, `<rect x='80' y='108' width='50' height='38' fill='#F6F0E4' ${O}/><rect x='130' y='70' width='18' height='76' fill='#F6F0E4' ${O}/><path d='M128 70q11-22 22 0z' fill='#3F7F5A' ${O}/><circle cx='139' cy='52' r='5' fill='#3F7F5A' ${o}/><path d='M139 47v-8' stroke='${INK}' stroke-width='2'/><path d='M76 110l29-20 29 20z' fill='#B5452E' ${O}/>`)}${line([300, 150], [380, 134], 3, 1, 0.5, (x, y, s) => vcow(x, y, s, '#C9A27A'))}`; });
const berlinV = V((c) => { const H = 118;
  return `${skyline(c, -10, 420, H, { hmin: 10, hmax: 30, t: 0.5, col: '#B8B4C8' })}<path d='M320 ${H}V30' stroke='${hz(c, '#9AA5B4', 0.4)}' stroke-width='4'/><circle cx='320' cy='44' r='8' fill='${hz(c, '#9AA5B4', 0.4)}'/>
${flat(c, H + 2, '#C9C3B8')}${street(c, H, '#B8B2A6', 140)}${line([30, 168], [160, H + 6], 6, 1, 0.3, (x, y, s) => vtree(x, y, s, '#5E9C4F'))}${line([370, 168], [250, H + 6], 6, 1, 0.3, (x, y, s) => vtree(x, y, s, '#5E9C4F'))}${put(berlin, 200, 140, 0.8)}`; });
const blackForestV = V((c) => { const H = 116;
  return `${[0, 1, 2].map((r) => { const t = [0.55, 0.35, 0.15][r]; const y = H + r * 8; return line([-20 + r * 9, y], [430, y], 22 - r * 4, 1, 1, (x, yy) => vpine(x, yy, lerp(0.5, 0.9, r / 2), hz(c, '#2F5E3A', t), r === 2), 1); }).join('')}
${flat(c, H + 20, '#86B866')}${tx(110, 150, 1, `<rect x='76' y='112' width='68' height='38' fill='#F6E6D2' ${O}/><path d='M66 116l44-34 44 34z' fill='#6B4A2B' ${O}/><rect x='86' y='122' width='14' height='12' fill='#BFE3F5' ${o}/><rect x='120' y='122' width='14' height='12' fill='#BFE3F5' ${o}/><path d='M76 136h68' stroke='#8A5A3A' stroke-width='3'/>${[90, 104, 118, 132].map((x) => `<circle cx='${x}' cy='134' r='3' fill='#E74C3C'/>`).join('')}`)}${vpine(30, 152, 1.2, '#2F5E3A')}${vpine(190, 148, 1, '#2F5E3A')}`; });
const rhineV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 20], [80, H - 36], [180, H - 10], [290, H - 40], [420, H - 18]], '#7FA866', 0.4, false, H + 6)}${tx(300, H - 30, 0.5, `<rect x='290' y='${H - 70}' width='40' height='40' fill='#C9B79A' ${o}/><rect x='280' y='${H - 90}' width='16' height='60' fill='#C9B79A' ${o}/><path d='M278 ${H - 90}l10-16 10 16z' fill='#5A6B7E' ${o}/>`)}
${ribbon([[150, 214, 300], [170, 170, 150], [220, 140, 60], [250, H + 8, 16]], '#5F98B8', false)}${land(c, [[-20, 150], [40, 126], [100, 130], [150, 200]], '#8FB05A')}${vrows(c, 60, 100, 132, [-60, 20, 100], '#5E7F34', 4)}${land(c, [[300, 200], [320, 140], [380, 122], [420, 120]], '#9CBF5E')}
${tx(230, 166, 1.1, `<path d='M180 166h90l-8 8h-74z' fill='#2F2F3A' ${o}/><rect x='248' y='156' width='18' height='10' fill='#FFFFFF' ${o}/>`)}`; });
// Argentina
const pampasV = V((c) => { const H = 120;
  return `${farHills(c, H, '#A9C07A', 0.5, 3)}${flat(c, H + 2, '#C9C06A')}${[0, 1, 2, 3, 4].map((i) => { const t = recede(5, 0.7)[4 - i]; const y = lerp(162, H + 6, t); return `<path d='M-20 ${y}L420 ${y - 1}' stroke='#B0A85A' stroke-width='${lerp(3, 1, t)}'/>`; }).join('')}
${line([40, 158], [300, H + 6], 7, 1.1, 0.25, (x, y, s) => vcow(x, y, s, ['#8A5A3A', '#2B2B2B', '#C9A27A'][Math.round(s * 10) % 3]))}${tx(340, 140, 0.9, `<path d='M340 140v-50' stroke='#6B4A2B' stroke-width='4'/><path d='M314 96q26-22 52 0-26 8-52 0z' fill='#5E9C4F' ${o}/>`)}`; });
const buenosAiresV = V((c) => { const H = 118;
  return `${skyline(c, -10, 420, H, { hmin: 14, hmax: 44, seed: 12, t: 0.5 })}<path d='M300 ${H}l5-74 5 74z' fill='${hz(c, '#FFFFFF', 0.25)}'/>${flat(c, H + 2, '#C9B8A6')}${street(c, H, '#B8A890', 90)}
${sideRows(H, facade(['#F2C14E', '#E8735A', '#4FB3A6', '#86B7D9', '#E86A9A'], 46, 32, '#5A6B7E'), 6, 6)}`; });
const patagoniaV = V((c) => { const H = 120;
  return `<path d='M120 ${H}L170 40l14 30 18-50 16 46 14-24 30 78z' fill='${hz(c, '#8E9EB8', 0.25)}'/><path d='M170 40l14 30 18-50 16 46 14-24' fill='none' stroke='${hz(c, '#FFFFFF', 0.1)}' stroke-width='5'/>
${range(c, H + 4, [[40, 50, 80], [360, 56, 80]], '#9AAEC0', 0.35, { snow: true, cap: 40 })}${water(c, H + 4, 150, '#5FB0C8')}${land(c, [[-20, 150], [120, 146], [260, 150], [420, 144]], '#C9B07A')}${line([60, 166], [200, 150], 4, 1, 0.6, (x, y, s) => vbush(x, y, s, '#9C9A5A'))}${line([300, 162], [390, 148], 3, 1, 0.6, (x, y, s) => llama(x, y, s, '#E8C9A0'))}`; });
// Portugal
const lisbonV = V((c) => { const H = 114;
  return `${water(c, H - 6, H + 2, '#4F98C6')}<path d='M240 ${H - 6}V${H - 30}M380 ${H - 6}V${H - 30}' stroke='${hz(c, '#C0503A', 0.4)}' stroke-width='3'/><path d='M200 ${H - 10}L420 ${H - 12}M240 ${H - 30}Q310 ${H - 6} 380 ${H - 30}' fill='none' stroke='${hz(c, '#C0503A', 0.4)}' stroke-width='2'/>
${land(c, [[-20, 70], [100, 90], [200, 120], [300, 132], [420, 140]], '#E8DCC2')}${line([-10, 84], [190, 126], 8, 1, 0.75, facade(['#F2C14E', '#86B7D9', '#F4D2D9', '#FFFFFF', '#E8735A'], 30, 24, '#C0503A'), 1)}
${ribbon([[300, 214, 130], [250, 170, 70], [190, 130, 26], [120, 100, 10]], '#B8A688', false)}<path d='M300 214L120 100M330 214L130 100' stroke='#8A8A8A' stroke-width='1.6'/>${tx(230, 156, 0.62, `<rect x='200' y='132' width='62' height='24' rx='4' fill='#F2C14E' ${O}/><rect x='206' y='138' width='12' height='9' fill='#BFE3F5' ${o}/><rect x='224' y='138' width='12' height='9' fill='#BFE3F5' ${o}/><rect x='242' y='138' width='12' height='9' fill='#BFE3F5' ${o}/><path d='M230 132l-10-16' stroke='${INK}' stroke-width='1.6'/>`)}`; });
const algarveV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3FB0D0')}${line([400, H + 6], [240, H + 2], 4, 0.6, 0.3, (x, y, s, i, t) => tx(x, y, s, `<path d='M${x - 30} ${y}q-4-40 10-50h40q14 10 10 50z' fill='${hz(c, '#E0A060', 0.3 + t * 0.2)}'/>`))}
${hills(c, [[-20, 70], [60, 72], [140, 84], [180, 120], [190, 200]], '#E0A060', 0, true)}<path d='M60 150q-4-40 14-50 16 10 14 50z' fill='#3FB0D0' ${O}/>${hills(c, [[-20, 80], [100, 82], [150, 96]], '#9DB56A', 0, true, 92)}${frontShore(c, '#F6E6BF', 150)}${foam(190, 150, 30)}${vboat(270, 140, 0.8, '#E8735A')}`; });
const portoV = V((c) => { const H = 116;
  return `${hills(c, [[-20, 80], [60, 74], [130, 96], [170, 130], [180, 200]], '#C9B488', 0, true)}${line([0, 88], [160, 128], 8, 0.85, 1, facade(['#F2C14E', '#E8735A', '#F4D2D9', '#86B7D9', '#F6E6A8'], 26, 22, '#C0503A'), 1)}
${hills(c, [[260, 200], [280, 126], [340, 90], [420, 80]], '#C9B488', 0.15, true)}${ribbon([[150, 214, 260], [190, 170, 140], [240, 140, 60], [270, H + 8, 16]], '#4F86B0', false)}
<path d='M140 104Q220 30 300 96' fill='none' stroke='${INK}' stroke-width='7'/><path d='M140 104Q220 30 300 96' fill='none' stroke='#6D7886' stroke-width='4'/><path d='M130 96L310 90' stroke='#6D7886' stroke-width='5'/>${[160, 190, 220, 250, 280].map((x) => `<path d='M${x} 96v-${x === 220 ? 30 : 16}' stroke='#6D7886' stroke-width='1.6'/>`).join('')}
${tx(210, 166, 1, `<path d='M180 166q30 8 60 0l-6-6h-48z' fill='#6B4A2B' ${o}/><path d='M200 160v-26h20v14z' fill='#F6F0E4' ${o}/>`)}`; });
// Indonesia
const baliV = V((c) => { const H = 116;
  return `<path d='M200 ${H}L270 46q14-8 28 0L370 ${H}z' fill='${hz(c, '#6E7F8A', 0.4)}'/>${terraces(c, 168, H + 4, 7, ['#9CCF6A', '#7FBF6A', '#B6D97A'], 30)}
${tx(100, 150, 1, `${[-1, 1].map((d) => `<path d='M${100 + d * 22} 150v-52l${d * 6} -18 ${d * 6} 18v52z' fill='#8A7A6A' ${O}/><path d='M${100 + d * 22 + d * 2} 120h${d * 12}M${100 + d * 22 + d * 2} 106h${d * 10}' stroke='${INK}' stroke-width='1.6'/>`).join('')}<path d='M78 150h44' stroke='${INK}' stroke-width='2'/>`)}${palmsAlong([200, 150], [300, 128], 3, 1, 0.5)}`; });
const javaV = V((c) => { const H = 118;
  return `<path d='M200 ${H}L260 58q18-8 36 0L360 ${H}z' fill='${hz(c, '#6E6A76', 0.35)}'/><path d='M268 54q-6-16 6-22 10-8 18-2' stroke='${hz(c, '#E8E8F0', 0.2)}' stroke-width='6' fill='none' stroke-linecap='round'/>${hills(c, [[-20, H - 6], [120, H - 20], [220, H - 4], [420, H - 10]], '#5E8F4F', 0.4, false, H + 4)}
${flat(c, H + 4, '#7FBF6A')}${tx(110, 146, 1, `${[0, 1, 2, 3].map((i) => `<rect x='${50 + i * 10}' y='${146 - 12 * (i + 1)}' width='${120 - i * 20}' height='12' fill='#9C9488' ${O}/>`).join('')}${[0, 1, 2].map((i) => `<path d='M${66 + i * 30} ${122 - (i === 1 ? 24 : 0)}q6-12 12 0z' fill='#9C9488' ${o}/>`).join('')}<path d='M104 98q6-16 12 0z' fill='#9C9488' ${O}/><path d='M110 82v-8' stroke='${INK}' stroke-width='2'/>`)}${palmsAlong([240, 150], [380, 128], 4, 0.9, 0.4)}`; });
const sumatraV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 20], [90, H - 40], [200, H - 16], [320, H - 44], [420, H - 20]], '#5E8F6A', 0.45, false, H + 2)}${water(c, H, 150, '#5FA0B8')}${flat(c, 150, '#7FBF6A')}
${tx(110, 150, 1.05, `<path d='M86 150v-16M134 150v-16' stroke='#6B4A2B' stroke-width='4'/><rect x='80' y='112' width='60' height='22' fill='#8A4A2A' ${O}/><path d='M80 116q-14-30-10-50 30 20 40 22 10-2 40-22 4 20-10 50z' fill='#5A3A22' ${O}/><path d='M90 118h40' stroke='#F2C14E' stroke-width='3'/>`)}${palmsAlong([220, 154], [360, 148], 3, 0.9, 0.6)}${vboat(270, 140, 0.6, '#E8735A')}`; });
// Philippines
const palawanV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#3FC0C8')}${karst(c, 330, H + 2, 0.55, 0.5)}${karst(c, 270, H + 2, 0.65, 0.4)}${karst(c, 390, H + 2, 0.45, 0.55)}${karst(c, 210, H + 4, 0.8, 0.3)}
${hills(c, [[-20, 56], [40, 50], [90, 90], [120, 150], [130, 200]], '#4F8A5B', 0, true)}${tx(220, 156, 1.1, `<path d='M170 156q50 10 100 0l-8-6h-84z' fill='#E8DCC2' ${O}/><path d='M160 160h120M180 152l-10 8M260 152l10 8' stroke='${INK}' stroke-width='2'/><rect x='200' y='140' width='40' height='10' fill='#4FC3D6' ${o}/>`)}${foam(220, 164, 50)}${frontShore(c, '#F6E6BF', 160)}`; });
const manilaV = V((c) => { const H = 116;
  return `${skyline(c, 140, 420, H, { hmin: 24, hmax: 70, seed: 5, t: 0.35 })}${water(c, H, 200, '#4F98B6')}<path d='M-20 150q140-6 260-4t180-2v56H-20z' fill='#C9B8A6' ${O}/>
${line([200, 150], [400, 140], 7, 0.9, 0.5, (x, y, s) => vpalm(x, y, s * 0.7))}${tx(90, 150, 1, `<rect x='50' y='126' width='70' height='22' rx='5' fill='#E8DCC2' ${O}/><rect x='56' y='130' width='58' height='8' fill='#BFE3F5' ${o}/><path d='M50 126h70l-6-8h-58z' fill='#E74C3C' ${o}/><circle cx='64' cy='150' r='6' fill='${INK}'/><circle cx='106' cy='150' r='6' fill='${INK}'/><path d='M120 132h10' stroke='#C9C9C9' stroke-width='3'/>`)}`; });
const chocolateHillsV = V((c) => { const H = 118;
  const mound = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 22} ${y}q22-48 44 0z' fill='${hz(c, '#A07A4A', t)}' ${t < 0.2 ? O : ''}/>`);
  return `${farHills(c, H, '#7FA866', 0.5, 6)}${[[300, 0.4], [350, 0.38], [250, 0.45], [390, 0.35], [210, 0.5], [160, 0.55], [270, 0.6], [330, 0.62]].map(([x, s]) => mound(x, H + 6 + (1 - s) * 10, s, 0.45 - s * 0.3)).join('')}
${flat(c, H + 14, '#7FB569')}${[[110, 1.2], [40, 1], [190, 0.9], [300, 0.85], [370, 0.95]].map(([x, s]) => mound(x, 150 - (1.2 - s) * 10, s, 0)).join('')}`; });
// Nigeria
const lagosV = V((c) => { const H = 116;
  return `${skyline(c, -10, 420, H, { hmin: 20, hmax: 64, seed: 21, t: 0.4 })}${water(c, H, 200, '#5E9CA8')}
<path d='M-20 140L420 120' stroke='${INK}' stroke-width='8'/><path d='M-20 140L420 120' stroke='#B7C6D6' stroke-width='5'/>${line([0, 140], [400, 122], 8, 1, 0.5, (x, y, s) => `<path d='M${x} ${y}v${16 * s}' stroke='#8A94A2' stroke-width='${4 * s}'/>`, 1)}
${line([120, 166], [300, 140], 4, 1, 0.5, (x, y, s) => tx(x, y, s, `<path d='M${x - 22} ${y}q22 6 44 0l-4-5h-36z' fill='#7A4A2A' ${o}/>`))}${frontShore(c, '#C9B8A6', 160)}`; });
const sahelV = V((c) => { const H = 118;
  return `${farHills(c, H, '#D9B98A', 0.5, 6)}${flat(c, H + 4, '#D9B87A')}${line([300, 150], [390, H + 8], 4, 1, 0.4, (x, y, s) => acacia(x, y, s * 0.8, '#7E8F3E'))}
${tx(110, 150, 1, `<path d='M60 150v-50h100v50z' fill='#C9845A' ${O}/>${[66, 96, 126, 152].map((x) => `<path d='M${x} 100v-26l4-8 4 8v26' fill='#C9845A' ${O}/><path d='M${x + 4} 66v-8' stroke='${INK}' stroke-width='1.6'/>`).join('')}${[74, 104, 134].map((x) => `<path d='M${x} 110h6M${x} 124h6M${x} 138h6' stroke='#6B4A2B' stroke-width='3'/>`).join('')}<path d='M102 150v-20a8 8 0 0 1 16 0v20z' fill='#6B4A2B' ${o}/>`)}`; });
const nigerV = V((c) => { const H = 118;
  return `${palmsAlong([420, H + 2], [150, H + 1], 9, 0.55, 0.3)}${water(c, H + 2, 200, '#7A9A6E')}${line([10, 152], [140, H + 6], 4, 1.1, 0.35, (x, y, s) => vpalm(x, y, s))}
${line([200, 168], [320, 132], 4, 1.1, 0.35, (x, y, s, i) => tx(x, y, s, `<path d='M${x - 28} ${y}q28 8 56 0l-4-6h-48z' fill='#5A3A22' ${o}/>${i === 0 ? `<path d='M${x + 8} ${y - 6}v-26' stroke='#8A5A34' stroke-width='2'/><circle cx='${x - 6}' cy='${y - 12}' r='5' fill='#F2C14E' ${o}/><circle cx='${x - 16}' cy='${y - 11}' r='5' fill='#E8735A' ${o}/>` : ''}`))}${frontShore(c, '#9DB56A', 158)}`; });
// Jamaica / Cuba
const bluemtnV = V((c) => { const H = 116;
  return `${hills(c, [[-20, 64], [60, 44], [140, 70], [220, 40], [300, 66], [380, 46], [420, 56]], '#6E86B8', 0.45, false, H)}${fog([[200, 76, 140, 8]])}${hills(c, [[-20, 96], [90, 76], [200, 100], [300, 80], [420, 96]], '#5E8F6A', 0.2, false, H + 4)}
${flat(c, H + 4, '#7FB569')}${[-160, -80, 0, 80, 160, 240, 320, 400, 480].map((x0) => line([x0, 168], [lerp(x0, 200, 0.9), H + 8], 6, 1, 0.25, (x, y, s) => vbush(x, y, s, '#3F7F3A'))).join('')}${tx(100, 140, 1, vhouse(100, 140, 40, 22, '#F6E6D2', '#C0503A'))}`; });
const montegoBayV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#2FC0D0')}${hills(c, [[180, H + 2], [260, H - 20], [340, H - 10], [420, H - 24]], '#4F8F4A', 0.45, false, H + 3)}${frontShore(c, '#F6E6BF', 146)}${foam(160, 148, 120)}
${palmsAlong([20, 152], [300, 128], 7, 1.15, 0.3)}${tx(150, 146, 1, `<path d='M128 146v-30M172 146v-30' stroke='#8A5A34' stroke-width='3'/><path d='M120 118q30-20 60 0z' fill='#E74C3C' ${o}/>`)}${vboat(240, 132, 0.7, '#F2C14E')}`; });
const havanaV = V((c) => { const H = 116;
  return `${water(c, H - 8, H + 2, '#3E8FCF')}${land(c, [[-20, H + 2], [420, H + 2]], '#E8DCC2')}<path d='M-20 ${H + 6}L420 ${H + 2}' stroke='#C9BFA9' stroke-width='5'/>
${line([20, 160], [380, H + 4], 9, 1.15, 0.2, facade(['#F2C14E', '#4FB3A6', '#F4D2D9', '#E8735A', '#86B7D9', '#F6E6A8'], 48, 34, '#E8DCC2'), 0.8)}
${tx(260, 166, 1, `<path d='M210 166v-14l12-12h40l12 12v14z' fill='#E74C3C' ${O}/><rect x='226' y='144' width='32' height='10' fill='#BFE3F5' ${o}/><circle cx='226' cy='166' r='7' fill='${INK}'/><circle cx='262' cy='166' r='7' fill='${INK}'/>`)}`; });
const vinalesV = V((c) => { const H = 118;
  const mog = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 40} ${y}q-6-40 14-50 20-8 40 0 22 8 18 50z' fill='${hz(c, '#4F8A5B', t)}' ${t < 0.2 ? O : ''}/>`);
  return `${mog(330, H + 2, 0.7, 0.5)}${mog(250, H + 2, 0.9, 0.4)}${mog(380, H + 2, 0.5, 0.55)}${mog(120, H + 2, 1.1, 0.3)}${flat(c, H + 4, '#9C6A3A')}${vrows(c, 210, H - 6, H + 4, [-200, -120, -40, 40, 120, 200, 280, 360, 440, 520, 600], '#7FAE5A', 6)}
${tx(100, 146, 1, `<path d='M64 146v-24h72v24z' fill='#C99A63' ${O}/><path d='M56 124l44-30 44 30z' fill='#8A7A4A' ${O}/>`)}${palmsAlong([200, 148], [300, H + 10], 3, 1, 0.5)}`; });
const varaderoV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#2FC0D0')}<path d='M-20 170Q150 150 300 128T420 ${H + 4}V200H-20z' fill='#F6E6BF' ${O}/>${foam(220, 140, 120)}${palmsAlong([30, 160], [380, H + 10], 9, 1.1, 0.2)}${line([120, 168], [300, 132], 4, 1, 0.4, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}v-20' stroke='#8A5A34' stroke-width='2'/><path d='M${x - 14} ${y - 18}q14-10 28 0z' fill='#E8735A' ${o}/>`))}`; });
// Australia
const sydneyV = V((c) => {
  const shell = (cx, w, h, rot) => `<path d='M${cx - w / 2} 138Q${cx - w / 2} ${138 - h * 0.9} ${cx - w * 0.1} ${138 - h}Q${cx + w / 2} ${138 - h * 0.7} ${cx + w / 2} 138z' fill='#FBF7EE' ${O} transform='rotate(${rot} ${cx} 138)'/><path d='M${cx - w * 0.3} 136Q${cx - w * 0.2} ${138 - h * 0.6} ${cx - w * 0.08} ${138 - h * 0.95}M${cx} 136Q${cx + w * 0.02} ${138 - h * 0.65} ${cx + w * 0.1} ${138 - h * 0.88}M${cx + w * 0.3} 136Q${cx + w * 0.3} ${138 - h * 0.6} ${cx + w * 0.3} ${138 - h * 0.78}' fill='none' stroke='#C9BFA9' stroke-width='1.6'/>`;
  const E = [[190, 112], [530, 112]];
  return `${water(c, 118, 200, '#4FA9D6')}<g opacity='.8'><path d='M170 124q50-12 110-6t90-2 90 6 100 2v12H170z' fill='#AEBBC9'/>${[200, 230, 262, 300, 340].map((x, i) => `<rect x='${x}' y='${112 - (i % 3) * 5}' width='14' height='${12 + (i % 3) * 5}' fill='#9FB0C2'/>`).join('')}</g>
<g opacity='.92'><path d='M${E[0]} Q360 -16 ${E[1]}' fill='none' stroke='#6D7886' stroke-width='6'/><path d='M${E[0]} Q360 10 ${E[1]}' fill='none' stroke='#6D7886' stroke-width='3'/>${Array.from({ length: 24 }, (_, i) => { const [ax, ay] = q(E[0], [360, -16], E[1], (i + 1) / 25); return ax < 420 ? `<path d='M${ax.toFixed(1)} ${(ay + 2).toFixed(1)}V112' stroke='#8A94A2' stroke-width='1.4'/>` : ''; }).join('')}<rect x='186' y='110' width='240' height='6' fill='#6D7886' ${O}/><rect x='180' y='88' width='20' height='36' fill='#C9B79A' ${O}/><rect x='177' y='85' width='26' height='6' fill='#B8A688' ${O}/></g>
<g transform='translate(18 0)'>${tx(100, 138, 0.78, `<path d='M-30 136H182q6 0 8 8v6H-30z' fill='#E3D6BC' ${O}/>${shell(18, 64, 84, -4)}${shell(70, 70, 104, -2)}${shell(124, 64, 88, 2)}${shell(162, 36, 56, 4)}`)}</g>${vboat(230, 140, 0.9, '#D9452B')}${foam(214, 150, 16)}${frontShore(c, '#B8A688', 156)}`; });
const outbackV = V((c) => { const H = 120;
  return `<path d='M220 ${H}q6-26 30-30h70q22 4 28 30z' fill='${hz(c, '#C7633A', 0.35)}'/><path d='M250 96q10 10 6 24M300 94q-6 12 0 26' stroke='${hz(c, '#9C4A28', 0.3)}' stroke-width='2' fill='none'/>
${flat(c, H + 2, '#D9845A')}${ribbon([[180, 212, 110], [190, 166, 46], [200, 140, 16], [204, H + 4, 4]], '#8A5A3A', false)}${line([40, 160], [170, H + 6], 5, 1, 0.3, (x, y, s) => vbush(x, y, s, '#9C9A5A'))}${line([360, 160], [240, H + 6], 5, 1, 0.3, (x, y, s) => vbush(x, y, s, '#8A9A4A'))}
${tx(90, 150, 1, `<path d='M70 150c-4-20 0-34 10-40 4-10 14-10 16 0 6 4 4 10 0 12l-6 8 10 20' fill='#B07A4A' ${o}/><path d='M96 112l4-14M90 110l-2-12' stroke='#B07A4A' stroke-width='3'/>`)}`; });
const reefV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#2FC8D0')}${[[80, 150, 70], [250, 140, 60], [180, 130, 40], [340, 128, 34]].map(([x, y, w]) => `<ellipse cx='${x}' cy='${y}' rx='${w}' ry='${w / 7}' fill='#1F8FA8' opacity='.5'/><ellipse cx='${x - w / 3}' cy='${y}' rx='${w / 4}' ry='${w / 14}' fill='#E86A9A' opacity='.6'/>`).join('')}
<path d='M300 ${H + 4}q30-12 60-6t40 6z' fill='#F6E6BF' ${o}/>${vpalm(330, H + 2, 0.4)}${vpalm(350, H + 2, 0.35)}${tx(150, 164, 1.1, `<path d='M110 164h80l-10 10h-60z' fill='#FFFFFF' ${O}/><rect x='130' y='150' width='40' height='14' fill='#E8DCC2' ${o}/><path d='M150 150v-14' stroke='${INK}' stroke-width='2'/>`)}${foam(150, 176, 50)}${frontShore(c, '#F6E6BF', 160)}`; });
// Canada
const quebecV = V((c) => { const H = 118;
  return `${hills(c, [[240, H], [320, H - 10], [420, H - 4]], '#7FA07A', 0.5, false, H + 2)}${water(c, H, 200, '#5E8FA8')}
${hills(c, [[-20, 96], [60, 92], [140, 100], [190, 150], [200, 200]], '#8A8A7A', 0, true)}${tx(100, 96, 1, `<rect x='60' y='60' width='80' height='36' fill='#C9744A' ${O}/>${[60, 86, 112, 136].map((x) => `<path d='M${x - 4} 60l6-18 6 18z' fill='#3F7F6A' ${O}/>`).join('')}<rect x='88' y='30' width='24' height='30' fill='#C9744A' ${O}/><path d='M84 30l16-22 16 22z' fill='#3F7F6A' ${O}/>${[68, 80, 92, 104, 116, 128].map((x) => `<rect x='${x}' y='70' width='5' height='8' fill='#FFE08A'/>`).join('')}`)}
${line([180, 160], [330, 132], 4, 1, 0.4, (x, y, s) => tx(x, y, s, `<path d='M${x - 24} ${y}h48l-6 8h-36z' fill='#FFFFFF' ${o}/><rect x='${x - 10}' y='${y - 10}' width='20' height='10' fill='#E74C3C' ${o}/>`))}${frontShore(c, '#B8A688', 160)}`; });
const rockiesV = V((c) => { const H = 118;
  return `${range(c, H, [[60, 86, 80], [190, 104, 90], [320, 92, 90], [420, 76, 70]], '#9AAEC0', 0.3, { ink: true })}${water(c, H, 160, '#3FB8C8')}<path d='M30 ${H + 2}L190 ${H + 60} 340 ${H + 2}z' fill='#9AAEC0' opacity='.25'/>
${land(c, [[-20, 156], [100, 150], [250, 154], [420, 146]], '#6F9A5A')}${line([10, 160], [150, H + 6], 6, 1.2, 0.35, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${line([400, 160], [280, H + 6], 6, 1.2, 0.35, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${tx(220, 156, 1, `<path d='M190 156q30 6 60 0l-4-5h-52z' fill='#E74C3C' ${o}/>`)}`; });
const prairieV = V((c) => { const H = 120;
  return `${farHills(c, H, '#B9C76A', 0.5, 3)}${flat(c, H + 2, '#E8C860')}${vrows(c, 220, H - 6, H + 2, [-240, -160, -80, 0, 80, 160, 240, 320, 400, 480, 560, 640], '#C9A23E', 4)}
${tx(100, 146, 1, `<rect x='76' y='60' width='40' height='86' fill='#B5452E' ${O}/><path d='M72 62l24-22 24 22z' fill='#8A2E1E' ${O}/><rect x='116' y='96' width='30' height='50' fill='#C9744A' ${O}/><path d='M116 96l15-12 15 12' fill='#8A2E1E' ${O}/><path d='M-20 150L420 146' stroke='#7A6A5A' stroke-width='3'/>`)}${tx(300, H + 4, 0.4, `<rect x='290' y='${H - 70}' width='30' height='74' fill='#B5452E'/>`)}`; });
const maritimesV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#3E7FAF')}${hills(c, [[200, H + 2], [280, H - 8], [340, H - 4], [420, H - 12]], '#6F9A5A', 0.45, false, H + 3)}${tx(380, H - 6, 0.35, `<rect x='374' y='${H - 60}' width='12' height='54' fill='#FFFFFF'/><path d='M374 ${H - 60}h12l-6-8z' fill='#E74C3C'/>`)}
${hills(c, [[-20, 112], [80, 110], [170, 120], [200, 150], [210, 200]], '#9DB56A', 0, true)}${line([20, 118], [190, 136], 6, 1.1, 0.85, (x, y, s, i) => tx(x, y, s, vhouse(x, y, 26, 26, ['#E74C3C', '#F2C14E', '#2F6DB5', '#4FB3A6', '#E86A9A', '#FFFFFF'][i % 6], '#5A5A5A')), 1)}
<path d='M200 150h80' stroke='#8A5A34' stroke-width='5'/>${[208, 230, 252, 274].map((x) => `<path d='M${x} 150v10' stroke='#6B4A2B' stroke-width='3'/>`).join('')}${vboat(250, 146, 0.8, '#F2C14E')}${frontShore(c, '#B8A688', 158)}`; });
// Russia
const moscowV = V((c) => { const H = 118;
  const star = (x, y) => `<path d='M${x} ${y}l1.6 3.4 3.6.5-2.6 2.5.6 3.6L${x} ${y + 8.2}l-3.2 1.8.6-3.6-2.6-2.5 3.6-.5z' fill='#E2523B'/>`;
  return `${skyline(c, -10, 420, H, { hmin: 8, hmax: 26, t: 0.5, col: '#C9B8C8' })}${land(c, [[-20, H + 2], [420, H + 2]], '#B8A898')}${vrows(c, 200, H - 30, H + 2, [-300, -200, -100, 0, 100, 200, 300, 400, 500, 600, 700], '#A0907E', 1.6)}
<path d='M222 ${H + 2}h200v-30h-200z' fill='${hz(c, '#B8452F', 0.25)}' ${o}/>${[230, 250, 270, 290, 310, 350, 370, 390, 410].map((x) => `<path d='M${x} ${H - 28}v-6h8v6z' fill='${hz(c, '#B8452F', 0.25)}'/>`).join('')}
<rect x='322' y='${H - 62}' width='20' height='34' fill='${hz(c, '#B8452F', 0.2)}' ${o}/><rect x='325' y='${H - 74}' width='14' height='12' fill='${hz(c, '#EFE3C8', 0.2)}' ${o}/><circle cx='332' cy='${H - 68}' r='4' fill='#FFFFFF' ${o}/><path d='M323 ${H - 74}L332 ${H - 98} 341 ${H - 74}z' fill='#3F8C5A' ${o}/>${star(328, H - 106)}
${put(moscow, 110, 146, 1.0)}${[[40, 150], [190, 146], [380, 146]].map(([x, y]) => `<path d='M${x} ${y}v-20' stroke='${INK}' stroke-width='2.4' stroke-linecap='round'/><circle cx='${x}' cy='${y - 22}' r='3.4' fill='#FFE08A' ${o}/>`).join('')}`; });
const siberiaV = V((c) => { const H = 118;
  return `${range(c, H, [[80, 50, 120], [300, 60, 140]], '#B7C4D8', 0.45)}${[0, 1, 2].map((r) => { const t = [0.5, 0.3, 0.12][r]; const y = H + 2 + r * 10; return line([-20 + r * 7, y], [430, y], 24 - r * 5, 1, 1, (x, yy) => vpine(x, yy, lerp(0.45, 0.85, r / 2), hz(c, '#2F5E3A', t), r === 2), 1); }).join('')}
${flat(c, H + 24, '#F4F8FB')}${ribbon([[260, 212, 60], [240, 170, 24], [250, 146, 8]], '#D8E2EC', false)}${tx(110, 152, 1, `<rect x='80' y='120' width='60' height='32' fill='#8A5A3A' ${O}/><path d='M80 128h60M80 136h60M80 144h60' stroke='#6B4A2B' stroke-width='1.6'/><path d='M70 122l40-26 40 26z' fill='#F4F8FB' ${O}/><rect x='102' y='128' width='14' height='12' fill='#FFE08A' ${o}/><path d='M128 104v-12' stroke='#6B4A2B' stroke-width='5'/>`)}`; });
const stPeteV = V((c) => { const H = 118;
  const pal = (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 40, 44, ['#9AD0C0', '#F2D7A8', '#F4D2D9', '#E8DCC2'][i % 4])}<path d='M${x - 20} ${y - 44}h40v-4h-40zM${x - 20} ${y - 22}h40' stroke='#FFFFFF' stroke-width='2'/>`);
  return `<path d='M300 ${H}V40l3-8 3 8V${H}' fill='${hz(c, '#E0A93B', 0.3)}'/>${skyline(c, -10, 420, H, { hmin: 8, hmax: 20, t: 0.5, col: '#C9C3D6' })}${flat(c, H + 2, '#B8B2A6')}
${ribbon([[200, 214, 200], [204, 166, 110], [210, 140, 46], [214, H + 4, 12]], '#6F98B8', false)}${line([40, 168], [176, H + 6], 6, 1.1, 0.25, pal)}${line([360, 168], [242, H + 6], 6, 1.1, 0.25, pal)}<path d='M150 140q50-20 100 0' fill='none' stroke='${INK}' stroke-width='2'/><rect x='146' y='138' width='108' height='5' fill='#E8DCC2' ${o}/>`; });
// Poland
const krakowV = V((c) => { const H = 118;
  return `${skyline(c, -10, 420, H, { hmin: 10, hmax: 24, t: 0.5, col: '#D9B8A0' })}${flat(c, H + 2, '#D8C8B0')}${vrows(c, 200, H - 30, H + 2, [-200, -100, 0, 100, 200, 300, 400, 500, 600], '#C4B49C', 1.6)}
${tx(270, H + 6, 0.62, `<rect x='200' y='${H - 30}' width='140' height='36' fill='#F2E2C4' ${O}/>${[210, 236, 262, 288, 314].map((x) => `<path d='M${x} ${H + 6}v-14a8 8 0 0 1 16 0v14' fill='#C9A982' ${o}/>`).join('')}<path d='M196 ${H - 30}h148l-8-10h-132z' fill='#B5452E' ${O}/>`)}${line([30, 168], [130, H + 6], 4, 1, 0.4, facade(['#F2C14E', '#F4D2D9', '#86B7D9', '#E8735A'], 50, 34, '#B5452E'))}${put(krakow, 120, 150, 0.95)}`; });
const tatrasV = V((c) => { const H = 122;
  return `${range(c, H, [[40, 80, 70], [150, 104, 70], [250, 90, 80], [360, 100, 80]], '#9AA8B8', 0.25, { ink: true, cap: 70 })}${land(c, [[-20, 150], [80, 134], [200, 140], [420, 134]], '#86B866')}
${tx(100, 148, 1, `<rect x='72' y='118' width='56' height='30' fill='#8A5A3A' ${O}/><path d='M62 122l38-34 38 34z' fill='#5A3A22' ${O}/><path d='M72 126h56M72 134h56M72 142h56' stroke='#6B4A2B' stroke-width='1.4'/>`)}${line([200, 150], [380, 136], 5, 1, 0.5, (x, y, s) => sheep(x, y, s))}${vpine(20, 154, 1.2, '#2F5E3A')}${vpine(170, 148, 1, '#2F5E3A')}`; });
const balticV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#5E8FB0')}<path d='M-20 160Q120 136 260 128T420 120V200H-20z' fill='#F2E6C8' ${O}/>${line([20, 152], [300, 124], 6, 1, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x - 6} ${y}q2-14 0-22M${x + 4} ${y}q-2-12 4-20' fill='none' stroke='#9CAE50' stroke-width='2'/>`))}
<path d='M200 150L420 128' stroke='${INK}' stroke-width='7'/><path d='M200 150L420 128' stroke='#C9A982' stroke-width='4'/>${line([210, 150], [410, 130], 8, 1, 0.5, (x, y, s) => `<path d='M${x} ${y}v${14 * s}' stroke='#8A5A34' stroke-width='${3 * s}'/>`, 1)}${tx(380, 132, 0.6, `<rect x='374' y='96' width='12' height='36' fill='#FFFFFF' ${o}/><path d='M374 96h12l-6-8z' fill='#E74C3C' ${o}/>`)}`; });
// Sweden
const stockholmV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#4F86B0')}${skyline(c, 220, 420, H, { hmin: 10, hmax: 30, t: 0.4, col: '#E9C9A0' })}<path d='M300 ${H - 20}V40l4-8 4 8v${H - 60}' fill='${hz(c, '#3F7F6A', 0.3)}'/>
<path d='M-20 140h220v8l-10 12H-20z' fill='#B8B2A6' ${O}/>${line([0, 140], [180, 140], 7, 1, 1, facade(['#E8735A', '#F2C14E', '#E9C38E', '#C9744A', '#F6E6A8', '#86B7D9'], 50, 26, '#4A4A52'), 1)}
${line([220, 160], [360, 132], 4, 1, 0.4, (x, y, s) => tx(x, y, s, `<path d='M${x - 22} ${y}h44l-6 8h-32z' fill='#FFFFFF' ${o}/><rect x='${x - 10}' y='${y - 10}' width='20' height='10' fill='#2F6DB5' ${o}/>`))}${frontShore(c, '#B8B2A6', 162)}`; });
const dalarnaV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 4], [100, H - 14], [220, H - 4], [320, H - 16], [420, H - 6]], '#5E7F5A', 0.5, false, H + 2)}${water(c, H + 2, 150, '#5E8FB0')}${flat(c, 150, '#86B866')}
${line([40, 150], [180, 134], 4, 1.1, 0.6, (x, y, s) => tx(x, y, s, vhouse(x, y, 34, 24, '#B5302B', '#3A3A3A', true, '#FFFFFF')), 1)}${line([240, 154], [380, 140], 5, 1, 0.6, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}
${tx(200, 160, 1, `<path d='M188 160v-14c-4-2-2-8 2-8h10l6-8 4 4-4 6v20M192 160v-10M204 160v-10' fill='#C8352F' ${o}/>`)}`; });
const laplandV = V((c) => { const H = 118;
  return `<path d='M-20 50q120-40 220-10t220-14' fill='none' stroke='#7FE0B8' stroke-width='14' opacity='.45'/><path d='M40 70q100-30 200-6t180-20' fill='none' stroke='#9CE0F0' stroke-width='8' opacity='.4'/>
${range(c, H, [[100, 40, 140], [320, 50, 150]], '#B7C4D8', 0.45)}${flat(c, H + 4, '#F4F8FB')}${line([300, 156], [400, H + 8], 5, 1, 0.4, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${line([20, 160], [70, 140], 2, 1.1, 0.8, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}
${tx(150, 152, 1, `<path d='M120 152l30-48 30 48z' fill='#C9744A' ${O}/><path d='M140 104l10 16 10-16' stroke='${INK}' stroke-width='2' fill='none'/><path d='M144 152l6-14 6 14z' fill='#FFE08A' ${o}/>`)}${tx(230, 150, 1, `<path d='M212 150v-10c0-6 6-8 10-8h10l4-8 6 0-2 10v16M216 150v-8M232 150v-8' fill='#8A6A4A' ${o}/><path d='M240 124l4-8M244 126l6-6' stroke='#8A6A4A' stroke-width='2'/>`)}`; });
// Israel
const jerusalemV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 6], [120, H - 16], [260, H - 4], [420, H - 14]], '#B9AE8A', 0.5, false, H + 4)}${skyline(c, 200, 420, H, { hmin: 6, hmax: 16, t: 0.35, col: '#E8D9B0' })}${flat(c, H + 4, '#C9B07A')}
${ribbon([[300, 212, 90], [270, 170, 44], [250, 140, 16], [240, H + 6, 4]], '#E3D3A8', false)}${line([300, 168], [380, 140], 4, 1, 0.5, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}q-2-10 2-18' stroke='#6B4A2B' stroke-width='3' fill='none'/><g fill='#7C9A55' ${o}><circle cx='${x - 7}' cy='${y - 20}' r='8'/><circle cx='${x + 7}' cy='${y - 22}' r='9'/><circle cx='${x}' cy='${y - 28}' r='8'/></g>`))}${put(jerusalem, 110, 150, 0.95)}`; });
const telAvivV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3FA8D0')}<path d='M140 200Q220 150 300 120T420 100V200z' fill='#F6E6BF' ${O}/>${foam(250, 136, 60)}
${line([300, 112], [420, 96], 1, 1, 1, () => '')}${line([150, 132], [400, 100], 7, 0.6, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 20}' y='${y - 60}' width='40' height='60' fill='#F6F2EA' ${O}/>${[0, 1, 2, 3].map((r) => `<path d='M${x - 20} ${y - 52 + r * 13}h40' stroke='#C9C3B8' stroke-width='2'/>`).join('')}`), 0.8)}
${line([200, 168], [360, 128], 5, 1, 0.4, (x, y, s) => vpalm(x, y, s * 0.8))}${tx(310, 170, 1, `<path d='M300 170v-20' stroke='#8A5A34' stroke-width='2'/><path d='M286 152q14-10 28 0z' fill='#E8735A' ${o}/>`)}`; });
const negevV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 20], [80, H - 40], [160, H - 24], [260, H - 46], [420, H - 26]], '#D9A07A', 0.5, false, H)}${hills(c, [[-20, H - 4], [120, H - 20], [220, H - 8], [340, H - 26], [420, H - 10]], '#C98A5A', 0.3, false, H + 4)}${[0, 1, 2].map((i) => `<path d='M-20 ${H - 26 + i * 10}q200 -${8 + i * 4} 440 0' fill='none' stroke='${hz(c, '#B07A4A', 0.4)}' stroke-width='1.6'/>`).join('')}
${land(c, [[-20, 160], [80, 136], [200, 144], [420, 134]], '#E2B66B')}${line([90, 150], [300, 130], 4, 1.1, 0.4, (x, y, s) => camel(x, y, s))}${vbush(30, 158, 1, '#9C9A5A')}`; });
// Iran
const isfahanV = V((c) => { const H = 114, vx = 200;
  return `${hills(c, [[-20, H - 4], [420, H - 6]], '#C9B488', 0.5, false, H + 2)}${tx(vx, H + 4, 0.7, put(isfahan, vx, H + 4, 1))}
${line([-20, H + 4], [420, H + 4], 1, 1, 1, () => '')}${land(c, [[-20, H + 4], [420, H + 4]], '#E8D9B0')}${ribbon([[vx, 206, 150], [vx, 160, 70], [vx, 134, 26], [vx, H + 6, 8]], '#6FB6D0', true)}
${line([30, 168], [168, H + 8], 7, 1.1, 0.25, (x, y, s) => tx(x, y, s, `<rect x='${x - 14}' y='${y - 30}' width='28' height='30' fill='#E8D9B0' ${O}/><path d='M${x - 8} ${y}v-18a8 8 0 0 1 16 0v18' fill='#2E8A8F' ${o}/>`))}${line([370, 168], [232, H + 8], 7, 1.1, 0.25, (x, y, s) => tx(x, y, s, `<rect x='${x - 14}' y='${y - 30}' width='28' height='30' fill='#E8D9B0' ${O}/><path d='M${x - 8} ${y}v-18a8 8 0 0 1 16 0v18' fill='#2E8A8F' ${o}/>`))}`; });
const persepolisV = V((c) => { const H = 118;
  const col = (x, y, s, i, t) => tx(x, y, s, `<rect x='${x - 5}' y='${y - 70}' width='10' height='70' fill='${hz(c, '#D8C8A8', t * 0.4)}' ${t < 0.4 ? O : ''}/><path d='M${x - 10} ${y - 70}h20l-3-8h-14z' fill='${hz(c, '#C9B79A', t * 0.4)}' ${t < 0.4 ? o : ''}/>`);
  return `${range(c, H, [[300, 50, 140]], '#B49A80', 0.45, { snow: false })}${flat(c, H + 4, '#D9C98A')}<path d='M-20 150h300l20-20H0z' fill='#C9B79A' ${O}/>${line([20, 136], [300, H + 6], 9, 1.1, 0.3, col)}`; });
const caspianV = V((c) => { const H = 116;
  return `${hills(c, [[-20, 70], [60, 54], [140, 76], [230, 50], [320, 72], [420, 56]], '#4F7F4A', 0.4, false, H)}${fog([[180, 80, 120, 8]])}${water(c, H, 150, '#5E9CB0')}${flat(c, 150, '#7FB569')}
${[-120, -40, 40, 120, 200].map((x0) => line([x0, 170], [lerp(x0, 130, 0.9), 152], 4, 1, 0.5, (x, y, s) => vbush(x, y, s, '#3F7F3A'))).join('')}${tx(300, 152, 1, vhouse(300, 152, 40, 24, '#F6E6D2', '#5A6B7E'))}`; });
// South Africa
const capeTownV = V((c) => { const H = 118;
  return `<path d='M80 ${H}L120 54h170l40 ${H - 54}z' fill='${hz(c, '#7E8A7A', 0.3)}' ${O}/><path d='M120 54h170' stroke='#FFFFFF' stroke-width='6' opacity='.7'/><path d='M300 ${H}q30-60 50-70 20 10 30 70z' fill='${hz(c, '#7E8A7A', 0.4)}'/>
${skyline(c, 60, 360, H, { hmin: 10, hmax: 40, t: 0.2, col: '#E8E2D4' })}${water(c, H, 200, '#3E7FAF')}${line([200, 160], [360, 130], 4, 1.1, 0.4, (x, y, s) => vboat(x, y, s, '#FFFFFF'))}<path d='M-20 150h170v10H-20z' fill='#B8A688' ${O}/>${tx(60, 150, 1, `<rect x='40' y='118' width='40' height='32' fill='#E74C3C' ${O}/><rect x='46' y='104' width='28' height='14' fill='#E74C3C' ${O}/>`)}${frontShore(c, '#B8A688', 162)}`; });
const safariV = V((c) => { const H = 118;
  const giraffe = (x, y, s) => tx(x, y, s, `<path d='M${x - 10} ${y}v-20h18v20M${x + 6} ${y - 20}l8-30 6 2-6 30' fill='#E8B060' ${o}/><rect x='${x - 12}' y='${y - 26}' width='22' height='10' rx='4' fill='#E8B060' ${o}/><circle cx='${x - 4}' cy='${y - 21}' r='2' fill='#8A5A2A'/><circle cx='${x + 4}' cy='${y - 22}' r='2' fill='#8A5A2A'/>`);
  return `${hills(c, [[-20, H - 6], [120, H - 16], [260, H - 4], [420, H - 14]], '#A9A05E', 0.5, false, H + 4)}${line([380, H + 4], [200, H + 2], 5, 0.5, 0.3, (x, y, s, i, t) => acacia(x, y, s, hz(c, '#6E8F3E', 0.3 + t * 0.2), false), 0.8)}
${flat(c, H + 6, '#D9C080')}${acacia(80, 152, 1.3)}${giraffe(180, 148, 1)}${giraffe(260, 134, 0.6)}${line([300, 156], [380, 140], 3, 1, 0.6, (x, y, s) => tx(x, y, s, `<path d='M${x - 24} ${y - 10}c0-14 10-22 24-22 12 0 20 6 22 16l2 16h-8l-2-8-4 8h-8v-8h-14v8h-8z' fill='#9AA5B4' ${o}/>`))}`; });
const winelandsV = V((c) => { const H = 116;
  return `${range(c, H, [[80, 70, 110], [280, 84, 130]], '#8E8AA8', 0.4, { snow: false })}${flat(c, H + 4, '#9CBF5E')}${vrows(c, 260, H - 6, H + 4, [-160, -60, 40, 140, 240, 340, 440, 540, 640], '#5E7F34', 5)}
${tx(110, 146, 1, `<rect x='60' y='112' width='100' height='34' fill='#FFFFFF' ${O}/><path d='M56 114h108l-10-12H66z' fill='#6B5A4A' ${O}/><path d='M94 114v-20q16-14 32 0v20z' fill='#FFFFFF' ${O}/><rect x='104' y='124' width='12' height='22' fill='#3F6E3A' ${o}/>`)}${vtree(30, 150, 1, '#5E8F4F')}`; });
// Colombia
const cartagenaV = V((c) => { const H = 116;
  return `${water(c, H - 6, H + 2, '#3FA8D0')}${skyline(c, 260, 420, H - 6, { hmin: 20, hmax: 50, t: 0.3, col: '#E9E2D4' })}${flat(c, H + 2, '#E8DCC2')}${street(c, H, '#D9C9A0', 70)}
${sideRows(H, (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 32, 46, ['#F2C14E', '#E8735A', '#4FB3A6', '#86B7D9', '#E86A9A'][i % 5])}<rect x='${x - 14}' y='${y - 34}' width='28' height='6' fill='#8A5A34' ${o}/><path d='M${x - 14} ${y - 28}v-4M${x + 14} ${y - 28}v-4' stroke='#8A5A34' stroke-width='2'/><circle cx='${x}' cy='${y - 40}' r='4' fill='#E86A9A'/>`), 6, 6)}`; });
const coffeeAxisV = V((c) => { const H = 116;
  return `${hills(c, [[-20, 70], [60, 50], [150, 78], [230, 46], [320, 72], [420, 54]], '#5E8F5A', 0.45, false, H)}${line([380, 96], [260, 84], 4, 0.5, 0.35, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}V${y - 70}' stroke='${hz(c, '#8A7A6A', 0.3)}' stroke-width='3'/><path d='M${x - 14} ${y - 66}q14-12 28 0' fill='none' stroke='${hz(c, '#3F6E3A', 0.3)}' stroke-width='4'/>`))}
${hills(c, [[-20, 160], [60, 100], [160, 92], [260, 110], [340, 150], [420, 120]], '#6FA650', 0, true)}${[0, 1, 2, 3, 4, 5].map((i) => `<path d='M${-10 + i * 12} ${150 - i * 8}q${110 - i * 8} -${30 - i * 2} ${280 - i * 20} ${-2 + i * 4}' fill='none' stroke='#3F7F3A' stroke-width='5' stroke-dasharray='6 4'/>`).join('')}${tx(150, 100, 1, vhouse(150, 100, 40, 22, '#FFFFFF', '#C0503A'))}`; });
const medellinV = V((c) => { const H = 118;
  return `${hills(c, [[-20, 60], [80, 50], [200, 70], [300, 46], [420, 62]], '#5E8F5A', 0.45, false, H)}${skyline(c, 80, 340, H, { hmin: 20, hmax: 50, t: 0.35, col: '#B7C6D6' })}
${hills(c, [[-20, 160], [40, 90], [120, 116], [160, 150], [170, 200]], '#7FA866', 0, true)}${line([0, 104], [140, 140], 10, 0.7, 1, (x, y, s, i) => tx(x, y, s, vblock(x, y, 18, 16, ['#E8735A', '#F2C14E', '#C9744A', '#86B7D9'][i % 4])), 1)}
<path d='M40 84L420 40' stroke='${INK}' stroke-width='1.4'/>${tx(160, 70, 1, `<path d='M160 70v6' stroke='${INK}' stroke-width='1.4'/><rect x='152' y='76' width='16' height='12' rx='3' fill='#F2C14E' ${o}/>`)}${tx(300, 54, 0.7, `<rect x='292' y='58' width='16' height='12' rx='3' fill='#F2C14E' ${o}/>`)}`; });
// Egypt
const nileV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 4], [100, H - 12], [240, H - 2], [420, H - 10]], '#E2B66B', 0.5, false, H + 2)}${palmsAlong([420, H + 2], [220, H + 1], 7, 0.5, 0.3)}${ribbon([[180, 214, 300], [200, 170, 170], [230, 140, 70], [250, H + 4, 16]], '#4F8FB8', false)}
${land(c, [[-20, 150], [40, 132], [100, 128], [130, 200]], '#9DB56A')}${palmsAlong([10, 154], [120, 130], 4, 1.1, 0.5)}${tx(230, 150, 0.62, `<path d='M190 160q40 10 80 0l-6-6h-68z' fill='#F6F0E4' ${O}/><path d='M220 154V86l40 60z' fill='#FFFFFF' ${O}/><path d='M220 86l-14 64' stroke='${INK}' stroke-width='1.6'/>`)}${frontShore(c, '#9DB56A', 164)}`; });
const cairoV = V((c) => { const H = 118;
  return `${tx(330, H, 0.45, `<path d='M270 ${H}L330 ${H - 64}L390 ${H}z' fill='${hz(c, '#E2B66B', 0.4)}'/>`)}${tx(380, H, 0.3, `<path d='M320 ${H}L380 ${H - 64}L440 ${H}z' fill='${hz(c, '#E2B66B', 0.5)}'/>`)}${skyline(c, -10, 300, H, { hmin: 10, hmax: 30, t: 0.4, col: '#E8D9B0' })}
${flat(c, H + 2, '#D8C8A8')}${[0, 1, 2].map((r) => skyline(c, -10, 420, lerp(150, H + 10, [0.8, 0.5, 0.2][r]), { hmin: 8, hmax: 16, col: '#E8D9B0', t: [0.35, 0.2, 0.05][r], seed: 3 + r, wmin: 12 + r * 6, gap: 3 })).join('')}
${tx(120, 148, 1, `${dome(120, 110, 26, '#C9B79A')}<rect x='90' y='110' width='60' height='38' fill='#E8D9B0' ${O}/>${minaret(80, 148, 92, '#E8D9B0', '#C9B79A', 8)}${minaret(160, 148, 92, '#E8D9B0', '#C9B79A', 8)}`)}`; });
const alexV = V((c) => { const H = 116;
  return `${water(c, H, 200, '#3E8FCF')}<path d='M120 200Q220 140 320 124T420 118V200z' fill='#E8D9B0' ${O}/>${line([180, 150], [410, 118], 8, 1, 0.4, (x, y, s, i) => tx(x, y, s, vblock(x, y, 26, 34 + (i % 3) * 8, ['#F6F2EA', '#E8D9B0', '#F2E6D0'][i % 3])), 0.85)}
<path d='M-20 140h130l10 20v40H-20z' fill='#C9B79A' ${O}/>${tx(50, 140, 1, `<rect x='20' y='100' width='60' height='40' fill='#D8C8A8' ${O}/><rect x='38' y='80' width='24' height='20' fill='#D8C8A8' ${O}/>${[24, 36, 48, 60, 72].map((x) => `<rect x='${x}' y='96' width='6' height='4' fill='#D8C8A8' ${o}/>`).join('')}`)}${vboat(160, 150, 0.8, '#FFFFFF')}`; });

export const REGIONS2 = {
  KR: [
    [/bibimbap|jeonju|kimchi jjigae|japchae|bulgogi|samgyeopsal|bossam|galbi|jajangmyeon/i, R(hanokV, 'warm', 'green', false, 'lantern', 'a Korean village')],
    [/pajeon|haemul|hoe|jjamppong|dakgangjeong|busan|eomuk|hotteok|ssiat/i, R(busanV, 'day', 'stone', true, 'lantern', 'Busan')],
    [/jeju|abalone|tangerine|heukdwaeji/i, R(jejuV, 'day', 'lush', true, 'blossom', 'Jeju Island')],
    [/tteokbokki|fried chicken|sundubu|army stew|budae|kimbap|ramyeon|corn dog|chimaek|kimchi|ssamjang|gimbap/i, R(seoulV, 'dusk', 'stone', false, 'lantern', 'Seoul')]
  ],
  VN: [
    [/pho|bun cha|banh mi|cha gio|goi cuon|spring roll|egg coffee|nuoc cham|bun thang/i, R(hanoiV, 'warm', 'stone', true, 'conehat', 'Hanoi')],
    [/cao l[aầ]u|mi quang|bun bo hue|hu tieu|white rose|banh bao|hoi an/i, R(hoianV, 'dusk', 'stone', true, 'lantern', 'Hoi An')],
    [/com tam|banh xeo|ca kho|bun bo nam bo|che |sugarcane|coconut|vietnamese iced coffee|hu tieu/i, R(mekongV, 'warm', 'lush', true, 'conehat', 'the Mekong Delta')],
    [/sapa|thang co|nuong|c[oơ]m lam|smoked/i, R(sapaV, 'day', 'lush', false, 'conehat', 'Sapa terraces')]
  ],
  TR: [
    [/doner|d[oö]ner|simit|baklava|balik ekmek|lentil|menemen|kumpir|pide|iskender|lahmacun/i, R(istanbulV, 'dusk', 'stone', true, 'teapot', 'Istanbul')],
    [/manti|testi|kebab|pottery|g[oö]zleme|gozleme/i, R(cappadociaV, 'warm', 'sand', false, 'teapot', 'Cappadocia')],
    [/imam bayildi|zeytinya[gğ]|hamsi|midye|fish|aegean|ot kavurma|enginar|meze/i, R(aegeanTRV, 'day', 'stone', true, 'olive', 'the Aegean coast')],
    [/kofte|k[oö]fte|adana|urfa|sac|tandir|anatolia|ayran|g[uü]ll[aâ]c/i, R(anatoliaV, 'sand', 'dry', false, 'teapot', 'Anatolia')]
  ],
  LB: [
    [/kibbeh|mujaddara|fattoush|tabbouleh|manakish|man[oô]uche|toum|labneh|cedar|baklava/i, R(beirutV, 'dusk', 'stone', true, 'olive', 'Beirut')],
    [/hummus|baba|shish|shawarma|kafta|kebab|arak|wine/i, R(bekaaV, 'warm', 'dry', false, 'olive', 'the Bekaa Valley')],
    [/mountain|cedars|kishk|fatayer|mouneh|zaatar|za'atar/i, R(cedarsV, 'day', 'green', false, 'olive', 'the Cedars of Lebanon')]
  ],
  BR: [
    [/moqueca|acaraj[eé]|vatap[aá]|bahia|dend[eê]|caruru|bobó|bobo/i, R(bahiaV, 'warm', 'beach', true, 'palm', 'Bahia')],
    [/a[cç]a[ií]|tacac[aá]|pirarucu|tucum|manioc|tapioca|jambu|amaz/i, R(amazonV, 'day', 'lush', false, 'parrot', 'the Amazon')],
    [/p[aã]o de queijo|coxinha|pastel|brigadeiro|pizza|mortadela|feijoada/i, R(saoPauloV, 'dusk', 'stone', false, 'coffee', 'São Paulo')],
    [/picanha|churrasco|farofa|vinagrete|chimarr[aã]o|gaucho|ga[uú]cho/i, R(gauchoV, 'day', 'green', false, 'cheese', 'the southern pampas')]
  ],
  PE: [
    [/ceviche|causa|tiradito|anticucho|chicha|picarones|pisco|lomo saltado|arroz con pollo/i, R(limaCoastV, 'day', 'beach', true, 'lemon', 'Lima')],
    [/ro[ck]oto|pachamanca|cuy|quinoa|ch[a-z]*pe|huanca[ií]na|ají de gallina|papa|olluco|chuño/i, R(andesV, 'day', 'green', false, 'corn', 'the Andes')],
    [/machu|cusco|inca|pollo a la brasa|trucha/i, R(machuPicchuV, 'warm', 'lush', false, 'chili', 'Machu Picchu')]
  ],
  MA: [
    [/tagine|couscous|pastilla|b[’']?stilla|harira|chebakia|mint tea|khobz|msemen|kefta|zaalouk|chermoula/i, R(marrakechV, 'warm', 'sand', false, 'teapot', 'Marrakech')],
    [/sardine|fish|essaouira|grilled|calamari|shrimp/i, R(essaouiraV, 'day', 'stone', true, 'lemon', 'Essaouira')],
    [/mechoui|desert|dates|berber|nomad/i, R(saharaV, 'sand', 'sand', false, 'camel', 'the Sahara')],
    [/chefchaouen|blue|goat cheese|rif|bissara/i, R(chefchaouenV, 'day', 'stone', false, 'teapot', 'Chefchaouen')]
  ],
  GB: [
    [/haggis|neeps|cullen skink|cranachan|scotch|porridge|shortbread|tablet|stovies/i, R(highlandsV, 'dusk', 'green', false, 'teacup', 'the Scottish Highlands')],
    [/pasty|cornish|clotted|fish and chips|scone|cream tea|stargazy/i, R(cornwallV, 'day', 'green', true, 'teacup', 'Cornwall')],
    [/sunday roast|yorkshire|shepherd|bangers|toad in the hole|lancashire|ploughman|cheddar|beef wellington|full english/i, R(cotswoldsV, 'warm', 'green', false, 'teacup', 'the Cotswolds')],
    [/sticky toffee|afternoon tea|gravy|mint sauce|trifle|crumble|london|eton|spotted dick/i, R(london2V, 'dusk', 'stone', false, 'teacup', 'London')]
  ],
  DE: [
    [/sp[aä]tzle|brezel|pretzel|schweinshaxe|weisswurst|obatzda|knödel|kn[oö]del|leberk[aä]se|bavaria/i, R(bavariaV, 'day', 'green', false, 'bread', 'Bavaria')],
    [/currywurst|d[oö]ner|berliner|buletten|eisbein|kartoffelpuffer|apfelstrudel/i, R(berlinV, 'dusk', 'stone', false, 'coffee', 'Berlin')],
    [/black forest|schwarzw[aä]lder|k[uü]ckucks|flammkuchen/i, R(blackForestV, 'day', 'lush', false, 'cheese', 'the Black Forest')],
    [/sauerbraten|rouladen|riesling|rhein|himmel|reibekuchen|sauerkraut|kartoffelsalat|bratwurst/i, R(rhineV, 'warm', 'green', false, 'bread', 'the Rhine valley')]
  ],
  AR: [
    [/asado|empanada|chimichurri|choripán|choripan|provoleta|locro|humita|pampa|parrilla|milanesa/i, R(pampasV, 'warm', 'green', false, 'chili', 'the Pampas')],
    [/medialunas|alfajor|dulce de leche|mate|facturas|buenos|submarino/i, R(buenosAiresV, 'dusk', 'stone', false, 'coffee', 'Buenos Aires')],
    [/cordero|lamb|patagonia|trucha|centolla/i, R(patagoniaV, 'day', 'snow', false, 'chili', 'Patagonia')]
  ],
  PT: [
    [/pastel de nata|bifana|bacalhau|caldo verde|francesinha|arroz de marisco|lisbon|ginja/i, R(lisbonV, 'warm', 'stone', true, 'coffee', 'Lisbon')],
    [/sardinha|polvo|cataplana|piri|algarve|peixe|seafood|gambas/i, R(algarveV, 'day', 'beach', true, 'lemon', 'the Algarve')],
    [/francesinha|tripas|porto|vinho verde|douro|port wine|cozido/i, R(portoV, 'dusk', 'green', true, 'bread', 'Porto')]
  ],
  ID: [
    [/nasi campur|babi guling|bebek betutu|lawar|sate lilit|bali|es cendol|tempeh|jaja/i, R(baliV, 'day', 'lush', false, 'palm', 'Bali')],
    [/gudeg|soto|bakso|gado|nasi goreng|mie goreng|martabak|sambal|bandung|yogya|jakarta/i, R(javaV, 'warm', 'lush', false, 'chili', 'Java')],
    [/rendang|padang|satay|sate padang|sumatra|sambal|pempek|mie aceh|aceh/i, R(sumatraV, 'warm', 'lush', true, 'chili', 'Sumatra')]
  ],
  PH: [
    [/sisig|halo-halo|lumpia|pancit|lechon|adobo|sinigang|kare|tapsilog|manila|fish ball/i, R(manilaV, 'dusk', 'stone', false, 'pineapple', 'Manila')],
    [/kinilaw|seafood|tinola|palawan|grilled fish|inihaw|crab|alimango/i, R(palawanV, 'day', 'beach', true, 'palm', 'Palawan')],
    [/bibingka|leche flan|puto|biko|suman|ube|bohol|kakanin|cebu|chocolate/i, R(chocolateHillsV, 'warm', 'lush', false, 'pineapple', 'Bohol')]
  ],
  NG: [
    [/jollof|suya|dodo|plantain|puff-puff|chin chin|akara|moi moi|lagos|ofada|egusi/i, R(lagosV, 'warm', 'stone', true, 'palm', 'Lagos')],
    [/pounded yam|efo riro|pepper soup|ogbono|okra|banga|oha|onugbu|bitterleaf/i, R(nigerV, 'day', 'lush', false, 'palm', 'the Niger Delta')],
    [/tuwo|miyan|kilishi|fura|masa|kunu|northern|kano/i, R(sahelV, 'sand', 'sand', false, 'camel', 'the north')]
  ],
  JM: [
    [/jerk|ackee|rice and peas|escovitch|bammy|fish|festival|gizzada|sorrel|port antonio/i, R(montegoBayV, 'day', 'beach', true, 'palm', 'Montego Bay')],
    [/curry goat|oxtail|patty|coffee|blue mountain|stew|cow foot|mannish/i, R(bluemtnV, 'warm', 'lush', false, 'palm', 'the Blue Mountains')]
  ],
  CU: [
    [/ropa vieja|cuban sandwich|picadillo|moros|vaca frita|tostones|pastelitos|croquetas|havana|mojito|flan/i, R(havanaV, 'warm', 'stone', true, 'palm', 'Havana')],
    [/lech[oó]n|yuca|mojo|tamal|tabaco|vi[nñ]ales|sofrito|frijoles/i, R(vinalesV, 'day', 'lush', false, 'palm', 'Viñales')],
    [/fish|seafood|lobster|langosta|varadero|beach|ceviche/i, R(varaderoV, 'day', 'beach', true, 'palm', 'Varadero')]
  ],
  AU: [
    [/pavlova|lamington|anzac|meat pie|sausage roll|fairy bread|flat white|chicken parm|sydney/i, R(sydneyV, 'day', 'stone', true, 'coffee', 'Sydney')],
    [/damper|vegemite|kangaroo|emu|bush|outback|witchetty|billy/i, R(outbackV, 'sand', 'red', false, 'cactus', 'the Outback')],
    [/barramundi|prawn|oyster|barra|reef|seafood|fish/i, R(reefV, 'day', 'beach', true, 'palm', 'the Queensland coast')]
  ],
  CA: [
    [/poutine|tourti[eè]re|montreal|bagel|smoked meat|pouding|pea soup|sugar pie|quebec|beavertail|caesar/i, R(quebecV, 'dusk', 'stone', false, 'bread', 'Quebec')],
    [/salmon|bannock|elk|bison|rocky|bc|vancouver|okanagan|nanaimo/i, R(rockiesV, 'day', 'green', false, 'pine', 'the Rocky Mountains')],
    [/butter tart|peameal|saskatoon|perogy|prairie|wheat|bread/i, R(prairieV, 'day', 'dry', false, 'corn', 'the Prairies')],
    [/lobster|chowder|maritime|donair|hodge|fish cakes|cod|bluenose|jiggs/i, R(maritimesV, 'day', 'green', true, 'lemon', 'the Maritimes')]
  ],
  RU: [
    [/borscht|pelmeni|stroganoff|blini|olivier|pirozhki|medovik|moscow|shchi|solyanka|golubtsy/i, R(moscowV, 'dusk', 'stone', false, 'teapot', 'Moscow')],
    [/herring|syrniki|petersburg|buckwheat|kasha|kvass|ukha/i, R(stPeteV, 'dusk', 'stone', true, 'teapot', 'St. Petersburg')],
    [/siberia|sibirsk|taiga|sturgeon|caviar|kulebyaka|stolichny/i, R(siberiaV, 'day', 'snow', false, 'teapot', 'Siberia')]
  ],
  PL: [
    [/pierogi|zurek|żurek|bigos|zapiekanka|obwarzanek|krakow|kielbasa|kiełbasa|barszcz|rosół|rosol|placki/i, R(krakowV, 'warm', 'green', false, 'bread', 'Kraków')],
    [/oscypek|g[oó]ral|zakopane|tatra|kwa[sś]nica|mountain|sheep cheese|moskol/i, R(tatrasV, 'day', 'green', false, 'cheese', 'the Tatra Mountains')],
    [/herring|[sś]led[zź]|baltic|fish|flounder|gda[nń]sk|smoked/i, R(balticV, 'day', 'beach', true, 'lemon', 'the Baltic coast')]
  ],
  SE: [
    [/meatballs|k[oö]ttbullar|gravlax|toast skagen|sm[oö]rg[aå]sbord|prinsessst[aå]rta|semla|kanelbulle|stockholm|kn[aä]ckebr[oö]d/i, R(stockholmV, 'warm', 'stone', true, 'coffee', 'Stockholm')],
    [/pyttipanna|raggmunk|[aä]rtsoppa|jansson|dalarna|falukorv|lingon|midsommar|k[aä]ldolmar/i, R(dalarnaV, 'day', 'green', false, 'bread', 'Dalarna')],
    [/reindeer|ren|lapland|surstr[oö]mming|arctic char|cloudberry|kiruna/i, R(laplandV, 'dusk', 'snow', false, 'lantern', 'Lapland')]
  ],
  IL: [
    [/shakshuka|falafel|hummus|sabich|jachnun|malawach|rugelach|bourekas|challah|jerusalem|kugel/i, R(jerusalemV, 'warm', 'sand', false, 'olive', 'Jerusalem')],
    [/israeli salad|shawarma|tel aviv|ptitim|fish|sea|grilled/i, R(telAvivV, 'day', 'beach', true, 'lemon', 'Tel Aviv')],
    [/labneh|desert|negev|bedouin|za'atar|zaatar|date|sabra/i, R(negevV, 'sand', 'sand', false, 'camel', 'the Negev')]
  ],
  IR: [
    [/chelo|kabab|tahdig|zereshk|polo|fesenjan|ghormeh|joojeh|baghali|isfahan|gaz|bastani|sholeh|faloodeh/i, R(isfahanV, 'warm', 'sand', false, 'teapot', 'Isfahan')],
    [/ash reshteh|persepolis|shiraz|kashke|kalam polo|abgoosht|dizi|haleem/i, R(persepolisV, 'sand', 'sand', false, 'teapot', 'Persepolis')],
    [/mirza|ghasemi|caspian|gilan|northern|rice|caviar|fish|sabzi polo|torshi/i, R(caspianV, 'day', 'lush', true, 'teapot', 'the Caspian coast')]
  ],
  ZA: [
    [/bobotie|bredie|malva|koeksister|melktert|cape malay|waterblommetjie|snoek|bunny chow/i, R(capeTownV, 'day', 'stone', true, 'lemon', 'Cape Town')],
    [/boerewors|braai|biltong|potjie|pap|chakalaka|vetkoek|safari|kudu|ostrich/i, R(safariV, 'warm', 'dry', false, 'chili', 'the bushveld')],
    [/wine|stellenbosch|paarl|franschhoek|cheese|pairing/i, R(winelandsV, 'warm', 'green', false, 'cheese', 'the Winelands')]
  ],
  CO: [
    [/bandeja|ajiaco|arepa|sancocho|buñuelo|bunuelo|pandebono|changua|lechona|bogot/i, R(medellinV, 'warm', 'green', false, 'coffee', 'Medellín')],
    [/coffee|caf[eé]|tamales|tolima|eje cafetero|paisa|chicha/i, R(coffeeAxisV, 'day', 'lush', false, 'coffee', 'the coffee region')],
    [/patacones|arroz con coco|ceviche|cazuela|pescado|cartagena|ca[nñ]|coconut|seafood|fried fish/i, R(cartagenaV, 'day', 'beach', true, 'palm', 'Cartagena')]
  ],
  EG: [
    [/koshari|kushari|ful medames|ta'ameya|molokhia|mahshi|fattah|hawawshi|kofta|om ali|basbousa|feteer|cairo/i, R(cairoV, 'warm', 'sand', false, 'teapot', 'Cairo')],
    [/fish|sayadeya|calamari|alexandria|seafood|shrimp|gambari/i, R(alexV, 'day', 'stone', true, 'lemon', 'Alexandria')],
    [/nile|duck|pigeon|hamam|aswan|luxor|sugarcane|qamar/i, R(nileV, 'warm', 'sand', false, 'camel', 'the Nile')]
  ]
};
