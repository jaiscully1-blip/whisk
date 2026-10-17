'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import { learnState } from '@/lib/learn/levels';
import useCountdown, { mmss } from './useCountdown';

// Learn: a 3-question quiz. Answers stay on the server until you submit, so there is nothing to peek at.
// 3 out of 3 pays 100 coins (up to 5 paying quizzes a day); any finished quiz keeps your learning streak going.
export default function LearnSheet({ onClose }) {
  const { supabase, profile, refreshProfile, bump } = useWhisk();
  const [quiz, setQuiz] = useState(null);       // { attempt, paid_left, questions }
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState([]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const st = learnState(profile);
  const [nextAt, setNextAt] = useState(null);   // set the moment a quiz is finished, so the countdown starts without waiting for a reload
  const left = useCountdown(nextAt || profile?.learn_next, true);

  async function start() {
    setBusy(true); setErr(''); setRes(null); setI(0); setPicks([]);
    const { data, error } = await supabase.rpc('quiz_start');
    setBusy(false);
    if (error) { setErr(error.message.includes('cooldown') ? 'Your next quiz isn’t ready yet.' : error.message.includes('level') ? 'Learning is turned off for your level. You can change it in Me.' : 'Couldn’t load a quiz. Try again.'); return; }
    setQuiz(data);
  }
  async function submit(all) {
    setBusy(true); setErr('');
    const { data, error } = await supabase.rpc('quiz_submit', { p_attempt: quiz.attempt, p_picks: all });
    setBusy(false);
    if (error) { setErr('Couldn’t check your answers. Try again.'); return; }
    setRes(data); setNextAt(data.next); refreshProfile(); bump();
  }
  function pick(k) {
    const all = [...picks]; all[i] = k; setPicks(all);
  }
  const q = quiz?.questions?.[i];
  const last = i === 2;

  return (
    <div className="scrim" role="presentation" style={{ zIndex: 80 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Learn" data-testid="learn-sheet">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Learn</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        {!quiz && (
          <>
            <div className="card row learn-streak" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <Icon name="learn" size={28} />
              <div style={{ flex: 1 }}>
                <b>{st.streak ? `${st.streak}-day learning streak` : 'No streak yet'}</b>
                <div className="muted" style={{ fontSize: 14 }}>{st.doneToday ? 'You learned today. Come back tomorrow to keep it.' : 'Finish a quiz today to keep it going.'}{st.best > st.streak ? ` Best: ${st.best}.` : ''}</div>
              </div>
            </div>
            <div className="card stack" style={{ gap: 6 }}>
              <b>Daily quiz</b>
              <span className="muted" style={{ fontSize: 14 }}>3 quick questions about cooking and kitchen safety. Get all 3 right for <b>100 coins</b>.</span>
            </div>
            {left > 0
              ? <button type="button" className="btn wide" disabled data-testid="quiz-wait">Next quiz in {mmss(left)}</button>
              : <button type="button" className="btn wide" onClick={start} disabled={busy} data-testid="quiz-start">{busy ? 'Loading…' : 'Start quiz'}</button>}
            <span className="muted" style={{ fontSize: 13, textAlign: 'center' }}>One quiz every hour.</span>
          </>
        )}

        {quiz && !res && q && (
          <>
            <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800, fontSize: 14 }}>
              <span>Question {i + 1} of 3</span>
              <span className="muted"><Coin size={14} /> 100 for 3/3</span>
            </div>
            <div className="quiz-bar" aria-hidden="true"><i style={{ width: `${((i + (picks[i] != null ? 1 : 0)) / 3) * 100}%` }} /></div>
            <h3 style={{ fontSize: 20, margin: '4px 0' }} data-testid="quiz-q">{q.q}</h3>
            <div className="stack" style={{ gap: 8 }}>
              {q.options.map((o, k) => (
                <button key={k} type="button" className="card quiz-opt" aria-pressed={picks[i] === k} onClick={() => pick(k)} data-testid={`quiz-opt-${k}`}>{o}</button>
              ))}
            </div>
            <button type="button" className="btn wide" disabled={picks[i] == null || busy} data-testid="quiz-next" onClick={() => (last ? submit(picks) : setI(i + 1))}>{last ? (busy ? 'Checking…' : 'Check answers') : 'Next'}</button>
          </>
        )}

        {res && (
          <>
            <div className={`card stack quiz-score ${res.perfect ? 'perfect' : ''}`} style={{ alignItems: 'center', textAlign: 'center', gap: 4 }} data-testid="quiz-result">
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 40, fontWeight: 700 }}>{res.correct} / 3</span>
              {res.perfect
                ? (res.coins ? <b className="row" style={{ gap: 6, justifyContent: 'center' }}><Coin size={20} />+{res.coins} coins</b> : <b>Perfect! You have reached today’s limit of paid quizzes.</b>)
                : <b>{res.correct === 2 ? 'So close. Get all 3 for 100 coins.' : 'Keep going. Every quiz teaches something.'}</b>}
              <span className="muted" style={{ fontSize: 14 }}>{res.streak}-day learning streak{res.best > res.streak ? ` · best ${res.best}` : ''}</span>
            </div>
            <div className="stack" style={{ gap: 8 }}>
              {res.results.map((r, k) => {
                const qq = quiz.questions[k], ok = r.picked === r.answer;
                return (
                  <div key={r.id} className={`card stack quiz-rev ${ok ? 'ok' : 'no'}`} style={{ gap: 4 }}>
                    <b>{qq.q}</b>
                    <span style={{ fontSize: 14 }}>{ok ? 'You said: ' : 'You said: '}<b>{qq.options[r.picked]}</b></span>
                    {!ok && <span style={{ fontSize: 14 }}>Right answer: <b>{qq.options[r.answer]}</b></span>}
                    <span className="muted" style={{ fontSize: 14 }}>{r.why}</span>
                  </div>
                );
              })}
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Done</button>
              <button type="button" className="btn" style={{ flex: 1 }} disabled data-testid="quiz-wait">{left > 0 ? `Next quiz in ${mmss(left)}` : 'Next quiz ready'}</button>
            </div>
          </>
        )}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    </div>
  );
}
