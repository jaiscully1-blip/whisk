'use client';
// The start-up screen: Yoke's chick on the icon's sage green, from the very first paint until the app is ready
// (AppShell says so with the 'yoke:ready' event once the recipes are in), then a short fade. Pages outside the
// app (login, legal) are ready as soon as they hydrate. Never stays longer than 5 s.
import { useEffect, useState } from 'react';

export default function Splash() {
  const [state, setState] = useState('on');   // on → out (fading) → gone
  useEffect(() => {
    let done = false;
    const hide = () => { if (done) return; done = true; setState('out'); setTimeout(() => setState('gone'), 380); };
    const inApp = /^\/(home|pantry|cook|compete|me|list)(\/|$)/.test(window.location.pathname);
    const fonts = document.fonts?.ready || Promise.resolve();
    const ready = inApp ? new Promise((res) => { if (window.__yokeReady) res(); else window.addEventListener('yoke:ready', res, { once: true }); }) : Promise.resolve();
    Promise.all([ready, fonts]).then(() => requestAnimationFrame(() => requestAnimationFrame(hide)));
    const cap = setTimeout(hide, 5000);
    return () => clearTimeout(cap);
  }, []);
  if (state === 'gone') return null;
  return <div className={`splash${state === 'out' ? ' out' : ''}`} aria-hidden="true"><img src="/chick.svg" alt="" width="170" height="170" /></div>;
}
