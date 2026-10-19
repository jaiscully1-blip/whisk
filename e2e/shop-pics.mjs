// Opens the Kitchen shop on a fresh guest and reports any tile picture that hasn't painted (naturalWidth 0) per section.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await page.locator(sel).count()) await page.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await page.waitForTimeout(150); } };
await page.goto(`${BASE}/login`);
await page.getByRole('radio', { name: 'Accept' }).click();
await page.getByRole('button', { name: 'Start playing' }).click(); await page.waitForURL('**/cook', { timeout: 20000 });
await page.waitForTimeout(1200); await sweep();
await page.locator('.nav a[href="/pantry"]').click({ force: true }); await page.waitForURL('**/pantry'); await sweep();
await page.getByTestId('kitchen-btn').click(); await sweep(); await page.getByTestId('kt-shop').click(); await page.waitForTimeout(800); await sweep();
const tabs = await page.locator('.kd-cat').allTextContents();
for (let i = 0; i < tabs.length; i++) {
  await page.locator('.kd-cat').nth(i).click(); await page.waitForTimeout(250);
  const r = await page.$$eval('.shop-grid .tile', (ts) => ts.map((t) => { const im = t.querySelector('img'); return [t.querySelector('.tname')?.textContent, im ? (im.complete ? im.naturalWidth : 'loading') : 'noimg', im?.getBoundingClientRect().width]; }));
  const bad = r.filter(([, w]) => w === 0 || w === 'loading');
  console.log(tabs[i], r.length, 'tiles; not painted:', JSON.stringify(bad));
  if (OUT) await page.screenshot({ path: `${OUT}/shop-${i}.png` });
}
await b.close();
