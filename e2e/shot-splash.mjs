import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000', OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook');
await p.waitForTimeout(1500); for (const s of ['.lv-opt', '.tip-ok']) if (await p.locator(s).count()) await p.locator(s).first().click({ timeout: 1500 }).catch(() => {});
// a cold open of the app
const t0 = Date.now();
await p.goto(`${BASE}/home`, { waitUntil: 'commit' });
await p.waitForSelector('.splash', { timeout: 5000 });
ok('splash shows on a cold open', await p.locator('.splash').isVisible());
await p.screenshot({ path: `${OUT}/splash-on.png` });
await p.waitForSelector('.splash', { state: 'detached', timeout: 8000 });
const ms = Date.now() - t0;
ok(`splash gone once ready (${ms} ms)`, ms < 6500);
ok('app is visible underneath', await p.locator('.nav').isVisible());
await p.screenshot({ path: `${OUT}/splash-off.png` });
// moving between tabs never brings it back
await p.locator('.nav a[href="/pantry"]').click({ force: true }); await p.waitForURL('**/pantry'); await p.waitForTimeout(400);
ok('no splash on tab switches', (await p.locator('.splash').count()) === 0);
await b.close();
