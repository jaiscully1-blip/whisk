import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000', OUT = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook');
await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/fresh-cook-0.png` }); await sweep();
await p.screenshot({ path: `${OUT}/fresh-cook-1.png`, fullPage: false });
for (const t of ['home','pantry','compete','me']) { await p.locator('.nav a[href="/'+t+'"]').click({ force: true }); await p.waitForTimeout(2500); await sweep(); await p.screenshot({ path: OUT+'/fresh-'+t+'.png' }); console.log('==',t,(await p.locator('main').innerText()).replace(/\n+/g,' | ').slice(0,700)); }
await b.close();
