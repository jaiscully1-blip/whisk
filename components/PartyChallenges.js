'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import RecipeSheet from './RecipeSheet';
import { usePantry } from './usePantry';
import { seatColor, partyError } from './PartyHub';
import { fmt } from '@/lib/game';

// The party's three dishes this week (a small, a medium and a big one), the same for everyone in the party.
// You see who has cooked each one; cooking it pays the coins and XP, and the plate goes on the party's plates.
const TIER = { 1: ['Small', 'var(--fresh-soft)', 'var(--fresh)'], 2: ['Medium', 'var(--warn-soft)', 'var(--warn)'], 3: ['Big', 'var(--pop-soft)', 'var(--bad)'] };
const hrs = (m) => (m >= 90 ? `${Math.round(m / 6) / 10} hr` : `${m} min`);
const first = (n) => String(n || '?').split(' ')[0];

export default function PartyChallenges({ gid }) {
  const { supabase, say, refreshProfile, allRecipes, ensureRecipes, dataVersion } = useWhisk();
  const [pantry] = usePantry();
  const [d, setD] = useState(null);       // { week_end, items } | 'missing'
  const [open, setOpen] = useState(null);  // { item, recipe }
  const [busy, setBusy] = useState('');
  const load = useCallback(() => supabase.rpc('get_party_challenges', { p_group: gid }).then(({ data, error }) => setD(error ? (/could not find the function|schema cache|does not exist/i.test(String(error.message)) ? 'missing' : 'error') : data)), [supabase, gid]);
  useEffect(() => { load(); }, [load, dataVersion]);
  const daysLeft = useMemo(() => (d && d.week_end ? Math.max(1, Math.ceil((new Date(`${d.week_end}T00:00:00`) - Date.now()) / 864e5)) : null), [d]);

  async function claim(it, meal) {
    if (busy) return; setBusy(String(it.slot));
    const { data, error } = await supabase.rpc('claim_party_challenge', { p_group: gid, p_slot: it.slot, p_meal: meal || null });
    setBusy('');
    if (error) {
      const m = String(error.message || '');
      say(/one challenge a day/.test(m) ? 'One challenge dish a day. Claim this one tomorrow.' : /already done/.test(m) ? 'You already did that one.' : /cook it first/.test(m) ? 'Cook it and post a photo first.' : partyError(error, 'Couldn’t count that one.'));
    } else say(`Challenge done · +${fmt(data.coins)} coins${data.xp ? ` · +${data.xp} XP` : ''}`);
    refreshProfile(); load();
  }
  async function openIt(it) {
    const r = (allRecipes || []).find((x) => x.id === it.recipe_id) || (await ensureRecipes([it.recipe_id]))[0];
    if (r) setOpen({ it, r }); else say('Couldn’t open that recipe.');
  }

  if (d === null) return <section className="stack" style={{ gap: 8 }} aria-label="This week’s challenges"><span className="eyebrow">This week’s challenges</span><div className="card pch-skel" aria-hidden="true" /></section>;
  if (d === 'missing') return <section className="stack" style={{ gap: 8 }}><span className="eyebrow">This week’s challenges</span><div className="empty">Party challenges need a database update first (setup SQL 52). Ask the app owner.</div></section>;
  if (d === 'error' || !d.items) return null;
  return (
    <section className="stack" style={{ gap: 8 }} aria-label="This week’s challenges" data-testid="party-challenges" data-tip="challenges">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow">This week’s challenges</span>
        {daysLeft && <span className="muted pill-r">Resets in {daysLeft}d</span>}
      </div>
      {d.items.length === 0 && <div className="empty">No challenges yet. Check back soon.</div>}
      {d.items.map((it) => {
        const [tier, bg, ink] = TIER[it.slot] || TIER[3];
        const mine = (it.done || []).some((x) => x.me);
        return (
          <div key={it.slot} className={`card pch ${mine ? 'done' : ''}`} data-testid="party-challenge">
            <button type="button" className="pch-main" onClick={() => openIt(it)} aria-label={`${it.title}: open the recipe`}>
              <span className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
                <span className="chip" style={{ background: bg, color: ink, fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '.06em' }}>{tier}</span>
                <span className="row" style={{ gap: 5, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 22, flexWrap: 'nowrap' }}><Coin size={20} />{fmt(it.coins)}</span>
              </span>
              <span className="pch-title">{it.title}</span>
              <span className="row" style={{ flexWrap: 'nowrap' }}><span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>Difficulty {it.score}/100</span><span className="bar" style={{ flex: 1 }}><i style={{ width: `${it.score}%`, background: ink }} /></span></span>
              <span className="row" style={{ gap: 6 }}><span className="chip">{hrs(it.minutes)}</span><span className="chip">{it.cuisine}</span></span>
            </button>
            <div className="pch-who">
              <span className="pch-avs" aria-hidden="true">{(it.done || []).slice(0, 6).map((x) => <i key={x.code} className="post-av sm" style={{ background: seatColor(x.seat) }}>{x.name.slice(0, 1).toUpperCase()}</i>)}</span>
              <span className="desc" style={{ flex: 1, minWidth: 0 }}>{(it.done || []).length === 0 ? 'Nobody yet. Be first!' : `${(it.done || []).map((x) => (x.me ? 'You' : first(x.name))).slice(0, 3).join(', ')}${it.done.length > 3 ? ` +${it.done.length - 3}` : ''} cooked it`}</span>
              {mine ? <span className="row" style={{ color: 'var(--fresh)', fontWeight: 800, gap: 4, flexWrap: 'nowrap' }}><Icon name="check" size={16} />Done</span>
                : it.my_meal ? <button type="button" className="btn sm" disabled={busy === String(it.slot)} onClick={() => claim(it, it.my_meal)} data-testid="pch-claim">Claim</button>
                : <button type="button" className="btn ghost sm" onClick={() => openIt(it)}>Cook it</button>}
            </div>
          </div>
        );
      })}
      {open && <RecipeSheet recipe={open.r} pantry={pantry || []} presetGroups={[gid]} onClose={() => setOpen(null)} onChanged={(data) => { if (data?.meal_id) claim(open.it, data.meal_id); else load(); }} />}
    </section>
  );
}
