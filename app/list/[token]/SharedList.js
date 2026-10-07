'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon from '@/components/Icon';

const AISLES = ['Produce', 'Proteins', 'Dairy & Eggs', 'Carbs & Grains', 'Canned & Jarred', 'Sauces & Oils', 'Spices & Seasonings', 'Baking', 'Frozen', 'Other'];

export default function SharedList({ token }) {
  const supabase = supabaseBrowser();
  const [items, setItems] = useState(undefined);   // undefined: loading · null: link is off
  const load = useCallback(async () => {
    if (!token) { setItems(null); return; }
    const { data, error } = await supabase.rpc('get_shared_list', { p_token: token });
    setItems(error || !data ? null : data.items || []);
  }, [supabase, token]);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15000);   // see what the other person ticks
    const vis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [load]);
  async function tick(it) {
    const on = !it.checked;
    setItems((l) => l.map((x) => (x.id === it.id ? { ...x, checked: on } : x)));
    const { data } = await supabase.rpc('tick_shared_item', { p_token: token, p_item: it.id, p_checked: on });
    if (!data) load();
  }
  const groups = AISLES.map((a) => [a, (items || []).filter((i) => (AISLES.includes(i.category) ? i.category : 'Other') === a)]).filter(([, l]) => l.length);
  const left = (items || []).filter((i) => !i.checked).length;
  return (
    <main className="shared-list theme-day">
      <header className="sl-head">
        <img src="/icon.svg" alt="" width="44" height="44" />
        <div><h1>Shopping list</h1><span className="muted">{items ? (left ? `${left} to get` : 'All done!') : ' '}</span></div>
      </header>
      {items === undefined ? <p className="muted">Loading…</p> : items === null ? (
        <div className="empty"><b>This link is off</b>Ask for a new one.</div>
      ) : items.length === 0 ? <div className="empty"><b>Nothing to buy right now</b></div> : groups.map(([aisle, list]) => (
        <section key={aisle} className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{aisle}</span>
          {list.map((it) => (
            <button key={it.id} type="button" className={`card sl-item ${it.checked ? 'done' : ''}`} onClick={() => tick(it)} aria-pressed={it.checked}>
              <span className="sl-box" aria-hidden="true">{it.checked && <Icon name="check" size={18} />}</span>
              <b>{it.name}</b>
            </button>
          ))}
        </section>
      ))}
      <p className="desc sl-foot">Shared from <b>Whisk</b>, the cooking game. Ticks show up on their list too.</p>
    </main>
  );
}
