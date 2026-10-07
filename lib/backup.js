'use client';
// Which ways to back up / get back a game this Whisk server allows (Supabase → Authentication → Providers).
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
  const m = String(e?.message || e || '');
  if (/manual linking/i.test(m)) return 'Backups aren’t switched on for Whisk yet. Try again soon.';
  if (/already (been )?(registered|linked|exists)|identity_already_exists|email_exists/i.test(m)) return 'That account already has a Whisk game. To use it, choose “Get my game back” on the start screen.';
  if (/rate|too many/i.test(m)) return 'Too many tries. Wait a minute and try again.';
  if (/invalid.*email|email.*invalid/i.test(m)) return 'That email doesn’t look right.';
  return 'That didn’t work. Try again in a moment.';
}
