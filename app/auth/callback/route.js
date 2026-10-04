import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Google sends the player back here with a one-time code; swap it for a session (PKCE), then go on.
// `next` must be a path on this site (never another site), e.g. /cook or /me?reset=1.
const safeNext = (n) => (typeof n === 'string' && /^\/(?!\/)[\w\-/?=&.]*$/.test(n) && n.length < 100 ? n : '/cook');
export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    console.error('oauth callback', error.status || error.message);
  }
  return NextResponse.redirect(new URL('/login?error=google', url.origin));
}
