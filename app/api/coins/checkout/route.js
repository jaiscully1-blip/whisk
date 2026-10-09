import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { rcReady, purchaseLink } from '@/lib/revenuecat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ pack: z.string().regex(/^coins-\d{1,6}$/) }).strict();

// Opens RevenueCat's checkout (Apple Pay / Google Pay / card) for a coin pack. The player's id goes in the link, so
// the webhook knows whose game to credit; the price is set in RevenueCat, never by the browser.
export async function POST(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Start a game first.' }, { status: 401 });
  if (user.is_anonymous) return NextResponse.json({ error: 'Back up your game first, so coins you buy can’t be lost.', backup: true }, { status: 403 });
  let body;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Pick a coin pack.' }, { status: 400 }); }
  if (!rcReady()) return NextResponse.json({ error: 'Buying coins isn’t set up yet.' }, { status: 503 });

  const { data: pack } = await supabase.from('coin_packs').select('id').eq('id', body.pack).maybeSingle();
  if (!pack) return NextResponse.json({ error: 'That coin pack isn’t for sale.' }, { status: 400 });
  try {
    return NextResponse.json({ url: purchaseLink(user.id, pack.id, user.email) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('revenuecat link', e?.message);
    return NextResponse.json({ error: 'Checkout is unavailable right now. Try again soon.' }, { status: 502 });
  }
}
