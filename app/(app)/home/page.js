'use client';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import DietTags from '@/components/DietTags';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import ThawBanner from '@/components/ThawBanner';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';
import { addToShoppingList, listMsg } from '@/lib/shoplist';
import { checkRecipe, thawState, usesSoon, shoppingNeeds, canon } from '@/lib/recipes/match';
import Postcard from '@/components/Postcard';
import { openRecipe, warmRecipes } from '@/lib/openRecipe';
import { timedFetch } from '@/lib/netFetch';

const PAGE = 10;
const SHOW = 3;   // missing ingredients shown on a card; the recipe lists them all
// Discover a Dish keeps the same mix for as long as you are in the app (switching tabs and coming back changes nothing).
// It only deals a new one after you have left the app for a while and come back (or pressed Shuffle).
let SESSION = null; let hiddenAt = 0;
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 60000) { SESSION = null; hiddenAt = 0; }
});
const mix = (id, seed) => { let h = seed >>> 0; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0; return h; };

// Home is "Discover a Dish": recipes you can't fully make yet (plus a defrost reminder when frozen meat is waiting).
// Always a fresh random mix each time it opens (Shuffle for another).
export default function Home() {
  const { supabase, recipes, say, ui, setUiQuiet, t, ensureRecipes, peekRecipe } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(() => (SESSION ? SESSION.shown : PAGE));
  const moreRef = useRef(null);
  const fabRef = useRef(null);
  // The shuffle button tucks away while you scroll down and comes back when you stop or scroll up (no re-renders).
  useEffect(() => {
    let y = window.scrollY, t;
    const on = () => {
      const el = fabRef.current; if (!el) return;
      const ny = window.scrollY; if (ny > y + 4) el.classList.add('away'); else if (ny < y - 4) el.classList.remove('away'); y = ny;
      clearTimeout(t); t = setTimeout(() => el.classList.remove('away'), 450);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); clearTimeout(t); };
  }, []);

  const [sess] = useState(() => (SESSION ||= { seed: Math.floor(Math.random() * 2 ** 31), topSeed: Math.floor(Math.random() * 2 ** 31), pool: [], next: [], seen: new Set(ui?.seenDiscover || []), ready: false, shown: PAGE }));
  const [seed, setSeed] = useState(sess.seed);
  // Dishes from all over the world join the web recipes. They're fetched once, before the first card is drawn, so nothing reshuffles afterwards.
  const [worldPool, setWorldPool] = useState(sess.pool);
  const [ready, setReady] = useState(sess.ready);
  const grab = useCallback((sd) => timedFetch(`/api/world-recipe?sample=90&seed=${sd}`).then((r) => (r.ok ? r.json() : null)).then((j) => j?.recipes || []).catch(() => []), []);
  useEffect(() => {
    if (sess.ready) { return undefined; }
    let off = false;
    const t = setTimeout(() => { if (!off) { sess.ready = true; setReady(true); } }, 2500);   // slow network: show what we have
    grab(sess.seed).then((list) => { if (off) return; sess.pool = list; sess.ready = true; setWorldPool(list); setReady(true); grab((sess.seed + 0x9e3779b9) >>> 0).then((n) => { sess.next = n; }); });
    return () => { off = true; clearTimeout(t); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { sess.shown = shown; }, [shown, sess]);
  const seen = sess.seen;   // what you saw in earlier visits
  // Heavy part (matching every recipe to your pantry) only when the pantry or recipes change.
  // Each recipe is matched once per pantry and remembered, so Shuffle (which adds a batch of new world dishes) only
  // matches the new ones instead of redoing every recipe: it stays instant however long you've been on the page.
  const checked = useRef({ pantry: null, map: new Map() });
  const base = useMemo(() => {
    if (!pantry || !recipes) return null;
    if (checked.current.pantry !== pantry) checked.current = { pantry, map: new Map() };
    const memo = checked.current.map;
    const one = (r) => {
      let x = memo.get(r);
      if (x === undefined) {
        const c = checkRecipe(r, pantry);
        if (c.missing.length < 1) x = null;
        else { const main = new Set(c.missing.map(canon)); const needs = shoppingNeeds(r, pantry); x = { r, c, soon: usesSoon(r, pantry), needs: [...needs.filter((n) => main.has(canon(n))), ...needs.filter((n) => !main.has(canon(n)))] }; }
        memo.set(r, x);
      }
      return x;
    };
    const web = new Set(recipes.map((r) => r.id));
    return [...recipes, ...worldPool.filter((r) => !web.has(r.id))].map(one).filter(Boolean);
  }, [pantry, recipes, worldPool]);
  // A fresh random mix every time Home opens (and on Shuffle). Recipes that use food about to go bad still come first.
  const ordered = useMemo(() => {
    if (!base) return null;
    const rnd = (id) => mix(id, seed);
    // new dishes first, then ones you've already seen; within each, one cuisine at a time in turn so the same place never repeats back to back
    const diverse = (list) => {
      const g = new Map(); [...list].sort((a, b) => rnd(a.r.id) - rnd(b.r.id)).forEach((x) => { const k = x.r.cuisine || x.r.country || '?'; if (!g.has(k)) g.set(k, []); g.get(k).push(x); });
      const groups = [...g.values()].sort((a, b) => rnd(a[0].r.id) - rnd(b[0].r.id)); const out = [];
      for (let i = 0; out.length < list.length; i++) for (const q of groups) if (q[i]) out.push(q[i]);
      return out;
    };
    const fresh = (x) => !seen.has(x.r.id);
    // Food about to go bad: the first block of Home, and it stays put when you shuffle. For each expiring ingredient, up to two dishes
    // that use it, leaning on dishes that use several expiring ingredients at once. Everything else is shuffled below it.
    let top = [];
    const sig = (pantry || []).filter((p) => p.status !== 'out' && p.expires_on).map((p) => `${p.name}|${p.expires_on}`).sort().join(',');
    const byId = new Map(base.map((x) => [x.r.id, x]));
    if (ready && sess.topIds && sess.topSig === sig && (sess.topWithPool || !worldPool.length)) top = sess.topIds.map((id) => byId.get(id)).filter(Boolean);   // chosen once the full list arrived: shuffling never swaps it out
    else {
      const soonAll = base.filter((x) => x.soon.length);
      const left = new Map(); soonAll.forEach((x) => x.soon.forEach((p) => { const k = canon(p.name); if (!left.has(k) || left.get(k) > p.left) left.set(k, p.left); }));
      const cnt = new Map(); const rs = (id) => mix(id, sess.topSeed);
      for (const [k] of [...left].sort((a, b) => a[1] - b[1])) {
        const cands = soonAll.filter((x) => !top.includes(x) && x.soon.some((p) => canon(p.name) === k)).sort((a, b) => b.soon.length - a.soon.length || rs(a.r.id) - rs(b.r.id));
        for (const x of cands) { if ((cnt.get(k) || 0) >= 2 || top.length >= 8) break; top.push(x); x.soon.forEach((p) => { const kk = canon(p.name); cnt.set(kk, (cnt.get(kk) || 0) + 1); }); }
      }
      top.sort((a, b) => a.soon[0].left - b.soon[0].left || b.soon.length - a.soon.length);
      if (ready) { sess.topIds = top.map((x) => x.r.id); sess.topSig = sig; sess.topWithPool = worldPool.length > 0; }
    }
    const rest = base.filter((x) => !top.includes(x));
    return [...top, ...diverse(rest.filter(fresh)), ...diverse(rest.filter((x) => !fresh(x)))];
  }, [base, seed, seen, ready, pantry, worldPool]); // eslint-disable-line react-hooks/exhaustive-deps
  // remember what you've been shown, so the next visit leads with dishes you haven't seen
  useEffect(() => {
    if (!ordered) return;
    const ids = ordered.slice(0, shown).map((x) => x.r.id);
    setUiQuiet?.((cur) => ({ seenDiscover: [...new Set([...(cur.seenDiscover || []), ...ids])].slice(-900) }));
  }, [ordered, shown]); // eslint-disable-line react-hooks/exhaustive-deps
  const almost = ordered;
  const shuffle = () => {
    const ns = (seed + 0x9e3779b9) >>> 0;
    const have = new Set(sess.pool.map((x) => x.id)); sess.pool = [...sess.pool, ...sess.next.filter((x) => !have.has(x.id))].slice(-360); sess.next = []; sess.seed = ns; sess.shown = PAGE;
    grab((ns + 0x9e3779b9) >>> 0).then((n) => { sess.next = n; });   // ready for the next press
    setWorldPool(sess.pool); setSeed(ns); setShown(PAGE); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  useEffect(() => {
    const el = moreRef.current; if (!el || !almost || shown >= almost.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '500px' });
    io.observe(el); return () => io.disconnect();
  }, [almost, shown]);
  const expiring = useMemo(() => new Set((pantry || []).filter((p) => p.status !== 'out' && p.expires_on && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 <= 3 && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 >= 0).map((p) => canon(p.name))).size, [pantry]);
  const frozen = (pantry || []).filter((p) => { const t = thawState(p); return t && t.state !== 'thawed'; });

  const openFull = useCallback((r) => openRecipe(r, { setOpen, ensureRecipes, peekRecipe, say }), [ensureRecipes, peekRecipe, say]);
  const warm = useCallback((r) => warmRecipes([r.id], ensureRecipes), [ensureRecipes]);
  // warm up the first few dishes on screen, so opening one is instant
  useEffect(() => { if (almost?.length) warmRecipes(almost.slice(0, 4).map((x) => x.r.id), ensureRecipes); }, [almost]); // eslint-disable-line react-hooks/exhaustive-deps
  const addToList = useCallback(async (r, missing) => { say(listMsg(await addToShoppingList(supabase, missing))); }, [supabase, say]);

  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      {frozen.length > 0 && <ThawBanner items={frozen} onChanged={reload} />}
      <div className="page-title" style={{ margin: '6px 0 0' }}><h1>{t('Discover a Dish')}</h1></div>
      {almost === null || !ready ? <div className="dish-skel" aria-busy="true" aria-label={t('Loading dishes')} data-testid="dish-skel">{[0, 1].map((i) => <div key={i} className="card"><i className="art" /><i className="ln w60" /><i className="ln w40" /><i className="ln w80" /></div>)}</div> : almost.length === 0 ? (
        <div className="empty"><b>Nothing almost ready</b>Add more to your pantry, or see what you can make right now.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">{t('Add pantry items')}</Link><Link className="btn ghost" href="/cook">{t('What can I make?')}</Link></div></div>
      ) : almost.slice(0, shown).map((x, i) => <DishCard key={x.r.id} x={x} first={i === 0} lazy={i > 1} onOpen={openFull} onWarm={warm} onAdd={addToList} t={t} />)}
      {almost && almost.length > shown && <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>{t('Show more')}</button></div>}
      {almost && almost.length > 1 && !open && <button ref={fabRef} type="button" className="fab-shuffle" data-testid="shuffle" onClick={shuffle} aria-label={t('Shuffle')} title={t('Shuffle')}><Icon name="shuffle" size={22} /></button>}
      {open && <RecipeSheet recipe={open} pantry={pantry} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}

// One recipe card. Memoised: shuffling or filtering re-uses cards that are already drawn.
const DishCard = memo(function DishCard({ x: { r, soon, needs }, first, lazy, onOpen, onWarm, onAdd, t }) {
  return (
        <div className="stack" style={{ gap: 8 }}>
        {soon.length > 0 && first && <><h2 className="away-h soon-h">{t('Use it before it goes bad')}</h2></>}
        <div className="card stack rcard" style={{ gap: 8 }}>
          <Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} lazy={lazy} />
          <div className="rcard-body stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src">{r.url && !/^w-/.test(r.id) ? <><a href={r.url} target="_blank" rel="noopener noreferrer">{t('Full recipe')}</a> · </> : null}{r.minutes} min</span>
          {soon.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} · {soon[0].left === 0 ? 'goes bad today' : soon[0].left === 1 ? 'goes bad tomorrow' : `${soon[0].left} days left`}</span>}
          <DietTags recipe={r} max={3} />
          <div className="row">{needs.slice(0, SHOW).map((m) => <span key={m} className="chip need">+ {m}</span>)}{needs.length > SHOW && <button type="button" className="chip more-need" onClick={() => onOpen(r)} aria-label={`See all ${needs.length} you need`}>+{needs.length - SHOW} more</button>}</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => onAdd(r, needs)}>{t('Add to list')}</button>
            <button className="btn" style={{ flex: 1 }} onPointerDown={() => onWarm?.(r)} onClick={() => onOpen(r)}>{t('Open recipe')}</button>
          </div>
          </div>
        </div>
        </div>
  );
});
