'use client';
import { LEVEL_FILL, LEVEL_LABEL, LEVEL_TONE } from '@/lib/stock';

import PackageArt from './PackageArt';

// The item itself, drawn as its package (a ketchup bottle with ketchup in it, a milk carton, a bowl of lemons), filled to
// how much is left, with the word beside it (Full, Good, Low, Out). The level never relies on colour alone: the fill and the word both say it.
export default function StockMeter({ status, onClick, name, aisle }) {
  const tone = LEVEL_TONE[status] || 'fresh';
  return (
    <button type="button" className={`stock stock-${tone}`} onClick={onClick} aria-label={`${name}: ${LEVEL_LABEL[status]}. Tap to change.`}>
      <PackageArt name={name} aisle={aisle} fill={LEVEL_FILL[status] ?? 1} size={34} />
      <span className="stock-word">{LEVEL_LABEL[status]}</span>
    </button>
  );
}
