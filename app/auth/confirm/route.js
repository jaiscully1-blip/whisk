import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Handles the email-confirmation link. Supports both the token_hash template and the PKCE ?code= flow.
export async function GET(req) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const code = url.searchParams.get('code');
  const supabase = await supabaseServer();
  let ok = false;
  if (tokenHash && ['email', 'signup', 'recovery', 'email_change'].includes(type || '')) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }
  return NextResponse.redirect(new URL(ok ? '/cook' : '/auth/error', url.origin));
}
