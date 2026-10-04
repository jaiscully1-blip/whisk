import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';

export default async function AppLayout({ children }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: profile }, { data: loadout }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state, time_zone, consent, first_open_date, onboarded_at, is_admin').eq('id', user.id).single(),
    supabase.from('loadouts').select('top_id, hat_id, glasses_id, shoes_id, acc_id').eq('user_id', user.id).maybeSingle()
  ]);
  return <AppShell initialProfile={profile || { xp: 0, coins: 0, theme_pref: 'day', streak_days: 0 }} initialLoadout={loadout || {}} email={user.email}>{children}</AppShell>;
}
