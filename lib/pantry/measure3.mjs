import { HELDOUT2 } from './heldout2.mjs';
import { guessCategory } from '../game.js';
let bad = 0; for (const [n, want] of HELDOUT2) { const got = guessCategory(n); if (got !== want) { bad++; console.log(`${n}: wanted ${want}, got ${got}`); } }
console.log(`${HELDOUT2.length - bad}/${HELDOUT2.length} right (${((1 - bad / HELDOUT2.length) * 100).toFixed(1)}%)`);
