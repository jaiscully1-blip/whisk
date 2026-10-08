'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';
import { useKitchens, useWorld } from '@/components/usePantry';
import Kitchen3D, { ZOOM } from '@/components/kitchen/Kitchen3D';
import Flat from '@/components/kitchen/Flat';
import * as K from '@/lib/kitchen/models';

const COLS = 'id, name, pieces, is_display, updated_at';
const sig = (name, pieces) => JSON.stringify([name, pieces]);

// Kitchen designer: a 3D floor-plan mini game. Keep up to 12 kitchens (your real one, a dream kitchen…);
// only the one "on display" shows up in your Pantry. Building a new one never changes the one on display.
export default function Design() {
  const { supabase, say, ui, setUi } = useWhisk();
  const [list, reload, setList] = useKitchens();
  const [world] = useWorld();
  const owned = useMemo(() => new Set(world?.owned || []), [world]);
  const [edit, setEdit] = useState(null);         // { id, name, pieces, saved }
  const [sel, setSel] = useState(null);
  const [sheet, setSheet] = useState(null);       // 'add' | 'paint' | 'new' | 'mine'
  const [look, setLook] = useState(false);        // preview with doors on
  const [open, setOpen] = useState({});
  const [cam, setCam] = useState({ rz: -24, rx: 56, zoom: 1, px: 0, py: 0 });
  const [dir, setDir] = useState(1);              // the one depth button: 1 = toward you, -1 = away
  const [busy, setBusy] = useState(false);
  const [spun, setSpun] = useState(false);
  const taught = !!ui.kitchenTaught;

  // first open: the kitchen on display, or a starter kitchen to play with
  useEffect(() => {
    if (edit || list === null) return;
    const k = list.find((x) => x.is_display) || list[0];
    if (k) { const p = K.cleanPieces(k.pieces); setEdit({ id: k.id, name: k.name, pieces: p, saved: sig(k.name, p) }); }
    else setEdit({ id: null, name: 'My kitchen', pieces: K.starterKitchen(), saved: '' });
  }, [list, edit]);

  const dirty = !!edit && sig(edit.name, edit.pieces) !== edit.saved;
  const shownId = list?.find((k) => k.is_display)?.id;
  const isShown = !!edit?.id && edit.id === shownId;
  const selB = edit?.pieces.find((p) => p.id === sel) || null;
  const setPieces = (fn) => setEdit((e) => ({ ...e, pieces: typeof fn === 'function' ? fn(e.pieces) : fn }));

  function openKitchen(k) {
    const p = K.cleanPieces(k.pieces);
    setEdit({ id: k.id, name: k.name, pieces: p, saved: sig(k.name, p) }); setSel(null); setSheet(null); setOpen({});
  }
  function fresh(kind) {
    const n = (list?.length || 0) + 1;
    const pieces = kind === 'starter' ? K.starterKitchen() : kind === 'copy' ? edit.pieces.map((p) => ({ ...p, id: K.newId() })) : [];
    setEdit({ id: null, name: kind === 'copy' ? `${edit.name} copy`.slice(0, 40) : kind === 'dream' ? 'Dream kitchen' : `Kitchen ${n}`, pieces, saved: '' });
    setSel(null); setSheet(null); setLook(false);
  }
  async function save() {
    if (!edit || busy) return null;
    setBusy(true);
    const name = edit.name.trim().slice(0, 40) || 'My kitchen';
    const pieces = K.cleanPieces(edit.pieces);
    if (pieces.some((p) => K.needs(p).some((id) => !owned.has(id)))) { setBusy(false); say('This kitchen uses something you don’t own yet'); return null; }
    const first = !list?.some((k) => k.is_display);
    const q = edit.id
      ? supabase.from('kitchen_layouts').update({ name, pieces }).eq('id', edit.id).select(COLS).single()
      : supabase.from('kitchen_layouts').insert({ name, pieces, is_display: first }).select(COLS).single();
    const { data, error } = await q;
    setBusy(false);
    if (error) { say(/12 kitchens/.test(error.message) ? 'You can keep 12 kitchens. Delete one first.' : 'Couldn’t save. Try again.'); return null; }
    setList((l) => [data, ...(l || []).filter((k) => k.id !== data.id)]);
    setEdit((e) => ({ ...e, id: data.id, name, saved: sig(name, e.pieces) }));
    say(first ? 'Saved · it’s on display in your Pantry' : `Saved ${name}`);
    return data;
  }
  async function display() {
    let id = edit?.id;
    if (!id || dirty) { const d = await save(); if (!d) return; id = d.id; }
    const { error } = await supabase.rpc('show_kitchen', { p_id: id });
    if (error) { say('Couldn’t put it on display.'); return; }
    setList((l) => (l || []).map((k) => ({ ...k, is_display: k.id === id })));
    say('On display in your Pantry'); reload();
  }
  async function remove(k) {
    const { error } = await supabase.from('kitchen_layouts').delete().eq('id', k.id);
    if (error) { say('Couldn’t delete that.'); return; }
    setList((l) => (l || []).filter((x) => x.id !== k.id));
    if (edit?.id === k.id) setEdit((e) => ({ ...e, id: null, saved: '' }));
    say(`Deleted ${k.name}`);
  }
  function addModel(mid) {
    const m = K.MODEL[mid];
    if (K.needs({ mid }).some((id) => !owned.has(id))) { say(`Get the ${m.nick.toLowerCase()} in the Kitchen shop on Me`); return; }
    if (edit.pieces.length >= 60) { say('That’s a lot of kitchen! 60 pieces max.'); return; }
    const nb = m.thing ? K.placeThing(edit.pieces, K.piece(mid)) : K.placeFree(edit.pieces, K.piece(mid));
    if (!nb) { say('No room left on the floor. Shrink or remove something.'); return; }
    setPieces((p) => [...p, nb]); setSel(nb.id); setSheet(null); setLook(false);
    if (K.isRoom(nb)) setCam((c) => ({ ...c, zoom: Math.min(c.zoom || 1, 0.62), px: 0, py: 0 }));   // step back so the new room shows next to the kitchen
    say(`+ ${m.nick}`);
  }
  const copySel = () => { if (!selB) return; if (K.isThing(selB)) { say('You have one of those'); return; } const nb = K.placeFree(edit.pieces, { ...selB, id: K.newId() }); if (!nb) { say('No room left on the floor.'); return; } setPieces((p) => [...p, nb]); setSel(nb.id); };
  const removeSel = () => { setPieces((p) => p.filter((x) => x.id !== sel)); setSel(null); };

  if (!edit) return <p className="muted" style={{ marginTop: 24 }}>Loading your kitchen…</p>;
  const hint = look ? 'Tap a door' : !selB ? (spun ? 'Tap a piece' : 'Drag to spin · pinch to zoom') : taught ? 'Drag it anywhere' : 'Drag it anywhere · pull a dot to stretch';
  // one small button moves it toward you; at the front it flips and goes back the other way
  function nudge() {
    if (!selB) return;
    const at = (d) => { const n = { ...selB, y: selB.y + d }; if (K.isThing(n)) n.z = K.restZ(edit.pieces, n); return K.clash(edit.pieces, n) ? null : n; };
    let n = at(dir), d = dir;
    if (!n) { d = -dir; n = at(d); }
    if (!n) { say('Something’s in the way'); return; }
    setPieces((p) => p.map((x) => (x.id === n.id ? n : x)));
    setDir(K.clash(edit.pieces, { ...n, y: n.y + d }) ? -d : d);   // can't go further → the arrow flips
  }

  return (
    <div className="stack kd">
      <div className="page-title">
        <Link href="/pantry" className="title-link"><Icon name="chevron" size={20} style={{ transform: 'rotate(180deg)' }} />Pantry</Link>
        <h1>Layout kitchen</h1>
      </div>

      <div className="kd-top">
        <button type="button" className="kd-name" onClick={() => setSheet('mine')} aria-label={`${edit.name}. Switch kitchen`}>
          <span className="kd-dot" style={{ background: isShown ? 'var(--accent)' : 'var(--track)' }} />
          <b>{edit.name}</b>{dirty && <i className="kd-unsaved" title="Not saved">•</i>}<Icon name="chevron" size={16} style={{ transform: "rotate(90deg)" }} />
        </button>
        <div className="kd-actions">
          <button type="button" className="btn ghost sm" onClick={() => setSheet('new')}><Icon name="plus" size={16} />New</button>
          <button type="button" className={`btn sm ${dirty || !edit.id ? 'kd-pulse' : 'ghost'}`} onClick={save} disabled={busy || (!dirty && !!edit.id)}>{!dirty && edit.id ? <><Icon name="check" size={16} />Saved</> : 'Save'}</button>
          <button type="button" className="btn ghost sm" onClick={display} disabled={busy || isShown} aria-label={isShown ? 'On display in your Pantry' : 'Put on display in your Pantry'}>{isShown ? <><Icon name="check" size={16} />Showing</> : 'Display'}</button>
        </div>
      </div>

      <div className="kd-stage" data-tip="design">
        <Kitchen3D mode={look ? 'view' : 'build'} pieces={edit.pieces} cam={cam} onCam={(c) => { setCam(c); if (!spun) setSpun(true); }} height="min(56vh, 480px)"
          sel={sel} onSelect={setSel} onChange={(p) => setPieces(p)} taught={taught} onTaught={() => setUi({ kitchenTaught: true })}
          open={open} onToggle={(k) => setOpen((o) => ({ ...o, [k]: !o[k] }))} />
        <span className="kd-hint">{hint}</span>
        <div className="kd-zoom">
          <button type="button" className="kd-round" onClick={() => setCam((c) => ({ ...c, zoom: K.clamp((c.zoom || 1) * 1.25, ZOOM[0], ZOOM[1]) }))} aria-label="Zoom in"><Icon name="plus" size={18} /></button>
          <button type="button" className="kd-round" onClick={() => setCam((c) => ({ ...c, zoom: K.clamp((c.zoom || 1) / 1.25, ZOOM[0], ZOOM[1]) }))} aria-label="Zoom out"><b style={{ fontSize: 22, lineHeight: 1 }}>−</b></button>
        </div>
        <div className="kd-cam">
          <button type="button" className="kd-round" onClick={() => setCam((c) => ({ ...c, rz: c.rz + 45 }))} aria-label="Spin left"><Icon name="undo" size={18} /></button>
          <button type="button" className={`kd-round ${look ? 'on' : ''}`} onClick={() => { setLook((l) => !l); setSel(null); setOpen({}); }} aria-pressed={look} aria-label={look ? 'Back to building' : 'Look with doors on'}><Icon name={look ? 'pencil' : 'pantry'} size={18} /></button>
          <button type="button" className="kd-round" onClick={() => setCam({ rz: -24, rx: 56, zoom: 1, px: 0, py: 0 })} aria-label="Reset view"><Icon name="shuffle" size={18} /></button>
          <button type="button" className="kd-round" onClick={() => setCam((c) => ({ ...c, rz: c.rz - 45 }))} aria-label="Spin right"><Icon name="undo" size={18} style={{ transform: 'scaleX(-1)' }} /></button>
        </div>
      </div>

      {selB && !look ? (
        <div className="card kd-sel">
          <button type="button" className="kd-thumb" onClick={() => !K.isThing(selB) && setSheet('paint')} aria-label={K.isThing(selB) ? K.MODEL[selB.mid].desc : 'Colour and texture'}><Flat {...selB} box={[44, 48]} /></button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{K.MODEL[selB.mid].desc}</b>
            <div className="desc">{K.isThing(selB) ? (selB.z > 0 ? 'On the counter' : 'On the floor') : `${selB.w} × ${selB.d} ft · ${selB.h} ft tall`}</div>
          </div>
          <div className="kd-tools">
            <button type="button" className="kd-depth" onClick={nudge} aria-label={dir > 0 ? 'Bring it toward you' : 'Push it back'}><Icon name="chevron" size={20} style={{ transform: `rotate(${dir > 0 ? 90 : -90}deg)` }} /></button>
            {!K.isThing(selB) && <button type="button" className="btn ghost sm" onClick={() => setSheet('paint')}>Paint</button>}
            {!K.isThing(selB) && <button type="button" className="btn ghost sm" onClick={copySel} aria-label="Copy it"><Icon name="plus" size={16} /></button>}
            <button type="button" className="btn ghost sm" onClick={removeSel} aria-label="Remove it" style={{ color: 'var(--bad)' }}><Icon name="trash" size={16} /></button>
            <button type="button" className="btn sm" onClick={() => setSel(null)} aria-label="Done with this piece"><Icon name="check" size={16} /></button>
          </div>
        </div>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          <div className="grid2">
            <button type="button" className="btn ghost" data-tip="storage" onClick={() => addModel('closet')}><Icon name="pantry" size={18} />Pantry closet</button>
            <button type="button" className="btn ghost" onClick={() => addModel('spice')}><Icon name="plus" size={18} />Spice cabinet</button>
          </div>
          <div className="grid2">
            <button type="button" className="btn ghost" onClick={() => setSheet('add')}><Icon name="plus" size={18} />Add</button>
            <Link href="/pantry/kitchen" className="btn">Put food away</Link>
          </div>
        </div>
      )}
      <p className="desc" style={{ margin: 0, textAlign: 'center' }}>{edit.pieces.length} pieces · {K.index(edit.pieces).total} spots{isShown ? ' · on display in your Pantry' : ''}</p>

      {sheet === 'add' && <AddSheet onAdd={addModel} owned={owned} placed={edit.pieces} onClose={() => setSheet(null)} />}
      {sheet === 'paint' && selB && <PaintSheet b={selB} owned={owned} onLocked={(t) => say(`${K.TEX[t].label} is in the Kitchen shop on Me`)} onChange={(patch) => setPieces((p) => p.map((x) => (x.id === selB.id ? { ...x, ...patch } : x)))} onClose={() => setSheet(null)} />}
      {sheet === 'new' && (
        <Sheet onClose={() => setSheet(null)} label="New kitchen">
          <h2 style={{ margin: 0 }}>New kitchen</h2>
          {dirty && <Unsaved name={edit.name} onSave={save} />}
          <p className="desc" style={{ margin: 0 }}>The kitchen in your Pantry stays the same until you press Display.</p>
          <div className="grid2">
            {[['starter', 'Starter kitchen', 'ff'], ['dream', 'Dream kitchen', 'retro'], ['blank', 'Empty floor', null], ['copy', 'Copy this one', 'd3']].map(([k, label, mid]) => (
              <button key={k} type="button" className="card kd-new" onClick={() => fresh(k)}><span className="kd-new-pic">{mid ? <Flat mid={mid} box={[40, 46]} /> : <span className="kd-grid" />}</span><b>{label}</b></button>
            ))}
          </div>
        </Sheet>
      )}
      {sheet === 'mine' && (
        <Sheet onClose={() => setSheet(null)} label="My kitchens">
          <h2 style={{ margin: 0 }}>My kitchens</h2>
          {dirty && <Unsaved name={edit.name} onSave={save} />}
          <label className="lbl" htmlFor="kd-name">Name</label>
          <input id="kd-name" className="input" maxLength={40} value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
          <div className="stack" style={{ gap: 8 }}>
            {(list || []).map((k) => <MineRow key={k.id} k={k} current={k.id === edit.id} onOpen={() => openKitchen(k)} onDelete={() => remove(k)} />)}
            {!list?.length && <span className="muted">Nothing saved yet. Press Save to keep this one.</span>}
          </div>
          <span className="desc">{list?.length || 0} of 12 kitchens</span>
        </Sheet>
      )}
    </div>
  );
}

function Unsaved({ name, onSave }) {
  return (
    <div className="kd-warn"><span>“{name}” has changes</span><button type="button" className="btn sm" onClick={onSave}>Save</button></div>
  );
}
function MineRow({ k, current, onOpen, onDelete }) {
  const [sure, setSure] = useState(false);
  const p = K.cleanPieces(k.pieces);
  return (
    <div className={`card kd-mine ${current ? 'on' : ''}`}>
      <button type="button" className="kd-mine-main" onClick={onOpen}>
        <span className="kd-mini">{p.slice(0, 4).map((x) => <Flat key={x.id} {...x} box={[22, 30]} />)}</span>
        <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><b>{k.name}</b><span className="desc" style={{ display: 'block' }}>{p.length} pieces{k.is_display ? ' · on display' : ''}</span></span>
      </button>
      {k.is_display ? <span className="chip have">Showing</span>
        : <button type="button" className={`btn sm ${sure ? '' : 'ghost'}`} style={sure ? { background: 'var(--bad)', boxShadow: 'none' } : { border: 0 }} onClick={() => (sure ? onDelete() : setSure(true))} aria-label={sure ? `Yes, delete ${k.name}` : `Delete ${k.name}`}>{sure ? 'Delete?' : <Icon name="trash" size={16} />}</button>}
    </div>
  );
}
function Sheet({ children, onClose, label }) {
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack kd-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <span className="kd-grab" />
        {children}
        <button type="button" className="btn wide" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function AddSheet({ onAdd, owned, placed, onClose }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  // "Your things": what you bought in the Kitchen shop (one of each; the ones already in this kitchen are marked)
  const mine = useMemo(() => Object.values(K.MODEL).filter((m) => (m.thing ? owned.has(m.item) : m.shop && owned.has(m.id))), [owned]);
  const ranked = useMemo(() => (cat === 'mine' ? mine.map((m) => ({ m, sc: K.score(m, q) })).filter((r) => r.sc >= 0)
    : K.MODELS.map((m) => ({ m, sc: K.score(m, q) - (m.shop && !owned.has(m.id) ? 2000 : 0) })).filter((r) => r.sc > -1500 || (!q.trim() && r.sc > -3000)).filter((r) => cat === 'all' || r.m.cat === cat)).sort((a, b) => b.sc - a.sc), [q, cat, mine, owned]);
  const guess = q.trim() ? ranked.find((r) => r.m.desc.toLowerCase().startsWith(q.toLowerCase()))?.m : null;
  const ghost = guess ? guess.desc.slice(q.length) : '';
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet kd-sheet kd-add" role="dialog" aria-modal="true" aria-label="Add a piece">
        <span className="kd-grab" />
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <div className="kd-search">
            <div className="kd-ghost" aria-hidden="true"><span style={{ color: 'transparent' }}>{q}</span>{ghost}</div>
            <input className="input" value={q} onChange={(e) => { setQ(e.target.value); if (cat === 'mine') setCat('all'); }} placeholder="Describe it… “fridge with 2 doors”" aria-label="Describe it" autoComplete="off" spellCheck={false}
              onKeyDown={(e) => { if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost) { e.preventDefault(); setQ(guess.desc); } if (e.key === 'Enter' && ranked[0]) { e.preventDefault(); onAdd(ranked[0].m.id); } }} />
          </div>
          {ghost && <button type="button" className="btn sm kd-accept" onClick={() => setQ(guess.desc)} aria-label={`Use ${guess.desc}`}><Icon name="chevron" size={18} /></button>}
          <button type="button" className="btn ghost sm" onClick={onClose} aria-label="Close"><Icon name="x" size={16} /></button>
        </div>
        <div className="kd-cats">
          {[{ id: 'mine', label: `Your things${mine.length ? ` · ${mine.length}` : ''}`, color: 'var(--gold)' }, { id: 'all', label: 'All', color: 'var(--fg)' }, ...K.CATS].map((c) => (
            <button key={c.id} type="button" className={`chip kd-cat ${cat === c.id ? 'on' : ''}`} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}><i style={{ background: c.color }} />{c.label}</button>
          ))}
        </div>
        <div className="kd-results">
          {ranked.map((r, i) => {
            const locked = r.m.shop && !owned.has(r.m.id), here = r.m.thing && placed.some((p) => p.mid === r.m.id);
            return (
              <button key={r.m.id} type="button" className={`card kd-res ${q.trim() && i === 0 ? 'best' : ''} ${locked ? 'locked' : ''}`} onClick={() => onAdd(r.m.id)} disabled={here} aria-label={locked ? `${r.m.desc}, in the Kitchen shop` : here ? `${r.m.desc}, already in this kitchen` : r.m.desc}>
                <span className="kd-res-pic"><Flat mid={r.m.id} box={[104, 80]} /></span>
                <span>{r.m.desc}{locked && <span className="kd-lock"><Icon name="lock" size={13} />Shop</span>}{here && <span className="kd-lock in"><Icon name="check" size={13} />In</span>}</span>
              </button>
            );
          })}
          {!ranked.length && <p className="muted" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>{cat === 'mine' ? 'Nothing yet. Buy kitchen things with coins on Me.' : 'No match. Try “door”, “drawer” or “shelf”.'}</p>}
        </div>
      </div>
    </div>
  );
}

function PaintSheet({ b, owned, onLocked, onChange, onClose }) {
  const m = K.MODEL[b.mid];
  const texRow = (cur, grp, key) => K.GROUPS[grp].map((t) => {
    const cols = K.colorsFor(grp, t), keep = cols.some((c) => c[0].toLowerCase() === cur.color.toLowerCase());
    const sample = { tex: t, color: t === cur.tex || keep ? cur.color : cols[0][0] };
    const locked = K.PREMIUM[t] && !owned.has(K.PREMIUM[t]);
    return (
      <button key={t} type="button" className={`kd-tex ${cur.tex === t ? 'on' : ''} ${locked ? 'locked' : ''}`} aria-pressed={cur.tex === t} aria-label={locked ? `${K.TEX[t].label}, in the Kitchen shop` : undefined} onClick={() => (locked ? onLocked(t) : onChange({ [key]: { tex: t, color: keep ? cur.color : cols[0][0] } }))}>
        <span style={{ position: 'relative', width: 52, height: 36, borderRadius: 9, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)', ...cssOf(K.skin(sample, 0)) }}>{locked && <span className="kd-texlock"><Icon name="lock" size={14} /></span>}</span>{K.TEX[t].label}
      </button>
    );
  });
  const colRow = (cur, grp, key) => (
    <div className="row" style={{ gap: 10 }}>
      {K.colorsFor(grp, cur.tex).map(([hex, name]) => (
        <button key={hex} type="button" className={`kd-sw ${hex.toLowerCase() === cur.color.toLowerCase() ? 'on' : ''}`} style={cssOf(K.skin({ tex: cur.tex, color: hex }, 0))} onClick={() => onChange({ [key]: { ...cur, color: hex } })} aria-label={name} />
      ))}
      <label className="kd-sw kd-any" aria-label="Any colour"><input type="color" value={cur.color} onChange={(e) => onChange({ [key]: { ...cur, color: e.target.value } })} /></label>
    </div>
  );
  return (
    <Sheet onClose={onClose} label="Colour and texture">
      <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-end' }}>
        <span className="kd-preview"><Flat {...b} box={[88, 96]} /></span>
        <div style={{ minWidth: 0 }}><b>{m.desc}</b><div className="desc">{K.TEX[b.fin.tex].label}{m.top ? ` · ${K.TEX[b.tfin.tex].label} top` : ''}</div></div>
      </div>
      <span className="eyebrow">Texture</span>
      <div className="kd-texrow">{texRow(b.fin, m.grp, 'fin')}</div>
      <span className="eyebrow">Colour</span>
      {colRow(b.fin, m.grp, 'fin')}
      {m.top && <>
        <span className="eyebrow">Countertop</span>
        <div className="kd-texrow">{texRow(b.tfin, 'top', 'tfin')}</div>
        {colRow(b.tfin, 'top', 'tfin')}
      </>}
    </Sheet>
  );
}
function cssOf(s) { const i = s.indexOf(':'); return { background: s.slice(i + 1).replace(/;$/, '') }; }
