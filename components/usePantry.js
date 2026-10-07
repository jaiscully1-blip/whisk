'use client';
import { useWhisk } from './AppShell';
import { useCached } from '@/lib/cache';

// Shared, remembered lists (see lib/cache.js): every page shows them instantly and refreshes them quietly.
export const PANTRY_COLS = 'id, name, category, status, quantity, expires_on, thaw_started_at, added_at';
export const fetchPantry = (supabase) => supabase.from('pantry_items').select(PANTRY_COLS).order('name').then(({ data, error }) => (error ? undefined : data || []));
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
