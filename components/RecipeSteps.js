'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { timerApi } from '@/lib/timers';
import { formatQty, ingredientLine, parseFactor, stepParts } from '@/lib/recipes/scale';

// The full recipe, written for a first-time cook: every ingredient measured, numbered steps that say which bowl
// or pan things go in, and a servings multiplier (type any number next to the ×) that rescales every amount.
// All of it comes from the recipe's own page (see scripts + lib/recipes/web.json); nothing is made up here.

const minLabel = (m) => (m < 1 ? `${Math.round(m * 60)} sec` : `${formatQty(m)} min`);

// Tap once to start. Double-tap quickly to stop and reset. Keeps running if you close the recipe.
export function StepTimer({ id, minutes, label }) {
  const [, force] = useState(0);
  const lastTap = useRef(0);
  useEffect(() => timerApi.subscribe(() => force((n) => n + 1)), []);
  const { end, done } = timerApi.get(id);
  const left = end ? Math.max(0, Math.ceil((end - Date.now()) / 1000)) : null;
  const tap = () => {
    const now = Date.now(); const dbl = now - lastTap.current < 380; lastTap.current = now;
    if (dbl) { timerApi.stop(id); lastTap.current = 0; return; }
    if (!end && !done) timerApi.start(id, minutes, label);
    else if (done) timerApi.stop(id);
  };
  const text = done ? 'Done!' : left === null ? minLabel(minutes) : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return <button type="button" className={`btn ghost sm timer ${end ? 'running' : ''} ${done ? 'done' : ''}`} onClick={tap} aria-label={end ? `Timer ${text} left. Double-tap to stop.` : done ? 'Timer done. Tap to reset.' : `Start a ${minLabel(minutes)} timer`}><Icon name="timer" size={16} />{text}</button>;
}

// "Serves 6  ·  [ 2 ] ×  = 12 servings". Type any number; the × stays.
export function ServingsX({ base, factor, onChange, id }) {
  const [text, setText] = useState(String(factor));
  useEffect(() => { setText(String(factor)); }, [factor]);
  const set = (v) => { setText(v); const f = parseFactor(v); if (f) onChange(f); };
  const step = (d) => { const f = Math.max(0.5, Math.min(50, Math.round((factor + d) * 2) / 2)); onChange(f); };
  return (
    <div className="servx" role="group" aria-label="Make more or less">
      <span className="servx-base">Serves {base}</span>
      <div className="servx-ctrl">
        <button type="button" className="servx-btn" onClick={() => step(-1)} aria-label="Fewer servings" disabled={factor <= 0.5}>−</button>
        <label className="servx-in"><span className="sr">Times the recipe</span>
          <input id={id} inputMode="decimal" value={text} onChange={(e) => set(e.target.value.replace(/[^\d./ ]/g, '').slice(0, 5))} onBlur={() => setText(String(factor))} aria-describedby={id + '-x'} />
          <b id={id + '-x'} aria-hidden="true">×</b>
        </label>
        <button type="button" className="servx-btn" onClick={() => step(1)} aria-label="More servings">+</button>
      </div>
      <span className="servx-total">{factor === 1 ? 'as written' : `= ${formatQty(base * factor)} servings`}</span>
    </div>
  );
}

// Every ingredient with its measurement, grouped like the recipe page ("For the sauce" …).
export function IngredientList({ r, factor = 1, missing = [] }) {
  const list = r.ingredients || [];
  if (!list.length) return null;
  const groups = []; for (const g of list) { const k = g.group || ''; let grp = groups.find((x) => x.k === k); if (!grp) groups.push(grp = { k, items: [] }); grp.items.push(g); }
  const miss = missing.map((m) => m.toLowerCase());
  return (
    <div className="stack ing-list" style={{ gap: 10 }}>
      {groups.map((grp) => (
        <div key={grp.k || '_'}>
          {grp.k && <span className="eyebrow">{grp.k}</span>}
          <ul>{grp.items.map((g, i) => { const it = g.item.toLowerCase().trim(); const need = miss.some((m) => m === it || (m.length > 3 && it === `${m}s`)); return (
            <li key={i} className={need ? 'need' : ''}><span className="ing-q">{g.qty == null ? '' : ingredientLine({ ...g, item: '', note: null }, factor).trim()}</span><span>{g.item}{g.note ? <span className="muted">, {g.note}</span> : null}</span></li>
          ); })}</ul>
        </div>
      ))}
    </div>
  );
}

// Numbered steps. Measured amounts are bold and follow the multiplier.
export function StepList({ r, factor = 1, timers = true, compact = false }) {
  return (
    <ol className={`steps ${compact ? 'compact' : ''}`}>
      {r.steps.map(([text, mins], i) => (
        <li key={i}>
          <span className="step-n" aria-hidden="true">{i + 1}</span>
          <div className="step-body">
            <p>{stepParts(text, factor).map((p, k) => (p.amount ? <b key={k} className="amt">{p.text}</b> : <span key={k}>{p.text}</span>))}</p>
            {timers && mins ? (mins <= 120 ? <StepTimer id={`${r.id}:${i}`} minutes={mins} label={`${r.title} · step ${i + 1}`} /> : <span className="chip">{formatQty(mins / 60)} hr</span>) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
