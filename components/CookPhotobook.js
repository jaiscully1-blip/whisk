'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Postcard from './Postcard';
import Icon from './Icon';

// "My photobook": one little page per day in the player's own time zone, oldest on the left, today on the right (swipe either way).
// A cooked day shows the plate photo; today shows the pick on the table with a camera to log your own photo; other days stay quiet.
const DAYS = 45;
export const dayKey = (d, tz) => {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  catch { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
};
const part = (d, tz, opt) => { try { return new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, ...opt }).format(d); } catch { return new Intl.DateTimeFormat('en-US', opt).format(d); } };

export default function CookPhotobook({ tz, todayRecipe, onAdd, t = (x) => x }) {
  const { supabase } = useWhisk();
  const [meals, setMeals] = useState(null);
  const [urls, setUrls] = useState({});
  const [view, setView] = useState(null);
  const row = useRef(null);

  useEffect(() => {
    let off = false;
    supabase.from('meals').select('id, title, cooked_at, photo_path, recipe_id').gte('cooked_at', new Date(Date.now() - (DAYS + 1) * 864e5).toISOString()).order('cooked_at', { ascending: false }).limit(200)
      .then(({ data, error }) => { if (!off) setMeals(error ? [] : data || []); });
    return () => { off = true; };
  }, [supabase]);

  useEffect(() => {
    const need = (meals || []).map((m) => m.photo_path).filter((p) => p && !urls[p]);
    if (!need.length) return;
    let off = false;
    supabase.storage.from('meal-photos').createSignedUrls(need, 3600).then(({ data }) => {
      if (!off && data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl])) }));
    });
    return () => { off = true; };
  }, [meals]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => {
    const now = Date.now(), seen = new Set(), out = [];
    for (let i = DAYS - 1; i >= 0; i--) { const d = new Date(now - i * 864e5), k = dayKey(d, tz); if (seen.has(k)) continue; seen.add(k); out.push({ k, d, today: i === 0 }); }
    const by = new Map(); (meals || []).forEach((m) => { const k = dayKey(new Date(m.cooked_at), tz); if (!by.has(k)) by.set(k, []); by.get(k).push(m); });
    return out.map((x) => ({ ...x, meals: by.get(x.k) || [] }));
  }, [meals, tz]);

  // start at today (the right-hand end)
  const placed = useRef(false);
  useEffect(() => { const el = row.current; if (el && meals !== null && !placed.current) { el.scrollLeft = el.scrollWidth; placed.current = true; } }, [meals, days.length]);

  return (
    <section className="stack" style={{ gap: 6 }} aria-label={t('My photobook')} data-testid="photobook">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow">{t('My photobook')}</span>
        <Link href="/me/history" className="pb-all">{t('See all')} ›</Link>
      </div>
      <div className="pb-row" ref={row}>
        {days.map((x) => {
          const m = x.meals[0]; const url = m && urls[m.photo_path];
          const label = `${part(x.d, tz, { weekday: 'short' })} ${part(x.d, tz, { day: 'numeric' })}`;
          const open = m ? () => setView({ ...m, url, label }) : x.today && todayRecipe ? () => onAdd(todayRecipe) : undefined;
          return (
            <button key={x.k} type="button" className={`pb-tile ${m ? 'done' : ''} ${x.today ? 'today' : ''}`} data-testid={x.today ? 'pb-today' : 'pb-day'} data-day={x.k} onClick={open} disabled={!open} aria-label={m ? `${label}: ${m.title}` : x.today ? t('Add your photo') : label}>
              <span className="pb-img">
                {m ? (url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <span className="pb-ph"><Icon name="utensils" size={22} /></span>)
                  : x.today && todayRecipe ? <><Postcard iso={todayRecipe.country} cuisine={todayRecipe.cuisine} title={todayRecipe.title} ingredients={todayRecipe.key} /><span className="pb-cam"><Icon name="camera" size={16} /></span></>
                  : <span className="pb-empty" />}
                {x.meals.length > 1 && <span className="pb-n">{x.meals.length}</span>}
              </span>
              <span className="pb-date">{x.today ? t('Today') : label}</span>
            </button>
          );
        })}
      </div>
      {view && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setView(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={view.title}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <h2 style={{ fontSize: 22, margin: 0 }}>{view.title}</h2>
              <button type="button" className="btn ghost sm" onClick={() => setView(null)} aria-label={t('Close')}><Icon name="x" /></button>
            </div>
            {view.url && <img src={view.url} alt={view.title} style={{ width: '100%', borderRadius: 16, maxHeight: '60vh', objectFit: 'cover' }} />}
            <span className="desc">{view.label}</span>
          </div>
        </div>
      )}
    </section>
  );
}
