'use client';
import { useMemo, useState } from 'react';
import { useWhisk, useDraft } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon from '@/components/Icon';
import { usePantry, useSaved } from '@/components/usePantry';
import { canon, checkRecipe, pantryCombos, searchLinks } from '@/lib/recipes/match';

const SKIP = ['Spices & Seasonings', 'Sauces & Oils', 'Baking'];
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);

function Links({ query }) {
  return <div className="links">{searchLinks(query).map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener noreferrer"><Icon name={l === 'Google' || l === 'Reddit' ? 'search' : 'play'} size={15} />{l}</a>)}</div>;
}

// Only real recipes from the web, and only ones your pantry can make.
export default function Cook() {
  const { recipes, ui, setUi } = useWhisk();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [dish, setDish] = useDraft('o-dish');
  const [hand, setHand] = useState(null);
  const [open, setOpen] = useState(null);
  const savedMode = ui.cookMode || null; const time = ui.cookTime || ''; const cu = ui.cookCuisine || ''; const more = ui.cookMore || 6; const cb = ui.cbFilter || 'all';

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
  const combos = hand ? [hand] : pantryCombos(names, new Date().getDate() * 31 + names.length, more);
  const savedList = saved && recipes ? [...saved.values()].map((s) => ({ s, r: recipes.find((r) => r.id === s.recipe_id) })).filter((x) => x.r && (cb === 'all' || x.s.rating === cb)) : [];

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
        <button className="btn wide" onClick={() => { setHand(null); setUi({ cookMode: 'pantry' }); }}>What can I make?</button>
        <button className="btn ghost wide" onClick={raid}><Icon name="gift" size={18} />Fridge Raid (surprise me)</button>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); if (!dish.trim()) return; setHand(null); setUi({ cookMode: 'named', cookDish: dish.trim().slice(0, 80) }); }}>
          <label htmlFor="o-dish" hidden>Dish</label>
          <input id="o-dish" className="input" placeholder="Search a dish, e.g. tacos" maxLength={80} value={dish} onChange={(e) => setDish(e.target.value)} />
          <button className="btn" type="submit">Go</button>
        </form>
        <span className="muted" style={{ fontSize: 13 }}>Only real recipes from the web, and only ones your pantry can make. Salt, pepper and oil assumed.</span>
      </div>

      {hand && mode === 'raid' && (
        <div className="stack" style={{ gap: 8 }}><span className="eyebrow">Fridge Raid · your hand</span>
          <div className="grid2">{hand.map((c, i) => <div key={c} className="card" style={{ textAlign: 'center', fontWeight: 800, background: 'var(--pop-soft)', transform: `rotate(${[-3, 2, -1, 3][i % 4]}deg)` }}>{c}</div>)}</div>
        </div>
      )}
      {results && (results.length ? (
        <>
          <span className="eyebrow">{results.length} recipe{results.length === 1 ? '' : 's'} you can make{mode === 'raid' ? ' with your hand' : ''}</span>
          {results.map(({ r, c }) => (
            <button key={r.id} className="card stack" style={{ gap: 8, textAlign: 'left' }} onClick={() => setOpen(r)}>
              <span className="eyebrow">{r.cuisine} · {r.source}</span>
              <h2 style={{ fontSize: 20 }}>{r.title}</h2>
              <div className="row"><span className="chip">{hrs(r.minutes)}</span><span className="chip">Serves {r.servings}</span><span className="chip have">You have everything</span>{c.frozen.length > 0 && <span className="chip ice"><Icon name="snow" size={14} />Defrost first</span>}</div>
            </button>
          ))}
        </>
      ) : <div className="empty"><b>No saved web recipe fits yet</b>{mode === 'named' ? 'None of the recipes found so far match that dish and your pantry.' : 'Try the searches below. They look across the web using only what’s in your pantry.'}</div>)}

      <section className="card stack" style={{ gap: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Find more online</h3><span className="muted" style={{ fontSize: 13 }}>Unlimited · uses your pantry</span></div>
        {mode === 'named' && ui.cookDish && <div className="stack" style={{ gap: 6 }}><b>{ui.cookDish} with what you have</b><Links query={`${ui.cookDish} ${names.slice(0, 3).join(' ')}`} /></div>}
        {combos.map((c) => <div key={c.join('|')} className="stack" style={{ gap: 6, paddingTop: 8, borderTop: '1px solid var(--line)' }}><b>{c.join(' + ')}</b><Links query={c.join(' ')} /></div>)}
        {!hand && <button className="btn ghost" onClick={() => setUi({ cookMore: more + 6 })}>Show more ideas</button>}
      </section>

      <div className="page-title" style={{ marginTop: 8 }}><h2 style={{ fontSize: 22 }}>Your saved recipes</h2><span className="muted">{saved ? saved.size : ''}</span></div>
      <div className="row">{[['all', 'All'], ['up', 'Liked'], ['down', 'Disliked']].map(([k, l]) => <button key={k} className="chip" style={{ border: 0, background: cb === k ? 'var(--fg)' : 'var(--track)', color: cb === k ? 'var(--bg)' : 'var(--fg)' }} onClick={() => setUi({ cbFilter: k })}>{l}</button>)}</div>
      {savedList.length ? savedList.map(({ s, r }) => (
        <button key={r.id} className="card row" style={{ textAlign: 'left', flexWrap: 'nowrap' }} onClick={() => setOpen(r)}>
          <span style={{ flex: 1 }}><b>{r.title}</b><span className="muted" style={{ display: 'block', fontSize: 13 }}>{r.cuisine} · {r.source}</span></span>
          {s.rating === 'up' && <span style={{ color: 'var(--fresh)' }} aria-label="Liked"><Icon name="up" /></span>}
          {s.rating === 'down' && <span style={{ color: 'var(--bad)' }} aria-label="Disliked"><Icon name="down" /></span>}
          <Icon name="chevron" />
        </button>
      )) : <div className="empty"><b>No saved recipes here</b>Save a recipe, or rate a meal after you cook it.</div>}

      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
