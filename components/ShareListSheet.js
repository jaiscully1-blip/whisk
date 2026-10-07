'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Share the shopping list: one secret link. Whoever opens it sees the list and can tick things off (no app, no
// account). Make a new link to cut off the old one, or turn it off.
export default function ShareListSheet({ onClose }) {
  const { supabase, say } = useWhisk();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const make = async (fresh = false) => {
    setBusy(true);
    const { data, error } = await supabase.rpc('share_my_list', { p_new: fresh });
    setBusy(false);
    if (error || !data) { say('Couldn’t make a link.'); return; }
    setUrl(`${window.location.origin}/list/${data}`);
    if (fresh) say('New link made · the old one stopped working');
  };
  useEffect(() => { make(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function share() {
    try { if (navigator.share) { await navigator.share({ title: 'Our shopping list', text: 'Here’s the shopping list. Tick things off as you get them:', url }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(url); say('Link copied'); } catch { say('Copy the link above'); }
  }
  async function off() {
    await supabase.rpc('stop_sharing_list'); say('Link turned off'); onClose?.();
  }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Share your list">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Share your list</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <p className="desc" style={{ margin: 0 }}>Anyone with this link can see your shopping list and tick things off as they shop. They don’t need Whisk.</p>
        <input className="input mono" readOnly value={url || 'Making a link…'} aria-label="Share link" onFocus={(e) => e.target.select()} />
        <button className="btn wide" onClick={share} disabled={!url || busy}><Icon name="share" size={18} />Send the link</button>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="linkbtn" onClick={() => make(true)} disabled={busy}>Make a new link</button>
          <button type="button" className="linkbtn" style={{ color: 'var(--bad)' }} onClick={off} disabled={busy}>Turn the link off</button>
        </div>
      </div>
    </div>
  );
}
