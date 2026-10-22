// New passwords: at least 8 characters with letters and numbers, not one of the passwords attackers try first, not the
// email itself. Set the same rule in Supabase (Authentication → Providers → Email: minimum length 8, "Letters and digits")
// so it's enforced on the server too.
const COMMON = new Set(['password', 'password1', 'password12', 'password123', 'passw0rd', '12345678', '123456789', '1234567890', '87654321', '11111111',
  '00000000', 'qwerty123', 'qwertyuiop', 'abc12345', 'abcd1234', '1q2w3e4r', '1qaz2wsx', 'iloveyou1', 'welcome1', 'letmein1', 'admin123', 'football1',
  'baseball1', 'sunshine1', 'princess1', 'monkey123', 'dragon123', 'master123', 'trustno1', 'superman1', 'starwars1', 'yoke1234', 'yokeyoke1']);
export function passwordProblem(pw, email = '') {
  const p = String(pw || '');
  if (p.length < 8) return 'Pick a longer password (at least 8 characters).';
  if (p.length > 72) return 'That password is too long (72 characters at most).';
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Use letters and numbers in your password.';
  const low = p.toLowerCase();
  if (COMMON.has(low) || /^(.)\1+$/.test(p)) return 'That password is too easy to guess. Try another.';
  const name = String(email).split('@')[0].toLowerCase();
  if (name.length >= 4 && low.includes(name)) return 'Don’t use your email in your password.';
  return '';
}
