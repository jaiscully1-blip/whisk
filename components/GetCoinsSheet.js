'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import { fmt } from '@/lib/game';

// Coin packs paid in Bitcoin. Tapping a pack opens the BTCPay checkout page; coins arrive when the payment settles.
export default function GetCoinsSheet({ onClose }) {
  const { supabase } = useWhisk();
  const [packs, setPacks] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { supabase.from('coin_packs').select('id, coins, usd').order('sort').then(({ data }) => setPacks(data || [])); }, [supabase]);

  async function buy(p) {
    setBusy(p.id); setError('');
    try {
      const res = await fetch('/api/coins/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack: p.id }) });
      const json = await res.json().catch(() => ({}));
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
        <p className="muted" style={{ margin: 0 }}>Pay with Bitcoin. Coins land in your account as soon as the payment confirms.</p>
        {packs === null ? <p className="muted">Loading…</p> : (
          <div className="grid2">
            {packs.map((p) => (
              <button key={p.id} className="card stack" onClick={() => buy(p)} disabled={!!busy} style={{ gap: 6, alignItems: 'center', textAlign: 'center', border: '2px solid var(--gold)', background: 'var(--gold-soft)', color: 'var(--fg)' }}>
                <Coin size={34} />
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 24 }}>{fmt(p.coins)}</span>
                <span className="btn sm" style={{ width: '100%' }}>{busy === p.id ? 'Opening…' : `$${Number(p.usd).toFixed(0)} in Bitcoin`}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Checkout is handled by BTCPay Server. Prices are in US dollars and converted to Bitcoin at checkout. Coins are for the Whisk shop only and have no cash value.</p>
      </div>
    </div>
  );
}
