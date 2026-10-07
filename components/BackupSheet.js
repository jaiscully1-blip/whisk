'use client';
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { backupMethods, backupError, confirmUrl } from '@/lib/backup';

// Back up your game (link this phone's game to Apple, Google or an email), or, on the start screen, get a backed-up
// game back on a new phone. `mode`: 'backup' | 'restore'. The game itself never changes: same coins, pantry, streak.
export default function BackupSheet({ supabase, mode = 'backup', onClose }) {
  const [ways, setWays] = useState(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => { backupMethods().then(setWays); }, []);
  const backup = mode === 'backup';

  async function oauth(provider) {
    setBusy(provider); setErr('');
    const opts = { provider, options: { redirectTo: confirmUrl() } };
    const { error } = backup ? await supabase.auth.linkIdentity(opts) : await supabase.auth.signInWithOAuth(opts);
    if (error) { setErr(backupError(error)); setBusy(''); }   // on success the browser goes to Apple/Google
  }
  async function byEmail(e) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr('That email doesn’t look right.'); return; }
    setBusy('email'); setErr('');
    const { error } = backup
      ? await supabase.auth.updateUser({ email: v }, { emailRedirectTo: confirmUrl() })
      : await supabase.auth.signInWithOtp({ email: v, options: { shouldCreateUser: false, emailRedirectTo: confirmUrl() } });
    setBusy('');
    // when getting a game back, don't reveal whether an email has a game
    if (error && (backup || !/signups? not allowed|not found|otp_disabled/i.test(error.message || ''))) { setErr(backupError(error)); return; }
    setSent(v);
  }
  const none = ways && !ways.apple && !ways.google && !ways.email;
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={backup ? 'Back up your game' : 'Get my game back'}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>{backup ? 'Back up your game' : 'Get my game back'}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        {sent ? (
          <div className="stack" style={{ gap: 8, textAlign: 'center', padding: '8px 0' }}>
            <b style={{ fontSize: 20 }}>Check your email</b>
            <p className="desc" style={{ margin: 0 }}>{backup ? <>We sent a link to <b>{sent}</b>. Tap it on this phone and your game is backed up. Nothing else changes.</> : <>If <b>{sent}</b> has a Whisk game, a link is on its way. Tap it on this phone to get your game back.</>}</p>
            <button className="btn wide" onClick={onClose}>OK</button>
          </div>
        ) : (
          <>
            <p className="desc" style={{ margin: 0 }}>{backup ? 'Right now your game lives only on this phone. Back it up and you can get it back on any phone: same coins, pantry, streak and outfits.' : 'Backed up your game before? Sign in the same way to get it back on this phone.'}</p>
            {ways === null ? <p className="muted">Loading…</p> : none ? <p className="desc warnbox"><Icon name="shield" size={16} />Backups aren’t switched on for Whisk yet. Your game is still saved on this phone.</p> : (
              <>
                {ways.apple && <button className="btn wide sso apple" onClick={() => oauth('apple')} disabled={!!busy}>{busy === 'apple' ? 'Opening…' : 'Continue with Apple'}</button>}
                {ways.google && <button className="btn wide sso google" onClick={() => oauth('google')} disabled={!!busy}>{busy === 'google' ? 'Opening…' : 'Continue with Google'}</button>}
                {ways.email && (
                  <form className="stack" style={{ gap: 8 }} onSubmit={byEmail}>
                    {(ways.apple || ways.google) && <span className="eyebrow" style={{ textAlign: 'center' }}>or with email</span>}
                    <label htmlFor="bk-email" hidden>Email</label>
                    <input id="bk-email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
                    <button className="btn ghost wide" type="submit" disabled={!!busy}>{busy === 'email' ? 'Sending…' : 'Email me a link'}</button>
                  </form>
                )}
              </>
            )}
            {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
            {backup && <span className="desc" style={{ textAlign: 'center' }}>No password. We only use it to give you your game back.</span>}
          </>
        )}
      </div>
    </div>
  );
}
