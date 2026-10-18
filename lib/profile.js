// The profile columns the app reads. Columns added by a newer migration go in NEWER: if that migration hasn't been
// run on the database yet, the app falls back to the older set instead of failing to load (the new features then
// simply stay off until it's run).
export const BASE_COLS = 'id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state, time_zone, consent, first_open_date, onboarded_at, is_admin';
export const NEWER_COLS = 'never_show, vacation_since';
export const NEWEST_COLS = 'notify_hour';   // 0021
export const LEARN_COLS = 'skill_level, learn_streak, learn_best, learn_last';   // 0032
export const LEARN_NEXT_COLS = 'learn_next';   // 0033

// Settings added by later setup SQL. Any of them may be missing from a database that hasn't run that SQL yet:
// the app drops whichever column the database says it doesn't have and loads the rest.
export const LATER_COLS = 'expiry_days, calorie_goal';   // 0039, 0040
export async function loadProfile(supabase, id) {
  let cols = [BASE_COLS, NEWER_COLS, NEWEST_COLS, LEARN_COLS, LEARN_NEXT_COLS, LATER_COLS].join(', ').split(',').map((c) => c.trim()).filter(Boolean);
  const base = new Set(BASE_COLS.split(',').map((c) => c.trim()));
  for (let i = 0; i < 20; i++) {
    const r = await supabase.from('profiles').select(cols.join(', ')).eq('id', id).single();
    if (!r.error || r.error.code !== '42703') return r;
    // "column profiles.expiry_days does not exist" -> leave that one out and try again
    const m = /column (?:\w+\.)?(\w+) does not exist/i.exec(r.error.message || '');
    const bad = m && m[1];
    if (bad && cols.includes(bad) && !base.has(bad)) cols = cols.filter((c) => c !== bad);
    else {   // unknown message: fall back to the old behaviour, one group at a time
      const drop = cols.filter((c) => !base.has(c)).pop();
      if (!drop) break; cols = cols.filter((c) => c !== drop);
    }
  }
  return { data: null, error: { message: 'profile unavailable' } };
}
