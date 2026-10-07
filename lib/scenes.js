// Illustrated restaurant scenes: when you open a dish or recipe, the top of the card looks like the restaurant you'd
// eat it in (red lanterns and a dragon for Chinese, a noren curtain for Japanese, papel picado for Mexican, a
// checked tablecloth for an Italian trattoria …) with the dish itself on the table. Drawn here from simple shapes plus
// Twemoji art (CC-BY 4.0, already credited for the passport stamps). Shared by the app and Whisk Play: the caller
// passes `src(code)` → the URL of a Twemoji file (the app serves /tw/<code>.svg; Whisk Play inlines them).
import { motifFor } from './culture.js';

// [keyword regex, Twemoji] — the first match picks the dish drawn on the table
const DISH = [
  [/dumpling|gyoza|potsticker|momo|mandu|wonton|pierogi|empanada/i, '1f95f'], [/sushi|maki|nigiri/i, '1f363'], [/ramen|pho|noodle|lo mein|chow mein|pad thai|udon|soba|laksa|japchae|vermicelli/i, '1f35c'],
  [/curry|tikka|masala|korma|vindaloo|dal\b|daal|dhal|stew|tagine|goulash/i, '1f35b'], [/fried rice|bibimbap|rice bowl|jollof|biryani|risotto|paella|pilaf|plov/i, '1f35a'],
  [/taco|tostada/i, '1f32e'], [/burrito|wrap|quesadilla/i, '1f32f'], [/tamal/i, '1fad4'], [/pizza/i, '1f355'], [/spaghetti|pasta|carbonara|lasagn|penne|mac and cheese|macaroni|gnocchi/i, '1f35d'],
  [/burger/i, '1f354'], [/sandwich|banh mi|panini|sub\b/i, '1f96a'], [/hot dog/i, '1f32d'], [/salad|slaw/i, '1f957'], [/soup|chowder|bisque|gumbo|broth|caldo|borscht/i, '1f372'],
  [/falafel/i, '1f9c6'], [/flatbread|naan|pita|arepa|injera|roti/i, '1fad3'], [/shrimp|prawn|tempura/i, '1f364'], [/ceviche|poke/i, '1f957'], [/salmon|cod|tilapia|fish|trout|mackerel/i, '1f41f'],
  [/egg|shakshuka|omelet|frittata|gyeran/i, '1f373'], [/pancake|crepe|waffle/i, '1f95e'], [/steak|beef|brisket|bulgogi/i, '1f969'], [/chicken|wings|drumstick/i, '1f357'],
  [/cake|pie|tart|cookie|brownie|dessert/i, '1f370'], [/bread|loaf|biscuit/i, '1f35e'], [/fondue/i, '1fad5'], [/kebab|skewer|satay|souvlaki/i, '1f362']
];
export function dishEmoji(title, fallback) { const t = String(title || ''); return (DISH.find(([re]) => re.test(t)) || [null, fallback || '1f372'])[1]; }

// One restaurant per part of the world (same regions as lib/culture.js).
// wall: [top, bottom] · trim: beams/frames · table: [top, front] · win: window shape · garland · props on the wall and table
const SCENES = {
  clouds: { name: 'Chinese restaurant', wall: ['#B3262B', '#7E1820'], trim: '#3A1A12', table: ['#5A2A18', '#3E1C10'], win: 'moongate', winFill: ['#F8E3B8', '#E9B977'], garland: 'lanterns',
    wall_: [['1f409', 58, 82, 58, -6], ['1f38b', 360, 84, 30, 0]], props: [['1f962', 92, 30], ['1fad6', 318, 38]], dish: '1f35c' },
  seigaiha: { name: 'Japanese izakaya', wall: ['#F3E6CF', '#E2CCA8'], trim: '#5B3A22', table: ['#C99A63', '#A27646'], win: 'noren', winFill: ['#1F3E73', '#16305A'], garland: 'none',
    wall_: [['1f38f', 26, 70, 40, 0], ['1f338', 346, 60, 30, 10]], props: [['1f962', 96, 28], ['1f375', 318, 34]], dish: '1f363' },
  bojagi: { name: 'Korean kitchen', wall: ['#F6EEE2', '#E8D9C4'], trim: '#2F6B5E', table: ['#8B5A3A', '#6A4228'], win: 'lattice', winFill: ['#FFF7E6', '#F4E3C2'], garland: 'none',
    wall_: [['1f3ee', 34, 40, 34, 0], ['1fad9', 344, 70, 34, 0]], props: [['1f962', 96, 28], ['1f9c2', 318, 26]], dish: '1f35a' },
  lotus: { name: 'Thai street kitchen', wall: ['#1E6B5C', '#14493F'], trim: '#E0A93B', table: ['#9C6B3F', '#7A512D'], win: 'gable', winFill: ['#F6C453', '#E39B2F'], garland: 'lights',
    wall_: [['1fab7', 28, 70, 38, 0], ['1f418', 340, 64, 40, 0]], props: [['1f336', 96, 28], ['1f965', 318, 32]], dish: '1f35c' },
  mandala: { name: 'Indian dhaba', wall: ['#E8792B', '#C2531E'], trim: '#6E2A62', table: ['#7A4A2A', '#5A341C'], win: 'jharokha', winFill: ['#FBE3A6', '#F2BE62'], garland: 'marigold',
    wall_: [['1fa94', 30, 76, 34, 0], ['1f418', 342, 66, 40, 0]], props: [['1fad3', 92, 34], ['1f375', 318, 30]], dish: '1f35b' },
  khatam: { name: 'Middle Eastern grill', wall: ['#1F6F78', '#174F57'], trim: '#D9A441', table: ['#8A5B34', '#6B4325'], win: 'arch', winFill: ['#F7E7C1', '#E9C98A'], garland: 'lamps',
    wall_: [['1fad6', 30, 78, 34, 0], ['1f319', 346, 40, 28, 0]], props: [['1fad2', 92, 28], ['1f9c6', 318, 30]], dish: '1f9c6' },
  zellige: { name: 'Moroccan riad', wall: ['#C8613A', '#9E4627'], trim: '#1E5C66', table: ['#7C4A2C', '#5E3620'], win: 'keyhole', winFill: ['#2E8A8F', '#1E6A70'], garland: 'lamps',
    wall_: [['1fad6', 30, 78, 34, 0], ['1f42a', 342, 66, 40, 0]], props: [['1fad2', 92, 28], ['1f34b', 318, 28]], dish: '1f35b' },
  kente: { name: 'West African chop bar', wall: ['#F2C14E', '#DDA33A'], trim: '#2F6B3A', table: ['#7A4B2A', '#5B3620'], win: 'kente', winFill: ['#C0392B', '#2F6B3A'], garland: 'bunting',
    wall_: [['1fa98', 26, 74, 38, 0], ['1f334', 344, 52, 44, 0]], props: [['1f336', 94, 28], ['1f965', 318, 30]], dish: '1f35b' },
  picado: { name: 'Mexican cocina', wall: ['#F6E2C6', '#EBC99F'], trim: '#1F7A8C', table: ['#B5523A', '#8E3D2A'], win: 'talavera', winFill: ['#FFFFFF', '#EAF2FB'], garland: 'picado',
    wall_: [['1f335', 22, 70, 40, 0], ['1f336', 346, 70, 30, 20]], props: [['1f951', 92, 30], ['1f336', 318, 28]], dish: '1f32e' },
  palms: { name: 'Caribbean beach shack', wall: ['#5BC0BE', '#3A9E9C'], trim: '#F2C14E', table: ['#B07A46', '#8C5E33'], win: 'shutters', winFill: ['#FF8A5B', '#F2C14E'], garland: 'lights',
    wall_: [['1f334', 18, 48, 50, 0], ['1f99c', 346, 54, 36, 0]], props: [['1f965', 92, 30], ['1f34d', 318, 32]], dish: '1f357' },
  andean: { name: 'Andean picantería', wall: ['#E9D4B4', '#D8BC94'], trim: '#A2412A', table: ['#7C4E2F', '#5E3A22'], win: 'mountains', winFill: ['#9FD3E8', '#6FB6D3'], garland: 'textile',
    wall_: [['1f999', 22, 70, 40, 0], ['1f3fa', 346, 76, 32, 0]], props: [['1f33d', 92, 30], ['1f336', 318, 26]], dish: '1f372' },
  majolica: { name: 'Italian trattoria', wall: ['#F4E3C9', '#E7CCA6'], trim: '#6B4A2B', table: ['#FFFFFF', '#F0E6E6'], cloth: 'check', win: 'shelf', winFill: ['#FFF6E5', '#F1DFC2'], garland: 'herbs',
    wall_: [['1f33f', 26, 50, 34, 0], ['1f345', 346, 74, 30, 0]], props: [['1f9c0', 92, 28], ['1fad2', 318, 26]], dish: '1f35d' },
  meander: { name: 'Greek taverna', wall: ['#F8F8F4', '#E6ECF2'], trim: '#1F5FA8', table: ['#2F6DB5', '#24578F'], win: 'bluedoor', winFill: ['#7FC4EA', '#4FA3D6'], garland: 'none',
    wall_: [['1fad2', 26, 60, 34, 0], ['1f3fa', 346, 76, 32, 0]], props: [['1f34b', 92, 28], ['1fad2', 318, 26]], dish: '1f957' },
  gingham: { name: 'French bistro', wall: ['#2F4B3A', '#22372A'], trim: '#C9A66B', table: ['#E6E3DD', '#C9C4BB'], win: 'awning', winFill: ['#C0392B', '#FFFFFF'], garland: 'none',
    wall_: [['1f950', 30, 74, 32, 0], ['1f56f', 346, 70, 30, 0]], props: [['1f956', 92, 34], ['1f9c0', 318, 28]], dish: '1f372' },
  tartan: { name: 'Cosy pub', wall: ['#3B5B45', '#2A4232'], trim: '#6B4226', table: ['#6B4226', '#4E2F1A'], win: 'panel', winFill: ['#C99A4B', '#A9772F'], garland: 'none',
    wall_: [['2618', 30, 60, 32, 0], ['1f56f', 346, 70, 30, 0]], props: [['1f35e', 92, 30], ['1fad6', 318, 30]], dish: '1f35b' },
  folk: { name: 'Eastern European kitchen', wall: ['#F7EFE2', '#EADAC1'], trim: '#B23A3A', table: ['#FFFFFF', '#EFE6DA'], cloth: 'stitch', win: 'plates', winFill: ['#FFFFFF', '#F3E6D2'], garland: 'none',
    wall_: [['1f33b', 26, 66, 34, 0], ['1fa86', 346, 70, 34, 0]], props: [['1f35e', 92, 30], ['1f9c4', 318, 26]], dish: '1f95f' },
  nordic: { name: 'Nordic cabin', wall: ['#D9C3A5', '#C2A684'], trim: '#5E4630', table: ['#E8DCCB', '#CDBDA7'], win: 'snow', winFill: ['#2C4A6E', '#1E3552'], garland: 'none',
    wall_: [['1f332', 24, 60, 40, 0], ['1f56f', 346, 72, 28, 0]], props: [['1f35e', 92, 30], ['2615', 318, 30]], dish: '1f41f' },
  quilt: { name: 'American diner', wall: ['#F6E6D2', '#EBD3B6'], trim: '#C0392B', table: ['#E74C3C', '#B03A2E'], cloth: 'chrome', win: 'neon', winFill: ['#2A2A3A', '#1C1C28'], garland: 'none',
    wall_: [['1f964', 28, 70, 32, 0], ['1f35f', 344, 70, 32, 0]], props: [['1f35f', 92, 30], ['1f964', 318, 30]], dish: '1f354' },
  tapa: { name: 'Island grill', wall: ['#6FC3D8', '#3E9DB6'], trim: '#8A5A34', table: ['#B07A46', '#8C5E33'], win: 'sea', winFill: ['#2E86AB', '#1F6A8A'], garland: 'bunting',
    wall_: [['1f334', 18, 48, 50, 0], ['1f41a', 346, 76, 30, 0]], props: [['1f965', 92, 30], ['1f34d', 318, 32]], dish: '1f41f' },
  suzani: { name: 'Silk Road teahouse', wall: ['#7B2D3F', '#5A1F2E'], trim: '#E0A93B', table: ['#8A5B34', '#6B4325'], win: 'suzani', winFill: ['#F4D7A1', '#E3B566'], garland: 'none',
    wall_: [['1fad6', 30, 78, 34, 0], ['1f42a', 342, 66, 40, 0]], props: [['1fad3', 92, 34], ['1f375', 318, 30]], dish: '1f35a' },
  dots: { name: 'Home kitchen', wall: ['#E8F2DC', '#D6E8C4'], trim: '#4E9A2F', table: ['#C99A63', '#A27646'], win: 'square', winFill: ['#BFE3F5', '#9FD0EC'], garland: 'none',
    wall_: [['1f33f', 26, 60, 34, 0], ['1f345', 346, 74, 30, 0]], props: [['1f9c2', 92, 26], ['1f944', 318, 30]], dish: '1f372' }
};

const g = (id, a, b) => `<linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient>`;
const img = (src, code, x, y, s, rot = 0) => `<image href='${src(code)}' x='${x - s / 2}' y='${y - s / 2}' width='${s}' height='${s}'${rot ? ` transform='rotate(${rot} ${x} ${y})'` : ''}/>`;

function windowShape(sc, k) {
  const t = sc.trim, W = `url(#w${k})`;
  switch (sc.win) {
    case 'moongate': return `<circle cx='272' cy='82' r='50' fill='${W}' stroke='${t}' stroke-width='7'/><g stroke='${t}' stroke-width='3' opacity='.85'><path d='M272 32v100M222 82h100M237 47l70 70M307 47l-70 70'/></g><circle cx='272' cy='82' r='18' fill='none' stroke='${t}' stroke-width='3'/>`;
    case 'noren': return `<rect x='0' y='0' width='400' height='14' fill='${t}'/>${[0, 1, 2, 3, 4].map((i) => `<rect x='${118 + i * 34}' y='14' width='31' height='62' fill='${W}'/>`).join('')}<circle cx='203' cy='46' r='12' fill='#F3E6CF' opacity='.9'/>`;
    case 'lattice': return `<rect x='224' y='26' width='100' height='96' rx='4' fill='${W}' stroke='${t}' stroke-width='6'/><g stroke='${t}' stroke-width='3'>${[0, 1, 2, 3].map((i) => `<path d='M${224 + 20 * (i + 1)} 26v96M224 ${26 + 19 * (i + 1)}h100'/>`).join('')}</g>`;
    case 'gable': return `<path d='M222 120V58l50-36 50 36v62z' fill='${W}' stroke='${t}' stroke-width='6'/><path d='M214 60l58-44 58 44' fill='none' stroke='${t}' stroke-width='6'/><path d='M206 52l-10-8M338 52l10-8' stroke='${t}' stroke-width='6' stroke-linecap='round'/>`;
    case 'jharokha': return `<path d='M228 124V70c0-26 20-42 44-42s44 16 44 42v54z' fill='${W}' stroke='${t}' stroke-width='6'/><path d='M228 70c14-8 30-8 44 0 14-8 30-8 44 0' fill='none' stroke='${t}' stroke-width='3'/><rect x='220' y='122' width='104' height='8' rx='3' fill='${t}'/>`;
    case 'arch': return `<path d='M232 126V64a40 40 0 0 1 80 0v62z' fill='${W}' stroke='${t}' stroke-width='6'/><g fill='${t}' opacity='.6'><path d='M272 46l6 12 12 2-9 8 2 12-11-6-11 6 2-12-9-8 12-2z'/></g>`;
    case 'keyhole': return `<path d='M240 126V82c-10-12-10-32 4-44 16-14 40-14 56 0 14 12 14 32 4 44v44z' fill='${W}' stroke='${t}' stroke-width='6'/><g fill='none' stroke='#F6D58A' stroke-width='2' opacity='.8'><path d='M272 52l8 8-8 8-8-8z'/></g>`;
    case 'kente': return `<rect x='212' y='30' width='120' height='92' fill='${sc.winFill[0]}' stroke='${t}' stroke-width='5'/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x='${212 + i * 20}' y='30' width='10' height='92' fill='${i % 2 ? '#F2C14E' : sc.winFill[1]}' opacity='.85'/>`).join('')}<rect x='212' y='66' width='120' height='12' fill='#1A1A1A' opacity='.7'/>`;
    case 'talavera': return `<g stroke='${t}' stroke-width='2'>${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x='${222 + c * 26}' y='${30 + r * 26}' width='26' height='26' fill='#FFFFFF'/><circle cx='${235 + c * 26}' cy='${43 + r * 26}' r='7' fill='${(r + c) % 2 ? '#1F7A8C' : '#E0A93B'}' stroke='none'/>`).join('')).join('')}</g>`;
    case 'shutters': return `<rect x='240' y='30' width='64' height='88' fill='${W}' stroke='${t}' stroke-width='5'/><rect x='214' y='30' width='26' height='88' fill='#FF6F59' stroke='${t}' stroke-width='3'/><rect x='304' y='30' width='26' height='88' fill='#FF6F59' stroke='${t}' stroke-width='3'/><g stroke='${t}' stroke-width='2' opacity='.6'>${[0, 1, 2, 3, 4, 5].map((i) => `<path d='M216 ${40 + i * 13}h22M306 ${40 + i * 13}h22'/>`).join('')}</g>`;
    case 'mountains': return `<rect x='220' y='28' width='104' height='92' rx='6' fill='${W}' stroke='${t}' stroke-width='6'/><path d='M222 118l30-44 18 22 22-36 30 58z' fill='#7A8F5A'/><path d='M282 60l10-16 10 16z' fill='#FFFFFF'/>`;
    case 'shelf': return `<rect x='212' y='60' width='130' height='8' rx='2' fill='${t}'/><rect x='212' y='106' width='130' height='8' rx='2' fill='${t}'/><g>${[0, 1, 2].map((i) => `<rect x='${222 + i * 40}' y='${26}' width='16' height='34' rx='6' fill='${['#3F7F25', '#B23A3A', '#6B4A2B'][i]}'/>`).join('')}${[0, 1, 2, 3].map((i) => `<circle cx='${226 + i * 30}' cy='96' r='10' fill='${['#E74C3C', '#F2C14E', '#E74C3C', '#8CC56B'][i]}'/>`).join('')}</g>`;
    case 'bluedoor': return `<path d='M236 126V62a36 36 0 0 1 72 0v64z' fill='${W}' stroke='#FFFFFF' stroke-width='6'/><path d='M272 26v100' stroke='#FFFFFF' stroke-width='3'/><circle cx='232' cy='34' r='14' fill='#B5D86A' opacity='.9'/>`;
    case 'awning': return `<g>${Array.from({ length: 10 }, (_, i) => `<path d='M${i * 40} 0h40v34q-10 10-20 0-10 10-20 0z' fill='${i % 2 ? sc.winFill[1] : sc.winFill[0]}'/>`).join('')}</g><rect x='226' y='54' width='96' height='66' rx='4' fill='#F4E2B8' stroke='${t}' stroke-width='5'/><text x='274' y='94' text-anchor='middle' font-family='Georgia,serif' font-style='italic' font-size='18' fill='${sc.wall[1]}'>bistro</text>`;
    case 'panel': return `<rect x='222' y='28' width='104' height='92' rx='4' fill='${W}' stroke='${t}' stroke-width='6'/><g stroke='${t}' stroke-width='4'><path d='M274 28v92M222 74h104'/></g>`;
    case 'plates': return `${[[232, 52, '#B23A3A'], [292, 46, '#2F6DB5'], [262, 100, '#3F7F25']].map(([x, y, c]) => `<circle cx='${x}' cy='${y}' r='24' fill='#FFFFFF' stroke='${c}' stroke-width='4'/><circle cx='${x}' cy='${y}' r='10' fill='none' stroke='${c}' stroke-width='3'/><path d='M${x - 6} ${y}h12M${x} ${y - 6}v12' stroke='${c}' stroke-width='2'/>`).join('')}`;
    case 'snow': return `<rect x='222' y='28' width='104' height='92' rx='4' fill='${W}' stroke='${t}' stroke-width='6'/><g stroke='${t}' stroke-width='4'><path d='M274 28v92M222 74h104'/></g><g fill='#FFFFFF'>${[[236, 44], [300, 50], [258, 92], [312, 102], [240, 108]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2.5'/>`).join('')}</g>`;
    case 'neon': return `<rect x='212' y='30' width='126' height='66' rx='14' fill='${W}'/><text x='275' y='72' text-anchor='middle' font-family='Arial Rounded MT Bold,Arial,sans-serif' font-weight='700' font-size='22' fill='#FF5FA2' stroke='#FFB3D1' stroke-width='.8'>EAT</text><rect x='212' y='30' width='126' height='66' rx='14' fill='none' stroke='#5FE0FF' stroke-width='3'/>`;
    case 'sea': return `<rect x='220' y='28' width='104' height='92' rx='6' fill='${W}' stroke='${t}' stroke-width='6'/><circle cx='298' cy='52' r='12' fill='#FFD166'/><path d='M222 96q13-8 26 0t26 0 26 0 26 0v24h-104z' fill='#5BC0BE'/>`;
    case 'suzani': return `<circle cx='272' cy='76' r='46' fill='${W}' stroke='${t}' stroke-width='5'/><circle cx='272' cy='76' r='22' fill='#C0392B' opacity='.8'/><circle cx='272' cy='76' r='9' fill='#F4D7A1'/>${[0, 1, 2, 3, 4, 5].map((i) => { const a = (i * Math.PI) / 3; return `<circle cx='${(272 + Math.cos(a) * 34).toFixed(1)}' cy='${(76 + Math.sin(a) * 34).toFixed(1)}' r='6' fill='#2F6B5E'/>`; }).join('')}`;
    default: return `<rect x='222' y='28' width='104' height='92' rx='6' fill='${W}' stroke='${t}' stroke-width='6'/><path d='M274 28v92M222 74h104' stroke='${t}' stroke-width='4'/>`;
  }
}
function garland(sc, src) {
  switch (sc.garland) {
    case 'lanterns': return `<path d='M0 8q100 22 200 8t200 8' fill='none' stroke='#3A1A12' stroke-width='2'/>${[60, 150, 340].map((x, i) => img(src, '1f3ee', x, 30 + (i % 2) * 6, 34)).join('')}`;
    case 'picado': return `<path d='M0 6q100 14 200 6t200 6' fill='none' stroke='#8a6' stroke-width='1.5'/>${Array.from({ length: 12 }, (_, i) => { const x = 8 + i * 33; return `<path d='M${x} 8h28l-2 26-12-6-12 6z' fill='${['#FF5FA2', '#5BC0BE', '#F2C14E', '#8E6CCF', '#FF7A45', '#4CB963'][i % 6]}' opacity='.9'/><circle cx='${x + 14}' cy='18' r='3' fill='#fff' opacity='.8'/>`; }).join('')}`;
    case 'bunting': return `<path d='M0 6q100 16 200 6t200 6' fill='none' stroke='#5a4' stroke-width='1.5'/>${Array.from({ length: 14 }, (_, i) => `<path d='M${6 + i * 29} 8h22l-11 18z' fill='${['#E74C3C', '#F2C14E', '#2F9E5B', '#3A7BD5'][i % 4]}'/>`).join('')}`;
    case 'lights': return `<path d='M0 10q100 22 200 10t200 10' fill='none' stroke='#2a2a2a' stroke-width='1.5'/>${Array.from({ length: 16 }, (_, i) => { const x = 12 + i * 25, y = 14 + Math.sin(i / 2) * 6; return `<circle cx='${x}' cy='${y}' r='4.5' fill='#FFE08A'/><circle cx='${x}' cy='${y}' r='9' fill='#FFE08A' opacity='.25'/>`; }).join('')}`;
    case 'marigold': return `${Array.from({ length: 22 }, (_, i) => { const x = 8 + i * 18, y = 10 + Math.sin((i / 21) * Math.PI) * 14; return `<circle cx='${x}' cy='${y}' r='7' fill='${i % 3 ? '#F59E0B' : '#F97316'}'/>`; }).join('')}`;
    case 'lamps': return `${[70, 150].map((x) => `<path d='M${x} 0v20' stroke='#C9A04B' stroke-width='1.5'/><path d='M${x - 12} 22h24l-4 22h-16z' fill='#D9A441' stroke='#8A6420'/><path d='M${x - 6} 26l3 14M${x + 6} 26l-3 14' stroke='#FFE9A8' stroke-width='2'/>`).join('')}`;
    case 'textile': return `<rect x='0' y='0' width='400' height='16' fill='#A2412A'/>${Array.from({ length: 20 }, (_, i) => `<path d='M${i * 20} 16l10-10 10 10' fill='none' stroke='#F2C14E' stroke-width='2'/>`).join('')}<rect x='0' y='16' width='400' height='4' fill='#2F6B5E'/>`;
    case 'herbs': return `<path d='M0 4h400' stroke='#6B4A2B' stroke-width='3'/>${[48, 120, 160].map((x) => img(src, '1f33f', x, 26, 30, 180)).join('')}${img(src, '1f9c4', 84, 30, 26)}`;
    default: return '';
  }
}
function table(sc) {
  const [a, b] = sc.table;
  let top = `<rect x='0' y='150' width='400' height='50' fill='${a}'/><rect x='0' y='150' width='400' height='4' fill='#FFFFFF' opacity='.18'/><rect x='0' y='180' width='400' height='20' fill='${b}'/>`;
  if (sc.cloth === 'check') top += `<g fill='#C0392B' opacity='.75'>${Array.from({ length: 20 }, (_, i) => `<rect x='${i * 20}' y='150' width='10' height='30'/>`).join('')}${Array.from({ length: 3 }, (_, j) => `<rect x='0' y='${150 + j * 10}' width='400' height='5' opacity='.5'/>`).join('')}</g>`;
  if (sc.cloth === 'stitch') top += `<g fill='#B23A3A'>${Array.from({ length: 40 }, (_, i) => `<path d='M${i * 10 + 5} 172l3 3-3 3-3-3z'/>`).join('')}</g>`;
  if (sc.cloth === 'chrome') top += `<rect x='0' y='176' width='400' height='6' fill='#D9DEE5'/><g>${Array.from({ length: 20 }, (_, i) => `<rect x='${i * 20}' y='182' width='10' height='9' fill='#111'/><rect x='${i * 20 + 10}' y='191' width='10' height='9' fill='#111'/>`).join('')}</g>`;
  return top;
}

// → an SVG string (400×200, drawn to fill its box). Text that names the place goes in the caller's own label.
export function sceneSvg({ iso, cuisine, title }, src) {
  const key = motifFor(iso, cuisine); const sc = SCENES[key] || SCENES.dots; const k = key;
  const dish = dishEmoji(title, sc.dish);
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200' preserveAspectRatio='xMidYMid slice' role='img' aria-label='${sc.name}'>
<defs>${g('a' + k, sc.wall[0], sc.wall[1])}${g('w' + k, sc.winFill[0], sc.winFill[1])}<radialGradient id='l${k}' cx='.5' cy='.35' r='.7'><stop offset='0' stop-color='#FFF6D8' stop-opacity='.35'/><stop offset='1' stop-color='#FFF6D8' stop-opacity='0'/></radialGradient></defs>
<rect width='400' height='200' fill='url(#a${k})'/><rect width='400' height='200' fill='url(#l${k})'/>
${windowShape(sc, k)}${garland(sc, src)}
${sc.wall_.map(([c, x, y, s, r]) => img(src, c, x, y, s, r)).join('')}
${table(sc)}
<ellipse cx='200' cy='176' rx='74' ry='13' fill='#000' opacity='.18'/><ellipse cx='200' cy='170' rx='70' ry='14' fill='#FFFFFF'/><ellipse cx='200' cy='170' rx='54' ry='9' fill='#F1EEE8'/>
${img(src, dish, 200, 142, 76)}
${sc.props.map(([c, x, s]) => img(src, c, x, 160, s)).join('')}
</svg>`;
}
export const sceneName = (iso, cuisine) => (SCENES[motifFor(iso, cuisine)] || SCENES.dots).name;
// Every Twemoji file a scene can use (copied to public/tw by scripts/copy-twemoji.cjs).
export const SCENE_EMOJI = [...new Set([...DISH.map((d) => d[1]), ...Object.values(SCENES).flatMap((s) => [s.dish, ...s.wall_.map((w) => w[0]), ...s.props.map((p) => p[0])]), '1f3ee', '1f33f', '1f9c4'])];
