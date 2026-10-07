// The profile columns the app reads. Columns added by a newer migration go in NEWER: if that migration hasn't been
// run on the database yet, the app falls back to the older set instead of failing to load (the new features then
// simply stay off until it's run).
export const BASE_COLS = 'id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state, time_zone, consent, first_open_date, onboarded_at, is_admin';
export const NEWER_COLS = 'never_show, vacation_since, repair_streak, repair_day';
export const NEWEST_COLS = 'notify_hour';   // 0021

export async function loadProfile(supabase, id) {
  // newest first; 42703 = a column doesn't exist yet → try the next older set
  for (const cols of [`${BASE_COLS}, ${NEWER_COLS}, ${NEWEST_COLS}`, `${BASE_COLS}, ${NEWER_COLS}`, BASE_COLS]) {
    const r = await supabase.from('profiles').select(cols).eq('id', id).single();
    if (!r.error || r.error.code !== '42703') return r;
  }
  return { data: null, error: { message: 'profile unavailable' } };
}
