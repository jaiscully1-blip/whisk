'use client';
import { useState } from 'react';
import Icon from './Icon';
import { CATEGORIES } from '@/lib/game';
import { isFrozenMeat } from '@/lib/recipes/match';
import LiveBarcode from './LiveBarcode';

// Shrinks a photo to a JPEG data URL (default max 1600px). Also drops camera metadata such as GPS.
async function toDataUrl(file, max = 1600) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

async function api(url, init) {
  const res = await fetch(url, { ...init, credentials: 'same-origin' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong.');
  return json;
}

// mode: 'receipt' → onAdd([{name, category, quantity}]) ; 'barcode' → onAdd([{...one item}])
export default function ScanSheet({ mode, onAdd, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState(null); // [{name, category, quantity, on}]
  const [store, setStore] = useState(null);

  async function readReceipt(file) {
    setBusy(true); setError('');
    try {
      const image = await toDataUrl(file, 1600);
      const data = await api('/api/receipt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
      if (!data.items.length) throw new Error('No groceries found on that receipt.');
      setStore(data.store); setFound(data.items.map((i) => ({ ...i, on: true })));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const picked = (found || []).filter((i) => i.on);
  const title = mode === 'receipt' ? 'Scan a receipt' : 'Scan a barcode';

  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label={title}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>{title}</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        {!found && mode === 'receipt' && (
          <>
            <p className="muted" style={{ margin: 0 }}>Take a flat, well-lit photo of your grocery receipt. Whisk lists the food on it so you can add it all at once.</p>
            <label className="card" style={{ display: 'grid', placeItems: 'center', minHeight: 160, cursor: busy ? 'wait' : 'pointer', borderStyle: 'dashed' }}>
              <span className="row muted" style={{ fontWeight: 800 }}><Icon name="receipt" size={24} />{busy ? 'Reading your receipt…' : 'Take or choose a photo'}</span>
              <input type="file" accept="image/*" capture="environment" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) readReceipt(f); e.target.value = ''; }} />
            </label>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>Uses 1 of your 20 daily AI requests. The photo is sent to the AI to read, not stored.</p>
          </>
        )}

        {mode === 'barcode' && <LiveBarcode onAdd={onAdd} onClose={onClose} />}

        {found && (
          <>
            {store && <span className="eyebrow">{store}</span>}
            <div className="stack" style={{ gap: 6 }}>
              {found.map((it, i) => (
                <div key={i} className="card row" style={{ padding: '8px 10px', flexWrap: 'nowrap', opacity: it.on ? 1 : .5 }}>
                  <input type="checkbox" aria-label={`Include ${it.name}`} checked={it.on} onChange={() => setFound((f) => f.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} style={{ width: 20, height: 20, accentColor: 'var(--accent)' }} />
                  <input className="input" aria-label="Item name" maxLength={60} value={it.name} onChange={(e) => setFound((f) => f.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} style={{ flex: 1, minWidth: 0, padding: '6px 10px' }} />
                  <select className="input" aria-label="Category" value={it.category} onChange={(e) => setFound((f) => f.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} style={{ width: 120, padding: '6px 8px', fontSize: 13 }}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  {isFrozenMeat(it) && <span className="chip ice" title="Needs defrosting before cooking"><Icon name="snow" size={14} /></span>}
                </div>
              ))}
            </div>
            <button className="btn wide" disabled={busy || !picked.length} onClick={async () => { setBusy(true); try { await onAdd(picked.map(({ name, category, quantity }) => ({ name: name.trim().slice(0, 60), category, quantity: quantity ? String(quantity).slice(0, 30) : null })).filter((x) => x.name)); onClose?.(); } finally { setBusy(false); } }}>
              {busy ? 'Adding…' : `Add ${picked.length} to pantry`}
            </button>
            <button className="btn ghost wide" onClick={() => { setFound(null); setStore(null); }}>Scan again</button>
          </>
        )}
        {error && <p className="err" role="alert" style={{ margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}
