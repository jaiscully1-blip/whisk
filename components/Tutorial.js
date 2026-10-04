'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// First-time walkthrough (shown once per account). A bouncing arrow points at the real button with a few words;
// "Next" moves the arrow to the next thing. It walks through one full example, in the order you'd play:
// add food → find a recipe → search → compete → buy a shirt with the 1,500 starting coins.
// Written for kids and anyone new to phone games: short sentences, big tap targets, nothing happens by surprise.
const $ = (sel) => (typeof sel === 'function' ? sel() : document.querySelector(sel));
const cheapestLocked = () => [...document.querySelectorAll('.closet-grid .tile.locked')]
  .map((el) => ({ el, price: Number((el.querySelector('.tprice')?.textContent || '').replace(/\D/g, '')) })).filter((x) => x.price > 0).sort((a, b) => a.price - b.price)[0];

let typing = Promise.resolve();
function typeInto(el, text) { typing = typeSlow(el, text); return typing; }
function typeSlow(el, text) {
  // Fill a React-controlled input the way typing would, one letter at a time.
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  let i = 0;
  return new Promise((done) => { const t = setInterval(() => { i++; set.call(el, text.slice(0, i)); el.dispatchEvent(new Event('input', { bubbles: true })); if (i >= text.length) { clearInterval(t); done(); } }, 110); });
}

export default function Tutorial({ coins = 0, onDone }) {
  const router = useRouter();
  const pathname = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [ready, setReady] = useState(false);
  const [pop, setPop] = useState(0);
  const bubble = useRef(null);
  const [bh, setBh] = useState(180);
  const canBuy = useRef(true);

  const STEPS = useRef([
    { text: 'Hi! I’m Whisk 👋 I’ll show you how to play, one step at a time. Tap Next to start.' },
    { page: '/cook', sel: '.nav a[href="/pantry"]', text: 'This is your Pantry button. Your Pantry is a list of the food in your kitchen.', go: '/pantry' },
    { page: '/pantry', sel: '#p-name', text: 'Type a food you have in this box. Let’s try “Eggs”.', show: async () => { const el = $('#p-name'); if (el && !el.value) await typeInto(el, 'Eggs'); } },
    { page: '/pantry', sel: '[data-tour="add"]', text: 'Then tap this green button to save it. Tap Next and I’ll press it for you!', next: async () => {
      // Make sure the example is in the box, then submit the form the same way a tap on the button does.
      await typing; const el = $('#p-name'); if (el && !el.value.trim()) await typeInto(el, 'Eggs');
      await new Promise((r) => setTimeout(r, 60));
      const b = $('[data-tour="add"]'); if (b?.form?.requestSubmit) b.form.requestSubmit(b); else b?.click();
    } },
    { page: '/pantry', sel: '[data-tour="scan"]', text: 'Back from the store? Take a photo of your receipt here and Whisk adds all the food at once.' },
    { page: '/pantry', sel: '.nav a[href="/cook"]', text: 'Now let’s cook! This button opens the Cook page. Whisk always starts there.', go: '/cook' },
    { page: '/cook', sel: '[data-tour="make"]', text: 'Tap “What can I make?” to see recipes you can cook with the food you have.' },
    { page: '/cook', sel: '#o-dish', text: 'Or type any dish or country here, like “Tacos” or “Japan”, then tap Search. Tap a dish to see what you need and a video.' },
    { page: '/cook', sel: '.nav a[href="/home"]', text: 'Home shows recipes you are almost ready to make, when you only need 1 or 2 more foods.' },
    { page: '/cook', sel: '.nav a[href="/compete"]', text: 'Compete is where you win prizes. Let’s look!', go: '/compete' },
    { page: '/compete', sel: '[data-tour="bingo"]', text: 'Cook food from different countries to fill in this bingo card. Four in a row wins!' },
    { page: '/compete', sel: '[data-tour="challenges"]', text: 'Weekly challenges give you coins when you cook them and add a photo.' },
    { page: '/compete', sel: '.nav a[href="/me"]', text: 'Now the fun part: let’s go shopping! This button opens your Me page.', go: '/me' },
    { page: '/me', sel: '[data-tour="coins"]', text: 'These are your coins. You start with 1,500. Let’s spend them!' },
    { page: '/me', sel: () => cheapestLocked()?.el, buy: true, text: (p) => `This shirt costs ${p.toLocaleString('en-US')} coins. Tap it to buy it!`, action: true, next: () => cheapestLocked()?.el.click(), nextLabel: 'Do it for me', waitFor: () => !!$('[data-tour="buy"]') },
    { page: '/me', sel: '[data-tour="buy"]', buy: true, text: 'Tap the green Buy button.', action: true, next: () => $('[data-tour="buy"]')?.click(), nextLabel: 'Do it for me', waitEvent: 'whisk:bought' },
    { page: '/me', sel: '[data-tour="stage"]', text: (_, bought) => (bought ? 'Ta-da! 🎉 Whisk is wearing your new shirt. Drag him with your finger to spin him around.' : 'This is Whisk! Drag him with your finger to spin him around.') },
    { page: '/me', sel: '[data-tour="slots"]', text: 'Tap these buttons to see hats, glasses, shoes and more. Grey ones can be bought with coins.' },
    { page: '/me', sel: '.album', text: 'This is your passport. Cook 10 meals from a country to stamp it in color.' },
    { text: 'That’s it! You’re ready to cook. Have fun! 🍳', nextLabel: 'Let’s cook!', end: true }
  ]).current;
  const bought = useRef(false);
  const price = useRef(1500);

  // Skip the shopping steps if there's nothing affordable to buy.
  const step = STEPS[i];
  const skipStep = (s) => s.buy && !canBuy.current;

  const locate = useCallback(() => {
    if (!step.sel) { setRect(null); return true; }
    const el = $(step.sel); if (!el) return false;
    const r = el.getBoundingClientRect(); if (!r.width && !r.height) return false;
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    return true;
  }, [step]);

  // Go to the page for this step, wait for its button to exist, scroll it into view, then point at it.
  useEffect(() => {
    let alive = true; setReady(false);
    if (step.page && pathname !== step.page) { router.push(step.page); return; }
    (async () => {
      if (i === 14) { const c = cheapestLocked(); canBuy.current = !!c && c.price <= coins; if (c) price.current = c.price; if (!canBuy.current) { setI(16); return; } }
      for (let t = 0; t < 40 && alive; t++) { const el = step.sel ? $(step.sel) : true; if (el) break; await new Promise((r) => setTimeout(r, 100)); }
      if (!alive) return;
      const el = step.sel ? $(step.sel) : null;
      if (el && !el.closest('.nav') && !el.closest('.scrim')) {
        el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        await new Promise((r) => setTimeout(r, 420));
      }
      if (!alive) return;
      locate(); setReady(true); setPop((n) => n + 1);
      if (step.show) await step.show();
    })();
    return () => { alive = false; };
  }, [i, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the arrow on its target while things move (3D loading, images, sheets sliding in).
  useEffect(() => {
    if (!ready) return;
    let raf = 0; const tick = () => { locate(); raf = requestAnimationFrame(tick); };
    const t = setTimeout(() => { raf = requestAnimationFrame(tick); }, 50);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [ready, locate]);
  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight); }, [i, ready, pop]);

  // Steps where the player does it themselves: move on as soon as it happens.
  useEffect(() => {
    if (!ready || !step.action) return;
    let iv = 0; let off = null;
    if (step.waitFor) iv = setInterval(() => { if (step.waitFor()) { clearInterval(iv); setI((n) => n + 1); } }, 200);
    if (step.waitEvent) {
      const on = () => { bought.current = true; setI((n) => n + 1); };
      window.addEventListener(step.waitEvent, on); off = () => window.removeEventListener(step.waitEvent, on);
      // Closed the buy sheet without buying? Go back to the shirt.
      iv = setInterval(() => { if (!$('[data-tour="buy"]') && !bought.current) { clearInterval(iv); setI((n) => n - 1); } }, 400);
    }
    return () => { clearInterval(iv); off?.(); };
  }, [ready, i]); // eslint-disable-line react-hooks/exhaustive-deps

  const working = useRef(false);
  async function next() {
    if (working.current) return;
    try { navigator.vibrate?.(8); } catch {}
    if (step.end) { onDone(); router.push('/cook'); return; }
    working.current = true;
    try { await step.next?.(); } finally { working.current = false; }
    if (step.action) return;   // the waiters above move on once it's done
    if (step.go) router.push(step.go);
    let n = i + 1; while (n < STEPS.length && skipStep(STEPS[n])) n++;
    setI(n);
  }
  function back() {
    let n = i - 1; while (n > 0 && (STEPS[n].action || skipStep(STEPS[n]))) n--;
    setI(Math.max(0, n));
  }

  const vw = typeof window !== 'undefined' ? window.innerWidth : 400, vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const pad = 6;
  const hole = rect ? { x: rect.x - pad, y: rect.y - pad, w: rect.w + pad * 2, h: rect.h + pad * 2 } : null;
  const bw = Math.min(300, vw - 32);
  let place = 'center', bx = (vw - bw) / 2, by = (vh - bh) / 2;
  if (hole) {
    const below = vh - (hole.y + hole.h), above = hole.y;
    place = below >= bh + 70 || below > above ? 'below' : 'above';
    by = place === 'below' ? Math.min(hole.y + hole.h + 58, vh - bh - 12) : Math.max(12, hole.y - bh - 58);
    bx = Math.min(Math.max(16, hole.x + hole.w / 2 - bw / 2), vw - bw - 16);
  }
  const ax = hole ? Math.min(Math.max(hole.x + hole.w / 2, 24), vw - 24) : 0;
  const text = typeof step.text === 'function' ? step.text(price.current, bought.current) : step.text;
  const total = STEPS.length;

  return (
    <div className="coach" role="presentation">
      {/* dimmed surroundings; the bright hole is the thing to look at */}
      {hole ? (
        <>
          <div className="coach-dim" style={{ left: 0, top: 0, width: '100%', height: Math.max(0, hole.y) }} />
          <div className="coach-dim" style={{ left: 0, top: hole.y + hole.h, width: '100%', bottom: 0 }} />
          <div className="coach-dim" style={{ left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h }} />
          <div className="coach-dim" style={{ left: hole.x + hole.w, top: hole.y, right: 0, height: hole.h }} />
          <div className="coach-ring" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
          {!step.action && <div className="coach-block" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />}
          {ready && (
            <svg key={'a' + i} className={`coach-arrow ${place}`} width="46" height="52" viewBox="0 0 46 52" aria-hidden="true"
              style={{ left: ax - 23, top: place === 'below' ? hole.y + hole.h + 4 : hole.y - 56 }}>
              <path d="M23 3 L42 26 H31 V49 H15 V26 H4 Z" fill="#F4B740" stroke="#2A2433" strokeWidth="3.5" strokeLinejoin="round" />
            </svg>
          )}
        </>
      ) : <div className="coach-dim" style={{ inset: 0 }} />}

      <div ref={bubble} className={`coach-bubble ${ready ? 'on' : ''}`} role="dialog" aria-modal="true" aria-live="polite" aria-label="How to play"
        style={{ left: bx, top: by, width: bw }}>
        <div className="coach-top"><span>Step {i + 1} of {total}</span>{!step.end && <button onClick={onDone}>Skip tour</button>}</div>
        <p key={'t' + pop}>{text}</p>
        <div className="coach-actions">
          {i > 0 && !step.end && <button className="coach-back" onClick={back} aria-label="Back">‹</button>}
          <button className="coach-next" onClick={next} autoFocus>{step.nextLabel || (i === 0 ? 'Start' : 'Next')}<span aria-hidden="true">›</span></button>
        </div>
      </div>
    </div>
  );
}
