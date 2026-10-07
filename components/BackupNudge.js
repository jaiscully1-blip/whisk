'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import BackupSheet from './BackupSheet';
import { dayNumber } from '@/lib/game';

// From the 3rd day of play, a small card on Cook: "Back up your game". "Later" hides it for a week.
export default function BackupNudge() {
  const { account, profile, ui, setUi, supabase } = useWhisk();
  const [open, setOpen] = useState(false);
  const later = ui.backupLater && Date.now() - ui.backupLater < 7 * 864e5;
  if (!account?.anon || dayNumber(profile) < 3 || later) return open ? <BackupSheet supabase={supabase} onClose={() => setOpen(false)} /> : null;
  return (
    <>
      <div className="card backup-nudge" role="region" aria-label="Back up your game">
        <Icon name="shield" size={26} />
        <span><b>Back up your game</b><span className="desc">So you never lose your streak if you change phones.</span></span>
        <button className="btn sm" onClick={() => setOpen(true)}>Back up</button>
        <button className="btn ghost sm" style={{ border: 0, width: 36, padding: 0 }} aria-label="Later" onClick={() => setUi({ backupLater: Date.now() })}><Icon name="x" size={18} /></button>
      </div>
      {open && <BackupSheet supabase={supabase} onClose={() => setOpen(false)} />}
    </>
  );
}
