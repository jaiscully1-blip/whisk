import { dayIn } from '@/lib/day';
// The streak as it stands right now. The stored number only changes when you cook, so after a missed day it would
// still show the old count. A streak is alive if you cooked (with a photo) today or yesterday, or if exactly one day
// was missed and a streak freeze covers it (same rule as the database: _live_streak in supabase/migrations/0047).
export function liveStreak(profile, tz, now = new Date()) {
  const n = profile?.streak_days || 0;
  if (!n) return 0;
  if (profile?.vacation_since) return n;           // vacation mode pauses it
  const last = profile?.streak_last_date;
  if (!last) return n;                              // an older profile row without the date: show what's stored
  const day = (s) => Math.round(Date.parse(`${String(s).slice(0, 10)}T00:00:00Z`) / 864e5);
  const gap = day(dayIn(tz, now)) - day(last);
  if (gap <= 1) return n;
  if (gap === 2 && (profile?.streak_freezes || 0) > 0) return n;
  return 0;
}
