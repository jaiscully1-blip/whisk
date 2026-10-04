'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Two-step reset: 1) your password, 2) a 6-digit code emailed to you. The database also refuses a reset
// unless the session was confirmed with that code in the last 10 minutes.
export default function ResetSheet({ onClose }) {
  const { supabase, email, profile } = useWhisk();
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function checkPassword(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: pe } = await supabase.auth.signInWithPassword({ email, password });
    if (pe) { setBusy(false); setError('That password isn’t right.'); return; }
    const { error: oe } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (oe) { setError('Couldn’t send the code. Try again in a minute.'); return; }
    setStep(2);
  }
  async function confirm(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: ve } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    if (ve) { setBusy(false); setError('That code didn’t work. Check the latest email.'); return; }
    // Remove plate photos, then reset progress (coins and shop items stay).
    try {
      const { data: files } = await supabase.storage.from('meal-photos').list(profile.id, { limit: 1000 });
      if (files?.length) await supabase.storage.from('meal-photos').remove(files.map((f) => `${profile.id}/${f.name}`));
    } catch {}
    const { error: re } = await supabase.rpc('reset_game');
    if (re) { setBusy(false); setError('Couldn’t reset. Try again.'); return; }
    try { localStorage.removeItem('whisk-ui'); } catch {}
    window.location.assign('/home');
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
          <form className="stack" onSubmit={checkPassword}>
            <div><label className="lbl" htmlFor="rs-pw">Step 1 of 2 · your password</label><input id="rs-pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <button className="btn wide" type="submit" disabled={busy || !password}>{busy ? 'Checking…' : 'Send me a code'}</button>
          </form>
        ) : (
          <form className="stack" onSubmit={confirm}>
            <div><label className="lbl" htmlFor="rs-code">Step 2 of 2 · the 6-digit code we emailed to {email}</label><input id="rs-code" className="input" inputMode="numeric" autoComplete="one-time-code" maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></div>
            <button className="btn wide" type="submit" disabled={busy || code.length < 6} style={{ background: 'var(--bad)', boxShadow: 'none' }}>{busy ? 'Resetting…' : 'Reset my game'}</button>
          </form>
        )}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn ghost wide" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
