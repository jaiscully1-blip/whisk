'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useWhisk } from './AppShell';
import { CATEGORIES, guessCategory } from '@/lib/game';
import { isFrozenMeat } from '@/lib/recipes/match';

// Live barcode scanner: point the camera, it reads the code (no photo to take), buzzes, and the product drops into a
// tray. Scan a whole bag of groceries, then "Add all". Free: the phone's own barcode reader when it has one
// (Android Chrome), otherwise ZXing (open source, WebAssembly, served by Whisk itself, ~1 MB, loaded only here).
// Products come from Open Food Facts. A barcode it doesn't know, you name once and Whisk remembers it.

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
const REMEMBER_MAX = 60;   // remembered names live in the saved game, which has a size limit
const AWAY = 1500;         // holding the same item in view never adds it twice; it has to leave the frame this long first
const INTERVAL = 140;      // ms between reads: fast enough to feel instant, light on the battery

async function makeDetector() {
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const sup = await window.BarcodeDetector.getSupportedFormats();
      const f = FORMATS.filter((x) => sup.includes(x));
      if (f.length) return { det: new window.BarcodeDetector({ formats: f }), native: true };
    } catch {}
  }
  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
  await prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? `/zxing/${path}` : prefix + path) }, fireImmediately: true });
  return { det: new BarcodeDetector({ formats: FORMATS }), native: false };
}

const valid = (code) => /^\d{8,14}$/.test(code);

export default function LiveBarcode({ onAdd, onClose }) {
  const { ui, setUi } = useWhisk();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stream = useRef(null);
  const detRef = useRef(null);
  const timer = useRef(0);
  const busy = useRef(false);
  const last = useRef({ code: '', at: 0, seen: '', seenN: 0 });
  const audio = useRef(null);
  const lookups = useRef(new Map());
  const [state, setState] = useState('starting');   // starting | live | denied | nocamera | error
  const [torch, setTorch] = useState(null);         // null = not available, else on/off
  const [flash, setFlash] = useState(0);
  const [items, setItems] = useState([]);           // [{ code, name, category, quantity, count, status, on }]
  const [typed, setTyped] = useState('');
  const [adding, setAdding] = useState(false);
  const itemsRef = useRef(items); itemsRef.current = items;

  const remembered = ui.barcodes || {};

  const beep = () => {
    try { navigator.vibrate?.(35); } catch {}
    try {
      const ctx = audio.current || (audio.current = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 1760; g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
      o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.1);
    } catch {}
  };

  const take = useCallback(async (code) => {
    last.current.code = code; last.current.at = Date.now();
    beep(); setFlash((n) => n + 1);
    if (itemsRef.current.some((i) => i.code === code)) { setItems((l) => l.map((i) => (i.code === code ? { ...i, count: i.count + 1, on: true } : i))); return; }
    const mine = remembered[code];
    if (mine) { setItems((l) => [{ code, name: mine[0], category: mine[1], quantity: null, count: 1, status: 'ok', on: true, mine: true }, ...l]); return; }
    setItems((l) => [{ code, name: '', category: 'Other', quantity: null, count: 1, status: 'loading', on: true }, ...l]);
    let p = lookups.current.get(code);
    if (!p) { p = fetch(`/api/barcode?code=${code}`, { credentials: 'same-origin' }).then(async (r) => ({ ok: r.ok, ...(await r.json().catch(() => ({}))) })).catch(() => ({ ok: false })); lookups.current.set(code, p); }
    const d = await p;
    setItems((l) => l.map((i) => (i.code !== code ? i : d.ok
      ? { ...i, status: 'ok', name: d.name, category: CATEGORIES.includes(d.category) ? d.category : guessCategory(d.name), quantity: d.quantity || null, brand: d.brand || null }
      : { ...i, status: d.notFound ? 'unknown' : 'error' })));
  }, [remembered]); // eslint-disable-line react-hooks/exhaustive-deps

  // Two matching reads in a row before a code counts: stops a smudged digit from adding the wrong product.
  const seen = useCallback((code) => {
    if (!valid(code)) return;
    const L = last.current; const now = Date.now();
    if (code === L.code && now - L.at < AWAY) { L.at = now; return; }   // still the same item in front of the camera
    if (L.seen === code) L.seenN += 1; else { L.seen = code; L.seenN = 1; }
    if (L.seenN >= 2) { L.seenN = 0; take(code); }
  }, [take]);

  const stop = useCallback(() => {
    clearTimeout(timer.current); timer.current = 0;
    stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null;
  }, []);

  const tick = useCallback(async () => {
    timer.current = 0;
    const v = videoRef.current; const d = detRef.current;
    if (!v || !d || !stream.current) return;
    if (!busy.current && v.readyState >= 2 && !document.hidden) {
      busy.current = true;
      try {
        let src = v;
        if (!d.native) {
          // Only read the band inside the frame, scaled down: much less work for the WebAssembly reader.
          const c = canvasRef.current; const vw = v.videoWidth, vh = v.videoHeight;
          const sw = Math.round(vw * 0.86), sh = Math.round(Math.min(vh * 0.5, sw * 0.6));
          const scale = Math.min(1, 720 / sw);
          c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
          c.getContext('2d', { willReadFrequently: true }).drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, c.width, c.height);
          src = c;
        }
        const hits = await d.det.detect(src);
        if (hits[0]?.rawValue) seen(hits[0].rawValue.replace(/\D/g, ''));
      } catch {}
      busy.current = false;
    }
    if (stream.current) timer.current = setTimeout(tick, INTERVAL);
  }, [seen]);

  const start = useCallback(async () => {
    setState('starting');
    if (!navigator.mediaDevices?.getUserMedia) { setState('nocamera'); return; }
    try {
      const [s, det] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } }),
        detRef.current ? Promise.resolve(detRef.current) : makeDetector()
      ]);
      detRef.current = det; stream.current = s;
      const v = videoRef.current; v.srcObject = s; await v.play().catch(() => {});
      const track = s.getVideoTracks()[0];
      try { const caps = track.getCapabilities?.(); if (caps?.torch) setTorch(false); } catch {}
      try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }); } catch {}
      setState('live'); tick();
    } catch (e) {
      stop();
      setState(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'denied' : e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError' ? 'nocamera' : 'error');
    }
  }, [tick, stop]);

  useEffect(() => { start(); return () => { stop(); try { audio.current?.close(); } catch {} }; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Leaving the app pauses the camera; coming back starts it again.
  useEffect(() => {
    const vis = () => { if (document.hidden) stop(); else if (state === 'live' && !stream.current) start(); };
    document.addEventListener('visibilitychange', vis); return () => document.removeEventListener('visibilitychange', vis);
  }, [state, start, stop]);

  async function toggleTorch() {
    const t = stream.current?.getVideoTracks()[0]; if (!t) return;
    try { await t.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch); } catch {}
  }

  const set = (code, patch) => setItems((l) => l.map((i) => (i.code === code ? { ...i, ...patch } : i)));
  const ready = items.filter((i) => i.on && i.status !== 'loading' && i.name.trim());
  const needName = items.filter((i) => i.on && (i.status === 'unknown' || i.status === 'error') && !i.name.trim()).length;

  async function addAll() {
    setAdding(true);
    try {
      // Remember the names you typed (or fixed) for barcodes, so next time they come straight up.
      const learn = items.filter((i) => i.on && i.name.trim() && (i.status !== 'ok' || i.mine || i.edited));
      if (learn.length) {
        const next = { ...remembered }; for (const i of learn) { delete next[i.code]; next[i.code] = [i.name.trim().slice(0, 60), i.category]; }
        const keys = Object.keys(next); for (const k of keys.slice(0, Math.max(0, keys.length - REMEMBER_MAX))) delete next[k];
        setUi({ barcodes: next });
      }
      await onAdd(ready.map((i) => ({ name: i.name.trim().slice(0, 60), category: i.category, quantity: (i.count > 1 ? `×${i.count}${i.quantity ? ' · ' + i.quantity : ''}` : i.quantity || '').slice(0, 30) || null })));
      stop(); onClose?.();
    } finally { setAdding(false); }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className={`scanbox ${state}`} aria-live="polite">
        <video ref={videoRef} playsInline muted autoPlay aria-label="Camera" />
        <canvas ref={canvasRef} hidden />
        {state === 'live' && <div key={flash} className={`scan-frame ${flash ? 'hit' : ''}`} aria-hidden="true"><i /></div>}
        {state === 'live' && <span className="scan-hint">Line up the barcode in the box</span>}
        {state === 'starting' && <span className="scan-msg">Starting the camera…</span>}
        {state === 'denied' && <span className="scan-msg">Whisk can’t use the camera. Allow camera access for this site in your browser settings, then <button type="button" className="linkbtn" onClick={start}>try again</button>. You can also type the numbers below.</span>}
        {state === 'nocamera' && <span className="scan-msg">No camera found. Type the numbers under the bars below.</span>}
        {state === 'error' && <span className="scan-msg">The camera didn’t start. <button type="button" className="linkbtn" onClick={start}>Try again</button>, or type the numbers below.</span>}
        {state === 'live' && torch !== null && <button type="button" className={`scan-torch ${torch ? 'on' : ''}`} onClick={toggleTorch} aria-pressed={torch} aria-label="Flashlight"><Icon name="bolt" size={20} /></button>}
      </div>

      <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); const c = typed.replace(/\D/g, ''); if (valid(c)) { last.current.code = ''; take(c); setTyped(''); } }}>
        <label htmlFor="bc-typed" className="sr">Barcode number</label>
        <input id="bc-typed" className="input" inputMode="numeric" autoComplete="off" placeholder="Or type the numbers" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, '').slice(0, 14))} />
        <button className="btn ghost" type="submit" disabled={!valid(typed)}>Add</button>
      </form>

      {items.length > 0 && (
        <div className="stack scan-tray" style={{ gap: 6 }} aria-label="Scanned items">
          <span className="eyebrow">Scanned · {items.length}</span>
          {items.map((it) => (
            <div key={it.code} className="card row scan-item" style={{ opacity: it.on ? 1 : .5 }}>
              <input type="checkbox" aria-label={`Include ${it.name || it.code}`} checked={it.on} onChange={() => set(it.code, { on: !it.on })} />
              <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                {it.status === 'loading'
                  ? <span className="skel-line" aria-label="Looking it up" />
                  : <input className="input" aria-label="Item name" maxLength={60} value={it.name} placeholder={it.status === 'error' ? 'Lookup failed: name it' : 'New product: name it'} onChange={(e) => set(it.code, { name: e.target.value, edited: true })} autoFocus={it.status === 'unknown' && !it.name} />}
                <span className="desc">{[it.brand, it.quantity, it.count > 1 ? `×${it.count}` : null, it.status === 'unknown' ? 'Not in the product list yet. Whisk will remember your name for it.' : null].filter(Boolean).join(' · ') || it.code}</span>
              </div>
              <select className="input" aria-label="Category" value={it.category} onChange={(e) => set(it.code, { category: e.target.value, edited: true })} style={{ width: 112, padding: '6px 8px', fontSize: 13 }}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              {isFrozenMeat(it) && <span className="chip ice" title="Needs defrosting before cooking"><Icon name="snow" size={14} /></span>}
            </div>
          ))}
        </div>
      )}

      <button className="btn wide" disabled={adding || !ready.length} onClick={addAll}>
        {adding ? 'Adding…' : ready.length ? `Add ${ready.length} to pantry` : items.length ? 'Name the new items to add them' : 'Scan something to add it'}
      </button>
      {needName > 0 && ready.length > 0 && <p className="desc" style={{ margin: 0, textAlign: 'center' }}>{needName} without a name won’t be added.</p>}
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>Product info from Open Food Facts. The camera stays on this phone; nothing is recorded.</p>
    </div>
  );
}
