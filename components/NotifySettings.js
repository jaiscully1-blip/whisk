'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';

// Me → Notifications. Off until the player turns it on. At most one a day, at the hour they pick, and only when
// it's useful (food about to go off, defrost tonight). Plus a friend's new Cook Off, right away.
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const HOURS = Array.from({ length: 24 }, (_, h) => [h, h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`]);
const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };

export default function NotifySettings() {
  const { supabase, profile, setProfile, say } = useWhisk();
  const [env, setEnv] = useState(null);   // 'ok' | 'install' (iPhone: add to Home Screen first) | 'no'
  const [busy, setBusy] = useState(false);
  const on = profile?.notify_hour != null;
  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) setEnv('ok');
    else setEnv(ios && !standalone ? 'install' : 'no');
  }, []);
  if (!KEY || !('notify_hour' in (profile || {}))) return null;   // not set up on this server yet

  async function turnOn() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { say('Notifications are blocked. Allow them for Whisk in your phone’s settings.'); return; }
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) }));
      const j = sub.toJSON();
      const { error } = await supabase.rpc('save_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
      if (error) throw error;
      await setHour(profile?.notify_hour ?? 17, true);
    } catch { say('Couldn’t turn on notifications in this browser.'); } finally { setBusy(false); }
  }
  async function setHour(h, first = false) {
    const { error } = await supabase.rpc('set_notify_hour', { p_hour: h });
    if (error) { say('Couldn’t save that.'); return; }
    setProfile((p) => ({ ...p, notify_hour: h }));
    if (h === null) { try { const reg = await navigator.serviceWorker.getRegistration(); await (await reg?.pushManager.getSubscription())?.unsubscribe(); } catch {} say('Notifications off'); }
    else say(first ? `On · at most one a day, around ${HOURS[h][1]}` : `Around ${HOURS[h][1]}`);
  }
  return (
    <div className="row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      <Icon name="bell" /><span style={{ flex: 1, fontWeight: 700 }}>Notifications</span>
      {env === 'ok' && <button role="switch" aria-checked={on} aria-label="Notifications" disabled={busy} onClick={() => (on ? setHour(null) : turnOn())} className={`switch ${on ? 'on' : ''}`}><span /></button>}
      {on && env === 'ok' && (
        <div className="row" style={{ width: '100%', flexWrap: 'nowrap', gap: 8, marginTop: 6 }}>
          <label htmlFor="n-hour" className="desc" style={{ flex: 1 }}>At most one a day, around</label>
          <select id="n-hour" className="input" style={{ width: 110, minHeight: 38 }} value={profile.notify_hour} onChange={(e) => setHour(Number(e.target.value))}>{HOURS.map(([h, l]) => <option key={h} value={h}>{l}</option>)}</select>
        </div>
      )}
      <span className="desc" style={{ width: '100%' }}>
        {env === 'install' ? 'On iPhone, add Whisk to your Home Screen first (Share → Add to Home Screen), then turn this on there.'
          : env === 'no' ? 'This browser can’t show notifications.'
          : 'Only useful ones: food about to go off, “defrost the beef tonight”, and when a friend starts a Cook Off.'}
      </span>
    </div>
  );
}
