'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCached } from '@/lib/cache';
import { fetchMe } from '@/components/tabData';
import Link from 'next/link';
import { useWhisk, useDraft } from '@/components/AppShell';
import Icon from '@/components/Icon';
import GetCoinsSheet from '@/components/GetCoinsSheet';
import Globe from '@/components/Globe';
import { TierList, ProfileCard, MyKitchen, KitchenShop, CountryChallenges } from '@/components/MeWorld';
import ResetSheet from '@/components/ResetSheet';
import NeverShowSheet from '@/components/NeverShowSheet';
import BackupSheet from '@/components/BackupSheet';
import NotifySettings from '@/components/NotifySettings';
import ShareSwitch from '@/components/ShareSwitch';
import DeleteDataSheet from '@/components/DeleteDataSheet';
import RecipeSheet from '@/components/RecipeSheet';
import { usePantry, useWorld } from '@/components/usePantry';
import { useRouter } from 'next/navigation';
import { levelFor, fmt, dayNumber } from '@/lib/game';

const EMPTY_LIST = [];
const TEXT_SCALES = [.85, .92, 1, 1.1, 1.2, 1.3];

export default function Me() {
  const { account, supabase, profile, setProfile, refreshProfile, say, ui, setUi, openPrivacy, replayTour, dataVersion, allRecipes } = useWhisk();
  const router = useRouter();
  const [medata] = useCached('me', () => fetchMe(supabase), [dataVersion]);   // remembered between tabs (lib/cache.js)
  const meals = medata?.meals || EMPTY_LIST, history = medata?.history || EMPTY_LIST;
  const [world, , setWorld] = useWorld();
  const [getCoins, setGetCoins] = useState(false);
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [never, setNever] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [deleting, setDeleting] = useState(false);
    const [recipe, setRecipe] = useState(null);
  const [pantry] = usePantry();
  const [nameDraft, setNameDraft, clearName] = useDraft('nm', profile?.display_name || '');
  const scaleAt = Math.max(0, TEXT_SCALES.indexOf(ui.textScale || 1));
  const lvl = levelFor(profile?.xp);
  const name = profile?.display_name || 'Me';


  // Back from the checkout
  useEffect(() => { if (new URLSearchParams(window.location.search).get('paid') === '1') { say('Payment done · your coins are on the way'); window.history.replaceState(null, '', '/me'); const t = setInterval(refreshProfile, 15000); return () => clearInterval(t); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goal = profile?.weekly_goal || 4;
  // dishes per country: from the server (setup SQL 17), or counted from your meals until that's run
  const countries = useMemo(() => {
    if (world && !world.missing) return world.countries || [];
    const m = new Map(); history.forEach((x) => { if (x.country) m.set(x.country, (m.get(x.country) || 0) + 1); });
    return [...m].map(([country, n]) => ({ country, n, done: n >= 5 })).sort((a, b) => b.n - a.n);
  }, [world, history]);
  const counts = useMemo(() => new Map(countries.map((c) => [c.country, c.n])), [countries]);
  const doneSet = useMemo(() => new Set(countries.filter((c) => c.done || c.n >= 5).map((c) => c.country)), [countries]);
  const ingredients = (pantry || []).filter((p) => p.status !== 'out').length;
  const recipesCooked = world && !world.missing ? world.recipes || 0 : meals.length;

  // the dart hit a country: find something to cook from there
  function cookFrom(hit) { setUi({ cookMode: 'named', cookDish: hit.name }); router.push('/cook'); }
  function openChallenge(c) {
    const r = (allRecipes || []).find((x) => x.id === c.recipe_id);
    if (r) setRecipe(r); else { setUi({ cookMode: 'named', cookDish: c.title }); router.push('/cook'); }
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

      <TierList countries={countries} />
      <ProfileCard level={lvl} recipes={recipesCooked} ingredients={ingredients} countries={countries.length} streak={profile?.streak_days || 0} />

      <h2 style={{ fontSize: 22, margin: '4px 0 -4px' }}>Your kitchen</h2>
      <MyKitchen />

      <h2 style={{ fontSize: 22, margin: '4px 0 -4px' }} data-tip="album">Your world</h2>
      <div data-tour="stage" data-tip="stage"><Globe counts={counts} done={doneSet} onCook={cookFrom} /></div>

      <CountryChallenges challenges={world?.challenges} onOpen={openChallenge} />

      <div data-tip="closet"><KitchenShop world={world} setWorld={setWorld} onGetCoins={() => setGetCoins(true)} /></div>

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
      {getCoins && <GetCoinsSheet onClose={() => setGetCoins(false)} />}
    </div>
  );
}
