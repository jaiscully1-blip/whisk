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
  const done = quest.progress >= quest.target;
  return (
    <div className="ticket" data-tip="quest" data-testid="daily-quest">
      <div className="ticket-top"><span>ORDER · DAILY QUEST</span><span>{done ? 'READY' : 'TO GO'}</span></div>
      <div className="ticket-line"><b>{quest.label}</b><span>{quest.progress}/{quest.target}</span></div>
      <div className="ticket-bar" role="progressbar" aria-valuenow={quest.progress} aria-valuemin={0} aria-valuemax={quest.target}><i style={{ width: `${Math.min(100, Math.round((quest.progress / quest.target) * 100))}%` }} /></div>
      <div className="ticket-foot"><span className="ticket-stamp">+40 XP · 100 coins</span></div>
      {done ? <button className="btn" onClick={claimQuest}>Claim +40 XP · 100 coins</button> : null}
    </div>
  );
}
