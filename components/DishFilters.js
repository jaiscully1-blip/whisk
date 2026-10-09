'use client';
import { PRICE_TIERS, LEVELS } from '@/lib/recipes/cost';

const Flame = ({ on }) => (
  <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" className={`df-flame ${on ? 'on' : ''}`}>
    <path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 12.5C7 10 8.5 8.6 9.5 7.5c.3 1.8 1.2 2.7 2 3C11 8 11 5 12 2z" />
  </svg>
);

// Under "Discover a Dish", one slim row: little price tags on a string (pick one or more) and a stove knob you
// turn for how hard (Any → Easy → Medium → Chef mode).
export default function DishFilters({ prices = [], level = 'any', onPrices, onLevel }) {
  const li = Math.max(0, LEVELS.findIndex((l) => l.id === level));
  const L = LEVELS[li];
  const toggle = (id) => onPrices(prices.includes(id) ? prices.filter((x) => x !== id) : [...prices, id].sort());
  return (
    <section className="df" data-tip="budget" aria-label="Filter by price and difficulty">
      <div className="df-string" role="group" aria-label="Price per serving">
        {PRICE_TIERS.map((t, i) => {
          const on = prices.includes(t.id);
          return (
            <button key={t.id} type="button" className={`df-tag ${on ? 'on' : ''}`} style={{ '--tilt': `${[-7, 5, -4, 7][i]}deg` }} aria-pressed={on} onClick={() => toggle(t.id)} title={`${t.name} · ${t.note}`}>
              <b>{t.tag}</b><span className="sr">{t.name}, {t.note} a serving</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="df-knobwrap" onClick={() => onLevel(LEVELS[(li + 1) % LEVELS.length].id)} aria-label={`Difficulty: ${L.name}. Tap to turn`}>
        <span className="df-knob"><span className="df-knob-face" style={{ transform: `rotate(${[-120, -40, 40, 120][li]}deg)` }}><i /></span></span>
        <span className="df-lvl on"><span className="df-flames">{L.flames ? Array.from({ length: 3 }, (_, k) => <Flame key={k} on={k < L.flames} />) : null}</span>{L.name === 'Any' ? 'Any level' : L.name}</span>
      </button>
    </section>
  );
}
