// Barcode numbers are printed in groups under the bars: 1 · 6 · 6 for a 13-digit EAN ("0 012345 678905").
// Plain ESM. Typing groups them as you go; the digits themselves never change.
export const digitsOnly = (s) => String(s || '').replace(/\D/g, '').slice(0, 14);
export function groupBarcode(raw) {
  const d = digitsOnly(raw);
  if (d.length <= 1) return d;
  if (d.length === 14) return `${d[0]} ${d.slice(1, 3)} ${d.slice(3, 8)} ${d.slice(8, 13)} ${d[13]}`;
  return [d.slice(0, 1), d.slice(1, 7), d.slice(7)].filter(Boolean).join(' ');
}
// The bars: each digit drawn as its 7 modules (EAN "L" pattern), with the guard bars at both ends. A picture of the number, not a scannable code.
const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
export function barModules(raw) {
  const d = digitsOnly(raw);
  const bits = ['101', ...[...d].map((c) => L[+c]), '101'].join('');
  const rects = []; let i = 0;
  while (i < bits.length) { if (bits[i] === '1') { let j = i; while (j < bits.length && bits[j] === '1') j++; rects.push([i, j - i]); i = j; } else i++; }
  return { rects, width: bits.length };
}
