'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWhisk } from '@/components/AppShell';
import { useLive } from '@/lib/live';
import Icon, { Coin } from '@/components/Icon';
import { uiuError } from '@/components/UseItUpCard';

// One Use-It-Up Week match: waiting for a friend → "Week starts in 3, 2, 1" → the week (your list, the score, submit a dish)
// → results with a one-tap rematch. Scores, dates and winners all come from the server; this screen only asks and shows.
export default function Page() { return <Suspense fallback={null}><Match /></Suspense>; }

const daysLeft = (ms) => Math.max(0, Math.ceil(ms / 864e5));
const fmtDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

function Match() {
  const sp = useSearchParams(); const router = useRouter();
  const code = (sp.get('code') || '').toUpperCase();
  const { supabase, say, refreshProfile } = useWhisk();
  const [g, setG] = useState(null);
  const [err, setErr] = useState('');
  const off = useRef(0);   // server clock minus this phone's clock
  const [tick, setTick] = useState(0);
  const [meals, setMeals] = useState([]);
  const [mealId, setMealId] = useState('');
  const [used, setUsed] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_uiu', { p_code: code });
    if (error) { setErr(uiuError(error)); return; }
    off.current = new Date(data.now).getTime() - Date.now(); setG(data); setErr('');
  }, [supabase, code]);
  const { ping, live } = useLive(supabase, code ? `game:${code}` : null, () => { load(); });
  useEffect(() => { load(); const t = setInterval(load, live ? 20000 : 6000); return () => clearInterval(t); }, [load, live]);
  useEffect(() => { if (live && g) ping(); }, [live, !!g]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 250); return () => clearInterval(t); }, []);
  const now = Date.now() + off.current; void tick;
  const started = g?.started_at ? new Date(g.started_at).getTime() : 0, ends = g?.ends_at ? new Date(g.ends_at).getTime() : 0;
  const counting = g?.status === 'live' && now < started;
  useEffect(() => { if (g?.status === 'done') refreshProfile(); }, [g?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  // meals cooked since the week started, to pick a dish from
  useEffect(() => {
    if (g?.status !== 'live' || !g.started_at) return;
    supabase.from('meals').select('id, title, cooked_at').gte('cooked_at', g.started_at).order('cooked_at', { ascending: false }).limit(30).then(({ data }) => setMeals(data || []));
  }, [supabase, g?.status, g?.started_at, g?.me?.dishes]);

  const scoreText = (s) => (g.mode === 'same' ? `${Number(s)} pt${Number(s) === 1 ? '' : 's'}` : `${Number(s)}%`);
  const toggle = (n) => setUsed((u) => (u.includes(n) ? u.filter((x) => x !== n) : [...u, n]));
  async function submit() {
    setBusy(true); setNote('');
    const { data, error } = await supabase.rpc('submit_uiu_dish', { p_code: code, p_meal_id: mealId, p_items: used }); setBusy(false);
    if (error) { say(uiuError(error)); return; }
    setUsed([]); setMealId('');
    if (data.check_these?.length) setNote(`Check ${data.check_these.join(', ')}: past its use-by date, so it didn’t score. Please check it before eating.`);
    say(`Rescued ${data.items_scored} ${data.items_scored === 1 ? 'item' : 'items'}`); load(); ping();
  }
  async function finish() {
    if (!window.confirm('Finish now? You can’t add more dishes after this.')) return;
    const { error } = await supabase.rpc('finish_uiu', { p_code: code }); if (error) { say(uiuError(error)); return; } load(); ping();
  }
  async function cancel() { await supabase.rpc('cancel_uiu', { p_code: code }); ping(); router.push('/compete/friends'); }
  async function rematch() {
    if (g.rematch_code) { await joinRematch(g.rematch_code); return; }
    const { data, error } = await supabase.rpc('rematch_uiu', { p_code: code }); if (error) { say(uiuError(error)); return; }
    ping();
    router.push(`/compete/useitup?code=${data}`);
  }
  async function joinRematch(c) {
    const { error } = await supabase.rpc('join_uiu', { p_code: c, p_picks: [] });
    if (error && !/own code/.test(error.message)) { say(uiuError(error)); return; }
    router.push(`/compete/useitup?code=${c}`);
  }
  const share = async () => { const text = `Join my Yoke Use-It-Up Week! Code: ${code}`; try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); say('Copied'); } } catch {} };
  const myRematch = g?.rematch_code && g.rematch_code;
  const expired = useMemo(() => (g?.items || []).filter((i) => i.expired), [g]);

  if (err) return <div className="stack"><Link href="/compete/friends" className="btn ghost sm" style={{ alignSelf: 'flex-start' }}><Icon name="chevron" size={16} style={{ transform: 'rotate(180deg)' }} />Back</Link><p className="err" role="alert">{err}</p></div>;
  if (!g) return <p className="muted">Loading…</p>;

  return (
    <div className="stack" data-testid="uiu-page">
      <div className="page-title"><h1>Use-It-Up</h1><span className="muted">{g.mode === 'same' ? 'Same ingredients' : 'Different ingredients'}</span></div>

      {g.status === 'open' && (
        <div className="card stack co-code" aria-label={`Challenge code ${code.split('').join(' ')}`} data-testid="uiu-wait">
          <span className="desc">Send this code to a friend. The week starts when they join.</span>
          <b style={{ fontSize: 40, letterSpacing: 6 }} data-testid="uiu-code-show">{code}</b>
          <button className="btn ghost sm" onClick={share}><Icon name="share" size={16} />Share code</button>
          {g.host && <button className="btn ghost wide" onClick={cancel}>Cancel challenge</button>}
        </div>
      )}
      {g.status === 'cancelled' && <div className="card"><b>This challenge was cancelled.</b></div>}

      {counting && (
        <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }} role="status" data-testid="uiu-countdown">
          <span className="desc">Week starts in</span>
          <b style={{ fontSize: 72, fontFamily: 'var(--f-display)' }}>{Math.max(1, Math.ceil((started - now) / 1000))}</b>
        </div>
      )}

      {g.status === 'live' && !counting && (
        <>
          <div className="grid2" data-testid="uiu-score">
            {[g.me, g.opponent].map((p, i) => (
              <div key={i} className="card stack" style={{ gap: 2, alignItems: 'center', textAlign: 'center' }}>
                <span className="eyebrow">{i === 0 ? 'You' : p?.name}</span>
                <b style={{ fontSize: 30 }}>{scoreText(p.score)}</b>
                <span className="desc">{p.dishes} {p.dishes === 1 ? 'dish' : 'dishes'} · {p.items_total} items{p.finished ? ' · done' : ''}</span>
              </div>
            ))}
          </div>
          <span className="muted" style={{ fontWeight: 800 }} data-testid="uiu-days">{daysLeft(ends - now)} {daysLeft(ends - now) === 1 ? 'day' : 'days'} left{g.me.finished ? ' · you finished, waiting for your friend' : ''}</span>
          {expired.length > 0 && <p className="import-note" role="status" data-testid="uiu-check">Check {expired.map((i) => i.name).join(', ')}: past the use-by date. It won’t score. Make sure it’s still safe before you eat it.</p>}
          <div className="card stack">
            <h2 style={{ fontSize: 20, margin: 0 }}>{g.mode === 'same' ? 'Shared list' : 'Your list'}</h2>
            <ul className="uiu-items">
              {g.items.map((i) => (
                <li key={i.id} className={i.used ? 'used' : i.expired ? 'late' : ''}>
                  <span style={{ flex: 1 }}>{i.name}</span>
                  <span className="desc">{i.expired ? 'past use-by' : `use by ${fmtDay(i.expires_on)}`}{g.mode === 'same' ? ` · ${i.pts} pt${i.pts > 1 ? 's' : ''}` : ''}</span>
                  {i.used && <span className="chip have"><Icon name="check" size={12} />Rescued</span>}
                </li>
              ))}
            </ul>
          </div>
          {!g.me.finished && (
            <div className="card stack" data-testid="uiu-submit">
              <h2 style={{ fontSize: 20, margin: 0 }}>Add a dish</h2>
              {meals.length === 0
                ? <p className="muted" style={{ margin: 0 }}>Cook a meal and log it with a photo, then come back to add it here.</p>
                : <>
                  <label className="lbl" htmlFor="uiu-meal">Which meal?</label>
                  <select id="uiu-meal" className="input" value={mealId} onChange={(e) => setMealId(e.target.value)} data-testid="uiu-meal">
                    <option value="">Choose a meal you cooked this week</option>
                    {meals.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                  <span className="lbl">Which of the items did it use?</span>
                  <div className="row" style={{ gap: 6 }}>
                    {g.items.filter((i) => !i.used).map((i) => <button key={i.id} type="button" className={`chip ${used.includes(i.name) ? 'xp' : ''}`} aria-pressed={used.includes(i.name)} onClick={() => toggle(i.name)} data-testid="uiu-use">{i.name}</button>)}
                  </div>
                  <button type="button" className="btn wide" disabled={busy || !mealId || !used.length} onClick={submit} data-testid="uiu-send">{busy ? 'Adding…' : 'Add dish'}</button>
                </>}
              {note && <p className="import-note" role="status">{note}</p>}
              <button type="button" className="btn ghost wide" onClick={finish} data-testid="uiu-finish">I’m finished</button>
            </div>
          )}
        </>
      )}

      {g.status === 'done' && (
        <div className="card stack" style={{ alignItems: 'center', textAlign: 'center' }} data-testid="uiu-results">
          <span className="eyebrow">Final</span>
          <h2 style={{ fontSize: 30 }}>{g.winner === 'me' ? 'You won!' : `${g.opponent?.name || 'Your friend'} won`}</h2>
          <div className="grid2" style={{ width: '100%' }}>
            {[g.me, g.opponent].map((p, i) => (
              <div key={i} className="card stack" style={{ gap: 2, alignItems: 'center' }}>
                <span className="eyebrow">{i === 0 ? `${p.name} (you)` : p.name}</span><b style={{ fontSize: 28 }}>{scoreText(p.score)}</b><span className="desc">{p.dishes} {p.dishes === 1 ? 'dish' : 'dishes'}</span>
              </div>
            ))}
          </div>
          {g.coins > 0
            ? <b className="row" style={{ gap: 6, justifyContent: 'center' }}><Coin size={20} />{g.winner === 'me' ? `+${g.coins} coins` : `${g.opponent?.name || 'Your friend'} won ${g.coins} coins`}</b>
            : <span className="muted">No coins this time: nobody added a dish.</span>}
          <button type="button" className="btn wide" onClick={rematch} data-testid="uiu-rematch">{myRematch ? 'Join rematch' : 'Rematch'}</button>
          <Link href="/compete/friends" className="btn ghost wide">Back to friends</Link>
        </div>
      )}
    </div>
  );
}
