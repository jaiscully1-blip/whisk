import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { limitSearch } from '@/lib/ratelimit';
import { parseYouTuber } from '@/lib/youtubers';
import { channelVideos } from '@/lib/youtube/channel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A saved channel's recent cooking videos, each with what its description says about the recipe. Free, no AI.
export async function GET(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const p = parseYouTuber(new URL(req.url).searchParams.get('u') || '');
  if (!p) return NextResponse.json({ error: 'That isn’t a YouTube channel.' }, { status: 400 });
  const no = { 'Cache-Control': 'private, no-store' };
  const cap = await limitSearch(user.id);
  if (!cap.success) return NextResponse.json({ error: 'Daily limit reached. Open the channel on YouTube instead.', url: p.url }, { status: 429, headers: no });
  const [kind, value] = p.key.startsWith('@') ? ['@', p.handle.slice(1)] : p.key.split('/');
  try {
    const r = await channelVideos({ kind, value: kind === 'channel' ? p.url.split('/').pop() : value });
    if (!r.found) return NextResponse.json({ url: p.url, found: false, needsKey: !!r.needsKey }, { headers: no });
    const videos = r.videos.filter((v) => v.cooking);
    return NextResponse.json({ url: p.url, found: true, title: r.title, avatar: r.avatar, videos, hidden: r.videos.length - videos.length }, { headers: no });
  } catch (e) {
    console.error('channel', e?.message);
    return NextResponse.json({ error: 'YouTube didn’t answer. Try again in a bit.', url: p.url }, { status: 502, headers: no });
  }
}
