'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import DishFilters, { timeOk } from '@/components/DishFilters';

const PAGE = 10;
const SHOW = 3;   // missing ingredients shown on a card; the recipe lists them all
const mix = (id, seed) => { let h = seed >>> 0; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0; return h; };

// Home is "Discover a Dish": recipes you can't fully make yet (plus a defrost reminder when frozen meat is waiting).
// Always a fresh random mix each time it opens (Shuffle for another).
export default function Home() {
  const { supabase, recipes, say, ui, setUi, t } = useWhisk();
  const time = ui.homeTime || 'any', useUp = !!ui.homeUseUp;
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const moreRef = useRef(null);

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const almost = useMemo(() => {
    if (!pantry || !recipes) return null;
    const list = recipes.map((r) => ({ r, c: checkRecipe(r, pantry), soon: usesSoon(r, pantry) })).filter((x) => x.c.missing.length >= 1)
      .map((x) => { const main = new Set(x.c.missing.map(canon)); const needs = shoppingNeeds(x.r, pantry); return { ...x, needs: [...needs.filter((n) => main.has(canon(n))), ...needs.filter((n) => !main.has(canon(n)))] }; });
    // A fresh random mix every time Home opens (and on Shuffle). Recipes that use food about to go bad still come first.
    const ordered = list.sort((a, b) => mix(a.r.id, seed) - mix(b.r.id, seed));
    const all = [...ordered.filter((x) => x.soon.length), ...ordered.filter((x) => !x.soon.length)];
    // how long you have, and "Use it up" (Discover a Dish filters)
    return all.filter(({ r, soon }) => timeOk(time, r.minutes) && (!useUp || soon.length));
  }, [pantry, recipes, seed, time, useUp]); // eslint-disable-line react-hooks/exhaustive-deps
  const shuffle = () => { setSeed((x) => (x + 0x9e3779b9) >>> 0); setShown(PAGE); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => {
    const el = moreRef.current; if (!el || !almost || shown >= almost.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '500px' });
    io.observe(el); return () => io.disconnect();
  }, [almost, shown]);
  const expiring = useMemo(() => new Set((pantry || []).filter((p) => p.status !== 'out' && p.expires_on && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 <= 3 && (new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5 >= 0).map((p) => canon(p.name))).size, [pantry]);
  const frozen = (pantry || []).filter((p) => { const t = thawState(p); return t && t.state !== 'thawed'; });

  async function addToList(r, missing) { say(listMsg(await addToShoppingList(supabase, missing))); }

  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      {frozen.length > 0 && <ThawBanner items={frozen} onChanged={reload} />}
      <div className="page-title" style={{ margin: '6px 0 0' }}><h1>{t('Discover a Dish')}</h1>{almost && almost.length > 1 && <button type="button" className="title-link" onClick={shuffle}><Icon name="shuffle" size={18} />{t('Shuffle')}</button>}</div>
      <DishFilters time={time} useUp={useUp} expiring={expiring} onTime={(v) => { setUi({ homeTime: v }); setShown(PAGE); }} onUseUp={(v) => { setUi({ homeUseUp: v }); setShown(PAGE); }} />
      {almost === null ? <p className="muted">Checking your pantry…</p> : almost.length === 0 && (time !== 'any' || useUp) ? (
        <div className="empty"><b>{useUp ? 'Nothing to use up' : 'No dishes match'}</b>{useUp ? 'No dish needs the food that is about to go off.' : 'Try another time.'}<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><button type="button" className="btn ghost" onClick={() => setUi({ homeTime: 'any', homeUseUp: false })}>Show everything</button></div></div>
      ) : almost.length === 0 ? (
        <div className="empty"><b>Nothing almost ready</b>Add more to your pantry, or see what you can make right now.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">{t('Add pantry items')}</Link><Link className="btn ghost" href="/cook">{t('What can I make?')}</Link></div></div>
      ) : almost.slice(0, shown).map(({ r, c, soon, needs }, i, arr) => (
        <div key={r.id} className="stack" style={{ gap: 8 }}>
        {soon.length > 0 && i === 0 && <h2 className="away-h soon-h">{t('Use it before it goes bad')}</h2>}
        <div className="card stack rcard" style={{ gap: 8 }}>
          <Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} />
          <div className="rcard-body stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src"><a href={r.url} target="_blank" rel="noopener noreferrer">{t('Full recipe')}</a> · {r.minutes} min</span>
          {soon.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} before it goes bad</span>}
          <DietTags recipe={r} max={3} />
          <div className="row">{needs.slice(0, SHOW).map((m) => <span key={m} className="chip need">+ {m}</span>)}{needs.length > SHOW && <button type="button" className="chip more-need" onClick={() => setOpen(r)} aria-label={`See all ${needs.length} you need`}>+{needs.length - SHOW} more</button>}</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => addToList(r, needs)}>{t('Add to list')}</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setOpen(r)}>{t('Open recipe')}</button>
          </div>
          </div>
        </div>
        </div>
      ))}
      {almost && almost.length > shown && <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>{t('Show more')}</button></div>}
      {open && <RecipeSheet recipe={open} pantry={pantry} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
