'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TIPS } from '@/lib/tips';

// Chef explains a feature the first time you tap it. Never blocks the tap: the thing you tapped still happens,
// and the tip drops in at the top of the screen (clear of buttons, the tab dock and the keyboard) for a few seconds.
export default function Tips({ seen, onSeen, welcome }) {
  const [tip, setTip] = useState(null);
  const seenRef = useRef(new Set(seen || [])); seenRef.current = new Set([...seenRef.current, ...(seen || [])]);
  const show = useCallback((id) => {
    if (!TIPS[id] || seenRef.current.has(id)) return;
    seenRef.current.add(id); setTip(id); onSeen(id);
  }, [onSeen]);

  useEffect(() => { if (welcome) { const t = setTimeout(() => show('welcome'), 600); return () => clearTimeout(t); } }, [welcome, show]);
  useEffect(() => {
    const on = (e) => {
      const el = e.target.closest?.('[data-tip]'); if (!el) return;
      if (el.closest('.tip-card')) return;
      show(el.dataset.tip);
    };
    document.addEventListener('click', on, true);
    return () => document.removeEventListener('click', on, true);
  }, [show]);

  // Out of the way fast: it leaves on its own after a few seconds, or as soon as you tap anything else.
  useEffect(() => {
    if (!tip) return undefined;
    const t = setTimeout(() => setTip(null), 12000);
    const away = (e) => { if (!e.target.closest?.('.tip-card')) setTip(null); };   // the tap that opened it came before
    document.addEventListener('pointerdown', away, true);
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', away, true); };
  }, [tip]);

  if (!tip) return null;
  const [title, text] = TIPS[tip];
  return (
    <div className="tip-card" role="status" aria-live="polite" key={tip}>
      <img src="/icon.svg" alt="" width="44" height="44" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <button type="button" className="tip-ok" onClick={() => setTip(null)}>Got it</button>
    </div>
  );
}
