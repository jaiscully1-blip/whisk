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

// A chat's picture in lists: the friend's photo for a 1-on-1, up to three overlapping faces for a group or party,
// and the coloured letter when the faces aren't known yet.
export function ChatFaces({ chat, dm, size = 40 }) {
  if (dm) return <Avatar className="post-av" code={dm.code} name={dm.name} aria-hidden="true" />;
  const faces = (chat.faces || []).slice(0, 3);
  if (!faces.length) return <span className="post-av" style={{ background: color(chat.name) }} aria-hidden="true">{chat.name.slice(0, 1).toUpperCase()}</span>;
  const s = faces.length > 1 ? Math.round(size * 0.72) : size;
  return (
    <span className="chat-faces" style={{ width: faces.length > 1 ? size + 6 + (faces.length - 2) * 12 : size }} aria-hidden="true">
      {faces.map((f, i) => <Avatar key={f.code || i} className="post-av cf" code={f.code} name={f.name} style={{ width: s, height: s, fontSize: s * 0.42, marginLeft: i ? -10 : 0, zIndex: 3 - i }} />)}
    </span>
  );
}
