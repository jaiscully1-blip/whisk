'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import RecipeSheet from './RecipeSheet';
import Icon from './Icon';
import { useSaved } from './usePantry';

// Recipes you saved (or cooked and rated), newest first.
export default function SavedRecipes({ pantry, onChanged, limit = 0 }) {
  const { recipes } = useWhisk();
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [all, setAll] = useState(false);
  const list = saved && recipes ? [...saved.values()].map((s) => ({ s, r: recipes.find((r) => r.id === s.recipe_id) })).filter((x) => x.r) : [];

  return (
    <div className="stack">
      {saved === null ? <p className="muted">Loading…</p> : list.length ? (limit && !all ? list.slice(0, limit) : list).map(({ r }) => (
        <button key={r.id} className="card row" style={{ textAlign: 'left', flexWrap: 'nowrap' }} onClick={() => setOpen(r)}>
          <span style={{ flex: 1 }}><b>{r.title}</b><span className="desc" style={{ display: 'block' }}>{r.cuisine} · {r.source}</span></span>
          <Icon name="chevron" />
        </button>
      )) : <div className="empty"><b>No saved recipes here</b>Save a recipe, or rate a meal after you cook it.</div>}
      {limit > 0 && !all && list.length > limit && <button type="button" className="btn ghost wide" onClick={() => setAll(true)}>Show all {list.length}</button>}
      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reloadSaved(); onChanged?.(); }} />}
    </div>
  );
}
