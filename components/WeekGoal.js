'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import { fmt, weekStart, HOME_MEAL_COST } from '@/lib/game';

// The weekly meals goal, small enough to sit in the Cook banner: a ring, "N more meals this week", and what home
// cooking has saved vs takeout once there's something to show.
export default function WeekGoal() {
  const { supabase, profile, dataVersion } = useWhisk();
  const [meals, setMeals] = useState(null);
  useEffect(() => {
    let live = true;
    supabase.from('meals').select('cooked_at').order('cooked_at', { ascending: false }).limit(1000).then(({ data }) => { if (live) setMeals(data || []); });
    return () => { live = false; };
  }, [supabase, dataVersion]);
  if (!meals) return null;
  const goal = profile?.weekly_goal || 4;
  const since = weekStart();
  const n = meals.filter((m) => new Date(m.cooked_at) >= since).length;
  const left = Math.max(0, goal - n), r = 15, c = 2 * Math.PI * r, pct = Math.min(1, n / goal);
  const saved = Math.round(meals.length * Math.max(0, Number(profile?.takeout_price ?? 15) - HOME_MEAL_COST));
  return (
    <div className="weekgoal" role="status" aria-label={`${n} of ${goal} meals this week`}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 20 20)" />
        <text x="20" y="24.5" textAnchor="middle">{n}/{goal}</text>
      </svg>
      <span><b>{left ? `${left} more meal${left === 1 ? '' : 's'} this week` : 'Weekly goal hit!'}</b>{meals.length > 0 && saved > 0 && <small>~${fmt(saved)} saved vs takeout</small>}</span>
    </div>
  );
}
