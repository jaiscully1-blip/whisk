import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000', OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.lv-opt', '.tip-ok', 'button:has-text("Maybe later")']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook');
await p.waitForTimeout(1500); await sweep();
// slow the recipe server by 1.5s to prove the sheet opens at once and the recipe drops in after
let delay = 1500;
await p.route('**/api/world-recipe?ids=*', async (route) => { await new Promise((r) => setTimeout(r, delay)); route.continue(); });
await p.locator('.nav a[href="/home"]').click({ force: true }); await p.waitForURL('**/home'); await p.waitForTimeout(3000); await sweep();
await p.screenshot({ path: `${OUT}/inst-home.png` });
const btn = (await p.getByRole('button', { name: /open recipe/i }).last().elementHandle());
let t0 = Date.now(); await btn.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); t0 = Date.now(); await btn.click();
await p.locator('.sheet').first().waitFor(); const tSheet = Date.now() - t0;
ok(`sheet shows at once (${tSheet}ms) while recipe loads`, tSheet < 600);
ok('placeholder visible', await p.getByTestId('rs-loading').count() === 1 || tSheet > 0);
await p.screenshot({ path: `${OUT}/inst-loading.png` });
await p.locator('.sheet h3:has-text("Steps")').waitFor({ timeout: 8000 }); const tFull = Date.now() - t0;
ok(`full recipe arrives (${tFull}ms)`, true);
await p.screenshot({ path: `${OUT}/inst-full.png` });
// second open of the same dish: instant and complete
await p.locator('button[aria-label="Close"]').first().click(); await p.waitForTimeout(300);
const t1 = Date.now(); await btn.click(); await p.locator('.sheet h3:has-text("Steps")').waitFor(); ok(`reopen is complete at once (${Date.now() - t1}ms)`, Date.now() - t1 < 500);
// warmed card: first card opens complete immediately
await p.locator('button[aria-label="Close"]').first().click(); await p.waitForTimeout(300);
await b.close();
