// Screenshots of the pantry aisle sheet, the barcode field and the party card, on a fresh guest account.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await page.locator(sel).count()) await page.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await page.waitForTimeout(200); } };
await page.goto(`${BASE}/login`);
await page.getByRole('radio', { name: 'Accept' }).click();
await page.getByRole('button', { name: 'Start playing' }).click(); await page.waitForURL('**/cook', { timeout: 20000 });
await page.waitForTimeout(1500); await sweep();
await page.locator('.nav a[href="/pantry"]').click({ force: true }); await page.waitForURL('**/pantry'); await page.waitForTimeout(1000); await sweep();
for (const n of ['Ground cumin', 'Olive oil', 'Romaine hearts']) { await sweep(); await page.fill('#p-name', n); await page.locator('[data-tour="add"]').click({ force: true }); await page.waitForTimeout(900); }
await sweep();
const chips = page.getByTestId('aisle-chip');
console.log('aisles:', JSON.stringify(await chips.evaluateAll((els) => els.map((e) => e.textContent.trim()))));
const cumin = page.locator('[data-testid=aisle-chip][aria-label*="Ground cumin"]');
console.log('cumin chips:', await cumin.count());
await cumin.first().scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'pantry-aisles.png') });
await cumin.first().click({ force: true }); await page.waitForTimeout(700);
console.log('sheet open:', await page.locator('.sheet[aria-label^="Move"]').count());
await page.screenshot({ path: path.join(OUT, 'pantry-move-sheet.png') });
await page.getByTestId('aisle-Spices & Seasonings').click({ force: true }).catch((e) => console.log('pick fail', String(e).slice(0, 80)));
await page.waitForTimeout(600); await sweep();
await cumin.first().scrollIntoViewIfNeeded().catch(() => {}); await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, 'pantry-after-move.png') });
// party card on Compete, in a fresh tab
for (let i = 0; i < 3; i++) { if (await page.locator('.scrim').count()) { await page.mouse.click(8, 200); await page.waitForTimeout(400); } }
await sweep(); await page.locator('.nav a[href="/compete"]').click({ force: true }); await page.waitForTimeout(2500); await sweep();
const p2 = page;
console.log('at', p2.url());
await p2.getByTestId('party-card').waitFor({ state: 'attached', timeout: 15000 }); await p2.getByTestId('party-card').scrollIntoViewIfNeeded(); await p2.waitForTimeout(600);
await p2.getByTestId('party-card').screenshot({ path: path.join(OUT, 'party-card.png') });
console.log('party anim:', await page.getByTestId('party-card').evaluate((el) => `${getComputedStyle(el).animationName} ${getComputedStyle(el).animationDuration}`));
console.log('scrollbar-width:', await page.evaluate(() => getComputedStyle(document.body).scrollbarWidth));

// barcode field: type the number and see it grouped with bars
await page.locator('.nav a[href="/pantry"]').click({ force: true }); await page.waitForTimeout(1500); await sweep();
await page.getByRole('button', { name: 'Scan barcode' }).click({ force: true }).catch(() => console.log('no scan button'));
await page.waitForTimeout(800);
await page.locator('.scan-type input').fill('0012345678905').catch(() => console.log('no scan-type input'));
await page.waitForTimeout(400);
await page.locator('.bc-field').first().screenshot({ path: path.join(OUT, 'barcode-field.png') }).catch((e) => console.log('bc fail', String(e).slice(0, 80)));
await b.close();
