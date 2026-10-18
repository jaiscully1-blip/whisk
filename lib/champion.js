'use client';
import { useEffect, useState } from 'react';

// Cook of the week: the player with the most XP last week wears a crown this week (everyone on Yoke can win it).
// One fetch per app session, shared by every screen that shows names.
let cached = null, inflight = null;
const subs = new Set();
export function loadChampion(supabase) {
  if (cached || inflight) return inflight || Promise.resolve(cached);
  inflight = supabase.rpc('get_champion').then(({ data, error }) => { inflight = null; cached = error ? { code: null } : (data || { code: null }); subs.forEach((f) => f(cached)); return cached; }, () => { inflight = null; return { code: null }; });
  return inflight;
}
export function useChampion(supabase) {
  const [c, setC] = useState(cached);
  useEffect(() => { if (!supabase) return; subs.add(setC); loadChampion(supabase).then(setC); return () => { subs.delete(setC); }; }, [supabase]);
  return c;
}
