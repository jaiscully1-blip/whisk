'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import { useKitchens } from './usePantry';
import Kitchen3D from './kitchen/Kitchen3D';
import Flat from './kitchen/Flat';
import { usePlace } from './kitchen/KitchenPanels';
import * as K from '@/lib/kitchen/models';
import { itemUrl } from '@/lib/art/items';
import { teamColors, COUNTRY_NAME } from '@/lib/world/flair';
import { nextPlace, placeUrl } from '@/lib/art/tampa';
import { fmt } from '@/lib/game';

export const tierOf = (n, done) => (done || n >= 5 ? 'gold' : n >= 3 ? 'silver' : n >= 1 ? 'bronze' : '');
export function FlagBar({ iso, size = 22 }) {
  const c = teamColors(iso).slice(0, 4);
  return <span className="flagbar" style={{ width: size, height: size, gridTemplateRows: `repeat(${c.length}, 1fr)` }} aria-hidden="true">{c.map((x, i) => <i key={i} style={{ background: x }} />)}</span>;
}

// Gold / Silver / Bronze: every country you've cooked from, by how many of its dishes you've made.
export function TierList({ countries }) {
  const rows = [['gold', 'Gold', '5 dishes'], ['silver', 'Silver', '3 dishes'], ['bronze', 'Bronze', '1 dish']];
  const by = { gold: [], silver: [], bronze: [] };
  for (const c of countries) { const t = tierOf(c.n, c.done); if (t) by[t].push(c); }
  return (
    <section className="tiers" aria-label="Your country tier list">
      {rows.map(([t, label, need]) => (
        <div key={t} className={`tier-row ${t}`}>
          <span className="tier-tag"><b>{label}</b><small>{need}</small></span>
          <div className="tier-items">
            {by[t].length ? by[t].map((c) => (
              <span key={c.country} className="tier-chip" title={`${COUNTRY_NAME[c.country] || c.country}: ${c.n} ${c.n === 1 ? 'dish' : 'dishes'}`}>
                <FlagBar iso={c.country} />{COUNTRY_NAME[c.country] || c.country}{t !== 'gold' && <i>{c.n}/{t === 'bronze' ? 3 : 5}</i>}
              </span>
            )) : <span className="tier-empty">{t === 'bronze' && !countries.length ? 'Cook a dish from any country to start' : '—'}</span>}
          </div>
        </div>
      ))}
    </section>
  );
}

// Level, where your kitchen is, and what you've collected.
export function ProfileCard({ level, recipes, ingredients, countries, streak }) {
  const place = usePlace();
  const next = nextPlace(level.level);
  const stats = [['Level', `${level.level}`], ['Restaurant', place.name], ['Recipes', fmt(recipes)], ['Ingredients', fmt(ingredients)], ['Countries', fmt(countries)], ['Streak', `${streak} ${streak === 1 ? 'day' : 'days'}`]];
  return (
    <section className="card pcard" aria-label="Profile">
      <dl className="pcard-grid">
        {stats.map(([k, v]) => <div key={k} className={k === 'Restaurant' ? 'wide' : ''}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {next && <span className="desc">Level {next.from}: move to the {next.name}</span>}
    </section>
  );
}

// The kitchen on display, where you live (by level). Things you buy show up in it.
export function MyKitchen() {
  const [kitchens] = useKitchens();
  const place = usePlace();
  const shown = kitchens?.find((k) => k.is_display) || null;
  const pieces = useMemo(() => (shown ? K.cleanPieces(shown.pieces) : []), [shown]);
  const [cam, setCam] = useState({ rz: -24, rx: 56, zoom: 1, px: 0, py: 0 });
  if (kitchens === null) return <div className="card" style={{ height: 300 }} aria-busy="true" />;
  return (
    <section className="mykitchen" id="my-kitchen" aria-label="Your kitchen">
      <Kitchen3D mode="view" place={place.key} pieces={pieces} cam={cam} onCam={setCam} height={320} />
      <div className="mk-bar">
        <span className="chip mk-where"><img src={placeUrl(place.key)} alt="" width="34" height="22" />{place.name}</span>
        <Link href="/pantry/kitchen/design" className="btn ghost sm"><Icon name="pencil" size={16} />{shown ? 'Edit' : 'Build it'}</Link>
      </div>
      {!shown && <span className="desc" style={{ textAlign: 'center' }}>{place.key === 'void' ? 'Nothing here yet. Cook a meal to move in, then build your kitchen.' : 'Build your kitchen, then everything you buy goes in it.'}</span>}
    </section>
  );
}

// Coins buy things for your kitchen; each one lands in the kitchen on display straight away.
const KINDS = [['all', 'All'], ['appliance', 'Appliances'], ['gear', 'Gear'], ['decor', 'Decor'], ['finish', 'Finishes'], ['country', 'From your countries']];
const FIN_SAMPLE = { fin_terrazzo: ['terrazzo', 'top'], fin_lacquer: ['lacquer', 'cabinet'], fin_copper: ['copper', 'appliance'], fin_goldmarble: ['goldmarble', 'top'] };
function ItemPic({ it, size = 64 }) {
  if (it.kind === 'appliance') return <span style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}><Flat mid={it.id} box={[size, size]} /></span>;
  if (it.kind === 'finish') {
    const [tex, grp] = FIN_SAMPLE[it.id] || ['marble', 'top'];
    const fin = { tex, color: K.colorsFor(grp, tex)[0]?.[0] || '#ccc' };
    const s = K.skin(fin, 0); return <span className="shop-swatch" style={{ width: size * 0.86, height: size * 0.62, background: s.slice(s.indexOf(':') + 1).replace(/;$/, '') }} />;
  }
  return <img src={itemUrl(it.id)} alt="" width={size} height={size} draggable={false} />;
}

export function KitchenShop({ world, setWorld, onGetCoins }) {
  const { supabase, profile, refreshProfile, say } = useWhisk();
  const [kitchens, reloadKitchens, setKitchens] = useKitchens();
  const [kind, setKind] = useState('all');
  const [buying, setBuying] = useState(null);
  const [busy, setBusy] = useState(false);
  const owned = useMemo(() => new Set(world?.owned || []), [world]);
  const doneSet = useMemo(() => new Set((world?.countries || []).filter((c) => c.done).map((c) => c.country)), [world]);
  // country things stay hidden until you've finished that country
  const shop = useMemo(() => (world?.shop || []).filter((it) => !it.country || doneSet.has(it.country)), [world, doneSet]);
  const hiddenCountries = (world?.shop || []).some((it) => it.country && !doneSet.has(it.country));
  const list = shop.filter((it) => kind === 'all' || (kind === 'country' ? !!it.country : it.kind === kind && !it.country)).sort((a, b) => (owned.has(a.id) - owned.has(b.id)) || a.price - b.price);
  const kinds = KINDS.filter(([k]) => k !== 'country' || shop.some((it) => it.country));

  // put what you bought into the kitchen on display (or a starter kitchen if you don't have one yet)
  async function addToKitchen(it) {
    let shown = (kitchens || []).find((k) => k.is_display);
    let pieces = shown ? K.cleanPieces(shown.pieces) : K.starterKitchen();
    let where = 'in your kitchen';
    if (it.kind === 'finish') {
      const [tex, grp] = FIN_SAMPLE[it.id];
      const color = K.colorsFor(grp, tex)[0][0];
      let n = 0;
      pieces = pieces.map((p) => {
        const m = K.MODEL[p.mid]; if (!m || m.thing) return p;
        if (grp === 'top' && m.top && m.cat !== 'cook') { n++; return { ...p, tfin: { tex, color } }; }
        if (grp !== 'top' && m.grp === grp && m.id !== 'panel') { n++; return { ...p, fin: { tex, color } }; }
        return p;
      });
      if (!n) where = 'ready in Paint';
    } else {
      const mid = it.kind === 'appliance' ? it.id : K.THING + it.id;
      if (!K.MODEL[mid]) return 'ready in your things';
      if (pieces.some((p) => p.mid === mid) && it.kind !== 'appliance') return where;
      const nb = it.kind === 'appliance' ? K.placeFree(pieces, K.piece(mid)) : K.placeThing(pieces, K.piece(mid));
      if (!nb || pieces.length >= 60) return 'ready in Layout kitchen (no room to place it)';
      pieces = [...pieces, nb];
    }
    const q = shown
      ? supabase.from('kitchen_layouts').update({ pieces }).eq('id', shown.id).select('id, name, pieces, is_display, updated_at').single()
      : supabase.from('kitchen_layouts').insert({ name: 'My kitchen', pieces, is_display: true }).select('id, name, pieces, is_display, updated_at').single();
    const { data, error } = await q;
    if (error) return 'ready in Layout kitchen';
    setKitchens((l) => [data, ...(l || []).filter((k) => k.id !== data.id).map((k) => ({ ...k, is_display: false }))]);
    reloadKitchens();
    return where;
  }
  async function buy() {
    if (!buying || busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('buy_kitchen_item', { p_item: buying.id });
    if (error) { setBusy(false); say(/enough/i.test(error.message) ? 'Not enough coins yet' : /complete|finish/i.test(error.message) ? 'Finish that country first' : /already/i.test(error.message) ? 'You already have that' : 'Couldn’t buy that'); return; }
    const it = buying;
    setWorld((w) => ({ ...w, owned: [...(w?.owned || []), it.id] }));
    window.dispatchEvent(new CustomEvent('whisk:bought', { detail: it.id }));
    refreshProfile();
    const where = await addToKitchen(it);
    setBusy(false); setBuying(null);
    say(`${it.name}: ${where}!`);
    if (where === 'in your kitchen') document.getElementById('my-kitchen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    void data;
  }

  return (
    <section className="stack shop" id="shop" aria-label="Kitchen shop" style={{ gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Kitchen shop</h2>
        <span className="row" data-tour="coins" style={{ gap: 6, flexWrap: 'nowrap' }}>
          <span className="row" style={{ gap: 4, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 18 }}><Coin size={20} />{fmt(profile?.coins)}</span>
          <button className="btn sm" onClick={onGetCoins} style={{ background: 'var(--gold)', color: '#23301F', boxShadow: '0 3px 0 #B8862A' }}><Coin size={16} />Get coins</button>
        </span>
      </div>
      {world?.missing ? <p className="muted" style={{ margin: 0 }}>The Kitchen shop opens after the next update.</p> : <>
        <div className="kd-cats" role="tablist" aria-label="Shop sections">
          {kinds.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={kind === k} className={`chip kd-cat ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>{l}</button>)}
        </div>
        <div className="closet-grid shop-grid">
          {list.map((it) => {
            const have = owned.has(it.id);
            return (
              <button key={it.id} type="button" className={`card tile ${have ? 'have' : ''}`} onClick={() => (have ? say(it.kind === 'finish' ? 'Yours · pick it in Paint' : 'Yours · it’s in your things') : setBuying(it))}
                aria-label={have ? `${it.name}, yours` : `${it.name}, ${fmt(it.price)} coins`}>
                <ItemPic it={it} />
                {it.country && <span className="shop-from"><FlagBar iso={it.country} size={14} /></span>}
                <span className="tname">{it.name}</span>
                {have ? <span className="tprice free"><Icon name="check" size={12} />Yours</span> : <span className="row tprice"><Coin size={12} />{fmt(it.price)}</span>}
              </button>
            );
          })}
        </div>
        {hiddenCountries && <p className="desc shop-teaser"><Icon name="lock" size={14} /> Finish a country (5 dishes) and its kitchen things show up here.</p>}
      </>}
      {buying && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setBuying(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Buy ${buying.name}`} style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="shop-big"><ItemPic it={buying} size={140} /></span>
            <h2 style={{ fontSize: 26, margin: 0 }}>{buying.name}</h2>
            <p className="muted" style={{ margin: 0 }}>{buying.kind === 'finish' ? 'Goes on everything it fits in your kitchen. Change it any time in Paint.' : 'Goes straight into your kitchen. Move it around in Layout kitchen.'}</p>
            <p className="muted" style={{ margin: 0 }}>You have {fmt(profile?.coins)} coins.</p>
            {(profile?.coins || 0) >= buying.price
              ? <button data-tour="buy" className="btn wide" onClick={buy} disabled={busy}><Coin />{busy ? 'Buying…' : `Buy for ${fmt(buying.price)}`}</button>
              : <><p className="err" style={{ margin: 0 }}>You need {fmt(buying.price - (profile?.coins || 0))} more coins. Each meal you cook pays 500.</p><button className="btn wide" onClick={() => { setBuying(null); onGetCoins(); }} style={{ background: 'var(--gold)', color: '#23301F', boxShadow: '0 3px 0 #B8862A' }}><Coin />Get coins</button></>}
            <button className="btn ghost wide" onClick={() => setBuying(null)}>Not now</button>
          </div>
        </div>
      )}
    </section>
  );
}

// Country challenges: a recipe from a country you've started, for extra XP (harder ones once it's Gold).
export function CountryChallenges({ challenges, onOpen }) {
  if (!challenges?.length) return null;
  return (
    <section className="stack" style={{ gap: 8 }} aria-label="Country challenges">
      <h2 style={{ fontSize: 22, margin: 0 }}>Country challenges</h2>
      {challenges.map((c) => (
        <button key={c.id} type="button" className={`card cchal ${c.xp >= 400 ? 'hard' : ''}`} onClick={() => onOpen(c)}>
          <FlagBar iso={c.country} size={34} />
          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><b>{c.title}</b><span className="desc" style={{ display: 'block' }}>{COUNTRY_NAME[c.country] || c.country}{c.xp >= 400 ? ' · Gold challenge' : ''}</span></span>
          <span className="chip xp">+{c.xp} XP</span>
        </button>
      ))}
    </section>
  );
}
