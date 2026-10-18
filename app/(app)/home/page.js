'use client';
import { memo, startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
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

const PAGE = 10;
const SHOW = 3;   // missing ingredients shown on a card; the recipe lists them all
const mix = (id, seed) => { let h = seed >>> 0; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0; return h; };

// Home is "Discover a Dish": recipes you can't fully make yet (plus a defrost reminder when frozen meat is waiting).
// Always a fresh random mix each time it opens (Shuffle for another).
export default function Home() {
  const { supabase, recipes, say, ui, setUiQuiet, t } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(PAGE);
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

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  // Heavy part (matching every recipe to your pantry) only when the pantry or recipes change.
  const base = useMemo(() => {
    if (!pantry || !recipes) return null;
    return recipes.map((r) => ({ r, c: checkRecipe(r, pantry), soon: usesSoon(r, pantry) })).filter((x) => x.c.missing.length >= 1)
      .map((x) => { const main = new Set(x.c.missing.map(canon)); const needs = shoppingNeeds(x.r, pantry); return { ...x, needs: [...needs.filter((n) => main.has(canon(n))), ...needs.filter((n) => !main.has(canon(n)))] }; });
  }, [pantry, recipes]);
  // A fresh random mix every time Home opens (and on Shuffle). Recipes that use food about to go bad still come first.
  const ordered = useMemo(() => {
    if (!base) return null;
    const o = [...base].sort((a, b) => mix(a.r.id, seed) - mix(b.r.id, seed));
    return [...o.filter((x) => x.soon.length), ...o.filter((x) => !x.soon.length)];
  }, [base, seed]);
  const almost = ordered;
  const shuffle = () => { startTransition(() => { setSeed((x) => (x + 0x9e3779b9) >>> 0); setShown(PAGE); }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => {
    const el = moreRef.current; if (!el || !almost || shown >= almost.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '500px' });
    io.observe(el); return () => io.disconnect();
  }, [almost, shown]);
  const expiring = useMemo(() => new Set((pantry || []).filter((p) => p.status !== 'out' && p.expires_on && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 <= 3 && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 >= 0).map((p) => canon(p.name))).size, [pantry]);
  const frozen = (pantry || []).filter((p) => { const t = thawState(p); return t && t.state !== 'thawed'; });

  const addToList = useCallback(async (r, missing) => { say(listMsg(await addToShoppingList(supabase, missing))); }, [supabase, say]);

  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      {frozen.length > 0 && <ThawBanner items={frozen} onChanged={reload} />}
      <div className="page-title" style={{ margin: '6px 0 0' }}><h1>{t('Discover a Dish')}</h1>{almost && almost.length > 1 && <button type="button" className="dice-btn" data-testid="shuffle-banner" onClick={shuffle} aria-label={t('Shuffle')}><Icon name="shuffle" size={26} /></button>}</div>
      {almost === null ? <p className="muted">Checking your pantry…</p> : almost.length === 0 ? (
        <div className="empty"><b>Nothing almost ready</b>Add more to your pantry, or see what you can make right now.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">{t('Add pantry items')}</Link><Link className="btn ghost" href="/cook">{t('What can I make?')}</Link></div></div>
      ) : almost.slice(0, shown).map((x, i) => <DishCard key={x.r.id} x={x} first={i === 0} onOpen={setOpen} onAdd={addToList} t={t} />)}
      {almost && almost.length > shown && <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>{t('Show more')}</button></div>}
      {almost && almost.length > 1 && !open && <button ref={fabRef} type="button" className="fab-shuffle" data-testid="shuffle" onClick={shuffle} aria-label={t('Shuffle')} title={t('Shuffle')}><Icon name="shuffle" size={22} /></button>}
      {open && <RecipeSheet recipe={open} pantry={pantry} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}

// One recipe card. Memoised: shuffling or filtering re-uses cards that are already drawn.
const DishCard = memo(function DishCard({ x: { r, soon, needs }, first, onOpen, onAdd, t }) {
  return (
        <div className="stack" style={{ gap: 8 }}>
        {soon.length > 0 && first && <h2 className="away-h soon-h">{t('Use it before it goes bad')}</h2>}
        <div className="card stack rcard" style={{ gap: 8 }}>
          <Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} />
          <div className="rcard-body stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src"><a href={r.url} target="_blank" rel="noopener noreferrer">{t('Full recipe')}</a> · {r.minutes} min</span>
          {soon.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} before it goes bad</span>}
          <DietTags recipe={r} max={3} />
          <div className="row">{needs.slice(0, SHOW).map((m) => <span key={m} className="chip need">+ {m}</span>)}{needs.length > SHOW && <button type="button" className="chip more-need" onClick={() => onOpen(r)} aria-label={`See all ${needs.length} you need`}>+{needs.length - SHOW} more</button>}</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => onAdd(r, needs)}>{t('Add to list')}</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => onOpen(r)}>{t('Open recipe')}</button>
          </div>
          </div>
        </div>
        </div>
  );
});
