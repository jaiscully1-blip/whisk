import Link from 'next/link';
export default function AuthError() {
  return (
    <main className="auth">
      <div className="card" style={{ textAlign: 'center', alignItems: 'center' }}>
        <h1>That link didn’t work</h1>
        <p className="muted" style={{ margin: 0 }}>It may have expired or already been used. Log in, or sign up again to get a fresh link.</p>
        <Link className="btn wide" href="/login">Log in</Link>
      </div>
    </main>
  );
}
