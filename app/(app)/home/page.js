'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import ThawBanner from '@/components/ThawBanner';
import { usePantry, useSaved } from '@/components/usePantry';
import { checkRecipe, thawState } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';

const PAGE = 10;
const away = (n) => `${n} item${n === 1 ? '' : 's'} away`;

// Home is "Almost ready": every recipe you can't fully make yet, closest first (plus a defrost reminder when frozen meat is waiting).
export default function Home() {
  const { supabase, recipes, say } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const moreRef = useRef(null);

  const almost = useMemo(() => {
    if (!pantry || !recipes) return null;
    return recipes.map((r) => ({ r, c: checkRecipe(r, pantry) })).filter((x) => x.c.missing.length >= 1)
      .sort((a, b) => a.c.missing.length - b.c.missing.length || a.r.minutes - b.r.minutes);
  }, [pantry, recipes]);
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
      <div className="page-title" style={{ margin: '6px 0 0' }}><h1>Almost ready</h1>{almost && <span className="muted">{almost.length} recipe{almost.length === 1 ? '' : 's'}</span>}</div>
      {almost === null ? <p className="muted">Checking your pantry…</p> : almost.length === 0 ? (
        <div className="empty"><b>Nothing almost ready</b>Add more to your pantry, or see what you can make right now.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">Add pantry items</Link><Link className="btn ghost" href="/cook">What can I make?</Link></div></div>
      ) : almost.slice(0, shown).map(({ r, c }, i, arr) => (
        <div key={r.id} className="stack" style={{ gap: 8 }}>
        {(i === 0 || arr[i - 1].c.missing.length !== c.missing.length) && <h2 className="away-h">{away(c.missing.length)}</h2>}
        <div className="card stack" style={{ gap: 8 }}>
          <span className="eyebrow">{r.cuisine} · {away(c.missing.length)}</span>
          <h2 style={{ fontSize: 22 }}>{r.title}</h2>
          <span className="src">From <a href={r.url} target="_blank" rel="noopener noreferrer">{r.source}</a> · {r.minutes} min</span>
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
