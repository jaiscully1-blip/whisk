// Draws every fridge magnet / sticker / pet / dog / cat to a sharp 304px PNG (public/magnets/<id>.png).
// The shop art is an SVG with a soft-outline filter; iPhones draw such filters tiny and stretch them (blurry), so the app uses these PNGs.
//   NODE_PATH=$(npm root -g) node tools/render-magnets.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { MAGNETS, magnetSvg } from '../lib/art/magnets.js';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = new URL('../public/magnets/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
let n = 0;
for (const id of Object.keys(MAGNETS)) {
  const svg = magnetSvg(id);
  await page.setContent(`<body style="margin:0;background:transparent"><img id=m width=304 height=304 src="data:image/svg+xml,${encodeURIComponent(svg)}"></body>`);
  await page.waitForFunction(() => document.getElementById('m').complete);
  await (await page.$('#m')).screenshot({ path: `${OUT}${id}.png`, omitBackground: true });
  n++;
}
await b.close();
console.log('rendered', n);
