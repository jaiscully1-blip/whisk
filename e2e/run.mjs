// End-to-end walk through every screen against e2e/mock-supabase.mjs.
//   1. node e2e/mock-supabase.mjs &
//   2. NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-mock NEXT_PUBLIC_SITE_URL=http://localhost:3000 npx next build
//   3. ANTHROPIC_API_KEY=mock ANTHROPIC_BASE_URL=http://localhost:54321/anthropic npx next start -p 3000 &
//   4. node e2e/run.mjs [screenshot-dir]
import { createRequire } from 'node:module';
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); // dev-only; resolved from NODE_PATH or a local install

const BASE = process.env.E2E_BASE || 'http://localhost:3000';
const SHOTS = process.argv[2] || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

function png(w = 64, h = 64) {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 230; raw[o + 1] = 160 + (x % 40); raw[o + 2] = 80; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const photo = { name: 'plate.png', mimeType: 'image/png', buffer: png() };

const results = [];
const check = (name, ok, detail = '') => { results.push([ok ? 'PASS' : 'FAIL', name, detail]); console.log(ok ? 'PASS' : 'FAIL', name, detail); };
const problems = [];

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'America/New_York' });
const page = await ctx.newPage();
page.setDefaultTimeout(12000);
page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) problems.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('response', (r) => { if (r.status() >= 400 && !/api\/barcode/.test(r.url())) problems.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
const shot = async (n) => { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${n}.png`), fullPage: true }); };
const step = async (name, fn) => { try { await fn(); } catch (e) { check(name, false, e.message.split('\n')[0]); await shot(`fail-${name.replace(/\W+/g, '-')}`); } };
const nav = (n) => page.getByRole('navigation').getByRole('link', { name: n, exact: true }).click();
const closePopups = async () => { await page.locator('.popup-scrim').first().waitFor({ timeout: 3000 }).catch(() => {}); for (let i = 0; i < 4; i++) { const x = page.locator('.popup-scrim [aria-label=Close]').first(); const leave = page.locator('.popup-scrim').getByRole('button', { name: 'Leave' }).first(); if (await x.count()) await x.click(); else if (await leave.count()) await leave.click(); else break; await page.waitForTimeout(400); } };

await step('signed-out redirect', async () => { await page.goto(`${BASE}/home`); check('signed-out /home redirects to /login', page.url().includes('/login')); });
await step('log in', async () => {
  await page.fill('#email', 'cook@whisk.test'); await page.fill('#password', 'whisk-e2e-pass');
  await page.click('button[type=submit]'); await page.waitForURL('**/cook', { timeout: 15000 });
  check('log in lands on Cook', true);
  await page.getByRole('dialog', { name: 'Cookies, chef?' }).waitFor({ timeout: 8000 });
  check('first open asks about cookies before anything else', (await page.locator('.popup-scrim').count()) === 0);
  await page.getByRole('button', { name: 'Manage choices' }).click();
  check('manage shows 4 purposes incl. usage data, essential locked on', (await page.locator('.cc-switch').count()) === 4 && (await page.getByText('Help improve Whisk').count()) === 1 && (await page.locator('.cc-switch.locked[aria-checked=true]').count()) === 1);
  await shot('00-cookies');
  await page.getByRole('button', { name: 'Accept all' }).click();
  await page.locator('.cc-scrim').waitFor({ state: 'detached' });
  check('cookie choices saved', true);
  // first-time walkthrough: arrow + words, Next moves on
  await page.locator('.coach-bubble.on').waitFor({ timeout: 8000 });
  const bubbleText = async () => (await page.locator('.coach-bubble p').innerText()).trim();
  const nextBtn = page.locator('.coach-next');
  check('new players get the walkthrough', /I’m Whisk/.test(await bubbleText()));
  const arrowNear = async (sel) => { const a = await page.locator('.coach-arrow').boundingBox(); const t = await page.locator(sel).first().boundingBox(); return !!a && !!t && a.x + 23 >= t.x - 8 && a.x + 23 <= t.x + t.width + 8 && Math.min(Math.abs(a.y - (t.y + t.height)), Math.abs(a.y + 52 - t.y)) < 20; };
  await nextBtn.click(); await page.locator('.coach-arrow').waitFor();
  check('arrow points at the Pantry button with words', await arrowNear('.nav a[href="/pantry"]') && /Pantry/.test(await bubbleText()));
  await shot('00b-coach');
  await nextBtn.click(); await page.waitForURL('**/pantry'); await page.waitForTimeout(1800);
  check('next step moves the arrow to the food box and types an example', await arrowNear('#p-name') && (await page.inputValue('#p-name')) === 'Eggs');
  await nextBtn.click(); await page.waitForFunction(() => /green button/.test(document.querySelector('.coach-bubble p')?.textContent || ''), null, { timeout: 8000 });
  check('arrow moves to the Add button', await arrowNear('[data-tour="add"]'));
  await nextBtn.click();
  await page.waitForFunction(() => /receipt/.test(document.querySelector('.coach-bubble p')?.textContent || ''), null, { timeout: 8000 });
  await page.waitForTimeout(600);
  check('Next presses Add for the example food (Eggs saved to pantry)', (await page.locator('main').innerText()).includes('Eggs') && (await page.inputValue('#p-name')) === '');
  check('arrow moves on to the receipt scanner', await arrowNear('[data-tour="scan"]'));
  for (let k = 0; k < 40; k++) { if ((await page.locator('.coach-bubble p').innerText()).includes('Tap it to buy it')) break; await page.locator('.coach-bubble.on').waitFor(); await nextBtn.click(); await page.waitForTimeout(700); }
  check('walkthrough reaches the shop on Me with the starting coins', page.url().includes('/me') && /costs [\d,]+ coins/.test(await bubbleText()));
  await shot('00c-coach-shop');
  const coins0 = Number((await page.locator('header .pill').nth(1).innerText()).replace(/\D/g, ''));
  await page.locator('.closet-grid .tile.locked').filter({ hasText: '1,500' }).first().click();
  await page.locator('[data-tour="buy"]').waitFor(); await page.waitForTimeout(700);
  check('player taps the shirt themselves; arrow moves to Buy', /Buy button/.test(await bubbleText()) && await arrowNear('[data-tour="buy"]'));
  await page.locator('[data-tour="buy"]').click();
  await page.waitForFunction(() => /Ta-da/.test(document.querySelector('.coach-bubble p')?.textContent || ''), null, { timeout: 8000 });
  await page.waitForFunction((c0) => Number((document.querySelectorAll('header .pill')[1]?.textContent || '').replace(/\D/g, '')) !== c0, coins0, { timeout: 6000 }).catch(() => {});
  const coins1 = Number((await page.locator('header .pill').nth(1).innerText()).replace(/\D/g, ''));
  check('the shirt is bought with the 1,500 starting coins', coins0 - coins1 === 1500, `${coins0} → ${coins1}`);
  for (let k = 0; k < 6 && (await page.locator('.coach-bubble').count()); k++) { await nextBtn.click(); await page.waitForTimeout(800); }
  await page.waitForURL('**/cook');
  check('walkthrough ends on Cook', (await page.locator('.coach').count()) === 0);
  await page.locator('.hud-hello.on').waitFor({ timeout: 4000 });
  check('greeting shows in the top bar, no popup', /Welcome/.test(await page.locator('.hud-hello').innerText()) && (await page.locator('.popup-scrim').count()) === 0);
  await shot('00c-hello');
  await nav('Home');
});
await step('home', async () => {
  await page.getByRole('heading', { name: 'Almost ready' }).waitFor();
  check('home shows Almost ready', true);
  check('home has no challenges or Fridge Raid', (await page.getByText('This week’s challenges').count()) === 0 && (await page.getByText('Fridge Raid').count()) === 0);
  await page.getByText('Ground beef is frozen').waitFor();
  check('home reminds you to defrost frozen ground beef', true);
  await page.locator('.src a').first().waitFor();
  check('almost-ready recipes link to their source site', /^https:\/\//.test(await page.locator('.src a').first().getAttribute('href')));
  for (let i = 0; i < 8 && (await page.locator('.away-h').count()) < 2; i++) { const more = page.getByRole('button', { name: 'Show more' }); if (!(await more.count())) break; await more.click(); await page.waitForTimeout(150); }
  check('almost ready is grouped by items missing, closest first, no limit', (await page.locator('.away-h').count()) >= 2 && /1 item away/i.test(await page.locator('.away-h').first().innerText()) && /2 items away/i.test(await page.locator('.away-h').nth(1).innerText()));
  await page.evaluate(() => window.scrollTo(0, 0));
  check('pantry hint is the short version', (await page.getByText('Whisk reads').count()) === 0);
  await shot('01-home');
});
await step('pantry draft is remembered', async () => {
  await nav('Pantry');
  await page.fill('#p-name', 'Frozen pork chops'); await page.waitForTimeout(1600);
  await page.reload(); await page.waitForTimeout(1500); await closePopups();
  check('reopening starts on Cook', page.url().includes('/cook'), page.url());
  await nav('Pantry'); await page.locator('#p-name').waitFor();
  check('half-typed item survives a reload', (await page.inputValue('#p-name')) === 'Frozen pork chops');
  await page.click('text=Add to pantry');
  await page.getByText('frozen meat, remember to defrost').waitFor();
  check('frozen meat is detected from the name (auto category)', true);
  await page.getByRole('button', { name: /Frozen meat · tap to start thawing/ }).first().click();
  await page.getByText(/is thawing in the fridge/).waitFor();
  check('start thawing from the pantry', true);
  await shot('02-pantry');
});
await step('cook', async () => {
  await nav('Cook');
  await page.click('text=What can I make?');
  await page.getByText(/recipes? you can make/).waitFor();
  const n = await page.locator('main button.card:has(.chip.have)').count();
  check('cook shows web recipes the pantry can make', n >= 5, `${n} recipes`);
  check('no "Find more online" searches', (await page.getByText('Find more online').count()) === 0 && (await page.getByText('Only real recipes').count()) === 0);
  check('no description under channel names', (await page.locator('a.channel .desc').count()) === 0);
  check('saved recipes moved off Cook', (await page.getByText('Your saved recipes').count()) === 0);
  await page.click('text=Fridge Raid (surprise me)');
  await page.getByText('Fridge Raid · your hand').waitFor();
  check('Fridge Raid deals 4 pantry items', (await page.locator('.grid2 .card').count()) === 4);
  await page.click('text=What can I make?');
  await page.getByRole('button', { name: /Poor Man's Burrito Bowls/ }).click();
  await page.getByText('Recipe from').waitFor();
  check('recipe sheet links to Budget Bytes', (await page.locator('[role=dialog] .src a').first().getAttribute('href')).includes('budgetbytes.com'));
  const tmr = page.locator('[role=dialog] button.timer').first();
  if (await tmr.count()) {
    await tmr.click(); await page.waitForTimeout(1300);
    check('one tap starts the step timer', /\d+:\d\d/.test(await tmr.innerText()) && (await tmr.getAttribute('class')).includes('running'));
    check('a running timer shows in the top bar', (await page.locator('header .pill').count()) === 3);
    await tmr.dblclick(); await page.waitForTimeout(300);
    check('double-tap stops and resets the timer', /min$/.test((await tmr.innerText()).trim()) && (await page.locator('header .pill').count()) === 2);
  } else check('recipe has a step timer', false);
  await page.click('[role=dialog] >> text=Save · +5 XP');
  await page.getByText(/Saved to your cookbook/).waitFor();
  await page.click('[role=dialog] >> text=I cooked it');
  await page.locator('[aria-label="Log a meal"] input[type=file]').setInputFiles(photo);
  await page.click('text=Submit');
  await page.getByRole('heading', { name: 'Cooked it!' }).waitFor({ timeout: 15000 });
  check('submit photo → "Cooked it!" popup', true);
  await page.click('[aria-label="Liked it"]'); await page.waitForTimeout(500);
  await shot('03-cooked');
  await page.click('[role=dialog] >> text=Leave');
  await page.waitForTimeout(600); await closePopups();
  await nav('Pantry'); await page.getByRole('tab', { name: 'Saved recipes' }).click();
  await page.click('button.chip:has-text("Liked")');
  await page.locator('main [aria-label=Liked]').first().waitFor();
  check('liked meal shows in Pantry → Saved recipes', (await page.locator('main [aria-label=Liked]').count()) >= 1);
  await page.getByRole('tab', { name: /^Pantry/ }).click();
});
await step('compete', async () => {
  await nav('Compete');
  await page.getByText('Daily quest').waitFor();
  await page.locator('.flip .face').first().waitFor({ timeout: 15000 });
  const cards = await page.locator('.flip').count();
  check('3 challenges picked from your pantry', cards === 3, `${cards}`);
  await page.locator('.flip .face').first().click(); await page.waitForTimeout(700);
  check('tap flips the card to instructions', (await page.locator('.flip.on').count()) === 1);
  await shot('04-flip');
  await page.locator('.flip.on >> text=Tap to add photo & complete').click();
  await page.locator('[aria-label="Log a meal"] input[type=file]').setInputFiles(photo);
  await page.click('text=Submit');
  await page.getByRole('heading', { name: 'Cooked it!' }).waitFor({ timeout: 15000 });
  await page.click('[role=dialog] >> text=Leave'); await page.waitForTimeout(600); await closePopups();
  await page.getByText('Done · coins added').waitFor();
  check('completing a challenge pays coins', true);
  check('shop is no longer on Compete', (await page.getByRole('button', { name: 'Get coins' }).count()) === 0 && (await page.getByText('Picked from recipes').count()) === 0);
});
await step('me', async () => {
  await nav('Me');
  await page.getByRole('heading', { name: 'Passport' }).waitFor();
  check('no pose buttons on Me', (await page.getByRole('button', { name: 'We’re so back!' }).count()) === 0);
  check('closet slots are outline icons', (await page.locator('.slotbar [role=tab] svg').count()) === 5);
  check('album has all 193 UN members, 20 a page', (await page.locator('.album .stamp').count()) === 193 && (await page.locator('.album-page').count()) === 10 && (await page.locator('.album-page').first().locator('.stamp').count()) === 20);
  check('pages are numbered', (await page.locator('.album-num').first().innerText()).includes('1'));
  check('stamps stay grey until 10 meals', (await page.locator('.album .stamp.done').count()) === 0);
  check('cooking Mexican counts toward the Mexico stamp', /Mexico, [1-9] of 10/.test(await page.locator('[aria-label^="Mexico, "]').getAttribute('aria-label')));
  const x0 = await page.locator('.album-pages').evaluate((e) => e.scrollLeft);
  await page.getByRole('button', { name: 'Next page' }).click(); await page.waitForTimeout(900);
  check('next page swipes the album across', (await page.locator('.album-pages').evaluate((e) => e.scrollLeft)) > x0 && (await page.locator('.album-dots [aria-selected=true]').getAttribute('aria-label')) === 'Page 2');
  await page.locator('[aria-label^="Mexico, "]').scrollIntoViewIfNeeded().catch(() => {});
  await page.getByRole('button', { name: 'Previous page' }).click(); await page.waitForTimeout(900);
  const stampImg = await page.locator('.album-page').first().locator('.stamp-art img').first().getAttribute('src');
  const ok = await page.evaluate(async (u) => (await fetch(u)).ok, stampImg);
  check('stamp art loads', ok, stampImg);
  check('shop is on Me: every item shown, locked ones greyed with a price', (await page.locator('.closet-grid .locked').count()) >= 5 && /\d/.test(await page.locator('.closet-grid .locked .tprice').first().innerText()));
  await page.getByRole('button', { name: 'Get coins' }).waitFor();
  check('Get coins is on Me', true);
  await page.click('[aria-label^="Edit name"]'); await page.fill('#nm', 'Chef J ✨ #1'); await page.press('#nm', 'Enter');
  await page.getByRole('heading', { name: 'Chef J ✨ #1' }).waitFor();
  check('name can be any characters', true);
  check('last device is remembered in the background (not shown)', (await page.getByText('Last played on').count()) === 0);
  await shot('05-me');
});
await step('compete layout', async () => {
  await nav('Compete'); await page.getByText('Cuisine bingo').waitFor();
  const yB = (await page.getByRole('heading', { name: 'Cuisine bingo' }).boundingBox()).y, yQ = (await page.getByText('Daily quest').boundingBox()).y;
  check('cuisine bingo is at the top of Compete', yB < yQ, `${yB} < ${yQ}`);
  check('bingo card resets every 5 days', /resets in [1-5]d/.test(await page.locator('section[aria-labelledby=bingo-h] p').first().innerText()));
  await nav('Me'); await page.getByRole('heading', { name: 'Passport' }).waitFor();
});
await step('buy coins with bitcoin', async () => {
  const before = Number((await page.locator('header .pill').nth(1).innerText()).replace(/\D/g, ''));
  await page.getByRole('button', { name: 'Get coins' }).first().click();
  await page.getByText('$2 in Bitcoin').waitFor();
  check('Get coins shows the 4 packs', (await page.locator('[aria-label="Get coins"] button.card').count()) === 4);
  await page.getByText('$2 in Bitcoin').click();
  await page.waitForURL('**/btcpay/i/**', { timeout: 15000 });
  check('pack opens the BTCPay checkout page', true);
  const inv = (await (await fetch('http://localhost:54321/__e2e/invoices')).json()).at(-1);
  check('invoice is $2.00 USD for a Whisk order', inv.amount === '2.00' && inv.currency === 'USD' && /^[0-9a-f-]{36}$/.test(inv.metadata.orderId), JSON.stringify(inv));
  const hook = async (body, sig) => (await fetch(`${BASE}/api/coins/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'BTCPay-Sig': sig }, body })).status;
  const body = JSON.stringify({ type: 'InvoiceSettled', invoiceId: inv.id, storeId: 'e2e-store' });
  const sign = (b) => 'sha256=' + crypto.createHmac('sha256', 'e2e-webhook-secret').update(b).digest('hex');
  check('webhook with a bad signature is rejected', (await hook(body, 'sha256=00')) === 401);
  check('unsettled invoice credits nothing', (await hook(body, sign(body))) === 200);
  await fetch(`http://localhost:54321/__e2e/settle/${inv.id}`);
  check('settled invoice webhook accepted', (await hook(body, sign(body))) === 200);
  await hook(body, sign(body)); // replay
  await page.goto(`${BASE}/me?paid=1`); await page.waitForTimeout(1500); await closePopups();
  const after = Number((await page.locator('header .pill').nth(1).innerText()).replace(/\D/g, ''));
  check('1,000 coins credited exactly once', after === before + 1000, `${before} → ${after}`);
});
await step('me settings', async () => {
  await nav('Me'); await page.getByText('Settings').waitFor();
  check('autosave is not shown', (await page.getByText('Autosave').count()) === 0);
  check('day counter starts at Day 1', (await page.locator('.dayno').innerText()) === 'Day 1');
  await page.getByRole('button', { name: /Cookies & privacy/ }).click();
  check('cookie choices can be reopened from Settings', await page.getByRole('dialog', { name: 'Your choices' }).isVisible());
  check('your time zone is used for days', (await page.locator('.cc-text em').innerText()).includes('America/New York'));
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Bigger text' }).click(); await page.waitForTimeout(200);
  check('text size goes up', (await page.locator('main').evaluate((m) => getComputedStyle(m).zoom)) === '1.1');
  await page.getByRole('button', { name: 'Smaller text' }).click(); await page.waitForTimeout(200);
  check('text size goes back down', ['1', 'normal'].includes(await page.locator('main').evaluate((m) => getComputedStyle(m).zoom)));
  check('reset game is a tiny link', (await page.getByRole('button', { name: 'Reset game' }).evaluate((b) => parseFloat(getComputedStyle(b).fontSize))) <= 12);
  check('takeout shows just the number (no button)', (await page.locator('form:has(#takeout) button').count()) === 0);
  await page.click('#takeout'); await page.fill('#takeout', '18');
  await page.locator('form:has(#takeout)').getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(600);
  check('takeout saves and goes back to just the number', (await page.locator('form:has(#takeout) button').count()) === 0 && (await page.inputValue('#takeout')) === '18');
  await page.getByRole('button', { name: 'Reset game' }).click();
  check('reset asks for your password first (step 1 of 2)', await page.getByText('Step 1 of 2').isVisible());
  await page.locator('[aria-label="Reset game"]').getByRole('button', { name: 'Cancel' }).last().click();
});
await step('reload keeps everything', async () => {
  await page.goto(`${BASE}/me`); await page.waitForTimeout(1800); await closePopups();
  check('every open starts on Cook', page.url().includes('/cook'), page.url());
  check('no tour or popup on later opens (first time only)', (await page.locator('.coach').count()) === 0 && (await page.locator('.popup-scrim').count()) === 0);
  await nav('Me');
  check('name persisted', await page.getByRole('heading', { name: 'Chef J ✨ #1' }).waitFor({ timeout: 8000 }).then(() => true, () => false));
});
await step('live dish search', async () => {
  await nav('Cook');
  await page.fill('#o-dish', 'tacos'); await page.getByRole('button', { name: 'Search dishes' }).click();
  await page.getByText('Mock Dish 1', { exact: true }).first().waitFor({ timeout: 15000 });
  check('search lists dishes from the web', (await page.locator('.dish-row:not(.skel)').count()) === 12);
  await page.getByRole('button', { name: 'Show more dishes' }).scrollIntoViewIfNeeded();
  await page.getByText('Mock Dish 13', { exact: true }).first().waitFor({ timeout: 15000 });
  check('scrolling loads more dishes (no repeats)', (await page.locator('.dish-row:not(.skel)').count()) === 24);
  await page.getByRole('button', { name: 'Mock Dish 3: show ingredients and videos' }).click();
  const card = page.locator('.dflip.on');
  await card.locator('a.vid').first().waitFor({ timeout: 15000 });
  check('tapping a dish flips its card over', (await page.locator('.dflip.on').count()) === 1);
  check('back shows ingredients you have and need', (await card.locator('.chip.have').count()) >= 1 && (await card.locator('.chip.need').count()) >= 1 && /you have \d of 4/i.test(await card.innerText()));
  const hrefs = await card.locator('a.vid').evaluateAll((as) => as.map((a) => a.href));
  check('YouTube links come from the search results only', hrefs.length === 2 && hrefs.every((h) => h.startsWith('https://www.youtube.com/watch?v=')) && !hrefs.some((h) => h.includes('MADEUP')), JSON.stringify(hrefs));
  check('YouTube search link too', (await card.getByRole('link', { name: 'More on YouTube' }).getAttribute('href')).startsWith('https://www.youtube.com/results?search_query='));
  await shot('07-dish-flip');
  await card.getByRole('button', { name: /Add \d+ missing to shopping list/ }).click(); await page.getByText(/Added \d+ to your shopping list/).waitFor();
  check('missing ingredients go to the shopping list', true);
  await card.getByRole('button', { name: 'Flip back' }).click(); await page.waitForTimeout(600);
  check('flips back', (await page.locator('.dflip.on').count()) === 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  check('search suggests all 193 passport countries', (await page.locator('#o-countries option').count()) === 193);
  await page.fill('#o-dish', 'Peru'); await page.getByRole('button', { name: 'Search dishes' }).click();
  await page.getByText('Peru Dish 1', { exact: true }).first().waitFor({ timeout: 15000 });
  check('a country name lists dishes from that country', /Dishes from Peru/i.test(await page.locator('section[aria-live] .eyebrow').first().innerText()));
  check('5 cooking channels, YouTube only, not numbered', (await page.locator('a.channel').count()) === 5 && (await page.locator('a.channel[href^="https://www.youtube.com/@"]').count()) === 5 && (await page.locator('.rank, a.social.ig').count()) === 0);
});
await step('activity backend', async () => {
  await page.waitForTimeout(4500); await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const ev = await (await fetch('http://localhost:54321/__e2e/events')).json();
  check('taps, picks and searches are recorded', ev.some((e) => e.kind === 'tap') && ev.some((e) => e.kind === 'search' && e.value === 'tacos') && ev.some((e) => e.kind === 'view'), `${ev.length} events`);
  check('typed text in other fields is not recorded', !ev.some((e) => /Frozen pork chops|Chef J/.test(e.value || '')));
  await page.goto(`${BASE}/admin`); await page.waitForTimeout(1500);
  check('backend page is closed to non-admins', await page.getByText('This page is only for Whisk admins.').isVisible());
  await fetch('http://localhost:54321/__e2e/make-admin');
  await page.reload(); await page.getByRole('heading', { name: 'Backend' }).waitFor({ timeout: 8000 });
  check('admins see the backend dashboard', (await page.locator('.adm-tiles .adm-card').count()) === 5);
  check('dashboard lists top searches and the activity feed', (await page.getByRole('cell', { name: 'tacos' }).count()) >= 1 && (await page.locator('.adm td').count()) > 10);
  await shot('08-backend');
});
await step('no-store', async () => { const r = await page.request.get(`${BASE}/home`); check('signed-in pages are Cache-Control no-store', /no-store/.test(r.headers()['cache-control'] || '')); });

const csp = problems.filter((p) => /Content Security Policy|Refused to/.test(p));
check('no CSP violations', csp.length === 0, csp.slice(0, 3).join(' | '));
const other = problems.filter((p) => !csp.includes(p) && !/rpc\/admin_(overview|events)/.test(p));   // the backend refusing a non-admin is expected
check('no page errors or failed requests', other.length === 0, other.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
