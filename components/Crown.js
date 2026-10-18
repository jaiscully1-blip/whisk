'use client';
import { useWhisk } from './AppShell';
import { useChampion } from '@/lib/champion';

// A small gold crown after a name when that player is this week's Cook of the week. Pass their friend code (or me).
export default function Crown({ code, me = false, size = 16 }) {
  const { supabase } = useWhisk();
  const c = useChampion(supabase);
  if (!c?.code || !(me ? c.me : code && code === c.code)) return null;
  return (
    <svg className="crown" width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Cook of the week" data-testid="crown" style={{ verticalAlign: '-2px', marginLeft: 4, flex: 'none' }}>
      <title>Cook of the week</title>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="#F4B400" stroke="#7a5600" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="3" cy="8" r="1.6" fill="#F4B400" stroke="#7a5600" strokeWidth="1" /><circle cx="12" cy="5" r="1.6" fill="#F4B400" stroke="#7a5600" strokeWidth="1" /><circle cx="21" cy="8" r="1.6" fill="#F4B400" stroke="#7a5600" strokeWidth="1" />
    </svg>
  );
}
