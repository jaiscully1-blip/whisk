import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
p.on('dialog', (d) => { console.log('confirm:', d.message()); d.accept(); });
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook');
await p.waitForTimeout(1500); await p.mouse.click(5, 400);
for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); }
await p.locator('.nav a[href="/me"]').click({ force: true }); await p.waitForURL('**/me');
await p.locator('[aria-label*="ettings"], [data-testid*="settings"]').first().click({ timeout: 4000 }).catch(() => {});
await p.waitForTimeout(800);
console.log('delete btn:', await p.getByRole('button', { name: 'Delete my data' }).count(), 'logout btn:', await p.getByTestId('log-out').count());
await p.getByTestId('log-out').scrollIntoViewIfNeeded(); await p.screenshot({ path: '/tmp/claude-0/-home-claude/6bb577e2-c35f-5f43-b799-a80300d9602a/scratchpad/logout-real.png' }); await p.getByTestId('log-out').click(); await p.waitForURL('**/login', { timeout: 15000 });
await p.goto(`${BASE}/me`); console.log('after:', p.url());
await b.close();
