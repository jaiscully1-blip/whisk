'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import Icon, { Coin, Flame } from './Icon';
import WhiskStage, { outfitFrom } from './WhiskStage';
import { fmt, levelFor } from '@/lib/game';
import LevelUp from './LevelUp';

const Ctx = createContext(null);
export const useWhisk = () => useContext(Ctx);

const TITLES = { cooked: 'Cooked it!', back: 'We’re so back!', late: 'Late night snack...' };
const NAV = [['/home', 'Home', 'home'], ['/pantry', 'Pantry', 'pantry'], ['/cook', 'Cook', 'cook'], ['/compete', 'Compete', 'compete'], ['/me', 'Me', 'me']];

export default function AppShell({ initialProfile, initialLoadout, email, children }) {
  const supabase = supabaseBrowser();
  const pathname = usePathname();
  const [profile, setProfile] = useState(initialProfile);
  const [loadout, setLoadout] = useState(initialLoadout);
  const [popup, setPopup] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);
  const [levelUp, setLevelUp] = useState(null);
  const lastLevel = useRef(levelFor(initialProfile?.xp).level);
  const logged = useRef(false);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('id, display_name, theme_pref, xp, coins, streak_days, streak_freezes, login_count, first_login_at, last_meal_at, weekly_goal, takeout_price').eq('id', initialProfile.id).single();
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
  const say = useCallback((msg) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2600); }, []);

  // login tracking + "We're so back!" / "Late night snack..." on app open
  useEffect(() => {
    if (logged.current) return; logged.current = true;
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    supabase.rpc('record_login', { p_local_date: localDate, p_local_hour: now.getHours(), p_user_agent: navigator.userAgent.slice(0, 300) })
      .then(({ data, error }) => { if (!error && data?.popup) setPopup(data.popup); });
  }, [supabase]);

  const night = profile?.theme_pref === 'night';
  useEffect(() => {
    document.documentElement.className = night ? 'theme-night' : 'theme-day';
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', night ? '#171C16' : '#F7F8F1');
  }, [night]);

  const value = useMemo(() => ({ profile, setProfile, refreshProfile, loadout, refreshLoadout, showPopup: setPopup, say, email, supabase }), [profile, refreshProfile, loadout, refreshLoadout, say, email, supabase]);
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
        {popup && (
          <div className="popup-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setPopup(null); }}>
            <div className="popup" role="dialog" aria-modal="true" aria-label={TITLES[popup]}>
              <button className="x" type="button" aria-label="Close" onClick={() => setPopup(null)}><Icon name="x" /></button>
              <WhiskStage pose={popup} outfit={outfit} interactive={false} height={300} zoom={1.15} label={`Whisk: ${TITLES[popup]}`} />
              <h2>{TITLES[popup]}</h2>
            </div>
          </div>
        )}
        {toast && <div className="toast" role="status">{toast}</div>}
        {levelUp && !popup && <LevelUp level={levelUp} onClose={() => setLevelUp(null)} />}
      </div>
    </Ctx.Provider>
  );
}
