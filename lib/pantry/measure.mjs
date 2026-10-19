import { CORPUS } from './corpus.mjs';
import { guessCategory } from '../game.js';
let bad = 0; for (const [n, want] of CORPUS) { const got = guessCategory(n); if (got !== want) { bad++; console.log(`${n}: wanted ${want}, got ${got}`); } }
console.log(`${CORPUS.length - bad}/${CORPUS.length} right (${((1 - bad / CORPUS.length) * 100).toFixed(1)}%)`);
