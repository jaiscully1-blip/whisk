'use client';
import { LEVEL_BARS, LEVEL_LABEL, LEVEL_TONE } from '@/lib/stock';

// Four drawn bars + the word (Full, Good, Low, Out). The bars never rely on colour alone: the label says it too.
export default function StockMeter({ status, onClick, name }) {
  const lit = LEVEL_BARS[status] ?? 4, tone = LEVEL_TONE[status] || 'fresh';
  return (
    <button type="button" className={`stock stock-${tone}`} onClick={onClick} aria-label={`${name}: ${LEVEL_LABEL[status]}. Tap to change.`}>
      <span className="stock-bars" aria-hidden="true">{[0, 1, 2, 3].map((n) => <i key={n} className={n < lit ? 'on' : ''} />)}</span>
      <span className="stock-word">{LEVEL_LABEL[status]}</span>
    </button>
  );
}
