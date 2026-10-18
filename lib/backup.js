'use client';
// Which ways to back up / get back a game this Yoke server allows (Supabase → Authentication → Providers).
// Read from the public auth settings, so the buttons only show what will actually work.
let cached = null;
export function backupMethods() {
  if (!cached) {
    cached = fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY } })
      .then((r) => (r.ok ? r.json() : {}))
      .then((s) => ({ apple: !!s?.external?.apple, google: !!s?.external?.google, email: !!s?.external?.email }))
      .catch(() => ({ apple: false, google: false, email: false }));
  }
  return cached;
}
export const confirmUrl = () => `${window.location.origin}/auth/confirm`;
// Supabase messages → plain words
export function backupError(e) {
  const m = String(e?.message || e?.code || e || '');
  if (/invalid login|invalid_credentials/i.test(m)) return 'That email and password don’t match. Check them and try again.';
  if (/already (been )?(registered|linked|exists)|identity_already_exists|email_exists|user_already_exists/i.test(m)) return 'That email already has a Yoke game.';
  if (/weak|password.*(short|least|characters)|at least \d/i.test(m)) return 'Pick a longer password (at least 8 characters).';
  if (/manual linking/i.test(m)) return 'Accounts aren’t switched on for Yoke yet. Try again soon.';
  if (/rate|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  if (/invalid.*email|email.*invalid|validate email/i.test(m)) return 'That email doesn’t look right.';
  if (/signups? not allowed|email.*disabled|email_provider_disabled/i.test(m)) return 'Email accounts aren’t switched on for Yoke yet.';
  return 'That didn’t work. Try again in a moment.';
}
export const emailTaken = (e) => /already (been )?(registered|linked|exists)|identity_already_exists|email_exists|user_already_exists/i.test(String(e?.message || e?.code || e || ''));
