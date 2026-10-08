'use client';
import { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoCentroid, geoArea, geoCircle, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import ISO from '@/lib/world/iso.json';
import { countryArt, teamColors, COUNTRY_NAME, TINY } from '@/lib/world/flair';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';
import Icon from './Icon';

// A desk globe of every country, unnamed and grey, standing on a brass stand. Swipe left/right to spin it (it keeps
// turning, then slows down). While it's spinning you can throw a dart: it flies in and sticks in a country (1 throw in
// 10,000 misses the globe). Countries you've cooked from fill in: Bronze (1 dish), Silver (3), Gold (5: done, and the
// country is painted with its team colours, food and culture). Zoom is kept tight (pinch, or the − / + buttons).
const W = 360, H = 430, CX = 180, CY = 182, R = 142, TILT = 23.5, PHI = -12;
export const GLOBE_ZOOM = [0.85, 1.5];
const SPIN = 0.045;              // deg/ms: faster than this counts as "spinning" (the dart button wakes up)
const DRIFT = 0.006;             // the slow idle turn
const tierOf = (n, done) => (done || n >= 5 ? 'gold' : n >= 3 ? 'silver' : n >= 1 ? 'bronze' : '');
const FILL = { '': '#A7ADB4', bronze: '#CD8A4A', silver: '#E3E8EE' };
const rnd = () => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch { return Math.random(); } };
const ease = (t) => 1 - Math.pow(1 - t, 3);

let WORLD = null;   // countries, loaded once (world-atlas 110m, about 100 KB)
async function loadWorld() {
  if (WORLD) return WORLD;
  const topo = (await import('world-atlas/countries-110m.json')).default;
  const fc = feature(topo, topo.objects.countries).features;
  const list = fc.map((f) => {
    const iso = ISO.num[f.id] || ISO.num[String(+f.id)] || (f.properties?.name === 'Kosovo' ? 'XK' : null);
    let main = f;
    if (f.geometry.type === 'MultiPolygon') {   // the biggest piece (France without French Guiana, the US without Alaska)
      let best = -1;
      for (const coords of f.geometry.coordinates) { const g = { type: 'Polygon', coordinates: coords }; const a = geoArea(g); if (a > best) { best = a; main = g; } }
    }
    return { iso, f, center: geoCentroid(main) };
  });
  for (const [iso, c] of Object.entries(TINY)) list.push({ iso, tiny: true, f: { type: 'Feature', geometry: geoCircle().center(c).radius(1.1)() }, center: c });
  WORLD = list; return list;
}

export default function Globe({ counts = new Map(), done = new Set(), onCook }) {
  const [world, setWorld] = useState(WORLD);
  const [zoom, setZoom] = useState(1);
  const [spinning, setSpinning] = useState(false);
  const [phase, setPhase] = useState('idle');     // idle | aim | done
  const [result, setResult] = useState(null);     // { iso, name } | { miss: true }
  const svg = useRef(null);
  const els = useRef({});                           // index → { path, clip, art, edge }
  const st = useRef({ lam: -20, vel: 0.12, drag: null, aim: null, dart: null, zoom: 1, pins: new Map(), run: true });
  st.current.zoom = zoom;

  useEffect(() => { let on = true; loadWorld().then((w) => { if (on) setWorld(w); }); return () => { on = false; }; }, []);

  // the animation loop: spin, slow down, aim, fly the dart
  useEffect(() => {
    if (!world) return undefined;
    const s = st.current;
    const proj = geoOrthographic().translate([CX, CY]).scale(R).clipAngle(90).precision(0.6);
    const path = geoPath(proj), grat = geoGraticule10();
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = performance.now(), wasSpin = false;
    const tiltPt = ([x, y]) => { const a = TILT * Math.PI / 180, dx = x - CX, dy = y - CY; return [CX + dx * Math.cos(a) - dy * Math.sin(a), CY + dx * Math.sin(a) + dy * Math.cos(a)]; };
    function frame(now) {
      const dt = Math.min(50, now - last); last = now;
      if (s.aim) {
        const t = Math.min(1, (now - s.aim.t0) / s.aim.ms);
        s.lam = s.aim.from + s.aim.by * ease(t);
        if (t >= 1) { const a = s.aim; s.aim = null; s.vel = 0; a.end(); }
      } else if (!s.drag) {
        s.lam += s.vel * dt;
        s.vel *= Math.pow(0.9975, dt);
        if (!reduce && Math.abs(s.vel) < DRIFT) s.vel = (s.vel >= 0 ? 1 : -1) * DRIFT;
        if (reduce && Math.abs(s.vel) < 0.002) s.vel = 0;
      }
      const spinNow = !s.aim && (s.drag ? Math.abs(s.dragVel || 0) > SPIN : Math.abs(s.vel) > SPIN);
      if (spinNow !== wasSpin) { wasSpin = spinNow; setSpinning(spinNow); }
      proj.rotate([s.lam, PHI, 0]);
      const g = svg.current; if (!g) { raf = requestAnimationFrame(frame); return; }
      const gp = els.current.grat; if (gp) gp.setAttribute('d', path(grat) || '');
      world.forEach((c, i) => {
        const e = els.current[i]; if (!e?.path) return;
        const d = path(c.f) || '';
        e.path.setAttribute('d', d);
        if (e.clip) {
          e.clip.setAttribute('d', d);
          if (d) {
            const [[x0, y0], [x1, y1]] = path.bounds(c.f), size = Math.max(x1 - x0, y1 - y0, 1);
            e.art.setAttribute('transform', `translate(${(x0 + x1) / 2 - size / 2} ${(y0 + y1) / 2 - size / 2}) scale(${size / 200})`);
            e.art.style.display = '';
          } else e.art.style.display = 'none';
        }
      });
      // the dart: flying in, or stuck in the country (it turns away with the globe)
      const dart = els.current.dart, D = s.dart;
      if (dart && D) {
        const front = geoDistance(D.at, [-s.lam, -PHI]) < Math.PI / 2 - 0.05;
        const [tx, ty] = D.miss ? D.to : tiltPt(proj(D.at));
        const t = Math.min(1, (now - D.t0) / 420);
        let x = tx, y = ty, k = 1, op = 1;
        if (t < 1) { const e2 = ease(t); x = D.from[0] + (tx - D.from[0]) * e2; y = D.from[1] + (ty - D.from[1]) * e2; k = 2.4 - 1.4 * e2; }
        else if (D.miss) { const u = Math.min(1, (now - D.t0 - 420) / 500); x = tx - 160 * u; y = ty + 60 * u; op = 1 - u; }
        else if (!D.landed) { D.landed = now; }
        const wob = D.landed ? Math.sin((now - D.landed) / 40) * 6 * Math.max(0, 1 - (now - D.landed) / 500) : 0;
        dart.setAttribute('transform', `translate(${x} ${y}) rotate(${wob}) scale(${k})`);
        dart.style.opacity = !D.miss && t >= 1 && !front ? 0 : op;
      } else if (dart) dart.style.opacity = 0;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    // stop drawing when it's off screen or the app is in the background
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } });
    if (svg.current) io.observe(svg.current);
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    document.addEventListener('visibilitychange', vis);
    return () => { cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, [world]);

  // swipe left/right to spin; two fingers pinch to zoom (kept tight)
  const fingers = useRef(new Map());
  const down = (e) => {
    const s = st.current; if (s.aim) return;
    fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    if (fingers.current.size === 2) { const [a, b] = [...fingers.current.values()]; s.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: s.zoom }; s.drag = null; return; }
    s.drag = { x: e.clientX, lam0: s.lam, t: performance.now(), lx: e.clientX }; s.dragVel = 0;
  };
  const move = (e) => {
    const s = st.current;
    if (fingers.current.has(e.pointerId)) fingers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pinch && fingers.current.size >= 2) { const [a, b] = [...fingers.current.values()]; setZoom(Math.min(GLOBE_ZOOM[1], Math.max(GLOBE_ZOOM[0], s.pinch.z0 * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / s.pinch.d0))); return; }
    const d = s.drag; if (!d) return;
    const k = 0.45 / s.zoom, now = performance.now();
    s.lam = d.lam0 + (e.clientX - d.x) * k;     // swipe right → the globe turns right
    const dtm = Math.max(1, now - d.t);
    s.dragVel = 0.6 * ((e.clientX - d.lx) * k / dtm) + 0.4 * (s.dragVel || 0);
    d.t = now; d.lx = e.clientX;
  };
  const up = (e) => {
    const s = st.current; fingers.current.delete(e.pointerId);
    if (s.pinch) { if (fingers.current.size < 2) s.pinch = null; return; }
    if (!s.drag) return;
    if (performance.now() - s.drag.t > 120) s.dragVel = 0;   // held still before letting go: no fling
    s.vel = Math.max(-1.4, Math.min(1.4, s.dragVel || 0)); s.drag = null;
  };
  const key = (e) => { const s = st.current; if (s.aim) return; if (e.key === 'ArrowRight') { s.vel += 0.25; e.preventDefault(); } if (e.key === 'ArrowLeft') { s.vel -= 0.25; e.preventDefault(); } };
  const ctrlWheel = useRef(null);
  useEffect(() => {
    const el = svg.current; if (!el) return undefined;
    const onWheel = (e) => { if (!e.ctrlKey) return; e.preventDefault(); setZoom((z) => Math.min(GLOBE_ZOOM[1], Math.max(GLOBE_ZOOM[0], z * Math.exp(-e.deltaY * 0.01)))); };
    ctrlWheel.current = onWheel; el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function throwDart() {
    const s = st.current; if (!world || s.aim || !spinning) return;
    setResult(null); setPhase('aim'); navigator.vibrate?.(10);
    const miss = rnd() < 1 / 10000;
    const pool = world.filter((c) => c.iso && COUNTRY_NAME[c.iso]);
    const hit = pool[Math.floor(rnd() * pool.length)];
    const dir = s.vel >= 0 ? 1 : -1, target = -hit.center[0];
    let by = (((target - s.lam) * dir) % 360 + 360) % 360; by = dir * (by + 360);
    const ms = 1700;
    s.aim = { t0: performance.now(), from: s.lam, by, ms, end: () => {} };
    // the dart leaves just before the globe stops, so it lands as it settles
    setTimeout(() => {
      s.dart = { at: hit.center, miss, from: [W + 60, -90], to: [CX - R - 30, CY - 20], t0: performance.now(), landed: 0 };
    }, ms - 420);
    setTimeout(() => {
      setPhase('done'); navigator.vibrate?.(miss ? [20, 40, 20] : 25);
      setResult(miss ? { miss: true } : { iso: hit.iso, name: COUNTRY_NAME[hit.iso], dish: COUNTRY_BY_ISO[hit.iso]?.[2] });
    }, ms + 60);
  }

  const cooked = world ? world.filter((c) => c.iso && (done.has(c.iso) || counts.get(c.iso))) : [];
  const ringA = TILT * Math.PI / 180, RR = R + 10;
  const ringBottom = [CX - Math.sin(ringA) * RR, CY + Math.cos(ringA) * RR];
  return (
    <div className="globe">
      <div className="globe-box">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="globe-svg" role="img" tabIndex={0}
          aria-label={`Globe. Swipe to spin. ${cooked.length} countries cooked from.`}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
          <defs>
            <radialGradient id="gl-sea" cx="42%" cy="36%" r="70%"><stop offset="0" stopColor="#EEF3F7" /><stop offset="1" stopColor="#C9D5DE" /></radialGradient>
            <radialGradient id="gl-shade" cx="36%" cy="30%" r="75%"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /><stop offset=".8" stopColor="#1B2430" stopOpacity=".12" /><stop offset="1" stopColor="#1B2430" stopOpacity=".42" /></radialGradient>
            <linearGradient id="gl-brass" x1="0" x2="1"><stop offset="0" stopColor="#8A6420" /><stop offset=".45" stopColor="#F2CF6B" /><stop offset="1" stopColor="#8A6420" /></linearGradient>
            <linearGradient id="gl-wood" x2="0" y2="1"><stop offset="0" stopColor="#8E5D34" /><stop offset="1" stopColor="#5A3A20" /></linearGradient>
          </defs>
          <g transform={`translate(${CX} ${CY}) scale(${zoom}) translate(${-CX} ${-CY})`}>
            {/* the stand */}
            <ellipse cx={CX} cy={H - 26} rx={74} ry={14} fill="rgba(0,0,0,.14)" />
            <path d={`M${CX - 62} ${H - 34}q62 -26 124 0v10q-62 22 -124 0z`} fill="url(#gl-wood)" stroke="#3B2C24" strokeWidth="2" strokeLinejoin="round" />
            <path d={`M${ringBottom[0] - 7} ${ringBottom[1]}L${CX - 9} ${H - 46}h18L${ringBottom[0] + 7} ${ringBottom[1]}z`} fill="url(#gl-brass)" stroke="#3B2C24" strokeWidth="2" strokeLinejoin="round" />
            <g transform={`rotate(${TILT} ${CX} ${CY})`}>
              <circle cx={CX} cy={CY} r={R} fill="url(#gl-sea)" />
              <path ref={(el) => { els.current.grat = el; }} fill="none" stroke="#B4C2CD" strokeWidth=".6" />
              {world && world.map((c, i) => {
                const n = c.iso ? counts.get(c.iso) || 0 : 0, tier = tierOf(n, c.iso && done.has(c.iso));
                if (tier === 'gold') {
                  const cols = teamColors(c.iso);
                  return (
                    <g key={i} className="gl-gold">
                      <clipPath id={`gl-c${i}`}><path ref={(el) => { els.current[i] = { ...(els.current[i] || {}), clip: el }; }} /></clipPath>
                      <g clipPath={`url(#gl-c${i})`}><g ref={(el) => { els.current[i] = { ...(els.current[i] || {}), art: el }; }} dangerouslySetInnerHTML={{ __html: countryArt(c.iso, c.center[1], c.center[0]) }} /></g>
                      <path ref={(el) => { els.current[i] = { ...(els.current[i] || {}), path: el }; }} fill="none" stroke={cols[0] === '#FFFFFF' ? '#E0A93B' : '#E0A93B'} strokeWidth="1.6" strokeLinejoin="round" />
                    </g>
                  );
                }
                return <path key={i} ref={(el) => { els.current[i] = { path: el }; }} className={`gl-c ${tier}`} fill={FILL[tier]} stroke={tier === 'silver' ? '#8E99A4' : '#F3F5F7'} strokeWidth={tier ? 0.9 : 0.5} strokeLinejoin="round" />;
              })}
              <circle cx={CX} cy={CY} r={R} fill="url(#gl-shade)" pointerEvents="none" />
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3B2C24" strokeWidth="2" />
              {/* the brass half-ring that holds it, and the pole pins */}
              <path d={`M${CX} ${CY - RR}A${RR} ${RR} 0 0 0 ${CX} ${CY + RR}`} fill="none" stroke="#3B2C24" strokeWidth="9" strokeLinecap="round" />
              <path d={`M${CX} ${CY - RR}A${RR} ${RR} 0 0 0 ${CX} ${CY + RR}`} fill="none" stroke="url(#gl-brass)" strokeWidth="6" strokeLinecap="round" />
              <circle cx={CX} cy={CY - RR} r="5" fill="#F2CF6B" stroke="#3B2C24" strokeWidth="1.6" />
              <circle cx={CX} cy={CY + RR} r="5" fill="#F2CF6B" stroke="#3B2C24" strokeWidth="1.6" />
            </g>
            {/* the dart (drawn pointing in, tail toward you) */}
            <g ref={(el) => { els.current.dart = el; }} style={{ opacity: 0 }} pointerEvents="none">
              <path d="M0 0l20 -22" stroke="#3B2C24" strokeWidth="5" strokeLinecap="round" />
              <path d="M0 0l20 -22" stroke="#C9CDD2" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M14 -16l14 -15" stroke="#3B2C24" strokeWidth="8" strokeLinecap="round" />
              <path d="M14 -16l14 -15" stroke="#E5392B" strokeWidth="5" strokeLinecap="round" />
              <path d="M26 -28l6 -16 6 6zM26 -28l16 -6 -6 -6z" fill="#FFD166" stroke="#3B2C24" strokeWidth="1.6" strokeLinejoin="round" />
              <circle r="2.6" fill="#3B2C24" />
            </g>
          </g>
          {!world && <text x={CX} y={CY} textAnchor="middle" fill="#6B7680" fontSize="14" fontWeight="700">Loading the world…</text>}
        </svg>
        <div className="globe-zoom">
          <button type="button" className="kd-round" onClick={() => setZoom((z) => Math.min(GLOBE_ZOOM[1], +(z + 0.15).toFixed(2)))} disabled={zoom >= GLOBE_ZOOM[1]} aria-label="Zoom in"><Icon name="plus" size={18} /></button>
          <button type="button" className="kd-round" onClick={() => setZoom((z) => Math.max(GLOBE_ZOOM[0], +(z - 0.15).toFixed(2)))} disabled={zoom <= GLOBE_ZOOM[0]} aria-label="Zoom out"><b style={{ fontSize: 22, lineHeight: 1 }}>−</b></button>
        </div>
        <span className="globe-hint">{phase === 'aim' ? 'Here it comes…' : spinning ? 'It’s spinning: throw!' : 'Swipe to spin'}</span>
      </div>
      <button type="button" className={`btn wide globe-throw ${spinning && phase !== 'aim' ? 'ready' : ''}`} onClick={throwDart} disabled={!world || !spinning || phase === 'aim'}
        aria-label={spinning ? 'Throw a dart' : 'Throw a dart (spin the globe first)'}>
        <Icon name="dart" size={20} />{phase === 'aim' ? 'Throwing…' : spinning ? 'Throw a dart' : 'Spin it to throw'}
      </button>
      {result && (
        <div className={`card globe-hit ${result.miss ? 'miss' : ''}`} role="status">
          {result.miss ? (
            <><b>Missed the whole globe!</b><span className="desc">That happens once in 10,000 throws. Spin it and try again.</span></>
          ) : (
            <>
              <span className="globe-flagbar" aria-hidden="true">{teamColors(result.iso).slice(0, 4).map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{result.name}!</b>
                <span className="desc" style={{ display: 'block' }}>{(counts.get(result.iso) || 0) ? `${counts.get(result.iso)} of 5 dishes cooked` : `Cook something from ${result.name}`}{result.dish ? ` · try ${result.dish}` : ''}</span>
              </div>
              <button type="button" className="btn sm" onClick={() => onCook?.(result)}>Cook it</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
