'use client';
import { LEVELS } from '@/lib/learn/levels';

// "How well do you cook?" Shown the first time Yoke opens, and any time from Me. The first three levels get the Learn button.
export default function LevelPicker({ current, onPick, onLater, first }) {
  return (
    <div className="scrim" role="presentation" style={{ zIndex: 80 }} onClick={(e) => { if (e.target === e.currentTarget) onLater(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Your cooking level" data-testid="level-picker">
        <h2 style={{ fontSize: 26 }}>{first ? 'How well do you cook?' : 'Your cooking level'}</h2>
        <p className="muted" style={{ margin: 0 }}>Pick the closest one. You can change it any time in Me.</p>
        <div className="stack" style={{ gap: 8 }}>
          {LEVELS.map((l) => (
            <button key={l.id} type="button" className="card lv-opt" aria-pressed={current === l.id} onClick={() => onPick(l.id)}>
              <b>{l.label}</b><span className="muted">{l.blurb}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost" onClick={onLater}>{first ? 'Maybe later' : 'Close'}</button>
      </div>
    </div>
  );
}
