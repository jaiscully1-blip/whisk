'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { LOGIN_CHOICE_KEY } from '@/components/CookieConsent';

// One phone, no account: no email, no password, no Google. "Start playing" makes a private game for this phone
// (Supabase anonymous sign-in), so the database still keeps every player's data to themselves.
// First, a plain-words disclaimer: Whisk records what you do in the app. Accept → recorded, Decline → you still
// play and nothing is recorded. The choice is saved with the game (see AppShell) and can be changed in Settings.
export default function AuthForm() {
  const router = useRouter();
  const [choice, setChoice] = useState(null);   // 'accept' | 'decline'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    try { const ref = new URLSearchParams(window.location.search).get('ref'); if (ref && /^[A-Za-z0-9]{6}$/.test(ref)) localStorage.setItem('whisk-ref', ref.toUpperCase()); } catch {}
    try { const c = JSON.parse(localStorage.getItem(LOGIN_CHOICE_KEY) || 'null'); if (c && typeof c.usage === 'boolean') setChoice(c.usage ? 'accept' : 'decline'); } catch {}
  }, []);

  function pick(c) {
    setChoice(c); setError('');
    try { localStorage.setItem(LOGIN_CHOICE_KEY, JSON.stringify({ usage: c === 'accept', at: new Date().toISOString() })); } catch {}
  }
  async function start() {
    setBusy(true); setError('');
    const { error: e } = await supabaseBrowser().auth.signInAnonymously();
    if (e) { setBusy(false); setError(/rate|many/i.test(e.message || '') ? 'Too many new games from this network. Try again in a bit.' : 'Couldn’t start the game. Check your connection and try again.'); return; }
    router.replace('/cook'); router.refresh();
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
          <p className="dc-device"><b>Your game saves on this device only.</b> There’s no account, so it can’t move to another phone or browser. Deleting the app or clearing this browser’s data erases it, coins included.</p>
          <div className="dc-btns" role="radiogroup" aria-label="Accept or decline: Whisk records what you do, and your game saves on this device only">
            <button type="button" role="radio" aria-checked={choice === 'accept'} className={`dc-btn ${choice === 'accept' ? 'on' : ''}`} onClick={() => pick('accept')}>Accept</button>
            <button type="button" role="radio" aria-checked={choice === 'decline'} className={`dc-btn ${choice === 'decline' ? 'on' : ''}`} onClick={() => pick('decline')}>Decline</button>
          </div>
          <p className="desc" style={{ margin: 0 }}>{choice === 'decline' ? 'No problem. You can still play everything, and nothing you do is recorded.' : choice === 'accept' ? 'Thanks! That helps a lot.' : 'Decline and you can still play. Nothing gets recorded.'}</p>
        </section>

        <button className="btn wide startbtn" type="button" onClick={start} disabled={!choice || busy}>{busy ? 'Setting up your kitchen…' : 'Start playing'}</button>
        {!choice && <p className="desc" style={{ margin: 0 }}>Pick Accept or Decline first.</p>}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <p className="desc" style={{ margin: 0 }}>No account, no email, no password.</p>
      </div>
    </main>
  );
}
