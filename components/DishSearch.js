'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';
import { useWhisk } from './AppShell';
import { track } from '@/lib/activity';
import { canon, STAPLES } from '@/lib/recipes/match';
import { guessCategory } from '@/lib/game';
import { COUNTRY_BY_ISO, flagCode } from '@/lib/passport/countries';
import LogMealSheet from './LogMealSheet';
import { cultureStyle, motifFor } from '@/lib/culture';
import Scene from './Scene';

// Search anything — a country, a dish, a sauce, an ingredient. Free: Whisk's own list of dishes from all 193 countries,
// plus Wikipedia for anything else. Tap a dish and its card flips: what you have / need, and a YouTube button.
const PAGE = 20;
export const TYPE_LABEL = { main: 'Main', soup: 'Soup', side: 'Side', salad: 'Salad', bread: 'Bread', 'street food': 'Street food', snack: 'Snack', dessert: 'Dessert', sauce: 'Sauce', drink: 'Drink', breakfast: 'Breakfast' };

export function YouTubeLogo({ size = 22, off }) {
  return (
    <svg width={size * 1.42} height={size} viewBox="0 0 71 50" aria-hidden="true">
      <path d="M69.5 7.8A8.9 8.9 0 0 0 63.2 1.5C57.7 0 35.5 0 35.5 0S13.3 0 7.8 1.5A8.9 8.9 0 0 0 1.5 7.8C0 13.4 0 25 0 25s0 11.6 1.5 17.2a8.9 8.9 0 0 0 6.3 6.3C13.3 50 35.5 50 35.5 50s22.2 0 27.7-1.5a8.9 8.9 0 0 0 6.3-6.3C71 36.6 71 25 71 25s0-11.6-1.5-17.2z" fill={off ? '#B9B9B4' : '#FF0000'} />
      <path d="M28.4 35.7 46.8 25 28.4 14.3z" fill="#fff" />
    </svg>
  );
}

export default function DishSearch({ q, pantry }) {
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');
  const [shown, setShown] = useState(PAGE);
  const reqId = useRef(0);
  const have = useMemo(() => new Set((pantry || []).filter((p) => p.status !== 'out').map((p) => canon(p.name))), [pantry]);

  async function load() {
    const id = ++reqId.current; setErr(''); setRes(null); setShown(PAGE);
    try {
      const r = await fetch('/api/dishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) });
      const data = await r.json().catch(() => ({}));
      if (id !== reqId.current) return;
      if (!r.ok) { setErr(data.error || 'Search is busy. Try again.'); return; }
      setRes(data);
    } catch { if (id === reqId.current) setErr('You look offline. Try again.'); }
  }
  useEffect(() => { if (q) { track('search', 'dish search', q); load(); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const c = res?.country ? COUNTRY_BY_ISO[res.country] : null;
  const list = res?.dishes || [];
  return (
    <section className="stack" style={{ gap: 8 }} aria-live="polite">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow row" style={{ gap: 6 }}>{c && <img src={`/stamps/${flagCode(c[0])}.svg`} alt="" width="16" height="16" />}{c ? `Dishes from ${c[1]}` : `Results for “${q}”`}</span>
        {res && <span className="desc">{list.length} found</span>}
      </div>
      {list.slice(0, shown).map((d, i) => <DishCard key={d.name + i} d={d} have={have} country={res?.country} />)}
      {!res && !err && Array.from({ length: 4 }, (_, i) => <div key={'s' + i} className="card dish-row skel" aria-hidden="true"><span className="dish-ico" /><span style={{ flex: 1 }}><i /><i /></span></div>)}
      {err && <div className="empty"><b>{err}</b><button className="btn ghost sm" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>}
      {res && !list.length && <div className="empty"><b>Nothing found for “{q}”</b>Try a country, a dish, or something like “soup” or “chickpeas”.</div>}
      {list.length > shown && <button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE)}>Show more dishes ({list.length - shown} more)</button>}
    </section>
  );
}

function DishCard({ d, have, country }) {
  const [cooking, setCooking] = useState(false);
  const { supabase, say } = useWhisk();
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState(null);
  const asked = useRef(false);
  function flip() {
    setOn((x) => !x);
    if (asked.current) return; asked.current = true;
    fetch('/api/dish-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d.wiki ? { dish: d.name, wiki: d.wiki } : { dish: d.name }) })
      .then((r) => r.json()).then((x) => setInfo({ ingredients: x.ingredients || (d.ingredients || []).map((name) => ({ name })), video: x.video || null, configured: !!x.configured, search: x.search }))
      .catch(() => setInfo({ ingredients: (d.ingredients || []).map((name) => ({ name })), video: null, configured: false, search: `https://www.youtube.com/results?search_query=${encodeURIComponent(d.name + ' recipe')}` }));
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
  const flags = (d.countries || []).slice(0, 3).map((iso) => COUNTRY_BY_ISO[iso]).filter(Boolean);
  const t = on ? 0 : -1;

  return (
    <div className={`flip dflip ${on ? 'on' : ''}`}>
      <div className="flip-in">
        <button className="card face dish-row" onClick={flip} aria-label={`${d.name}: show ingredients and video`} aria-hidden={on} tabIndex={on ? -1 : 0}>
          <span className="dish-ico" aria-hidden="true">{flags[0] ? <img src={`/stamps/${flagCode(flags[0][0])}.svg`} alt="" width="22" height="22" /> : <Icon name="cook" size={18} />}</span>
          <span style={{ flex: 1, minWidth: 0 }}><b>{d.name}</b><span className="desc" style={{ display: 'block' }}>{[TYPE_LABEL[d.type], flags.map((f) => f[1]).join(', '), d.about].filter(Boolean).join(' · ')}</span></span>
          <Icon name="flip" size={18} />
        </button>
        <div className="card face back stack dish-back cx" style={cultureStyle(d.countries?.[0])} data-motif={motifFor(d.countries?.[0])} aria-hidden={!on}>
          {on && <Scene iso={d.countries?.[0]} title={d.name} height={130} className="scene-bleed" />}
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
            <b style={{ fontFamily: 'var(--f-display)', fontSize: 19 }}>{d.name}</b>
            <button className="btn ghost sm" style={{ width: 40, padding: 0 }} onClick={() => setOn(false)} aria-label="Flip back" tabIndex={t}><Icon name="flip" size={18} /></button>
          </div>
          {!info ? <div className="skel" aria-hidden="true"><i /><i /><i /></div> : (
            <>
              {rows.length > 0 ? <>
                <span className="eyebrow">Ingredients · you have {rows.length - missing.length} of {rows.length}</span>
                <div className="row" style={{ gap: 6 }}>{rows.map((x) => <span key={x.name} className={`chip ${x.ok ? 'have' : 'need'}`}>{x.ok ? '✓ ' : '+ '}{x.name}</span>)}</div>
                {missing.length > 0 && <button className="btn ghost sm" onClick={addMissing} tabIndex={t}><Icon name="plus" size={16} />Add {missing.length} missing to shopping list</button>}
              </> : <p className="desc" style={{ margin: 0 }}>No ingredient list for this one yet.</p>}
              {info.video ? (
                <a className="ytbtn" href={info.video.url} target="_blank" rel="noopener noreferrer" tabIndex={t} aria-label={`Watch on YouTube: ${info.video.title}`}>
                  <YouTubeLogo /><span style={{ flex: 1, minWidth: 0 }}><b>Watch on YouTube</b><span className="desc ytt">{info.video.title}</span></span>
                </a>
              ) : info.configured ? (
                <span className="ytbtn off" role="link" aria-disabled="true"><YouTubeLogo off /><span><b>No video found</b><span className="desc ytt">YouTube doesn’t have this dish yet</span></span></span>
              ) : (
                <a className="ytbtn" href={info.search} target="_blank" rel="noopener noreferrer" tabIndex={t}><YouTubeLogo /><span><b>Find it on YouTube</b></span></a>
              )}
              {!d.wiki && (d.countries || []).length > 0 && <button className="btn wide" onClick={() => setCooking(true)} tabIndex={t}><Icon name="camera" size={18} />I cooked it</button>}
            </>
          )}
        </div>
      </div>
      {/* the sheet goes on <body>: a fixed overlay inside the 3D flip card would be trapped in the card */}
      {cooking && createPortal(<LogMealSheet dish={d} country={country && d.countries.includes(country) ? country : null} onClose={() => setCooking(false)} />, document.body)}
    </div>
  );
}
