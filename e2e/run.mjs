// End-to-end walk through every screen against e2e/mock-supabase.mjs.
//   1. node e2e/mock-supabase.mjs &
//   2. NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-mock NEXT_PUBLIC_SITE_URL=http://localhost:3000 npx next build
//   3. ANTHROPIC_API_KEY=mock ANTHROPIC_BASE_URL=http://localhost:54321/anthropic npx next start -p 3000 &
//   4. node e2e/run.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // dev-only; resolved from NODE_PATH or a local install

const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SHOTS = process.argv[2] || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

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

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('response', (r) => { if (r.status() >= 400 && !/api\/barcode/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${n}.png`), fullPage: true }); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, e.message.split('\n')[0]); await shot(`fail-${name.replace(/\W+/g, '-')}`); } };
const nav = (n) => page.getByRole('navigation').getByRole('link', { name: n, exact: true }).click();
const closePopups = async () => { await page.locator('.popup-scrim').first().waitFor({ timeout: 3000 }).catch(() => {}); for (let i = 0; i < 4; i++) { const x = page.locator('.popup-scrim [aria-label=Close]').first(); const leave = page.locator('.popup-scrim').getByRole('button', { name: 'Leave' }).first(); if (await x.count()) await x.click(); else if (await leave.count()) await leave.click(); else break; await page.waitForTimeout(400); } };

await step('signed-out redirect', async () => { await page.goto(`${BASE}/home`); check('signed-out /home redirects to /login', page.url().includes('/login')); });
await step('log in', async () => {
  await page.fill('#email', 'cook@whisk.test'); await page.fill('#password', 'whisk-e2e-pass');
  await page.click('button[type=submit]'); await page.waitForURL('**/home', { timeout: 15000 });
  check('log in lands on /home', true);
  await page.waitForTimeout(1500); await closePopups();
});
await step('home', async () => {
  await page.getByRole('heading', { name: 'Almost ready' }).waitFor();
  check('home shows Almost ready', true);
  check('home has no challenges or Fridge Raid', (await page.getByText('This week’s challenges').count()) === 0 && (await page.getByText('Fridge Raid').count()) === 0);
  await page.getByText('Ground beef is frozen').waitFor();
  check('home reminds you to defrost frozen ground beef', true);
  await page.locator('.src a').first().waitFor();
  check('almost-ready recipes link to their source site', /^https:\/\//.test(await page.locator('.src a').first().getAttribute('href')));
  await shot('01-home');
});
await step('pantry draft is remembered', async () => {
  await nav('Pantry');
  await page.fill('#p-name', 'Frozen pork chops'); await page.waitForTimeout(1600);
  await page.reload(); await page.waitForTimeout(1500); await closePopups();
  check('reload returns to the Pantry tab', page.url().includes('/pantry'), page.url());
  check('half-typed item survives a reload', (await page.inputValue('#p-name')) === 'Frozen pork chops');
  await page.click('text=Add to pantry');
  await page.getByText('frozen meat, remember to defrost').waitFor();
  check('frozen meat is detected from the name (auto category)', true);
  await page.getByRole('button', { name: /Frozen meat · tap to start thawing/ }).first().click();
  await page.getByText(/is thawing in the fridge/).waitFor();
  check('start thawing from the pantry', true);
  await shot('02-pantry');
});
await step('cook', async () => {
  await nav('Cook');
  await page.click('text=What can I make?');
  await page.getByText(/recipes? you can make/).waitFor();
  const n = await page.locator('main button.card:has(.chip.have)').count();
  check('cook shows web recipes the pantry can make', n >= 5, `${n} recipes`);
  check('cook shows unlimited pantry searches', (await page.locator('.links a[href^="https://www.google.com/search"]').count()) >= 6);
  await page.click('text=Show more ideas');
  check('Show more ideas adds more searches', (await page.locator('.links a[href^="https://www.google.com/search"]').count()) >= 12);
  await page.click('text=Fridge Raid (surprise me)');
  await page.getByText('Fridge Raid · your hand').waitFor();
  check('Fridge Raid deals 4 pantry items', (await page.locator('.grid2 .card').count()) === 4);
  await page.click('text=What can I make?');
  await page.getByRole('button', { name: /Poor Man's Burrito Bowls/ }).click();
  await page.getByText('Recipe from').waitFor();
  check('recipe sheet links to Budget Bytes', (await page.locator('[role=dialog] .src a').first().getAttribute('href')).includes('budgetbytes.com'));
  await page.click('[role=dialog] >> text=Save · +5 XP');
  await page.getByText(/Saved to your cookbook/).waitFor();
  await page.click('[role=dialog] >> text=I cooked it');
  await page.locator('[aria-label="Log a meal"] input[type=file]').setInputFiles(photo);
  await page.click('text=Submit');
  await page.getByRole('heading', { name: 'Cooked it!' }).waitFor({ timeout: 15000 });
  check('submit photo → "Cooked it!" popup', true);
  await page.click('[aria-label="Liked it"]'); await page.waitForTimeout(500);
  await shot('03-cooked');
  await page.click('[role=dialog] >> text=Leave');
  await page.waitForTimeout(600); await closePopups();
  await page.getByText('Your saved recipes').scrollIntoViewIfNeeded();
  await page.click('button.chip:has-text("Liked")');
  check('liked meal shows in saved recipes', (await page.locator('[aria-label=Liked]').count()) >= 1);
});
await step('compete', async () => {
  await nav('Compete');
  await page.getByText('Daily quest').waitFor();
  await page.locator('.flip .face').first().waitFor({ timeout: 15000 });
  const cards = await page.locator('.flip').count();
  check('3 challenges picked from your pantry', cards === 3, `${cards}`);
  await page.locator('.flip .face').first().click(); await page.waitForTimeout(700);
  check('tap flips the card to instructions', (await page.locator('.flip.on').count()) === 1);
  await shot('04-flip');
  await page.locator('.flip.on >> text=Tap to add photo & complete').click();
  await page.locator('[aria-label="Log a meal"] input[type=file]').setInputFiles(photo);
  await page.click('text=Submit');
  await page.getByRole('heading', { name: 'Cooked it!' }).waitFor({ timeout: 15000 });
  await page.click('[role=dialog] >> text=Leave'); await page.waitForTimeout(600); await closePopups();
  await page.getByText('Done · coins added').waitFor();
  check('completing a challenge pays coins', true);
  check('shop uses outline slot icons', (await page.locator('.slotbar [role=tab]').count()) === 5);
});
await step('me', async () => {
  await nav('Me');
  await page.getByText('Cuisine passport').waitFor();
  check('no pose buttons on Me', (await page.getByRole('button', { name: 'We’re so back!' }).count()) === 0);
  check('closet slots are outline icons', (await page.locator('.slotbar [role=tab] svg').count()) === 5);
  check('passport sticker unlocked for Mexican', await page.locator('[aria-label="Mexican, stamped"]').isVisible());
  check('passport stickers greyed out until cooked', (await page.locator('.sticker.off').count()) >= 15);
  await page.click('[aria-label^="Edit name"]'); await page.fill('#nm', 'Chef J ✨ #1'); await page.press('#nm', 'Enter');
  await page.getByRole('heading', { name: 'Chef J ✨ #1' }).waitFor();
  check('name can be any characters', true);
  await page.getByText('Last played on').waitFor();
  check('Me shows last device played', true);
  await shot('05-me');
});
await step('reload keeps everything', async () => {
  await page.goto(`${BASE}/home`); await page.waitForTimeout(1800); await closePopups();
  check('app reopens on the last tab', page.url().includes('/me'), page.url());
  check('name persisted', await page.getByRole('heading', { name: 'Chef J ✨ #1' }).isVisible());
});
await step('no-store', async () => { const r = await page.request.get(`${BASE}/home`); check('signed-in pages are Cache-Control no-store', /no-store/.test(r.headers()['cache-control'] || '')); });

const csp = problems.filter((p) => /Content Security Policy|Refused to/.test(p));
check('no CSP violations', csp.length === 0, csp.slice(0, 3).join(' | '));
const other = problems.filter((p) => !csp.includes(p));
check('no page errors or failed requests', other.length === 0, other.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
