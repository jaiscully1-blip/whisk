'use client';
// Activity log: what players tap, pick and search, sent in small batches to log_events (Supabase).
// Only runs when the player allowed "Help improve Whisk" in the cookie & privacy popup; the server checks again.
// Free text people type is never recorded, except what they search for.
let sb = null, enabled = false, device = null, queue = [], timer = 0, page = '';

const clip = (s, n) => (s == null ? null : String(s).replace(/\s+/g, ' ').trim().slice(0, n) || null);
function flush() {
  clearTimeout(timer); timer = 0;
  if (!enabled || !sb || !queue.length) { queue = enabled ? queue : []; return; }
  const batch = queue.splice(0, 50);
  sb.rpc('log_events', { p_events: batch, p_device: device }).then(() => {}, () => {});
  if (queue.length) timer = setTimeout(flush, 500);
}
export function track(kind, target, value, extra = {}) {
  if (!enabled) return;
  queue.push({ kind, page: extra.page || page, target: clip(target, 120), value: clip(value, 200), at: new Date().toISOString() });
  if (queue.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 4000);
}
export function setPage(p) { page = p; track('view', p); }

function labelOf(el) {
  return el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('href') || el.tagName.toLowerCase();
}
function onClick(e) {
  const el = e.target.closest('button, a, [role="tab"], [role="switch"], [role="button"], summary');
  if (!el || el.closest('[data-no-track]')) return;
  track('tap', labelOf(el), el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked') ?? el.getAttribute('aria-selected'));
}
function onChange(e) {
  const el = e.target;
  if (el.tagName === 'SELECT') { const lbl = el.labels?.[0]?.textContent || el.id || el.name; track('select', lbl, el.options[el.selectedIndex]?.text); }
  else if (el.type === 'checkbox' || el.type === 'radio') track('select', el.labels?.[0]?.textContent || el.id || el.name, el.checked ? 'on' : 'off');
  else if (el.type === 'file') track('select', el.labels?.[0]?.textContent || 'photo', 'file');
}

/** Turn logging on or off (called whenever the privacy choice changes). */
export function startActivity(supabase, on, dev) {
  sb = supabase; device = dev || null;
  if (on === enabled) return;
  enabled = on;
  if (on) {
    document.addEventListener('click', onClick, { capture: true, passive: true });
    document.addEventListener('change', onChange, { capture: true, passive: true });
    document.addEventListener('visibilitychange', onHide);
  } else {
    document.removeEventListener('click', onClick, { capture: true });
    document.removeEventListener('change', onChange, { capture: true });
    document.removeEventListener('visibilitychange', onHide);
    queue = [];
  }
}
function onHide() { if (document.visibilityState === 'hidden') flush(); }
