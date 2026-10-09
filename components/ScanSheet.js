'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { CATEGORIES, guessCategory } from '@/lib/game';
import { isFrozenMeat } from '@/lib/recipes/match';
import { parseReceipt } from '@/lib/scan/receipt';
import { openCamera, grabRegion, decodeBarcode, warmBarcodes, readText, warmReceipts, prepareReceipt, closeReader, beep, unlockSound } from '@/lib/scan/engine';

// The in-game scanners, full screen like a store's handheld scanner.
//   barcode: a short barcode-sized window that keeps scanning. Every grocery you pass under it beeps and lands in
//            the basket (the same item again counts once you've taken it away and brought it back). Add puts the
//            whole basket in your pantry.
//   receipt: a tall receipt-shaped window. Snap it, Whisk reads the words on the phone, you fix anything it got
//            wrong, then Add. Long receipt? Snap the rest and it's added to the same list.
// Everything runs on the phone (lib/scan/engine.js). onAdd([{ name, category, quantity }]) puts items in the pantry.
export default function ScanSheet({ mode, onAdd, onClose }) {
  useEffect(() => {   // no page scrolling behind the scanner
    const h = document.documentElement, was = h.style.overflow; h.style.overflow = 'hidden';
    return () => { h.style.overflow = was; };
  }, []);
  return (
    <div className="scan-full" role="dialog" aria-modal="true" aria-label={mode === 'receipt' ? 'Scan a receipt' : 'Scan groceries'} onPointerDown={unlockSound}>
      {mode === 'receipt' ? <ReceiptScan onAdd={onAdd} onClose={onClose} /> : <BarcodeScan onAdd={onAdd} onClose={onClose} />}
    </div>
  );
}

function Top({ title, onClose, torch, lit, onTorch }) {
  return (
    <div className="scan-top">
      <button type="button" className="scan-ico" onClick={onClose} aria-label="Close scanner"><Icon name="x" size={22} /></button>
      <b>{title}</b>
      {torch ? (
        <button type="button" className={`scan-ico ${lit ? 'on' : ''}`} onClick={onTorch} aria-pressed={lit} aria-label="Flashlight">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2h8v4l-2 4v12h-4V10L8 6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M11 13v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      ) : <span className="scan-ico ghost" />}
    </div>
  );
}

// one editable line in the list (name, aisle, amount)
function Row({ it, onChange, onRemove, children }) {
  return (
    <div className={`scan-row ${it.on === false ? 'off' : ''}`}>
      {onChange && it.on !== undefined && (
        <input type="checkbox" aria-label={`Include ${it.name || 'this item'}`} checked={it.on} onChange={() => onChange({ on: !it.on })} />
      )}
      <div className="scan-row-main">
        <input className="input" aria-label="Item name" maxLength={60} placeholder={it.status === 'missing' ? 'Not found · what is it?' : 'Item name'} value={it.name}
          onChange={(e) => onChange({ name: e.target.value, category: guessCategory(e.target.value) })} />
        <div className="scan-row-sub">
          <select aria-label="Aisle" value={it.category} onChange={(e) => onChange({ category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input aria-label="Amount" maxLength={30} placeholder="Amount" value={it.quantity || ''} onChange={(e) => onChange({ quantity: e.target.value })} />
          {isFrozenMeat(it) && <span className="chip ice" title="Needs defrosting before cooking"><Icon name="snow" size={13} /></span>}
          {it.raw && <span className="scan-raw" title="What the receipt says">{it.raw}</span>}
        </div>
      </div>
      {children}
      <button type="button" className="scan-ico sm" onClick={onRemove} aria-label={`Remove ${it.name || 'item'}`}><Icon name="x" size={16} /></button>
    </div>
  );
}

const clean = (list) => list.filter((i) => i.on !== false && i.name.trim()).map((i) => ({ name: i.name.trim().slice(0, 60), category: CATEGORIES.includes(i.category) ? i.category : guessCategory(i.name), quantity: i.quantity ? String(i.quantity).trim().slice(0, 30) : null }));

// ---------------------------------------------------------------- barcodes
function BarcodeScan({ onAdd, onClose }) {
  const video = useRef(null), win = useRef(null), cam = useRef(null);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false), [lit, setLit] = useState(false);
  const [hit, setHit] = useState(false);
  const hitT = useRef(0);
  const [basket, setBasket] = useState([]);   // [{ code, n, name, category, quantity, status: 'look'|'ok'|'missing' }]
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const last = useRef({ code: '', seen: 0 }), known = useRef(new Map());

  async function lookup(code) {
    if (known.current.has(code)) return known.current.get(code);
    try {
      const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`, { credentials: 'same-origin' });
      const d = await res.json().catch(() => ({}));
      const out = res.ok && d.name ? { name: d.name, category: CATEGORIES.includes(d.category) ? d.category : guessCategory(d.name), quantity: d.quantity || '', status: 'ok' } : { name: '', category: 'Other', quantity: '', status: 'missing' };
      if (res.ok || res.status === 404) known.current.set(code, out);
      return out;
    } catch { return { name: '', category: 'Other', quantity: '', status: 'missing' }; }
  }
  async function got(code) {
    beep(true); setHit(true); clearTimeout(hitT.current); hitT.current = setTimeout(() => setHit(false), 450);   // the window flashes green
    let fresh = false;
    setBasket((b) => {
      const i = b.findIndex((x) => x.code === code);
      if (i >= 0) { const x = { ...b[i], n: b[i].n + 1 }; return [x, ...b.slice(0, i), ...b.slice(i + 1)]; }
      fresh = true; return [{ code, n: 1, name: '', category: 'Other', quantity: '', status: 'look' }, ...b];
    });
    if (!fresh && known.current.has(code)) return;
    const info = await lookup(code);
    setBasket((b) => b.map((x) => (x.code === code && x.status === 'look' ? { ...x, ...info, ...(x.name.trim() ? { name: x.name, category: x.category, status: 'typed' } : {}) } : x)));   // never overwrite a name you already typed
    if (info.status === 'missing') beep(false);
  }
  const gotRef = useRef(got); gotRef.current = got;

  useEffect(() => {
    let stop = false, busyRead = false, timer = 0;
    const canvas = document.createElement('canvas');
    (async () => {
      warmBarcodes();
      try { cam.current = await openCamera(video.current); } catch (e) { setErr(e.message); return; }
      if (stop) { cam.current.stop(); return; }
      setTorch(cam.current.torch); setReady(true);
      const tick = async () => {
        if (stop) return;
        const v = video.current, w = win.current;
        if (!busyRead && v && w && v.readyState >= 2 && !document.hidden) {
          busyRead = true;
          try {
            const vr = v.getBoundingClientRect(), wr = w.getBoundingClientRect();
            const ctx = grabRegion(v, { x: wr.left - vr.left - 12, y: wr.top - vr.top - 24, w: wr.width + 24, h: wr.height + 48 }, canvas, 1280);
            const code = ctx ? await decodeBarcode(ctx.getImageData(0, 0, canvas.width, canvas.height)) : null;
            const now = performance.now(), L = last.current;
            if (code) {
              // the same barcode still under the scanner doesn't count again; take it away for a second and it does
              if (code !== L.code || now - L.seen > 1200) gotRef.current(code);
              last.current = { code, seen: now };
            }
          } catch { /* a bad frame: try the next one */ }
          busyRead = false;
        }
        timer = setTimeout(tick, 80);
      };
      tick();
    })();
    return () => { stop = true; clearTimeout(timer); cam.current?.stop(); };
  }, []);

  const edit = (code, patch) => setBasket((b) => b.map((x) => (x.code === code ? { ...x, ...patch, status: x.status === 'missing' && patch.name ? 'typed' : x.status } : x)));
  const items = basket.map((x) => ({ ...x, quantity: x.n > 1 ? `x${x.n}${x.quantity ? ` · ${x.quantity}` : ''}` : x.quantity }));
  const ready2 = clean(items);
  const waiting = basket.some((x) => x.status === 'look');

  return (
    <>
      <Top title="Scan groceries" onClose={onClose} torch={torch} lit={lit} onTorch={() => { const n = !lit; setLit(n); cam.current?.setTorch(n); }} />
      <div className="scan-cam strip">
        <video ref={video} playsInline muted autoPlay aria-hidden="true" />
        <div ref={win} className={`scan-win strip ${hit ? 'hit' : ''}`} aria-hidden="true">
          <i className="sw-c sw-tl" /><i className="sw-c sw-tr" /><i className="sw-c sw-bl" /><i className="sw-c sw-br" /><span className="scan-laser" />
        </div>
        <p className="scan-hint">{err || (ready ? 'Hold a barcode inside the box' : 'Starting the camera…')}</p>
      </div>
      <div className="scan-panel">
        {basket.length === 0 ? (
          <div className="scan-empty">
            <svg width="54" height="40" viewBox="0 0 54 40" aria-hidden="true">{[3, 7, 9, 14, 17, 19, 24, 28, 30, 35, 38, 42, 44, 49].map((x, i) => <rect key={x} x={x} y="4" width={i % 3 ? 1.6 : 3} height="26" rx=".5" fill="currentColor" />)}<path d="M2 36h50" stroke="#E5392B" strokeWidth="2.4" strokeLinecap="round" /></svg>
            <b>Your basket is empty</b>
            <span>Scan items one after another, like at the checkout.</span>
          </div>
        ) : (
          <>
            <span className="scan-count">{basket.reduce((s, x) => s + x.n, 0)} scanned</span>
            {items.map((it) => (
              <Row key={it.code} it={it} onChange={(p) => edit(it.code, p.quantity !== undefined ? { quantity: p.quantity.replace(/^x\d+\s?·?\s?/, '') } : p)} onRemove={() => setBasket((b) => b.filter((x) => x.code !== it.code))}>
                {it.status === 'look' && <span className="scan-look" aria-label="Looking it up" />}
                <div className="scan-qty" role="group" aria-label="How many">
                  <button type="button" onClick={() => setBasket((b) => b.map((x) => (x.code === it.code ? { ...x, n: Math.max(1, x.n - 1) } : x)))} aria-label="One fewer">−</button>
                  <b>{it.n}</b>
                  <button type="button" onClick={() => setBasket((b) => b.map((x) => (x.code === it.code ? { ...x, n: x.n + 1 } : x)))} aria-label="One more">+</button>
                </div>
              </Row>
            ))}
          </>
        )}
        <form className="scan-type" onSubmit={(e) => { e.preventDefault(); if (/^\d{8,14}$/.test(typed)) { got(typed); setTyped(''); } }}>
          <input inputMode="numeric" aria-label="Type a barcode" placeholder="Won’t scan? Type the numbers" value={typed} onChange={(e) => setTyped(e.target.value.replace(/\D/g, '').slice(0, 14))} />
          <button type="submit" className="btn ghost sm" disabled={!/^\d{8,14}$/.test(typed)}>Add</button>
        </form>
        <p className="scan-note">Product names from Open Food Facts. Nothing is recorded, only the barcode number is looked up.</p>
      </div>
      <div className="scan-foot">
        <button type="button" className="btn wide" disabled={busy || !ready2.length} onClick={async () => { setBusy(true); try { await onAdd(ready2); onClose(); } finally { setBusy(false); } }}>
          {busy ? 'Adding…' : ready2.length ? `Add ${ready2.length} to pantry` : waiting ? 'Looking up…' : 'Add to pantry'}
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- receipts
function ReceiptScan({ onAdd, onClose }) {
  const video = useRef(null), win = useRef(null), cam = useRef(null), file = useRef(null);
  const [stage, setStage] = useState('camera');   // camera → reading → review
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false), [lit, setLit] = useState(false);
  const [pct, setPct] = useState(0);
  const [shot, setShot] = useState('');
  const [list, setList] = useState([]);
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (stage !== 'camera') return undefined;
    let stop = false;
    setReady(false); setErr('');
    warmReceipts();
    openCamera(video.current, { hd: true }).then((c) => { if (stop) { c.stop(); return; } cam.current = c; setTorch(c.torch); setReady(true); }).catch((e) => setErr(e.message));
    return () => { stop = true; cam.current?.stop(); cam.current = null; setLit(false); };
  }, [stage]);
  useEffect(() => () => { closeReader(); }, []);

  async function read(canvas) {
    setStage('reading'); setPct(0); setErr('');
    setShot(canvas.toDataURL('image/jpeg', 0.6));
    try {
      const text = await readText(prepareReceipt(canvas), (p) => setPct(Math.round(p * 100)));
      const found = parseReceipt(text);
      setRaw((r) => (r ? `${r}\n\n` : '') + text.trim());
      setList((l) => { const have = new Set(l.map((x) => x.name.toLowerCase())); return [...l, ...found.filter((x) => !have.has(x.name.toLowerCase()))].map((x, i) => ({ ...x, id: x.id || `r${Date.now()}${i}` })); });
      if (!found.length) setErr('Couldn’t make out any groceries. Try again flat, bright and close, or add them below.');
      setStage('review');
    } catch {
      setErr('The receipt reader didn’t load. Check your connection and try again.'); setStage('review');
    }
  }
  function snap() {
    const v = video.current, w = win.current; if (!v || !w || !ready) return;
    const vr = v.getBoundingClientRect(), wr = w.getBoundingClientRect(), c = document.createElement('canvas');
    if (!grabRegion(v, { x: wr.left - vr.left, y: wr.top - vr.top, w: wr.width, h: wr.height }, c, 2200)) return;
    beep(true); read(c);
  }
  async function pick(f) {
    try {
      const bmp = await createImageBitmap(f), c = document.createElement('canvas'), k = Math.min(1, 2200 / bmp.width);
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      read(c);
    } catch { setErr('That photo couldn’t be opened. Try a JPG or PNG.'); }
  }
  const edit = (id, p) => setList((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const picked = clean(list);

  if (stage === 'camera') return (
    <>
      <Top title="Scan a receipt" onClose={onClose} torch={torch} lit={lit} onTorch={() => { const n = !lit; setLit(n); cam.current?.setTorch(n); }} />
      <div className="scan-cam tall">
        <video ref={video} playsInline muted autoPlay aria-hidden="true" />
        <div ref={win} className="scan-win receipt" aria-hidden="true"><i className="sw-c sw-tl" /><i className="sw-c sw-tr" /><i className="sw-c sw-bl" /><i className="sw-c sw-br" /></div>
        <p className="scan-hint">{err || (ready ? (list.length ? 'Line up the next part of the receipt' : 'Lay it flat in good light, edges inside the frame') : 'Starting the camera…')}</p>
      </div>
      <div className="scan-shoot">
        <button type="button" className="scan-ico" onClick={() => file.current?.click()} aria-label="Choose a photo instead"><Icon name="receipt" size={22} /></button>
        <button type="button" className="scan-shutter" onClick={snap} disabled={!ready} aria-label="Take the photo"><i /></button>
        {list.length ? <button type="button" className="scan-ico" onClick={() => setStage('review')} aria-label="Back to the list"><Icon name="check" size={22} /></button> : <span className="scan-ico ghost" />}
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); e.target.value = ''; }} />
      </div>
      <p className="scan-note center">Read on your phone. The photo is never uploaded or saved.</p>
    </>
  );

  if (stage === 'reading') return (
    <>
      <Top title="Reading your receipt" onClose={onClose} />
      <div className="scan-reading">
        {shot && <img src={shot} alt="Your receipt" />}
        <div className="scan-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
        <span>{pct < 15 ? 'Getting the reader ready…' : `Reading the words · ${pct}%`}</span>
      </div>
    </>
  );

  return (
    <>
      <Top title="Check your groceries" onClose={onClose} />
      <div className="scan-panel full">
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        {list.length > 0 && <span className="scan-count">{picked.length} of {list.length} ticked · fix any name that’s off</span>}
        {list.map((it) => <Row key={it.id} it={it} onChange={(p) => edit(it.id, p)} onRemove={() => setList((l) => l.filter((x) => x.id !== it.id))} />)}
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn ghost sm" onClick={() => setList((l) => [...l, { id: `m${Date.now()}`, name: '', category: 'Other', quantity: '', on: true }])}><Icon name="plus" size={16} />Add an item</button>
          <button type="button" className="btn ghost sm" onClick={() => setStage('camera')}><Icon name="receipt" size={16} />Scan more of it</button>
        </div>
        {raw && <details className="scan-rawtext"><summary>What Whisk read</summary><pre>{raw}</pre></details>}
      </div>
      <div className="scan-foot">
        <button type="button" className="btn wide" disabled={busy || !picked.length} onClick={async () => { setBusy(true); try { await onAdd(picked); onClose(); } finally { setBusy(false); } }}>
          {busy ? 'Adding…' : `Add ${picked.length} to pantry`}
        </button>
      </div>
    </>
  );
}
