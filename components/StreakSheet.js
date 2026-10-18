'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin, Flame } from './Icon';
import { fmt } from '@/lib/game';

// Streak popups.
//  • "Freeze used": your free freeze just saved a missed day. Buy another with coins so the next miss is covered too.
//  • "Streak lost": bring it back with a Revive ($1.25, paid through RevenueCat), which also adds a fresh freeze.
// Opens after a meal (event "yoke-streak") and when the app opens with a lost streak.
export default function StreakSheet() {
  const { supabase, profile, refreshProfile, say, account } = useWhisk();
  const [view, setView] = useState(null);   // { mode: 'freeze' | 'lost', lost, revives, price, left }
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const check = useCallback(async (hint) => {
    const { data, error: e } = await supabase.rpc('get_streak');
    if (e || !data) return;
    const key = data.lost ? `yoke-lost-${data.lost}-${new Date().toDateString()}` : '';
    let skipped = false;
    try { skipped = !hint && key && localStorage.getItem(key) === '1'; } catch {}
    if (data.lost && !skipped) setView({ mode: 'lost', lost: data.lost, revives: data.revives, price: data.freeze_price, key });
    else if (hint?.used_freeze && hint.freezes_left === 0) setView({ mode: 'freeze', price: data.freeze_price, key: '' });
  }, [supabase]);

  useEffect(() => { if (profile?.id) check(null); }, [profile?.id, check]);
  useEffect(() => {
    const on = (e) => check(e.detail || {});
    window.addEventListener('yoke-streak', on);
    return () => window.removeEventListener('yoke-streak', on);
  }, [check]);

  function close() {
    try { if (view?.key) localStorage.setItem(view.key, '1'); } catch {}
    setView(null); setError('');
  }
  async function buyFreeze() {
    setBusy('freeze'); setError('');
    const { error: e } = await supabase.rpc('buy_streak_freeze');
    setBusy('');
    if (e) { setError(e.message || 'Couldn’t buy that.'); return; }
    await refreshProfile(); say('Streak freeze bought'); setView(null);
  }
  async function useRevive() {
    setBusy('use'); setError('');
    const { data, error: e } = await supabase.rpc('use_revive');
    setBusy('');
    if (e) { setError(e.message || 'Couldn’t revive that.'); return; }
    await refreshProfile(); say(`Streak back: ${data.streak} days`); setView(null);
  }
  async function buyRevive() {
    if (account?.anon) { setError('Back up your game first (Me › Back up) so what you buy can’t be lost.'); return; }
    setBusy('buy'); setError('');
    try {
      const res = await fetch('/api/coins/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack: 'streak-revive' }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.url) throw new Error(json.error || 'Couldn’t start the checkout.');
      window.location.assign(json.url);
    } catch (e) { setError(e.message); setBusy(''); }
  }

  if (!view) return null;
  const lost = view.mode === 'lost';
  const canBuy = (profile?.coins || 0) >= (view.price || 1500);
  return (
    <div className="popup-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="popup" role="dialog" aria-modal="true" aria-label={lost ? 'Streak lost' : 'Streak freeze used'} data-testid={lost ? 'streak-lost' : 'streak-freeze'}>
        <button className="x" type="button" aria-label="Close" onClick={close}><Icon name="x" /></button>
        <div style={{ display: 'grid', placeItems: 'center', padding: '6px 0' }}><Flame size={64} /></div>
        {lost ? (
          <>
            <h2>Your {view.lost}-day streak ended</h2>
            <p className="muted" style={{ margin: '4px 0 0', textAlign: 'center' }}>Revive it and keep every day, plus a fresh 1-day streak freeze.</p>
            {view.revives > 0
              ? <button className="btn wide" style={{ marginTop: 10 }} onClick={useRevive} disabled={!!busy} autoFocus>{busy === 'use' ? 'Reviving…' : 'Use your Revive'}</button>
              : <button className="btn wide" style={{ marginTop: 10 }} onClick={buyRevive} disabled={!!busy} autoFocus>{busy === 'buy' ? 'Opening…' : 'Revive streak · $1.25'}</button>}
            <button className="btn ghost wide" style={{ marginTop: 6 }} onClick={close}>Start fresh</button>
          </>
        ) : (
          <>
            <h2>Streak freeze used</h2>
            <p className="muted" style={{ margin: '4px 0 0', textAlign: 'center' }}>It saved your streak. You have no freezes left, so the next missed day ends it. Get another?</p>
            <button className="btn wide" style={{ marginTop: 10 }} onClick={buyFreeze} disabled={!!busy || !canBuy} autoFocus><Coin size={18} />{busy === 'freeze' ? 'Buying…' : `Buy a freeze · ${fmt(view.price)}`}</button>
            {!canBuy && <span className="desc">You need {fmt(view.price)} coins. Cooking earns them.</span>}
            <button className="btn ghost wide" style={{ marginTop: 6 }} onClick={close}>Not now</button>
          </>
        )}
        {error && <p className="err" role="alert">{error}</p>}
      </div>
    </div>
  );
}
