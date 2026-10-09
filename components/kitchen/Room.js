'use client';
import { memo, useEffect, useState } from 'react';
import * as K from '@/lib/kitchen/models';
import { wallUrl, viewSvg } from '@/lib/art/tampa';

// The room around the 3D kitchen, like an isometric dollhouse render: a floor slab, two walls (the back wall and the
// right wall; the other two sides stay open), thick wall tops, a real window with the view outside, daylight that
// follows the time on your phone (morning, afternoon, golden hour, night), sunlight falling across the floor, and soft
// shadows where the walls meet the floor. The time comes from the phone's own clock and never leaves it.

// the hour (0–24, with minutes) on this phone, refreshed every minute
export function useHour() {
  const get = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const [h, setH] = useState(get);
  useEffect(() => { const t = setInterval(() => setH(get()), 60000); return () => clearInterval(t); }, []);
  return h;
}

export function daylight(h) {
  const phase = h < 5.5 || h >= 21 ? 'night' : h < 7.5 ? 'dawn' : h < 17 ? 'day' : h < 19 ? 'golden' : 'dusk';
  const SKY = { night: ['#0B1530', '#22305A'], dawn: ['#F3A27E', '#FCDDB4'], day: ['#5DB6EC', '#CBEEFC'], golden: ['#F5A65B', '#FCE2B0'], dusk: ['#4E3F86', '#EF8A6A'] };
  const t = Math.max(0, Math.min(1, (h - 6) / 13));   // 6 am → 7 pm across the window
  const sun = { x: 30 + t * 340, y: 150 - Math.sin(t * Math.PI) * 118, show: h >= 6 && h < 19.6 };
  const light = { night: [0.06, '170,190,255'], dawn: [0.32, '255,196,150'], day: [0.42, '255,240,200'], golden: [0.5, '255,180,100'], dusk: [0.2, '230,150,170'] }[phase];
  return { phase, sky: SKY[phase], sun, light, night: phase === 'night' };
}

// The live view: for the Riverwalk apartment, downtown Tampa across the Hillsborough River, water flowing and boats
// going by; other homes use their own view with the same sky and light.
export function WindowView({ place, hour }) {
  const L = daylight(hour), id = `wv${place}`;
  const lit = L.night || L.phase === 'dusk';
  const tower = (x, w, h, c) => `<rect x='${x}' y='${190 - h}' width='${w}' height='${h}' fill='${c}'/>${Array.from({ length: Math.floor(h / 12) }, (_, r) => Array.from({ length: Math.floor(w / 9) }, (_, k) => `<rect x='${x + 3 + k * 9}' y='${190 - h + 5 + r * 12}' width='4' height='6' fill='${lit ? ((r * 7 + k * 3 + x) % 5 < 3 ? '#FFD98A' : '#2A3550') : 'rgba(255,255,255,.4)'}'/>`).join('')).join('')}`;
  const shade = L.night ? 0.55 : L.phase === 'dusk' ? 0.25 : 0;
  if (place !== 'riverwalk') {
    return (
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="wv">
        <g dangerouslySetInnerHTML={{ __html: viewSvg(place) }} />
        <rect width="400" height="240" fill="#0A1430" opacity={shade} />
        {L.night && <circle cx="320" cy="44" r="12" fill="#F4F1E0" />}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="wv" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={L.sky[0]} /><stop offset="1" stopColor={L.sky[1]} /></linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={L.night ? '#16264A' : '#3E8FC2'} /><stop offset="1" stopColor={L.night ? '#0B1630' : '#2A6E9E'} /></linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}s)`} />
      {L.night && Array.from({ length: 24 }, (_, i) => <circle key={i} cx={(i * 97) % 400} cy={(i * 41) % 120} r={i % 4 ? 0.8 : 1.3} fill="#fff" opacity=".8" />)}
      {L.sun.show ? <><circle cx={L.sun.x} cy={L.sun.y} r="30" fill="#FFF3C4" opacity=".35" /><circle cx={L.sun.x} cy={L.sun.y} r="17" fill={L.phase === 'day' ? '#FFE27A' : '#FFC46B'} /></> : <circle cx="330" cy="50" r="13" fill="#F4F1E0" />}
      {/* far bank: University of Tampa minarets, then downtown towers (with the round Rivergate tower) */}
      <g dangerouslySetInnerHTML={{ __html: `${tower(20, 34, 96, L.night ? '#22304F' : '#7FA6C4')}${tower(60, 26, 128, L.night ? '#1C2945' : '#5E8DB0')}<rect x='96' y='78' width='30' height='112' rx='14' fill='${L.night ? '#22304F' : '#8FB0C8'}'/>${tower(132, 30, 82, L.night ? '#27355A' : '#A7C1D6')}${tower(300, 30, 112, L.night ? '#1C2945' : '#6C98BA')}${tower(338, 26, 76, L.night ? '#27355A' : '#94B6CF')}` }} />
      <path d="M0 188h400v14H0z" fill={L.night ? '#1E3A24' : '#6BA84E'} />
      {[[190, 1], [216, 1.25], [244, 1]].map(([x, k], i) => (
        <g key={i} transform={`translate(${x} 190) scale(${k})`}><rect x="-4" y="-34" width="8" height="34" fill={L.night ? '#5A3E34' : '#C98A6A'} /><path d="M-6 -34q6-14 12 0z" fill="#D7DCE2" /><path d="M0 -48v-6" stroke="#9AA0A6" strokeWidth="1.4" /></g>
      ))}
      {/* the river, flowing */}
      <rect y="200" width="400" height="100" fill={`url(#${id}w)`} />
      <g opacity=".7">
        {[214, 234, 256, 280].map((y, i) => (
          <path key={y} d={`M-80 ${y}q20-5 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0`} fill="none" stroke={L.night ? '#3C5C8E' : '#BFE6FA'} strokeWidth={2 - i * 0.3}>
            <animateTransform attributeName="transform" type="translate" from="0 0" to="80 0" dur={`${6 + i * 2}s`} repeatCount="indefinite" />
          </path>
        ))}
      </g>
      {L.sun.show && <ellipse cx={L.sun.x} cy="232" rx="26" ry="5" fill="#FFF3C4" opacity=".35" />}
      {/* boats going by */}
      <g>
        <g><path d="M0 0h46l-8 9H6z" fill="#FFFFFF" stroke="#3B2C24" strokeWidth="1.4" /><rect x="12" y="-8" width="18" height="8" fill="#E8ECF0" stroke="#3B2C24" strokeWidth="1.2" />{L.night && <circle cx="40" cy="-2" r="2" fill="#FFD98A" />}
          <animateTransform attributeName="transform" type="translate" values="-70 226;470 226" dur="38s" repeatCount="indefinite" /></g>
        <g><path d="M0 0h30l-5 7H4z" fill="#C8352F" stroke="#3B2C24" strokeWidth="1.4" /><path d="M14 0v-22l12 20z" fill="#FFFFFF" stroke="#3B2C24" strokeWidth="1.2" />
          <animateTransform attributeName="transform" type="translate" values="470 252;-60 252" dur="54s" repeatCount="indefinite" /></g>
      </g>
      {/* the Riverwalk path in front */}
      <path d="M0 292h400v8H0z" fill={L.night ? '#3A3632' : '#C9B79A'} />
    </svg>
  );
}

// Where the window goes: a stretch of the right (or back) wall with no tall cabinet or appliance in front of it.
// Counters can sit under it (then the sill is above the counter); otherwise it runs almost floor to ceiling.
export function windowSpot(pieces) {
  const solid = (pieces || []).filter((p) => K.MODEL[p.mid] && !K.MODEL[p.mid].thing && !K.isRoom(p));
  const find = (len, touches, along) => {
    const blocked = new Array(len).fill(0);   // 0 free, 1 counter-height below, 2 blocked
    for (const p of solid) {
      if (!touches(p)) continue;
      const [a, b] = along(p), top = p.z + p.h;
      for (let i = Math.max(0, a); i < Math.min(len, b); i++) blocked[i] = Math.max(blocked[i], p.z >= 4 || top > 3.6 ? 2 : 1);
    }
    let best = null;
    for (let i = 0; i < len;) {
      if (blocked[i] === 2) { i++; continue; }
      let j = i; while (j < len && blocked[j] !== 2) j++;
      if (j - i >= 2 && (!best || j - i > best.b - best.a)) best = { a: i, b: j, counter: blocked.slice(i, j).some((v) => v === 1) };
      i = j;
    }
    if (!best) return null;
    const w = Math.min(best.b - best.a - 0.5, 5), mid = (best.a + best.b) / 2;   // leave a little wall at both ends
    return { a: mid - w / 2, b: mid + w / 2, sill: best.counter ? 3.7 : 0.8, head: 7.6 };
  };
  const right = find(K.GD, (p) => p.x + p.w >= K.GW, (p) => [p.y, p.y + p.d]);
  if (right) return { wall: 'right', ...right };
  const back = find(K.GW, (p) => p.y <= 0, (p) => [p.x, p.x + p.w]);
  return back ? { wall: 'back', ...back } : null;
}

function Win({ spot, place, hour, WH }) {
  const C = K.C, HU = K.HU;
  const L = daylight(hour);
  const st = { left: spot.a * C, top: WH - spot.head * HU, width: (spot.b - spot.a) * C, height: (spot.head - spot.sill) * HU };
  const cols = Math.max(2, Math.round((spot.b - spot.a) / 1.4)), rows = Math.max(2, Math.round((spot.head - spot.sill) / 1.3));
  return (
    <>
      <div className="kwin-glow" style={{ left: st.left - 30, top: st.top - 20, width: st.width + 60, height: st.height + 40, background: `radial-gradient(closest-side, rgba(${L.light[1]},${L.light[0] * 0.9}), rgba(${L.light[1]},0))` }} />
      <div className="kwin" style={st}>
        <WindowView place={place} hour={hour} />
        <div className="kwin-grid" style={{ backgroundSize: `${100 / cols}% ${100 / rows}%` }} />
      </div>
      <div className="kwin-sill" style={{ left: st.left - 4, top: st.top + st.height, width: st.width + 8 }} />
    </>
  );
}

// Which walls show depends on which way you're looking (a wall that would block the view isn't shown). Everything
// is drawn once and the kitchen's .fb / .fr classes show or hide it, so turning the view never re-draws the room.
// Like the reference render: thick white wall tops and ends, a white floor slab, tiled walls.
function Room({ room, place, pieces }) {
  const hour = useHour();
  const C = K.C, HU = K.HU, W = K.GW * C, D = K.GD * C, WH = Math.round(8.5 * HU), T = 14, CAP = 10;
  const spot = windowSpot(pieces), L = daylight(hour);
  const back = `url("${wallUrl(place, 'back', W, WH)}")`, side = `url("${wallUrl(place, 'plain', D, WH)}")`, sideBack = `url("${wallUrl(place, 'plain', W, WH)}")`;
  const cap = room.cap || '#F7F5F1', end = room.end || '#ECE9E3';
  // sunlight falling across the floor from the window
  let beam = null;
  if (spot && L.light[0] > 0.1) {
    const a = spot.a * C, b = spot.b * C, len = 5.5 * C, sl = 1.6 * C;
    const pts = spot.wall === 'right' ? `${W}px ${a}px, ${W}px ${b}px, ${W - len}px ${b + sl}px, ${W - len}px ${a + sl}px` : `${a}px 0px, ${b}px 0px, ${b + sl}px ${len}px, ${a + sl}px ${len}px`;
    beam = <div className="kbeam" style={{ width: W, height: D, clipPath: `polygon(${pts})`, background: `linear-gradient(${spot.wall === 'right' ? 'to left' : 'to bottom'}, rgba(${L.light[1]},${L.light[0]}), rgba(${L.light[1]},0) 92%)` }} />;
  }
  return (
    <>
      {/* soft shadow where the walls meet the floor */}
      {/* the soft shadow where the walls meet the floor is part of the floor's own background (see Kitchen3D) */}
      {beam}
      {(
        <div className="kwall-turn on-b" style={{ left: 0, top: -1, transform: 'rotateZ(0deg)' }}>
          <div className="kw" style={{ left: 0, top: -WH, width: W, height: WH, backgroundImage: spot?.wall === 'back' ? sideBack : back }}>
            {spot?.wall === 'back' && <Win spot={spot} place={place} hour={hour} WH={WH} />}
          </div>
        </div>
      )}
      {(
        <div className="kwall-turn on-r" style={{ left: W + 1, top: 0, transform: 'rotateZ(90deg)' }}>
          <div className="kw" style={{ left: 0, top: -WH, width: D, height: WH, backgroundImage: side }}>
            {spot?.wall === 'right' && <Win spot={spot} place={place} hour={hour} WH={WH} />}
          </div>
        </div>
      )}
      {/* thick wall tops, like a cut-away model */}
      <div className="kcap on-b" style={{ left: -CAP, top: -CAP - 1, width: W + CAP, height: CAP, transform: `translateZ(${WH}px)`, background: cap }} />
      <div className="kcap on-r" style={{ left: W + 1, top: -CAP - 1, width: CAP, height: D + CAP + 1, transform: `translateZ(${WH}px)`, background: cap }} />
      <div className="kcap on-b on-r" style={{ left: W, top: -CAP - 1, width: 1, height: CAP, transform: `translateZ(${WH}px)`, background: cap }} />
      {/* the walls' cut ends, so they read as thick slabs: the back wall's left end and the right wall's front end */}
      <div className="kend on-b" style={{ left: -CAP - WH, top: -CAP - 1, width: WH, height: CAP, transformOrigin: '100% 50%', transform: 'rotateY(90deg)', background: end }} />
      <div className="kend on-b off-r" style={{ left: W, top: -CAP - 1, width: WH, height: CAP, transformOrigin: '0 50%', transform: 'rotateY(-90deg)', background: end }} />
      <div className="kend on-r" style={{ left: W + 1, top: D - WH, width: CAP, height: WH, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', background: end }} />
      <div className="kend on-r off-b" style={{ left: W + 1, top: -CAP - 1 - WH, width: CAP, height: WH, transformOrigin: '50% 100%', transform: 'rotateX(-90deg)', background: end }} />
      {/* the floor slab's edges */}
      <div className="kslab" style={{ left: 0, top: D, width: W, height: T, transformOrigin: '50% 0', transform: 'rotateX(-90deg)', background: room.slab }} />
      <div className="kslab" style={{ left: -T, top: 0, width: T, height: D, transformOrigin: '100% 50%', transform: 'rotateY(-90deg)', background: room.slab, filter: 'brightness(.8)' }} />
      <div className="kslab off-r" style={{ left: W, top: 0, width: T, height: D, transformOrigin: '0 50%', transform: 'rotateY(90deg)', background: room.slab, filter: 'brightness(.8)' }} />
      <div className="kslab off-b" style={{ left: 0, top: -T, width: W, height: T, transformOrigin: '50% 100%', transform: 'rotateX(90deg)', background: room.slab }} />
    </>
  );
}

export default memo(Room);
