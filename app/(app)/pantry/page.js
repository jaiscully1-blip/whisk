'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';
import { CATEGORIES, freshness } from '@/lib/game';

const NEXT_STATUS = { stocked: 'low', low: 'out', out: 'stocked' };
const STATUS_LABEL = { stocked: 'Stocked', low: 'Low', out: 'Out' };

export default function Pantry() {
  const { supabase, say, refreshProfile } = useWhisk();
  const [tab, setTab] = useState('pantry');
  const [items, setItems] = useState(null);
  const [list, setList] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Produce', quantity: '', expires_on: '' });
  const [newItem, setNewItem] = useState('');
  const [filter, setFilter] = useState('All');

  async function load() {
    const [p, s] = await Promise.all([
      supabase.from('pantry_items').select('*').order('name'),
      supabase.from('shopping_items').select('*').order('created_at')
    ]);
    setItems(p.data || []); setList(s.data || []);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function addPantry(e) {
    e.preventDefault();
    const name = form.name.trim(); if (!name) return;
    const { data, error } = await supabase.from('pantry_items').insert({ name: name.slice(0, 60), category: form.category, quantity: form.quantity.trim().slice(0, 30) || null, expires_on: form.expires_on || null }).select().single();
    if (error) { say('Couldn’t add that.'); return; }
    setItems((x) => [...x, data].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, name: '', quantity: '', expires_on: '' }));
    refreshProfile(); say(`Added ${data.name}`);
  }
  async function cycle(item) {
    const status = NEXT_STATUS[item.status];
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, status } : i)));
    await supabase.from('pantry_items').update({ status }).eq('id', item.id);
    if (status === 'out') { await supabase.from('shopping_items').insert({ name: item.name, category: item.category }); say(`${item.name} is out · added to your list`); load(); }
  }
  async function remove(item) {
    setItems((x) => x.filter((i) => i.id !== item.id));
    await supabase.from('pantry_items').delete().eq('id', item.id);
  }
  async function addToList(e) {
    e.preventDefault();
    const name = newItem.trim(); if (!name) return;
    const { data } = await supabase.from('shopping_items').insert({ name: name.slice(0, 60) }).select().single();
    if (data) setList((l) => [...l, data]); setNewItem('');
  }
  async function bought(it) {
    setList((l) => l.filter((x) => x.id !== it.id));
    await supabase.from('shopping_items').delete().eq('id', it.id);
    const existing = items.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
    if (existing) { await supabase.from('pantry_items').update({ status: 'stocked', added_at: new Date().toISOString() }).eq('id', existing.id); }
    else { await supabase.from('pantry_items').insert({ name: it.name, category: CATEGORIES.includes(it.category) ? it.category : 'Other' }); }
    say(`${it.name} restocked`); refreshProfile(); load();
  }

  const groups = useMemo(() => {
    const g = {};
    (items || []).filter((i) => filter === 'All' || i.category === filter).forEach((i) => { (g[i.category] ||= []).push(i); });
    return CATEGORIES.filter((c) => g[c]).map((c) => [c, g[c]]);
  }, [items, filter]);

  return (
    <div className="stack">
      <div className="page-title"><h1>{tab === 'pantry' ? 'Pantry' : 'Shopping list'}</h1></div>
      <div className="row" role="tablist">
        <button className={`btn sm ${tab === 'pantry' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'pantry'} onClick={() => setTab('pantry')}>Pantry {items ? `(${items.length})` : ''}</button>
        <button className={`btn sm ${tab === 'list' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>Shopping list {list ? `(${list.length})` : ''}</button>
      </div>

      {tab === 'pantry' ? (
        <>
          <form className="card stack" onSubmit={addPantry}>
            <div className="grid2">
              <div><label className="lbl" htmlFor="p-name">Item</label><input id="p-name" className="input" maxLength={60} placeholder="e.g. Chicken thighs" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="lbl" htmlFor="p-cat">Category</label><select id="p-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="lbl" htmlFor="p-qty">Amount (optional)</label><input id="p-qty" className="input" maxLength={30} placeholder="2 lb" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label className="lbl" htmlFor="p-exp">Expires (optional)</label><input id="p-exp" className="input" type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} /></div>
            </div>
            <button className="btn" type="submit"><Icon name="plus" size={18} />Add to pantry · +5 XP</button>
          </form>

          <div className="row">
            {['All', ...CATEGORIES].map((c) => <button key={c} className={`chip`} style={{ border: 0, background: filter === c ? 'var(--fg)' : 'var(--track)', color: filter === c ? 'var(--bg)' : 'var(--fg)' }} onClick={() => setFilter(c)}>{c}</button>)}
          </div>

          {items === null ? <p className="muted">Loading your pantry…</p> : items.length === 0 ? (
            <div className="empty"><b>Your pantry is empty</b>Add what’s in your fridge and cupboards. Tap an item’s status to mark it low or out.</div>
          ) : groups.map(([cat, list]) => (
            <section key={cat} className="stack" style={{ gap: 8 }}>
              <span className="eyebrow">{cat} · {list.length}</span>
              {list.map((i) => {
                const f = freshness(i);
                return (
                  <div key={i.id} className="card" style={{ padding: '10px 12px', borderColor: i.status === 'out' ? 'var(--bad)' : i.status === 'low' ? 'var(--warn-bar)' : 'var(--line)' }}>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ textDecoration: i.status === 'out' ? 'line-through' : 'none' }}>{i.name}</b>{i.quantity && <span className="muted"> · {i.quantity}</span>}
                        {f && <div className="row" style={{ gap: 8, flexWrap: 'nowrap', marginTop: 4 }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${f.pct}%`, background: `var(--${f.tone === 'fresh' ? 'accent' : f.tone + '-bar'})` }} /></div><span style={{ fontSize: 12, fontWeight: 800, color: `var(--${f.tone})` }}>{f.label}</span></div>}
                      </div>
                      <button className="chip" style={{ border: 0, background: i.status === 'stocked' ? 'var(--fresh-soft)' : i.status === 'low' ? 'var(--warn-soft)' : 'var(--bad-soft)', color: i.status === 'stocked' ? 'var(--fresh)' : i.status === 'low' ? 'var(--warn)' : 'var(--bad)' }} onClick={() => cycle(i)} aria-label={`${i.name}: ${STATUS_LABEL[i.status]}. Tap to change.`}>{STATUS_LABEL[i.status]}</button>
                      <button className="btn ghost sm" style={{ border: 0 }} onClick={() => remove(i)} aria-label={`Remove ${i.name}`}><Icon name="trash" size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </>
      ) : (
        <>
          <form className="row" onSubmit={addToList} style={{ flexWrap: 'nowrap' }}>
            <label htmlFor="s-new" className="lbl" hidden>Add item</label>
            <input id="s-new" className="input" maxLength={60} placeholder="Add an item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <button className="btn" type="submit" aria-label="Add"><Icon name="plus" size={18} /></button>
          </form>
          {list === null ? <p className="muted">Loading…</p> : list.length === 0 ? <div className="empty"><b>Nothing to buy</b>Items you mark as out show up here.</div> : list.map((it) => (
            <div key={it.id} className="card row" style={{ padding: '10px 12px', flexWrap: 'nowrap' }}>
              <button className="btn ghost sm" style={{ width: 38, padding: 0 }} onClick={() => bought(it)} aria-label={`Bought ${it.name}`}><Icon name="check" size={18} /></button>
              <b style={{ flex: 1 }}>{it.name}</b>
              <button className="btn ghost sm" style={{ border: 0 }} onClick={async () => { setList((l) => l.filter((x) => x.id !== it.id)); await supabase.from('shopping_items').delete().eq('id', it.id); }} aria-label={`Remove ${it.name}`}><Icon name="trash" size={18} /></button>
            </div>
          ))}
          {list?.length > 0 && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Tap ✓ when you buy something. It goes back into your pantry as stocked.</p>}
        </>
      )}
    </div>
  );
}
