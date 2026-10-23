// Browser check: a player avoiding gluten + fish sees none of it on Home, Cook or in the world lists.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { adapt } from '../lib/recipes/never.js';
import { expandWorld, worldIds } from '../lib/recipes/worldExpand.js';
const { chromium } = createRequire(import.meta.url)('playwright');
const web = JSON.parse(fs.readFileSync(new URL('../lib/recipes/web.json', import.meta.url)));
const more = JSON.parse(fs.readFileSync(new URL('../lib/recipes/more.json', import.meta.url)));
const byTitle = new Map(); for (const r of [...web, ...more]) byTitle.set(r.title, r);
const byId = new Map();
for (const f of fs.readdirSync(new URL('../lib/recipes/world/', import.meta.url))) { const iso = f.slice(0, 2); const recs = JSON.parse(fs.readFileSync(new URL(`../lib/recipes/world/${f}`, import.meta.url))); const ids = worldIds(iso, recs); recs.forEach((r, i) => { const x = expandWorld(iso, iso, r, ids[i]); byId.set(x.id, x); if (!byTitle.has(x.title)) byTitle.set(x.title, x); }); }
const NEVER = ['fish', 'gluten / wheat'];
const bad = (r) => r && !adapt(r, NEVER).ok;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const apiRows = [];
p.on('response', async (res) => { if (/\/api\/world-recipe\?(sample|type|iso)/.test(res.url())) { try { const j = await res.json(); for (const r of j.recipes || []) apiRows.push({ url: res.url(), r }); } catch {} } });
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.lv-opt', '.tip-ok', 'button:has-text("Maybe later")', 'button:has-text("Not now")']) if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(150); } };
await p.goto('http://localhost:3000/login'); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook'); await p.waitForTimeout(2000); await sweep();
// what Home shows BEFORE setting the list (to prove the check would catch it)
await p.locator('.nav a[href="/home"]').click({ force: true }); await p.waitForURL('**/home'); await p.waitForTimeout(3500); await sweep();
const titles = async () => (await p.locator('main h2, main h3, main .rcard b, main [data-testid=sp-row]').allTextContents()).map((t) => t.trim()).filter((t) => byTitle.has(t));
const before = await titles();
console.log('BEFORE list: home cards matching a known recipe', before.length, '· with gluten/fish (no safe swap):', before.filter((t) => bad(byTitle.get(t))).length);
// set the list through the real sheet
await p.goto('http://localhost:3000/me'); await p.waitForTimeout(1500); await sweep();
if (!(await p.getByTestId('settings-page').count())) await p.getByTestId('hud-settings').click(); await p.getByTestId('settings-page').waitFor();
await p.getByRole('button', { name: /Never show me/ }).first().click();
const ns = p.locator('[role=dialog][aria-label="Never show me"]');
for (const k of ['Fish', 'Gluten / wheat']) await ns.getByRole('button', { name: k, exact: true }).click();
console.log('sheet says:', (await ns.locator('[aria-live=polite]').textContent()).trim());
await ns.getByRole('button', { name: 'Save' }).click(); await p.waitForTimeout(800);
apiRows.length = 0;
console.log('Me row now says:', (await p.getByRole('button', { name: /Never show me/ }).first().innerText()).replace(/\s+/g, ' '));
// Home, inside the app (no reload: the feed must notice the change by itself)
await p.goBack().catch(() => {}); await p.waitForTimeout(500);
if (!(await p.locator('.nav a[href="/home"]').isVisible().catch(() => false))) await p.goBack().catch(() => {});
await p.locator('.nav a[href="/home"]').click({ force: true }); await p.waitForURL('**/home'); await p.waitForTimeout(4500); await sweep();
let seen = await titles();
for (let i = 0; i < 3; i++) { await p.getByRole('button', { name: /Shuffle/i }).first().click().catch(() => {}); await p.waitForTimeout(1200); seen.push(...await titles()); }
const homeBad = [...new Set(seen)].filter((t) => bad(byTitle.get(t)));
console.log('AFTER: home recipes checked', new Set(seen).size, '· bad:', homeBad.length, homeBad.slice(0, 5));
await p.screenshot({ path: '/tmp/mk/never-home.png' });
// Cook
await p.locator('.nav a[href="/cook"]').click({ force: true }); await p.waitForURL('**/cook'); await p.waitForTimeout(3000); await sweep();
const cook = await titles(); const cookBad = cook.filter((t) => bad(byTitle.get(t)));
console.log('AFTER: cook recipes checked', cook.length, '· bad:', cookBad.length, cookBad.slice(0, 5));
// every world row the server sent after the change
const apiBad = apiRows.filter(({ r }) => bad(byId.get(r.id)));
console.log('AFTER: world rows from the server', apiRows.length, '· bad:', apiBad.length, apiBad.slice(0, 3).map((x) => x.r.title), '· every list request tagged nv:', apiRows.every((x) => /[?&]nv=/.test(x.url)));
// open a recipe that needed a swap and look at the sheet
await p.locator('.nav a[href="/home"]').click({ force: true }); await p.waitForTimeout(2500);
const swapped = (await titles()).find((t) => { const r = byTitle.get(t); return r && adapt(r, NEVER).ok && adapt(r, NEVER).swaps.some((x) => !x.leave); });
console.log('swapped recipe on screen:', swapped || 'none');
if (swapped) {
  const card = p.locator('article, .rcard, .card').filter({ has: p.getByText(swapped, { exact: true }) }).getByRole('button', { name: /Open recipe/ }).first();
  if (await card.count()) { await card.click(); await p.waitForTimeout(3500); console.log('dialogs:', await p.locator('[role=dialog]').evaluateAll((d) => d.map((x) => x.getAttribute('aria-label') + ' | ' + (x.getAttribute('data-testid') || '') + ' | ' + x.innerText.slice(0, 200).replace(/\s+/g, ' ')))); await p.screenshot({ path: '/tmp/mk/never-open.png' }); const fit = p.locator('[data-testid=never-fit]'); console.log('opened', swapped, '· swap note shown:', await fit.count(), (await fit.textContent().catch(() => '')).slice(0, 160)); await fit.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/mk/never-sheet.png' }); await p.locator('[role=dialog] .ing-list').scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await p.screenshot({ path: '/tmp/mk/never-ings.png' }); }
  else console.log('swapped recipe not on screen to open:', swapped);
}
await b.close();
process.exit(homeBad.length || cookBad.length || apiBad.length ? 1 : 0);
