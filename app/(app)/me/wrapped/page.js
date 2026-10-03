'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import WhiskStage, { outfitFrom } from '@/components/WhiskStage';
import Icon from '@/components/Icon';
import { CUISINES, cuisineMatch, fmt, levelFor, HOME_MEAL_COST } from '@/lib/game';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function longestRun(dates) {
  const days = [...new Set(dates.map((d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }))].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const t of days) { run = prev !== null && Math.round((t - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
  return best;
}

export default function Wrapped() {
  const { supabase, profile, loadout } = useWhisk();
  const [rows, setRows] = useState(null);
  const [saved, setSaved] = useState(0);
  const year = new Date().getFullYear();

  useEffect(() => {
    (async () => {
      const from = new Date(year, 0, 1).toISOString();
      const [m, r] = await Promise.all([
        supabase.from('meals').select('title, cuisine, cooked_at, calories, protein_g').gte('cooked_at', from).order('cooked_at').limit(2000),
        supabase.from('recipes').select('id', { count: 'exact', head: true }).gte('created_at', from)
      ]);
      setRows(m.data || []); setSaved(r.count || 0);
    })();
  }, [supabase, year]);

  const s = useMemo(() => {
    if (!rows) return null;
    const tally = (arr) => Object.entries(arr.reduce((a, k) => ((a[k] = (a[k] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
    const cuisines = tally(rows.map((m) => (m.cuisine || '').trim()).filter(Boolean));
    const dishes = tally(rows.map((m) => m.title.trim()));
    const months = tally(rows.map((m) => MONTHS[new Date(m.cooked_at).getMonth()]));
    const hours = rows.map((m) => new Date(m.cooked_at).getHours());
    const late = hours.filter((h) => h >= 21 || h < 4).length;
    const stamps = CUISINES.filter((c) => rows.some((m) => cuisineMatch(m.cuisine, c))).length;
    const protein = rows.reduce((a, m) => a + (m.protein_g || 0), 0);
    const days = new Set(rows.map((m) => dayKey(new Date(m.cooked_at)))).size;
    return { meals: rows.length, cuisines, dishes, months, late, stamps, protein, days, run: longestRun(rows.map((m) => m.cooked_at)) };
  }, [rows]);

  const lvl = levelFor(profile?.xp);
  const savedMoney = s ? Math.max(0, s.meals * (Number(profile?.takeout_price ?? 15) - HOME_MEAL_COST)) : 0;
  const Big = ({ children }) => <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 44, lineHeight: 1.05, color: 'var(--accent)' }}>{children}</div>;
  const Slide = ({ eyebrow, children, bg }) => <section className="card stack" style={{ gap: 6, padding: 22, background: bg || 'var(--card)' }}><span className="eyebrow">{eyebrow}</span>{children}</section>;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', paddingTop: 8 }}>
        <Link href="/me" className="btn ghost sm" aria-label="Back to Me"><span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Icon name="chevron" /></span>Me</Link>
        <span className="muted" style={{ fontWeight: 800 }}>Wrapped {year}</span>
      </div>
      <div style={{ borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, var(--card) 0%, var(--stage) 70%)', border: '1px solid var(--line)' }}>
        <WhiskStage pose="cooked" outfit={outfitFrom(loadout)} height={260} interactive={false} label="Whisk celebrating" />
      </div>
      <h1 style={{ fontSize: 34, textAlign: 'center' }}>Your {year} in the kitchen</h1>

      {s === null ? <p className="muted">Counting your meals…</p> : s.meals === 0 ? (
        <div className="empty"><b>Nothing to wrap yet</b>Log your first meal with a photo and your Wrapped starts filling in.<div style={{ marginTop: 12 }}><Link className="btn" href="/cook">Find something to cook</Link></div></div>
      ) : (
        <>
          <Slide eyebrow="Meals cooked"><Big>{fmt(s.meals)}</Big><span style={{ fontWeight: 700 }}>across {fmt(s.days)} different days</span></Slide>
          <Slide eyebrow="Longest cooking run" bg="var(--gold-soft)"><Big>{s.run} day{s.run === 1 ? '' : 's'}</Big><span style={{ fontWeight: 700 }}>in a row</span></Slide>
          {s.cuisines[0] && <Slide eyebrow="Top cuisine"><Big>{s.cuisines[0][0]}</Big><span style={{ fontWeight: 700 }}>{s.cuisines[0][1]} meal{s.cuisines[0][1] === 1 ? '' : 's'} · {s.stamps}/{CUISINES.length} passport stamps</span></Slide>}
          {s.dishes[0] && <Slide eyebrow="Signature dish" bg="var(--pop-soft)"><Big>{s.dishes[0][0]}</Big><span style={{ fontWeight: 700 }}>cooked {s.dishes[0][1]} time{s.dishes[0][1] === 1 ? '' : 's'}</span></Slide>}
          {s.months[0] && <Slide eyebrow="Busiest month"><Big>{s.months[0][0]}</Big><span style={{ fontWeight: 700 }}>{s.months[0][1]} meal{s.months[0][1] === 1 ? '' : 's'}</span></Slide>}
          <Slide eyebrow="Saved vs takeout" bg="var(--fresh-soft)"><Big>~${fmt(Math.round(savedMoney))}</Big><span className="muted" style={{ fontWeight: 700 }}>Estimate: {fmt(s.meals)} meals × (${fmt(profile?.takeout_price ?? 15)} takeout − ${HOME_MEAL_COST} groceries)</span></Slide>
          <div className="grid2">
            <div className="card"><span className="eyebrow">Late night snacks</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(s.late)}</div></div>
            <div className="card"><span className="eyebrow">Recipes saved</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(saved)}</div></div>
            {s.protein > 0 && <div className="card"><span className="eyebrow">Protein cooked</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 26 }}>{fmt(s.protein)}g</div></div>}
            <div className="card"><span className="eyebrow">Level</span><div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20 }}>{lvl.level} · {lvl.title}</div></div>
          </div>
        </>
      )}
    </div>
  );
}
