'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin, Flame } from './Icon';
import { postGame } from '@/lib/chatGame';

// Guess the Cook: a friend's shared plate with the name hidden. Guess who cooked it. Five a day, coins for right guesses.
// The server picks the plate, checks the guess and pays; this card only asks and shows.
const COLORS = ['#FF6B57', '#8B5CF6', '#1CB0F6', '#58B030', '#FF9600', '#FF4D7E'];
const color = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
const errText = (e) => String(e?.message || 'Something went wrong').replace(/^\w/, (x) => x.toUpperCase());

export default function GuessCook({ groupId = null }) {
  const { supabase, say, refreshProfile } = useWhisk();
  const [round, setRound] = useState(null);
  const [board, setBoard] = useState(null);
  const [photo, setPhoto] = useState('');
  const [reveal, setReveal] = useState(null);   // the answer to the plate just guessed
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [r, b] = await Promise.all([supabase.rpc('get_guess_round'), supabase.rpc('guess_board')]);
    if (r.error) { setRound({ state: 'error' }); return; }
    setRound(r.data); setBoard(Array.isArray(b.data) ? b.data : []);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const path = round?.plate?.photo;
  useEffect(() => {
    let live = true; setPhoto('');
    if (!path) return;
    supabase.storage.from('meal-photos').createSignedUrl(path, 3600).then(({ data }) => { if (live && data?.signedUrl) setPhoto(data.signedUrl); });
    return () => { live = false; };
  }, [supabase, path]);

  async function pick(o) {
    if (busy || reveal) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('guess_cook', { p_meal: round.plate.id, p_guess: o.id });
    setBusy(false);
    if (error) { say(errText(error)); load(); return; }
    try { navigator.vibrate?.(data.correct ? [20, 40, 20] : 40); } catch {}
    setReveal({ ...data, guessed: o.name, title: round.plate.title });
    if (data.coins > 0) refreshProfile();
  }
  async function share() {
    setBusy(true); const r = await postGame(supabase, groupId, 'guess'); setBusy(false);
    say(r.error ? 'Couldn’t post that.' : 'Score posted to the chat');
  }
  async function next() { setBusy(true); await load(); setReveal(null); setBusy(false); }

  if (!round) return <section className="card gtc" data-testid="gtc-card"><span className="eyebrow">Guess the Cook</span><p className="muted" style={{ margin: 0 }}>Loading…</p></section>;
  if (round.state === 'error') return null;

  return (
    <section className="card stack gtc" style={{ gap: 10 }} data-testid="gtc-card" aria-label="Guess the Cook">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Guess the Cook</h2>
        <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          {round.run > 1 && <span className="chip xp" data-testid="gtc-run"><Flame />{round.run} in a row</span>}
          <span className="chip" data-testid="gtc-count">{Math.min(5, (reveal ? reveal.played : round.played))}/5 today</span>
        </span>
      </div>

      {round.state === 'need_friends' && <p className="desc" style={{ margin: 0 }} data-testid="gtc-need">Add two friends to play. Guess who cooked their plates.</p>}
      {round.state === 'no_plates' && <p className="desc" style={{ margin: 0 }} data-testid="gtc-none">No new plates yet. Friends’ shared plates show up here.</p>}

      {round.state === 'play' && (
        <>
          {photo ? <img className="gtc-img" src={photo} alt="A friend’s plate. Who cooked it?" decoding="async" /> : <div className="gtc-img" aria-hidden="true" />}
          <div className="stack" style={{ gap: 2 }}>
            <b style={{ fontSize: 18 }} data-testid="gtc-title">{round.plate.title}</b>
            {round.plate.cuisine && <span className="desc">{round.plate.cuisine}</span>}
          </div>
          {!reveal ? (
            <>
              <span className="lbl">Who cooked this?</span>
              <div className="gtc-opts">
                {round.options.map((o) => (
                  <button key={o.id} type="button" className="btn ghost gtc-opt" disabled={busy} onClick={() => pick(o)} data-testid="gtc-opt">
                    <span className="post-av sm" style={{ background: color(o.name) }} aria-hidden="true">{o.name.slice(0, 1).toUpperCase()}</span>{o.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={`gtc-reveal ${reveal.correct ? 'yes' : 'no'}`} role="status" data-testid="gtc-reveal">
              <b>{reveal.correct ? `Yes! ${reveal.cook_name} cooked it.` : `Not quite. It was ${reveal.cook_name}.`}</b>
              {reveal.coins > 0 && <span className="row" style={{ gap: 5 }}><Coin size={18} />+{reveal.coins} coins{reveal.perfect ? ' · five out of five!' : ''}</span>}
              <button type="button" className="btn wide" onClick={next} data-testid="gtc-next">{reveal.played >= 5 ? 'See today’s score' : 'Next plate'}</button>
            </div>
          )}
        </>
      )}

      {round.state === 'done' && (
        <div className="gtc-reveal done" data-testid="gtc-done">
          <b>{round.perfect ? 'Five out of five. You know your friends.' : `${round.correct} out of 5 today.`}</b>
          <span className="desc">New plates tomorrow.</span>
          {groupId && <button type="button" className="btn ghost wide" onClick={share} disabled={busy} data-testid="gtc-share">Post my score to the chat</button>}
        </div>
      )}

      {board && board.length > 1 && (
        <div className="stack" style={{ gap: 4 }} data-testid="gtc-board">
          <span className="eyebrow">This week’s best guessers</span>
          {board.map((b, i) => (
            <div key={`${b.name}-${i}`} className={`gtc-row ${b.me ? 'me' : ''}`}>
              <span className="gtc-rank">{i + 1}</span>
              <span className="post-av sm" style={{ background: color(b.name) }} aria-hidden="true">{b.name.slice(0, 1).toUpperCase()}</span>
              <b style={{ flex: 1 }}>{b.me ? 'You' : b.name}</b>
              <span>{b.right} right</span><span className="desc">of {b.played}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
