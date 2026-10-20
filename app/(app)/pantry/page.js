'use client';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useWhisk, useDraft } from '@/components/AppShell';
import { isFrozenMeat, thawState, THAW_HOURS } from '@/lib/recipes/match';
import Icon from '@/components/Icon';
import { CATEGORIES, freshness, guessCategory, shelve, learnAisle, catKey } from '@/lib/game';
import ScanSheet from '@/components/ScanSheet';
import { usePantry, useList } from '@/components/usePantry';
import ShareListSheet from '@/components/ShareListSheet';
import StockMeter from '@/components/StockMeter';
import StaplesCheck from '@/components/StaplesCheck';
import { nextLevel, needsReup } from '@/lib/stock';

// The shopping list follows a walk through the store: fresh stuff first, frozen last so it stays cold.
const AISLES = ['Produce', 'Proteins', 'Dairy & Eggs', 'Carbs & Grains', 'Canned & Jarred', 'Sauces & Oils', 'Spices & Seasonings', 'Baking', 'Frozen', 'Other'];

export default function Pantry() {
  const { supabase, say, refreshProfile, ui, setUi, t } = useWhisk();
  const tab = ui.pantryTab === 'list' ? 'list' : 'pantry'; const setTab = (t) => { setUi({ pantryTab: t }); window.scrollTo(0, 0); requestAnimationFrame(() => window.scrollTo(0, 0)); };   // saved recipes moved to Cook
  const filter = ui.pantryFilter || 'All'; const setFilter = (f) => setUi({ pantryFilter: f });
  const [items, reloadItems, setItems] = usePantry();   // remembered between tabs (lib/cache.js)
  const [list, reloadList, setList] = useList();
  // Everything you type here is remembered until you add it, even across devices.
  const [fName, setFName, clrName] = useDraft('p-name');
  const [fQty, setFQty, clrQty] = useDraft('p-qty');
  const [fExp, setFExp, clrExp] = useDraft('p-exp');
  const [fKind, setFKind, clrKind] = useDraft('p-kind');   // '' = fresh, 'frozen', 'canned'
  const kind = ['fresh', 'frozen', 'canned'].includes(fKind) ? fKind : '';   // '' = nothing picked (not every item is fresh); tap the picked one again to un-pick
  const form = { name: fName, quantity: fQty, expires_on: fExp };
  const setForm = (next) => { const f = typeof next === 'function' ? next(form) : next; if (f.name !== fName) setFName(f.name); if (f.quantity !== fQty) setFQty(f.quantity); if (f.expires_on !== fExp) setFExp(f.expires_on); };
  const [newItem, setNewItem, clrNewItem] = useDraft('s-new');
  const [scan, setScan] = useState(null); // 'receipt' | 'barcode'
  const [sharing, setSharing] = useState(false);
  const [typeIt, setTypeIt] = useState(false);   // empty pantry: the type-it-in form stays folded away until asked for
  async function addBasics() {
    const BASICS = [['Eggs', 'Dairy & Eggs'], ['Milk', 'Dairy & Eggs'], ['Butter', 'Dairy & Eggs'], ['Onion', 'Produce'], ['Garlic', 'Produce'], ['Rice', 'Carbs & Grains'], ['Pasta', 'Carbs & Grains'], ['Olive oil', 'Sauces & Oils'], ['Salt', 'Spices & Seasonings'], ['Black pepper', 'Spices & Seasonings']];
    const { error } = await supabase.from('pantry_items').insert(BASICS.map(([name, category]) => ({ name, category })));
    if (error) { say('Couldn’t add those. Try again'); return; }
    say('10 basics added. Now see what you can cook'); load();
  }
  const bare = tab === 'pantry' && items !== null && items.length === 0;
  // ticks made on the shared link show up when you come back to the app
  useEffect(() => { const vis = () => { if (!document.hidden && tab === 'list') load(); }; document.addEventListener('visibilitychange', vis); return () => document.removeEventListener('visibilitychange', vis); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = () => Promise.all([reloadItems(), reloadList()]);

  async function addPantry(e) {
    e.preventDefault();
    const name = form.name.trim(); if (!name) return;
    const category = kind === 'frozen' ? 'Frozen' : kind === 'canned' ? 'Canned & Jarred' : shelve(name, ui.catMap);   // Frozen / Canned come from the picker; Fresh is shelved from the name ("fish sauce" → Sauces & Oils)
    const { data, error } = await supabase.from('pantry_items').insert({ name: name.slice(0, 60), category, quantity: form.quantity.trim().slice(0, 30) || null, expires_on: form.expires_on || null }).select().single();
    if (error) { say('Couldn’t add that.'); return; }
    setItems((x) => [...x, data].sort((a, b) => a.name.localeCompare(b.name)));
    clrName(); clrQty(); clrExp(); clrKind();
    window.dispatchEvent(new CustomEvent('whisk:added', { detail: data.name }));   // the first-time tour listens for this
    refreshProfile(); say(isFrozenMeat(data) ? `Added ${data.name} · frozen meat, remember to defrost` : `Added ${data.name}`);
  }
  // From a receipt or barcode: restock what's already in the pantry, add the rest.
  async function addMany(found) {
    const byName = new Map((items || []).map((i) => [i.name.toLowerCase(), i]));
    const fresh = [], restock = [];
    for (const f of found) { const ex = byName.get(f.name.toLowerCase()); if (ex) restock.push(ex.id); else if (!fresh.some((x) => x.name.toLowerCase() === f.name.toLowerCase())) fresh.push(f); }
    const [ins, upd] = await Promise.all([
      fresh.length ? supabase.from('pantry_items').insert(fresh.map((f) => ({ name: f.name, category: (ui.catMap || {})[catKey(f.name)] || f.category, quantity: f.quantity }))) : { error: null },
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
    const status = nextLevel(item.status);
    const patch = status === 'stocked' ? { status, thaw_started_at: null } : { status };
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, ...patch } : i)));
    await supabase.from('pantry_items').update(patch).eq('id', item.id);
    if (status === 'out') {
      if (onList.has(item.name.toLowerCase())) { say(`${item.name} is out · already on your list`); return; }
      await supabase.from('shopping_items').insert({ name: item.name, category: item.category }); say(`${item.name} is out · added to your list`); load();
    }
  }
  // Reup: a Low or Out item goes on the shopping list once; buying it (the tick on the list) makes it Full again
  const onList = new Set((list || []).map((l) => l.name.toLowerCase()));
  async function reup(item) {
    if (onList.has(item.name.toLowerCase())) return;
    const { error } = await supabase.from('shopping_items').insert({ name: item.name, category: item.category });
    if (error) { say('Could not add it. Try again.'); return; }
    say(`${item.name} is on your list`); load();
  }
  // Staples check: add one staple (or all that are low/out) to the shopping list
  async function addStaples(r) {
    const rows = (Array.isArray(r) ? r : [r]).filter((x) => !onList.has(x.name.toLowerCase()));
    if (!rows.length) return;
    const { error } = await supabase.from('shopping_items').insert(rows.map((x) => ({ name: x.name, category: x.category || guessCategory(x.name) })));
    if (error) { say('Could not add those. Try again.'); return; }
    say(rows.length === 1 ? `${rows[0].name} is on your list` : `${rows.length} staples are on your list`); load();
  }
  // change or reset (clear) an item's expiry date
  async function setExpiry(item, v) {
    const expires_on = v || null;
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, expires_on } : i)));
    const { error } = await supabase.from('pantry_items').update({ expires_on }).eq('id', item.id);
    if (error) { say('Couldn’t change the date.'); reloadItems(); return; }
    say(expires_on ? `${item.name}: expires ${new Date(expires_on + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : `${item.name}: expiry reset`);
  }
  async function startThaw(item) {
    const at = new Date().toISOString();
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, thaw_started_at: at } : i)));
    const { error } = await supabase.from('pantry_items').update({ thaw_started_at: at }).eq('id', item.id);
    say(error ? 'Couldn’t update that item.' : `${item.name} is thawing in the fridge · ready in about ${THAW_HOURS} hours`);
  }
  // Deleted straight away (so it is really gone); Undo puts the same row back.
  async function remove(item) {
    setItems((x) => x.filter((i) => i.id !== item.id));
    const { error } = await supabase.from('pantry_items').delete().eq('id', item.id);
    if (error) { setItems((x) => [...x.filter((i) => i.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name))); say('Couldn’t remove that, try again.'); return; }
    say(`Removed ${item.name}`, { label: 'Undo', run: async () => {
      setItems((x) => [...x.filter((i) => i.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name)));
      const { error: e2 } = await supabase.from('pantry_items').insert(item);
      if (e2) { setItems((x) => x.filter((i) => i.id !== item.id)); say('Couldn’t bring that back.'); }
    } });
  }
  async function removeFromList(it) {
    setList((l) => l.filter((x) => x.id !== it.id));
    const { error } = await supabase.from('shopping_items').delete().eq('id', it.id);
    if (error) { setList((l) => [...l.filter((x) => x.id !== it.id), it]); say('Couldn’t remove that, try again.'); return; }
    say(`Removed ${it.name}`, { label: 'Undo', run: async () => {
      setList((l) => [...l.filter((x) => x.id !== it.id), it]);
      const { error: e2 } = await supabase.from('shopping_items').insert(it);
      if (e2) { setList((l) => l.filter((x) => x.id !== it.id)); say('Couldn’t bring that back.'); }
    } });
  }
  // Moving an item to another aisle: your choice is remembered for that name, next time it goes there by itself.
  const [moving, setMoving] = useState(null);
  async function moveItem(item, category) {
    setMoving(null);
    if (category === item.category) return;
    setItems((x) => x.map((i) => (i.id === item.id ? { ...i, category } : i)));
    const { error } = await supabase.from('pantry_items').update({ category }).eq('id', item.id);
    if (error) { setItems((x) => x.map((i) => (i.id === item.id ? { ...i, category: item.category } : i))); say('Couldn’t move that.'); return; }
    setUi({ catMap: learnAisle(ui.catMap, item.name, category) });
    say(`${item.name} is now in ${category}`);
  }
  // Re-shelves everything you haven't placed yourself, with the latest sorting rules.
  async function tidyAisles() {
    const mine = ui.catMap || {};
    const moves = (items || []).map((i) => ({ i, to: mine[catKey(i.name)] || guessCategory(i.name) })).filter((m) => m.to !== 'Other' && m.to !== m.i.category && !mine[catKey(m.i.name)]);
    if (!moves.length) { say('Everything is already in the right aisle'); return; }
    setItems((x) => x.map((i) => { const m = moves.find((v) => v.i.id === i.id); return m ? { ...i, category: m.to } : i; }));
    const res = await Promise.all(moves.map((m) => supabase.from('pantry_items').update({ category: m.to }).eq('id', m.i.id)));
    const failed = res.filter((r) => r.error).length;
    if (failed) load();
    say(`Moved ${moves.length - failed} item${moves.length - failed === 1 ? '' : 's'} to the right aisle`);
  }
  // Quick add: the staples you pick (★ on an item). One tap puts it back in the pantry, stocked.
  const quick = ui.quickAdd || [];
  const isQuick = (name) => quick.some((q) => q.name.toLowerCase() === name.toLowerCase());
  // Starring never moves the screen: no toast, and when the Quick add row appears/disappears above, the page is
  // scrolled back by exactly that much so the tapped star stays under the finger.
  const starAnchor = useRef(null);
  function toggleQuick(item, e) {
    const btn = e?.currentTarget;
    starAnchor.current = btn ? { btn, top: btn.getBoundingClientRect().top } : null;
    setUi({ quickAdd: isQuick(item.name) ? quick.filter((q) => q.name.toLowerCase() !== item.name.toLowerCase()) : [...quick, { name: item.name, category: item.category }].slice(-24) });
  }
  useLayoutEffect(() => {
    const a = starAnchor.current; if (!a) return; starAnchor.current = null;
    if (!a.btn.isConnected) return;
    const d = a.btn.getBoundingClientRect().top - a.top;
    if (Math.abs(d) > 0.5) { const sc = document.scrollingElement; if (sc) sc.scrollTop += d; }
  }, [quick.length]);
  async function quickAdd(q) {
    const ex = (items || []).find((i) => i.name.toLowerCase() === q.name.toLowerCase());
    if (ex && ex.status === 'stocked') { say(`${ex.name} is already stocked`); return; }
    if (ex) {
      setItems((x) => x.map((i) => (i.id === ex.id ? { ...i, status: 'stocked', thaw_started_at: null } : i)));
      await supabase.from('pantry_items').update({ status: 'stocked', added_at: new Date().toISOString(), thaw_started_at: null }).eq('id', ex.id);
    } else {
      const { data, error } = await supabase.from('pantry_items').insert({ name: q.name, category: (ui.catMap || {})[catKey(q.name)] || q.category || guessCategory(q.name) }).select().single();
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
      <div className="page-title"><h1>{t('Pantry')}</h1>
        <Link href="/pantry/kitchen" prefetch className="title-link kitchen-btn" data-testid="kitchen-btn" data-tip="kitchen" aria-label={t('Kitchen')}><FridgeIcon /></Link>
      </div>
      <div className="row tabrow" role="tablist">
        <button className={`btn sm ${tab === 'pantry' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'pantry'} onClick={() => setTab('pantry')}>Pantry {items ? `(${items.length})` : ''}</button>
        <button className={`btn sm ${tab === 'list' ? '' : 'ghost'}`} role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>Shopping list {list ? `(${list.length})` : ''}</button>
      </div>

      {tab === 'pantry' ? (
        <>
          <div className="grid2 scanrow">
            <button type="button" data-tour="scan" data-tip="receipt" className="scan-tile receipt" onClick={() => setScan('receipt')}><ReceiptArt /><span><b>{t('Scan receipt')}</b><small>{t('Add a full grocery trip')}</small></span></button>
            <button type="button" className="scan-tile barcode" data-tip="barcode" onClick={() => setScan('barcode')}><BarcodeArt /><span><b>{t('Scan barcode')}</b><small>{t('Add one item')}</small></span></button>
          </div>
          {bare && (
            <section className="basket-empty" data-testid="pantry-empty">
              <svg viewBox="0 0 96 80" width="110" height="92" aria-hidden="true"><path d="M14 36h68l-6 34a8 8 0 0 1-8 6H28a8 8 0 0 1-8-6z" fill="#C98A4B"/><path d="M14 36h68" stroke="#9C6532" strokeWidth="4" strokeLinecap="round"/><path d="M26 36c0-18 9-28 22-28s22 10 22 28" fill="none" stroke="#9C6532" strokeWidth="5" strokeLinecap="round"/><path d="M30 44v24M42 44v26M54 44v26M66 44v24" stroke="#A8702F" strokeWidth="3" strokeLinecap="round"/></svg>
              <h2>{t('Your pantry is empty')}</h2>
              <p>{t('Add what you bought. Then Cook shows recipes you can make right now.')}</p>
              <button type="button" className="btn wide" data-testid="start-basics" onClick={addBasics}>{t('Start with 10 basics')}</button>
              <button type="button" className="fr-more" data-testid="type-it-in" onClick={() => setTypeIt((v) => !v)}>{typeIt ? t('Hide the form') : t('Or type one in')}</button>
            </section>
          )}
          {quick.length > 0 && !bare && (
            <section className="quick" aria-label={t('Quick add')}>
              <span className="eyebrow">{t('Quick add')}</span>
              <div className="quick-row">{quick.map((q) => { const ex = (items || []).find((i) => i.name.toLowerCase() === q.name.toLowerCase()); const stocked = ex?.status === 'stocked'; return (
                <button key={q.name} type="button" className={`chip quick-chip ${stocked ? 'have' : ''}`} onClick={() => quickAdd(q)} aria-label={stocked ? `${q.name} is stocked` : `Quick add ${q.name}`}>{stocked ? <Icon name="check" size={14} /> : <Icon name="plus" size={14} />}{q.name}</button>
              ); })}</div>
            </section>
          )}
          {(!bare || typeIt) && <form className={`card stack addform k-${kind}`} onSubmit={addPantry}>
            <div className="kindbar" role="radiogroup" aria-label={t('Type')}>
              {[['fresh', 'Fresh', 'leaf'], ['frozen', 'Frozen', 'snow'], ['canned', 'Canned', 'pantry']].map(([k, label, ic]) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={`kind k-${k} ${kind === k ? 'on' : ''}`} data-testid={`kind-${k}`} onClick={() => setFKind(kind === k ? '' : k)}><Icon name={ic} size={16} />{label}</button>
              ))}
            </div>
            <div className="grid2">
              <div style={{ gridColumn: '1 / -1' }}><label className="lbl" htmlFor="p-name">{t('Item')}</label><input id="p-name" className="input" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="lbl" htmlFor="p-qty">{t('Amount')}</label><input id="p-qty" className="input" maxLength={30} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
              <div style={{ minWidth: 0 }}><label className="lbl" htmlFor="p-exp">{t('Expires')}</label><div className="date-wrap"><input id="p-exp" className={`input ${form.expires_on ? '' : 'empty'}`} type="date" value={form.expires_on} onChange={(e) => setForm({ ...form, expires_on: e.target.value })} /></div>{form.expires_on && <button type="button" className="date-reset" onClick={() => setForm({ ...form, expires_on: '' })} aria-label="Reset the expiry date">Reset</button>}</div>
            </div>
            <button data-tour="add" data-tip="add" className="btn" type="submit"><Icon name="plus" size={18} />Add to pantry</button>
          </form>}

          {!bare && <div className="row catrow">
            {['All', ...CATEGORIES].map((c) => <button key={c} className={`chip`} style={{ border: 0, background: filter === c ? 'var(--fg)' : 'var(--track)', color: filter === c ? 'var(--bg)' : 'var(--fg)' }} onClick={() => { setFilter(c); setTimeout(() => { const el = document.getElementById('pantry-items'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } }, 60); }}>{c}</button>)}
          </div>}
          <div id="pantry-items" style={{ height: 0 }} />

          {items === null ? <p className="muted">{t('Loading your pantry…')}</p> : items.length === 0 ? null : groups.map(([cat, list], gi) => (
            <section key={cat} className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="eyebrow">{cat} · {list.length}</span>
                {gi === 0 && <button type="button" className="chip tidy-chip" data-testid="tidy-aisles" onClick={tidyAisles}>Tidy up</button>}
              </div>
              {list.map((i) => {
                const f = freshness(i);
                return (
                  <div key={i.id} className="card" style={{ padding: '10px 12px', borderColor: i.status === 'out' ? 'var(--bad)' : i.status === 'low' ? 'var(--warn-bar)' : 'var(--line)' }}>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ textDecoration: i.status === 'out' ? 'line-through' : 'none' }}>{i.name}</b>{i.quantity && <span className="muted"> · {i.quantity}</span>}
                        {(() => { const t = thawState(i); if (!t) return null; return <div style={{ marginTop: 4 }}>{t.state === 'frozen' ? <button className="chip ice" onClick={() => startThaw(i)}><Icon name="snow" size={14} />Frozen meat · tap to start thawing</button> : t.state === 'thawing' ? <span className="chip ice"><Icon name="snow" size={14} />Thawing · ~{t.hoursLeft} h left</span> : <span className="chip ice drip"><Drip />Thawed · use by {useBy(i)}</span>}</div>; })()}
                        <div className="row exp-row">
                          <button type="button" className="chip aisle-chip" data-testid="aisle-chip" onClick={() => setMoving(i)} aria-label={`${i.name} is in ${i.category}. Tap to move it to another aisle`}>{i.category}<Icon name="chevron" size={12} /></button>
                          <label className={`chip exp-chip ${i.expires_on ? '' : 'ghost'}`}>{i.expires_on ? `Expires ${new Date(i.expires_on + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '+ expiry'}
                            <input type="date" value={i.expires_on || ''} onChange={(e) => setExpiry(i, e.target.value)} aria-label={`${i.name} expiry date`} /></label>
                          {i.expires_on && <button type="button" className="chip exp-reset" onClick={() => setExpiry(i, null)} aria-label={`Reset ${i.name} expiry`}>Reset</button>}
                        </div>
                        {f && <div className="row" style={{ gap: 8, flexWrap: 'nowrap', marginTop: 4 }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${f.pct}%`, background: `var(--${f.tone === 'fresh' ? 'accent' : f.tone + '-bar'})` }} /></div><span style={{ fontSize: 12, fontWeight: 800, color: `var(--${f.tone})` }}>{f.label}</span></div>}
                      </div>
                      {needsReup(i.status) && (onList.has(i.name.toLowerCase())
                        ? <span className="chip reup-on" aria-label={`${i.name} is on your list`}><Icon name="check" size={14} />On list</span>
                        : <button type="button" className="chip reup" onClick={() => reup(i)} aria-label={`Reup ${i.name}: add to shopping list`}>Reup</button>)}
                      <StockMeter status={i.status} name={i.name} aisle={i.category} onClick={() => cycle(i)} />
                      <button className={`btn ghost sm star ${isQuick(i.name) ? 'on' : ''}`} style={{ border: 0, width: 36, padding: 0 }} onClick={(e) => toggleQuick(i, e)} aria-pressed={isQuick(i.name)} aria-label={isQuick(i.name) ? `Take ${i.name} out of Quick add` : `Put ${i.name} in Quick add`}><Icon name="star" size={18} /></button>
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
          <button type="button" className="btn ghost wide share-btn" onClick={() => setSharing(true)}><Icon name="share" size={18} />{t('Share list')}</button>
          <form className="row" onSubmit={addToList} style={{ flexWrap: 'nowrap' }}>
            <label htmlFor="s-new" className="lbl" hidden>{t('Add item')}</label>
            <input id="s-new" className="input" maxLength={60} placeholder={t('Add an item')} value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <button className="btn" type="submit" aria-label={t('Add')}><Icon name="plus" size={18} /></button>
          </form>
          <StaplesCheck quick={quick} items={items} list={list} onAdd={addStaples} />
          {list === null ? <p className="muted">{t('Loading…')}</p> : list.length === 0 ? <div className="empty"><b>{t('Nothing to buy')}</b></div> : aisles.map(([aisle, rows]) => (
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
        </>
      )}
      {moving && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMoving(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Move ${moving.name}`}>
            <h2 style={{ fontSize: 22 }}>Move {moving.name}</h2>
            <p className="desc" style={{ margin: 0 }}>Pick the aisle it belongs in. Yoke remembers, so it goes there by itself next time.</p>
            <div className="row" style={{ gap: 8 }}>
              {CATEGORIES.map((c) => <button key={c} type="button" className={`chip aisle-pick ${c === moving.category ? 'on' : ''}`} data-testid={`aisle-${c}`} aria-pressed={c === moving.category} onClick={() => moveItem(moving, c)}>{c}</button>)}
            </div>
            <button className="btn ghost wide" onClick={() => setMoving(null)}>Cancel</button>
          </div>
        </div>
      )}
      {sharing && <ShareListSheet onClose={() => setSharing(false)} />}
      {scan && <ScanSheet mode={scan} onAdd={addMany} onClose={() => setScan(null)} />}
    </div>
  );
}

// Drawn pictures for the two scan tiles, and the small icons for the Kitchen button and the expiry box.
function ReceiptArt() {
  return (
    <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 3h16v26l-2.7-2-2.6 2-2.7-2-2.7 2-2.6-2L8 29z" fill="#fff8ec" stroke="#3B2C24" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M11 9h10M11 13h7M11 17h10M11 21h5" stroke="#8a817c" strokeWidth="1.5" strokeLinecap="round" /><path d="M19.5 21h2" stroke="#FF8A3D" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BarcodeArt() {
  return (
    <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true">
      <rect x="4" y="7" width="24" height="18" rx="3" fill="#fff" stroke="#3B2C24" strokeWidth="1.4" />
      <path d="M8 10v12M10 10v12M13 10v12M15.5 10v12M17 10v12M20 10v12M22 10v12M24 10v12" stroke="#3B2C24" strokeWidth="1.3" />
      <path d="M2 16h28" stroke="#EF5350" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function Drip() { return <svg width="12" height="14" viewBox="0 0 14 16" aria-hidden="true"><path d="M7 1C7 1 2 7 2 10a5 5 0 0 0 10 0C12 7 7 1 7 1z" fill="currentColor" /></svg>; }
// Fully thawed + 2 days in the fridge, as a real day ("Mon"); if that has passed: "today".
function useBy(i) {
  const end = new Date(i.thaw_started_at).getTime() + (THAW_HOURS + 48) * 3600e3;
  return end <= Date.now() ? 'today' : new Date(end).toLocaleDateString(undefined, { weekday: 'short' });
}
function FridgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M6 9.5h12M9 5.5v2M9 12v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  );
}
