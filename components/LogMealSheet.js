'use client';
import { useState } from 'react';
import { useWhisk, useDraft } from './AppShell';
import Icon from './Icon';
import { fmt } from '@/lib/game';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';

// Shrinks the photo in the browser before upload (max 1600px JPEG) — faster, and strips camera metadata like GPS.
async function compress(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

// Photo of your plate → log_meal. Title, cuisine and nutrition come from the recipe on the server.
// Or a dish from the search (`dish` = { name, countries }): it counts toward that country's passport stamp.
export default function LogMealSheet({ recipe = null, dish = null, country: country0 = null, challenge = null, onClose, onDone }) {
  const { supabase, profile, refreshProfile, showPopup, say } = useWhisk();
  const [notes, setNotes, clearNotes] = useDraft(`notes:${recipe ? recipe.id : 'dish:' + dish.name}`);
  const [country, setCountry] = useState(country0 || dish?.countries?.[0] || null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function pick(e) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) && !/\.(heic|heif)$/i.test(f.name)) { setError('Pick a photo (JPG, PNG or WebP).'); return; }
    setError(''); setFile(f); setPreview(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) { setError('Add a photo of your plate. It’s how you earn the XP.'); return; }
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
      await refreshProfile();
      onDone?.(data);
      onClose?.();
      showPopup({ kind: 'cooked', mealId: data.meal_id });
      if (data.stamp) showPopup({ kind: 'stamp', country: data.stamp });
      say(`+${data.xp} XP${data.coins ? ` · +${fmt(data.coins)} coins` : ''}${data.used_freeze ? ' · streak freeze used' : ''}`);
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
        {challenge && <p className="ok" style={{ margin: 0 }}>Worth {fmt(challenge.coins)} coins + 100 XP</p>}
        <b style={{ fontSize: 18 }}>{recipe ? recipe.title : dish.name}</b>
        {dish && (dish.countries || []).length > 1 && (
          <div><label className="lbl" htmlFor="meal-country">Counts toward the stamp for</label>
            <select id="meal-country" className="input" value={country || ''} onChange={(e) => setCountry(e.target.value)}>{dish.countries.map((c) => <option key={c} value={c}>{COUNTRY_BY_ISO[c]?.[1] || c}</option>)}</select></div>
        )}
        {dish && (dish.countries || []).length === 1 && <span className="desc">Counts toward your {COUNTRY_BY_ISO[country]?.[1]} stamp</span>}
        <label className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 180, cursor: 'pointer', borderStyle: 'dashed', padding: 8 }}>
          {preview ? <img src={preview} alt="Your plate" style={{ maxHeight: 260, maxWidth: '100%', borderRadius: 14 }} /> : <span className="row muted" style={{ fontWeight: 800 }}><Icon name="camera" size={24} />Add a photo of your plate</span>}
          <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
        </label>
        <div>
          <label className="lbl" htmlFor="meal-notes">Notes (optional)</label>
          <textarea id="meal-notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn wide" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Submit'}</button>
      </form>
    </div>
  );
}
