'use client';
import { useCached } from '@/lib/cache';
import { fetchFriends, fetchChats } from './tabData';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Compete → Friends' plates: the way into the friends feed, with a dot when someone wants to be friends.
export default function FriendsCard() {
  const { supabase, t } = useWhisk();
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const [chats] = useCached('chats', () => fetchChats(supabase));
  const f = f0 === undefined ? null : f0;
  const unread = (chats || []).reduce((n, c) => n + (c.unread || 0), 0);
  const asks = f?.requests?.length || 0;
  return (
    <Link href="/compete/friends" prefetch className="card fr-card" data-tip="friends">
      <span className="fr-ico" aria-hidden="true"><Icon name="heart" size={26} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b>{t('Friends')}</b>
        <span className="desc">{asks ? `${asks} friend request${asks === 1 ? '' : 's'}` : unread ? `${unread} new message${unread === 1 ? '' : 's'}` : f?.friends?.length ? `${f.friends.length} friend${f.friends.length === 1 ? '' : 's'} · Cook Off · plates` : 'Add friends to play'}</span>
      </span>
      {asks + unread > 0 && <span className="fr-dot" aria-hidden="true">{asks + unread}</span>}
      <Icon name="chevron" />
    </Link>
  );
}
