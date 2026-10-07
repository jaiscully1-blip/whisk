import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import AppShell from '@/components/AppShell';
import { loadProfile } from '@/lib/profile';

export default async function AppLayout({ children }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: profile }, { data: loadout }] = await Promise.all([
    loadProfile(supabase, user.id),
    supabase.from('loadouts').select('top_id, hat_id, glasses_id, shoes_id, acc_id').eq('user_id', user.id).maybeSingle()
  ]);
  return <AppShell initialProfile={profile || { xp: 0, coins: 0, theme_pref: 'day', streak_days: 0 }} initialLoadout={loadout || {}} email={user.email}>{children}</AppShell>;
}
