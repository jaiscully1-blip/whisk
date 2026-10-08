// Whisk's own food art (no emoji): cartoon drawings with a dark outline, the same look as the recipe postcards.
//  • foodSticker(name, category) → a die-cut sticker of a grocery item (pantry, kitchen shelves, food boxes)
//  • bit(kind, x, y, s, r)       → a small piece of food used on top of drawn dishes (lib/art/dish.js)
// Plain strings, no imports. Shapes are drawn from how these foods really look (colours, cuts, packaging).

export const INK = '#3B2C24';
export const O = `stroke='${INK}' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'`;
const o = `stroke='${INK}' stroke-width='1.4' stroke-linejoin='round' stroke-linecap='round'`;
const T = (x, y, s = 1, r = 0, body = '') => `<g transform='translate(${x} ${y})${r ? ` rotate(${r})` : ''}${s !== 1 ? ` scale(${s})` : ''}'>${body}</g>`;

// ---------- grocery items, drawn in a 64×64 box ----------
const tray = (meat) => `<path d='M6 40l4 14h44l4-14z' fill='#F4F1EA' ${O}/>${meat}<path d='M8 40h48' stroke='#CFE6F2' stroke-width='3' opacity='.7'/>`;
const bottle = (body, cap, label, neck = 10) => `<path d='M24 ${8 + neck}v-6h16v6c6 3 8 8 8 14v26c0 3-2 5-5 5H21c-3 0-5-2-5-5V32c0-6 2-11 8-14z' fill='${body}' ${O}/><rect x='23' y='4' width='18' height='8' rx='2' fill='${cap}' ${O}/><rect x='18' y='34' width='28' height='14' rx='2' fill='${label}' ${O}/>`;
const can = (label, art = '') => `<path d='M14 14v38c0 4 8 7 18 7s18-3 18-7V14' fill='${label}' ${O}/><ellipse cx='32' cy='14' rx='18' ry='6' fill='#D9DEE5' ${O}/><ellipse cx='32' cy='14' rx='13' ry='3.6' fill='none' stroke='#9AA3AD' stroke-width='1.4'/><path d='M14 22c0 4 8 7 18 7s18-3 18-7M14 46c0 4 8 7 18 7s18-3 18-7' fill='none' stroke='#C7CDD4' stroke-width='3'/>${art}`;
const bag = (color, window = '', top = '#FFFFFF') => `<path d='M14 16l3-8h30l3 8v36c0 3-2 5-5 5H19c-3 0-5-2-5-5z' fill='${color}' ${O}/><path d='M17 8l3 8h24l3-8' fill='${top}' ${O}/>${window}`;
const jar = (fill, lid, art = '') => `<rect x='16' y='18' width='32' height='38' rx='7' fill='${fill}' ${O}/><rect x='18' y='9' width='28' height='10' rx='3' fill='${lid}' ${O}/>${art}<path d='M22 26v22' stroke='#FFFFFF' stroke-width='3' opacity='.45'/>`;
const carton = (body, band, top = '#FFFFFF') => `<path d='M18 22l14-12 14 12v34H18z' fill='${body}' ${O}/><path d='M18 22l14-12 14 12' fill='${top}' ${O}/><path d='M26 6h12l-6 4z' fill='${top}' ${O}/><rect x='18' y='34' width='28' height='12' fill='${band}' ${O}/>`;
const leafy = (a, b) => `<path d='M32 58c-14 0-22-10-20-24 2-12 10-22 20-24 10 2 18 12 20 24 2 14-6 24-20 24z' fill='${a}' ${O}/><path d='M32 56c-6-8-8-18-6-30M32 56c6-8 8-18 6-30M32 56V20' fill='none' stroke='${b}' stroke-width='2'/>`;

const FOOD = {
  egg: `<ellipse cx='24' cy='38' rx='13' ry='17' fill='#F7E6CC' ${O}/><ellipse cx='42' cy='40' rx='12' ry='15' fill='#FFF8EC' ${O}/><path d='M18 30q4-8 9-9' stroke='#FFFFFF' stroke-width='3' fill='none'/>`,
  milk: carton('#FFFFFF', '#5AA9E6') + `<path d='M32 38q-4 5 0 8 4-3 0-8z' fill='#FFFFFF' ${o}/>`,
  cream: carton('#FFF8EC', '#F2C14E'),
  butter: `<path d='M8 30l10-10h38v24l-10 10H8z' fill='#FFE07A' ${O}/><path d='M8 30h38l10-10M46 30v24' fill='none' ${O}/><path d='M8 30h20v24H8z' fill='#FFFFFF' ${O}/><path d='M12 36h12M12 42h10' stroke='#5AA9E6' stroke-width='2'/>`,
  cheddar: `<path d='M6 40l46-22 6 10v18L12 58 6 52z' fill='#F4A73B' ${O}/><path d='M6 40l6 12 46-24' fill='#FFC75F' ${O}/><path d='M12 52v6' ${O}/>`,
  cheese_white: `<path d='M8 30l24-14 26 12v20L34 60 8 46z' fill='#FFFDF6' ${O}/><path d='M8 30l26 14 24-16M34 44v16' fill='none' ${O}/><circle cx='22' cy='38' r='2' fill='#E8E2D2'/><circle cx='44' cy='48' r='2' fill='#E8E2D2'/>`,
  mozzarella: `<circle cx='32' cy='36' r='20' fill='#FFFFFF' ${O}/><path d='M20 30q8-8 18-6' stroke='#EDE9E0' stroke-width='3' fill='none'/><path d='M44 18l6-8M48 20l8-4' stroke='#5E9C5A' stroke-width='3'/>`,
  parmesan: `<path d='M8 44l42-26 8 6v16L16 60 8 54z' fill='#F6E2A8' ${O}/><path d='M8 44l8 10 42-30' fill='none' ${O}/><path d='M50 18l8 6' stroke='#C99A4B' stroke-width='4'/>`,
  yogurt: `<path d='M14 20h36l-4 34c0 2-2 4-4 4H22c-2 0-4-2-4-4z' fill='#FFFFFF' ${O}/><ellipse cx='32' cy='20' rx='18' ry='5' fill='#D9DEE5' ${O}/><rect x='18' y='30' width='28' height='12' fill='#B5DCF2' ${O}/>`,
  cream_cheese: `<rect x='8' y='24' width='48' height='26' rx='3' fill='#E8F2FB' ${O}/><path d='M8 24l8-8h48l-8 8M56 24v26l8-8V16' fill='#C9DFF2' ${O}/><rect x='14' y='30' width='30' height='12' rx='2' fill='#3E78C2' ${O}/>`,
  chicken: tray(`<path d='M14 38c2-12 14-18 26-16 10 2 14 8 12 14-6 6-24 8-38 2z' fill='#F6B8A8' ${O}/><path d='M22 30q8-4 16-2' stroke='#FBD3C8' stroke-width='3' fill='none'/>`),
  drumstick: `<path d='M40 40l12 12' stroke='${INK}' stroke-width='9' stroke-linecap='round'/><path d='M40 40l12 12' stroke='#F7EEDC' stroke-width='5' stroke-linecap='round'/><circle cx='54' cy='50' r='4' fill='#F7EEDC' ${O}/><circle cx='50' cy='54' r='4' fill='#F7EEDC' ${O}/><path d='M42 42c-14 8-32 4-34-10S20 6 32 10s16 22 10 32z' fill='#D9893D' ${O}/><path d='M18 20q6-6 12-4' stroke='#F2B36B' stroke-width='3' fill='none'/>`,
  beef: tray(`<path d='M12 36c0-10 12-16 24-15 12 0 18 6 16 13-2 6-14 9-26 8-10 0-14-2-14-6z' fill='#C9383A' ${O}/><path d='M18 34q10-6 22-4M26 26q6 4 4 10' stroke='#F2C9C0' stroke-width='2.4' fill='none'/>`),
  ground: tray(`<path d='M12 38c2-8 10-14 20-14s18 4 20 12c-4 4-34 6-40 2z' fill='#D25A55' ${O}/>${[[20, 32], [28, 28], [36, 30], [42, 34], [26, 35], [34, 35]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2' fill='#F09B93'/>`).join('')}`),
  pork: tray(`<path d='M12 36c2-10 14-14 26-13 10 1 16 6 14 12-6 6-28 7-40 1z' fill='#F4A9A0' ${O}/><path d='M40 24c6 2 10 6 10 10' stroke='#FFFFFF' stroke-width='4' fill='none'/><circle cx='22' cy='31' r='3' fill='#FFFFFF' ${o}/>`),
  lamb: tray(`<path d='M14 36c2-10 14-14 24-13 10 1 14 6 12 11-6 6-24 7-36 2z' fill='#B8454A' ${O}/><path d='M44 22l12-10' stroke='${INK}' stroke-width='7' stroke-linecap='round'/><path d='M44 22l12-10' stroke='#FFFFFF' stroke-width='3.5' stroke-linecap='round'/>`),
  sausage: `${[[10, 40, 18], [26, 26, 10], [42, 38, -20]].map(([x, y, r]) => `<g transform='rotate(${r} ${x + 9} ${y})'><rect x='${x - 4}' y='${y - 7}' width='26' height='14' rx='7' fill='#B8563A' ${O}/><path d='M${x + 2} ${y - 3}h12' stroke='#E09070' stroke-width='2.4'/></g>`).join('')}`,
  bacon: `${[18, 32, 46].map((y, i) => `<path d='M8 ${y}q8 -6 16 0t16 0 16 0v7q-8 -6 -16 0t-16 0 -16 0z' fill='${i % 2 ? '#E5806E' : '#D6604E'}' ${O}/><path d='M10 ${y + 3}q8 -5 14 0' stroke='#FBD1C2' stroke-width='2' fill='none'/>`).join('')}`,
  ham: `<ellipse cx='32' cy='40' rx='24' ry='14' fill='#F29FA0' ${O}/><ellipse cx='32' cy='36' rx='24' ry='14' fill='#F7B7B8' ${O}/><path d='M14 34q18 8 36 0' stroke='#FCDCDC' stroke-width='3' fill='none'/>`,
  fish: tray(`<path d='M10 36c4-10 16-14 30-12 8 1 14 4 14 8-2 6-20 10-34 8-6-1-10-2-10-4z' fill='#F79B6C' ${O}/>${[20, 28, 36, 44].map((x) => `<path d='M${x} 26q-3 6 0 12' stroke='#FFE2D2' stroke-width='2' fill='none'/>`).join('')}`),
  shrimp: `<path d='M44 16c-18-6-34 6-32 22 2 12 16 20 28 14 6-3 6-10 0-12-8 2-14-2-14-8s8-10 18-8' fill='#F58A5E' ${O}/>${[[20, 30], [24, 40], [32, 46]].map(([x, y]) => `<path d='M${x - 4} ${y - 4}l8 6' stroke='#C9583A' stroke-width='2'/>`).join('')}<path d='M44 16l10-4 2 8z' fill='#F58A5E' ${O}/><circle cx='42' cy='22' r='1.6' fill='${INK}'/>`,
  tofu: `<path d='M10 28l14-10h32v24L42 52H10z' fill='#FFFDF3' ${O}/><path d='M10 28h32l14-10M42 28v24' fill='none' ${O}/>`,
  rice: bag('#FFFFFF', `<ellipse cx='32' cy='36' rx='12' ry='10' fill='#F4EFE4' ${o}/>${[[28, 33], [34, 32], [31, 38], [37, 37], [27, 39]].map(([x, y]) => `<ellipse cx='${x}' cy='${y}' rx='2.6' ry='1.4' fill='#FFFFFF' ${o}/>`).join('')}`, '#C8352F'),
  pasta: `<g transform='rotate(-20 32 32)'><rect x='26' y='4' width='12' height='56' rx='2' fill='#F6D47A' ${O}/>${[29, 32, 35].map((x) => `<path d='M${x} 6v52' stroke='#E2B54E' stroke-width='1.4'/>`).join('')}<rect x='22' y='28' width='20' height='8' rx='2' fill='#2F6DB5' ${O}/></g>`,
  noodles: `<ellipse cx='32' cy='38' rx='24' ry='16' fill='#F6D47A' ${O}/>${[0, 1, 2, 3].map((i) => `<path d='M12 ${32 + i * 4}q6-6 10 0t10 0 10 0 10 0' fill='none' stroke='#D8A93E' stroke-width='2'/>`).join('')}`,
  bread: `<path d='M8 36c0-12 10-18 24-18s24 6 24 18v14c0 3-2 6-6 6H14c-4 0-6-3-6-6z' fill='#D9984A' ${O}/><path d='M16 28q4-6 8 0M28 26q4-6 8 0M40 28q4-6 8 0' stroke='#F2C17A' stroke-width='3' fill='none'/>`,
  tortilla: `${[44, 38, 32].map((y, i) => `<ellipse cx='32' cy='${y}' rx='26' ry='9' fill='${i === 2 ? '#F2DCA6' : '#E9CC8C'}' ${O}/>`).join('')}${[[24, 30], [36, 33], [42, 29]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.8' fill='#C99A4B'/>`).join('')}`,
  flour: bag('#F6EFE2', `<rect x='20' y='28' width='24' height='16' rx='2' fill='#3E78C2' ${O}/><path d='M24 36h16' stroke='#FFFFFF' stroke-width='2.4'/>`),
  sugar: bag('#FFFFFF', `<rect x='20' y='28' width='24' height='16' rx='2' fill='#E0559A' ${O}/><rect x='28' y='31' width='8' height='8' fill='#FFFFFF' ${o}/>`),
  oil: bottle('#E8C440', '#3F7F25', '#3F7F25') + `<ellipse cx='32' cy='41' rx='4' ry='5' fill='#9CBF4E' ${o}/>`,
  soy: bottle('#3A2219', '#D9452B', '#FFFFFF') + `<path d='M26 41h12' stroke='#D9452B' stroke-width='3'/>`,
  fishsauce: bottle('#C9762E', '#D9452B', '#F6E3B4'),
  vinegar: bottle('#F6EFD6', '#2F6DB5', '#2F6DB5'),
  hotsauce: bottle('#D9452B', '#3F7F25', '#F6E3B4', 16),
  ketchup: bottle('#D9452B', '#FFFFFF', '#FFFFFF') + `<circle cx='32' cy='41' r='4' fill='#D9452B' ${o}/>`,
  broth: `<rect x='16' y='14' width='32' height='44' rx='3' fill='#F2C14E' ${O}/><path d='M16 14l4-8h24l4 8' fill='#FFFFFF' ${O}/><rect x='22' y='4' width='8' height='6' fill='#D9452B' ${o}/><path d='M22 36q10-8 20 0' stroke='#B5651D' stroke-width='3' fill='none'/>`,
  can_tomato: can('#D9452B', `<circle cx='32' cy='38' r='8' fill='#F2604A' ${o}/><path d='M29 31l3 2 3-2' stroke='#3F7F25' stroke-width='2' fill='none'/>`),
  can_beans: can('#7A4A2A', `${[[28, 36], [35, 38], [31, 42]].map(([x, y]) => `<ellipse cx='${x}' cy='${y}' rx='3.4' ry='2.4' fill='#C9864A' ${o}/>`).join('')}`),
  can_black: can('#3E3A3A', `${[[28, 36], [35, 38], [31, 42]].map(([x, y]) => `<ellipse cx='${x}' cy='${y}' rx='3.4' ry='2.4' fill='#2A2626' stroke='#FFFFFF' stroke-width='1'/>`).join('')}`),
  can_chickpea: can('#E8C27C', `${[[28, 36], [35, 38], [31, 42]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='3' fill='#F2D59A' ${o}/>`).join('')}`),
  can_coconut: can('#FFFFFF', `<circle cx='32' cy='38' r='8' fill='#7A4A2A' ${o}/><path d='M26 38h12' stroke='#FFFFFF' stroke-width='2'/>`),
  tomato: `<circle cx='32' cy='36' r='22' fill='#E8452F' ${O}/><path d='M20 26q4-6 10-6' stroke='#FF8A72' stroke-width='3' fill='none'/><path d='M24 16l8 4 8-4-3 7 6 2-11 1-11-1 6-2z' fill='#4F8A3A' ${o}/>`,
  onion: `<path d='M32 8c4 6 4 8 2 12 14 4 22 14 20 24-2 10-12 14-22 14S12 54 10 44c-2-10 6-20 20-24-2-4-2-6 2-12z' fill='#F0C27B' ${O}/><path d='M32 22c-6 10-6 26 0 34M32 22c6 10 6 26 0 34M22 26c-4 10-2 22 4 28M42 26c4 10 2 22-4 28' fill='none' stroke='#C99A4B' stroke-width='1.6'/>`,
  red_onion: `<path d='M32 8c4 6 4 8 2 12 14 4 22 14 20 24-2 10-12 14-22 14S12 54 10 44c-2-10 6-20 20-24-2-4-2-6 2-12z' fill='#9C3D6E' ${O}/><path d='M32 22c-6 10-6 26 0 34M32 22c6 10 6 26 0 34' fill='none' stroke='#D78AB3' stroke-width='1.6'/>`,
  garlic: `<path d='M32 8c2 6 2 8 0 10 14 2 22 12 22 22 0 12-10 18-22 18S10 52 10 40c0-10 8-20 22-22-2-2-2-4 0-10z' fill='#FBF5EA' ${O}/><path d='M32 18c-8 8-8 30 0 40M32 18c8 8 8 30 0 40M20 26c-6 8-4 22 2 28M44 26c6 8 4 22-2 28' fill='none' stroke='#E3D7C2' stroke-width='1.8'/>`,
  ginger: `<path d='M10 40c0-8 8-10 14-8 2-8 10-10 14-4 6-6 16-2 14 8 6 2 6 12-2 14-6 2-10-2-14 0-6 4-14 4-18 0-6 0-8-4-8-10z' fill='#E2B46A' ${O}/><path d='M18 40q4 2 8 0M34 38q4 2 8 0' stroke='#B88542' stroke-width='1.6' fill='none'/>`,
  potato: `<path d='M10 36c0-12 10-20 24-20s22 8 20 18-10 20-24 20S10 46 10 36z' fill='#C99B5E' ${O}/>${[[22, 30], [38, 28], [30, 42], [44, 40]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.8' fill='#8E6738'/>`).join('')}`,
  sweet_potato: `<path d='M6 36c4-12 18-18 32-16s22 10 18 18-18 16-32 12S4 42 6 36z' fill='#B5513A' ${O}/><path d='M16 32q12-6 26-2' stroke='#D97E5E' stroke-width='2' fill='none'/>`,
  carrot: `<path d='M14 50L40 18c4-4 10 2 6 6L18 54c-2 2-6 0-4-4z' fill='#F28C28' ${O}/><path d='M26 38l4 3M32 30l4 3M22 44l3 2' stroke='#C96A12' stroke-width='1.8'/><path d='M44 18c0-8 4-12 8-12M46 20c6-4 12-4 14 0M44 18c-4-6-2-12 2-14' stroke='#4F8A3A' stroke-width='3.4' fill='none'/>`,
  pepper: `<path d='M32 16c-14 0-20 10-18 24 2 12 10 18 18 18s16-6 18-18c2-14-4-24-18-24z' fill='#E5392B' ${O}/><path d='M32 16c-4-4-2-10 4-12' stroke='#3F7F25' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M22 24q-4 10 0 20' stroke='#FF8A72' stroke-width='3' fill='none'/>`,
  green_pepper: `<path d='M32 16c-14 0-20 10-18 24 2 12 10 18 18 18s16-6 18-18c2-14-4-24-18-24z' fill='#4E9A3A' ${O}/><path d='M32 16c-4-4-2-10 4-12' stroke='#2F6B22' stroke-width='4' fill='none' stroke-linecap='round'/><path d='M22 24q-4 10 0 20' stroke='#8CC56B' stroke-width='3' fill='none'/>`,
  chili: `<path d='M14 14c10 0 14 8 16 18 2 12 10 20 22 22-12 6-28 0-32-14-2-8-2-18-6-26z' fill='#D9311F' ${O}/><path d='M14 14c-2-6 2-10 6-10' stroke='#3F7F25' stroke-width='4' fill='none'/>`,
  lettuce: leafy('#8CCB5E', '#5E9C3A'),
  spinach: `${[[-20, 22], [0, 32], [20, 42]].map(([r, x]) => `<path d='M${x} 56c-12-8-14-28-2-40 12 12 10 32 2 40z' transform='rotate(${r} ${x} 56)' fill='#3E8A3A' ${O}/><path d='M${x} 56V24' transform='rotate(${r} ${x} 56)' stroke='#7CC066' stroke-width='1.6'/>`).join('')}`,
  cabbage: `<circle cx='32' cy='36' r='22' fill='#C8E6A0' ${O}/><path d='M32 14c-10 8-10 34 0 44M32 14c10 8 10 34 0 44M14 28q18 8 36 0' fill='none' stroke='#8EBE60' stroke-width='2'/>`,
  cucumber: `<rect x='6' y='26' width='52' height='16' rx='8' fill='#4E8F3A' ${O} transform='rotate(-18 32 34)'/><circle cx='18' cy='38' r='1.6' fill='#A8D888'/><circle cx='34' cy='32' r='1.6' fill='#A8D888'/><circle cx='46' cy='28' r='1.6' fill='#A8D888'/>`,
  broccoli: `<path d='M28 58V40M36 58V40' stroke='#7BB04E' stroke-width='6'/><path d='M26 60h12V40H26z' fill='#8CC56B' ${O}/><circle cx='20' cy='30' r='10' fill='#3F8A3A' ${O}/><circle cx='44' cy='30' r='10' fill='#3F8A3A' ${O}/><circle cx='32' cy='22' r='12' fill='#4E9A3A' ${O}/>`,
  mushroom: `<path d='M10 32c0-12 10-20 22-20s22 8 22 20z' fill='#A97B55' ${O}/><path d='M24 32h16l-2 22h-12z' fill='#F4E9D6' ${O}/><circle cx='22' cy='24' r='3' fill='#D2AE8A'/><circle cx='38' cy='20' r='2.4' fill='#D2AE8A'/>`,
  corn: `<path d='M24 58c-6-14-4-36 8-50 12 14 14 36 8 50z' fill='#F6C531' ${O}/>${[16, 24, 32, 40, 48].map((y) => `<path d='M${26} ${y}h12' stroke='#D9A20E' stroke-width='1.4'/>`).join('')}<path d='M24 58c-8-6-12-18-10-28 6 4 10 14 14 28M40 58c8-6 12-18 10-28-6 4-10 14-14 28' fill='#7BB04E' ${O}/>`,
  peas: `<path d='M8 40c8-16 32-22 48-12-6 16-30 22-48 12z' fill='#7BC25A' ${O}/>${[20, 30, 40].map((x) => `<circle cx='${x}' cy='${36 - (x - 20) / 4}' r='4.4' fill='#A6DE7E' ${o}/>`).join('')}`,
  avocado: `<path d='M32 6c10 0 18 18 18 32 0 12-8 20-18 20s-18-8-18-20C14 24 22 6 32 6z' fill='#3F6B2A' ${O}/><path d='M32 12c7 0 13 15 13 26 0 9-6 15-13 15s-13-6-13-15c0-11 6-26 13-26z' fill='#CDE48C'/><circle cx='32' cy='40' r='8' fill='#8A5A34' ${O}/>`,
  lemon: `<ellipse cx='32' cy='34' rx='24' ry='18' fill='#F9D332' ${O}/><path d='M8 34l-4-2M56 34l4-2' ${O}/><path d='M20 26q6-6 14-6' stroke='#FFF2A6' stroke-width='3' fill='none'/>`,
  lime: `<ellipse cx='32' cy='34' rx='22' ry='18' fill='#7CC043' ${O}/><path d='M20 26q6-6 14-6' stroke='#C8EC9A' stroke-width='3' fill='none'/>`,
  apple: `<path d='M32 18c-10-6-24 0-22 16 2 16 12 24 22 20 10 4 20-4 22-20 2-16-12-22-22-16z' fill='#D9392B' ${O}/><path d='M32 18c0-6 2-10 6-12' stroke='${INK}' stroke-width='2.4' fill='none'/><path d='M36 12q8-4 12 2-8 4-12-2z' fill='#4F8A3A' ${o}/>`,
  banana: `<path d='M10 22c6 22 24 32 44 26-2 6-10 10-22 10C16 58 6 42 10 22z' fill='#F9D332' ${O}/><path d='M10 22l-2-6' ${O}/>`,
  herbs: `${[[22, -14], [32, 0], [42, 14]].map(([x, r]) => `<g transform='rotate(${r} 32 58)'><path d='M32 58V22' stroke='#3F7F25' stroke-width='2'/>${[20, 28, 36].map((y) => `<path d='M32 ${y}c-8-2-10-8-8-12 6 0 8 6 8 12zM32 ${y + 4}c8-2 10-8 8-12-6 0-8 6-8 12z' fill='#5EA94A' ${o}/>`).join('')}</g>`).join('')}<path d='M24 50h16' stroke='#D9452B' stroke-width='4'/>`,
  scallion: `${[[-10, 26], [0, 32], [10, 38]].map(([r]) => `<g transform='rotate(${r} 32 58)'><path d='M32 58V8' stroke='${INK}' stroke-width='7' stroke-linecap='round'/><path d='M32 58V8' stroke='#6DBE4A' stroke-width='4' stroke-linecap='round'/><path d='M32 58V40' stroke='#F4F7EE' stroke-width='4' stroke-linecap='round'/></g>`).join('')}`,
  celery: `${[-8, 0, 8].map((d) => `<path d='M${32 + d} 58V14' stroke='${INK}' stroke-width='8' stroke-linecap='round'/><path d='M${32 + d} 58V14' stroke='#A9D46E' stroke-width='5' stroke-linecap='round'/>`).join('')}<path d='M24 14c-4-8 4-10 8-6 4-4 12-2 8 6' fill='#6FAE3A' ${o}/>`,
  zucchini: `<rect x='4' y='26' width='56' height='16' rx='8' fill='#3F7F2A' ${O} transform='rotate(-24 32 34)'/><path d='M50 14l6-4' stroke='#8C6A3A' stroke-width='4'/>`,
  eggplant: `<path d='M44 12c10 6 10 20 0 34-10 14-34 16-36 2-2-12 14-14 22-24 4-6 6-14 14-12z' fill='#5E2C6E' ${O}/><path d='M44 12l8-6M40 16c4-2 8 0 10 4' stroke='#4F8A3A' stroke-width='4' fill='none'/>`,
  beans_dry: bag('#C9A26E', `${[[26, 34, '#9C3B2E'], [34, 36, '#9C3B2E'], [30, 41, '#9C3B2E'], [38, 42, '#9C3B2E']].map(([x, y, c]) => `<ellipse cx='${x}' cy='${y}' rx='3.4' ry='2.4' fill='${c}' ${o}/>`).join('')}`),
  lentils: bag('#F6EFE2', `<ellipse cx='32' cy='38' rx='12' ry='9' fill='#F28C28' ${o}/>${[[27, 36], [33, 35], [30, 40], [37, 39]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2' fill='#F7B267'/>`).join('')}`),
  nuts: `${[[18, 40], [32, 34], [46, 42], [26, 50], [40, 52]].map(([x, y]) => `<path d='M${x - 8} ${y}c0-6 6-8 8-4 2-4 8-2 8 4s-6 8-8 4c-2 4-8 2-8-4z' fill='#D9AE6E' ${o}/>`).join('')}`,
  salt: `<path d='M20 24h24l-2 30c0 2-2 4-4 4H26c-2 0-4-2-4-4z' fill='#FFFFFF' ${O}/><path d='M20 24c0-8 6-14 12-14s12 6 12 14z' fill='#C9CDD2' ${O}/><circle cx='28' cy='18' r='1.4' fill='${INK}'/><circle cx='34' cy='16' r='1.4' fill='${INK}'/>`,
  peppermill: `<path d='M24 30h16v24c0 3-2 4-4 4h-8c-2 0-4-1-4-4z' fill='#6B4A2B' ${O}/><path d='M22 30c0-10 4-16 10-18 6 2 10 8 10 18z' fill='#8A5A34' ${O}/><circle cx='32' cy='10' r='3' fill='#C9CDD2' ${O}/>`,
  spice: (c) => jar(c, '#C9CDD2', `<rect x='20' y='30' width='24' height='14' rx='2' fill='#FFFFFF' ${o}/><circle cx='32' cy='37' r='4' fill='${c}' ${o}/>`),
  honey: jar('#F4A93B', '#C99A4B', `<rect x='20' y='30' width='24' height='12' rx='2' fill='#FFF3C4' ${o}/>`),
  peanut_butter: jar('#B07A3E', '#D9452B', `<rect x='20' y='30' width='24' height='12' rx='2' fill='#FFFFFF' ${o}/>`),
  salsa: jar('#D9452B', '#3F7F25', `${[[26, 36], [36, 40], [30, 46]].map(([x, y]) => `<rect x='${x}' y='${y}' width='5' height='4' fill='#7BC25A'/>`).join('')}`),
  frozen: `<path d='M12 14h40l-2 40c0 3-3 5-6 5H20c-3 0-6-2-6-5z' fill='#BFE3F5' ${O}/><path d='M12 14l4-6h32l4 6' fill='#FFFFFF' ${O}/><g stroke='#2F6FA3' stroke-width='2.4' stroke-linecap='round'><path d='M32 26v20M23 31l18 10M41 31l-18 10'/></g>`,
  coffee: bag('#6B4A2B', `<circle cx='32' cy='38' r='8' fill='#3B2418' ${o}/><path d='M32 31q-3 7 0 14' stroke='#A97B55' stroke-width='1.8' fill='none'/>`, '#C9A26E'),
  tea: `<rect x='12' y='22' width='40' height='34' rx='3' fill='#5E8F4F' ${O}/><path d='M12 22l6-8h40l-6 8M52 22v34l6-8V14' fill='#7BAA62' ${O}/><path d='M26 30h12v14H26z' fill='#FFFFFF' ${o}/>`,
  juice: carton('#F28C28', '#FFFFFF'),
  box: `<rect x='12' y='18' width='40' height='38' rx='3' fill='#E9C98A' ${O}/><path d='M12 18l6-8h40l-6 8M52 18v38l6-8V10' fill='#D9B26A' ${O}/><rect x='18' y='30' width='28' height='14' rx='2' fill='#FFFFFF' ${o}/>`,
  wine: bottle('#7A1E3A', '#3B2C24', '#F6E3B4', 14)
};
// grocery name → drawing. First match wins, so specific names come before general ones.
const PICK = [
  [/black pepper|peppercorn/, 'peppermill'], [/\bsalt\b/, 'salt'], [/peanut butter|tahini/, 'peanut_butter'], [/eggplant|aubergine/, 'eggplant'],
  [/broth|stock|bouillon/, 'broth'], [/fish sauce/, 'fishsauce'], [/soy|tamari|teriyaki|oyster sauce|worcester/, 'soy'], [/hot sauce|sriracha|tabasco|chili sauce|gochujang/, 'hotsauce'],
  [/ketchup|bbq|barbecue/, 'ketchup'], [/vinegar|mirin/, 'vinegar'], [/\boil\b/, 'oil'], [/wine|sake|sherry/, 'wine'], [/coconut milk|coconut cream/, 'can_coconut'],
  [/rice noodle|vermicelli|noodle|ramen|udon|soba/, 'noodles'],
  [/frozen (peas|corn|veg|berries|spinach)|ice cream|frozen/, 'frozen'], [/egg/, 'egg'],
  [/cream cheese/, 'cream_cheese'], [/heavy cream|whipping cream|half.and.half|sour cream|\bcream\b/, 'cream'], [/milk/, 'milk'], [/butter(?!milk)|ghee/, 'butter'],
  [/yog(h)?urt/, 'yogurt'], [/mozzarella/, 'mozzarella'], [/parmesan|parmigiano|pecorino/, 'parmesan'], [/feta|paneer|ricotta|goat cheese|gruy|swiss/, 'cheese_white'], [/cheddar|cheese|colby|jack/, 'cheddar'],
  [/drumstick|wing|thigh/, 'drumstick'], [/chicken|turkey/, 'chicken'], [/bacon|pancetta/, 'bacon'], [/ham\b|prosciutto/, 'ham'], [/sausage|chorizo|andouille|hot dog|bratwurst|banger/, 'sausage'],
  [/ground|mince|minced/, 'ground'], [/lamb|mutton/, 'lamb'], [/pork|chop/, 'pork'], [/beef|steak|brisket|veal/, 'beef'],
  [/shrimp|prawn|scallop/, 'shrimp'], [/salmon|fish|cod|tilapia|tuna|trout|mackerel|sardine|anchov/, 'fish'], [/tofu|tempeh/, 'tofu'],
  [/tomato (sauce|paste|puree|passata)|crushed tomato|diced tomato|canned tomato|passata|enchilada sauce/, 'can_tomato'],
  [/black bean/, 'can_black'], [/chickpea|garbanzo|fava/, 'can_chickpea'], [/canned.*bean|kidney|cannellini|pinto|baked bean|white bean/, 'can_beans'], [/\bbeans?\b|split pea/, 'beans_dry'], [/lentil|dal\b/, 'lentils'],
  [/rice/, 'rice'], [/spaghetti|pasta|macaroni|penne|lasagna|linguine|fettuccine|orzo|fideo|ziti/, 'pasta'],
  [/tortilla|taco shell|wrap/, 'tortilla'], [/bread|bun|pita|naan|baguette|toast|roll|panko|breadcrumb/, 'bread'], [/flour|cornmeal|grits|polenta|oats/, 'flour'], [/sugar|sweetener/, 'sugar'],
  [/salsa/, 'salsa'], [/honey|syrup/, 'honey'], [/coffee/, 'coffee'], [/\btea\b/, 'tea'], [/juice/, 'juice'],
  [/sweet potato|yam/, 'sweet_potato'], [/potato/, 'potato'], [/carrot/, 'carrots'], [/scallion|green onion|spring onion|chive|leek/, 'scallion'], [/red onion|shallot/, 'red_onion'], [/onion/, 'onion'],
  [/garlic/, 'garlic'], [/ginger|turmeric root|galangal|lemongrass/, 'ginger'], [/tomato/, 'tomato'], [/jalape|chili|chile|chilli|serrano|habanero/, 'chili'],
  [/green (bell )?pepper/, 'green_pepper'], [/bell pepper|capsicum|red pepper\b|pepper(s)?$/, 'pepper'], [/lettuce|romaine|arugula|salad/, 'lettuce'], [/spinach|kale|chard|basil|bok choy/, 'spinach'],
  [/cabbage|sprout/, 'cabbage'], [/cucumber/, 'cucumber'], [/broccoli|cauliflower/, 'broccoli'], [/mushroom|shiitake/, 'mushroom'], [/corn/, 'corn'], [/\bpeas?\b|edamame/, 'peas'],
  [/avocado/, 'avocado'], [/lemon/, 'lemon'], [/lime/, 'lime'], [/apple|pear/, 'apple'], [/banana|plantain/, 'banana'], [/celery/, 'celery'], [/zucchini|courgette/, 'zucchini'],
  [/parsley|cilantro|coriander|herb|mint|dill|thyme|rosemary|oregano leaves/, 'herbs'], [/peanut|cashew|almond|walnut|pecan|pistachio|pine nut|nut/, 'nuts']
];
const SPICE_COLOR = [[/paprika|chili powder|cayenne|berbere|chipotle/, '#C4422B'], [/cumin|garam|curry|allspice|cinnamon|nutmeg|clove/, '#A0612E'], [/turmeric|saffron/, '#E9A21B'], [/oregano|basil|thyme|herb|bay|dill|rosemary|parsley/, '#6E8F3E'], [/garlic powder|onion powder|ginger powder/, '#E2CFA2']];
const BY_CATEGORY = { Proteins: 'beef', Produce: 'lettuce', 'Dairy & Eggs': 'milk', 'Carbs & Grains': 'rice', 'Canned & Jarred': 'can_beans', 'Sauces & Oils': 'oil', 'Spices & Seasonings': null, Frozen: 'frozen', Baking: 'flour', Other: 'box' };
FOOD.carrots = FOOD.carrot;

export function foodKey(name, category) {
  const n = String(name || '').toLowerCase();
  if (/powder|seasoning|spice|ground (cumin|cinnamon|coriander|ginger|cloves|nutmeg)|paprika|cumin|oregano|cinnamon|garam|turmeric|chili flakes|pepper flakes|berbere|bay leaves|dried (thyme|oregano|basil)/.test(n)) return 'spice';
  for (const [re, k] of PICK) if (re.test(n)) return k;
  return category === 'Spices & Seasonings' ? 'spice' : BY_CATEGORY[category] || 'box';
}
function body(name, category) {
  const k = foodKey(name, category);
  if (k === 'spice') { const n = String(name || '').toLowerCase(); return FOOD.spice((SPICE_COLOR.find(([re]) => re.test(n)) || [0, '#B5713E'])[1]); }
  return FOOD[k] || FOOD.box;
}
// a die-cut sticker: the drawing with a thick white border and a soft shadow
const memo = new Map();
export function foodSticker(name, category) {
  const key = `${name}|${category}`; let s = memo.get(key); if (s) return s;
  s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-6 -6 76 76'><defs><filter id='k' x='-20%' y='-20%' width='140%' height='140%'><feMorphology in='SourceAlpha' operator='dilate' radius='3.2' result='d'/><feFlood flood-color='#FFFFFF'/><feComposite in2='d' operator='in' result='w'/><feOffset in='d' dy='2' result='o'/><feFlood flood-color='#3B2C24' flood-opacity='.28'/><feComposite in2='o' operator='in' result='sh'/><feMerge><feMergeNode in='sh'/><feMergeNode in='w'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><g filter='url(#k)'>${body(name, category)}</g></svg>`;
  if (memo.size > 600) memo.clear(); memo.set(key, s); return s;
}
export const stickerUrl = (name, category) => `data:image/svg+xml,${encodeURIComponent(foodSticker(name, category))}`;
// the raw drawing (no sticker border), to place inside bigger pictures
export const foodDrawing = (name, category, x, y, s = 1) => T(x - 32 * s, y - 32 * s, s, 0, body(name, category));

// ---------- small pieces of food for the tops of dishes ----------
export function bit(kind, x, y, s = 1, r = 0) {
  const g = (b) => T(x, y, s, r, b);
  switch (kind) {
    case 'shrimp': return g(`<path d='M6-4c-6-4-12 0-12 5s5 7 9 5c2-1 2-3 0-4-3 1-5 0-5-2s3-3 7-2' fill='#F58A5E' ${o}/><path d='M-4-3l3 3M-4 2l3 2' stroke='#C9583A' stroke-width='1'/>`);
    case 'chicken': return g(`<path d='M-7-2c1-4 6-5 9-4s6 3 5 6-5 5-9 4-6-3-5-6z' fill='#D9A55A' ${o}/><path d='M-3-3q3-1 5 0' stroke='#F2C98A' stroke-width='1.4' fill='none'/>`);
    case 'beef': return g(`<path d='M-8-2q4-4 9-3t7 3q-4 4-9 4t-7-4z' fill='#7A3E26' ${o}/><path d='M-4-2q4-1 7 0' stroke='#A9603E' stroke-width='1.2' fill='none'/>`);
    case 'mince': return g(`<circle r='3.4' fill='#8A4A2E' ${o}/>`);
    case 'pork': return g(`<path d='M-8-2q4-4 9-3t7 3q-4 4-9 4t-7-4z' fill='#C98A5E' ${o}/>`);
    case 'sausage': return g(`<ellipse rx='5' ry='4' fill='#A8452E' ${o}/><ellipse rx='3' ry='2.2' fill='#D9785E'/>`);
    case 'link': return g(`<rect x='-11' y='-4' width='22' height='8' rx='4' fill='#9C4A2E' ${o}/><path d='M-6-1h10' stroke='#D08A62' stroke-width='1.4'/>`);
    case 'bacon': return g(`<path d='M-5-2h10v3h-10z' fill='#D6604E' ${o}/>`);
    case 'fried_egg': return g(`<path d='M-11 0c0-5 4-8 9-7 3-3 9-1 10 3 3 2 2 7-2 8-3 3-10 3-13 1-3 0-4-3-4-5z' fill='#FFFFFF' ${o}/><circle cx='0' cy='-1' r='4' fill='#F6B21A' ${o}/>`);
    case 'half_egg': return g(`<ellipse rx='7' ry='5' fill='#FFFFFF' ${o}/><circle r='3.2' fill='#F6B21A'/>`);
    case 'scramble': return g(`<path d='M-6-1q2-4 6-2 4-2 6 1 1 4-3 4-3 2-6 0-4 0-3-3z' fill='#FFD84A' ${o}/>`);
    case 'scallion': return g(`<circle r='2.2' fill='none' stroke='#5EAE3E' stroke-width='1.6'/>`);
    case 'herb': return g(`<path d='M0 3c-4-1-5-5-3-7 3 1 4 4 3 7zM0 3c4-1 5-5 3-7-3 1-4 4-3 7z' fill='#4E9A3A' ${o}/>`);
    case 'basil': return g(`<path d='M-6 2c0-6 6-8 10-6 0 5-5 8-10 6z' fill='#3F8A3A' ${o}/>`);
    case 'tomato': return g(`<path d='M-5 2a5 5 0 0 1 10 0z' fill='#E8452F' ${o}/><circle cx='-1' cy='0' r='.8' fill='#FFD9A0'/><circle cx='2' cy='0' r='.8' fill='#FFD9A0'/>`);
    case 'cherry_tomato': return g(`<circle r='4.2' fill='#E8452F' ${o}/><path d='M-1-2q1-1 2 0' stroke='#FF9A85' stroke-width='1.2' fill='none'/>`);
    case 'cheese': return g(`<path d='M-6-1l5 1M-2-3l6 2M-4 2l7 0' stroke='#F2A93B' stroke-width='2.2'/>`);
    case 'melt': return g(`<path d='M-10-2q5-3 10 0t10 0v3q-2 4-4 0-3 4-6 1-4 3-6 0-3 1-4-4z' fill='#FFC94A' ${o}/>`);
    case 'feta': return g(`<rect x='-3.5' y='-3.5' width='7' height='7' rx='1' fill='#FFFDF6' ${o}/>`);
    case 'parm': return g(`<path d='M-4 0h8M-2-2h5' stroke='#FFF3D0' stroke-width='1.6'/>`);
    case 'bean_red': return g(`<ellipse rx='3.4' ry='2.2' fill='#8E2E26' ${o}/>`);
    case 'bean_black': return g(`<ellipse rx='3.2' ry='2.1' fill='#2A2426' stroke='#6E6266' stroke-width='1'/>`);
    case 'bean_white': return g(`<ellipse rx='3.4' ry='2.2' fill='#F4EBD8' ${o}/>`);
    case 'chickpea': return g(`<circle r='3' fill='#E8C27C' ${o}/>`);
    case 'fava': return g(`<ellipse rx='3.4' ry='2.6' fill='#9C6A3A' ${o}/>`);
    case 'chili': return g(`<circle r='2.4' fill='#D9311F' stroke='#8E1E12' stroke-width='1'/><circle r='.8' fill='#FFE08A'/>`);
    case 'chili_whole': return g(`<path d='M-8 0q6-6 14-2-4 6-14 2z' fill='#D9311F' ${o}/>`);
    case 'lemon': return g(`<path d='M-7 0a7 7 0 0 0 14 0z' fill='#F9D332' ${o}/><path d='M0 0v6M-4 0l-3 4M4 0l3 4' stroke='#FFF2A6' stroke-width='1'/>`);
    case 'lime': return g(`<path d='M-7 0a7 7 0 0 0 14 0z' fill='#7CC043' ${o}/><path d='M0 0v6M-4 0l-3 4M4 0l3 4' stroke='#D8F2B0' stroke-width='1'/>`);
    case 'mushroom': return g(`<path d='M-6 0a6 5 0 0 1 12 0z' fill='#A97B55' ${o}/><rect x='-1.6' y='0' width='3.2' height='4' fill='#F4E9D6' ${o}/>`);
    case 'pepper_red': return g(`<path d='M-6-1q6-3 12 0v2q-6-3-12 0z' fill='#E5392B' ${o}/>`);
    case 'pepper_green': return g(`<path d='M-6-1q6-3 12 0v2q-6-3-12 0z' fill='#4E9A3A' ${o}/>`);
    case 'spinach': return g(`<path d='M-7 2c2-6 8-8 12-5-2 6-8 8-12 5z' fill='#2F7A35' ${o}/>`);
    case 'lettuce': return g(`<path d='M-9 3q-2-8 6-9 4-3 8 1 5 1 4 6-4 4-9 3-5 2-9-1z' fill='#8CCB5E' ${o}/>`);
    case 'cabbage': return g(`<path d='M-6 0q6-3 12 0' stroke='#B9DC8E' stroke-width='2.4' fill='none'/>`);
    case 'tofu': return g(`<path d='M-4-2l2-2h6v6l-2 2h-6z' fill='#FFFBEE' ${o}/>`);
    case 'pea': return g(`<circle r='2.2' fill='#7BC25A' stroke='#3F7F25' stroke-width='1'/>`);
    case 'carrot': return g(`<circle r='3' fill='#F28C28' ${o}/>`);
    case 'carrot_strip': return g(`<path d='M-6 0h12' stroke='#F28C28' stroke-width='2.6'/>`);
    case 'corn': return g(`<circle r='2.2' fill='#F6C531' stroke='#C9930E' stroke-width='1'/>`);
    case 'avocado': return g(`<path d='M-8 2q8-10 16 0-8 3-16 0z' fill='#B5D86A' ${o}/>`);
    case 'onion_ring': return g(`<ellipse rx='4.4' ry='3' fill='none' stroke='#F4E6C8' stroke-width='1.8'/>`);
    case 'crispy_onion': return g(`<path d='M-5 0q2-3 4 0t4 0' stroke='#8A4A1E' stroke-width='2' fill='none'/>`);
    case 'garlic': return g(`<ellipse rx='3' ry='2' fill='#FBF3E0' ${o}/>`);
    case 'potato': return g(`<path d='M-4-3h7l1 6h-8z' fill='#F2D38A' ${o}/>`);
    case 'peanut': return g(`<path d='M-4 0c0-3 3-4 4-2 1-2 4-1 4 2s-3 4-4 2c-1 2-4 1-4-2z' fill='#D9AE6E' ${o}/>`);
    case 'cashew': return g(`<path d='M-4-2q-2 6 4 6 4 0 4-3-3 1-4-1-1-3-4-2z' fill='#EBCB93' ${o}/>`);
    case 'sprout': return g(`<path d='M-6 2q3-6 10-4' stroke='#FFFDF0' stroke-width='1.8' fill='none'/><circle cx='4' cy='-2' r='1.4' fill='#E6E8A0'/>`);
    case 'cucumber': return g(`<circle r='3.6' fill='#CDE7A6' stroke='#3F7F2A' stroke-width='1.4'/>`);
    case 'olive': return g(`<ellipse rx='2.8' ry='2' fill='#3E3A2A' ${o}/>`);
    case 'sesame': return g(`<ellipse rx='1' ry='.6' fill='#FFF6DE'/>`);
    case 'pine': return g(`<ellipse rx='1.6' ry='1' fill='#F2DEA6' stroke='#B5925A' stroke-width='.6'/>`);
    default: return '';
  }
}
