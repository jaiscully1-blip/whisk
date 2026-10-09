// node lib/scan/receipt.test.mjs — checks the receipt reader turns real-looking receipt text into groceries
import assert from 'node:assert/strict';
import { parseReceipt } from './receipt.js';
const text = `WALMART SUPERCENTER
SAVE MONEY. LIVE BETTER.
ST# 1234 OP# 00001 TE# 12 TR# 0456
GV WHL MLK 1G 007874235186 3.48 F
BNLS SKNLS CHKN BRST 0002010 8.97 N
BANANAS 000000004011 KF
2.13 lb @ 0.58 /lb 1.24 N
LG EGGS 12CT 007874211 2.97 F
SHRD MOZZ 80Z 007874237 2.24 F
PAPER TOWELS 003700074 6.97 X
KDNY BNS 2.58 F
2 @ 1.29
GRND BF 80/20 001234 5.47 F
SUBTOTAL 33.11
[OTAL 33.60
TAX 1 7.000 % 0.49
VISA TEND 33.60`;
const got = parseReceipt(text), by = Object.fromEntries(got.map((i) => [i.name, i]));
assert.deepEqual(got.map((i) => i.name), ['Whole Milk', 'Boneless Skinless Chicken Breast', 'Bananas', 'Large Eggs', 'Shredded Mozzarella', 'Paper Towels', 'Kidney Beans', 'Ground Beef']);
assert.equal(by['Whole Milk'].quantity, '1 gal');
assert.equal(by['Bananas'].quantity, '2.13 lb');
assert.equal(by['Shredded Mozzarella'].quantity, '8 oz');
assert.equal(by['Kidney Beans'].quantity, 'x2');
assert.equal(by['Paper Towels'].on, false);
assert.equal(by['Whole Milk'].category, 'Dairy & Eggs');
assert.equal(by['Ground Beef'].category, 'Proteins');
console.log(`receipt parser: ${got.length} items, all checks passed`);
