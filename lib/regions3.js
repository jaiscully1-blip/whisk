// Regional postcards, batch 3: the other countries. Each country gets 2-3 places drawn from a shared set of landscape
// scenes (mountains, coast, desert, old town, highlands …). A dish picks its place by what it is (seafood → the coast,
// pastry/street food → the city, stews and meat → the countryside); anything else rotates between the country's places
// so a country's postcards aren't all the same. Same drawing rules as lib/regions.js.
import { O, o, at, map, pine, cypress, palm, bush, mtn, hill, boat, house, cube, rows, R } from './regions.js';
import { tower, dome, wave, cow, dune } from './regions2.js';
import { V, INK, hz, tx, lerp, recede, sil, hills, range, land, water, foam, fog, ribbon, rows as vrows, line, pine as vpine, cypress as vcyp, palm as vpalm, bush as vbush, tree as vtree, boat as vboat, house as vhouse, block as vblock, grass, skyline as vskyline, minaret, cow as vcow, camel, llama, horse, elephant, acacia, terraces as vterraces, frontShore, birds, put } from './art/vista.js';

import { fjordV, harborV } from './art/places.js';
const spire = (x, h, w, c, r) => `<rect x='${x - w / 2}' y='${150 - h}' width='${w}' height='${h}' fill='${c}' ${O}/><path d='M${x - w / 2 - 3} ${152 - h}l${w / 2 + 3} -${w * 1.8} ${w / 2 + 3} ${w * 1.8}z' fill='${r}' ${O}/>`;

const skyline = (x) => at(x, `${map([[-84, 56], [-62, 82], [-38, 64], [-14, 98], [12, 70], [38, 90], [64, 60], [88, 76]], ([d, h], i) => `${tower(d, h, 22, i % 2 ? '#9AB0C8' : '#B7C6D6')}${map([0, 1, 2, 3], (r) => `<path d='M${d - 6} ${150 - h + 10 + r * 12}h12' stroke='#FFF3C4' stroke-width='2.6'/>`)}`)}`);
const oldTown = (x) => at(x, `${map([[-78, 54, '#F2C14E'], [-48, 66, '#E8735A'], [-18, 52, '#F4D2D9'], [14, 70, '#86B7D9'], [46, 56, '#F6E6A8'], [78, 64, '#E8735A']], ([d, h, c]) => `<rect x='${d - 16}' y='${150 - h}' width='32' height='${h}' fill='${c}' ${O}/><path d='M${d - 19} ${152 - h}l19 -14 19 14z' fill='#B5452E' ${o}/><rect x='${d - 4}' y='${150 - h * 0.45}' width='8' height='${h * 0.45}' fill='#6B4A2B' ${o}/>`)}${spire(0, 92, 16, '#E8DCC2', '#4F5E8A')}`);
const windmills = (x) => at(x, `<path d='M-104 150q60-12 208-2v2z' fill='#9CCF6A' ${O}/>${map([0, 1, 2], (i) => `<path d='M-96 ${140 - i * 6}h192' stroke='${['#E86A9A', '#F2C14E', '#E2523B'][i]}' stroke-width='6' stroke-dasharray='6 4'/>`)}${map([[-40, 1], [46, 0.8]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><path d='M-16 0l6-56h20l6 56z' fill='#E8DCC2' ${O}/><path d='M-14-56h28l-14-16z' fill='#8A5A34' ${O}/><g transform='translate(0 -58)'><path d='M0 0L-38-30M0 0L38 30M0 0L30-38M0 0L-30 38' stroke='#3B2C24' stroke-width='4' stroke-linecap='round'/><path d='M0 0L-38-30l-6 6zM0 0L38 30l6-6z' fill='#FFFFFF' ${o}/></g></g>`)}<rect x='-104' y='144' width='208' height='6' fill='#6FAFD0' ${o}/>`);
const fjord = (x) => at(x, `${mtn(-70, 60, 100, '#7E8EA8', true)}${mtn(70, 64, 110, '#8E9EB8', true)}<path d='M-20 150L0 70 20 150z' fill='#6FAFD0' ${o}/><rect x='-104' y='136' width='208' height='14' fill='#4F9AB0' ${o}/>${map([-88, -72, 76, 92], (d, i) => `<rect x='${d - 8}' y='122' width='16' height='14' fill='${['#B5452E', '#F2C14E', '#B5452E', '#E8DCC2'][i]}' ${o}/><path d='M${d - 10} 124l10-9 10 9z' fill='#3B3B46' ${o}/>`)}${boat(0, 144, '#D9452B', 0.9)}`);
const volcano = (x) => at(x, `<path d='M-104 150l78-92q26-10 52 0l78 92z' fill='#6E6A76' ${O}/><path d='M-26 58q26-10 52 0l10 14-12-4-10 8-8-8-10 8-8-8-12 4z' fill='#FFFFFF' ${O}/><path d='M-8 54q-8-16 4-26 6-12 16-6' stroke='#C9C3BE' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M-104 150q50-14 110-8t98 8z' fill='#4A4650' ${O}/><path d='M40 120q6 6 14 0' stroke='#E8F2F8' stroke-width='3' fill='none'/>${map([-84, 92], (d) => `<path d='M${d - 10} 150l10-22 10 22z' fill='#9CCF6A' ${o}/>`)}`);
const castle = (x) => at(x, `${hill(-104, 110, 78, '#8CC56B')}<rect x='-46' y='84' width='92' height='46' fill='#D9C7A3' ${O}/>${map([-46, 46], (d) => `<rect x='${d - 11}' y='60' width='22' height='70' fill='#D9C7A3' ${O}/><path d='M${d - 14} 62l14-26 14 26z' fill='#5A6E9A' ${O}/>`)}<rect x='-12' y='54' width='24' height='76' fill='#D9C7A3' ${O}/><path d='M-15 56l15-30 15 30z' fill='#C0503A' ${O}/><path d='M-8 130v-18a8 8 0 0 1 16 0v18z' fill='#6B4A2B' ${o}/>${map([-26, 26], (d) => `<rect x='${d - 3}' y='94' width='6' height='10' fill='#6E8FA8' ${o}/>`)}`);
const mosqueScene = (x) => at(x, `<rect x='-60' y='116' width='120' height='34' fill='#F2E6D0' ${O}/>${dome(0, 116, 34, '#2E8A8F')}${map([-62, 62], (d) => `<rect x='${d - 5}' y='54' width='10' height='96' fill='#F6EEDF' ${O}/><path d='M${d - 7} 56q7-20 14 0z' fill='#2E8A8F' ${o}/>`)}${map([-30, 30], (d) => dome(d, 116, 14, '#7FB8B0'))}<path d='M0 82v-14' stroke='#E2B33E' stroke-width='3'/>${map([-22, 0, 22], (d) => `<path d='M${d - 6} 150v-14a6 6 0 0 1 12 0v14z' fill='#6B4A2B' ${o}/>`)}`);
const stupa = (x) => at(x, `<rect x='-40' y='130' width='80' height='20' fill='#F2E2C4' ${O}/>${dome(0, 130, 36, '#F2C14E')}<rect x='-8' y='70' width='16' height='20' fill='#F2C14E' ${O}/><path d='M-8 70h16l-8-30z' fill='#E2B33E' ${O}/><path d='M0 40v-14' stroke='#E2B33E' stroke-width='3'/>${map([-84, -64, 66, 88], (d) => palm(d, 0.9))}${map([-70, 70], (d) => `<path d='M${d - 6} 150l6-30 6 30z' fill='#F2C14E' ${o}/>`)}`);
const beach = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-104 150q50-14 110-8t98 8z' fill='#F6E6BF' ${O}/>${palm(-70, 1.1)}${palm(-42, 0.85)}${palm(76, 1)}${boat(8, 138, '#E8735A')}${wave(134)}`);
const jungle = (x) => at(x, `<rect x='-104' y='126' width='208' height='24' fill='#7A8A4E' ${o}/>${map([-90, -66, -42, -18, 40, 64, 88], (d, i) => `<g transform='translate(${d} 128)'><path d='M0 0v-${44 + (i % 3) * 12}' stroke='#6B4A2B' stroke-width='5'/><circle cx='0' cy='-${54 + (i % 3) * 12}' r='${18 + (i % 2) * 4}' fill='${['#3F7E3A', '#4F9A4A'][i % 2]}' ${O}/></g>`)}<path d='M-14 134q22 8 40 0l-6 6q-16 6-28 0z' fill='#8A5A34' ${O}/>`);
const savanna = (x) => at(x, `${dune('#E8C070')}<g transform='translate(-50 150)'><path d='M0 0q-6-30 0-52M0-52q-26-6-34 8M0-52q26-6 34 8' stroke='#6B4A2B' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M-34-44q34-24 68 0-18 6-34 4t-34-4z' fill='#6E8F3E' ${O}/></g><g transform='translate(38 150) scale(1.1)'><ellipse cx='0' cy='-20' rx='20' ry='14' fill='#9AA0A8' ${O}/><circle cx='22' cy='-26' r='9' fill='#9AA0A8' ${O}/><path d='M28-22q8 6 4 18' stroke='#9AA0A8' stroke-width='5' fill='none' stroke-linecap='round'/><ellipse cx='14' cy='-24' rx='6' ry='8' fill='#B8BEC6' ${o}/><path d='M-12-8v10M-2-8v10M8-8v10M16-8v10' stroke='#3B2C24' stroke-width='4' stroke-linecap='round'/><circle cx='25' cy='-28' r='1.4' fill='#3B2C24'/></g>`);
const desertScene = (x) => at(x, `${dune('#E2B66B')}<path d='M-104 150q70-50 140-14t72 14z' fill='#D9A877' ${O}/>${map([-30, -8, 14], (d) => `<g transform='translate(${d} 138) scale(0.9)'><ellipse cx='0' cy='-14' rx='13' ry='8' fill='#C99A63' ${o}/><path d='M12-18q6-8 10-18' stroke='#C99A63' stroke-width='5' stroke-linecap='round' fill='none'/><path d='M-8-8v10M8-8v10' stroke='#3B2C24' stroke-width='3'/></g>`)}${palm(-86, 0.8)}${palm(94, 0.8)}`);
const terraces = (x) => at(x, `${map([0, 1, 2], (i) => `<path d='M-104 ${150 - i * 14}q60-${60 - i * 8} 208 ${-4 + i * 4}v${14 + i * 14}h-208z' fill='${['#9CCF6A', '#7FBF6A', '#5E9F4F'][i]}' ${O}/>`)}${map([0, 1, 2, 3], (i) => `<path d='M-96 ${130 - i * 12}q90-${22 - i * 2} 190 -${6 + i * 3}' fill='none' stroke='#E8F2B0' stroke-width='3'/>`)}${house(-60, 30, 22, '#C99A63', '#8A5A34')}${palm(80, 0.9)}`);
const plains = (x) => at(x, `<path d='M-104 150q60-26 208-8v8z' fill='#B9C76A' ${O}/>${rows(-96, 96, 3, 122, '#9CAE50')}${house(-50, 40, 26, '#E8DCC2', '#B5452E')}${map([34, 56, 78], (d) => `<path d='M${d} 150v-28M${d} 134q-8-4-8-12M${d} 130q8-4 8-12' stroke='#6E8F3E' stroke-width='3' fill='none'/>`)}${cow(-8)}`);
const lakeMtn = (x) => at(x, `${mtn(-40, 70, 100)}${mtn(50, 64, 80, '#9AAED0')}<rect x='-104' y='130' width='208' height='20' fill='#5FA8C8' ${o}/>${map([-86, -64, 76, 94], (d, i) => pine(d, 1 + (i % 2) * 0.25, '#2F5E3A'))}${boat(0, 142, '#E8735A', 0.8)}`);
const vineyard = (x) => at(x, `<path d='M-104 150q50-50 110-44t104 20v24z' fill='#9CBF5E' ${O}/>${map([0, 1, 2, 3, 4, 5], (i) => `<path d='M${-92 + i * 30} 150l${10 + i * 2} -${30 - i * 2}' stroke='#5E7F34' stroke-width='4' stroke-linecap='round'/>`)}${house(40, 44, 28, '#E8DCC2', '#C0503A')}${map([-70, 70, 92], (d) => `<circle cx='${d}' cy='126' r='4' fill='#6B2A5A' ${o}/>`)}`);
const snowForest = (x) => at(x, `<path d='M-104 150q60-16 208-4v4z' fill='#FFFFFF' ${O}/>${map([-90, -66, -42, 50, 76, 98], (d, i) => pine(d, 1.1 + (i % 3) * 0.25, '#2F5E3A'))}<rect x='-14' y='112' width='34' height='30' fill='#B07A48' ${O}/><path d='M-22 114l25-20 25 20z' fill='#FFFFFF' ${O}/>`);
const islandHut = (x) => at(x, `<rect x='-104' y='128' width='208' height='22' fill='#4FC3D6' ${o}/><path d='M-60 128q10-22 60-22t60 22z' fill='#F6E6BF' ${O}/>${palm(-30, 1.2)}${palm(30, 1)}<path d='M-14 118h30l-6-14h-18z' fill='#C99A63' ${O}/><path d='M-18 106l24-14 24 14z' fill='#8A5A34' ${O}/>${boat(-86, 140, '#E8735A', 0.9)}${boat(88, 142, '#F2C14E', 0.8)}`);
const canal = (x) => at(x, `<rect x='-104' y='134' width='208' height='16' fill='#6FAFD0' ${o}/>${map([[-78, 54, '#E8735A'], [-48, 66, '#F2C14E'], [-18, 52, '#86B7D9'], [18, 70, '#F4D2D9'], [50, 56, '#E8DCC2'], [80, 62, '#E8735A']], ([d, h, c]) => `<rect x='${d - 15}' y='${134 - h}' width='30' height='${h}' fill='${c}' ${O}/><path d='M${d - 17} ${136 - h}h34l-6 -10h-22z' fill='#5A5A66' ${o}/>`)}${boat(0, 144, '#3B2C24', 0.9)}`);
const mesa = (x) => at(x, `${dune('#D9845A')}${map([[-60, 90], [10, 110], [70, 80]], ([d, h]) => `<path d='M${d - 30} 150l6-${h} 48 0 6 ${h}z' fill='#C7633A' ${O}/><path d='M${d - 24} ${150 - h * 0.4}h36M${d - 26} ${150 - h * 0.7}h40' stroke='#9C4A28' stroke-width='3'/>`)}`);
const steppe = (x) => at(x, `<path d='M-104 150q60-14 208-2v2z' fill='#C9C06A' ${O}/>${map([-50, 30], (d) => `<ellipse cx='${d}' cy='128' rx='30' ry='22' fill='#F6EEDF' ${O}/><rect x='${d - 4}' y='128' width='8' height='22' fill='#6B4A2B' ${o}/><path d='M${d - 30} 128q30-30 60 0' fill='none' stroke='#3B2C24' stroke-width='1.6'/>`)}${map([[-90, 0.7], [84, 0.8]], ([d, s]) => `<g transform='translate(${d} 150) scale(${s})'><rect x='-14' y='-22' width='28' height='14' rx='5' fill='#F2E9D8' ${o}/><circle cx='-12' cy='-26' r='5' fill='#F2E9D8' ${o}/><path d='M-8-8v8M8-8v8' stroke='#3B2C24' stroke-width='3'/></g>`)}${mtn(0, 60, 50, '#9AAFC6', true)}`);

const peaks = (x) => at(x, `${mtn(-64, 64, 96, '#8E7AA0')}${mtn(0, 74, 124, '#9A86AE')}${mtn(70, 50, 84, '#8E7AA0')}<path d='M-104 150q60-16 208-4v4z' fill='#B9C76A' ${O}/>${map([-88, -66, 80, 98], (d, i) => pine(d, 0.9 + (i % 2) * 0.25, '#3F6E3A'))}${house(-20, 30, 20, '#E8C99A', '#8A5A34')}`);
const saltflat = (x) => at(x, `<path d='M-104 150q60-12 208-2v2z' fill='#F2F6F8' ${O}/><path d='M-104 128q104-10 208 0v22h-208z' fill='#E8EEF2' ${O}/>${map([0, 1, 2, 3, 4], (i) => `<path d='M${-80 + i * 40} 140l14 8M${-70 + i * 40} 134l12 6' stroke='#BFCAD2' stroke-width='2'/>`)}${mtn(-60, 50, 50, '#9AAFC6', false)}${mtn(50, 60, 64, '#8E9EB8', true)}<g transform='translate(-10 150) scale(0.9)'><rect x='-14' y='-20' width='28' height='12' rx='3' fill='#E8735A' ${o}/><circle cx='-8' cy='-6' r='4' fill='#3B2C24'/><circle cx='8' cy='-6' r='4' fill='#3B2C24'/></g>`);
const waterfall = (x) => at(x, `<rect x='-104' y='120' width='208' height='30' fill='#6FD0C0' ${o}/><path d='M-60 150V60h120v90' fill='#8E9EA8' ${O}/><path d='M-40 60h80v60h-80z' fill='#E8F6FA' ${o}/>${map([-30, -10, 10, 30], (d) => `<path d='M${d} 62v56' stroke='#FFFFFF' stroke-width='5' stroke-linecap='round'/>`)}<ellipse cx='0' cy='122' rx='44' ry='8' fill='#FFFFFF' opacity='.85'/>${map([-86, -66, 66, 88], (d, i) => `<g transform='translate(${d} 130)'><path d='M0 0v-${36 + (i % 2) * 12}' stroke='#6B4A2B' stroke-width='5'/><circle cx='0' cy='-${46 + (i % 2) * 12}' r='16' fill='#3F7E3A' ${O}/></g>`)}`);
// ---- the shared scenes as whole views in perspective (lib/art/vista.js). c.seed (from the place name) varies
// colours and spacing a little, so two countries sharing a scene don't get the identical picture ----
const pick = (c, arr, k = 0) => arr[((c.seed || 0) + k) % arr.length];
const rnd = (c, k) => (((c.seed || 1) * 9301 + 49297 * (k + 1)) % 233280) / 233280;
const farH = (c, H, col = '#8FB07A', t = 0.5, amp = 12) => hills(c, [[-20, H - amp * 0.4], [70, H - amp * (0.6 + rnd(c, 1) * 0.6)], [160, H - amp * 0.3], [250, H - amp * (0.7 + rnd(c, 2) * 0.6)], [330, H - amp * 0.5], [420, H - amp]], col, t, false, H + 4);
const fl = (c, y = 128, col) => land(c, [[-20, y + 2], [120, y - 2], [260, y + 1], [420, y - 2]], col || grass(c));
const PAL = ['#F2C14E', '#E8735A', '#86B7D9', '#F4D2D9', '#9CC86A', '#F6E6A8', '#4FB3A6', '#E86A9A'];

const peaksV = V((c) => { const H = 122; const col = pick(c, ['#8E7AA0', '#8A9AB8', '#7E8EA0', '#9A8A9A']);
  return `${range(c, H - 4, [[40, 70, 70], [170, 92, 90], [300, 80, 90], [420, 66, 70]], '#B7C4D8', 0.45)}${range(c, H, [[-10, 66, 80], [110, 100 + rnd(c, 3) * 14, 90], [250, 78, 90], [370, 88, 80]], col, 0.12, { ink: true, cap: 72 })}
${land(c, [[-20, 146], [80, 132], [220, 138], [420, 130]], '#B9C76A')}${ribbon([[300, 212, 50], [270, 170, 22], [250, 146, 8], [240, 136, 3]], '#D9C9A0', false)}${tx(90, 142, 1, vhouse(90, 142, 40, 24, '#E8DCC2', pick(c, ['#B5452E', '#5A6B7E', '#8A5A3A'], 1)))}${line([20, 156], [180, 136], 4, 1.1, 0.5, (x, y, s) => vpine(x, y, s, '#3F6E3A'))}`; });
const saltflatV = V((c) => { const H = 120;
  return `${range(c, H, [[60, 40, 100], [240, 54, 120], [400, 44, 90]], '#9A8AA8', 0.4, { snow: true, cap: 40 })}${land(c, [[-20, H + 2], [420, H + 2]], '#F2F6F8')}<path d='M-20 ${H + 2}H420V200H-20z' fill='#E8EEF2'/>
${[0, 1, 2, 3, 4, 5].map((i) => { const t = recede(6, 0.7)[5 - i]; const y = lerp(196, H + 6, t); return `<path d='M${-20} ${y}L${420} ${y}' stroke='#CFD8DE' stroke-width='${lerp(2, 0.6, t)}'/>`; }).join('')}${vrows(c, 200, H, H + 2, [-200, -60, 80, 200, 320, 460, 600], '#CFD8DE', 1.6)}
<path d='M60 ${H + 6}L240 ${H + 40} 400 ${H + 6}' fill='#9A8AA8' opacity='.15'/>${tx(130, 150, 1, `<rect x='96' y='130' width='60' height='18' rx='4' fill='${pick(c, ['#E74C3C', '#2F6DB5', '#F2C14E'])}' ${O}/><path d='M106 130l8-12h34l6 12' fill='#BFE3F5' ${o}/><circle cx='110' cy='150' r='6' fill='${INK}'/><circle cx='146' cy='150' r='6' fill='${INK}'/>`)}${llama(320, 150, 0.8)}`; });
const waterfallV = V((c) => { const H = 116;
  return `${hills(c, [[-20, 70], [80, 60], [180, 74], [280, 56], [420, 70]], '#4F8A5B', 0.45, false, H)}<path d='M120 60h120v80H120z' fill='${hz(c, '#8E9EA8', 0.2)}' ${O}/><path d='M140 62h80v80h-80z' fill='#E8F6FA'/>${[150, 166, 182, 198, 212].map((x) => `<path d='M${x} 64v74' stroke='#BFE6F7' stroke-width='3'/>`).join('')}
${fog([[180, 140, 70, 10]])}${water(c, 138, 200, '#5FC0B8')}${land(c, [[-20, 150], [40, 120], [110, 130], [130, 200]], '#4F8F44')}${land(c, [[260, 200], [280, 132], [350, 118], [420, 124]], '#4F8F44')}
${vtree(20, 136, 1.3, '#3F8C3A')}${vtree(80, 132, 1.1, '#4F9A44')}${vtree(310, 128, 1.1, '#3F8C3A')}${vtree(380, 126, 1.3, '#4F9A44')}${tx(200, 168, 1, `<path d='M180 168q20 6 40 0l-3-5h-34z' fill='#E8735A' ${o}/>`)}`; });
const skylineV = V((c) => { const H = 120; const g = pick(c, ['#9AB0C8', '#A9B8C8', '#B7C6D6', '#9AA8B8']);
  const car = (x, y, s, i) => tx(x, y, s, `<rect x='${x - 9}' y='${y - 7}' width='18' height='6' rx='3' fill='${['#E74C3C', '#F2C14E', '#FFFFFF', '#2F6DB5'][i % 4]}' ${o}/><rect x='${x - 5}' y='${y - 11}' width='10' height='5' rx='2' fill='#BFE3F5' ${o}/><circle cx='${x - 5}' cy='${y - 1}' r='2.2' fill='${INK}'/><circle cx='${x + 5}' cy='${y - 1}' r='2.2' fill='${INK}'/>`);
  return `${vskyline(c, -10, 420, H, { hmin: 24, hmax: 70, seed: 3 + (c.seed || 0) % 17, t: 0.55, col: g, gap: 1 })}<path d='M${120 + rnd(c, 4) * 160} ${H}l5-96 5 96z' fill='${hz(c, '#E8E8F0', 0.3)}'/>
${vskyline(c, -10, 420, H + 8, { hmin: 26, hmax: 64, seed: 9 + (c.seed || 0) % 13, t: 0.32, col: g, gap: 3 })}${fl(c, H + 10, '#8C8C98')}
${ribbon([[120, 214, 210], [138, 166, 112], [148, 140, 50], [154, H + 12, 12]], '#6E6E7A', false)}<path d='M120 206Q134 160 148 138T154 ${H + 14}' fill='none' stroke='#FFFFFF' stroke-width='2' stroke-dasharray='8 7'/>
${line([30, 152], [128, H + 14], 5, 1, 0.3, (x, y, s, i) => tx(x, y, s, vblock(x, y, 34, 86 + (i % 3) * 14, ['#B7C6D6', '#C9D4E0', '#9AA5B4'][i % 3])))}${line([300, 152], [178, H + 14], 5, 1, 0.3, (x, y, s, i) => tx(x, y, s, vblock(x, y, 34, 80 + (i % 3) * 16, ['#C9D4E0', '#9AA5B4', '#B7C6D6'][i % 3])))}
${line([104, 190], [150, H + 18], 3, 1.1, 0.35, car, 0.8)}${vtree(24, 172, 1, '#4F9A44')}${vtree(60, 178, 1.1, '#5E9C4F')}`; });
const oldTownV = V((c) => { const H = 116;
  const fac = (x, y, s, i) => tx(x, y, s, `${vblock(x, y, 30, 40 + (i % 3) * 6, PAL[(i + (c.seed || 0)) % PAL.length])}<path d='M${x - 18} ${y - 40 - (i % 3) * 6}L${x} ${y - 58 - (i % 3) * 6}L${x + 18} ${y - 40 - (i % 3) * 6}z' fill='${pick(c, ['#B5452E', '#8A5A3A', '#5A6B7E'], i)}' ${O}/><rect x='${x - 3.5}' y='${y - 10}' width='7' height='10' rx='3' fill='#6B4A2B' ${o}/>`);
  const lampP = (x, y) => `<path d='M${x} ${y}v-22' stroke='${INK}' stroke-width='2.4' stroke-linecap='round'/><circle cx='${x}' cy='${y - 24}' r='3.4' fill='#FFE08A' stroke='${INK}' stroke-width='1.4'/>`;
  return `${farH(c, H, '#8FB07A', 0.5)}<path d='M${300 + rnd(c, 5) * 40} ${H}v-40h14v40z' fill='${hz(c, '#C9A982', 0.4)}'/><path d='M${296 + rnd(c, 5) * 40} ${H - 40}h22l-11-14z' fill='${hz(c, '#9C6A4A', 0.4)}'/>${fl(c, H + 2, '#D8CCB4')}
${line([60, 138], [138, H + 4], 5, 0.8, 0.3, fac)}${line([250, 140], [170, H + 4], 4, 0.8, 0.3, fac)}
${ribbon([[96, 214, 150], [114, 168, 80], [130, 140, 40], [144, H + 6, 10]], '#B9AB8C', false)}${[0, 1, 2, 3, 4, 5].map((i) => { const t = recede(6, 0.72)[i]; const y = lerp(198, H + 8, t); const w = lerp(96, 6, t); return `<path d='M${lerp(54, 138, t) - w / 2} ${y}h${w}' stroke='#9E9078' stroke-width='${lerp(1.6, 0.5, t)}' stroke-dasharray='5 4'/>`; }).join('')}
${line([8, 156], [124, H + 6], 6, 1.05, 0.3, fac)}${line([270, 160], [172, H + 6], 5, 1.05, 0.3, fac)}${lampP(56, 176)}${lampP(128, 142)}${lampP(214, 150)}`; });
const windmillsV = V((c) => { const H = 118;
  const mill = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 10} ${y}l4-40h12l4 40z' fill='${hz(c, '#8A6A4A', t)}' ${t < 0.2 ? O : ''}/><path d='M${x - 12} ${y - 40}l12-10 12 10z' fill='${hz(c, '#5A4A3A', t)}' ${t < 0.2 ? o : ''}/><g stroke='${hz(c, '#3B2C24', t)}' stroke-width='3'><path d='M${x - 26} ${y - 70}L${x + 26} ${y - 18}M${x + 26} ${y - 70}L${x - 26} ${y - 18}'/></g><g fill='${hz(c, '#F6EEDF', t)}'><path d='M${x - 24} ${y - 68}l10 2-8 8zM${x + 24} ${y - 68}l-2 10-8-8z'/></g>`);
  return `${farH(c, H, '#7FA866', 0.5, 4)}${line([380, H + 2], [250, H + 1], 4, 0.6, 0.3, (x, y, s, i, t) => mill(x, y, s, 0.3 + t * 0.2))}${fl(c, H + 4, '#9CCF6A')}
${[0, 1, 2, 3, 4, 5].map((i) => { const x0 = -200 + i * 110; return `<path d='M${x0} 200L${lerp(x0, 200, 0.95)} ${H + 6}' stroke='${['#E86A9A', '#F2C14E', '#E2523B'][i % 3]}' stroke-width='22' opacity='.9'/>`; }).join('')}${ribbon([[330, 214, 60], [290, 166, 30], [262, 140, 12], [248, H + 6, 4]], '#6FAFD0', false)}${mill(110, 150, 1.2, 0)}`; });
const volcanoV = V((c) => { const H = 120;
  return `<path d='M60 ${H}L170 40q30-10 60 0L340 ${H}z' fill='${hz(c, '#6E6A76', 0.25)}'/><path d='M178 36q-8-18 6-26 10-14 24-6' stroke='${hz(c, '#C9C3BE', 0.2)}' stroke-width='8' fill='none' stroke-linecap='round'/><path d='M190 40q10 30 4 80' stroke='${hz(c, '#E8735A', 0.35)}' stroke-width='3' fill='none'/>
${farH(c, H + 2, '#6F9A5A', 0.35, 6)}${fl(c, H + 6)}${ribbon([[300, 212, 60], [260, 168, 26], [236, 140, 10], [226, H + 8, 3]], '#8A7A6A', false)}${line([30, 156], [170, H + 10], 5, 1, 0.35, (x, y, s) => vtree(x, y, s, '#5E9C4F'))}${tx(330, 150, 1, vhouse(330, 150, 34, 20, '#F6E6D2', '#C0503A'))}`; });
const castleV = V((c) => { const H = 118;
  return `${farH(c, H, '#8FAE6A', 0.5)}${fl(c, H + 6)}${hills(c, [[-20, 150], [40, 118], [120, 100], [200, 116], [240, 150], [240, 200]], '#8CC56B', 0, true)}
${tx(120, 112, 0.95, `<rect x='74' y='70' width='92' height='42' fill='#D9C7A3' ${O}/>${[74, 166].map((d) => `<rect x='${d - 11}' y='46' width='22' height='66' fill='#D9C7A3' ${O}/><path d='M${d - 14} 48l14-26 14 26z' fill='${pick(c, ['#3F5E8A', '#B5452E', '#5A6B7E'])}' ${O}/>`).join('')}<rect x='108' y='36' width='24' height='40' fill='#D9C7A3' ${O}/><path d='M104 38l16-24 16 24z' fill='${pick(c, ['#B5452E', '#3F5E8A', '#5A6B7E'], 1)}' ${O}/><path d='M110 112v-20a10 10 0 0 1 20 0v20z' fill='#5A4636' ${O}/>`)}
${ribbon([[300, 212, 60], [250, 166, 26], [200, 128, 8]], '#D9C9A0', false)}${line([300, 156], [390, H + 10], 4, 1, 0.4, (x, y, s) => vtree(x, y, s, '#5E9C4F'))}`; });
const mosqueSceneV = V((c) => { const H = 116; const dc = pick(c, ['#2E8A8F', '#C9A04B', '#2F6DB5', '#3F8C6A']);
  return `${farH(c, H, '#C9B488', 0.5, 10)}${vskyline(c, 200, 420, H + 1, { hmin: 6, hmax: 16, col: '#E9DCC0', t: 0.35, seed: 4 })}${fl(c, H + 4, '#E3D3A8')}
${line([380, 152], [230, H + 8], 7, 1, 0.3, (x, y, s, i) => tx(x, y, s, vblock(x, y, 30, 22 + (i % 3) * 6, ['#F2E6D0', '#E8D6B4', '#F6EEDF'][i % 3])))}
${tx(120, 148, 1, `<rect x='62' y='112' width='116' height='36' fill='#F2E6D0' ${O}/>${dome(120, 112, 32, dc)}${dome(82, 114, 12, dc)}${dome(158, 114, 12, dc)}${minaret(50, 148, 76, '#F6EEDF', dc, 9)}${minaret(190, 148, 76, '#F6EEDF', dc, 9)}<path d='M120 80v-12' stroke='#C9A04B' stroke-width='2.4'/>${[94, 112, 130].map((x) => `<path d='M${x} 148v-16a7 7 0 0 1 14 0v16' fill='${dc}' ${o}/>`).join('')}`)}${vpalm(220, 150, 0.8)}`; });
const stupaV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 14], [100, H - 30], [220, H - 12], [330, H - 34], [420, H - 16]], '#7FA07A', 0.5, false, H + 4)}${tx(320, H + 4, 0.45, `<rect x='290' y='${H - 16}' width='60' height='20' fill='${hz(c, '#F2E2C4', 0.3)}'/>${dome(320, H - 16, 26, hz(c, '#F2C14E', 0.3), false)}<path d='M314 ${H - 42}h12l-6-30z' fill='${hz(c, '#E2B33E', 0.3)}'/>`)}${fl(c, H + 6, '#D8CCB4')}
${ribbon([[200, 214, 120], [200, 166, 50], [200, 140, 18], [200, H + 8, 5]], '#C4B79C', false)}${line([140, 160], [190, H + 10], 6, 1, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}v-30' stroke='#6B4A2B' stroke-width='2'/><path d='M${x} ${y - 30}l14 4-14 4z' fill='${PAL[Math.round(s * 10) % 8]}'/>`))}
${tx(90, 148, 1.05, `<rect x='50' y='126' width='80' height='22' fill='#F2E2C4' ${O}/>${dome(90, 126, 36, pick(c, ['#F2C14E', '#FFFFFF', '#F6E6D2']))}<rect x='78' y='84' width='24' height='14' fill='#F2C14E' ${O}/>${[0, 1, 2, 3].map((i) => `<rect x='${82 + i * 1.5}' y='${76 - i * 7}' width='${16 - i * 3}' height='6' fill='#E2B33E' ${o}/>`).join('')}<circle cx='90' cy='46' r='3' fill='#E2B33E' ${o}/>`)}${line([250, 154], [380, 134], 4, 1, 0.5, (x, y, s) => vpalm(x, y, s * 0.8))}`; });
const beachV = V((c) => { const H = 118;
  return `${water(c, H, 200, pick(c, ['#3FB0D0', '#2FC0D0', '#4FA9D6']))}${hills(c, [[200, H + 2], [280, H - 10 - rnd(c, 6) * 10], [360, H - 4], [420, H - 14]], '#5E9F55', 0.45, false, H + 3)}
<path d='M-20 168Q140 146 300 134T420 126V200H-20z' fill='#F6E6BF' ${O}/>${foam(220, 144, 140)}${line([30, 162], [360, 128], 8, 1.15, 0.25, (x, y, s) => vpalm(x, y, s * 0.85))}${line([160, 170], [320, 136], 3, 1, 0.5, (x, y, s, i) => tx(x, y, s, `<path d='M${x} ${y}v-22' stroke='#8A5A34' stroke-width='2'/><path d='M${x - 16} ${y - 20}q16-12 32 0z' fill='${PAL[(i + (c.seed || 0)) % 8]}' ${o}/>`))}${vboat(240, 134, 0.7, '#E8735A')}`; });
const jungleV = V((c) => { const H = 116;
  const canopy = (y, col, t, ink) => `<path d='${sil(Array.from({ length: 23 }, (_, i) => [-20 + i * 20, y - 6 - ((i * 37 + (c.seed || 0)) % 11)]), 200)}' fill='${hz(c, col, t)}' ${ink ? O : ''}/>`;
  return `${canopy(H - 10, '#3F7F4A', 0.55)}${fog([[200, H - 12, 160, 6]])}${canopy(H, '#4F8F4A', 0.35)}${ribbon([[230, 214, 220], [220, 170, 110], [240, 140, 44], [252, H + 8, 10]], '#7A8A4E', false)}
${hills(c, [[-20, 132], [30, 118], [80, 126], [130, 150], [140, 200]], '#3F7F3A', 0, true)}${hills(c, [[320, 200], [340, 140], [380, 124], [420, 128]], '#4F8F44', 0, true)}${vtree(20, 150, 1.4, '#3F8C3A')}${vtree(80, 146, 1.1, '#4F9A44')}${vpalm(110, 150, 1)}${vtree(390, 150, 1.2, '#3F8C3A')}
${tx(230, 166, 1, `<path d='M200 166q30 8 60 0l-4-6h-52z' fill='#7A4A2A' ${o}/>`)}`; });
const savannaV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 6], [120, H - 16], [260, H - 4], [420, H - 14]], pick(c, ['#A9A05E', '#B9A86A', '#9C9A5A']), 0.5, false, H + 4)}${line([380, H + 4], [200, H + 2], 5, 0.5, 0.3, (x, y, s, i, t) => acacia(x, y, s, hz(c, '#6E8F3E', 0.3 + t * 0.2), false), 0.8)}
${fl(c, H + 6, '#D9C080')}${acacia(80, 152, 1.25)}${line([150, 152], [330, 128], 4, 1.1, 0.4, (x, y, s) => elephant(x, y, s))}`; });
const desertSceneV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 2], [80, H - 16], [200, H - 4], [300, H - 20], [420, H - 6]], '#E8B878', 0.5, false, H + 4)}${hills(c, [[-20, H + 10], [120, H - 6], [240, H + 8], [360, H - 4], [420, H + 6]], '#E2A866', 0.25, false, H + 14)}
${land(c, [[-20, 160], [80, 132], [200, 140], [320, 128], [420, 146]], '#E9B870')}<path d='M80 132q40 10 60 40M320 128q-30 14-50 46' fill='none' stroke='#D99A50' stroke-width='2'/>
${line([60, 150], [300, 118], 6, 1.1, 0.25, (x, y, s) => camel(x, y, s))}${tx(360, 140, 1, `${vpalm(350, 140, 0.7)}${vpalm(372, 138, 0.6)}<ellipse cx='360' cy='142' rx='30' ry='4' fill='#4FA9D6' ${o}/>`)}`; });
const terracesV = V((c) => { const H = 112;
  return `${range(c, H, [[60, 66, 100], [220, 82, 110], [380, 68, 90]], '#7F9C8A', 0.5, { snow: false })}${fog([[150, H - 4, 120, 7], [330, H - 10, 80, 6]])}${vterraces(c, 170, H + 4, 7, pick(c, [['#9CCF6A', '#7FBF6A', '#B6D97A'], ['#7FBF6A', '#5E9F4F', '#9CCF6A'], ['#B6D97A', '#9CCF6A', '#C9D97A']]), 34)}
${[0, 1, 2].map((i) => `<path d='M-20 ${160 - i * 16}Q200 ${120 - i * 14} 420 ${160 - i * 16}' fill='none' stroke='#4F8F3A' stroke-width='1.4' stroke-dasharray='2 5'/>`).join('')}${tx(90, 134, 1, `<rect x='70' y='118' width='40' height='16' fill='#C99A63' ${O}/><path d='M62 120l28-16 28 16z' fill='#6B5A3A' ${O}/>`)}`; });
const plainsV = V((c) => { const H = 118;
  return `${farH(c, H, '#9CB06A', 0.5, 5)}${fl(c, H + 4, pick(c, ['#E8C860', '#C9C06A', '#B9C76A']))}${vrows(c, 220, H - 6, H + 4, [-200, -120, -40, 40, 120, 200, 280, 360, 440, 520, 600], '#A9A24E', 3)}
${line([300, H + 6], [400, H + 4], 3, 0.5, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 18}' y='${y - 22}' width='36' height='22' fill='${hz(c, '#B5452E', 0.4)}'/><path d='M${x - 22} ${y - 20}l22-14 22 14z' fill='${hz(c, '#8A2E1E', 0.4)}'/>`))}
${tx(90, 146, 1, vhouse(90, 146, 54, 30, '#E8DCC2', '#B5452E'))}${vtree(150, 146, 1, '#5E9C4F')}${line([180, 160], [320, 132], 4, 1, 0.4, (x, y, s) => vcow(x, y, s, pick(c, ['#FFFFFF', '#8A5A3A', '#2B2B2B'])))}`; });
const lakeMtnV = V((c) => { const H = 120;
  return `${range(c, H, [[50, 80, 80], [180, 100, 90], [310, 86, 90], [420, 70, 70]], '#9AAEC0', 0.25, { ink: true })}${water(c, H, 160, '#4FA8C8')}<path d='M20 ${H + 2}L180 ${H + 70} 330 ${H + 2}z' fill='#9AAEC0' opacity='.22'/>
${land(c, [[-20, 156], [100, 150], [250, 154], [420, 146]], '#6F9A5A')}${line([10, 160], [150, H + 6], 6, 1.2, 0.35, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${line([400, 160], [280, H + 6], 6, 1.2, 0.35, (x, y, s) => vpine(x, y, s, '#2F5E3A'))}${vboat(220, 150, 0.8, '#E8735A')}`; });
const vineyardV = V((c) => { const H = 116;
  return `${farH(c, H, '#9CB06A', 0.5)}${fl(c, H + 6, '#9CBF5E')}${vrows(c, 210, H - 6, H + 6, [-260, -170, -80, 10, 100, 190, 280, 370, 460, 550], '#5E7F34', 5)}
${tx(310, H + 8, 0.6, `${vhouse(310, H + 8, 60, 30, '#E8DCC2', pick(c, ['#B5452E', '#8A5A3A']))}`)}${vcyp(30, 150, 1.2)}${vcyp(54, 148, 1)}`; });
const snowForestV = V((c) => { const H = 116;
  return `${range(c, H, [[80, 50, 120], [300, 60, 140]], '#B7C4D8', 0.45)}${[0, 1, 2].map((r) => { const t = [0.5, 0.3, 0.12][r]; const y = H + 2 + r * 10; return line([-20 + r * 7, y], [430, y], 24 - r * 5, 1, 1, (x, yy) => vpine(x, yy, lerp(0.45, 0.85, r / 2), hz(c, '#2F5E3A', t), r === 2), 1); }).join('')}
${fl(c, H + 24, '#F4F8FB')}${ribbon([[260, 212, 60], [240, 170, 24], [250, 146, 8]], '#D8E2EC', false)}${tx(110, 152, 1, `<rect x='80' y='120' width='60' height='32' fill='#B07A48' ${O}/><path d='M70 122l40-26 40 26z' fill='#F4F8FB' ${O}/><rect x='102' y='128' width='14' height='12' fill='#FFE08A' ${o}/><path d='M128 104v-12' stroke='#6B4A2B' stroke-width='5'/>`)}`; });
const islandHutV = V((c) => { const H = 118;
  return `${water(c, H, 200, pick(c, ['#2FC0D0', '#3FB0D0']))}<path d='M260 ${H + 2}q40-20 80-6t60 6z' fill='${hz(c, '#4F8F44', 0.45)}'/>
${line([150, 150], [380, H + 8], 5, 1, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x - 14} ${y}v-14M${x + 14} ${y}v-14' stroke='#6B4A2B' stroke-width='3'/><rect x='${x - 18}' y='${y - 26}' width='36' height='12' fill='#C99A63' ${O}/><path d='M${x - 24} ${y - 24}l24-16 24 16z' fill='#D9B26A' ${O}/>`))}<path d='M120 150L380 ${H + 8}' stroke='#8A5A34' stroke-width='3'/>
<path d='M-20 160q80-30 160-10v50H-20z' fill='#F6E6BF' ${O}/>${vpalm(30, 156, 1.2)}${vpalm(80, 150, 0.95, -1)}${foam(120, 158, 30)}`; });
const canalV = V((c) => { const H = 116;
  const fac = (x, y, s, i) => { const h = 44 + (i % 3) * 7; return tx(x, y, s, `${vblock(x, y, 27, h, PAL[(i + (c.seed || 0)) % PAL.length])}<path d='M${x - 16} ${y - h}L${x} ${y - h - 15}L${x + 16} ${y - h}z' fill='#5A4A3A' ${O}/><rect x='${x - 3.5}' y='${y - 10}' width='7' height='10' rx='3' fill='#6B4A2B' ${o}/>`); };
  return `${vskyline(c, -10, 420, H, { hmin: 8, hmax: 20, t: 0.5, col: '#C9B8A6', seed: 3 })}${fl(c, H + 2, '#C9B8A6')}${ribbon([[150, 214, 170], [152, 166, 110], [154, 140, 52], [154, H + 4, 14]], '#5F98B8', false)}
${line([8, 152], [122, H + 6], 6, 1, 0.28, fac)}${line([300, 156], [186, H + 6], 5, 1, 0.28, fac)}<path d='M96 142q54-26 108 0' fill='none' stroke='${INK}' stroke-width='2.4'/><path d='M92 144q58-24 116 0v6q-58-20-116 0z' fill='#C9B8A6' ${o}/><path d='M104 140v-8M124 134v-8M150 130v-8M176 134v-8M196 140v-8' stroke='${INK}' stroke-width='1.6'/>${tx(150, 172, 1, `<path d='M126 172h48l-6 8h-36z' fill='#2F6DB5' ${o}/>`)}<path d='M32 160v-22M284 160v-22' stroke='${INK}' stroke-width='2.4'/><circle cx='32' cy='136' r='3.4' fill='#FFE08A' ${o}/><circle cx='284' cy='136' r='3.4' fill='#FFE08A' ${o}/>`; });
const mesaV = V((c) => { const H = 120;
  const butte = (x, y, w, h, t) => `<path d='M${x - w * 1.25} ${y}L${x - w * 0.82} ${y - h * 0.5}Q${x - w * 0.8} ${y - h} ${x - w * 0.5} ${y - h}L${x + w * 0.5} ${y - h}Q${x + w * 0.8} ${y - h} ${x + w * 0.82} ${y - h * 0.5}L${x + w * 1.25} ${y}z' fill='${hz(c, '#C7633A', t)}' ${t < 0.2 ? O : ''}/><path d='M${x - w * 0.9} ${y - h * 0.4}h${w * 1.8}M${x - w * 0.8} ${y - h * 0.7}h${w * 1.6}' stroke='${hz(c, '#9C4A28', t)}' stroke-width='${t < 0.2 ? 2 : 1}'/><path d='M${x - w * 0.5} ${y - h}h${w}' stroke='${hz(c, '#E9A074', t)}' stroke-width='${t < 0.2 ? 3 : 2}' stroke-linecap='round'/>`;
  return `${butte(300, H + 2, 28, 46, 0.45)}${butte(380, H + 2, 20, 34, 0.5)}${butte(220, H + 2, 16, 28, 0.5)}${fl(c, H + 4, '#D9845A')}${ribbon([[200, 212, 110], [210, 166, 46], [218, 140, 16], [222, H + 6, 4]], '#8A5A3A', false)}${butte(70, 150, 34, 54, 0)}${line([260, 160], [380, H + 10], 4, 1, 0.4, (x, y, s) => vbush(x, y, s, '#9C9A5A'))}`; });
const steppeV = V((c) => { const H = 118;
  const ger = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 22} ${y}v-14q22-16 44 0v14z' fill='${hz(c, '#F6EEDF', t)}' ${t < 0.2 ? O : ''}/><path d='M${x - 22} ${y - 14}q22-16 44 0' fill='none' stroke='${hz(c, '#C0503A', t)}' stroke-width='3'/><rect x='${x - 4}' y='${y - 10}' width='8' height='10' fill='${hz(c, '#C0503A', t)}'/>`);
  return `${range(c, H, [[100, 44, 140], [320, 54, 150]], '#A8A0B0', 0.45, { snow: true, cap: 40 })}${fl(c, H + 4, '#C9C06A')}${line([380, 136], [280, H + 8], 3, 0.8, 0.4, (x, y, s, i, t) => ger(x, y, s, t * 0.3))}${ger(100, 150, 1.3, 0)}${ger(170, 140, 0.9, 0.05)}
${horse(60, 160, 1)}${horse(300, 134, 0.7, '#C99A63')}${horse(350, 128, 0.55, '#3B2C24')}`; });
const SC = { harbor: harborV, peaks: peaksV, saltflat: saltflatV, waterfall: waterfallV, skyline: skylineV, oldTown: oldTownV, windmills: windmillsV, fjord: fjordV, volcano: volcanoV, castle: castleV, mosqueScene: mosqueSceneV, stupa: stupaV, beach: beachV, jungle: jungleV, savanna: savannaV, desertScene: desertSceneV, terraces: terracesV, plains: plainsV, lakeMtn: lakeMtnV, vineyard: vineyardV, snowForest: snowForestV, islandHut: islandHutV, canal: canalV, mesa: mesaV, steppe: steppeV };
// [scene, place name, sky, ground, sea?, buddy]
// a lake (with a boat on it) only where the place is a lake; other mountain places get plain peaks
const LAKE = /lake|lac |balaton|titicaca|sevan|victoria|malawi|tanganyika|kivu|issyk|bled|una river|ohrid|geneva|khuvsgul|band-e/i;
const seedOf = (t) => { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 997; };
const P = (k, name, skyK, ground, sea, buddy) => { const key = k === 'lakeMtn' && !LAKE.test(name) ? 'peaks' : k; const f = SC[key]; const seed = seedOf(name); const draw = V((c) => f(0, { ...c, seed })); return [...R(draw, skyK, ground, sea, buddy, name), key]; };

export const COUNTRY_PLACES = {
  AD: [P('lakeMtn', 'the Pyrenees', 'day', 'green', false, 'cheese'), P('oldTown', 'Andorra la Vella', 'warm', 'stone', false, 'bread')],
  AE: [P('skyline', 'Dubai', 'sand', 'sand', true, 'camel'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel'), P('mosqueScene', 'Abu Dhabi', 'warm', 'stone', false, 'teapot')],
  AF: [P('peaks', 'the Hindu Kush', 'warm', 'sand', false, 'naan'), P('mosqueScene', 'Herat', 'sand', 'dry', false, 'teapot'), P('lakeMtn', 'Band-e Amir', 'day', 'dry', false, 'naan')],
  AG: [P('beach', 'Antigua', 'day', 'beach', true, 'palm'), P('islandHut', 'Nelson’s Dockyard', 'day', 'beach', true, 'pineapple')],
  AL: [P('lakeMtn', 'the Albanian Alps', 'day', 'green', false, 'olive'), P('beach', 'the Riviera', 'day', 'beach', true, 'olive'), P('oldTown', 'Berat', 'warm', 'stone', false, 'bread')],
  AM: [P('peaks', 'Mount Ararat', 'warm', 'dry', false, 'bread'), P('oldTown', 'Yerevan', 'warm', 'stone', false, 'naan'), P('lakeMtn', 'Lake Sevan', 'day', 'green', false, 'bread')],
  AO: [P('beach', 'Luanda coast', 'warm', 'beach', true, 'palm'), P('savanna', 'the highlands', 'warm', 'dry', false, 'banana'), P('skyline', 'Luanda', 'dusk', 'stone', true, 'palm')],
  AT: [P('lakeMtn', 'the Tyrol', 'day', 'green', false, 'cheese'), P('castle', 'Salzburg', 'warm', 'green', false, 'coffee'), P('oldTown', 'Vienna', 'dusk', 'stone', false, 'coffee')],
  AZ: [P('skyline', 'Baku', 'dusk', 'stone', true, 'teapot'), P('peaks', 'the Caucasus', 'warm', 'dry', false, 'naan'), P('mosqueScene', 'Sheki', 'warm', 'stone', false, 'teapot')],
  BA: [P('oldTown', 'Sarajevo', 'warm', 'stone', false, 'coffee'), P('lakeMtn', 'the Una river', 'day', 'green', false, 'bread'), P('castle', 'Mostar', 'warm', 'stone', false, 'coffee')],
  BB: [P('beach', 'the west coast', 'day', 'beach', true, 'palm'), P('islandHut', 'Bathsheba', 'day', 'beach', true, 'pineapple')],
  BD: [P('canal', 'the river delta', 'day', 'lush', true, 'banana'), P('skyline', 'Dhaka', 'warm', 'stone', false, 'chaicup'), P('jungle', 'the Sundarbans', 'day', 'lush', true, 'banana')],
  BE: [P('canal', 'Bruges', 'day', 'stone', false, 'coffee'), P('oldTown', 'Brussels', 'dusk', 'stone', false, 'bread'), P('plains', 'Flanders', 'day', 'green', false, 'bread')],
  BF: [P('desertScene', 'the Sahel', 'sand', 'sand', false, 'camel'), P('plains', 'a village', 'warm', 'dry', false, 'corn'), P('skyline', 'Ouagadougou', 'warm', 'stone', false, 'corn')],
  BG: [P('lakeMtn', 'the Rila mountains', 'day', 'green', false, 'herbs'), P('beach', 'the Black Sea', 'day', 'beach', true, 'lemon'), P('oldTown', 'Plovdiv', 'warm', 'stone', false, 'bread')],
  BH: [P('skyline', 'Manama', 'sand', 'sand', true, 'teapot'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel')],
  BI: [P('lakeMtn', 'Lake Tanganyika', 'day', 'lush', false, 'banana'), P('terraces', 'the hills', 'day', 'lush', false, 'banana')],
  BJ: [P('islandHut', 'Ganvié lake village', 'warm', 'lush', true, 'palm'), P('savanna', 'the north', 'warm', 'dry', false, 'corn'), P('beach', 'Cotonou', 'day', 'beach', true, 'palm')],
  BN: [P('mosqueScene', 'Bandar Seri Begawan', 'warm', 'lush', true, 'palm'), P('jungle', 'the rainforest', 'day', 'lush', false, 'palm')],
  BO: [P('saltflat', 'Uyuni salt flats', 'day', 'snow', false, 'chili'), P('lakeMtn', 'Lake Titicaca', 'day', 'green', false, 'corn'), P('oldTown', 'La Paz', 'dusk', 'stone', false, 'corn')],
  BS: [P('beach', 'Nassau', 'day', 'beach', true, 'palm'), P('islandHut', 'Exuma', 'day', 'beach', true, 'lemon')],
  BT: [P('terraces', 'Paro valley', 'day', 'lush', false, 'chili'), P('lakeMtn', 'the Himalaya', 'day', 'snow', false, 'chili'), P('stupa', 'Tiger’s Nest', 'warm', 'green', false, 'chili')],
  BW: [P('savanna', 'the Okavango', 'warm', 'dry', true, 'elephant'), P('desertScene', 'the Kalahari', 'sand', 'sand', false, 'camel')],
  BY: [P('plains', 'the countryside', 'day', 'green', false, 'bread'), P('castle', 'Mir castle', 'day', 'green', false, 'garlic'), P('snowForest', 'Białowieża forest', 'day', 'snow', false, 'garlic')],
  BZ: [P('beach', 'the cayes', 'day', 'beach', true, 'palm'), P('jungle', 'the rainforest', 'day', 'lush', false, 'parrot'), P('islandHut', 'Caye Caulker', 'day', 'beach', true, 'lime')],
  CD: [P('jungle', 'the Congo rainforest', 'day', 'lush', false, 'banana'), P('canal', 'the Congo river', 'warm', 'lush', true, 'banana'), P('skyline', 'Kinshasa', 'dusk', 'stone', true, 'banana')],
  CF: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('savanna', 'the savanna', 'warm', 'dry', false, 'corn')],
  CG: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('beach', 'Pointe-Noire', 'day', 'beach', true, 'palm'), P('savanna', 'the plateau', 'warm', 'dry', false, 'corn')],
  CH: [P('lakeMtn', 'the Swiss Alps', 'day', 'green', false, 'cheese'), P('oldTown', 'Zurich', 'warm', 'stone', false, 'coffee'), P('castle', 'Lake Geneva', 'day', 'green', false, 'cheese')],
  CI: [P('beach', 'Abidjan lagoon', 'day', 'beach', true, 'palm'), P('jungle', 'the cocoa forest', 'day', 'lush', false, 'banana'), P('skyline', 'Abidjan', 'dusk', 'stone', true, 'palm')],
  CL: [P('lakeMtn', 'the Andes', 'day', 'snow', false, 'chili'), P('vineyard', 'the Central Valley', 'warm', 'green', false, 'chili'), P('beach', 'Valparaíso', 'day', 'stone', true, 'lemon')],
  CM: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('volcano', 'Mount Cameroon', 'warm', 'lush', false, 'banana'), P('beach', 'Kribi', 'day', 'beach', true, 'palm')],
  CR: [P('volcano', 'Arenal volcano', 'day', 'lush', false, 'banana'), P('beach', 'the Pacific coast', 'day', 'beach', true, 'palm'), P('jungle', 'the cloud forest', 'day', 'lush', false, 'parrot')],
  CV: [P('volcano', 'Fogo', 'warm', 'sand', true, 'palm'), P('islandHut', 'Mindelo', 'day', 'beach', true, 'palm')],
  CY: [P('beach', 'the Mediterranean coast', 'day', 'beach', true, 'olive'), P('oldTown', 'Nicosia', 'warm', 'stone', false, 'olive'), P('lakeMtn', 'the Troodos', 'day', 'green', false, 'olive')],
  CZ: [P('castle', 'Prague', 'dusk', 'stone', false, 'bread'), P('oldTown', 'Cesky Krumlov', 'warm', 'stone', false, 'bread'), P('plains', 'Bohemia', 'day', 'green', false, 'bread')],
  DJ: [P('desertScene', 'Lake Assal', 'sand', 'sand', true, 'camel'), P('beach', 'Djibouti', 'day', 'beach', true, 'palm')],
  DK: [P('canal', 'Copenhagen', 'day', 'stone', true, 'bread'), P('plains', 'Jutland', 'day', 'green', false, 'bread'), P('beach', 'the North Sea', 'day', 'beach', true, 'bread')],
  DM: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('islandHut', 'Roseau', 'day', 'beach', true, 'palm')],
  DO: [P('beach', 'Punta Cana', 'day', 'beach', true, 'palm'), P('oldTown', 'Santo Domingo', 'warm', 'stone', true, 'banana'), P('lakeMtn', 'the mountains', 'day', 'lush', false, 'banana')],
  DZ: [P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('oldTown', 'Algiers', 'dusk', 'stone', true, 'teapot'), P('mesa', 'the Hoggar', 'warm', 'red', false, 'camel')],
  EC: [P('volcano', 'Cotopaxi', 'day', 'green', false, 'corn'), P('beach', 'the coast', 'day', 'beach', true, 'banana'), P('jungle', 'the Amazon', 'day', 'lush', false, 'parrot')],
  EE: [P('castle', 'Tallinn', 'day', 'green', true, 'bread'), P('snowForest', 'the forests', 'day', 'snow', false, 'bread')],
  ER: [P('beach', 'Massawa', 'day', 'beach', true, 'palm'), P('oldTown', 'Asmara', 'warm', 'stone', false, 'jebena'), P('peaks', 'the highlands', 'day', 'dry', false, 'jebena')],
  ET: [P('mesa', 'Lalibela', 'warm', 'dry', false, 'jebena'), P('lakeMtn', 'the Simien mountains', 'day', 'green', false, 'jebena'), P('skyline', 'Addis Ababa', 'dusk', 'stone', false, 'jebena')],
  FI: [P('lakeMtn', 'the Lakeland', 'day', 'green', false, 'bread'), P('snowForest', 'Lapland', 'dusk', 'snow', false, 'bread'), P('canal', 'Helsinki', 'day', 'stone', true, 'coffee')],
  FJ: [P('islandHut', 'the Yasawa islands', 'day', 'beach', true, 'palm'), P('beach', 'Nadi', 'day', 'beach', true, 'pineapple')],
  FM: [P('islandHut', 'Pohnpei', 'day', 'beach', true, 'palm'), P('beach', 'a lagoon', 'day', 'beach', true, 'palm')],
  GA: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('beach', 'Libreville coast', 'day', 'beach', true, 'palm')],
  GD: [P('beach', 'Grand Anse', 'day', 'beach', true, 'palm'), P('islandHut', 'St. George’s', 'day', 'beach', true, 'lime')],
  GE: [P('lakeMtn', 'the Caucasus', 'day', 'green', false, 'bread'), P('vineyard', 'Kakheti', 'warm', 'green', false, 'bread'), P('oldTown', 'Tbilisi', 'dusk', 'stone', false, 'bread')],
  GH: [P('beach', 'Cape Coast', 'day', 'beach', true, 'palm'), P('skyline', 'Accra', 'warm', 'stone', true, 'banana'), P('savanna', 'the north', 'warm', 'dry', false, 'corn')],
  GM: [P('canal', 'the Gambia river', 'warm', 'lush', true, 'palm'), P('beach', 'Banjul coast', 'day', 'beach', true, 'palm')],
  GN: [P('jungle', 'the forest', 'day', 'lush', false, 'banana'), P('beach', 'Conakry coast', 'day', 'beach', true, 'palm')],
  GQ: [P('jungle', 'Bioko island', 'day', 'lush', true, 'palm'), P('beach', 'the coast', 'day', 'beach', true, 'palm')],
  GT: [P('volcano', 'Lake Atitlán', 'day', 'lush', false, 'corn'), P('oldTown', 'Antigua', 'warm', 'stone', false, 'corn'), P('jungle', 'Tikal', 'day', 'lush', false, 'parrot')],
  GW: [P('islandHut', 'the Bijagós', 'day', 'beach', true, 'palm'), P('jungle', 'the mangroves', 'day', 'lush', true, 'palm')],
  GY: [P('jungle', 'the rainforest', 'day', 'lush', false, 'parrot'), P('canal', 'Georgetown', 'warm', 'lush', true, 'palm')],
  HN: [P('beach', 'Roatán', 'day', 'beach', true, 'palm'), P('jungle', 'Copán', 'day', 'lush', false, 'parrot'), P('lakeMtn', 'the mountains', 'day', 'lush', false, 'corn')],
  HR: [P('beach', 'the Dalmatian coast', 'day', 'stone', true, 'olive'), P('oldTown', 'Dubrovnik', 'warm', 'stone', true, 'olive'), P('lakeMtn', 'Plitvice', 'day', 'green', false, 'bread')],
  HT: [P('beach', 'Labadee', 'day', 'beach', true, 'palm'), P('oldTown', 'Port-au-Prince', 'warm', 'stone', true, 'banana'), P('lakeMtn', 'the mountains', 'day', 'lush', false, 'banana')],
  HU: [P('castle', 'Budapest', 'dusk', 'stone', true, 'chili'), P('plains', 'the Puszta', 'warm', 'dry', false, 'chili'), P('lakeMtn', 'Lake Balaton', 'day', 'green', false, 'chili')],
  IE: [P('castle', 'the castle country', 'day', 'green', false, 'bread'), P('beach', 'the Atlantic coast', 'day', 'green', true, 'teacup'), P('plains', 'the countryside', 'day', 'green', false, 'teacup')],
  IQ: [P('mosqueScene', 'Baghdad', 'warm', 'sand', false, 'teapot'), P('canal', 'the Tigris', 'warm', 'dry', false, 'teapot'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel')],
  IS: [P('volcano', 'the volcanoes', 'dusk', 'snow', false, 'bread'), P('fjord', 'the fjords', 'day', 'snow', true, 'bread'), P('canal', 'Reykjavík', 'day', 'stone', true, 'bread')],
  JO: [P('mesa', 'Petra', 'sand', 'red', false, 'teapot'), P('desertScene', 'Wadi Rum', 'sand', 'sand', false, 'camel'), P('beach', 'the Dead Sea', 'day', 'sand', true, 'olive')],
  KE: [P('savanna', 'the Maasai Mara', 'warm', 'dry', false, 'elephant'), P('beach', 'Mombasa', 'day', 'beach', true, 'palm'), P('skyline', 'Nairobi', 'dusk', 'stone', false, 'coffee')],
  KG: [P('lakeMtn', 'Issyk-Kul', 'day', 'green', false, 'bread'), P('steppe', 'the steppe', 'day', 'green', false, 'bread')],
  KH: [P('stupa', 'Angkor Wat', 'warm', 'lush', false, 'palm'), P('canal', 'Tonlé Sap', 'warm', 'lush', true, 'palm'), P('beach', 'Kampot', 'day', 'beach', true, 'palm')],
  KI: [P('islandHut', 'a lagoon', 'day', 'beach', true, 'palm'), P('beach', 'Tarawa', 'day', 'beach', true, 'palm')],
  KM: [P('volcano', 'Mount Karthala', 'day', 'lush', true, 'palm'), P('beach', 'Moroni', 'day', 'beach', true, 'palm')],
  KN: [P('volcano', 'Mount Liamuiga', 'day', 'lush', true, 'palm'), P('beach', 'Basseterre', 'day', 'beach', true, 'palm')],
  KP: [P('skyline', 'Pyongyang', 'day', 'stone', false, 'lantern'), P('lakeMtn', 'Mount Paektu', 'day', 'snow', false, 'lantern')],
  KW: [P('skyline', 'Kuwait City', 'sand', 'sand', true, 'teapot'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel')],
  KZ: [P('steppe', 'the steppe', 'day', 'green', false, 'bread'), P('skyline', 'Astana', 'dusk', 'stone', false, 'teapot'), P('lakeMtn', 'the Altai', 'day', 'snow', false, 'bread')],
  LA: [P('stupa', 'Luang Prabang', 'warm', 'lush', false, 'palm'), P('terraces', 'the rice terraces', 'day', 'lush', false, 'banana'), P('canal', 'the Mekong', 'warm', 'lush', true, 'palm')],
  LC: [P('volcano', 'the Pitons', 'day', 'lush', true, 'palm'), P('beach', 'Rodney Bay', 'day', 'beach', true, 'palm')],
  LI: [P('castle', 'Vaduz castle', 'day', 'green', false, 'cheese'), P('lakeMtn', 'the Alps', 'day', 'green', false, 'cheese')],
  LK: [P('terraces', 'the tea hills', 'day', 'lush', false, 'greentea'), P('beach', 'Galle', 'day', 'beach', true, 'palm'), P('stupa', 'Anuradhapura', 'warm', 'lush', false, 'chili')],
  LR: [P('beach', 'Monrovia coast', 'day', 'beach', true, 'palm'), P('jungle', 'the rainforest', 'day', 'lush', false, 'banana')],
  LS: [P('lakeMtn', 'the Maloti mountains', 'day', 'green', false, 'corn'), P('plains', 'the highlands', 'day', 'dry', false, 'corn')],
  LT: [P('castle', 'Trakai castle', 'day', 'green', false, 'bread'), P('oldTown', 'Vilnius', 'warm', 'stone', false, 'bread'), P('beach', 'the Curonian Spit', 'day', 'beach', true, 'bread')],
  LU: [P('castle', 'Luxembourg', 'day', 'green', false, 'bread'), P('vineyard', 'the Moselle', 'warm', 'green', false, 'bread')],
  LV: [P('oldTown', 'Riga', 'dusk', 'stone', false, 'bread'), P('snowForest', 'the forests', 'day', 'snow', false, 'bread'), P('beach', 'Jūrmala', 'day', 'beach', true, 'bread')],
  LY: [P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('beach', 'Tripoli coast', 'day', 'beach', true, 'olive'), P('mosqueScene', 'Tripoli', 'warm', 'sand', true, 'teapot')],
  MC: [P('harbor', 'Monaco harbour', 'day', 'stone', true, 'lemon'), P('harbor', 'Monte Carlo', 'dusk', 'stone', true, 'lemon')],
  MD: [P('vineyard', 'the wine country', 'warm', 'green', false, 'bread'), P('plains', 'the countryside', 'day', 'green', false, 'corn')],
  ME: [P('fjord', 'the Bay of Kotor', 'day', 'green', true, 'olive'), P('lakeMtn', 'Durmitor', 'day', 'snow', false, 'bread'), P('beach', 'the Adriatic', 'day', 'beach', true, 'olive')],
  MG: [P('jungle', 'the rainforest', 'day', 'lush', false, 'banana'), P('beach', 'Nosy Be', 'day', 'beach', true, 'palm'), P('terraces', 'the rice hills', 'day', 'lush', false, 'banana')],
  MH: [P('islandHut', 'the atolls', 'day', 'beach', true, 'palm'), P('beach', 'Majuro', 'day', 'beach', true, 'palm')],
  MK: [P('lakeMtn', 'Lake Ohrid', 'day', 'green', false, 'bread'), P('oldTown', 'Skopje', 'warm', 'stone', false, 'bread'), P('mosqueScene', 'Ohrid', 'warm', 'stone', false, 'bread')],
  ML: [P('mosqueScene', 'Djenné', 'sand', 'sand', false, 'camel'), P('desertScene', 'Timbuktu', 'sand', 'sand', false, 'camel'), P('canal', 'the Niger river', 'warm', 'lush', true, 'palm')],
  MM: [P('stupa', 'Bagan', 'warm', 'lush', false, 'palm'), P('canal', 'Inle Lake', 'day', 'lush', true, 'palm'), P('skyline', 'Yangon', 'dusk', 'stone', true, 'palm')],
  MN: [P('steppe', 'the steppe', 'day', 'green', false, 'bread'), P('desertScene', 'the Gobi', 'sand', 'sand', false, 'camel'), P('lakeMtn', 'Lake Khuvsgul', 'day', 'green', false, 'bread')],
  MR: [P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('beach', 'Nouadhibou', 'day', 'beach', true, 'palm')],
  MT: [P('oldTown', 'Valletta', 'warm', 'stone', true, 'olive'), P('beach', 'Gozo', 'day', 'stone', true, 'olive')],
  MU: [P('beach', 'Le Morne', 'day', 'beach', true, 'palm'), P('volcano', 'the crater', 'day', 'lush', true, 'palm'), P('terraces', 'the cane fields', 'day', 'lush', false, 'banana')],
  MV: [P('islandHut', 'an atoll', 'day', 'beach', true, 'palm'), P('beach', 'Malé lagoon', 'day', 'beach', true, 'palm')],
  MW: [P('lakeMtn', 'Lake Malawi', 'day', 'lush', false, 'corn'), P('terraces', 'the tea hills', 'day', 'lush', false, 'greentea')],
  MY: [P('skyline', 'Kuala Lumpur', 'dusk', 'stone', false, 'chili'), P('jungle', 'Borneo rainforest', 'day', 'lush', false, 'parrot'), P('islandHut', 'Langkawi', 'day', 'beach', true, 'palm')],
  MZ: [P('beach', 'the Indian Ocean coast', 'day', 'beach', true, 'palm'), P('savanna', 'the bush', 'warm', 'dry', false, 'corn'), P('islandHut', 'Ilha de Moçambique', 'day', 'beach', true, 'palm')],
  NA: [P('desertScene', 'the Namib', 'sand', 'sand', false, 'camel'), P('savanna', 'Etosha', 'warm', 'dry', false, 'elephant'), P('mesa', 'Sossusvlei', 'warm', 'red', false, 'camel')],
  NE: [P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('mosqueScene', 'Agadez', 'sand', 'sand', false, 'camel'), P('canal', 'the Niger river', 'warm', 'lush', true, 'corn')],
  NI: [P('volcano', 'Momotombo', 'day', 'lush', false, 'corn'), P('beach', 'San Juan del Sur', 'day', 'beach', true, 'palm'), P('oldTown', 'Granada', 'warm', 'stone', false, 'corn')],
  NL: [P('windmills', 'the tulip fields', 'day', 'green', false, 'cheese'), P('canal', 'Amsterdam', 'day', 'stone', false, 'cheese'), P('beach', 'the North Sea', 'day', 'beach', true, 'cheese')],
  NO: [P('fjord', 'the fjords', 'day', 'green', true, 'bread'), P('snowForest', 'the arctic north', 'dusk', 'snow', false, 'bread'), P('canal', 'Bergen', 'day', 'stone', true, 'bread')],
  NP: [P('lakeMtn', 'the Himalaya', 'day', 'snow', false, 'chili'), P('stupa', 'Kathmandu', 'warm', 'stone', false, 'chili'), P('terraces', 'the terraces', 'day', 'lush', false, 'chili')],
  NR: [P('islandHut', 'the island', 'day', 'beach', true, 'palm'), P('beach', 'the reef', 'day', 'beach', true, 'palm')],
  NZ: [P('lakeMtn', 'the Southern Alps', 'day', 'green', false, 'bread'), P('plains', 'the sheep farms', 'day', 'green', false, 'bread'), P('volcano', 'Rotorua', 'day', 'green', false, 'bread')],
  OM: [P('mosqueScene', 'Muscat', 'warm', 'sand', true, 'teapot'), P('desertScene', 'the Wahiba Sands', 'sand', 'sand', false, 'camel'), P('fjord', 'Musandam', 'day', 'sand', true, 'olive')],
  PA: [P('canal', 'the Panama Canal', 'day', 'lush', true, 'banana'), P('skyline', 'Panama City', 'dusk', 'stone', true, 'banana'), P('beach', 'Bocas del Toro', 'day', 'beach', true, 'palm')],
  PG: [P('jungle', 'the highlands', 'day', 'lush', false, 'parrot'), P('islandHut', 'a coastal village', 'day', 'beach', true, 'palm')],
  PK: [P('lakeMtn', 'the Karakoram', 'day', 'snow', false, 'naan'), P('mosqueScene', 'Lahore', 'warm', 'sand', false, 'naan'), P('skyline', 'Karachi', 'dusk', 'stone', true, 'naan')],
  PW: [P('islandHut', 'Rock Islands', 'day', 'beach', true, 'palm'), P('beach', 'a lagoon', 'day', 'beach', true, 'palm')],
  PY: [P('plains', 'the Chaco', 'warm', 'dry', false, 'corn'), P('canal', 'Asunción', 'warm', 'green', false, 'corn'), P('jungle', 'Iguazú', 'day', 'lush', false, 'parrot')],
  QA: [P('skyline', 'Doha', 'sand', 'sand', true, 'teapot'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel')],
  RO: [P('castle', 'Transylvania', 'dusk', 'green', false, 'garlic'), P('lakeMtn', 'the Carpathians', 'day', 'green', false, 'garlic'), P('oldTown', 'Bucharest', 'warm', 'stone', false, 'bread')],
  RS: [P('canal', 'Belgrade', 'warm', 'stone', true, 'bread'), P('plains', 'Vojvodina', 'warm', 'dry', false, 'chili'), P('lakeMtn', 'Tara mountain', 'day', 'green', false, 'bread')],
  RW: [P('terraces', 'the thousand hills', 'day', 'lush', false, 'banana'), P('lakeMtn', 'Lake Kivu', 'day', 'lush', false, 'banana')],
  SA: [P('desertScene', 'the Empty Quarter', 'sand', 'sand', false, 'camel'), P('mosqueScene', 'Mecca', 'warm', 'sand', false, 'teapot'), P('skyline', 'Riyadh', 'dusk', 'sand', false, 'teapot')],
  SB: [P('islandHut', 'the lagoon', 'day', 'beach', true, 'palm'), P('jungle', 'the rainforest', 'day', 'lush', false, 'parrot')],
  SC: [P('beach', 'Anse Source d’Argent', 'day', 'beach', true, 'palm'), P('islandHut', 'La Digue', 'day', 'beach', true, 'palm')],
  SD: [P('desertScene', 'the Nubian desert', 'sand', 'sand', false, 'camel'), P('canal', 'Khartoum, the Nile', 'warm', 'sand', false, 'camel')],
  SG: [P('skyline', 'Marina Bay', 'dusk', 'stone', true, 'chili'), P('jungle', 'the gardens', 'day', 'lush', false, 'chili'), P('oldTown', 'Chinatown', 'warm', 'stone', false, 'lantern')],
  SI: [P('lakeMtn', 'Lake Bled', 'day', 'green', false, 'bread'), P('castle', 'Ljubljana', 'warm', 'green', false, 'bread'), P('beach', 'Piran', 'day', 'stone', true, 'olive')],
  SK: [P('castle', 'Bratislava', 'day', 'green', true, 'bread'), P('lakeMtn', 'the High Tatras', 'day', 'green', false, 'cheese')],
  SL: [P('beach', 'Freetown coast', 'day', 'beach', true, 'palm'), P('jungle', 'the rainforest', 'day', 'lush', false, 'banana')],
  SM: [P('castle', 'Monte Titano', 'day', 'green', false, 'bread'), P('oldTown', 'San Marino', 'warm', 'stone', false, 'bread')],
  SN: [P('beach', 'Dakar coast', 'day', 'beach', true, 'palm'), P('islandHut', 'Saint-Louis', 'warm', 'sand', true, 'palm'), P('savanna', 'the baobab plains', 'warm', 'dry', false, 'corn')],
  SO: [P('beach', 'Mogadishu coast', 'day', 'beach', true, 'palm'), P('desertScene', 'the interior', 'sand', 'sand', false, 'camel')],
  SR: [P('jungle', 'the rainforest', 'day', 'lush', false, 'parrot'), P('canal', 'Paramaribo', 'warm', 'lush', true, 'palm')],
  SS: [P('savanna', 'the Sudd', 'warm', 'dry', false, 'elephant'), P('canal', 'the White Nile', 'warm', 'lush', false, 'corn')],
  ST: [P('volcano', 'Pico Cao Grande', 'day', 'lush', true, 'banana'), P('beach', 'the coast', 'day', 'beach', true, 'palm')],
  SV: [P('volcano', 'the volcanoes', 'day', 'lush', false, 'corn'), P('beach', 'El Tunco', 'day', 'beach', true, 'palm')],
  SY: [P('mosqueScene', 'Damascus', 'warm', 'sand', false, 'teapot'), P('oldTown', 'Aleppo', 'warm', 'stone', false, 'teapot'), P('beach', 'Latakia', 'day', 'beach', true, 'olive')],
  SZ: [P('lakeMtn', 'the mountains', 'day', 'green', false, 'corn'), P('savanna', 'the bush', 'warm', 'dry', false, 'corn')],
  TD: [P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('canal', 'Lake Chad', 'warm', 'lush', true, 'corn')],
  TG: [P('beach', 'Lomé coast', 'day', 'beach', true, 'palm'), P('jungle', 'the forest', 'day', 'lush', false, 'banana')],
  TJ: [P('lakeMtn', 'the Pamirs', 'day', 'snow', false, 'bread'), P('oldTown', 'Dushanbe', 'warm', 'stone', false, 'bread')],
  TL: [P('beach', 'Dili', 'day', 'beach', true, 'palm'), P('lakeMtn', 'Mount Ramelau', 'day', 'lush', false, 'banana')],
  TM: [P('desertScene', 'the Karakum', 'sand', 'sand', false, 'camel'), P('mosqueScene', 'Ashgabat', 'warm', 'sand', false, 'teapot')],
  TN: [P('oldTown', 'Sidi Bou Said', 'day', 'stone', true, 'olive'), P('desertScene', 'the Sahara', 'sand', 'sand', false, 'camel'), P('beach', 'Djerba', 'day', 'beach', true, 'olive')],
  TO: [P('islandHut', 'Vava’u', 'day', 'beach', true, 'palm'), P('beach', 'Nuku’alofa', 'day', 'beach', true, 'palm')],
  TT: [P('beach', 'Maracas Bay', 'day', 'beach', true, 'palm'), P('skyline', 'Port of Spain', 'dusk', 'stone', true, 'palm'), P('islandHut', 'Tobago', 'day', 'beach', true, 'lime')],
  TV: [P('islandHut', 'Funafuti atoll', 'day', 'beach', true, 'palm'), P('beach', 'a lagoon', 'day', 'beach', true, 'palm')],
  TZ: [P('savanna', 'the Serengeti', 'warm', 'dry', false, 'elephant'), P('volcano', 'Kilimanjaro', 'day', 'green', false, 'banana'), P('beach', 'Zanzibar', 'day', 'beach', true, 'palm')],
  UA: [P('plains', 'the wheat fields', 'day', 'dry', false, 'bread'), P('oldTown', 'Kyiv', 'warm', 'stone', false, 'bread'), P('lakeMtn', 'the Carpathians', 'day', 'green', false, 'bread')],
  UG: [P('lakeMtn', 'Lake Victoria', 'day', 'lush', false, 'banana'), P('savanna', 'the savanna', 'warm', 'dry', false, 'elephant'), P('jungle', 'Bwindi forest', 'day', 'lush', false, 'banana')],
  UY: [P('beach', 'Punta del Este', 'day', 'beach', true, 'lemon'), P('plains', 'the pampas', 'day', 'green', false, 'cheese'), P('oldTown', 'Montevideo', 'warm', 'stone', true, 'cheese')],
  UZ: [P('mosqueScene', 'Samarkand', 'warm', 'sand', false, 'teapot'), P('desertScene', 'the Kyzylkum', 'sand', 'sand', false, 'camel'), P('oldTown', 'Bukhara', 'warm', 'stone', false, 'bread')],
  VC: [P('volcano', 'La Soufrière', 'day', 'lush', true, 'palm'), P('islandHut', 'the Grenadines', 'day', 'beach', true, 'palm')],
  VE: [P('jungle', 'Angel Falls', 'day', 'lush', false, 'parrot'), P('beach', 'Margarita Island', 'day', 'beach', true, 'palm'), P('skyline', 'Caracas', 'dusk', 'stone', false, 'corn')],
  VU: [P('volcano', 'Mount Yasur', 'dusk', 'lush', true, 'palm'), P('islandHut', 'Efate', 'day', 'beach', true, 'palm')],
  WS: [P('beach', 'Lalomanu', 'day', 'beach', true, 'palm'), P('islandHut', 'Upolu', 'day', 'beach', true, 'palm')],
  YE: [P('oldTown', 'Sana’a', 'warm', 'sand', false, 'coffee'), P('peaks', 'the mountains', 'day', 'dry', false, 'coffee'), P('islandHut', 'Socotra', 'day', 'beach', true, 'palm')],
  ZM: [P('waterfall', 'Victoria Falls', 'day', 'lush', false, 'corn'), P('savanna', 'South Luangwa', 'warm', 'dry', false, 'elephant')],
  ZW: [P('waterfall', 'Victoria Falls', 'day', 'lush', false, 'corn'), P('savanna', 'Hwange', 'warm', 'dry', false, 'elephant'), P('mesa', 'Great Zimbabwe', 'warm', 'red', false, 'corn')]
};

const SEAFOOD = /fish|seafood|shrimp|prawn|crab|lobster|ceviche|calamari|squid|octopus|oyster|mussel|clam|tuna|salmon|cod|herring|sardine|anchov|eel|kingfish|tilapia|snapper|stockfish|dried fish|sushi|poke|bouillabaisse|chowder|grilled fish/i;
const SWEET = /cake|pastry|pudding|cookie|biscuit|dessert|sweet|candy|ice cream|halva|baklava|tart|doughnut|donut|pie\b|flan|custard|churro|bread|roll|bun\b|bagel|pancake|waffle|crepe|coffee|tea\b/i;
const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

// the place for this dish in a country covered here, or null
export function placeFor(iso, title) {
  const list = COUNTRY_PLACES[String(iso || '').toUpperCase()]; if (!list || !title) return null;
  const t = String(title);
  if (list.length > 1 && SEAFOOD.test(t)) { const s = list.find((p) => p[3]); if (s) return s; }
  if (list.length > 1 && SWEET.test(t)) { const c = list.find((p) => ['skyline', 'oldTown', 'canal', 'castle'].includes(p[6])); if (c) return c; }
  return list[hash(t) % list.length];
}
