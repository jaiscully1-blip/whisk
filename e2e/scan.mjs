// Live barcode scanner, end to end, with a fake camera that shows real barcodes:
// a UPC-A can of black beans (012345678905) for 3 s, then an EAN-13 the product list doesn't know (4006381333931) for 3 s.
// Headless Chromium on Linux has no built-in barcode reader, so this runs the same open-source reader iPhones get.
// Usage: node e2e/scan.mjs <path to cam.y4m>   (app on :3000, mock on :54321, started by the e2e startup script)
import { chromium } from 'playwright';

const cam = process.argv[2];
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(ok ? 'PASS' : 'FAIL', name, detail); };
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${cam}`] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'] });
const page = await ctx.newPage(); page.setDefaultTimeout(12000);
const errors = []; page.on('pageerror', (e) => errors.push(e.message));
const blocked = []; page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) blocked.push(m.text().slice(0, 160)); });
const wasm = []; page.on('response', (r) => { if (r.url().endsWith('.wasm')) wasm.push(`${r.status()} ${new URL(r.url()).pathname}`); });

try {
  await page.goto('http://localhost:3000/login'); await page.getByRole('radio', { name: 'Accept' }).click(); await page.getByRole('button', { name: 'Start playing' }).click();
  await page.waitForURL('**/cook'); await page.locator('.coach-bubble button', { hasText: 'Skip' }).click().catch(() => {});
  await page.getByRole('navigation').getByRole('link', { name: 'Pantry', exact: true }).click(); await page.waitForURL('**/pantry');
  await page.getByRole('button', { name: 'Scan barcode' }).click();
  await page.locator('.scanbox.live').waitFor();
  check('camera starts live, no photo to take', (await page.locator('.scanbox video').evaluate((v) => v.videoWidth > 0)) && (await page.locator('input[type=file]').count()) === 0);

  const t0 = Date.now();
  await page.locator('.scan-item input[aria-label="Item name"]').first().waitFor({ timeout: 15000 });
  await page.waitForFunction(() => [...document.querySelectorAll('.scan-item input[aria-label="Item name"]')].some((i) => i.value === 'Black Beans'), null, { timeout: 15000 });
  check('a US UPC barcode is read live and found (Black Beans, Canned & Jarred)', (await page.locator('.scan-item', { has: page.locator('input[aria-label="Item name"][value="Black Beans"]') }).locator('select').inputValue()) === 'Canned & Jarred', `${Date.now() - t0} ms`);
  check('brand and size shown under the name', /Goya · 15\.5 oz/.test(await page.locator('.scan-item').first().innerText()));
  check('the reader is served by Whisk itself, CSP allows it', (wasm.length === 0 || wasm.every((w) => /^200 \/zxing\/zxing_reader\.wasm$/.test(w))) && blocked.length === 0, JSON.stringify({ wasm, blocked }));

  // second barcode (unknown) appears after the first leaves the frame
  await page.locator('.scan-item input[placeholder^="New product"]').waitFor({ timeout: 15000 });
  check('holding an item in view adds it once (no ×2 from one showing)', !/×2/.test(await page.locator('.scan-tray').innerText()));
  check('an unknown product asks for a name', (await page.locator('.scan-item', { hasText: 'Not in the product list yet' }).count()) === 1);
  check('Add button counts only named items', /Add 1 to pantry/.test(await page.locator('.sheet .btn.wide').first().innerText()));
  await page.locator('.scan-item input[placeholder^="New product"]').fill('Fancy Pickles');
  await page.locator('.scan-item', { has: page.locator('input[aria-label="Item name"][value="Fancy Pickles"]') }).locator('select').selectOption('Canned & Jarred');
  await page.getByRole('button', { name: 'Add 2 to pantry' }).click();
  await page.locator('.scrim').waitFor({ state: 'detached' });
  const pantryText = await page.locator('main').innerText();
  check('both land in the pantry', /Black Beans/.test(pantryText) && /Fancy Pickles/.test(pantryText));
  check('camera is switched off after closing', await page.evaluate(() => !document.querySelector('.scanbox')));

  // reopen: the named barcode is remembered (no product-list call for it)
  const before = await (await fetch('http://localhost:54321/__e2e/off-calls')).json();
  await page.getByRole('button', { name: 'Scan barcode' }).click(); await page.locator('.scanbox.live').waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.scan-item input[aria-label="Item name"]')].some((i) => i.value === 'Fancy Pickles'), null, { timeout: 15000 });
  const after = await (await fetch('http://localhost:54321/__e2e/off-calls')).json();
  check('a barcode you named is remembered next time', after.filter((c) => c.endsWith('4006381333931')).length === before.filter((c) => c.endsWith('4006381333931')).length);

  // typing the numbers works too
  await page.getByPlaceholder('Or type the numbers').fill('0012345678905'); await page.locator('form:has(#bc-typed) button[type=submit]').click();
  await page.waitForFunction(() => [...document.querySelectorAll('.scan-item input[aria-label="Item name"]')].some((i) => i.value === 'Black Beans'));
  check('typing the barcode number works', true);
  await page.getByRole('button', { name: 'Close' }).click();
  check('no page errors', errors.length === 0, errors.join(' | '));
} catch (e) { check('scanner flow', false, e.message.split('\n')[0]); await page.screenshot({ path: '/tmp/scan-fail.png' }); }
await browser.close();
console.log(`\n${results.filter(Boolean).length}/${results.length} passed`);
process.exit(results.every(Boolean) ? 0 : 1);
