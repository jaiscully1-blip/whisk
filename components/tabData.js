'use client';
// What each tab needs from the server, fetched in one go and remembered (lib/cache.js). AppShell warms all of these
// right after the app opens, so tapping a tab shows everything at once instead of loading bit by bit.
import { load } from '@/lib/cache';
import { fetchPantry, fetchSaved, fetchList } from './usePantry';

export async function fetchCompete(supabase) {
  const [c, b, q] = await Promise.all([supabase.rpc('get_weekly_challenges'), supabase.rpc('get_bingo'), supabase.rpc('get_daily_quest')]);
  if (c.error && b.error && q.error) return undefined;
  return { challenges: c.data || [], bingo: b.error ? null : b.data, quest: q.error ? null : q.data };
}
export async function fetchMe(supabase) {
  const journal = (cols) => supabase.from('meals').select(cols).order('cooked_at', { ascending: false }).limit(12);
  const [it, inv, m, h] = await Promise.all([
    supabase.from('items').select('id, slot, name, rarity, price, sort').eq('active', true).order('sort'),
    supabase.from('inventory').select('item_id'),
    journal('id, title, photo_path, cooked_at, rating, shared_at').then((r) => (r.error?.code === '42703' ? journal('id, title, photo_path, cooked_at, rating') : r)),
    supabase.from('meals').select('cuisine, country, cooked_at').order('cooked_at', { ascending: false }).limit(1000)
  ]);
  if (it.error) return undefined;
  let meals = m.data || [];
  if (meals.length) {
    const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrls(meals.map((r) => r.photo_path), 3600);
    meals = meals.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl }));
  }
  return { items: it.data || [], owned: (inv.data || []).map((r) => r.item_id), meals, history: h.data || [] };
}
export const fetchFriends = (supabase) => supabase.rpc('get_friends').then(({ data, error }) => (error ? false : data));
export const fetchWeek = (supabase) => supabase.from('meals').select('cooked_at').order('cooked_at', { ascending: false }).limit(1000).then(({ data, error }) => (error ? undefined : data || []));

// Fill every tab's memory, one after another so it never competes with what the player is doing now.
export async function warmCache(supabase) {
  const jobs = [['pantry', fetchPantry], ['saved', fetchSaved], ['week', fetchWeek], ['list', fetchList], ['compete', fetchCompete], ['friends', fetchFriends], ['me', fetchMe]];
  for (const [key, fn] of jobs) { try { await load(key, () => fn(supabase), 10000); } catch {} }
}
