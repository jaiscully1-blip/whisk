'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Friends → Cook Off: start a game (pick the time) or join a friend's with their code.
const TIMES = [15, 30, 45, 60];
export default function CookOffCard() {
  const { supabase, say } = useWhisk();
  const router = useRouter();
  const [mins, setMins] = useState(30);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [open, setOpen] = useState(null);   // null | 'make' | 'join'
  const fail = (e) => say(String(e?.message || 'Something went wrong.').replace(/^\w/, (c) => c.toUpperCase()));
  async function make() {
    setBusy('make'); const { data, error } = await supabase.rpc('create_cookoff', { p_minutes: mins }); setBusy('');
    if (error) return fail(error);
    fetch('/api/push/cookoff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: data.code }) }).catch(() => {});   // tell friends who turned notifications on
    router.push(`/compete/cookoff?code=${data.code}`);
  }
  async function join(e) {
    e.preventDefault(); const c = code.trim().toUpperCase(); if (c.length !== 6) { say('Codes are 6 letters.'); return; }
    setBusy('join'); const { error } = await supabase.rpc('join_cookoff', { p_code: c }); setBusy('');
    if (error) return fail(error); router.push(`/compete/cookoff?code=${c}`);
  }
  // Two buttons to start with; each opens just what it needs (pick a time, or type a code).
  return (
    <section className="card stack co-card" data-tip="cookoff" aria-labelledby="co-h">
      <div><h2 id="co-h" style={{ fontSize: 22 }}>Cook Off</h2><span className="desc">Everyone gets a recipe, cooks against the same clock, then votes.</span></div>
      <div className="grid2">
        <button type="button" className={`btn ${open === 'make' ? '' : 'ghost'}`} aria-expanded={open === 'make'} onClick={() => setOpen(open === 'make' ? null : 'make')}><Icon name="plus" size={18} />New game</button>
        <button type="button" className={`btn ${open === 'join' ? '' : 'ghost'}`} aria-expanded={open === 'join'} onClick={() => setOpen(open === 'join' ? null : 'join')}>Join a game</button>
      </div>
      {open === 'make' && (
        <>
          <div className="row co-times" role="radiogroup" aria-label="Game time">
            {TIMES.map((m) => <button key={m} type="button" role="radio" aria-checked={mins === m} className={`chip ${mins === m ? 'on' : ''}`} onClick={() => setMins(m)}>{m} min</button>)}
          </div>
          <button className="btn wide" onClick={make} disabled={!!busy}>{busy === 'make' ? 'Making…' : `Make a ${mins}-minute game`}</button>
        </>
      )}
      {open === 'join' && (
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={join}>
          <label htmlFor="co-code" className="sr">Game code</label>
          <input id="co-code" className="input co-code-in" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase())} placeholder="Game code" autoCapitalize="characters" autoComplete="off" spellCheck={false} autoFocus />
          <button className="btn" type="submit" disabled={!!busy}>{busy === 'join' ? 'Joining…' : 'Join'}</button>
        </form>
      )}
    </section>
  );
}
