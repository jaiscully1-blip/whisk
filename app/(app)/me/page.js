'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk, useDraft, deviceLabel } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon from '@/components/Icon';
import Passport from '@/components/Passport';
import { levelFor, fmt, CUISINES, cuisineMatch, weekStart, HOME_MEAL_COST } from '@/lib/game';

const SLOTS = [['top', 'Top', 'shirt'], ['hat', 'Hat', 'hat'], ['glasses', 'Glasses', 'glasses'], ['shoes', 'Shoes', 'shoe'], ['acc', 'Accessory', 'spoon']];
const EMPTY = { top: 'No top', hat: 'Classic toque', glasses: 'None', shoes: 'Bare feet', acc: 'Wooden spoon' };

export default function Me() {
  const { supabase, profile, setProfile, loadout, refreshLoadout, email, say, ui, setUi, lastPlayed, saveState } = useWhisk();
  const [owned, setOwned] = useState([]);
  const slot = ui.closetSlot || 'top';
  const [thumbs, setThumbs] = useState({});
  const [meals, setMeals] = useState([]);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft, clearName] = useDraft('nm', profile?.display_name || '');
  const [takeout, setTakeout, clearTakeout] = useDraft('takeout', String(profile?.takeout_price ?? 15));
  const outfit = outfitFrom(loadout);
  const lvl = levelFor(profile?.xp);
  const name = profile?.display_name || 'Me';

  useEffect(() => {
    (async () => {
      const [inv, m, h] = await Promise.all([
        supabase.from('inventory').select('item_id, items(id, slot, name, rarity)'),
        supabase.from('meals').select('id, title, photo_path, cooked_at, rating').order('cooked_at', { ascending: false }).limit(12),
        supabase.from('meals').select('cuisine, cooked_at, calories, protein_g, carbs_g, fat_g').order('cooked_at', { ascending: false }).limit(1000)
      ]);
      setOwned((inv.data || []).map((r) => r.items).filter(Boolean));
      setHistory(h.data || []);
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
  const stamped = useMemo(() => new Set(CUISINES.filter((c) => history.some((m) => cuisineMatch(m.cuisine, c)))), [history]);
  const macros = useMemo(() => {
    const since = Date.now() - 7 * 864e5;
    const wk = history.filter((m) => new Date(m.cooked_at).getTime() >= since && m.calories != null);
    const sum = (k) => wk.reduce((a, m) => a + (m[k] || 0), 0);
    return { n: wk.length, calories: sum('calories'), protein: sum('protein_g'), carbs: sum('carbs_g'), fat: sum('fat_g') };
  }, [history]);
  const weekCount = useMemo(() => history.filter((m) => new Date(m.cooked_at) >= weekStart()).length, [history]);
  const goal = profile?.weekly_goal || 4;
  const pct = Math.min(1, weekCount / goal), rr = 30, cc = 2 * Math.PI * rr;

  async function equip(itemId) {
    const { error } = await supabase.rpc('equip_item', { p_slot: slot, p_item_id: itemId });
    if (error) { say('Couldn’t put that on.'); return; }
    refreshLoadout();
  }
  async function saveSetting(patch, msg) {
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
    if (error) { say('Couldn’t save that setting.'); return false; }
    setProfile({ ...profile, ...patch }); if (msg) say(msg); return true;
  }
  async function saveName(e) {
    e.preventDefault();
    const v = nameDraft.trim().slice(0, 40);
    if (await saveSetting({ display_name: v || null }, 'Name saved')) { clearName(); setEditing(false); }
  }

  return (
    <div className="stack">
      <div className="page-title" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
        {editing ? (
          <form className="row" style={{ flexWrap: 'nowrap', flex: 1 }} onSubmit={saveName}>
            <label htmlFor="nm" hidden>Your name</label>
            <input id="nm" className="input" maxLength={40} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }} />
            <button className="btn sm" type="submit">Save</button>
          </form>
        ) : (
          <>
            <button className="namebtn" onClick={() => { setNameDraft(nameDraft || profile?.display_name || ''); setEditing(true); }} aria-label={`Edit name: ${name}`}><h1>{name}</h1><Icon name="pencil" size={18} /></button>
            <span className="muted" style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Lv {lvl.level} · {lvl.title}</span>
          </>
        )}
      </div>
      <div>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span>{fmt(profile?.xp)} XP</span><span className="muted">{lvl.next ? `${fmt(lvl.next - (profile?.xp || 0))} to level ${lvl.level + 1}` : 'Max level'}</span></div>
        <div className="bar" style={{ height: 10, marginTop: 4 }}><i style={{ width: `${lvl.pct}%` }} /></div>
      </div>

      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, var(--card) 0%, var(--stage) 70%)', border: '1px solid var(--line)' }}>
        <WhiskStage pose="default" outfit={outfit} height={360} />
        <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>Drag to spin</span>
      </div>

      <div className="slotbar" role="tablist" aria-label="Outfit slots">
        {SLOTS.map(([k, l, icon]) => (
          <button key={k} role="tab" aria-selected={slot === k} onClick={() => setUi({ closetSlot: k })} className="card" title={l}
            aria-label={`${l}: ${outfit[k] ? (byId[outfit[k]]?.name || '') : EMPTY[k]}`}
            style={{ borderColor: slot === k ? 'var(--accent)' : 'var(--line)', boxShadow: slot === k ? 'inset 0 0 0 1px var(--accent)' : 'none', color: slot === k ? 'var(--accent)' : 'var(--fg)', background: slot === k ? 'var(--card)' : 'transparent' }}>
            <Icon name={icon} size={34} stroke={1.5} />
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

      <div className="card row" style={{ gap: 14, flexWrap: 'nowrap' }}>
        <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`${weekCount} of ${goal} meals this week`} style={{ flex: 'none' }}>
          <circle cx="38" cy="38" r={rr} fill="none" stroke="var(--track)" strokeWidth="9" />
          <circle cx="38" cy="38" r={rr} fill="none" stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${pct * cc} ${cc}`} transform="rotate(-90 38 38)" />
          <text x="38" y="44" textAnchor="middle" style={{ font: '700 20px var(--f-display)', fill: 'var(--fg)' }}>{weekCount}/{goal}</text>
        </svg>
        <div style={{ flex: 1 }}>
          <b style={{ fontSize: 16 }}>{weekCount >= goal ? 'Weekly goal hit!' : `${goal - weekCount} more meal${goal - weekCount === 1 ? '' : 's'} this week`}</b>
          {history.length > 0 && <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4, color: 'var(--fresh)' }}>~${fmt(Math.round(history.length * Math.max(0, Number(profile?.takeout_price ?? 15) - HOME_MEAL_COST)))} saved vs takeout <span className="muted" style={{ fontWeight: 600 }}>(estimate)</span></div>}
        </div>
      </div>

      <Passport stamped={stamped} />

      <section className="card stack" style={{ gap: 8 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Last 7 days</h3><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>From the recipe pages</span></div>
        {macros.n === 0 ? <p className="muted" style={{ margin: 0, fontSize: 14 }}>Cook a recipe that lists nutrition and log it to see calories and macros here.</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6, textAlign: 'center' }}>
            {[['kcal', fmt(macros.calories)], ['protein', macros.protein + 'g'], ['carbs', macros.carbs + 'g'], ['fat', macros.fat + 'g']].map(([l, v]) => (
              <div key={l}><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{v}</div><span className="eyebrow" style={{ fontSize: 10 }}>{l}</span></div>
            ))}
          </div>
        )}
      </section>

      {meals.length > 0 && (
        <>
          <h2 style={{ fontSize: 22 }}>Plate journal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
            {meals.map((m) => (
              <figure key={m.id} style={{ margin: 0, position: 'relative' }}>
                {m.url ? <img src={m.url} alt={m.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 14 }} /> : <div className="card" style={{ aspectRatio: '1' }} />}
                {m.rating && <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--card)', borderRadius: 99, padding: 3, display: 'grid', color: m.rating === 'up' ? 'var(--fresh)' : 'var(--bad)' }} aria-label={m.rating === 'up' ? 'Liked' : 'Disliked'}><Icon name={m.rating} size={16} /></span>}
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
          <button role="switch" aria-checked={profile?.theme_pref === 'night'} aria-label="Night mode" onClick={() => saveSetting({ theme_pref: profile.theme_pref === 'night' ? 'day' : 'night' })} style={{ width: 56, height: 34, borderRadius: 99, border: 0, padding: 4, background: profile?.theme_pref === 'night' ? 'var(--accent)' : 'var(--line)', display: 'flex', justifyContent: profile?.theme_pref === 'night' ? 'flex-end' : 'flex-start' }}>
            <span style={{ width: 26, height: 26, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
          </button>
        </div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}>
          <Icon name="cook" /><span style={{ flex: 1, fontWeight: 700 }}>Weekly cooking goal</span>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Fewer meals" onClick={() => saveSetting({ weekly_goal: Math.max(1, goal - 1) }, `Goal: ${Math.max(1, goal - 1)} meals a week`)}>−</button>
          <output style={{ minWidth: 28, textAlign: 'center', fontWeight: 800 }}>{goal}</output>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="More meals" onClick={() => saveSetting({ weekly_goal: Math.min(14, goal + 1) }, `Goal: ${Math.min(14, goal + 1)} meals a week`)}>+</button>
        </div>
        <form className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }} onSubmit={async (e) => { e.preventDefault(); const v = Math.round(Number(takeout) * 100) / 100; if (!(v >= 0 && v <= 200)) { say('Pick a price from $0 to $200.'); return; } if (await saveSetting({ takeout_price: v }, 'Takeout price saved')) clearTakeout(); }}>
          <Icon name="gift" /><label htmlFor="takeout" style={{ flex: 1, fontWeight: 700 }}>Typical takeout meal ($)</label>
          <input id="takeout" className="input" inputMode="decimal" style={{ width: 84 }} value={takeout} onChange={(e) => setTakeout(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))} />
          <button className="btn sm" type="submit">Save</button>
        </form>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="snow" /><span style={{ flex: 1, fontWeight: 700 }}>Streak freezes</span><b>{profile?.streak_freezes ?? 1}</b><span className="muted" style={{ fontSize: 12, width: '100%' }}>Miss one day and a freeze keeps your streak. You get one each week; it doesn’t stack.</span></div>
        <div className="stack" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', gap: 2 }}>
          <span style={{ fontWeight: 700 }}>Autosave</span>
          <span className="muted" style={{ fontSize: 13 }}>{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Saved on this device · will sync to your account when you’re back online' : 'Everything saves to your account as you play, including what you typed and where you were.'}</span>
          {lastPlayed?.device && <span className="muted" style={{ fontSize: 13 }}>Last played on <b>{lastPlayed.device}</b>{lastPlayed.at ? ` · ${new Date(lastPlayed.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}{lastPlayed.device === deviceLabel() ? ' (this device)' : ''}</span>}
        </div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="me" /><span style={{ flex: 1, fontWeight: 700, overflowWrap: 'anywhere' }}>{email}</span></div>
        <form action="/auth/signout" method="post" style={{ padding: '12px 16px' }}><button className="btn ghost wide" type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
