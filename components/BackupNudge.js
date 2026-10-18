'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import BackupSheet from './BackupSheet';

// In the Shop: "Back up your game", shown until the game is backed up (then the account is no longer anonymous and it disappears for good).
export default function BackupNudge() {
  const { account, supabase } = useWhisk();
  const [open, setOpen] = useState(false);
  if (!account?.anon) return open ? <BackupSheet supabase={supabase} onClose={() => setOpen(false)} /> : null;
  return (
    <>
      <div className="card backup-nudge" role="region" aria-label="Back up your game">
        <Icon name="shield" size={26} />
        <span><b>Back up your game</b><span className="desc">So your coins, streak and kitchen are safe if you change or lose your phone.</span></span>
        <button className="btn sm" onClick={() => setOpen(true)}>Back up</button>
      </div>
      {open && <BackupSheet supabase={supabase} onClose={() => setOpen(false)} />}
    </>
  );
}
