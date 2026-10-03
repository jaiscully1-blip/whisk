'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon from '@/components/Icon';
import { levelFor, fmt, CUISINES, cuisineMatch } from '@/lib/game';

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
  const [history, setHistory] = useState([]);
  const [goal, setGoal] = useState(profile?.weekly_goal || 4);
  const [takeout, setTakeout] = useState(String(profile?.takeout_price ?? 15));
  const outfit = outfitFrom(loadout);
  const lvl = levelFor(profile?.xp);

  useEffect(() => {
    (async () => {
      const [inv, m, cnt, h] = await Promise.all([
        supabase.from('inventory').select('item_id, items(id, slot, name, rarity)'),
        supabase.from('meals').select('id, title, photo_path, cooked_at').order('cooked_at', { ascending: false }).limit(12),
        supabase.from('meals').select('id', { count: 'exact', head: true }),
        supabase.from('meals').select('cuisine, cooked_at, calories, protein_g, carbs_g, fat_g').order('cooked_at', { ascending: false }).limit(1000)
      ]);
      setHistory(h.data || []);
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
  const stamps = useMemo(() => CUISINES.map((c) => [c, history.some((m) => cuisineMatch(m.cuisine, c))]), [history]);
  const macros = useMemo(() => {
    const since = Date.now() - 7 * 864e5;
    const wk = history.filter((m) => new Date(m.cooked_at).getTime() >= since && m.calories != null);
    const sum = (k) => wk.reduce((a, m) => a + (m[k] || 0), 0);
    return { n: wk.length, calories: sum('calories'), protein: sum('protein_g'), carbs: sum('carbs_g'), fat: sum('fat_g') };
  }, [history]);
  async function saveSetting(patch, msg) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
    if (error) { say('Couldn’t save that setting.'); return; }
    setProfile({ ...profile, ...patch }); say(msg);
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

      <Link href="/me/wrapped" className="card row" style={{ textDecoration: 'none', background: 'var(--pop-soft)', flexWrap: 'nowrap' }}>
        <Icon name="star" size={30} />
        <span style={{ flex: 1 }}><b style={{ display: 'block', fontSize: 16 }}>Whisk Wrapped {new Date().getFullYear()}</b><span className="muted" style={{ fontSize: 13 }}>Your year in the kitchen</span></span>
        <Icon name="chevron" />
      </Link>

      <section className="stack" style={{ gap: 8 }} aria-labelledby="pp-h">
        <div className="row" style={{ justifyContent: 'space-between' }}><h2 id="pp-h" style={{ fontSize: 22 }}>Cuisine passport</h2><span className="muted" style={{ fontWeight: 800 }}>{stamps.filter(([, on]) => on).length}/{CUISINES.length}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 6 }}>
          {stamps.map(([c, on]) => (
            <div key={c} aria-label={`${c}${on ? ', stamped' : ''}`} style={{ borderRadius: 14, padding: '10px 6px', textAlign: 'center', fontSize: 12.5, fontWeight: 800, border: on ? '2px solid var(--accent)' : '1.5px dashed var(--line)', background: on ? 'var(--fresh-soft)' : 'transparent', color: on ? 'var(--fresh)' : 'var(--muted)', transform: on ? 'rotate(-2deg)' : 'none' }}>
              {on ? '✓ ' : ''}{c}
            </div>
          ))}
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>Each new cuisine you cook earns +40 XP.</p>
      </section>

      <section className="card stack" style={{ gap: 8 }} aria-labelledby="mac-h">
        <div className="row" style={{ justifyContent: 'space-between' }}><h3 id="mac-h">Last 7 days</h3><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Estimates from Whisk recipes</span></div>
        {macros.n === 0 ? <p className="muted" style={{ margin: 0, fontSize: 14 }}>Cook a Whisk recipe and log it to see calories and macros here.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, textAlign: 'center' }}>
            {[['kcal', macros.calories], ['protein', macros.protein + 'g'], ['carbs', macros.carbs + 'g'], ['fat', macros.fat + 'g']].map(([l, v]) => (
              <div key={l}><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{typeof v === 'number' ? fmt(v) : v}</div><span className="eyebrow" style={{ fontSize: 10 }}>{l}</span></div>
            ))}
          </div>
        )}
        {macros.n > 0 && <span className="muted" style={{ fontSize: 12 }}>From {macros.n} logged meal{macros.n > 1 ? 's' : ''}, per serving.</span>}
      </section>

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
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}>
          <Icon name="cook" /><label htmlFor="goal" style={{ flex: 1, fontWeight: 700 }}>Weekly cooking goal</label>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Fewer meals" onClick={() => setGoal((g) => Math.max(1, g - 1))}>−</button>
          <output id="goal" style={{ minWidth: 28, textAlign: 'center', fontWeight: 800 }}>{goal}</output>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="More meals" onClick={() => setGoal((g) => Math.min(14, g + 1))}>+</button>
          {goal !== (profile?.weekly_goal || 4) && <button className="btn sm" onClick={() => saveSetting({ weekly_goal: goal }, `Goal: ${goal} meals a week`)}>Save</button>}
        </div>
        <form className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); const v = Math.round(Number(takeout) * 100) / 100; if (!(v >= 0 && v <= 200)) { say('Pick a price from $0 to $200.'); return; } saveSetting({ takeout_price: v }, 'Takeout price saved'); }}>
          <Icon name="gift" /><label htmlFor="takeout" style={{ flex: 1, fontWeight: 700 }}>Typical takeout meal ($)</label>
          <input id="takeout" className="input" inputMode="decimal" style={{ width: 84 }} value={takeout} onChange={(e) => setTakeout(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))} />
          {Number(takeout) !== Number(profile?.takeout_price ?? 15) && <button className="btn sm" type="submit">Save</button>}
        </form>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><span style={{ fontSize: 18 }} aria-hidden="true">🧊</span><span style={{ flex: 1, fontWeight: 700 }}>Streak freezes</span><b>{profile?.streak_freezes ?? 1}</b><span className="muted" style={{ fontSize: 12, width: '100%' }}>Miss one day and a freeze keeps your streak. You get one each week; it doesn’t stack.</span></div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="me" /><span style={{ flex: 1, fontWeight: 700 }}>{email}</span></div>
        <form action="/auth/signout" method="post" style={{ padding: '12px 16px' }}><button className="btn ghost wide" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
