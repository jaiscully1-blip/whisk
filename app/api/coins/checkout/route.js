import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { btcpayReady, createInvoice } from '@/lib/btcpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ pack: z.string().regex(/^coins-\d{1,6}$/) }).strict();

// Start a Bitcoin checkout for a coin pack. The price comes from the database, never from the browser.
export async function POST(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  let body;
  try { body = Body.parse(await req.json()); } catch { return NextResponse.json({ error: 'Pick a coin pack.' }, { status: 400 }); }
  if (!btcpayReady()) return NextResponse.json({ error: 'Bitcoin checkout isn’t set up yet.' }, { status: 503 });

  const { data: order, error } = await supabase.rpc('create_coin_order', { p_pack_id: body.pack });
  if (error || !order) return NextResponse.json({ error: error?.message?.includes('too many') ? 'Too many open checkouts. Try again in a bit.' : 'Couldn’t start that checkout.' }, { status: 400 });

  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const inv = await createInvoice({ orderId: order.order_id, usd: order.usd, coins: order.coins, redirectURL: `${site}/me?paid=1` });
    return NextResponse.json({ url: inv.checkoutLink });
  } catch (e) {
    console.error('btcpay checkout', e?.message);
    return NextResponse.json({ error: 'The Bitcoin checkout is unavailable right now. Try again soon.' }, { status: 502 });
  }
}
