import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")', '.popup-scrim button']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(2000); await sweep();
if (await p.locator('.lv-opt').count()) { await p.locator('.lv-opt').first().click(); await p.waitForTimeout(600); } await sweep();
const sql = (q) => fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent(q)).then((r) => r.text());
const U = "(select id from public.profiles order by created_at desc limit 1)";
await sql(`insert into public.saved_recipes (user_id, recipe_id) values (${U}, 'w-in-falooda')`);
await sql(`delete from public.pantry_items where user_id = ${U}`);
await sql(`insert into public.pantry_items (user_id, name, category, quantity) values (${U},'cold whole milk','Dairy & Eggs','1 gallon'),(${U},'rose syrup','Sauces & Oils','1 cup'),(${U},'falooda sev (vermicelli)','Carbs & Grains','0.25 cup'),(${U},'sabja (basil) seeds','Other','4 tbsp'),(${U},'vanilla ice cream','Frozen','6'),(${U},'chopped pistachios','Other','1 cup'),(${U},'water','Other',null)`);
await p.reload(); await p.waitForTimeout(2500); await sweep();
for (const n of [0, 1, 2]) { await p.locator('.fy-row > *').nth(n).click().catch(() => {}); await p.waitForTimeout(900); await p.locator('[aria-label="Close"]').first().click().catch(() => {}); await p.waitForTimeout(500); }
await p.getByTestId('saved-chip').click(); await p.waitForTimeout(1500); await sweep();
await p.getByText('Falooda').first().click(); await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/mk/dbg.png' });
await p.screenshot({ path: '/tmp/mk/dbg.png' }); console.log((await p.locator('button').allInnerTexts()).filter((t) => /cook|log/i.test(t)));
await p.getByRole('button', { name: /i cooked it/i }).first().click({ timeout: 4000 }); await p.waitForTimeout(800);
ok('tiles shown', await p.getByTestId('lm-recent').count() >= 1);
ok('first selected', await p.getByTestId('lm-recent').first().getAttribute('aria-pressed') === 'true');
await p.screenshot({ path: '/tmp/mk/which.png' });
if (await p.getByTestId('lm-recent').count() > 1) { await p.getByTestId('lm-recent').nth(1).click(); ok('second selected', await p.getByTestId('lm-recent').nth(1).getAttribute('aria-pressed') === 'true'); }
await b.close();
