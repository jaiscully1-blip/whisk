'use client';
import { LEVEL_BARS, LEVEL_LABEL, LEVEL_TONE } from '@/lib/stock';

// A grocery bag with food poking out: four things when Full, none when Out, with the word beside it (Full, Good, Low, Out).
// The level never relies on colour alone: the number of things in the bag and the label both say it.
const THINGS = [
  <circle key="a" cx="9.5" cy="12" r="3.4" className="sb-apple" />,
  <rect key="b" x="13.5" y="5" width="4.4" height="10" rx="1.2" className="sb-milk" />,
  <path key="c" d="M19 14c.8-5 3.6-6.6 5.4-6.8-.4 3.4-1.8 5.6-5.4 6.8z" className="sb-leaf" />,
  <ellipse key="d" cx="15.2" cy="13" rx="5.6" ry="2.6" className="sb-bread" />,
];
export default function StockMeter({ status, onClick, name }) {
  const n = LEVEL_BARS[status] ?? 4, tone = LEVEL_TONE[status] || 'fresh';
  return (
    <button type="button" className={`stock stock-${tone}`} onClick={onClick} aria-label={`${name}: ${LEVEL_LABEL[status]}. Tap to change.`}>
      <svg className="stock-bag" viewBox="0 0 30 30" width="32" height="30" aria-hidden="true">
        {THINGS.filter((_, i) => i < n)}
        <path className="sb-body" d="M6 13h18l-1.7 14H7.7z" />
        <path className="sb-fold" d="M6 13h18" />
        <path className="sb-handle" d="M11.5 13v-2.2a3.5 3.5 0 0 1 7 0V13" />
        {n === 0 && <path className="sb-empty" d="M12 19l6 5M18 19l-6 5" />}
      </svg>
      <span className="stock-word">{LEVEL_LABEL[status]}</span>
    </button>
  );
}
