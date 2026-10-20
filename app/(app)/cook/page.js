'use client';
import { mealArt } from '@/lib/art/meals';
import { useEffect, useMemo, useRef, useState } from 'react';
import DietTags from '@/components/DietTags';
import { DIET_ORDER, DIET_CLASS, fitsDiet } from '@/lib/recipes/diet';
import { useWhisk, useDraft } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon from '@/components/Icon';
import { usePantry, useSaved, useMine } from '@/components/usePantry';
import { useRouter } from 'next/navigation';
import Postcard from '@/components/Postcard';
import CookPhotobook from '@/components/CookPhotobook';
import LogMealSheet from '@/components/LogMealSheet';
import { useTimeZone } from '@/components/useTimeZone';

const PAGE = 12;
import { canon, checkRecipe, usesSoon } from '@/lib/recipes/match';
import WeekGoal from '@/components/WeekGoal';
import { TimeSlider, RescueFridge } from '@/components/DishFilters';
import { MEALS, fitsMeal } from '@/lib/recipes/meal';
import DishSearch from '@/components/DishSearch';
import SavedRecipes from '@/components/SavedRecipes';
import RecipeImport from '@/components/RecipeImport';
import { Viewer as MineViewer } from '@/components/MyRecipes';

const SKIP = ['Spices & Seasonings', 'Sauces & Oils', 'Baking'];
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);

// Only real recipes from the web, and only ones your pantry can make.
export default function Cook() {
  const { recipes, ui, setUi, say, t , ensureRecipes } = useWhisk();
  const tz = useTimeZone();
  const [logFor, setLogFor] = useState(null);
  // Every visit opens on the Cook home (tonight's pick, made for you, photobook) for new and returning players. "More filters" goes deeper; a dish sent from the globe still opens its results.
  useEffect(() => { const cur = ui; if (cur.cookMode !== 'named' && (cur.cookMode || cur.cookFilters || cur.cookDish)) setUi({ cookMode: null, cookFilters: false, cookDish: '' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toTop = () => { window.scrollTo(0, 0); requestAnimationFrame(() => window.scrollTo(0, 0)); };   // buttons that change the view take you back to the top of Cook
  const [hour, setHour] = useState(() => Math.floor(Date.now() / 36e5));
  useEffect(() => { const id = setInterval(() => setHour(Math.floor(Date.now() / 36e5)), 30000); return () => clearInterval(id); }, []);   // a new dish every hour
  const router = useRouter();
  const [pantry, reload] = usePantry();
  const [saved, reloadSaved] = useSaved();
  const [shown, setShown] = useState(PAGE);
  const [mine, reloadMine] = useMine();   // your own recipes live in the Saved list now (and open from your photobook)
  const [mineOpen, setMineOpen] = useState(null);
  const [mineEdit, setMineEdit] = useState(null);
  const [mineNew, setMineNew] = useState(false);
  const moreRef = useRef(null);
  const [dish, setDish] = useDraft('o-dish');
  const [hand, setHand] = useState(null);
  const [open, setOpen] = useState(null);
  // the world's desserts (Yoke Kitchen) join the web recipes in Made for you
  const [worldSweets, setWorldSweets] = useState([]);
  useEffect(() => { let off = false; fetch('/api/world-recipe?type=dessert').then((r) => r.json()).then((j) => { if (!off) setWorldSweets(j.recipes || []); }).catch(() => {}); return () => { off = true; }; }, []);
  const openFull = async (r) => { if (r.steps || !/^w-/.test(r.id)) { setOpen(r); return; } const full = (await ensureRecipes([r.id]))[0]; if (full) setOpen(full); };
  const [asked, setAsked] = useState(false);   // "Nothing fits yet" only shows right after you ask, never on its own
  const savedMode = ui.cookMode || null; const time = ui.cookTime || ''; const meal = ui.cookMeal || ''; const diet = ui.cookDiet || '';

  const mode = savedMode === 'raid' && !hand ? 'pantry' : savedMode;
  const inStock = useMemo(() => (pantry || []).filter((p) => p.status !== 'out'), [pantry]);
  // No minimum: everything you can make (with swaps if needed) first, then recipes you're only 1–2 things away from.
  const checked = useMemo(() => (recipes && pantry ? recipes.map((r) => ({ r, c: checkRecipe(r, pantry) })) : []), [recipes, pantry]);
  const makeable = useMemo(() => [...checked.filter((x) => x.c.ok).sort((a, b) => a.c.subs.length - b.c.subs.length), ...checked.filter((x) => !x.c.ok && x.c.missing.length <= 2).sort((a, b) => a.c.missing.length - b.c.missing.length || a.r.key.length - b.r.key.length)], [checked]);

  const results = useMemo(() => {
    if (!mode) return null;
    let list = makeable.filter(({ r }) => (!+time || r.minutes <= +time) && fitsMeal(r, meal) && fitsDiet(r, diet));
    if (mode === 'raid' && hand) { const hc = new Set(hand.map(canon)); list = list.map((x) => ({ ...x, hits: x.r.key.filter((k) => hc.has(canon(k))).length })).filter((x) => x.hits > 0).sort((a, b) => (a.c.ok === b.c.ok ? 0 : a.c.ok ? -1 : 1) || b.hits - a.hits); }
    if (mode === 'named') { const words = (ui.cookDish || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2); list = list.filter(({ r }) => words.some((w) => `${r.title} ${r.cuisine}`.toLowerCase().includes(w.replace(/s$/, '')))); }
    // food about to go bad first (Fridge Raid keeps its own order: most of your dealt cards first)
    if (mode !== 'raid') { list = list.map((x) => ({ ...x, soon: usesSoon(x.r, pantry || []) })); list = [...list.filter((x) => x.c.ok && x.soon.length), ...list.filter((x) => x.c.ok && !x.soon.length), ...list.filter((x) => !x.c.ok)]; }
    return list;
  }, [mode, makeable, pantry, time, meal, diet, hand, ui.cookDish]);

  // First visit: one question and three picks for today (same for everyone). The filters and tabs appear after "More filters" or the first search.
  const simple = !mode && !asked && !ui.cookFilters;
  const [shuffle, setShuffle] = useState(0);
  const pool = useMemo(() => {
    if (!recipes?.length) return [];
    const ok = makeable.filter((x) => x.c.ok).map((x) => x.r);
    return (ok.length >= 3 ? ok : recipes.filter((r) => r.minutes <= 35)).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [recipes, makeable]);
  // a new pick every hour (the same for everyone that hour); the shuffle button walks on from there
  const picks = useMemo(() => (pool.length ? [pool[(hour * 7 + shuffle) % pool.length]] : []), [pool, hour, shuffle]);
  // Made for you: a protein-packed dinner, an easy soul-food comfort dish and a dessert; each rotates hourly too
  const forYou = useMemo(() => {
    if (!recipes?.length) return [];
    const stable = (list) => list.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const pick = (list, off) => (list.length ? list[(hour * 5 + off) % list.length] : null);
    const SOUL = /\b(mac|cheese|stew|soup|casserole|pot pie|gravy|mashed|fried chicken|biscuit|cornbread|meatloaf|chili|dumpling|collard|grits|cobbler|smothered|pot roast|jambalaya|gumbo)\b/i;
    const dinners = stable(recipes.filter((r) => fitsMeal(r, 'dinner') && fitsDiet(r, 'High protein')));
    const soul = stable(recipes.filter((r) => (SOUL.test(r.title) || /soul|southern|cajun|creole/i.test(r.cuisine || '')) && r.minutes <= 45 && !fitsMeal(r, 'dessert')));
    const sweetsAll = [...recipes.filter((r) => fitsMeal(r, 'dessert')), ...worldSweets]; const sweets = stable(sweetsAll.filter((r) => r.minutes <= 60).length >= 3 ? sweetsAll.filter((r) => r.minutes <= 60) : sweetsAll);
    const first = pick(sweets, 2); const rest = sweets.filter((r) => r.id !== first?.id);
    return [['Protein-packed dinner', pick(dinners, 0)], ['Easy soul food', pick(soul, 1)], ['Dessert', first], ['Sweet tooth', pick(rest, 3)]].filter(([, r]) => r);
  }, [recipes, hour, worldSweets]);
  function useWhatIHave() { if (!inStock.length) { router.push('/pantry'); return; } setHand(null); setAsked(true); setUi({ cookMode: 'pantry', cookDish: '' }); toTop(); }

  const names = inStock.filter((p) => !SKIP.includes(p.category)).map((p) => p.name);
  // Keep loading more as you scroll, until every recipe your pantry can make is on screen.
  useEffect(() => { setShown(PAGE); }, [mode, time, meal, diet, hand, ui.cookDish]);
  useEffect(() => {
    const el = moreRef.current; if (!el || !results || shown >= results.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown((n) => n + PAGE); }, { rootMargin: '400px' });
    io.observe(el); return () => io.disconnect();
  }, [results, shown]);

  function raid() {
    // Fridge Raid: only food that goes off in the next 1–2 days (today counts), soonest first.
    const day = (p) => (p.expires_on ? Math.round((new Date(String(p.expires_on).slice(0, 10) + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5) : null);
    const h = inStock.filter((p) => !SKIP.includes(p.category) && day(p) != null && day(p) >= 0 && day(p) <= 2).sort((a, b) => day(a) - day(b)).map((p) => p.name).slice(0, 4);
    if (!h.length) { say('Nothing in your pantry goes off in the next 2 days.'); return; }
    setHand(h); setAsked(true); setUi({ cookMode: 'raid' });
  }

  return (
    <div className="stack">
      <div className="page-title"><WeekGoal title={t('Cook')} /></div>
      <section className="cook-search" aria-label="Find something to cook">
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); setHand(null); setAsked(true); if (!dish.trim()) { setUi({ cookMode: 'pantry', cookDish: '' }); return; } setUi({ cookMode: 'named', cookDish: dish.trim().slice(0, 80) }); }}>
          <label htmlFor="o-dish" hidden>{t('Dish')}</label>
          <input id="o-dish" data-tip="search" className="input" type="search" enterKeyHint="search" autoComplete="off" aria-label={t('Search your kitchen')} maxLength={80} value={dish} onChange={(e) => setDish(e.target.value)} />
          <button data-tip="make" className="btn cs-go" type="submit" aria-label={t('Search dishes')}><Icon name="search" size={18} />{t('Search')}</button>
        </form>
        {!simple && <div className="cs-pills">
          <button type="button" data-tip="fridge" className={`cs-pill ${mode === 'raid' ? 'on' : ''}`} data-testid="raid-btn" onClick={raid}><RescueFridge />{t('Fridge Raid')}</button>
        </div>}
      </section>

      {simple && (
        <>
          {picks.length > 0 && (() => { const hero = picks[0]; return (
            <div className="fr-hero" data-testid="todays-picks">
              <div className="fr-art">
                <Postcard iso={hero.country} cuisine={hero.cuisine} title={hero.title} ingredients={hero.key} />
                <span className="fr-tag">{t('TONIGHT’S PICK')}</span>
                <button type="button" className="fr-shuf" data-testid="shuffle-pick" aria-label={t('Show me another')} onClick={() => setShuffle((n) => n + 1)}><Icon name="shuffle" size={18} /></button>
              </div>
              <div className="fr-in">
                <h2>{hero.title}</h2>
                <span className="desc">{[hero.cuisine, hrs(hero.minutes)].filter(Boolean).join(' · ')}</span>
                <button type="button" className="btn wide" data-testid="cook-pick" onClick={() => setOpen(hero)}>{t('Let’s cook it')}</button>
              </div>
            </div>); })()}
          {forYou.length > 0 && (
            <section className="stack" style={{ gap: 6 }} aria-label={t('Made for you')} data-testid="made-for-you">
              <span className="eyebrow">{t('Made for you')}</span>
              <div className="fy-row">{forYou.map(([label, r], i) => (
                <button key={label} type="button" className={`fy-card fy-${i}`} data-testid="fy-card" onClick={() => openFull(r)}>
                  <span className="fy-art"><Postcard iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} /><span className="fy-tag">{t(['Protein', 'Comfort', 'Sweet', 'Treat'][i] || label)}</span></span>
                  <b>{r.title}</b><small>{hrs(r.minutes)}</small>
                </button>))}</div>
            </section>
          )}
          <CookPhotobook tz={tz} todayRecipe={picks[0] || null} onAdd={setLogFor} t={t} />
          <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'nowrap' }}>
            <button type="button" className="uw-chip" data-testid="use-what-i-have" onClick={useWhatIHave}><span aria-hidden>🧺</span>{t('Use what I have')}</button>
            <button type="button" className="uw-chip" data-testid="saved-chip" onClick={() => { setUi({ cookFilters: true }); toTop(); }}><span aria-hidden>♡</span>{t('Saved')}{saved?.size ? ` ${saved.size}` : ''}</button>
          </div>
        </>
      )}

      {!simple && <button type="button" className="fr-more" data-testid="back-to-picks" style={{ alignSelf: 'flex-start' }} onClick={() => { setAsked(false); setHand(null); setUi({ cookFilters: false, cookMode: null, cookDish: '' }); toTop(); }}>‹ {t('Back to tonight’s picks')}</button>}
      {!simple && <div className="card cook-filters">
        <TimeSlider time={time || 'any'} onTime={(v) => setUi({ cookTime: v === 'any' ? '' : v })} />
        <div className="diet-pick" role="radiogroup" aria-label={t('Diet')}>
          {['', ...DIET_ORDER].map((d) => (
            <button key={d || 'any'} type="button" role="radio" aria-checked={diet === d} className={`chip diet ${d ? DIET_CLASS[d] : 'any'} ${diet === d ? 'on' : ''}`} onClick={() => setUi({ cookDiet: d })}>{d || t('Any diet')}</button>
          ))}
        </div>
        <div className="meal-pick" role="radiogroup" aria-label={t('Meal')}>
          {[{ id: '', label: t('Any meal'), icon: 'utensils' }, ...MEALS].map((m) => (
            <button key={m.id || 'any'} type="button" role="radio" aria-checked={meal === m.id} className={`meal-tile ${meal === m.id ? 'on' : ''}`} data-testid={`meal-${m.id || 'any'}`} onClick={() => setUi({ cookMeal: m.id })}><svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true" dangerouslySetInnerHTML={{ __html: mealArt(m.id) }} />{m.label}</button>
          ))}
        </div>
      </div>}

      {!simple && (
        <section className="card stack saved-box" aria-labelledby="saved-h" data-testid="saved-box">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <h2 id="saved-h" style={{ fontSize: 20, margin: 0 }}><Icon name="star" size={18} /> {t('Saved recipes')}</h2>
            <button type="button" className="btn ghost sm" data-testid="new-recipe" data-tip="import" onClick={() => setMineNew(true)}><Icon name="plus" size={16} />{t('New recipe')}</button>
          </div>
          {(mine || []).map((m) => (
            <button key={m.id} type="button" className="card stack" data-testid="mine-item" onClick={() => setMineOpen(m)} style={{ textAlign: 'left', gap: 2, background: 'var(--field)', color: 'var(--fg)', width: '100%' }}>
              <span className="eyebrow"><Icon name="pencil" size={12} /> {t('Yours')}</span>
              <b>{m.title}</b><span className="desc">{m.minutes ? `${m.minutes} min · ` : ''}{(m.ingredients || []).length} {(m.ingredients || []).length === 1 ? t('ingredient') : t('ingredients')}</span>
            </button>
          ))}
          <SavedRecipes pantry={pantry} onChanged={reload} limit={4} />
          {saved && saved.size === 0 && !(mine || []).length && <span className="desc">{t('Recipes you save show up here.')}</span>}
        </section>
      )}
      {mineNew && <RecipeImport onClose={() => setMineNew(false)} onSaved={() => { setMineNew(false); reloadMine(); }} />}
      {mineEdit && <RecipeImport edit={mineEdit} onClose={() => setMineEdit(null)} onSaved={() => { setMineEdit(null); setMineOpen(null); reloadMine(); }} />}
      {mineOpen && !mineEdit && <MineViewer row={mineOpen} pantry={pantry} onClose={() => setMineOpen(null)} onEdit={() => setMineEdit(mineOpen)} onDeleted={() => { setMineOpen(null); reloadMine(); }} />}

      <div className="stack">
      {hand && mode === 'raid' && (
        <div className="stack" style={{ gap: 8 }}><span className="eyebrow">{t('Ingredients')}</span>
          <div className="grid2">{hand.map((c, i) => <div key={c} className="card" style={{ textAlign: 'center', fontWeight: 800, background: 'var(--pop-soft)', transform: `rotate(${[-3, 2, -1, 3][i % 4]}deg)` }}>{c}</div>)}</div>
        </div>
      )}
      {mode === 'named' && ui.cookDish && results?.length === 0 ? null : results && (results.length ? (
        <>
          <span className="eyebrow">{mode === 'named' ? `From your Yoke recipes · ${results.length}` : (() => { const n = results.filter((x) => x.c.ok).length; return n ? `${n} recipe${n === 1 ? '' : 's'} you can make right now` : 'Closest to what you have'; })()}</span>
          {results.slice(0, shown).map(({ r, c, soon }) => (
            <button key={r.id} className="card stack" style={{ gap: 8, textAlign: 'left' }} onClick={() => setOpen(r)}>
              <span className="eyebrow">{r.cuisine} · {r.source}</span>
              <h2 style={{ fontSize: 20 }}>{r.title}</h2>
              <div className="row"><span className="chip">{hrs(r.minutes)}</span><span className="chip">Serves {r.servings}</span>{c.ok ? <span className="chip have">{c.subs.length ? 'You can make it' : 'You have everything'}</span> : <span className="chip need">Need {c.missing.slice(0, 2).join(' + ').toLowerCase()}</span>}{c.frozen.length > 0 && <span className="chip ice"><Icon name="snow" size={14} />{t('Defrost first')}</span>}</div>
              {c.subs.length > 0 && <span className="desc swap-line">Swap: {c.subs.map((x) => `${x.use.toLowerCase()} for ${x.need.toLowerCase()}`).join(', ')}</span>}
              {soon?.length > 0 && <span className="chip soon"><Icon name="timer" size={14} />Uses your {soon.map((p) => p.name.toLowerCase()).slice(0, 2).join(' and ')} before it goes bad</span>}
              <DietTags recipe={r} max={3} />
            </button>
          ))}
          {shown < results.length ? <div ref={moreRef}><button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>{t('Show more')}</button></div>
            : <span className="desc" style={{ textAlign: 'center' }}>{t('That’s everything that fits your pantry right now.')}</span>}
        </>
      ) : asked && <div className="empty"><b>{t('Nothing fits yet')}</b>{mode === 'named' ? 'None of Yoke’s recipes match that dish and your pantry.' : 'Add a few more staples to your pantry and check back.'}</div>)}

      {mode === 'named' && ui.cookDish && <DishSearch q={ui.cookDish} pantry={pantry} />}
      </div>

      {logFor && <LogMealSheet recipe={logFor} onClose={() => setLogFor(null)} onDone={() => { reload(); reloadSaved(); }} />}
      {open && <RecipeSheet recipe={open} pantry={pantry || []} saved={saved?.get(open.id)} onClose={() => setOpen(null)} onChanged={() => { reload(); reloadSaved(); }} />}
    </div>
  );
}
