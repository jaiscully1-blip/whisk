import Link from 'next/link';

export default function Landing() {
  return (
    <main className="auth">
      <div className="card" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src="/icon.svg" alt="" width="96" height="96" style={{ borderRadius: 28 }} />
        <h1>whisk</h1>
        <p className="muted" style={{ margin: 0 }}>Track what’s in your kitchen, cook what you have, and level up while you do it.</p>
        <Link className="btn wide" href="/signup">Create account</Link>
        <Link className="btn ghost wide" href="/login">I already have an account</Link>
      </div>
    </main>
  );
}
