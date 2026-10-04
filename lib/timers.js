'use client';
// Cooking timers that keep running when you close the recipe, switch tabs or reload.
// Each timer stores its end time, so a sleeping phone can't make it drift; when it ends we
// buzz, chime and show a phone notification (if you allowed notifications).
const KEY = 'whisk-timers';
const listeners = new Set();
let timers = {};            // key -> { end, label }
let done = {};              // key -> true once finished (until reset)
let loop = 0;

function load() { try { timers = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { timers = {}; } }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(timers)); } catch {} }
function emit() { listeners.forEach((fn) => fn()); }
if (typeof window !== 'undefined') { load(); document.addEventListener('visibilitychange', () => tick()); }

function chime() {
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return; const ctx = new A();
    [0, .25, .5].forEach((t, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = [880, 988, 1175][i]; g.gain.setValueAtTime(.0001, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(.25, ctx.currentTime + t + .02); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t + .22); o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .25); });
  } catch {}
}
async function notify(label) {
  try { navigator.vibrate?.([300, 120, 300, 120, 500]); } catch {}
  chime();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  const opts = { body: `${label} is done.`, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'whisk-timer-' + label, renotify: true, vibrate: [300, 120, 300] };
  try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) { await reg.showNotification('Timer done ⏰', opts); return; } } catch {}
  try { new Notification('Timer done ⏰', opts); } catch {}
}
function tick() {
  const now = Date.now(); let changed = false;
  for (const [k, t] of Object.entries(timers)) if (t.end <= now) { delete timers[k]; done[k] = true; changed = true; notify(t.label); }
  if (changed) persist();
  if (!Object.keys(timers).length) { clearInterval(loop); loop = 0; }
  emit();
}
function ensureLoop() { if (!loop) loop = setInterval(tick, 1000); }
if (typeof window !== 'undefined' && Object.keys(timers).length) ensureLoop();

/** Ask once for notification permission (needs a tap) and register the tiny service worker. */
async function prepareNotifications() {
  try { if ('serviceWorker' in navigator) await navigator.serviceWorker.register('/sw.js'); } catch {}
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission(); } catch {}
}

export const timerApi = {
  next: () => Object.values(timers).sort((a, b) => a.end - b.end)[0] || null,
  get: (k) => ({ end: timers[k]?.end || null, done: !!done[k] }),
  start(k, minutes, label) { delete done[k]; timers[k] = { end: Date.now() + minutes * 60e3, label }; persist(); ensureLoop(); emit(); prepareNotifications(); },
  stop(k) { delete timers[k]; delete done[k]; persist(); emit(); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
};
