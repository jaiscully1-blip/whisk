'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Compete → Cook Off: make a game (pick the time) or join a friend's with their code.
const TIMES = [15, 30, 45, 60];
export default function CookOffCard() {
  const { supabase, say } = useWhisk();
  const router = useRouter();
  const [mins, setMins] = useState(30);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const fail = (e) => say(String(e?.message || 'Something went wrong.').replace(/^\w/, (c) => c.toUpperCase()));
  async function make() {
    setBusy('make'); const { data, error } = await supabase.rpc('create_cookoff', { p_minutes: mins }); setBusy('');
    if (error) return fail(error); router.push(`/compete/cookoff?code=${data.code}`);
  }
  async function join(e) {
    e.preventDefault(); const c = code.trim().toUpperCase(); if (c.length !== 6) { say('Codes are 6 letters.'); return; }
    setBusy('join'); const { error } = await supabase.rpc('join_cookoff', { p_code: c }); setBusy('');
    if (error) return fail(error); router.push(`/compete/cookoff?code=${c}`);
  }
  return (
    <section className="card stack co-card" data-tip="cookoff" aria-labelledby="co-h">
      <div className="row" style={{ justifyContent: 'space-between' }}><h2 id="co-h" style={{ fontSize: 24 }}>Cook Off</h2><span className="chip xp" style={{ border: 0 }}>Live with friends</span></div>
      <div className="row co-times" role="radiogroup" aria-label="Game time">
        {TIMES.map((m) => <button key={m} type="button" role="radio" aria-checked={mins === m} className={`chip ${mins === m ? 'on' : ''}`} onClick={() => setMins(m)}>{m} min</button>)}
      </div>
      <button className="btn wide" onClick={make} disabled={!!busy}><Icon name="plus" size={18} />{busy === 'make' ? 'Making…' : 'Make a game'}</button>
      <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={join}>
        <label htmlFor="co-code" className="sr">Game code</label>
        <input id="co-code" className="input co-code-in" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase())} placeholder="Game code" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
        <button className="btn ghost" type="submit" disabled={!!busy}>{busy === 'join' ? 'Joining…' : 'Join'}</button>
      </form>
    </section>
  );
}
