'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';

// Friends' plates. Step by step: add a friend with their code → they say yes → you see the plates they choose to
// share (plates are private until shared), love them, or report one. Nothing here is public.
const COLORS = ['#FF6B57', '#8B5CF6', '#1CB0F6', '#58B030', '#FF9600', '#FF4D7E'];
const color = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
function ago(t) {
  const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000));
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86400); return d === 1 ? 'yesterday' : d < 7 ? `${d} days ago` : new Date(t).toLocaleDateString();
}
const REASONS = [['not_food', 'It’s not food'], ['rude', 'It’s rude or upsetting'], ['spam', 'It’s spam'], ['other', 'Something else']];

export default function Friends() {
  const { supabase, say } = useWhisk();
  const [f, setF] = useState(null);
  const [feed, setFeed] = useState(null);
  const [urls, setUrls] = useState({});
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(null);       // a post whose ⋯ menu is open
  const [reporting, setReporting] = useState(null);
  const [more, setMore] = useState(true);

  const sign = useCallback(async (posts) => {
    const need = posts.map((p) => p.photo).filter((p) => p && !urls[p]);
    if (!need.length) return;
    const { data } = await supabase.storage.from('meal-photos').createSignedUrls(need, 3600);
    setUrls((u) => ({ ...u, ...Object.fromEntries((data || []).filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl])) }));
  }, [supabase, urls]);
  const loadFriends = useCallback(async () => { const { data } = await supabase.rpc('get_friends'); setF(data || { code: '', friends: [], requests: [] }); }, [supabase]);
  const loadFeed = useCallback(async () => {
    const { data } = await supabase.rpc('get_feed', { p_before: null });
    setFeed(data || []); setMore((data || []).length === 20); sign(data || []);
  }, [supabase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadFriends(); loadFeed(); }, [loadFriends, loadFeed]);

  async function older() {
    const last = feed?.[feed.length - 1]; if (!last) return;
    const { data } = await supabase.rpc('get_feed', { p_before: last.at });
    setFeed((x) => [...x, ...(data || [])]); setMore((data || []).length === 20); sign(data || []);
  }
  async function add(e) {
    e.preventDefault(); const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(c)) { say('Friend codes are 6 letters.'); return; }
    setBusy(true); const { data, error } = await supabase.rpc('add_friend', { p_code: c }); setBusy(false);
    if (error) { say(String(error.message || 'Couldn’t add that code.').replace(/^\w/, (x) => x.toUpperCase())); return; }
    setCode(''); say(data === 'friends' ? 'You’re friends now!' : 'Request sent · they’ll see it on Compete');
    loadFriends(); if (data === 'friends') loadFeed();
  }
  async function answer(r, yes) {
    const { error } = await supabase.rpc('answer_friend', { p_code: r.code, p_accept: yes });
    if (error) { say('Couldn’t answer that.'); return; }
    say(yes ? `You and ${r.name} are friends` : 'Request removed'); loadFriends(); if (yes) loadFeed();
  }
  async function unfriend(fr) {
    if (!window.confirm(`Remove ${fr.name} from your friends? You’ll stop seeing each other’s plates.`)) return;
    await supabase.rpc('remove_friend', { p_code: fr.code }); say(`${fr.name} removed`); loadFriends(); loadFeed();
  }
  async function love(p) {
    const on = !p.loved;
    setFeed((x) => x.map((y) => (y.id === p.id ? { ...y, loved: on, loves: y.loves + (on ? 1 : -1) } : y)));
    try { navigator.vibrate?.(on ? 15 : 0); } catch {}
    const { data, error } = await supabase.rpc('love_meal', { p_meal: p.id, p_on: on });
    if (error) { loadFeed(); return; }
    setFeed((x) => x.map((y) => (y.id === p.id ? { ...y, loves: data } : y)));
  }
  async function report(p, reason) {
    const { error } = await supabase.rpc('report_meal', { p_meal: p.id, p_reason: reason });
    setReporting(null); setMenu(null);
    if (error) { say('Couldn’t report that.'); return; }
    setFeed((x) => x.filter((y) => y.id !== p.id)); say('Thanks. You won’t see that plate again.');
  }
  async function unshare(p) {
    setMenu(null);
    await supabase.rpc('set_meal_shared', { p_meal: p.id, p_shared: false });
    setFeed((x) => x.filter((y) => y.id !== p.id)); say('Only you can see it now');
  }
  async function shareCode() {
    const text = `Add me on Whisk! My friend code is ${f.code}`;
    try { if (navigator.share) { await navigator.share({ text, url: `${window.location.origin}/login?ref=${f.code}` }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(f.code); say('Code copied'); } catch {}
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>Friends</h1><Link href="/compete" className="title-link"><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />Compete</Link></div>

      {f?.requests?.length > 0 && (
        <section className="card stack" style={{ gap: 8 }} aria-label="Friend requests">
          <span className="eyebrow">Friend requests</span>
          {f.requests.map((r) => (
            <div key={r.code} className="fr-req">
              <span className="post-av" style={{ background: color(r.name) }} aria-hidden="true">{r.name.slice(0, 1).toUpperCase()}</span>
              <span><b>{r.name}</b> wants to be friends</span>
              <button className="btn sm" onClick={() => answer(r, true)}>Yes</button>
              <button className="btn ghost sm" onClick={() => answer(r, false)}>No</button>
            </div>
          ))}
        </section>
      )}

      <section className="card stack" style={{ gap: 10 }} aria-label="Add a friend">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div><span className="eyebrow">Your friend code</span><div className="fr-code">{f?.code || '······'}</div></div>
          <button className="btn ghost sm" onClick={shareCode} disabled={!f?.code}><Icon name="share" size={16} />Share</button>
        </div>
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={add}>
          <label htmlFor="fr-code" hidden>Friend’s code</label>
          <input id="fr-code" className="input co-code-in" maxLength={6} autoCapitalize="characters" autoComplete="off" placeholder="Friend’s code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
          <button className="btn" type="submit" disabled={busy}>Add</button>
        </form>
        <span className="desc">Your plates are private. Only friends see the ones you share (tap “Share with friends” after you cook).</span>
      </section>

      {feed === null ? <p className="muted">Loading plates…</p> : feed.length === 0 ? (
        <div className="empty"><b>No plates yet</b>{f?.friends?.length ? 'When your friends share a plate, it shows up here.' : 'Add a friend with their code to see what they cook.'}</div>
      ) : feed.map((p) => (
        <article key={p.id} className="card post" aria-label={`${p.mine ? 'Your' : `${p.name}’s`} plate: ${p.title}`}>
          <div className="post-head">
            <span className="post-av" style={{ background: color(p.name) }} aria-hidden="true">{p.name.slice(0, 1).toUpperCase()}</span>
            <span className="who"><b>{p.mine ? 'You' : p.name}</b><small>{p.cuisine} · {ago(p.at)}</small></span>
            <button type="button" className="more-btn" aria-label="More" onClick={() => setMenu(p)}><Icon name="more" size={22} stroke={4} /></button>
          </div>
          {urls[p.photo] ? <img className="post-img" src={urls[p.photo]} alt={`${p.title}, cooked by ${p.mine ? 'you' : p.name}`} loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.color = 'transparent'; }} /> : <div className="post-img" aria-hidden="true" />}
          <div className="post-foot">
            <span className="title">{p.title}</span>
            <button type="button" className={`love ${p.loved ? 'on' : ''}`} aria-pressed={p.loved} aria-label={`${p.loved ? 'Unlove' : 'Love'} · ${p.loves}`} onClick={() => love(p)}><Icon name="heart" size={20} />{p.loves}</button>
          </div>
        </article>
      ))}
      {feed?.length > 0 && more && <button className="btn ghost wide" onClick={older}>Show older</button>}

      {f?.friends?.length > 0 && (
        <details className="card fr-list">
          <summary><b>Your friends ({f.friends.length})</b></summary>
          {f.friends.map((fr) => (
            <div key={fr.code} className="fr-req" style={{ marginTop: 8 }}>
              <span className="post-av" style={{ background: color(fr.name) }} aria-hidden="true">{fr.name.slice(0, 1).toUpperCase()}</span>
              <span><b>{fr.name}</b></span>
              <button className="btn ghost sm" onClick={() => unfriend(fr)}>Remove</button>
            </div>
          ))}
        </details>
      )}

      {menu && !reporting && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setMenu(null); }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Plate options">
            <b style={{ fontSize: 18 }}>{menu.title}</b>
            {menu.mine
              ? <button className="btn ghost wide" onClick={() => unshare(menu)}><Icon name="x" size={18} />Stop sharing this plate</button>
              : <button className="btn ghost wide" style={{ color: 'var(--bad)' }} onClick={() => setReporting(menu)}><Icon name="flag" size={18} />Report this plate</button>}
            <button className="btn wide" onClick={() => setMenu(null)}>Cancel</button>
          </div>
        </div>
      )}
      {reporting && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) { setReporting(null); setMenu(null); } }}>
          <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Report this plate">
            <h2 style={{ fontSize: 24 }}>What’s wrong with it?</h2>
            <span className="desc">It disappears for you right away. Whisk checks reported plates.</span>
            {REASONS.map(([k, l]) => <button key={k} className="btn ghost wide" onClick={() => report(reporting, k)}>{l}</button>)}
            <button className="btn wide" onClick={() => { setReporting(null); setMenu(null); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
