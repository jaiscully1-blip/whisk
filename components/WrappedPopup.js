'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk } from './AppShell';
import WhiskStage from './WhiskStage';
import Icon, { Coin } from './Icon';
import { CUISINES, cuisineMatch, fmt, HOME_MEAL_COST } from '@/lib/game';

const pl = (n, w) => `${fmt(n)} ${w}${n === 1 ? '' : 's'}`;
const day = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };

// Whisk Wrapped: shows once a year, on July 18, when you open the app.
export default function WrappedPopup({ outfit, onClose }) {
  const { supabase, profile } = useWhisk();
  const [rows, setRows] = useState(null);
  const year = new Date().getFullYear();
  useEffect(() => {
    supabase.from('meals').select('title, cuisine, cooked_at, rating').gte('cooked_at', new Date(year, 0, 1).toISOString()).order('cooked_at').limit(2000)
      .then(({ data }) => setRows(data || []));
  }, [supabase, year]);
  const s = useMemo(() => {
    if (!rows) return null;
    const tally = (a) => Object.entries(a.reduce((o, k) => ((o[k] = (o[k] || 0) + 1), o), {})).sort((p, q) => q[1] - p[1]);
    const days = [...new Set(rows.map((m) => day(m.cooked_at)))].sort((a, b) => a - b);
    let best = 0, run = 0, prev = null; days.forEach((d) => { run = prev !== null && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
    return { meals: rows.length, days: days.length, best, cu: tally(rows.map((m) => m.cuisine).filter(Boolean)), di: tally(rows.map((m) => m.title)), liked: rows.filter((m) => m.rating === 'up').length,
      stamps: CUISINES.filter((c) => rows.some((m) => cuisineMatch(m.cuisine, c))).length };
  }, [rows]);
  const Slide = ({ eye, big, sub, bg }) => (
    <section className="card stack" style={{ gap: 4, padding: 16, background: bg || 'var(--card)', width: '100%' }}>
      <span className="eyebrow">{eye}</span>
      <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 34, lineHeight: 1.05, color: 'var(--accent)' }}>{big}</div>
      <span style={{ fontWeight: 700 }}>{sub}</span>
    </section>
  );
  const takeout = Number(profile?.takeout_price ?? 15);
  return (
    <div className="popup-scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup" role="dialog" aria-modal="true" aria-label={`Whisk Wrapped ${year}`} style={{ maxHeight: '92dvh', overflow: 'auto', maxWidth: 440 }}>
        <button className="x" type="button" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
        <span className="eyebrow">July 18 · Whisk Wrapped</span>
        <WhiskStage pose="cooked" outfit={outfit} interactive={false} height={210} label="Whisk celebrating" />
        <h2 style={{ fontSize: 28 }}>Your {year} in the kitchen</h2>
        <div className="card row" style={{ background: 'var(--gold-soft)', justifyContent: 'center', fontWeight: 800, width: '100%' }}><Coin size={20} />July 18 gift: +5,000 coins</div>
        {!s ? <p className="muted">Counting your meals…</p> : s.meals === 0 ? (
          <div className="empty" style={{ width: '100%' }}><b>Nothing to wrap yet</b>Cook and log meals this year and they show up here next July 18.</div>
        ) : (
          <>
            <Slide eye="Meals cooked" big={fmt(s.meals)} sub={`across ${pl(s.days, 'different day')}`} />
            <Slide eye="Longest cooking run" big={pl(s.best, 'day')} sub="in a row" bg="var(--gold-soft)" />
            {s.cu[0] && <Slide eye="Top cuisine" big={s.cu[0][0]} sub={`${pl(s.cu[0][1], 'meal')} · ${s.stamps}/20 passport stickers`} />}
            {s.di[0] && <Slide eye="Signature dish" big={s.di[0][0]} sub={`cooked ${pl(s.di[0][1], 'time')}`} bg="var(--pop-soft)" />}
            <Slide eye="Saved vs takeout" big={`~$${fmt(Math.round(s.meals * Math.max(0, takeout - HOME_MEAL_COST)))}`} sub={`Estimate: ${pl(s.meals, 'meal')} × ($${takeout} − $${HOME_MEAL_COST})`} bg="var(--fresh-soft)" />
            <Slide eye="Meals you loved" big={fmt(s.liked)} sub="thumbs up" />
          </>
        )}
        <button className="btn wide" onClick={onClose}>Leave</button>
      </div>
    </div>
  );
}
