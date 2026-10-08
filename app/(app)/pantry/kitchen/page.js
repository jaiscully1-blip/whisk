'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';
import { usePantry, useKitchens } from '@/components/usePantry';
import Kitchen3D from '@/components/kitchen/Kitchen3D';
import { Sticker, useShownKitchen, usePlace } from '@/components/kitchen/KitchenPanels';
import * as K from '@/lib/kitchen/models';

// Side mission: put your food away. Hold a food box and drop it on a lit spot in your 3D kitchen
// (or tap a box, then tap a spot). +3 XP each, combos for quick drops, a bonus when the pantry's all put away.
export default function PutAway() {
  const { supabase, say, refreshProfile } = useWhisk();
  const [items, , setItems] = usePantry();
  const [, reloadKitchens, setKitchens] = useKitchens();
  const { loading, shown, pieces, idx, at, todo } = useShownKitchen(items);
  const [open, setOpen] = useState({});
  const [cam, setCam] = useState({ rz: -24, rx: 56 });
  const [armed, setArmed] = useState(null);       // tapped food box, waiting for a spot
  const [ghost, setGhost] = useState(null);       // { item, x, y, over } while dragging
  const [picked, setPicked] = useState(null);     // spot tapped to look inside
  const [flash, setFlash] = useState(null);       // spot that just got something
  const [pops, setPops] = useState([]);
  const [party, setParty] = useState(false);
  const [earned, setEarned] = useState(0);
  const drag = useRef(null);
  const home = usePlace();
  const combo = useRef({ n: 0, at: 0 });

  const live = (items || []).filter((i) => i.status !== 'out');
  const done = live.length - todo.length;
  const tray = useMemo(() => [...todo].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)), [todo]);
  const carrying = ghost?.item || armed;

  function pop(x, y, text, big = false) {
    const id = Math.random();
    setPops((p) => [...p, { id, x, y, text, big }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 1300);
  }
  async function place(item, key, x, y) {
    const [bid, ci] = key.split('|');
    setOpen((o) => ({ ...o, [`${bid}:${ci}`]: true }));
    setItems((xs) => xs.map((i) => (i.id === item.id ? { ...i, spot: key } : i)));
    setFlash(key); setTimeout(() => setFlash((f) => (f === key ? null : f)), 1400);
    setArmed(null); setPicked(null);
    const now = Date.now();
    combo.current = { n: now - combo.current.at < 8000 ? combo.current.n + 1 : 1, at: now };
    navigator.vibrate?.(12);
    const { data, error } = await supabase.rpc('place_item', { p_item: item.id, p_spot: key });
    if (error) { setItems((xs) => xs.map((i) => (i.id === item.id ? { ...i, spot: item.spot ?? null } : i))); say('Couldn’t put that away. Try again.'); return; }
    const n = combo.current.n;
    pop(x, y, data?.xp ? `+${data.xp} XP` : '✓');
    if (n >= 2) setTimeout(() => pop(x, y - 34, `Combo ×${n}!`, true), 160);
    if (data?.xp) { setEarned((e) => e + data.xp); refreshProfile(); }
    if (data?.left === 0 && live.length > 0) setTimeout(() => setParty({ bonus: (data.xp || 0) >= 20 }), 450);
  }
  async function takeOut(item) {
    setItems((xs) => xs.map((i) => (i.id === item.id ? { ...i, spot: null } : i)));
    const { error } = await supabase.rpc('place_item', { p_item: item.id, p_spot: null });
    if (error) say('Couldn’t move that.');
  }
  async function makeStarter() {
    const { data, error } = await supabase.from('kitchen_layouts').insert({ name: 'My kitchen', pieces: K.starterKitchen(), is_display: true }).select('id, name, pieces, is_display, updated_at').single();
    if (error) { say('Couldn’t make the kitchen. Try again.'); return; }
    setKitchens((l) => [data, ...(l || []).map((k) => ({ ...k, is_display: false }))]); reloadKitchens();
  }

  // ---- hold a food box and drag it onto a spot ----
  const spotAt = (x, y) => document.elementFromPoint(x, y)?.closest?.('[data-spot]')?.dataset.spot || null;
  const boxDown = (item) => (e) => { drag.current = { item, x: e.clientX, y: e.clientY, live: false, id: e.pointerId, el: e.currentTarget }; };
  const boxMove = (e) => {
    const d = drag.current; if (!d) return;
    if (!d.live) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.live = true; setArmed(null); setPicked(null);
      try { d.el.setPointerCapture(d.id); } catch { /* fine */ }
      navigator.vibrate?.(8);
    }
    setGhost({ item: d.item, x: e.clientX, y: e.clientY, over: spotAt(e.clientX, e.clientY) });
  };
  const boxUp = (e) => {
    const d = drag.current; drag.current = null; if (!d) return;
    if (!d.live) {   // a tap picks it up; bring the kitchen into view so the lit spots are right there
      setArmed((a) => (a?.id === d.item.id ? null : d.item)); setPicked(null);
      document.querySelector('.putaway .k3')?.scrollIntoView({ block: 'start' });   // instant, so the spots don't slide under your finger
      return;
    }
    const over = spotAt(e.clientX, e.clientY);
    setGhost(null);
    if (over) place(d.item, over, e.clientX, e.clientY);
  };
  const boxCancel = () => { drag.current = null; setGhost(null); };
  const onSpot = (key) => {
    if (armed) { const r = document.querySelector(`[data-spot="${key}"]`)?.getBoundingClientRect(); place(armed, key, r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top : innerHeight / 2); return; }
    setPicked((p) => (p === key ? null : key));
  };

  const spot = {};
  for (const [key, list] of Object.entries(at)) spot[key] = { items: list };
  if (ghost?.over) spot[ghost.over] = { ...(spot[ghost.over] || {}), hov: true };
  if (flash) spot[flash] = { ...(spot[flash] || {}), lit: true };
  if (picked) spot[picked] = { ...(spot[picked] || {}), on: true };
  const here = picked ? at[picked] || [] : [];
  const pct = live.length ? Math.round((done / live.length) * 100) : 0;

  return (
    <div className="stack putaway">
      <div className="page-title">
        <Link href="/pantry" className="title-link"><Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} />Pantry</Link>
        <h1>Put it away</h1>
      </div>

      {loading || items === null ? <p className="muted">Loading your kitchen…</p> : !shown ? (
        <div className="empty" style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
          <span className="kf-cube big"><Icon name="pantry" size={34} /></span>
          <b>First, your kitchen</b>
          <div className="grid2" style={{ width: '100%' }}>
            <button type="button" className="btn" onClick={makeStarter}>Use a starter</button>
            <Link href="/pantry/kitchen/design" className="btn ghost">Build mine</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pa-hud card">
            <div className="pa-ring" style={{ '--p': pct }}><b>{done}</b><span>/{live.length}</span></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b className="pa-title">{todo.length === 0 ? (live.length ? 'All put away!' : 'Pantry’s empty') : `${todo.length} to put away`}</b>
              <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${pct}%`, background: 'var(--accent)' }} /></div>
            </div>
            {earned > 0 && <span className="chip xp">+{earned} XP</span>}
          </div>

          <Kitchen3D mode="view" place={home.key} pieces={pieces} cam={cam} onCam={setCam} open={open} openAll={!!carrying} spot={spot} height="min(46vh, 420px)"
            onToggle={(k) => setOpen((o) => ({ ...o, [k]: !o[k] }))} onSpot={onSpot} className={carrying ? 'carrying' : ''} />

          {picked && !carrying && (
            <div className="card">
              <b>{idx.map[picked]?.label}</b>
              <div className="row" style={{ marginTop: 8 }}>
                {here.length ? here.map((i) => (
                  <button key={i.id} type="button" className="chip pa-in" onClick={() => takeOut(i)} aria-label={`Take ${i.name} out`}><Sticker name={i.name} category={i.category} size={20} />{i.name}<Icon name="x" size={13} /></button>
                )) : <span className="muted">Empty here</span>}
              </div>
            </div>
          )}

          {tray.length > 0 ? (
            <section className="pa-tray" aria-label="Food to put away">
              <span className="pa-tray-tip">Hold &amp; drag into a spot</span>
              {tray.map((i) => (
                <button key={i.id} type="button" className={`pa-box ${armed?.id === i.id ? 'armed' : ''} ${ghost?.item.id === i.id ? 'lifted' : ''}`}
                  onPointerDown={boxDown(i)} onPointerMove={boxMove} onPointerUp={boxUp} onPointerCancel={boxCancel}
                  aria-pressed={armed?.id === i.id} aria-label={`${i.name}: tap, then tap a spot`}>
                  <Sticker name={i.name} category={i.category} size={46} className="pa-stk" />
                  <span className="pa-name">{i.name}</span>
                </button>
              ))}
            </section>
          ) : live.length > 0 ? (
            <div className="empty"><b>Everything has a home</b>Tap a door to peek inside.</div>
          ) : (
            <div className="empty"><b>Nothing to put away</b><Link href="/pantry">Add food to your pantry</Link></div>
          )}
          <div className="grid2">
            <Link href="/pantry/kitchen/design" className="btn ghost"><Icon name="pencil" size={18} />Design</Link>
            <Link href="/pantry" className="btn ghost">Done</Link>
          </div>
        </>
      )}

      {ghost && (
        <div className="pa-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">
          <Sticker name={ghost.item.name} category={ghost.item.category} size={50} className="pa-stk" /><span className="pa-name">{ghost.item.name}</span>
        </div>
      )}
      {pops.map((p) => <span key={p.id} className={`pa-pop ${p.big ? 'big' : ''}`} style={{ left: p.x, top: p.y }} aria-hidden="true">{p.text}</span>)}
      <div role="status" className="sr" aria-live="polite">{flash ? `Put away in ${idx.map[flash]?.label || 'your kitchen'}` : ''}</div>

      {party && (
        <div className="scrim pa-party" onClick={() => setParty(false)}>
          <div className="card pa-party-card" role="dialog" aria-modal="true" aria-label="Kitchen stocked">
            {Array.from({ length: 18 }, (_, i) => <i key={i} className="pa-confetti" style={{ '--i': i }} />)}
            <svg width="72" height="72" viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="#F6C531" stroke="#3B2C24" strokeWidth="2.4" strokeLinejoin="round" /><path d="M20 12h-8c0 8 4 12 10 12M44 12h8c0 8-4 12-10 12" fill="none" stroke="#3B2C24" strokeWidth="2.4" /><path d="M28 34h8v8h-8zM22 42h20v8H22z" fill="#E0A93B" stroke="#3B2C24" strokeWidth="2.4" strokeLinejoin="round" /><path d="M26 14q2 8 6 10" stroke="#FFF2A6" strokeWidth="3" fill="none" /></svg>
            <h2 style={{ margin: 0 }}>Kitchen stocked!</h2>
            <p className="muted" style={{ margin: 0 }}>Everything has a home.{party.bonus ? ' +20 XP bonus' : ''}</p>
            <button type="button" className="btn wide" onClick={() => setParty(false)}>Nice</button>
          </div>
        </div>
      )}
    </div>
  );
}
