'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import PullToRefresh from './PullToRefresh';
import Tutorial from './Tutorial';
import CookieConsent, { CONSENT_KEY, deviceTimeZone } from './CookieConsent';
import { startActivity, setPage as trackPage } from '@/lib/activity';
import { timerApi } from '@/lib/timers';
import Icon, { Coin, Flame } from './Icon';
import WhiskStage, { outfitFrom } from './WhiskStage';
import { fmt, levelFor } from '@/lib/game';
import LevelUp from './LevelUp';

const Ctx = createContext(null);
export const useWhisk = () => useContext(Ctx);

const TITLES = { cooked: 'Cooked it!' };
const NAV = [['/home', 'Home', 'home'], ['/pantry', 'Pantry', 'pantry'], ['/cook', 'Cook', 'cook'], ['/compete', 'Compete', 'compete'], ['/me', 'Me', 'me']];
const consentRef0 = (p) => { if (p?.consent) return p.consent; try { return JSON.parse(localStorage.getItem('whisk-consent') || 'null'); } catch { return null; } };
const PROFILE_COLS = 'id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state, time_zone, consent, first_open_date, onboarded_at, is_admin';
const UI_LOCAL = 'whisk-ui';

export function deviceLabel() {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'Device';
  const br = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return `${os} · ${br}`;
}

export default function AppShell({ initialProfile, initialLoadout, email, children }) {
  const supabase = supabaseBrowser();
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [loadout, setLoadout] = useState(initialLoadout);
  const [recipes, setRecipes] = useState(null);
  const [popups, setPopups] = useState([]);           // queue: 'back' | 'late' | 'wrapped' | {kind:'cooked', mealId}
  const [rating, setRating] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const [levelUp, setLevelUp] = useState(null);
  const lastLevel = useRef(levelFor(initialProfile?.xp).level);
  const logged = useRef(false);
  const [lastPlayed, setLastPlayed] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const [dataVersion, setDataVersion] = useState(0);   // bump to make lists (saved recipes, pantry) reload
  const bump = useCallback(() => setDataVersion((v) => v + 1), []);
  const [refreshKey, setRefreshKey] = useState(0);   // pull to refresh remounts the page so it reloads everything
  // ---------- cookies & privacy ----------
  const [consent, setConsent] = useState(initialProfile?.consent || null);   // the account is the source of truth
  const consentRef = useRef(consent); consentRef.current = consent;
  const [privacyOpen, setPrivacyOpen] = useState(!consent || (consent.v || 1) < 2);   // v2 added the usage-data choice
  const [touring, setTouring] = useState(false);
  useEffect(() => { if (!privacyOpen && profile && !profile.onboarded_at && profile.id) setTouring(true); }, [privacyOpen, profile?.onboarded_at]); // eslint-disable-line react-hooks/exhaustive-deps
  const finishTour = useCallback(async () => {
    setTouring(false); setProfile((p) => ({ ...p, onboarded_at: p.onboarded_at || new Date().toISOString() }));
    await supabase.rpc('set_onboarded', { p_done: true });
  }, [supabase]);
  const replayTour = useCallback(() => setTouring(true), []);
  const [hello, setHello] = useState(null);   // greeting shown in the top bar for a few seconds after opening
  const [helloOn, setHelloOn] = useState(false);
  useEffect(() => { if (!hello || privacyOpen || touring) return; setHelloOn(true); const t = setTimeout(() => setHelloOn(false), hello.gift ? 7000 : 4500); return () => clearTimeout(t); }, [hello, privacyOpen, touring]);

  // ---------- remembered screens + inputs (saved to your account, mirrored on this device) ----------
  const [ui, setUiState] = useState(() => {
    let local = null; try { if (consentRef0(initialProfile)?.preferences) local = JSON.parse(localStorage.getItem(UI_LOCAL) || 'null'); } catch {}
    const remote = initialProfile?.ui_state || null;
    return (local && (!remote || (local.at || 0) > (remote.at || 0)) ? local : remote) || { drafts: {}, scroll: {} };
  });
  const uiRef = useRef(ui); if ((ui.at || 0) >= (uiRef.current.at || 0)) uiRef.current = ui;
  const uiTimer = useRef(0);
  const flushUi = useCallback(async () => {
    clearTimeout(uiTimer.current); uiTimer.current = 0;
    setSaveState('saving');
    const { error } = await supabase.from('profiles').update({ ui_state: uiRef.current }).eq('id', initialProfile.id);
    setSaveState(error ? 'error' : 'saved');
  }, [supabase, initialProfile.id]);
  const setUi = useCallback((patch) => {
    setUiState(() => {
      const cur = uiRef.current;   // includes quiet saves (scroll spots) made since the last render
      const next = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch), at: Date.now() };
      uiRef.current = next;
      if (consentRef.current?.preferences) { try { localStorage.setItem(UI_LOCAL, JSON.stringify(next)); } catch {} }
      return next;
    });
    clearTimeout(uiTimer.current); uiTimer.current = setTimeout(() => flushUi(), 400);
  }, [flushUi]);
  const getUi = useCallback(() => uiRef.current, []);
  const openPrivacy = useCallback(() => setPrivacyOpen(true), []);
  // Saves without re-rendering the app (scroll spots, album page): nothing on screen depends on these.
  const setUiQuiet = useCallback((patch) => {
    const next = { ...uiRef.current, ...(typeof patch === 'function' ? patch(uiRef.current) : patch), at: Date.now() };
    uiRef.current = next;
    if (consentRef.current?.preferences) { try { localStorage.setItem(UI_LOCAL, JSON.stringify(next)); } catch {} }
    clearTimeout(uiTimer.current); uiTimer.current = setTimeout(() => flushUi(), 800);
  }, [flushUi]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden' && uiTimer.current) flushUi(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flushUi]);

  // Every time the app opens it starts on Cook (except coming back from the Bitcoin checkout). Scroll spots are remembered.
  const restored = useRef(false);
  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      if (pathname !== '/cook' && !pathname.startsWith('/admin') && !/[?&]paid=1/.test(window.location.search)) { router.replace('/cook'); return; }
    }
    setUi({ path: pathname });
    const y = uiRef.current.scroll?.[pathname] || 0;
    const t = setTimeout(() => window.scrollTo(0, y), 60);
    let st = 0;
    const onScroll = () => { clearTimeout(st); st = setTimeout(() => setUiQuiet((c) => ({ scroll: { ...(c.scroll || {}), [pathname]: Math.round(window.scrollY) } })), 300); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select(PROFILE_COLS).eq('id', initialProfile.id).single();
    if (data) {
      setProfile(data);
      const lv = levelFor(data.xp);
      if (lv.level > lastLevel.current) setLevelUp(lv);
      lastLevel.current = lv.level;
    }
    return data;
  }, [supabase, initialProfile.id]);
  const refreshLoadout = useCallback(async () => {
    const { data } = await supabase.from('loadouts').select('top_id, hat_id, glasses_id, shoes_id, acc_id').eq('user_id', initialProfile.id).maybeSingle();
    if (data) setLoadout(data);
  }, [supabase, initialProfile.id]);
  const say = useCallback((msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2800); }, []);
  const showPopup = useCallback((p) => setPopups((q) => [...q, p]), []);

  // Real web recipes (read-only catalog), loaded once.
  useEffect(() => {
    supabase.from('web_recipes').select('id, title, cuisine, source, url, minutes, servings, score, data').then(({ data }) => {
      setRecipes((data || []).map((r) => ({ ...r.data, id: r.id, title: r.title, cuisine: r.cuisine, source: r.source, url: r.url, minutes: r.minutes, servings: r.servings, score: r.score })));
    });
  }, [supabase]);

  // Opening the app: login tracking, popups, last device.
  useEffect(() => {
    if (logged.current) return; logged.current = true;
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const device = deviceLabel();
    supabase.rpc('record_login', { p_local_date: localDate, p_local_hour: now.getHours(), p_user_agent: navigator.userAgent.slice(0, 300), p_device: device })
      .then(({ data, error }) => {
        if (error || !data) return;
        if (data.last_device || data.last_seen_at) setLastPlayed({ device: data.last_device, at: data.last_seen_at, here: data.last_device === device });
        if (data.gift_coins) refreshProfile();
        // Opening the app: a big greeting in the top bar (no popup).
        setHello({ first: !data.last_seen_at, gift: data.gift_coins || 0 });
      });
  }, [supabase, say, showPopup, refreshProfile]);

  const night = profile?.theme_pref === 'night';
  useEffect(() => {
    document.documentElement.className = night ? 'theme-night' : 'theme-day';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', night ? '#171C16' : '#F7F8F1');
  }, [night]);

  const popup = popups[0] || null;
  const kind = popup && typeof popup === 'object' ? popup.kind : popup;
  const title = TITLES[kind];
  const closePopup = () => { setPopups((q) => q.slice(1)); setRating(null); bump(); };
  async function rate(v) {
    const next = rating === v ? null : v; setRating(next);
    const { error } = await supabase.rpc('rate_meal', { p_meal_id: popup.mealId, p_rating: next });
    if (error) say('Couldn’t save your rating.'); else bump();
  }

  const savePrivacy = useCallback(async (choice) => {
    const tz = deviceTimeZone();
    const { data, error } = await supabase.rpc('set_privacy', { p_preferences: !!choice.preferences, p_local_time: !!choice.local_time, p_time_zone: choice.local_time ? tz : null, p_usage: !!choice.usage });
    if (error) { say('Couldn’t save your choices. Try again.'); return; }
    const c = { v: 2, essential: true, preferences: !!choice.preferences, local_time: !!choice.local_time, usage: !!choice.usage, at: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); if (!c.preferences) localStorage.removeItem(UI_LOCAL); else localStorage.setItem(UI_LOCAL, JSON.stringify(uiRef.current)); } catch {}
    setConsent(c); setPrivacyOpen(false);
    setProfile((p) => ({ ...p, consent: c, time_zone: data?.time_zone ?? null, first_open_date: data?.first_open_date ?? p.first_open_date }));
  }, [supabase, say]);
  // Activity log follows the "Help improve Whisk" choice.
  useEffect(() => { startActivity(supabase, !!consent?.usage, deviceLabel()); }, [consent, supabase]);
  useEffect(() => { trackPage(pathname); }, [pathname, consent]);
  // Moved to a new time zone? Days follow you (only if you allowed local time).
  useEffect(() => {
    if (!consent?.local_time) return;
    const tz = deviceTimeZone();
    if (tz && (tz !== profile?.time_zone || !profile?.first_open_date)) supabase.rpc('set_privacy', { p_preferences: !!consent.preferences, p_local_time: true, p_time_zone: tz, p_usage: !!consent.usage }).then(({ data }) => { if (data) setProfile((p) => ({ ...p, time_zone: data.time_zone, first_open_date: data.first_open_date })); });
  }, [consent]); // eslint-disable-line react-hooks/exhaustive-deps

  const pullRefresh = useCallback(async () => {
    await Promise.all([refreshProfile(), refreshLoadout?.(), new Promise((r) => setTimeout(r, 450))]);
    bump(); setRefreshKey((k) => k + 1);
  }, [refreshProfile, refreshLoadout, bump]);
  const value = useMemo(() => ({ profile, setProfile, refreshProfile, loadout, refreshLoadout, showPopup, say, email, supabase, recipes, ui, setUi, setUiQuiet, getUi, openPrivacy, replayTour, lastPlayed, saveState, dataVersion, bump }),
    [profile, refreshProfile, loadout, refreshLoadout, showPopup, say, email, supabase, recipes, ui, setUi, setUiQuiet, getUi, openPrivacy, replayTour, lastPlayed, saveState, dataVersion, bump]);
  const outfit = outfitFrom(loadout);

  return (
    <Ctx.Provider value={value}>
      <div className={`shell ${night ? 'theme-night' : 'theme-day'}`}>
        <header className="hud">
          <div className="hud-in">
            <Link href="/home" className="brand" aria-label="Whisk home"><img src="/icon.svg" alt="" />whisk</Link>
            {hello && <div className={`hud-hello ${helloOn ? 'on' : ''}`} role="status" aria-hidden={!helloOn}>
              <span>{hello.first ? 'Welcome to Whisk' : 'Welcome back'}{profile?.display_name ? `, ${profile.display_name}` : ''}!</span>
              {hello.gift > 0 && <small>+{fmt(hello.gift)} coins, a gift from Whisk</small>}
            </div>}
            <div className={`pills ${helloOn ? 'away' : ''}`}>
              <RunningTimer />
              <span className="pill" title="Cooking streak"><Flame />{profile?.streak_days || 0}d</span>
              <Link href="/me#shop" className="pill" title="Coins" style={{ textDecoration: 'none' }}><Coin />{fmt(profile?.coins)}</Link>
            </div>
          </div>
        </header>
        <PullToRefresh onRefresh={pullRefresh}><main key={refreshKey} className="wrap" style={ui.textScale && ui.textScale !== 1 ? { zoom: ui.textScale } : undefined}>{children}</main></PullToRefresh>
        <nav className="nav" aria-label="Main">
          <div className="nav-in">
            {NAV.map(([href, label, icon]) => (
              <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}><Icon name={icon} size={24} />{label}</Link>
            ))}
          </div>
        </nav>
        {touring && !privacyOpen && <Tutorial onDone={finishTour} />}
        {privacyOpen && <CookieConsent initial={consent} onSave={savePrivacy} onClose={() => setPrivacyOpen(false)} />}
        {kind && !privacyOpen && (
          <div className="popup-scrim" role="presentation" onClick={(e) => { if (kind !== 'cooked' && e.target === e.currentTarget) closePopup(); }}>
            <div className="popup" role="dialog" aria-modal="true" aria-label={title}>
              {kind !== 'cooked' && <button className="x" type="button" aria-label="Close" onClick={closePopup}><Icon name="x" /></button>}
              <WhiskStage pose={kind === 'cooked' ? 'cooked' : 'default'} outfit={outfit} interactive={false} height={kind === 'cooked' ? 250 : 300} zoom={1.15} label={`Whisk: ${title}`} />
              <h2>{title}</h2>
              {kind === 'cooked' && (
                <>
                  <p className="muted" style={{ margin: '4px 0 0', fontWeight: 800 }}>How was it?</p>
                  <div className="rate">
                    <button type="button" aria-pressed={rating === 'up'} aria-label="Liked it" onClick={() => rate('up')}><Icon name="up" size={26} /></button>
                    <button type="button" className="down" aria-pressed={rating === 'down'} aria-label="Didn’t like it" onClick={() => rate('down')}><Icon name="down" size={26} /></button>
                  </div>
                  <span className="desc">Saved to your cookbook with your rating.</span>
                  <button className="btn wide" style={{ marginTop: 8 }} onClick={closePopup} autoFocus>Leave</button>
                </>
              )}
            </div>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {levelUp && !popup && !privacyOpen && <LevelUp level={levelUp} onClose={() => setLevelUp(null)} />}
      </div>
    </Ctx.Provider>
  );
}

/** A text field that remembers what you typed (across reloads and devices) until you submit it. */
export function useDraft(key, initial = '') {
  const { ui, setUi } = useWhisk();
  const value = ui.drafts?.[key] ?? initial;
  const set = useCallback((v) => setUi((c) => ({ drafts: { ...(c.drafts || {}), [key]: v } })), [key, setUi]);
  const clear = useCallback(() => setUi((c) => { const d = { ...(c.drafts || {}) }; delete d[key]; return { drafts: d }; }), [key, setUi]);
  return [value, set, clear];
}

/** Shows the next cooking timer in the top bar while one is running, so you can close the recipe. */
function RunningTimer() {
  const [, force] = useState(0);
  useEffect(() => timerApi.subscribe(() => force((n) => n + 1)), []);
  const next = timerApi.next();
  if (!next) return null;
  const left = Math.max(0, Math.ceil((next.end - Date.now()) / 1000));
  return <span className="pill" title={next.label} aria-label={`Timer: ${Math.floor(left / 60)} minutes ${left % 60} seconds left`}><Icon name="timer" size={16} />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>;
}
