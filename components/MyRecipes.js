'use client';
import { useMemo, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import CookMode from './CookMode';
import RecipeImport from './RecipeImport';
import { useMine } from './usePantry';
import { toRecipe } from '@/lib/recipes/mine';
import { ingredientLine } from '@/lib/recipes/scale';
import { canon } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';

// Your own recipes (photographed or typed): a list on the Cook tab, and a page for each with what you have, what's
// missing, Cook mode, and a one-tap add-to-shopping-list.
export function Viewer({ row, pantry, onClose, onEdit, onDeleted }) {
  const { supabase, say } = useWhisk();
  const r = useMemo(() => toRecipe(row), [row]);
  const [factor, setFactor] = useState(1);
  const [cooking, setCooking] = useState(false);
  const inPantry = useMemo(() => (pantry || []).filter((p) => p.status !== 'out').map((p) => canon(p.name)).filter(Boolean), [pantry]);
  const has = (g) => { const c = canon(g.item); return !!c && inPantry.some((p) => p === c || (p.length >= 4 && (c.includes(p) || p.includes(c)))); };
  const missing = r.ingredients.filter((g) => !has(g));
  async function addMissing() {
    const { data: list } = await supabase.from('shopping_items').select('name');
    const have = new Set((list || []).map((l) => l.name.toLowerCase()));
    const add = [...new Set(missing.map((g) => g.item.slice(0, 60)))].filter((n) => !have.has(n.toLowerCase()));
    if (add.length) { const { error } = await supabase.from('shopping_items').insert(add.map((n) => ({ name: n, category: guessCategory(n) }))); if (error) { say('Couldn’t add to your list.'); return; } }
    say(add.length ? `Added ${add.length} to your shopping list` : 'Already on your list');
  }
  async function del() {
    if (!window.confirm(`Delete “${row.title}”?`)) return;
    const { error } = await supabase.from('my_recipes').delete().eq('id', row.id);
    if (error) { say('Couldn’t delete that.'); return; }
    say('Recipe deleted'); onDeleted();
  }
  if (cooking) return <CookMode r={r} factor={factor} onClose={() => setCooking(false)} />;
  return (
    <div className="scrim" role="presentation" style={{ zIndex: 70 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={row.title} data-testid="mine-view">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <div><span className="eyebrow">My recipe</span><h2 style={{ fontSize: 26 }}>{row.title}</h2><span className="desc">{row.minutes ? `${row.minutes} min · ` : ''}serves {row.servings || 4}</span></div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="lbl" style={{ margin: 0 }}>Make</span>
          {[0.5, 1, 2, 3].map((k) => <button key={k} type="button" className={`chip ${factor === k ? 'xp' : ''}`} aria-pressed={factor === k} onClick={() => setFactor(k)}>{k === 0.5 ? '½×' : `${k}×`}</button>)}
        </div>
        <button type="button" className="btn wide" onClick={() => setCooking(true)} data-testid="mine-cook"><Icon name="cook" size={18} />Cook mode</button>
        <h3 style={{ fontSize: 20, margin: 0 }}>Ingredients</h3>
        <ul className="ing-list" style={{ margin: 0 }}>
          {r.ingredients.map((g, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span>{ingredientLine(g, factor)}</span>
              {has(g) ? <span className="chip have">In your pantry</span> : <span className="chip need">Need</span>}
            </li>
          ))}
        </ul>
        {missing.length > 0 && <button type="button" className="btn ghost wide" onClick={addMissing} data-testid="mine-add-missing"><Icon name="plus" size={18} />Add {missing.length} missing to shopping list</button>}
        <h3 style={{ fontSize: 20, margin: '6px 0 0' }}>Steps</h3>
        <ol className="mine-steps">{r.steps.map(([t], i) => <li key={i}>{t}</li>)}</ol>
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={onEdit} data-testid="mine-edit"><Icon name="pencil" size={16} />Edit</button>
          <button type="button" className="btn ghost" style={{ flex: 1, color: 'var(--bad)' }} onClick={del} data-testid="mine-delete"><Icon name="trash" size={16} />Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function MyRecipes({ pantry }) {
  const [rows, reload] = useMine();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  return (
    <section className="card stack" aria-labelledby="mine-h" data-testid="my-recipes">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <h2 id="mine-h" style={{ fontSize: 20, margin: 0 }}><Icon name="pencil" size={18} /> My recipes</h2>
        <button type="button" className="btn sm" onClick={() => setAdding(true)} data-testid="mine-add" data-tip="import"><Icon name="camera" size={16} />Add recipe</button>
      </div>
      {rows === null ? <p className="muted">Loading…</p> : rows.length ? rows.map((r) => (
        <div key={r.id} className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
          <button type="button" className="mine-open" onClick={() => setOpen(r)} data-testid="mine-item"><b>{r.title}</b><span className="desc">{r.minutes ? `${r.minutes} min · ` : ''}{r.ingredients.length} ingredients</span></button>
          <Icon name="chevron" />
        </div>
      )) : null}
      {adding && <RecipeImport onClose={() => setAdding(false)} onSaved={() => { setAdding(false); reload(); }} />}
      {editing && <RecipeImport edit={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setOpen(null); reload(); }} />}
      {open && !editing && <Viewer row={open} pantry={pantry} onClose={() => setOpen(null)} onEdit={() => setEditing(open)} onDeleted={() => { setOpen(null); reload(); }} />}
    </section>
  );
}
