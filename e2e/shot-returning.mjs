import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(1500);
// pretend this player used the OLD Cook: a saved mode and filters, no cookV2 flag
await fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent(`update public.profiles set ui_state = '{"cookMode":"pantry","cookTime":"30"}'::jsonb`));
await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2500); await sweep();
console.log('new Cook home shown to a returning player:', (await p.getByTestId('todays-picks').count()) === 1, '| old filters hidden:', (await p.locator('.cook-filters').count()) === 0);
await b.close();
