'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Me → Daily calorie goal. Calories are the ones printed on the recipes you cooked (nothing is guessed). A ring fills
// as the day's plates add up; log a meal and claim 100 coins once a day. Not medical advice.
const R = 38, C = 2 * Math.PI * R;

export default function CalorieGoal() {
  const { supabase, profile, setProfile, refreshProfile, say, t, dataVersion } = useWhisk();
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const has = profile && 'calorie_goal' in profile;
  const load = useCallback(async () => {
    const { data } = await supabase.rpc('get_calories');
    if (data) setD(data);
  }, [supabase]);
  useEffect(() => { if (has) load(); }, [has, load, dataVersion]);
  if (!has) return null;   // database not updated yet (setup SQL 33)

  const goal = profile.calorie_goal;
  const tot = d?.today || 0;
  const pct = goal ? tot / goal : 0;
  const inRange = goal && tot > 0;   // log a meal today to claim
  const over = goal && pct > 1.1;
  const max = Math.max(...(d?.days || []).map((x) => x.kcal), goal || 0, 1);

  async function save(v) {
    const { error } = await supabase.rpc('set_calorie_goal', { p_goal: v });
    if (error) { say('Couldn’t save that.'); return; }
    setProfile((p) => ({ ...p, calorie_goal: v }));
    say(v ? `Goal: ${v} kcal a day` : 'Calorie goal off');
  }
  async function claim() {
    setBusy(true);
    const { data, error } = await supabase.rpc('claim_calorie_reward');
    setBusy(false);
    if (error) { say('Log a meal first, then claim.'); return; }
    say(`Goal hit · +${data.coins} coins${data.xp ? ` · +${data.xp} XP` : ''}`);
    await Promise.all([load(), refreshProfile()]);
  }

  return (
    <div className="set-row" data-testid="calorie-goal">
      <span className="set-ico" aria-hidden="true"><Icon name="leaf" /></span><span className="set-lab">{t('Daily calorie goal')}</span>
      <span className="set-end">
        {goal ? (
          <span className="set-step">
            <button className="btn ghost sm" aria-label="Lower goal" onClick={() => save(Math.max(1200, goal - 100))}>−</button>
            <output data-testid="cal-goal">{goal}</output>
            <button className="btn ghost sm" aria-label="Raise goal" onClick={() => save(Math.min(4000, goal + 100))}>+</button>
          </span>
        ) : <button className="btn sm" data-testid="cal-on" onClick={() => save(2000)}>{t('Set a goal')}</button>}
      </span>
      {goal ? (
        <div className="row set-wide" style={{ gap: 14, flexWrap: 'nowrap', alignItems: 'center' }}>
          <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={`${tot} of ${goal} kcal today`}>
            <circle cx="46" cy="46" r={R} fill="none" stroke="var(--line)" strokeWidth="9" />
            <circle cx="46" cy="46" r={R} fill="none" stroke={over ? 'var(--bad, #e5484d)' : inRange ? 'var(--ok, #2fb344)' : 'var(--accent, #f5b700)'} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={`${Math.min(1, pct) * C} ${C}`} transform="rotate(-90 46 46)" />
            <text x="46" y="50" textAnchor="middle" fontWeight="800" fontSize="15" fill="currentColor" data-testid="cal-today">{tot}</text>
            <text x="46" y="64" textAnchor="middle" fontSize="9" fill="currentColor" opacity=".6">kcal</text>
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="desc" style={{ margin: 0 }}>
              {d?.claimed ? 'Reward claimed today.'
                : inRange ? 'You logged today. Claim your reward.'
                : over ? 'Over today’s range. Fresh ring tomorrow.'
                : tot ? `${tot} of ${goal} kcal so far.` : 'Log a meal to fill the ring.'}
            </p>
            {inRange && !d?.claimed && <button className="btn sm" data-testid="cal-claim" disabled={busy} style={{ marginTop: 8 }} onClick={claim}>Claim 100 coins</button>}
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 28, marginTop: 8 }}>
              {(d?.days || []).map((x) => <span key={x.day} title={`${x.day}: ${x.kcal} kcal`} style={{ flex: 1, height: `${Math.max(6, (x.kcal / max) * 100)}%`, borderRadius: 3, background: x.kcal ? 'var(--accent, #f5b700)' : 'var(--line)' }} />)}
            </div>
          </div>
        </div>
      ) : null}
      <span className="set-hint">{goal ? <>Calories come from the recipes you log. Not medical advice. <button type="button" className="set-link inline" onClick={() => save(null)}>Turn off</button></> : 'Calories come from the recipes you log. Not medical advice.'}</span>
    </div>
  );
}
