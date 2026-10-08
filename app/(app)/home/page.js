'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import DietTags from '@/components/DietTags';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import ThawBanner from '@/components/ThawBanner';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';
import { checkRecipe, thawState, usesSoon, shoppingNeeds, canon } from '@/lib/recipes/match';
import Postcard from '@/components/Postcard';
import { guessCategory } from '@/lib/game';

const PAGE = 10;
const SORT_FROM = 10;   // with fewer pantry items than this, "closest first" would show the same few recipes; mix it up instead
const SHOW = 3;   // missing ingredients shown on a card; the recipe lists them all
const away = (n) => `${n} item${n === 1 ? '' : 's'} away`;
const mix = (id, seed) => { let h = seed >>> 0; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 2654435761) >>> 0; return h; };

// Home is "Almost ready": recipes you can't fully make yet (plus a defrost reminder when frozen meat is waiting).
// Under 10 pantry items the list is mixed (Shuffle for a new mix); from 10 on it's grouped 1, 2, 3… items away.
export default function Home() {
  const { supabase, recipes, say } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const moreRef = useRef(null);

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 31));
  const stocked = (pantry || []).filter((p) => p.status !== 'out').length;
  const sorted = stocked >= SORT_FROM;
  const almost = useMemo(() => {
    if (!pantry || !recipes) return null;
    const list = recipes.map((r) => ({ r, c: checkRecipe(r, pantry), soon: usesSoon(r, pantry) })).filter((x) => x.c.missing.length >= 1)
      .map((x) => { const main = new Set(x.c.missing.map(canon)); const needs = shoppingNeeds(x.r, pantry); return { ...x, needs: [...needs.filter((n) => main.has(canon(n))), ...needs.filter((n) => !main.has(canon(n)))] }; });
    const ordered = sorted ? list.sort((a, b) => a.c.missing.length - b.c.missing.length || a.r.minutes - b.r.minutes)
      : list.sort((a, b) => mix(a.r.id, seed) - mix(b.r.id, seed));
    // Recipes that use food about to go bad come first (fewest missing first among them).
    return [...ordered.filter((x) => x.soon.length).sort((a, b) => a.c.missing.length - b.c.missing.length), ...ordered.filter((x) => !x.soon.length)];
  }, [pantry, recipes, sorted, seed]);
  const shuffle = () => { setSeed((x) => (x + 0x9e3779b9) >>> 0); setShown(PAGE); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => {
    const el = moreRef.current; if (!el || !almost || shown >= almost.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '500px' });
    io.observe(el); return () => io.disconnect();
  }, [almost, shown]);
  const frozen = (pantry || []).filter((p) => { const t = thawState(p); return t && t.state !== 'thawed'; });

  async function addToList(r, missing) {
    const { data: list } = await supabase.from('shopping_items').select('name');
    const have = new Set((list || []).map((l) => l.name.toLowerCase()));
    const add = missing.filter((m) => !have.has(m.toLowerCase()));
    if (add.length) await supabase.from('shopping_items').insert(add.map((m) => ({ name: m.slice(0, 60), category: guessCategory(m) })));
    say(add.length ? `Added ${add.length} to your shopping list` : 'Already on your list');
  }

  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      {frozen.length > 0 && <ThawBanner items={frozen} onChanged={reload} />}
      <div className="page-title" style={{ margin: '6px 0 0' }}><h1>Almost ready</h1>{almost && !sorted && almost.length > 1 && <button type="button" className="title-link" onClick={shuffle}><Icon name="shuffle" size={18} />Shuffle</button>}</div>
      {almost === null ? <p className="muted">Checking your pantry…</p> : almost.length === 0 ? (
        <div className="empty"><b>Nothing almost ready</b>Add more to your pantry, or see what you can make right now.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">Add pantry items</Link><Link className="btn ghost" href="/cook">What can I make?</Link></div></div>
      ) : almost.slice(0, shown).map(({ r, c, soon, needs }, i, arr) => (
        <div key={r.id} className="stack" style={{ gap: 8 }}>
        {soon.length > 0 && i === 0 && <h2 className="away-h soon-h">Use it before it goes bad</h2>}
        {sorted && !soon.length && (i === 0 || arr[i - 1].soon.length > 0 || arr[i - 1].c.missing.length !== c.missing.length) && <h2 className="away-h">{away(c.missing.length)}</h2>}
        <div className="card stack rcard" style={{ gap: 8 }}>
          <Postcard iso={r.country} cuisine={r.cuisine} title={r.title} />
          <div className="rcard-body stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src"><a href={r.url} target="_blank" rel="noopener noreferrer">Full recipe</a> · {r.minutes} min</span>
          {soon.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} before it goes bad</span>}
          <DietTags recipe={r} max={3} />
          <div className="row">{needs.slice(0, SHOW).map((m) => <span key={m} className="chip need">+ {m}</span>)}{needs.length > SHOW && <button type="button" className="chip more-need" onClick={() => setOpen(r)} aria-label={`See all ${needs.length} you need`}>+{needs.length - SHOW} more</button>}</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => addToList(r, needs)}>Add to list</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setOpen(r)}>Open recipe</button>
          </div>
          </div>
        </div>
        </div>
      ))}
      {almost && almost.length > shown && <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>Show more</button></div>}
      {open && <RecipeSheet recipe={open} pantry={pantry} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
