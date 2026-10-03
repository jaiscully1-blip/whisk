'use client';
import { useEffect, useMemo, useState } from 'react';
import { useWhisk } from '@/components/AppShell';
import LogMealSheet from '@/components/LogMealSheet';
import Icon, { Coin } from '@/components/Icon';
import { fmt } from '@/lib/game';

const TIER = { 1: ['Small', 'var(--fresh-soft)', 'var(--fresh)'], 2: ['Medium', 'var(--warn-soft)', 'var(--warn)'], 3: ['Big', 'var(--pop-soft)', 'var(--bad)'] };
const SLOTS = [['top', 'Tops'], ['hat', 'Hats'], ['glasses', 'Glasses'], ['shoes', 'Shoes'], ['acc', 'Accessory']];
const RARITY_ORDER = ['common', 'rare', 'epic', 'exotic', 'mythic'];
const TECH = ['', 'boil', 'sauté', 'sear/roast', 'sauce/braise', 'dough/pastry'];

function useThumbs(ids) {
  const [thumbs, setThumbs] = useState({});
  useEffect(() => {
    let alive = true;
    import('@/lib/whisk3d/engine').then(async ({ ITEMS_BY_ID, renderThumb }) => {
      for (const id of ids) {
        if (!alive) return;
        const it = ITEMS_BY_ID[id]; if (!it) continue;
        try { const url = renderThumb(it); setThumbs((t) => (t[id] ? t : { ...t, [id]: url })); } catch (e) { console.error(e); }
        await new Promise((r) => setTimeout(r, 10));
      }
    });
    return () => { alive = false; };
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return thumbs;
}

export default function Compete() {
  const { supabase, profile, refreshProfile, say } = useWhisk();
  const [challenges, setChallenges] = useState(null);
  const [items, setItems] = useState([]);
  const [owned, setOwned] = useState(new Set());
  const [slot, setSlot] = useState('top');
  const [menu, setMenu] = useState(false);
  const [buying, setBuying] = useState(null);
  const [logging, setLogging] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bingo, setBingo] = useState(null);

  async function load() {
    const [c, i, v] = await Promise.all([supabase.rpc('get_weekly_challenges'), supabase.from('items').select('id, slot, name, rarity, price, sort').order('sort'), supabase.from('inventory').select('item_id')]);
    setChallenges(c.data || []); setItems(i.data || []); setOwned(new Set((v.data || []).map((x) => x.item_id)));
    const b = await supabase.rpc('get_bingo'); if (!b.error) setBingo(b.data);
  }
  async function claimBingo() {
    const { data, error } = await supabase.rpc('claim_bingo');
    if (error) { say('Get 4 in a row first.'); return; }
    setBingo((b) => ({ ...b, claimed: true })); say(`BINGO! +${data?.xp ?? 200} XP`); refreshProfile();
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => items.filter((i) => i.slot === slot).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.sort - b.sort), [items, slot]);
  const reps = useMemo(() => SLOTS.map(([k]) => items.find((i) => i.slot === k)?.id).filter(Boolean), [items]);
  const thumbs = useThumbs([...reps, ...list.map((i) => i.id)]);
  const resetIn = useMemo(() => { const now = new Date(); const d = (8 - now.getUTCDay()) % 7 || 7; return `${d}d`; }, []);

  async function confirmBuy() {
    setBusy(true);
    const { error } = await supabase.rpc('buy_item', { p_item_id: buying.id });
    setBusy(false);
    if (error) { say(error.message.includes('enough') ? 'Not enough coins yet' : 'Couldn’t buy that'); return; }
    setOwned((s) => new Set(s).add(buying.id)); setBuying(null); refreshProfile(); say(`${buying.name} is yours! Wear it from the Me tab.`);
  }

  return (
    <div className="stack">
      <div className="page-title"><h1>Compete</h1><span className="muted">Resets in {resetIn}</span></div>

      <h2 style={{ fontSize: 22 }}>This week’s challenges</h2>
      {challenges === null ? <p className="muted">Loading…</p> : challenges.map((c) => {
        const [tier, bg, ink] = TIER[c.slot];
        return (
          <div key={c.id} className="card stack" style={{ gap: 10, opacity: c.completed_at ? .7 : 1 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="chip" style={{ background: bg, color: ink, fontWeight: 800, textTransform: 'uppercase', fontSize: 12, letterSpacing: '.06em' }}>{tier}</span>
              <span className="row" style={{ gap: 5, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 22 }}><Coin size={20} />{fmt(c.coins)}</span>
            </div>
            <h3 style={{ fontSize: 20 }}>{c.meal_name}</h3>
            <div className="row" style={{ flexWrap: 'nowrap' }}><span style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>Difficulty {c.score}/100</span><div className="bar" style={{ flex: 1 }}><i style={{ width: `${c.score}%`, background: ink }} /></div></div>
            <div className="row"><span className="chip">{c.minutes >= 60 ? `${Math.round(c.minutes / 60 * 10) / 10} hr` : `${c.minutes} min`}</span><span className="chip">Technique {c.technique}/5 · {TECH[c.technique]}</span><span className="chip">{c.steps} steps</span></div>
            {c.completed_at ? <span className="row" style={{ color: 'var(--fresh)', fontWeight: 800 }}><Icon name="check" />Done · coins added</span>
              : <button className="btn" onClick={() => setLogging(c)}>I cooked it · add photo</button>}
          </div>
        );
      })}

      {bingo && (
        <section className="stack" style={{ gap: 10 }} aria-labelledby="bingo-h">
          <div className="row" style={{ justifyContent: 'space-between' }}><h2 id="bingo-h" style={{ fontSize: 22 }}>Cuisine bingo</h2><span className="chip xp">+200 XP</span></div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Cook a dish from each cuisine this week. Four in a row (across, down or diagonal) wins.</p>
          <div role="grid" aria-label="Bingo card" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
            {bingo.cells.map((cell, i) => {
              const on = bingo.marks?.[i];
              return (
                <div key={i} role="gridcell" aria-label={`${cell}${on ? ', cooked' : ''}`} style={{ aspectRatio: '1', borderRadius: 14, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 4, fontSize: 12.5, fontWeight: 800, lineHeight: 1.1,
                  background: on ? 'var(--accent)' : 'var(--card)', color: on ? 'var(--btn-ink)' : 'var(--fg)', border: `1.5px solid ${on ? 'var(--accent)' : 'var(--line)'}` }}>
                  {on ? <span><Icon name="check" size={16} /><br />{cell}</span> : cell}
                </div>
              );
            })}
          </div>
          {bingo.claimed ? <span className="row" style={{ color: 'var(--fresh)', fontWeight: 800 }}><Icon name="check" />Bingo claimed · new card Monday</span>
            : bingo.lines > 0 ? <button className="btn" onClick={claimBingo}>Claim BINGO · +200 XP</button>
            : <span className="muted" style={{ fontWeight: 800, fontSize: 13 }}>{(bingo.marks || []).filter(Boolean).length}/16 cooked</span>}
        </section>
      )}

      <h2 id="shop" style={{ fontSize: 22, marginTop: 10 }}>Shop</h2>
      <div style={{ position: 'relative' }}>
        <button className="card" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="listbox" style={{ width: '100%', display: 'grid', placeItems: 'center', gap: 2, border: '2px solid var(--fg)', boxShadow: '0 4px 0 var(--fg)', position: 'relative' }}>
          {thumbs[reps[SLOTS.findIndex(([k]) => k === slot)]] ? <img src={thumbs[reps[SLOTS.findIndex(([k]) => k === slot)]]} alt="" width="84" height="84" /> : <span style={{ height: 84 }} />}
          <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 22 }}>{SLOTS.find(([k]) => k === slot)[1]}</span>
          <span style={{ position: 'absolute', right: 16, top: '50%', transform: `translateY(-50%) rotate(${menu ? 270 : 90}deg)` }}><Icon name="chevron" /></span>
        </button>
        {menu && (
          <div role="listbox" className="card" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, top: 'calc(100% + 8px)', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4, padding: 8, border: '2px solid var(--fg)' }}>
            {SLOTS.map(([k, label], i) => (
              <button key={k} role="option" aria-selected={k === slot} onClick={() => { setSlot(k); setMenu(false); }} style={{ border: k === slot ? '2px solid var(--accent)' : '2px solid transparent', background: k === slot ? 'var(--stage)' : 'transparent', borderRadius: 14, padding: '6px 0', display: 'grid', placeItems: 'center', gap: 2, fontWeight: 800, fontSize: 12 }}>
                {thumbs[reps[i]] ? <img src={thumbs[reps[i]]} alt="" width="48" height="48" /> : <span style={{ height: 48 }} />}{label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {list.map((it) => {
          const have = owned.has(it.id);
          return (
            <button key={it.id} onClick={() => !have && setBuying(it)} aria-label={`${it.name}, ${it.rarity}, ${have ? 'owned' : fmt(it.price) + ' coins'}`}
              style={{ border: `2px solid var(--${it.rarity})`, borderRadius: 18, background: `linear-gradient(180deg, var(--card) 35%, color-mix(in srgb, var(--${it.rarity}) 22%, var(--card)))`, padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
              <span style={{ alignSelf: 'flex-start', background: `var(--${it.rarity})`, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 99 }}>{it.rarity}</span>
              {thumbs[it.id] ? <img src={thumbs[it.id]} alt="" width="96" height="96" /> : <span style={{ height: 96 }} />}
              <span style={{ fontWeight: 800, fontSize: 13.5, minHeight: 34, display: 'flex', alignItems: 'center' }}>{it.name}</span>
              {have ? <span className="chip have">Owned</span> : <span className="row" style={{ gap: 4, fontWeight: 800, fontSize: 13 }}><Coin size={14} />{fmt(it.price)}</span>}
            </button>
          );
        })}
      </div>

      {buying && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setBuying(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Buy ${buying.name}`} style={{ alignItems: 'center', textAlign: 'center' }}>
            {thumbs[buying.id] && <img src={thumbs[buying.id]} alt="" width="150" height="150" />}
            <span className="chip" style={{ background: `var(--${buying.rarity})`, color: '#fff', textTransform: 'uppercase', fontWeight: 800 }}>{buying.rarity}</span>
            <h2 style={{ fontSize: 26 }}>{buying.name}</h2>
            <p className="muted" style={{ margin: 0 }}>You have {fmt(profile?.coins)} coins.</p>
            {profile?.coins >= buying.price
              ? <button className="btn wide" onClick={confirmBuy} disabled={busy}><Coin />{busy ? 'Buying…' : `Buy for ${fmt(buying.price)}`}</button>
              : <p className="err" style={{ margin: 0 }}>You need {fmt(buying.price - (profile?.coins || 0))} more coins. Finish a challenge above to earn them.</p>}
            <button className="btn ghost wide" onClick={() => setBuying(null)}>Not now</button>
          </div>
        </div>
      )}
      {logging && <LogMealSheet title={logging.meal_name} cuisine={logging.cuisine} challenge={logging} onClose={() => setLogging(null)} onDone={load} />}
    </div>
  );
}
