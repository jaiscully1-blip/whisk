// "Your Chefs": cooking creators on YouTube, TikTok or Instagram. As with YouTube before, the link is never used as typed:
// we read a handle out of it and build the address ourselves, so only the three real sites can ever be saved or opened.
import { parseYouTuber, MAX_YOUTUBERS } from './youtubers';

export const MAX_CHEFS = MAX_YOUTUBERS;
export const PLATFORMS = [
  { id: 'youtube', label: 'YouTube', noun: 'channel', color: '#FF0000' },
  { id: 'tiktok', label: 'TikTok', noun: 'account', color: '#111111' },
  { id: 'instagram', label: 'Instagram', noun: 'page', color: '#E1306C' }
];

const TT = /^[A-Za-z0-9._]{2,24}$/, IG = /^[A-Za-z0-9._]{1,30}$/;
const IG_RESERVED = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'accounts', 'tv', 'direct']);

function handleFrom(input, domain, take) {
  let s = String(input || '').trim();
  if (!s || s.length > 200) return null;
  const bare = new RegExp(`^(www\\.|m\\.)?${domain.replace('.', '\\.')}/`, 'i');
  if (!/^https?:\/\//i.test(s) && bare.test(s)) s = 'https://' + s;
  if (/^https?:\/\//i.test(s)) {
    let u; try { u = new URL(s); } catch { return null; }
    if (!new RegExp(`^(www\\.|m\\.)?${domain.replace('.', '\\.')}$`, 'i').test(u.hostname)) return null;
    return take(u.pathname.split('/').filter(Boolean));
  }
  return s.replace(/^@/, '');
}

export function parseChef(platform, input) {
  if (platform === 'youtube') { const p = parseYouTuber(input); return p ? { ...p, platform } : null; }
  if (platform === 'tiktok') {
    const h = handleFrom(input, 'tiktok.com', (parts) => (parts[0] && parts[0].startsWith('@') ? parts[0].slice(1) : null));
    if (!h || !TT.test(h)) return null;
    return { platform, key: 'tt:' + h.toLowerCase(), url: `https://www.tiktok.com/@${h}`, handle: '@' + h };
  }
  if (platform === 'instagram') {
    const h = handleFrom(input, 'instagram.com', (parts) => (parts[0] && !IG_RESERVED.has(parts[0].toLowerCase()) ? parts[0].replace(/^@/, '') : null));
    if (!h || !IG.test(h) || IG_RESERVED.has(h.toLowerCase())) return null;
    return { platform, key: 'ig:' + h.toLowerCase(), url: `https://www.instagram.com/${h}/`, handle: '@' + h };
  }
  return null;
}
// a saved address → which site it belongs to
export function parseAnyChef(url) {
  const s = String(url || '');
  for (const p of ['youtube', 'tiktok', 'instagram']) { const r = parseChef(p, s); if (r && /^https:\/\//.test(s)) return r; }
  return null;
}

// Saved lists come back from the database: re-check every entry before showing it. Older entries are YouTube.
export function cleanChefs(list) {
  if (!Array.isArray(list)) return [];
  const out = []; const seen = new Set();
  for (const x of list) {
    const p = parseAnyChef(x?.url); if (!p || seen.has(p.key)) continue;
    seen.add(p.key); out.push({ name: String(x.name || p.handle).slice(0, 40), url: p.url, platform: p.platform });
    if (out.length >= MAX_CHEFS) break;
  }
  return out;
}
