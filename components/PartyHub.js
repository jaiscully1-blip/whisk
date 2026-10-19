'use client';
import Avatar from './Avatar';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCached } from '@/lib/cache';
import { fetchFriends, fetchChats } from './tabData';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { color, ago, chatError } from '@/lib/social';

export const fetchParties = (supabase) => supabase.rpc('get_parties').then(({ data, error }) => (error ? undefined : data || []));
// one colour per party member, in the order they joined
export const SEAT_COLORS = ['#FF8A5C', '#5CC8FF', '#B98BFF', '#7ED957', '#FFD166', '#FF5DA2', '#4DD4AC', '#F2994A', '#9AA9FF', '#E25C5C', '#C3E86B', '#6FE3E3'];
export const partyError = (e, fb) => (/could not find the function|schema cache|does not exist/i.test(String(e?.message || '')) ? 'Parties need a database update first (setup SQL 35). Ask the app owner.' : chatError(e, fb));
export const seatColor = (seat) => SEAT_COLORS[(seat || 0) % SEAT_COLORS.length];

// Compete → "Start a party": who's online now, your parties (each has a shared globe), and making a new one.
export function PartyCard() {
  const { supabase, say, t } = useWhisk();
  const router = useRouter();
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const [parties, , reloadParties] = useCached('parties', () => fetchParties(supabase));
  const [making, setMaking] = useState(false);
  const [name, setName] = useState('');
  const [pick, setPick] = useState([]);
  const [busy, setBusy] = useState(false);
  const friends = f0?.friends || [];
  const online = friends.filter((f) => f.online);
  const sorted = [...online, ...friends.filter((f) => !f.online)];
  const toggle = (c) => setPick((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  async function make(e) {
    e.preventDefault(); if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('start_party', { p_name: name.trim() || 'Party', p_codes: pick });
    setBusy(false);
    if (error) { say(partyError(error, 'Couldn’t start that party.')); return; }
    setMaking(false); setName(''); setPick([]); reloadParties?.();
    router.push(`/compete/party?g=${data}`);
  }

  return (
    <section className="stack" style={{ gap: 8 }} aria-label="Parties">
      <div className="party-card" data-testid="party-card">
        <div className="pc-top">
          <span><b>Start a party</b><small>{online.length ? `${online.length} friend${online.length === 1 ? '' : 's'} online now` : friends.length ? `Cook with ${friends.slice(0, 2).map((f) => f.name).join(' and ')}${friends.length > 2 ? ` +${friends.length - 2}` : ''} on one shared globe` : 'Add a friend to start a party'}</small></span>
        </div>
        <div className="pc-row">
          <div className="pc-avs">
            {(online.length ? online : friends).slice(0, 5).map((f) => (
              <Avatar key={f.code} className={`post-av pc-av ${f.online ? 'on' : ''}`} code={f.code} name={f.name} title={f.name} aria-label={`${f.name}${f.online ? ', online' : ''}`} />
            ))}
          </div>
          {friends.length > 0
            ? <button type="button" className="pc-go" onClick={() => setMaking(true)} data-testid="party-start">Invite<Icon name="chevron" size={16} /></button>
            : <Link href="/compete/friends" className="pc-go">Add friend<Icon name="chevron" size={16} /></Link>}
        </div>
        {parties?.length > 0 && (
          <div className="pc-parties">
            {parties.map((p) => (
              <Link key={p.id} href={`/compete/party?g=${p.id}`} className="pc-party" data-testid="party-link"><Icon name="globe" size={16} />{p.name}<small>{p.members}</small></Link>
            ))}
          </div>
        )}
      </div>

      {making && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMaking(false); }}>
          <form className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Start a party" onSubmit={make}>
            <h2 style={{ fontSize: 24 }}>Start a party</h2>
            <p className="desc" style={{ margin: 0 }}>Your party shares one globe. Cook a country to colour it yours; cook it more times than whoever has it to take it. Most countries at the end of the month wins.</p>
            <label htmlFor="pt-name" hidden>Party name</label>
            <input id="pt-name" className="input" maxLength={30} placeholder="Party name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            <span className="eyebrow">Invite friends</span>
            <div className="fr-list">{sorted.map((f) => (
              <button key={f.code} type="button" className={`chip fr-chip pick ${pick.includes(f.code) ? 'on' : ''}`} aria-pressed={pick.includes(f.code)} onClick={() => toggle(f.code)}>
                <Avatar className={`post-av sm pc-av ${f.online ? 'on' : ''}`} code={f.code} name={f.name} aria-hidden="true" />{f.name}{pick.includes(f.code) && <Icon name="check" size={14} />}
              </button>
            ))}</div>
            <button className="btn wide" type="submit" disabled={busy || !pick.length}>Start party</button>
            <button className="btn ghost wide" type="button" onClick={() => setMaking(false)}>{t('Cancel')}</button>
          </form>
        </div>
      )}
    </section>
  );
}

// Compete → your latest chats, right on the page. "See all" (and friend requests) open Friends.
export function ChatsPeek() {
  const { supabase, t } = useWhisk();
  const [chats] = useCached('chats', () => fetchChats(supabase));
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const asks = f0?.requests?.length || 0;
  const list = (chats || []).slice(0, 3);
  return (
    <section className="stack" style={{ gap: 8 }} aria-label={t('Chats')} data-tip="friends">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow">{t('Chats')}</span>
        <Link href="/compete/friends" prefetch className="see-all" data-testid="see-all-chats">{asks ? `${asks} friend request${asks === 1 ? '' : 's'} · ` : ''}Friends &amp; all chats</Link>
      </div>
      {chats === undefined ? null : list.length === 0 ? (
        <Link href="/compete/friends" className="card chat-item"><span className="post-av" style={{ background: '#7ED957' }} aria-hidden="true"><Icon name="plus" size={18} /></span><span className="chat-item-txt"><b>Start a chat</b><small>Text, share photos and play with friends</small></span><Icon name="chevron" /></Link>
      ) : (
        <div className="card chat-peek">
          {list.map((c) => (
            <Link key={c.id} href={`/compete/friends?chat=${c.id}`} className="chat-item" data-testid="chat-peek-item" aria-label={`${c.name}${c.unread ? `, ${c.unread} new` : ''}`}>
              <span className="post-av" style={{ background: color(c.name) }} aria-hidden="true">{c.name.slice(0, 1).toUpperCase()}</span>
              <span className="chat-item-txt">
                <b>{c.name}</b>
                <small>{c.last ? `${c.last.name}: ${c.last.kind === 'photo' ? 'Photo' : c.last.kind === 'video' ? `Video: ${c.last.body}` : c.last.body}` : `${c.members} people`}</small>
              </span>
              <span className="chat-item-meta">{c.last && <small>{ago(c.last.at)}</small>}{c.unread > 0 && <span className="fr-dot">{c.unread > 99 ? '99+' : c.unread}</span>}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
