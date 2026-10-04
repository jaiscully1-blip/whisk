'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';

// First-run tour: one card per area of the app. "Next" flips the card over to the next area and moves the app
// behind it there, with that tab lit up in the bottom bar. Skip or finish marks it done on the account.
const STEPS = [
  { href: '/cook', icon: 'cook', color: '#4E9A2F', title: 'Hi, I’m Whisk!', body: 'I’ll show you around in 30 seconds. Tap Next to flip through the kitchen.', points: [] },
  { href: '/cook', icon: 'search', color: '#2F6AE6', title: 'Cook', body: 'Your home base. Every time you open Whisk, you start here.',
    points: ['Search any dish and get cooking videos', 'What can I make? lists recipes your pantry covers', 'Tap a step timer once to start, twice to stop'] },
  { href: '/pantry', icon: 'pantry', color: '#E8913A', title: 'Pantry', body: 'Tell Whisk what’s in your kitchen.',
    points: ['Add groceries or scan a receipt', 'Frozen meat gets a defrost reminder', 'Shopping list and saved recipes live here too'] },
  { href: '/home', icon: 'home', color: '#B5651D', title: 'Almost ready', body: 'Recipes you’re only a few ingredients away from.',
    points: ['Closest first: 1 item away, then 2, 3…', 'Add what’s missing to your list in one tap', 'Pull down to refresh'] },
  { href: '/compete', icon: 'compete', color: '#D32F2F', title: 'Compete', body: 'Cook to earn XP and coins.',
    points: ['Cuisine bingo resets every 5 days', 'A daily quest for a quick win', 'Weekly challenges pay coins'] },
  { href: '/me', icon: 'me', color: '#7B1FA2', title: 'Me', body: 'Make Whisk yours and collect the world.',
    points: ['Dress Whisk from the shop with your coins', 'Stamp all 193 countries in your passport', 'Settings: text size, night mode, privacy'] },
  { href: '/cook', icon: 'check', color: '#4E9A2F', title: 'You’re all set!', body: 'Add a few things to your pantry, then see what you can make. Happy cooking!', points: [] }
];

export default function Tutorial({ onDone }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);     // the step whose content is on the card right now
  const [phase, setPhase] = useState('in');  // in | out (flipping away) | back (flipping in)
  const timer = useRef(0);
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s = STEPS[shown];
  const last = i === STEPS.length - 1;

  useEffect(() => { router.push(STEPS[i].href); }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('tour-hot', a.getAttribute('href') === STEPS[i].href && i > 0 && i < STEPS.length - 1));
    document.querySelector('.nav')?.classList.add('tour');
    return () => { document.querySelector('.nav')?.classList.remove('tour'); document.querySelectorAll('.nav a').forEach((a) => a.classList.remove('tour-hot')); };
  }, [i]);
  useEffect(() => () => clearTimeout(timer.current), []);

  function go(n) {
    if (n < 0 || n >= STEPS.length || phase === 'out') return;
    try { navigator.vibrate?.(8); } catch {}
    setI(n);
    if (reduce) { setShown(n); return; }
    setPhase(n > i ? 'out' : 'out-back');
    timer.current = setTimeout(() => { setShown(n); setPhase(n > i ? 'back' : 'back-rev'); timer.current = setTimeout(() => setPhase('in'), 320); }, 260);
  }
  const finish = () => { router.push('/cook'); onDone(); };

  return (
    <div className="tour-scrim" role="presentation">
      <div className="tour-stage">
        <div className={`tour-card ${phase}`} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body" style={{ '--tc': s.color }}>
          <div className="tour-top">
            <span className="tour-step">{shown + 1} / {STEPS.length}</span>
            {!last && <button className="tour-skip" onClick={finish}>Skip</button>}
          </div>
          <div className="tour-badge" aria-hidden="true">
            {shown === 0 ? <img src="/icon.svg" alt="" width="84" height="84" /> : <Icon name={s.icon} size={44} stroke={2.2} />}
            <i /><i /><i />
          </div>
          <h2 id="tour-title">{s.title}</h2>
          <p id="tour-body">{s.body}</p>
          {s.points.length > 0 && <ul className="tour-points">{s.points.map((p) => <li key={p}><Icon name="check" size={16} />{p}</li>)}</ul>}
          <div className="tour-dots" aria-hidden="true">{STEPS.map((_, k) => <span key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}</div>
          <div className="tour-actions">
            {i > 0 && !last && <button className="btn ghost" onClick={() => go(i - 1)}>Back</button>}
            <button className="tour-next" onClick={() => (last ? finish() : go(i + 1))} autoFocus>
              <span>{last ? 'Let’s cook!' : i === 0 ? 'Show me' : 'Next'}</span>{!last && <Icon name="chevron" size={20} stroke={3} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
