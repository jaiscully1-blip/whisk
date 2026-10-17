'use client';
import { LEVEL_FILL, LEVEL_LABEL, LEVEL_TONE } from '@/lib/stock';

// A drawn pantry jar that empties as you run low, with the word beside it (Full, Good, Low, Out).
// The level never relies on colour alone: the jar's fill height and the label both say it.
export default function StockMeter({ status, onClick, name }) {
  const fill = LEVEL_FILL[status] ?? 1, tone = LEVEL_TONE[status] || 'fresh';
  const top = 9 + (1 - fill) * 18;   // jar body runs y 9..27
  return (
    <button type="button" className={`stock stock-${tone}`} onClick={onClick} aria-label={`${name}: ${LEVEL_LABEL[status]}. Tap to change.`}>
      <svg className="stock-jar" viewBox="0 0 24 30" width="24" height="30" aria-hidden="true">
        <defs><clipPath id={`jar-${status}`}><path d="M5 9h14v14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" /></clipPath></defs>
        <g clipPath={`url(#jar-${status})`}><rect className="stock-fill" x="4" y={top} width="16" height={27 - top} /></g>
        <path className="stock-glass" d="M5 9h14v14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="none" strokeWidth="1.8" strokeLinejoin="round" />
        <rect className="stock-lid" x="4" y="4" width="16" height="4" rx="1.5" />
      </svg>
      <span className="stock-word">{LEVEL_LABEL[status]}</span>
    </button>
  );
}
