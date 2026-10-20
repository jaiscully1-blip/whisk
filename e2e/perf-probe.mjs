// Speed audit: a phone-sized browser slowed to roughly a mid-range phone (4x CPU, ~100ms network latency).
// For each tap: time to first visible change, time until the screen stops changing, and the worst input delay (INP-style).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = 'http://localhost:3000', OUT = process.argv[2] || '/tmp/o', TAG = process.argv[3] || 'run';
const CPU = +(process.env.CPU || 4);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const sql = (q) => fetch('http://localhost:54321/__e2e/sql?q=' + encodeURIComponent(q)).then((r) => r.text());
const sweep = async () => { for (let i = 0; i < 4; i++) { for (const sel of ['.lv-opt', '.tip-ok', 'button:has-text("Maybe later")']) { if (await p.locator(sel).count()) await p.locator(sel).first().click({ timeout: 1500 }).catch(() => {}); } await p.waitForTimeout(120); } };
await p.addInitScript(() => {
  window.__ev = []; window.__lt = []; window.__mut = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ s: e.startTime, d: e.duration, n: e.name }); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); } catch {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ s: e.startTime, d: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch {}
  document.addEventListener('pointerdown', () => { window.__t0 = performance.now(); window.__first = 0; }, true);
  new MutationObserver(() => { const t = performance.now(); window.__mut = t; if (window.__t0 && !window.__first) window.__first = t; }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
});
await p.goto(`${BASE}/login`); await p.getByRole('radio', { name: 'Accept' }).click(); await p.getByRole('button', { name: 'Start playing' }).click(); await p.waitForURL('**/cook');
await p.waitForTimeout(1200); await sweep();
// a lived-in account: a stocked pantry and a few cooked meals
const items = ['Eggs','Milk','Butter','Flour','Sugar','Rice','Chicken breast','Onion','Garlic','Tomatoes','Pasta','Cheddar cheese','Olive oil','Potatoes','Carrots','Spinach','Lemons','Bread','Ground beef','Yogurt','Soy sauce','Bell pepper','Salt','Black pepper','Honey'];
await sql(`insert into public.pantry_items (user_id, name, category) select p.id, x, 'Pantry' from public.profiles p, unnest(array[${items.map((x) => `'${x}'`).join(',')}]) x where p.id = (select id from public.profiles order by created_at desc limit 1)`);
for (let i = 0; i < 6; i++) await sql(`insert into public.meals (user_id, title, cuisine, photo_path, cooked_at) select id, 'Meal ${i}', 'Italian', id::text || '/m${i}.jpg', now() - interval '${i} days' from public.profiles order by created_at desc limit 1`);
await p.reload(); await p.waitForTimeout(2500); await sweep();
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 1.6e6 / 8 * 4, uploadThroughput: 750e3 / 8 * 4 });
const rows = [];
async function measure(name, act, ready) {
  await p.evaluate(() => { window.__t0 = 0; window.__first = 0; });
  try { await act(); } catch (e) { rows.push({ name, err: String(e.message).split('\n')[0] }); return; }
  const tReadyStart = Date.now();
  let readyMs = null;
  if (ready) { try { await p.waitForFunction(ready, null, { timeout: 12000, polling: 50 }); readyMs = await p.evaluate(() => performance.now() - window.__t0); } catch { readyMs = 'timeout'; console.log('  timeout state', name, JSON.stringify(await p.evaluate(() => ({ path: location.pathname, busy: [...document.querySelectorAll('main [aria-busy=true]')].map((e) => e.outerHTML.slice(0, 100)), len: document.querySelector('main')?.innerText.length })))); } }
  // wait until the screen stops changing (700ms of quiet, max 10s)
  const start = Date.now();
  while (Date.now() - start < 10000) { const quiet = await p.evaluate(() => performance.now() - window.__mut); if (quiet > 700) break; await p.waitForTimeout(100); }
  const r = await p.evaluate(() => { const t0 = window.__t0; const ev = window.__ev.filter((e) => e.s >= t0 - 5); const lt = window.__lt.filter((e) => e.s >= t0 - 5);
    return { first: window.__first ? Math.round(window.__first - t0) : null, settled: Math.round(window.__mut - t0), inp: Math.round(Math.max(0, ...ev.map((e) => e.d))), long: Math.round(lt.reduce((a, e) => a + e.d, 0)), maxLong: Math.round(Math.max(0, ...lt.map((e) => e.d))) }; });
  rows.push({ name, ready: typeof readyMs === 'number' ? Math.round(readyMs) : readyMs, ...r });
}
const tap = (sel) => () => p.locator(sel).first().click({ timeout: 5000, force: /\.nav /.test(sel) });
const notBusy = '!document.querySelector("main [aria-busy=true]")';
const closeSheet = async () => { await p.keyboard.press('Escape'); if (await p.locator('.scrim').count()) await p.locator('.scrim').last().click({ position: { x: 5, y: 5 } }).catch(() => {}); await p.waitForTimeout(400); };
for (const pass of [1, 2]) {
  for (const tab of ['home', 'pantry', 'compete', 'me', 'cook']) {
    await measure(`tab ${tab} (${pass === 1 ? 'first' : 'again'})`, () => p.locator(`.nav a[href="/${tab}"]`).click({ force: true }), `location.pathname.startsWith("/${tab}") && ${notBusy} && document.querySelector("main") && document.querySelector("main").innerText.length > 40`);
    await sweep();
  }
}
// Cook tab
await measure('cook: Let’s cook it → recipe', tap('[data-testid=cook-pick]'), '!!document.querySelector(".sheet h3") && [...document.querySelectorAll(".sheet h3")].some(h=>/Steps/.test(h.textContent))');
await measure('recipe: servings +', tap('.sheet .servx-btn[aria-label="More servings"]'), null);
await measure('recipe: Cook mode', tap('.sheet .cm-open'), '!!document.querySelector(".cm, [class*=cm-]")');
await closeSheet(); await closeSheet();
await measure('cook: Made for you card → recipe', tap('[data-testid=fy-card]'), '[...document.querySelectorAll(".sheet h3")].some(h=>/Steps/.test(h.textContent)) || !!document.querySelector("[data-testid=rs-loading]")');
await closeSheet();
await measure('cook: photobook day', tap('.pb-tile.done'), '!!document.querySelector(".sheet")');
await closeSheet();
await p.locator('#o-dish').fill('Greece');
await measure('cook: search a country', tap('button.cs-go'), '!!document.querySelector(".dflip")');
await measure('cook: flip a dish card', tap('.dflip button.dish-row'), '!!document.querySelector(".dflip.on")');
await measure('dish card: Full recipe', tap('.dflip.on [data-testid=dish-full-recipe]'), '[...document.querySelectorAll(".sheet h3")].some(h=>/Steps/.test(h.textContent))');
await closeSheet();
// Home
await measure('tab home', tap('.nav a[href="/home"]'), `location.pathname.startsWith("/home") && ${notBusy}`);
await sweep();
await measure('home: Open recipe', () => p.getByRole('button', { name: /open recipe/i }).first().click(), '[...document.querySelectorAll(".sheet h3")].some(h=>/Steps/.test(h.textContent)) || !!document.querySelector("[data-testid=rs-loading]")');
await closeSheet();
await measure('home: I cooked it sheet', async () => { await p.getByRole('button', { name: /open recipe/i }).first().click(); await p.waitForTimeout(800); await p.getByTestId('rs-post').click(); }, '!!document.querySelector(".sheet .lm-rec, .sheet input[type=file], .sheet")');
await closeSheet(); await closeSheet();
// Pantry
await measure('tab pantry', tap('.nav a[href="/pantry"]'), `location.pathname.startsWith("/pantry") && ${notBusy}`);
await sweep();
await measure('pantry: kitchen', tap('[data-testid=kitchen-btn]'), 'location.pathname.startsWith("/pantry/kitchen")');
await sweep();
await measure('coins pill → shop', tap('.pill[data-tip=coins]'), 'location.search.includes("shop")');
await sweep();
// Compete
await measure('tab compete', tap('.nav a[href="/compete"]'), `location.pathname.startsWith("/compete") && ${notBusy}`);
await sweep();
for (const sub of ['party', 'cookoff', 'friends', 'useitup']) {
  if (await p.locator(`a[href^="/compete/${sub}"]`).count()) { await measure(`compete: ${sub}`, tap(`a[href^="/compete/${sub}"]`), `location.pathname.startsWith("/compete/${sub}")`); await sweep(); await p.goBack(); await p.waitForTimeout(800); }
}
// Me
await measure('tab me', tap('.nav a[href="/me"]'), `location.pathname.startsWith("/me") && ${notBusy}`);
await sweep();
await measure('me: settings', tap('[data-testid=hud-settings]'), '!!document.querySelector("[data-testid=settings-page]")');
await p.locator('[data-testid=settings-back]').click().catch(() => {});
await p.waitForTimeout(500);
console.log(`\n${TAG} — CPU ${CPU}x, 100ms latency`);
console.log('ms: ready = target content shown · first = first change · settled = screen stops changing · inp = worst input delay · long = main-thread blocked');
for (const r of rows) console.log(r.err ? `${r.name.padEnd(36)} ERROR ${r.err}` : `${r.name.padEnd(36)} ready ${String(r.ready ?? '-').padStart(6)}  first ${String(r.first ?? '-').padStart(5)}  settled ${String(r.settled).padStart(6)}  inp ${String(r.inp).padStart(4)}  long ${String(r.long).padStart(5)} (max ${r.maxLong})`);
const fs = await import('node:fs'); fs.writeFileSync(`${OUT}/perf-${TAG}.json`, JSON.stringify(rows, null, 1));
await b.close();
