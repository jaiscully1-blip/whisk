'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import Postcard from './Postcard';
import { StepTimer } from './RecipeSteps';
import { ingredientLine, stepParts } from '@/lib/recipes/scale';
import { hasBowls, prepGroups } from '@/lib/recipes/prep';

// Cook mode: the recipe, one step at a time, in big text, for messy hands. The screen stays awake while it's open.
// Tap anywhere to go on; tap the left edge (or swipe right) to go back. Page 0 is "get these ready" (every
// ingredient, measured for the servings picked); the last page has "I cooked it".
export default function CookMode({ r, factor = 1, challenge = null, onFinish, onClose }) {
  const pages = r.steps.length + 2;   // get ready, each step, then "All done"
  const [at, setAt] = useState(0);
  const touch = useRef(null);
  const go = (d) => setAt((n) => Math.max(0, Math.min(pages - 1, n + d)));

  // keep the screen awake (re-asked when the page comes back from the background)
  useEffect(() => {
    let lock = null;
    const get = async () => { try { if (!document.hidden && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); } catch {} };
    const vis = () => { if (!document.hidden) get(); };
    get(); document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); try { lock?.release(); } catch {} };
  }, []);
  useEffect(() => {
    const key = (e) => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const y = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = y; }; }, []);

  // taps on buttons/timers do their own thing; anywhere else turns the page
  const onTap = (e) => {
    if (e.target.closest('button, a, input')) return;
    const x = e.clientX / window.innerWidth;
    go(x < 0.25 ? -1 : 1);
  };
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => { const s = touch.current; touch.current = null; if (s == null) return; const dx = e.changedTouches[0].clientX - s; if (Math.abs(dx) > 60) { e.preventDefault(); go(dx > 0 ? -1 : 1); } };

  const done = at === pages - 1;
  const step = at > 0 && !done ? r.steps[at - 1] : null;
  const lastStep = at === pages - 2;
  const reward = challenge?.coins ? `${challenge.coins} coins + 50 XP for the challenge` : 'Up to +100 XP and 400 coins for your first meals of the day';
  return (
    <div className="cookmode" role="dialog" aria-modal="true" aria-label={`Cook mode: ${r.title}`}>
      <div className="cm-top">
        <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Leave cook mode"><Icon name="x" /></button>
        <div className="cm-progress" aria-hidden="true"><i style={{ width: `${(at / (pages - 1)) * 100}%` }} /></div>
        <b className="cm-count" aria-live="polite">{at === 0 ? 'Get ready' : done ? 'All done' : `Step ${at} of ${pages - 2}`}</b>
      </div>
      <div className="cm-page" onClick={onTap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {at === 0 ? (
          <div className="cm-ready">
            <h2>{r.title}</h2>
            <span className="eyebrow">Get these ready</span>
            {(hasBowls(r.ingredients) ? prepGroups(r.ingredients) : [{ id: 'all', items: r.ingredients || [] }]).map((b) => (
              <div key={b.id} className={`cm-bowl bowl-${b.id}`}>
                {b.label && <h3>{b.label} <span>{b.hint}</span></h3>}
                <ul>{b.items.map((g, i) => <li key={i}><b>{g.qty == null ? '' : ingredientLine({ ...g, item: '', note: null }, factor).trim()}</b> {g.item}</li>)}</ul>
              </div>
            ))}
          </div>
        ) : done ? (
          <div className="cm-done" data-testid="cm-done">
            <div className="cm-done-art"><Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} /></div>
            <h2>All done! 🎉</h2>
            <p className="desc">{r.title}</p>
            {onFinish && <span className="chip" style={{ alignSelf: 'center' }}>{reward}</span>}
          </div>
        ) : (
          <div className="cm-step" key={at}>
            <span className="cm-n" aria-hidden="true">{at}</span>
            <p>{stepParts(step[0], factor).map((p, k) => (p.amount ? <b key={k}>{p.text}</b> : <span key={k}>{p.text}</span>))}</p>
            {step[1] && step[1] <= 120 ? <StepTimer id={`${r.id}:${at - 1}`} minutes={step[1]} label={`${r.title} · step ${at}`} /> : null}
          </div>
        )}
      </div>
      <div className="cm-bottom">
        <button type="button" className={`btn ghost ${done ? 'cm-hide' : ''}`} onClick={() => go(-1)} disabled={at === 0} aria-label="Back a step" hidden={done}><Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} />Back</button>
        {done && !onFinish
          ? <button type="button" className="btn" onClick={onClose}>Done</button>
          : done
          ? <><button type="button" className="btn ghost" onClick={onClose} data-testid="cm-later">Post later</button><button type="button" className="btn" onClick={onFinish} data-testid="cm-post"><Icon name="camera" size={20} />Add plate photo</button></>
          : <button type="button" className="btn" onClick={() => go(1)}>{at === 0 ? 'Start cooking' : lastStep ? 'Finish' : 'Next step'}<Icon name="chevron" size={20} /></button>}
      </div>
      {!done && <span className="cm-hint" aria-hidden="true">Tap anywhere for the next step</span>}
    </div>
  );
}
