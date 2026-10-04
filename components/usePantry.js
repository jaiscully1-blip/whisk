'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';

export function usePantry() {
  const { supabase, dataVersion } = useWhisk();
  const [items, setItems] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from('pantry_items').select('id, name, category, status, quantity, expires_on, thaw_started_at, added_at').order('name');
    setItems(data || []);
  }, [supabase]);
  useEffect(() => { load(); }, [load, dataVersion]);
  return [items, load, setItems];
}

export function useSaved() {
  const { supabase, dataVersion } = useWhisk();
  const [saved, setSaved] = useState(null);
  const load = useCallback(async () => {
    const { data } = await supabase.from('saved_recipes').select('recipe_id, rating, saved_at').order('saved_at', { ascending: false });
    setSaved(new Map((data || []).map((s) => [s.recipe_id, s])));
  }, [supabase]);
  useEffect(() => { load(); }, [load, dataVersion]);
  return [saved, load];
}
