// Fridge magnets for the Kitchen shop, drawn by Whisk (no emoji): every dog breed and cat breed we could fit, other
// pets, cities, postcards, art, kids' drawings, test scores, report cards, invitations, holiday cards and a few odd ones.
// Bought magnets stick to the fridge doors in your 3D kitchen. Each is a die-cut 64×64 drawing with a white edge.
import { INK } from './food.js';

const O = `stroke='${INK}' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'`;
const o = `stroke='${INK}' stroke-width='1.4' stroke-linejoin='round' stroke-linecap='round'`;
const C = { gold: '#E1A95F', cream: '#F2DDB0', red: '#C46A35', choc: '#6B4226', black: '#2E2A2A', white: '#F7F4EE', grey: '#A3A8AE', tan: '#C98B4E',
  fawn: '#D9B07A', brindle: '#8A6239', blue: '#7D8B99', liver: '#8A4B2F', wheat: '#E6C98E', sable: '#A0672E', orange: '#E08A3C', silver: '#C9CDD2', apricot: '#EBB17A', lilac: '#B9A9B4', seal: '#4A3628' };
const col = (k) => C[k] || k;

// ---------- dogs ----------
// name | ears (P prick, F flop, L long, R rose/fold, B bat, T tipped) | snout (s/m/l) | coat colour | second colour |
// marking (n none, b white blaze, m dark mask, t tan points, s spots, p eye patch, d saddle) | coat (s smooth, f fluffy, c curly, w wiry, l silky)
const DOG = `Affenpinscher|P|s|black|black|n|w Afghan Hound|L|l|cream|wheat|n|l Airedale Terrier|R|l|tan|black|d|w Akita|P|m|red|white|b|f Alaskan Malamute|P|m|grey|white|b|f
American Bulldog|R|s|white|brindle|p|s American Eskimo Dog|P|m|white|white|n|f American Foxhound|L|m|tan|white|b|s American Staffordshire Terrier|R|m|blue|white|b|s Australian Cattle Dog|P|m|blue|tan|p|s
Australian Shepherd|T|m|blue|white|b|f Basenji|P|m|red|white|b|s Basset Hound|L|l|tan|white|b|s Beagle|L|m|tan|white|b|s Bearded Collie|F|m|grey|white|b|l
Bedlington Terrier|L|l|silver|silver|n|c Belgian Malinois|P|l|fawn|black|m|s Bernese Mountain Dog|F|m|black|white|t|f Bichon Frise|F|s|white|white|n|c Black and Tan Coonhound|L|l|black|tan|t|s
Bloodhound|L|l|liver|tan|n|s Border Collie|T|m|black|white|b|f Border Terrier|F|m|wheat|grey|n|w Borzoi|R|l|white|gold|p|l Boston Terrier|B|s|black|white|b|s
Bouvier des Flandres|P|m|grey|black|n|w Boxer|F|s|fawn|black|m|s Boykin Spaniel|L|m|liver|liver|n|l Briard|F|m|fawn|fawn|n|l Brittany|F|m|orange|white|b|s
Brussels Griffon|R|s|red|black|m|w Bull Terrier|P|l|white|white|n|s Bulldog|R|s|fawn|white|b|s Bullmastiff|F|s|fawn|black|m|s Cairn Terrier|P|s|wheat|grey|n|w
Cane Corso|F|s|black|grey|n|s Cardigan Welsh Corgi|P|m|blue|white|b|s Cavalier King Charles Spaniel|L|s|white|red|p|l Chesapeake Bay Retriever|F|m|liver|liver|n|c Chihuahua|B|s|fawn|white|n|s
Chinese Crested|B|s|grey|white|n|l Chinese Shar-Pei|R|s|fawn|fawn|n|s Chow Chow|P|s|red|red|n|f Cocker Spaniel|L|s|gold|gold|n|l Collie|T|l|sable|white|b|f
Dachshund|L|l|red|red|n|s Dalmatian|F|m|white|black|s|s Doberman Pinscher|P|l|black|tan|t|s Dogue de Bordeaux|R|s|red|red|m|s English Setter|L|l|white|liver|s|l
English Springer Spaniel|L|m|liver|white|b|l Field Spaniel|L|m|black|black|n|l Finnish Spitz|P|m|red|red|n|f Flat-Coated Retriever|F|l|black|black|n|l French Bulldog|B|s|fawn|black|m|s
German Pinscher|P|l|black|tan|t|s German Shepherd Dog|P|l|tan|black|m|s German Shorthaired Pointer|F|l|liver|white|s|s German Wirehaired Pointer|F|l|liver|white|s|w Giant Schnauzer|P|l|black|black|n|w
Golden Retriever|F|m|gold|gold|n|f Gordon Setter|L|l|black|tan|t|l Great Dane|F|l|fawn|black|m|s Great Pyrenees|F|m|white|white|n|f Greater Swiss Mountain Dog|F|m|black|white|t|s
Greyhound|R|l|grey|white|b|s Havanese|F|s|cream|white|n|l Irish Setter|L|l|red|red|n|l Irish Terrier|R|l|red|red|n|w Irish Water Spaniel|L|l|liver|liver|n|c
Irish Wolfhound|R|l|grey|grey|n|w Italian Greyhound|R|l|blue|white|b|s Jack Russell Terrier|R|m|white|tan|p|s Japanese Chin|L|s|white|black|p|l Keeshond|P|s|grey|black|m|f
Kerry Blue Terrier|R|m|blue|blue|n|c Komondor|F|m|white|white|n|c Kuvasz|F|m|white|white|n|f Labrador Retriever|F|m|gold|gold|n|s Labrador Retriever (Black)|F|m|black|black|n|s
Labrador Retriever (Chocolate)|F|m|choc|choc|n|s Lagotto Romagnolo|F|m|cream|liver|p|c Lakeland Terrier|R|m|wheat|black|d|w Leonberger|F|m|gold|black|m|f Lhasa Apso|F|s|gold|cream|n|l
Maltese|L|s|white|white|n|l Manchester Terrier|P|l|black|tan|t|s Mastiff|F|s|fawn|black|m|s Miniature American Shepherd|T|m|red|white|b|f Miniature Pinscher|P|m|black|tan|t|s
Miniature Schnauzer|R|m|grey|white|n|w Newfoundland|F|m|black|black|n|f Norfolk Terrier|R|s|red|red|n|w Norwegian Elkhound|P|m|grey|black|m|f Norwich Terrier|P|s|red|red|n|w
Old English Sheepdog|F|m|grey|white|b|l Papillon|B|s|white|black|p|l Pekingese|L|s|gold|black|m|l Pembroke Welsh Corgi|P|m|red|white|b|s Pharaoh Hound|B|l|red|red|n|s
Plott Hound|L|l|brindle|black|n|s Pointer|F|l|white|liver|p|s Pomeranian|P|s|orange|orange|n|f Poodle (Standard)|L|l|white|white|n|c Poodle (Toy)|L|m|apricot|apricot|n|c
Portuguese Water Dog|L|m|black|white|b|c Pug|R|s|fawn|black|m|s Puli|F|m|black|black|n|c Rat Terrier|B|m|white|black|p|s Redbone Coonhound|L|l|red|red|n|s
Rhodesian Ridgeback|F|l|wheat|red|m|s Rottweiler|F|m|black|tan|t|s Saint Bernard|F|m|red|white|b|f Saluki|L|l|cream|cream|n|l Samoyed|P|m|white|white|n|f
Schipperke|P|m|black|black|n|f Scottish Deerhound|R|l|grey|grey|n|w Scottish Terrier|P|l|black|black|n|w Shetland Sheepdog|T|l|sable|white|b|f Shiba Inu|P|m|red|white|b|s
Shih Tzu|L|s|gold|white|b|l Siberian Husky|P|m|grey|white|b|f Silky Terrier|P|s|blue|tan|t|l Skye Terrier|P|m|grey|black|n|l Smooth Fox Terrier|R|m|white|tan|p|s
Soft Coated Wheaten Terrier|F|m|wheat|wheat|n|l Staffordshire Bull Terrier|R|s|brindle|white|b|s Standard Schnauzer|R|l|grey|black|n|w Tibetan Mastiff|F|m|black|tan|t|f Tibetan Terrier|L|m|cream|grey|n|l
Toy Fox Terrier|P|m|white|tan|p|s Vizsla|L|l|red|red|n|s Weimaraner|L|l|silver|silver|n|s Welsh Springer Spaniel|L|m|red|white|b|l West Highland White Terrier|P|s|white|white|n|w
Whippet|R|l|fawn|white|b|s Wire Fox Terrier|R|l|white|tan|p|w Xoloitzcuintli|B|l|black|black|n|s Yorkshire Terrier|P|s|tan|blue|d|l Cockapoo|L|m|apricot|apricot|n|c
Goldendoodle|F|m|wheat|wheat|n|c Labradoodle|F|m|cream|cream|n|c Mutt|F|m|tan|white|b|s`;

function dog([, ears, snout, c1, c2, mark, coat]) {
  const a = col(c1), b = col(c2), dark = col(mark === 'm' || mark === 'd' ? (c2 === c1 ? 'black' : c2) : c2);
  const fluffy = coat === 'f' || coat === 'c' || coat === 'l';
  let s = '';
  // ears behind the head
  if (ears === 'F') s += `<path d='M14 22q-8 2-8 14q2 8 8 6q4-8 4-18z' fill='${b === a ? col(c1) : b}' ${O}/><path d='M50 22q8 2 8 14q-2 8-8 6q-4-8-4-18z' fill='${b === a ? col(c1) : b}' ${O}/>`;
  if (ears === 'L') s += `<path d='M15 22q-10 4-10 22q2 10 9 8q5-12 6-28z' fill='${b}' ${O}/><path d='M49 22q10 4 10 22q-2 10-9 8q-5-12-6-28z' fill='${b}' ${O}/>${coat === 'l' || coat === 'c' ? `<path d='M7 40q3 4 0 8M57 40q-3 4 0 8' stroke='${INK}' stroke-width='1.2' fill='none'/>` : ''}`;
  // head
  if (fluffy) s += `<path d='M32 12c6 0 7 3 11 3s6 5 8 8 2 7 2 11-3 8-5 11-6 6-9 7-4 3-7 3-5-2-7-3-7-4-9-7-5-7-5-11 1-8 2-11 4-8 8-8 5-3 11-3z' fill='${a}' ${O}/>`;
  else s += `<ellipse cx='32' cy='32' rx='${snout === 'l' ? 15 : 17}' ry='${snout === 'l' ? 17 : 16}' fill='${a}' ${O}/>`;
  if (coat === 'c') s += `<path d='M22 16q3-4 6 0q3-4 6 0q3-4 6 0' stroke='${INK}' stroke-width='1.2' fill='none'/>`;
  // ears on top
  if (ears === 'P') s += `<path d='M17 24l1-15 10 8z' fill='${a}' ${O}/><path d='M47 24l-1-15-10 8z' fill='${a}' ${O}/><path d='M19 20l1-7 5 4z' fill='#F2B5B0'/><path d='M45 20l-1-7-5 4z' fill='#F2B5B0'/>`;
  if (ears === 'B') s += `<path d='M18 24q-8-14-4-18 10 2 14 12z' fill='${a}' ${O}/><path d='M46 24q8-14 4-18-10 2-14 12z' fill='${a}' ${O}/><path d='M19 20q-4-8-2-11 5 1 7 7z' fill='#F2B5B0'/><path d='M45 20q4-8 2-11-5 1-7 7z' fill='#F2B5B0'/>`;
  if (ears === 'T') s += `<path d='M17 24l2-13 9 6q-6 0-11 7z' fill='${b}' ${O}/><path d='M47 24l-2-13-9 6q6 0 11 7z' fill='${b}' ${O}/>`;
  if (ears === 'R') s += `<path d='M18 20q-2-8 6-8l2 6q-5 0-8 2z' fill='${b === a ? a : b}' ${O}/><path d='M46 20q2-8-6-8l-2 6q5 0 8 2z' fill='${b === a ? a : b}' ${O}/>`;
  // markings
  if (mark === 'b') s += `<path d='M30 18q2-3 4 0l2 14q6 4 4 14-8 4-16 0-2-10 4-14z' fill='${b === a ? C.white : b}'/>`;
  if (mark === 'm') s += `<ellipse cx='32' cy='${snout === 'l' ? 43 : 41}' rx='10' ry='${snout === 'l' ? 10 : 8}' fill='${dark}' opacity='.85'/><ellipse cx='25' cy='29' rx='5' ry='4' fill='${dark}' opacity='.5'/><ellipse cx='39' cy='29' rx='5' ry='4' fill='${dark}' opacity='.5'/>`;
  if (mark === 't') s += `<circle cx='25' cy='25' r='2.6' fill='${b}'/><circle cx='39' cy='25' r='2.6' fill='${b}'/><ellipse cx='32' cy='43' rx='10' ry='7' fill='${b}'/>`;
  if (mark === 's') s += [[21, 22], [42, 20], [19, 36], [45, 37], [36, 17], [27, 47]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2.6' fill='${b}'/>`).join('');
  if (mark === 'p') s += `<ellipse cx='39' cy='28' rx='8' ry='9' fill='${b}'/>`;
  if (mark === 'd') s += `<path d='M17 30q15-16 30 0q-4-14-15-15-11 1-15 15z' fill='${b}'/>`;
  if (coat === 'w') s += `<path d='M24 44q8 12 16 0v4q-8 10-16 0z' fill='${a === C.black ? C.grey : a}' ${o}/><path d='M22 25l6-2M42 25l-6-2' stroke='${INK}' stroke-width='2'/>`;
  // muzzle, nose, eyes
  const my = snout === 's' ? 41 : snout === 'l' ? 45 : 43, mr = snout === 's' ? [9, 6] : snout === 'l' ? [7, 9] : [9, 7];
  s += `<ellipse cx='32' cy='${my}' rx='${mr[0]}' ry='${mr[1]}' fill='${mark === 'm' ? dark : mark === 't' ? b : C.white}' opacity='${mark === 'm' || mark === 't' ? 1 : .55}' ${o}/>`;
  s += `<ellipse cx='32' cy='${my - mr[1] + 3}' rx='4' ry='3' fill='${INK}'/><path d='M32 ${my - mr[1] + 6}v3M28 ${my - mr[1] + 10}q4 3 8 0' stroke='${INK}' stroke-width='1.4' fill='none'/>`;
  s += `<circle cx='25' cy='29' r='2.8' fill='${INK}'/><circle cx='39' cy='29' r='2.8' fill='${INK}'/><circle cx='25.9' cy='28' r='.9' fill='#fff'/><circle cx='39.9' cy='28' r='.9' fill='#fff'/>`;
  if (snout === 's') s += `<path d='M29 50q3 4 6 0' fill='#F28B8B' ${o}/>`;
  return s;
}

// ---------- cats ----------
// name | ears (N normal, F folded, B big, C curled, T tufted, S small/round) | coat (s short, l long, h hairless, c curly) |
// colour | second | pattern (n solid, t tabby, p colour point, c calico, x tuxedo, b bicolour, s spotted) | eyes
const CAT = `Abyssinian|B|s|sable|tan|t|#C9A227 American Bobtail|N|s|tan|choc|t|#C9A227 American Curl|C|l|cream|tan|t|#7FB069 American Shorthair|N|s|silver|black|t|#7FB069 American Wirehair|N|c|white|grey|b|#E0A93B
Balinese|B|l|cream|seal|p|#4A90D9 Bengal|N|s|orange|black|s|#7FB069 Birman|N|l|cream|seal|p|#4A90D9 Bombay|N|s|black|black|n|#E0A93B British Shorthair|S|s|blue|blue|n|#E08A3C
Burmese|N|s|choc|choc|n|#E0A93B Burmilla|N|s|silver|grey|t|#7FB069 Chartreux|S|s|blue|blue|n|#E08A3C Colorpoint Shorthair|B|s|white|red|p|#4A90D9 Cornish Rex|B|c|grey|white|b|#E0A93B
Devon Rex|B|c|cream|tan|t|#7FB069 Egyptian Mau|N|s|silver|black|s|#7FB069 European Burmese|N|s|choc|choc|n|#E0A93B Exotic Shorthair|S|s|cream|cream|n|#E08A3C Havana Brown|B|s|choc|choc|n|#7FB069
Japanese Bobtail|N|s|white|orange|c|#E0A93B Khao Manee|N|s|white|white|n|#4A90D9 Korat|N|s|blue|blue|n|#7FB069 LaPerm|N|c|tan|cream|t|#E0A93B Lykoi|B|h|grey|black|n|#E0A93B
Maine Coon|T|l|tan|black|t|#E0A93B Manx|N|s|orange|white|b|#E0A93B Norwegian Forest Cat|T|l|grey|white|t|#7FB069 Ocicat|N|s|fawn|choc|s|#E0A93B Oriental|B|s|black|black|n|#7FB069
Persian|S|l|white|white|n|#4A90D9 Ragamuffin|N|l|cream|grey|b|#4A90D9 Ragdoll|N|l|cream|seal|p|#4A90D9 Russian Blue|N|s|blue|blue|n|#7FB069 Scottish Fold|F|s|silver|grey|t|#E0A93B
Selkirk Rex|N|c|white|grey|b|#E0A93B Siamese|B|s|cream|seal|p|#4A90D9 Siberian|T|l|tan|black|t|#7FB069 Singapura|B|s|sable|tan|t|#C9A227 Somali|B|l|red|tan|t|#C9A227
Sphynx|B|h|lilac|lilac|n|#7FB069 Tonkinese|N|s|choc|seal|p|#4ABDB5 Toybob|N|s|cream|seal|p|#4A90D9 Turkish Angora|N|l|white|white|n|#4A90D9 Turkish Van|N|s|white|orange|b|#E0A93B
Tabby Cat|N|s|orange|choc|t|#7FB069 Calico Cat|N|s|white|orange|c|#E0A93B Tuxedo Cat|N|s|black|white|x|#7FB069`;

function cat([, ears, coat, c1, c2, pat, eye]) {
  const a = col(c1), b = col(c2);
  let s = '';
  const earL = ears === 'B' ? `M14 28l2-22 13 11z` : ears === 'S' ? `M18 24l2-11 8 7z` : `M16 26l2-17 11 9z`;
  const earR = ears === 'B' ? `M50 28l-2-22-13 11z` : ears === 'S' ? `M46 24l-2-11-8 7z` : `M48 26l-2-17-11 9z`;
  if (ears === 'F') s += `<path d='M18 20q4-6 10-2l-2 4q-4-2-8-2z' fill='${a}' ${O}/><path d='M46 20q-4-6-10-2l2 4q4-2 8-2z' fill='${a}' ${O}/>`;
  else if (ears === 'C') s += `<path d='M16 26l2-17 11 9z' fill='${a}' ${O}/><path d='M48 26l-2-17-11 9z' fill='${a}' ${O}/><path d='M18 9q-4-2-2-6M46 9q4-2 2-6' stroke='${INK}' stroke-width='1.6' fill='none'/>`;
  else s += `<path d='${earL}' fill='${pat === 'p' ? b : a}' ${O}/><path d='${earR}' fill='${pat === 'p' ? b : pat === 'c' ? b : a}' ${O}/><path d='${earL}' fill='#F2B5B0' transform='translate(4.5 5) scale(.7)'/><path d='${earR}' fill='#F2B5B0' transform='translate(14.5 5) scale(.7)'/>`;
  if (ears === 'T') s += `<path d='M17 9l-2-5M47 9l2-5' stroke='${INK}' stroke-width='1.6'/>`;
  // head
  if (coat === 'l') s += `<path d='M32 15c9 0 14 4 17 9 3 5 3 11 1 15 2 3 4 5 2 7-4-1-6 1-9 3-4 3-7 4-11 4s-7-1-11-4c-3-2-5-4-9-3-2-2 0-4 2-7-2-4-2-10 1-15 3-5 8-9 17-9z' fill='${a}' ${O}/>`;
  else s += `<ellipse cx='32' cy='35' rx='${ears === 'S' ? 18 : 17}' ry='${ears === 'S' ? 16 : 15}' fill='${a}' ${O}/>`;
  if (coat === 'h') s += `<path d='M24 22q8-3 16 0M26 26q6-2 12 0' stroke='${INK}' stroke-width='1' fill='none' opacity='.6'/>`;
  if (pat === 't') s += `<path d='M28 21l1 6M32 20v7M36 21l-1 6M17 33l6 1M17 38l6-1M47 33l-6 1M47 38l-6-1' stroke='${b}' stroke-width='2.4' stroke-linecap='round'/>`;
  if (pat === 's') s += [[22, 26], [42, 26], [19, 37], [45, 37], [32, 22], [26, 44], [38, 44]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='2.2' fill='${b}'/>`).join('');
  if (pat === 'p') s += `<ellipse cx='32' cy='41' rx='11' ry='8' fill='${b}' opacity='.85'/>`;
  if (pat === 'c') s += `<path d='M17 30q2-12 13-12l-2 12z' fill='${b}'/><path d='M47 34q-2-12-10-14l1 12z' fill='${C.black}'/>`;
  if (pat === 'x') s += `<path d='M24 38q8-8 16 0 4 8 0 12-8 4-16 0-4-4 0-12z' fill='${b}'/>`;
  if (pat === 'b') s += `<path d='M32 24l6 14q2 8-6 10-8-2-6-10z' fill='${b === a ? C.white : C.white}'/>`;
  // eyes, nose, mouth, whiskers
  s += `<ellipse cx='25' cy='33' rx='4' ry='3.6' fill='${eye}' ${o}/><ellipse cx='39' cy='33' rx='4' ry='3.6' fill='${eye}' ${o}/><ellipse cx='25' cy='33' rx='1.2' ry='3' fill='${INK}'/><ellipse cx='39' cy='33' rx='1.2' ry='3' fill='${INK}'/>`;
  s += `<path d='M30 40h4l-2 2.4z' fill='#E88B9A' ${o}/><path d='M32 42.4q-1 3-4 3M32 42.4q1 3 4 3' stroke='${INK}' stroke-width='1.3' fill='none'/>`;
  s += `<path d='M14 40l9 1M14 44l9-1M50 40l-9 1M50 44l-9-1' stroke='${INK}' stroke-width='1' opacity='.7'/>`;
  return s;
}

// ---------- other pets ----------
const PETS = {
  pet_goldfish: ['Goldfish', `<path d='M12 32q12-16 30-6l12-8-2 14 2 14-12-8q-18 10-30-6z' fill='#F28C28' ${O}/><circle cx='22' cy='29' r='2.4' fill='${INK}'/><path d='M30 24q4 8 0 16' stroke='#C8641A' stroke-width='1.6' fill='none'/>`],
  pet_clownfish: ['Clownfish', `<path d='M10 32q12-14 30-6l12-8-2 14 2 14-12-8q-18 10-30-6z' fill='#F57C1F' ${O}/><path d='M22 22q3 10 0 20M34 23q3 9 0 18' stroke='#FFFFFF' stroke-width='4'/><path d='M22 22q3 10 0 20M34 23q3 9 0 18' stroke='${INK}' stroke-width='1' fill='none' opacity='.5'/><circle cx='16' cy='30' r='2.2' fill='${INK}'/>`],
  pet_betta: ['Betta fish', `<path d='M14 32q8-8 18-4 10-14 22-10-6 10-4 14 6 4 4 14-12 4-22-10-10 4-18-4z' fill='#3A6FD8' ${O}/><path d='M30 30q10 2 22-10M30 34q10 2 20 12' stroke='#8FB3F2' stroke-width='1.6' fill='none'/><circle cx='19' cy='31' r='2' fill='${INK}'/>`],
  pet_puffer: ['Pufferfish', `<circle cx='30' cy='32' r='17' fill='#F2D57A' ${O}/>${Array.from({ length: 10 }, (_, i) => { const t = i / 10 * Math.PI * 2; return `<path d='M${30 + Math.cos(t) * 17} ${32 + Math.sin(t) * 17}l${Math.cos(t) * 5} ${Math.sin(t) * 5}' stroke='${INK}' stroke-width='1.6'/>`; }).join('')}<path d='M47 32l9-6v12z' fill='#F2D57A' ${O}/><circle cx='22' cy='28' r='3' fill='${INK}'/><path d='M14 34q2 2 4 0' stroke='${INK}' stroke-width='1.4' fill='none'/>`],
  pet_seaturtle: ['Sea turtle', `<ellipse cx='32' cy='34' rx='16' ry='13' fill='#5E9A4A' ${O}/><path d='M24 28l8-6 8 6-3 9h-10z' fill='#7FB867' ${o}/><ellipse cx='32' cy='16' rx='6' ry='5' fill='#9CC77E' ${O}/><path d='M16 28q-10-4-10 4 6 2 12 0M48 28q10-4 10 4-6 2-12 0M20 44l-6 6M44 44l6 6' stroke='${INK}' stroke-width='5' stroke-linecap='round'/><path d='M16 28q-10-4-10 4 6 2 12 0M48 28q10-4 10 4-6 2-12 0' stroke='#9CC77E' stroke-width='3' fill='none'/><circle cx='30' cy='15' r='1.2' fill='${INK}'/><circle cx='34' cy='15' r='1.2' fill='${INK}'/>`],
  pet_boxturtle: ['Box turtle', `<path d='M10 42q2-24 22-24t22 24z' fill='#8A5A34' ${O}/><path d='M18 40l4-12h20l4 12M32 20v20' stroke='#E0A93B' stroke-width='2' fill='none'/><ellipse cx='54' cy='40' rx='6' ry='5' fill='#C9A24A' ${O}/><circle cx='56' cy='39' r='1.2' fill='${INK}'/><path d='M16 42v6M28 42v6M40 42v6' stroke='${INK}' stroke-width='4' stroke-linecap='round'/>`],
  pet_tortoise: ['Tortoise', `<path d='M8 44q2-28 24-28t24 28z' fill='#B88A4A' ${O}/>${[[20, 30], [32, 26], [44, 30], [26, 38], [38, 38]].map(([x, y]) => `<path d='M${x - 5} ${y}l5-4 5 4-2 6h-6z' fill='#D9B26A' ${o}/>`).join('')}<ellipse cx='58' cy='42' rx='5' ry='5' fill='#9C8A6A' ${O}/><circle cx='59' cy='41' r='1.1' fill='${INK}'/>`],
  pet_hamster: ['Golden hamster', `<ellipse cx='32' cy='36' rx='20' ry='16' fill='#E1A95F' ${O}/><circle cx='18' cy='22' r='5' fill='#E1A95F' ${O}/><circle cx='46' cy='22' r='5' fill='#E1A95F' ${O}/><ellipse cx='32' cy='42' rx='13' ry='9' fill='#FFF3DE'/><circle cx='26' cy='32' r='2.4' fill='${INK}'/><circle cx='38' cy='32' r='2.4' fill='${INK}'/><ellipse cx='32' cy='37' rx='2' ry='1.4' fill='#E88B9A'/><ellipse cx='20' cy='39' rx='4' ry='3' fill='#F7B7A3' opacity='.7'/><ellipse cx='44' cy='39' rx='4' ry='3' fill='#F7B7A3' opacity='.7'/>`],
  pet_dwarfhamster: ['Dwarf hamster', `<ellipse cx='32' cy='36' rx='18' ry='15' fill='#B9B4AE' ${O}/><circle cx='20' cy='23' r='4.4' fill='#B9B4AE' ${O}/><circle cx='44' cy='23' r='4.4' fill='#B9B4AE' ${O}/><path d='M32 21v14' stroke='#6E6A66' stroke-width='3'/><ellipse cx='32' cy='43' rx='12' ry='7' fill='#FFFFFF'/><circle cx='26' cy='33' r='2.2' fill='${INK}'/><circle cx='38' cy='33' r='2.2' fill='${INK}'/><ellipse cx='32' cy='38' rx='1.8' ry='1.3' fill='#E88B9A'/>`],
  pet_teddyhamster: ['Teddy bear hamster', `<path d='M32 18c12 0 22 8 22 18s-10 16-22 16-22-6-22-16 10-18 22-18z' fill='#F2DDB0' ${O}/><path d='M14 32l-4-2M14 38l-5 1M50 32l4-2M50 38l5 1' stroke='${INK}' stroke-width='1.2'/><circle cx='20' cy='22' r='4.6' fill='#F2DDB0' ${O}/><circle cx='44' cy='22' r='4.6' fill='#F2DDB0' ${O}/><circle cx='26' cy='33' r='2.4' fill='${INK}'/><circle cx='38' cy='33' r='2.4' fill='${INK}'/><ellipse cx='32' cy='38' rx='2' ry='1.4' fill='#E88B9A'/>`],
  pet_lop: ['Lop bunny', `<path d='M18 26q-10 4-8 22 6 2 10-4 2-10 4-16z' fill='#D9B07A' ${O}/><path d='M46 26q10 4 8 22-6 2-10-4-2-10-4-16z' fill='#D9B07A' ${O}/><ellipse cx='32' cy='36' rx='16' ry='15' fill='#F2DDB0' ${O}/><circle cx='26' cy='34' r='2.4' fill='${INK}'/><circle cx='38' cy='34' r='2.4' fill='${INK}'/><path d='M30 40l2 2 2-2z' fill='#E88B9A'/><path d='M32 42v2M29 46q3 2 6 0' stroke='${INK}' stroke-width='1.2' fill='none'/>`],
  pet_lionhead: ['Lionhead bunny', `<path d='M32 14c4 0 6 2 9 2s6 4 8 7 3 7 2 10 2 6 0 9-4 4-7 5-6 4-12 4-9-2-12-4-6-3-7-5 1-6 0-9 0-7 2-10 4-7 8-7 5-2 9-2z' fill='#FFFFFF' ${O}/><path d='M24 18l-2-12 6 4zM40 18l2-12-6 4z' fill='#FFFFFF' ${O}/><ellipse cx='32' cy='36' rx='11' ry='10' fill='#E1A95F' ${o}/><circle cx='28' cy='34' r='2' fill='${INK}'/><circle cx='36' cy='34' r='2' fill='${INK}'/><path d='M31 39h2l-1 1.4z' fill='#E88B9A'/>`],
  pet_dutch: ['Dutch bunny', `<path d='M24 22l-4-16q6-2 9 14M40 22l4-16q-6-2-9 14' fill='#2E2A2A' ${O}/><ellipse cx='32' cy='36' rx='16' ry='15' fill='#FFFFFF' ${O}/><path d='M16 36q0-14 16-15 16 1 16 15-8-6-10-2l-6 6-6-6q-2-4-10 2z' fill='#2E2A2A'/><circle cx='26' cy='34' r='2.2' fill='#fff'/><circle cx='38' cy='34' r='2.2' fill='#fff'/><circle cx='26' cy='34' r='1.2' fill='${INK}'/><circle cx='38' cy='34' r='1.2' fill='${INK}'/><path d='M30 40l2 2 2-2z' fill='#E88B9A'/>`]
};

// ---------- paper, places and odd ones ----------
const card = (bg, inner, r = 0) => `<g transform='rotate(${r} 32 32)'><rect x='10' y='12' width='44' height='40' rx='3' fill='${bg}' ${O}/>${inner}</g>`;
const tall = (bg, inner, r = 0) => `<g transform='rotate(${r} 32 32)'><rect x='14' y='8' width='36' height='48' rx='2' fill='${bg}' ${O}/>${inner}</g>`;
const word = (x, y, t, c = INK, sz = 7, w = 700) => `<text x='${x}' y='${y}' text-anchor='middle' font-family='Arial Rounded MT Bold,Arial,sans-serif' font-size='${sz}' font-weight='${w}' fill='${c}'>${t}</text>`;
const lines = (x, y, n, w, c = '#B9C2CB') => Array.from({ length: n }, (_, i) => `<path d='M${x} ${y + i * 5}h${w - (i % 2) * 6}' stroke='${c}' stroke-width='1.6'/>`).join('');
const skyline = (c) => `<path d='M10 44h44v8H10z' fill='${c}'/>`;
const OTHER = {
  // cities (die-cut skyline magnets)
  city_tampa: ['Tampa skyline', 'city', 1000, card('#9ED6F2', `${skyline('#3E8FC2')}<rect x='14' y='26' width='6' height='18' fill='#5E8DB0' ${o}/><rect x='22' y='20' width='7' height='24' fill='#7FA6C4' ${o}/><path d='M34 44v-14h3v-4h2v4h3v14z' fill='#C98A6A' ${o}/><path d='M35 26q2-5 4 0' fill='#D7DCE2' ${o}/><rect x='44' y='24' width='7' height='20' fill='#6C98BA' ${o}/>${word(32, 19, 'TAMPA', '#1D4E7A', 8)}`)],
  city_nyc: ['New York City', 'city', 1000, card('#FFD166', `${skyline('#2E2A2A')}<rect x='16' y='28' width='7' height='16' fill='#5A5654' ${o}/><path d='M27 44V20l3-6 3 6v24z' fill='#8E8A86' ${o}/><path d='M30 14v-5' stroke='${INK}' stroke-width='1.4'/><rect x='37' y='24' width='8' height='20' fill='#6E6A66' ${o}/><rect x='46' y='32' width='5' height='12' fill='#5A5654' ${o}/>${word(32, 20, 'NYC', '#C8352F', 8)}`)],
  city_paris: ['Paris', 'city', 1000, card('#F6E6D2', `<path d='M24 50l7-30h2l7 30h-4q-4-10-8 0z' fill='#8C6A4E' ${O}/><path d='M26 38h12' stroke='${INK}' stroke-width='1.6'/>${word(32, 19, 'PARIS', '#2F6DB5', 8)}`)],
  city_tokyo: ['Tokyo', 'city', 1000, card('#FFE3EC', `<path d='M14 50l18-22 18 22z' fill='#7E9CC7' ${O}/><path d='M27 34l5-6 5 6-3 2-2-2-2 2z' fill='#fff'/><circle cx='46' cy='22' r='5' fill='#D9311F'/>${word(28, 20, 'TOKYO', '#D9311F', 8)}`)],
  // postcards from cities and countries
  post_tampa: ['Greetings from Tampa', 'postcard', 800, card('#FFE8C2', `<rect x='13' y='15' width='38' height='25' fill='#9ED6F2' ${o}/><path d='M13 33h38v7H13z' fill='#3E8FC2'/><path d='M20 33q0-10 2-14M20 19q-6 0-8 3M20 19q6-2 8 2' stroke='#3F7F25' stroke-width='2' fill='none'/>${word(32, 48, 'Greetings from Tampa', '#C8352F', 4.6)}`, -4)],
  post_rome: ['Greetings from Rome', 'postcard', 800, card('#FFF4DC', `<rect x='13' y='15' width='38' height='25' fill='#F6C27A' ${o}/><path d='M18 40v-14q14-10 28 0v14z' fill='#D9B77E' ${o}/>${[22, 28, 34, 40].map((x) => `<path d='M${x} 40v-6q2-3 4 0v6' fill='#8C6A4E'/>`).join('')}${word(32, 48, 'Greetings from Rome', '#2F6DB5', 4.6)}`, 3)],
  post_mexico: ['Saludos from Mexico', 'postcard', 800, card('#FFF0E6', `<rect x='13' y='15' width='38' height='25' fill='#FFB570' ${o}/>${[0, 1, 2, 3].map((i) => `<rect x='${20 + i * 3}' y='${36 - i * 5}' width='${24 - i * 6}' height='5' fill='#C9AE84' ${o}/>`).join('')}${word(32, 48, 'Saludos from Mexico', '#2E8A3E', 4.6)}`, -2)],
  post_japan: ['Hello from Japan', 'postcard', 800, card('#F4F1EA', `<rect x='13' y='15' width='38' height='25' fill='#FFD3DE' ${o}/><path d='M16 40l16-20 16 20z' fill='#7E9CC7' ${o}/><path d='M28 25l4-5 4 5-2 1-2-2-2 2z' fill='#fff'/>${word(32, 48, 'Hello from Japan', '#D9311F', 4.6)}`, 4)],
  // art
  art_starry: ['Starry Night magnet', 'art', 1500, card('#2C3E7A', `<path d='M10 40q12-6 22 0t22-2v14H10z' fill='#1E2A55'/><path d='M14 28q8-8 16 0t16-2' stroke='#9CC9E8' stroke-width='2.4' fill='none'/><path d='M12 36q10-6 20 0t20 0' stroke='#6E9AD8' stroke-width='2' fill='none'/><circle cx='46' cy='20' r='5' fill='#F6D35B'/><circle cx='22' cy='18' r='2.6' fill='#F6D35B'/><circle cx='34' cy='16' r='2' fill='#F6D35B'/><path d='M18 52q2-18 6-24 2 12 2 24z' fill='#1B1B1B'/>`)],
  art_wave: ['Great Wave magnet', 'art', 1500, card('#F2E6CC', `<path d='M10 46q8-26 26-24-12 4-8 16 6-10 16-6-10 0-8 10l18 4v6H10z' fill='#2F4E8C' ${o}/><path d='M24 26q4-2 8 0M30 24q4-2 6 1' stroke='#FFFFFF' stroke-width='1.6' fill='none'/><path d='M40 40l6-10 6 10z' fill='#D9D2C2' ${o}/>`)],
  art_mona: ['Mona Lisa magnet', 'art', 1500, tall('#6B5A3A', `<rect x='17' y='11' width='30' height='42' fill='#8C7A4E'/><ellipse cx='32' cy='26' rx='7' ry='9' fill='#E2C08E' ${o}/><path d='M24 24q8-14 16 0v22h-16z' fill='#3B2C24' opacity='.85'/><ellipse cx='32' cy='27' rx='5.5' ry='7.5' fill='#E2C08E'/><path d='M30 31q2 1 4 0' stroke='${INK}' stroke-width='1' fill='none'/><path d='M22 52q2-14 10-16 8 2 10 16z' fill='#3E3A2A'/>`)],
  art_pearl: ['Pearl Earring magnet', 'art', 1500, tall('#1E1E1E', `<ellipse cx='32' cy='32' rx='9' ry='11' fill='#E9C9A0' ${o}/><path d='M22 26q2-14 16-10 4 2 4 8-10-4-20 2z' fill='#2F6DB5' ${o}/><path d='M38 18q6 0 6 6-2 0-4-2z' fill='#F2D16B' ${o}/><circle cx='29' cy='42' r='2' fill='#F7F4EE' ${o}/><path d='M24 52q4-8 16-6 4 2 4 6z' fill='#C9A24A'/>`)],
  // kids' drawings
  draw_house: ['Kid’s drawing: our house', 'drawing', 300, card('#FFFFFF', `<path d='M20 46V32l10-9 10 9v14z' fill='none' stroke='#E5392B' stroke-width='2'/><path d='M27 46v-7h6v7' fill='none' stroke='#2F6DB5' stroke-width='2'/><circle cx='46' cy='20' r='5' fill='none' stroke='#F6B21A' stroke-width='2'/><path d='M46 11v-2M53 20h2M51 14l2-2' stroke='#F6B21A' stroke-width='2'/><path d='M12 48q20-3 40 0' stroke='#3F9A3A' stroke-width='2.4' fill='none'/>`, -5)],
  draw_family: ['Kid’s drawing: my family', 'drawing', 300, card('#FFFFFF', `${[[20, '#E5392B', 1], [30, '#2F6DB5', 1], [40, '#F28C28', .8], [48, '#9B59D0', .7]].map(([x, c, k]) => `<circle cx='${x}' cy='${28 + (1 - k) * 10}' r='${4 * k}' fill='none' stroke='${c}' stroke-width='1.8'/><path d='M${x} ${32 + (1 - k) * 10}v${10 * k}M${x - 4 * k} ${36 + (1 - k) * 10}h${8 * k}M${x} ${42}l-3 6M${x} 42l3 6' stroke='${c}' stroke-width='1.8' fill='none'/>`).join('')}${word(32, 20, 'MY FAMLY', '#3B2C24', 5)}`, 4)],
  draw_rainbow: ['Kid’s drawing: rainbow', 'drawing', 300, card('#FFFFFF', `${['#E5392B', '#F28C28', '#F6D32B', '#3F9A3A', '#2F6DB5', '#9B59D0'].map((c, i) => `<path d='M${16 + i * 2} 44a${16 - i * 2} ${16 - i * 2} 0 0 1 ${32 - i * 4} 0' stroke='${c}' stroke-width='2' fill='none'/>`).join('')}<path d='M12 46q4-4 8 0q4-4 8 0M38 46q4-4 8 0q4-4 8 0' stroke='#9CC9E8' stroke-width='2' fill='none'/>`, 2)],
  draw_dino: ['Kid’s drawing: dinosaur', 'drawing', 300, card('#FFFFFF', `<path d='M14 44q4-12 14-12l6-10q8-2 10 4l-4 2-2 6q8 4 10 10z' fill='none' stroke='#3F9A3A' stroke-width='2'/><path d='M22 32l2-4 2 4 2-4 2 4' stroke='#F28C28' stroke-width='1.6' fill='none'/><circle cx='40' cy='24' r='1' fill='${INK}'/><path d='M20 44v4M34 44v4' stroke='#3F9A3A' stroke-width='2'/>`, -3)],
  // test scores
  test_aplus: ['A+ math test', 'test', 400, tall('#FFFFFF', `${lines(18, 22, 6, 22)}<circle cx='40' cy='18' r='7' fill='none' stroke='#E5392B' stroke-width='1.8'/>${word(40, 21, 'A+', '#E5392B', 8, 800)}<path d='M18 50l3 3 6-6' stroke='#E5392B' stroke-width='2' fill='none'/>`, 3)],
  test_100: ['100% spelling test', 'test', 400, tall('#FFFFFF', `${lines(18, 24, 6, 26)}${word(38, 19, '100%', '#E5392B', 8, 800)}<path d='M34 48l3-6 3 6-6-4h6z' fill='#F6C531' ${o}/>`, -4)],
  test_star: ['Gold star science quiz', 'test', 400, tall('#FFFFFF', `${lines(18, 26, 5, 26)}<path d='M32 10l3 7 7 .5-5.5 4.5 2 7-6.5-4-6.5 4 2-7-5.5-4.5 7-.5z' fill='#F6C531' ${o}/>${word(32, 54, 'GREAT JOB!', '#E5392B', 5)}`, 2)],
  // report cards
  rc_straighta: ['Straight A report card', 'report', 600, tall('#FFF8E6', `${word(32, 17, 'REPORT CARD', '#2F4058', 4.8)}${['Math', 'Reading', 'Science', 'Art'].map((t, i) => `${word(24, 27 + i * 7, t, '#5A5654', 4.4, 600)}${word(42, 27 + i * 7, 'A', '#E5392B', 5.4)}`).join('')}<path d='M18 20h28' stroke='#2F4058' stroke-width='1'/>`, -2)],
  rc_honor: ['Honor roll certificate', 'report', 600, card('#FFF4D6', `<rect x='13' y='15' width='38' height='34' rx='2' fill='none' stroke='#C9A227' stroke-width='1.6'/>${word(32, 26, 'HONOR ROLL', '#2F4058', 5.4)}${lines(20, 32, 2, 24)}<circle cx='44' cy='44' r='4.4' fill='#E5392B' ${o}/><path d='M42 47l-2 5M46 47l2 5' stroke='#E5392B' stroke-width='1.6'/>`, 3)],
  rc_attend: ['Perfect attendance award', 'report', 600, card('#F2F7FF', `${word(32, 24, 'PERFECT', '#2F6DB5', 6)}${word(32, 32, 'ATTENDANCE', '#2F6DB5', 5)}<path d='M24 40l3 5 3-3 2 3 2-3 3 3 3-5' stroke='#F6C531' stroke-width='2' fill='none'/>`, -3)],
  // wedding invitations
  wed_classic: ['Wedding invitation (classic)', 'wedding', 700, tall('#FFFDF8', `<path d='M20 14h24M20 50h24' stroke='#C9A227' stroke-width='1.2'/>${word(32, 26, 'Together', '#8A6420', 5.4, 600)}${word(32, 33, 'with their families', '#8A6420', 3.4, 400)}<circle cx='29' cy='42' r='3.4' fill='none' stroke='#C9A227' stroke-width='1.4'/><circle cx='34' cy='42' r='3.4' fill='none' stroke='#C9A227' stroke-width='1.4'/>`, 2)],
  wed_floral: ['Wedding invitation (floral)', 'wedding', 700, tall('#FFF6F4', `${[[18, 13], [46, 51], [44, 14]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='4' fill='#F2A2B2' ${o}/><circle cx='${x}' cy='${y}' r='1.4' fill='#F6D35B'/>`).join('')}${word(32, 30, 'Save the', '#B5452B', 5.4)}${word(32, 38, 'Date', '#B5452B', 7)}`, -3)],
  wed_beach: ['Wedding invitation (beach)', 'wedding', 700, tall('#E8F6FB', `<path d='M14 44h36v12H14z' fill='#F2DFA6'/><path d='M14 44q9-4 18 0t18 0' stroke='#3E8FC2' stroke-width='2' fill='none'/>${word(32, 24, 'We do!', '#2F6DB5', 7)}<path d='M40 44q-2-8 0-12M40 32q-4 0-6 2M40 32q4-1 6 2' stroke='#3F7F25' stroke-width='1.6' fill='none'/>`, 4)],
  // Christmas cards
  xmas_tree: ['Christmas card (tree)', 'xmas', 500, tall('#C8352F', `<path d='M32 14l12 18h-6l8 12H18l8-12h-6z' fill='#2E8A3E' ${O}/><rect x='29' y='44' width='6' height='5' fill='#8A5A34' ${o}/><path d='M32 10l1.6 3.4 3.6.3-2.8 2.3.9 3.6-3.3-2-3.3 2 .9-3.6-2.8-2.3 3.6-.3z' fill='#F6C531'/>${[[28, 28], [36, 34], [26, 40], [38, 41]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.6' fill='#F6C531'/>`).join('')}${word(32, 54, 'Merry Christmas', '#FFFFFF', 4)}`, -2)],
  xmas_snowman: ['Christmas card (snowman)', 'xmas', 500, tall('#2F6DB5', `<circle cx='32' cy='42' r='9' fill='#FFFFFF' ${o}/><circle cx='32' cy='27' r='6.4' fill='#FFFFFF' ${o}/><path d='M26 21h12v-6h-12z' fill='#2E2A2A' ${o}/><path d='M32 28l5 1-5 1z' fill='#F28C28'/><path d='M27 33q5 3 10 0' stroke='#C8352F' stroke-width='2.4' fill='none'/>${[[18, 14], [44, 16], [20, 30], [46, 34], [22, 50]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.2' fill='#FFFFFF'/>`).join('')}`, 3)],
  xmas_reindeer: ['Christmas card (reindeer)', 'xmas', 500, tall('#2E8A3E', `<ellipse cx='32' cy='34' rx='9' ry='10' fill='#A0672E' ${o}/><path d='M26 26q-6-8-4-14M24 18l-4-2M38 26q6-8 4-14M40 18l4-2' stroke='#6B4226' stroke-width='2' fill='none'/><circle cx='32' cy='42' r='3' fill='#E5392B'/><circle cx='28' cy='32' r='1.4' fill='${INK}'/><circle cx='36' cy='32' r='1.4' fill='${INK}'/>${word(32, 54, 'Happy Holidays', '#FFFFFF', 4)}`, -4)],
  // the cool ones
  cool_disco: ['Disco ball', 'cool', 2500, `<path d='M32 6v8' stroke='${INK}' stroke-width='1.6'/><circle cx='32' cy='34' r='20' fill='#C9CDD2' ${O}/>${Array.from({ length: 6 }, (_, r) => Array.from({ length: 8 }, (_, k) => `<rect x='${14 + k * 4.6}' y='${18 + r * 5.4}' width='4' height='4.6' fill='${(r + k) % 3 ? '#E8ECF0' : '#9FB7FF'}' opacity='.9'/>`).join('')).join('')}<circle cx='32' cy='34' r='20' fill='none' ${O}/><path d='M50 14l2-4 2 4-4-2h4zM12 18l2-4 2 4-4-2h4z' fill='#F6C531'/>`],
  cool_goldbar: ['Gold bar', 'cool', 5000, `<path d='M10 44l8-16h28l8 16z' fill='#E0A93B' ${O}/><path d='M18 28l4-6h20l4 6z' fill='#F6D35B' ${O}/>${word(32, 41, '999.9', '#8A6420', 6)}<path d='M48 16l2-4 2 4-4-2h4z' fill='#FFF2B0'/>`],
  cool_planet: ['Glow-in-the-dark planet', 'cool', 2000, `<circle cx='32' cy='32' r='15' fill='#8FE3A6' ${O}/><ellipse cx='32' cy='32' rx='26' ry='7' fill='none' stroke='${INK}' stroke-width='4' transform='rotate(-18 32 32)'/><ellipse cx='32' cy='32' rx='26' ry='7' fill='none' stroke='#C6F7D2' stroke-width='2.2' transform='rotate(-18 32 32)'/><circle cx='26' cy='28' r='3' fill='#6CCB86'/><circle cx='37' cy='36' r='2' fill='#6CCB86'/>`],
  cool_lavalamp: ['Lava lamp', 'cool', 1800, `<path d='M24 50l4-36h8l4 36z' fill='#B57CFF' ${O}/><ellipse cx='31' cy='24' rx='3' ry='4' fill='#FF8A3D'/><ellipse cx='34' cy='36' rx='4' ry='5' fill='#FF8A3D'/><path d='M22 50h20l-2 8H24z' fill='#C9CDD2' ${O}/><path d='M26 14h12l-2-6h-8z' fill='#C9CDD2' ${O}/>`],
  cool_pizza: ['Pizza slice', 'cool', 600, `<path d='M12 14q20-8 40 0L32 56z' fill='#F2C14E' ${O}/><path d='M12 14q20-8 40 0' stroke='#C98A3A' stroke-width='5' fill='none'/>${[[26, 22], [38, 22], [32, 34], [30, 44]].map(([x, y]) => `<circle cx='${x}' cy='${y}' r='3.4' fill='#C8352F' ${o}/>`).join('')}`],
  cool_orange: ['Florida orange', 'cool', 400, `<circle cx='32' cy='36' r='18' fill='#F28C28' ${O}/><path d='M32 18q2-8 10-8-2 8-10 8z' fill='#4E9A3A' ${O}/>${word(32, 40, 'FLORIDA', '#FFFFFF', 6.4)}`],
  cool_vinyl: ['Vinyl record', 'cool', 1200, `<circle cx='32' cy='32' r='22' fill='#1E1E1E' ${O}/><circle cx='32' cy='32' r='16' fill='none' stroke='#3A3A3A' stroke-width='1'/><circle cx='32' cy='32' r='12' fill='none' stroke='#3A3A3A' stroke-width='1'/><circle cx='32' cy='32' r='7' fill='#E5392B' ${o}/><circle cx='32' cy='32' r='1.4' fill='#FFFFFF'/>`]
};

const rows = (txt, re) => [...txt.matchAll(re)].map((m) => m.slice(1));
const DOG_RE = /([A-Z][^|\n]*?)\|([PFLRBT])\|([sml])\|(\w+)\|(\w+)\|([nbmtspd])\|([sfcwl])(?=\s|$)/g;
const CAT_RE = /([A-Z][^|\n]*?)\|([NFBCTS])\|([slhc])\|(\w+)\|(\w+)\|([ntpcxbs])\|(#[0-9A-Fa-f]{6})/g;
const slug = (n) => n.toLowerCase().replace(/\([^)]*\)/g, (m) => m.replace(/[()]/g, '')).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30);
export const ANIMAL_PRICE = 500;
const big = (b, k = 1.3) => `<g transform='translate(32 33) scale(${k}) translate(-32 -33)'>${b}</g>`;
// id → { name, group, price, body }
export const MAGNETS = {};
for (const d of rows(DOG, DOG_RE)) MAGNETS[`md_${slug(d[0])}`] = { name: d[0], group: 'dog', price: ANIMAL_PRICE, body: () => big(dog(['', ...d.slice(1)])) };
for (const c of rows(CAT, CAT_RE)) MAGNETS[`mc_${slug(c[0])}`] = { name: c[0], group: 'cat', price: ANIMAL_PRICE, body: () => big(cat(['', ...c.slice(1)])) };
for (const [id, [name, body]] of Object.entries(PETS)) MAGNETS[`mp_${id.slice(4)}`] = { name, group: 'pet', price: ANIMAL_PRICE, body: () => big(body, 1.15) };
for (const [id, [name, group, price, body]] of Object.entries(OTHER)) MAGNETS[`mm_${id}`] = { name, group, price, body: () => body };

const memo = new Map();
export function magnetSvg(id) {
  const m = MAGNETS[id]; if (!m) return '';
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='-6 -6 76 76'><defs><filter id='k' x='-20%' y='-20%' width='140%' height='140%'><feMorphology in='SourceAlpha' operator='dilate' radius='3.2' result='d'/><feFlood flood-color='#FFFFFF'/><feComposite in2='d' operator='in' result='w'/><feOffset in='d' dy='2' result='o'/><feFlood flood-color='#3B2C24' flood-opacity='.28'/><feComposite in2='o' operator='in' result='sh'/><feMerge><feMergeNode in='sh'/><feMergeNode in='w'/><feMergeNode in='SourceGraphic'/></feMerge></filter></defs><g filter='url(#k)'>${m.body()}</g></svg>`;
}
export function magnetUrl(id) { let u = memo.get(id); if (!u) { u = `data:image/svg+xml,${encodeURIComponent(magnetSvg(id))}`; memo.set(id, u); } return u; }
// SQL rows for the shop (scripts/magnets-sql)
export const magnetRows = () => Object.entries(MAGNETS).map(([id, m], i) => [id, m.name, m.price, 200 + i, m.group]);
