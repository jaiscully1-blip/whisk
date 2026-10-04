'use client';
import { useEffect, useRef, useState } from 'react';

const TRIGGER = 72; // px of pull needed to refresh

// Pull down from the very top of the page to reload what's on screen.
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0); pullRef.current = pull;

  useEffect(() => {
    const down = (e) => { start.current = window.scrollY <= 0 && !busy && !document.querySelector('.scrim') ? e.touches[0].clientY : null; };
    const move = (e) => {
      if (start.current == null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) { setPull(0); return; }
      setPull(Math.min(110, dy * .5));
    };
    const up = async () => {
      if (start.current == null) return; start.current = null;
      if (pullRef.current >= TRIGGER * .8) {
        setBusy(true); setPull(48);
        try { await onRefresh(); } finally { setBusy(false); setPull(0); }
      } else setPull(0);
    };
    window.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); window.removeEventListener('touchcancel', up); };
  }, [onRefresh, busy]);

  const ready = pull >= TRIGGER * .8;
  return (
    <>
      <div className="ptr" aria-live="polite" style={{ height: pull, opacity: pull ? 1 : 0 }}>
        <span className={`ptr-dot ${busy ? 'spin' : ''}`} style={{ transform: busy ? undefined : `rotate(${pull * 3}deg)` }} />
        <span className="ptr-txt">{busy ? 'Refreshing…' : !pull ? '' : ready ? 'Let go to refresh' : 'Pull to refresh'}</span>
      </div>
      {children}
    </>
  );
}
