'use client';
import { useState } from 'react';
import Icon from './Icon';
import { LEVEL_LABEL } from '@/lib/stock';

// "Before you shop": your starred staples (Quick add) that are Low, Out or missing from the pantry and not on the list yet.
// One tap adds one, or all of them. Nothing is added without a tap.
export default function StaplesCheck({ quick, items, list, onAdd }) {
  const [busy, setBusy] = useState(false);
  if (!quick?.length || items === null || list === null) return null;
  const onList = new Set(list.map((l) => l.name.toLowerCase()));
  const rows = quick.map((q) => {
    const ex = items.find((i) => i.name.toLowerCase() === q.name.toLowerCase());
    return { ...q, level: ex ? ex.status : 'out' };
  }).filter((q) => (q.level === 'low' || q.level === 'out') && !onList.has(q.name.toLowerCase()));
  if (!rows.length) return <p className="desc staples-ok" style={{ margin: 0 }}><Icon name="check" size={14} /> Staples check: everything you star is stocked or on your list.</p>;
  const add = async (r) => { setBusy(true); await onAdd(r); setBusy(false); };
  return (
    <section className="card staples" aria-label="Staples check before you shop">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <div><span className="eyebrow">Before you shop</span><b className="staples-h">Running low on {rows.length} {rows.length === 1 ? 'staple' : 'staples'}</b></div>
        {rows.length > 1 && <button type="button" className="btn sm" disabled={busy} onClick={() => add(rows)}>Add all {rows.length}</button>}
      </div>
      {rows.map((r) => (
        <div key={r.name} className="staples-row">
          <span className="staples-name">{r.name}</span>
          <span className={`staples-lvl ${r.level}`}>{LEVEL_LABEL[r.level]}</span>
          <button type="button" className="chip reup" disabled={busy} onClick={() => add(r)} aria-label={`Add ${r.name} to the shopping list`}>Add</button>
        </div>
      ))}
    </section>
  );
}
