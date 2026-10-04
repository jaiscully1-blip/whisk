'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { useWhisk } from './AppShell';
import { track } from '@/lib/activity';
import { canon, STAPLES } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';
import { COUNTRY_BY_ISO, flagCode } from '@/lib/passport/countries';

// Live dish search: the server asks Claude to search the web right now. Scrolling to the bottom loads the next page
// (it sends back what's already on screen, so there's no fixed end). Search a country name for dishes from there.
// Tap a dish and its card flips over: ingredients you have / need, plus YouTube videos for it.
export default function DishSearch({ q, pantry }) {
  const [dishes, setDishes] = useState([]);
  const [country, setCountry] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const moreRef = useRef(null);
  const reqId = useRef(0);
  const have = useMemo(() => new Set((pantry || []).filter((p) => p.status !== 'out').map((p) => canon(p.name))), [pantry]);

  const load = useCallback(async (reset) => {
    const id = ++reqId.current; setBusy(true); setErr('');
    try {
      const res = await fetch('/api/dishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, exclude: reset ? [] : dishes.map((d) => d.name) }) });
      const data = await res.json().catch(() => ({}));
      if (id !== reqId.current) return;
      if (!res.ok) { setErr(data.error || 'Search is busy. Try again.'); return; }
      setCountry(data.country || null);
      setDishes((cur) => (reset ? data.dishes : [...cur, ...data.dishes]));
      if (!data.dishes?.length) setDone(true);
    } catch { if (id === reqId.current) setErr('You look offline. Try again.'); }
    finally { if (id === reqId.current) setBusy(false); }
  }, [q, dishes]);

  useEffect(() => { setDishes([]); setDone(false); setErr(''); setCountry(null); if (q) { track('search', 'dish search', q); load(true); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = moreRef.current; if (!el || busy || done || err || !dishes.length) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) load(false); }, { rootMargin: '300px' });
    io.observe(el); return () => io.disconnect();
  }, [dishes.length, busy, done, err, load]);

  const c = country ? COUNTRY_BY_ISO[country] : null;
  return (
    <section className="stack" style={{ gap: 8 }} aria-live="polite">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow row" style={{ gap: 6 }}>{c && <img src={`/stamps/${flagCode(c[0])}.svg`} alt="" width="16" height="16" />}{c ? `Dishes from ${c[1]}` : `Dishes from the web · “${q}”`}</span>
        <span className="live-dot" aria-hidden="true">Live</span>
      </div>
      {dishes.map((d, i) => <DishCard key={d.name + i} d={d} have={have} />)}
      {busy && Array.from({ length: dishes.length ? 2 : 4 }, (_, i) => <div key={'s' + i} className="card dish-row skel" aria-hidden="true"><span className="dish-ico" /><span style={{ flex: 1 }}><i /><i /></span></div>)}
      {err && <div className="empty"><b>{err}</b><button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => load(!dishes.length)}>Try again</button></div>}
      {!busy && !err && done && dishes.length > 0 && <span className="desc" style={{ textAlign: 'center' }}>That’s everything the search found.</span>}
      {!busy && !err && done && !dishes.length && <div className="empty"><b>No dishes found</b>Try another name.</div>}
      {!done && !err && dishes.length > 0 && <div ref={moreRef}><button className="btn ghost wide" disabled={busy} onClick={() => load(false)}>{busy ? 'Searching…' : 'Show more dishes'}</button></div>}
    </section>
  );
}

function DishCard({ d, have }) {
  const { supabase, say } = useWhisk();
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState(null);
  const asked = useRef(false);
  function flip() {
    setOn((x) => !x);
    if (asked.current) return; asked.current = true;
    fetch('/api/dish-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish: d.name }) })
      .then((r) => r.json()).then(setInfo)
      .catch(() => setInfo({ ingredients: [], videos: [], search: `https://www.youtube.com/results?search_query=${encodeURIComponent(d.name + ' recipe')}` }));
  }
  const rows = (info?.ingredients || []).map((x) => ({ ...x, ok: STAPLES.has(canon(x.name)) || have.has(canon(x.name)) }));
  const missing = rows.filter((x) => !x.ok);
  async function addMissing() {
    const { data: list } = await supabase.from('shopping_items').select('name');
    const onList = new Set((list || []).map((l) => l.name.toLowerCase()));
    const add = missing.map((m) => m.name).filter((m) => !onList.has(m.toLowerCase()));
    if (add.length) await supabase.from('shopping_items').insert(add.map((m) => ({ name: m.slice(0, 60), category: guessCategory(m) })));
    say(add.length ? `Added ${add.length} to your shopping list` : 'Already on your list');
  }
  const thumb = (url) => { const id = new URL(url).searchParams.get('v'); return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg` : null; };

  return (
    <div className={`flip dflip ${on ? 'on' : ''}`}>
      <div className="flip-in">
        <button className="card face dish-row" onClick={flip} aria-label={`${d.name}: show ingredients and videos`} aria-hidden={on} tabIndex={on ? -1 : 0}>
          <span className="dish-ico" aria-hidden="true"><Icon name="play" size={18} /></span>
          <span style={{ flex: 1, minWidth: 0 }}><b>{d.name}</b><span className="desc" style={{ display: 'block' }}>{[d.cuisine, d.about].filter(Boolean).join(' · ')}</span></span>
          <Icon name="flip" size={18} />
        </button>
        <div className="card face back stack dish-back" aria-hidden={!on}>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <b style={{ fontFamily: 'var(--f-display)', fontSize: 19 }}>{d.name}</b>
            <button className="btn ghost sm" style={{ width: 40, padding: 0 }} onClick={() => setOn(false)} aria-label="Flip back" tabIndex={on ? 0 : -1}><Icon name="flip" size={18} /></button>
          </div>
          {!info ? <div className="skel" aria-hidden="true"><i /><i /><i /></div> : (
            <>
              {rows.length > 0 && <>
                <span className="eyebrow">Ingredients · you have {rows.length - missing.length} of {rows.length}</span>
                <div className="row" style={{ gap: 6 }}>{rows.map((x) => <span key={x.name} className={`chip ${x.ok ? 'have' : 'need'}`} title={x.amount || ''}>{x.ok ? '✓ ' : '+ '}{x.name}{x.amount ? <span className="amt"> · {x.amount}</span> : null}</span>)}</div>
                {missing.length > 0 && <button className="btn ghost sm" onClick={addMissing} tabIndex={on ? 0 : -1}><Icon name="plus" size={16} />Add {missing.length} missing to shopping list</button>}
              </>}
              <span className="eyebrow">Watch on YouTube</span>
              {info.videos.length ? info.videos.slice(0, 4).map((v) => (
                <a key={v.url} className="vid" href={v.url} target="_blank" rel="noopener noreferrer" tabIndex={on ? 0 : -1}>
                  {thumb(v.url) ? <img className="vid-img" src={thumb(v.url)} alt="" loading="lazy" width="120" height="68" /> : <span className="vid-img" />}
                  <span style={{ flex: 1, minWidth: 0 }}><b>{v.title}</b><span className="desc" style={{ display: 'block' }}>YouTube{v.age ? ` · ${v.age}` : ''}</span></span>
                </a>
              )) : info.note ? <p className="desc" style={{ margin: 0 }}>{info.note}</p> : null}
              <a className="btn ghost sm" href={info.search} target="_blank" rel="noopener noreferrer" tabIndex={on ? 0 : -1}><Icon name="yt" size={18} />{info.videos.length ? 'More on YouTube' : 'Find it on YouTube'}</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
