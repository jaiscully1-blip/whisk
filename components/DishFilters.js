'use client';

// "Up to" cooking times on the slider. The last stop is "Any".
export const STOPS = [15, 30, 45, 60, 90, null];
const idx = (time) => { const i = STOPS.indexOf(time === 'any' || time == null ? null : Number(time)); return i < 0 ? STOPS.length - 1 : i; };
export const timeOk = (id, minutes) => { const m = STOPS[idx(id)]; return m == null || minutes <= m; };
const label = (m) => (m == null ? 'Any time' : m < 60 ? `${m} min` : m === 60 ? '1 hr' : `${m / 60} hr`);

// An hourglass: the more time you pick, the more sand has run into the bottom ("Any" = all of it).
function Hourglass({ f }) {
  return (
    <svg className="df-glass" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
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

// "How long you have": an hourglass and a slider (time is 'any' or minutes as a string).
export function TimeSlider({ time = 'any', onTime }) {
  const i = idx(time), m = STOPS[i];
  return (
    <label className={`df-time ${m != null ? 'on' : ''}`}>
      <Hourglass f={i / (STOPS.length - 1)} />
      <input type="range" min="0" max={STOPS.length - 1} step="1" value={i} data-testid="time-slider"
        aria-label="How long you have" aria-valuetext={m == null ? 'Any time' : `Up to ${label(m)}`}
        style={{ '--p': `${(i / (STOPS.length - 1)) * 100}%` }}
        onChange={(e) => { const v = STOPS[Number(e.target.value)]; onTime(v == null ? 'any' : String(v)); }} />
      <output className="df-time-val" data-testid="time-val">{m == null ? 'Any' : label(m)}</output>
    </label>
  );
}
export { RescueFridge };
