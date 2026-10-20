// Regional postcards, batch 3: the other countries. Each country gets 2-3 places drawn from a shared set of landscape
// scenes (mountains, coast, desert, old town, highlands …). A dish picks its place by what it is (seafood → the coast,
// pastry/street food → the city, stews and meat → the countryside); anything else rotates between the country's places
// so a country's postcards aren't all the same. Same drawing rules as lib/regions.js.
import { O, o, at, map, pine, cypress, palm, bush, mtn, hill, boat, house, cube, rows, R } from './regions.js';
import { tower, dome, wave, cow, dune } from './regions2.js';

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
const savanna = (x) => at(x, `${dune('#E8C070')}<g transform='translate(-50 150)'><path d='M0 0q-6-30 0-52M0-52q-26-6-34 8M0-52q26-6 34 8' stroke='#6B4A2B' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M-34-44q34-24 68 0-18 6-34 4t-34-4z' fill='#6E8F3E' ${O}/></g><g transform='translate(36 150) scale(1.1)'><path d='M-10-18h22v-6l8-26 8 4-6 24v24h-6v-14h-18v14h-8z' fill='#E2B33E' ${O}/><circle cx='-2' cy='-12' r='1.6' fill='#8A5A34'/><circle cx='6' cy='-8' r='1.6' fill='#8A5A34'/></g>`);
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

const SC = { skyline, oldTown, windmills, fjord, volcano, castle, mosqueScene, stupa, beach, jungle, savanna, desertScene, terraces, plains, lakeMtn, vineyard, snowForest, islandHut, canal, mesa, steppe };
// [scene, place name, sky, ground, sea?, buddy]
const P = (k, name, skyK, ground, sea, buddy) => [...R(SC[k], skyK, ground, sea, buddy, name), k];

export const COUNTRY_PLACES = {
  AD: [P('lakeMtn', 'the Pyrenees', 'day', 'green', false, 'cheese'), P('oldTown', 'Andorra la Vella', 'warm', 'stone', false, 'bread')],
  AE: [P('skyline', 'Dubai', 'sand', 'sand', true, 'camel'), P('desertScene', 'the desert', 'sand', 'sand', false, 'camel'), P('mosqueScene', 'Abu Dhabi', 'warm', 'stone', false, 'teapot')],
  AF: [P('mesa', 'the Hindu Kush', 'warm', 'sand', false, 'naan'), P('mosqueScene', 'Herat', 'sand', 'dry', false, 'teapot'), P('lakeMtn', 'Band-e Amir', 'day', 'dry', false, 'naan')],
  AG: [P('beach', 'Antigua', 'day', 'beach', true, 'palm'), P('islandHut', 'Nelson’s Dockyard', 'day', 'beach', true, 'pineapple')],
  AL: [P('lakeMtn', 'the Albanian Alps', 'day', 'green', false, 'olive'), P('beach', 'the Riviera', 'day', 'beach', true, 'olive'), P('oldTown', 'Berat', 'warm', 'stone', false, 'bread')],
  AM: [P('mesa', 'Mount Ararat', 'warm', 'dry', false, 'bread'), P('oldTown', 'Yerevan', 'warm', 'stone', false, 'naan'), P('lakeMtn', 'Lake Sevan', 'day', 'green', false, 'bread')],
  AO: [P('beach', 'Luanda coast', 'warm', 'beach', true, 'palm'), P('savanna', 'the highlands', 'warm', 'dry', false, 'banana'), P('skyline', 'Luanda', 'dusk', 'stone', true, 'palm')],
  AT: [P('lakeMtn', 'the Tyrol', 'day', 'green', false, 'cheese'), P('castle', 'Salzburg', 'warm', 'green', false, 'coffee'), P('oldTown', 'Vienna', 'dusk', 'stone', false, 'coffee')],
  AZ: [P('skyline', 'Baku', 'dusk', 'stone', true, 'teapot'), P('mesa', 'the Caucasus', 'warm', 'dry', false, 'naan'), P('mosqueScene', 'Sheki', 'warm', 'stone', false, 'teapot')],
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
  BO: [P('mesa', 'Uyuni salt flats', 'day', 'snow', false, 'chili'), P('lakeMtn', 'Lake Titicaca', 'day', 'green', false, 'corn'), P('oldTown', 'La Paz', 'dusk', 'stone', false, 'corn')],
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
  ER: [P('beach', 'Massawa', 'day', 'beach', true, 'palm'), P('oldTown', 'Asmara', 'warm', 'stone', false, 'jebena'), P('mesa', 'the highlands', 'warm', 'dry', false, 'jebena')],
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
  MC: [P('skyline', 'Monte Carlo', 'dusk', 'stone', true, 'lemon'), P('castle', 'the palace', 'day', 'stone', true, 'lemon')],
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
  YE: [P('oldTown', 'Sana’a', 'warm', 'sand', false, 'coffee'), P('mesa', 'the mountains', 'warm', 'red', false, 'coffee'), P('islandHut', 'Socotra', 'day', 'beach', true, 'palm')],
  ZM: [P('canal', 'Victoria Falls', 'day', 'lush', false, 'corn'), P('savanna', 'South Luangwa', 'warm', 'dry', false, 'elephant')],
  ZW: [P('canal', 'Victoria Falls', 'day', 'lush', false, 'corn'), P('savanna', 'Hwange', 'warm', 'dry', false, 'elephant'), P('mesa', 'Great Zimbabwe', 'warm', 'red', false, 'corn')]
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
