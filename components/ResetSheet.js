'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Reset: type RESET to erase this phone's game. (One phone, no account: whoever holds the phone owns the game.)
export default function ResetSheet({ onClose }) {
  const { supabase, profile } = useWhisk();
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function reset(e) {
    e.preventDefault(); if (word.trim().toUpperCase() !== 'RESET') return;
    setBusy(true); setError('');
    // Remove plate photos, then reset progress (coins and shop items stay).
    try {
      const { data: files } = await supabase.storage.from('meal-photos').list(profile.id, { limit: 1000 });
      if (files?.length) await supabase.storage.from('meal-photos').remove(files.map((f) => `${profile.id}/${f.name}`));
    } catch {}
    const { error: re } = await supabase.rpc('reset_game');
    if (re) { setBusy(false); setError('Couldn’t reset. Try again.'); return; }
    try { localStorage.removeItem('whisk-ui'); } catch {}
    window.location.assign('/cook');
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sheet stack" role="dialog" aria-modal="true" aria-label="Reset game" onSubmit={reset}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24 }}>Reset game</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Cancel"><Icon name="x" /></button>
        </div>
        <p className="err" style={{ margin: 0 }}>This erases your pantry, meals, photos, XP, streak and challenges. Your coins and shop items stay. It can’t be undone.</p>
        <div><label className="lbl" htmlFor="rs-word">Type RESET to erase your game</label><input id="rs-word" className="input" autoComplete="off" autoCapitalize="characters" value={word} onChange={(e) => setWord(e.target.value)} required /></div>
        <button className="btn wide" type="submit" disabled={busy || word.trim().toUpperCase() !== 'RESET'} style={{ background: 'var(--bad)', boxShadow: 'none' }}>{busy ? 'Resetting…' : 'Reset my game'}</button>
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button type="button" className="btn ghost wide" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
}
