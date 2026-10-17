import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { pushReady, anonDb, sendAll } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The sender's phone calls this right after sending a chat message. We check who's asking (their own session), then the
// database checks it's really their new message and returns the group's members who want a notification (once per
// message, at most one per person per group every 5 minutes, never for a muted group or a muted sender).
export async function POST(req) {
  if (!pushReady()) return NextResponse.json({ ok: true, sent: 0 });
  let msg = '';
  try { msg = String((await req.json())?.msg || ''); } catch {}
  if (!/^[0-9a-f-]{36}$/i.test(msg)) return NextResponse.json({ error: 'bad message' }, { status: 400 });
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'not signed in' }, { status: 401 });
  const db = anonDb();
  const { data, error } = await db.rpc('push_chat', { p_secret: process.env.PUSH_SECRET, p_sender: user.id, p_msg: msg });
  if (error) return NextResponse.json({ ok: true, sent: 0 });
  return NextResponse.json({ ok: true, ...(await sendAll(db, data || [])) });
}
