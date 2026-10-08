'use client';
import { useCached } from '@/lib/cache';
import { fetchCompete } from './tabData';
import { useWhisk } from './AppShell';

// One small job a day for +30 XP (shared with the Compete tab's data, so it's instant).
export default function DailyQuest() {
  const { supabase, refreshProfile, say, dataVersion } = useWhisk();
  const [cdata, setCdata] = useCached('compete', () => fetchCompete(supabase), [dataVersion]);
  const quest = cdata?.quest ?? null;
  if (!quest) return null;
  async function claimQuest() {
    const { data, error } = await supabase.rpc('claim_daily_quest');
    if (error) { say('Finish the quest first.'); return; }
    setCdata((x) => ({ ...(x || {}), quest: { ...x?.quest, claimed: true } })); say(`Quest done · +${data?.xp ?? 30} XP`); refreshProfile();
  }
  return (
    <div className="card stack" data-tip="quest" style={{ gap: 8, background: quest.claimed ? 'var(--card)' : 'var(--gold-soft)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}><span className="eyebrow">Daily quest</span><span className="chip xp">+30 XP</span></div>
      <b style={{ fontSize: 16 }}>{quest.label}</b>
      <div className="row" style={{ flexWrap: 'nowrap' }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${Math.round((quest.progress / quest.target) * 100)}%` }} /></div><span style={{ fontWeight: 800, fontSize: 13 }}>{quest.progress}/{quest.target}</span></div>
      {quest.claimed ? <span className="muted" style={{ fontWeight: 800, fontSize: 13 }}>✓ Claimed · new quest tomorrow</span> : quest.progress >= quest.target ? <button className="btn" onClick={claimQuest}>Claim +30 XP</button> : null}
    </div>
  );
}
