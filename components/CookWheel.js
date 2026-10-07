'use client';
import { useEffect, useMemo, useRef } from 'react';

// The Cook Off wheel: a big arcade wheel with every recipe that fits the game's time on it, mixed easy to hard.
// It spins fast (blurred with speed), slows down, and stops with your recipe under the pointer exactly when the
// shared spin ends (`endsAt`, already corrected to this phone's clock). Drawn once as SVG, then only rotated.
const COLORS = ['#F08A6E', '#F2B84B', '#8CC56B', '#7FBFE3', '#B48ED8', '#E5808F'];
const N = 24;

export default function CookWheel({ pool, target, endsAt, onDone }) {
  const wheel = useRef(null);
  const done = useRef(false);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  const endRef = useRef(endsAt);   // fixed when the spin starts: later clock corrections must not restart it
  // 24 slices: your recipe plus a random mix of the rest (titles shortened to fit).
  const slices = useMemo(() => {
    const rest = pool.filter((r) => r.id !== target?.id).sort(() => Math.random() - 0.5).slice(0, N - 1);
    const list = [...rest]; list.splice(Math.floor(Math.random() * N), 0, target);
    return list.filter(Boolean).slice(0, N);
  }, [pool, target]);
  const n = slices.length || 1, seg = 360 / n;
  const at = Math.max(0, slices.findIndex((r) => r?.id === target?.id));

  useEffect(() => {
    if (!wheel.current || !target) return undefined;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now(), dur = Math.max(2500, endRef.current - Date.now());
    const final = 360 * (reduce ? 1 : 9) + (360 - (at * seg + seg / 2));   // that slice's middle ends under the pointer (top)
    const ease = (t) => 1 - (1 - t) ** 4;
    let raf = 0, prev = 0;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur), a = final * ease(t), v = Math.abs(a - prev); prev = a;
      wheel.current.style.transform = `rotate(${a}deg)`;
      wheel.current.style.filter = reduce ? 'none' : `blur(${Math.min(7, v / 6).toFixed(2)}px)`;
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (!done.current) { done.current = true; wheel.current.style.filter = 'none'; try { navigator.vibrate?.([30, 40, 60]); } catch {} setTimeout(() => doneRef.current?.(), 700); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target?.id, at, seg]); // eslint-disable-line react-hooks/exhaustive-deps

  const R = 190, C = 200;
  const pt = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  return (
    <div className="wheel-wrap" aria-live="polite" aria-label={target ? 'Spinning the recipe wheel' : 'Getting your recipe'}>
      <div className="wheel-pointer" aria-hidden="true" />
      <svg ref={wheel} className="wheel" viewBox="0 0 400 400" aria-hidden="true">
        {slices.map((r, i) => {
          const [x1, y1] = pt(i * seg, R), [x2, y2] = pt((i + 1) * seg, R), [tx, ty] = pt(i * seg + seg / 2, R * 0.6);
          const label = (r?.title || '').replace(/\s*\(.*?\)/g, ''); const short = label.length > 16 ? label.slice(0, 15) + '…' : label;
          return (
            <g key={i}>
              <path d={`M${C} ${C}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}z`} fill={COLORS[i % COLORS.length]} stroke="#3B2C24" strokeWidth="2" />
              <text x={tx} y={ty} transform={`rotate(${i * seg + seg / 2 - 90} ${tx} ${ty})`} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="800" fill="#2E2620">{short}</text>
            </g>
          );
        })}
        <circle cx={C} cy={C} r={R} fill="none" stroke="#3B2C24" strokeWidth="6" />
        {Array.from({ length: n }, (_, i) => { const [x, y] = pt(i * seg, R - 6); return <circle key={i} cx={x} cy={y} r="4" fill="#FFF3C4" stroke="#3B2C24" strokeWidth="1.5" />; })}
        <circle cx={C} cy={C} r="34" fill="#FFFDF8" stroke="#3B2C24" strokeWidth="5" />
        <image href="/icon.svg" x={C - 26} y={C - 26} width="52" height="52" />
      </svg>
    </div>
  );
}
