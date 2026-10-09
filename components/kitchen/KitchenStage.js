'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as K from '@/lib/kitchen/models';
import Kitchen3D, { frameOn, VIEW_CAM, ZOOM, CLOSET_SPLAY } from './Kitchen3D';
import Icon from '@/components/Icon';

// The 3D kitchen plus any storage you built away from it (pantry closet, spice cabinet).
// Tap a cabinet, fridge, freezer or sink and the view flies to it, straight on and filling the screen, with every door
// and drawer open. Tap a door (front or inside) to close it, or use the buttons under the kitchen, all in thumb reach:
// zoom out / in, Close doors, and Back to the whole kitchen. The arrows and names visit the closet or spice cabinet.
export default function KitchenStage({ pieces, title = 'Kitchen', cam: camIn, onCam: onCamIn, scale = 1, className = '', open: openIn = {}, onToggle: _onToggle, ...rest }) {
  const [own, setOwn] = useState(VIEW_CAM);
  const cam = camIn || own, setCam = onCamIn || setOwn;
  const [at, setAt] = useState(0);
  const [glide, setGlide] = useState(false);
  const [focus, setFocus] = useState(null);
  const [mine, setMine] = useState({});   // doors you opened or closed here (on top of what the page opened)
  const box = useRef(null), glideT = useRef(null);
  const view = (rest.mode || 'view') === 'view';
  const away = useMemo(() => pieces.filter((p) => K.isRoom(p) && (p.x < 0 || p.y < 0 || p.x + p.w > K.GW || p.y + p.d > K.GD)), [pieces]);
  const stops = [{ id: null, label: title }, ...away.map((p) => ({ id: p.id, label: K.MODEL[p.mid].nick, b: p }))];
  // when the page opens a door (you just put food behind it), that wins over a door you closed here earlier
  const prevIn = useRef(openIn);
  useEffect(() => {
    const was = prevIn.current; prevIn.current = openIn;
    const opened = Object.keys(openIn).filter((k) => openIn[k] && !was[k]);
    if (opened.length) setMine((o) => { const n = { ...o }; opened.forEach((k) => delete n[k]); return n; });
  }, [openIn]);
  const open = { ...openIn, ...mine };
  const anyOpen = Object.values(open).some(Boolean);

  const fly = (c) => { setGlide(true); clearTimeout(glideT.current); glideT.current = setTimeout(() => setGlide(false), 600); setCam(c); };
  // every door, drawer and lid on a piece
  const keysOf = (b) => { const m = K.MODEL[b.mid]; if (!m || m.thing || m.gen === 'closet') return []; return K.gen(m, b.w, b.h).front.map((c, ci) => (c.k === 'panel' || c.k === 'open' ? null : `${b.id}:${ci}`)).filter(Boolean); };

  const size = () => { const el = box.current?.querySelector('.k3'); return [el?.clientWidth || 360, el?.clientHeight || 420]; };
  // the scene's centre sits a bit below the middle of the box; shift so the thing you're looking at is centred
  const centred = (c) => { const el = box.current?.querySelector('.k3'), cm = el?.querySelector('.k3-cam'); return el && cm ? { ...c, py: c.py + el.clientHeight / 2 - cm.offsetTop } : c; };
  // The closet (or spice cabinet) straight on from the front and a little above, where the back shelves and both
  // angled side shelves all face you, sized to fill the view. Turning is limited to keep all three in sight.
  const roomCam = (b) => {
    const [vw, vh] = size(), closet = K.MODEL[b.mid].gen === 'closet';
    const wide = b.w * K.C + (closet ? 2 * b.d * K.C * Math.sin(CLOSET_SPLAY * Math.PI / 180) : 0);
    const z = K.clamp(Math.min((vw * 0.9) / wide, (vh * 0.8) / (b.h * K.HU + b.d * K.C * 0.7)) / scale, 0.6, ZOOM[1]);
    return centred(frameOn(b, { ...VIEW_CAM, rz: 0, rx: 52 }, scale, z));
  };
  const stopCam = (b) => (b ? roomCam(b) : { ...VIEW_CAM });
  // fill the view with this piece: looking at its front, a little from the left so you can see into it
  const focusOn = (b) => {
    const [vw, vh] = size();
    if (K.isRoom(b)) { setFocus(b.id); fly(roomCam(b)); return; }
    const W = b.w * K.C, H = b.h * K.HU, D = b.d * K.C;
    const z = K.clamp(Math.min((vw * 0.94) / (W * 1.75 + 20), (vh * 0.8) / (H + D * 0.6 + 20)) / scale, 1, ZOOM[1]);
    setMine((o) => ({ ...o, ...Object.fromEntries(keysOf(b).map((k) => [k, true])) }));
    setFocus(b.id);
    fly(centred(frameOn(b, { ...VIEW_CAM, rz: -6, rx: 64 }, scale, z)));
  };
  const toggle = (k) => setMine((o) => ({ ...o, [k]: !open[k] }));
  const closeAll = () => setMine(Object.fromEntries(Object.keys(open).map((k) => [k, false])));
  const back = () => { setFocus(null); closeAll(); fly(stopCam(stops[at].b)); };
  const go = (i) => { const n = (i + stops.length) % stops.length; setAt(n); setFocus(null); fly(stopCam(stops[n].b)); };
  // how far you can turn: all the way round in the kitchen; a little either way when looking at one thing
  const fb = focus ? pieces.find((p) => p.id === focus) : null, onRoom = fb ? K.isRoom(fb) : !!stops[at].b;
  const spinRange = onRoom ? [-28, 28] : fb ? [-31, 19] : null;

  return (
    <div className="kstage" ref={box}>
      <Kitchen3D {...rest} pieces={pieces} cam={cam} onCam={setCam} scale={scale} open={open} onToggle={toggle}
        focus={focus} onFocusPiece={view ? focusOn : undefined} spinRange={spinRange} className={`${className} ${glide ? 'glide' : ''}`} />
      {view && (focus || anyOpen) && (
        <div className="kstage-bar" role="toolbar" aria-label="Kitchen view">
          {anyOpen && <button type="button" className="kbar-btn wide" onClick={closeAll}>Close doors</button>}
          {(focus || anyOpen) && <button type="button" className="kbar-btn wide main" onClick={back}><Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} />Back</button>}
        </div>
      )}
      {stops.length > 1 && <>
        <button type="button" className="kstage-arrow l" onClick={() => go(at - 1)} aria-label={`Show ${stops[(at - 1 + stops.length) % stops.length].label}`}><Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} /></button>
        <button type="button" className="kstage-arrow r" onClick={() => go(at + 1)} aria-label={`Show ${stops[(at + 1) % stops.length].label}`}><Icon name="chevron" size={20} /></button>
        <div className="kstage-tabs" role="tablist" aria-label="Kitchen and storage">
          {stops.map((s, i) => <button key={s.id || 'k'} type="button" role="tab" aria-selected={i === at} className={`chip ${i === at ? 'on' : ''}`} onClick={() => go(i)}>{s.label}</button>)}
        </div>
      </>}
    </div>
  );
}
