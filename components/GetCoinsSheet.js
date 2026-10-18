'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import InviteFriend from './InviteFriend';
import BackupSheet from './BackupSheet';
import { fmt } from '@/lib/game';

// Coin packs paid with Apple Pay, Google Pay or a card on RevenueCat's checkout (your Stripe account). Coins arrive as
// soon as the payment goes through. Buying needs a backed-up game, so paid coins can't be lost with the phone.
export default function GetCoinsSheet({ onClose }) {
  const { supabase, account } = useWhisk();
  const anon = !!account?.anon;
  const [backingUp, setBackingUp] = useState(false);
  const [packs, setPacks] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('coin_packs').select('id, coins, usd').order('sort').then(({ data }) => setPacks(data || [])); }, [supabase]);

  async function buy(p) {
    setBusy(p.id); setError('');
    try {
      const res = await fetch('/api/coins/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack: p.id }) });
      const json = await res.json().catch(() => ({}));
      if (json.backup) { setBusy(''); setBackingUp(true); return; }
      if (!res.ok || !json.url) throw new Error(json.error || 'Couldn’t start the checkout.');
      window.location.assign(json.url);
    } catch (e) { setError(e.message); setBusy(''); }
  }

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Get coins">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Get coins</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <InviteFriend />
        <h3 style={{ fontSize: 20, marginTop: 4 }}>Buy coins</h3>
        <p className="muted" style={{ margin: 0 }}>Pay with Apple Pay, Google Pay or a card. Coins land in your game right after you pay.</p>
        {anon && (
          <div className="card stack" style={{ gap: 8 }}>
            <b>Back up your game first</b>
            <span className="muted" style={{ fontSize: 14 }}>Link Apple, Google or an email so coins you pay for stay yours, even on a new phone. Takes a few seconds.</span>
            <button type="button" className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => setBackingUp(true)}><Icon name="shield" size={16} />Back up your game</button>
          </div>
        )}
        {packs === null ? <p className="muted">Loading…</p> : (
          <div className="grid2">
            {packs.map((p, i) => {
              // coins per dollar go up with every pack; show how much better than the smallest one
              const base = packs[0] ? packs[0].coins / Number(packs[0].usd) : 0;
              const bonus = base ? Math.round((p.coins / Number(p.usd) / base - 1) * 100) : 0;
              const tag = p.id === 'coins-999' ? 'Popular' : p.id === 'coins-1999' ? 'Best value' : '';
              const last = i === packs.length - 1 && packs.length % 2 === 1;
              return (
                <button key={p.id} className="card stack" onClick={() => (anon ? setBackingUp(true) : buy(p))} disabled={!!busy} style={{ gap: 6, alignItems: 'center', textAlign: 'center', border: `2px solid ${tag ? 'var(--accent)' : 'var(--gold)'}`, background: 'var(--gold-soft)', color: 'var(--fg)', position: 'relative', gridColumn: last ? '1 / -1' : undefined }}>
                  {tag && <span className="chip xp" style={{ position: 'absolute', top: -10, fontSize: 12, padding: '2px 10px' }}>{tag}</span>}
                  <Coin size={34} />
                  <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 24 }}>{fmt(p.coins)}</span>
                  <span className="muted" style={{ fontSize: 12, minHeight: 16 }}>{bonus > 0 ? `${bonus}% more per $` : ''}</span>
                  <span className="btn sm" style={{ width: '100%' }}>{busy === p.id ? 'Opening…' : `$${Number(p.usd).toFixed(2)}`}</span>
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
        {backingUp && <BackupSheet supabase={supabase} onClose={() => setBackingUp(false)} />}
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Checkout is handled securely by RevenueCat and Stripe; Yoke never sees your card. Prices are in US dollars. Coins are for the Yoke shop only and have no cash value. Ask a parent before buying.</p>
      </div>
    </div>
  );
}
