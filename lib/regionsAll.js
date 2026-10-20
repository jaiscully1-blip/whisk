// All regional postcards (lib/regions.js + lib/regions2.js): the scene for a dish in a country, or null (main landmark).
import { REGIONS } from './regions.js';
import { REGIONS2 } from './regions2.js';
import { hasLandmark } from './landmarks.js';

export const ALL_REGIONS = { ...REGIONS, ...REGIONS2 };
export function regionFor(iso, title) {
  const list = ALL_REGIONS[String(iso || '').toUpperCase()]; if (!list || !title) return null;
  const t = String(title);
  for (const [re, sc] of list) if (re.test(t)) return sc;
  // a country with no landmark of its own would borrow a neighbour's (Germany showing the Eiffel Tower): use its first region instead
  if (!hasLandmark(iso)) return (list.find(([, sc]) => sc) || [])[1] || null;
  return null;
}
