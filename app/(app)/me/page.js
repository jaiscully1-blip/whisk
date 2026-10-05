'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk, useDraft } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon, { Coin } from '@/components/Icon';
import GetCoinsSheet from '@/components/GetCoinsSheet';
import Passport from '@/components/Passport';
import ResetSheet from '@/components/ResetSheet';
import RecipeSheet from '@/components/RecipeSheet';
import { usePantry } from '@/components/usePantry';
import { levelFor, fmt, weekStart, HOME_MEAL_COST, dayNumber } from '@/lib/game';

const SLOTS = [['top', 'Top', 'shirt'], ['hat', 'Hat', 'hat'], ['glasses', 'Glasses', 'glasses'], ['shoes', 'Shoes', 'shoe'], ['acc', 'Accessory', 'bag']];
const TEXT_SCALES = [.85, .92, 1, 1.1, 1.2, 1.3];
const RARITY_ORDER = ['common', 'rare', 'epic', 'exotic', 'mythic'];
const EMPTY = { top: 'White chef coat', hat: 'Classic toque', glasses: 'None', shoes: 'Bare feet', acc: 'Nothing' };   // top + hat: free, always yours

export default function Me() {
  const { supabase, profile, setProfile, refreshProfile, loadout, refreshLoadout, say, ui, setUi, openPrivacy } = useWhisk();
  const [items, setItems] = useState([]);
  const [owned, setOwned] = useState(new Set());
  const [buying, setBuying] = useState(null);
  const [busy, setBusy] = useState(false);
  const [getCoins, setGetCoins] = useState(false);
  const slot = ui.closetSlot || 'top';
  const [thumbs, setThumbs] = useState({});
  const [meals, setMeals] = useState([]);
  const [history, setHistory] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editTakeout, setEditTakeout] = useState(false);
  const [resetting, setResetting] = useState(false);
    const [recipe, setRecipe] = useState(null);
  const [pantry] = usePantry();
  const [nameDraft, setNameDraft, clearName] = useDraft('nm', profile?.display_name || '');
  const [takeout, setTakeout, clearTakeout] = useDraft('takeout', String(profile?.takeout_price ?? 15));
  const outfit = outfitFrom(loadout);
  const scaleAt = Math.max(0, TEXT_SCALES.indexOf(ui.textScale || 1));
  const lvl = levelFor(profile?.xp);
  const name = profile?.display_name || 'Me';

  useEffect(() => {
    (async () => {
      const [it, inv, m, h] = await Promise.all([
        supabase.from('items').select('id, slot, name, rarity, price, sort').eq('active', true).order('sort'),
        supabase.from('inventory').select('item_id'),
        supabase.from('meals').select('id, title, photo_path, cooked_at, rating').order('cooked_at', { ascending: false }).limit(12),
        supabase.from('meals').select('cuisine, country, cooked_at, calories, protein_g, carbs_g, fat_g').order('cooked_at', { ascending: false }).limit(1000)
      ]);
      setItems(it.data || []); setOwned(new Set((inv.data || []).map((r) => r.item_id)));
      setHistory(h.data || []);
      const rows = m.data || [];
      if (rows.length) {
        const { data: signed } = await supabase.storage.from('meal-photos').createSignedUrls(rows.map((r) => r.photo_path), 3600);
        setMeals(rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl })));
      }
    })();
  }, [supabase]);

  // Back from the checkout
  useEffect(() => { if (new URLSearchParams(window.location.search).get('paid') === '1') { say('Payment done · your coins are on the way'); window.history.replaceState(null, '', '/me'); const t = setInterval(refreshProfile, 15000); return () => clearInterval(t); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inSlot = useMemo(() => items.filter((i) => i.slot === slot).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.sort - b.sort), [items, slot]);
  useEffect(() => {
    let alive = true;
    import('@/lib/whisk3d/engine').then(async ({ ITEMS_BY_ID, renderThumb, CHEF_COAT }) => {
      if (slot === 'top') { try { const url = renderThumb(CHEF_COAT); setThumbs((t) => ({ ...t, [CHEF_COAT.id]: url })); } catch {} }
      for (const it of inSlot) {
        if (!alive) return; const def = ITEMS_BY_ID[it.id]; if (!def) continue;
        try { const url = renderThumb(def); setThumbs((t) => (t[it.id] ? t : { ...t, [it.id]: url })); } catch (e) { console.error(e); }
        await new Promise((r) => setTimeout(r, 10));
      }
    });
    return () => { alive = false; };
  }, [inSlot]);

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const countryCounts = useMemo(() => { const m = new Map(); history.forEach((x) => { if (x.country) m.set(x.country, (m.get(x.country) || 0) + 1); }); return m; }, [history]);
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
  async function confirmBuy() {
    setBusy(true);
    const { error } = await supabase.rpc('buy_item', { p_item_id: buying.id });
    setBusy(false);
    if (error) { say(error.message.includes('enough') ? 'Not enough coins yet' : 'Couldn’t buy that'); return; }
    const it = buying; window.dispatchEvent(new CustomEvent('whisk:bought', { detail: it.id }));   // the first-time tour listens for this
    setOwned((s) => new Set(s).add(it.id)); setBuying(null); refreshProfile();
    await equip(it.id); say(`${it.name} is yours!`);
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
      <div data-tour="name" className="page-title" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
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
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span>{fmt(profile?.xp)} XP · <span className="dayno">Day {dayNumber(profile)}</span></span><span className="muted">{lvl.next ? `${fmt(lvl.next - (profile?.xp || 0))} to level ${lvl.level + 1}` : 'Max level'}</span></div>
        <div className="bar" style={{ height: 10, marginTop: 4 }}><i style={{ width: `${lvl.pct}%` }} /></div>
      </div>

      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, var(--card) 0%, var(--stage) 70%)', border: '1px solid var(--line)' }}>
        <div data-tour="stage"><WhiskStage pose="default" outfit={outfit} height={360} /></div>
        <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>Drag to spin</span>
      </div>

      <div data-tour="slots" className="slotbar" role="tablist" aria-label="Outfit slots">
        {SLOTS.map(([k, l, icon]) => (
          <button key={k} role="tab" aria-selected={slot === k} onClick={() => setUi({ closetSlot: k })} className="card" title={l}
            aria-label={`${l}: ${outfit[k] ? (byId[outfit[k]]?.name || '') : EMPTY[k]}`}
            style={{ borderColor: slot === k ? 'var(--accent)' : 'var(--line)', boxShadow: slot === k ? 'inset 0 0 0 1px var(--accent)' : 'none', color: slot === k ? 'var(--accent)' : 'var(--fg)', background: slot === k ? 'var(--card)' : 'transparent' }}>
            <Icon name={icon} size={34} stroke={1.5} />
          </button>
        ))}
      </div>
      <div id="shop" data-tour="coins" className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="row" style={{ gap: 6, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}><Coin size={22} />{fmt(profile?.coins)}</span>
        <button className="btn sm" onClick={() => setGetCoins(true)} style={{ background: 'var(--gold)', color: '#23301F', boxShadow: '0 3px 0 #B8862A' }}><Coin size={18} />Get coins</button>
      </div>
      <div className="closet-grid">
        <button onClick={() => equip(null)} aria-pressed={!outfit[slot]} className="card tile" style={{ borderColor: !outfit[slot] ? 'var(--accent)' : 'var(--line)' }}>
          {slot === 'top' && thumbs['top-white-chef-coat'] ? <img src={thumbs['top-white-chef-coat']} alt="" width="64" height="64" /> : <span style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}><Icon name="x" size={28} /></span>}
          <span className="tname">{EMPTY[slot]}</span>{(slot === 'top' || slot === 'hat') && <span className="tprice free">Free</span>}
        </button>
        {inSlot.map((it) => {
          const have = owned.has(it.id); const on = outfit[slot] === it.id;
          return (
            <button key={it.id} onClick={() => (have ? equip(it.id) : setBuying(it))} aria-pressed={have ? on : undefined} className={`card tile ${have ? '' : 'locked'}`}
              aria-label={have ? `${it.name}${on ? ', wearing' : ''}` : `${it.name}, locked, ${fmt(it.price)} coins`}
              style={{ borderColor: on ? 'var(--accent)' : have ? `var(--${it.rarity})` : 'var(--line)', boxShadow: on ? 'inset 0 0 0 1px var(--accent)' : 'none' }}>
              {thumbs[it.id] ? <img src={thumbs[it.id]} alt="" width="64" height="64" /> : <span style={{ height: 64 }} />}
              <span className="tname">{it.name}</span>
              {!have && <span className="row tprice"><Coin size={12} />{fmt(it.price)}</span>}
            </button>
          );
        })}
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

      <Passport counts={countryCounts} onOpenRecipe={setRecipe} />

      <section className="card stack" style={{ gap: 8 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Last 7 days</h3><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>From the recipe pages</span></div>
        {macros.n === 0 ? <p className="desc" style={{ margin: 0 }}>Cook a recipe that lists nutrition and log it to see calories and macros here.</p> : (
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
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}>
          <span style={{ width: 24, textAlign: 'center', fontWeight: 900, fontFamily: 'var(--f-display)' }} aria-hidden="true">Aa</span><span style={{ flex: 1, fontWeight: 700 }}>Text size</span>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Smaller text" disabled={scaleAt === 0} onClick={() => setUi({ textScale: TEXT_SCALES[Math.max(0, scaleAt - 1)] })}>−</button>
          <output style={{ minWidth: 44, textAlign: 'center', fontWeight: 800 }} aria-live="polite">{Math.round(TEXT_SCALES[scaleAt] * 100)}%</output>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Bigger text" disabled={scaleAt === TEXT_SCALES.length - 1} onClick={() => setUi({ textScale: TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, scaleAt + 1)] })}>+</button>
        </div>
        <form className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }} onSubmit={async (e) => { e.preventDefault(); const v = Math.round(Number(takeout) * 100) / 100; if (!(v >= 0 && v <= 200)) { say('Pick a price from $0 to $200.'); return; } if (await saveSetting({ takeout_price: v })) { clearTakeout(); setEditTakeout(false); e.target.querySelector('input')?.blur(); } }}>
          <Icon name="gift" /><label htmlFor="takeout" style={{ flex: 1, fontWeight: 700 }}>Typical takeout meal ($)</label>
          <input id="takeout" className="input" inputMode="decimal" style={{ width: 84, background: editTakeout ? 'var(--card)' : 'transparent', borderColor: editTakeout ? 'var(--accent)' : 'var(--line)', fontWeight: 800, textAlign: 'center' }}
            value={editTakeout ? takeout : String(profile?.takeout_price ?? 15)} readOnly={!editTakeout}
            onFocus={() => { if (!editTakeout) { setTakeout(String(profile?.takeout_price ?? 15)); setEditTakeout(true); } }} onClick={() => setEditTakeout(true)}
            onChange={(e) => setTakeout(e.target.value.replace(/[^0-9.]/g, '').slice(0, 6))} aria-label="Typical takeout meal in dollars. Tap to edit." />
          {editTakeout && <button className="btn sm" type="submit">Submit</button>}
        </form>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="snow" /><span style={{ flex: 1, fontWeight: 700 }}>Streak freezes</span><b>{profile?.streak_freezes ?? 1}</b><span className="desc" style={{ width: '100%' }}>Miss one day and a freeze keeps your streak. You get one each week; it doesn’t stack.</span></div>
        <button className="row setbtn" onClick={openPrivacy} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap', width: '100%', background: 'none', border: 0, borderBottomStyle: 'solid', textAlign: 'left', color: 'var(--fg)' }}>
          <img src="/cookie.svg" alt="" width="22" height="22" /><span style={{ flex: 1, fontWeight: 700 }}>Cookies &amp; privacy</span><span className="desc">{profile?.consent?.local_time ? (profile?.time_zone || '').replace(/_/g, ' ') : 'UTC days'}</span><Icon name="chevron" />
        </button>
        {profile?.is_admin && <Link href="/admin" className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'var(--fg)', flexWrap: 'nowrap' }}><Icon name="compete" /><span style={{ flex: 1, fontWeight: 700 }}>Backend dashboard</span><Icon name="chevron" /></Link>}
        <div className="stack" style={{ padding: '12px 16px', gap: 4 }}>
          <span className="row" style={{ gap: 8, fontWeight: 700, flexWrap: 'nowrap' }}><Icon name="me" />Your game is saved on this phone</span>
          <span className="desc">No account needed. Deleting the app or clearing this browser’s data starts a new game.</span>
          <span className="desc" style={{ fontSize: 11, overflowWrap: 'anywhere' }}>Player ID: <span className="mono" style={{ userSelect: 'all' }}>{profile?.id}</span></span>
        </div>
      </div>
      <button onClick={() => setResetting(true)} style={{ alignSelf: 'center', background: 'none', border: 0, color: 'var(--muted)', fontSize: 11, textDecoration: 'underline', padding: 8, minHeight: 32 }}>Reset game</button>
      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
      {recipe && <RecipeSheet recipe={recipe} pantry={pantry || []} onClose={() => setRecipe(null)} />}
      {buying && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setBuying(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Buy ${buying.name}`} style={{ alignItems: 'center', textAlign: 'center' }}>
            {thumbs[buying.id] && <img src={thumbs[buying.id]} alt="" width="150" height="150" />}
            <span className="chip" style={{ background: `var(--${buying.rarity})`, color: '#fff', textTransform: 'uppercase', fontWeight: 800 }}>{buying.rarity}</span>
            <h2 style={{ fontSize: 26 }}>{buying.name}</h2>
            <p className="muted" style={{ margin: 0 }}>You have {fmt(profile?.coins)} coins.</p>
            {profile?.coins >= buying.price
              ? <button data-tour="buy" className="btn wide" onClick={confirmBuy} disabled={busy}><Coin />{busy ? 'Buying…' : `Buy for ${fmt(buying.price)}`}</button>
              : <><p className="err" style={{ margin: 0 }}>You need {fmt(buying.price - (profile?.coins || 0))} more coins. Finish a challenge or get coins.</p><button className="btn wide" onClick={() => { setBuying(null); setGetCoins(true); }} style={{ background: 'var(--gold)', color: '#23301F', boxShadow: '0 3px 0 #B8862A' }}><Coin />Get coins</button></>}
            <button className="btn ghost wide" onClick={() => setBuying(null)}>Not now</button>
          </div>
        </div>
      )}
      {getCoins && <GetCoinsSheet onClose={() => setGetCoins(false)} />}
    </div>
  );
}
