import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { pushReady, anonDb, sendAll } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The host's phone calls this right after making a Cook Off. We check who's asking (their own session), then the
// database checks it's really their new game and returns their friends who turned notifications on (once per game).
export async function POST(req) {
  if (!pushReady()) return NextResponse.json({ ok: true, sent: 0 });
  let code = '';
  try { code = String((await req.json())?.code || '').toUpperCase(); } catch {}
  if (!/^[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: 'bad code' }, { status: 400 });
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  const db = anonDb();
  const { data, error } = await db.rpc('push_cookoff', { p_secret: process.env.PUSH_SECRET, p_host: user.id, p_code: code });
  if (error) return NextResponse.json({ ok: true, sent: 0 });
  return NextResponse.json({ ok: true, ...(await sendAll(db, data || [])) });
}
