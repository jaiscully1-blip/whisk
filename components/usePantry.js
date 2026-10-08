'use client';
import { useWhisk } from './AppShell';
import { useCached } from '@/lib/cache';

// Shared, remembered lists (see lib/cache.js): every page shows them instantly and refreshes them quietly.
export const PANTRY_COLS = 'id, name, category, status, quantity, expires_on, thaw_started_at, added_at, spot';
// `spot` (where it lives in your kitchen) arrives with setup SQL 15; until that's run, load without it.
let noSpot = false;
export const fetchPantry = async (supabase) => {
  const q = (cols) => supabase.from('pantry_items').select(cols).order('name');
  let { data, error } = await q(noSpot ? PANTRY_COLS.replace(', spot', '') : PANTRY_COLS);
  if (error && !noSpot && (error.code === '42703' || /spot/.test(error.message || ''))) { noSpot = true; ({ data, error } = await q(PANTRY_COLS.replace(', spot', ''))); }
  return error ? undefined : data || [];
};
// Kitchens you designed (lib/kitchen). [] if none yet, or if setup SQL 15 hasn't been run.
export const fetchKitchens = (supabase) => supabase.from('kitchen_layouts').select('id, name, pieces, is_display, updated_at').order('updated_at', { ascending: false })
  .then(({ data, error }) => (error ? (/kitchen_layouts|42P01|PGRST205/.test(`${error.code} ${error.message}`) ? [] : undefined) : data || []));
export const fetchSaved = (supabase) => supabase.from('saved_recipes').select('recipe_id, rating, saved_at').order('saved_at', { ascending: false })
  .then(({ data, error }) => (error ? undefined : new Map((data || []).map((s) => [s.recipe_id, s]))));
export const fetchList = (supabase) => supabase.from('shopping_items').select('*').order('created_at').then(({ data, error }) => (error ? undefined : data || []));

export function usePantry() {
  const { supabase, dataVersion } = useWhisk();
  const [items, setItems, reload] = useCached('pantry', () => fetchPantry(supabase), [dataVersion]);
  return [items ?? null, reload, setItems];
}
export function useSaved() {
  const { supabase, dataVersion } = useWhisk();
  const [saved, , reload] = useCached('saved', () => fetchSaved(supabase), [dataVersion]);
  return [saved ?? null, reload];
}
export function useList() {
  const { supabase, dataVersion } = useWhisk();
  const [list, setList, reload] = useCached('list', () => fetchList(supabase), [dataVersion]);
  return [list ?? null, reload, setList];
}
export function useKitchens() {
  const { supabase, dataVersion } = useWhisk();
  const [list, setList, reload] = useCached('kitchens', () => fetchKitchens(supabase), [dataVersion]);
  return [list ?? null, reload, setList];
}
// Your world (countries, tiers, challenges) and the Kitchen shop — see fetchWorld in tabData.js.
export function useWorld() {
  const { supabase, dataVersion } = useWhisk();
  const [world, setWorld, reload] = useCached('world', () => import('./tabData').then((m) => m.fetchWorld(supabase)), [dataVersion]);
  return [world ?? null, reload, setWorld];
}
