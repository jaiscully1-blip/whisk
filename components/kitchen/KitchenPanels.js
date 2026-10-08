'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { useKitchens } from '@/components/usePantry';
import * as K from '@/lib/kitchen/models';
import Kitchen3D from './Kitchen3D';

export const FOOD = { Proteins: '🍗', Produce: '🥦', 'Dairy & Eggs': '🥛', 'Carbs & Grains': '🍞', 'Canned & Jarred': '🥫', 'Sauces & Oils': '🫒', 'Spices & Seasonings': '🧂', Frozen: '🧊', Baking: '🧁', Other: '🛒' };

// The kitchen that's on display, with each spot's items worked out.
export function useShownKitchen(items) {
  const [kitchens] = useKitchens();
  const shown = kitchens?.find((k) => k.is_display) || null;
  const pieces = useMemo(() => (shown ? K.cleanPieces(shown.pieces) : []), [shown]);
  const { idx, at } = useMemo(() => K.spotsOf(pieces, (items || []).filter((i) => i.status !== 'out')), [pieces, items]);
  const todo = useMemo(() => (items || []).filter((i) => i.status !== 'out' && !(i.spot && idx.map[i.spot])), [items, idx]);
  return { loading: kitchens === null, shown, pieces, idx, at, todo };
}

// Floats between the category chips and the list. Pick a category → every spot holding it opens and lights up.
export function KitchenFloat({ items, filter }) {
  const router = useRouter();
  const { loading, shown, pieces, at, todo } = useShownKitchen(items);
  const cat = filter && filter !== 'All' ? filter : null;
  const { spot, open, count } = useMemo(() => {
    const spot = {}, open = {}; let count = 0;
    for (const [key, list] of Object.entries(at)) {
      const hit = cat ? list.filter((i) => i.category === cat) : [];
      if (!hit.length) continue;
      count += hit.length;
      const [bid, ci] = key.split('|');
      open[`${bid}:${ci}`] = true;
      spot[key] = { lit: true, tags: hit.map((i) => i.name) };
    }
    return { spot, open, count };
  }, [at, cat]);
  if (loading) return null;
  if (!shown) return (
    <Link href="/pantry/kitchen/design" className="card kf-empty">
      <span className="kf-cube"><Icon name="pantry" size={26} /></span>
      <span style={{ flex: 1 }}><b>Layout kitchen</b><span className="desc" style={{ display: 'block' }}>Build your kitchen in 3D. See where everything lives.</span></span>
      <Icon name="chevron" size={20} />
    </Link>
  );
  const away = cat ? todo.filter((i) => i.category === cat).length : todo.length;
  return (
    <section className="kfloat" aria-label={cat ? `${cat} in your kitchen` : 'Your kitchen'}>
      <Kitchen3D mode="mini" float pieces={pieces} open={open} spot={spot} height={230} scale={0.74} onTap={() => router.push('/pantry/kitchen')} />
      <div className="kf-bar">
        {cat ? <span className="chip kf-chip">{FOOD[cat]} {count ? `${count} in the kitchen` : 'none put away'}</span> : <span className="chip kf-chip">{shown.name}</span>}
        {away > 0
          ? <Link href="/pantry/kitchen" className="btn sm kf-go">{away} to put away<Icon name="chevron" size={16} /></Link>
          : <Link href="/pantry/kitchen" className="btn ghost sm">Open<Icon name="chevron" size={16} /></Link>}
      </div>
    </section>
  );
}

// Pantry › Kitchen tab: your kitchen in 3D. Open doors, tap a spot to see what's there.
export function KitchenTab({ items }) {
  const { loading, shown, pieces, idx, at, todo } = useShownKitchen(items);
  const [open, setOpen] = useState({});
  const [picked, setPicked] = useState(null);
  const [cam, setCam] = useState({ rz: -24, rx: 56 });
  if (loading) return <p className="muted">Loading your kitchen…</p>;
  if (!shown) return (
    <div className="empty" style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <span className="kf-cube big"><Icon name="pantry" size={34} /></span>
      <b>No kitchen yet</b>
      <Link href="/pantry/kitchen/design" className="btn">Layout kitchen</Link>
    </div>
  );
  const spot = {};
  for (const [key, list] of Object.entries(at)) spot[key] = { tags: list.map((i) => i.name) };
  if (picked) spot[picked] = { ...(spot[picked] || {}), on: true };
  const here = picked ? at[picked] || [] : [];
  return (
    <div className="stack">
      <Kitchen3D mode="view" pieces={pieces} cam={cam} onCam={setCam} open={open} spot={spot} height={400}
        onToggle={(k) => setOpen((o) => ({ ...o, [k]: !o[k] }))} onSpot={(k) => setPicked(k)} />
      {picked && (
        <div className="card row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <span className="kf-cube"><Icon name="flag" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{idx.map[picked]?.label}</b>
            <div className="row" style={{ marginTop: 6 }}>{here.length ? here.map((i) => <span key={i.id} className="chip">{FOOD[i.category]} {i.name}</span>) : <span className="muted">Empty here</span>}</div>
          </div>
        </div>
      )}
      <div className="grid2">
        <Link href="/pantry/kitchen" className="btn">{todo.length ? `Put away · ${todo.length}` : 'Put food away'}</Link>
        <Link href="/pantry/kitchen/design" className="btn ghost"><Icon name="pencil" size={18} />Design</Link>
      </div>
    </div>
  );
}
