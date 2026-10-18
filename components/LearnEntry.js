'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import LearnSheet from './LearnSheet';
import Icon from './Icon';
import { learns, learnState } from '@/lib/learn/levels';
import useCountdown, { mmss } from './useCountdown';

// Apron patches: one is stitched on for each day of your best learning streak (1, 2, 3, 5, 7, 10).
const PATCHES = [
  { at: 1, bg: '#9BE37A', shape: 'circle', art: <path d="M5 19L18 6l5 5-9 11zM6 22l7-4" fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinejoin="round" /> },                 // knife
  { at: 2, bg: '#FFD37A', shape: 'square', art: <g fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinejoin="round"><path d="M9 7h10l-1 15H10z" /><path d="M11 12h6" /></g> },   // salt
  { at: 3, bg: '#7FD8F0', shape: 'circle', art: <g fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinecap="round"><circle cx="13" cy="15" r="7" /><path d="M20 12l5-3" /></g> }, // pan
  { at: 5, bg: '#FF8FB3', shape: 'square', art: <g fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinecap="round"><path d="M14 4v10M10 6c-2 6 0 9 4 9s6-3 4-9M14 15v9" /></g> }, // whisk
  { at: 7, bg: '#FF9F43', shape: 'circle', art: <g fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinejoin="round"><path d="M14 4c2 4 5 6 5 10a5 5 0 0 1-10 0c0-4 3-6 5-10z" /></g> },       // flame/pepper
  { at: 10, bg: '#C9B6FF', shape: 'square', art: <g fill="none" stroke="#1d1a1a" strokeWidth="2.2" strokeLinejoin="round"><path d="M8 20v-6a5 5 0 0 1 3-9 4 4 0 0 1 6 0 5 5 0 0 1 3 9v6zM8 17h12" /></g> }, // chef hat
];

// The Learn card on the Me tab. Only shown for Beginner, Novice and Advanced beginner. Lessons open only when it is pressed.
export default function LearnEntry() {
  const { profile } = useWhisk();
  const [open, setOpen] = useState(false);
  const left = useCountdown(profile?.learn_next);
  if (!learns(profile?.skill_level)) return null;
  const st = learnState(profile);
  const best = Math.max(st.best || 0, st.streak || 0);
  const got = PATCHES.filter((p) => best >= p.at).length;
  return (
    <>
      <button type="button" className="card learn-card" onClick={() => setOpen(true)} data-testid="learn-btn" data-tip="learn" aria-label={`Learn. ${got} of ${PATCHES.length} patches`}>
        <span className="lc-top">
          <span className="lc-ico" aria-hidden="true"><Icon name="learn" size={24} /></span>
          <span className="lc-txt">
            <b className="lc-title">Learn</b>
            <span className="lc-sub">{left > 0 ? `Next quiz in ${mmss(left)}` : st.streak ? `${st.streak}-day streak · quiz ready` : 'Quiz: win 100 coins'}</span>
          </span>
          <Icon name="chevron" />
        </span>
        <span className="la-patches" aria-hidden="true">
          {PATCHES.map((p) => (
            <span key={p.at} className={`la-patch ${p.shape} ${best >= p.at ? 'on' : ''}`} style={best >= p.at ? { background: p.bg } : undefined}>
              {best >= p.at ? <svg viewBox="0 0 28 28" width="24" height="24">{p.art}</svg> : <i>{p.at}d</i>}
            </span>
          ))}
        </span>
      </button>
      {open && <LearnSheet onClose={() => setOpen(false)} />}
    </>
  );
}
