'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import PlateManage from './PlateManage';
import { seatColor } from './PartyHub';

// A party's photo wall: every plate its members shared to it. Tap one to open it; flip it over to read the recipe on the back.
export default function PartyPlates({ gid }) {
  const { supabase, say, dataVersion } = useWhisk();
  const [plates, setPlates] = useState(null);
  const [urls, setUrls] = useState({});
  const [who, setWho] = useState('');
  const [open, setOpen] = useState(null);
  const [flip, setFlip] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let off = false;
    supabase.rpc('get_party_plates', { p_group: gid }).then(({ data, error }) => { if (!off) setPlates(error ? [] : data || []); });
    return () => { off = true; };
  }, [supabase, gid, dataVersion, reload]);
  useEffect(() => {
    const need = (plates || []).map((p) => p.photo).filter((x) => x && !urls[x]);
    if (!need.length) return undefined;
    let off = false;
    supabase.storage.from('meal-photos').createSignedUrls(need, 3600).then(({ data }) => {
      if (!off && data) setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl])) }));
    });
    return () => { off = true; };
  }, [plates]); // eslint-disable-line react-hooks/exhaustive-deps

  const people = useMemo(() => { const m = new Map(); (plates || []).forEach((p) => { if (!m.has(p.code)) m.set(p.code, { code: p.code, name: p.mine ? 'You' : p.name, seat: p.seat }); }); return [...m.values()]; }, [plates]);
  const shown = (plates || []).filter((p) => !who || p.code === who);
  const cur = open ? (plates || []).find((p) => p.id === open) : null;
  const close = () => { setOpen(null); setFlip(false); };

  async function love(p) {
    const on = !p.loved;
    setPlates((ps) => ps.map((x) => (x.id === p.id ? { ...x, loved: on, loves: x.loves + (on ? 1 : -1) } : x)));
    const { error } = await supabase.rpc('love_meal', { p_meal: p.id, p_on: on });
    if (error) { setPlates((ps) => ps.map((x) => (x.id === p.id ? { ...x, loved: !on, loves: x.loves + (on ? -1 : 1) } : x))); say('Couldn’t do that.'); }
  }
  async function report(p) {
    const { error } = await supabase.rpc('report_meal', { p_meal: p.id, p_reason: 'other' });
    say(error ? 'Couldn’t report that.' : 'Thanks. That plate is hidden for you.');
    if (!error) { close(); setReload((n) => n + 1); }
  }

  if (plates === null) return null;
  return (
    <section className="stack" style={{ gap: 8 }} aria-label="Party plates" data-testid="party-plates">
      <span className="eyebrow">Plates</span>
      {plates.length === 0 ? (
        <div className="empty">No plates yet. When you post a meal, pick this party under “Share to”.</div>
      ) : (
        <>
          {people.length > 1 && (
            <div className="row pp-who" style={{ gap: 6 }}>
              <button type="button" className={`sc-chip ${!who ? 'on' : ''}`} onClick={() => setWho('')}>All</button>
              {people.map((m) => <button key={m.code} type="button" className={`sc-chip ${who === m.code ? 'on' : ''}`} onClick={() => setWho(m.code)} style={who === m.code ? undefined : { borderColor: seatColor(m.seat) }}>{m.name}</button>)}
            </div>
          )}
          <div className="pp-grid">
            {shown.map((p) => (
              <button key={p.id} type="button" className="pp-tile" data-testid="party-plate" onClick={() => { setOpen(p.id); setFlip(false); }} aria-label={`${p.mine ? 'Your' : p.name + '’s'} ${p.title}`}>
                {urls[p.photo] ? <img src={urls[p.photo]} alt="" loading="lazy" decoding="async" /> : <span className="pp-ph"><Icon name="utensils" size={24} /></span>}
                <span className="pp-who-dot" style={{ background: seatColor(p.seat) }} aria-hidden="true">{(p.mine ? 'Y' : p.name).slice(0, 1).toUpperCase()}</span>
                {p.card && <span className="pp-badge"><Icon name="flip" size={11} />recipe</span>}
                <span className="pp-cap">{p.title}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {cur && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={cur.title} data-testid="plate-sheet">
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
              <span style={{ minWidth: 0 }}><h2 style={{ fontSize: 22, margin: 0 }}>{cur.title}</h2><span className="desc">{cur.mine ? 'You' : cur.name} · {new Date(cur.at).toLocaleDateString()}</span></span>
              <button type="button" className="btn ghost sm" onClick={close} aria-label="Close"><Icon name="x" /></button>
            </div>
            <div className={`flipcard ${flip ? 'on' : ''}`} data-testid="flipcard">
              <div className="flip-in">
                <div className="flip-face front">{urls[cur.photo] ? <img src={urls[cur.photo]} alt={cur.title} /> : <span className="pp-ph"><Icon name="utensils" size={36} /></span>}</div>
                <div className="flip-face back" aria-hidden={!flip} data-testid="flip-back">
                  {cur.card ? (
                    <div className="stack" style={{ gap: 6 }}>
                      <b className="eyebrow">Ingredients</b>
                      <ul className="flip-list">{(cur.card.ingredients || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                      <b className="eyebrow">Steps</b>
                      <ol className="flip-list">{(cur.card.steps || []).map((x, i) => <li key={i}>{x}</li>)}</ol>
                    </div>
                  ) : <span className="desc">No recipe on this one.</span>}
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <button type="button" className={`sc-chip ${cur.loved ? 'on' : ''}`} onClick={() => love(cur)} aria-pressed={cur.loved} data-testid="plate-love"><Icon name="heart" size={14} />{cur.loves}</button>
              {cur.card && <button type="button" className="btn sm" style={{ flex: 1 }} onClick={() => setFlip((f) => !f)} data-testid="plate-flip"><Icon name="flip" size={16} />{flip ? 'Show photo' : 'Flip for recipe'}</button>}
              {!cur.mine && <button type="button" className="btn ghost sm" onClick={() => report(cur)} aria-label="Report this plate" data-testid="plate-report"><Icon name="flag" size={16} /></button>}
            </div>
            {cur.mine && <PlateManage key={cur.id} mealId={cur.id} photoPath={cur.photo} onDeleted={() => { close(); setPlates((ps) => ps.filter((x) => x.id !== cur.id)); }} onShared={() => setReload((n) => n + 1)} />}
          </div>
        </div>
      )}
    </section>
  );
}
