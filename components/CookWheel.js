'use client';
import { useEffect, useMemo, useRef } from 'react';

// The Cook Off wheel, arcade style (like the "Big Bass Wheel"): a drum of painted wooden planks that fills the whole
// screen, bursting out of the phone toward you when the game starts, a recipe on every plank, two arrows at the middle. It rolls fast (motion-blurred
// up and down), slows, and stops with your recipe between the arrows exactly when the shared spin ends (`endsAt`).
// Real 3D: each plank sits on a cylinder (CSS 3D); only the drum's angle changes per frame.
const WOOD = [['#5E9BD1', '#4C86BB'], ['#F2A65A', '#E08C3E'], ['#5E9BD1', '#4C86BB'], ['#F2A65A', '#E08C3E'], ['#8CC56B', '#73AD54'], ['#F2A65A', '#E08C3E']];
const BADGE = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#2E9E4F', '#B14FC5'];
const N = 24, STEP = 360 / N, H = 150;
const R = Math.round(H / 2 / Math.tan(Math.PI / N));   // drum radius so the planks meet edge to edge

export default function CookWheel({ pool, target, endsAt, onDone }) {
  const drum = useRef(null);
  const blur = useRef(null);
  const done = useRef(false);
  const doneRef = useRef(onDone); doneRef.current = onDone;
  const endRef = useRef(endsAt);   // fixed when the spin starts: later clock corrections must not restart it
  const planks = useMemo(() => {
    const rest = pool.filter((r) => r.id !== target?.id).sort(() => Math.random() - 0.5).slice(0, N - 1);
    const list = [...rest]; list.splice(Math.floor(Math.random() * N), 0, target);
    return list.filter(Boolean).slice(0, N);
  }, [pool, target]);
  const at = Math.max(0, planks.findIndex((r) => r?.id === target?.id));

  useEffect(() => {
    if (!drum.current || !target) return undefined;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now(), dur = Math.max(2500, endRef.current - Date.now());
    const final = 360 * (reduce ? 1 : 7) + at * STEP;   // your plank ends facing you
    const ease = (t) => 1 - (1 - t) ** 4;
    let raf = 0, prev = 0;
    const frame = (now) => {
      const t = Math.min(1, (now - start) / dur), a = final * ease(t), v = Math.abs(a - prev); prev = a;
      drum.current.style.transform = `translateZ(${-R}px) rotateX(${a}deg)`;
      if (blur.current) blur.current.setAttribute('stdDeviation', reduce ? '0 0' : `0 ${Math.min(14, v * 1.4).toFixed(2)}`);
      if (t < 1) raf = requestAnimationFrame(frame);
      else if (!done.current) { done.current = true; blur.current?.setAttribute('stdDeviation', '0 0'); try { navigator.vibrate?.([30, 40, 90]); } catch {} setTimeout(() => doneRef.current?.(), 900); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target?.id, at]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bw" aria-live="polite" aria-label={target ? 'Spinning the recipe wheel' : 'Getting your recipe'}>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><filter id="bw-blur" x="0" y="-20%" width="100%" height="140%"><feGaussianBlur ref={blur} stdDeviation="0 0" /></filter></svg>
      <div className="bw-cab">
        <div className="bw-window">
          <div className="bw-blur">
            <div className="bw-drum" ref={drum} style={{ transform: `translateZ(${-R}px)` }}>
              {planks.map((r, i) => {
                const [w1, w2] = WOOD[i % WOOD.length], badge = BADGE[i % BADGE.length], dark = badge !== '#FFFFFF';
                const title = (r?.title || '').replace(/\s*\(.*?\)/g, '').trim();
                return (
                  <div key={i} className="bw-plank" style={{ transform: `rotateX(${-i * STEP}deg) translateZ(${R}px)`, '--w1': w1, '--w2': w2 }} aria-hidden="true">
                    <span className="bw-badge" style={{ background: badge, color: dark ? '#FFFFFF' : '#2E2620' }}>
                      <b>{title.length > 34 ? title.slice(0, 33) + '…' : title}</b>
                      <small>{r?.minutes} MIN</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bw-glass" aria-hidden="true" />
        </div>
        <span className="bw-arrow l" aria-hidden="true" /><span className="bw-arrow r" aria-hidden="true" />
      </div>
    </div>
  );
}
export const PLANK_HEIGHT = H;
