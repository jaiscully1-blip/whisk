'use client';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWhisk } from './AppShell';
import { COUNTRIES, STAMPS_PER_PAGE, STAMP_GOAL, flagCode } from '@/lib/passport/countries';

// Stamp album: all 193 UN member states, 20 stamps a page, swipe across like a real album.
// A stamp is grey until you've cooked 10 meals from that country, then it's in full color with a postmark.
const PAGES = Array.from({ length: Math.ceil(COUNTRIES.length / STAMPS_PER_PAGE) }, (_, i) => COUNTRIES.slice(i * STAMPS_PER_PAGE, (i + 1) * STAMPS_PER_PAGE));
const PAPER = ['#FFF6E2', '#E9F6EC', '#E6F0FB', '#FCE9EC', '#F3ECFB', '#FFF0DC'];
const TILT = [-2, 1.5, -1, 2, -1.5, 1, 0, -2.5];
const src = (code) => `/stamps/${code}.svg`;

const nameSize = (name) => { const w = Math.max(...name.split(' ').map((x) => x.length)); return w > 11 ? 7 : w > 9 ? 8 : name.length > 16 ? 8.5 : 9.5; };
const Stamp = memo(function Stamp({ c, i, n, onOpen, preview = false }) {
  const [iso, name, , , art] = c; const done = n >= STAMP_GOAL;
  return (
    <button className={`stamp ${done || preview ? 'done' : ''}`} style={{ '--paper': PAPER[i % PAPER.length], '--tilt': `${TILT[i % TILT.length]}deg` }}
      onClick={() => onOpen(c)} aria-label={`${name}, ${Math.min(n, STAMP_GOAL)} of ${STAMP_GOAL} cooked`}>
      <span className="stamp-paper">
        <img className="stamp-flag" src={src(flagCode(iso))} alt="" width="16" height="16" loading="lazy" decoding="async" />
        <span className={`stamp-art n${art.length}`}>{art.map((a) => <img key={a} src={src(a)} alt="" loading="lazy" decoding="async" />)}</span>
        <span className="stamp-name" style={{ fontSize: nameSize(name) }}>{name}</span>
        <span className="stamp-count">{Math.min(n, STAMP_GOAL)}/{STAMP_GOAL}</span>
      </span>
      {done && <span className="postmark" aria-hidden="true">COOKED</span>}
    </button>
  );
});

export default function Passport({ counts, onOpenRecipe }) {
  const { getUi, setUiQuiet, recipes } = useWhisk();
  const scroller = useRef(null);
  const [page, setPage] = useState(() => getUi().passportPage || 0);
  const [open, setOpen] = useState(null);
  const done = useMemo(() => COUNTRIES.filter((c) => (counts.get(c[0]) || 0) >= STAMP_GOAL).length, [counts]);

  // Come back to the page you were on.
  useEffect(() => { const el = scroller.current; if (el) el.scrollLeft = (getUi().passportPage || 0) * el.clientWidth; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onScroll = useCallback(() => {
    const el = scroller.current; if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    setPage((cur) => { if (cur !== p) setUiQuiet({ passportPage: p }); return p; });
  }, [setUiQuiet]);
  const go = (p) => { const el = scroller.current; if (!el) return; const t = Math.max(0, Math.min(PAGES.length - 1, p)); el.scrollTo({ left: t * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  const fromHere = open && recipes ? recipes.filter((r) => r.country === open[0]) : [];

  return (
    <section className="album" data-tip="album" aria-labelledby="pp-h">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 id="pp-h" style={{ fontSize: 26 }}>Passport</h2>
        <span className="count">{done}/{COUNTRIES.length}</span>
      </div>
      <div className="album-pages" ref={scroller} onScroll={onScroll} tabIndex={0} aria-label="Stamp album pages. Swipe left or right.">
        {PAGES.map((list, p) => (
          <div key={p} className="album-page" role="group" aria-label={`Page ${p + 1} of ${PAGES.length}`}>
            <div className="album-grid">
              {list.map((c, i) => <Stamp key={c[0]} c={c} i={p * STAMPS_PER_PAGE + i} n={counts.get(c[0]) || 0} onOpen={setOpen} />)}
            </div>
            <div className="album-num">— {p + 1} —</div>
          </div>
        ))}
      </div>
      <div className="album-nav">
        <button className="btn ghost sm" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous page">‹</button>
        <div className="album-dots" role="tablist" aria-label="Album pages">
          {PAGES.map((_, p) => <button key={p} role="tab" aria-selected={p === page} aria-label={`Page ${p + 1}`} onClick={() => go(p)} />)}
        </div>
        <button className="btn ghost sm" onClick={() => go(page + 1)} disabled={page === PAGES.length - 1} aria-label="Next page">›</button>
      </div>
      <p className="desc" style={{ margin: '8px 0 0' }}>Cook 10 meals from a country to stamp it in full color. Every stamp pays <b>5,000 coins</b>.</p>
      <p className="credit">Stamp art: Twemoji, CC-BY 4.0.</p>

      {open && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={open[1]} style={{ alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 150 }}><Stamp c={open} i={COUNTRIES.indexOf(open)} n={counts.get(open[0]) || 0} onOpen={() => {}} preview /></div>
            <h2 style={{ fontSize: 26 }}>{open[1]}</h2>
            <p className="desc" style={{ margin: 0 }}>Known for {open[2]} · {open[3]}</p>
            {(counts.get(open[0]) || 0) < STAMP_GOAL && <span className="desc" style={{ marginTop: -4 }}>This is how the stamp looks once you’ve cooked 10 meals from here.</span>}
            <div className="row" style={{ width: '100%', flexWrap: 'nowrap' }}><div className="bar" style={{ flex: 1 }}><i style={{ width: `${Math.min(100, ((counts.get(open[0]) || 0) / STAMP_GOAL) * 100)}%` }} /></div><b>{Math.min(counts.get(open[0]) || 0, STAMP_GOAL)}/{STAMP_GOAL}</b></div>
            {fromHere.length ? (
              <div className="stack" style={{ gap: 6, width: '100%', textAlign: 'left' }}>
                <span className="eyebrow">Whisk recipes from {open[1]}</span>
                {fromHere.map((r) => <button key={r.id} className="card row" style={{ flexWrap: 'nowrap', padding: '10px 12px', textAlign: 'left' }} onClick={() => { setOpen(null); onOpenRecipe?.(r); }}><b style={{ flex: 1 }}>{r.title}</b><span className="desc">{r.minutes} min</span></button>)}
              </div>
            ) : <p className="desc" style={{ margin: 0 }}>No Whisk recipes from {open[1]} yet.</p>}
            <button className="btn ghost wide" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
