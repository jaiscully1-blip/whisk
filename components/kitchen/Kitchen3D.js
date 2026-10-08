'use client';
import { useEffect, useRef, useState } from 'react';
import * as K from '@/lib/kitchen/models';
import { stickerUrl } from '@/lib/art/food';
import { itemUrl } from '@/lib/art/items';
import { roomFor, wallUrl } from '@/lib/art/tampa';
import { MAGNETS, magnetUrl } from '@/lib/art/magnets';
import { useWorld } from '@/components/usePantry';

// Fridge magnets you bought, spread over the fridge doors (newest first, a few per door depending on its size).
function magnetSpots(pieces, owned) {
  const mags = (owned || []).filter((id) => MAGNETS[id]).reverse();
  const out = {}; if (!mags.length) return out;
  let i = 0;
  for (const b of pieces) {
    const m = K.MODEL[b.mid]; if (!m || m.cat !== 'fridge') continue;
    const g = K.gen(m, b.w, b.h);
    g.front.forEach((c, ci) => {
      if (i >= mags.length || (c.k !== 'door' && c.k !== 'drawer')) return;
      const cw = c.w * b.w * K.C, ch = c.h * b.h * K.HU, cols = Math.max(1, Math.floor(cw / 15)), rows = Math.max(1, Math.floor(ch / 16));
      const list = [];
      for (let r = 0; r < rows && i < mags.length; r++) for (let k = 0; k < cols && i < mags.length; k++) {
        const id = mags[i++], h = [...id].reduce((a, ch2) => (a * 31 + ch2.charCodeAt(0)) % 997, 7);
        list.push({ id, x: (k + 0.5) / cols, y: (r + 0.5) / rows, rot: (h % 25) - 12 });
      }
      out[`${b.id}:${ci}`] = list;
    });
  }
  return out;
}

// The kitchen in 3D, drawn with CSS 3D boxes (no WebGL, so it's light and works everywhere).
// mode: 'view'  — doors and drawers open with a tap; lit spots can be tapped
//       'build' — doors off so every shelf shows; drag a piece anywhere (left/right along the floor, up/down to lift it),
//                 pull a yellow dot to make it wider or taller
//       'mini'  — a small floating picture (tap anywhere → onTap)
// Camera: drag to spin (the model follows your finger), two fingers to slide it anywhere and pinch to zoom
// (trackpad: two-finger scroll slides, pinch zooms). Sliding stops at a border about 10 swipes out.
// Spots are tagged with data-spot="<piece>|<compartment>|<spot>" so drag-and-drop can find them with elementFromPoint.
export const ZOOM = [0.45, 2.6];
export const PAN = 1000;   // how far (px at normal zoom) the kitchen can be slid before it stops: ~10 swipes
export default function Kitchen3D({
  pieces, mode = 'view', height = 420, scale = 1, cam, onCam, open = {}, openAll = false, onToggle,
  spot = {}, onSpot, sel = null, onSelect, onChange, onTap, taught = true, onTaught, float = false, className = '', place = null
}) {
  const [own, setOwn] = useState({ rz: -24, rx: 56, zoom: 1, px: 0, py: 0 });
  const [edge, setEdge] = useState('');
  const edgeT = useRef(null);
  const camera = cam || own; const setCam = onCam || setOwn;
  const zoom = camera.zoom || 1, S = scale * zoom;
  const drag = useRef(null); const moved = useRef(false);
  const fingers = useRef(new Map());
  const root = useRef(null);
  const camRef = useRef(camera); camRef.current = camera;
  const build = mode === 'build', view = mode === 'view', mini = mode === 'mini';
  const { idx } = K.spotsOf(pieces, []);
  // remember which door opened first, so a later door hinged at the same spot rests against it instead of going through
  const order = useRef(new Map()), seq = useRef(0);
  for (const [k, v] of Object.entries(open)) { if (v && !order.current.has(k)) order.current.set(k, ++seq.current); }
  for (const k of [...order.current.keys()]) if (!open[k]) order.current.delete(k);
  const angles = doorAngles(pieces, openAll, order.current);
  // tap the pantry closet or spice cabinet: fly the camera to it (zoom in or out from there as you like)
  const focusOn = (b) => {
    const cx = (b.x + b.w / 2) * C - K.GW * C / 2, cy = (b.y + b.d / 2) * C - K.GD * C / 2, cz = b.h * HU * 0.45;
    const z = 2.1, Sx = scale * z, a = camera.rz * Math.PI / 180, t = camera.rx * Math.PI / 180;
    const x1 = cx * Math.cos(a) - cy * Math.sin(a), y1 = cx * Math.sin(a) + cy * Math.cos(a), y2 = y1 * Math.cos(t) - cz * Math.sin(t);
    setCam({ ...camera, zoom: z, px: -Sx * x1, py: -Sx * y2 });
  };
  const [world] = useWorld();
  const mags = magnetSpots(pieces, world?.owned);
  const C = K.C, HU = K.HU;

  // slide the view, stopping at the border (and flashing that side so you know you've hit it)
  const panTo = (c, px, py) => {
    const lim = PAN * Math.max(1, c.zoom || 1);
    const nx = K.clamp(px, -lim, lim), ny = K.clamp(py, -lim, lim);
    const hit = (nx !== px ? (px > 0 ? 'r' : 'l') : '') + (ny !== py ? (py > 0 ? 'b' : 't') : '');
    if (hit) { setEdge(hit); clearTimeout(edgeT.current); edgeT.current = setTimeout(() => setEdge(''), 500); }
    return { ...c, px: nx, py: ny };
  };
  const panRef = useRef(panTo); panRef.current = panTo;
  // mouse wheel / trackpad pinch (ctrl) zooms; trackpad two-finger scroll slides (non-passive so the page doesn't scroll instead)
  useEffect(() => {
    const el = root.current; if (!el || mini) return undefined;
    const onWheel = (e) => {
      e.preventDefault(); const c = camRef.current;
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || mouseWheel) setCam({ ...c, zoom: K.clamp((c.zoom || 1) * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), ZOOM[0], ZOOM[1]) });
      else setCam(panRef.current(c, (c.px || 0) - e.deltaX, (c.py || 0) - e.deltaY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [mini, setCam]);

  // How many floor cells a screen move covers along the floor's x and y directions (camera spin + tilt + zoom aware).
  function axisCells(dx, dy) {
    const r = camera.rz * Math.PI / 180, t = Math.cos(camera.rx * Math.PI / 180);
    const ex = [Math.cos(r) * C * S, Math.sin(r) * t * C * S], ey = [-Math.sin(r) * C * S, Math.cos(r) * t * C * S];
    const along = (a) => (dx * a[0] + dy * a[1]) / (a[0] * a[0] + a[1] * a[1] || 1);
    return { u: along(ex), v: along(ey), ex, ey };
  }
  const lift = (dy) => -dy / (HU * S * Math.max(0.35, Math.sin(camera.rx * Math.PI / 180)));
  function update(id, fn) {
    const next = pieces.map((b) => { if (b.id !== id) return b; const n = { ...b }; fn(n); return K.clash(pieces, n) ? b : n; });
    if (next.some((b, i) => b !== pieces[i])) onChange?.(next);
  }
  const dist = () => { const [a, b] = [...fingers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  const mid = () => { const [a, b] = [...fingers.current.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };
  // Only a touch that starts on the kitchen itself (or the pantry closet) moves it; touching the empty space around it
  // scrolls the page as usual. While a finger is on the kitchen the page stays put.
  const onModel = (e) => e.pointerType !== 'touch' || !!e.target.closest?.('.k3-floor, .k3-home') || fingers.current.size > 0;
  const lock = useRef(false);
  useEffect(() => {
    const el = root.current; if (!el || mini) return undefined;
    const start = (e) => { if (e.target.closest?.('.k3-floor')) lock.current = true; };
    const stop = (e) => { if (lock.current) e.preventDefault(); };
    const end = (e) => { if (!e.touches.length) lock.current = false; };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', stop, { passive: false });
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', stop); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end); };
  }, [mini]);
  // every finger is counted here first (capture phase), so a second finger anywhere turns the gesture into a pinch
  const capDown = (e) => {
    if (mini || !onModel(e)) return;
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (fingers.current.size === 2) { drag.current = { mode: 'pinch', d0: dist(), z0: zoom, m0: mid(), p0: { x: camera.px || 0, y: camera.py || 0 } }; moved.current = true; }
  };
  const down = (e) => { if (mini || drag.current?.mode === 'pinch' || !onModel(e)) return; drag.current = { mode: 'spin', x: e.clientX, y: e.clientY, rz: camera.rz, rx: camera.rx }; moved.current = false; };
  const move = (e) => {
    if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current; if (!d) return;
    if (d.mode === 'pinch') {   // two fingers: slide it anywhere (up to the border) and pinch to zoom, both at once
      if (fingers.current.size >= 2) { const m = mid(); setCam(panTo({ ...camera, zoom: K.clamp(d.z0 * dist() / d.d0, ZOOM[0], ZOOM[1]) }, d.p0.x + m.x - d.m0.x, d.p0.y + m.y - d.m0.y)); }
      return;
    }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!moved.current) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      moved.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    }
    // swipe right → the model turns right with your finger
    if (d.mode === 'spin') { setCam({ ...camera, rz: d.rz - dx * 0.45, rx: K.clamp(d.rx - dy * 0.3, 8, 82) }); return; }
    if (d.mode === 'move' && d.thing) {   // things slide over the floor plan and settle on whatever is under them
      const { u, v } = axisCells(dx, dy);
      update(d.id, (n) => { n.x = K.clamp(Math.round(d.b0.x + u), 0, K.GW - n.w); n.y = K.clamp(Math.round(d.b0.y + v), 0, K.GD - n.d); n.z = K.restZ(pieces, n); });
      return;
    }
    if (d.mode === 'move') {
      // left/right on screen slides it along whichever floor direction looks most left/right; up/down lifts it
      const h = axisCells(dx, 0);
      const useX = Math.abs(h.ex[0]) >= Math.abs(h.ey[0]);
      const side = useX ? dx * h.ex[0] / (h.ex[0] * h.ex[0] + h.ex[1] * h.ex[1]) : dx * h.ey[0] / (h.ey[0] * h.ey[0] + h.ey[1] * h.ey[1]);
      update(d.id, (n) => {
        const B = K.bounds(n);
        if (useX) n.x = K.clamp(Math.round(d.b0.x + side), B.x0, B.x1 - n.w); else n.y = K.clamp(Math.round(d.b0.y + side), B.y0, B.y1 - n.d);
        n.z = K.clamp(Math.round((d.b0.z + lift(dy)) * 2) / 2, 0, 9 - n.h);
      });
      return;
    }
    if (d.mode === 'grow') {
      const b0 = d.b0, { u, v } = axisCells(dx, dy), B = K.bounds(b0);
      update(d.id, (n) => {
        if (d.side === 'e') n.w = K.clamp(Math.round(b0.w + u), 1, Math.min(K.GW, B.x1 - b0.x));
        if (d.side === 'w') { const nx = K.clamp(Math.round(b0.x + u), B.x0, b0.x + b0.w - 1); n.x = nx; n.w = b0.w + (b0.x - nx); }
        if (d.side === 'front') n.d = K.clamp(Math.round(b0.d + v), 1, Math.min(K.GD, B.y1 - b0.y));   // from the side: stretch it toward you
        if (d.side === 'up') n.h = K.clamp(Math.round((b0.h + lift(dy)) * 2) / 2, 1, 9 - b0.z);
      });
    }
  };
  const up = (e) => {
    fingers.current.delete(e?.pointerId);
    if (drag.current?.mode === 'pinch' && fingers.current.size > 0) return;
    drag.current = null; setTimeout(() => { moved.current = false; }, 0);
  };
  const grow = (b, side) => (e) => { if (drag.current?.mode === 'pinch') return; e.stopPropagation(); drag.current = { mode: 'grow', side, id: b.id, x: e.clientX, y: e.clientY, b0: { ...b } }; moved.current = false; if (!taught) onTaught?.(); };
  const tapFloor = () => { if (mini) { onTap?.(); return; } if (!moved.current && build && sel) onSelect?.(null); };
  const guard = (fn) => (e) => { e.stopPropagation(); if (moved.current) return; fn(); };

  const room = place && !build ? roomFor(place) : null;
  const floor = build
    ? { background: '#fff', backgroundImage: 'linear-gradient(#CFE3F7 1.5px,transparent 1.5px),linear-gradient(90deg,#CFE3F7 1.5px,transparent 1.5px)', backgroundSize: `${C}px ${C}px`, border: '3px solid #BFD8F2', borderRadius: 6, boxShadow: '0 0 0 10px rgba(207,227,247,.35)' }
    : place === 'void' ? { background: 'radial-gradient(ellipse at 50% 50%,rgba(140,170,255,.22),rgba(140,170,255,.05))', border: '1.5px dashed rgba(170,190,255,.35)', borderRadius: 6 }
    : room ? { background: FLOORS[room.floor] || FLOORS.wood }
    : { background: FLOORS.wood, borderRadius: 6, boxShadow: '0 0 0 8px rgba(120,90,50,.14)' };

  return (
    <div ref={root} className={`k3 ${mode} ${float ? 'floaty' : ''} ${edge ? `edge-${edge}` : ''} ${place ? `placed at-${place}` : ''} ${className}`} style={{ height }} onPointerDownCapture={capDown} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={tapFloor}>
      <div className="k3-cam" style={{ transform: `translate(${camera.px || 0}px, ${camera.py || 0}px) scale(${S}) rotateX(${camera.rx}deg) rotateZ(${camera.rz}deg)` }}>
        <div className="k3-sway">
          <div className="k3-floor" style={{ width: K.GW * C, height: K.GD * C, marginLeft: -K.GW * C / 2, marginTop: -K.GD * C / 2, ...floor }}>
            {room && <RoomShell room={room} place={place} />}
            {pieces.map((b) => {
              const onDown = build ? (e) => { e.stopPropagation(); if (drag.current?.mode === 'pinch') return; drag.current = { mode: 'move', thing: K.isThing(b), id: b.id, x: e.clientX, y: e.clientY, b0: { ...b } }; moved.current = false; if (sel !== b.id) onSelect?.(b.id); } : undefined;
              return K.isThing(b)
                ? <Thing key={b.id} b={b} rz={camera.rz} selected={build && sel === b.id} onDown={onDown} />
                : K.MODEL[b.mid].gen === 'closet'
                  ? <Closet key={b.id} b={b} {...{ build, view, spot, onSpot, sel, idx, guard }} onDown={onDown} onFocus={view ? () => focusOn(b) : undefined} />
                  : <Piece key={b.id} b={b} {...{ build, view, mini, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, taught, mags, angles }} onDown={onDown} onFocus={view && K.isRoom(b) ? () => focusOn(b) : undefined} />;
            })}
          </div>
        </div>
      </div>
      {!mini && Math.hypot(camera.px || 0, camera.py || 0) > 260 * Math.max(1, zoom) && (
        <button type="button" className="k3-home" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setCam({ ...camera, px: 0, py: 0 }); }}>Back to kitchen</button>
      )}
    </div>
  );
}

// Floors for each home, and the dollhouse cut-away around the kitchen: a floor slab with thickness and two walls
// (back and left). Walls only show from the inside (backface hidden), so spinning around never hides the kitchen.
const FLOORS = {
  wood: 'repeating-linear-gradient(90deg,rgba(90,60,30,.18) 0 1px,rgba(0,0,0,0) 1px 26px),repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 2px,rgba(0,0,0,0) 2px 9px),linear-gradient(135deg,#B58A5E,#9C7349)',
  oak: 'repeating-linear-gradient(90deg,rgba(70,40,15,.22) 0 1px,rgba(0,0,0,0) 1px 18px),repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 2px,rgba(0,0,0,0) 2px 7px),linear-gradient(135deg,#C99566,#A9774A)',
  hex: 'radial-gradient(circle at 50% 50%,#F2EBDD 0 46%,#2E2A2A 47% 50%,rgba(0,0,0,0) 51%) 0 0/13px 13px,radial-gradient(circle at 50% 50%,#F2EBDD 0 46%,#2E2A2A 47% 50%,rgba(0,0,0,0) 51%) 6.5px 6.5px/13px 13px,#2E2A2A',
  stone: 'linear-gradient(90deg,rgba(0,0,0,.08) 1px,rgba(0,0,0,0) 1px) 0 0/52px 52px,linear-gradient(0deg,rgba(0,0,0,.08) 1px,rgba(0,0,0,0) 1px) 0 0/52px 52px,linear-gradient(135deg,#E9E5DE,#D8D2C8)',
  terracotta: 'linear-gradient(90deg,rgba(255,240,220,.5) 1.5px,rgba(0,0,0,0) 1.5px) 0 0/26px 26px,linear-gradient(0deg,rgba(255,240,220,.5) 1.5px,rgba(0,0,0,0) 1.5px) 0 0/26px 26px,linear-gradient(135deg,#C46B44,#A9552F)',
  concrete: 'radial-gradient(circle at 30% 40%,rgba(255,255,255,.06),rgba(0,0,0,0) 40%),linear-gradient(135deg,#4A484C,#38363A)'
};
function RoomShell({ room, place }) {
  const C = K.C, HU = K.HU, W = K.GW * C, D = K.GD * C, WH = Math.round(8.5 * HU), T = 12;
  // four walls facing in: only the two on the far side ever show, whichever way you spin it
  const walls = [['back', 0, 0, 0, W], ['right', 90, W + 1, 0, D], ['front', 180, W, D + 1, W], ['left', -90, -1, D, D]];
  // floor slab edges facing out: only the near ones show
  const slabs = [
    { left: 0, top: D, width: W, height: T, transformOrigin: '50% 0', transform: 'rotateX(-90deg)' },
    { left: W, top: 0, width: T, height: D, transformOrigin: '0 50%', transform: 'rotateY(90deg)', filter: 'brightness(.8)' },
    { left: -T, top: 0, width: T, height: D, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)', filter: 'brightness(.8)' },
    { left: 0, top: -T, width: W, height: T, transformOrigin: '50% 100%', transform: 'rotateX(90deg)' }
  ];
  return (
    <>
      {walls.map(([side, rot, x, y, len]) => (
        <div key={side} className="kwall-turn" style={{ left: x, top: y, transform: `rotateZ(${rot}deg)` }}>
          <div className="kwall" style={{ left: 0, top: -WH, width: len, height: WH, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', backgroundImage: `url("${wallUrl(place, side === 'back' ? 'back' : 'left', len, WH)}")` }} />
        </div>
      ))}
      {slabs.map((st, i) => <div key={i} className="kslab" style={{ ...st, background: room.slab }} />)}
    </>
  );
}

// A shop thing: a drawn cut-out standing on the counter (or floor), always turned to face you.
function Thing({ b, rz, selected, onDown }) {
  const m = K.MODEL[b.mid]; const C = K.C, HU = K.HU;
  const W = b.w * C, VW = Math.round(W * 1.6), H = VW, Z = Math.round(b.z * HU);   // drawn a bit bigger than its cell so you can see it
  return (
    <div className={`kthing ${selected ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: b.d * C, transform: `translateZ(${Z + 0.5}px)` }} onPointerDown={onDown} data-piece={b.id}>
      <div className="kthing-shadow" />
      <div className="kthing-up" style={{ left: (W - VW) / 2, top: b.d * C / 2 - H, width: VW, height: H, transform: `rotateZ(${-rz}deg) rotateX(-90deg)` }}>
        <img src={itemUrl(m.item)} alt={m.nick} title={m.nick} draggable={false} />
      </div>
    </div>
  );
}

// How far each side-hinged door may swing: 105° when nothing is next to its hinge, 90° when another cabinet or
// appliance sits right there (so it never swings into it), and a little less (78°) when a door hinged at the same
// spot was opened first: the second one rests against it.
function doorAngles(pieces, openAll, order) {
  const doors = [], out = {};
  const solid = pieces.filter((p) => K.MODEL[p.mid] && !K.MODEL[p.mid].thing);
  for (const b of solid) {
    const m = K.MODEL[b.mid]; if (m.gen === 'closet') continue;
    K.gen(m, b.w, b.h).front.forEach((c, ci) => {
      if (c.k !== 'door' || (c.hinge !== 'l' && c.hinge !== 'r')) return;
      const edge = c.hinge === 'l' ? c.x <= 0.001 : c.x + c.w >= 0.999;
      doors.push({ key: `${b.id}:${ci}`, b, hinge: c.hinge, edge, hx: b.x + (c.hinge === 'l' ? c.x : c.x + c.w) * b.w, front: b.y + b.d, z0: b.z + (1 - c.y - c.h) * b.h, z1: b.z + (1 - c.y) * b.h });
    });
  }
  const rank = (k, i) => (order.has(k) ? order.get(k) : openAll ? i : null);
  doors.forEach((d, i) => {
    let a = 105;
    if (!d.edge) a = 90;
    else if (solid.some((p) => p.id !== d.b.id && p.z < d.z1 && d.z0 < p.z + p.h && (d.hinge === 'l' ? Math.abs(p.x + p.w - d.hx) < 0.01 : Math.abs(p.x - d.hx) < 0.01) && p.y < d.front && p.y + p.d >= d.front - 0.5)) a = 90;
    const me = rank(d.key, i);
    if (me != null && doors.some((o, j) => o !== d && o.hinge !== d.hinge && Math.abs(o.hx - d.hx) < 0.01 && Math.abs(o.front - d.front) < 0.6 && o.z0 < d.z1 && d.z0 < o.z1 && rank(o.key, j) != null && rank(o.key, j) < me)) a = 78;
    out[d.key] = a;
  });
  return out;
}

// A shelf spot (tap or drop food here). Shared by every piece and the pantry closet.
function SpotBtn({ k, st, extra = '', spot, idx, onSpot, guard }) {
  const s = spot[k] || {};
  return (
    <button type="button" data-spot={k} className={`ks ${extra} ${s.lit ? 'lit' : ''} ${s.on ? 'on' : ''} ${s.hov ? 'hov' : ''}`} style={st}
      aria-label={(idx.map[k] || {}).label || 'spot'} onClick={onSpot ? guard(() => onSpot(k)) : undefined}>
      {s.items?.length > 0 && <span className="kstks">{s.items.slice(0, 3).map((it, i) => <img key={i} src={stickerUrl(it.name, it.category)} alt="" title={it.name} draggable={false} />)}{s.items.length > 3 && <i>+{s.items.length - 3}</i>}</span>}
    </button>
  );
}

// The walk-in pantry closet: a little room off the kitchen with shelves on the left, back and right walls, and a floor.
function Closet({ b, build, spot, onSpot, sel, idx, guard, onDown, onFocus }) {
  const C = K.C, HU = K.HU, W = b.w * C, D = b.d * C, H = Math.round(b.h * HU);
  const g = K.gen(K.MODEL[b.mid], b.w, b.h).front;   // [left, back, right, floor]
  const wallBg = { ...css(K.skin(b.fin, 0)) };
  const board = 'rgba(0,0,0,.18)';
  const cells = (ci, along, across, flipAlong) => {
    const c = g[ci], rows = c.rows, cols = c.cols, out = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const a0 = flipAlong ? along - (r + 1) * along / rows : r * along / rows, a1 = a0 + along / rows;
      out.push({ key: `${b.id}|${ci}|${r * cols + k}`, a0, a1, c0: k * across / cols, c1: (k + 1) * across / cols, r });
    }
    return out;
  };
  const spots = !build;
  const stopFocus = onFocus ? guard(onFocus) : undefined;
  return (
    <div className={`kbox kcloset ${build && sel === b.id ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: D }} onPointerDown={onDown} onClick={stopFocus} data-piece={b.id}>
      <div className="kface kc-floor" style={{ left: -6, top: -6, width: W + 12, height: D + 12, background: 'repeating-linear-gradient(90deg,rgba(90,60,30,.18) 0 1px,rgba(0,0,0,0) 1px 20px),linear-gradient(135deg,#C99566,#A9774A)', borderRadius: 4, boxShadow: '0 6px 0 #7A5A3E' }}>
        {spots && cells(3, D, W).map((x) => <SpotBtn key={x.key} k={x.key} st={{ left: 6 + x.c0 + 8, top: 6 + D * 0.55, width: x.c1 - x.c0 - 16, height: D * 0.35 }} extra="flat" {...{ spot, idx, onSpot, guard }} />)}
      </div>
      {/* back wall */}
      <div className="kface kc-wall" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...wallBg }}>
        {Array.from({ length: 4 }, (_, r) => <span key={r} className="kc-board" style={{ left: 0, right: 0, top: (r + 1) * H / 4 - 5, height: 5, background: board }} />)}
        {spots && cells(1, H, W).map((x) => <SpotBtn key={x.key} k={x.key} st={{ left: x.c0 + 4, top: x.a0 + 4, width: x.c1 - x.c0 - 8, height: x.a1 - x.a0 - 12 }} {...{ spot, idx, onSpot, guard }} />)}
      </div>
      {/* left wall (seen from inside) */}
      <div className="kface kc-wall" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: '100% 50%', transform: 'rotateY(90deg)', ...wallBg }}>
        {Array.from({ length: 4 }, (_, r) => <span key={r} className="kc-board" style={{ top: 0, bottom: 0, left: (r + 1) * H / 4 - 5, width: 5, background: board }} />)}
        {spots && cells(0, H, D).map((x) => <SpotBtn key={x.key} k={x.key} st={{ top: x.c0 + 4, left: x.a0 + 4, height: x.c1 - x.c0 - 8, width: x.a1 - x.a0 - 12 }} {...{ spot, idx, onSpot, guard }} />)}
      </div>
      {/* right wall */}
      <div className="kface kc-wall" style={{ left: W, top: 0, width: H, height: D, transformOrigin: '0 50%', transform: 'rotateY(-90deg)', ...wallBg }}>
        {Array.from({ length: 4 }, (_, r) => <span key={r} className="kc-board" style={{ top: 0, bottom: 0, left: H - (r + 1) * H / 4, width: 5, background: board }} />)}
        {spots && cells(2, H, D, true).map((x) => <SpotBtn key={x.key} k={x.key} st={{ top: x.c0 + 4, left: x.a0 + 12, height: x.c1 - x.c0 - 8, width: x.a1 - x.a0 - 12 }} {...{ spot, idx, onSpot, guard }} />)}
      </div>
      <span className="kc-sign" style={{ left: 4, top: D - 18 }}>{idx.nick[b.id] || 'Pantry closet'}</span>
    </div>
  );
}

function Piece({ b, build, view, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, onDown, taught, mags = {}, angles = {}, onFocus }) {
  const m = K.MODEL[b.mid]; const C = K.C, HU = K.HU;
  const { fin, tfin } = b; const g = K.gen(m, b.w, b.h);
  const W = b.w * C, D = b.d * C, H = Math.round(b.h * HU), Z = Math.round(b.z * HU);
  const selected = build && sel === b.id, ap = K.cold(m), nick = idx.nick[b.id];
  const slide = Math.round(Math.min(D * 0.8, 46));
  const kh = 11;
  const comp = (c, ci, onTop) => {
    const FW = W, FH = onTop ? D : H;
    const cx = c.x * FW, cy = c.y * FH, cw = c.w * FW, ch = c.h * FH;
    const pos = { left: cx, top: cy, width: cw, height: ch };
    const okey = `${b.id}:${ci}`;
    const isOpen = !build && (openAll || !!open[okey]) && c.k !== 'panel';
    const isDoor = c.k === 'door' || c.k === 'panel' || c.k === 'lid', isDr = c.k === 'drawer' || c.k === 'pull';
    const showFront = !build && c.k !== 'open';
    const defs = K.spotDefs(c, b.w);
    const canSpot = !build && (c.k === 'open' || isOpen);
    const sp = (key) => spot[key] || {};
    const spotEl = (key, style, extra = '') => {
      const s = sp(key);
      return (
        <button key={key} type="button" data-spot={key} className={`ks ${extra} ${s.lit ? 'lit' : ''} ${s.on ? 'on' : ''} ${s.hov ? 'hov' : ''}`} style={style}
          aria-label={(idx.map[key] || {}).label || 'spot'} onClick={onSpot ? guard(() => onSpot(key)) : undefined}>
          {s.items?.length > 0 && <span className="kstks">{s.items.slice(0, 3).map((it, i) => <img key={i} src={stickerUrl(it.name, it.category)} alt="" title={it.name} draggable={false} />)}{s.items.length > 3 && <i>+{s.items.length - 3}</i>}</span>}
        </button>
      );
    };
    const spots = canSpot && !isDr ? defs.map((sd, si) => {
      const rw = cw / sd.cols, rh = ch / sd.rows;
      return spotEl(`${b.id}|${ci}|${si}`, { left: cx + sd.col * rw + 3, top: cy + sd.r * rh + 3, width: rw - 6, height: Math.max(6, rh - 8), transform: 'translateZ(.6px)' });
    }) : null;
    let trays = null;
    if (isDr && isOpen) {
      const lin = K.liner(m, fin), side = K.mix(ap ? '#DDE4E9' : fin.color, ap ? 0 : 0.25);
      const floorSt = (top) => ({ left: 3, top, width: cw - 6, height: slide, transformOrigin: '50% 0', transform: 'rotateX(-90deg)', background: lin });
      if (c.k === 'drawer') {
        trays = <>
          <div className="ktray" style={floorSt(ch - 2)}>{spotEl(`${b.id}|${ci}|0`, { left: 3, top: 3, right: 3, bottom: 3 }, 'flat')}</div>
          <div className="ktray" style={{ left: 2, top: ch * 0.15, width: slide, height: ch * 0.83, transformOrigin: '0 50%', transform: 'rotateY(90deg)', background: side }} />
          <div className="ktray" style={{ left: cw - 2, top: ch * 0.15, width: slide, height: ch * 0.83, transformOrigin: '0 50%', transform: 'rotateY(90deg)', background: side }} />
          <div className="ktray" style={{ left: 2, top: ch * 0.15, width: cw - 4, height: ch * 0.83, transform: `translateZ(${-slide}px)`, background: side }} />
        </>;
      } else {
        trays = <>
          <div className="ktray" style={{ left: 2, top: 4, width: cw - 4, height: ch - 8, transform: `translateZ(${-slide}px)`, background: side }} />
          {Array.from({ length: c.rows }, (_, r) => <div key={r} className="ktray" style={floorSt((r + 1) * ch / c.rows - 3)}>{spotEl(`${b.id}|${ci}|${r}`, { left: 3, top: 3, right: 3, bottom: 3 }, 'flat')}</div>)}
        </>;
      }
    }
    const org = c.hinge === 'l' ? '0 50%' : c.hinge === 't' ? '50% 0' : c.hinge === 'b' ? '50% 100%' : '100% 50%';
    const ang = angles[okey] ?? 105;
    const rot = !isOpen ? '' : c.k === 'lid' ? ' rotateX(105deg)' : c.hinge === 'l' ? ` rotateY(-${ang}deg)` : c.hinge === 't' ? ' rotateX(100deg)' : c.hinge === 'b' ? ' rotateX(-88deg)' : ` rotateY(${ang}deg)`;
    let inCss = c.k === 'panel' ? 'display:none' : K.interior(c, m, fin) + (build ? 'outline:1px solid rgba(0,0,0,.16);outline-offset:-1px;' : '');
    if (c.k === 'lid') inCss = 'background:repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 calc(50% - 2px),rgba(150,170,185,.9) calc(50% - 2px) 50%),radial-gradient(ellipse 70% 50% at 50% 0,#fff,rgba(255,255,255,0)),#E7EEF2;box-shadow:inset 0 6px 10px rgba(0,0,0,.25);';
    const outCss = c.k === 'lid' ? K.skin(fin, 0.12) + 'border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);' : K.panel(c, m, fin);
    let deco = K.decoFor(c, m, fin, b.h, b.w);
    if (c.k === 'lid') deco = [{ st: 'left:38%;top:88%;width:24%;height:6%;background:linear-gradient(90deg,#f5f6f7,#9ea4ab);border-radius:4px' }];
    const toggle = c.k === 'panel' || !view || !onToggle ? undefined : guard(() => onToggle(okey));
    const aria = `${isOpen ? 'Close' : 'Open'} ${nick} ${c.name}`;
    const decos = deco.map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />)
      .concat((mags[okey] || []).map((g) => <img key={g.id} className="kmag" src={magnetUrl(g.id)} alt="" draggable={false} style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, transform: `translate(-50%, -50%) rotate(${g.rot}deg)` }} />));
    return (
      <div key={ci} className="kcw">
        <div className="kin" style={{ ...pos, ...css(inCss) }} />
        {spots}
        {showFront && isDoor && (
          <div className="kdoor" style={{ ...pos, transformOrigin: org, transform: `translateZ(1px)${rot}`, cursor: toggle ? 'pointer' : 'default' }} onClick={toggle} role={toggle ? 'button' : undefined} aria-label={toggle ? aria : undefined}>
            <div className="kout" style={css(outCss)}>{decos}</div>
            <div className="kback" style={{ background: ap ? '#E7EDF1' : K.mix(fin.color, 0.3), borderRadius: 3 }}>
              {isOpen && K.doorBins(c, m).map((bn, i, all) => spotEl(`${b.id}|${ci}|${50 + i}`, { left: '9%', width: '82%', top: `${(i + 0.25) * (100 / all.length)}%`, height: `${62 / all.length}%` }, 'bin'))}
            </div>
          </div>
        )}
        {showFront && isDr && (
          <div className="kdrawer" style={{ ...pos, transform: `translateZ(${isOpen ? slide + 1 : 1}px)` }}>
            {trays}
            <div className="kout front" style={{ ...css(outCss), cursor: toggle ? 'pointer' : 'default' }} onClick={toggle} role={toggle ? 'button' : undefined} aria-label={toggle ? aria : undefined}>{decos}</div>
          </div>
        )}
      </div>
    );
  };
  const topCss = m.gen === 'chest' ? 'background:#E3E7EA;' : m.top ? K.skin(tfin, 0.06) : K.skin(fin, 0.14);

  return (
    <div className={`kbox ${selected ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: D, transform: `translateZ(${Z}px)` }} onPointerDown={onDown} onClick={onFocus ? guard(onFocus) : undefined} data-piece={b.id}>
      {K.isRoom(b) && (b.x < 0 || b.y < 0 || b.x + b.w > K.GW || b.y + b.d > K.GD) && <div className="kface" style={{ left: -8, top: -8, width: W + 16, height: D + 16, transform: `translateZ(${-Z + 0.3}px)`, background: 'repeating-linear-gradient(90deg,rgba(90,60,30,.18) 0 1px,rgba(0,0,0,0) 1px 20px),linear-gradient(135deg,#C99566,#A9774A)', borderRadius: 4, boxShadow: '0 6px 0 #7A5A3E' }} />}
      {!build && b.z === 0 && <div className="kface" style={{ left: -6, top: -4, width: W + 12, height: D + 14, background: 'radial-gradient(closest-side,rgba(70,45,20,.35),rgba(70,45,20,0))', transform: 'translateZ(.4px)' }} />}
      <div className="kface" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...css(K.skin(fin, -0.22)) }} />
      <div className="kface" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: '100% 50%', transform: 'rotateY(90deg)', ...css(K.skin(fin, -0.16)) }}>
        {selected && <button type="button" className="kknob side" style={{ left: H / 2 - kh, top: D - kh }} onPointerDown={grow(b, 'front')} aria-label="Drag to make it deeper" />}
      </div>
      <div className="kface" style={{ left: W, top: 0, width: H, height: D, transformOrigin: '0 50%', transform: 'rotateY(-90deg)', ...css(K.skin(fin, -0.16)) }}>
        {selected && <button type="button" className="kknob side" style={{ left: H / 2 - kh, top: D - kh }} onPointerDown={grow(b, 'front')} aria-label="Drag to make it deeper" />}
      </div>
      <div className="kface" style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...css(K.skin(fin, 0)), borderRadius: m.round ? '22px 22px 3px 3px' : 0 }}>
        {K.faceDeco(m, fin, tfin, g.ts, g.tb).map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />)}
        {g.front.map((c, i) => comp(c, i, false))}
        {selected && <>
          <button type="button" className="kknob" style={{ left: -kh - 8, top: H / 2 - kh }} onPointerDown={grow(b, 'w')} aria-label="Drag to make it wider on the left" />
          <button type="button" className="kknob" style={{ left: W - kh + 8, top: H / 2 - kh }} onPointerDown={grow(b, 'e')} aria-label="Drag to make it wider on the right" />
          <button type="button" className="kknob" style={{ left: W / 2 - kh, top: -kh - 8 }} onPointerDown={grow(b, 'up')} aria-label="Drag to make it taller" />
          {!taught && <span className="khand" style={{ left: W + 4, top: H / 2 }} aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10l.5-1a1.5 1.5 0 0 1 2.8.6V11l.4-.5a1.5 1.5 0 0 1 2.6 1V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.2-2.3L5 15.5a1.5 1.5 0 0 1 2.4-1.8L9 15z" fill="#fff" stroke="#2E2620" strokeWidth="1.6" strokeLinejoin="round" /></svg></span>}
        </>}
      </div>
      <div className="kface" style={{ left: 0, top: 0, width: W, height: D, transform: `translateZ(${H}px)`, borderRadius: 2, ...css(topCss) }}>
        {m.gen === 'sink' && <>
          <span className="kdeco" style={css('left:24%;top:24%;width:52%;height:56%;background:linear-gradient(160deg,#c8ccd1,#8f959c);border-radius:8px;box-shadow:inset 0 3px 6px rgba(0,0,0,.45),0 0 0 2px #dfe2e6')} />
          <span className="kdeco" style={css('left:46%;top:5%;width:8%;height:14%;background:linear-gradient(90deg,#eef0f2,#9aa0a7);border-radius:3px;box-shadow:0 2px 2px rgba(0,0,0,.35)')} />
        </>}
        {(m.gen === 'range' || m.gen === 'pro') && Array.from({ length: m.gen === 'pro' ? 6 : 4 }, (_, i) => {
          const cols = m.gen === 'pro' ? 3 : 2, cx = ((i % cols) + 0.5) / cols, cy = i < cols ? 0.3 : 0.7, r = Math.min(W / cols, D / 2) * 0.34;
          return <span key={i} className="kdeco" style={{ left: cx * W - r, top: cy * D - r, width: r * 2, height: r * 2, borderRadius: '50%', background: 'radial-gradient(circle,#1a1b1d 0 22%,#5b5f66 24% 30%,#1a1b1d 32% 58%,#45484d 60% 66%,rgba(0,0,0,0) 68%)' }} />;
        })}
        {m.id === 'chefisl' && <>
          <span className="kdeco" style={{ left: W * 0.08, top: D * 0.2, width: W * 0.34, height: D * 0.6, borderRadius: 4, background: 'linear-gradient(135deg,#d9dde1,#8e949b)', boxShadow: 'inset 0 0 0 2px #5b5f66' }} />
          <span className="kdeco" style={{ left: W * 0.55 , top: D * 0.22, width: D * 0.56, height: D * 0.56, borderRadius: '50%', background: 'radial-gradient(circle,#1a1b1d 0 20%,#5b5f66 22% 30%,#1a1b1d 32% 60%,#45484d 62% 68%,#2a2b2e 70%)' }} />
        </>}
        {g.top.map((c, i) => comp(c, g.front.length + i, true))}
      </div>
    </div>
  );
}

// "left:1px;background:…" → React style object (kept as strings in models.js so the mockup and the app share them)
const cache = new Map();
export function css(s) {
  if (!s) return {};
  let o = cache.get(s); if (o) return o;
  o = {};
  let depth = 0, cur = '';
  const parts = [];
  for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
  if (cur.trim()) parts.push(cur);
  for (const p of parts) {
    const i = p.indexOf(':'); if (i < 0) continue;
    const k = p.slice(0, i).trim(), v = p.slice(i + 1).trim(); if (!k) continue;
    o[k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  if (cache.size > 4000) cache.clear();
  cache.set(s, o); return o;
}
