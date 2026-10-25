'use client';
import Avatar, { ChatFaces } from './Avatar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCached, load } from '@/lib/cache';
import { fetchFriends, fetchChats } from './tabData';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import AddFriendSheet from './AddFriendSheet';
import { color, ago, chatError, dmOf, shownChats } from '@/lib/social';

export const fetchPartyGlobe = (supabase, gid) => supabase.rpc('get_party_globe', { p_group: gid }).then(({ data, error }) => (error ? undefined : data));
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
  const [addingF, setAddingF] = useState(false);
  const [name, setName] = useState('');
  const [pick, setPick] = useState([]);
  const [busy, setBusy] = useState(false);
  const friends = f0?.friends || [];
  // fetch each party's globe ahead of time, so opening one is instant
  useEffect(() => { (parties || []).slice(0, 4).forEach((p) => load(`party:${p.id}`, () => fetchPartyGlobe(supabase, p.id), 20000).catch(() => {})); }, [parties, supabase]);
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
      <div className="party-card" data-testid="party-card" suppressHydrationWarning style={{ '--ph-delay': `-${Math.floor(Date.now() / 1000 % 14400)}s` }}>
        <div className="pc-top">
          <span><b>Start a party</b><small>{online.length ? `${online.length} friend${online.length === 1 ? '' : 's'} online now` : friends.length ? `Race ${friends.slice(0, 2).map((f) => f.name).join(' and ')}${friends.length > 2 ? ` +${friends.length - 2}` : ''} around the world` : 'Add a friend to start a party'}</small></span>
        </div>
        <div className="pc-row">
          <div className="pc-avs">
            {(online.length ? online : friends).slice(0, 5).map((f) => (
              <Avatar key={f.code} className={`post-av pc-av ${f.online ? 'on' : ''}`} code={f.code} name={f.name} title={f.name} aria-label={`${f.name}${f.online ? ', online' : ''}`} />
            ))}
          </div>
          {friends.length > 0
            ? <button type="button" className="pc-go" onClick={() => setMaking(true)} data-testid="party-start">Invite<Icon name="chevron" size={16} /></button>
            : <button type="button" className="pc-go" onClick={() => setAddingF(true)} data-testid="party-add-friend">Add friend<Icon name="chevron" size={16} /></button>}
        </div>
        {parties?.length > 0 && (
          <div className="pc-parties">
            {parties.map((p) => (
              <Link key={p.id} href={`/compete/party?g=${p.id}`} className="pc-party" data-testid="party-link"><Icon name="globe" size={16} />{p.name}<small>{p.members}</small></Link>
            ))}
          </div>
        )}
      </div>

      {addingF && <AddFriendSheet onClose={() => setAddingF(false)} />}
      {making && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMaking(false); }}>
          <form className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Start a party" onSubmit={make}>
            <h2 style={{ fontSize: 24 }}>Start a party</h2>
            <p className="desc" style={{ margin: 0 }}>Your party shares plates, a globe and this week’s challenges.</p>
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
  const list = shownChats(chats, f0?.friends).slice(0, 3);
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
            <Link key={c.id} href={`/compete/friends?chat=${c.id}`} className="chat-item" data-testid="chat-peek-item" aria-label={`${dmOf(c, f0?.friends)?.name || c.name}${c.unread ? `, ${c.unread} new` : ''}`}>
              <ChatFaces chat={c} dm={dmOf(c, f0?.friends)} />
              <span className="chat-item-txt">
                <b>{dmOf(c, f0?.friends)?.name || c.name}</b>
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

// Compete, top of the page: your friends as big round pictures (green dot = online). Tap one to message them or invite them to a party.
export function FriendStrip() {
  const { supabase, say } = useWhisk();
  const router = useRouter();
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const [sel, setSel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [addingF, setAddingF] = useState(false);
  const friends = f0?.friends || [];
  if (!friends.length) return null;
  const sorted = [...friends.filter((f) => f.online), ...friends.filter((f) => !f.online)];

  async function message(f) {
    if (busy) return; setBusy(true);
    const { data, error } = await supabase.rpc('open_shared_list', { p_code: f.code }); setBusy(false);
    if (error) { say(chatError(error, 'Couldn’t open that chat.')); return; }
    router.push(`/compete/friends?chat=${data}`);
  }
  async function party(f) {
    if (busy) return; setBusy(true);
    const { data, error } = await supabase.rpc('start_party', { p_name: 'Party', p_codes: [f.code] }); setBusy(false);
    if (error) { say(partyError(error, 'Couldn’t start that party.')); return; }
    router.push(`/compete/party?g=${data}`);
  }

  return (
    <>
      <div className="fstrip" data-testid="friend-strip" role="list" aria-label="Your friends">
        {sorted.map((f) => (
          <button key={f.code} type="button" role="listitem" className="fs-item" onClick={() => setSel(f)} aria-label={`${f.name}${f.online ? ', online' : ''}`}>
            <Avatar className={`post-av fs-av ${f.online ? 'on' : ''}`} code={f.code} name={f.name} />
            <span className="fs-nm">{f.name}</span>
          </button>
        ))}
        <button type="button" className="fs-item" onClick={() => setAddingF(true)} aria-label="Add a friend" data-testid="strip-add"><span className="post-av fs-av fs-add"><Icon name="plus" size={22} /></span><span className="fs-nm">Add</span></button>
      </div>
      {addingF && <AddFriendSheet onClose={() => setAddingF(false)} />}
      {sel && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label={sel.name}>
            <div className="row" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <Avatar className="post-av fs-av" code={sel.code} name={sel.name} style={{ width: 52, height: 52 }} />
              <span><b style={{ fontSize: 20 }}>{sel.name}</b><br /><small className="desc">{sel.online ? 'Online now' : 'Offline'}</small></span>
            </div>
            <button className="btn wide" type="button" disabled={busy} onClick={() => message(sel)} data-testid="strip-message">Message</button>
            <button className="btn ghost wide" type="button" disabled={busy} onClick={() => party(sel)} data-testid="strip-party">Invite to party</button>
            <button className="btn ghost wide" type="button" onClick={() => setSel(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
