// A finished country on the globe (5 dishes cooked) is filled in with its own art: the team colours it wears at the
// Olympics (its flag colours), its best-known dish, staple foods and, where Whisk has one, a buddy from there.
// Drawn into a 200×200 box; the globe stretches it over the country's shape and clips it to the borders.
import { COUNTRIES, COUNTRY_BY_ISO } from '../passport/countries.js';
import { foodDrawing } from '../art/food.js';
import { dishArt } from '../art/dish.js';
import { scenery } from '../art/scenery.js';
import { landmarkFor } from '../landmarks.js';

// Olympic team colours (= flag colours), main colour first
const F = `AF:#000000,#D32011,#007A36 AL:#E41E20,#000000 DZ:#006233,#FFFFFF,#D21034 AD:#10069F,#FEDF00,#D50032 AO:#CC092F,#000000,#FFCB00
AG:#CE1126,#000000,#0072C6,#FCD116 AR:#74ACDF,#FFFFFF,#F6B40E AM:#D90012,#0033A0,#F2A800 AU:#00843D,#FFCD00 AT:#ED2939,#FFFFFF AZ:#0092BC,#E4002B,#00AF66
BS:#00ABC9,#FFC72C,#000000 BH:#CE1126,#FFFFFF BD:#006A4E,#F42A41 BB:#00267F,#FFC726,#000000 BY:#C8313E,#4AA657,#FFFFFF BE:#000000,#FAE042,#ED2939
BZ:#003F87,#CE1126,#FFFFFF BJ:#008751,#FCD116,#E8112D BT:#FFD520,#FF4E12,#FFFFFF BO:#D52B1E,#F9E300,#007934 BA:#002395,#FECB00,#FFFFFF BW:#75AADB,#000000,#FFFFFF
BR:#009C3B,#FFDF00,#002776 BN:#F7E017,#000000,#FFFFFF BG:#00966E,#FFFFFF,#D62612 BF:#EF2B2D,#009E49,#FCD116 BI:#CE1126,#1EB53A,#FFFFFF CV:#003893,#FFFFFF,#CF2027
KH:#032EA1,#E00025,#FFFFFF CM:#007A5E,#CE1126,#FCD116 CA:#FF0000,#FFFFFF CF:#003082,#289728,#FFCE00,#D21034 TD:#002664,#FECB00,#C60C30 CL:#D52B1E,#0039A6,#FFFFFF
CN:#DE2910,#FFDE00 CO:#FCD116,#003893,#CE1126 KM:#3A75C4,#FFC61E,#CE1126 CG:#009543,#FBDE4A,#DC241F CD:#007FFF,#F7D618,#CE1021 CR:#002B7F,#FFFFFF,#CE1126
CI:#F77F00,#FFFFFF,#009E60 HR:#FF0000,#FFFFFF,#171796 CU:#002A8F,#FFFFFF,#CF142B CY:#D57800,#FFFFFF,#4E5B31 CZ:#11457E,#FFFFFF,#D7141A DK:#C8102E,#FFFFFF
DJ:#6AB2E7,#12AD2B,#FFFFFF DM:#006B3F,#FCD116,#D41C30 DO:#002D62,#CE1126,#FFFFFF EC:#FFDD00,#034EA2,#ED1C24 EG:#CE1126,#FFFFFF,#000000,#C09300 SV:#0F47AF,#FFFFFF
GQ:#3E9A00,#FFFFFF,#E32118 ER:#4189DD,#12AD2B,#EA0437 EE:#0072CE,#000000,#FFFFFF SZ:#3E5EB9,#FFD900,#B10C0C ET:#078930,#FCDD09,#DA121A FJ:#68BFE5,#FFFFFF,#CE1126
FI:#002F6C,#FFFFFF FR:#002395,#FFFFFF,#ED2939 GA:#009E60,#FCD116,#3A75C4 GM:#CE1126,#0C1C8C,#3A7728 GE:#FFFFFF,#FF0000 DE:#000000,#DD0000,#FFCE00
GH:#CE1126,#FCD116,#006B3F GR:#0D5EAF,#FFFFFF GD:#CE1126,#FCD116,#007A5E GT:#4997D0,#FFFFFF GN:#CE1126,#FCD116,#009460 GW:#CE1126,#FCD116,#009E49
GY:#009E49,#FCD116,#CE1126 HT:#00209F,#D21034 HN:#0073CF,#FFFFFF HU:#CE2939,#FFFFFF,#477050 IS:#02529C,#FFFFFF,#DC1E35 IN:#FF9933,#FFFFFF,#138808
ID:#FF0000,#FFFFFF IR:#239F40,#FFFFFF,#DA0000 IQ:#CE1126,#FFFFFF,#000000,#007A3D IE:#169B62,#FFFFFF,#FF883E IL:#0038B8,#FFFFFF IT:#009246,#FFFFFF,#CE2B37
JM:#009B3A,#FED100,#000000 JP:#FFFFFF,#BC002D KZ:#00AFCA,#FEC50C JO:#000000,#FFFFFF,#007A3D,#CE1126 KE:#000000,#BB0000,#006600,#FFFFFF KI:#CE1126,#003F87,#FCD116
KW:#007A3D,#FFFFFF,#CE1126,#000000 KG:#E8112D,#FFEF00 LA:#CE1126,#002868,#FFFFFF LV:#9E3039,#FFFFFF LB:#ED1C24,#FFFFFF,#00A651 LS:#00209F,#FFFFFF,#009543
LR:#BF0A30,#FFFFFF,#002868 LY:#E70013,#000000,#239E46 LI:#002B7F,#CE1126,#FFD83D LT:#FDB913,#006A44,#C1272D LU:#ED2939,#FFFFFF,#00A1DE MG:#FFFFFF,#FC3D32,#007E3A
MW:#000000,#CE1126,#339E35 MY:#010066,#CC0001,#FFFFFF,#FFCC00 MV:#D21034,#007E3A,#FFFFFF ML:#14B53A,#FCD116,#CE1126 MT:#FFFFFF,#CF142B MH:#003893,#FFFFFF,#DD7500
MR:#006233,#FFC400,#D01C1F MU:#EA2839,#1A206D,#FFD500,#00A551 MX:#006847,#FFFFFF,#CE1126 FM:#75B2DD,#FFFFFF MD:#0046AE,#FFD200,#CC092F MC:#CE1126,#FFFFFF
MN:#C4272F,#015197,#F9CF02 ME:#C40308,#D3AE3B MA:#C1272D,#006233 MZ:#007168,#000000,#FCE100,#D21034 MM:#FECB00,#34B233,#EA2839 NA:#003580,#D21034,#009543,#FFCE00
NR:#002B7F,#FFC61E,#FFFFFF NP:#DC143C,#003893,#FFFFFF NL:#AE1C28,#FFFFFF,#21468B,#FF7F00 NZ:#000000,#FFFFFF,#00247D NI:#0067C6,#FFFFFF NE:#E05206,#FFFFFF,#0DB02B
NG:#008751,#FFFFFF KP:#024FA2,#ED1C27,#FFFFFF MK:#D20000,#FFE600 NO:#BA0C2F,#FFFFFF,#00205B OM:#DB161B,#FFFFFF,#008000 PK:#01411C,#FFFFFF PW:#0099FF,#FFFF00
PA:#DA121A,#FFFFFF,#072357 PG:#000000,#CE1126,#FCD116 PY:#D52B1E,#FFFFFF,#0038A8 PE:#D91023,#FFFFFF PH:#0038A8,#CE1126,#FCD116 PL:#FFFFFF,#DC143C PT:#006600,#FF0000,#FFCC00
QA:#8A1538,#FFFFFF RO:#002B7F,#FCD116,#CE1126 RU:#FFFFFF,#0039A6,#D52B1E RW:#00A1DE,#FAD201,#20603D KN:#009E49,#FCD116,#CE1126,#000000 LC:#66CCFF,#FCD116,#000000
VC:#002674,#FCD022,#009E60 WS:#CE1126,#002B7F,#FFFFFF SM:#5EB6E4,#FFFFFF ST:#12AD2B,#FFCE00,#D21034 SA:#006C35,#FFFFFF SN:#00853F,#FDEF42,#E31B23 RS:#C6363C,#0C4076,#FFFFFF
SC:#003F87,#FCD856,#D62828,#007A3D SL:#1EB53A,#FFFFFF,#0072C6 SG:#EF3340,#FFFFFF SK:#FFFFFF,#0B4EA2,#EE1C25 SI:#FFFFFF,#005DA4,#ED1C24 SB:#0051BA,#215B33,#FCD116
SO:#4189DD,#FFFFFF ZA:#007A4D,#FFB612,#DE3831,#002395,#000000 KR:#FFFFFF,#CD2E3A,#0047A0,#000000 SS:#000000,#DA121A,#078930,#0F47AF ES:#AA151B,#F1BF00 LK:#FFBE29,#8D153A,#00534E
SD:#D21034,#FFFFFF,#000000,#007229 SR:#377E3F,#FFFFFF,#B40A2D,#ECC81D SE:#006AA7,#FECC00 CH:#FF0000,#FFFFFF SY:#CE1126,#FFFFFF,#000000,#007A3D TJ:#CC0000,#FFFFFF,#006600
TZ:#1EB53A,#FCD116,#000000,#00A3DD TH:#A51931,#F4F5F8,#2D2A4A TL:#DC241F,#FFC726,#000000 TG:#006A4E,#FFCE00,#D21034 TO:#C10000,#FFFFFF TT:#DA1A35,#000000,#FFFFFF
TN:#E70013,#FFFFFF TR:#E30A17,#FFFFFF TM:#00843D,#D22630,#FFFFFF TV:#012169,#FFCE00,#5B97B1 UG:#000000,#FCDC04,#D90000 UA:#0057B7,#FFD700 AE:#00732F,#FFFFFF,#000000,#FF0000
GB:#012169,#FFFFFF,#C8102E US:#B22234,#FFFFFF,#3C3B6E UY:#0038A8,#FFFFFF,#FCD116 UZ:#0099B5,#FFFFFF,#1EB53A VU:#D21034,#009543,#000000,#FDCE12 VE:#FFCC00,#00247D,#CF142B
VN:#DA251D,#FFFF00 YE:#CE1126,#FFFFFF,#000000 ZM:#198A00,#DE2010,#000000,#EF7D00 ZW:#006400,#FFD200,#D40000,#000000`;
export const FLAG = Object.fromEntries(F.split(/\s+/).filter(Boolean).map((s) => { const [k, v] = s.split(':'); return [k, v.split(',')]; }));

// Staple foods (names Whisk can draw, lib/art/food.js)
const ST = `US:Corn,Beef MX:Corn,Chili,Avocado IT:Tomato,Pasta,Parmesan FR:Bread,Butter,Cheese ES:Tomato,Olive oil,Shrimp GR:Lemon,Feta,Olive oil GB:Potato,Tea,Bread
DE:Sausage,Potato,Bread JP:Rice,Fish,Soy sauce CN:Rice,Noodles,Ginger KR:Rice,Cabbage,Chili TH:Rice,Lime,Chili VN:Noodles,Herbs,Lime IN:Rice,Lentils,Chili LB:Lemon,Chickpeas,Herbs
TR:Lamb,Yogurt,Bread EG:Beans,Bread,Lemon ET:Lentils,Chili,Coffee TN:Chili,Flour,Lemon MA:Lemon,Chickpeas,Lamb BR:Beans,Rice,Banana JM:Chili,Banana,Rice CU:Beans,Rice,Pork
PE:Potato,Corn,Fish AR:Beef,Corn CO:Corn,Avocado,Banana NG:Rice,Tomato,Chili GH:Rice,Tomato,Banana KE:Corn,Beef,Spinach ZA:Corn,Beef PH:Rice,Pork,Coconut milk
ID:Rice,Chili,Peanuts MY:Rice,Coconut milk,Chili PK:Rice,Lamb,Yogurt IR:Rice,Lamb,Herbs IQ:Rice,Lamb SA:Rice,Lamb RU:Potato,Cabbage,Sour cream UA:Cabbage,Potato,Sour cream
PL:Potato,Cabbage,Sausage SE:Fish,Potato NO:Fish,Potato IE:Potato,Butter PT:Fish,Olive oil,Bread CA:Potato,Honey AU:Beef,Shrimp NZ:Lamb,Fish CL:Corn,Fish VE:Corn,Beans
CH:Cheese,Potato AT:Beef,Potato HU:Pepper,Onion,Beef NL:Cheese,Potato BE:Potato,Bread DK:Bread,Pork`;
const STAPLE = Object.fromEntries(ST.split(/\s+(?=[A-Z]{2}:)/).map((s) => { const [k, v] = s.split(':'); return [k, v.split(',')]; }));
// no list: by where it is, roughly
function guessStaples(lat, lon) {
  if (lat > 35 && lon > -30 && lon < 45) return ['Bread', 'Potato'];
  if (lat > 10 && lon >= 25 && lon < 65) return ['Rice', 'Lemon'];
  if (Math.abs(lat) < 25 && lon > -20 && lon < 52) return ['Corn', 'Banana'];
  if (lon >= 60 && lon < 150) return ['Rice', 'Chili'];
  if (lon < -30) return ['Corn', 'Beans'];
  return ['Fish', 'Coconut milk'];
}

// a colour that isn't white for the outline/frame
export function teamColors(iso) {
  const c = FLAG[iso];
  if (c) return c;
  let h = 0; for (const ch of String(iso)) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return [`hsl(${h} 70% 45%)`, '#FFFFFF', `hsl(${(h + 140) % 360} 70% 45%)`];
}

const memo = new Map();
// SVG body for a 200×200 box
export function countryArt(iso, lat = 0, lon = 0) {
  let s = memo.get(iso); if (s) return s;
  const cols = teamColors(iso), c = COUNTRY_BY_ISO[iso];
  const n = cols.length, band = 26;
  let bg = `<rect width='200' height='200' fill='${cols[0]}'/><g transform='rotate(-32 100 100)'>`;
  for (let i = -8, k = 0; i < 16; i++, k++) bg += `<rect x='-120' y='${i * band}' width='440' height='${band}' fill='${cols[k % n]}'/>`;
  bg += `</g>`;
  // the country's real flag over the team colours (flag-icons, served from /flags)
  if (/^[A-Z]{2}$/.test(iso) && COUNTRY_BY_ISO[iso]) bg += `<image href='/flags/${iso.toLowerCase()}.svg' x='-34' y='0' width='268' height='200' preserveAspectRatio='xMidYMid slice'/>`;
  bg += `<rect width='200' height='200' fill='rgba(255,255,255,.12)'/>`;
  const foods = STAPLE[iso] || guessStaples(lat, lon);
  const buddy = landmarkFor(iso)[4];
  const ring = (x, y, r) => `<circle cx='${x}' cy='${y}' r='${r}' fill='rgba(255,255,255,.85)' stroke='#3B2C24' stroke-width='2'/>`;
  let art = ring(100, 104, 46) + `<g transform='translate(100 112) scale(.62)'>${dishArt({ title: c?.[2] || '' })}</g>`;
  art += ring(42, 44, 26) + foodDrawing(foods[0], 'Other', 42, 44, 0.62);
  art += ring(160, 160, 26) + foodDrawing(foods[1] || foods[0], 'Other', 160, 160, 0.62);
  if (foods[2]) art += ring(40, 162, 22) + foodDrawing(foods[2], 'Other', 40, 162, 0.52);
  const b = buddy && buddy !== 'herbs' ? scenery(buddy, 160, 66, 0.6) : '';
  art += b ? ring(160, 46, 26) + b : '';
  s = bg + art; memo.set(iso, s); return s;
}

export const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c[0], c[1]]));
// tiny countries that the world map is too coarse to draw: shown as a small round island
export const TINY = { AD: [1.6, 42.5], AG: [-61.8, 17.1], BH: [50.55, 26.07], BB: [-59.55, 13.19], CV: [-23.6, 15.1], KM: [43.9, -11.9], DM: [-61.37, 15.42], GD: [-61.68, 12.12],
  KI: [173, 1.87], LI: [9.55, 47.16], MV: [73.5, 4.2], MT: [14.45, 35.9], MH: [171.2, 7.1], MU: [57.55, -20.25], FM: [158.2, 6.9], MC: [7.42, 43.74], NR: [166.93, -0.52],
  PW: [134.5, 7.5], KN: [-62.75, 17.3], LC: [-60.98, 13.9], VC: [-61.2, 13.25], WS: [-172.1, -13.75], SM: [12.45, 43.94], ST: [6.6, 0.3], SC: [55.45, -4.6], SG: [103.82, 1.35],
  TO: [-175.2, -21.2], TV: [179.2, -8.5] };
