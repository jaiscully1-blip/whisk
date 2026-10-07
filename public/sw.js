// Whisk service worker: shows cooking-timer notifications and the few push notifications a player turned on
// (food about to go off, defrost tonight, a friend's Cook Off). It caches nothing and never touches requests.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'Whisk', body: e.data ? e.data.text() : '' }; }
  const url = typeof d.url === 'string' && d.url.startsWith('/') ? d.url : '/cook';
  e.waitUntil(self.registration.showNotification(d.title || 'Whisk', { body: d.body || '', icon: '/icon-192.png', badge: '/icon-192.png', tag: d.tag || url, data: { url } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/home';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const win = list.find((c) => 'focus' in c);
    if (win) { if (e.notification.data?.url && 'navigate' in win) win.navigate(url).catch(() => {}); return win.focus(); }
    return self.clients.openWindow(url);
  }));
});
