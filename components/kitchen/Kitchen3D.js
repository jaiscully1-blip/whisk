'use client';
import { useRef, useState } from 'react';
import * as K from '@/lib/kitchen/models';

// The kitchen in 3D, drawn with CSS 3D boxes (no WebGL, so it's light and works everywhere).
// mode: 'view'  — doors and drawers open with a tap; lit spots can be tapped
//       'build' — doors off so every shelf shows; drag a piece to move it, drag a yellow dot to stretch it
//       'mini'  — a small floating picture (tap anywhere → onTap)
// Spots are tagged with data-spot="<piece>|<compartment>|<spot>" so drag-and-drop can find them with elementFromPoint.
export default function Kitchen3D({
  pieces, mode = 'view', height = 420, scale = 1, cam, onCam, open = {}, openAll = false, onToggle,
  spot = {}, onSpot, sel = null, onSelect, onChange, onTap, taught = true, onTaught, float = false, className = ''
}) {
  const [own, setOwn] = useState({ rz: -24, rx: 56 });
  const camera = cam || own; const setCam = onCam || setOwn;
  const drag = useRef(null); const moved = useRef(false);
  const build = mode === 'build', view = mode === 'view', mini = mode === 'mini';
  const { idx } = K.spotsOf(pieces, []);
  const C = K.C, HU = K.HU;

  function floorDelta(dx, dy) {
    const r = camera.rz * Math.PI / 180, cx = Math.max(0.2, Math.cos(camera.rx * Math.PI / 180));
    const fy = dy / cx / scale, fx = dx / scale;
    return { u: (fx * Math.cos(r) + fy * Math.sin(r)) / C, v: (-fx * Math.sin(r) + fy * Math.cos(r)) / C };
  }
  function update(id, fn) {
    const next = pieces.map((b) => { if (b.id !== id) return b; const n = { ...b }; fn(n); return K.clash(pieces, n) ? b : n; });
    if (next.some((b, i) => b !== pieces[i])) onChange?.(next);
  }
  const down = (e) => { if (mini) return; drag.current = { mode: 'spin', x: e.clientX, y: e.clientY, rz: camera.rz, rx: camera.rx }; moved.current = false; };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!moved.current) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      moved.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    }
    if (d.mode === 'spin') { setCam({ rz: d.rz + dx * 0.45, rx: K.clamp(d.rx - dy * 0.3, 8, 82) }); return; }
    const fd = floorDelta(dx, dy);
    if (d.mode === 'move') update(d.id, (n) => { n.x = K.clamp(Math.round(d.x0 + fd.u), 0, K.GW - n.w); n.y = K.clamp(Math.round(d.y0 + fd.v), 0, K.GD - n.d); });
    if (d.mode === 'grow') {
      const b0 = d.b0;
      update(d.id, (n) => {
        if (d.side === 'e') n.w = K.clamp(Math.round(b0.w + fd.u), 1, K.GW - b0.x);
        if (d.side === 'w') { const nx = K.clamp(Math.round(b0.x + fd.u), 0, b0.x + b0.w - 1); n.x = nx; n.w = b0.w + (b0.x - nx); }
        if (d.side === 's') n.d = K.clamp(Math.round(b0.d + fd.v), 1, K.GD - b0.y);
        if (d.side === 'n') { const ny = K.clamp(Math.round(b0.y + fd.v), 0, b0.y + b0.d - 1); n.y = ny; n.d = b0.d + (b0.y - ny); }
        if (d.side === 'up') { const sn = Math.max(0.35, Math.sin(camera.rx * Math.PI / 180)); n.h = K.clamp(Math.round((b0.h - dy / (HU * sn * scale)) * 2) / 2, 1, 9 - b0.z); }
      });
    }
  };
  const up = () => { drag.current = null; setTimeout(() => { moved.current = false; }, 0); };
  const grow = (b, side) => (e) => { e.stopPropagation(); drag.current = { mode: 'grow', side, id: b.id, x: e.clientX, y: e.clientY, b0: { ...b } }; moved.current = false; if (!taught) onTaught?.(); };
  const tapFloor = () => { if (mini) { onTap?.(); return; } if (!moved.current && build && sel) onSelect?.(null); };
  const guard = (fn) => (e) => { e.stopPropagation(); if (moved.current) return; fn(); };

  const floor = build
    ? { background: '#fff', backgroundImage: 'linear-gradient(#CFE3F7 1.5px,transparent 1.5px),linear-gradient(90deg,#CFE3F7 1.5px,transparent 1.5px)', backgroundSize: `${C}px ${C}px`, border: '3px solid #BFD8F2', borderRadius: 6, boxShadow: '0 0 0 10px rgba(207,227,247,.35)' }
    : { background: 'repeating-linear-gradient(90deg,rgba(90,60,30,.18) 0 1px,rgba(0,0,0,0) 1px 26px),repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 2px,rgba(0,0,0,0) 2px 9px),linear-gradient(135deg,#E4CBA4,#D2B183)', borderRadius: 6, boxShadow: '0 0 0 8px rgba(120,90,50,.14)' };

  return (
    <div className={`k3 ${mode} ${float ? 'floaty' : ''} ${className}`} style={{ height }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClick={tapFloor}>
      <div className="k3-cam" style={{ transform: `scale(${scale}) rotateX(${camera.rx}deg) rotateZ(${camera.rz}deg)` }}>
        <div className="k3-sway">
          <div className="k3-floor" style={{ width: K.GW * C, height: K.GD * C, marginLeft: -K.GW * C / 2, marginTop: -K.GD * C / 2, ...floor }}>
            {pieces.map((b) => <Piece key={b.id} b={b} {...{ build, view, mini, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, taught }}
              onDown={build ? (e) => { e.stopPropagation(); drag.current = { mode: 'move', id: b.id, x: e.clientX, y: e.clientY, x0: b.x, y0: b.y }; moved.current = false; if (sel !== b.id) onSelect?.(b.id); } : undefined} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Piece({ b, build, view, open, openAll, onToggle, spot, onSpot, sel, idx, guard, grow, onDown, taught }) {
  const m = K.MODEL[b.mid]; const C = K.C, HU = K.HU;
  const { fin, tfin } = b; const g = K.gen(m, b.w, b.h);
  const W = b.w * C, D = b.d * C, H = Math.round(b.h * HU), Z = Math.round(b.z * HU);
  const selected = build && sel === b.id, ap = K.cold(m), nick = idx.nick[b.id];
  const slide = Math.round(Math.min(D * 0.8, 46));
  const kh = 17;
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
          {s.tags?.length > 0 && <span className="ktags">{s.tags.slice(0, 3).map((t) => <i key={t}>{t}</i>)}{s.tags.length > 3 && <i>+{s.tags.length - 3}</i>}</span>}
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
    const org = c.hinge === 'l' ? '0 50%' : c.hinge === 't' ? '50% 0' : '100% 50%';
    const rot = !isOpen ? '' : c.k === 'lid' ? ' rotateX(105deg)' : c.hinge === 'l' ? ' rotateY(-105deg)' : c.hinge === 't' ? ' rotateX(100deg)' : ' rotateY(105deg)';
    let inCss = c.k === 'panel' ? 'display:none' : K.interior(c, m, fin) + (build ? 'outline:1px solid rgba(0,0,0,.16);outline-offset:-1px;' : '');
    if (c.k === 'lid') inCss = 'background:repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 calc(50% - 2px),rgba(150,170,185,.9) calc(50% - 2px) 50%),radial-gradient(ellipse 70% 50% at 50% 0,#fff,rgba(255,255,255,0)),#E7EEF2;box-shadow:inset 0 6px 10px rgba(0,0,0,.25);';
    const outCss = c.k === 'lid' ? K.skin(fin, 0.12) + 'border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18);' : K.panel(c, m, fin);
    let deco = K.decoFor(c, m, fin, b.h);
    if (c.k === 'lid') deco = [{ st: 'left:38%;top:88%;width:24%;height:6%;background:linear-gradient(90deg,#f5f6f7,#9ea4ab);border-radius:4px' }];
    const toggle = c.k === 'panel' || !view || !onToggle ? undefined : guard(() => onToggle(okey));
    const aria = `${isOpen ? 'Close' : 'Open'} ${nick} ${c.name}`;
    const decos = deco.map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />);
    return (
      <div key={ci} className="kcw">
        <div className="kin" style={{ ...pos, ...css(inCss) }} />
        {spots}
        {showFront && isDoor && (
          <div className="kdoor" style={{ ...pos, transformOrigin: org, transform: `translateZ(1px)${rot}`, cursor: toggle ? 'pointer' : 'default' }} onClick={toggle} role={toggle ? 'button' : undefined} aria-label={toggle ? aria : undefined}>
            <div className="kout" style={css(outCss)}>{decos}</div>
            <div className="kback" style={{ background: ap ? 'repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 16%,rgba(150,190,212,.85) 16% 21%),#E7EDF1' : K.mix(fin.color, 0.3), borderRadius: 3 }} />
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
  const knob = (side, left, top, deg, label) => (
    <button key={side} type="button" className="kknob" style={{ left, top }} onPointerDown={grow(b, side)} aria-label={label}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: `rotate(${deg}deg)` }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  );
  return (
    <div className={`kbox ${selected ? 'sel' : ''}`} style={{ left: b.x * C, top: b.y * C, width: W, height: D, transform: `translateZ(${Z}px)` }} onPointerDown={onDown} data-piece={b.id}>
      {!build && b.z === 0 && <div className="kface" style={{ left: -6, top: -4, width: W + 12, height: D + 14, background: 'radial-gradient(closest-side,rgba(70,45,20,.35),rgba(70,45,20,0))', transform: 'translateZ(.4px)' }} />}
      <div className="kface" style={{ left: 0, top: -H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...css(K.skin(fin, -0.22)) }} />
      <div className="kface" style={{ left: -H, top: 0, width: H, height: D, transformOrigin: '100% 50%', transform: 'rotateY(90deg)', ...css(K.skin(fin, -0.16)) }} />
      <div className="kface" style={{ left: W, top: 0, width: H, height: D, transformOrigin: '0 50%', transform: 'rotateY(-90deg)', ...css(K.skin(fin, -0.16)) }} />
      <div className="kface" style={{ left: 0, top: D - H, width: W, height: H, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', ...css(K.skin(fin, 0)), borderRadius: m.round ? '22px 22px 3px 3px' : 0 }}>
        {K.faceDeco(m, fin, tfin, g.ts, g.tb).map((d, i) => <span key={i} className="kdeco" style={css(d.st)} />)}
        {g.front.map((c, i) => comp(c, i, false))}
        {selected && <button type="button" className="kknob" style={{ left: W / 2 - kh, top: -kh }} onPointerDown={grow(b, 'up')} aria-label="Drag to make it taller">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20V5M6 11l6-6 6 6" /></svg></button>}
      </div>
      <div className="kface" style={{ left: 0, top: 0, width: W, height: D, transform: `translateZ(${H}px)`, borderRadius: 2, ...css(topCss) }}>
        {m.gen === 'sink' && <>
          <span className="kdeco" style={css('left:24%;top:24%;width:52%;height:56%;background:linear-gradient(160deg,#c8ccd1,#8f959c);border-radius:8px;box-shadow:inset 0 3px 6px rgba(0,0,0,.45),0 0 0 2px #dfe2e6')} />
          <span className="kdeco" style={css('left:46%;top:5%;width:8%;height:14%;background:linear-gradient(90deg,#eef0f2,#9aa0a7);border-radius:3px;box-shadow:0 2px 2px rgba(0,0,0,.35)')} />
        </>}
        {g.top.map((c, i) => comp(c, g.front.length + i, true))}
        {selected && <>
          {knob('e', W - kh, D / 2 - kh, 0, 'Drag to make it wider on the right')}
          {knob('w', -kh, D / 2 - kh, 180, 'Drag to make it wider on the left')}
          {knob('s', W / 2 - kh, D - kh, 90, 'Drag to make it deeper')}
          {knob('n', W / 2 - kh, -kh, -90, 'Drag to make it deeper at the back')}
          {!taught && <span className="khand" style={{ left: W - 4, top: D / 2 + 4 }} aria-hidden="true">👆</span>}
        </>}
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
