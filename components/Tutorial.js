'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// First-time walkthrough (once per account), told as a story: you're the new cook, Chef shows you around.
// A bouncing arrow points at the real thing and the lit-up part lifts off the page. You can touch it and play
// (spin your cook, flip a card, type a search) — the tutorial waits. Next moves on, or does the step for you.
// Jokes are set up on one card and land when you tap Next. Written short, for kids and anyone new to phone games.
const $ = (sel) => (typeof sel === 'function' ? sel() : document.querySelector(sel));
const cheapestLocked = () => [...document.querySelectorAll('.closet-grid .tile.locked')]
  .map((el) => ({ el, price: Number((el.querySelector('.tprice')?.textContent || '').replace(/\D/g, '')) })).filter((x) => x.price > 0).sort((a, b) => a.price - b.price)[0];

let typing = Promise.resolve();
function typeInto(el, text) {
  // Fill a React-controlled input the way typing would, one letter at a time.
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  typing = new Promise((done) => { let i = 0; const t = setInterval(() => { i++; set.call(el, text.slice(0, i)); el.dispatchEvent(new Event('input', { bubbles: true })); if (i >= text.length) { clearInterval(t); done(); } }, 110); });
  return typing;
}
const submit = (sel) => { const f = $(sel); const form = f?.tagName === 'FORM' ? f : f?.form; if (form?.requestSubmit) form.requestSubmit(); else f?.click(); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export const STEPS = [
  { text: 'Welcome to the kitchen. I’m Chef. First shift? I’ll show you around.', label: 'Yes, Chef!' },
  { page: '/cook', sel: '.nav a[href="/pantry"]', go: '/pantry', text: 'This is the Pantry. It holds everything in your real kitchen. Tap it.' },
  { page: '/pantry', sel: '#p-name', text: 'Type something you have. Eggs. Everyone has eggs.',
    next: async () => { await typing; const el = $('#p-name'); if (el && !el.value.trim()) await typeInto(el, 'Eggs'); } },
  { page: '/pantry', sel: '[data-tour="add"]', advanceOn: 'whisk:added', text: 'Tap the green button to put it away. Clean station, happy Chef.',
    next: async () => { await typing; const el = $('#p-name'); if (el && !el.value.trim()) await typeInto(el, 'Eggs'); await wait(60); submit('[data-tour="add"]'); } },
  { page: '/pantry', sel: '[data-tour="scan"]', text: 'Just shopped? Scan it here instead of typing. Time is coins.' },
  { page: '/pantry', sel: '.nav a[href="/cook"]', go: '/cook', text: 'Now, the line. This is where we cook. Tap Cook.' },
  { page: '/cook', sel: '[data-tour="make"]', text: 'Tap “What can I make?” and I’ll match recipes to your pantry.' },
  { page: '/cook', sel: '#o-dish', text: 'Or search anything. A dish, a sauce, a whole country. Try “Albania.”' },
  { page: '/cook', sel: '.nav a[href="/home"]', go: '/home', text: 'Home shows meals you’re one or two groceries away from. Tap Home.' },
  { page: '/home', sel: () => $('main .card') || $('main .empty'), text: 'Almost there on a recipe? Add what’s missing to your shopping list in one tap.' },
  { page: '/home', sel: '.nav a[href="/compete"]', go: '/compete', text: 'Now, a quick word about team culture. Tap Compete.' },
  { page: '/compete', sel: '[data-tour="bingo"]', text: 'We’re a family here. A family that keeps score. Cook four cuisines in a row to win bingo.' },
  { page: '/compete', sel: '[data-tour="challenges"]', text: 'Weekly challenges pay coins. Nobody here does them for the coins.' },
  { page: '/compete', sel: '.nav a[href="/me"]', go: '/me', text: 'Everybody does them for the coins. Let’s go spend some. Tap Me.' },
  { page: '/me', sel: '[data-tour="coins"]', text: 'You start with 1,500 coins. Spend them like a professional.' },
  { page: '/me', sel: () => cheapestLocked()?.el, buy: true, action: true, sheet: true, label: 'Do it for me',
    text: (p) => `This shirt costs exactly ${p.toLocaleString('en-US')}. Very professional. Tap it.`,
    next: () => cheapestLocked()?.el.click(), waitFor: () => !!$('[data-tour="buy"]') },
  { page: '/me', sel: '[data-tour="buy"]', buy: true, action: true, sheet: true, label: 'Do it for me', text: 'Tap Buy. No refunds. Kitchen policy.',
    next: () => $('[data-tour="buy"]')?.click(), waitEvent: 'whisk:bought' },
  { page: '/me', sel: '[data-tour="stage"]', text: (_, bought) => (bought ? 'Sharp. That’s you, by the way. Drag your cook with a finger to spin around. Go on, show off.' : 'That’s you, by the way. Drag your cook with a finger to spin around.') },
  { page: '/me', sel: '[data-tour="slots"]', text: 'Hats, glasses, shoes. Everyone here fights for the best fit.' },
  { page: '/me', sel: '.album', text: 'But real respect comes from this passport. Cook 10 meals from a country to stamp it. Each stamp pays 5,000 coins.' },
  { text: 'Any questions?', label: '…' },
  { page: '/me', sel: '[data-tour="name"]', end: true, label: 'That’s me', text: 'Great. I love a quiet kitchen. Last thing: what do you go by?',
    show: async () => { const b = $('.namebtn'); if (b) { b.click(); await wait(80); } $('#nm')?.focus(); },
    next: async () => { if ($('[data-tour="name"] form')) { submit('[data-tour="name"] form'); await wait(300); } } }
];

export default function Tutorial({ coins = 0, onDone }) {
  const router = useRouter();
  const pathname = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pop, setPop] = useState(0);
  const bubble = useRef(null);
  const [bh, setBh] = useState(180);
  const canBuy = useRef(true);
  const bought = useRef(false);
  const price = useRef(1500);
  const working = useRef(false);
  const lifted = useRef(null);
  const entered = useRef({ i: -1, path: '' });

  const step = STEPS[i];
  const skipStep = (s) => s.buy && !canBuy.current;
  const nextIndex = (from) => { let n = from + 1; while (n < STEPS.length && skipStep(STEPS[n])) n++; return n; };

  // Lift the thing we're pointing at off the page, and keep the arrow on it while things move.
  const unlift = () => { lifted.current?.classList.remove('coach-lift'); lifted.current = null; };
  const locate = useCallback(() => {
    // Another sheet opened (a stamp, the scanner, Get coins)? Step aside until it's closed.
    const blocked = !step.sheet && !!document.querySelector('.scrim, .popup-scrim, .cc-scrim');
    setPaused((p) => (p === blocked ? p : blocked));
    if (!step.sel) { setRect(null); unlift(); return true; }
    const el = $(step.sel); if (!el) return false;
    if (lifted.current !== el) { unlift(); lifted.current = el; }
    if (!el.closest('.scrim') && !el.closest('.nav') && !el.classList.contains('coach-lift')) el.classList.add('coach-lift');
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) return false;
    setRect((o) => (o && o.x === r.left && o.y === r.top && o.w === r.width && o.h === r.height ? o : { x: r.left, y: r.top, w: r.width, h: r.height }));
    return true;
  }, [step]);
  useEffect(() => unlift, []);

  // Go to the page for this step, wait for its button to exist, scroll it into view, then point at it.
  useEffect(() => {
    let alive = true; setReady(false);
    if (entered.current.i !== i) entered.current = { i, path: pathname };
    // They tapped the lit-up button themselves (not just came Back to this step from that page)
    if (step.go && pathname === step.go && entered.current.path !== step.go) { setI(nextIndex(i)); return; }
    if (step.page && pathname !== step.page) { entered.current.path = step.page; router.push(step.page); return; }
    (async () => {
      if (step.buy && !step.waitEvent) { const c = cheapestLocked(); canBuy.current = !!c && c.price <= coins; if (c) price.current = c.price; if (!canBuy.current) { setI(nextIndex(i)); return; } }
      for (let t = 0; t < 40 && alive; t++) { if (!step.sel || $(step.sel)) break; await wait(100); }
      if (!alive) return;
      const el = step.sel ? $(step.sel) : null;
      if (el && !el.closest('.nav') && !el.closest('.scrim')) {
        el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        await wait(420);
      }
      if (!alive) return;
      locate(); setReady(true); setPop((n) => n + 1);
      if (step.show) await step.show();
    })();
    return () => { alive = false; };
  }, [i, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    let raf = 0; const tick = () => { locate(); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, locate]);
  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight); }, [i, ready, pop]);

  // Things the player does themselves move the story on.
  useEffect(() => {
    if (!ready) return;
    let iv = 0; const offs = [];
    const listen = (name, fn) => { window.addEventListener(name, fn); offs.push(() => window.removeEventListener(name, fn)); };
    if (step.advanceOn) listen(step.advanceOn, () => setI((n) => (n === i ? nextIndex(i) : n)));
    if (step.waitFor) iv = setInterval(() => { if (step.waitFor()) { clearInterval(iv); setI(nextIndex(i)); } }, 200);
    if (step.waitEvent) {
      listen(step.waitEvent, () => { bought.current = true; setI(nextIndex(i)); });
      // Closed the buy sheet without buying? Go back to the shirt.
      iv = setInterval(() => { if (!$('[data-tour="buy"]') && !bought.current) { clearInterval(iv); setI(i - 1); } }, 400);
    }
    return () => { clearInterval(iv); offs.forEach((f) => f()); };
  }, [ready, i]); // eslint-disable-line react-hooks/exhaustive-deps

  async function next() {
    if (working.current) return;
    try { navigator.vibrate?.(8); } catch {}
    working.current = true;
    try { await step.next?.(); } finally { working.current = false; }
    if (step.end) { unlift(); onDone(); return; }
    if (step.action) return;   // the waiters above move on once it's done
    if (step.advanceOn) { await wait(1500); setI((n) => (n === i ? nextIndex(i) : n)); return; }   // normally the event moves on first
    if (step.go) router.push(step.go);
    setI(nextIndex(i));
  }
  function back() {
    let n = i - 1; while (n > 0 && (STEPS[n].action || skipStep(STEPS[n]))) n--;
    setI(Math.max(0, n));
  }
  function skip() { unlift(); onDone(); }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 400, vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const pad = 6;
  const hole = rect ? { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 } : null;
  const bw = Math.min(310, vw - 32);
  let place = 'center', bx = (vw - bw) / 2, by = (vh - bh) / 2;
  if (hole) {
    const below = vh - (hole.y + hole.h), above = hole.y;
    place = below >= bh + 70 || below > above ? 'below' : 'above';
    by = place === 'below' ? Math.min(hole.y + hole.h + 58, vh - bh - 12) : Math.max(12, hole.y - bh - 58);
    bx = Math.min(Math.max(16, hole.x + hole.w / 2 - bw / 2), vw - bw - 16);
  }
  const ax = hole ? Math.min(Math.max(hole.x + hole.w / 2, 24), vw - 24) : 0;
  const text = typeof step.text === 'function' ? step.text(price.current, bought.current) : step.text;
  const total = STEPS.filter((s) => !skipStep(s)).length, at = STEPS.slice(0, i + 1).filter((s) => !skipStep(s)).length;

  return (
    <div className={`coach ${paused ? 'paused' : ''}`} role="presentation" aria-hidden={paused}>
      {/* dimmed surroundings; the lit-up hole is the thing to look at, and you can touch it */}
      {hole ? (
        <>
          <div className="coach-dim" style={{ left: 0, top: 0, width: '100%', height: Math.max(0, hole.y) }} />
          <div className="coach-dim" style={{ left: 0, top: hole.y + hole.h, width: '100%', bottom: 0 }} />
          <div className="coach-dim" style={{ left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h }} />
          <div className="coach-dim" style={{ left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h }} />
          <div className="coach-ring" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
          {ready && (
            <svg key={'a' + i} className={`coach-arrow ${place}`} width="46" height="52" viewBox="0 0 46 52" aria-hidden="true"
              style={{ left: ax - 23, top: place === 'below' ? hole.y + hole.h + 4 : hole.y - 56 }}>
              <path d="M23 3 L42 26 H31 V49 H15 V26 H4 Z" fill="#F4B740" stroke="#2A2433" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          )}
        </>
      ) : <div className="coach-dim" style={{ inset: 0 }} />}

      <div ref={bubble} className={`coach-bubble ${ready ? 'on' : ''}`} role="dialog" aria-modal="false" aria-live="polite" aria-label="Chef shows you around"
        style={{ left: bx, top: by, width: bw }}>
        <div className="coach-top"><span><b className="coach-who">Chef</b> · {at} of {total}</span>{!step.end && <button onClick={skip}>Skip</button>}</div>
        <p key={'t' + pop}>{text}</p>
        <div className="coach-actions">
          {i > 0 && <button className="coach-back" onClick={back} aria-label="Back">‹</button>}
          <button className="coach-next" onClick={next}>{step.label || 'Next'}<span aria-hidden="true">›</span></button>
        </div>
      </div>
    </div>
  );
}
