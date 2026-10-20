import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")', '.popup-scrim button']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
const sql = (q) => fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent(q)).then((r) => r.json()).catch(() => ({}));
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(2000); await sweep();
if (await p.locator('.lv-opt').count()) { await p.locator('.lv-opt').first().click(); await p.waitForTimeout(600); } await sweep();
// empty pantry: the post button is there anyway
await p.getByRole('button', { name: /let.s cook it/i }).first().click(); await p.waitForTimeout(1000);
ok('bar visible with an empty pantry', await p.getByTestId('rs-post').isVisible());
const box = await p.getByTestId('rs-post').boundingBox(); ok('bar sits at the bottom of the screen', box && box.y > 700);
await p.screenshot({ path: '/tmp/mk/bar.png' });
// cook mode to the end
await p.getByRole('button', { name: /cook mode/i }).first().click(); await p.waitForTimeout(600);
for (let i = 0; i < 20 && !(await p.getByTestId('cm-done').count()); i++) { await p.locator('.cm-bottom .btn:not(.ghost)').first().click(); await p.waitForTimeout(150); }
ok('cook mode ends on All done', await p.getByTestId('cm-done').count() === 1);
await p.screenshot({ path: '/tmp/mk/cmdone.png' });
await p.getByTestId('cm-post').click(); await p.waitForTimeout(800);
ok('opens the post sheet', await p.getByRole('dialog', { name: 'Log a meal' }).count() === 1);
// 10 a day: 10 meals already, the 11th is refused
const U = "(select id from public.profiles order by created_at desc limit 1)";
await sql(`insert into public.meals (user_id, title, cuisine, country, photo_path) select ${U}, 'x'||g, 'Test', 'IN', 'x'||g from generate_series(1,10) g`);
await p.locator('input[type=file]').last().setInputFiles('/tmp/plate.jpg'); await p.waitForTimeout(500);
await p.screenshot({ path: '/tmp/mk/dbg.png' }); await p.getByRole('button', { name: 'Submit' }).click({ timeout: 5000 }).catch((e) => console.log('click failed', e.message.slice(0, 200))); await p.waitForTimeout(2500);
await p.screenshot({ path: '/tmp/mk/dbg.png' }); console.log((await p.locator('body').innerText()).slice(0, 400).replace(/\n/g, ' | '));
ok('11th meal refused with a friendly note', (await p.locator('.sheet').last().innerText()).includes('10 meals today'));
await b.close();
