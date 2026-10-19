'use client';
import { useEffect, useState } from 'react';
import { color } from '@/lib/social';

// A player's picture: their photo when they've added one (public file named after their 6-letter code), otherwise
// the coloured circle with their first letter. `v` busts the cache right after the owner changes theirs.
export const avatarUrl = (code, v) => (code && process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${code}.jpg${v ? `?v=${v}` : ''}` : null);

export default function Avatar({ code, name = '?', bg, v, className = 'post-av', style, children, ...rest }) {
  const url = avatarUrl(code, v);
  const [bad, setBad] = useState(false);
  useEffect(() => { setBad(false); }, [url]);
  return (
    <span className={className} style={{ background: bg || color(name), position: 'relative', ...style }} {...rest}>
      {children ?? String(name).slice(0, 1).toUpperCase()}
      {url && !bad && <img src={url} alt="" draggable={false} onError={() => setBad(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />}
    </span>
  );
}
