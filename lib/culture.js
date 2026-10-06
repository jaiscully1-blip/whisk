// A soft cultural backdrop for a dish or recipe, from its country: a traditional pattern from that part of the world
// (cloud scrolls for China, seigaiha waves for Japan, zellige stars for North Africa, papel picado for Mexico …)
// laid very faintly over a light wash, strongest at the top and fading out, so the words on top stay easy to read.
// Pure data + strings: shared by the app and Whisk Play. Patterns are small SVG tiles drawn here (no images to load).

const svg = (w, h, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

// Each motif: [pattern(color a, color b), tile size, light wash [top, bottom], dark wash [top, bottom], two pattern colors]
const MOTIFS = {
  clouds: [(a, b) => svg(72, 56, `<g fill='none' stroke='${a}' stroke-width='2.2' stroke-linecap='round'><path d='M8 34c0-7 8-10 13-5 2-8 14-9 17-1 6-3 12 2 9 8M14 40h33'/><path d='M22 26c-3-4 2-8 5-4'/></g><g fill='none' stroke='${b}' stroke-width='1.6'><path d='M44 14c3 0 5 2 4 5-1 2-4 2-4 0'/></g>`), 72, ['#FFF4E6', '#FDEBDD'], ['#2E2320', '#271D1A'], ['rgba(196,48,43,.22)', 'rgba(212,160,23,.32)']],
  seigaiha: [(a) => svg(48, 24, `<g fill='none' stroke='${a}' stroke-width='1.5'>${[0, 48].map((x) => [22, 15, 8].map((r) => `<path d='M${x - r} 24a${r} ${r} 0 0 1 ${2 * r} 0'/>`).join('')).join('')}${[22, 15, 8].map((r) => `<path d='M${24 - r} 12a${r} ${r} 0 0 1 ${2 * r} 0'/>`).join('')}</g>`), 48, ['#EEF3FA', '#E4ECF6'], ['#1E2532', '#19202B'], ['rgba(38,70,140,.20)']],
  bojagi: [(a, b) => svg(60, 60, `<g stroke='rgba(120,100,90,.18)' stroke-width='1'><rect x='1' y='1' width='26' height='18' fill='${a}'/><rect x='28' y='1' width='31' height='30' fill='${b}'/><rect x='1' y='20' width='26' height='39' fill='${b}'/><rect x='28' y='32' width='14' height='27' fill='${a}'/><rect x='43' y='32' width='16' height='27' fill='rgba(80,150,120,.12)'/></g>`), 60, ['#FBF6EF', '#F6EEE6'], ['#2A2424', '#231E1E'], ['rgba(220,90,110,.12)', 'rgba(70,120,190,.10)']],
  lotus: [(a, b) => svg(64, 64, `<g fill='none' stroke='${a}' stroke-width='1.6'><path d='M32 44c-6-6-6-14 0-22 6 8 6 16 0 22z'/><path d='M32 44c-10-2-15-8-16-16 9 1 14 7 16 16zM32 44c10-2 15-8 16-16-9 1-14 7-16 16z'/></g><path d='M20 48h24' stroke='${b}' stroke-width='1.6'/>`), 64, ['#F0F8F4', '#E6F3EE'], ['#1D2A26', '#18231F'], ['rgba(20,130,110,.20)', 'rgba(200,150,40,.28)']],
  mandala: [(a, b) => svg(56, 56, `<g fill='none' stroke='${a}' stroke-width='1.4'><circle cx='28' cy='28' r='10'/><circle cx='28' cy='28' r='4'/>${Array.from({ length: 8 }, (_, i) => { const t = (i * Math.PI) / 4, x = 28 + Math.cos(t) * 16, y = 28 + Math.sin(t) * 16; return `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='3'/>`; }).join('')}</g><g fill='${b}'><circle cx='0' cy='0' r='2.5'/><circle cx='56' cy='0' r='2.5'/><circle cx='0' cy='56' r='2.5'/><circle cx='56' cy='56' r='2.5'/></g>`), 56, ['#FFF6EA', '#FCEDE6'], ['#2E2620', '#28201B'], ['rgba(214,90,40,.22)', 'rgba(170,40,110,.22)']],
  khatam: [(a, b) => svg(56, 56, `<g fill='none' stroke='${a}' stroke-width='1.6'><rect x='16' y='16' width='24' height='24'/><rect x='16' y='16' width='24' height='24' transform='rotate(45 28 28)'/></g><circle cx='28' cy='28' r='4' fill='${b}'/><g stroke='${a}' stroke-width='1.2'><path d='M0 28h7M49 28h7M28 0v7M28 49v7'/></g>`), 56, ['#F2F6F4', '#F6F0E6'], ['#1E2826', '#25221C'], ['rgba(25,120,130,.22)', 'rgba(190,140,60,.25)']],
  zellige: [(a, b) => svg(48, 48, `<g fill='${a}'><path d='M24 6l5 13 13 5-13 5-5 13-5-13-13-5 13-5z'/></g><g fill='${b}'><path d='M0 0l6 6-6 6zM48 0l-6 6 6 6zM0 48l6-6-6-6zM48 48l-6-6 6-6z'/></g>`), 48, ['#FBF1EA', '#F3EEE4'], ['#2C2220', '#26201C'], ['rgba(190,80,50,.16)', 'rgba(30,110,120,.18)']],
  kente: [(a, b) => svg(48, 48, `<rect width='48' height='10' fill='${a}'/><rect y='24' width='48' height='10' fill='${b}'/><g fill='rgba(40,120,60,.12)'><rect x='8' y='10' width='8' height='14'/><rect x='32' y='34' width='8' height='14'/></g>`), 48, ['#FFF7E8', '#FBF1E1'], ['#2A2519', '#242015'], ['rgba(220,160,30,.18)', 'rgba(180,60,40,.13)']],
  picado: [(a, b) => svg(84, 52, `<path d='M0 8q21 6 42 0t42 0' fill='none' stroke='rgba(120,90,80,.25)' stroke-width='1'/><path d='M6 9h18l-9 18z' fill='${a}'/><path d='M30 9h18l-9 18z' fill='${b}'/><path d='M54 9h18l-9 18z' fill='${a}'/><g fill='#fff' fill-opacity='.7'><circle cx='15' cy='14' r='2'/><circle cx='39' cy='14' r='2'/><circle cx='63' cy='14' r='2'/></g>`), 84, ['#FFF2F5', '#F3F8F3'], ['#2C2128', '#1F2822'], ['rgba(230,60,130,.18)', 'rgba(30,160,150,.18)']],
  palms: [(a) => svg(64, 64, `<g fill='none' stroke='${a}' stroke-width='1.6' stroke-linecap='round'><path d='M10 54C22 40 34 30 52 22'/>${[0, 1, 2, 3].map((i) => { const x = 16 + i * 9, y = 47 - i * 7; return `<path d='M${x} ${y}c-4-8-2-14 2-18M${x} ${y}c8-2 14 0 17 4'/>`; }).join('')}</g>`), 64, ['#EFF8F1', '#F2F9EE'], ['#1C2A21', '#1A261D'], ['rgba(40,140,80,.22)']],
  andean: [(a, b) => svg(48, 48, `<path d='M0 36h8v-8h8v-8h8v-8h8v8h8v8h8v8h0' fill='none' stroke='${a}' stroke-width='2'/><g fill='${b}'><rect x='22' y='16' width='4' height='4'/></g>`), 48, ['#FBF2EA', '#F6EDE4'], ['#2B231E', '#25201B'], ['rgba(180,80,40,.20)', 'rgba(60,110,150,.22)']],
  majolica: [(a, b) => svg(48, 48, `<g fill='none' stroke='${a}' stroke-width='1.6'><path d='M24 6c6 0 6 9 0 12 6-3 12 3 6 9 6-3 6 6 0 9 6 0 6 9 0 6'/><circle cx='24' cy='24' r='16'/></g><circle cx='24' cy='24' r='3' fill='${b}'/><g stroke='${a}' stroke-width='1'><path d='M0 0l8 8M48 0l-8 8M0 48l8-8M48 48l-8-8'/></g>`), 48, ['#F2F6FB', '#FBF7EC'], ['#1E232B', '#26231C'], ['rgba(30,80,160,.18)', 'rgba(220,160,40,.30)']],
  meander: [(a) => svg(40, 40, `<path d='M0 34h32V6H10v20h14V14h-6v6' fill='none' stroke='${a}' stroke-width='2' stroke-linejoin='miter'/>`), 40, ['#F1F5FB', '#EDF2FA'], ['#1D222C', '#191E28'], ['rgba(30,80,170,.17)']],
  gingham: [(a, b) => svg(32, 32, `<rect width='16' height='32' fill='${a}'/><rect width='32' height='16' fill='${a}'/><rect width='16' height='16' fill='${b}'/>`), 32, ['#FFF7F6', '#FBF3F2'], ['#2B2222', '#251E1E'], ['rgba(200,50,50,.06)', 'rgba(200,50,50,.08)']],
  tartan: [(a, b) => svg(48, 48, `<rect x='10' width='10' height='48' fill='${a}'/><rect y='10' width='48' height='10' fill='${a}'/><rect x='32' width='3' height='48' fill='${b}'/><rect y='32' width='48' height='3' fill='${b}'/>`), 48, ['#F3F6F1', '#F6F3EE'], ['#1F241F', '#24211C'], ['rgba(30,90,60,.10)', 'rgba(170,40,40,.14)']],
  folk: [(a, b) => svg(48, 48, `<g fill='${a}'>${[[24, 14], [18, 20], [30, 20], [24, 26], [24, 20]].map(([x, y]) => `<rect x='${x - 2}' y='${y - 2}' width='4' height='4'/>`).join('')}</g><g fill='${b}'><rect x='22' y='30' width='4' height='10'/><rect x='16' y='34' width='4' height='4'/><rect x='28' y='34' width='4' height='4'/></g>`), 48, ['#FFF6F3', '#FBF4EE'], ['#2C2222', '#261E1D'], ['rgba(200,40,50,.22)', 'rgba(60,120,60,.20)']],
  nordic: [(a) => svg(48, 48, `<g fill='${a}'>${[0, 1, 2, 3].map((i) => `<path d='M24 24l-3-11 3-5 3 5z' transform='rotate(${i * 90} 24 24)'/><path d='M24 24l-9-3-2-4 6 0z' transform='rotate(${i * 90} 24 24)'/>`).join('')}</g>`), 48, ['#F1F4F9', '#EEF2F8'], ['#1D212A', '#1A1E26'], ['rgba(40,70,130,.18)']],
  quilt: [(a, b) => svg(56, 56, `<path d='M28 8l5 13h13l-10 9 4 14-12-8-12 8 4-14-10-9h13z' fill='none' stroke='${a}' stroke-width='1.6'/><circle cx='0' cy='0' r='3' fill='${b}'/><circle cx='56' cy='56' r='3' fill='${b}'/><circle cx='56' cy='0' r='3' fill='${b}'/><circle cx='0' cy='56' r='3' fill='${b}'/>`), 56, ['#F3F6FB', '#FBF4F2'], ['#1E222A', '#282021'], ['rgba(40,70,140,.18)', 'rgba(200,60,60,.22)']],
  tapa: [(a, b) => svg(40, 40, `<path d='M0 20l10-10 10 10 10-10 10 10' fill='none' stroke='${a}' stroke-width='1.8'/><g fill='${b}'><path d='M10 30l4 6h-8z'/><path d='M30 30l4 6h-8z'/></g>`), 40, ['#FBF4EC', '#F6EFE7'], ['#2B241E', '#251F1A'], ['rgba(120,70,40,.22)', 'rgba(120,70,40,.16)']],
  suzani: [(a, b) => svg(56, 56, `<circle cx='28' cy='28' r='13' fill='none' stroke='${a}' stroke-width='2'/><circle cx='28' cy='28' r='6' fill='${b}'/><g fill='none' stroke='${a}' stroke-width='1.2'><path d='M28 15c4-6 10-6 12-2M28 41c-4 6-10 6-12 2'/></g>`), 56, ['#FFF5F1', '#FAF1EC'], ['#2C2220', '#261E1C'], ['rgba(190,50,60,.20)', 'rgba(220,140,40,.22)']],
  dots: [(a) => svg(28, 28, `<circle cx='14' cy='14' r='2' fill='${a}'/>`), 28, ['#F3F8EE', '#EEF5E8'], ['#1F261C', '#1B2219'], ['rgba(78,154,47,.20)']]
};

const REGION = {
  clouds: 'CN', seigaiha: 'JP', bojagi: 'KR KP MN',
  lotus: 'TH VN LA KH MM MY SG ID PH BN TL',
  mandala: 'IN PK BD LK NP BT MV',
  khatam: 'IR IQ SY LB JO IL SA AE QA KW BH OM YE TR AF AZ AM GE',
  zellige: 'MA DZ TN LY EG MR',
  kente: 'GH NG CI SN ML BF NE GM GN GW SL LR TG BJ CM CF TD GA CG CD GQ ST AO ET ER DJ SO KE UG TZ RW BI SS SD MW ZM ZW MZ MG MU SC KM CV ZA NA BW LS SZ',
  picado: 'MX GT HN SV NI CR PA BZ',
  palms: 'CU JM HT DO BS BB TT GD LC VC KN AG DM BR GY SR',
  andean: 'PE BO EC CO VE CL AR UY PY',
  majolica: 'IT ES PT MT SM MC AD HR SI',
  meander: 'GR CY AL MK ME',
  gingham: 'FR BE LU CH NL DE AT LI',
  tartan: 'GB IE',
  folk: 'PL UA RU BY CZ SK HU RO BG MD RS BA LT LV EE',
  nordic: 'NO SE FI DK IS',
  quilt: 'US CA',
  tapa: 'AU NZ FJ PG WS TO VU SB KI TV NR PW FM MH',
  suzani: 'KZ UZ KG TJ TM'
};
const BY_ISO = {}; Object.entries(REGION).forEach(([m, list]) => list.split(' ').forEach((iso) => (BY_ISO[iso] = m)));
// Recipe cuisines without a country (or a broad one) still get the right look.
const BY_CUISINE = { mediterranean: 'majolica', 'middle eastern': 'khatam', caribbean: 'palms', cajun: 'quilt', southern: 'quilt', american: 'quilt', british: 'tartan', french: 'gingham', greek: 'meander', italian: 'majolica', spanish: 'majolica', mexican: 'picado', brazilian: 'palms', ethiopian: 'kente', indian: 'mandala', chinese: 'clouds', japanese: 'seigaiha', korean: 'bojagi', thai: 'lotus', vietnamese: 'lotus' };

export function motifFor(iso, cuisine) {
  const c = String(cuisine || '').toLowerCase().split('·')[0].trim();
  return (iso && BY_ISO[String(iso).toUpperCase()]) || BY_CUISINE[c] || 'dots';
}

// → a style object (CSS custom properties) for the .cx class. Both washes are given; the theme picks one in CSS.
export function cultureStyle(iso, cuisine) {
  const key = motifFor(iso, cuisine); const [pat, size, light, dark, cols] = MOTIFS[key];
  return { '--cx-wash': `linear-gradient(180deg, ${light[0]}, ${light[1]})`, '--cx-wash-d': `linear-gradient(180deg, ${dark[0]}, ${dark[1]})`, '--cx-pat': pat(cols[0], cols[1] || cols[0]), '--cx-size': `${size}px` };
}
export const CULTURE_MOTIFS = Object.keys(MOTIFS);
