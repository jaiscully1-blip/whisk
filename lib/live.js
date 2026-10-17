'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// "Something changed" pings for a game room. The ping carries no data: everyone who hears it asks the server what is
// true now (the same checked calls as before), so nothing here can show a player something they shouldn't see.
// If the live connection can't open (a plan's connection limit, a bad network) the callers keep their usual polling.
export function useLive(supabase, topic, onPing) {
  const chan = useRef(null); const live = useRef(false); const cb = useRef(onPing); cb.current = onPing;
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!topic) return undefined;
    let ch = null;
    try {
      ch = supabase.channel(topic, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'ping' }, () => { cb.current?.(); }).subscribe((st) => { live.current = st === 'SUBSCRIBED'; setOn(st === 'SUBSCRIBED'); });
      chan.current = ch;
    } catch { live.current = false; }
    return () => { live.current = false; chan.current = null; try { if (ch) supabase.removeChannel(ch); } catch {} };
  }, [supabase, topic]);
  const ping = useCallback(() => { try { if (live.current) chan.current?.send({ type: 'broadcast', event: 'ping', payload: {} }); } catch {} }, []);
  useEffect(() => { if (on) ping(); }, [on, ping]);   // say hello once the room is open: a new player joined / came back
  return { ping, live: on };
}

// true while the phone has a connection
export function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const set = () => setOn(navigator.onLine !== false); set();
    window.addEventListener('online', set); window.addEventListener('offline', set);
    return () => { window.removeEventListener('online', set); window.removeEventListener('offline', set); };
  }, []);
  return on;
}
