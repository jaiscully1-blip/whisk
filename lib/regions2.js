// Regional postcards, batch 2 (see lib/regions.js for how they're matched and drawn).
import { O, o, at, map, pine, cypress, palm, bush, mtn, hill, boat, house, cube, rows, sun, R } from './regions.js';

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
const reef = (x) => at(x, `<rect x='-104' y='96' width='208' height='54' fill='#4FC3D6' ${o}/>${wave(104)}${map([[-70, 128], [-30, 138], [20, 132], [64, 140], [90, 126]], ([d, y], i) => `<path d='M${d} ${y + 10}v-14M${d} ${y - 4}l-8-8M${d} ${y}l8-8' stroke='${['#E86A9A', '#F2A33A', '#B58AD0'][i % 3]}' stroke-width='4' stroke-linecap='round'/>`)}<g transform='translate(-20 112)'><ellipse cx='0' cy='0' rx='12' ry='7' fill='#F2A33A' ${o}/><path d='M12 0l8-6v12z' fill='#F2A33A' ${o}/><circle cx='-6' cy='-1' r='1.6' fill='#3B2C24'/></g>`);

// ---- Canada ----
const quebec = (x) => at(x, `<path d='M-104 150q10-50 60-56l60 0q36 8 44 56z' fill='#B7C6D6' ${O}/><rect x='-40' y='70' width='80' height='40' fill='#C9B79A' ${O}/>${map([-40, 0, 40].map((d) => d), (d) => `<rect x='${d - 8}' y='34' width='16' height='38' fill='#C9B79A' ${O}/><path d='M${d - 11} 36l11-22 11 22z' fill='#4F8E86' ${o}/>`)}<rect x='-104' y='140' width='208' height='10' fill='#6FAFD0' ${o}/>`);
const rockies = (x) => at(x, `${mtn(-60, 64, 100)}${mtn(10, 74, 124, '#9AAED0')}${mtn(84, 40, 76)}<rect x='-104' y='134' width='208' height='16' fill='#6FD0C0' ${o}/>${map([-90, -70, -46, 40, 66], (d, i) => pine(d, 1 + (i % 2) * 0.3, '#2F5E3A'))}`);
const prairie = (x) => at(x, `<path d='M-104 150q60-14 208-2v2z' fill='#E2C25A' ${O}/>${rows(-96, 96, 3, 126, '#C9A43E')}<rect x='24' y='72' width='26' height='78' fill='#E8E2D4' ${O}/><path d='M22 72q15-14 30 0z' fill='#B8AC92' ${O}/><rect x='54' y='90' width='20' height='60' fill='#E8E2D4' ${O}/><path d='M52 90q12-12 24 0z' fill='#B8AC92' ${O}/>${house(-60, 44, 26, '#C7463A', '#7A2E26')}`);
const maritimes = (x) => at(x, `<rect x='-104' y='132' width='208' height='18' fill='#4FA9D6' ${o}/><path d='M-104 132q40-30 90-24t88 24z' fill='#8CC56B' ${O}/>${map([-60, -20, 20], (d, i) => `<rect x='${d - 12}' y='104' width='24' height='28' fill='${['#E8735A', '#F2C14E', '#86B7D9'][i]}' ${O}/><path d='M${d - 15} 106l15-14 15 14z' fill='#5A5A66' ${o}/>`)}${boat(66, 140, '#D9452B', 1)}<path d='M54 136l-6-28' stroke='#3B2C24' stroke-width='2'/>`);

// ---- Russia ----
const moscow = (x) => at(x, `<rect x='-70' y='118' width='140' height='32' fill='#C0503A' ${O}/>${map([-52, -30, -8, 14, 36, 58], (d) => `<path d='M${d - 4} 118v-8h8v8' fill='#C0503A' ${o}/>`)}${map([[-10, 44, '#E2523B'], [-44, 74, '#2E8A8F'], [26, 70, '#F2C14E'], [54, 82, '#4F8E4A']], ([d, h, c], i) => `<rect x='${d - 10}' y='${118 - h * 0.6}' width='20' height='${h * 0.6}' fill='#E8DCC2' ${O}/><path d='M${d - 12} ${118 - h * 0.6}q12-${h * 0.5} 24 0z' fill='${c}' ${O}/><path d='M${d} ${118 - h * 0.6 - h * 0.35}v-10' stroke='#E2B33E' stroke-width='3'/>`)}`);
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
const jerusalem = (x) => at(x, `${hill(-104, 110, 80, '#E8D9B0')}<rect x='-70' y='100' width='140' height='38' fill='#E8D9B0' ${O}/>${dome(-6, 100, 26, '#E2B33E')}<rect x='-30' y='100' width='48' height='38' fill='#4F7EB0' ${O}/>${tower(60, 60, 14, '#E8D9B0')}<path d='M53 62l7-14 7 14z' fill='#C9B79A' ${o}/>${map([-56, 40, 52].map((d) => d), (d) => `<path d='M${d - 4} 138v-10a4 4 0 0 1 8 0v10z' fill='#8C6A4E'/>`)}`);
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

export const REGIONS2 = {
  KR: [
    [/bibimbap|jeonju|kimchi jjigae|japchae|bulgogi|samgyeopsal|bossam|galbi|jajangmyeon/i, R(hanok, 'warm', 'green', false, 'lantern', 'a Korean village')],
    [/pajeon|haemul|hoe|jjamppong|dakgangjeong|busan|eomuk|hotteok|ssiat/i, R(busan, 'day', 'stone', true, 'lantern', 'Busan')],
    [/jeju|abalone|tangerine|heukdwaeji/i, R(jeju, 'day', 'lush', true, 'blossom', 'Jeju Island')],
    [/tteokbokki|fried chicken|sundubu|army stew|budae|kimbap|ramyeon|corn dog|chimaek|kimchi|ssamjang|gimbap/i, R(seoul, 'dusk', 'stone', false, 'lantern', 'Seoul')]
  ],
  VN: [
    [/pho|bun cha|banh mi|cha gio|goi cuon|spring roll|egg coffee|nuoc cham|bun thang/i, R(hanoi, 'warm', 'stone', true, 'conehat', 'Hanoi')],
    [/cao l[aầ]u|mi quang|bun bo hue|hu tieu|white rose|banh bao|hoi an/i, R(hoian, 'dusk', 'stone', true, 'lantern', 'Hoi An')],
    [/com tam|banh xeo|ca kho|bun bo nam bo|che |sugarcane|coconut|vietnamese iced coffee|hu tieu/i, R(mekong, 'warm', 'lush', true, 'conehat', 'the Mekong Delta')],
    [/sapa|thang co|nuong|c[oơ]m lam|smoked/i, R(sapa, 'day', 'lush', false, 'conehat', 'Sapa terraces')]
  ],
  TR: [
    [/doner|d[oö]ner|simit|baklava|balik ekmek|lentil|menemen|kumpir|pide|iskender|lahmacun/i, R(istanbul, 'dusk', 'stone', true, 'teapot', 'Istanbul')],
    [/manti|testi|kebab|pottery|g[oö]zleme|gozleme/i, R(cappadocia, 'warm', 'sand', false, 'teapot', 'Cappadocia')],
    [/imam bayildi|zeytinya[gğ]|hamsi|midye|fish|aegean|ot kavurma|enginar|meze/i, R(aegeanTR, 'day', 'stone', true, 'olive', 'the Aegean coast')],
    [/kofte|k[oö]fte|adana|urfa|sac|tandir|anatolia|ayran|g[uü]ll[aâ]c/i, R(anatolia, 'sand', 'dry', false, 'teapot', 'Anatolia')]
  ],
  LB: [
    [/kibbeh|mujaddara|fattoush|tabbouleh|manakish|man[oô]uche|toum|labneh|cedar|baklava/i, R(beirut, 'dusk', 'stone', true, 'olive', 'Beirut')],
    [/hummus|baba|shish|shawarma|kafta|kebab|arak|wine/i, R(bekaa, 'warm', 'dry', false, 'olive', 'the Bekaa Valley')],
    [/mountain|cedars|kishk|fatayer|mouneh|zaatar|za'atar/i, R(cedars, 'day', 'green', false, 'olive', 'the Cedars of Lebanon')]
  ],
  BR: [
    [/moqueca|acaraj[eé]|vatap[aá]|bahia|dend[eê]|caruru|bobó|bobo/i, R(bahia, 'warm', 'beach', true, 'palm', 'Bahia')],
    [/a[cç]a[ií]|tacac[aá]|pirarucu|tucum|manioc|tapioca|jambu|amaz/i, R(amazon, 'day', 'lush', false, 'parrot', 'the Amazon')],
    [/p[aã]o de queijo|coxinha|pastel|brigadeiro|pizza|mortadela|feijoada/i, R(saoPaulo, 'dusk', 'stone', false, 'coffee', 'São Paulo')],
    [/picanha|churrasco|farofa|vinagrete|chimarr[aã]o|gaucho|ga[uú]cho/i, R(gaucho, 'day', 'green', false, 'cheese', 'the southern pampas')]
  ],
  PE: [
    [/ceviche|causa|tiradito|anticucho|chicha|picarones|pisco|lomo saltado|arroz con pollo/i, R(limaCoast, 'day', 'beach', true, 'lemon', 'Lima')],
    [/ro[ck]oto|pachamanca|cuy|quinoa|ch[a-z]*pe|huanca[ií]na|ají de gallina|papa|olluco|chuño/i, R(andes, 'day', 'green', false, 'corn', 'the Andes')],
    [/machu|cusco|inca|pollo a la brasa|trucha/i, R(machuPicchu, 'warm', 'lush', false, 'chili', 'Machu Picchu')]
  ],
  MA: [
    [/tagine|couscous|pastilla|b[’']?stilla|harira|chebakia|mint tea|khobz|msemen|kefta|zaalouk|chermoula/i, R(marrakech, 'warm', 'sand', false, 'teapot', 'Marrakech')],
    [/sardine|fish|essaouira|grilled|calamari|shrimp/i, R(essaouira, 'day', 'stone', true, 'lemon', 'Essaouira')],
    [/mechoui|desert|dates|berber|nomad/i, R(sahara, 'sand', 'sand', false, 'camel', 'the Sahara')],
    [/chefchaouen|blue|goat cheese|rif|bissara/i, R(chefchaouen, 'day', 'stone', false, 'teapot', 'Chefchaouen')]
  ],
  GB: [
    [/haggis|neeps|cullen skink|cranachan|scotch|porridge|shortbread|tablet|stovies/i, R(highlands, 'dusk', 'green', false, 'teacup', 'the Scottish Highlands')],
    [/pasty|cornish|clotted|fish and chips|scone|cream tea|stargazy/i, R(cornwall, 'day', 'green', true, 'teacup', 'Cornwall')],
    [/sunday roast|yorkshire|shepherd|bangers|toad in the hole|lancashire|ploughman|cheddar|beef wellington|full english/i, R(cotswolds, 'warm', 'green', false, 'teacup', 'the Cotswolds')],
    [/sticky toffee|afternoon tea|gravy|mint sauce|trifle|crumble|london|eton|spotted dick/i, R(london2, 'dusk', 'stone', false, 'teacup', 'London')]
  ],
  DE: [
    [/sp[aä]tzle|brezel|pretzel|schweinshaxe|weisswurst|obatzda|knödel|kn[oö]del|leberk[aä]se|bavaria/i, R(bavaria, 'day', 'green', false, 'bread', 'Bavaria')],
    [/currywurst|d[oö]ner|berliner|buletten|eisbein|kartoffelpuffer|apfelstrudel/i, R(berlin, 'dusk', 'stone', false, 'coffee', 'Berlin')],
    [/black forest|schwarzw[aä]lder|k[uü]ckucks|flammkuchen/i, R(blackForest, 'day', 'lush', false, 'cheese', 'the Black Forest')],
    [/sauerbraten|rouladen|riesling|rhein|himmel|reibekuchen|sauerkraut|kartoffelsalat|bratwurst/i, R(rhine, 'warm', 'green', false, 'bread', 'the Rhine valley')]
  ],
  AR: [
    [/asado|empanada|chimichurri|choripán|choripan|provoleta|locro|humita|pampa|parrilla|milanesa/i, R(pampas, 'warm', 'green', false, 'chili', 'the Pampas')],
    [/medialunas|alfajor|dulce de leche|mate|facturas|buenos|submarino/i, R(buenosAires, 'dusk', 'stone', false, 'coffee', 'Buenos Aires')],
    [/cordero|lamb|patagonia|trucha|centolla/i, R(patagonia, 'day', 'snow', false, 'chili', 'Patagonia')]
  ],
  PT: [
    [/pastel de nata|bifana|bacalhau|caldo verde|francesinha|arroz de marisco|lisbon|ginja/i, R(lisbon, 'warm', 'stone', true, 'coffee', 'Lisbon')],
    [/sardinha|polvo|cataplana|piri|algarve|peixe|seafood|gambas/i, R(algarve, 'day', 'beach', true, 'lemon', 'the Algarve')],
    [/francesinha|tripas|porto|vinho verde|douro|port wine|cozido/i, R(porto, 'dusk', 'green', true, 'bread', 'Porto')]
  ],
  ID: [
    [/nasi campur|babi guling|bebek betutu|lawar|sate lilit|bali|es cendol|tempeh|jaja/i, R(bali, 'day', 'lush', false, 'palm', 'Bali')],
    [/gudeg|soto|bakso|gado|nasi goreng|mie goreng|martabak|sambal|bandung|yogya|jakarta/i, R(java, 'warm', 'lush', false, 'chili', 'Java')],
    [/rendang|padang|satay|sate padang|sumatra|sambal|pempek|mie aceh|aceh/i, R(sumatra, 'warm', 'lush', true, 'chili', 'Sumatra')]
  ],
  PH: [
    [/sisig|halo-halo|lumpia|pancit|lechon|adobo|sinigang|kare|tapsilog|manila|fish ball/i, R(manila, 'dusk', 'stone', false, 'pineapple', 'Manila')],
    [/kinilaw|seafood|tinola|palawan|grilled fish|inihaw|crab|alimango/i, R(palawan, 'day', 'beach', true, 'palm', 'Palawan')],
    [/bibingka|leche flan|puto|biko|suman|ube|bohol|kakanin|cebu|chocolate/i, R(chocolateHills, 'warm', 'lush', false, 'pineapple', 'Bohol')]
  ],
  NG: [
    [/jollof|suya|dodo|plantain|puff-puff|chin chin|akara|moi moi|lagos|ofada|egusi/i, R(lagos, 'warm', 'stone', true, 'palm', 'Lagos')],
    [/pounded yam|efo riro|pepper soup|ogbono|okra|banga|oha|onugbu|bitterleaf/i, R(niger, 'day', 'lush', false, 'palm', 'the Niger Delta')],
    [/tuwo|miyan|kilishi|fura|masa|kunu|northern|kano/i, R(sahel, 'sand', 'sand', false, 'camel', 'the north')]
  ],
  JM: [
    [/jerk|ackee|rice and peas|escovitch|bammy|fish|festival|gizzada|sorrel|port antonio/i, R(montegoBay, 'day', 'beach', true, 'palm', 'Montego Bay')],
    [/curry goat|oxtail|patty|coffee|blue mountain|stew|cow foot|mannish/i, R(bluemtn, 'warm', 'lush', false, 'palm', 'the Blue Mountains')]
  ],
  CU: [
    [/ropa vieja|cuban sandwich|picadillo|moros|vaca frita|tostones|pastelitos|croquetas|havana|mojito|flan/i, R(havana, 'warm', 'stone', true, 'palm', 'Havana')],
    [/lech[oó]n|yuca|mojo|tamal|tabaco|vi[nñ]ales|sofrito|frijoles/i, R(vinales, 'day', 'lush', false, 'palm', 'Viñales')],
    [/fish|seafood|lobster|langosta|varadero|beach|ceviche/i, R(varadero, 'day', 'beach', true, 'palm', 'Varadero')]
  ],
  AU: [
    [/pavlova|lamington|anzac|meat pie|sausage roll|fairy bread|flat white|chicken parm|sydney/i, R(sydney, 'day', 'stone', true, 'coffee', 'Sydney')],
    [/damper|vegemite|kangaroo|emu|bush|outback|witchetty|billy/i, R(outback, 'sand', 'red', false, 'cactus', 'the Outback')],
    [/barramundi|prawn|oyster|barra|reef|seafood|fish/i, R(reef, 'day', 'beach', true, 'palm', 'the Great Barrier Reef')]
  ],
  CA: [
    [/poutine|tourti[eè]re|montreal|bagel|smoked meat|pouding|pea soup|sugar pie|quebec|beavertail|caesar/i, R(quebec, 'dusk', 'stone', false, 'bread', 'Quebec')],
    [/salmon|bannock|elk|bison|rocky|bc|vancouver|okanagan|nanaimo/i, R(rockies, 'day', 'green', false, 'pine', 'the Rocky Mountains')],
    [/butter tart|peameal|saskatoon|perogy|prairie|wheat|bread/i, R(prairie, 'day', 'dry', false, 'corn', 'the Prairies')],
    [/lobster|chowder|maritime|donair|hodge|fish cakes|cod|bluenose|jiggs/i, R(maritimes, 'day', 'green', true, 'lemon', 'the Maritimes')]
  ],
  RU: [
    [/borscht|pelmeni|stroganoff|blini|olivier|pirozhki|medovik|moscow|shchi|solyanka|golubtsy/i, R(moscow, 'dusk', 'stone', false, 'teapot', 'Moscow')],
    [/herring|syrniki|petersburg|buckwheat|kasha|kvass|ukha/i, R(stPete, 'dusk', 'stone', true, 'teapot', 'St. Petersburg')],
    [/siberia|sibirsk|taiga|sturgeon|caviar|kulebyaka|stolichny/i, R(siberia, 'day', 'snow', false, 'teapot', 'Siberia')]
  ],
  PL: [
    [/pierogi|zurek|żurek|bigos|zapiekanka|obwarzanek|krakow|kielbasa|kiełbasa|barszcz|rosół|rosol|placki/i, R(krakow, 'warm', 'green', false, 'bread', 'Kraków')],
    [/oscypek|g[oó]ral|zakopane|tatra|kwa[sś]nica|mountain|sheep cheese|moskol/i, R(tatras, 'day', 'green', false, 'cheese', 'the Tatra Mountains')],
    [/herring|[sś]led[zź]|baltic|fish|flounder|gda[nń]sk|smoked/i, R(baltic, 'day', 'beach', true, 'lemon', 'the Baltic coast')]
  ],
  SE: [
    [/meatballs|k[oö]ttbullar|gravlax|toast skagen|sm[oö]rg[aå]sbord|prinsessst[aå]rta|semla|kanelbulle|stockholm|kn[aä]ckebr[oö]d/i, R(stockholm, 'warm', 'stone', true, 'coffee', 'Stockholm')],
    [/pyttipanna|raggmunk|[aä]rtsoppa|jansson|dalarna|falukorv|lingon|midsommar|k[aä]ldolmar/i, R(dalarna, 'day', 'green', false, 'bread', 'Dalarna')],
    [/reindeer|ren|lapland|surstr[oö]mming|arctic char|cloudberry|kiruna/i, R(lapland, 'dusk', 'snow', false, 'lantern', 'Lapland')]
  ],
  IL: [
    [/shakshuka|falafel|hummus|sabich|jachnun|malawach|rugelach|bourekas|challah|jerusalem|kugel/i, R(jerusalem, 'warm', 'sand', false, 'olive', 'Jerusalem')],
    [/israeli salad|shawarma|tel aviv|ptitim|fish|sea|grilled/i, R(telAviv, 'day', 'beach', true, 'lemon', 'Tel Aviv')],
    [/labneh|desert|negev|bedouin|za'atar|zaatar|date|sabra/i, R(negev, 'sand', 'sand', false, 'camel', 'the Negev')]
  ],
  IR: [
    [/chelo|kabab|tahdig|zereshk|polo|fesenjan|ghormeh|joojeh|baghali|isfahan|gaz|bastani|sholeh|faloodeh/i, R(isfahan, 'warm', 'sand', false, 'teapot', 'Isfahan')],
    [/ash reshteh|persepolis|shiraz|kashke|kalam polo|abgoosht|dizi|haleem/i, R(persepolis, 'sand', 'sand', false, 'teapot', 'Persepolis')],
    [/mirza|ghasemi|caspian|gilan|northern|rice|caviar|fish|sabzi polo|torshi/i, R(caspian, 'day', 'lush', true, 'teapot', 'the Caspian coast')]
  ],
  ZA: [
    [/bobotie|bredie|malva|koeksister|melktert|cape malay|waterblommetjie|snoek|bunny chow/i, R(capeTown, 'day', 'stone', true, 'lemon', 'Cape Town')],
    [/boerewors|braai|biltong|potjie|pap|chakalaka|vetkoek|safari|kudu|ostrich/i, R(safari, 'warm', 'dry', false, 'chili', 'the bushveld')],
    [/wine|stellenbosch|paarl|franschhoek|cheese|pairing/i, R(winelands, 'warm', 'green', false, 'cheese', 'the Winelands')]
  ],
  CO: [
    [/bandeja|ajiaco|arepa|sancocho|buñuelo|bunuelo|pandebono|changua|lechona|bogot/i, R(medellin, 'warm', 'green', false, 'coffee', 'Medellín')],
    [/coffee|caf[eé]|tamales|tolima|eje cafetero|paisa|chicha/i, R(coffeeAxis, 'day', 'lush', false, 'coffee', 'the coffee region')],
    [/patacones|arroz con coco|ceviche|cazuela|pescado|cartagena|ca[nñ]|coconut|seafood|fried fish/i, R(cartagena, 'day', 'beach', true, 'palm', 'Cartagena')]
  ],
  EG: [
    [/koshari|kushari|ful medames|ta'ameya|molokhia|mahshi|fattah|hawawshi|kofta|om ali|basbousa|feteer|cairo/i, R(cairo, 'warm', 'sand', false, 'teapot', 'Cairo')],
    [/fish|sayadeya|calamari|alexandria|seafood|shrimp|gambari/i, R(alex, 'day', 'stone', true, 'lemon', 'Alexandria')],
    [/nile|duck|pigeon|hamam|aswan|luxor|sugarcane|qamar/i, R(nile, 'warm', 'sand', false, 'camel', 'the Nile')]
  ]
};
