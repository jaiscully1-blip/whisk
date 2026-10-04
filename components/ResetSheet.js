'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Two-step reset: 1) confirm it's you with Google again, 2) type RESET. The database also refuses a reset
// unless this session came from a fresh sign-in in the last 10 minutes.
export default function ResetSheet({ onClose, confirmed = false }) {
  const { supabase, profile } = useWhisk();
  const [step, setStep] = useState(confirmed ? 2 : 1);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (confirmed) setStep(2); }, [confirmed]);

  async function google() {
    setBusy(true); setError('');
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent('/me?reset=1')}`, queryParams: { prompt: 'select_account' } } });
    if (e) { setBusy(false); setError('Couldn’t open Google. Try again.'); }
  }
  async function reset(e) {
    e.preventDefault(); setBusy(true); setError('');
    // Remove plate photos, then reset progress (coins and shop items stay).
    try {
      const { data: files } = await supabase.storage.from('meal-photos').list(profile.id, { limit: 1000 });
      if (files?.length) await supabase.storage.from('meal-photos').remove(files.map((f) => `${profile.id}/${f.name}`));
    } catch {}
    const { error: re } = await supabase.rpc('reset_game');
    if (re) { setBusy(false); setStep(1); setError('That took too long. Confirm with Google again, then reset within 10 minutes.'); return; }
    try { localStorage.removeItem('whisk-ui'); } catch {}
    window.location.assign('/cook');
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Reset game">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 24 }}>Reset game</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Cancel"><Icon name="x" /></button>
        </div>
        <p className="err" style={{ margin: 0 }}>This erases your pantry, meals, photos, XP, streak and challenges. Your coins and shop items stay.</p>
        {step === 1 ? (
          <div className="stack">
            <span className="lbl">Step 1 of 2 · confirm it’s you</span>
            <button className="btn wide" type="button" onClick={google} disabled={busy}>{busy ? 'Opening Google…' : 'Confirm with Google'}</button>
          </div>
        ) : (
          <form className="stack" onSubmit={reset}>
            <div><label className="lbl" htmlFor="rs-word">Step 2 of 2 · type RESET to erase your game</label><input id="rs-word" className="input" autoComplete="off" autoCapitalize="characters" value={word} onChange={(e) => setWord(e.target.value)} required /></div>
            <button className="btn wide" type="submit" disabled={busy || word.trim().toUpperCase() !== 'RESET'} style={{ background: 'var(--bad)', boxShadow: 'none' }}>{busy ? 'Resetting…' : 'Reset my game'}</button>
          </form>
        )}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn ghost wide" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
