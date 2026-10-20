'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import { load } from '@/lib/cache';
import { fetchFriends } from './tabData';

// A small pop-up for adding a friend by their 6-letter code, right where you are (no new page).
export default function AddFriendSheet({ onClose, onAdded }) {
  const { supabase, say, t } = useWhisk();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  async function add(e) {
    e.preventDefault(); const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(c)) { say(t('Friend codes are 6 letters.')); return; }
    setBusy(true); const { data, error } = await supabase.rpc('add_friend', { p_code: c }); setBusy(false);
    if (error) { say(String(error.message || 'Couldn’t add that code.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    say(data === 'friends' ? 'You’re friends now! Start a shared grocery list from Your friends.' : 'Request sent · they’ll see it on Compete');
    try { load('friends', () => fetchFriends(supabase), -1); } catch { /* the list refreshes by itself soon */ }
    onAdded?.(data, c); onClose();
  }
  return (
    <div className="scrim top" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label={t('Add a friend')} onSubmit={add}>
        <h2 style={{ fontSize: 24 }}>{t('Add a friend')}</h2>
        <label htmlFor="fr-code" className="desc">{t('Their 6-letter code')}</label>
        <input id="fr-code" className="input co-code-in" data-testid="add-friend-code" maxLength={6} autoCapitalize="characters" autoComplete="off" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
        <button className="btn wide" type="submit" disabled={busy}>{t('Add')}</button>
        <button className="btn ghost wide" type="button" onClick={onClose}>{t('Cancel')}</button>
      </form>
    </div>
  );
}
