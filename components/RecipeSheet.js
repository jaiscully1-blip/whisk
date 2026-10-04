'use client';
import { useEffect, useRef, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import LogMealSheet from './LogMealSheet';
import ThawBanner from './ThawBanner';
import { checkRecipe, searchLinks } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';
import { timerApi } from '@/lib/timers';

// Tap once to start. Double-tap quickly to stop and reset. Keeps running if you close the recipe.
function StepTimer({ id, minutes, label }) {
  const [, force] = useState(0);
  const lastTap = useRef(0);
  useEffect(() => timerApi.subscribe(() => force((n) => n + 1)), []);
  const { end, done } = timerApi.get(id);
  const left = end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : null;
  const tap = () => {
    const now = Date.now(); const dbl = now - lastTap.current < 380; lastTap.current = now;
    if (dbl) { timerApi.stop(id); lastTap.current = 0; return; }
    if (!end && !done) timerApi.start(id, minutes, label);
    else if (done) timerApi.stop(id);
  };
  const text = done ? 'Done!' : left === null ? `${minutes} min` : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return <button type="button" className={`btn ghost sm timer ${end ? 'running' : ''} ${done ? 'done' : ''}`} onClick={tap} aria-label={end ? `Timer ${text} left. Double-tap to stop.` : done ? 'Timer done. Tap to reset.' : `Start a ${minutes} minute timer`}><Icon name="timer" size={16} />{text}</button>;
}

// A real recipe from the web: summary here, full recipe on the source page.
export default function RecipeSheet({ recipe: r, pantry, saved, onClose, onChanged, challenge = null }) {
  const { supabase, say, refreshProfile } = useWhisk();
  const [isSaved, setSaved] = useState(!!saved);
  const [logging, setLogging] = useState(false);
  const c = checkRecipe(r, pantry);

  async function save() {
    const { data, error } = await supabase.rpc('save_recipe', { p_recipe_id: r.id });
    if (error) { say('Couldn’t save that recipe.'); return; }
    setSaved(true); refreshProfile(); onChanged?.(); say(data?.xp ? 'Saved to your cookbook · +5 XP' : 'Saved to your cookbook');
  }
  async function addMissing() {
    const { data: list } = await supabase.from('shopping_items').select('name');
    const have = new Set((list || []).map((l) => l.name.toLowerCase()));
    const add = c.missing.filter((m) => !have.has(m.toLowerCase()));
    if (add.length) { const { error } = await supabase.from('shopping_items').insert(add.map((m) => ({ name: m.slice(0, 60), category: guessCategory(m) }))); if (error) { say('Couldn’t add to your list.'); return; } }
    say(add.length ? `Added ${add.length} to your shopping list` : 'Already on your list');
  }
  if (logging) return <LogMealSheet recipe={r} challenge={challenge} onClose={() => { setLogging(false); onClose?.(); }} onDone={onChanged} />;

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={r.title}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div><span className="eyebrow">{r.cuisine}</span><h2 style={{ fontSize: 26 }}>{r.title}</h2></div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <span className="src">Recipe from <a href={r.url} target="_blank" rel="noopener noreferrer">{r.source}</a>{r.video && <> · <a href={r.video} target="_blank" rel="noopener noreferrer">Watch the video</a></>}</span>
        <div className="row">
          <span className="chip">{r.minutes} min</span><span className="chip">Serves {r.servings}</span><span className="chip xp">+50 XP</span>
          {r.nutrition && <span className="chip" title="Per serving, from the recipe page">{r.nutrition.calories} kcal · {r.nutrition.protein_g}g protein</span>}
          {c.missing.length ? <span className="chip need">{c.missing.length} missing</span> : <span className="chip have">You have everything</span>}
        </div>
        {c.frozen.length > 0 && <ThawBanner items={c.frozen} onChanged={onChanged} />}
        <h3>Main ingredients</h3>
        <div className="stack" style={{ gap: 6 }}>
          {r.key.map((k) => { const ok = !c.missing.includes(k); return (
            <div key={k} className="row" style={{ flexWrap: 'nowrap' }}><span className={`chip ${ok ? 'have' : 'need'}`} style={{ flex: 'none' }}>{ok ? 'Have' : 'Need'}</span><span><b>{k}</b> <span className="muted">{r.amounts?.[k] || ''}</span></span></div>
          ); })}
          {r.minor?.length > 0 && <span className="desc">Also uses: {r.minor.join(', ')}. Salt, pepper and oil assumed.</span>}
        </div>
        {c.missing.length > 0 && <button className="btn ghost" onClick={addMissing}>Add {c.missing.length} missing to shopping list</button>}
        <h3>Steps <span className="muted" style={{ fontSize: 13, fontFamily: 'var(--f-body)' }}>(summary · full recipe on {r.source})</span></h3>
        <ol className="stack" style={{ gap: 10, paddingLeft: 20, margin: 0 }}>
          {r.steps.map(([text, mins], i) => (
            <li key={i}><div>{text}</div>{mins ? (mins <= 120 ? <div style={{ marginTop: 6 }}><StepTimer id={`${r.id}:${i}`} minutes={mins} label={`${r.title} · step ${i + 1}`} /></div> : <span className="chip" style={{ marginTop: 6 }}>{Math.round(mins / 6) / 10} hr</span>) : null}</li>
          ))}
        </ol>
        <div className="links">
          <a href={r.url} target="_blank" rel="noopener noreferrer"><Icon name="link" size={15} />Open on {r.source}</a>
          {r.video && <a href={r.video} target="_blank" rel="noopener noreferrer"><Icon name="play" size={15} />Video</a>}
          {searchLinks(r.title).slice(1).map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener noreferrer"><Icon name={l === 'Reddit' ? 'search' : 'play'} size={15} />{l}</a>)}
        </div>
        <div className="row">
          {isSaved ? <span className="chip have" style={{ flex: '1 1 140px', justifyContent: 'center', minHeight: 44 }}>Saved</span>
            : <button className="btn ghost" style={{ flex: '1 1 140px' }} onClick={save}>Save · +5 XP</button>}
          {c.ok && <button className="btn" style={{ flex: '1 1 160px' }} onClick={() => { if (c.frozen.length) { say(`Defrost ${c.frozen.map((p) => p.name).join(', ')} first`); return; } setLogging(true); }}>I cooked it</button>}
        </div>
      </div>
    </div>
  );
}
