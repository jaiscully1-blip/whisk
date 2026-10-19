'use client';
import { useRef, useState } from 'react';
import { useCached } from '@/lib/cache';
import { fetchFriends } from './tabData';
import { useWhisk } from './AppShell';
import Avatar from './Avatar';

// Square-crop a photo from the camera roll to 256px and save it as a small JPEG.
async function squareJpeg(file, size = 256) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);
  if (!bmp) throw new Error('That photo couldn’t be opened. Try a JPG or PNG.');
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement('canvas'); c.width = c.height = size;
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
}

// Your picture, big, with a camera badge: tap to choose a photo from the camera roll. It shows next to your name for
// everyone you play with (friends, chats, parties).
export default function AvatarPicker({ name, size = 64 }) {
  const { supabase, say, profile } = useWhisk();
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const code = f0?.code;
  const [v, setV] = useState(0);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  async function chosen(e) {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    if (!code) { say('Give it a second, then try again.'); return; }
    setBusy(true);
    try {
      const blob = await squareJpeg(file);
      const up = await supabase.storage.from('avatars').upload(`${code}.jpg`, blob, { contentType: 'image/jpeg', upsert: true, cacheControl: '60' });
      if (up.error) throw new Error(/bucket|not found/i.test(up.error.message || '') ? 'Profile pictures need a database update first (setup SQL 42).' : 'The photo didn’t upload. Try again.');
      setV(Date.now()); say('Profile picture saved');
    } catch (err) { say(err.message || 'The photo didn’t upload. Try again.'); }
    setBusy(false);
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" hidden onChange={chosen} data-testid="avatar-file" />
      <button type="button" className="av-pick" onClick={() => input.current?.click()} disabled={busy} aria-label="Change your profile picture" data-testid="avatar-pick" style={{ width: size, height: size }}>
        <Avatar className="av-pick-img" code={code} v={v} name={name || profile?.display_name || '?'} style={{ width: size, height: size, fontSize: size * 0.42 }} />
        <span className="av-pick-cam" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
      </button>
    </>
  );
}
