'use client';
import { useCached } from '@/lib/cache';
import { fetchParties } from './PartyHub';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// "Share to": one chip per party you're in, plus All friends and Just me. Tap as many as you like; nothing is shared until you pick one.
// value = { friends: boolean, groups: uuid[] }. Picking "Just me" clears the rest; picking anything else clears "Just me".
export const NOT_SHARED = { friends: false, groups: [] };
export default function ShareChips({ value, onChange, disabled = false }) {
  const { supabase } = useWhisk();
  const [parties] = useCached('parties', () => fetchParties(supabase));
  const v = value || NOT_SHARED;
  const justMe = !v.friends && !(v.groups || []).length;
  const togGroup = (id) => onChange({ ...v, groups: v.groups.includes(id) ? v.groups.filter((x) => x !== id) : [...v.groups, id] });
  return (
    <div className="stack" style={{ gap: 6 }} data-testid="share-chips">
      <span className="lbl">Share to</span>
      <div className="share-chips">
        {(parties || []).map((p) => {
          const on = v.groups.includes(p.id);
          return <button key={p.id} type="button" disabled={disabled} className={`sc-chip ${on ? 'on' : ''}`} aria-pressed={on} data-testid="share-party" onClick={() => togGroup(p.id)}><Icon name="globe" size={14} />{p.name}{on && <Icon name="check" size={14} />}</button>;
        })}
        <button type="button" disabled={disabled} className={`sc-chip ${v.friends ? 'on' : ''}`} aria-pressed={v.friends} data-testid="share-friends" onClick={() => onChange({ ...v, friends: !v.friends })}><Icon name="heart" size={14} />All friends{v.friends && <Icon name="check" size={14} />}</button>
        <button type="button" disabled={disabled} className={`sc-chip me ${justMe ? 'on' : ''}`} aria-pressed={justMe} data-testid="share-me" onClick={() => onChange(NOT_SHARED)}><Icon name="lock" size={14} />Just me</button>
      </div>
      <span className="desc">{justMe ? 'Only you can see this plate.' : 'Tap more than one if you like. Change it any time.'}</span>
    </div>
  );
}
