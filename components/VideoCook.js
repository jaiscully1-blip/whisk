'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// Cook along with a video: the player on top, starting where the cooking starts (from the video's chapters), and under
// it one step at a time with big Back / Next buttons, so you barely touch the screen with messy hands. When the steps
// come from chapters, they follow the video by themselves. The screen stays awake while this is open.
const ORIGIN = 'https://www.youtube-nocookie.com';
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function VideoCook({ video: v, onClose }) {
  const r = v.recipe || { steps: [], ingredients: [], chapters: [], cookStart: 0 };
  const steps = r.steps || [];
  const [i, setI] = useState(0);
  const [showIng, setShowIng] = useState(false);
  const frame = useRef(null);
  const manualAt = useRef(0);
  const timed = steps.length > 0 && steps.every((s) => s.t != null);
  const src = `${ORIGIN}/embed/${v.id}?playsinline=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}${r.cookStart ? `&start=${r.cookStart}` : ''}${r.cookEnd ? `&end=${r.cookEnd}` : ''}`;

  const send = (func, args = []) => { try { frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN); } catch {} };
  const go = (n, seek = true) => {
    const k = Math.max(0, Math.min(steps.length - 1, n)); setI(k); manualAt.current = Date.now();
    if (seek && timed) send('seekTo', [steps[k].t, true]);
  };

  // Steps from chapters follow the video: listen for the player's time (it posts it when asked to "listen").
  useEffect(() => {
    if (!timed) return undefined;
    const onMsg = (e) => {
      if (e.origin !== ORIGIN || typeof e.data !== 'string') return;
      let d; try { d = JSON.parse(e.data); } catch { return; }
      const t = d?.info?.currentTime; if (typeof t !== 'number') return;
      if (Date.now() - manualAt.current < 6000) return;   // you just picked a step yourself: let the video catch up
      let k = 0; steps.forEach((s, j) => { if (t + .5 >= s.t) k = j; }); setI(k);
    };
    window.addEventListener('message', onMsg);
    const hello = setInterval(() => { try { frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'whisk' }), ORIGIN); } catch {} }, 1500);
    return () => { window.removeEventListener('message', onMsg); clearInterval(hello); };
  }, [timed, steps]);

  // Keep the screen on while cooking along (where the phone allows it).
  useEffect(() => {
    let lock = null; let gone = false;
    const get = async () => { try { if (!document.hidden && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); } catch {} };
    get(); const vis = () => { if (!document.hidden && !gone) get(); };
    document.addEventListener('visibilitychange', vis);
    return () => { gone = true; document.removeEventListener('visibilitychange', vis); try { lock?.release(); } catch {} };
  }, []);
  // Swipe left / right on the step card.
  const sx = useRef(null);

  const step = steps[i];
  return (
    <div className="scrim vc-scrim" role="presentation">
      <div className="vc" role="dialog" aria-modal="true" aria-label={`Cook along: ${v.title}`}>
        <div className="vc-top">
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
          <b className="vc-title">{v.title}</b>
        </div>
        <div className="vc-player"><iframe ref={frame} src={src} title={v.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>
        {r.cookStart > 0 && <p className="desc vc-note">Starts at {fmtT(r.cookStart)}, where the cooking begins.</p>}

        {steps.length ? (
          <div className="vc-step card" onTouchStart={(e) => { sx.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (sx.current == null) return; const dx = e.changedTouches[0].clientX - sx.current; sx.current = null; if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); }} aria-live="polite">
            <span className="vc-count">Step {i + 1} of {steps.length}{step?.t != null ? ` · ${fmtT(step.t)}` : ''}</span>
            <p className="vc-text">{step?.text}</p>
            <div className="vc-btns">
              <button type="button" className="btn ghost" onClick={() => go(i - 1)} disabled={i === 0}>Back</button>
              <button type="button" className="btn" onClick={() => go(i + 1)} disabled={i === steps.length - 1}>Next</button>
            </div>
          </div>
        ) : (
          <div className="empty"><b>No written steps for this one</b>The YouTuber didn’t put the recipe or chapters in the description, so just watch along.</div>
        )}

        {r.ingredients?.length > 0 && (
          <div className="card stack" style={{ gap: 8 }}>
            <button type="button" className="row vc-ing-h" onClick={() => setShowIng((x) => !x)} aria-expanded={showIng}><b style={{ flex: 1 }}>Ingredients ({r.ingredients.length})</b><Icon name="chevron" style={{ transform: showIng ? 'rotate(-90deg)' : 'rotate(90deg)' }} /></button>
            {showIng && <ul className="vc-ing">{r.ingredients.map((g, k) => <li key={k}>{g.group && (k === 0 || r.ingredients[k - 1].group !== g.group) ? <span className="eyebrow" style={{ display: 'block', marginTop: 6 }}>{g.group}</span> : null}{g.text}</li>)}</ul>}
          </div>
        )}
        {r.link && <a className="btn ghost wide" href={r.link} target="_blank" rel="noopener noreferrer nofollow"><Icon name="link" size={16} />Full written recipe</a>}
        <p className="desc" style={{ margin: 0 }}>{r.stepsFrom === 'chapters' ? 'Steps come from the video’s chapters and follow along as it plays.' : r.stepsFrom === 'description' ? 'Steps and ingredients come from the video’s description, as the YouTuber wrote them.' : ''}</p>
      </div>
    </div>
  );
}
