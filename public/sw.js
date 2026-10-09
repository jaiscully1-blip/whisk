// Whisk service worker: shows cooking-timer notifications and the few push notifications a player turned on
// (food about to go off, defrost tonight, a friend's Cook Off), and keeps Whisk's own static files (the app's code
// bundles, fonts, flags, drawings and icons) on the phone so the app opens fast and smooth on weak wifi or cell data.
// It never stores pages, account data or anything from /api or Supabase: those always come fresh from the network.
const CACHE = 'whisk-static-v2';
const STATIC = /^\/(_next\/static\/|flags\/|tw\/|stamps\/|thumbs\/|ocr\/|zxing\/|icon-|apple-touch-icon|doodles\.svg|cookie\.svg|icon\.svg)/;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !STATIC.test(u.pathname)) return;   // everything else: straight to the network
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(r);
    // build files have unique names, so a stored copy is always right; drawings and flags refresh in the background
    const fresh = fetch(r).then((res) => { if (res.ok && res.type === 'basic') cache.put(r, res.clone()); return res; });
    if (hit) { if (!u.pathname.startsWith('/_next/static/')) e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  })());
});
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
