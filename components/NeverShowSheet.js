'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { ALLERGENS, ALLERGEN_LABELS, allowed } from '@/lib/recipes/never';

// Never show me: allergen groups (one tap each) and any single ingredient. Saved to the player's game, so every
// list in the app hides recipes that use them.
export default function NeverShowSheet({ onClose }) {
  const { supabase, profile, setProfile, say, allRecipes } = useWhisk();
  const [list, setList] = useState(profile?.never_show || []);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (k) => setList((l) => (l.includes(k) ? l.filter((x) => x !== k) : [...l, k]));
  const add = (e) => { e.preventDefault(); const w = word.trim().toLowerCase().slice(0, 40); if (w && !list.includes(w)) setList((l) => [...l, w]); setWord(''); };
  const custom = list.filter((x) => !ALLERGENS[x]);
  async function save() {
    setBusy(true);
    const { data, error } = await supabase.rpc('set_never_show', { p_items: list });
    setBusy(false);
    if (error) { say('Couldn’t save that.'); return; }
    setProfile((p) => ({ ...p, never_show: data || [] }));
    say(data?.length ? `Hiding recipes with ${data.length === 1 ? (ALLERGEN_LABELS[data[0]] || data[0]).toLowerCase() : `${data.length} things`}` : 'Showing every recipe');
    onClose?.();
  }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Never show me">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Never show me</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <p className="desc" style={{ margin: 0 }}>Whisk hides every recipe that uses these, everywhere in the game.</p>
        <span className="eyebrow">Allergies</span>
        <div className="row never-pick" style={{ gap: 6 }}>
          {Object.keys(ALLERGENS).map((k) => (
            <button key={k} type="button" className={`chip ${list.includes(k) ? 'on' : ''}`} aria-pressed={list.includes(k)} onClick={() => toggle(k)}>{list.includes(k) && <Icon name="check" size={14} />}{ALLERGEN_LABELS[k]}</button>
          ))}
        </div>
        <span className="eyebrow">Ingredients</span>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={add}>
          <label htmlFor="never-w" hidden>Ingredient</label>
          <input id="never-w" className="input" maxLength={40} placeholder="e.g. mushrooms, cilantro" value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
          <button className="btn" type="submit" aria-label="Add ingredient"><Icon name="plus" size={18} /></button>
        </form>
        {custom.length > 0 && <div className="row" style={{ gap: 6 }}>{custom.map((w) => <button key={w} type="button" className="chip on" onClick={() => toggle(w)} aria-label={`Show ${w} again`}>{w}<Icon name="x" size={14} /></button>)}</div>}
        <p className="desc warnbox" style={{ margin: 0 }}><Icon name="shield" size={16} />Whisk reads each recipe’s ingredient names. Packaged foods (sauces, stock, bread) can contain allergens a recipe doesn’t name, so always check the label.</p>
        {allRecipes && <span className="desc" aria-live="polite">{allRecipes.filter((r) => allowed(r, list)).length} of {allRecipes.length} recipes will show</span>}
        <button className="btn wide" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  );
}
