// Hand-built postcard scenes that need real streets, real shapes and real animals: Lima's clifftop, a Norwegian fjord
// village, Monaco's harbour. Same rules as lib/art/vista.js: far things small and pale, near things big with an outline.
// Plain strings, shared by the app and Whisk Play.
import { V, INK, O, o, hz, tx, lerp, range, land, water, foam, fog, ribbon, line, pine, palm, tree, house, block, boat, frontShore, birds, hills } from './vista.js';

// a paraglider: canopy, lines, and a small person hanging under it
const glider = (x, y, s = 1) => tx(x, y, s, `<path d='M${x - 20} ${y}q20-16 40 0q-20 5-40 0z' fill='#E8735A' ${o}/><path d='M${x - 20} ${y}l20 20M${x + 20} ${y}l-20 20M${x} ${y + 1}v19' stroke='${INK}' stroke-width='.9' fill='none'/><circle cx='${x}' cy='${y + 22}' r='2.4' fill='#F2C14E' ${o}/><path d='M${x} ${y + 24.5}v6' stroke='${INK}' stroke-width='2.4' stroke-linecap='round'/>`);
const lamp = (x, y, s = 1) => tx(x, y, s, `<path d='M${x} ${y}v-22' stroke='${INK}' stroke-width='2.4' stroke-linecap='round'/><circle cx='${x}' cy='${y - 24}' r='3.4' fill='#FFE08A' ${o}/>`);

// Lima: apartment blocks and a road along the top of the sea cliff, palms, the beach below, paragliders over the water
export const limaCoastV = V((c) => {
  const H = 116;
  const blocks = line([196, 96], [406, 92], 8, 1, 0.5, (x, y, s, i) => tx(x, y, s, `${block(x, y, 24, 36 + (i % 3) * 9, ['#F2E6D0', '#E8DCC2', '#F4D2D9', '#D8E8F0'][i % 4])}<rect x='${x - 12}' y='${y - 36 - (i % 3) * 9}' width='24' height='3' fill='#B8A688'/>`), 0.9);
  return `${water(c, H, 200, '#4F98B6')}
<path d='M168 200L174 100Q196 94 240 94L420 90V200z' fill='#C9B48A' ${O}/><path d='M180 120q30 6 60 2t80 6M178 150q40 6 90 2' fill='none' stroke='#A9946A' stroke-width='1.6'/>
<path d='M174 100Q196 94 240 94L420 90V98L240 102Q196 104 174 108z' fill='#8E8A86' ${O}/><path d='M186 103Q230 99 420 95' stroke='#F6EEDF' stroke-width='1.6' stroke-dasharray='6 5' fill='none'/>
${blocks}${palm(214, 98, 0.62)}${palm(330, 96, 0.55, -1)}${lamp(262, 99, 0.8)}${lamp(372, 96, 0.7)}
${frontShore(c, '#E9D8AE', 158)}${line([60, 168], [140, 156], 3, 1, 0.8, (x, y, s) => tx(x, y, s, `<path d='M${x} ${y}v-14' stroke='${INK}' stroke-width='1.6'/><path d='M${x - 10} ${y - 14}q10-10 20 0z' fill='#E8735A' ${o}/>`))}
${glider(86, 52, 1.1)}${glider(140, 40, 0.75)}${birds([[40, 70]])}`;
});

// A Norwegian fjord village: steep walls with a waterfall, a road along the shore with red and yellow houses, fishermen's
// cabins on stilts over the water, a little pier and boats
export const fjordV = V((c) => {
  const H = 124;
  const hut = (x, y, s, wall) => tx(x, y, s, `<path d='M${x - 14} ${y}v8M${x - 6} ${y}v8M${x + 6} ${y}v8M${x + 14} ${y}v8' stroke='#6B4A2B' stroke-width='2.4'/>${house(x, y, 30, 18, wall, '#3A3A3A')}<path d='M${x - 18} ${y + 3}h36' stroke='#8A5A34' stroke-width='3'/>`);
  const cottage = (x, y, s, i) => tx(x, y, s, `${house(x, y, 26, 20, ['#B5302B', '#F2C14E', '#F6EEDF', '#B5302B', '#86B7D9'][i % 5], '#3A3A3A')}<rect x='${x - 3}' y='${y - 8}' width='6' height='8' fill='#6B4A2B'/><rect x='${x - 10}' y='${y - 15}' width='5' height='5' fill='#FFF3C4' ${o}/>`);
  return `${range(c, H, [[210, 78, 70]], '#B7C4D8', 0.5)}<path d='M-20 ${H}V30q40 6 80 40t90 54z' fill='${hz(c, '#6E7E98', 0.15)}' ${O}/><path d='M420 ${H}V36q-40 4-80 36t-90 52z' fill='${hz(c, '#7E8EA8', 0.15)}' ${O}/><path d='M-20 30q40 6 60 20M420 36q-40 4-60 22' fill='none' stroke='#FFFFFF' stroke-width='6'/>
<path d='M386 52v66' stroke='#FFFFFF' stroke-width='5' stroke-linecap='round'/><path d='M378 70v40M394 66v44' stroke='#D6F0FA' stroke-width='2' stroke-linecap='round'/>${fog([[386, 120, 22, 4]])}
${water(c, H, 200, '#4F9AB0')}
${line([-8, 134], [150, 124], 6, 1.2, 0.5, (x, y, s) => pine(x, y, s, '#2F5E3A'))}
<path d='M-20 150Q70 134 150 136Q190 140 214 152V200H-20z' fill='#6F9A5A' ${O}/>
${line([10, 150], [152, 130], 5, 1.25, 0.55, cottage)}
${ribbon([[0, 214, 70], [60, 180, 48], [112, 156, 30], [160, 146, 18], [206, 142, 7]], '#9A948C', false)}<path d='M6 196Q80 168 130 154T206 143' fill='none' stroke='#F6EEDF' stroke-width='1.6' stroke-dasharray='7 6'/>
${hut(238, 144, 1, '#B5302B')}${hut(276, 140, 0.85, '#F2C14E')}<path d='M204 140h40' stroke='#8A5A34' stroke-width='4'/>
${boat(318, 150, 1, '#E8735A')}${boat(362, 140, 0.7, '#2F6DB5')}${lamp(84, 176, 0.9)}${lamp(170, 146, 0.7)}${birds([[300, 50], [320, 44, 0.8]])}
${frontShore(c, '#7E8A6A', 164)}`;
});

// Monaco: a crowded hillside of peach and cream apartment blocks with a palace on the rock, a winding road, and the harbour full of yachts
export const harborV = V((c) => {
  const H = 112;
  const yacht = (x, y, s) => tx(x, y, s, `<path d='M${x - 30} ${y}h60l-10 11h-44z' fill='#FFFFFF' ${O}/><path d='M${x - 18} ${y}v-8h30l8 8z' fill='#F6EEDF' ${O}/><path d='M${x - 8} ${y - 15}h20l5 7h-30z' fill='#FFFFFF' ${O}/><g fill='#6FA8C8'>${[-14, -6, 2, 10].map((d) => `<rect x='${x + d}' y='${y - 6}' width='5' height='3'/>`).join('')}</g><path d='M${x + 2} ${y - 15}v-9' stroke='${INK}' stroke-width='1.6'/><path d='M${x + 2} ${y - 24}l7 2-7 2z' fill='#E74C3C'/><path d='M${x - 28} ${y + 4}h56' stroke='#2F6DB5' stroke-width='2'/>`);
  const tier = (r) => { const y = 98 + r * 14, wall = ['#F6D9B8', '#F2E6D0', '#F4C6A8', '#EAD3B0'], roof = ['#C0503A', '#B5452E'];
    return Array.from({ length: 9 }, (_, i) => { const x = 8 + r * 4 + i * 22 + (r % 2) * 7, h = 20 + ((i * 7 + r * 5) % 4) * 4; return `${block(x, y + 12, 21, h, wall[(i + r) % 4])}<path d='M${x - 11.5} ${y + 12 - h}h23l-3-5h-17z' fill='${roof[(i + r) % 2]}' ${o}/>`; }).join(''); };
  return `${range(c, H, [[80, 50, 110], [300, 62, 130]], '#B7C4D8', 0.5)}
${water(c, H + 2, 200, '#4FA9D6')}
<path d='M-20 160L-20 84Q50 62 130 76Q196 92 222 ${H + 4}L222 160z' fill='#C9B8A0' ${O}/>
<g>${[0, 1, 2, 3].map(tier).join('')}</g>
<path d='M30 74h92v-12l-8-4v-8h-8v8H78v-14h-8v14H48v-8h-8v8l-10 4z' fill='#F2E0C0' ${O}/><rect x='54' y='66' width='12' height='8' fill='#C0503A' ${o}/><path d='M96 54v-12l12 4-12 4' fill='#E74C3C' ${o}/>
<path d='M-20 150Q50 142 96 130T222 ${H + 14}' fill='none' stroke='#8E8A86' stroke-width='6' stroke-linecap='round'/><path d='M-20 150Q50 142 96 130T222 ${H + 14}' fill='none' stroke='#F6EEDF' stroke-width='1.4' stroke-dasharray='6 5'/>
<g transform='translate(70 135)'><rect x='-9' y='-7' width='18' height='6' rx='3' fill='#E74C3C' ${o}/><rect x='-5' y='-11' width='10' height='5' rx='2' fill='#BFE3F5' ${o}/><circle cx='-5' cy='-1' r='2.4' fill='${INK}'/><circle cx='5' cy='-1' r='2.4' fill='${INK}'/></g>
${line([392, 154], [250, H + 10], 4, 1.1, 0.45, (x, y, s, i) => (i % 2 ? boat(x, y, s * 0.9, '#2F6DB5') : yacht(x, y, s)))}
${frontShore(c, '#E4D6B8', 150)}<path d='M-20 168Q120 152 420 150' stroke='#BFB093' stroke-width='3' fill='none'/>${palm(40, 160, 0.8)}${palm(342, 152, 0.7, -1)}${lamp(150, 158, 0.9)}${lamp(300, 152, 0.8)}${birds([[300, 50]])}`;
});
