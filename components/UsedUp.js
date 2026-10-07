'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import { canon, STAPLES } from '@/lib/recipes/match';

// After "I cooked it": "Out of eggs now?" for the recipe's main ingredients that are in the pantry. Yes marks the
// item out (and puts it on the shopping list); No just hides the question. Saves typing it in later.
export default function UsedUp({ recipe }) {
  const { supabase, bump } = useWhisk();
  const [rows, setRows] = useState(null);   // [{ item, state: 'ask' | 'out' }]
  useEffect(() => {
    if (!recipe?.key?.length) return;
    const keys = new Set(recipe.key.map(canon).filter((k) => !STAPLES.has(k)));
    supabase.from('pantry_items').select('id, name, category, status').neq('status', 'out').then(({ data }) => {
      setRows((data || []).filter((p) => keys.has(canon(p.name)) && !['Spices & Seasonings'].includes(p.category)).slice(0, 4).map((item) => ({ item, state: 'ask' })));
    });
  }, [recipe, supabase]);
  if (!rows?.length) return null;
  const set = (id, state) => setRows((r) => r.map((x) => (x.item.id === id ? { ...x, state } : x)));
  async function yes({ item }) {
    set(item.id, 'out');
    await supabase.from('pantry_items').update({ status: 'out' }).eq('id', item.id);
    await supabase.from('shopping_items').insert({ name: item.name, category: item.category });
    bump?.();
  }
  async function undo({ item }) {
    set(item.id, 'ask');
    await supabase.from('pantry_items').update({ status: item.status }).eq('id', item.id);
    const { data } = await supabase.from('shopping_items').select('id').eq('name', item.name).order('created_at', { ascending: false }).limit(1);
    if (data?.[0]) await supabase.from('shopping_items').delete().eq('id', data[0].id);
    bump?.();
  }
  const left = rows.filter((x) => x.state !== 'no');
  if (!left.length) return null;
  return (
    <div className="usedup" aria-label="Used anything up?">
      {left.map((x) => (
        <div key={x.item.id} className="usedup-row">
          {x.state === 'out'
            ? <><span><b>{x.item.name}</b> is out · on your list</span><button type="button" className="linkbtn" onClick={() => undo(x)}>Undo</button></>
            : <><span>Out of <b>{x.item.name.toLowerCase()}</b> now?</span><button type="button" className="btn sm" onClick={() => yes(x)}>Yes</button><button type="button" className="btn ghost sm" onClick={() => set(x.item.id, 'no')}>No</button></>}
        </div>
      ))}
    </div>
  );
}
