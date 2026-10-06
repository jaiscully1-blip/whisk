// "Your YouTubers": each player adds their own cooking channels. Nothing is built in.
// We never use the link as typed: we read a handle or channel id out of it and build the YouTube address ourselves,
// so only https://www.youtube.com/... links can ever be saved or opened.
export const MAX_YOUTUBERS = 12;

const HANDLE = /^[A-Za-z0-9._-]{3,30}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

// "@andy_cooks", "andy_cooks", "youtube.com/@andy_cooks", "https://m.youtube.com/channel/UC…", "youtube.com/c/Name", "youtube.com/user/Name"
// → { key, url, handle } or null
export function parseYouTuber(input) {
  let s = String(input || '').trim();
  if (!s || s.length > 200) return null;
  if (!/^https?:\/\//i.test(s) && /(^|\.)youtube\.com\//i.test(s)) s = 'https://' + s;
  if (/^https?:\/\//i.test(s)) {
    let u; try { u = new URL(s); } catch { return null; }
    if (!/^(www\.|m\.)?youtube\.com$/i.test(u.hostname)) return null;
    const [a, b] = u.pathname.split('/').filter(Boolean);
    if (a && a.startsWith('@')) s = a;
    else if (a === 'channel' && b && CHANNEL_ID.test(b)) return { key: 'channel/' + b, url: `https://www.youtube.com/channel/${b}`, handle: b };
    else if ((a === 'c' || a === 'user') && b && HANDLE.test(b)) return { key: `${a}/${b.toLowerCase()}`, url: `https://www.youtube.com/${a}/${b}`, handle: b };
    else return null;
  }
  const h = s.replace(/^@/, '');
  if (!HANDLE.test(h)) return null;
  return { key: '@' + h.toLowerCase(), url: `https://www.youtube.com/@${h}`, handle: '@' + h };
}

// Saved lists come back from the database: re-check every entry before showing it.
export function cleanList(list) {
  if (!Array.isArray(list)) return [];
  const out = []; const seen = new Set();
  for (const x of list) {
    const p = parseYouTuber(x?.url); if (!p || seen.has(p.key)) continue;
    seen.add(p.key); out.push({ name: String(x.name || p.handle).slice(0, 40), url: p.url });
    if (out.length >= MAX_YOUTUBERS) break;
  }
  return out;
}
