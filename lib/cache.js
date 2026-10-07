'use client';
// The app's memory of what each tab shows (pantry, shopping list, challenges, closet …), shared by every page.
// Pages draw straight from it, so switching tabs is instant, and quietly refresh it in the background. The app
// also fills it for every tab right after it opens (see warmCache in AppShell), so even the first tap is instant.
import { useCallback, useEffect, useRef, useState } from 'react';

const store = new Map();   // key → { data, at, p }
const subs = new Map();    // key → Set(listener)

export const peek = (key) => store.get(key)?.data;
export function put(key, next) {
  const e = store.get(key) || {};
  e.data = typeof next === 'function' ? next(e.data) : next; e.at = Date.now();
  store.set(key, e); subs.get(key)?.forEach((fn) => fn(e.data));
}
// Fetch once at a time per key; skip if we got it in the last `fresh` ms.
export function load(key, fetcher, fresh = 0) {
  const e = store.get(key);
  if (e?.p) return fresh < 0 ? e.p.then(() => load(key, fetcher, -1)) : e.p;   // a forced reload waits for the one in flight, then fetches again
  if (e && e.data !== undefined && Date.now() - e.at < fresh) return Promise.resolve(e.data);
  const p = Promise.resolve().then(fetcher).then((d) => { if (d !== undefined) put(key, d); return d; })
    .finally(() => { const x = store.get(key); if (x) x.p = null; });
  store.set(key, { ...(e || {}), p });
  return p;
}
export function clearCache() { store.clear(); }

// [data, set, reload]: data is whatever we last knew (undefined only the very first time), and it refreshes itself
// in the background when the page opens (unless it was fetched in the last 2 s, e.g. by the warm-up).
export function useCached(key, fetcher, deps = []) {
  const [data, setData] = useState(() => peek(key));
  const f = useRef(fetcher); f.current = fetcher;
  const ran = useRef(null);
  useEffect(() => {
    const fn = (d) => setData(d);
    if (!subs.has(key)) subs.set(key, new Set());
    subs.get(key).add(fn);
    setData(peek(key));
    // first open: skip if just fetched (warm-up); later runs (deps changed, e.g. "data changed" bump): always refetch
    load(key, () => f.current(), ran.current === key ? -1 : 2000).catch(() => {});
    ran.current = key;
    return () => { subs.get(key)?.delete(fn); };
  }, [key, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = useCallback((next) => put(key, next), [key]);
  const reload = useCallback(() => load(key, () => f.current(), -1), [key]);
  return [data, set, reload];
}
