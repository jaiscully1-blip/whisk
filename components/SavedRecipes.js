'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import RecipeSheet from './RecipeSheet';
import Icon from './Icon';
import { useSaved } from './usePantry';

// Recipes you saved (or cooked and rated), newest first.
export default function SavedRecipes({ pantry, onChanged, limit = 0 }) {
  const { recipes, supabase, say } = useWhisk();
  async function unsave(r) {
    const { error } = await supabase.from('saved_recipes').delete().eq('recipe_id', r.id);
    if (error) { say('Couldn’t unsave that.'); return; }
    say(`Removed ${r.title}`); reloadSaved(); onChanged?.();
  }
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [all, setAll] = useState(false);
  const list = saved && recipes ? [...saved.values()].map((s) => ({ s, r: recipes.find((r) => r.id === s.recipe_id) })).filter((x) => x.r) : [];

  return (
    <div className="stack">
      {saved === null ? <p className="muted">Loading…</p> : list.length ? (limit && !all ? list.slice(0, limit) : list).map(({ r }) => (
        <div key={r.id} className="card row saved-row" style={{ flexWrap: 'nowrap', padding: 0 }}>
          <button type="button" className="saved-open" onClick={() => setOpen(r)}>
            <span style={{ flex: 1 }}><b>{r.title}</b><span className="desc" style={{ display: 'block' }}>{r.cuisine} · {r.source}</span></span>
          </button>
          <button type="button" className="btn ghost sm saved-x" onClick={() => unsave(r)} aria-label={`Unsave ${r.title}`}><Icon name="x" size={16} /></button>
        </div>
      )) : <div className="empty"><b>No saved recipes here</b>Save a recipe, or rate a meal after you cook it.</div>}
      {limit > 0 && !all && list.length > limit && <button type="button" className="btn ghost wide" onClick={() => setAll(true)}>Show all {list.length}</button>}
      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reloadSaved(); onChanged?.(); }} />}
    </div>
  );
}
