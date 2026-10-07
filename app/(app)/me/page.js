'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCached } from '@/lib/cache';
import { fetchMe } from '@/components/tabData';
import Link from 'next/link';
import { useWhisk, useDraft } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon, { Coin } from '@/components/Icon';
import GetCoinsSheet from '@/components/GetCoinsSheet';
import Passport from '@/components/Passport';
import ResetSheet from '@/components/ResetSheet';
import NeverShowSheet from '@/components/NeverShowSheet';
import BackupSheet from '@/components/BackupSheet';
import NotifySettings from '@/components/NotifySettings';
import ShareSwitch from '@/components/ShareSwitch';
import DeleteDataSheet from '@/components/DeleteDataSheet';
import RecipeSheet from '@/components/RecipeSheet';
import { usePantry } from '@/components/usePantry';
import { levelFor, fmt, dayNumber } from '@/lib/game';

const EMPTY_LIST = [];
const SLOTS = [['top', 'Top', 'shirt'], ['hat', 'Hat', 'hat'], ['glasses', 'Glasses', 'glasses'], ['shoes', 'Shoes', 'shoe'], ['acc', 'Accessory', 'bag']];
const TEXT_SCALES = [.85, .92, 1, 1.1, 1.2, 1.3];
const RARITY_ORDER = ['common', 'rare', 'epic', 'exotic', 'mythic'];
const EMPTY = { top: 'White chef coat', hat: 'Classic toque', glasses: 'None', shoes: 'Bare feet', acc: 'Nothing' };   // top + hat: free, always yours

export default function Me() {
  const { account, supabase, profile, setProfile, refreshProfile, loadout, refreshLoadout, say, ui, setUi, openPrivacy, replayTour, dataVersion } = useWhisk();
  const [dancing, setDancing] = useState(false);   // the Dance button; stops on its own when you leave or the screen turns off
  const [medata, setMedata] = useCached('me', () => fetchMe(supabase), [dataVersion]);   // remembered between tabs (lib/cache.js)
  const items = medata?.items || EMPTY_LIST, meals = medata?.meals || EMPTY_LIST, history = medata?.history || EMPTY_LIST;
  const owned = useMemo(() => new Set(medata?.owned || []), [medata?.owned]);
  const setOwned = (fn) => setMedata((x) => ({ ...x, owned: [...fn(new Set(x?.owned || []))] }));
  const [buying, setBuying] = useState(null);
  const [busy, setBusy] = useState(false);
  const [getCoins, setGetCoins] = useState(false);
  const slot = ui.closetSlot || 'top';
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [never, setNever] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [deleting, setDeleting] = useState(false);
    const [recipe, setRecipe] = useState(null);
  const [pantry] = usePantry();
  const [nameDraft, setNameDraft, clearName] = useDraft('nm', profile?.display_name || '');
  const outfit = outfitFrom(loadout);
  const scaleAt = Math.max(0, TEXT_SCALES.indexOf(ui.textScale || 1));
  const lvl = levelFor(profile?.xp);
  const name = profile?.display_name || 'Me';


  // Back from the checkout
  useEffect(() => { if (new URLSearchParams(window.location.search).get('paid') === '1') { say('Payment done · your coins are on the way'); window.history.replaceState(null, '', '/me'); const t = setInterval(refreshProfile, 15000); return () => clearInterval(t); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inSlot = useMemo(() => items.filter((i) => i.slot === slot).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.sort - b.sort), [items, slot]);
  // Item pictures are pre-drawn files (public/thumbs, made by scripts/gen-thumbs.cjs): no 3D work on the phone.
  const thumb = (id) => `/thumbs/${id}.webp`;

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const goal = profile?.weekly_goal || 4;
  const countryCounts = useMemo(() => { const m = new Map(); history.forEach((x) => { if (x.country) m.set(x.country, (m.get(x.country) || 0) + 1); }); return m; }, [history]);

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
  async function toggleVacation() {
    const on = !profile?.vacation_since;
    const { data, error } = await supabase.rpc('set_vacation', { p_on: on });
    if (error) { say('Couldn’t change vacation mode.'); return; }
    setProfile({ ...profile, vacation_since: data?.vacation_since || null, streak_days: data?.streak_days ?? profile.streak_days });
    say(on ? 'Vacation mode on · your streak is paused' : 'Welcome back! Your streak carries on');
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
            {lvl.level > 0 && <span className="muted" style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Lv {lvl.level} · {lvl.title}</span>}
          </>
        )}
      </div>
      <div>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span>{fmt(profile?.xp)} XP · <span className="dayno">Day {dayNumber(profile)}</span></span><span className="muted">{lvl.next ? `${fmt(lvl.next - (profile?.xp || 0))} to level ${lvl.level + 1}` : 'Max level'}</span></div>
        <div className="bar" style={{ height: 10, marginTop: 4 }}><i style={{ width: `${lvl.pct}%` }} /></div>
      </div>

      <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, var(--card) 0%, var(--stage) 70%)', border: '1px solid var(--line)' }}>
        <div data-tour="stage" data-tip="stage" style={{ position: 'relative' }}>
          <WhiskStage pose="default" outfit={outfit} height={360} dancing={dancing} onDanceEnd={() => setDancing(false)} />
          <button type="button" className={`dance-btn ${dancing ? 'on' : ''}`} aria-pressed={dancing} onClick={() => setDancing((d) => !d)}>{dancing ? 'Stop' : 'Dance'}</button>
        </div>
        <span style={{ position: 'absolute', top: 10, left: 12, fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>Drag to spin</span>
      </div>

      <div data-tour="slots" data-tip="closet" className="slotbar" role="tablist" aria-label="Outfit slots">
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
          {slot === 'top' ? <img src={thumb('top-white-chef-coat')} alt="" width="64" height="64" decoding="async" /> : <span style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}><Icon name="x" size={28} /></span>}
          <span className="tname">{EMPTY[slot]}</span>{(slot === 'top' || slot === 'hat') && <span className="tprice free">Free</span>}
        </button>
        {inSlot.map((it) => {
          const have = owned.has(it.id); const on = outfit[slot] === it.id;
          return (
            <button key={it.id} onClick={() => (have ? equip(it.id) : setBuying(it))} aria-pressed={have ? on : undefined} className={`card tile ${have ? '' : 'locked'}`}
              aria-label={have ? `${it.name}${on ? ', wearing' : ''}` : `${it.name}, locked, ${fmt(it.price)} coins`}
              style={{ borderColor: on ? 'var(--accent)' : have ? `var(--${it.rarity})` : 'var(--line)', boxShadow: on ? 'inset 0 0 0 1px var(--accent)' : 'none' }}>
              <img src={thumb(it.id)} alt="" width="64" height="64" loading="lazy" decoding="async" />
              <span className="tname">{it.name}</span>
              {!have && <span className="row tprice"><Coin size={12} />{fmt(it.price)}</span>}
            </button>
          );
        })}
      </div>

      <Passport counts={countryCounts} onOpenRecipe={setRecipe} />

      {meals.length > 0 && (
        <>
          <h2 style={{ fontSize: 22 }}>Plate journal</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 8 }}>
            {meals.map((m) => (
              <figure key={m.id} style={{ margin: 0, position: 'relative' }}>
                {m.url ? <img src={m.url} alt={m.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 14 }} /> : <div className="card" style={{ aspectRatio: '1' }} />}
                {m.rating && <span style={{ position: 'absolute', top: 6, right: 6, background: 'var(--card)', borderRadius: 99, padding: 3, display: 'grid', color: m.rating === 'up' ? 'var(--fresh)' : 'var(--bad)' }} aria-label={m.rating === 'up' ? 'Liked' : 'Disliked'}><Icon name={m.rating} size={16} /></span>}
                <figcaption style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{m.title}<span className="muted"> · {new Date(m.cooked_at).toLocaleDateString()}</span></figcaption>
                {'shared_at' in m && <ShareSwitch mealId={m.id} initial={!!m.shared_at} compact />}
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
        <button className="row setbtn" onClick={() => setNever(true)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap', width: '100%', background: 'none', border: 0, borderBottomStyle: 'solid', textAlign: 'left', color: 'var(--fg)' }}>
          <Icon name="shield" /><span style={{ flex: 1, fontWeight: 700 }}>Never show me</span><span className="desc">{(profile?.never_show || []).length ? `${profile.never_show.length} hidden` : 'Allergies, dislikes'}</span><Icon name="chevron" />
        </button>
        <NotifySettings />
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
          <Icon name="plane" /><span style={{ flex: 1, fontWeight: 700 }}>Vacation mode</span>
          <button role="switch" aria-checked={!!profile?.vacation_since} aria-label="Vacation mode" onClick={toggleVacation} className={`switch ${profile?.vacation_since ? 'on' : ''}`}><span /></button>
          <span className="desc" style={{ width: '100%' }}>{profile?.vacation_since ? 'Your streak is paused. It picks up where you left off when you cook again or turn this off (up to 30 days).' : 'Going away? Pause your streak so the days away don’t count.'}</span>
        </div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap' }}>
          <span style={{ width: 24, textAlign: 'center', fontWeight: 900, fontFamily: 'var(--f-display)' }} aria-hidden="true">Aa</span><span style={{ flex: 1, fontWeight: 700 }}>Text size</span>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Smaller text" disabled={scaleAt === 0} onClick={() => setUi({ textScale: TEXT_SCALES[Math.max(0, scaleAt - 1)] })}>−</button>
          <output style={{ minWidth: 44, textAlign: 'center', fontWeight: 800 }} aria-live="polite">{Math.round(TEXT_SCALES[scaleAt] * 100)}%</output>
          <button className="btn ghost sm" style={{ width: 36, padding: 0 }} aria-label="Bigger text" disabled={scaleAt === TEXT_SCALES.length - 1} onClick={() => setUi({ textScale: TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, scaleAt + 1)] })}>+</button>
        </div>
        <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)' }}><Icon name="snow" /><span style={{ flex: 1, fontWeight: 700 }}>Streak freezes</span><b>{profile?.streak_freezes ?? 1}</b><span className="desc" style={{ width: '100%' }}>Miss one day and a freeze keeps your streak. You get one each week; it doesn’t stack. Out of freezes? Cook twice the next day and your streak comes back, free.</span></div>
        <button className="row setbtn" onClick={openPrivacy} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap', width: '100%', background: 'none', border: 0, borderBottomStyle: 'solid', textAlign: 'left', color: 'var(--fg)' }}>
          <img src="/cookie.svg" alt="" width="22" height="22" /><span style={{ flex: 1, fontWeight: 700 }}>Cookies &amp; privacy</span><span className="desc">{profile?.consent?.local_time ? (profile?.time_zone || '').replace(/_/g, ' ') : 'UTC days'}</span><Icon name="chevron" />
        </button>
        <button className="row setbtn" onClick={() => { replayTour(); say('Chef will explain things again as you tap them'); }} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'nowrap', width: '100%', background: 'none', border: 0, borderBottomStyle: 'solid', textAlign: 'left', color: 'var(--fg)' }}>
          <img src="/icon.svg" alt="" width="22" height="22" /><span style={{ flex: 1, fontWeight: 700 }}>Show Chef’s tips again</span><Icon name="chevron" />
        </button>
        {profile?.is_admin && <Link href="/admin" className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'var(--fg)', flexWrap: 'nowrap' }}><Icon name="compete" /><span style={{ flex: 1, fontWeight: 700 }}>Backend dashboard</span><Icon name="chevron" /></Link>}
        <div className="stack" style={{ padding: '12px 16px', gap: 4 }}>
          {account?.anon ? <>
            <span className="row" style={{ gap: 8, fontWeight: 700, flexWrap: 'nowrap' }}><Icon name="me" />Your game is saved on this phone</span>
            <span className="desc">Deleting the app or clearing this browser’s data would start a new game. Back it up to keep it safe.</span>
            <button className="btn sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setBackingUp(true)}><Icon name="shield" size={16} />Back up your game</button>
          </> : <>
            <span className="row" style={{ gap: 8, fontWeight: 700, flexWrap: 'nowrap', color: 'var(--fresh)' }}><Icon name="check" />Your game is backed up</span>
            <span className="desc">With {(account?.providers || []).map((p) => ({ google: 'Google', apple: 'Apple', email: 'email' }[p] || p)).join(' and ') || 'email'}{account?.email ? ` (${account.email})` : ''}. On a new phone, choose “Get it back” on the start screen.</span>
          </>}
          <span className="desc" style={{ fontSize: 11, overflowWrap: 'anywhere' }}>Player ID: <span className="mono" style={{ userSelect: 'all' }}>{profile?.id}</span></span>
        </div>
      </div>
      <button className="row setbtn danger-row" onClick={() => setDeleting(true)} style={{ alignSelf: 'stretch', justifyContent: 'center', background: 'none', border: 0, padding: 10 }}><Icon name="trash" size={18} />Delete my data</button>
      <button onClick={() => setResetting(true)} style={{ alignSelf: 'center', background: 'none', border: 0, color: 'var(--muted)', fontSize: 11, textDecoration: 'underline', padding: 8, minHeight: 32 }}>Reset game</button>
      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
      {never && <NeverShowSheet onClose={() => setNever(false)} />}
      {backingUp && <BackupSheet supabase={supabase} onClose={() => setBackingUp(false)} />}
      {deleting && <DeleteDataSheet onClose={() => setDeleting(false)} />}
      {recipe && <RecipeSheet recipe={recipe} pantry={pantry || []} onClose={() => setRecipe(null)} />}
      {buying && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setBuying(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Buy ${buying.name}`} style={{ alignItems: 'center', textAlign: 'center' }}>
            <img src={thumb(buying.id)} alt="" width="150" height="150" decoding="async" />
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
