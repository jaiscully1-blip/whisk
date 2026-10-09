'use client';
import { Fragment, useEffect, useRef, useState } from 'react';
import * as K from '@/lib/kitchen/models';
import { stickerUrl } from '@/lib/art/food';
import { itemUrl } from '@/lib/art/items';
import { roomFor } from '@/lib/art/tampa';
import Room from './Room';
import { MAGNETS, magnetUrl } from '@/lib/art/magnets';
import { useWorld } from '@/components/usePantry';
import { itemPx } from '@/lib/kitchen/sizes';

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
export const ZOOM = [0.45, 3.6];
// the camera that puts piece b in the middle of the view at this zoom (null b = the whole kitchen)
export function frameOn(b, camera, scale = 1, z = 2.1) {
  if (!b) return { ...camera, zoom: 1, px: 0, py: 0 };
  const C = K.C, HU = K.HU;
  const cx = (b.x + b.w / 2) * C - K.GW * C / 2, cy = (b.y + b.d / 2) * C - K.GD * C / 2, cz = ((b.z || 0) + b.h * 0.5) * HU;
  const Sx = scale * z, a = camera.rz * Math.PI / 180, t = camera.rx * Math.PI / 180;
  const x1 = cx * Math.cos(a) - cy * Math.sin(a), y1 = cx * Math.sin(a) + cy * Math.cos(a), y2 = y1 * Math.cos(t) - cz * Math.sin(t);
  return { ...camera, zoom: z, px: -Sx * x1, py: -Sx * y2 };
}
export const VIEW_CAM = { rz: -38, rx: 58, zoom: 1, px: 0, py: 0 };   // the isometric dollhouse angle
export const camTransform = (c, scale = 1) => `translate(${c.px || 0}px, ${c.py || 0}px) scale(${scale * (c.zoom || 1)}) rotateX(${c.rx}deg) rotateZ(${c.rz}deg)`;
// which of the room's two walls face you (a wall that would block the view isn't shown)
export const facing = (rz) => { const a = rz * Math.PI / 180; return { back: Math.cos(a) > 0.05, right: -Math.sin(a) > 0.05 }; };
export const PAN = 1000;   // how far (px at normal zoom) the kitchen can be slid before it stops: ~10 swipes
export default function Kitchen3D({
  pieces, mode = 'view', height = 420, scale = 1, cam, onCam, open = {}, openAll = false, onToggle,
  spot = {}, onSpot, sel = null, onSelect, onChange, onTap, taught = true, onTaught, float = false, className = '', place = null,
  focus = null, onFocusPiece
}) {
  const [own, setOwn] = useState(VIEW_CAM);
  const [edge, setEdge] = useState('');
  const edgeT = useRef(null);
  const camera = cam || own; const setCam = onCam || setOwn;
  const zoom = camera.zoom || 1, S = scale * zoom;
  const drag = useRef(null); const moved = useRef(false);
  const fingers = useRef(new Map());
  const root = useRef(null);
  const camRef = useRef(camera); camRef.current = camera;
  const camEl = useRef(null);
  // While a finger or the wheel is moving the view, the new camera is written straight to the page every frame and
  // the kitchen is only re-drawn by React once, when you let go. (Re-drawing every piece on every move was the lag.)
  const live = useRef(null), raf = useRef(0), wheelT = useRef(null);
  const paint = () => {
    raf.current = 0; const c = live.current, el = camEl.current, r = root.current; if (!c || !el) return;
    el.style.transform = camTransform(c, scale);
    if (r) { r.style.setProperty('--rz', c.rz); const f = facing(c.rz); r.classList.toggle('fb', f.back); r.classList.toggle('fr', f.right); }
  };
  const liveCam = (c) => { live.current = c; if (!raf.current) raf.current = requestAnimationFrame(paint); };
  const commit = () => { const c = live.current; if (!c) return; live.current = null; cancelAnimationFrame(raf.current); raf.current = 0; setCam(c); };
  const cur = () => live.current || camera;
  const build = mode === 'build', view = mode === 'view', mini = mode === 'mini';
  const { idx } = K.spotsOf(pieces, []);
  // remember which door opened first, so a later door hinged at the same spot rests against it instead of going through
  const order = useRef(new Map()), seq = useRef(0);
  for (const [k, v] of Object.entries(open)) { if (v && !order.current.has(k)) order.current.set(k, ++seq.current); }
  for (const k of [...order.current.keys()]) if (!open[k]) order.current.delete(k);
  const angles = doorAngles(pieces, openAll, order.current);
  // tap the pantry closet or spice cabinet: fly the camera to it (zoom in or out from there as you like)
  const focusOn = (b) => setCam(frameOn(b, camera, scale, 2.1));
  // while you look at one piece, anything standing in front of it (an island, a table) steps out of the way
  const fp = focus ? pieces.find((p) => p.id === focus) : null;
  const inFront = (b) => !!fp && b.id !== fp.id && !K.isRoom(fp) && b.y >= fp.y + fp.d - 0.01 && b.x < fp.x + fp.w + 1 && b.x + b.w > fp.x - 1;
  const focusFor = (b) => (!view ? undefined : onFocusPiece ? () => onFocusPiece(b) : K.isRoom(b) ? () => focusOn(b) : undefined);
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
  const liveRef = useRef(liveCam); liveRef.current = liveCam;
  const commitRef = useRef(commit); commitRef.current = commit;
  // mouse wheel / trackpad pinch (ctrl) zooms; trackpad two-finger scroll slides (non-passive so the page doesn't scroll instead)
  useEffect(() => {
    const el = root.current; if (!el || mini) return undefined;
    const onWheel = (e) => {
      e.preventDefault(); const c = live.current || camRef.current;
      const mouseWheel = e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
      if (e.ctrlKey || mouseWheel) { const z = K.clamp((c.zoom || 1) * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), ZOOM[0], ZOOM[1]), k = z / (c.zoom || 1); liveRef.current({ ...c, zoom: z, px: (c.px || 0) * k, py: (c.py || 0) * k }); }
      else liveRef.current(panRef.current(c, (c.px || 0) - e.deltaX, (c.py || 0) - e.deltaY));
      clearTimeout(wheelT.current); wheelT.current = setTimeout(() => commitRef.current(), 160);
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
  // snap to a new cell only once you're clearly past the halfway mark (no flicker between two cells)
  const settle = (cur, raw) => (Math.abs(raw - cur) > 0.7 ? Math.round(raw) : cur);
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
  const isTouchOff = (e) => e.pointerType === 'touch' && !e.target.closest?.('.k3-floor, .k3-home, button');
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
    if (fingers.current.size === 2) { const c = cur(); drag.current = { mode: 'pinch', d0: dist(), z0: c.zoom || 1, m0: mid(), p0: { x: c.px || 0, y: c.py || 0 } }; moved.current = true; }
  };
  // Building is calm on purpose: touching a piece you haven't picked just turns the view (no accidental grabs);
  // a clean tap picks it; only the picked piece can be dragged.
  const tapCand = useRef(null);
  // one finger on the kitchen turns it; one finger beside it slides it left or right (up and down still scrolls the page)
  const down = (e) => {
    if (mini || drag.current?.mode === 'pinch') return;
    if (isTouchOff(e)) { drag.current = { mode: 'slide', x: e.clientX, y: e.clientY, px: camera.px || 0, t: Date.now() }; moved.current = false; return; }
    if (!onModel(e)) return;
    drag.current = { mode: 'spin', x: e.clientX, y: e.clientY, rz: camera.rz, rx: camera.rx, t: Date.now() }; moved.current = false;
  };
  const move = (e) => {
    if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = drag.current; if (!d) return;
    if (d.mode === 'pinch') {   // two fingers: slide it anywhere (up to the border) and pinch to zoom, both at once
      if (fingers.current.size >= 2) { const m = mid(); liveCam(panTo({ ...cur(), zoom: K.clamp(d.z0 * dist() / d.d0, ZOOM[0], ZOOM[1]) }, d.p0.x + m.x - d.m0.x, d.p0.y + m.y - d.m0.y)); }
      return;
    }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (d.mode === 'slide') {
      if (!moved.current) {
        if (Math.abs(dx) + Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }   // up/down: that's the page scrolling
        moved.current = true;
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
      }
      liveCam(panTo(camera, d.px + dx, camera.py || 0)); return;
    }
    if (!moved.current) {
      if (Math.abs(dx) + Math.abs(dy) < (build ? 10 : 6)) return;
      tapCand.current = null;
      moved.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    }
    // swipe right → the model turns right with your finger
    if (d.mode === 'spin') { const k = build ? 0.3 : 0.4; liveCam({ ...camera, rz: d.rz - dx * k, rx: K.clamp(d.rx - dy * k * 0.6, 20, 78) }); return; }
    if (d.mode === 'move' && d.thing) {   // things slide over the floor plan and settle on whatever is under them
      const { u, v } = axisCells(dx, dy);
      update(d.id, (n) => { n.x = K.clamp(settle(n.x, d.b0.x + u), 0, K.GW - n.w); n.y = K.clamp(settle(n.y, d.b0.y + v), 0, K.GD - n.d); n.z = K.restZ(pieces, n); });
      return;
    }
    if (d.mode === 'move') {
      // left/right on screen slides it along whichever floor direction looks most left/right; up/down lifts it
      const h = axisCells(dx, 0);
      const useX = Math.abs(h.ex[0]) >= Math.abs(h.ey[0]);
      const side = useX ? dx * h.ex[0] / (h.ex[0] * h.ex[0] + h.ex[1] * h.ex[1]) : dx * h.ey[0] / (h.ey[0] * h.ey[0] + h.ey[1] * h.ey[1]);
      update(d.id, (n) => {
        const B = K.bounds(n);
        if (useX) n.x = K.clamp(settle(n.x, d.b0.x + side), B.x0, B.x1 - n.w); else n.y = K.clamp(settle(n.y, d.b0.y + side), B.y0, B.y1 - n.d);
        // lifting needs a clear up/down drag (30 px) so sliding sideways never bumps it off the floor
        if (Math.abs(dy) > 30) n.z = K.clamp(settle(n.z * 2, (d.b0.z + lift(dy - Math.sign(dy) * 30)) * 2) / 2, 0, 9 - n.h);
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
    if (build && tapCand.current && !moved.current && Date.now() - (drag.current?.t || 0) < 450) onSelect?.(tapCand.current);
    tapCand.current = null;
    drag.current = null; setTimeout(() => { moved.current = false; }, 0);
    commit();
  };
  const grow = (b, side) => (e) => { if (drag.current?.mode === 'pinch') return; e.stopPropagation(); drag.current = { mode: 'grow', side, id: b.id, x: e.clientX, y: e.clientY, b0: { ...b } }; moved.current = false; if (!taught) onTaught?.(); };
  const tapFloor = (e) => { if (mini) { onTap?.(); return; } if (e?.target?.closest?.('[data-piece]')) return; if (!moved.current && build && sel) onSelect?.(null); };
  const guard = (fn) => (e) => { e.stopPropagation(); if (moved.current) return; fn(); };

  const room = place && !build ? roomFor(place) : null;
  const face = facing(camera.rz);
  const floor = build
    ? { background: '#fff', backgroundImage: 'linear-gradient(#CFE3F7 1.5px,transparent 1.5px),linear-gradient(90deg,#CFE3F7 1.5px,transparent 1.5px)', backgroundSize: `${C}px ${C}px`, border: '3px solid #BFD8F2', borderRadius: 6, boxShadow: '0 0 0 10px rgba(207,227,247,.35)' }
    : place === 'void' ? { background: 'radial-gradient(ellipse at 50% 50%,rgba(140,170,255,.22),rgba(140,170,255,.05))', border: '1.5px dashed rgba(170,190,255,.35)', borderRadius: 6 }
    : room ? { background: `${face.back ? 'linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,0) 14%),' : ''}${face.right ? 'linear-gradient(270deg,rgba(0,0,0,.18),rgba(0,0,0,0) 11%),' : ''}${FLOORS[room.floor] || FLOORS.wood}` }
    : { background: FLOORS.wood, borderRadius: 6, boxShadow: '0 0 0 8px rgba(120,90,50,.14)' };

  return (
    <div ref={root} className={`k3 ${mode} ${float ? 'floaty' : ''} ${edge ? `edge-${edge}` : ''} ${place ? `placed at-${place}` : ''} ${face.back ? 'fb' : ''} ${face.right ? 'fr' : ''} ${focus ? 'focused' : ''} ${className}`} style={{ height, '--rz': camera.rz }} onPointerDownCapture={capDown} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={tapFloor}>
      <div ref={camEl} className="k3-cam" style={{ transform: camTransform(camera, scale) }}>
        <div className="k3-sway">
          <div className="k3-floor" style={{ width: K.GW * C, height: K.GD * C, marginLeft: -K.GW * C / 2, marginTop: -K.GD * C / 2, ...floor }}>
            {room && <Room room={room} place={place} pieces={pieces} />}
            {pieces.map((b) => {
              if (inFront(b)) return null;
              const onDown = build ? (e) => {
                if (drag.current?.mode === 'pinch' || fingers.current.size > 1) return;
                if (sel !== b.id) { tapCand.current = b.id; return; }   // not picked yet: let the view turn; a clean tap picks it
                e.stopPropagation(); drag.current = { mode: 'move', thing: K.isThing(b), id: b.id, x: e.clientX, y: e.clientY, b0: { ...b }, t: Date.now() }; moved.current = false;
              } : undefined;
              return K.isThing(b)
                ? <Thing key={b.id} b={b} selected={build && sel === b.id} onDown={onDown} />
                : K.MODEL[b.mid].gen === 'closet'
                  ? <Closet key={b.id} b={b} {...{ build, view, spot, onSpot, sel, idx, guard }} onDown={onDown} onFocus={focusFor(b)} />
                  : <Piece key={b.id} b={b} {...{ build, view, mini, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, taught, mags, angles }} onDown={onDown} onFocus={focusFor(b)} focused={focus === b.id} />;
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
  tile: 'linear-gradient(90deg,rgba(150,145,138,.35) 1px,rgba(0,0,0,0) 1px) 0 0/26px 26px,linear-gradient(0deg,rgba(150,145,138,.35) 1px,rgba(0,0,0,0) 1px) 0 0/26px 26px,radial-gradient(ellipse at 30% 20%,#FFFFFF,#EEEBE6)',
  wood: 'repeating-linear-gradient(90deg,rgba(90,60,30,.18) 0 1px,rgba(0,0,0,0) 1px 26px),repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 2px,rgba(0,0,0,0) 2px 9px),linear-gradient(135deg,#B58A5E,#9C7349)',
  oak: 'repeating-linear-gradient(90deg,rgba(70,40,15,.22) 0 1px,rgba(0,0,0,0) 1px 18px),repeating-linear-gradient(0deg,rgba(255,255,255,.06) 0 2px,rgba(0,0,0,0) 2px 7px),linear-gradient(135deg,#C99566,#A9774A)',
  hex: 'radial-gradient(circle at 50% 50%,#F2EBDD 0 46%,#2E2A2A 47% 50%,rgba(0,0,0,0) 51%) 0 0/13px 13px,radial-gradient(circle at 50% 50%,#F2EBDD 0 46%,#2E2A2A 47% 50%,rgba(0,0,0,0) 51%) 6.5px 6.5px/13px 13px,#2E2A2A',
  stone: 'linear-gradient(90deg,rgba(0,0,0,.08) 1px,rgba(0,0,0,0) 1px) 0 0/52px 52px,linear-gradient(0deg,rgba(0,0,0,.08) 1px,rgba(0,0,0,0) 1px) 0 0/52px 52px,linear-gradient(135deg,#E9E5DE,#D8D2C8)',
  terracotta: 'linear-gradient(90deg,rgba(255,240,220,.5) 1.5px,rgba(0,0,0,0) 1.5px) 0 0/26px 26px,linear-gradient(0deg,rgba(255,240,220,.5) 1.5px,rgba(0,0,0,0) 1.5px) 0 0/26px 26px,linear-gradient(135deg,#C46B44,#A9552F)',
  concrete: 'radial-gradient(circle at 30% 40%,rgba(255,255,255,.06),rgba(0,0,0,0) 40%),linear-gradient(135deg,#4A484C,#38363A)'
};
// A shop thing: a drawn cut-out standing on the counter (or floor), always turned to face you.
function Thing({ b, selected, onDown }) {
  const m = K.MODEL[b.mid]; const C = K.C, HU = K.HU;
  const W = b.w * C, VW = Math.round(W * 1.6), H = VW, Z = Math.round(b.z * HU);   // drawn a bit bigger than its cell so you can see it
  return (
    <div className={`kthing ${selected ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: b.d * C, transform: `translateZ(${Z + 0.5}px)` }} onPointerDown={onDown} data-piece={b.id}>
      <div className="kthing-shadow" />
      <div className="kthing-up" style={{ left: (W - VW) / 2, top: b.d * C / 2 - H, width: VW, height: H, transform: 'rotateZ(calc(var(--rz) * -1deg)) rotateX(-90deg)' }}>
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
// room: for a spot inside a cabinet, fridge or closet shelf ({ w, h } in px), food stands on the shelf at its real
// size (as many as fit side by side); other spots show up to three small stickers.
function SpotBtn({ k, st, extra = '', spot, idx, onSpot, guard, room }) {
  const s = spot[k] || {}, items = s.items || [];
  let shown = items.slice(0, 3), sizes = null;
  if (room && items.length) {
    sizes = []; let used = 0;
    for (const it of items) { const px = itemPx(it, room.h); if (used + px * 0.8 > room.w - 10 && sizes.length) break; sizes.push(px); used += px * 0.8; }
    shown = items.slice(0, sizes.length);
  }
  return (
    <button type="button" data-spot={k} className={`ks ${extra} ${room ? 'deep' : ''} ${s.lit ? 'lit' : ''} ${s.on ? 'on' : ''} ${s.hov ? 'hov' : ''}`} style={st}
      aria-label={(idx.map[k] || {}).label || 'spot'} onClick={onSpot ? guard(() => onSpot(k)) : undefined}>
      {items.length > 0 && <span className="kstks">{shown.map((it, i) => <img key={i} src={stickerUrl(it.name, it.category)} alt="" title={it.name} draggable={false} style={sizes ? { width: sizes[i], height: sizes[i] } : undefined} />)}{items.length > shown.length && <i>+{items.length - shown.length}</i>}</span>}
    </button>
  );
}

// The inside of an open cabinet, fridge or freezer compartment as a real box: back, two sides, a shelf under each
// row and a lip on its front edge. Drawn in the front face's frame (x right, y down, z out toward you), going
// `depth` px back. Each spot stands just above its shelf, halfway in, with the food standing on it at real size.
function Inside({ k0, x, y, w, h, depth, defs, cold, liner, shelf, spot, idx, onSpot, guard }) {
  const rows = defs.length ? defs[0].rows : 1, rh = h / rows;
  const wall = { position: 'absolute', background: liner };
  return (
    <>
      <div className="kin3" style={{ ...wall, left: x, top: y, width: w, height: h, transform: `translateZ(${-depth}px)`, background: `${cold ? 'radial-gradient(ellipse 70% 30% at 50% 0,rgba(255,255,255,.95),rgba(255,255,255,0)),' : ''}linear-gradient(180deg,rgba(0,0,0,.14),rgba(0,0,0,0) 30%),${liner}` }} />
      <div className="kin3" style={{ ...wall, left: x, top: y, width: depth, height: h, transformOrigin: '0 50%', transform: 'rotateY(90deg)', filter: 'brightness(.86)' }} />
      <div className="kin3" style={{ ...wall, left: x + w - depth, top: y, width: depth, height: h, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)', filter: 'brightness(.93)' }} />
      {Array.from({ length: rows }, (_, r) => {
        const sy = y + (r + 1) * rh;
        return (
          <Fragment key={r}>
            <div className="kin3" style={{ left: x, top: sy - 0.5, width: w, height: depth, transformOrigin: '50% 0', transform: 'rotateX(-90deg)', background: shelf }} />
            {r < rows - 1 && <div className="kin3" style={{ left: x, top: sy - 1, width: w, height: 3, transform: 'translateZ(-1px)', background: shelf, filter: 'brightness(.9)' }} />}
          </Fragment>
        );
      })}
      {defs.map((sd, si) => {
        const rw = w / sd.cols, top = y + sd.r * rh;
        return <SpotBtn key={si} k={`${k0}|${si}`} st={{ left: x + sd.col * rw + 2, top: top + 2, width: rw - 4, height: rh - 4, transform: `translateZ(${-Math.round(depth * 0.45)}px)` }} room={{ w: rw - 4, h: rh - 6 }} {...{ spot, idx, onSpot, guard }} />;
      })}
    </>
  );
}

// The walk-in pantry closet: a little room off the kitchen with real shelves on the left, back and right walls
// (boards sticking out of the wall, food standing on them at its true size) and floor space.
function Closet({ b, build, spot, onSpot, sel, idx, guard, onDown, onFocus }) {
  const C = K.C, HU = K.HU, W = b.w * C, D = b.d * C, H = Math.round(b.h * HU);
  const g = K.gen(K.MODEL[b.mid], b.w, b.h).front;   // [left, back, right, floor]
  const wallBg = css(K.skin(b.fin, 0));
  const spots = !build;
  const stopFocus = onFocus ? guard(onFocus) : undefined;
  const cells = (ci, along, across) => {
    const c = g[ci], rows = c.rows, cols = c.cols, out = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) out.push({ key: `${b.id}|${ci}|${r * cols + k}`, a0: r * along / rows, a1: (r + 1) * along / rows, c0: k * across / cols, c1: (k + 1) * across / cols });
    return out;
  };
  const wall = (ci, w, flip) => <ShelfWall b={b} ci={ci} c={g[ci]} w={w} h={H} flip={flip} depth={Math.min(24, Math.round(D * 0.3))} spots={spots} {...{ spot, idx, onSpot, guard }} />;
  return (
    <div className={`kbox kcloset ${build && sel === b.id ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: D }} onPointerDown={onDown} onClick={stopFocus} data-piece={b.id}>
      <div className="kface kc-floor" style={{ left: -6, top: -6, width: W + 12, height: D + 12, background: 'linear-gradient(90deg,rgba(150,145,138,.3) 1px,rgba(0,0,0,0) 1px) 6px 6px/26px 26px,linear-gradient(0deg,rgba(150,145,138,.3) 1px,rgba(0,0,0,0) 1px) 6px 6px/26px 26px,linear-gradient(135deg,#FBFAF8,#ECE9E4)', borderRadius: 4, boxShadow: '0 6px 0 #DAD5CD' }}>
        {spots && cells(3, D, W).map((x) => <SpotBtn key={x.key} k={x.key} st={{ left: 6 + x.c0 + 8, top: 6 + D * 0.55, width: x.c1 - x.c0 - 16, height: D * 0.35 }} extra="flat" {...{ spot, idx, onSpot, guard }} />)}
      </div>
      {/* back wall, facing into the closet */}
      <div className="kface kc-wall" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...wallBg }}>{wall(1, W, false)}</div>
      {/* left wall: runs from the front (its left edge) to the back */}
      <div className="kwall-turn" style={{ left: 0, top: D, transform: 'rotateZ(-90deg)' }}>
        <div className="kface kc-wall" style={{ left: 0, top: -H, width: D, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...wallBg, filter: 'brightness(.94)' }}>{wall(0, D, true)}</div>
      </div>
      {/* right wall: runs from the back to the front */}
      <div className="kwall-turn" style={{ left: W, top: 0, transform: 'rotateZ(90deg)' }}>
        <div className="kface kc-wall" style={{ left: 0, top: -H, width: D, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...wallBg, filter: 'brightness(.9)' }}>{wall(2, D, false)}</div>
      </div>
      <span className="kc-sign" style={{ left: 4, top: D - 18 }}>{idx.nick[b.id] || 'Pantry closet'}</span>
    </div>
  );
}

// One wall of closet shelving, drawn in the wall's own frame (x along it, y down, z out into the closet).
// flip: count the columns from the far end (so spot numbers stay the same as before: column 0 is at the back).
function ShelfWall({ b, ci, c, w, h, flip, depth, spots, spot, idx, onSpot, guard }) {
  const rows = c.rows, cols = c.cols, rh = h / rows, cw = w / cols;
  const board = 'linear-gradient(180deg,#F6F3EE,#E4DED5)';
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <Fragment key={r}>
          <div className="kin3" style={{ left: 0, top: (r + 1) * rh - 1, width: w, height: depth, transformOrigin: '50% 0', transform: 'rotateX(90deg)', background: board }} />
          <div className="kin3" style={{ left: 0, top: (r + 1) * rh - 1, width: w, height: 4, transform: `translateZ(${depth}px)`, background: '#D9D3CA' }} />
        </Fragment>
      ))}
      {spots && Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols), k = i % cols, kk = flip ? cols - 1 - k : k;
        return <SpotBtn key={i} k={`${b.id}|${ci}|${i}`} st={{ left: kk * cw + 3, top: r * rh + 3, width: cw - 6, height: rh - 5, transform: `translateZ(${Math.round(depth * 0.5)}px)` }} room={{ w: cw - 6, h: rh - 8 }} {...{ spot, idx, onSpot, guard }} />;
      })}
    </>
  );
}

function Piece({ b, build, view, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, onDown, taught, mags = {}, angles = {}, onFocus, focused = false }) {
  const m = K.MODEL[b.mid]; const C = K.C, HU = K.HU;
  const { fin, tfin } = b; const g = K.gen(m, b.w, b.h);
  const W = b.w * C, D = b.d * C, H = Math.round(b.h * HU), Z = Math.round(b.z * HU);
  // compartments drawn as a real 3D box inside (shelves, back, sides) instead of a flat picture
  const deepOk = (c, onTop) => !build && !onTop && (c.k === 'door' || c.k === 'open') && !c.inner && !c.ns && m.gen !== 'wine';
  const isOpenC = (c, ci) => c.k === 'open' || (!build && (openAll || !!open[`${b.id}:${ci}`]) && c.k !== 'panel');
  // the front of the piece, with a hole wherever you can see into it (so the 3D inside isn't hidden behind it)
  const holes = g.front.map((c, ci) => (deepOk(c, false) && isOpenC(c, ci) ? `M${c.x * W} ${c.y * H}h${c.w * W}v${c.h * H}h${-c.w * W}Z` : '')).join('');
  const selected = build && sel === b.id, ap = K.cold(m), nick = idx.nick[b.id];
  const slide = Math.round(focused ? D * 0.85 : Math.min(D * 0.8, 46));
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
    const spotEl = (key, style, extra = '') => <SpotBtn key={key} k={key} st={style} extra={extra} {...{ spot, idx, onSpot, guard }} />;
    const inside = canSpot && deepOk(c, onTop) ? (
      <Inside k0={`${b.id}|${ci}`} x={cx} y={cy} w={cw} h={ch} depth={Math.max(10, D - 4)} defs={defs} cold={ap} liner={K.liner(m, fin)}
        shelf={ap ? 'linear-gradient(180deg,rgba(225,240,248,.95),rgba(170,205,225,.9))' : fin.tex === 'wood' ? K.mix(fin.color, -0.1) : '#E6DED0'} {...{ spot, idx, onSpot, guard }} />
    ) : null;
    const spots = canSpot && !isDr && !inside ? defs.map((sd, si) => {
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
    // looking right at it: doors swing wider (unless something's beside the hinge) so their insides, with the door
    // shelves, face you and you can tap them shut from the inside
    const ang = focused && (angles[okey] ?? 105) === 105 ? 122 : angles[okey] ?? 105;
    const rot = !isOpen ? '' : c.k === 'lid' ? ' rotateX(105deg)' : c.hinge === 'l' ? ` rotateY(-${ang}deg)` : c.hinge === 't' ? ' rotateX(100deg)' : c.hinge === 'b' ? ' rotateX(-88deg)' : ` rotateY(${ang}deg)`;
    let inCss = c.k === 'panel' ? 'display:none' : K.interior(c, m, fin) + (build ? 'outline:1px solid rgba(0,0,0,.16);outline-offset:-1px;' : '');
    if (c.k === 'lid') inCss = 'background:repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 calc(50% - 2px),rgba(150,170,185,.9) calc(50% - 2px) 50%),radial-gradient(ellipse 70% 50% at 50% 0,#fff,rgba(255,255,255,0)),#E7EEF2;box-shadow:inset 0 6px 10px rgba(0,0,0,.25);';
    const outCss = c.k === 'lid' ? K.skin(fin, 0.12) + 'border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);' : K.panel(c, m, fin);
    let deco = K.decoFor(c, m, fin, b.h, b.w);
    if (c.k === 'lid') deco = [{ st: 'left:38%;top:88%;width:24%;height:6%;background:linear-gradient(90deg,#f5f6f7,#9ea4ab);border-radius:4px' }];
    // first tap on a piece you aren't looking at flies to it (and opens everything); after that a tap opens or closes
    const toggle = c.k === 'panel' || !view || !onToggle ? undefined : guard(() => (onFocus && !focused ? onFocus() : onToggle(okey)));
    const aria = `${isOpen ? 'Close' : 'Open'} ${nick} ${c.name}`;
    const decos = deco.map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />)
      .concat((mags[okey] || []).map((g) => <img key={g.id} className="kmag" src={magnetUrl(g.id)} alt="" draggable={false} style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%`, transform: `translate(-50%, -50%) rotate(${g.rot}deg)` }} />));
    return (
      <div key={ci} className="kcw">
        {!deepOk(c, onTop) && <div className="kin" style={{ ...pos, ...css(inCss) }} />}
        {inside}
        {spots}
        {focused && isOpen && isDoor && toggle && (
          <button type="button" className="kclose" style={{ left: cx + cw / 2 - 17, top: cy + 3, transform: 'translateZ(2px)' }} onClick={toggle} aria-label={`Close ${nick} ${c.name}`}>
            <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>Close
          </button>
        )}
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
      <div className={`kface ${holes ? 'holed' : ''}`} style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...(holes ? {} : css(K.skin(fin, 0))), borderRadius: m.round ? '22px 22px 3px 3px' : 0 }}>
        {holes && <div className="kskin" style={{ ...css(K.skin(fin, 0)), borderRadius: m.round ? '22px 22px 3px 3px' : 0, clipPath: `path(evenodd, "M0 0H${W}V${H}H0Z${holes}")` }} />}
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
