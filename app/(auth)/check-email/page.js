import Link from 'next/link';
export const metadata = { title: 'Check your email · Whisk' };
export default function CheckEmail() {
  return (
    <main className="auth">
      <div className="card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <img src="/icon.svg" alt="" width="72" height="72" style={{ borderRadius: 20 }} />
        <h1>Check your email</h1>
        <p className="muted" style={{ margin: 0 }}>We sent you a link to confirm your account. Open it on this device, then you’re in.</p>
        <Link className="btn ghost wide" href="/login">Back to log in</Link>
      </div>
    </main>
  );
}
