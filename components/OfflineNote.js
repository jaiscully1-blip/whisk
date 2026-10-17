'use client';
import { useOnline } from '@/lib/live';

// shown on every multiplayer screen when the phone loses its connection
export default function OfflineNote() {
  const on = useOnline();
  if (on) return null;
  return <p className="offline-note" role="status" data-testid="offline-note">You’re offline. Games and chats need a connection. Your pantry and recipes still work.</p>;
}
