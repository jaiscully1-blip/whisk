'use client';
import { useEffect, useMemo, useState } from 'react';
import DietTags from '@/components/DietTags';
import CookMode from '@/components/CookMode';
import { sceneSvg } from '@/lib/scenes';
import { useWhisk } from '@/components/AppShell';
import LogMealSheet from '@/components/LogMealSheet';
import Icon, { Coin } from '@/components/Icon';
import { usePantry } from '@/components/usePantry';
import { checkRecipe } from '@/lib/recipes/match';
import { fmt } from '@/lib/game';
import { ServingsX, IngredientList, StepList } from '@/components/RecipeSteps';
import { cultureStyle } from '@/lib/culture';
import Scene from '@/components/Scene';
import CookOffCard from '@/components/CookOffCard';

const TIER = { 1: ['Small', 'var(--fresh-soft)', 'var(--fresh)'], 2: ['Medium', 'var(--warn-soft)', 'var(--warn)'], 3: ['Big', 'var(--pop-soft)', 'var(--bad)'] };
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);

// Pick up to 3 recipes the pantry can make: one per difficulty band when possible.
function proposeChallenges(recipes, pantry) {
  const pool = recipes.filter((r) => checkRecipe(r, pantry).ok).sort(() => Math.random() - 0.5);
  const used = new Set(); const pick = (lo, hi) => { const r = pool.find((x) => x.score >= lo && x.score < hi && !used.has(x.id)); if (r) used.add(r.id); return r; };
  return [pick(0, 35) || pick(0, 101), pick(35, 65) || pick(0, 101), pick(65, 101) || pick(0, 101)].filter(Boolean).map((r) => r.id);
}

export default function Compete() {
  const { supabase, refreshProfile, say, recipes, ui, setUi } = useWhisk();
  const [pantry] = usePantry();
  const [challenges, setChallenges] = useState(null);
  const [quest, setQuest] = useState(null);
  const [logging, setLogging] = useState(null);
  const [factors, setFactors] = useState({});
  const [cookMode, setCookMode] = useState(null);   // { c, r } while a challenge is open in Cook mode   // servings × per challenge card
  const [bingo, setBingo] = useState(null);
  // Boxes you've already seen cooked stay flipped; a newly cooked one flips over the first time you see it.
  const bingoSeen = useMemo(() => { try { return new Set(JSON.parse(localStorage.getItem(`whisk-bingo:${bingo?.cells?.join('|')}`) || '[]')); } catch { return new Set(); } }, [bingo?.cells]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!bingo?.cells) return;
    const hits = bingo.cells.filter((c, i) => bingo.marks?.[i]);
    try { localStorage.setItem(`whisk-bingo:${bingo.cells.join('|')}`, JSON.stringify(hits)); } catch {}
  }, [bingo]);
  const flipped = ui.flipped || {};

  async function load() {
    const [c, b, q] = await Promise.all([supabase.rpc('get_weekly_challenges'), supabase.rpc('get_bingo'), supabase.rpc('get_daily_quest')]);
    setChallenges(c.data || []);
    if (!b.error) setBingo(b.data); if (!q.error) setQuest(q.data);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // No challenges yet this week? Pick them from what your pantry can make.
  useEffect(() => {
    if (!challenges || challenges.length || !recipes || !pantry) return;
    const ids = proposeChallenges(recipes, pantry);
    if (!ids.length) return;
    supabase.rpc('set_weekly_challenges', { p_recipe_ids: ids }).then(({ error }) => { if (!error) supabase.rpc('get_weekly_challenges').then(({ data }) => setChallenges(data || [])); });
  }, [challenges, recipes, pantry, supabase]);

  async function claimBingo() {
    const { data, error } = await supabase.rpc('claim_bingo');
    if (error) { say('Get 4 in a row first.'); return; }
    setBingo((x) => ({ ...x, claimed: true })); say(`BINGO! +${data?.xp ?? 200} XP`); refreshProfile();
  }
  async function claimQuest() {
    const { data, error } = await supabase.rpc('claim_daily_quest');
    if (error) { say('Finish the quest first.'); return; }
    setQuest((x) => ({ ...x, claimed: true })); say(`Quest done · +${data?.xp ?? 30} XP`); refreshProfile();
  }
  const flip = (id) => setUi({ flipped: { ...flipped, [id]: !flipped[id] } });

  // One timer for everything on this page: challenges and the bingo card both reset on Monday (the player's own calendar).
  const resetIn = useMemo(() => { const n = new Date(); const d = (8 - n.getDay()) % 7 || 7; const mon = new Date(n.getFullYear(), n.getMonth(), n.getDate() + d); return `${Math.max(1, Math.ceil((mon - n) / 864e5))}d`; }, []);

  const recipeOf = (c) => recipes?.find((r) => r.id === c.recipe_id);

  return (
    <div className="stack">
      <div className="page-title"><h1>Compete</h1><span className="muted">Resets in {resetIn}</span></div>
      <CookOffCard />
      {bingo && (
        <section data-tour="bingo" data-tip="bingo" className="stack" style={{ gap: 10 }} aria-labelledby="bingo-h">
          <div className="row" style={{ justifyContent: 'space-between' }}><h2 id="bingo-h" style={{ fontSize: 22 }}>Cuisine bingo</h2><span className="chip xp">+200 XP</span></div>
          <div role="grid" aria-label="Bingo card" className="bingo">
            {bingo.cells.map((cell, i) => { const hit = bingo.marks?.[i]; return (
              <div key={i} role="gridcell" className={`${hit ? 'on' : ''} ${hit && !bingoSeen.has(cell) ? 'fresh' : ''}`} style={{ '--d': `${(i % 4) * 90}ms` }} aria-label={`${cell}${hit ? ', cooked' : ''}`}>
                <div className="b-in">
                  <span className="b-face">{cell}</span>
                  {hit && <span className="b-face b-back"><span className="b-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sceneSvg({ cuisine: cell }, (k) => `/tw/${k}.svg`) }} /><b><Icon name="check" size={13} />{cell}</b></span>}
                </div>
              </div>
            ); })}
          </div>
          {bingo.claimed ? <span className="row" style={{ color: 'var(--fresh)', fontWeight: 800 }}><Icon name="check" />Bingo claimed</span>
            : bingo.lines > 0 ? <button className="btn" onClick={claimBingo}>Claim BINGO · +200 XP</button>
            : <span className="muted" style={{ fontWeight: 800, fontSize: 13 }}>{(bingo.marks || []).filter(Boolean).length}/16 cooked</span>}
        </section>
      )}

      {quest && (
        <div className="card stack" data-tip="quest" style={{ gap: 8, background: quest.claimed ? 'var(--card)' : 'var(--gold-soft)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">Daily quest</span><span className="chip xp">+30 XP</span></div>
          <b style={{ fontSize: 16 }}>{quest.label}</b>
          <div className="row" style={{ flexWrap: 'nowrap' }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${Math.round((quest.progress / quest.target) * 100)}%` }} /></div><span style={{ fontWeight: 800, fontSize: 13 }}>{quest.progress}/{quest.target}</span></div>
          {quest.claimed ? <span className="muted" style={{ fontWeight: 800, fontSize: 13 }}>✓ Claimed · new quest tomorrow</span> : quest.progress >= quest.target ? <button className="btn" onClick={claimQuest}>Claim +30 XP</button> : null}
        </div>
      )}

      <h2 data-tour="challenges" data-tip="challenges" style={{ fontSize: 22 }}>This week’s challenges</h2>
      {challenges === null || !recipes ? <p className="muted">Loading…</p> : challenges.length === 0 ? (
        <div className="empty"><b>No challenges yet</b></div>
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
                {on && <Scene iso={r.country} cuisine={r.cuisine} title={r.title} height={140} className="scene-bleed" />}
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

      {cookMode && <CookMode r={cookMode.r} factor={factors[cookMode.c.id] || 1} canFinish onFinish={() => { const f = cookMode.complete; setCookMode(null); f(); }} onClose={() => setCookMode(null)} />}
      {logging && <LogMealSheet recipe={logging.r} challenge={logging.c} onClose={() => setLogging(null)} onDone={() => { setUi({ flipped: { ...flipped, [logging.c.id]: false } }); load(); }} />}
    </div>
  );
}
