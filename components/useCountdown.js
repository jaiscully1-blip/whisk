'use client';
import { useEffect, useState } from 'react';

// Seconds left until an ISO time (0 when it has passed), ticking once a second only while there is time left.
export default function useCountdown(iso) {
  const calc = () => (iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!iso || calc() <= 0) return undefined;
    const t = setInterval(() => { const n = calc(); setLeft(n); if (n <= 0) clearInterval(t); }, 1000);
    return () => clearInterval(t);
  }, [iso]); // eslint-disable-line react-hooks/exhaustive-deps
  return left;
}
export const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
