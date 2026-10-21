// fetch that gives up instead of hanging forever. After a phone sleeps, or switches Wi-Fi ↔ mobile data, a request
// that was on its way can stall with no answer and no error; anything waiting on it (opening a recipe, the next
// shuffle, a refresh) would then wait forever too. This makes such a request fail after `ms`, so it can be tried again.
export function timedFetch(input, init = {}, ms = 15000) {
  if (typeof AbortController === 'undefined') return fetch(input, init);
  const ac = new AbortController();
  const outer = init.signal;
  if (outer) { if (outer.aborted) ac.abort(outer.reason); else outer.addEventListener('abort', () => ac.abort(outer.reason), { once: true }); }
  const t = setTimeout(() => ac.abort(new DOMException('Request timed out', 'TimeoutError')), ms);
  return fetch(input, { ...init, signal: ac.signal }).finally(() => clearTimeout(t));
}
// For the Supabase client: database calls get 20 s; photo uploads and downloads (storage) get 2 minutes.
export const supabaseFetch = (input, init) => timedFetch(input, init, /\/storage\/v1\//.test(String(input?.url || input)) ? 120000 : 20000);
