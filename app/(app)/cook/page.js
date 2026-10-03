'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon from '@/components/Icon';
import { inPantry, norm } from '@/lib/game';

function CookInner() {
  const { supabase } = useWhisk();
  const params = useSearchParams();
  const [pantry, setPantry] = useState([]);
  const [saved, setSaved] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [raid, setRaid] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [opts, setOpts] = useState({ maxMinutes: '', servings: 2, mealPrepDays: 0, dish: '' });

  async function loadSaved() { const { data } = await supabase.from('recipes').select('id, title, cuisine, data, created_at').order('created_at', { ascending: false }).limit(60); setSaved(data || []); }
  useEffect(() => {
    supabase.from('pantry_items').select('name, status').then(({ data }) => setPantry(data || []));
    loadSaved();
    if (params.get('raid') === '1') ask('raid');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const names = useMemo(() => pantry.filter((p) => p.status !== 'out').map((p) => norm(p.name)), [pantry]);

  async function ask(mode) {
    setBusy(mode); setError(''); setIdeas([]); setRaid(null);
    try {
      const body = { mode, servings: Number(opts.servings) || 2, mealPrepDays: Number(opts.mealPrepDays) || 0 };
      if (opts.maxMinutes) body.maxMinutes = Number(opts.maxMinutes);
      if (mode === 'named') body.dish = opts.dish.trim().slice(0, 80);
      const res = await fetch('/api/recipes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Something went wrong.');
      setIdeas(json.recipes); setRaid(json.raid);
    } catch (e) { setError(e.message); } finally { setBusy(''); }
  }

  const missingCount = (r) => r.ingredients.filter((i) => !(i.from_pantry || inPantry(names, i.item))).length;

  return (
    <div className="stack">
      <div className="page-title"><h1>Cook</h1><span className="muted">{pantry.filter((p) => p.status !== 'out').length} items in your pantry</span></div>

      <div className="card stack">
        <div className="grid2">
          <div><label className="lbl" htmlFor="o-time">Time limit</label><select id="o-time" className="input" value={opts.maxMinutes} onChange={(e) => setOpts({ ...opts, maxMinutes: e.target.value })}><option value="">Any</option><option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">1 hour</option></select></div>
          <div><label className="lbl" htmlFor="o-serv">Servings</label><select id="o-serv" className="input" value={opts.servings} onChange={(e) => setOpts({ ...opts, servings: e.target.value })}>{[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
          <div style={{ gridColumn: '1 / -1' }}><label className="lbl" htmlFor="o-prep">Meal prep</label><select id="o-prep" className="input" value={opts.mealPrepDays} onChange={(e) => setOpts({ ...opts, mealPrepDays: e.target.value })}><option value="0">Just tonight</option>{[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>Cook for {n} days</option>)}</select></div>
        </div>
        <button className="btn wide" onClick={() => ask('pantry')} disabled={!!busy}>{busy === 'pantry' ? 'Whisking up ideas…' : 'What can I make?'}</button>
        <button className="btn ghost wide" onClick={() => ask('raid')} disabled={!!busy}><Icon name="gift" size={18} />{busy === 'raid' ? 'Raiding the fridge…' : 'Fridge Raid (surprise me)'}</button>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); if (opts.dish.trim()) ask('named'); }}>
          <label htmlFor="o-dish" hidden>Dish</label>
          <input id="o-dish" className="input" maxLength={80} placeholder="Or name a dish: “birria tacos”" value={opts.dish} onChange={(e) => setOpts({ ...opts, dish: e.target.value })} />
          <button className="btn" type="submit" disabled={!!busy || !opts.dish.trim()}>{busy === 'named' ? '…' : 'Go'}</button>
        </form>
      </div>

      {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
      {raid && <p className="ok" style={{ margin: 0 }}>Fridge Raid dealt you: {raid.join(', ')}</p>}

      {ideas.map((r, i) => (
        <button key={i} className="card stack" style={{ textAlign: 'left', gap: 8 }} onClick={() => setOpen({ data: r, id: null })}>
          <span className="eyebrow">{r.cuisine}</span>
          <h2 style={{ fontSize: 21 }}>{r.title}</h2>
          <p className="muted" style={{ margin: 0 }}>{r.summary}</p>
          <div className="row"><span className="chip">{r.prep_minutes + r.cook_minutes} min</span><span className="chip xp">+50 XP</span>{missingCount(r) ? <span className="chip need">{missingCount(r)} missing</span> : <span className="chip have">Have it all</span>}</div>
        </button>
      ))}

      <div className="page-title" style={{ marginTop: 8 }}><h2 style={{ fontSize: 22 }}>Your cookbook</h2><span className="muted">{saved.length}</span></div>
      {saved.length === 0 ? <div className="empty"><b>No saved recipes yet</b>Open an idea above and tap Save.</div> : saved.map((s) => (
        <button key={s.id} className="card row" style={{ textAlign: 'left', flexWrap: 'nowrap' }} onClick={() => setOpen({ data: s.data, id: s.id })}>
          <span style={{ flex: 1 }}><b>{s.title}</b><span className="muted"> · {s.cuisine}</span></span>
          {missingCount(s.data) ? <span className="chip need">{missingCount(s.data)} missing</span> : <span className="chip have">Ready</span>}
        </button>
      ))}

      {open && <RecipeSheet recipe={open.data} savedId={open.id} pantryNames={names} onClose={() => setOpen(null)} onSaved={loadSaved} />}
    </div>
  );
}

export default function Cook() { return <Suspense fallback={<p className="muted">Loading…</p>}><CookInner /></Suspense>; }
