'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Me → streak and its milestones. One-time coin rewards at 3, 7, 14, 30, 60 and 100 days of cooking in a row.
export default function StreakCard() {
  const { supabase, say, refreshProfile, dataVersion, t } = useWhisk();
  const [d, setD] = useState(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_streak');
    if (!error && data) setD(data);
  }, [supabase]);
  useEffect(() => { load(); }, [load, dataVersion]);
  if (!d) return null;   // database not updated yet (setup SQL 34)

  const next = d.milestones.find((m) => !m.claimed && !m.ready);
  async function claim(days) {
    const { data, error } = await supabase.rpc('claim_streak_milestone', { p_days: days });
    if (error) { say('Couldn’t claim that.'); return; }
    say(`${days}-day streak · +${data.coins} coins`);
    await Promise.all([load(), refreshProfile()]);
  }
  return (
    <div className="card stack" data-testid="streak-card" style={{ gap: 10 }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <Icon name="dart" /><span style={{ flex: 1, fontWeight: 800 }}>{t('Streak')}: {d.streak} {d.streak === 1 ? 'day' : 'days'}</span>
        <span className="desc" data-testid="streak-freezes">{d.freezes} freeze{d.freezes === 1 ? '' : 's'} this week</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {d.milestones.map((m) => (
          <button key={m.days} type="button" className={`chip ${m.ready ? 'on' : ''}`} disabled={!m.ready} data-testid={`ms-${m.days}`} onClick={() => claim(m.days)}
            aria-label={`${m.days} days, ${m.coins} coins${m.claimed ? ', claimed' : m.ready ? ', ready to claim' : ''}`} style={{ opacity: m.claimed ? 0.5 : 1 }}>
            {m.days}d · {m.claimed ? 'done' : m.ready ? `claim ${m.coins}` : m.coins}
          </button>
        ))}
      </div>
      <p className="desc" style={{ margin: 0 }}>{next ? `${next.days - d.streak} more day${next.days - d.streak === 1 ? '' : 's'} to the ${next.days}-day reward.` : 'Every milestone claimed or ready.'} A missed day is covered by a weekly freeze, and you can repair a lapse by cooking again.</p>
    </div>
  );
}
