'use client';
import { useCached } from '@/lib/cache';
import { fetchCompete } from './tabData';
import { useWhisk } from './AppShell';
import { useEffect, useRef } from 'react';
import useToday from './useToday';

// One small job a day for +40 XP and 100 coins (shared with the Compete tab's data, so it's instant).
// Once it's claimed it leaves the screen until the next day starts (12:00 midnight in the player's own time zone).
export default function DailyQuest() {
  const { supabase, refreshProfile, say, dataVersion } = useWhisk();
  const [cdata, setCdata, reload] = useCached('compete', () => fetchCompete(supabase), [dataVersion]);
  const today = useToday(), seen = useRef('');
  useEffect(() => { if (today && seen.current && seen.current !== today) reload?.(); if (today) seen.current = today; }, [today]); // eslint-disable-line react-hooks/exhaustive-deps   // a new day: fetch the new quest
  const quest = cdata?.quest ?? null;
  if (!quest || quest.claimed) return null;
  async function claimQuest() {
    const { data, error } = await supabase.rpc('claim_daily_quest');
    if (error) { say('Finish the quest first.'); return; }
    setCdata((x) => ({ ...(x || {}), quest: { ...x?.quest, claimed: true } })); say(`Quest done · +${data?.xp ?? 40} XP${data?.coins ? ` · +${data.coins} coins` : ''}`); refreshProfile();
  }
  return (
    <div className="card stack" data-tip="quest" style={{ gap: 8, background: 'var(--gold-soft)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">Daily quest</span><span className="chip xp">+40 XP · 100 coins</span></div>
      <b style={{ fontSize: 16 }}>{quest.label}</b>
      <div className="row" style={{ flexWrap: 'nowrap' }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${Math.round((quest.progress / quest.target) * 100)}%` }} /></div><span style={{ fontWeight: 800, fontSize: 13 }}>{quest.progress}/{quest.target}</span></div>
      {quest.progress >= quest.target ? <button className="btn" onClick={claimQuest}>Claim +40 XP · 100 coins</button> : null}
    </div>
  );
}
