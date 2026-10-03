// End-to-end walk through every screen against e2e/mock-supabase.mjs.
//   1. node e2e/mock-supabase.mjs &
//   2. NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-mock NEXT_PUBLIC_SITE_URL=http://localhost:3000 npx next build
//   3. ANTHROPIC_API_KEY=mock ANTHROPIC_BASE_URL=http://localhost:54321/anthropic npx next start -p 3000 &
//   4. node e2e/run.mjs [screenshot-dir]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // dev-only; resolved from NODE_PATH or a local install
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SHOTS = process.argv[2] || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

// A small solid-colour PNG to stand in for a plate / receipt photo.
function png(w = 64, h = 64) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 230; raw[o + 1] = 160 + (x % 40); raw[o + 2] = 80; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const photo = { name: 'plate.png', mimeType: 'image/png', buffer: png() };

const results = [];
const check = (name, ok, detail = '') => { results.push([ok ? 'PASS' : 'FAIL', name, detail]); console.log(ok ? 'PASS' : 'FAIL', name, detail); };
const problems = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('response', (r) => { if (r.status() >= 400 && !/api\/barcode/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${n}.png`), fullPage: true }); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, e.message.split('\n')[0]); await shot(`fail-${name.replace(/\W+/g, '-')}`); } };

await step('signed-out /home redirects to /login', async () => {
  await page.goto(`${BASE}/home`); check('signed-out /home redirects to /login', page.url().includes('/login'));
});
await step('log in', async () => {
  await page.fill('#email', 'cook@whisk.test'); await page.fill('#password', 'whisk-e2e-pass');
  await page.click('button[type=submit]');
  await page.waitForURL('**/home', { timeout: 15000 });
  check('log in lands on /home', true);
});
await step('home basics', async () => {
  await page.getByText('Daily quest').waitFor({ timeout: 10000 });
  check('home shows daily quest', true);
  check('home shows goal ring 0/4', await page.getByRole('img', { name: '0 of 4 meals this week' }).isVisible());
  await shot('01-home');
});

// ---------- Pantry ----------
await step('pantry add', async () => {
  await page.getByRole('navigation').getByRole('link', { name: 'Pantry', exact: true }).click();
  await page.fill('#p-name', 'Eggs'); await page.selectOption('#p-cat', 'Dairy & Eggs');
  await page.click('text=Add to pantry');
  await page.getByText('Added Eggs').waitFor();
  check('pantry: add item', true);
});
await step('receipt scan', async () => {
  await page.click('text=Scan receipt');
  await page.locator('[aria-label="Scan a receipt"] input[type=file]').setInputFiles(photo);
  await page.getByText('Mock Mart').waitFor({ timeout: 15000 });
  check('receipt: 3 items found', (await page.locator('[aria-label="Scan a receipt"] input[type=checkbox]').count()) === 3);
  await page.locator('[aria-label="Include Greek yogurt"]').uncheck();
  await shot('02-receipt');
  await page.click('text=Add 2 to pantry');
  await page.getByText('Added 2').waitFor();
  await page.getByText('Chicken thighs', { exact: true }).waitFor();
  const ch = await page.getByText('Chicken thighs', { exact: true }).count(), gy = await page.getByText('Greek yogurt', { exact: true }).count();
  check('receipt: adds checked items only', ch > 0 && gy === 0, `chicken=${ch} yogurt=${gy}`);
});
await step('barcode scan', async () => {
  await page.click('text=Scan barcode');
  await page.fill('#bc', '123');
  await page.click('text=Look up');
  check('barcode: rejects short codes', await page.getByText('Barcodes are 8 to 14 digits.').isVisible());
  await page.fill('#bc', '5000159484695'); await page.click('text=Look up');
  // Open Food Facts is unreachable from the test sandbox, so this checks the friendly error path.
  const msg = page.locator('[aria-label="Scan a barcode"] [role=alert]');
  await msg.waitFor({ timeout: 15000 });
  check('barcode: shows a friendly message when lookup fails or finds nothing', /Type the name|Product not found|unavailable/.test(await msg.innerText()), await msg.innerText());
  await page.click('[aria-label="Scan a barcode"] >> [aria-label=Close]');
});
await step('shopping list aisles', async () => {
  await page.click('role=tab[name=/Shopping list/]');
  await page.fill('#s-new', 'olive oil'); await page.press('#s-new', 'Enter');
  await page.fill('#s-new', 'Bell peppers'); await page.press('#s-new', 'Enter');
  await page.getByText('Sauces & Oils · 1').waitFor();
  await page.getByText('Produce · 1').waitFor();
  check('shopping list grouped by aisle (and fast typing keeps both items)', true);
  await shot('03-list');
  await page.click('[aria-label="Bought olive oil"]');
  await page.getByText('olive oil restocked').waitFor();
  check('bought → restocked', true);
});

// ---------- Cook ----------
await step('cook flow', async () => {
  await page.getByRole('navigation').getByRole('link', { name: 'Cook', exact: true }).click();
  await page.click('text=What can I make?');
  await page.getByText('Mock Pad Thai').waitFor({ timeout: 20000 });
  check('cook: recipe ideas load', true);
  await page.click('text=Mock Pad Thai');
  check('recipe shows nutrition', await page.getByText('~520 kcal · 32g protein').isVisible());
  await page.click('role=dialog >> text=Save');
  await page.getByText('Saved to your cookbook').waitFor();
  await shot('04-recipe');
  await page.click('role=dialog >> text=I cooked it');
  await page.locator('[aria-label="Log a meal"] input[type=file]').setInputFiles(photo);
  await page.click('text=Log it');
  await page.getByRole('heading', { name: 'Cooked it!' }).waitFor({ timeout: 15000 });
  check('log meal → "Cooked it!" popup', true);
  await shot('05-cooked');
  await page.click('[aria-label="Cooked it!"] >> [aria-label=Close]');
  await page.getByText('Level up!').waitFor({ timeout: 5000 });
  check('level-up shows after the popup', true);
  await shot('06-levelup');
  await page.click('[aria-label^="Level up"] >> [aria-label=Close]');
});

// ---------- Home again ----------
await step('home after cooking', async () => {
  await page.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }).click();
  await page.getByRole('img', { name: '1 of 4 meals this week' }).waitFor({ timeout: 10000 });
  check('goal ring counts the meal', true);
  check('money saved shows an estimate', await page.getByText(/saved vs takeout/).isVisible());
  await shot('07-home-after');
});

// ---------- Compete ----------
await step('compete bingo', async () => {
  await page.getByRole('navigation').getByRole('link', { name: 'Compete', exact: true }).click();
  await page.getByText('Cuisine bingo').waitFor({ timeout: 10000 });
  const cells = await page.locator('[role=gridcell]').count();
  check('bingo has 16 cells', cells === 16, String(cells));
  const thai = page.locator('[role=gridcell][aria-label^="Thai"]');
  if (await thai.count()) check('Thai cell marked after cooking Thai', (await thai.getAttribute('aria-label')).includes('cooked'));
  else check('bingo card without Thai shows 0/16', await page.getByText('0/16 cooked').isVisible());
  await shot('08-compete');
});

// ---------- Me ----------
await step('me', async () => {
  await page.getByRole('navigation').getByRole('link', { name: 'Me', exact: true }).click();
  await page.getByText('Cuisine passport').waitFor();
  await page.locator('[aria-label="Thai, stamped"]').waitFor();
  check('passport stamps Thai', true);
  check('macros show 520 kcal', await page.getByText('520', { exact: true }).isVisible());
  await page.click('[aria-label="More meals"]'); await page.click('text=Save >> nth=0');
  await page.getByText('Goal: 5 meals a week').waitFor();
  check('weekly goal saves', true);
  await page.fill('#takeout', '20'); await page.click('form:has(#takeout) >> text=Save');
  await page.getByText('Takeout price saved').waitFor();
  check('takeout price saves', true);
  await page.click('[aria-label="Night mode"]');
  check('night mode applies', (await page.evaluate(() => document.documentElement.className)) === 'theme-night');
  await shot('09-me-night');
  await page.click('[aria-label="Night mode"]');
  await page.click('text=Whisk Wrapped');
  await page.getByText('Signature dish').waitFor({ timeout: 10000 });
  check('wrapped: top cuisine Thai', await page.getByText('Thai', { exact: true }).isVisible());
  check('wrapped: saved estimate uses new takeout price ($15)', await page.getByText('~$15').isVisible());
  await shot('10-wrapped');
});
await step('reload keeps settings', async () => {
  await page.goto(`${BASE}/home`);
  await page.getByRole('img', { name: '1 of 5 meals this week' }).waitFor({ timeout: 10000 });
  check('weekly goal persisted after reload', true);
});
await step('authenticated pages are not cached', async () => {
  const r = await page.request.get(`${BASE}/home`);
  check('signed-in /home is Cache-Control no-store', /no-store/.test(r.headers()['cache-control'] || ''), r.headers()['cache-control']);
});

const csp = problems.filter((p) => /Content Security Policy|Refused to/.test(p));
check('no CSP violations', csp.length === 0, csp.slice(0, 3).join(' | '));
const other = problems.filter((p) => !csp.includes(p));
check('no page errors or failed requests', other.length === 0, other.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
