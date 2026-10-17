'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { isPhoto, uploadTo } from '@/lib/photo';
import { color, stamp, EMOJI } from '@/lib/social';
import { postGame } from '@/lib/chatGame';
import CookOffCard from './CookOffCard';
import UseItUpCard, { uiuError } from './UseItUpCard';
import GuessCook from './GuessCook';
import { VideoCard, VideoSheet, VideoShare } from './ChatVideo';
import { parseVideo } from '@/lib/video';

// One group chat, full screen, like a text thread: bubbles, photos, emoji. Refreshes every few seconds while it is open
// (no live connection, so it costs nothing to run). Report, mute a person, mute the group's notifications.
const REASONS = [['spam', 'It’s spam'], ['rude', 'It’s rude or upsetting'], ['unsafe', 'It’s unsafe'], ['other', 'Something else']];
const GAP = 30 * 60 * 1000;

const GAMES = { cookoff: ['Cook Off', 'cook'], uiu: ['Use-It-Up Week', 'timer'], guess: ['Guess the Cook', 'dart'] };

// A game in the chat: who started it, what state it is in, and a button to join, open or play.
function GameCard({ m, onMore, onPlay }) {
  const { supabase, say } = useWhisk();
  const router = useRouter();
  const [title, icon] = GAMES[m.kind];
  const st = m.game?.status;
  let sub = '', act = null;
  if (m.kind === 'cookoff') {
    sub = `${m.meta.minutes} min${st === 'lobby' ? ` · ${m.game.n} joined` : ''}`;
    act = st === 'lobby' ? (m.mine ? 'Open' : 'Join') : m.mine && ['cooking', 'voting', 'done'].includes(st) ? 'Open' : null;
  } else if (m.kind === 'uiu') {
    sub = m.meta.mode === 'same' ? 'Same ingredients' : 'Your own lists';
    act = st === 'open' ? (m.mine ? 'Open' : 'Join') : m.mine && ['live', 'done'].includes(st) ? 'Open' : null;
  } else sub = m.meta.played ? `${m.meta.right} of ${m.meta.played} right today` : 'Who cooked the plate?';
  const note = m.kind === 'guess' ? '' : act ? '' : st === 'done' ? 'Finished' : st === 'cancelled' ? 'Closed' : 'Already started';
  async function go() {
    if (m.kind === 'guess') { onPlay(); return; }
    const code = m.meta.code;
    if (!m.mine) {
      const { error } = m.kind === 'cookoff' ? await supabase.rpc('join_cookoff', { p_code: code }) : await supabase.rpc('join_uiu', { p_code: code, p_picks: [] });
      if (error) { say(m.kind === 'uiu' ? uiuError(error) : String(error.message || 'Couldn’t join.').replace(/^\w/, (c) => c.toUpperCase())); return; }
    }
    router.push(m.kind === 'cookoff' ? `/compete/cookoff?code=${code}` : `/compete/useitup?code=${code}`);
  }
  return (
    <div className="chat-bubble game" data-testid={`chat-game-${m.kind}`}>
      <div className="chat-game-head"><span className="chat-oi gm"><Icon name={icon} size={18} /></span><b>{title}</b>
        <button type="button" className="chat-more" onClick={onMore} aria-label="Message options"><Icon name="more" size={18} stroke={4} /></button></div>
      <span className="chat-game-sub">{sub}</span>
      {m.kind === 'guess' ? <button type="button" className="btn sm" onClick={go} data-testid="chat-game-go">Play</button>
        : act ? <button type="button" className="btn sm" onClick={go} data-testid="chat-game-go">{act}</button> : <span className="chat-game-sub">{note}</span>}
    </div>
  );
}

export default function ChatView({ id, onClose, onChanged }) {
  const { supabase, say, profile, refreshProfile } = useWhisk();
  const [d, setD] = useState(null);                 // { group, members, messages, more }
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState({});
  const [menu, setMenu] = useState(null);           // a message whose options are open
  const [reporting, setReporting] = useState(null);
  const [people, setPeople] = useState(false);
  const [plus, setPlus] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const [game, setGame] = useState(null);         // a game sheet: 'cookoff' | 'uiu' | 'guess'
  const [viewer, setViewer] = useState(null);       // a photo opened big
  const [friends, setFriends] = useState(null);
  const [looks, setLooks] = useState(null);         // background shop: null = closed, [] = loading
  const [buyingBg, setBuyingBg] = useState(false);
  const [vidShare, setVidShare] = useState(null);   // null = closed, string = the link to start with
  const [vidWatch, setVidWatch] = useState(null);   // a video message being watched
  const listRef = useRef(null);
  const lastAt = useRef(null);
  const stick = useRef(true);                       // keep the view at the newest message unless you scrolled up

  const sign = useCallback(async (msgs) => {
    const need = msgs.map((m) => m.photo).filter((p) => p && !urls[p]);
    if (!need.length) return;
    const { data } = await supabase.storage.from('chat-photos').createSignedUrls(need, 3600);
    setUrls((u) => ({ ...u, ...Object.fromEntries((data || []).filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl])) }));
  }, [supabase, urls]);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_chat', { p_group: id });
    if (error) { say('Couldn’t open that chat.'); onClose?.(); return; }
    setD(data); lastAt.current = data.messages.length ? data.messages[data.messages.length - 1].at : null; sign(data.messages); onChanged?.();
  }, [supabase, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  // live: a tiny "something new" ping goes out over a realtime channel when anyone sends; it carries no message text,
  // so the real messages still come only through the checked get_chat call. Slow polling covers a dropped connection.
  const dRef = useRef(null); dRef.current = d;
  const chan = useRef(null); const live = useRef(false);
  const check = useCallback(async () => {
    if (document.hidden) return;
    const since = lastAt.current ? new Date(new Date(lastAt.current).getTime() - 3000).toISOString() : new Date(0).toISOString();
    const { data } = await supabase.rpc('get_chat', { p_group: id, p_after: since });
    if (data && data.messages.some((m) => !dRef.current?.messages.some((x) => x.id === m.id))) load();
  }, [supabase, id, load]);
  useEffect(() => {
    let ch = null;
    try {
      ch = supabase.channel(`chat:${id}`, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'ping' }, () => { check(); }).subscribe((st) => { live.current = st === 'SUBSCRIBED'; });
      chan.current = ch;
    } catch { live.current = false; }
    return () => { live.current = false; chan.current = null; try { if (ch) supabase.removeChannel(ch); } catch {} };
  }, [supabase, id, check]);
  useEffect(() => {
    let n = 0; const t = setInterval(() => { n += 1; if (!live.current || n % 4 === 0) check(); }, 5000);
    return () => clearInterval(t);
  }, [check]);
  const ping = useCallback(() => { try { chan.current?.send({ type: 'broadcast', event: 'ping', payload: {} }); } catch {} }, []);
  useEffect(() => { const h = (e) => { if (e.detail === id) ping(); }; window.addEventListener('yoke:chat-posted', h); return () => window.removeEventListener('yoke:chat-posted', h); }, [id, ping]);

  // game cards change as people join and play: look again every 20 seconds
  const hasGame = (d?.messages || []).some((m) => m.game);
  useEffect(() => { if (!hasGame) return undefined; const t = setInterval(() => { if (!document.hidden) load(); }, 20000); return () => clearInterval(t); }, [hasGame, load]);
  useEffect(() => { const el = listRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [d?.messages?.length]);
  const onScroll = () => { const el = listRef.current; if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; };

  async function pushed(msg) { ping(); fetch('/api/push/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg }) }).catch(() => {}); }
  async function send(e) {
    e?.preventDefault(); const t = text.trim(); if (!t || busy) return;
    if (parseVideo(t)) { setVidShare(t); setText(''); return; }
    setBusy(true); const { data, error } = await supabase.rpc('send_chat', { p_group: id, p_kind: 'text', p_body: t });
    setBusy(false);
    if (error) { say(String(error.message || 'Couldn’t send that.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    setText(''); setEmoji(false); stick.current = true; load(); pushed(data.id);
  }
  async function sendPhoto(file) {
    setPlus(false); if (!file) return;
    if (!isPhoto(file)) { say('Pick a photo.'); return; }
    setBusy(true);
    try {
      const path = await uploadTo(supabase, 'chat-photos', profile.id, file);
      const cap = text.trim().slice(0, 200) || null;
      const { data, error } = await supabase.rpc('send_chat', { p_group: id, p_kind: 'photo', p_body: cap, p_photo: path });
      if (error) throw error;
      setText(''); stick.current = true; await load(); pushed(data.id);
    } catch (e) { say(String(e?.message || 'Couldn’t send that photo.').replace(/^\w/, (x) => x.toUpperCase())); } finally { setBusy(false); }
  }
  async function sendVideo(v) {
    const { data, error } = await supabase.rpc('send_chat_video', { p_group: id, p_url: v.url, p_title: v.title || null, p_ingredients: v.ingredients, p_steps: v.steps });
    if (error) { say(String(error.message || 'Couldn’t share that.').replace(/^\w/, (x) => x.toUpperCase())); return false; }
    stick.current = true; await load(); pushed(data.id); return true;
  }
  async function toggleBell() {
    const on = !d.group.muted; const { error } = await supabase.rpc('set_chat_muted', { p_group: id, p_on: on });
    if (error) { say('Couldn’t change that.'); return; }
    setD((x) => ({ ...x, group: { ...x.group, muted: on } })); onChanged?.(); say(on ? 'Notifications off for this chat' : 'Notifications on for this chat');
  }
  async function del(m) { setMenu(null); await supabase.rpc('delete_chat_message', { p_msg: m.id }); load(); ping(); }
  async function report(m, reason) {
    const { error } = await supabase.rpc('report_chat_message', { p_msg: m.id, p_reason: reason }); setReporting(null); setMenu(null);
    if (error) { say('Couldn’t report that.'); return; }
    say('Thanks. You won’t see that message again.'); load();
  }
  async function muteUser(code, name, on) {
    const { error } = await supabase.rpc('set_chat_user_muted', { p_code: code, p_on: on }); setMenu(null);
    if (error) { say('Couldn’t change that.'); return; }
    say(on ? `${name} is muted. You won’t see their messages.` : `${name} is unmuted`); load();
  }
  async function openPeople() {
    setPeople(true);
    const { data } = await supabase.rpc('get_friends'); setFriends(data?.friends || []);
  }
  async function addPerson(f) {
    const { error } = await supabase.rpc('add_to_chat', { p_group: id, p_code: f.code });
    if (error) { say(String(error.message || 'Couldn’t add them.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    say(`${f.name} is in the group`); load();
  }
  async function removePerson(m) {
    if (!window.confirm(`Remove ${m.name} from this group?`)) return;
    const { error } = await supabase.rpc('remove_from_chat', { p_group: id, p_code: m.code });
    if (error) { say('Couldn’t remove them.'); return; } say(`${m.name} removed`); load();
  }
  async function leave() {
    if (!window.confirm('Leave this group?')) return;
    await supabase.rpc('leave_chat', { p_group: id }); onChanged?.(); onClose?.(); say('You left the group');
  }

  const msgs = d?.messages || [];
  async function openLooks() {
    setLooks([]);
    const { data, error } = await supabase.rpc('get_chat_bgs');
    if (error) { setLooks(null); say('Couldn’t open the backgrounds'); return; }
    setLooks(data || []);
  }
  async function pickLook(b) {
    if (buyingBg) return;
    const next = b?.id ?? null;
    if (b && !b.owned) {
      setBuyingBg(true);
      const { error } = await supabase.rpc('buy_chat_bg', { p_bg: b.id });
      if (error) { setBuyingBg(false); say(/enough/i.test(error.message) ? 'Not enough coins yet' : 'Couldn’t buy that'); return; }
      refreshProfile?.();
      setLooks((l) => (l || []).map((x) => (x.id === b.id ? { ...x, owned: true } : x)));
    }
    const { error: e2 } = await supabase.rpc('set_chat_bg', { p_group: id, p_bg: next });
    setBuyingBg(false);
    if (e2) { say('Couldn’t change the background'); return; }
    setD((x) => ({ ...x, group: { ...x.group, bg: next } }));
    say(next ? `${b.name} is on` : 'Back to the plain colour');
  }

  const memberIds = new Set((d?.members || []).map((m) => m.code));
  const addable = (friends || []).filter((f) => !memberIds.has(f.code));

  return (
    <div className="chat-full" data-bg={d?.group?.bg || undefined} role="dialog" aria-modal="true" aria-label={d?.group?.name || 'Chat'} data-testid="chat-view">
      <header className="chat-top">
        <button type="button" className="chat-ico" onClick={onClose} aria-label="Back to chats"><Icon name="back" size={22} /></button>
        <button type="button" className="chat-title" onClick={openPeople} aria-label={`${d?.group?.name || 'Chat'}: see who is in this group`}>
          <b>{d?.group?.name || '…'}</b><small>{d ? `${d.members.length} ${d.members.length === 1 ? 'person' : 'people'}` : ''}</small>
        </button>
        <button type="button" className="chat-ico" onClick={openLooks} disabled={!d} aria-label="Chat background" data-testid="chat-bgbtn"><Icon name="palette" size={22} /></button>
        <button type="button" className={`chat-ico ${d?.group?.muted ? 'off' : ''}`} onClick={toggleBell} disabled={!d} aria-pressed={!!d?.group?.muted} aria-label={d?.group?.muted ? 'Turn notifications on for this chat' : 'Turn notifications off for this chat'} data-testid="chat-bell"><Icon name={d?.group?.muted ? 'bellx' : 'bell'} size={22} /></button>
      </header>

      <div className="chat-list" ref={listRef} onScroll={onScroll} data-testid="chat-list">
        {d === null ? <p className="muted" style={{ textAlign: 'center' }}>Opening…</p> : msgs.length === 0 ? <p className="chat-empty">No messages yet. Say hi.</p> : msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const gap = !prev || new Date(m.at) - new Date(prev.at) > GAP;
          const first = gap || prev.name !== m.name || prev.mine !== m.mine;
          return (
            <div key={m.id} className={`chat-row ${m.mine ? 'mine' : ''} ${first ? 'first' : ''}`}>
              {gap && <div className="chat-stamp">{stamp(m.at)}</div>}
              {!m.mine && first && <span className="chat-name" style={{ color: color(m.name) }}>{m.name}</span>}
              {m.kind === 'video' ? <VideoCard m={m} onWatch={() => setVidWatch(m)} onMore={() => setMenu(m)} /> : m.game !== undefined && GAMES[m.kind] ? <GameCard m={m} onMore={() => setMenu(m)} onPlay={() => setGame('guess')} /> : <button type="button" className={`chat-bubble ${m.kind}`} onClick={() => setMenu(m)} aria-label={`${m.mine ? 'Your' : `${m.name}’s`} message. Tap for options`}>
                {m.kind === 'photo' && (urls[m.photo]
                  ? <img src={urls[m.photo]} alt="Photo in the chat" loading="lazy" decoding="async" onClick={(e) => { e.stopPropagation(); setViewer(urls[m.photo]); }} />
                  : <span className="chat-ph">Photo…</span>)}
                {m.body && <span className="chat-text">{m.body}</span>}
              </button>}
            </div>
          );
        })}
      </div>

      <form className="chat-compose" onSubmit={send}>
        {plus && (
          <div className="chat-plus" role="menu" aria-label="Add to the chat">
            <label className="chat-opt" role="menuitem"><span className="chat-oi cam"><Icon name="camera" size={22} /></span>Camera<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => { sendPhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
            <label className="chat-opt" role="menuitem"><span className="chat-oi pho"><Icon name="photo" size={22} /></span>Photos<input type="file" accept="image/*" hidden data-testid="chat-photo" onChange={(e) => { sendPhoto(e.target.files?.[0]); e.target.value = ''; }} /></label>
            <button type="button" className="chat-opt" role="menuitem" onClick={() => { setPlus(false); setEmoji(true); }}><span className="chat-oi emo"><Icon name="smile" size={22} /></span>Emoji</button>
            <button type="button" className="chat-opt" role="menuitem" onClick={() => { setPlus(false); setVidShare(''); }} data-testid="plus-video"><span className="chat-oi vid"><Icon name="play" size={22} /></span>Recipe video</button>
            <button type="button" className="chat-opt" role="menuitem" onClick={() => { setPlus(false); setGame('cookoff'); }} data-testid="plus-cookoff"><span className="chat-oi gm"><Icon name="cook" size={22} /></span>Cook Off</button>
            <button type="button" className="chat-opt" role="menuitem" onClick={() => { setPlus(false); setGame('uiu'); }} data-testid="plus-uiu"><span className="chat-oi gm"><Icon name="timer" size={22} /></span>Use-It-Up Week</button>
            <button type="button" className="chat-opt" role="menuitem" onClick={() => { setPlus(false); setGame('guess'); }} data-testid="plus-guess"><span className="chat-oi gm"><Icon name="dart" size={22} /></span>Guess the Cook</button>
          </div>
        )}
        {emoji && (
          <div className="chat-emoji" role="group" aria-label="Emoji">
            {EMOJI.map((e) => <button key={e} type="button" onClick={() => setText((t) => (t + e).slice(0, 500))} aria-label={`Add ${e}`}>{e}</button>)}
          </div>
        )}
        <button type="button" className={`chat-ico plus ${plus ? 'on' : ''}`} onClick={() => { setPlus((v) => !v); setEmoji(false); }} aria-expanded={plus} aria-label="Add a photo or emoji"><Icon name="plus" size={22} /></button>
        <label htmlFor="chat-in" hidden>Message</label>
        <input id="chat-in" className="chat-in" maxLength={500} autoComplete="off" placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} onFocus={() => { setPlus(false); setEmoji(false); }} />
        <button type="submit" className="chat-send" disabled={!text.trim() || busy} aria-label="Send"><Icon name="send" size={20} /></button>
      </form>

      {menu && !reporting && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMenu(null); }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Message options">
            <b style={{ fontSize: 18 }}>{menu.mine ? 'Your message' : `${menu.name}’s message`}</b>
            {menu.mine
              ? <button className="btn ghost wide" onClick={() => del(menu)}><Icon name="trash" size={18} />Delete this message</button>
              : <>
                <button className="btn ghost wide" onClick={() => muteUser(menu.code, menu.name, true)}><Icon name="bellx" size={18} />Mute {menu.name}</button>
                <button className="btn ghost wide" style={{ color: 'var(--bad)' }} onClick={() => setReporting(menu)}><Icon name="flag" size={18} />Report this message</button>
              </>}
            <button className="btn wide" onClick={() => setMenu(null)}>Cancel</button>
          </div>
        </div>
      )}
      {reporting && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) { setReporting(null); setMenu(null); } }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Report this message">
            <h2 style={{ fontSize: 24 }}>What’s wrong with it?</h2>
            <span className="desc">It disappears for you right away. Yoke checks reported messages.</span>
            {REASONS.map(([k, l]) => <button key={k} className="btn ghost wide" onClick={() => report(reporting, k)}>{l}</button>)}
            <button className="btn wide" onClick={() => { setReporting(null); setMenu(null); }}>Cancel</button>
          </div>
        </div>
      )}
      {vidShare !== null && <VideoShare initialUrl={vidShare} onSend={sendVideo} onClose={() => setVidShare(null)} />}
      {vidWatch && <VideoSheet m={vidWatch} onClose={() => setVidWatch(null)} />}
      {looks && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setLooks(null); }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Chat background" data-testid="chat-bgs">
            <h2 style={{ fontSize: 24 }}>Background</h2>
            <p className="desc">Only you see it. It never changes any game. You have {profile?.coins ?? 0} coins.</p>
            <div className="bg-grid">
              <button type="button" className={`bg-tile ${!d?.group?.bg ? 'on' : ''}`} onClick={() => pickLook(null)} aria-pressed={!d?.group?.bg} data-testid="bg-plain"><span className="bg-prev" /><b>Plain</b><small>Free</small></button>
              {looks.map((b) => (
                <button key={b.id} type="button" className={`bg-tile ${d?.group?.bg === b.id ? 'on' : ''}`} onClick={() => pickLook(b)} disabled={buyingBg} aria-pressed={d?.group?.bg === b.id} data-testid={`bg-${b.id}`}>
                  <span className="chat-full bg-prev" data-bg={b.id} /><b>{b.name}</b><small>{b.owned ? (d?.group?.bg === b.id ? 'In use' : 'Yours') : `${b.price} coins`}</small>
                </button>
              ))}
            </div>
            <button className="btn wide" onClick={() => setLooks(null)}>Done</button>
          </div>
        </div>
      )}
      {people && d && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setPeople(false); }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="People in this group" data-testid="chat-people">
            <h2 style={{ fontSize: 24 }}>{d.group.name}</h2>
            {d.members.map((m) => (
              <div key={m.code} className="fr-req">
                <span className="post-av" style={{ background: color(m.name) }} aria-hidden="true">{m.name.slice(0, 1).toUpperCase()}</span>
                <span><b>{m.me ? 'You' : m.name}</b>{m.owner && <span className="desc"> · made the group</span>}{m.muted && <span className="desc"> · muted</span>}</span>
                {!m.me && <button className="btn ghost sm" onClick={() => muteUser(m.code, m.name, !m.muted)}>{m.muted ? 'Unmute' : 'Mute'}</button>}
                {!m.me && d.group.mine && <button className="btn ghost sm" onClick={() => removePerson(m)} aria-label={`Remove ${m.name}`}><Icon name="x" size={16} /></button>}
              </div>
            ))}
            {addable.length > 0 && <>
              <span className="eyebrow">Add a friend</span>
              <div className="fr-list">{addable.map((f) => <button key={f.code} type="button" className="chip fr-chip" onClick={() => addPerson(f)} aria-label={`Add ${f.name} to the group`}><span className="post-av sm" style={{ background: color(f.name) }} aria-hidden="true">{f.name.slice(0, 1).toUpperCase()}</span>{f.name}<Icon name="plus" size={14} /></button>)}</div>
            </>}
            <button className="btn ghost wide" style={{ color: 'var(--bad)' }} onClick={leave}>Leave group</button>
            <button className="btn wide" onClick={() => setPeople(false)}>Done</button>
          </div>
        </div>
      )}
      {game && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) { setGame(null); load(); ping(); } }}>
          <div className="sheet stack game-sheet" role="dialog" aria-modal="true" aria-label={GAMES[game][0]} data-testid="chat-game-sheet">
            <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost sm" onClick={() => { setGame(null); load(); ping(); }} aria-label="Close"><Icon name="x" /></button></div>
            {game === 'cookoff' && <CookOffCard groupId={id} />}
            {game === 'uiu' && <UseItUpCard groupId={id} />}
            {game === 'guess' && <>
              <GuessCook groupId={id} />
              <button type="button" className="btn ghost wide" data-testid="chat-guess-invite" onClick={async () => { const r = await postGame(supabase, id, 'guess'); say(r.error ? 'Couldn’t post that.' : 'Posted. Friends can play from the chat.'); setGame(null); load(); }}>Invite the chat to play</button>
            </>}
          </div>
        </div>
      )}
      {viewer && <div className="scrim chat-big" role="presentation" onClick={() => setViewer(null)}><img src={viewer} alt="Photo, full size" /></div>}
    </div>
  );
}
