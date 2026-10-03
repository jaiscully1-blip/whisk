import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// POST only, so a link or image on another site can't sign you out.
export async function POST(req) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
