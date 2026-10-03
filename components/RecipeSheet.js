'use client';
import { useEffect, useRef, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import LogMealSheet from './LogMealSheet';
import { inPantry, norm, SEARCH_LINKS } from '@/lib/game';

function StepTimer({ minutes }) {
  const [left, setLeft] = useState(null);
  const t = useRef(0);
  useEffect(() => () => clearInterval(t.current), []);
  const start = () => { clearInterval(t.current); setLeft(minutes * 60); t.current = setInterval(() => setLeft((s) => { if (s <= 1) { clearInterval(t.current); try { navigator.vibrate?.(400); } catch {} return 0; } return s - 1; }), 1000); };
  const label = left === null ? `${minutes} min` : left === 0 ? 'Done!' : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return <button type="button" className="btn ghost sm" onClick={start} style={left === 0 ? { background: 'var(--btn)', color: 'var(--btn-ink)' } : undefined}><Icon name="timer" size={16} />{label}</button>;
}

export default function RecipeSheet({ recipe, savedId = null, pantryNames = [], onClose, onSaved }) {
  const { supabase, say } = useWhisk();
  const [saved, setSaved] = useState(savedId);
  const [logging, setLogging] = useState(false);
  const [done, setDone] = useState({});
  const have = (ing) => ing.from_pantry || inPantry(pantryNames, ing.item);
  const missing = recipe.ingredients.filter((i) => !have(i));
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);

  async function save() {
    const { data, error } = await supabase.from('recipes').insert({ title: recipe.title.slice(0, 120), cuisine: recipe.cuisine?.slice(0, 40), data: recipe }).select('id').single();
    if (error) { say('Couldn’t save that recipe.'); return; }
    setSaved(data.id); onSaved?.(data.id); say('Saved to your cookbook · +5 XP');
  }
  async function addMissing() {
    if (!missing.length) return;
    const { error } = await supabase.from('shopping_items').insert(missing.map((m) => ({ name: m.item.slice(0, 60) })));
    say(error ? 'Couldn’t add to your list.' : `Added ${missing.length} to your shopping list`);
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={recipe.title}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div>
            <span className="eyebrow">{recipe.cuisine}</span>
            <h2 style={{ fontSize: 28 }}>{recipe.title}</h2>
          </div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <p className="muted" style={{ margin: 0 }}>{recipe.summary}</p>
        <div className="row">
          <span className="chip">{total} min</span><span className="chip">Serves {recipe.servings}</span>
          <span className="chip xp">+50 XP</span>
          {missing.length ? <span className="chip need">{missing.length} missing</span> : <span className="chip have">You have everything</span>}
        </div>
        {recipe.equipment?.length > 0 && <p className="muted" style={{ margin: 0, fontSize: 14 }}>Uses: {recipe.equipment.join(', ')}</p>}

        <h3>Ingredients</h3>
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 6 }}>
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 6, flexWrap: 'nowrap' }}>
              <span><b style={{ fontVariantNumeric: 'tabular-nums' }}>{ing.amount}</b> {ing.item}</span>
              <span className={`chip ${have(ing) ? 'have' : 'need'}`} style={{ flex: 'none' }}>{have(ing) ? 'Have' : 'Need'}</span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && <button type="button" className="btn ghost" onClick={addMissing}><Icon name="plus" size={18} />Add {missing.length} missing to shopping list</button>}
        {recipe.substitutions?.length > 0 && (
          <div className="card" style={{ background: 'var(--gold-soft)', borderColor: 'transparent' }}>
            <b>Swaps</b>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{recipe.substitutions.map((s, i) => <li key={i}>No {s.for}? Use {s.use}.</li>)}</ul>
          </div>
        )}

        <h3>Steps</h3>
        <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recipe.steps.map((s, i) => (
            <li key={i} className="card" style={{ display: 'grid', gridTemplateColumns: '36px 1fr', gap: 10, opacity: done[i] ? .55 : 1 }}>
              <button type="button" onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} aria-pressed={!!done[i]} aria-label={`Step ${i + 1} done`} style={{ width: 34, height: 34, borderRadius: 10, border: 0, background: done[i] ? 'var(--accent)' : 'var(--fg)', color: 'var(--bg)', fontFamily: 'var(--f-display)', fontWeight: 700 }}>{done[i] ? '✓' : i + 1}</button>
              <div className="stack" style={{ gap: 8 }}>
                <p style={{ margin: 0, fontSize: 17 }}>{s.text}</p>
                {s.timer_minutes ? <div><StepTimer minutes={s.timer_minutes} /></div> : null}
              </div>
            </li>
          ))}
        </ol>
        {recipe.tips && <p className="card" style={{ margin: 0 }}><b>Tip:</b> {recipe.tips}</p>}
        {recipe.leftovers && <p className="card" style={{ margin: 0 }}><b>Tomorrow’s lunch:</b> {recipe.leftovers}</p>}
        <div className="row">
          <span className="muted" style={{ fontSize: 14 }}>Watch it made:</span>
          {SEARCH_LINKS(recipe.title).map((l) => <a key={l.label} className="btn ghost sm" href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>)}
        </div>
        <div className="row" style={{ position: 'sticky', bottom: -28, background: 'var(--bg)', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
          {!saved && <button type="button" className="btn ghost" style={{ flex: '1 1 140px' }} onClick={save}>Save recipe</button>}
          <button type="button" className="btn" style={{ flex: '1 1 160px' }} onClick={() => setLogging(true)}>I cooked it</button>
        </div>
      </div>
      {logging && <LogMealSheet title={recipe.title} cuisine={recipe.cuisine} recipeId={saved} onClose={() => { setLogging(false); onClose?.(); }} />}
    </div>
  );
}
export { norm };
