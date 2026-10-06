'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWhisk, useDraft } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';

const PAGE = 12;
import { canon, checkRecipe } from '@/lib/recipes/match';
import MyYouTubers from '@/components/MyYouTubers';
import DishSearch from '@/components/DishSearch';

const SKIP = ['Spices & Seasonings', 'Sauces & Oils', 'Baking'];
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);

// Only real recipes from the web, and only ones your pantry can make.
export default function Cook() {
  const { recipes, ui, setUi } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [shown, setShown] = useState(PAGE);
  const moreRef = useRef(null);
  const [dish, setDish] = useDraft('o-dish');
  const [hand, setHand] = useState(null);
  const [open, setOpen] = useState(null);
  const savedMode = ui.cookMode || null; const time = ui.cookTime || ''; const cu = ui.cookCuisine || ''; 

  const mode = savedMode === 'raid' && !hand ? 'pantry' : savedMode;
  const inStock = useMemo(() => (pantry || []).filter((p) => p.status !== 'out'), [pantry]);
  const makeable = useMemo(() => (recipes && pantry ? recipes.map((r) => ({ r, c: checkRecipe(r, pantry) })).filter((x) => x.c.ok) : []), [recipes, pantry]);
  const cuisines = useMemo(() => [...new Set((recipes || []).map((r) => r.cuisine))].sort(), [recipes]);

  const results = useMemo(() => {
    if (!mode) return null;
    let list = makeable.filter(({ r }) => (!+time || r.minutes <= +time) && (!cu || r.cuisine === cu));
    if (mode === 'raid' && hand) { const hc = new Set(hand.map(canon)); list = list.map((x) => ({ ...x, hits: x.r.key.filter((k) => hc.has(canon(k))).length })).filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits); }
    if (mode === 'named') { const words = (ui.cookDish || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2); list = list.filter(({ r }) => words.some((w) => `${r.title} ${r.cuisine}`.toLowerCase().includes(w.replace(/s$/, '')))); }
    return list;
  }, [mode, makeable, time, cu, hand, ui.cookDish]);

  const names = inStock.filter((p) => !SKIP.includes(p.category)).map((p) => p.name);
  // Keep loading more as you scroll, until every recipe your pantry can make is on screen.
  useEffect(() => { setShown(PAGE); }, [mode, time, cu, hand, ui.cookDish]);
  useEffect(() => {
    const el = moreRef.current; if (!el || !results || shown >= results.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '400px' });
    io.observe(el); return () => io.disconnect();
  }, [results, shown]);

  function raid() {
    const pool = [...names]; const h = [];
    while (h.length < 4 && pool.length) h.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    setHand(h); setUi({ cookMode: 'raid' });
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>Cook</h1><span className="muted">{inStock.length} items in your pantry</span></div>
      <div className="card stack">
        <div className="grid2">
          <div><label className="lbl" htmlFor="o-time">Time limit</label><select id="o-time" className="input" value={time} onChange={(e) => setUi({ cookTime: e.target.value })}>{[['', 'Any'], ['20', '20 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 hour'], ['120', '2 hours']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="lbl" htmlFor="o-cu">Cuisine</label><select id="o-cu" className="input" value={cu} onChange={(e) => setUi({ cookCuisine: e.target.value })}><option value="">Any</option>{cuisines.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <button data-tour="make" data-tip="make" className="btn wide" onClick={() => { setHand(null); setUi({ cookMode: 'pantry' }); }}>What can I make?</button>
        <button className="btn ghost wide" data-tip="fridge" onClick={raid}><Icon name="gift" size={18} />Fridge Raid (surprise me)</button>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); if (!dish.trim()) return; setHand(null); setUi({ cookMode: 'named', cookDish: dish.trim().slice(0, 80) }); }}>
          <label htmlFor="o-dish" hidden>Dish</label>
          <input id="o-dish" data-tip="search" className="input" type="search" enterKeyHint="search" autoComplete="off" placeholder="Search a dish, sauce, food or country" maxLength={80} value={dish} onChange={(e) => setDish(e.target.value)} />
          <button className="btn" type="submit" aria-label="Search dishes"><Icon name="search" size={18} />Search</button>
        </form>
      </div>

      {hand && mode === 'raid' && (
        <div className="stack" style={{ gap: 8 }}><span className="eyebrow">Ingredients</span>
          <div className="grid2">{hand.map((c, i) => <div key={c} className="card" style={{ textAlign: 'center', fontWeight: 800, background: 'var(--pop-soft)', transform: `rotate(${[-3, 2, -1, 3][i % 4]}deg)` }}>{c}</div>)}</div>
        </div>
      )}
      {mode === 'named' && ui.cookDish && results?.length === 0 ? null : results && (results.length ? (
        <>
          <span className="eyebrow">{mode === 'named' ? `From your Whisk recipes · ${results.length}` : `${results.length} recipe${results.length === 1 ? '' : 's'} you can make right now`}</span>
          {results.slice(0, shown).map(({ r, c }) => (
            <button key={r.id} className="card stack" style={{ gap: 8, textAlign: 'left' }} onClick={() => setOpen(r)}>
              <span className="eyebrow">{r.cuisine} · {r.source}</span>
              <h2 style={{ fontSize: 20 }}>{r.title}</h2>
              <div className="row"><span className="chip">{hrs(r.minutes)}</span><span className="chip">Serves {r.servings}</span><span className="chip have">You have everything</span>{c.frozen.length > 0 && <span className="chip ice"><Icon name="snow" size={14} />Defrost first</span>}</div>
            </button>
          ))}
          {shown < results.length ? <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>Show more</button></div>
            : <span className="desc" style={{ textAlign: 'center' }}>That’s every recipe your pantry can make right now.</span>}
        </>
      ) : <div className="empty"><b>Nothing fits yet</b>{mode === 'named' ? 'None of Whisk’s recipes match that dish and your pantry.' : 'Add a few more staples to your pantry and check back.'}</div>)}

      {mode === 'named' && ui.cookDish && <DishSearch q={ui.cookDish} pantry={pantry} />}

      <MyYouTubers />

      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
