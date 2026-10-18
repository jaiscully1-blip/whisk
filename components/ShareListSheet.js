'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Share the shopping list: send a secret link, or put it on a group chat's shared list (a default chat can be set).
export default function ShareListSheet({ onClose }) {
  const { supabase, say, ui, setUi } = useWhisk();
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
  const [chats, setChats] = useState(null);
  const [pick, setPick] = useState('');
  useEffect(() => {
    supabase.rpc('get_chats').then(({ data }) => {
      const l = data || []; setChats(l);
      setPick(l.some((c) => c.id === ui.defaultChat) ? ui.defaultChat : (l[0]?.id || ''));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const isDefault = !!pick && ui.defaultChat === pick;
  const chat = (chats || []).find((c) => c.id === pick);
  async function toChat() {
    if (!pick) return;
    setBusy(true);
    const { data: rows } = await supabase.from('shopping_items').select('name, checked');
    const names = (rows || []).filter((r) => !r.checked).map((r) => r.name);
    if (!names.length) { setBusy(false); say('Your list is empty.'); return; }
    const { error } = await supabase.rpc('add_chat_list', { p_group: pick, p_names: names });
    if (error) { setBusy(false); say(String(error.message || 'Couldn’t share that.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    await supabase.rpc('send_chat', { p_group: pick, p_kind: 'text', p_body: `🛒 I put my shopping list on the group list (${names.length} item${names.length === 1 ? '' : 's'}).` });
    window.dispatchEvent(new Event('yoke:chat-ping'));
    setBusy(false); say(`Shared to ${chat?.name || 'the group'}`); onClose?.();
  }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Share your list">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 26 }}>Share your list</h2>
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
        <button className="btn wide" onClick={share} disabled={!url || busy}><Icon name="share" size={18} />Send the link</button>
        {chats && chats.length > 0 && (
          <div className="stack" style={{ gap: 8 }} data-testid="share-chat">
            <div className="row" style={{ flexWrap: 'nowrap', gap: 8 }}>
              <select className="input" style={{ flex: 1 }} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Group chat" data-testid="share-chat-pick">
                {chats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" className={`chip ${isDefault ? 'have' : ''}`} style={{ border: 0, whiteSpace: 'nowrap' }} aria-pressed={isDefault} data-testid="share-chat-default"
                onClick={() => setUi({ defaultChat: isDefault ? null : pick })}>{isDefault ? '★ Default' : '☆ Make default'}</button>
            </div>
            <button className="btn ghost wide" onClick={toChat} disabled={busy || !pick} data-testid="share-to-chat">Share to {chat?.name || 'group chat'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
