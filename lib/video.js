// Recognise a TikTok, Instagram or YouTube video link and build the address of its official embed player.
// Mirrors the check in send_chat_video (the database is the one that really decides).
export function parseVideo(input) {
  const u = String(input || '').trim();
  let m = u.match(/^https:\/\/(?:www\.|m\.)?tiktok\.com\/@[A-Za-z0-9._-]{1,40}\/video\/(\d{6,25})/);
  if (m) return { platform: 'tiktok', ref: m[1], url: u };
  m = u.match(/^https:\/\/(?:www\.)?instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,20})/);
  if (m) return { platform: 'instagram', sub: m[1] === 'reel' || m[1] === 'reels' ? 'reel' : 'p', ref: m[2], url: u };
  m = u.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/) || u.match(/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})/) || u.match(/^https:\/\/(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})/);
  if (m) return { platform: 'youtube', ref: m[1], url: u };
  return null;
}
export const PLATFORM = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube' };
// meta is what the database stored: { platform, ref, sub }
export function embedSrc(meta) {
  if (!meta) return null;
  if (meta.platform === 'tiktok' && /^\d{6,25}$/.test(meta.ref)) return `https://www.tiktok.com/embed/v2/${meta.ref}`;
  if (meta.platform === 'instagram' && /^[A-Za-z0-9_-]{5,20}$/.test(meta.ref)) return `https://www.instagram.com/${meta.sub === 'reel' ? 'reel' : 'p'}/${meta.ref}/embed`;
  if (meta.platform === 'youtube' && /^[A-Za-z0-9_-]{11}$/.test(meta.ref)) return `https://www.youtube-nocookie.com/embed/${meta.ref}?rel=0`;
  return null;
}
export function openSrc(meta) {
  if (!meta) return null;
  if (meta.platform === 'tiktok') return `https://www.tiktok.com/video/${meta.ref}`;
  if (meta.platform === 'instagram') return `https://www.instagram.com/${meta.sub === 'reel' ? 'reel' : 'p'}/${meta.ref}/`;
  if (meta.platform === 'youtube') return `https://www.youtube.com/watch?v=${meta.ref}`;
  return null;
}
