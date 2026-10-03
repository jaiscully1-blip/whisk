'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon from '@/components/Icon';
import { levelFor, fmt } from '@/lib/game';

const SLOTS = [['top', 'Top'], ['hat', 'Hat'], ['glasses', 'Glasses'], ['shoes', 'Shoes'], ['acc', 'Accessory']];
const EMPTY = { top: 'No top', hat: 'Classic toque', glasses: 'None', shoes: 'Bare feet', acc: 'Wooden spoon' };
const POSES = [['default', 'Me'], ['cooked', 'Cooked it!'], ['back', 'We’re so back!'], ['late', 'Late night snack...']];

export default function Me() {
  const { supabase, profile, setProfile, loadout, refreshLoadout, email, say } = useWhisk();
  const [owned, setOwned] = useState([]);
  const [slot, setSlot] = useState('top');
  const [pose, setPose] = useState('default');
  const [thumbs, setThumbs] = useState({});
  const [meals, setMeals] = useState([]);
  const [stats, setStats] = useState({ meals: 0 });
  const outfit = outfitFrom(loadout);
  const lvl = levelFor(profile?.xp);

  useEffect(() => {
    (async () => {
      const [inv, m, cnt] = await Promise.all([
        supabase.from('inventory').select('item_id, items(id, slot, name, rarity)'),
        supabase.from('meals').select('id, title, photo_path, cooked_at').order('cooked_at', { ascending: false }).limit(12),
        supabase.from('meals').select('id', { count: 'exact', head: true })
      ]);
      setOwned((inv.data || []).map((r) => r.items).filter(Boolean));
      setStats({ meals: cnt.count || 0 });
      const rows = m.data || [];
      if (rows.length) {
        const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrls(rows.map((r) => r.photo_path), 3600);
        setMeals(rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl })));
      }
    })();
  }, [supabase]);

  useEffect(() => {
    let alive = true;
    import('@/lib/whisk3d/engine').then(async ({ ITEMS_BY_ID, renderThumb }) => {
      for (const it of owned) { if (!alive) return; const def = ITEMS_BY_ID[it.id]; if (!def) continue; const url = renderThumb(def); setThumbs((t) => ({ ...t, [it.id]: url })); await new Promise((r) => setTimeout(r, 10)); }
    });
    return () => { alive = false; };
  }, [owned]);

  const inSlot = useMemo(() => owned.filter((i) => i.slot === slot), [owned, slot]);
  const byId = useMemo(() => Object.fromEntries(owned.map((i) => [i.id, i])), [owned]);

  async function equip(itemId) {
    const { error } = await supabase.rpc('equip_item', { p_slot: slot, p_item_id: itemId });
    if (error) { say('Couldn’t put that on.'); return; }
    refreshLoadout();
  }
  async function toggleNight() {
    const next = profile.theme_pref === 'night' ? 'day' : 'night';
    setProfile({ ...profile, theme_pref: next });
    const { error } = await supabase.from('profiles').update({ theme_pref: next }).eq('id', profile.id);
    if (error) say('Couldn’t save that setting.');
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>Me</h1><span className="muted" style={{ fontWeight: 800 }}>Lv {lvl.level} · {lvl.title}</span></div>

      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, var(--card) 0%, var(--stage) 70%)', border: '1px solid var(--line)' }}>
        <WhiskStage pose={pose} outfit={outfit} height={380} />
        <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>Drag to spin</span>
        <div className="row" style={{ position: 'absolute', left: 8, right: 8, bottom: 10, justifyContent: 'center', gap: 6 }}>
          {POSES.map(([k, l]) => <button key={k} className={`btn sm ${pose === k ? '' : 'ghost'}`} aria-pressed={pose === k} onClick={() => setPose(k)}>{l}</button>)}
        </div>
      </div>

      <div role="tablist" aria-label="Outfit slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 6 }}>
        {SLOTS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={slot === k} onClick={() => setSlot(k)} className="card" style={{ padding: '8px 6px', textAlign: 'left', borderColor: slot === k ? 'var(--accent)' : 'var(--line)', boxShadow: slot === k ? 'inset 0 0 0 1px var(--accent)' : 'none', minWidth: 0 }}>
            <span className="eyebrow" style={{ fontSize: 10 }}>{l}</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{outfit[k] ? (byId[outfit[k]]?.name || '…') : EMPTY[k]}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => equip(null)} aria-pressed={!outfit[slot]} className="card" style={{ flex: 'none', width: 96, padding: 8, display: 'grid', placeItems: 'center', gap: 4, borderColor: !outfit[slot] ? 'var(--accent)' : 'var(--line)' }}>
          <span style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}><Icon name="x" size={28} /></span>
          <span style={{ fontSize: 12, fontWeight: 800 }}>{EMPTY[slot]}</span>
        </button>
        {inSlot.map((it) => (
          <button key={it.id} onClick={() => equip(it.id)} aria-pressed={outfit[slot] === it.id} className="card" style={{ flex: 'none', width: 96, padding: 8, display: 'grid', placeItems: 'center', gap: 4, borderColor: outfit[slot] === it.id ? 'var(--accent)' : `var(--${it.rarity})` }}>
            {thumbs[it.id] ? <img src={thumbs[it.id]} alt="" width="64" height="64" /> : <span style={{ height: 64 }} />}
            <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.15 }}>{it.name}</span>
          </button>
        ))}
        {inSlot.length === 0 && <Link href="/compete#shop" className="card" style={{ flex: 'none', width: 140, padding: 10, textDecoration: 'none', fontSize: 13, fontWeight: 800, display: 'grid', placeItems: 'center', textAlign: 'center' }}>Nothing here yet. Visit the shop →</Link>}
      </div>

      <div className="grid2">
        <div className="card"><span className="eyebrow">XP</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(profile?.xp)}</div></div>
        <div className="card"><span className="eyebrow">Meals cooked</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(stats.meals)}</div></div>
        <div className="card"><span className="eyebrow">Logins</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(profile?.login_count)}</div></div>
        <div className="card"><span className="eyebrow">Cooking since</span><div style={{ fontWeight: 800, fontSize: 16, marginTop: 6 }}>{profile?.first_login_at ? new Date(profile.first_login_at).toLocaleDateString() : 'Today'}</div></div>
      </div>

      {meals.length > 0 && (
        <>
          <h2 style={{ fontSize: 22 }}>Plate journal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
            {meals.map((m) => (
              <figure key={m.id} style={{ margin: 0 }}>
                {m.url ? <img src={m.url} alt={m.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 14 }} /> : <div className="card" style={{ aspectRatio: '1' }} />}
                <figcaption style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{m.title}<span className="muted"> · {new Date(m.cooked_at).toLocaleDateString()}</span></figcaption>
              </figure>
            ))}
          </div>
        </>
      )}

      <h2 style={{ fontSize: 22 }}>Settings</h2>
      <div className="card stack" style={{ gap: 0, padding: 0 }}>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}>
          <Icon name="moon" /><span style={{ flex: 1, fontWeight: 700 }}>Night mode</span>
          <button role="switch" aria-checked={profile?.theme_pref === 'night'} aria-label="Night mode" onClick={toggleNight} style={{ width: 56, height: 34, borderRadius: 99, border: 0, padding: 4, background: profile?.theme_pref === 'night' ? 'var(--accent)' : 'var(--line)', display: 'flex', justifyContent: profile?.theme_pref === 'night' ? 'flex-end' : 'flex-start' }}>
            <span style={{ width: 26, height: 26, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
          </button>
        </div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="me" /><span style={{ flex: 1, fontWeight: 700 }}>{email}</span></div>
        <form action="/auth/signout" method="post" style={{ padding: '12px 16px' }}><button className="btn ghost wide" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
