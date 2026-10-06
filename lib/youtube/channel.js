// Server-only: a channel's recent cooking videos, free.
// With YOUTUBE_API_KEY (free daily quota): channels → uploads playlist → video details, 3 quota units per channel,
// cached for 6 hours and shared by every player. Without a key, a channel given by its id still works through
// YouTube's public RSS feed (latest 15 videos). Only fixed Google hosts are called, with ids we validated (no SSRF).
import { parseDescription, isCooking } from './recipe';

const YT = () => process.env.YOUTUBE_API_URL || 'https://www.googleapis.com/youtube/v3';
const RSS = () => process.env.YOUTUBE_RSS_URL || 'https://www.youtube.com/feeds/videos.xml';
const opts = () => ({ signal: AbortSignal.timeout(7000), next: { revalidate: 21600 } });   // a fresh 7 s timeout per call

const dur = (iso) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || ''); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; };
const ID = /^[A-Za-z0-9_-]{11}$/;
const thumbOf = (s) => s?.thumbnails?.medium?.url || s?.thumbnails?.high?.url || s?.thumbnails?.default?.url || null;
const safeImg = (u) => (typeof u === 'string' && /^https:\/\/(i\.ytimg\.com|yt3\.ggpht\.com|yt3\.googleusercontent\.com)\//.test(u) ? u : null);

function shape(v) {
  const parsed = parseDescription(v.description);
  return {
    id: v.id, title: String(v.title || '').slice(0, 140), thumb: safeImg(v.thumb) || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
    published: v.published || null, seconds: v.seconds || null, short: v.seconds ? v.seconds <= 75 : false,
    cooking: isCooking(v, parsed), recipe: parsed
  };
}

// key: { kind: '@' | 'channel' | 'user' | 'c', value }
export async function channelVideos(key) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey && key.kind !== 'c') {
    const q = key.kind === '@' ? `forHandle=${encodeURIComponent('@' + key.value)}` : key.kind === 'channel' ? `id=${encodeURIComponent(key.value)}` : `forUsername=${encodeURIComponent(key.value)}`;
    const ch = await (await fetch(`${YT()}/channels?part=snippet,contentDetails&${q}&key=${apiKey}`, opts())).json();
    const c = ch?.items?.[0]; if (!c) return { found: false };
    const uploads = c.contentDetails?.relatedPlaylists?.uploads;
    if (!/^UU[A-Za-z0-9_-]{22}$/.test(uploads || '')) return { found: false };
    const pl = await (await fetch(`${YT()}/playlistItems?part=contentDetails&maxResults=40&playlistId=${uploads}&key=${apiKey}`, opts())).json();
    const ids = (pl?.items || []).map((i) => i.contentDetails?.videoId).filter((x) => ID.test(x || ''));
    let vids = [];
    if (ids.length) {
      const vd = await (await fetch(`${YT()}/videos?part=snippet,contentDetails&id=${ids.join(',')}&key=${apiKey}`, opts())).json();
      vids = (vd?.items || []).filter((v) => ID.test(v.id)).map((v) => shape({ id: v.id, title: v.snippet?.title, description: v.snippet?.description, thumb: thumbOf(v.snippet), published: v.snippet?.publishedAt, seconds: dur(v.contentDetails?.duration) }));
    }
    return { found: true, source: 'api', title: String(c.snippet?.title || '').slice(0, 80), avatar: safeImg(thumbOf(c.snippet)), videos: vids };
  }
  if (key.kind === 'channel') {
    const xml = await (await fetch(`${RSS()}?channel_id=${encodeURIComponent(key.value)}`, opts())).text();
    const title = (xml.match(/<title>([^<]{1,120})<\/title>/) || [])[1] || null;
    const vids = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 20).map(([, e]) => {
      const id = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
      const un = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      return ID.test(id || '') ? shape({ id, title: un((e.match(/<title>([^<]*)<\/title>/) || [])[1]), description: un((e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1]), published: (e.match(/<published>([^<]+)<\/published>/) || [])[1] }) : null;
    }).filter(Boolean);
    return { found: !!title, source: 'rss', title: title ? title.replace(/&amp;/g, '&') : null, avatar: null, videos: vids };
  }
  return { found: false, needsKey: !apiKey };
}
