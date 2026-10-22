'use client';
import { useEffect, useMemo, useState } from 'react';
import { specialDays } from '@/lib/holidays';
import { dayIn } from '@/lib/day';
import { timedFetch } from '@/lib/netFetch';

// Today's special days (holidays, national days, food holidays) on the player's own calendar, plus Yoke's own dishes from the
// countries those days belong to (Mexico's Independence Day → Mexican dishes), so a national day always has something to cook.
// tick: pass something that changes now and then (the hour) so a new day is noticed without reloading.
export function useSpecialDays(tz, tick = 0) {
  const today = useMemo(() => dayIn(tz), [tz, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const days = useMemo(() => specialDays(today), [today]);
  const iso = useMemo(() => [...new Set(days.flatMap((d) => d.c))].slice(0, 4).join(','), [days]);
  const [world, setWorld] = useState([]);
  useEffect(() => {
    if (!iso) { setWorld([]); return undefined; }
    let off = false;
    Promise.all(iso.split(',').map((c) => timedFetch(`/api/world-recipe?iso=${c}`).then((r) => (r.ok ? r.json() : null)).then((j) => j?.recipes || []).catch(() => [])))
      .then((l) => { if (!off) setWorld(l.flat()); });
    return () => { off = true; };
  }, [iso]);
  return { days, world, today };
}
