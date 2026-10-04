'use client';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { thawState, THAW_HOURS } from '@/lib/recipes/match';

// Frozen meat/seafood reminder with a "Start thawing" button (fridge thawing, about 24 h).
export default function ThawBanner({ items, onChanged }) {
  const { supabase, say } = useWhisk();
  async function start(p) {
    const { error } = await supabase.from('pantry_items').update({ thaw_started_at: new Date().toISOString() }).eq('id', p.id);
    if (error) { say('Couldn’t update that item.'); return; }
    say(`${p.name} is thawing in the fridge · ready in about ${THAW_HOURS} hours`); onChanged?.();
  }
  return items.map((p) => {
    const t = thawState(p);
    if (!t || t.state === 'thawed') return null;
    return (
      <div key={p.id} className="thaw">
        <Icon name="snow" size={22} />
        <span style={{ flex: 1 }}>{t.state === 'thawing' ? `${p.name} is thawing in the fridge · ready in ~${t.hoursLeft} h` : `${p.name} is frozen. Move it to the fridge to defrost (about ${THAW_HOURS} hours).`}</span>
        {t.state === 'frozen' && <button className="btn sm" onClick={() => start(p)}>Start thawing</button>}
      </div>
    );
  });
}
