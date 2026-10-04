import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { limitSearch } from '@/lib/ratelimit';
import { DISHES } from '@/lib/dishes/index';
import { searchDishes, fold, countryOf } from '@/lib/dishes/search';
import { wikiDishes } from '@/lib/dishes/web';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Search anything: a country, a dish, a sauce, an ingredient. Free: Whisk's own dish list first,
// then Wikipedia (free, no key) when the list has little for those words. No AI, nothing billed.
const Body = z.object({ q: z.string().trim().min(1).max(80) }).strict();

export async function POST(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Type something to search for.' }, { status: 400 }); }

  const { country, dishes } = searchDishes(DISHES, body.q, 200);
  let more = [];
  if (!country && dishes.length < 6) {
    const cap = await limitSearch(user.id);
    if (cap.success) {
      try {
        const seen = new Set(dishes.map((d) => fold(d.name)));
        more = (await wikiDishes(body.q)).filter((d) => !seen.has(fold(d.name)));
        for (const d of more) { const c = d.about && countryOf(DISHES, d.about.split(' ')[0]); if (c) d.countries = [c]; }
      } catch (e) { console.error('wiki search', e?.status || e?.message); }
    }
  }
  return NextResponse.json({ country, dishes: [...dishes, ...more] }, { headers: { 'Cache-Control': 'private, no-store' } });
}
