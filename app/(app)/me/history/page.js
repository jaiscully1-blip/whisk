'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';
import RecipeSheet from '@/components/RecipeSheet';
import { usePantry } from '@/components/usePantry';
import { fmt } from '@/lib/game';

// Cooking history: every plate you have logged, newest first, grouped by month, with a few numbers on top.
// Reads your own rows from the meals table (the database only ever returns yours).
const PAGE = 24;
const monthKey = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export default function History() {
  const { supabase, allRecipes, ensureRecipes, t } = useWhisk();
  const [pantry] = usePantry();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [liked, setLiked] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [urls, setUrls] = useState({});
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    let off = false;
    (async () => {
      const { data, error } = await supabase.from('meals').select('id, title, cuisine, cooked_at, recipe_id, rating, photo_path').order('cooked_at', { ascending: false }).limit(1000);
      if (!off) setRows(error ? [] : data || []);
    })();
    return () => { off = true; };
  }, [supabase]);

  useEffect(() => { if (rows?.length) ensureRecipes(rows.map((r) => r.recipe_id).filter(Boolean)); }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const byId = useMemo(() => new Map((allRecipes || []).map((r) => [r.id, r])), [allRecipes]);
  const cuisines = useMemo(() => {
    const c = new Map(); (rows || []).forEach((r) => { if (r.cuisine) c.set(r.cuisine, (c.get(r.cuisine) || 0) + 1); });
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);
  const stats = useMemo(() => {
    const all = rows || []; const now = new Date();
    const month = all.filter((r) => { const d = new Date(r.cooked_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    const days = new Set(all.map((r) => new Date(r.cooked_at).toDateString())).size;
    const t = new Map(); all.forEach((r) => { const k = r.recipe_id || r.title; const e = t.get(k) || { n: 0, title: r.title, recipe_id: r.recipe_id }; e.n += 1; t.set(k, e); });
    const goTo = [...t.values()].filter((x) => x.n > 1).sort((a, b) => b.n - a.n).slice(0, 3);
    return { total: all.length, month, days, fav: cuisines[0]?.[0] || null, goTo };
  }, [rows, cuisines]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows || []).filter((r) => (!s || r.title.toLowerCase().includes(s)) && (!cuisine || r.cuisine === cuisine) && (!liked || r.rating === 'up'));
  }, [rows, q, cuisine, liked]);
  const visible = list.slice(0, shown);

  // photos for what is on screen (signed links last an hour)
  useEffect(() => {
    const need = visible.map((r) => r.photo_path).filter((p) => p && !urls[p]);
    if (!need.length) return;
    let off = false;
    supabase.storage.from('meal-photos').createSignedUrls(need, 3600).then(({ data }) => {
      if (!off && data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl])) }));
    });
    return () => { off = true; };
  }, [visible.length, q, cuisine, liked, rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = []; visible.forEach((r) => { const k = monthKey(r.cooked_at); const g = groups[groups.length - 1]; if (g && g.k === k) g.items.push(r); else groups.push({ k, items: [r] }); });
  const open = (r) => { const rec = r.recipe_id && byId.get(r.recipe_id); if (rec) setRecipe(rec); };

  return (
    <div className="stack" data-testid="history-page">
      <div className="page-title"><h1>{t('Cooking history')}</h1><Link className="btn ghost sm" href="/me"><Icon name="back" size={16} />{t('Me')}</Link></div>
      {rows === null ? <p className="muted">{t('Loading…')}</p> : rows.length === 0 ? (
        <div className="empty"><b>{t('Nothing cooked yet')}</b>{t('Log a plate after you cook and it shows up here.')}</div>
      ) : (
        <>
          <div className="hist-stats" data-testid="history-stats">
            <div><b>{fmt(stats.total)}</b><span>{stats.total === 1 ? 'meal cooked' : 'meals cooked'}</span></div>
            <div><b>{fmt(stats.month)}</b><span>this month</span></div>
            <div><b>{fmt(stats.days)}</b><span>{stats.days === 1 ? 'day you cooked' : 'days you cooked'}</span></div>
            <div><b>{stats.fav || '—'}</b><span>favourite cuisine</span></div>
          </div>
          {stats.goTo.length > 0 && (
            <section className="card stack" style={{ gap: 6 }} data-testid="history-goto">
              <span className="eyebrow">{t('Your go-tos')}</span>
              {stats.goTo.map((g) => <div key={g.recipe_id || g.title} className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><b>{g.title}</b><span className="muted">{g.n} times</span></div>)}
            </section>
          )}
          <div className="stack" style={{ gap: 8 }}>
            <label className="field" style={{ width: '100%', display: 'block' }}><input id="hist-q" style={{ width: '100%' }} type="search" aria-label="Search your history" placeholder={t('Search what you cooked')} value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} /></label>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className={`chip ${liked ? 'on' : ''}`} aria-pressed={liked} onClick={() => { setLiked((v) => !v); setShown(PAGE); }} data-testid="hist-liked">{t('Liked')}</button>
              {cuisines.map(([c, n]) => <button key={c} type="button" className={`chip ${cuisine === c ? 'on' : ''}`} aria-pressed={cuisine === c} onClick={() => { setCuisine((x) => (x === c ? '' : c)); setShown(PAGE); }}>{c} · {n}</button>)}
            </div>
          </div>
          {list.length === 0 ? <p className="muted">{t('Nothing matches that.')}</p> : groups.map((g) => (
            <section key={g.k} className="stack" style={{ gap: 8 }}>
              <h2 style={{ fontSize: 18, margin: '8px 0 0' }}>{g.k}</h2>
              {g.items.map((r) => {
                const rec = r.recipe_id && byId.get(r.recipe_id);
                return (
                  <article key={r.id} className="hist-row" data-testid="history-row">
                    {urls[r.photo_path] ? <img src={urls[r.photo_path]} alt="" loading="lazy" decoding="async" /> : <span className="hist-ph" aria-hidden="true" />}
                    <div className="hist-main">
                      <b>{r.title}</b>
                      <small className="muted">{new Date(r.cooked_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}{r.cuisine ? ` · ${r.cuisine}` : ''}{r.rating === 'up' ? ' · Liked' : r.rating === 'down' ? ' · Not for me' : ''}</small>
                    </div>
                    {rec && <button type="button" className="btn ghost sm" onClick={() => open(r)} data-testid="hist-again">{t('Cook again')}</button>}
                  </article>
                );
              })}
            </section>
          ))}
          {list.length > shown && <button type="button" className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)} data-testid="hist-more">Show more ({list.length - shown} left)</button>}
        </>
      )}
      {recipe && <RecipeSheet recipe={recipe} pantry={pantry || []} onClose={() => setRecipe(null)} />}
    </div>
  );
}
