'use client';
import Icon from './Icon';

export const TIMES = [
  { id: '15', label: '15 min', name: 'Up to 15 minutes', test: (m) => m <= 15 },
  { id: '30', label: '30 min', name: 'Up to 30 minutes', test: (m) => m <= 30 },
  { id: '60', label: '1 hr+', name: 'An hour or more', test: (m) => m >= 60 },
];
export const timeOk = (id, minutes) => { const t = TIMES.find((x) => x.id === id); return !t || t.test(minutes); };

// Under "Discover a Dish": how long you have (tap again to clear) and a "Use it up" switch that keeps only dishes
// built around food in your pantry that goes off within 3 days.
export default function DishFilters({ time = 'any', onTime, useUp = false, onUseUp, expiring = 0 }) {
  return (
    <section className="df" data-tip="dishfilters" aria-label="Filter dishes">
      <div className="df-times" role="group" aria-label="How long you have">
        {TIMES.map((t) => (
          <button key={t.id} type="button" className={`df-time ${time === t.id ? 'on' : ''}`} aria-pressed={time === t.id} aria-label={t.name} onClick={() => onTime(time === t.id ? 'any' : t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <button type="button" role="switch" aria-checked={useUp} className={`df-uiu ${useUp ? 'on' : ''}`} data-testid="use-it-up-toggle" onClick={() => onUseUp(!useUp)}>
        <span className="df-uiu-track" aria-hidden="true"><span className="df-uiu-knob"><Icon name="timer" size={14} /></span></span>
        <span className="df-uiu-txt"><b>Use it up</b><small>{expiring ? `${expiring} going off soon` : 'Nothing going off'}</small></span>
      </button>
    </section>
  );
}
