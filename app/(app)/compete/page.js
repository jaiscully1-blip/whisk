'use client';
import { useEffect, useMemo, useState } from 'react';
import { useCached } from '@/lib/cache';
import { fetchCompete } from '@/components/tabData';
import DietTags from '@/components/DietTags';
import CookMode from '@/components/CookMode';
import { useWhisk } from '@/components/AppShell';
import LogMealSheet from '@/components/LogMealSheet';
import Icon, { Coin } from '@/components/Icon';
import { usePantry } from '@/components/usePantry';
import { checkRecipe } from '@/lib/recipes/match';
import { fmt } from '@/lib/game';
import { ServingsX, IngredientList, StepList } from '@/components/RecipeSteps';
import { cultureStyle } from '@/lib/culture';
import Scene from '@/components/Scene';
import { PartyCard, ChatsPeek } from '@/components/PartyHub';

const TIER = { 1: ['Small', 'var(--fresh-soft)', 'var(--fresh)'], 2: ['Medium', 'var(--warn-soft)', 'var(--warn)'], 3: ['Big', 'var(--pop-soft)', 'var(--bad)'] };
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);

// Pick up to 3 recipes the pantry can make: one per difficulty band when possible.
function proposeChallenges(recipes, pantry) {
  const pool = recipes.filter((r) => checkRecipe(r, pantry).ok).sort(() => Math.random() - 0.5);
  const used = new Set(); const pick = (lo, hi) => { const r = pool.find((x) => x.score >= lo && x.score < hi && !used.has(x.id)); if (r) used.add(r.id); return r; };
  return [pick(0, 35) || pick(0, 101), pick(35, 65) || pick(0, 101), pick(65, 101) || pick(0, 101)].filter(Boolean).map((r) => r.id);
}

export default function Compete() {
  const { supabase, refreshProfile, say, recipes, ui, setUi, dataVersion, t } = useWhisk();
  const [pantry] = usePantry();
  const [cdata, setCdata] = useCached('compete', () => fetchCompete(supabase), [dataVersion]);   // remembered between tabs
  const challenges = cdata?.challenges ?? null;
  const setChallenges = (v) => setCdata((x) => ({ ...(x || {}), challenges: typeof v === 'function' ? v(x?.challenges) : v }));
  const [logging, setLogging] = useState(null);
  const [factors, setFactors] = useState({});
  const [cookMode, setCookMode] = useState(null);   // { c, r } while a challenge is open in Cook mode   // servings × per challenge card
  // Boxes you've already seen cooked stay flipped; a newly cooked one flips over the first time you see it.
  const flipped = ui.flipped || {};

  const load = async () => { const d = await fetchCompete(supabase); if (d) setCdata(d); };
  // No challenges yet this week? Pick them from what your pantry can make.
  useEffect(() => {
    if (!challenges || challenges.length || !recipes || !pantry) return;
    const ids = proposeChallenges(recipes, pantry);
    if (!ids.length) return;
    supabase.rpc('set_weekly_challenges', { p_recipe_ids: ids }).then(({ error }) => { if (!error) supabase.rpc('get_weekly_challenges').then(({ data }) => setChallenges(data || [])); });
  }, [challenges, recipes, pantry, supabase]);

  const flip = (id) => setUi({ flipped: { ...flipped, [id]: !flipped[id] } });

  // One timer for everything on this page: challenges and the bingo card both reset on Monday (the player's own calendar).
  const resetIn = useMemo(() => { const n = new Date(); const d = (8 - n.getDay()) % 7 || 7; const mon = new Date(n.getFullYear(), n.getMonth(), n.getDate() + d); return `${Math.max(1, Math.ceil((mon - n) / 864e5))}d`; }, []);

  const recipeOf = (c) => recipes?.find((r) => r.id === c.recipe_id);

  return (
    <div className="stack">
      <div className="page-title"><h1>{t('Compete')}</h1><span className="muted pill-r">Resets in {resetIn}</span></div>
      <h2 data-tour="challenges" data-tip="challenges" style={{ fontSize: 22 }}>{t('This week’s challenges')}</h2>
      {challenges === null || !recipes ? <p className="muted">{t('Loading…')}</p> : challenges.length === 0 ? (
        <div className="empty"><b>{t('No challenges yet')}</b></div>
      ) : challenges.map((c) => {
        const r = recipeOf(c); if (!r) return null;
        const [tier, bg, ink] = TIER[c.slot] || TIER[3]; const on = !!flipped[c.id];
        const front = (
          <>
            <span className="row" style={{ justifyContent: 'space-between' }}>
              <span className="chip" style={{ background: bg, color: ink, fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '.06em' }}>{tier}</span>
              <span className="row" style={{ gap: 5, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 22 }}><Coin size={20} />{fmt(c.coins)}</span>
            </span>
            <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 20, display: 'block', margin: '8px 0' }}>{r.title}</span>
            <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>Difficulty {c.score}/100</span><span className="bar" style={{ flex: 1 }}><i style={{ width: `${c.score}%`, background: ink }} /></span></span>
            <span className="row" style={{ marginTop: 8 }}><span className="chip">{hrs(r.minutes)}</span><span className="chip">{r.cuisine}</span><span className="chip">{r.steps.length} steps</span><span className="chip">Serves {r.servings}</span></span>
            <span style={{ display: 'block', marginTop: 6 }}><DietTags recipe={r} max={3} /></span>
            {c.completed_at ? <span className="row" style={{ color: 'var(--fresh)', fontWeight: 800, marginTop: 10 }}><Icon name="check" />Done · coins added</span>
              : <span className="row muted" style={{ marginTop: 10, fontSize: 12, fontWeight: 800 }}><Icon name="flip" size={16} />Tap to flip for instructions</span>}
          </>
        );
        if (c.completed_at) return <div key={c.id} className="card">{front}</div>;
        const complete = () => { const fz = pantry ? checkRecipe(r, pantry).frozen : []; if (fz.length) { say(`Defrost ${fz.map((p) => p.name).join(', ')} first`); return; } setLogging({ c, r }); };
        return (
          <div key={c.id} data-tip="challenges" className={`flip tall ${on ? "on" : ""}`}>
            <div className="flip-in">
              <button className="card face" onClick={() => flip(c.id)} aria-label={`${r.title}: show instructions`} tabIndex={on ? -1 : 0} aria-hidden={on}>{front}</button>
              <div className="card face back stack cx" style={{ gap: 8, ...cultureStyle(r.country, r.cuisine) }} aria-hidden={!on} onClick={(e) => { if (e.target.closest('.flip-cta')) complete(); }}>
                {on && <Scene iso={r.country} cuisine={r.cuisine} title={r.title} ingredients={r.key} height={140} className="scene-bleed" />}
                <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                  <b style={{ fontFamily: 'var(--f-display)', fontSize: 18 }}>{r.title}</b>
                  <button className="btn ghost sm" style={{ width: 40, padding: 0 }} onClick={() => flip(c.id)} aria-label="Flip back" tabIndex={on ? 0 : -1}><Icon name="flip" size={18} /></button>
                </div>
                <ServingsX base={r.servings} factor={factors[c.id] || 1} onChange={(f) => setFactors((x) => ({ ...x, [c.id]: f }))} id={`sx-${c.id}`} />
                <IngredientList r={r} factor={factors[c.id] || 1} />
                <button type="button" className="btn sm cm-open" style={{ alignSelf: 'flex-start' }} tabIndex={on ? 0 : -1} onClick={() => setCookMode({ c, r, complete })}><Icon name="play" size={16} />Cook mode</button>
                <StepList r={r} factor={factors[c.id] || 1} compact />
                <span className="src">Full page with photos: <a href={r.url} target="_blank" rel="noopener noreferrer" tabIndex={on ? 0 : -1}>{r.source}</a></span>
                <button className="btn flip-cta" tabIndex={on ? 0 : -1}><Icon name="camera" size={18} />Cooked it? Add a photo &amp; complete</button>
              </div>
            </div>
          </div>
        );
      })}

      <PartyCard />
      <ChatsPeek />

      {cookMode && <CookMode r={cookMode.r} factor={factors[cookMode.c.id] || 1} canFinish onFinish={() => { const f = cookMode.complete; setCookMode(null); f(); }} onClose={() => setCookMode(null)} />}
      {logging && <LogMealSheet recipe={logging.r} challenge={logging.c} onClose={() => setLogging(null)} onDone={() => { setUi({ flipped: { ...flipped, [logging.c.id]: false } }); load(); }} />}
    </div>
  );
}
