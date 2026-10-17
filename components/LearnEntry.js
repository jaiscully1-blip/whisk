'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import LearnSheet from './LearnSheet';
import { learns, learnState } from '@/lib/learn/levels';

// The Learn button on the Cook tab. Only shown for Beginner, Novice and Advanced beginner. Lessons open only when it is pressed.
export default function LearnEntry() {
  const { profile } = useWhisk();
  const [open, setOpen] = useState(false);
  if (!learns(profile?.skill_level)) return null;
  const st = learnState(profile);
  return (
    <>
      <button type="button" className="card row learn-btn" onClick={() => setOpen(true)} data-testid="learn-btn" data-tip="learn">
        <Icon name="learn" size={24} /><b style={{ flex: 1, textAlign: 'left' }}>Learn</b>
        <span className="desc">{st.streak ? `${st.streak}-day streak` : 'Quiz: win 100 coins'}</span><Icon name="chevron" />
      </button>
      {open && <LearnSheet onClose={() => setOpen(false)} />}
    </>
  );
}
