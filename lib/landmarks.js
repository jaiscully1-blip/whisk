// Cartoon landmarks for recipe postcards (lib/scenes.js → postcardSvg): the place a dish comes from, drawn from simple
// shapes with a dark outline. Each draw(x) returns SVG standing on the ground line y = 150, centred on x.
// Plain strings: shared by the app and Whisk Play.

import { V, INK, o, hz, tx, lerp, recede, hills, range, land, water, foam, fog, birds, ribbon, rows, line, pine, cypress, palm, bush, tree, boat, block, farTown, put, frontShore } from './art/vista.js';
const O = "stroke='#3B2C24' stroke-width='2.2' stroke-linejoin='round' stroke-linecap='round'";
const at = (x, body, s = 1) => `<g transform='translate(${x} 0)${s !== 1 ? ` translate(0 150) scale(${s}) translate(0 -150)` : ''}'>${body}</g>`;

const eiffel = (x) => at(x, `<g fill='#8C6A4E' ${O}><path d='M-34 150L-7 38h14l27 112h-15q-12-30-25 0z'/><rect x='-17' y='98' width='34' height='7' rx='1'/><rect x='-11' y='66' width='22' height='6' rx='1'/><path d='M-4 38l4-24 4 24z'/></g><g stroke='#5E4632' stroke-width='1.2' opacity='.7' fill='none'><path d='M-24 140l18-90M24 140l-18-90M-27 132l42-26M27 132l-42-26M-14 92l22-18M14 92l-22-18'/></g>`);
const pisa = (x) => at(x, `<g transform='rotate(7 0 150)'><rect x='-17' y='46' width='34' height='104' rx='3' fill='#F6EEDF' ${O}/><g stroke='#3B2C24' stroke-width='1.6' fill='none'>${[62, 78, 94, 110, 126].map((y) => `<path d='M-17 ${y}h34'/>`).join('')}</g><g fill='#D8CBB4'>${[54, 70, 86, 102, 118, 134].map((y) => [-10, -2, 6].map((dx) => `<rect x='${dx}' y='${y}' width='4' height='7' rx='2'/>`).join('')).join('')}</g><rect x='-12' y='32' width='24' height='14' rx='3' fill='#F6EEDF' ${O}/></g>`);
const bigben = (x) => at(x, `<g ${O}><rect x='-15' y='52' width='30' height='98' fill='#D9B77E'/><rect x='-18' y='52' width='36' height='8' fill='#C29C5E'/><path d='M-15 52l15-34 15 34z' fill='#5A6B4E'/><path d='M0 18v-8' fill='none'/></g><circle cx='0' cy='72' r='10' fill='#FFF8E6' ${O}/><path d='M0 72v-6M0 72h5' stroke='#3B2C24' stroke-width='1.8' stroke-linecap='round'/><g stroke='#A9864D' stroke-width='1.4'>${[92, 108, 124, 140].map((y) => `<path d='M-15 ${y}h30'/>`).join('')}</g>`);
const pagoda = (x) => at(x, [[0, 150, 56, 24], [0, 120, 44, 22], [0, 92, 32, 20]].map(([, y, w, h], i) => `<rect x='${-w / 2 + 6}' y='${y - h}' width='${w - 12}' height='${h}' fill='#F3D9A4' ${O}/><path d='M${-w / 2 - 10} ${y - h + 2}q${w / 2 + 10} -14 ${w + 20} 0l-8 -10h${-w - 4}z' fill='${i % 2 ? '#B3262B' : '#C8352F'}' ${O}/>`).join('') + `<path d='M0 60v-14' stroke='#3B2C24' stroke-width='3'/><circle cx='0' cy='44' r='3' fill='#E0A93B'/>`);
const fuji = (x) => at(x, `<path d='M-98 150L-22 64q22-16 44 0L98 150z' fill='#7E9CC7' ${O}/><path d='M-22 64q22-16 44 0l14 18-12-4-10 8-8-8-10 8-8-8-12 4z' fill='#FFFFFF' ${O}/>`);
const torii = (x) => at(x, `<g fill='#D9452B' ${O}><rect x='-24' y='86' width='7' height='64'/><rect x='17' y='86' width='7' height='64'/><rect x='-28' y='92' width='56' height='6'/><path d='M-36 80q36 8 72 0l-3 8h-66z'/></g>`);
const kgate = (x) => at(x, `<rect x='-46' y='118' width='92' height='32' fill='#C2AE91' ${O}/><path d='M-14 150v-18a14 14 0 0 1 28 0v18z' fill='#5A4636' ${O}/><rect x='-38' y='96' width='76' height='22' fill='#B3392F' ${O}/><g fill='#3F8C77'>${[-30, -14, 2, 18].map((d) => `<rect x='${d}' y='100' width='10' height='6'/>`).join('')}</g><path d='M-58 98q58-26 116 0l-8-12q-50-18-100 0z' fill='#4A4A52' ${O}/><path d='M-40 84q40-20 80 0l-6-10q-34-14-68 0z' fill='#5A5A64' ${O}/>`);
const prang = (x) => at(x, `${[[-40, 0.55], [40, 0.55], [0, 1]].map(([dx, s]) => `<g transform='translate(${dx} 150) scale(${s}) translate(0 -150)'>${[[150, 50, 18], [132, 40, 18], [114, 30, 18], [96, 20, 20], [76, 12, 22]].map(([y, w, h], i) => `<path d='M${-w / 2} ${y}l${w * 0.12} ${-h}h${w * 0.76}l${w * 0.12} ${h}z' fill='${i % 2 ? '#F2C14E' : '#F6E3B4'}' ${O}/>`).join('')}<path d='M-3 54l3-24 3 24z' fill='#E0A93B' ${O}/></g>`).join('')}`);
const halong = (x) => at(x, `<path d='M-80 150q-4-58 16-70 16 8 14 70z' fill='#4F8A5B' ${O}/><path d='M-36 150q-8-90 22-100 24 14 16 100z' fill='#5E9C67' ${O}/><path d='M18 150q0-50 18-58 16 10 12 58z' fill='#4F8A5B' ${O}/><path d='M-60 148h70l-8 8h-56z' fill='#8A5A34' ${O}/><path d='M-30 148v-22l18 18' fill='#F2C14E' ${O}/>`);
const taj = (x) => at(x, `<rect x='-58' y='140' width='116' height='10' fill='#EDE6D8' ${O}/>${[-50, 50].map((d) => `<rect x='${d - 4}' y='74' width='8' height='66' fill='#FBF7EE' ${O}/><circle cx='${d}' cy='72' r='6' fill='#FBF7EE' ${O}/>`).join('')}<rect x='-32' y='104' width='64' height='36' fill='#FBF7EE' ${O}/><path d='M-10 140v-18a10 10 0 0 1 20 0v18z' fill='#D8CDB8' ${O}/><path d='M-24 104q-6-30 24-44 30 14 24 44z' fill='#FBF7EE' ${O}/><path d='M0 60v-12' stroke='#C9A04B' stroke-width='3'/>${[-20, 20].map((d) => `<path d='M${d - 9} 104q0-14 9-18 9 4 9 18z' fill='#FBF7EE' ${O}/>`).join('')}`);
const mosque = (x) => at(x, `${[-44, 44].map((d) => `<rect x='${d - 5}' y='58' width='10' height='92' fill='#F2E6D0' ${O}/><path d='M${d - 7} 60l7-16 7 16z' fill='#2E8A8F' ${O}/>`).join('')}<rect x='-32' y='100' width='64' height='50' fill='#F2E6D0' ${O}/><path d='M-28 100q0-38 28-44 28 6 28 44z' fill='#2E8A8F' ${O}/><path d='M0 56v-12' stroke='#3B2C24' stroke-width='2'/><path d='M-4 44a5 5 0 1 0 8 0' fill='none' stroke='#E0A93B' stroke-width='2'/><path d='M-10 150v-24a10 10 0 0 1 20 0v24z' fill='#B88B57' ${O}/>`);
const pyramids = (x) => at(x, `<path d='M-96 150l48-66 48 66z' fill='#E2B66B' ${O}/><path d='M-48 84l48 66h-26z' fill='#C7944A'/><path d='M-30 150l40-54 40 54z' fill='#E8C27C' ${O}/><path d='M10 96l40 54h-22z' fill='#C99A55'/><path d='M40 150l22-30 22 30z' fill='#E2B66B' ${O}/>`);
const tukul = (x) => at(x, `<path d='M10 150v-46' stroke='#6B4A2B' stroke-width='5'/><path d='M-20 106q30-22 64-4-10 10-34 8-18 6-30-4z' fill='#6E8F3E' ${O}/><rect x='-66' y='116' width='44' height='34' fill='#C99A63' ${O}/><path d='M-74 118l30-34 30 34z' fill='#D9B26A' ${O}/><path d='M-50 150v-18h12v18z' fill='#5A3A22'/>`);
const chichen = (x) => at(x, `${[[150, 120], [132, 96], [114, 74], [96, 54]].map(([y, w]) => `<rect x='${-w / 2}' y='${y - 18}' width='${w}' height='18' fill='#C9AE84' ${O}/>`).join('')}<path d='M-10 150v-72h20v72z' fill='#A88C62' ${O}/><g stroke='#7E6646' stroke-width='1.2'>${[86, 96, 106, 116, 126, 136, 146].map((y) => `<path d='M-10 ${y}h20'/>`).join('')}</g><rect x='-16' y='60' width='32' height='18' fill='#BFA27A' ${O}/><rect x='-6' y='66' width='12' height='12' fill='#5A4636'/>`);
const sugarloaf = (x) => at(x, `<path d='M-96 150q4-58 34-78 30 20 40 78z' fill='#5E8F4F' ${O}/><path d='M-14 150q10-46 44-56 34 14 40 56z' fill='#6E9F5B' ${O}/><g fill='#FFFFFF' ${O}><rect x='-64' y='50' width='5' height='24'/><rect x='-74' y='54' width='25' height='5'/></g>`);
const santorini = (x) => at(x, `<rect x='-46' y='104' width='54' height='46' fill='#FFFFFF' ${O}/><path d='M-38 104q0-26 18-28 18 2 18 28z' fill='#2F6DB5' ${O}/><path d='M-20 76v-10M-24 70h8' stroke='#3B2C24' stroke-width='2'/><rect x='8' y='118' width='42' height='32' fill='#FFFFFF' ${O}/><rect x='20' y='128' width='10' height='22' fill='#2F6DB5' ${O}/><rect x='-28' y='122' width='12' height='16' rx='6' fill='#2F6DB5' ${O}/><rect x='-6' y='86' width='18' height='18' fill='#FFFFFF' ${O}/><path d='M-2 104v-10a5 5 0 0 1 10 0v10' fill='none' stroke='#3B2C24' stroke-width='2'/>`);
const sagrada = (x) => at(x, `${[[-30, 70], [-10, 46], [10, 46], [30, 70]].map(([d, top]) => `<path d='M${d - 9} 150v-${150 - top - 30}q9-${30} 9-30q0 0 9 30v${150 - top - 30}z' fill='#C9A877' ${O}/><circle cx='${d}' cy='${top - 4}' r='4' fill='#E0A93B' ${O}/>`).join('')}<path d='M-40 150v-34h80v34z' fill='#B8976A' ${O}/><path d='M-10 150v-20a10 10 0 0 1 20 0v20z' fill='#5A4636'/>`);
const lighthouse = (x) => at(x, `<path d='M-14 150l6-82h16l6 82z' fill='#FFFFFF' ${O}/><g fill='#D9452B'><path d='M-12 128h24l1 12h-26z'/><path d='M-10 100h20l1 12h-22z'/><path d='M-9 76h18l.6 10h-19.2z'/></g><rect x='-11' y='56' width='22' height='12' fill='#FFE08A' ${O}/><path d='M-14 56l14-12 14 12z' fill='#D9452B' ${O}/><path d='M-12 150l-2-82' fill='none' stroke='#3B2C24' stroke-width='2.2'/><path d='M14 150l-6-82' fill='none' stroke='#3B2C24' stroke-width='2.2'/>`);
const olives = (x) => at(x, `<rect x='-50' y='110' width='46' height='40' fill='#FFFFFF' ${O}/><rect x='-36' y='124' width='14' height='26' fill='#2F6DB5' ${O}/><path d='M24 150q-4-20 4-34' stroke='#6B4A2B' stroke-width='5' fill='none'/><g fill='#7C9A55' ${O}><circle cx='12' cy='104' r='16'/><circle cx='36' cy='100' r='18'/><circle cx='24' cy='86' r='16'/></g>`);
const house = (x) => at(x, `<rect x='-34' y='104' width='68' height='46' fill='#F6E6D2' ${O}/><path d='M-44 106l44-36 44 36z' fill='#C0503A' ${O}/><rect x='-8' y='122' width='16' height='28' fill='#7A4A2A' ${O}/><rect x='-28' y='114' width='14' height='12' fill='#BFE3F5' ${O}/><rect x='14' y='114' width='14' height='12' fill='#BFE3F5' ${O}/><rect x='14' y='76' width='10' height='18' fill='#8A5A34' ${O}/>`);
const liberty = (x) => at(x, `<path d='M-30 150l6-30h48l6 30z' fill='#C9B79A' ${O}/><rect x='-20' y='108' width='40' height='14' fill='#B8A688' ${O}/><path d='M-14 108q-2-30 6-46h18q8 16 6 46z' fill='#6FB7A0' ${O}/><path d='M-8 74q8 6 16 0' fill='none' stroke='#3B2C24' stroke-width='1.6'/><path d='M8 70l12-34' stroke='#3B2C24' stroke-width='9' stroke-linecap='round'/><path d='M8 70l12-34' stroke='#6FB7A0' stroke-width='5' stroke-linecap='round'/><rect x='16' y='26' width='9' height='10' rx='2' fill='#6FB7A0' ${O}/><path d='M20 26q-7-8 0-16 7 8 0 16z' fill='#FFB703' ${O}/><circle cx='0' cy='56' r='9' fill='#6FB7A0' ${O}/>${[-60, -30, 0, 30, 60].map((a) => `<path d='M0 50l0 -11' transform='rotate(${a} 0 52)' stroke='#3B2C24' stroke-width='4.5' stroke-linecap='round'/><path d='M0 50l0 -11' transform='rotate(${a} 0 52)' stroke='#6FB7A0' stroke-width='2' stroke-linecap='round'/>`).join('')}<path d='M-14 84l-8 18' stroke='#3B2C24' stroke-width='2'/><rect x='-24' y='86' width='9' height='14' fill='#E7D8B5' ${O} transform='rotate(-14 -20 92)'/>`);

// ---- the same places as whole views in perspective (lib/art/vista.js): far things small and pale, near things big ----
const STONE = '#E6DCC8';
const eiffelV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 2], [90, H - 8], [200, H - 4], [300, H - 10], [420, H - 6]], '#9DB59A', 0.55, false, H + 2)}${farTown(c, -10, 420, H + 1, '#C9C3D6', 0.4, 12, 7)}
${land(c, [[-20, 128], [120, 124], [260, 122], [420, 124]])}
${ribbon([[150, 214, 150], [196, 168, 92], [228, 140, 44], [246, 126, 18], [256, 121, 6]], '#5FA8C8', false)}${ribbon([[150, 214, 150], [196, 168, 92], [228, 140, 44], [246, 126, 18], [256, 121, 6]], 'none')}
<path d='M206 152q20-14 44 0' fill='none' stroke='${INK}' stroke-width='2'/><path d='M200 154h56' stroke='${INK}' stroke-width='3'/><rect x='200' y='150' width='56' height='5' fill='${STONE}' ${o}/>
${line([400, 150], [276, 123], 6, 1, 0.28, (x, y, s) => tx(x, y, s, `${block(x, y, 30, 34, '#EFE2C8')}<path d='M${x - 17} ${y - 34}h34l-4-9h-26z' fill='#7E8AA0' ${O}/>`))}
${line([62, 148], [212, 124], 6, 1, 0.3, (x, y, s) => tree(x, y, s * 0.9, '#6FA65A'))}
${put(eiffel, 112, 138, 0.95)}${birds([[226, 56], [244, 48, 0.8]])}`; });

const pisaV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 6], [70, H - 18], [170, H - 8], [280, H - 20], [420, H - 6]], '#A9B98A', 0.55, false, H + 4)}${line([380, H + 2], [240, H + 1], 6, 0.6, 0.35, (x, y, s) => cypress(x, y, s, hz(c, '#3F6E3A', 0.35), false))}
${land(c, [[-20, 126], [140, 122], [420, 124]])}
<g>${tx(250, 136, 0.62, `<rect x='200' y='104' width='120' height='32' fill='#F6EEDF' ${O}/><path d='M196 106l64-22 64 22z' fill='#F2E6D0' ${O}/><path d='M240 84q20-30 40 0z' fill='#F6EEDF' ${O}/>${[212, 232, 252, 272, 292, 308].map((x) => `<path d='M${x} 136v-18a5 5 0 0 1 10 0v18' fill='none' stroke='#C9BFA9' stroke-width='2'/>`).join('')}`)}</g>
${ribbon([[150, 214, 120], [176, 170, 60], [196, 140, 22], [206, 126, 8]], '#EFE7D6', false)}
${put(pisa, 100, 140, 0.95)}`; });

const bigbenV = V((c) => { const H = 116;
  return `${farTown(c, -10, 420, H + 1, '#B8B4C8', 0.45, 14, 5)}<circle cx='330' cy='${H - 22}' r='24' fill='none' stroke='${hz(c, '#8A94A2', 0.5)}' stroke-width='2'/><path d='M330 ${H - 46}V${H}M306 ${H - 22}H354M313 ${H - 39}l34 34M347 ${H - 39}l-34 34' stroke='${hz(c, '#8A94A2', 0.55)}' stroke-width='1'/>
${water(c, H + 2, 200, '#6E9FB8')}
${line([175, 140], [300, 119], 7, 1, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 16}' y='${y - 30}' width='32' height='30' fill='#D9B77E' ${O}/>${[-12, 0, 12].map((d) => `<path d='M${x + d - 2} ${y - 30}v-8l2-4 2 4v8' fill='#C29C5E' ${o}/>`).join('')}<path d='M${x - 12} ${y - 18}h24M${x - 12} ${y - 9}h24' stroke='#A9864D' stroke-width='1.6'/>`))}
<path d='M222 140q14-10 28 0 14-10 28 0 14-10 28 0' fill='none' stroke='${INK}' stroke-width='2'/><rect x='214' y='134' width='108' height='6' fill='#5E8F6A' ${O}/>
${land(c, [[-20, 160], [80, 146], [170, 142], [200, 150], [200, 200]])}${frontShore(c, '#B8A688', 150)}
${put(bigben, 108, 142, 1.0)}${tx(150, 144, 0.9, `<rect x='132' y='108' width='60' height='36' fill='#D9B77E' ${O}/>${[140, 156, 172, 186].map((x) => `<path d='M${x} 108v-10l3-6 3 6v10' fill='#C29C5E' ${o}/><rect x='${x - 1}' y='118' width='6' height='12' fill='#A9864D'/>`).join('')}`)}${boat(260, 150, 0.7, '#2F6DB5')}`; });

const pagodaV = V((c) => { const H = 120;
  return `${hills(c, [[-20, 70], [30, 50], [80, 78], [140, 46], [200, 84], [260, 52], [330, 80], [380, 58], [420, 76]], '#9FB3B0', 0.62, false, H)}${hills(c, [[-20, 96], [60, 80], [120, 100], [190, 76], [260, 104], [330, 86], [420, 100]], '#86A89A', 0.4, false, H + 2)}
${water(c, H, 200, '#6FB0C8')}
${fog([[120, H - 6, 80, 6], [320, H - 10, 70, 6]])}
${land(c, [[-20, 128], [40, 118], [110, 116], [170, 126], [190, 150], [190, 200], [-20, 200]])}${frontShore(c, '#A9C77A', 150)}
<path d='M180 148q30-22 60 0' fill='none' stroke='#C8352F' stroke-width='5'/><path d='M180 148q30-22 60 0' fill='none' stroke='${INK}' stroke-width='1.6' transform='translate(0 -3)'/>${line([238, 146], [300, 128], 3, 0.8, 0.4, (x, y, s) => `<rect x='${x - 6 * s}' y='${y - 3 * s}' width='${12 * s}' height='${4 * s}' fill='#C9BFA9'/>`)}
${put(pagoda, 90, 120, 1.05)}${tree(30, 124, 0.8, '#5E9C4F')}${tree(158, 128, 0.7, '#6FAA5A')}`; });

const fujiV = V((c) => { const H = 120;
  return `<path d='M60 ${H}L170 34q26-12 52 0L330 ${H}z' fill='${hz(c, '#7E9CC7', 0.25)}'/><path d='M170 34q26-12 52 0l18 24-14-6-12 10-10-10-12 10-10-10-14 8z' fill='${hz(c, '#FFFFFF', 0.1)}'/>
${hills(c, [[-20, H - 10], [40, H - 18], [110, H - 6], [300, H - 8], [360, H - 20], [420, H - 10]], '#6E9068', 0.35, false, H + 2)}
${water(c, H, 200, '#5E9CC8')}<path d='M90 ${H + 2}L196 196 300 ${H + 2}z' fill='#7E9CC7' opacity='.22'/>
${line([300, 150], [220, 124], 5, 1, 0.35, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}v-20' stroke='#6B4A2B' stroke-width='3'/><g fill='#F7C6D6' ${o}><circle cx='${x}' cy='${y - 26}' r='11'/><circle cx='${x - 9}' cy='${y - 20}' r='8'/><circle cx='${x + 9}' cy='${y - 20}' r='8'/></g>`))}
${frontShore(c, '#B9C98A', 150)}
${put(torii, 92, 156, 1.25)}${foam(70, 156, 14)}${foam(114, 156, 14)}${birds([[150, 70], [166, 62, 0.8]])}`; });

const kgateV = V((c) => { const H = 112;
  return `${range(c, H + 4, [[60, 54, 90], [220, 70, 110], [360, 50, 80]], '#8EA48E', 0.5, { snow: false })}
${land(c, [[-20, H + 6], [200, H + 4], [420, H + 6]], '#D8CCB4')}${rows(c, 200, H, H + 6, [-80, 0, 80, 160, 240, 320, 400, 480], '#C4B79C', 2)}
${line([300, 140], [260, H + 6], 4, 0.8, 0.3, (x, y, s) => tx(x, y, s, `<rect x='${x - 40}' y='${y - 18}' width='80' height='18' fill='#B3392F' ${O}/><path d='M${x - 52} ${y - 16}q52-20 104 0l-8-10q-44-14-88 0z' fill='#4A4A52' ${O}/>`))}
${put(kgate, 108, 146, 1.15)}${tree(20, 150, 0.9, '#6FAA5A')}`; });

const prangV = V((c) => { const H = 116;
  return `${farTown(c, 210, 420, H + 1, '#B7C6D6', 0.45, 26, 2)}${water(c, H + 2, 200, '#8FAE7A')}
${land(c, [[-20, 134], [60, 128], [180, 126], [220, 134], [220, 200]])}${frontShore(c, '#C9A97A', 152)}
${line([250, 148], [330, 122], 4, 1, 0.35, (x, y, s) => tx(x, y, s, `<path d='M${x - 22} ${y}q22 8 44 0l-4-6h-36z' fill='#7A4A2A' ${o}/><path d='M${x - 10} ${y - 6}h20v-6h-20z' fill='#E0A93B' ${o}/>`))}
${put(prang, 100, 132, 1.0)}${palm(190, 134, 0.8)}`; });

const halongV = V((c) => { const H = 118;
  const karst = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 18} ${y}q-6-50 8-64 14-6 18 10 8 30 6 54z' fill='${hz(c, '#4F8A5B', t)}' ${t < 0.2 ? O : ''}/>`);
  return `${water(c, H, 200, '#5FB0B8')}${[[330, 0.45, 0.6], [270, 0.5, 0.55], [380, 0.55, 0.5], [210, 0.6, 0.45], [150, 0.7, 0.4], [300, 0.75, 0.35]].map(([x, s, t]) => karst(x, H + 2, s, t)).join('')}
${fog([[250, H - 2, 120, 5], [90, H, 70, 4]])}${karst(60, 160, 1.6, 0)}${karst(150, 150, 1.0, 0.1)}
<g>${tx(230, 152, 1.1, `<path d='M200 152h56l-8 10h-40z' fill='#8A5A34' ${O}/><path d='M214 150V112l18 36zM236 150v-30l14 28z' fill='#C8452B' ${O}/><path d='M218 120h12M218 132h14M238 128h8' stroke='#8E2A1A' stroke-width='1.4'/>`)}</g>${foam(230, 164, 30)}
${frontShore(c, '#E6D8B0', 152)}`; });

const tajV = V((c) => { const H = 122, vx = 150;
  return `${land(c, [[-20, H], [420, H]])}${rows(c, vx, H - 30, H, [20, 280], '#6FA65A', 6)}
${ribbon([[vx, 206, 116], [vx, 160, 44], [vx, 136, 16], [vx, 124, 6]], '#8FC8E0', true)}<path d='M${vx} 124V206' stroke='#FFFFFF' stroke-width='1.4' opacity='.6'/>
${line([18, 160], [132, 124], 7, 1.15, 0.3, (x, y, s) => cypress(x, y, s, '#3F6E3A'))}${line([282, 160], [168, 124], 7, 1.15, 0.3, (x, y, s) => cypress(x, y, s, '#3F6E3A'))}
${put(taj, vx, H + 2, 0.86)}`; });

const mosqueV = V((c) => { const H = 116;
  return `${hills(c, [[-20, H - 4], [100, H - 16], [240, H - 8], [420, H - 18]], '#C9B488', 0.5, false, H + 2)}${farTown(c, 200, 420, H + 1, '#E9DCC0', 0.35, 14, 4)}
${land(c, [[-20, 128], [200, 124], [420, 126]])}
${line([380, 150], [230, 124], 7, 1, 0.3, (x, y, s, i) => tx(x, y, s, block(x, y, 30, 22 + (i % 3) * 6, ['#F2E6D0', '#E8D6B4', '#F6EEDF'][i % 3])))}
${line([20, 152], [70, 132], 3, 1, 0.6, (x, y, s, i) => tx(x, y, s, block(x, y, 30, 20 + i * 4, '#EADBC0')))}
${put(mosque, 122, 142, 0.98)}${palm(198, 146, 0.75)}`; });

const pyramidsV = V((c) => { const H = 122;
  const pyr = (x, y, s, t) => tx(x, y, s, `<path d='M${x - 60} ${y}L${x} ${y - 64}L${x + 60} ${y}z' fill='${hz(c, '#E2B66B', t)}' ${t < 0.2 ? O : ''}/><path d='M${x} ${y - 64}L${x + 60} ${y}H${x + 18}z' fill='${hz(c, '#C7944A', t)}'/>${t < 0.2 ? `<path d='M${x - 40} ${y - 20}h80M${x - 26} ${y - 36}h52M${x - 14} ${y - 50}h28' stroke='#B88A48' stroke-width='1.2'/>` : ''}`);
  return `${hills(c, [[-20, H - 2], [120, H - 10], [260, H - 4], [420, H - 12]], '#E8C890', 0.5, false, H + 2)}${pyr(330, H + 1, 0.42, 0.45)}${pyr(250, H + 4, 0.7, 0.25)}
${land(c, [[-20, 134], [120, 128], [260, 132], [420, 128]])}${pyr(104, 146, 1.08, 0)}
${hills(c, [[-20, 160], [80, 150], [200, 156], [320, 146], [420, 152]], '#E9C98A', 0, true)}
${line([200, 150], [300, 132], 4, 0.6, 0.3, (x, y, s) => tx(x, y, s, `<path d='M${x - 22} ${y}v-14c-4-2-4-8 0-10 4-8 12-8 14-2 4-6 12-6 14 0 4 2 6 6 4 10v16M${x - 10} ${y}v-12M${x + 8} ${y}v-12' fill='#C99A5A' ${o}/>`), 0.8)}`; });

const tukulV = V((c) => { const H = 112;
  const amba = (x, y, w, h, t) => `<path d='M${x - w} ${y}L${x - w * 0.6} ${y - h}H${x + w * 0.6}L${x + w} ${y}z' fill='${hz(c, '#9C8A5A', t)}' ${t < 0.2 ? O : ''}/>`;
  return `${amba(90, H + 6, 70, 36, 0.55)}${amba(250, H + 6, 90, 50, 0.5)}${amba(380, H + 6, 60, 30, 0.6)}${hills(c, [[-20, H + 4], [120, H - 4], [260, H + 6], [420, H]], '#A9A05E', 0.35, false, H + 10)}
${land(c, [[-20, 130], [140, 124], [300, 128], [420, 124]])}
${ribbon([[210, 210, 60], [190, 170, 30], [220, 144, 14], [260, 130, 6]], '#D9B98A', false)}
${line([320, 148], [280, 128], 4, 0.9, 0.35, (x, y, s) => tx(x, y, s, `<rect x='${x - 14}' y='${y - 18}' width='28' height='18' fill='#C99A63' ${o}/><path d='M${x - 20} ${y - 16}l20-20 20 20z' fill='#D9B26A' ${o}/>`))}
${put(tukul, 100, 146, 1.0)}`; });

const chichenV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 14], [50, H - 22], [120, H - 12], [200, H - 24], [280, H - 14], [350, H - 26], [420, H - 14]], '#4F8A4E', 0.5, false, H + 2)}${hills(c, [[-20, H], [90, H - 8], [190, H + 2], [300, H - 8], [420, H]], '#5E9C55', 0.3, false, H + 6)}
${line([300, H + 10], [380, H + 4], 3, 0.6, 0.4, (x, y, s) => tx(x, y, s, `<rect x='${x - 26}' y='${y - 14}' width='52' height='14' fill='${hz(c, '#C9AE84', 0.3)}'/>${[0, 1, 2, 3].map((i) => `<rect x='${x - 22 + i * 12}' y='${y - 11}' width='6' height='9' fill='${hz(c, '#8A7656', 0.3)}'/>`).join('')}`))}
${land(c, [[-20, 132], [160, 128], [420, 130]])}${rows(c, 110, H - 10, 132, [40, 180], '#9CB86A', 3)}
${put(chichen, 104, 144, 1.08)}${bush(210, 150, 1, '#5E9C4F')}${bush(24, 154, 0.9, '#4F8A44')}`; });

const sugarloafV = V((c) => { const H = 118;
  return `<path d='M300 ${H}q16-46 34-56 8-10 14-4 6 0 6 8 14 20 26 52z' fill='${hz(c, '#4F7F4A', 0.5)}'/><path d='M345 56v-10M339 50h12' stroke='${hz(c, '#FFFFFF', 0.3)}' stroke-width='2.6'/>
${water(c, H, 200, '#4FA9D6')}${farTown(c, 210, 300, H + 1, '#E9E2D4', 0.3, 14, 9)}
${hills(c, [[-20, 160], [20, 150], [60, 64], [80, 52], [104, 60], [124, 120], [150, 150], [150, 200]], '#5E8F4F', 0, true)}${hills(c, [[120, 160], [150, 140], [176, 98], [196, 92], [220, 118], [240, 150], [240, 200]], '#6E9F5B', 0.1, true)}
<path d='M84 52L190 94' stroke='${INK}' stroke-width='1.4'/>${tx(140, 74, 1, `<rect x='134' y='72' width='12' height='9' rx='2' fill='#E8735A' ${o}/>`)}
${frontShore(c, '#F2DFA6', 150)}${line([250, 150], [330, 136], 4, 0.9, 0.4, (x, y, s) => palm(x, y, s * 0.7))}`; });

const santoriniV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#3E8FCF')}<path d='M250 ${H}q30-14 70-10t60 10z' fill='${hz(c, '#8A7A6A', 0.5)}'/>
${hills(c, [[-20, 46], [40, 54], [100, 74], [160, 104], [210, 128], [240, 150], [240, 200]], '#B49A80', 0, true)}<path d='M-20 60q60 6 110 30t110 40' fill='none' stroke='#9C8268' stroke-width='2'/>
${line([30, 74], [196, 128], 9, 1.1, 0.4, (x, y, s, i) => tx(x, y, s, `<rect x='${x - 14}' y='${y - 18}' width='28' height='20' fill='#FFFFFF' ${o}/><rect x='${x - 4}' y='${y - 10}' width='8' height='12' fill='#2F6DB5' ${o}/>${i % 3 === 1 ? `<path d='M${x - 10} ${y - 18}q10-14 20 0z' fill='#2F6DB5' ${o}/>` : ''}`))}
${put(santorini, 66, 128, 0.78)}${frontShore(c, '#E8E2D4', 152)}${boat(290, 140, 0.8, '#FFFFFF')}`; });

const sagradaV = V((c) => { const H = 112;
  return `${water(c, H - 6, H + 2, '#6FB6E0')}<path d='M300 ${H}q30-26 70-22t50 22z' fill='${hz(c, '#7E9C6A', 0.5)}'/>
${land(c, [[-20, H + 2], [420, H + 2]], hz(c, '#E8D6B4', 0.25))}${farTown(c, -10, 420, H + 8, '#E3B98E', 0.45, 6, 3)}${farTown(c, -10, 420, H + 16, '#E8C9A0', 0.3, 9, 8)}${farTown(c, -10, 420, H + 27, '#E3B98E', 0.15, 13, 5)}
${land(c, [[-20, 142], [420, 140]], c.gid ? `url(#${c.gid})` : '#C9B07A')}${line([400, 152], [230, 140], 5, 1, 0.5, (x, y, s, i) => tx(x, y, s, block(x, y, 34, 22, ['#E8C9A0', '#F2DDBE', '#E3B98E'][i % 3])))}
${ribbon([[200, 210, 70], [214, 160, 24], [222, H + 10, 4]], '#D9CBB0', false)}
${put(sagrada, 108, 144, 1.05)}${tree(176, 150, 0.8, '#6FAA5A')}`; });

const lighthouseV = V((c) => { const H = 118;
  return `${water(c, H, 200, '#3FB0D0')}${hills(c, [[180, H + 2], [260, H - 8], [340, H - 4], [420, H - 10]], '#5E9F55', 0.45, false, H + 3)}
${line([400, 150], [250, 122], 6, 1, 0.3, (x, y, s) => palm(x, y, s * 0.75))}
${hills(c, [[-20, 110], [40, 104], [110, 112], [170, 140], [200, 160], [200, 200]], '#8A8A7A', 0, true)}${hills(c, [[-20, 126], [60, 120], [130, 132], [170, 160], [170, 200]], '#6FA65A', 0, true)}
${foam(190, 152, 22)}${frontShore(c, '#F2DFA6', 152)}
${put(lighthouse, 70, 128, 0.82)}${boat(240, 140, 0.7)}`; });

const libertyV = V((c) => { const H = 118;
  return `${(() => { let s = 11, out = ''; for (let x = 190; x < 420;) { s = (s * 9301 + 49297) % 233280; const w = 8 + (s % 10), h = 14 + (s % 46); out += `<rect x='${x}' y='${H - h}' width='${w}' height='${h + 1}' fill='${hz(c, '#9AAAC0', 0.4)}'/>`; x += w + 1; } return out; })()}
${water(c, H, 200, '#5B9CC4')}
<path d='M10 152l40-12h90l40 12z' fill='#9DB56A' ${O}/><path d='M50 144l16-8h58l16 8z' fill='#C9B79A' ${O}/>
${put(liberty, 92, 140, 0.95)}${tx(260, 140, 0.8, `<path d='M230 140h60l-6 8h-48z' fill='#F2C14E' ${o}/><rect x='238' y='130' width='44' height='10' fill='#FFFFFF' ${o}/>`)}${frontShore(c, '#B8A688', 152)}`; });

const olivesV = V((c) => { const H = 116;
  const olive = (x, y, s, t) => tx(x, y, s, `<path d='M${x} ${y}q-2-10 2-18' stroke='#6B4A2B' stroke-width='4' fill='none'/><g fill='${hz(c, '#7C9A55', t)}' ${t < 0.2 ? o : ''}><circle cx='${x - 8}' cy='${y - 22}' r='10'/><circle cx='${x + 8}' cy='${y - 24}' r='11'/><circle cx='${x}' cy='${y - 32}' r='10'/></g>`);
  return `${water(c, H - 8, H + 2, '#4FA9D6')}${land(c, [[-20, H + 2], [420, H + 2]])}
${[-60, 40, 140, 240, 340, 440].map((x0) => line([x0, 158], [lerp(x0, 200, 0.85), H + 6], 6, 1, 0.25, (x, y, s) => olive(x, y, s, lerp(0, 0.4, 1 - s)))).join('')}
${put(olives, 110, 140, 0.9)}`; });

const houseV = V((c) => { const H = 118;
  return `${hills(c, [[-20, H - 4], [90, H - 12], [200, H - 2], [320, H - 14], [420, H - 4]], '#7FA866', 0.5, false, H + 4)}${line([360, H + 2], [240, H + 1], 5, 0.5, 0.3, (x, y, s) => tree(x, y, s, hz(c, '#5E9C4F', 0.4), false))}
${land(c, [[-20, 128], [200, 122], [420, 126]])}${rows(c, 230, H - 6, 128, [300, 420, 520], '#7FAE5A', 3)}
${ribbon([[300, 210, 90], [270, 170, 46], [250, 142, 18], [242, 126, 6]], '#C9B07A', false)}
${line([360, 166], [262, 128], 7, 1, 0.3, (x, y, s) => `<path d='M${x} ${y}v-${16 * s}' stroke='#8A5A34' stroke-width='${3 * s}'/>`)}
${put(house, 104, 146, 1.2)}${tree(30, 150, 1.1, '#5E9C4F')}${tree(180, 140, 0.8, '#6FAA5A')}`; });
const fujiToriiV = fujiV;

// sky [top, bottom], ground [top, bottom], water: a strip of sea behind the ground
const SKY = { day: ['#8FD3F4', '#D9F1FB'], warm: ['#FFB570', '#FFE7B8'], dusk: ['#7B6CD9', '#FFB3A1'], sand: ['#8ACFF0', '#FCE7BF'] };
// iso → [landmark draw, sky, ground colours, sea?, buddy (a drawn animal/plant/thing from there, lib/art/scenery.js), place name]
const BY_ISO = {
  FR: [eiffelV, 'day', ['#8CC56B', '#6FAA52'], false, 'croissant', 'Paris'], IT: [pisaV, 'warm', ['#9CC86A', '#7FAE4E'], false, 'tomato', 'Pisa'],
  GB: [bigbenV, 'dusk', ['#7FB069', '#5E8F4F'], false, 'teacup', 'London'], CN: [pagodaV, 'warm', ['#8CC56B', '#6FAA52'], false, 'panda', 'China'],
  JP: [fujiV, 'dusk', ['#9CC86A', '#7FAE4E'], false, 'blossom', 'Mount Fuji'], KR: [kgateV, 'day', ['#8CC56B', '#6FAA52'], false, 'lantern', 'Seoul'],
  TH: [prangV, 'warm', ['#7FBF6A', '#5E9F4F'], false, 'elephant', 'Bangkok'], VN: [halongV, 'day', ['#7FBF6A', '#5E9F4F'], true, 'conehat', 'Ha Long Bay'],
  IN: [tajV, 'warm', ['#8CC56B', '#6FAA52'], false, 'elephant', 'Agra'], LB: [mosqueV, 'sand', ['#E9CF95', '#D9B877'], false, 'olive', 'Beirut'],
  TR: [mosqueV, 'dusk', ['#E9CF95', '#D9B877'], false, 'teapot', 'Istanbul'], TN: [mosqueV, 'sand', ['#E9CF95', '#D9B877'], false, 'camel', 'Tunis'],
  EG: [pyramidsV, 'sand', ['#EBC98A', '#D9B26A'], false, 'camel', 'Giza'], ET: [tukulV, 'warm', ['#B9A55E', '#9C8A48'], false, 'jebena', 'Ethiopia'],
  MX: [chichenV, 'warm', ['#A9C76A', '#8CAE4E'], false, 'cactus', 'Chichén Itzá'], BR: [sugarloafV, 'day', ['#7FBF6A', '#5E9F4F'], true, 'parrot', 'Rio de Janeiro'],
  GR: [santoriniV, 'day', ['#E8E2D4', '#D8CFBD'], true, 'olive', 'Santorini'], ES: [sagradaV, 'warm', ['#C9B07A', '#B39A62'], false, 'chili', 'Barcelona'],
  JM: [lighthouseV, 'day', ['#F2DFA6', '#E6CB85'], true, 'palm', 'Jamaica'], CU: [lighthouseV, 'warm', ['#F2DFA6', '#E6CB85'], true, 'palm', 'Cuba'],
  US: [libertyV, 'day', ['#8CC56B', '#6FAA52'], false, 'milkshake', 'New York']
};
// no country: by the restaurant region (lib/culture.js motif)
const BY_MOTIF = {
  clouds: 'CN', seigaiha: 'JP', bojagi: 'KR', lotus: 'TH', mandala: 'IN', khatam: 'LB', zellige: 'TN', kente: 'ET', picado: 'MX', palms: 'JM',
  andean: null, majolica: 'IT', meander: 'GR', gingham: 'FR', tartan: 'GB', folk: null, nordic: null, quilt: 'US', tapa: 'JM', suzani: 'TR', dots: null
};
const CUISINE = { mediterranean: [olivesV, 'day', ['#E8E2D4', '#D8CFBD'], true, 'olive', 'the Mediterranean'], cajun: [houseV, 'dusk', ['#7FB069', '#5E8F4F'], false, 'chili', 'Louisiana'], southern: [houseV, 'warm', ['#8CC56B', '#6FAA52'], false, 'corn', 'the South'] };
const HOME = [houseV, 'day', ['#8CC56B', '#6FAA52'], false, 'herbs', 'Home kitchen'];

export function landmarkFor(iso, cuisine, motif) {
  const c = String(cuisine || '').toLowerCase();
  if (CUISINE[c] && (!iso || iso === 'US')) return CUISINE[c];
  return BY_ISO[String(iso || '').toUpperCase()] || BY_ISO[BY_MOTIF[motif]] || HOME;
}
export const SKIES = SKY;
export const hasLandmark = (iso) => !!BY_ISO[String(iso || '').toUpperCase()];
