'use client';

// "Up to" cooking times on the slider. The last stop is "Any".
export const STOPS = [15, 30, 45, 60, 90, null];
const idx = (time) => { const i = STOPS.indexOf(time === 'any' || time == null ? null : Number(time)); return i < 0 ? STOPS.length - 1 : i; };
export const timeOk = (id, minutes) => { const m = STOPS[idx(id)]; return m == null || minutes <= m; };
const label = (m) => (m == null ? 'Any time' : m < 60 ? `${m} min` : m === 60 ? '1 hr' : `${m / 60} hr`);

// An hourglass: the more time you pick, the more sand has run into the bottom ("Any" = all of it).
function Hourglass({ f }) {
  return (
    <svg className="df-glass" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <defs>
        <clipPath id="hg-top"><path d="M10.6 5c.3 5.6 4.4 7.6 4.4 11h2c0-3.4 4.1-5.4 4.4-11z" /></clipPath>
        <clipPath id="hg-bot"><path d="M15 16c0 3.4-4.1 5.4-4.4 11h10.8c-.3-5.6-4.4-7.6-4.4-11z" /></clipPath>
      </defs>
      <path d="M10 4c0 7 5 9 5 12s-5 5-5 12h12c0-7-5-9-5-12s5-5 5-12z" className="df-glass-body" />
      <g clipPath="url(#hg-top)"><rect x="9" y="5" width="14" height="11" className="df-glass-sand" style={{ transform: `scaleY(${(1 - f).toFixed(3)})` }} /></g>
      <g clipPath="url(#hg-bot)"><rect x="9" y="16" width="14" height="11" className="df-glass-sand" style={{ transform: `scaleY(${f.toFixed(3)})` }} /></g>
      {f > 0 && f < 1 && <path d="M16 16v10" className="df-glass-stream" />}
      <path d="M8 3h16M8 29h16" className="df-glass-cap" />
    </svg>
  );
}

// Use it up: a fridge wearing a life tube (back half of the ring behind it, front half in front).
const BACK = 'M4.5 18.5A11.5 4.6 0 0 1 27.5 18.5', FRONT = 'M4.5 18.5A11.5 4.6 0 0 0 27.5 18.5';
function RescueFridge() {
  return (
    <svg className="df-ring" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <path d={BACK} className="df-ring-o" /><path d={BACK} className="df-ring-w" /><path d={BACK} className="df-ring-r" strokeDasharray="5.4 5.4" />
      <rect x="10" y="2.5" width="12" height="25.5" rx="2.4" className="df-fridge" />
      <path d="M10 11h12M13 5.5v3M13 13.5v3.5M12 28v1.5M20 28v1.5" className="df-fridge-ink" />
      <path d={FRONT} className="df-ring-o" /><path d={FRONT} className="df-ring-w" /><path d={FRONT} className="df-ring-r" strokeDasharray="5.4 5.4" strokeDashoffset="2.7" />
    </svg>
  );
}

// "How long you have": a small pill with − / + steps through 15, 30, 45 min, 1 hr, 1½ hr, Any (time is 'any' or minutes as a string).
export function TimeSlider({ time = 'any', onTime }) {
  const i = idx(time), m = STOPS[i];
  const go = (n) => { const v = STOPS[Math.max(0, Math.min(STOPS.length - 1, n))]; onTime(v == null ? 'any' : String(v)); };
  return (
    <div className={`df-step ${m != null ? 'on' : ''}`} role="group" aria-label="How long you have" data-testid="time-stepper">
      <button type="button" className="df-step-b" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Shorter" data-testid="time-minus">−</button>
      <span className="df-step-mid"><Hourglass f={i / (STOPS.length - 1)} /><output data-testid="time-val" aria-live="polite">{m == null ? 'Any time' : `Up to ${label(m)}`}</output></span>
      <button type="button" className="df-step-b" onClick={() => go(i + 1)} disabled={i === STOPS.length - 1} aria-label="Longer" data-testid="time-plus">+</button>
    </div>
  );
}
export { RescueFridge };
