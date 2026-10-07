import { NextResponse } from 'next/server';
import { pushReady, secretOk, anonDb, sendAll } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called once an hour (Supabase pg_cron, see supabase/setup/14) with "Authorization: Bearer <PUSH_SECRET>".
// The database picks who's due (their picked hour, once a day, only when something is useful) and we send.
export async function POST(req) {
  if (!pushReady()) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const auth = req.headers.get('authorization') || '';
  if (!secretOk(auth.replace(/^Bearer\s+/i, ''))) return NextResponse.json({ error: 'forbidden' }, { status: 401 });
  const db = anonDb();
  const { data, error } = await db.rpc('push_due', { p_secret: process.env.PUSH_SECRET });
  if (error) { console.error('push_due', error.message); return NextResponse.json({ error: 'failed' }, { status: 500 }); }
  return NextResponse.json({ ok: true, ...(await sendAll(db, data || [])) });
}
