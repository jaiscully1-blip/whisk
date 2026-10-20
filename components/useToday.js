'use client';
import { useEffect, useState } from 'react';
import { useTimeZone } from './useTimeZone';
import { dayIn, msToMidnight } from '@/lib/day';

// Today's date ("2026-10-20") on the player's own calendar. It changes by itself at 12:00 midnight in their time zone
// (and when the phone wakes up after midnight), so a card that was hidden for the day comes back on time.
// '' on the very first render (server and browser agree), the real date right after.
export default function useToday() {
  const tz = useTimeZone();
  const [day, setDay] = useState('');
  useEffect(() => {
    let timer;
    const tick = () => {
      setDay(dayIn(tz));
      clearTimeout(timer);
      timer = setTimeout(tick, Math.min(msToMidnight(tz) + 400, 2 ** 31 - 1));
    };
    tick();
    const wake = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', wake); window.addEventListener('focus', wake);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', wake); window.removeEventListener('focus', wake); };
  }, [tz]);
  return day;
}
