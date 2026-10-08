'use client';
import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { PLACES, placeUrl } from '@/lib/art/tampa';

// Confetti + a short three-note chime. Sound only plays because a level-up always follows a tap (browsers allow audio then).
function chime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ac = new Ctx(); const now = ac.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * .11); g.gain.linearRampToValueAtTime(.18, now + i * .11 + .02); g.gain.exponentialRampToValueAtTime(.001, now + i * .11 + .45);
      o.connect(g).connect(ac.destination); o.start(now + i * .11); o.stop(now + i * .11 + .5);
    });
    setTimeout(() => ac.close(), 1500);
  } catch {}
}

export default function LevelUp({ level, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    chime();
    if (reduce) return;
    const c = ref.current, ctx = c.getContext('2d');
    const resize = () => { c.width = innerWidth; c.height = innerHeight; }; resize();
    const colors = ['#4E9A2F', '#8FD46A', '#F4B740', '#FF6B57', '#3D7BFF', '#B38AF0'];
    const bits = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)] }));
    let raf, t0 = performance.now();
    const tick = (t) => {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((b) => { b.vy += .35; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.r += b.vr; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore(); });
      if (t - t0 < 3200) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="popup-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <canvas ref={ref} aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div className="popup" role="dialog" aria-modal="true" aria-label={`Level up: level ${level.level}`}>
        <button className="x" type="button" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        <span className="eyebrow">Level up!</span>
        <div style={{ width: 96, height: 96, borderRadius: 28, background: 'var(--accent)', color: 'var(--btn-ink)', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 48, margin: '6px 0' }}>{level.level}</div>
        <h2>{level.title}</h2>
        {(() => { const moved = PLACES.find((p) => p.from === level.level); return moved ? (
          <div className="lvl-move">
            <img src={placeUrl(moved.key)} alt="" width="240" height="144" />
            <b>New kitchen: {moved.name}</b><span className="desc">{moved.where} · {moved.blurb}</span>
          </div>
        ) : null; })()}
      </div>
    </div>
  );
}
