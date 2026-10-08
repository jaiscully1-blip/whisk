'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import DietTags from '@/components/DietTags';
import { DIET_ORDER, DIET_CLASS, fitsDiet } from '@/lib/recipes/diet';
import { useWhisk, useDraft } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';

const PAGE = 12;
import { canon, checkRecipe, usesSoon } from '@/lib/recipes/match';
import WeekGoal from '@/components/WeekGoal';
import BackupNudge from '@/components/BackupNudge';
import MyYouTubers from '@/components/MyYouTubers';
import DishSearch from '@/components/DishSearch';
import SavedRecipes from '@/components/SavedRecipes';

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
  const [asked, setAsked] = useState(false);   // "Nothing fits yet" only shows right after you ask, never on its own
  const savedMode = ui.cookMode || null; const time = ui.cookTime || ''; const cu = ui.cookCuisine || ''; const diet = ui.cookDiet || '';

  const mode = savedMode === 'raid' && !hand ? 'pantry' : savedMode;
  const inStock = useMemo(() => (pantry || []).filter((p) => p.status !== 'out'), [pantry]);
  // No minimum: everything you can make (with swaps if needed) first, then recipes you're only 1–2 things away from.
  const checked = useMemo(() => (recipes && pantry ? recipes.map((r) => ({ r, c: checkRecipe(r, pantry) })) : []), [recipes, pantry]);
  const makeable = useMemo(() => [...checked.filter((x) => x.c.ok).sort((a, b) => a.c.subs.length - b.c.subs.length), ...checked.filter((x) => !x.c.ok && x.c.missing.length <= 2).sort((a, b) => a.c.missing.length - b.c.missing.length || a.r.key.length - b.r.key.length)], [checked]);
  const cuisines = useMemo(() => [...new Set((recipes || []).map((r) => r.cuisine))].sort(), [recipes]);

  const results = useMemo(() => {
    if (!mode) return null;
    let list = makeable.filter(({ r }) => (!+time || r.minutes <= +time) && (!cu || r.cuisine === cu) && fitsDiet(r, diet));
    if (mode === 'raid' && hand) { const hc = new Set(hand.map(canon)); list = list.map((x) => ({ ...x, hits: x.r.key.filter((k) => hc.has(canon(k))).length })).filter((x) => x.hits > 0).sort((a, b) => (a.c.ok === b.c.ok ? 0 : a.c.ok ? -1 : 1) || b.hits - a.hits); }
    if (mode === 'named') { const words = (ui.cookDish || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2); list = list.filter(({ r }) => words.some((w) => `${r.title} ${r.cuisine}`.toLowerCase().includes(w.replace(/s$/, '')))); }
    // food about to go bad first (Fridge Raid keeps its own order: most of your dealt cards first)
    if (mode !== 'raid') { list = list.map((x) => ({ ...x, soon: usesSoon(x.r, pantry || []) })); list = [...list.filter((x) => x.c.ok && x.soon.length), ...list.filter((x) => x.c.ok && !x.soon.length), ...list.filter((x) => !x.c.ok)]; }
    return list;
  }, [mode, makeable, pantry, time, cu, diet, hand, ui.cookDish]);

  const names = inStock.filter((p) => !SKIP.includes(p.category)).map((p) => p.name);
  // Keep loading more as you scroll, until every recipe your pantry can make is on screen.
  useEffect(() => { setShown(PAGE); }, [mode, time, cu, diet, hand, ui.cookDish]);
  useEffect(() => {
    const el = moreRef.current; if (!el || !results || shown >= results.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '400px' });
    io.observe(el); return () => io.disconnect();
  }, [results, shown]);

  function raid() {
    const pool = [...names]; const h = [];
    while (h.length < 4 && pool.length) h.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    setHand(h); setAsked(true); setUi({ cookMode: 'raid' });
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>Cook</h1><WeekGoal /></div>
      <BackupNudge />
      <div className="card stack">
        <div className="grid2">
          <div><label className="lbl" htmlFor="o-time">Time limit</label><select id="o-time" className="input" value={time} onChange={(e) => setUi({ cookTime: e.target.value })}>{[['', 'Any'], ['20', '20 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 hour'], ['120', '2 hours']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="lbl" htmlFor="o-cu">Cuisine</label><select id="o-cu" className="input" value={cu} onChange={(e) => setUi({ cookCuisine: e.target.value })}><option value="">Any</option>{cuisines.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div>
          <span className="lbl" id="o-diet">Diet</span>
          <div className="diet-pick" role="radiogroup" aria-labelledby="o-diet">
            {['', ...DIET_ORDER].map((d) => (
              <button key={d || 'any'} type="button" role="radio" aria-checked={diet === d} className={`chip diet ${d ? DIET_CLASS[d] : 'any'} ${diet === d ? 'on' : ''}`} onClick={() => setUi({ cookDiet: d })}>{d || 'Any'}</button>
            ))}
          </div>
        </div>
        <button data-tour="make" data-tip="make" className="btn wide" onClick={() => { setHand(null); setAsked(true); setUi({ cookMode: 'pantry' }); }}>What can I make?</button>
        <button className="btn ghost wide" data-tip="fridge" onClick={raid}><Icon name="gift" size={18} />Fridge Raid</button>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); if (!dish.trim()) return; setHand(null); setAsked(true); setUi({ cookMode: 'named', cookDish: dish.trim().slice(0, 80) }); }}>
          <label htmlFor="o-dish" hidden>Dish</label>
          <input id="o-dish" data-tip="search" className="input" type="search" enterKeyHint="search" autoComplete="off" aria-label="Search a dish, food or country" maxLength={80} value={dish} onChange={(e) => setDish(e.target.value)} />
          <button className="btn" type="submit" aria-label="Search dishes"><Icon name="search" size={18} />Search</button>
        </form>
      </div>

      <section className="card stack saved-box" aria-labelledby="saved-h">
        <h2 id="saved-h" style={{ fontSize: 20, margin: 0 }}><Icon name="star" size={18} /> Saved recipes</h2>
        <SavedRecipes pantry={pantry} onChanged={reload} limit={4} />
      </section>

      {hand && mode === 'raid' && (
        <div className="stack" style={{ gap: 8 }}><span className="eyebrow">Ingredients</span>
          <div className="grid2">{hand.map((c, i) => <div key={c} className="card" style={{ textAlign: 'center', fontWeight: 800, background: 'var(--pop-soft)', transform: `rotate(${[-3, 2, -1, 3][i % 4]}deg)` }}>{c}</div>)}</div>
        </div>
      )}
      {mode === 'named' && ui.cookDish && results?.length === 0 ? null : results && (results.length ? (
        <>
          <span className="eyebrow">{mode === 'named' ? `From your Whisk recipes · ${results.length}` : (() => { const n = results.filter((x) => x.c.ok).length; return n ? `${n} recipe${n === 1 ? '' : 's'} you can make right now` : 'Closest to what you have'; })()}</span>
          {results.slice(0, shown).map(({ r, c, soon }) => (
            <button key={r.id} className="card stack" style={{ gap: 8, textAlign: 'left' }} onClick={() => setOpen(r)}>
              <span className="eyebrow">{r.cuisine} · {r.source}</span>
              <h2 style={{ fontSize: 20 }}>{r.title}</h2>
              <div className="row"><span className="chip">{hrs(r.minutes)}</span><span className="chip">Serves {r.servings}</span>{c.ok ? <span className="chip have">{c.subs.length ? 'You can make it' : 'You have everything'}</span> : <span className="chip need">Need {c.missing.slice(0, 2).join(' + ').toLowerCase()}</span>}{c.frozen.length > 0 && <span className="chip ice"><Icon name="snow" size={14} />Defrost first</span>}</div>
              {c.subs.length > 0 && <span className="desc swap-line">Swap: {c.subs.map((x) => `${x.use.toLowerCase()} for ${x.need.toLowerCase()}`).join(', ')}</span>}
              {soon?.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} before it goes bad</span>}
              <DietTags recipe={r} max={3} />
            </button>
          ))}
          {shown < results.length ? <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>Show more</button></div>
            : <span className="desc" style={{ textAlign: 'center' }}>That’s everything that fits your pantry right now.</span>}
        </>
      ) : asked && <div className="empty"><b>Nothing fits yet</b>{mode === 'named' ? 'None of Whisk’s recipes match that dish and your pantry.' : 'Add a few more staples to your pantry and check back.'}</div>)}

      {mode === 'named' && ui.cookDish && <DishSearch q={ui.cookDish} pantry={pantry} />}

      <MyYouTubers />

      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
