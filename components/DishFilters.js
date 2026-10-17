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

// Use it up: a rescue ring around a fridge.
function RescueFridge() {
  return (
    <svg className="df-ring" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
      <circle cx="16" cy="16" r="11.5" className="df-ring-w" />
      <circle cx="16" cy="16" r="11.5" className="df-ring-r" strokeDasharray="9.03 9.03" transform="rotate(-22.5 16 16)" />
      <rect x="12" y="9.5" width="8" height="13" rx="1.5" className="df-fridge" />
      <path d="M12 14.4h8M13.8 11v1.8M13.8 16.4v2.6" className="df-fridge-ink" />
    </svg>
  );
}

// Under "Discover a Dish", on one line: slide for how long you have, and a "Use it up" switch that keeps only dishes
// built around food in your pantry that goes off within 3 days.
export default function DishFilters({ time = 'any', onTime, useUp = false, onUseUp, expiring = 0 }) {
  const i = idx(time), m = STOPS[i];
  return (
    <section className="df" data-tip="dishfilters" aria-label="Filter dishes">
      <label className={`df-time ${m != null ? 'on' : ''}`}>
        <Hourglass f={i / (STOPS.length - 1)} />
        <input type="range" min="0" max={STOPS.length - 1} step="1" value={i} data-testid="time-slider"
          aria-label="How long you have" aria-valuetext={m == null ? 'Any time' : `Up to ${label(m)}`}
          style={{ '--p': `${(i / (STOPS.length - 1)) * 100}%` }}
          onChange={(e) => { const v = STOPS[Number(e.target.value)]; onTime(v == null ? 'any' : String(v)); }} />
        <output className="df-time-val" data-testid="time-val">{m == null ? 'Any' : label(m)}</output>
      </label>
      <button type="button" role="switch" aria-checked={useUp} className={`df-uiu ${useUp ? 'on' : ''}`} data-testid="use-it-up-toggle" onClick={() => onUseUp(!useUp)}
        aria-label={`Use it up${expiring ? `, ${expiring} going off soon` : ''}`}>
        <span className="df-uiu-ico"><RescueFridge /></span>
        <span className="df-uiu-txt">Use it up</span>
        {expiring > 0 && <span className="df-uiu-n" aria-hidden="true">{expiring}</span>}
      </button>
    </section>
  );
}
