'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import RecipeSheet from './RecipeSheet';
import Icon from './Icon';
import { useSaved } from './usePantry';
import Postcard from './Postcard';
import { shoppingNeeds } from '@/lib/recipes/match';
import { addToShoppingList, listMsg } from '@/lib/shoplist';

// Recipes you saved (or cooked and rated), newest first.
export default function SavedRecipes({ pantry, onChanged, limit = 0 }) {
  const { recipes, supabase, say } = useWhisk();
  async function unsave(r) {
    const { error } = await supabase.from('saved_recipes').delete().eq('recipe_id', r.id);
    if (error) { say('Couldn’t unsave that.'); return; }
    say(`Removed ${r.title}`); reloadSaved(); onChanged?.();
  }
  async function toList(rs) {
    const names = rs.flatMap((r) => shoppingNeeds(r, pantry || []));
    say(listMsg(await addToShoppingList(supabase, names)));
  }
  const [saved, reloadSaved] = useSaved();
  const [open, setOpen] = useState(null);
  const [all, setAll] = useState(false);
  const list = saved && recipes ? [...saved.values()].map((s) => ({ s, r: recipes.find((r) => r.id === s.recipe_id) })).filter((x) => x.r) : [];

  return (
    <div className="stack">
      {saved === null ? <p className="muted">Loading…</p> : list.length ? (limit && !all ? list.slice(0, limit) : list).map(({ r }) => (
        <div key={r.id} className="card rcard saved-card">
          <Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} />
          <div className="rcard-body saved-body">
            <button type="button" className="saved-open" onClick={() => setOpen(r)}>
              <span className="eyebrow">{r.cuisine}</span>
              <b className="saved-title">{r.title}</b>
              <span className="desc">{r.source} · {r.minutes} min</span>
            </button>
            <button type="button" className="btn ghost sm saved-list" onClick={() => toList([r])} aria-label={`Add ${r.title} ingredients to shopping list`}><Icon name="bag" size={16} /></button>
            <button type="button" className="btn ghost sm saved-x" onClick={() => unsave(r)} aria-label={`Unsave ${r.title}`}><Icon name="x" size={16} /></button>
          </div>
        </div>
      )) : <div className="empty"><b>No saved recipes here</b>Save a recipe, or rate a meal after you cook it.</div>}
      {list.length > 1 && <button type="button" className="btn ghost wide" data-testid="saved-list-all" onClick={() => toList(list.map((x) => x.r))}><Icon name="bag" size={18} />Add all {list.length} to shopping list</button>}
      {limit > 0 && !all && list.length > limit && <button type="button" className="btn ghost wide" onClick={() => setAll(true)}>Show all {list.length}</button>}
      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reloadSaved(); onChanged?.(); }} />}
    </div>
  );
}
