'use client';
import { PRICE_TIERS, LEVELS } from '@/lib/recipes/cost';

const Flame = ({ on }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={`df-flame ${on ? 'on' : ''}`}>
    <path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 12.5C7 10 8.5 8.6 9.5 7.5c.3 1.8 1.2 2.7 2 3C11 8 11 5 12 2z" />
  </svg>
);

// Under "Discover a Dish": price tags hanging on a string (pick one or more) and a stove knob for how hard.
export default function DishFilters({ prices = [], level = 'any', onPrices, onLevel, counts }) {
  const li = Math.max(0, LEVELS.findIndex((l) => l.id === level));
  const angle = [-120, -40, 40, 120][li];
  const toggle = (id) => onPrices(prices.includes(id) ? prices.filter((x) => x !== id) : [...prices, id].sort());
  return (
    <section className="df" data-tip="budget" aria-label="Filter by price and difficulty">
      <div className="df-price">
        <span className="df-label">Budget <small>per serving</small></span>
        <div className="df-string" role="group" aria-label="Price">
          {PRICE_TIERS.map((t, i) => {
            const on = prices.includes(t.id);
            return (
              <button key={t.id} type="button" className={`df-tag ${on ? 'on' : ''}`} style={{ '--tilt': `${[-6, 4, -3, 6][i]}deg` }} aria-pressed={on} onClick={() => toggle(t.id)}
                aria-label={`${t.name}, ${t.note} a serving${counts ? `, ${counts.price[t.id] || 0} dishes` : ''}`}>
                <i className="df-hole" />
                <b>{t.tag}</b>
                <span>{t.name}</span>
                <small>{t.note}</small>
              </button>
            );
          })}
        </div>
      </div>
      <div className="df-heat">
        <button type="button" className="df-knob" onClick={() => onLevel(LEVELS[(li + 1) % LEVELS.length].id)} aria-label={`Difficulty: ${LEVELS[li].name}. Tap to turn`}>
          <span className="df-knob-face" style={{ transform: `rotate(${angle}deg)` }}><i /></span>
        </button>
        <div className="df-levels" role="radiogroup" aria-label="How hard">
          {LEVELS.map((l) => (
            <button key={l.id} type="button" role="radio" aria-checked={level === l.id} className={`df-lvl ${level === l.id ? 'on' : ''}`} onClick={() => onLevel(l.id)}>
              <span className="df-flames">{l.flames ? Array.from({ length: 3 }, (_, k) => <Flame key={k} on={k < l.flames} />) : <span className="df-any">ALL</span>}</span>
              {l.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
