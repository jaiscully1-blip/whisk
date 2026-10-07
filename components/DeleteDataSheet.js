'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Delete my data: every photo, then the game itself (profile, pantry, meals, coins, outfits …). Can't be undone.
export default function DeleteDataSheet({ onClose }) {
  const { supabase, profile } = useWhisk();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function go() {
    setBusy(true); setErr('');
    try {
      // photos first: Supabase only deletes files through Storage, not from the database
      for (let i = 0; i < 50; i++) {
        const { data, error } = await supabase.storage.from('meal-photos').list(profile.id, { limit: 100 });
        if (error) throw error;
        if (!data?.length) break;
        const { error: rmErr } = await supabase.storage.from('meal-photos').remove(data.map((f) => `${profile.id}/${f.name}`));
        if (rmErr) throw rmErr;
      }
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      await supabase.auth.signOut().catch(() => {});
      window.location.replace('/login?deleted=1');
    } catch {
      setErr('Something went wrong. Nothing was lost: try again.'); setBusy(false);
    }
  }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Delete my data">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Delete my data</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} disabled={busy} aria-label="Close"><Icon name="x" /></button>
        </div>
        <p style={{ margin: 0 }}>This deletes your whole game from Whisk’s servers: your pantry, meals and plate photos, coins, outfits, streak and passport. <b>It can’t be undone.</b></p>
        <label className="lbl" htmlFor="del-type">Type DELETE to confirm</label>
        <input id="del-type" className="input" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="DELETE" />
        {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
        <button className="btn wide danger" onClick={go} disabled={busy || typed.trim().toUpperCase() !== 'DELETE'}>{busy ? 'Deleting…' : 'Delete everything'}</button>
      </div>
    </div>
  );
}
