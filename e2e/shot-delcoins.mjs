import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")', '.popup-scrim button']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
const sql = (q) => fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent(q)).then((r) => r.json()).catch(() => ({}));
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(2000); await sweep();
if (await p.locator('.lv-opt').count()) { await p.locator('.lv-opt').first().click(); await p.waitForTimeout(600); } await sweep();
const U = "(select id from public.profiles order by created_at desc limit 1)";
await sql(`insert into public.saved_recipes (user_id, recipe_id) values (${U}, 'w-in-falooda')`);
await sql(`delete from public.pantry_items where user_id = ${U}`);
await sql(`insert into public.pantry_items (user_id, name, category, quantity) values (${U},'cold whole milk','Dairy & Eggs','1 gallon'),(${U},'rose syrup','Sauces & Oils','1 cup'),(${U},'falooda sev (vermicelli)','Carbs & Grains','0.25 cup'),(${U},'sabja (basil) seeds','Other','4 tbsp'),(${U},'vanilla ice cream','Frozen','6'),(${U},'chopped pistachios','Other','1 cup'),(${U},'water','Other',null)`);
await p.reload(); await p.waitForTimeout(2500); await sweep();
const bal = async () => (await sql(`select coins, xp from public.profiles where id = ${U}`)).rows?.[0];
const open = async () => { await p.getByTestId('saved-chip').click(); await p.waitForTimeout(1200); await sweep(); await p.getByText('Falooda').first().click(); await p.waitForTimeout(1200); await p.getByRole('button', { name: /i cooked it/i }).first().click(); await p.waitForTimeout(600); await p.locator('input[type=file]').last().setInputFiles('/tmp/plate.jpg'); await p.waitForTimeout(500); };
const b0 = await bal();
await open(); await p.getByRole('button', { name: 'Submit' }).click(); await p.waitForTimeout(3000); await sweep(); await sweep();
const b1 = await bal(); const m = (await sql('select xp_earned, coins_earned, id from public.meals')).rows?.[0];
console.log(JSON.stringify([b0, b1, m]));
ok('meal remembered what it paid', m && m.coins_earned > 0 && m.xp_earned > 0);
ok('balance grew', b1.coins > b0.coins);
// delete through the photobook viewer on Cook
await p.goto(`${BASE}/cook`); await p.waitForTimeout(2500); await sweep();
await p.locator('[data-testid=pb-day].done, [data-testid=pb-today].done, .pb-tile.done').last().click(); await p.waitForTimeout(800);
await p.getByTestId('plate-delete').click(); await p.getByTestId('plate-delete-yes').click(); await p.waitForTimeout(1500);
const b2 = await bal(); console.log(JSON.stringify(b2));
ok('coins and XP taken back', b2.coins === b0.coins && b2.xp === b0.xp);
ok('meal gone', ((await sql('select count(*) as n from public.meals')).rows?.[0]?.n) == 0);
// daily limit: 10 meals already today, the 11th is refused

await sql(`delete from public.pantry_items where user_id = ${U}`);
await sql(`insert into public.pantry_items (user_id, name, category, quantity) values (${U},'cold whole milk','Dairy & Eggs','1 gallon'),(${U},'rose syrup','Sauces & Oils','1 cup'),(${U},'falooda sev (vermicelli)','Carbs & Grains','0.25 cup'),(${U},'sabja (basil) seeds','Other','4 tbsp'),(${U},'vanilla ice cream','Frozen','6'),(${U},'chopped pistachios','Other','1 cup'),(${U},'water','Other',null)`);
await sql(`insert into public.meals (user_id, title, cuisine, country, photo_path) select ${U}, 'x'||g, 'Test', 'IN', null from generate_series(1,10) g`);
await p.reload(); await p.waitForTimeout(2500); await sweep();
try { await open(); } catch (e) { await p.screenshot({ path: '/tmp/mk/dbg.png' }); throw e; }
 await p.getByRole('button', { name: 'Submit' }).click(); await p.waitForTimeout(2500);
ok('11th meal is refused with a friendly note', (await p.locator('.sheet').innerText()).includes('10 meals today'));
await b.close();
