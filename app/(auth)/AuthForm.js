'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signup = mode === 'signup';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (signup && password.length < 8) { setError('Use at least 8 characters for your password.'); return; }
    setBusy(true);
    const supabase = supabaseBrowser();
    try {
      if (signup) {
        const site = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${site}/auth/confirm` } });
        if (error) throw error;
        router.push('/check-email');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/home');
        router.refresh();
      }
    } catch (err) {
      const msg = String(err?.message || '');
      if (/confirm/i.test(msg)) setError('Confirm your email first. Check your inbox for the link.');
      else if (signup) setError(msg || 'Could not create the account. Try again.');
      else setError('That email and password don’t match an account.');
    } finally { setBusy(false); }
  }

  return (
    <main className="auth">
      <form className="card" onSubmit={onSubmit} noValidate>
        <img src="/icon.svg" alt="" width="64" height="64" style={{ borderRadius: 18 }} />
        <h1>{signup ? 'Make your account' : 'Welcome back'}</h1>
        <div>
          <label className="lbl" htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="lbl" htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
        <button className="btn wide" type="submit" disabled={busy}>{busy ? 'One sec…' : signup ? 'Create account' : 'Log in'}</button>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {signup ? <>Already have one? <Link href="/login">Log in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
