'use client';
import Avatar from './Avatar';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { color, ago, chatError } from '@/lib/social';

// Friends → Chats: your groups, newest first, with a badge for unread messages. "New group" picks a name and friends.
export default function ChatList({ chats, friends, onOpen, onMade }) {
  const { supabase, say, t } = useWhisk();
  const [making, setMaking] = useState(false);
  const [name, setName] = useState('');
  const [pick, setPick] = useState([]);
  const [busy, setBusy] = useState(false);

  async function make(e) {
    e.preventDefault(); if (busy) return;
    const n = name.trim(); if (!n) { say(t('Give the group a name.')); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('create_chat', { p_name: n, p_codes: pick });
    setBusy(false);
    if (error) { say(chatError(error, 'Couldn’t make that group.')); return; }
    setMaking(false); setName(''); setPick([]); onMade?.(); onOpen(data);
  }
  const toggle = (c) => setPick((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <section className="stack" style={{ gap: 8 }} aria-label={t('Chats')} data-testid="chat-list-section">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <h2 style={{ fontSize: 22 }}>{t('Chats')}</h2>
        <button type="button" className="btn sm" onClick={() => setMaking(true)} data-testid="new-group"><Icon name="plus" size={16} />{t('New group')}</button>
      </div>
      {chats === null ? <p className="muted">{t('Loading…')}</p> : chats.length === 0 ? (
        <div className="empty"><b>{t('No chats yet')}</b>{t('Make a group with your friends to text, share photos and play.')}</div>
      ) : chats.map((c) => (
        <button key={c.id} type="button" className="card chat-item" onClick={() => onOpen(c.id)} aria-label={`${c.name}${c.unread ? `, ${c.unread} new` : ''}`}>
          <span className="post-av" style={{ background: color(c.name) }} aria-hidden="true">{c.name.slice(0, 1).toUpperCase()}</span>
          <span className="chat-item-txt">
            <b>{c.name}{c.muted && <Icon name="bellx" size={14} style={{ marginLeft: 6, opacity: .6 }} />}</b>
            <small>{c.last ? `${c.last.name}: ${c.last.kind === 'photo' ? 'Photo' : c.last.kind === 'video' ? `Video: ${c.last.body}` : c.last.body}` : `${c.members} people`}</small>
          </span>
          <span className="chat-item-meta">{c.last && <small>{ago(c.last.at)}</small>}{c.unread > 0 && <span className="fr-dot">{c.unread > 99 ? '99+' : c.unread}</span>}</span>
        </button>
      ))}

      {making && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMaking(false); }}>
          <form className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label={t('New group')} onSubmit={make}>
            <h2 style={{ fontSize: 24 }}>{t('New group')}</h2>
            <label htmlFor="g-name" hidden>{t('Group name')}</label>
            <input id="g-name" className="input" maxLength={30} placeholder={t('Group name')} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            {friends?.length ? <>
              <span className="eyebrow">{t('Add friends')}</span>
              <div className="fr-list">{friends.map((f) => (
                <button key={f.code} type="button" className={`chip fr-chip pick ${pick.includes(f.code) ? 'on' : ''}`} aria-pressed={pick.includes(f.code)} onClick={() => toggle(f.code)}>
                  <Avatar className="post-av sm" code={f.code} name={f.name} aria-hidden="true" />{f.name}{pick.includes(f.code) && <Icon name="check" size={14} />}
                </button>
              ))}</div>
            </> : <span className="desc">Add a friend with their code first, then add them here. You can also make the group now and add people later.</span>}
            <button className="btn wide" type="submit" disabled={busy}>{t('Make group')}</button>
            <button className="btn ghost wide" type="button" onClick={() => setMaking(false)}>{t('Cancel')}</button>
          </form>
        </div>
      )}
    </section>
  );
}
