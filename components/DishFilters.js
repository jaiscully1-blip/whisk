'use client';

// "Up to" cooking times on the slider. The last stop is "Any".
export const STOPS = [15, 30, 45, 60, 90, null];
const idx = (time) => { const i = STOPS.indexOf(time === 'any' || time == null ? null : Number(time)); return i < 0 ? STOPS.length - 1 : i; };
export const timeOk = (id, minutes) => { const m = STOPS[idx(id)]; return m == null || minutes <= m; };
const label = (m) => (m == null ? 'Any time' : m < 60 ? `${m} min` : m === 60 ? '1 hr' : `${m / 60} hr`);

// A small clock face whose filled wedge is the time you have (a full face for an hour or more).
function Clock({ m }) {
  const f = m == null ? 0 : Math.min(1, m / 60);
  const a = f * 2 * Math.PI, x = 12 + 9 * Math.sin(a), y = 12 - 9 * Math.cos(a);
  const wedge = f >= 1 ? <circle cx="12" cy="12" r="9" /> : f > 0 ? <path d={`M12 12 L12 3 A9 9 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`} /> : null;
  return (
    <svg className="df-clock" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" className="df-clock-face" />
      <g className="df-clock-fill">{wedge}</g>
      <path d={m == null ? 'M12 12V6M12 12l4 2' : `M12 12L${x.toFixed(2)} ${y.toFixed(2)}`} className="df-clock-hand" />
      <circle cx="12" cy="12" r="1.4" className="df-clock-pin" />
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
        <Clock m={m} />
        <input type="range" min="0" max={STOPS.length - 1} step="1" value={i} data-testid="time-slider"
          aria-label="How long you have" aria-valuetext={m == null ? 'Any time' : `Up to ${label(m)}`}
          style={{ '--p': `${(i / (STOPS.length - 1)) * 100}%` }}
          onChange={(e) => { const v = STOPS[Number(e.target.value)]; onTime(v == null ? 'any' : String(v)); }} />
        <output className="df-time-val" data-testid="time-val">{m == null ? 'Any' : label(m)}</output>
      </label>
      <button type="button" role="switch" aria-checked={useUp} className={`df-uiu ${useUp ? 'on' : ''}`} data-testid="use-it-up-toggle" onClick={() => onUseUp(!useUp)}
        aria-label={`Use it up${expiring ? `, ${expiring} going off soon` : ''}`}>
        <span className="df-uiu-track" aria-hidden="true"><span className="df-uiu-knob" /></span>
        <span className="df-uiu-txt">Use it up</span>
        {expiring > 0 && <span className="df-uiu-n" aria-hidden="true">{expiring}</span>}
      </button>
    </section>
  );
}
