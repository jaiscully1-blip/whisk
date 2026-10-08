'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import LogMealSheet from './LogMealSheet';
import ThawBanner from './ThawBanner';
import { checkRecipe, shoppingNeeds } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';
import { ServingsX, IngredientList, StepList } from './RecipeSteps';
import { cultureStyle, motifFor } from '@/lib/culture';
import DietTags from '@/components/DietTags';
import Scene from './Scene';
import CookMode from './CookMode';

// A real recipe from the web: every ingredient measured and beginner steps from the source page, scaled to any servings.
export default function RecipeSheet({ recipe: r, pantry, saved, onClose, onChanged, challenge = null }) {
  const { supabase, say, refreshProfile } = useWhisk();
  const [isSaved, setSaved] = useState(!!saved);
  const [logging, setLogging] = useState(false);
  const [factor, setFactor] = useState(1);
  const [cooking, setCooking] = useState(false);   // Cook mode
  const [added, setAdded] = useState([]);   // ingredients just added from this sheet (shown as ✓ straight away)
  const c0 = checkRecipe(r, pantry);
  const c = { ...c0, missing: c0.missing.filter((m) => !added.includes(m)) };
  c.ok = c0.ok || (c0.missing.length > 0 && c.missing.length === 0);
  // everything to buy, in the recipe's order: seasonings, butter, herbs and all
  const needs = shoppingNeeds(r, pantry).filter((n) => !added.includes(n));

  async function save() {
    const { data, error } = await supabase.rpc('save_recipe', { p_recipe_id: r.id });
    if (error) { say('Couldn’t save that recipe.'); return; }
    setSaved(true); refreshProfile(); onChanged?.(); say(data?.xp ? 'Saved to your cookbook · +5 XP' : 'Saved to your cookbook');
  }
  async function unsave() {
    const { error } = await supabase.from('saved_recipes').delete().eq('recipe_id', r.id);
    if (error) { say('Couldn’t unsave that.'); return; }
    setSaved(false); onChanged?.(); say('Removed from saved recipes');
  }
  async function addMissing() {
    const { data: list } = await supabase.from('shopping_items').select('name');
    const have = new Set((list || []).map((l) => l.name.toLowerCase()));
    const add = needs.filter((m) => !have.has(m.toLowerCase()));
    if (add.length) { const { error } = await supabase.from('shopping_items').insert(add.map((m) => ({ name: m.slice(0, 60), category: guessCategory(m) }))); if (error) { say('Couldn’t add to your list.'); return; } }
    say(add.length ? `Added ${add.length} to your shopping list` : 'Already on your list');
  }
  // Tap one missing ingredient to put it in your pantry (you've got it after all).
  async function addOne(k) {
    if (added.includes(k)) return;
    setAdded((a) => [...a, k]);
    const name = (k.charAt(0).toUpperCase() + k.slice(1)).slice(0, 60);
    const { error } = await supabase.from('pantry_items').insert({ name, category: guessCategory(name) });
    if (error) { setAdded((a) => a.filter((x) => x !== k)); say('Couldn’t add that.'); return; }
    say(`${name} is in your pantry`); refreshProfile(); onChanged?.();
  }
  const finish = () => { if (c.frozen.length) { say(`Defrost ${c.frozen.map((p) => p.name).join(', ')} first`); return; } setCooking(false); setLogging(true); };
  if (cooking) return <CookMode r={r} factor={factor} canFinish={c.ok} onFinish={finish} onClose={() => setCooking(false)} />;
  if (logging) return <LogMealSheet recipe={r} challenge={challenge} onClose={() => { setLogging(false); onClose?.(); }} onDone={onChanged} />;

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack cx" style={cultureStyle(r.country, r.cuisine)} data-motif={motifFor(r.country, r.cuisine)} data-tip="recipe" role="dialog" aria-modal="true" aria-label={r.title}>
        <Scene iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} className="scene-bleed" />
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div><span className="eyebrow">{r.cuisine}</span><h2 style={{ fontSize: 26 }}>{r.title}</h2></div>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <span className="src">Recipe from <a href={r.url} target="_blank" rel="noopener noreferrer">{r.source}</a>{r.video && <> · <a href={r.video} target="_blank" rel="noopener noreferrer">Watch the video</a></>}</span>
        <div className="row">
          <span className="chip">{r.minutes} min</span><span className="chip xp">+100 XP · 500 coins when you cook it</span>
          {needs.length ? <span className="chip need">{needs.length} to buy</span> : <span className="chip have">You have everything</span>}
        </div>
        {r.nutrition && (
          <div className="macros" aria-label="Nutrition per serving, from the recipe page">
            {[['kcal', r.nutrition.calories], ['protein', `${r.nutrition.protein_g}g`], ['carbs', `${r.nutrition.carbs_g}g`], ['fat', `${r.nutrition.fat_g}g`]].map(([l, v]) => (
              <div key={l}><b>{v}</b><span>{l}</span></div>
            ))}
            <small>per serving</small>
          </div>
        )}
        <DietTags recipe={r} />
        {c.frozen.length > 0 && <ThawBanner items={c.frozen} onChanged={onChanged} />}
        <ServingsX base={r.servings} factor={factor} onChange={setFactor} id={`sx-${r.id}`} />
        {needs.length > 0 ? <>
          <h3>You need</h3>
          <div className="row" style={{ gap: 6 }}>
            {needs.map((k) => <button key={k} type="button" className="chip need add-ing" onClick={() => addOne(k)} aria-label={`I have ${k}: add it to my pantry`}>+ {k}</button>)}
          </div>
          <p className="desc" style={{ margin: 0 }}>Already have one? Tap it to add it to your pantry.</p>
          <button className="btn ghost" onClick={addMissing}>Add {needs.length} to shopping list</button>
        </> : <span className="chip have" style={{ alignSelf: 'flex-start' }}>✓ You have every ingredient</span>}
        <h3>Ingredients</h3>
        <IngredientList r={r} factor={factor} missing={needs} />
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Steps</h3><button type="button" className="btn sm cm-open" onClick={() => setCooking(true)}><Icon name="play" size={16} />Cook mode</button></div>
        <StepList r={r} factor={factor} />
        <div className="row">
          {isSaved ? <button type="button" className="btn ghost" style={{ flex: '1 1 140px' }} onClick={unsave} aria-label="Saved. Tap to unsave"><Icon name="check" size={18} />Saved · Unsave</button>
            : <button className="btn ghost" style={{ flex: '1 1 140px' }} onClick={save}>Save · +5 XP</button>}
          {c.ok && <button className="btn" style={{ flex: '1 1 160px' }} onClick={() => { if (c.frozen.length) { say(`Defrost ${c.frozen.map((p) => p.name).join(', ')} first`); return; } setLogging(true); }}>I cooked it</button>}
        </div>
      </div>
    </div>
  );
}
