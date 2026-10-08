// Where your kitchen is: a Tampa home that moves up with your player level (you can't pick it, you earn it).
// Level 0 is the void. Level 1 is a downtown apartment at AVE Tampa Riverwalk (42" wood cabinets, quartz, tile
// backsplash, a view of the Hillsborough River and the University of Tampa minarets). Then Ybor City, Hyde Park,
// Bayshore, Davis Islands, and at level 30 your own restaurant on the Riverwalk.
// Drawn by Whisk in the postcard style (outlined, flat colour). Each is a 400×240 wall behind the 3D kitchen.
import { INK } from './food.js';

const O = `stroke='${INK}' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'`;
const o = `stroke='${INK}' stroke-width='1.3' stroke-linejoin='round' stroke-linecap='round'`;

export const PLACES = [
  { from: 0, key: 'void', name: 'The Void', where: 'Nowhere yet', blurb: 'Cook your first meal to move in.' },
  { from: 1, key: 'riverwalk', name: 'Riverwalk Apartment', where: 'Downtown Tampa', blurb: 'Quartz counters, wood cabinets, a view of the river.' },
  { from: 4, key: 'ybor', name: 'Ybor City Loft', where: 'Ybor City', blurb: 'Brick walls, iron balconies, chickens on 7th Ave.' },
  { from: 7, key: 'hydepark', name: 'Hyde Park Bungalow', where: 'Hyde Park', blurb: 'Oak trees, a porch and a proper pantry.' },
  { from: 10, key: 'bayshore', name: 'Bayshore Condo', where: 'Bayshore Boulevard', blurb: 'High up over the bay, sunsets every night.' },
  { from: 20, key: 'davis', name: 'Davis Islands House', where: 'Davis Islands', blurb: 'Palms, a marina and little planes overhead.' },
  { from: 30, key: 'whisk', name: 'Whisk on the Riverwalk', where: 'Tampa Riverwalk', blurb: 'Your own restaurant. The bridges light up for you.' }
];
export function placeFor(level = 0) { let p = PLACES[0]; for (const x of PLACES) if (level >= x.from) p = x; return p; }
export function nextPlace(level = 0) { return PLACES.find((x) => x.from > level) || null; }

const palm = (x, y, s = 1) => `<g transform='translate(${x} ${y}) scale(${s})'><path d='M0 0q-3-30 4-58' fill='none' stroke='${INK}' stroke-width='5'/><path d='M0 0q-3-30 4-58' fill='none' stroke='#9C7A4E' stroke-width='3'/>${[-70, -30, 10, 50, 100, 150].map((r) => `<path d='M4 -58q22 -6 34 8q-18 -2 -34 -8z' fill='#4E9A3A' ${o} transform='rotate(${r} 4 -58)'/>`).join('')}</g>`;
const oak = (x, y, s = 1) => `<g transform='translate(${x} ${y}) scale(${s})'><path d='M-4 0l2-34h6l2 34z' fill='#7A5A3A' ${o}/><circle cx='-16' cy='-42' r='18' fill='#4F8A3A' ${o}/><circle cx='14' cy='-46' r='20' fill='#5E9A44' ${o}/><circle cx='0' cy='-62' r='18' fill='#6BA84E' ${o}/><path d='M-24 -30v14M-18 -28v18M18 -32v16M24 -30v12' stroke='#9FB59A' stroke-width='2'/></g>`;
const tower = (x, y, w, h, c, lit = false) => `<rect x='${x}' y='${y - h}' width='${w}' height='${h}' fill='${c}' ${o}/>${Array.from({ length: Math.floor(h / 10) }, (_, r) => Array.from({ length: Math.floor(w / 8) }, (_, k) => `<rect x='${x + 3 + k * 8}' y='${y - h + 5 + r * 10}' width='4' height='5' fill='${lit && (r + k) % 3 ? '#FFE08A' : 'rgba(255,255,255,.45)'}'/>`).join('')).join('')}`;
// University of Tampa's silver minarets (Plant Hall), seen across the river
const minaret = (x, y, s = 1) => `<g transform='translate(${x} ${y}) scale(${s})'><rect x='-4' y='-34' width='8' height='34' fill='#C98A6A' ${o}/><path d='M-6 -34q6-14 12 0z' fill='#D7DCE2' ${o}/><path d='M0 -48v-6' stroke='${INK}' stroke-width='1.3'/><path d='M-2 -57a3 3 0 1 0 4 3' fill='none' stroke='#C9CDD2' stroke-width='1.6'/></g>`;
const pendant = (x, c = '#E0A93B') => `<path d='M${x} 0v26' stroke='${INK}' stroke-width='1.3'/><path d='M${x - 10} 36q10-14 20 0z' fill='${c}' ${o}/><ellipse cx='${x}' cy='38' rx='6' ry='3' fill='#FFF2B0'/>`;
const win = (x, y, w, h, inner) => `<g><clipPath id='w${x}${y}'><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='3'/></clipPath><g clip-path='url(#w${x}${y})'>${inner}</g><rect x='${x}' y='${y}' width='${w}' height='${h}' rx='3' fill='none' stroke='${INK}' stroke-width='3'/></g>`;

// What you see out the window, by home (400×240)
const VIEW = {
  riverwalk: () => `<rect x='0' y='0' width='400' height='240' fill='#9ED6F2'/><circle cx='330' cy='54' r='16' fill='#FFE08A'/>${tower(42, 150, 34, 86, '#7FA6C4')}${tower(84, 150, 26, 110, '#5E8DB0')}${tower(118, 150, 30, 70, '#A7C1D6')}<rect x='232' y='52' width='30' height='98' rx='14' fill='#8FB0C8' ${o}/>${[60, 72, 84, 96, 108, 120, 132].map((y) => `<path d='M234 ${y}h26' stroke='rgba(255,255,255,.55)' stroke-width='3'/>`).join('')}${tower(270, 150, 28, 96, '#6C98BA')}${tower(306, 150, 22, 64, '#94B6CF')}<path d='M0 150h400v12H0z' fill='#7BB35A'/>${minaret(170, 152, 1)}${minaret(196, 150, 1.25)}${minaret(224, 152, 1)}<path d='M150 152q50-20 100 0z' fill='#C98A6A' ${o}/><rect x='0' y='160' width='400' height='40' fill='#3E8FC2'/><path d='M20 172q20-4 40 0M110 180q20-4 40 0M240 174q20-4 40 0M320 184q20-4 40 0' stroke='#BFE6FA' stroke-width='2' fill='none'/><path d='M120 170h70l-6 5h-60z' fill='#fff' ${o}/><rect x='0' y='196' width='400' height='44' fill='#C9B79A'/>${palm(60, 200, .7)}${palm(350, 200, .75)}`,
  ybor: () => `<rect width='400' height='240' fill='#F6C27A'/><rect x='0' y='60' width='120' height='130' fill='#B5452B' ${o}/><rect x='280' y='50' width='120' height='140' fill='#C9A15A' ${o}/>${[0, 1].map((r) => `<path d='M${r ? 284 : 4} ${r ? 110 : 120}h112v10h-112z' fill='none' stroke='${INK}' stroke-width='1.6'/><path d='${Array.from({ length: 14 }, (_, k) => `M${(r ? 288 : 8) + k * 8} ${r ? 110 : 120}v10`).join('')}' stroke='${INK}' stroke-width='1.2'/>`).join('')}<rect x='150' y='70' width='100' height='26' rx='4' fill='#2A2A3A' ${o}/><text x='200' y='89' text-anchor='middle' font-family='Arial Rounded MT Bold,Arial,sans-serif' font-size='15' font-weight='700' fill='#FF5FA2'>CAFE</text><rect x='0' y='190' width='400' height='50' fill='#9A8F86'/><path d='M0 200h400' stroke='#C7BDB4' stroke-width='3' stroke-dasharray='14 10'/><g transform='translate(200 192)'><ellipse cx='0' cy='-10' rx='13' ry='10' fill='#B5452B' ${o}/><circle cx='10' cy='-22' r='6' fill='#E07A3A' ${o}/><path d='M8 -28l2-5 2 5 2-4' fill='#D9311F' ${o}/><path d='M16 -22l5 1-5 2z' fill='#F6C531' ${o}/><path d='M-12 -14q-10-10-4-18q2 8 6 10' fill='#2E5E3A' ${o}/><path d='M-2 0v6M4 0v6' stroke='${INK}' stroke-width='1.6'/></g>`,
  hydepark: () => `<rect width='400' height='240' fill='#BFE3F5'/><rect y='150' width='400' height='90' fill='#8CC56A'/><path d='M0 170h400' stroke='#D8CDB8' stroke-width='10'/>${oak(70, 160, 1.1)}${oak(330, 162, 1.2)}<g transform='translate(190 160)'><path d='M-50 0v-40h100v40z' fill='#F2E6C8' ${o}/><path d='M-60 -40l60-30 60 30z' fill='#7A8F9E' ${o}/><rect x='-10' y='-26' width='20' height='26' fill='#2F6DB5' ${o}/><rect x='-40' y='-30' width='18' height='14' fill='#BFE3F5' ${o}/><rect x='22' y='-30' width='18' height='14' fill='#BFE3F5' ${o}/><path d='M-56 0h112' stroke='${INK}' stroke-width='2'/></g>`,
  bayshore: () => `<defs><linearGradient id='sun' x2='0' y2='1'><stop offset='0' stop-color='#FF9E6B'/><stop offset='.6' stop-color='#FFD08A'/><stop offset='1' stop-color='#FFE9B8'/></linearGradient></defs><rect width='400' height='240' fill='url(#sun)'/><circle cx='200' cy='118' r='26' fill='#FFF2B0'/><rect y='120' width='400' height='120' fill='#3E8FC2'/>${[130, 146, 166, 190].map((y, i) => `<path d='M${60 + i * 30} ${y}h${120 - i * 10}' stroke='#FFE9B8' stroke-width='${3 - i * .5}' opacity='.8'/>`).join('')}<path d='M300 140l20 0 -10 -26z' fill='#fff' ${o}/><path d='M296 140h30l-4 6h-22z' fill='#C8352F' ${o}/><path d='M0 200h400v40H0z' fill='#E9E2D4'/>${Array.from({ length: 41 }, (_, i) => `<path d='M${i * 10} 186v14' stroke='#FFFFFF' stroke-width='4'/><path d='M${i * 10} 186v14' stroke='${INK}' stroke-width='.8' fill='none'/>`).join('')}<path d='M0 184h400' stroke='#FFFFFF' stroke-width='5'/><path d='M0 182h400M0 187h400' stroke='${INK}' stroke-width='1'/>${palm(80, 206, .8)}${palm(320, 206, .8)}`,
  davis: () => `<rect width='400' height='240' fill='#9ED6F2'/><g transform='translate(300 40)'><path d='M-14 0h28M0 -4v8' stroke='${INK}' stroke-width='2'/><path d='M-10 0q10-4 20 0q-10 4-20 0z' fill='#fff' ${o}/></g><rect y='130' width='400' height='110' fill='#3E8FC2'/><path d='M0 160h400' stroke='#8A6A4A' stroke-width='5'/>${[60, 160, 260, 340].map((x, i) => `<g transform='translate(${x} 156)'><path d='M-18 0h36l-6 8h-24z' fill='#fff' ${o}/><path d='M0 0v-${40 + i * 6}' stroke='${INK}' stroke-width='1.6'/><path d='M2 -${38 + i * 6}l${16 + i * 2} ${30 + i * 4}h-${16 + i * 2}z' fill='${['#F2F4F6', '#FFD166', '#F2F4F6', '#FF9E6B'][i]}' ${o}/></g>`).join('')}${palm(30, 136, .9)}${palm(380, 136, .9)}`,
  whisk: () => `<rect width='400' height='240' fill='#1C2547'/>${Array.from({ length: 30 }, (_, i) => `<circle cx='${(i * 131) % 400}' cy='${(i * 37) % 110}' r='1' fill='#fff' opacity='.7'/>`).join('')}${tower(30, 150, 34, 100, '#2D3A66', true)}${tower(70, 150, 26, 120, '#26325A', true)}${tower(300, 150, 30, 90, '#2D3A66', true)}${tower(336, 150, 26, 110, '#26325A', true)}<rect y='150' width='400' height='90' fill='#152040'/><path d='M0 150q100-50 200 0t200 0' fill='none' stroke='#B57CFF' stroke-width='4'/><path d='M0 150q100-50 200 0t200 0' fill='none' stroke='#E7D2FF' stroke-width='1.2'/>${Array.from({ length: 8 }, (_, i) => `<path d='M${25 + i * 50} ${150 - (i % 4 === 1 || i % 4 === 2 ? 20 : 8)}v${i % 4 === 1 || i % 4 === 2 ? 20 : 8}' stroke='#B57CFF' stroke-width='2'/>`).join('')}<path d='M10 180q20-4 40 0M150 196q30-6 60 0M290 184q20-4 40 0' stroke='#B57CFF' stroke-width='2' opacity='.7' fill='none'/>`
};

const SCENES = {
  void: () => `<defs><radialGradient id='vd' cx='50%' cy='55%' r='70%'><stop offset='0' stop-color='#3A3F4A'/><stop offset='1' stop-color='#14161B'/></radialGradient></defs><rect width='400' height='240' fill='url(#vd)'/>${Array.from({ length: 40 }, (_, i) => `<circle cx='${(i * 97) % 400}' cy='${(i * 53) % 240}' r='${i % 5 ? 0.8 : 1.4}' fill='#fff' opacity='${0.15 + (i % 4) * 0.12}'/>`).join('')}<ellipse cx='200' cy='200' rx='150' ry='26' fill='none' stroke='rgba(255,255,255,.12)' stroke-width='2' stroke-dasharray='6 8'/>`,
  riverwalk: () => {
    const view = VIEW.riverwalk();
    return `<rect width='400' height='240' fill='#F2EEE7'/>${win(40, 16, 320, 170, view)}<path d='M200 16v170M40 100h320' stroke='${INK}' stroke-width='2.4'/><rect x='0' y='186' width='400' height='54' fill='#E9E4DA'/>${Array.from({ length: 20 }, (_, i) => `<rect x='${i * 20}' y='186' width='20' height='12' fill='${i % 2 ? '#DCE6EA' : '#E8EEF1'}' ${o}/>`).join('')}${pendant(120)}${pendant(280)}`;
  },
  ybor: () => {
    const street = VIEW.ybor();
    const brick = Array.from({ length: 24 }, (_, r) => `<path d='M0 ${r * 10}h400' stroke='#8E3A26' stroke-width='1'/>${Array.from({ length: 21 }, (_, k) => `<path d='M${k * 20 + (r % 2) * 10} ${r * 10}v10' stroke='#8E3A26' stroke-width='1'/>`).join('')}`).join('');
    const arch = (x) => win(x, 30, 100, 150, street);
    return `<rect width='400' height='240' fill='#B9553A'/>${brick}${arch(60)}${arch(240)}<path d='M60 80q50-60 100 0M240 80q50-60 100 0' fill='none' stroke='${INK}' stroke-width='3'/><path d='M110 30v150M290 30v150' stroke='${INK}' stroke-width='2'/>${[100, 200, 300].map((x) => `<path d='M${x} 0v20' stroke='${INK}' stroke-width='1.2'/><circle cx='${x}' cy='26' r='6' fill='#FFE08A' ${o}/>`).join('')}<rect x='0' y='190' width='400' height='50' fill='#6B4A33'/>`;
  },
  hydepark: () => {
    const yard = VIEW.hydepark();
    return `<rect width='400' height='240' fill='#E6EEDF'/><rect y='130' width='400' height='110' fill='#FFFFFF'/>${Array.from({ length: 21 }, (_, i) => `<path d='M${i * 20} 130v110' stroke='#E3E0D8' stroke-width='2'/>`).join('')}<path d='M0 130h400' stroke='${INK}' stroke-width='2'/>${win(110, 20, 180, 104, `<g transform='translate(0 -46)'>${yard}</g>`)}<path d='M200 20v104M110 72h180' stroke='${INK}' stroke-width='2.4'/><rect x='100' y='122' width='200' height='8' fill='#C89B63' ${o}/>${[40, 360].map((x) => `<g transform='translate(${x} 60)'><rect x='-14' y='0' width='28' height='40' rx='2' fill='#C89B63' ${o}/><path d='M-10 10h20M-10 22h20M-10 34h20' stroke='#7A5233' stroke-width='1.6'/><circle cx='-4' cy='4' r='3' fill='#7BAA4A' ${o}/><rect x='0' y='13' width='8' height='8' fill='#E5392B' ${o}/><rect x='-8' y='25' width='6' height='8' fill='#F6C531' ${o}/></g>`).join('')}`;
  },
  bayshore: () => {
    const bay = VIEW.bayshore();
    return `<rect width='400' height='240' fill='#EFEAE2'/>${win(20, 14, 360, 180, bay)}${[110, 200, 290].map((x) => `<path d='M${x} 14v180' stroke='${INK}' stroke-width='2.4'/>`).join('')}<rect x='0' y='194' width='400' height='46' fill='#D8D2C8'/><path d='M0 194h400' stroke='${INK}' stroke-width='2'/>${pendant(150, '#2F4058')}${pendant(250, '#2F4058')}`;
  },
  davis: () => {
    const marina = VIEW.davis();
    return `<rect width='400' height='240' fill='#F4E6CF'/><rect y='196' width='400' height='44' fill='#C2603A'/>${Array.from({ length: 20 }, (_, i) => `<rect x='${i * 20}' y='196' width='20' height='20' fill='${i % 2 ? '#C2603A' : '#B5532E'}'/>`).join('')}${[70, 230].map((x) => `${win(x, 30, 100, 166, marina)}<path d='M${x} 80q50-70 100 0' fill='none' stroke='${INK}' stroke-width='3'/><path d='M${x + 50} 30v166' stroke='${INK}' stroke-width='2'/>`).join('')}<path d='M0 0h400v24H0z' fill='#C2603A'/>${Array.from({ length: 20 }, (_, i) => `<path d='M${i * 20} 24q10 10 20 0' fill='#B5532E' ${o}/>`).join('')}<g transform='translate(200 120)'><path d='M-10 0q10-20 20 0z' fill='#2E8A8F' ${o}/></g>`;
  },
  whisk: () => {
    const night = VIEW.whisk();
    return `<rect width='400' height='240' fill='#2B2A2E'/>${Array.from({ length: 12 }, (_, i) => `<rect x='${i * 34}' y='0' width='34' height='240' fill='${i % 2 ? '#323136' : '#2B2A2E'}'/>`).join('')}${win(30, 40, 340, 140, night)}<path d='M143 40v140M257 40v140' stroke='${INK}' stroke-width='3'/><rect x='130' y='6' width='140' height='30' rx='8' fill='#141316' ${O}/><text x='200' y='28' text-anchor='middle' font-family='Arial Rounded MT Bold,Arial,sans-serif' font-size='19' font-weight='700' fill='#FFD166' letter-spacing='3'>WHISK</text><rect x='0' y='180' width='400' height='12' fill='#C9CDD2' ${o}/>${[80, 200, 320].map((x) => `<path d='M${x} 192v10' stroke='${INK}' stroke-width='2'/><rect x='${x - 18}' y='202' width='36' height='6' rx='3' fill='#E5392B' ${o}/><path d='M${x - 14} 212q14 10 28 0' fill='#FF8A3D' opacity='.5'/>`).join('')}<rect x='0' y='208' width='400' height='32' fill='#3A3236'/>`;
  }
};

export function placeSvg(key) {
  const f = SCENES[key] || SCENES.void;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240' preserveAspectRatio='xMidYMid slice'>${f()}</svg>`;
}
const memo = new Map();
export function placeUrl(key) { let u = memo.get(key); if (!u) { u = `data:image/svg+xml,${encodeURIComponent(placeSvg(key))}`; memo.set(key, u); } return u; }

// ---------- the room around your 3D kitchen (a cut-away like a dollhouse: floor slab + two walls) ----------
// Walls are drawn for the kitchen's floor (12 × 8 ft): back wall 312×204 px, left wall 208×204 px (24 px a foot,
// counters at 3 ft, upper cabinets from 4.5 ft). The window is on the left wall so cabinets never cover the view.
const subway = (y0, y1, w, c = '#FFFFFF', g = '#D6D2CB') => `<rect y='${y0}' width='${w}' height='${y1 - y0}' fill='${g}'/>${Array.from({ length: Math.ceil((y1 - y0) / 8) }, (_, r) => Array.from({ length: Math.ceil(w / 22) + 1 }, (_, k) => `<rect x='${k * 22 - (r % 2) * 11 + 0.6}' y='${y0 + r * 8 + 0.6}' width='20.8' height='6.8' rx='1' fill='${c}'/>`).join('')).join('')}`;
const brick = (w, h) => `<rect width='${w}' height='${h}' fill='#B9553A'/>${Array.from({ length: Math.ceil(h / 9) }, (_, r) => `<path d='M0 ${r * 9}h${w}' stroke='#8E3A26' stroke-width='1'/>${Array.from({ length: Math.ceil(w / 18) + 1 }, (_, k) => `<path d='M${k * 18 + (r % 2) * 9} ${r * 9}v9' stroke='#8E3A26' stroke-width='1'/>`).join('')}`).join('')}`;
const frameArt = (x, y, w, h, inner) => `<rect x='${x - 3}' y='${y - 3}' width='${w + 6}' height='${h + 6}' fill='#2E2A2A'/><rect x='${x}' y='${y}' width='${w}' height='${h}' fill='#F7F4EE'/>${inner}`;
const glass = (key, x, y, w, h, arch = false, frame = '#3B3B3D') => {
  const id = `g${key}${x}${y}`;
  const shape = arch ? `M${x} ${y + h}V${y + w / 2}a${w / 2} ${w / 2} 0 0 1 ${w} 0V${y + h}z` : `M${x} ${y}h${w}v${h}h${-w}z`;
  return `<clipPath id='${id}'><path d='${shape}'/></clipPath><g clip-path='url(#${id})'><g transform='translate(${x} ${y}) scale(${w / 400} ${h / 240})'>${VIEW[key]()}</g><rect x='${x}' y='${y}' width='${w}' height='${h}' fill='url(#shine)'/></g><path d='${shape}' fill='none' stroke='${frame}' stroke-width='5'/><path d='M${x + w / 2} ${y + (arch ? w / 2 - 6 : 0)}V${y + h}' stroke='${frame}' stroke-width='3'/>`;
};
const SHINE = `<defs><linearGradient id='shine' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#fff' stop-opacity='.35'/><stop offset='.35' stop-color='#fff' stop-opacity='0'/><stop offset='.6' stop-color='#fff' stop-opacity='.12'/><stop offset='.62' stop-color='#fff' stop-opacity='0'/></linearGradient></defs>`;
const ROOM = {
  riverwalk: { floor: 'wood', wall: '#ECE7DF', slab: '#7A5A3E',
    back: (w, h) => `<rect width='${w}' height='${h}' fill='#ECE7DF'/>${subway(h - 108, h - 72, w)}<rect y='${h - 8}' width='${w}' height='8' fill='#D9D2C6'/>`,
    left: (w, h) => `<rect width='${w}' height='${h}' fill='#E4DED4'/>${glass('riverwalk', 22, 14, w - 44, h - 30)}<rect y='${h - 8}' width='${w}' height='8' fill='#D9D2C6'/>` },
  ybor: { floor: 'hex', wall: '#B9553A', slab: '#6B3A26',
    back: (w, h) => `${brick(w, h)}${[60, 160, 260].map((x) => `<path d='M${x} 0v14' stroke='#2E2A2A' stroke-width='1.4'/><circle cx='${x}' cy='18' r='5' fill='#FFE08A' stroke='#2E2A2A' stroke-width='1.2'/>`).join('')}`,
    left: (w, h) => `${brick(w, h)}${glass('ybor', 30, 20, 64, h - 40, true, '#2E2A2A')}${glass('ybor', w - 94, 20, 64, h - 40, true, '#2E2A2A')}` },
  hydepark: { floor: 'oak', wall: '#DCE5D3', slab: '#6B4A2B',
    back: (w, h) => `<rect width='${w}' height='${h}' fill='#DCE5D3'/>${subway(h - 108, h - 72, w, '#7FB8A4', '#5E9A85')}${frameArt(w - 70, 30, 34, 26, `<circle cx='${w - 53}' cy='43' r='7' fill='#E5392B'/><path d='M${w - 53} 36v-4' stroke='#3F7F25' stroke-width='2'/>`)}`,
    left: (w, h) => `<rect width='${w}' height='${h}' fill='#DCE5D3'/><rect y='${h - 70}' width='${w}' height='70' fill='#FFFFFF'/>${Array.from({ length: Math.ceil(w / 16) }, (_, i) => `<path d='M${i * 16} ${h - 70}v70' stroke='#E3E0D8' stroke-width='2'/>`).join('')}${glass('hydepark', 40, 24, w - 80, 96, false, '#FFFFFF')}` },
  bayshore: { floor: 'stone', wall: '#F4F2EE', slab: '#8A8580',
    back: (w, h) => `<rect width='${w}' height='${h}' fill='#F4F2EE'/><rect y='${h - 108}' width='${w}' height='36' fill='#F5F3EE'/><path d='M0 ${h - 100}l60 30M80 ${h - 108}l90 36M200 ${h - 104}l110 30' stroke='#B7B2AE' stroke-width='1.2'/>`,
    left: (w, h) => `${glass('bayshore', 0, 0, w, h, false, '#2E2E30')}` },
  davis: { floor: 'terracotta', wall: '#F4E6CF', slab: '#8E4A2A',
    back: (w, h) => `<rect width='${w}' height='${h}' fill='#F4E6CF'/>${Array.from({ length: Math.ceil(w / 18) }, (_, k) => [0, 1].map((r) => `<g transform='translate(${k * 18} ${h - 108 + r * 18})'><rect width='18' height='18' fill='#FFFFFF' stroke='#2F6DB5' stroke-width='.8'/><circle cx='9' cy='9' r='4' fill='#2F6DB5'/><circle cx='9' cy='9' r='1.6' fill='#F6C531'/></g>`).join('')).join('')}`,
    left: (w, h) => `<rect width='${w}' height='${h}' fill='#F4E6CF'/>${glass('davis', 50, 14, w - 100, h - 22, true, '#5A3A20')}` },
  whisk: { floor: 'concrete', wall: '#2B2A2E', slab: '#1E1D20',
    back: (w, h) => `<rect width='${w}' height='${h}' fill='#2B2A2E'/>${subway(0, h, w, '#2F2E33', '#1E1D20')}<rect x='${w / 2 - 60}' y='18' width='120' height='34' rx='9' fill='#141316' stroke='#FFD166' stroke-width='1.6'/><text x='${w / 2}' y='43' text-anchor='middle' font-family='Arial Rounded MT Bold,Arial,sans-serif' font-size='22' font-weight='700' fill='#FFD166' letter-spacing='3'>WHISK</text>`,
    left: (w, h) => `<rect width='${w}' height='${h}' fill='#232226'/>${glass('whisk', 16, 14, w - 32, h - 28, false, '#141316')}` }
};
// a plain wall for the side with the window (the window itself is drawn live by components/kitchen/Room.js)
const plainWall = (key) => (w, h) => {
  const r = ROOM[key];
  const base = key === 'ybor' ? brick(w, h) : key === 'whisk' ? `<rect width='${w}' height='${h}' fill='#2B2A2E'/>${subway(0, h, w, '#2F2E33', '#1E1D20')}` : `<rect width='${w}' height='${h}' fill='${r.wall}'/>`;
  return `${base}<rect y='${h - 8}' width='${w}' height='8' fill='rgba(0,0,0,.12)'/>`;
};
const CAPS = { riverwalk: '#3D4A55', ybor: '#5A2A1C', hydepark: '#3E4A3A', bayshore: '#45474D', davis: '#6B4A2A', whisk: '#141316' };
Object.keys(ROOM).forEach((k) => { ROOM[k].plain = plainWall(k); ROOM[k].cap = CAPS[k]; });
// soft shading so walls read as 3D: darker where they meet the floor and the corner
const SHADE = (w, h) => `<defs><linearGradient id='ao' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.10'/><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='.9' stop-color='#000' stop-opacity='.10'/><stop offset='1' stop-color='#000' stop-opacity='.28'/></linearGradient></defs><rect width='${w}' height='${h}' fill='url(#ao)'/>`;
export const roomFor = (key) => ROOM[key] || null;
export const viewSvg = (key) => (VIEW[key] ? VIEW[key]() : '');
const wmemo = new Map();
export function wallUrl(key, side, w, h) {
  const k = `${key}|${side}|${w}|${h}`; let u = wmemo.get(k); if (u) return u;
  const r = ROOM[key]; if (!r) return '';
  u = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' width='${w}' height='${h}' preserveAspectRatio='none'>${SHINE}${r[side](w, h)}${SHADE(w, h)}</svg>`)}`;
  wmemo.set(k, u); return u;
}
