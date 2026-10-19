import { HELDOUT } from './heldout.mjs';
import { guessCategory } from '../game.js';
let bad = 0; for (const [n, want] of HELDOUT) { const got = guessCategory(n); if (got !== want) { bad++; console.log(`${n}: wanted ${want}, got ${got}`); } }
console.log(`${HELDOUT.length - bad}/${HELDOUT.length} right (${((1 - bad / HELDOUT.length) * 100).toFixed(1)}%)`);
