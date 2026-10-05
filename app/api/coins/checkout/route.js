import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { stripeReady, createCheckout } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ pack: z.string().regex(/^coins-\d{1,6}$/) }).strict();

// Start an Apple Pay / Google Pay / card checkout for a coin pack. The price comes from the database, never from the browser.
export async function POST(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Start a game first.' }, { status: 401 });
  let body;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Pick a coin pack.' }, { status: 400 }); }
  if (!stripeReady()) return NextResponse.json({ error: 'Buying coins isn’t set up yet.' }, { status: 503 });

  const { data: order, error } = await supabase.rpc('create_coin_order', { p_pack_id: body.pack });
  if (error || !order) return NextResponse.json({ error: error?.message?.includes('too many') ? 'Too many open checkouts. Try again in a bit.' : 'Couldn’t start that checkout.' }, { status: 400 });
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const s = await createCheckout({ orderId: order.order_id, usd: order.usd, coins: order.coins, site });
    return NextResponse.json({ url: s.url });
  } catch (e) {
    console.error('stripe checkout', e?.message);
    return NextResponse.json({ error: 'Checkout is unavailable right now. Try again soon.' }, { status: 502 });
  }
}
