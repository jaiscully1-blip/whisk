'use client';
import { useState, useEffect } from 'react';
import { useWhisk, useDraft } from './AppShell';
import Icon from './Icon';
import { fmt } from '@/lib/game';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';
import { compress } from '@/lib/photo';
import { parseRecipeText } from '@/lib/recipes/parseText';

// Photo of your plate → log_meal. Title, cuisine and nutrition come from the recipe on the server.
// Or a dish from the search (`dish` = { name, countries }): it counts toward that country on your globe.
export default function LogMealSheet({ recipe = null, dish = null, country: country0 = null, challenge = null, onClose, onDone }) {
  const { supabase, profile, refreshProfile, showPopup, say, setUi } = useWhisk();
  const [notes, setNotes, clearNotes] = useDraft(`notes:${recipe ? recipe.id : 'dish:' + dish.name}`);
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
  useEffect(() => {
    if (!wr || have.length) return;
    supabase.from('pantry_items').select('name').limit(8).then(({ data }) => setHave((data || []).map((d) => d.name)), () => {});
  }, [wr]); // eslint-disable-line react-hooks/exhaustive-deps
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
      await refreshProfile();
      onDone?.(data);
      onClose?.();
      showPopup({ kind: 'cooked', mealId: data.meal_id, recipe });
      if (data.country_done) showPopup({ kind: 'country', country: data.country_done });
      say(`+${data.xp} XP${data.coins ? ` · +${fmt(data.coins)} coins` : ''}${data.lucky ? ' · lucky meal, bonus coins!' : ''}${data.streak_coins ? ` · streak reward +${fmt(data.streak_coins)}` : ''}${data.used_freeze ? ' · streak freeze used' : ''}`);
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
        {dish && (dish.countries || []).length > 1 && (
          <div><label className="lbl" htmlFor="meal-country">Counts toward</label>
            <select id="meal-country" className="input" value={country || ''} onChange={(e) => setCountry(e.target.value)}>{dish.countries.map((c) => <option key={c} value={c}>{COUNTRY_BY_ISO[c]?.[1] || c}</option>)}</select></div>
        )}
        {dish && (dish.countries || []).length === 1 && <span className="desc">Counts toward {COUNTRY_BY_ISO[country]?.[1]} on your globe</span>}
        <label className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 180, cursor: 'pointer', borderStyle: 'dashed', padding: 8 }}>
          {preview ? <img src={preview} alt="Your plate" style={{ maxHeight: 260, maxWidth: '100%', borderRadius: 14 }} /> : <span className="row muted" style={{ fontWeight: 800 }}><Icon name="camera" size={24} />Add a photo of your plate</span>}
          <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
        </label>
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
