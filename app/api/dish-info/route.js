import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { limitSearch } from '@/lib/ratelimit';
import { DISHES } from '@/lib/dishes/index';
import { findDish } from '@/lib/dishes/search';
import { bestVideo, wikiIngredients, youtubeSearchUrl } from '@/lib/dishes/web';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The back of a dish card: its main ingredients (from Whisk's list, or the Wikipedia infobox) and the best YouTube video.
// Free: YouTube's free daily quota, answers cached for a week and shared by everyone. No AI.
const Body = z.object({ dish: z.string().trim().min(1).max(80), wiki: z.number().int().positive().max(1e10).optional() }).strict();

export async function POST(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Pick a dish.' }, { status: 400 }); }
  const search = youtubeSearchUrl(body.dish);
  const known = findDish(DISHES, body.dish);
  let ingredients = (known?.ingredients || []).map((name) => ({ name }));
  const cap = await limitSearch(user.id);
  if (!cap.success) return NextResponse.json({ ingredients, video: null, configured: false, search, note: 'Daily limit reached. Here’s a YouTube search instead.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  const [ing, yt] = await Promise.allSettled([
    !known && body.wiki ? wikiIngredients(body.wiki) : Promise.resolve(null),
    bestVideo(known?.name || body.dish)
  ]);
  if (ing.status === 'fulfilled' && ing.value) ingredients = ing.value.map((name) => ({ name }));
  if (ing.status === 'rejected') console.error('wiki ingredients', ing.reason?.status || ing.reason?.message);
  if (yt.status === 'rejected') console.error('youtube', yt.reason?.status || yt.reason?.message);
  // configured=false (no key) or a YouTube error: link to a YouTube search instead. configured + null video: nothing found, grey out.
  const v = yt.status === 'fulfilled' ? yt.value : { configured: false };
  return NextResponse.json({ ingredients, video: v.video || null, configured: !!v.configured, search }, { headers: { 'Cache-Control': 'private, no-store' } });
}
