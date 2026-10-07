'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';

// "Share with friends" for one plate. Plates are private until this is on.
export default function ShareSwitch({ mealId, initial = false, compact = false }) {
  const { supabase, say } = useWhisk();
  const [on, setOn] = useState(!!initial);
  const [gone, setGone] = useState(false);
  if (gone || !mealId) return null;
  async function flip() {
    const next = !on; setOn(next);
    const { data, error } = await supabase.rpc('set_meal_shared', { p_meal: mealId, p_shared: next });
    if (error) { setOn(!next); if (/function|schema cache/i.test(error.message || '')) setGone(true); else say('Couldn’t change that.'); return; }
    if (data === false) { setOn(!next); return; }
    say(next ? 'Shared with your friends' : 'Only you can see it now');
  }
  return (
    <div className={`share-sw ${compact ? 'compact' : ''}`}>
      <span>{compact ? 'Friends' : 'Share with friends'}</span>
      <button type="button" role="switch" aria-checked={on} aria-label="Share this plate with friends" className={`switch ${on ? 'on' : ''}`} onClick={flip}><span /></button>
    </div>
  );
}
