'use client';
// What each tab needs from the server, fetched in one go and remembered (lib/cache.js). AppShell warms all of these
// right after the app opens, so tapping a tab shows everything at once instead of loading bit by bit.
import { load } from '@/lib/cache';
import { fetchPantry, fetchSaved, fetchList, fetchKitchens } from './usePantry';

export async function fetchCompete(supabase) {
  const [c, b, q] = await Promise.all([supabase.rpc('get_weekly_challenges'), supabase.rpc('get_bingo'), supabase.rpc('get_daily_quest')]);
  if (c.error && b.error && q.error) return undefined;
  return { challenges: c.data || [], bingo: b.error ? null : b.data, quest: q.error ? null : q.data };
}
export async function fetchMe(supabase) {
  const journal = (cols) => supabase.from('meals').select(cols).order('cooked_at', { ascending: false }).limit(12);
  const [m, h] = await Promise.all([
    journal('id, title, photo_path, cooked_at, rating, shared_at').then((r) => (r.error?.code === '42703' ? journal('id, title, photo_path, cooked_at, rating') : r)),
    supabase.from('meals').select('cuisine, country, cooked_at').order('cooked_at', { ascending: false }).limit(1000)
  ]);
  if (m.error) return undefined;
  let meals = m.data || [];
  if (meals.length) {
    const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrls(meals.map((r) => r.photo_path), 3600);
    meals = meals.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl }));
  }
  return { meals, history: h.data || [] };
}
// Your world map, country tiers and challenges, plus the Kitchen shop (setup SQL 17). { missing: true } until that's run.
export async function fetchWorld(supabase) {
  const [w, shop] = await Promise.all([supabase.rpc('get_world'), supabase.from('kitchen_items').select('id, name, kind, price, country, sort').order('sort')]);
  if (w.error || shop.error) return /get_world|kitchen_items|42883|42P01|PGRST20[02]/.test(`${w.error?.code} ${w.error?.message} ${shop.error?.code} ${shop.error?.message}`) ? { missing: true, countries: [], challenges: [], recipes: 0, owned: [], shop: [] } : undefined;
  return { ...w.data, shop: shop.data || [] };
}
export const fetchFriends = (supabase) => supabase.rpc('get_friends').then(({ data, error }) => (error ? false : data));
export const fetchWeek = (supabase) => supabase.from('meals').select('cooked_at').order('cooked_at', { ascending: false }).limit(1000).then(({ data, error }) => (error ? undefined : data || []));

// Fill every tab's memory, one after another so it never competes with what the player is doing now.
export async function warmCache(supabase) {
  const jobs = [['pantry', fetchPantry], ['saved', fetchSaved], ['week', fetchWeek], ['list', fetchList], ['kitchens', fetchKitchens], ['world', fetchWorld], ['compete', fetchCompete], ['friends', fetchFriends], ['me', fetchMe]];
  for (const [key, fn] of jobs) { try { await load(key, () => fn(supabase), 10000); } catch {} }
}
