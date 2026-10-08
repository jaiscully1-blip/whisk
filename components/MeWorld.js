'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';
import { useKitchens } from './usePantry';
import KitchenStage from './kitchen/KitchenStage';
import { usePlace } from './kitchen/KitchenPanels';
import * as K from '@/lib/kitchen/models';
import { itemUrl } from '@/lib/art/items';
import { MAGNETS, magnetUrl } from '@/lib/art/magnets';
import { teamColors, COUNTRY_NAME } from '@/lib/world/flair';
import { nextPlace } from '@/lib/art/tampa';
import { fmt, LEVELS } from '@/lib/game';

export const tierOf = (n, done) => (done || n >= 5 ? 'gold' : n >= 3 ? 'silver' : n >= 1 ? 'bronze' : '');
// The country's real flag (flag-icons, MIT), drawn 4:3.
export function FlagBar({ iso, size = 22 }) {
  if (!/^[A-Z]{2}$/.test(iso || '')) return null;
  return <img className="flagimg" src={`/flags/${iso.toLowerCase()}.svg`} alt="" width={Math.round(size * 4 / 3)} height={size} loading="lazy" decoding="async" />;
}

// Level, where your kitchen is, and what you've collected.
export function ProfileCard({ level, xp, recipes, ingredients, countries, streak }) {
  const place = usePlace();
  const next = nextPlace(level.level);
  const stats = [['Level', `${level.level}`], ['Recipes', fmt(recipes)], ['Ingredients', fmt(ingredients)], ['Countries', fmt(countries)], ['Streak', `${streak} ${streak === 1 ? 'day' : 'days'}`]];
  // progress toward the next home
  const xpAt = (lv) => (LEVELS.find((l) => l[0] === lv) || [0, 0])[1];
  const a = xpAt(place.from), b = next ? xpAt(next.from) : 0;
  const pct = next ? Math.max(0, Math.min(100, Math.floor(((xp - a) / Math.max(1, b - a)) * 100))) : 100;
  return (
    <section className="card pcard" aria-label="Profile" data-tip="profile">
      <dl className="pcard-grid">
        {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {next && (
        <div className="pcard-next" aria-label={`${pct}% of the way to ${next.name}`}>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <b>{next.name}</b>
        </div>
      )}
    </section>
  );
}

// The kitchen on display, where you live (by level). Things you buy show up in it.
export function MyKitchen() {
  const { supabase, say } = useWhisk();
  const [kitchens, , setKitchens] = useKitchens();
  const [naming, setNaming] = useState(null);
  const place = usePlace();
  const shown = kitchens?.find((k) => k.is_display) || null;
  const pieces = useMemo(() => (shown ? K.cleanPieces(shown.pieces) : []), [shown]);
  if (kitchens === null) return <div className="card" style={{ height: 300 }} aria-busy="true" />;
  // the kitchen's own name, or where it is (e.g. "Riverwalk Apartment") until you name it
  const title = shown && shown.name && shown.name !== 'My kitchen' ? shown.name : place.name;
  async function rename(e) {
    e.preventDefault();
    const name = (naming || '').trim().slice(0, 40) || 'My kitchen';
    setNaming(null);
    if (!shown || name === shown.name) return;
    setKitchens((l) => (l || []).map((k) => (k.id === shown.id ? { ...k, name } : k)));
    const { error } = await supabase.from('kitchen_layouts').update({ name }).eq('id', shown.id);
    if (error) say('Couldn’t rename it.');
  }
  return (
    <section className="mykitchen" id="my-kitchen" aria-label="Your kitchen" data-tip="mykitchen">
      {naming !== null ? (
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={rename}>
          <label htmlFor="mk-name" hidden>Kitchen name</label>
          <input id="mk-name" className="input" maxLength={40} value={naming} onChange={(e) => setNaming(e.target.value)} autoFocus onBlur={rename} onKeyDown={(e) => { if (e.key === 'Escape') setNaming(null); }} />
          <button className="btn sm" type="submit">Save</button>
        </form>
      ) : (
        <div className="mk-bar">
          <button type="button" className="mk-title" onClick={() => (shown ? setNaming(title) : say('Build your kitchen first'))} aria-label={`${title}. Tap to rename`}><h2>{title}</h2></button>
          <Link href="/pantry/kitchen/design" className="btn ghost sm"><Icon name="pencil" size={16} />{shown ? 'Edit' : 'Build it'}</Link>
        </div>
      )}
      <KitchenStage mode="view" place={place.key} pieces={pieces} title={title} height={420} scale={0.9} />
      {!shown && <span className="desc" style={{ textAlign: 'center' }}>{place.key === 'void' ? 'Nothing here yet. Cook a meal to move in, then build your kitchen.' : 'Build your kitchen, then everything you buy goes in it.'}</span>}
    </section>
  );
}

// Coins buy things for your kitchen; each one lands in the kitchen on display straight away.
// shop sections: kitchen things, finishes, then fridge magnets by kind
const KINDS = [['kitchen', 'Kitchen'], ['dog', 'Dogs'], ['cat', 'Cats'], ['pet', 'Pets'], ['place', 'Places'], ['paper', 'Cards & art'], ['cool', 'Cool magnets'], ['finish', 'Finishes'], ['country', 'From your countries']];
const SECTION = { city: 'place', postcard: 'place', art: 'paper', drawing: 'paper', test: 'paper', report: 'paper', wedding: 'paper', xmas: 'paper' };
const sectionOf = (it) => (it.country ? 'country' : it.kind === 'magnet' ? (SECTION[MAGNETS[it.id]?.group] || MAGNETS[it.id]?.group || 'cool') : it.kind === 'finish' ? 'finish' : 'kitchen');
const FIN_SAMPLE = { fin_terrazzo: ['terrazzo', 'top'], fin_lacquer: ['lacquer', 'cabinet'], fin_copper: ['copper', 'appliance'], fin_goldmarble: ['goldmarble', 'top'] };
function ItemPic({ it, size = 64 }) {
  if (it.kind === 'magnet') return <img src={magnetUrl(it.id)} alt="" width={size} height={size} draggable={false} />;
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
  const [kind, setKind] = useState('kitchen');
  const [buying, setBuying] = useState(null);
  const [busy, setBusy] = useState(false);
  const owned = useMemo(() => new Set(world?.owned || []), [world]);
  const doneSet = useMemo(() => new Set((world?.countries || []).filter((c) => c.done).map((c) => c.country)), [world]);
  // country things stay hidden until you've finished that country
  const shop = useMemo(() => (world?.shop || []).filter((it) => !it.country || doneSet.has(it.country)), [world, doneSet]);
  const list = shop.filter((it) => it.kind !== 'appliance' && sectionOf(it) === kind)
    .sort((a, b) => (owned.has(a.id) - owned.has(b.id)) || (a.kind === 'magnet' && a.price === b.price ? a.name.localeCompare(b.name) : a.price - b.price));
  const kinds = KINDS.filter(([k]) => shop.some((it) => it.kind !== 'appliance' && sectionOf(it) === k));

  // put what you bought into the kitchen on display (or a starter kitchen if you don't have one yet)
  async function addToKitchen(it) {
    if (it.kind === 'magnet') {
      const shownK = (kitchens || []).find((k) => k.is_display);
      return shownK && K.cleanPieces(shownK.pieces).some((p) => K.MODEL[p.mid]?.cat === 'fridge') ? 'on your fridge' : 'yours (add a fridge in Layout kitchen to show it off)';
    }
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
    if (where === 'in your kitchen' || where === 'on your fridge') document.getElementById('my-kitchen')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              <button key={it.id} type="button" className={`card tile ${have ? 'have' : ''}`} onClick={() => (have ? say(it.kind === 'finish' ? 'Yours · pick it in Paint' : it.kind === 'magnet' ? 'Yours · it’s on your fridge' : 'Yours · it’s in your things') : setBuying(it))}
                aria-label={have ? `${it.name}, yours` : `${it.name}, ${fmt(it.price)} coins`}>
                <ItemPic it={it} />
                {it.country && <span className="shop-from"><FlagBar iso={it.country} size={14} /></span>}
                <span className="tname">{it.name}</span>
                {have ? <span className="tprice free"><Icon name="check" size={12} />Yours</span> : <span className="row tprice"><Coin size={12} />{fmt(it.price)}</span>}
              </button>
            );
          })}
        </div>
      </>}
      {buying && (
        <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setBuying(null); }}>
          <div className="sheet stack" role="dialog" aria-modal="true" aria-label={`Buy ${buying.name}`} style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="shop-big"><ItemPic it={buying} size={140} /></span>
            <h2 style={{ fontSize: 26, margin: 0 }}>{buying.name}</h2>
            <p className="muted" style={{ margin: 0 }}>{buying.kind === 'finish' ? 'Goes on everything it fits in your kitchen. Change it any time in Paint.' : buying.kind === 'magnet' ? 'Sticks to the fridge in your kitchen.' : 'Goes straight into your kitchen. Move it around in Layout kitchen.'}</p>
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
      <h2 style={{ fontSize: 22, margin: 0 }} data-tip="cchallenges">Country challenges</h2>
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
