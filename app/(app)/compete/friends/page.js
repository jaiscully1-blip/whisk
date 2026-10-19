'use client';
import Avatar from '@/components/Avatar';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import { useCached } from '@/lib/cache';
import { fetchChats, fetchFriends } from '@/components/tabData';
import Icon from '@/components/Icon';
import { Crowned } from '@/components/Crown';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import { color, chatError } from '@/lib/social';

// Friends: your code (small), friend requests and your group chats. The games (Cook Off, Use-It-Up Week, Guess the
// Cook) are played from inside a chat. Everything here is private to the people you add: nothing is public.
export default function Friends() {
  const { supabase, say, t } = useWhisk();
  const [f0, , reloadFriends] = useCached('friends', () => fetchFriends(supabase));
  const [chats, , reloadChats] = useCached('chats', () => fetchChats(supabase));
  const f = f0 === undefined ? null : f0 || { code: '', friends: [], requests: [] };
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);       // the chat that's open
  const [openList, setOpenList] = useState(false);   // …and whether it opens on its shopping list

  // a notification opens its chat: /compete/friends?chat=<id>
  useEffect(() => { try { const c = new URLSearchParams(window.location.search).get('chat'); if (/^[0-9a-f-]{36}$/i.test(c || '')) setOpen(c); } catch {} }, []);
  // new messages show up in the list without opening anything
  useEffect(() => { const t = setInterval(() => { if (!document.hidden && !open) reloadChats(); }, 15000); return () => clearInterval(t); }, [open, reloadChats]);
  const refresh = useCallback(() => { reloadFriends(); reloadChats(); }, [reloadFriends, reloadChats]);

  async function add(e) {
    e.preventDefault(); const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(c)) { say(t('Friend codes are 6 letters.')); return; }
    setBusy(true); const { data, error } = await supabase.rpc('add_friend', { p_code: c }); setBusy(false);
    if (error) { say(String(error.message || 'Couldn’t add that code.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    setCode(''); setAdding(false); say(data === 'friends' ? 'You’re friends now! Start a shared grocery list from Your friends.' : 'Request sent · they’ll see it on Compete');
    reloadFriends();
  }
  async function answer(r, yes) {
    const { error } = await supabase.rpc('answer_friend', { p_code: r.code, p_accept: yes });
    if (error) { say('Couldn’t answer that.'); return; }
    say(yes ? `You and ${r.name} are friends. Start a shared grocery list from Your friends.` : 'Request removed'); reloadFriends();
  }
  async function sharedList(fr) {
    const { data, error } = await supabase.rpc('open_shared_list', { p_code: fr.code });
    if (error) { say(chatError(error, 'Couldn’t open that list.')); return; }
    setOpenList(true); setOpen(data); reloadChats();
  }
  async function unfriend(fr) {
    if (!window.confirm(`Remove ${fr.name} from your friends?`)) return;
    await supabase.rpc('remove_friend', { p_code: fr.code }); say(`${fr.name} removed`); refresh();
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(f.code); say(t('Code copied')); } catch { say(`Your code: ${f.code}`); }
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>{t('Friends')}</h1><Link href="/compete" className="title-link"><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />{t('Compete')}</Link></div>

      <div className="fr-strip" aria-label="Your friend code">
        <span className="desc">{t('Your code')}</span>
        <button type="button" className="fr-code fr-copy" onClick={copyCode} disabled={!f?.code} aria-label={f?.code ? `Your friend code ${f.code}. Tap to copy` : 'Your friend code'}>{f?.code || '······'}</button>
        <button type="button" className="btn ghost sm" onClick={() => setAdding(true)} data-testid="add-friend"><Icon name="plus" size={16} />{t('Add friend')}</button>
      </div>

      {f?.requests?.length > 0 && (
        <section className="card stack" style={{ gap: 8 }} aria-label={t('Friend requests')}>
          <span className="eyebrow">{t('Friend requests')}</span>
          {f.requests.map((r) => (
            <div key={r.code} className="fr-req">
              <Avatar code={r.code} name={r.name} aria-hidden="true" />
              <span><b>{r.name}</b> wants to be friends</span>
              <button className="btn sm" onClick={() => answer(r, true)}>{t('Yes')}</button>
              <button className="btn ghost sm" onClick={() => answer(r, false)}>No</button>
            </div>
          ))}
        </section>
      )}

      <ChatList chats={chats === undefined ? null : chats} friends={f?.friends || []} onOpen={setOpen} onMade={reloadChats} />

      {f?.friends?.length > 0 && (
        <section className="fr-rows" aria-label={t('Your friends')}>
          <h2 className="fr-h">{t('Friends')} · {f.friends.length}</h2>
          {f.friends.map((fr) => (
            <div key={fr.code} className="fr-swipe">
              <button type="button" className="fr-row" onClick={(e) => { const w = e.currentTarget.parentElement; w.scrollTo({ left: w.scrollLeft > 4 ? 0 : w.scrollWidth, behavior: 'smooth' }); }} aria-label={`${fr.name}. Tap for options`}>
                <Avatar code={fr.code} name={fr.name} aria-hidden="true" />
                <span className="fr-nm"><Crowned code={fr.code} size={14}><b>{fr.name}</b></Crowned></span>
                <Icon name="chevron" size={16} />
              </button>
              <button type="button" className="fr-act list" onClick={() => sharedList(fr)} data-testid="shared-list"><Icon name="bag" size={18} />{t('Shared list')}</button>
              <button type="button" className="fr-act rm" onClick={() => unfriend(fr)}>{t('Remove')}</button>
            </div>
          ))}
          <p className="desc fr-tip">{t('Swipe a friend left, or tap them, for Shared list and Remove.')}</p>
        </section>
      )}

      {adding && (
        <div className="scrim top" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setAdding(false); }}>
          <form className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label={t('Add a friend')} onSubmit={add}>
            <h2 style={{ fontSize: 24 }}>{t('Add a friend')}</h2>
            <label htmlFor="fr-code" className="desc">{t('Their 6-letter code')}</label>
            <input id="fr-code" className="input co-code-in" maxLength={6} autoCapitalize="characters" autoComplete="off" autoFocus value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
            <button className="btn wide" type="submit" disabled={busy}>{t('Add')}</button>
            <button className="btn ghost wide" type="button" onClick={() => setAdding(false)}>{t('Cancel')}</button>
          </form>
        </div>
      )}
      {open && <ChatView id={open} startList={openList} onClose={() => { setOpen(null); setOpenList(false); reloadChats(); }} onChanged={reloadChats} />}
    </div>
  );
}
