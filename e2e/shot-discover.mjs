import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.tip-ok', 'button:has-text("Maybe later")', '.popup-scrim button']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(150); } };
const ok = (n, v) => console.log(v ? 'PASS' : 'FAIL', n);
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(2000); await sweep();
if (await p.locator('.lv-opt').count()) { await p.locator('.lv-opt').first().click(); await p.waitForTimeout(600); } await sweep();
const grab = async () => p.locator('.rcard').evaluateAll((els) => els.slice(0, 10).map((e) => [e.querySelector('.eyebrow')?.textContent, e.querySelector('h2')?.textContent]));
const runs = [];
for (let i = 0; i < 4; i++) {
  await p.goto(`${BASE}/cook`); await p.waitForTimeout(2500); await sweep(); await p.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }).click(); await p.waitForTimeout(3500); await sweep();
  const g = await grab(); runs.push(g); console.log(i, g.map((x) => x.join(': ')).join(' | '));
}
const first = runs.map((r) => r.map((x) => x[1]));
ok('10 cards', first[0].length === 10);
ok('10 different places in the first 10', new Set(runs[0].map((x) => x[0])).size >= 9);
const overlap = (a, c) => a.filter((x) => c.includes(x)).length;
// switching tabs and coming back must not change a single card
await p.getByRole('navigation').getByRole('link', { name: 'Pantry', exact: true }).click(); await p.waitForTimeout(800);
await p.getByRole('navigation').getByRole('link', { name: 'Home', exact: true }).click(); await p.waitForTimeout(1500);
const again = (await grab()).map((x) => x[1]); ok('same mix after switching tabs', JSON.stringify(again) === JSON.stringify(runs[3].map((x) => x[1])));
// no reshuffle while it sits there
const snap = []; for (let i = 0; i < 4; i++) { snap.push(JSON.stringify((await grab()).map((x) => x[1]))); await p.waitForTimeout(700); }
ok('no second refresh', new Set(snap).size === 1);
ok('visit 2 mostly new dishes', overlap(first[0], first[1]) <= 3);
ok('visit 3 mostly new vs 1+2', overlap(first[2], [...first[0], ...first[1]]) <= 3);
await p.getByTestId('shuffle').click(); await p.waitForTimeout(1500);
const g2 = (await grab()).map((x) => x[1]); ok('shuffle gives new set', overlap(g2, first[3]) <= 3);
await p.locator('.rcard').first().getByRole('button', { name: /open recipe/i }).click(); await p.waitForTimeout(1500);
ok('world dish opens with steps', await p.locator('.sheet').count() >= 1);
await p.screenshot({ path: '/tmp/mk/discover.png' });
await b.close();
