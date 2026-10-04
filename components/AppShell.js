'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon, { Coin, Flame } from './Icon';
import WhiskStage, { outfitFrom } from './WhiskStage';
import { fmt, levelFor } from '@/lib/game';
import LevelUp from './LevelUp';
import WrappedPopup from './WrappedPopup';

const Ctx = createContext(null);
export const useWhisk = () => useContext(Ctx);

const TITLES = { cooked: 'Cooked it!', back: 'We’re so back!', late: 'Late night snack...' };
const NAV = [['/home', 'Home', 'home'], ['/pantry', 'Pantry', 'pantry'], ['/cook', 'Cook', 'cook'], ['/compete', 'Compete', 'compete'], ['/me', 'Me', 'me']];
const PROFILE_COLS = 'id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price, last_device, ui_state';
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

  // ---------- remembered screens + inputs (saved to your account, mirrored on this device) ----------
  const [ui, setUiState] = useState(() => {
    let local = null; try { local = JSON.parse(localStorage.getItem(UI_LOCAL) || 'null'); } catch {}
    const remote = initialProfile?.ui_state || null;
    return (local && (!remote || (local.at || 0) > (remote.at || 0)) ? local : remote) || { drafts: {}, scroll: {} };
  });
  const uiRef = useRef(ui); uiRef.current = ui;
  const uiTimer = useRef(0);
  const flushUi = useCallback(async () => {
    clearTimeout(uiTimer.current); uiTimer.current = 0;
    setSaveState('saving');
    const { error } = await supabase.from('profiles').update({ ui_state: uiRef.current }).eq('id', initialProfile.id);
    setSaveState(error ? 'error' : 'saved');
  }, [supabase, initialProfile.id]);
  const setUi = useCallback((patch) => {
    setUiState((cur) => {
      const next = { ...cur, ...(typeof patch === 'function' ? patch(cur) : patch), at: Date.now() };
      try { localStorage.setItem(UI_LOCAL, JSON.stringify(next)); } catch {}
      return next;
    });
    clearTimeout(uiTimer.current); uiTimer.current = setTimeout(() => flushUi(), 400);
  }, [flushUi]);
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden' && uiTimer.current) flushUi(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flushUi]);

  // Remember which tab you were on and where you were scrolled.
  const restored = useRef(false);
  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      const last = ui.path;
      if (pathname === '/home' && last && last !== '/home' && NAV.some(([h]) => last.startsWith(h))) { router.replace(last); return; }
    }
    setUi({ path: pathname });
    const y = ui.scroll?.[pathname] || 0;
    const t = setTimeout(() => window.scrollTo(0, y), 60);
    let st = 0;
    const onScroll = () => { clearTimeout(st); st = setTimeout(() => setUi((c) => ({ scroll: { ...(c.scroll || {}), [pathname]: Math.round(window.scrollY) } })), 400); };
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
        if (data.last_seen_at && data.new_session) say(`Welcome back · picked up where you left off${data.last_device && data.last_device !== device ? ` on ${data.last_device}` : ''}`);
        if (data.gift_coins) refreshProfile();
        (data.popups || []).forEach(showPopup);
      });
  }, [supabase, say, showPopup, refreshProfile]);

  const night = profile?.theme_pref === 'night';
  useEffect(() => {
    document.documentElement.className = night ? 'theme-night' : 'theme-day';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', night ? '#171C16' : '#F7F8F1');
  }, [night]);

  const popup = popups[0] || null;
  const kind = popup && typeof popup === 'object' ? popup.kind : popup;
  const closePopup = () => { setPopups((q) => q.slice(1)); setRating(null); bump(); };
  async function rate(v) {
    const next = rating === v ? null : v; setRating(next);
    const { error } = await supabase.rpc('rate_meal', { p_meal_id: popup.mealId, p_rating: next });
    if (error) say('Couldn’t save your rating.'); else bump();
  }

  const value = useMemo(() => ({ profile, setProfile, refreshProfile, loadout, refreshLoadout, showPopup, say, email, supabase, recipes, ui, setUi, lastPlayed, saveState, dataVersion, bump }),
    [profile, refreshProfile, loadout, refreshLoadout, showPopup, say, email, supabase, recipes, ui, setUi, lastPlayed, saveState, dataVersion, bump]);
  const outfit = outfitFrom(loadout);

  return (
    <Ctx.Provider value={value}>
      <div className={`shell ${night ? 'theme-night' : 'theme-day'}`}>
        <header className="hud">
          <div className="hud-in">
            <Link href="/home" className="brand" aria-label="Whisk home"><img src="/icon.svg" alt="" />whisk</Link>
            <div className="pills">
              <span className="pill" title="Cooking streak"><Flame />{profile?.streak_days || 0}d</span>
              <Link href="/compete#shop" className="pill" title="Coins" style={{ textDecoration: 'none' }}><Coin />{fmt(profile?.coins)}</Link>
            </div>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <nav className="nav" aria-label="Main">
          <div className="nav-in">
            {NAV.map(([href, label, icon]) => (
              <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}><Icon name={icon} size={24} />{label}</Link>
            ))}
          </div>
        </nav>
        {kind === 'wrapped' && <WrappedPopup outfit={outfit} onClose={closePopup} />}
        {kind && kind !== 'wrapped' && (
          <div className="popup-scrim" role="presentation" onClick={(e) => { if (kind !== 'cooked' && e.target === e.currentTarget) closePopup(); }}>
            <div className="popup" role="dialog" aria-modal="true" aria-label={TITLES[kind]}>
              {kind !== 'cooked' && <button className="x" type="button" aria-label="Close" onClick={closePopup}><Icon name="x" /></button>}
              <WhiskStage pose={kind} outfit={outfit} interactive={false} height={kind === 'cooked' ? 250 : 300} zoom={1.15} label={`Whisk: ${TITLES[kind]}`} />
              <h2>{TITLES[kind]}</h2>
              {kind === 'cooked' && (
                <>
                  <p className="muted" style={{ margin: '4px 0 0', fontWeight: 800 }}>How was it?</p>
                  <div className="rate">
                    <button type="button" aria-pressed={rating === 'up'} aria-label="Liked it" onClick={() => rate('up')}><Icon name="up" size={26} /></button>
                    <button type="button" className="down" aria-pressed={rating === 'down'} aria-label="Didn’t like it" onClick={() => rate('down')}><Icon name="down" size={26} /></button>
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>Saved to your cookbook with your rating.</span>
                  <button className="btn wide" style={{ marginTop: 8 }} onClick={closePopup} autoFocus>Leave</button>
                </>
              )}
            </div>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {levelUp && !popup && <LevelUp level={levelUp} onClose={() => setLevelUp(null)} />}
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
