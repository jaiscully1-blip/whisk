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
  return <AppShell initialProfile={profile || { xp: 0, coins: 0, theme_pref: 'night', streak_days: 0 }} initialLoadout={loadout || {}} email={user.email} account={{ anon: !!user.is_anonymous, email: user.email || null, providers: [...new Set((user.identities || []).map((i) => i.provider).filter((x) => x !== 'anonymous'))] }}>{children}</AppShell>;
}
