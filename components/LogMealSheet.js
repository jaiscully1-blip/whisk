'use client';
import { useState, useEffect } from 'react';
import { useWhisk, useDraft } from './AppShell';
import Icon from './Icon';
import { postcardSvg } from '@/lib/scenes';
import { fmt } from '@/lib/game';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';
import { compress } from '@/lib/photo';
import { parseRecipeText } from '@/lib/recipes/parseText';
import { planUse } from '@/lib/pantry/use';
import ShareChips, { NOT_SHARED } from './ShareChips';
import { recipeCard } from '@/lib/recipes/card';

// Photo of your plate → log_meal. Title, cuisine and nutrition come from the recipe on the server.
// Or a dish from the search (`dish` = { name, countries }): it counts toward that country on your globe.
export default function LogMealSheet({ recipe: recipe0 = null, dish = null, country: country0 = null, challenge = null, factor = 1, onClose, onDone }) {
  const { supabase, profile, refreshProfile, showPopup, say, setUi, ui, getUi, allRecipes, ensureRecipes, bump } = useWhisk();
  const [recipe, setRecipe] = useState(recipe0);   // the recipe being posted; can be switched to one you read earlier
  const [findQ, setFindQ] = useState('');
  const [dd, setDd] = useState(false);   // the "last 3 you opened" drop-down under the search box
  const [notes, setNotes, clearNotes] = useDraft(`notes:${recipe0 ? recipe0.id : 'dish:' + dish.name}`);
  const [country, setCountry] = useState(country0 || dish?.countries?.[0] || null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Optional: write your own recipe right here. Hidden until "Write my recipe" is tapped; saved with the meal on Submit.
  const [wr, setWr] = useState(false);
  const [paste, setPaste] = useState('');
  const [ings, setIngs] = useState('');
  const [stepsTxt, setStepsTxt] = useState('');
  const [have, setHave] = useState([]);
  const [share, setShare] = useState(() => ({ friends: !!ui?.lastShare?.friends, groups: Array.isArray(ui?.lastShare?.groups) ? ui.lastShare.groups : [] }));
  useEffect(() => {
    if (!wr || have.length) return;
    supabase.from('pantry_items').select('name').limit(8).then(({ data }) => setHave((data || []).map((d) => d.name)), () => {});
  }, [wr]); // eslint-disable-line react-hooks/exhaustive-deps
  const recents = recipe0 && !challenge ? [recipe0, ...(((getUi?.() || ui)?.recentRecipes || []).map((x) => (allRecipes || []).find((r) => r.id === x.id) || x))].filter((r, i, a) => a.findIndex((y) => y.id === r.id) === i).slice(0, 8) : [];
  const found = findQ.trim().length >= 2 ? (allRecipes || []).filter((r) => r.title.toLowerCase().includes(findQ.trim().toLowerCase())).slice(0, 6) : [];
  const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  function split() {
    const r = parseRecipeText(paste.split('\n'));
    if (!r.ingredients.length && !r.steps.length) { setError('I couldn’t tell which lines are ingredients and which are steps. Type them in the boxes below.'); return; }
    setError(''); setIngs(r.ingredients.map((l) => l.text).join('\n')); setStepsTxt(r.steps.map((l) => l.text).join('\n')); setPaste('');
  }
  const addChip = (n) => setIngs((t) => (lines(t).some((l) => l.toLowerCase() === n.toLowerCase()) ? t : `${t.trim()}${t.trim() ? '\n' : ''}${n}`));

  function pick(e) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { setError('Pick a photo (JPG, PNG or WebP).'); return; }
    setError(''); setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) { setError('Add a photo of your plate. It’s how you earn the XP.'); return; }
    const wIng = wr ? lines(ings) : [], wSteps = wr ? lines(stepsTxt) : [];
    setBusy(true); setError('');
    try {
      const blob = await compress(file);
      if (blob.size > 5 * 1024 * 1024) throw new Error('That photo is too big even after shrinking.');
      const path = `${profile.id}/${crypto.randomUUID()}.jpg`;
      const up = await supabase.storage.from('meal-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw new Error('The photo didn’t upload. Try again.');
      const { data, error } = await supabase.rpc('log_meal', recipe
        ? { p_recipe_id: recipe.id, p_photo_path: path, p_challenge_id: challenge?.id || null, p_notes: notes.trim().slice(0, 500) || null }
        : { p_recipe_id: null, p_photo_path: path, p_notes: notes.trim().slice(0, 500) || null, p_dish: dish.name, p_country: country });
      if (error) throw new Error('Could not save that meal.');
      clearNotes();
      if (wIng.length || wSteps.length) {
        const title = (recipe ? recipe.title : dish.name).slice(0, 120);
        const { data: row, error: re } = await supabase.from('my_recipes').insert({ title, servings: null, minutes: null, ingredients: (wIng.length ? wIng : ['Add your ingredients']).map((t) => t.slice(0, 200)).slice(0, 60), steps: (wSteps.length ? wSteps : ['Add your steps']).map((t) => t.slice(0, 1000)).slice(0, 60) }).select('id').single();
        if (!re && row?.id && data?.meal_id) setUi((cur) => ({ pbLinks: { ...(cur.pbLinks || {}), [data.meal_id]: row.id } }));
        else { say('Your meal is saved, but the recipe didn’t save. Find it in your photobook to try again.'); if (data?.meal_id) setUi((cur) => ({ pbDrafts: { ...(cur.pbDrafts || {}), [data.meal_id]: { ings: wIng.slice(0, 60), steps: wSteps.slice(0, 60) } } })); }
      }
      // who sees this plate, and the recipe on its back
      if (data?.meal_id) {
        try {
          let full = recipe; if (recipe && !recipe.ingredients && !recipe.amounts) full = (await ensureRecipes([recipe.id]))[0] || recipe;
          const card = recipeCard((recipe ? recipe.title : dish.name), full, wIng, wSteps, wIng.length ? 1 : factor);
          if (card) await supabase.rpc('set_meal_card', { p_meal: data.meal_id, p_card: card });
          if (share.friends || share.groups.length) {
            const r = await supabase.rpc('set_meal_sharing', { p_meal: data.meal_id, p_friends: share.friends, p_groups: share.groups });
            if (r.error || r.data === false) say('Your meal is saved, but sharing didn’t work. Change it from your photobook.');
          }
          setUi({ lastShare: { friends: share.friends, groups: share.groups } });
        } catch {}
      }
      // what you used comes off your pantry: the recipe's amounts (as scaled) or the ones you wrote yourself
      let used = 0;
      try {
        let src = wIng.length ? wIng : null;
        if (!src && recipe) { const full = recipe.ingredients ? recipe : (await ensureRecipes([recipe.id]))[0] || recipe; src = full.ingredients || null; }
        if (src) {
          const { data: pantry } = await supabase.from('pantry_items').select('id, name, quantity, status');
          const plan = planUse(src, wIng.length ? 1 : factor, pantry || []);
          await Promise.all(plan.map((x) => supabase.from('pantry_items').update(x.patch).eq('id', x.id)));
          used = plan.length; if (used) bump?.();
        }
      } catch {}
      await refreshProfile();
      onDone?.(data);
      onClose?.();
      showPopup({ kind: 'cooked', mealId: data.meal_id, recipe });
      if (data.country_done) showPopup({ kind: 'country', country: data.country_done });
      say(`${used ? `Pantry updated (${used}) · ` : ''}+${data.xp} XP${data.coins ? ` · +${fmt(data.coins)} coins` : ''}${data.lucky ? ' · lucky meal, bonus coins!' : ''}${data.streak_coins ? ` · streak reward +${fmt(data.streak_coins)}` : ''}${data.used_freeze ? ' · streak freeze used' : ''}`);
      if (data.used_freeze || data.lost_streak) window.dispatchEvent(new CustomEvent('yoke-streak', { detail: data }));
    } catch (err) {
      setError(err?.message || 'Could not save that meal.');
    } finally { setBusy(false); }
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <form className="sheet stack" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Log a meal">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>{challenge ? 'Finish the challenge' : 'I cooked it'}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {challenge && <p className="ok" style={{ margin: 0 }}>Worth {fmt(challenge.coins)} coins + 50 XP</p>}
        <b style={{ fontSize: 18 }}>{recipe ? recipe.title : dish.name}</b>
        {recents.length > 1 && (
          <div className="stack" style={{ gap: 6 }} data-testid="lm-which">
            <span className="lbl">Which recipe did you cook?</span>
            <div className="lm-rec" data-testid="lm-recents">{recents.map((r) => { const on = recipe?.id === r.id; return (
              <button key={r.id} type="button" className={`lm-tile ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => setRecipe(r)} data-testid="lm-recent">
                <span className="rcard-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: postcardSvg({ iso: r.country, cuisine: r.cuisine, title: r.title, ingredients: r.key }).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ') }} />
                <span className="lm-fade" />{on && <span className="lm-chk"><Icon name="check" size={12} /></span>}
                <span className="lm-name">{r.title}</span>
              </button>); })}</div>
          </div>
        )}
        {!challenge && (
          <div className="stack" style={{ gap: 6, position: 'relative' }}>
            <input className="input" placeholder="Cooked something else? Search recipes" value={findQ} onChange={(e) => setFindQ(e.target.value)} onFocus={() => setDd(true)} onBlur={() => setTimeout(() => setDd(false), 150)} aria-label="Search recipes" aria-expanded={dd && !findQ} data-testid="lm-find" />
            {dd && !findQ.trim() && ((getUi?.() || ui)?.recentRecipes || []).length > 0 && (
              <div className="lm-dd" role="listbox" data-testid="lm-dd">
                <span className="eyebrow" style={{ padding: '2px 4px' }}>Last opened</span>
                {((getUi?.() || ui)?.recentRecipes || []).slice(0, 3).map((x) => <button key={x.id} type="button" role="option" aria-selected={recipe?.id === x.id} className="lm-dd-item" data-testid="lm-dd-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { setRecipe((allRecipes || []).find((r) => r.id === x.id) || x); setDd(false); }}>{x.title}{recipe?.id === x.id && <Icon name="check" size={14} />}</button>)}
              </div>
            )}
            {found.map((r) => <button key={r.id} type="button" className="card" style={{ textAlign: 'left', background: 'var(--field)', color: 'var(--fg)', fontWeight: 800, padding: 10 }} onClick={() => { setRecipe(r); setFindQ(''); }}>{r.title}</button>)}
          </div>
        )}
        {dish && (dish.countries || []).length > 1 && (
          <div><label className="lbl" htmlFor="meal-country">Counts toward</label>
            <select id="meal-country" className="input" value={country || ''} onChange={(e) => setCountry(e.target.value)}>{dish.countries.map((c) => <option key={c} value={c}>{COUNTRY_BY_ISO[c]?.[1] || c}</option>)}</select></div>
        )}
        {dish && (dish.countries || []).length === 1 && <span className="desc">Counts toward {COUNTRY_BY_ISO[country]?.[1]} on your globe</span>}
        <label className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minHeight: 180, cursor: 'pointer', borderStyle: 'dashed', padding: 8 }}>
          {preview ? <img src={preview} alt="Your plate" style={{ maxHeight: 260, maxWidth: '100%', borderRadius: 14 }} /> : <span className="row muted" style={{ fontWeight: 800 }}><Icon name="camera" size={24} />Add a photo of your plate</span>}
          <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
        </label>
        {preview && <ShareChips value={share} onChange={setShare} />}
        <div>
          <label className="lbl" htmlFor="meal-notes">Notes (optional)</label>
          <textarea id="meal-notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {!wr ? (
          <button type="button" className="btn ghost wide" style={{ borderStyle: 'dashed' }} onClick={() => setWr(true)} data-testid="lm-write"><Icon name="pencil" size={18} />Write my recipe</button>
        ) : (
          <div className="card stack" style={{ gap: 8, borderStyle: 'dashed' }} data-testid="lm-editor">
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <b>Your recipe for {recipe ? recipe.title : dish.name}</b>
              <button type="button" className="btn ghost sm" onClick={() => { setWr(false); setIngs(''); setStepsTxt(''); setPaste(''); }} aria-label="Close recipe box"><Icon name="x" size={16} /></button>
            </div>
            <textarea className="input" rows={2} placeholder="Paste a whole recipe here and tap Split it" value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Paste a recipe" data-testid="lm-paste" />
            {paste.trim() && <button type="button" className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={split} data-testid="lm-split">Split it</button>}
            <label className="lbl" htmlFor="lm-ings">Ingredients (one per line)</label>
            {have.length > 0 && <div className="row" style={{ gap: 6 }}>{have.map((n) => <button key={n} type="button" className="pill" style={{ cursor: 'pointer' }} onClick={() => addChip(n)}>+ {n}</button>)}</div>}
            <textarea id="lm-ings" className="input" rows={4} value={ings} onChange={(e) => setIngs(e.target.value)} data-testid="lm-ings" />
            <label className="lbl" htmlFor="lm-steps">Steps (one per line)</label>
            <textarea id="lm-steps" className="input" rows={4} value={stepsTxt} onChange={(e) => setStepsTxt(e.target.value)} data-testid="lm-steps" />
            <span className="desc">Saved with your meal when you tap Submit.</span>
          </div>
        )}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn wide" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
      </form>
    </div>
  );
}
