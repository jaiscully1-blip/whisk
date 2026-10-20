'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import PlateManage from './PlateManage';
import LogMealSheet from './LogMealSheet';
import { seatColor } from './PartyHub';

const when = (t) => { const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000)); if (s < 90) return 'Just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`; const d = Math.round(s / 86400); return d === 1 ? 'Yesterday' : d < 7 ? `${d} days ago` : new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' }); };

// Post a plate to the party: pick the dish you cooked (search, or one you opened lately), then add the photo like any meal.
function PostPlate({ gid, onClose, onDone }) {
  const { allRecipes, ensureRecipes, ui, getUi } = useWhisk();
  const [q, setQ] = useState('');
  const [recipe, setRecipe] = useState(null);
  const recents = ((getUi?.() || ui)?.recentRecipes || []).slice(0, 6);
  const found = q.trim().length >= 2 ? (allRecipes || []).filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  async function choose(r) { const full = (allRecipes || []).find((x) => x.id === r.id) || (await ensureRecipes([r.id]))[0]; if (full) setRecipe(full); }
  if (recipe) return <LogMealSheet recipe={recipe} presetGroups={[gid]} onClose={onClose} onDone={onDone} />;
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack" role="dialog" aria-modal="true" aria-label="Post a plate" data-testid="post-plate">
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><h2 style={{ fontSize: 24, margin: 0 }}>Post a plate</h2><button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        <span className="desc">What did you cook? Your photo goes on the party’s plates.</span>
        <input className="input" placeholder="Search recipes" autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search recipes" data-testid="post-find" />
        {(q.trim() ? found : recents).map((r) => <button key={r.id} type="button" className="card pp-pick" onClick={() => choose(r)} data-testid="post-pick">{r.title}<Icon name="chevron" size={16} /></button>)}
        {q.trim().length >= 2 && found.length === 0 && <span className="desc">Nothing found. Try another word.</span>}
        {!q.trim() && recents.length === 0 && <span className="desc">Search for the dish you cooked.</span>}
      </div>
    </div>
  );
}

// A party's photo wall: every plate its members shared to it, newest first, in a strip you swipe sideways. Anyone in the
// party can post one. Tap a plate to open it; flip it over to read the recipe on the back.
export default function PartyPlates({ gid }) {
  const { supabase, say, dataVersion } = useWhisk();
  const [plates, setPlates] = useState(null);
  const [urls, setUrls] = useState({});
  const [who, setWho] = useState('');
  const [open, setOpen] = useState(null);
  const [flip, setFlip] = useState(false);
  const [reload, setReload] = useState(0);
  const [posting, setPosting] = useState(false);

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
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <span className="eyebrow">Plates</span>
        {plates.length > 1 && <span className="desc">Newest first · swipe</span>}
      </div>
      {people.length > 1 && (
        <div className="row pp-who" style={{ gap: 6 }}>
          <button type="button" className={`sc-chip ${!who ? 'on' : ''}`} onClick={() => setWho('')}>All</button>
          {people.map((m) => <button key={m.code} type="button" className={`sc-chip ${who === m.code ? 'on' : ''}`} onClick={() => setWho(m.code)} style={who === m.code ? undefined : { borderColor: seatColor(m.seat) }}>{m.name}</button>)}
        </div>
      )}
      <div className="pp-strip" role="list" aria-label="Plates, newest first">
        <button type="button" role="listitem" className="pp-card pp-post" onClick={() => setPosting(true)} data-testid="post-plate-btn"><span className="pp-plus"><Icon name="camera" size={26} /></span><b>Post a plate</b><small>Cooked something? Show the party.</small></button>
        {shown.map((p, i) => (
          <button key={p.id} type="button" role="listitem" className={`pp-card ${i === 0 && !who ? 'latest' : ''}`} data-testid="party-plate" onClick={() => { setOpen(p.id); setFlip(false); }} aria-label={`${p.mine ? 'Your' : p.name + '’s'} ${p.title}, ${when(p.at)}`}>
            {urls[p.photo] ? <img src={urls[p.photo]} alt="" loading="lazy" decoding="async" /> : <span className="pp-ph"><Icon name="utensils" size={28} /></span>}
            <span className="pp-time">{i === 0 && !who ? 'Latest · ' : ''}{when(p.at)}</span>
            <span className="pp-who-dot" style={{ background: seatColor(p.seat) }} aria-hidden="true">{(p.mine ? 'Y' : p.name).slice(0, 1).toUpperCase()}</span>
            {p.card && <span className="pp-badge"><Icon name="flip" size={11} />recipe</span>}
            <span className="pp-cap"><b>{p.title}</b><small>{p.mine ? 'You' : p.name}{p.loves ? ` · ♥ ${p.loves}` : ''}</small></span>
          </button>
        ))}
      </div>
      {plates.length === 0 && <span className="desc">No plates yet. Be the first!</span>}
      {posting && <PostPlate gid={gid} onClose={() => setPosting(false)} onDone={() => setReload((n) => n + 1)} />}
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
