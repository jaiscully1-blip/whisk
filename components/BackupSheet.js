'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { backupMethods, backupError, emailTaken, confirmUrl } from '@/lib/backup';
import { passwordProblem } from '@/lib/password';

// One sheet for every way into an account. Email + password, nothing to verify (Supabase → Authentication → Email →
// "Confirm email" is switched off).
//  • mode 'backup'  : this phone's game gets an email + password, so it can be opened on any phone. Same game, nothing changes.
//  • mode 'signup'  : start screen → a brand-new game with an email + password.
//  • mode 'login'   : start screen → open a game that already has an email + password.
// If the email in 'backup' already has a game, the sheet offers to log in to that game instead.
export default function BackupSheet({ supabase, mode: start = 'backup', onClose }) {
  const router = useRouter();
  const [mode, setMode] = useState(start === 'restore' ? 'login' : start);
  const [ways, setWays] = useState(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [taken, setTaken] = useState(false);   // the email in 'backup' already has a game
  const [busy, setBusy] = useState('');
  useEffect(() => { backupMethods().then(setWays); }, []);
  const backup = mode === 'backup', login = mode === 'login';
  const title = backup ? 'Back up your game' : login ? 'Log in' : 'Create account';

  async function oauth(provider) {
    setBusy(provider); setErr('');
    const opts = { provider, options: { redirectTo: confirmUrl() } };
    const { error } = backup ? await supabase.auth.linkIdentity(opts) : await supabase.auth.signInWithOAuth(opts);
    if (error) { setErr(backupError(error)); setBusy(''); }   // on success the browser goes to Apple/Google
  }
  async function submit(e) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr('That email doesn’t look right.'); return; }
    if (!login) { const bad = passwordProblem(pw, v); if (bad) { setErr(bad); return; } }
    else if (pw.length < 8) { setErr('That password is too short.'); return; }
    setBusy('email'); setErr(''); setTaken(false);
    let error = null;
    if (backup) ({ error } = await supabase.auth.updateUser({ email: v, password: pw }));
    else if (login) ({ error } = await supabase.auth.signInWithPassword({ email: v, password: pw }));
    else ({ error } = await supabase.auth.signUp({ email: v, password: pw }));
    setBusy('');
    if (error) {
      if (emailTaken(error) && backup) { setTaken(true); return; }
      if (emailTaken(error) && !login) { setErr('That email already has a Yoke game. Log in instead.'); setMode('login'); return; }
      setErr(backupError(error)); return;
    }
    onClose?.();
    router.replace('/cook'); router.refresh();
  }
  const none = ways && !ways.apple && !ways.google && !ways.email;
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>{title}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <p className="desc" style={{ margin: 0 }}>
          {backup ? 'Right now your game lives only on this phone. Add an email and a password and you can open it on any phone: same coins, pantry, streak and outfits.'
            : login ? 'Log in with the email and password you used before to open that game.'
            : 'Make an account with an email and a password. Your game then works on any phone.'}
        </p>
        {ways === null ? <p className="muted">Loading…</p> : none ? <p className="desc warnbox"><Icon name="shield" size={16} />Accounts aren’t switched on for Yoke yet. Your game is still saved on this phone.</p> : (
          <>
            {ways.apple && <button className="btn wide sso apple" onClick={() => oauth('apple')} disabled={!!busy}>{busy === 'apple' ? 'Opening…' : 'Continue with Apple'}</button>}
            {ways.google && <button className="btn wide sso google" onClick={() => oauth('google')} disabled={!!busy}>{busy === 'google' ? 'Opening…' : 'Continue with Google'}</button>}
            {ways.email && (
              <form className="stack" style={{ gap: 8 }} onSubmit={submit}>
                {(ways.apple || ways.google) && <span className="eyebrow" style={{ textAlign: 'center' }}>or with email</span>}
                <label htmlFor="bk-email" hidden>Email</label>
                <input id="bk-email" className="input" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" maxLength={120} value={email} onChange={(e) => { setEmail(e.target.value); setTaken(false); }} />
                <label htmlFor="bk-pw" hidden>Password</label>
                <input id="bk-pw" className="input" type="password" autoComplete={login ? 'current-password' : 'new-password'} placeholder={login ? 'Password' : 'Password (8+ characters, letters and numbers)'} maxLength={72} value={pw} onChange={(e) => setPw(e.target.value)} />
                <button className="btn wide" type="submit" disabled={!!busy} data-testid="bk-submit">{busy === 'email' ? 'One moment…' : backup ? 'Back up my game' : login ? 'Log in' : 'Create account'}</button>
              </form>
            )}
          </>
        )}
        {taken && (
          <div className="card stack" role="alert" style={{ gap: 8 }} data-testid="bk-taken">
            <b>That email already has a Yoke game.</b>
            <span className="desc">Log in to open it. The game on this phone stays here, but you won’t be playing it any more.</span>
            <button type="button" className="btn wide" onClick={() => { setMode('login'); setTaken(false); setErr(''); }} data-testid="bk-login-instead">Log in with that email</button>
          </div>
        )}
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        {!none && ways?.email && (
          <button type="button" className="linkbtn" style={{ alignSelf: 'center' }} onClick={() => { setMode(login ? (start === 'backup' ? 'backup' : 'signup') : 'login'); setErr(''); setTaken(false); }}>
            {login ? (start === 'backup' ? 'Back to backing up' : 'Create a new account instead') : backup ? 'Already have an account? Log in' : 'Already have an account? Log in'}
          </button>
        )}
      </div>
    </div>
  );
}
