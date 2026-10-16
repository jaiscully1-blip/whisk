// Stock levels for a pantry item. "stocked" is stored for Full (it was the original value), so nothing existing breaks.
export const LEVELS = ['stocked', 'good', 'low', 'out'];
export const LEVEL_LABEL = { stocked: 'Full', good: 'Good', low: 'Low', out: 'Out' };
export const LEVEL_BARS = { stocked: 4, good: 3, low: 1, out: 0 };
export const LEVEL_TONE = { stocked: 'fresh', good: 'fresh', low: 'warn', out: 'bad' };
// Tap order: Full → Good → Low → Out → Full
export const nextLevel = (s) => LEVELS[(Math.max(0, LEVELS.indexOf(s)) + 1) % LEVELS.length];
// Cooking with it: one level down, never straight to Out (the app asks "out now?" for that)
export const dropLevel = (s) => ({ stocked: 'good', good: 'low' }[s] || s);
export const needsReup = (s) => s === 'low' || s === 'out';
