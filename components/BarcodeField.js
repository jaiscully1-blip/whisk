'use client';
import { barModules, digitsOnly, groupBarcode } from '@/lib/scan/barcodeFormat';

// "Won't scan? Type the numbers": the number is grouped like the one printed under a barcode, with a little barcode drawn from it.
export default function BarcodeField({ value, onChange, placeholder = 'Type the numbers' }) {
  const digits = digitsOnly(value);
  const { rects, width } = barModules(digits.padEnd(Math.max(digits.length, 12), '0'));
  return (
    <label className="bc-field" data-testid="barcode-field">
      <svg className={`bc-bars ${digits ? 'on' : ''}`} viewBox={`0 0 ${width} 22`} preserveAspectRatio="none" aria-hidden="true">
        {rects.map(([x, w], i) => <rect key={i} x={x} y="0" width={w} height="22" />)}
      </svg>
      <input inputMode="numeric" autoComplete="off" aria-label="Type a barcode" placeholder={placeholder} value={groupBarcode(digits)} onChange={(e) => onChange(digitsOnly(e.target.value))} />
    </label>
  );
}
