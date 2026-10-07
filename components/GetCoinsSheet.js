'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import InviteFriend from './InviteFriend';
import { fmt } from '@/lib/game';

// Coin packs paid with Apple Pay, Google Pay or a card (Stripe Checkout). Coins arrive as soon as the payment goes through.
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
        <InviteFriend />
        <h3 style={{ fontSize: 20, marginTop: 4 }}>Buy coins</h3>
        <p className="muted" style={{ margin: 0 }}>Pay with Apple Pay, Google Pay or a card. Coins land in your game right after you pay.</p>
        <p className="err" style={{ margin: 0, fontSize: 14 }}>Coins live on this phone. If you delete the app or clear this browser’s data, they’re gone and can’t be moved.</p>
        {packs === null ? <p className="muted">Loading…</p> : (
          <div className="grid2">
            {packs.map((p) => (
              <button key={p.id} className="card stack" onClick={() => buy(p)} disabled={!!busy} style={{ gap: 6, alignItems: 'center', textAlign: 'center', border: '2px solid var(--gold)', background: 'var(--gold-soft)', color: 'var(--fg)' }}>
                <Coin size={34} />
                <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 24 }}>{fmt(p.coins)}</span>
                <span className="btn sm" style={{ width: '100%' }}>{busy === p.id ? 'Opening…' : `$${Number(p.usd).toFixed(2)}`}</span>
              </button>
            ))}
          </div>
        )}
        {error && <p className="err" role="alert">{error}</p>}
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>Checkout is handled securely by Stripe; Whisk never sees your card. Prices are in US dollars. Coins are for the Whisk shop only and have no cash value. Ask a parent before buying.</p>
      </div>
    </div>
  );
}
