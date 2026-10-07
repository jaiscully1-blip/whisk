// The profile columns the app reads. Columns added by a newer migration go in NEWER: if that migration hasn't been
// run on the database yet, the app falls back to the older set instead of failing to load (the new features then
// simply stay off until it's run).
export const BASE_COLS = 'id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state, time_zone, consent, first_open_date, onboarded_at, is_admin';
export const NEWER_COLS = 'never_show, vacation_since, repair_streak, repair_day';

export async function loadProfile(supabase, id) {
  const full = await supabase.from('profiles').select(`${BASE_COLS}, ${NEWER_COLS}`).eq('id', id).single();
  if (!full.error || full.error.code !== '42703') return full;   // 42703: a column doesn't exist yet
  return supabase.from('profiles').select(BASE_COLS).eq('id', id).single();
}
