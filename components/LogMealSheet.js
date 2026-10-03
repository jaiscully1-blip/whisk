'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Shrinks the photo in the browser before upload (max 1600px JPEG) — faster, and strips camera metadata like GPS.
async function compress(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

const num = (v, max) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.max(0, Math.min(max, Math.round(Number(v)))) : null);
// Per-serving estimates from the recipe, if there is one.
function nutritionArgs(n) {
  if (!n) return {};
  return { p_calories: num(n.calories, 5000), p_protein: num(n.protein_g, 500), p_carbs: num(n.carbs_g, 800), p_fat: num(n.fat_g, 400) };
}

export default function LogMealSheet({ title: initialTitle = '', cuisine = '', recipeId = null, challenge = null, nutrition = null, onClose, onDone }) {
  const { supabase, profile, refreshProfile, showPopup, say } = useWhisk();
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState('');
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
    if (!title.trim()) { setError('What did you make?'); return; }
    if (!file) { setError('Add a photo of your plate — it’s how you earn the XP.'); return; }
    setBusy(true); setError('');
    try {
      const blob = await compress(file);
      if (blob.size > 5 * 1024 * 1024) throw new Error('That photo is too big even after shrinking.');
      const path = `${profile.id}/${crypto.randomUUID()}.jpg`;
      const up = await supabase.storage.from('meal-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw up.error;
      const { data, error } = await supabase.rpc('log_meal', { p_title: title.trim().slice(0, 120), p_photo_path: path, p_recipe_id: recipeId, p_challenge_id: challenge?.id || null, p_cuisine: cuisine || null, p_notes: notes.trim().slice(0, 500) || null, ...nutritionArgs(nutrition) });
      if (error) throw error;
      await refreshProfile();
      onDone?.(data);
      onClose?.();
      showPopup('cooked');
      say(`+${data.xp} XP${data.coins ? ` · +${data.coins} coins` : ''}${data.used_freeze ? ' · streak freeze used' : ''}`);
    } catch (err) {
      setError(err?.message?.includes('photo') ? 'The photo didn’t upload. Try again.' : (err?.message || 'Could not save that meal.'));
    } finally { setBusy(false); }
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <form className="sheet stack" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Log a meal">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>{challenge ? 'Finish the challenge' : 'I cooked it'}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {challenge && <p className="ok" style={{ margin: 0 }}>Worth {challenge.coins} coins + 100 XP</p>}
        <div>
          <label className="lbl" htmlFor="meal-title">Dish</label>
          <input id="meal-title" className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <label className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 180, cursor: 'pointer', borderStyle: 'dashed', padding: 8 }}>
          {preview ? <img src={preview} alt="Your plate" style={{ maxHeight: 260, maxWidth: '100%', borderRadius: 14 }} /> : <span className="row muted" style={{ fontWeight: 800 }}><Icon name="camera" size={24} />Add a photo of your plate</span>}
          <input type="file" accept="image/*" capture="environment" onChange={pick} hidden />
        </label>
        <div>
          <label className="lbl" htmlFor="meal-notes">Notes (optional)</label>
          <textarea id="meal-notes" className="input" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn wide" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Log it'}</button>
      </form>
    </div>
  );
}
