'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk, useDraft } from '@/components/AppShell';
import { isFrozenMeat, thawState, THAW_HOURS } from '@/lib/recipes/match';
import Icon from '@/components/Icon';
import { CATEGORIES, freshness, guessCategory } from '@/lib/game';
import ScanSheet from '@/components/ScanSheet';
import SavedRecipes from '@/components/SavedRecipes';
import ShareListSheet from '@/components/ShareListSheet';

const NEXT_STATUS = { stocked: 'low', low: 'out', out: 'stocked' };
const STATUS_LABEL = { stocked: 'Stocked', low: 'Low', out: 'Out' };
// The shopping list follows a walk through the store: fresh stuff first, frozen last so it stays cold.
const AISLES = ['Produce', 'Proteins', 'Dairy & Eggs', 'Carbs & Grains', 'Canned & Jarred', 'Sauces & Oils', 'Spices & Seasonings', 'Baking', 'Frozen', 'Other'];
// Deletes wait a few seconds so Undo can take them back. Kept outside the page so leaving the page still deletes.
const pending = new Map();
const later = (key, fn) => { clearTimeout(pending.get(key)); pending.set(key, setTimeout(() => { pending.delete(key); fn(); }, 5200)); };
const cancel = (key) => { clearTimeout(pending.get(key)); pending.delete(key); };

export default function Pantry() {
  const { supabase, say, refreshProfile, ui, setUi } = useWhisk();
  const tab = ui.pantryTab || 'pantry'; const setTab = (t) => setUi({ pantryTab: t });
  const filter = ui.pantryFilter || 'All'; const setFilter = (f) => setUi({ pantryFilter: f });
  const [items, setItems] = useState(null);
  const [list, setList] = useState(null);
  // Everything you type here is remembered until you add it, even across devices.
  const [fName, setFName, clrName] = useDraft('p-name');
  const [fQty, setFQty, clrQty] = useDraft('p-qty');
  const [fExp, setFExp, clrExp] = useDraft('p-exp');
  const form = { name: fName, quantity: fQty, expires_on: fExp };
  const setForm = (next) => { const f = typeof next === 'function' ? next(form) : next; if (f.name !== fName) setFName(f.name); if (f.quantity !== fQty) setFQty(f.quantity); if (f.expires_on !== fExp) setFExp(f.expires_on); };
  const [newItem, setNewItem, clrNewItem] = useDraft('s-new');
  const [scan, setScan] = useState(null); // 'receipt' | 'barcode'
  const [sharing, setSharing] = useState(false);
  // ticks made on the shared link show up when you come back to the app
  useEffect(() => { const vis = () => { if (!document.hidden && tab === 'list') load(); }; document.addEventListener('visibilitychange', vis); return () => document.removeEventListener('visibilitychange', vis); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const category = guessCategory(name);   // shelved automatically from the name ("fish sauce" → Sauces & Oils)
    const { data, error } = await supabase.from('pantry_items').insert({ name: name.slice(0, 60), category, quantity: form.quantity.trim().slice(0, 30) || null, expires_on: form.expires_on || null }).select().single();
    if (error) { say('Couldn’t add that.'); return; }
    setItems((x) => [...x, data].sort((a, b) => a.name.localeCompare(b.name)));
    clrName(); clrQty(); clrExp();
    window.dispatchEvent(new CustomEvent('whisk:added', { detail: data.name }));   // the first-time tour listens for this
    refreshProfile(); say(isFrozenMeat(data) ? `Added ${data.name} · frozen meat, remember to defrost` : `Added ${data.name}`);
  }
  // From a receipt or barcode: restock what's already in the pantry, add the rest.
  async function addMany(found) {
    const byName = new Map((items || []).map((i) => [i.name.toLowerCase(), i]));
    const fresh = [], restock = [];
    for (const f of found) { const ex = byName.get(f.name.toLowerCase()); if (ex) restock.push(ex.id); else if (!fresh.some((x) => x.name.toLowerCase() === f.name.toLowerCase())) fresh.push(f); }
    const [ins, upd] = await Promise.all([
      fresh.length ? supabase.from('pantry_items').insert(fresh.map((f) => ({ name: f.name, category: f.category, quantity: f.quantity }))) : { error: null },
      restock.length ? supabase.from('pantry_items').update({ status: 'stocked', added_at: new Date().toISOString(), thaw_started_at: null }).in('id', restock) : { error: null }
    ]);
    if (ins.error || upd.error) { say('Some items couldn’t be added.'); }
    else say(`Added ${fresh.length}${restock.length ? ` · restocked ${restock.length}` : ''}`);
    // Bought it, so tick it off the shopping list too.
    const names = found.map((f) => f.name.toLowerCase());
    const done = (list || []).filter((l) => names.includes(l.name.toLowerCase())).map((l) => l.id);
    if (done.length) await supabase.from('shopping_items').delete().in('id', done);
    refreshProfile(); load();
  }
  async function cycle(item) {
    const status = NEXT_STATUS[item.status];
    const patch = status === 'stocked' ? { status, thaw_started_at: null } : { status };
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    await supabase.from('pantry_items').update(patch).eq('id', item.id);
    if (status === 'out') { await supabase.from('shopping_items').insert({ name: item.name, category: item.category }); say(`${item.name} is out · added to your list`); load(); }
  }
  async function startThaw(item) {
    const at = new Date().toISOString();
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, thaw_started_at: at } : i)));
    const { error } = await supabase.from('pantry_items').update({ thaw_started_at: at }).eq('id', item.id);
    say(error ? 'Couldn’t update that item.' : `${item.name} is thawing in the fridge · ready in about ${THAW_HOURS} hours`);
  }
  function remove(item) {
    setItems((x) => x.filter((i) => i.id !== item.id));
    later('p' + item.id, () => supabase.from('pantry_items').delete().eq('id', item.id));
    say(`Removed ${item.name}`, { label: 'Undo', run: () => { cancel('p' + item.id); setItems((x) => [...x.filter((i) => i.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name))); } });
  }
  function removeFromList(it) {
    setList((l) => l.filter((x) => x.id !== it.id));
    later('s' + it.id, () => supabase.from('shopping_items').delete().eq('id', it.id));
    say(`Removed ${it.name}`, { label: 'Undo', run: () => { cancel('s' + it.id); setList((l) => [...l.filter((x) => x.id !== it.id), it]); } });
  }
  // Quick add: the staples you pick (★ on an item). One tap puts it back in the pantry, stocked.
  const quick = ui.quickAdd || [];
  const isQuick = (name) => quick.some((q) => q.name.toLowerCase() === name.toLowerCase());
  function toggleQuick(item) {
    setUi({ quickAdd: isQuick(item.name) ? quick.filter((q) => q.name.toLowerCase() !== item.name.toLowerCase()) : [...quick, { name: item.name, category: item.category }].slice(-24) });
    say(isQuick(item.name) ? `${item.name} left Quick add` : `${item.name} is in Quick add`);
  }
  async function quickAdd(q) {
    const ex = (items || []).find((i) => i.name.toLowerCase() === q.name.toLowerCase());
    if (ex && ex.status === 'stocked') { say(`${ex.name} is already stocked`); return; }
    if (ex) {
      setItems((x) => x.map((i) => (i.id === ex.id ? { ...i, status: 'stocked', thaw_started_at: null } : i)));
      await supabase.from('pantry_items').update({ status: 'stocked', added_at: new Date().toISOString(), thaw_started_at: null }).eq('id', ex.id);
    } else {
      const { data, error } = await supabase.from('pantry_items').insert({ name: q.name, category: q.category || guessCategory(q.name) }).select().single();
      if (error) { say('Couldn’t add that.'); return; }
      setItems((x) => [...x, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
    say(`${q.name} is stocked`); refreshProfile();
  }
  async function addToList(e) {
    e.preventDefault();
    const name = newItem.trim(); if (!name) return;
    setNewItem(''); // clear right away so fast typists don't lose the next item
    const { data, error } = await supabase.from('shopping_items').insert({ name: name.slice(0, 60), category: guessCategory(name) }).select().single();
    if (error) { say(`Couldn’t add ${name}.`); setNewItem(name); return; }
    setList((l) => [...l, data]);
  }
  async function bought(it) {
    setList((l) => l.filter((x) => x.id !== it.id));
    await supabase.from('shopping_items').delete().eq('id', it.id);
    const existing = items.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
    if (existing) { await supabase.from('pantry_items').update({ status: 'stocked', added_at: new Date().toISOString(), thaw_started_at: null }).eq('id', existing.id); }
    else { await supabase.from('pantry_items').insert({ name: it.name, category: CATEGORIES.includes(it.category) && it.category !== 'Other' ? it.category : guessCategory(it.name) }); }
    say(`${it.name} restocked`); refreshProfile(); load();
  }

  const groups = useMemo(() => {
    const g = {};
    (items || []).filter((i) => filter === 'All' || i.category === filter).forEach((i) => { (g[i.category] ||= []).push(i); });
    return CATEGORIES.filter((c) => g[c]).map((c) => [c, g[c]]);
  }, [items, filter]);
  const aisles = useMemo(() => {
    const g = {};
    (list || []).forEach((i) => { const c = CATEGORIES.includes(i.category) && i.category !== 'Other' ? i.category : guessCategory(i.name); (g[c] ||= []).push(i); });
    return AISLES.filter((c) => g[c]).map((c) => [c, g[c]]);
  }, [list]);

  return (
    <div className="stack">
      <div className="page-title"><h1>{tab === 'pantry' ? 'Pantry' : tab === 'list' ? 'Shopping list' : 'Saved recipes'}</h1></div>
      <div className="row" role="tablist">
        <button className={`btn sm ${tab === 'pantry' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'pantry'} onClick={() => setTab('pantry')}>Pantry {items ? `(${items.length})` : ''}</button>
        <button className={`btn sm ${tab === 'list' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>Shopping list {list ? `(${list.length})` : ''}</button>
        <button className={`btn sm ${tab === 'saved' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}>Saved recipes</button>
      </div>

      {tab === 'saved' ? <SavedRecipes pantry={items} /> : tab === 'pantry' ? (
        <>
          <div className="grid2">
            <button data-tour="scan" data-tip="receipt" className="card row" style={{ justifyContent: 'center', fontWeight: 800 }} onClick={() => setScan('receipt')}><Icon name="receipt" size={22} />Scan receipt</button>
            <button className="card row" style={{ justifyContent: 'center', fontWeight: 800 }} data-tip="barcode" onClick={() => setScan('barcode')}><Icon name="barcode" size={22} />Scan barcode</button>
          </div>
          {quick.length > 0 && (
            <section className="quick" aria-label="Quick add">
              <span className="eyebrow">Quick add</span>
              <div className="quick-row">{quick.map((q) => { const ex = (items || []).find((i) => i.name.toLowerCase() === q.name.toLowerCase()); const stocked = ex?.status === 'stocked'; return (
                <button key={q.name} type="button" className={`chip quick-chip ${stocked ? 'have' : ''}`} onClick={() => quickAdd(q)} aria-label={stocked ? `${q.name} is stocked` : `Quick add ${q.name}`}>{stocked ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}{q.name}</button>
              ); })}</div>
            </section>
          )}
          <form className="card stack" onSubmit={addPantry}>
            <div className="grid2">
              <div style={{ gridColumn: '1 / -1' }}><label className="lbl" htmlFor="p-name">Item</label><input id="p-name" className="input" maxLength={60} placeholder="e.g. Frozen chicken breast" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="lbl" htmlFor="p-qty">Amount</label><input id="p-qty" className="input" maxLength={30} placeholder="2 lb" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div><label className="lbl" htmlFor="p-exp">Expires</label><input id="p-exp" className="input" type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} /></div>
            </div>
            <button data-tour="add" data-tip="add" className="btn" type="submit"><Icon name="plus" size={18} />Add to pantry · +5 XP</button>
            <span className="desc">Frozen food gets a defrost reminder.</span>
          </form>

          <div className="row">
            {['All', ...CATEGORIES].map((c) => <button key={c} className={`chip`} style={{ border: 0, background: filter === c ? 'var(--fg)' : 'var(--track)', color: filter === c ? 'var(--bg)' : 'var(--fg)' }} onClick={() => setFilter(c)}>{c}</button>)}
          </div>

          {items === null ? <p className="muted">Loading your pantry…</p> : items.length === 0 ? (
            <div className="empty"><b>Your pantry is empty</b></div>
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
                        {(() => { const t = thawState(i); if (!t) return null; return <div style={{ marginTop: 4 }}>{t.state === 'frozen' ? <button className="chip ice" onClick={() => startThaw(i)}><Icon name="snow" size={14} />Frozen meat · tap to start thawing</button> : t.state === 'thawing' ? <span className="chip ice"><Icon name="snow" size={14} />Thawing · ~{t.hoursLeft} h left</span> : <span className="chip have">Thawed · cook within 1–2 days</span>}</div>; })()}
                        {f && <div className="row" style={{ gap: 8, flexWrap: 'nowrap', marginTop: 4 }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${f.pct}%`, background: `var(--${f.tone === 'fresh' ? 'accent' : f.tone + '-bar'})` }} /></div><span style={{ fontSize: 12, fontWeight: 800, color: `var(--${f.tone})` }}>{f.label}</span></div>}
                      </div>
                      <button className="chip" style={{ border: 0, background: i.status === 'stocked' ? 'var(--fresh-soft)' : i.status === 'low' ? 'var(--warn-soft)' : 'var(--bad-soft)', color: i.status === 'stocked' ? 'var(--fresh)' : i.status === 'low' ? 'var(--warn)' : 'var(--bad)' }} onClick={() => cycle(i)} aria-label={`${i.name}: ${STATUS_LABEL[i.status]}. Tap to change.`}>{STATUS_LABEL[i.status]}</button>
                      <button className={`btn ghost sm star ${isQuick(i.name) ? 'on' : ''}`} style={{ border: 0, width: 36, padding: 0 }} onClick={() => toggleQuick(i)} aria-pressed={isQuick(i.name)} aria-label={isQuick(i.name) ? `Take ${i.name} out of Quick add` : `Put ${i.name} in Quick add`}><Icon name="star" size={18} /></button>
                      <button className="btn ghost sm" style={{ border: 0, width: 36, padding: 0 }} onClick={() => remove(i)} aria-label={`Remove ${i.name}`}><Icon name="trash" size={18} /></button>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </>
      ) : (
        <>
          <button type="button" className="btn ghost wide share-btn" onClick={() => setSharing(true)}><Icon name="share" size={18} />Share list · no app needed</button>
          <form className="row" onSubmit={addToList} style={{ flexWrap: 'nowrap' }}>
            <label htmlFor="s-new" className="lbl" hidden>Add item</label>
            <input id="s-new" className="input" maxLength={60} placeholder="Add an item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <button className="btn" type="submit" aria-label="Add"><Icon name="plus" size={18} /></button>
          </form>
          {list === null ? <p className="muted">Loading…</p> : list.length === 0 ? <div className="empty"><b>Nothing to buy</b>Items you mark as out show up here.</div> : aisles.map(([aisle, rows]) => (
            <section key={aisle} className="stack" style={{ gap: 6 }}>
              <span className="eyebrow">{aisle} · {rows.length}</span>
              {rows.map((it) => (
                <div key={it.id} className={`card row ${it.checked ? 'ticked' : ''}`} style={{ padding: '10px 12px', flexWrap: 'nowrap' }}>
                  <button className="btn ghost sm" style={{ width: 38, padding: 0 }} onClick={() => bought(it)} aria-label={`Bought ${it.name}`}><Icon name="check" size={18} /></button>
                  <b style={{ flex: 1 }}>{it.name}{it.checked && <span className="desc"> · ticked on the shared list</span>}</b>
                  <button className="btn ghost sm" style={{ border: 0 }} onClick={() => removeFromList(it)} aria-label={`Remove ${it.name}`}><Icon name="trash" size={18} /></button>
                </div>
              ))}
            </section>
          ))}
          {list?.length > 0 && <p className="desc" style={{ margin: 0 }}>Tap ✓ when you buy something. It goes back into your pantry as stocked.</p>}
        </>
      )}
      {sharing && <ShareListSheet onClose={() => setSharing(false)} />}
      {scan && <ScanSheet mode={scan} onAdd={addMany} onClose={() => setScan(null)} />}
    </div>
  );
}
