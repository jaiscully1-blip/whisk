'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { LOGIN_CHOICE_KEY } from '@/components/CookieConsent';

// Sign in with Google only: no password, no confirm-your-email step (Google already knows it's your Gmail).
// Before that, a plain-words disclaimer: Whisk records what you do in the app. Accept → recorded, Decline → you still
// play and nothing is recorded. The choice rides along to the account after sign-in (see AppShell) and can be
// changed any time in Me → Settings → Cookies & privacy.

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
    </svg>
  );
}

export default function AuthForm() {
  const [choice, setChoice] = useState(null);   // 'accept' | 'decline'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try { const c = JSON.parse(localStorage.getItem(LOGIN_CHOICE_KEY) || 'null'); if (c && typeof c.usage === 'boolean') setChoice(c.usage ? 'accept' : 'decline'); } catch {}
    if (/[?&]error=/.test(window.location.search)) setError('Google sign-in didn’t finish. Try again.');
  }, []);

  function pick(c) {
    setChoice(c); setError('');
    try { localStorage.setItem(LOGIN_CHOICE_KEY, JSON.stringify({ usage: c === 'accept', at: new Date().toISOString() })); } catch {}
  }
  async function google() {
    setBusy(true); setError('');
    const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: e } = await supabaseBrowser().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${site}/auth/callback?next=/cook`, queryParams: { prompt: 'select_account' } } });
    if (e) { setBusy(false); setError('Couldn’t open Google. Try again.'); }
  }

  return (
    <main className="auth">
      <div className="card login">
        <img src="/icon.svg" alt="" width="64" height="64" style={{ borderRadius: 18 }} />
        <h1>Welcome to Whisk</h1>
        <p className="muted" style={{ margin: 0 }}>Cook real food, earn coins, fill your passport.</p>

        <section className="disclaimer" aria-labelledby="dc-h">
          <h2 id="dc-h">Before you start</h2>
          <p>While you play, Whisk records what you do in the app: what you tap, what you pick and what you search. It helps us make the game better.</p>
          <p>We don’t record anything else you type, and we never sell it. You can change this any time in <b>Me → Settings → Cookies &amp; privacy</b>.</p>
          <div className="dc-btns" role="radiogroup" aria-label="Allow Whisk to record what you do?">
            <button type="button" role="radio" aria-checked={choice === 'accept'} className={`dc-btn ${choice === 'accept' ? 'on' : ''}`} onClick={() => pick('accept')}>Accept</button>
            <button type="button" role="radio" aria-checked={choice === 'decline'} className={`dc-btn ${choice === 'decline' ? 'on' : ''}`} onClick={() => pick('decline')}>Decline</button>
          </div>
          <p className="desc" style={{ margin: 0 }}>{choice === 'decline' ? 'No problem. You can still play everything, and nothing you do is recorded.' : choice === 'accept' ? 'Thanks! That helps a lot.' : 'Decline and you can still play. Nothing gets recorded.'}</p>
        </section>

        <button className="gbtn" type="button" onClick={google} disabled={!choice || busy} aria-describedby={!choice ? 'pick-first' : undefined}>
          <GoogleG />{busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        {!choice && <p id="pick-first" className="desc" style={{ margin: 0 }}>Pick Accept or Decline first.</p>}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <p className="desc" style={{ margin: 0 }}>No password. Google just tells Whisk your email so your game is saved to your account.</p>
      </div>
    </main>
  );
}
