// Buys the Dish disaster on a fresh guest (coins topped up through the mock) and screenshots the kitchen with it.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await page.locator(sel).count()) await page.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await page.waitForTimeout(150); } };
page.on('response', async (r) => { if (/kitchen_layouts/.test(r.url()) && r.request().method() !== 'GET') console.log('KL', r.request().method(), r.status(), (await r.text().catch(() => '')).slice(0, 300)); });
await page.goto(`${BASE}/login`);
await page.getByRole('radio', { name: 'Accept' }).click();
await page.getByRole('button', { name: 'Start playing' }).click(); await page.waitForURL('**/cook', { timeout: 20000 });
await page.waitForTimeout(1200); await sweep();
await fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent('update public.profiles set coins = 100000')).then((r) => r.text()).then((t) => console.log('coins:', t));
await page.reload(); await page.waitForTimeout(1500); await sweep();
await page.locator('.nav a[href="/pantry"]').click({ force: true }); await page.waitForURL('**/pantry'); await sweep();
await page.getByTestId('kitchen-btn').click(); await sweep();
await page.getByText('Use a starter').first().click({ timeout: 4000 }).catch(() => console.log('no starter prompt')); await page.waitForTimeout(1500); await sweep();
await page.getByTestId('kt-shop').click(); await page.waitForTimeout(800); await sweep();
const tile = page.locator('.shop-grid .tile').filter({ hasText: 'Dish disaster' });
console.log('tile count', await tile.count());
await tile.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${OUT}/mess-shop.png` });
await tile.click(); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/mess-sheet.png` });
await page.getByRole('button', { name: /buy|get it|50,000/i }).last().click({ timeout: 5000 }).catch((e) => console.log('buy click', e.message.slice(0, 80)));
await page.waitForTimeout(700); console.log('toast:', await page.locator('.toast').allTextContents()); await page.waitForTimeout(1800); await sweep(); await page.screenshot({ path: `${OUT}/mess-bought.png` });
for (const t of ['kt-design','kt-kitchen','kt-food']) { if (await page.getByTestId(t).count()) { await page.getByTestId(t).click().catch(() => {}); await page.waitForTimeout(1500); await sweep(); await page.screenshot({ path: `${OUT}/mess-${t}.png` }); } }
await b.close();
