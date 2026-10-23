// Browser check: unread chat messages light up the Compete tab; Home has no "Today" card.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
let unread = 3;
await p.route('**/rest/v1/rpc/get_chats*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'c1', name: 'Team', unread, kind: 'group', last_at: new Date().toISOString() }]) }));
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.lv-opt', '.tip-ok', 'button:has-text("Maybe later")', 'button:has-text("Not now")']) if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(150); } };
await p.goto('http://localhost:3000/login'); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForTimeout(6000); await p.waitForTimeout(500); await sweep();
console.log('badge:', await p.getByTestId('nav-unread').allTextContents(), '· link label:', await p.locator('.nav a[href="/compete"]').getAttribute('aria-label'));
await p.screenshot({ path: '/tmp/mk/unread-cook.png' });
await p.locator('.nav a[href="/home"]').click({ force: true }); await p.waitForURL('**/home'); await p.waitForTimeout(3000); await sweep();
console.log('today card on Home:', await p.getByTestId('today-special').count());
await p.screenshot({ path: '/tmp/mk/unread-home.png' });
unread = 0; await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await p.waitForTimeout(1500);
console.log('badge after read:', await p.getByTestId('nav-unread').count());
await b.close();
