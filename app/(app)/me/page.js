'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCached } from '@/lib/cache';
import { fetchMe } from '@/components/tabData';
import DeleteDataSheet from '@/components/DeleteDataSheet';
import Link from 'next/link';
import { useWhisk, useDraft } from '@/components/AppShell';
import Icon from '@/components/Icon';
import LevelPicker from '@/components/LevelPicker';
import { levelLabel, learns } from '@/lib/learn/levels';
import DailyQuest from '@/components/DailyQuest';
import MyYouTubers from '@/components/MyYouTubers';
import { TIPS } from '@/lib/tips';
import AvatarPicker from '@/components/AvatarPicker';
import { ProfileCard, MyKitchen } from '@/components/MeWorld';
import ResetSheet from '@/components/ResetSheet';
import NeverShowSheet from '@/components/NeverShowSheet';
import { makeBackup, parseBackup, restoreBackup } from '@/lib/backupFile';
import NotifySettings from '@/components/NotifySettings';
import CalorieGoal from '@/components/CalorieGoal';
import LearnEntry from '@/components/LearnEntry';
import BackupSheet from '@/components/BackupSheet';
import { usePantry, useWorld } from '@/components/usePantry';
import { levelFor, fmt } from '@/lib/game';
import { LANGS } from '@/lib/i18n';
import { liveStreak } from '@/lib/streak';
import { useTimeZone } from '@/components/useTimeZone';

const EMPTY_LIST = [];
const TEXT_SCALES = [.85, .92, 1, 1.1, 1.2, 1.3];

// Settings building blocks: a titled group, a row with a control on the right, and a row you tap to open something.
function Sec({ title, children }) { return <section className="set-sec"><h3 className="set-h">{title}</h3><div className="card set-card">{children}</div></section>; }
function Item({ ico, label, htmlFor, hint, testid, children }) {
  return (
    <div className="set-row" data-testid={testid}>
      <span className="set-ico" aria-hidden="true">{ico}</span>
      {htmlFor ? <label htmlFor={htmlFor} className="set-lab">{label}</label> : <span className="set-lab">{label}</span>}
      <span className="set-end">{children}</span>
      {hint && <span className="set-hint">{hint}</span>}
    </div>
  );
}
function Btn({ ico, label, value, onClick, testid }) {
  return <button type="button" className="set-row set-btn" onClick={onClick} data-testid={testid}><span className="set-ico" aria-hidden="true">{ico}</span><span className="set-lab">{label}</span>{value && <span className="set-val">{value}</span>}<Icon name="chevron" size={18} /></button>;
}

export default function Me() {
  const { account, supabase, profile, setProfile, refreshProfile, say, ui, setUi, openPrivacy, replayTour, dataVersion, bump, t, lang, setLang } = useWhisk();
  const [backupSet, setBackupSet] = useState(false);   // the same backup sheet, opened from Settings
  const [backupAsk, setBackupAsk] = useState(false);   // after a name change: offer to back the game up (one time: it never shows again once backed up)
  const [medata] = useCached('me', () => fetchMe(supabase), [dataVersion]);   // remembered between tabs (lib/cache.js)
  const meals = medata?.meals || EMPTY_LIST, history = medata?.history || EMPTY_LIST;
  const [world, , setWorld] = useWorld();
  const [levelOpen, setLevelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  async function downloadBackup() {
    const b = await makeBackup(supabase);
    const url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `yoke-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    say('Backup saved');
  }
  async function restoreFile(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    if (f.size > 2_000_000) { say('That file is too big to be a Yoke backup'); return; }
    const b = parseBackup(await f.text()); if (!b) { say('That isn’t a Yoke backup file'); return; }
    const r = await restoreBackup(supabase, b); bump();
    say(`Restored ${r.pantry} pantry, ${r.list} list, ${r.saved} saved, ${r.mine} own recipes`);
  }
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    try { if (sessionStorage.getItem('yoke-settings')) { sessionStorage.removeItem('yoke-settings'); open(); } } catch {}
    window.addEventListener('yoke-settings', open); return () => window.removeEventListener('yoke-settings', open);
  }, []);
  const [howTo, setHowTo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [never, setNever] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
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
  const tz = useTimeZone();
  const ingredients = (pantry || []).filter((p) => p.status !== 'out').length;
  const recipesCooked = world && !world.missing ? world.recipes || 0 : meals.length;

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
    if (await saveSetting({ display_name: v || null }, 'Name saved')) { clearName(); setEditing(false); if (account?.anon) setBackupAsk(true); }
  }

  return (
    <div className="stack">
      {backupAsk && account?.anon && <div data-testid="name-backup"><BackupSheet supabase={supabase} onClose={() => setBackupAsk(false)} /></div>}
      <div data-tour="name" className="page-title me-title" style={{ flexWrap: 'nowrap' }}>
        <div className="me-head">
        {editing ? (
          <form className="row" style={{ flexWrap: 'nowrap', flex: 1 }} onSubmit={saveName}>
            <label htmlFor="nm" hidden>{t('Your name')}</label>
            <input id="nm" className="input" maxLength={40} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }} />
            <button className="btn sm" type="submit">{t('Save')}</button>
          </form>
        ) : (
          <>
            <AvatarPicker name={name} size={62} />
            <span className="me-who">
            <button className="namebtn" onClick={() => { setNameDraft(nameDraft || profile?.display_name || ''); setEditing(true); }} aria-label={`Edit name: ${name}`}><h1>{name}</h1></button>
            <span className={`me-tag t${lvl.tier}${lvl.tier !== '0' ? ' shiny' : ''}`} data-testid="me-tag" data-tier={lvl.tier}>{lvl.title}</span>
            </span>
          </>
        )}
        </div>
      </div>
      <div>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}><span>{fmt(profile?.xp)} XP</span><span className="muted">{lvl.next ? `${fmt(lvl.next - (profile?.xp || 0))} to level ${lvl.level + 1}` : 'Max level'}</span></div>
        <div className="bar" style={{ height: 10, marginTop: 4 }}><i style={{ width: `${lvl.pct}%` }} /></div>
      </div>

      <ProfileCard level={lvl} xp={profile?.xp || 0} recipes={recipesCooked} ingredients={ingredients} countries={countries.length} streak={liveStreak(profile, tz)} best={profile?.best_streak || 0} prevBest={profile?.streak_prev_best || 0} freezes={profile?.streak_freezes || 0} />
      <MyKitchen shop />
      <DailyQuest />
      <LearnEntry />

      <MyYouTubers />

      {settingsOpen && (
        <div className="settings-page" role="dialog" aria-modal="true" aria-label={t('Settings')} data-testid="settings-page">
          <div className="settings-top"><button type="button" className="btn ghost sm" onClick={() => setSettingsOpen(false)} aria-label={t('Back to Me')} data-testid="settings-back"><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />{t('Back')}</button><h2 style={{ margin: 0, fontSize: 22 }}>{t('Settings')}</h2></div>
          <div className="settings-body stack">
            <Sec title={t('Look & feel')}>
              <Item ico={<Icon name="moon" />} label={t('Night mode')}>
                <button role="switch" aria-checked={profile?.theme_pref === 'night'} aria-label={t('Night mode')} onClick={() => saveSetting({ theme_pref: profile.theme_pref === 'night' ? 'day' : 'night' })} className={`switch ${profile?.theme_pref === 'night' ? 'on' : ''}`}><span /></button>
              </Item>
              <Item ico={<Icon name="globe" />} label={t('Language')} htmlFor="lang-pick">
                <select id="lang-pick" data-testid="lang-pick" className="set-select" value={lang} onChange={(e) => setLang(e.target.value)}>{LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
              </Item>
              <Item ico={<b className="set-aa" aria-hidden="true">Aa</b>} label={t('Text size')}>
                <span className="set-step">
                  <button className="btn ghost sm" aria-label="Smaller text" disabled={scaleAt === 0} onClick={() => setUi({ textScale: TEXT_SCALES[Math.max(0, scaleAt - 1)] })}>−</button>
                  <output aria-live="polite">{Math.round(TEXT_SCALES[scaleAt] * 100)}%</output>
                  <button className="btn ghost sm" aria-label="Bigger text" disabled={scaleAt === TEXT_SCALES.length - 1} onClick={() => setUi({ textScale: TEXT_SCALES[Math.min(TEXT_SCALES.length - 1, scaleAt + 1)] })}>+</button>
                </span>
              </Item>
            </Sec>

            <Sec title="Cooking">
              <Item ico={<Icon name="cook" />} label={t('Weekly cooking goal')}>
                <span className="set-step">
                  <button className="btn ghost sm" aria-label="Fewer meals" onClick={() => saveSetting({ weekly_goal: Math.max(1, goal - 1) }, `Goal: ${Math.max(1, goal - 1)} meals a week`)}>−</button>
                  <output>{goal}</output>
                  <button className="btn ghost sm" aria-label="More meals" onClick={() => saveSetting({ weekly_goal: Math.min(14, goal + 1) }, `Goal: ${Math.min(14, goal + 1)} meals a week`)}>+</button>
                </span>
              </Item>
              {profile?.skill_level !== undefined && <Btn ico={<Icon name="learn" />} label={t('Cooking level')} value={`${levelLabel(profile.skill_level) || 'Not set'}${learns(profile.skill_level) ? ' · Learn on' : ''}`} onClick={() => setLevelOpen(true)} testid="level-row" />}
              <Btn ico={<Icon name="shield" />} label={t('Never show me')} value={(profile?.never_show || []).length ? `${profile.never_show.length} hidden` : 'Allergies, dislikes'} onClick={() => setNever(true)} />
              <CalorieGoal />
              <Item ico={<Icon name="snow" />} label={t('Streak freezes')} hint="One free. Extra ones cost 1,500 coins (up to 3)."><b className="set-val">{profile?.streak_freezes ?? 1}</b></Item>
            </Sec>

            <Sec title="Alerts & time">
              <NotifySettings />
              <Item ico={<Icon name="plane" />} label={t('Vacation mode')} hint={profile?.vacation_since ? 'Streak paused, up to 30 days.' : 'Pause your streak while you’re away.'}>
                <button role="switch" aria-checked={!!profile?.vacation_since} aria-label={t('Vacation mode')} onClick={toggleVacation} className={`switch ${profile?.vacation_since ? 'on' : ''}`}><span /></button>
              </Item>
              <Item ico={<Icon name="timer" />} label={t('Time zone')} htmlFor="tz-pick">
                <select id="tz-pick" data-testid="tz-pick" aria-label={t('Time zone')} className="set-select" value={ui?.tzPick || ''} onChange={(e) => { setUi({ tzPick: e.target.value || null }); say(e.target.value ? 'Time zone saved' : 'Using this device’s time zone'); }}>
                  <option value="">{t('Automatic')}</option>
                  {tzOptions(ui?.tzPick).map(([z, label]) => <option key={z} value={z}>{label}</option>)}
                </select>
              </Item>
            </Sec>

            <Sec title="Account">
              {account?.anon
                ? <Btn ico={<Icon name="shield" />} label="Back up your game" value="Not backed up" onClick={() => setBackupSet(true)} testid="set-backup" />
                : <Item ico={<Icon name="shield" />} label="Game backed up" testid="set-backed-up"><Icon name="check" /></Item>}
              {backupSet && account?.anon && <BackupSheet supabase={supabase} onClose={() => setBackupSet(false)} />}
              <Btn ico={<img src="/cookie.svg" alt="" width="20" height="20" />} label={t('Cookies & privacy')} value={profile?.consent?.local_time ? (profile?.time_zone || '').replace(/_/g, ' ') : 'UTC days'} onClick={openPrivacy} />
            </Sec>

            <Sec title="Help">
              <Btn ico={<Icon name="flag" />} label={t('How Yoke works')} onClick={() => setHowTo(true)} />
              <Btn ico={<img src="/icon.svg" alt="" width="20" height="20" />} label={t('Show tips again')} onClick={() => { replayTour(); say('The tips will show again as you tap things'); }} />
              {profile?.is_admin && <Link href="/admin" className="set-row set-btn"><span className="set-ico"><Icon name="compete" /></span><span className="set-lab">Backend dashboard</span><Icon name="chevron" /></Link>}
            </Sec>

            <button className="btn wide" data-testid="log-out" onClick={() => {
              if (account?.anon && !window.confirm('You haven’t backed up this game. If you log out you won’t be able to get back into it. Log out anyway?')) return;
              const f = document.createElement('form'); f.method = 'POST'; f.action = '/auth/signout'; document.body.appendChild(f); f.submit();
            }}>{t('Log out')}</button>
            <div className="set-foot">
              <button className="set-link danger-row" data-testid="delete-data" onClick={() => setDeleting(true)}><Icon name="trash" size={12} />{t('Delete my data')}</button>
              <button className="set-link" onClick={() => setResetting(true)}>{t('Reset game')}</button>
              <span className="mono" style={{ userSelect: 'all' }}>ID {profile?.id}</span>
            </div>
          </div>
        </div>
      )}
      {deleting && <DeleteDataSheet onClose={() => setDeleting(false)} />}
      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
      {never && <NeverShowSheet onClose={() => setNever(false)} />}
      {howTo && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setHowTo(false); }}>
          <div className="sheet stack howto" role="dialog" aria-modal="true" aria-label={t('How Yoke works')}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><h2 style={{ margin: 0 }}>{t('How Yoke works')}</h2><button type="button" className="btn ghost sm" onClick={() => setHowTo(false)} aria-label={t('Close')}><Icon name="x" /></button></div>
            <span className="desc">Read what you need, skip what you don’t.</span>
            {Object.entries(TIPS).map(([id, [t, txt]]) => (
              <details key={id} className="howto-row"><summary>{t}</summary><p>{txt}</p></details>
            ))}
          </div>
        </div>
      )}
      {levelOpen && <LevelPicker current={profile?.skill_level} onPick={async (id) => { setLevelOpen(false); setProfile({ ...profile, skill_level: id }); const { error } = await supabase.rpc('set_skill_level', { p_level: id }); say(error ? 'Couldn’t save your level.' : (learns(id) ? 'Level saved. Learn is on in the Cook tab' : 'Level saved')); }} onLater={() => setLevelOpen(false)} />}
    </div>
  );
}

// A short, familiar list like other apps: "UTC-05:00 New York". Values stay real time zones, so daylight saving still works.
const TZ_CITIES = [['Pacific/Honolulu', 'Honolulu'], ['America/Anchorage', 'Anchorage'], ['America/Los_Angeles', 'Los Angeles'], ['America/Denver', 'Denver'], ['America/Phoenix', 'Phoenix'], ['America/Chicago', 'Chicago'], ['America/New_York', 'New York'], ['America/Halifax', 'Halifax'], ['America/Sao_Paulo', 'São Paulo'], ['Atlantic/Azores', 'Azores'], ['Europe/London', 'London'], ['Europe/Paris', 'Paris'], ['Europe/Athens', 'Athens'], ['Europe/Moscow', 'Moscow'], ['Asia/Dubai', 'Dubai'], ['Asia/Kolkata', 'Mumbai'], ['Asia/Bangkok', 'Bangkok'], ['Asia/Shanghai', 'Beijing'], ['Asia/Tokyo', 'Tokyo'], ['Australia/Sydney', 'Sydney'], ['Pacific/Auckland', 'Auckland']];
function offsetMin(z) {
  try {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: z, timeZoneName: 'longOffset' }).formatToParts(new Date()).find((x) => x.type === 'timeZoneName')?.value || 'GMT';
    const m = p.match(/([+-])(\d{2}):?(\d{2})?/); return m ? (m[1] === '-' ? -1 : 1) * (+m[2] * 60 + +(m[3] || 0)) : 0;
  } catch { return 0; }
}
function tzOptions(current) {
  const list = TZ_CITIES.slice(); if (current && !list.some(([z]) => z === current)) list.push([current, current.split('/').pop().replace(/_/g, ' ')]);
  return list.map(([z, c]) => { const m = offsetMin(z), a = Math.abs(m); return [z, m, `UTC${m < 0 ? '-' : '+'}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')} ${c}`]; })
    .sort((x, y) => x[1] - y[1]).map(([z, , label]) => [z, label]);
}
