'use client';
import { useCached } from '@/lib/cache';
import { fetchFriends } from './tabData';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Compete → Friends' plates: the way into the friends feed, with a dot when someone wants to be friends.
export default function FriendsCard() {
  const { supabase } = useWhisk();
  const [f0] = useCached('friends', () => fetchFriends(supabase));
  const f = f0 === undefined ? null : f0;
  if (f === false) return null;   // friends aren't set up on this server yet
  const asks = f?.requests?.length || 0;
  return (
    <Link href="/compete/friends" prefetch className="card fr-card" data-tip="friends">
      <span className="fr-ico" aria-hidden="true"><Icon name="heart" size={26} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <b>Friends’ plates</b>
        <span className="desc">{asks ? `${asks} friend request${asks === 1 ? '' : 's'}` : f ? (f.friends.length ? `${f.friends.length} friend${f.friends.length === 1 ? '' : 's'} · see what they cooked` : 'Add friends with their code') : ' '}</span>
      </span>
      {asks > 0 && <span className="fr-dot" aria-hidden="true">{asks}</span>}
      <Icon name="chevron" />
    </Link>
  );
}
