'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { usePantry } from './usePantry';
import { postGame } from '@/lib/chatGame';

// Use-It-Up Week: two friends race to rescue food that's about to expire. Start one (and get a 6-character code), or join
// a friend's with their code. The rules and the scoring run on the server.
export const uiuError = (e) => {
  const m = String(e?.message || '');
  if (/function .* does not exist|PGRST202|schema cache/.test(`${e?.code} ${m}`)) return 'Use-It-Up Week isn’t switched on yet. It needs the latest database update.';
  return (m.replace(/^.*?: /, '').replace(/^\w/, (c) => c.toUpperCase())) || 'Something went wrong.';
};
const daysTo = (iso) => Math.round((new Date(`${String(iso).slice(0, 10)}T12:00:00`) - new Date(new Date().toDateString() + ' 12:00:00')) / 864e5);

// Up to 5 of your own items that expire within the next 7 days. Only the names you tick are shared, and only with this friend.
function Picker({ picks, setPicks }) {
  const [pantry] = usePantry();
  const soon = useMemo(() => (pantry || []).filter((p) => p.status !== 'out' && p.expires_on && daysTo(p.expires_on) >= 0 && daysTo(p.expires_on) <= 7).sort((a, b) => String(a.expires_on).localeCompare(String(b.expires_on))), [pantry]);
  const toggle = (n) => setPicks((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : cur.length >= 5 ? cur : [...cur, n]));
  if (pantry && !soon.length) return <p className="muted" style={{ margin: 0 }}>Nothing in your pantry expires in the next 7 days. Items you and your friend both have will still count.</p>;
  return (
    <div className="stack" style={{ gap: 6 }}>
      <span className="lbl">Add up to 5 of your expiring items to the shared list ({picks.length}/5)</span>
      <div className="row" style={{ gap: 6 }}>
        {soon.map((p) => <button key={p.id} type="button" className={`chip ${picks.includes(p.name) ? 'xp' : ''}`} aria-pressed={picks.includes(p.name)} onClick={() => toggle(p.name)} data-testid="uiu-pick">{p.name} · {daysTo(p.expires_on) === 0 ? 'today' : `${daysTo(p.expires_on)}d`}</button>)}
      </div>
      <span className="desc">Your friend only sees the names you tick.</span>
    </div>
  );
}

export default function UseItUpCard({ groupId = null }) {
  const { supabase, say } = useWhisk();
  const router = useRouter();
  const [open, setOpen] = useState(null);   // null | 'start' | 'join'
  const [mode, setMode] = useState('same');
  const [picks, setPicks] = useState([]);
  const [code, setCode] = useState('');
  const [peek, setPeek] = useState(null);
  const [busy, setBusy] = useState('');
  const [mine, setMine] = useState([]);
  useEffect(() => { supabase.rpc('my_uiu').then(({ data }) => setMine(Array.isArray(data) ? data : [])); }, [supabase]);
  const fail = (e) => say(uiuError(e));

  async function create() {
    setBusy('create');
    const { data, error } = await supabase.rpc('create_uiu', { p_mode: mode, p_picks: mode === 'same' ? picks : [] }); setBusy('');
    if (error) return fail(error);
    if (groupId) { const r = await postGame(supabase, groupId, 'uiu', data); if (r.error) say('Your challenge is ready, but it didn’t post to the chat.'); }
    router.push(`/compete/useitup?code=${data}`);
  }
  async function look(e) {
    e.preventDefault(); const c = code.trim().toUpperCase(); if (c.length !== 6) { say('Codes are 6 characters.'); return; }
    setBusy('peek'); const { data, error } = await supabase.rpc('peek_uiu', { p_code: c }); setBusy('');
    if (error) return fail(error); setPeek(data); setPicks([]);
  }
  async function join() {
    setBusy('join'); const c = code.trim().toUpperCase();
    const { error } = await supabase.rpc('join_uiu', { p_code: c, p_picks: peek.mode === 'same' ? picks : [] }); setBusy('');
    if (error) return fail(error); router.push(`/compete/useitup?code=${c}`);
  }
  const reset = (o) => { setOpen(open === o ? null : o); setPeek(null); setPicks([]); };

  return (
    <section className="card stack" data-tip="useitup" aria-labelledby="uiu-h" data-testid="uiu-card">
      <div><h2 id="uiu-h" style={{ fontSize: 22 }}>Use-It-Up Week</h2><span className="desc">Rescue expiring food. 7 days, 500 coins.</span></div>
      {mine.length > 0 && (
        <div className="stack" style={{ gap: 6 }}>
          {mine.map((m) => <Link key={m.code} href={`/compete/useitup?code=${m.code}`} className="row uiu-resume" style={{ flexWrap: 'nowrap', gap: 8 }}><b style={{ flex: 1 }}>{m.status === 'open' ? `Waiting for a friend · ${m.code}` : `Playing${m.with ? ` with ${m.with}` : ''}`}</b><Icon name="chevron" /></Link>)}
        </div>
      )}
      <div className="grid2">
        <button type="button" className={`btn ${open === 'start' ? '' : 'ghost'}`} aria-expanded={open === 'start'} onClick={() => reset('start')} data-testid="uiu-start" style={{ whiteSpace: 'nowrap', padding: '0 8px' }}>Start Challenge</button>
        <button type="button" className={`btn ${open === 'join' ? '' : 'ghost'}`} aria-expanded={open === 'join'} onClick={() => reset('join')} data-testid="uiu-join" style={{ whiteSpace: 'nowrap', padding: '0 8px' }}>Join with Code</button>
      </div>
      {open === 'start' && (
        <>
          <div className="stack" style={{ gap: 8 }} role="radiogroup" aria-label="Mode">
            {[['same', 'Same ingredients', 'One shared list for both of you: items you both have, plus items you each add. Most points wins.'], ['different', 'Different ingredients', 'Each of you is scored on your own expiring food. The higher percent rescued wins.']].map(([id, t, d]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} className="card lv-opt" aria-pressed={mode === id} onClick={() => setMode(id)} data-testid={`uiu-mode-${id}`}><b>{t}</b><span className="muted">{d}</span></button>
            ))}
          </div>
          {mode === 'same' && <Picker picks={picks} setPicks={setPicks} />}
          <button type="button" className="btn wide" onClick={create} disabled={!!busy} data-testid="uiu-create">{busy === 'create' ? 'Creating…' : 'Create Code'}</button>
        </>
      )}
      {open === 'join' && (
        <>
          <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={look}>
            <label htmlFor="uiu-code" className="sr">Challenge code</label>
            <input id="uiu-code" className="input co-code-in" value={code} onChange={(e) => { setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()); setPeek(null); }} placeholder="Challenge code" autoCapitalize="characters" autoComplete="off" data-testid="uiu-code" />
            <button className="btn" type="submit" disabled={!!busy || peek}>{busy === 'peek' ? '…' : 'Next'}</button>
          </form>
          {peek && (
            <>
              <p style={{ margin: 0 }}><b>{peek.host}</b> invited you to <b>{peek.mode === 'same' ? 'Same ingredients' : 'Different ingredients'}</b>.</p>
              {peek.mode === 'same' && <Picker picks={picks} setPicks={setPicks} />}
              <button type="button" className="btn wide" onClick={join} disabled={!!busy} data-testid="uiu-join-go">{busy === 'join' ? 'Joining…' : 'Join challenge'}</button>
            </>
          )}
        </>
      )}
    </section>
  );
}
