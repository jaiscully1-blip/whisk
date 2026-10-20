'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Postcard from './Postcard';
import Icon from './Icon';
import RecipeImport from './RecipeImport';
import { Viewer as MineViewer } from './MyRecipes';
import { useMine, usePantry } from './usePantry';
import PlateManage from './PlateManage';

// "My photobook": one little page per day in the player's own time zone, oldest on the left, today on the right (swipe either way).
// A cooked day shows the plate photo; today shows the pick on the table with a camera to log your own photo; other days stay quiet.
const DAYS = 45;
export const dayKey = (d, tz) => {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: tz || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  catch { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
};
const part = (d, tz, opt) => { try { return new Intl.DateTimeFormat('en-US', { timeZone: tz || undefined, ...opt }).format(d); } catch { return new Intl.DateTimeFormat('en-US', opt).format(d); } };

export default function CookPhotobook({ tz, todayRecipe, onAdd, t = (x) => x }) {
  const { supabase, ui, setUi, say } = useWhisk();
  const [meals, setMeals] = useState(null);
  const [urls, setUrls] = useState({});
  const [view, setView] = useState(null);
  const row = useRef(null);
  const [mine, reloadMine] = useMine();
  const [pantry, reloadPantry] = usePantry();
  const [writing, setWriting] = useState(null);   // 'new' | row to edit
  const [reading, setReading] = useState(null);   // a my_recipes row open in full
  const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  // a photo's recipe: the one you attached to it, else a recipe with the same name ('none' = you chose to unlink it)
  const links = ui?.pbLinks || {};
  const setLink = (mealId, rid) => setUi((cur) => ({ pbLinks: { ...(cur.pbLinks || {}), [mealId]: rid } }));
  const mineFor = (v) => { const l = links[v.id]; if (l === 'none') return null; return (mine || []).find((r) => r.id === l) || (mine || []).find((r) => norm(r.title) === norm(v.title)) || null; };
  const [pickOpen, setPickOpen] = useState(false);
  // which meal is a day's cover (day -> meal id); until you pick one, the first plate cooked that day
  const covers = ui?.pbCover || {};
  const setCover = (day, mealId) => setUi((cur) => ({ pbCover: { ...(cur.pbCover || {}), [day]: mealId } }));
  const coverOf = (x) => { const L = x.meals; return L.find((q) => q.id === covers[x.k]) || L[L.length - 1]; };

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
        <Link href="/me/history?from=cook" className="pb-all">{t('See all')} ›</Link>
      </div>
      <div className="pb-row" ref={row}>
        {days.map((x) => {
          const m = x.meals.length ? coverOf(x) : null; const url = m && urls[m.photo_path]; const more = x.meals.length - 1;
          const label = `${part(x.d, tz, { weekday: 'short' })} ${part(x.d, tz, { day: 'numeric' })}`;
          const open = m ? () => setView({ ...m, url, label, day: x.k, dayMeals: [...x.meals].reverse() }) : x.today && todayRecipe ? () => onAdd(todayRecipe) : undefined;
          return (
            <button key={x.k} type="button" className={`pb-tile ${m ? 'done' : ''} ${x.today ? 'today' : ''}`} data-testid={x.today ? 'pb-today' : 'pb-day'} data-day={x.k} onClick={open} disabled={!open} aria-label={m ? `${label}: ${m.title}` : x.today ? t('Add your photo') : label}>
              <span className={`pb-img ${more > 0 ? 'pb-stack' : ''}`}>
                {more > 0 && <><span className="pb-back b1" /><span className="pb-back b2" /></>}
                {m ? (url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <span className="pb-ph"><Icon name="utensils" size={22} /></span>)
                  : x.today && todayRecipe ? <><Postcard iso={todayRecipe.country} cuisine={todayRecipe.cuisine} title={todayRecipe.title} ingredients={todayRecipe.key} /><span className="pb-cam"><Icon name="camera" size={16} /></span></>
                  : <span className="pb-empty" />}
                {more > 0 && <span className="pb-plus" data-testid="pb-more">+{more}</span>}
              </span>
              <span className="pb-date">{x.today ? t('Today') : label}</span>
            </button>
          );
        })}
      </div>
      {view && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setView(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={view.title}>
            {(() => {
              const multi = view.dayMeals?.length > 1;
              const cov = multi ? coverOf({ k: view.day, meals: view.dayMeals.slice().reverse() }) : null;
              const idx = multi ? view.dayMeals.findIndex((q) => q.id === view.id) + 1 : 0;
              const tm = (() => { try { return new Date(view.cooked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return ''; } })();
              const head = (
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  {multi ? <span /> : <h2 style={{ fontSize: 22, margin: 0 }}>{view.title}</h2>}
                  <button type="button" className="btn ghost sm" onClick={() => setView(null)} aria-label={t('Close')}><Icon name="x" /></button>
                </div>
              );
              const photo = view.url && (
                <div style={{ position: 'relative' }}>
                  <img src={view.url} alt={view.title} style={{ width: '100%', borderRadius: 16, maxHeight: '38vh', objectFit: 'cover', display: 'block' }} />
                  {multi && <span className="pb-badge" data-testid="pb-badge">{idx} {t('of')} {view.dayMeals.length} · {view.label}</span>}
                </div>
              );
              return (
                <>
                  {head}
                  {photo}
                  {multi && (
                    <div className="stack" style={{ gap: 8 }} data-testid="pb-day-strip">
                      <div className="pb-strip">
                        {view.dayMeals.map((q) => { const u = urls[q.photo_path]; const isCover = cov?.id === q.id;
                          return (
                            <button key={q.id} type="button" className={`pb-th ${q.id === view.id ? 'sel' : ''} ${isCover ? 'cov' : ''}`} data-testid="pb-th" aria-label={q.title} onClick={() => setView({ ...view, ...q, url: u })}>
                              {u ? <img src={u} alt="" /> : <Icon name="utensils" size={18} />}
                              {isCover && <span className="pb-star on"><Icon name="star" size={12} /></span>}
                            </button>
                          ); })}
                      </div>
                      {cov?.id !== view.id
                        ? <button type="button" className="btn wide" data-testid="pb-make-cover" onClick={() => { setCover(view.day, view.id); say('Cover updated'); }}><Icon name="star" size={16} />{t('Make this the cover')}</button>
                        : <span className="desc" data-testid="pb-is-cover">{t('This is the cover for this day')}</span>}
                    </div>
                  )}
                  {multi && <h2 style={{ fontSize: 20, margin: 0 }}>{view.title}</h2>}
                  <span className="desc">{multi ? tm : view.label}</span>
                </>
              );
            })()}
            {(() => { const mr = mineFor(view); return mr ? (
              <div className="stack" style={{ gap: 8 }} data-testid="pb-recipe">
                <div className="card stack" style={{ gap: 4 }}>
                  <span className="eyebrow">{t('My recipe')}</span>
                  <span style={{ fontWeight: 700 }}>{(mr.ingredients || []).slice(0, 5).map((g) => (typeof g === 'string' ? g : g.item)).join(' · ')}{(mr.ingredients || []).length > 5 ? ` · +${mr.ingredients.length - 5}` : ''}</span>
                  <span className="desc">{(mr.steps || []).length} {(mr.steps || []).length === 1 ? t('step') : t('steps')}</span>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                  <button type="button" className="btn ghost" style={{ flex: 1 }} data-testid="pb-edit" onClick={() => setWriting(mr)}><Icon name="pencil" size={16} />{t('Edit')}</button>
                  <button type="button" className="btn" style={{ flex: 1 }} data-testid="pb-open-recipe" onClick={() => setReading(mr)}><Icon name="cook" size={16} />{t('Open recipe')}</button>
                </div>
                <button type="button" className="fr-more" data-testid="pb-unlink" onClick={() => { setLink(view.id, 'none'); setPickOpen(false); }}>{t('Not this recipe? Change it')}</button>
              </div>
            ) : (
              <div className="stack" style={{ gap: 8 }} data-testid="pb-no-recipe">
                <div className="empty" style={{ padding: 14 }}>{t('No recipe saved for this one yet')}</div>
                {ui?.pbDrafts?.[view.id] && <>
                  <p className="err" style={{ margin: 0 }} data-testid="pb-draft-note">{t('Your recipe didn’t save last time. It’s kept here.')}</p>
                  <button type="button" className="btn wide" data-testid="pb-draft" onClick={() => setWriting({ prefill: view.title, draft: ui.pbDrafts[view.id], forMeal: view.id })}><Icon name="check" size={18} />{t('Save my recipe')}</button>
                </>}
                <button type="button" className="btn wide" data-testid="pb-write" onClick={() => setWriting({ prefill: view.title, typed: true, forMeal: view.id })}><Icon name="pencil" size={18} />{t('Write my recipe')}</button>
                <button type="button" className="btn ghost wide" data-testid="pb-snap" onClick={() => setWriting({ prefill: view.title, forMeal: view.id })}><Icon name="camera" size={18} />{t('Snap a recipe card or page')}</button>
                {(mine || []).length > 0 && <button type="button" className="btn ghost wide" data-testid="pb-pick" onClick={() => setPickOpen((v) => !v)}><Icon name="star" size={18} />{t('Use one of my recipes')}</button>}
                {pickOpen && <div className="stack" style={{ gap: 6 }} data-testid="pb-pick-list">{(mine || []).map((r) => <button key={r.id} type="button" className="card" style={{ textAlign: 'left', background: 'var(--field)', color: 'var(--fg)', fontWeight: 800 }} onClick={() => { setLink(view.id, r.id); setPickOpen(false); }}>{r.title}</button>)}</div>}
              </div>
            ); })()}
            <PlateManage key={view.id} mealId={view.id} photoPath={view.photo_path} onDeleted={(id) => { setMeals((ms) => (ms || []).filter((x) => x.id !== id)); setView(null); }} />
          </div>
        </div>
      )}
      {writing && <RecipeImport edit={writing.id ? writing : null} prefill={writing.prefill || ''} typed={!!writing.typed} draft={writing.draft || null} onClose={() => setWriting(null)} onSaved={(id) => { if (writing.forMeal && id) { setLink(writing.forMeal, id); if (writing.draft) setUi((cur) => { const d = { ...(cur.pbDrafts || {}) }; delete d[writing.forMeal]; return { pbDrafts: d }; }); } setWriting(null); reloadMine(); }} />}
      {reading && <MineViewer row={reading} pantry={pantry} onClose={() => setReading(null)} onEdit={() => { setWriting(reading); setReading(null); }} onDeleted={() => { setReading(null); reloadMine(); }} />}
    </section>
  );
}
