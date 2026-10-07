'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import DietTags from '@/components/DietTags';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import ThawBanner from '@/components/ThawBanner';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';
import { checkRecipe, thawState } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';

const PAGE = 10;
const SORT_FROM = 10;   // with fewer pantry items than this, "closest first" would show the same few recipes; mix it up instead
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
    const list = recipes.map((r) => ({ r, c: checkRecipe(r, pantry) })).filter((x) => x.c.missing.length >= 1);
    return sorted ? list.sort((a, b) => a.c.missing.length - b.c.missing.length || a.r.minutes - b.r.minutes)
      : list.sort((a, b) => mix(a.r.id, seed) - mix(b.r.id, seed));
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
      ) : almost.slice(0, shown).map(({ r, c }, i, arr) => (
        <div key={r.id} className="stack" style={{ gap: 8 }}>
        {sorted && (i === 0 || arr[i - 1].c.missing.length !== c.missing.length) && <h2 className="away-h">{away(c.missing.length)}</h2>}
        <div className="card stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src"><a href={r.url} target="_blank" rel="noopener noreferrer">Full recipe</a> · {r.minutes} min</span>
          <DietTags recipe={r} max={3} />
          <div className="row">{c.missing.map((m) => <span key={m} className="chip need">+ {m}</span>)}</div>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => addToList(r, c.missing)}>Add to list</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setOpen(r)}>Open recipe</button>
          </div>
        </div>
        </div>
      ))}
      {almost && almost.length > shown && <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>Show more</button></div>}
      {open && <RecipeSheet recipe={open} pantry={pantry} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
