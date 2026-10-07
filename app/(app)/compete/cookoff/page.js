'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWhisk } from '@/components/AppShell';
import Icon, { Coin } from '@/components/Icon';
import Scene from '@/components/Scene';
import CookWheel from '@/components/CookWheel';
import { IngredientList, StepList } from '@/components/RecipeSteps';
import { usePantry } from '@/components/usePantry';
import { checkRecipe } from '@/lib/recipes/match';
import { fmt } from '@/lib/game';
import { isPhoto, uploadPlate } from '@/lib/photo';

// A live Cook Off: lobby (code + who's in) → the wheel → cook against one shared clock → photo → vote → winner.
// Everything authoritative happens on the server (supabase/migrations/0017); this screen asks every few seconds.
const SPIN_MS = 8000;
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const errText = (e) => String(e?.message || '').replace(/^.*?: /, '').replace(/^\w/, (c) => c.toUpperCase()) || 'Something went wrong.';

export default function CookOffPage() { return <Suspense fallback={null}><CookOff /></Suspense>; }

function CookOff() {
  const sp = useSearchParams();
  const code = (sp.get('code') || '').toUpperCase();
  const asJudge = sp.get('as') === 'judge';
  const router = useRouter();
  const { supabase, recipes, profile, refreshProfile, say } = useWhisk();
  const [pantry] = usePantry();
  const [g, setG] = useState(null);
  const [err, setErr] = useState('');
  const [phase, setPhase] = useState('');   // local: '' | 'spin' | 'cook'
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState({});
  const [pick, setPick] = useState(null);   // the plate you've chosen, before you submit the vote
  const off = useRef(0);   // server clock − this phone's clock
  const asked = useRef(false);

  const load = useCallback(async () => {
    let { data, error } = await supabase.rpc('get_cookoff', { p_code: code });
    // came from a judge link and not in the game yet: join as a judge
    if (error && asJudge && /not in this game/.test(error.message || '')) ({ data, error } = await supabase.rpc('join_cookoff_judge', { p_code: code }));
    if (error) { setErr(errText(error)); return null; }
    off.current = new Date(data.now).getTime() - Date.now(); setG(data); setErr(''); return data;
  }, [supabase, code, asJudge]);
  useEffect(() => { load(); }, [load]);
  // Ask the server what's happening: often in the lobby and while voting, less while cooking.
  useEffect(() => {
    if (!g || g.status === 'done' || g.status === 'cancelled') return undefined;
    const t = setInterval(() => { if (!document.hidden) load(); }, g.status === 'cooking' ? 5000 : 2000);
    return () => clearInterval(t);
  }, [g?.status, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const local = (iso) => (iso ? new Date(iso).getTime() - off.current : 0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);

  const me = g?.players?.find((p) => p.me);
  const judging = me?.role === 'judge';
  const cooks = (g?.players || []).filter((p) => p.role !== 'judge');
  const judges = (g?.players || []).filter((p) => p.role === 'judge');
  const byId = useMemo(() => new Map((recipes || []).map((r) => [r.id, r])), [recipes]);
  // Recipes this phone's pantry can make within the game's time: what goes on the wheel.
  const pool = useMemo(() => (recipes && pantry && g ? recipes.filter((r) => r.minutes <= g.minutes && checkRecipe(r, pantry).ok) : null), [recipes, pantry, g?.minutes]); // eslint-disable-line react-hooks/exhaustive-deps
  const wheelPool = useMemo(() => (recipes && g ? recipes.filter((r) => r.minutes <= g.minutes) : []), [recipes, g?.minutes]); // eslint-disable-line react-hooks/exhaustive-deps
  const myRecipe = me?.recipe_id ? byId.get(me.recipe_id) : null;

  // Cooking started: get my recipe (the server picks one of mine at random), then spin to it.
  useEffect(() => {
    if (g?.status !== 'cooking' || !pool || asked.current || judging) return;
    asked.current = true;
    if (me?.recipe_id) { setPhase(Date.now() < local(g.started_at) + SPIN_MS ? 'spin' : 'cook'); return; }
    if (!pool.length) { setErr('Your pantry can’t make anything that fits this game’s time. Stock up for the next one.'); return; }
    supabase.rpc('set_cookoff_recipe', { p_code: code, p_candidates: pool.map((r) => r.id) }).then(({ error }) => {
      if (error) { setErr(errText(error)); return; }
      load().then(() => setPhase(Date.now() < local(g.started_at) + SPIN_MS ? 'spin' : 'cook'));
    });
  }, [g?.status, pool, judging]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submitVote() {
    if (pick == null) return;
    const data = await act('vote_cookoff', { p_code: code, p_seat: pick });
    if (data && judging) { say('Thanks for judging! Now start cooking your own'); setTimeout(() => router.replace('/cook'), 1200); }
  }
  async function inviteJudges() {
    const url = `${window.location.origin}/vote/${code}`;
    const text = `Come judge my Whisk Cook Off! Vote for the best plate:`;
    try { if (navigator.share) await navigator.share({ text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); say('Judge link copied'); } } catch {}
  }
  // Keep the screen on during the game.
  useEffect(() => {
    if (!g || g.status === 'done') return undefined;
    let lock = null; const get = async () => { try { if (!document.hidden && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); } catch {} };
    get(); const vis = () => get(); document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); try { lock?.release(); } catch {} };
  }, [!!g, g?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  // Other players' plates (private photos, shown only once voting starts).
  useEffect(() => {
    if (!g || (g.status !== 'voting' && g.status !== 'done')) return;
    const need = g.players.filter((p) => p.photo && !photos[p.photo]).map((p) => p.photo); if (!need.length) return;
    supabase.storage.from('meal-photos').createSignedUrls(need, 900).then(({ data }) => {
      if (data) setPhotos((x) => ({ ...x, ...Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) }));
    });
  }, [g?.status, g?.players?.length, supabase]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (g?.status === 'done') refreshProfile(); }, [g?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(fn, args) {
    setBusy(true);
    const { data, error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) { say(errText(error)); return null; }
    if (data && data.players) { off.current = new Date(data.now).getTime() - Date.now(); setG(data); }
    return data;
  }
  async function submitPhoto(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    if (!isPhoto(f)) { say('Pick a photo (JPG, PNG or WebP).'); return; }
    setBusy(true);
    try {
      const path = await uploadPlate(supabase, profile.id, f);
      const { data, error } = await supabase.rpc('submit_cookoff', { p_code: code, p_photo_path: path });
      if (error) throw error;
      setG(data); say('Plate in! Wait for the others…');
      supabase.rpc('log_meal', { p_recipe_id: me.recipe_id, p_photo_path: path }).then(() => refreshProfile());   // it counts as a cooked meal too (+20 XP)
    } catch (x) { say(errText(x)); } finally { setBusy(false); }
  }

  if (err && !g) return <div className="stack" style={{ paddingTop: 24 }}><div className="empty"><b>{err}</b><Link className="btn ghost" href="/compete" style={{ marginTop: 12 }}>Back to Compete</Link></div></div>;
  if (!g) return <p className="muted" style={{ paddingTop: 24 }}>Joining…</p>;

  // ---------- lobby ----------
  if (g.status === 'lobby' || g.status === 'cancelled') {
    const canPlay = pool ? pool.length > 0 : true;
    return (
      <div className="stack" style={{ paddingTop: 16 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><h1 style={{ fontSize: 30 }}>Cook Off</h1><span className="chip">{g.minutes} min</span></div>
        {g.status === 'cancelled' ? <div className="empty"><b>This game was closed</b>The host left before it started.<Link className="btn ghost" href="/compete" style={{ marginTop: 12 }}>Back to Compete</Link></div> : <>
          <div className="card co-code" aria-label={`Game code ${code.split('').join(' ')}`}>
            <span className="desc">Friends join with this code</span>
            <b>{code}</b>
            <button className="btn ghost sm" onClick={async () => { const text = `Join my Whisk Cook Off! Code: ${code}`; try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(code); say('Code copied'); } } catch {} }}>Share code</button>
          </div>
          {judging && <p className="judge-note" style={{ textAlign: 'center' }}>You’re a judge. When the cooking’s done, you’ll vote for the best plate.</p>}
          {!canPlay && !judging && <p className="err" role="alert" style={{ margin: 0 }}>Your pantry can’t make any recipe in {g.minutes} minutes yet. Add more to your pantry before the host starts.</p>}
          <span className="eyebrow">Cooks in the kitchen · {cooks.length}</span>
          <div className="co-players">{cooks.map((p) => <span key={p.seat} className={`co-chip ${p.me ? 'me' : ''}`}>{p.host && <Icon name="star" size={14} />}{p.name}{p.me ? ' (you)' : ''}</span>)}</div>
          {judges.length > 0 && <><span className="eyebrow">Judges · {judges.length}</span><div className="co-players">{judges.map((p) => <span key={p.seat} className={`co-chip judge ${p.me ? 'me' : ''}`}>{p.name}{p.me ? ' (you)' : ''}</span>)}</div></>}
          {!judging && <button className="btn ghost wide" onClick={inviteJudges}><Icon name="link" size={18} />Invite judges to vote</button>}
          {g.is_host && !judging
            ? <button className="btn wide co-start" disabled={busy} onClick={() => act('start_cookoff', { p_code: code })}>Start the Cook Off</button>
            : <p className="muted" style={{ textAlign: 'center', margin: 0 }}>Waiting for the host to start…</p>}
          <button className="btn ghost wide" disabled={busy} onClick={async () => { await supabase.rpc('leave_cookoff', { p_code: code }); router.push('/compete'); }}>{g.is_host ? 'Close this game' : 'Leave'}</button>
        </>}
      </div>
    );
  }

  // ---------- full screen from here on ----------
  const endAt = local(g.ends_at), left = endAt - now;
  if (g.status === 'cooking' && judging) {
    return (
      <div className="co-full co-vote">
        <div className="co-timer"><Icon name="timer" size={22} />{mmss(left)}</div>
        <h2 className="co-big">You’re judging</h2>
        <p style={{ textAlign: 'center', margin: 0 }}>{cooks.filter((p) => p.done).length} of {cooks.length} cooks have a plate in. Voting opens when time’s up or everyone’s done.</p>
        <div className="co-players" style={{ justifyContent: 'center' }}>{cooks.map((p) => <span key={p.seat} className="co-chip">{p.done ? '✓ ' : ''}{p.name}</span>)}</div>
        <button className="btn ghost wide" onClick={inviteJudges}><Icon name="link" size={18} />Invite more judges</button>
      </div>
    );
  }
  if (g.status === 'cooking' && (phase === 'spin' || !myRecipe)) {
    return (
      <div className="co-full co-spin">
        <h2 className="co-big">{myRecipe ? 'Spinning…' : err || 'Getting your recipe…'}</h2>
        {myRecipe && <CookWheel pool={wheelPool} target={myRecipe} endsAt={local(g.started_at) + SPIN_MS} onDone={() => setPhase('cook')} />}
        {err && <Link className="btn ghost" href="/compete">Back to Compete</Link>}
      </div>
    );
  }
  if (g.status === 'cooking' && myRecipe) {
    const done = cooks.filter((p) => p.done).length;
    return (
      <div className="co-full co-cook">
        <Scene iso={myRecipe.country} cuisine={myRecipe.cuisine} title={myRecipe.title} height={190} />
        <div className="co-cook-in stack">
          <div className="co-timer" role="timer" aria-live="off" data-low={left < 60000 ? 'true' : undefined}><Icon name="timer" size={22} />{mmss(left)}</div>
          <div><span className="eyebrow">{myRecipe.cuisine} · {myRecipe.minutes} min</span><h2 style={{ fontSize: 28 }}>{myRecipe.title}</h2></div>
          <span className="desc">{done} of {cooks.length} plates in{judges.length ? ` · ${judges.length} judge${judges.length === 1 ? '' : 's'} waiting` : ''}</span>
          {me.done ? <div className="empty"><b>Your plate is in</b>Waiting for the others, or the clock.</div> : (
            <label className={`btn wide co-snap ${busy ? 'busy' : ''}`}><Icon name="camera" size={20} />{busy ? 'Sending…' : 'Done! Snap your plate'}<input type="file" accept="image/*" capture="environment" hidden onChange={submitPhoto} disabled={busy} /></label>
          )}
          <h3>Ingredients</h3><IngredientList r={myRecipe} />
          <h3>Steps</h3><StepList r={myRecipe} />
        </div>
      </div>
    );
  }

  // ---------- voting ----------
  const plates = g.players.filter((p) => p.photo);
  if (g.status === 'voting') {
    const vleft = local(g.vote_ends_at) - now; const voted = me?.my_vote != null;
    return (
      <div className="co-full co-vote">
        <div className="co-timer"><Icon name="timer" size={22} />{mmss(vleft)}</div>
        <h2 className="co-big">{voted ? 'Vote in! Waiting for the rest…' : judging ? 'Judge: pick the best plate' : 'Vote for the best plate'}</h2>
        <div className="co-plates" role="radiogroup" aria-label="Plates">
          {plates.map((p) => { const r = byId.get(p.recipe_id); return (
            <button key={p.seat} role="radio" aria-checked={(voted ? me?.my_vote : pick) === p.seat} className={`card co-plate ${(voted ? me?.my_vote : pick) === p.seat ? 'picked' : ''}`} disabled={p.me || voted || busy} onClick={() => setPick(p.seat)} aria-label={`${p.name}: ${r?.title || ''}${p.me ? ' (yours)' : ''}`}>
              {photos[p.photo] ? <img src={photos[p.photo]} alt="" /> : <span className="co-ph" />}
              <b>{p.name}{p.me ? ' (you)' : ''}</b><span className="desc">{r?.title}</span>
            </button>
          ); })}
        </div>
        {!plates.length && <p className="muted">Nobody sent a plate this time.</p>}
        {!voted && plates.length > 0 && <button className="btn wide co-submit" disabled={pick == null || busy} onClick={submitVote}>{pick == null ? 'Tap a plate to pick it' : 'Submit vote'}</button>}
      </div>
    );
  }

  // ---------- done ----------
  const winners = g.players.filter((p) => p.winner);
  return (
    <div className="co-full co-done">
      <h2 className="co-big">{winners.length ? (winners.length > 1 ? 'It’s a tie!' : `${winners[0].name} wins!`) : 'Game over'}</h2>
      {me?.reward > 0 && <p className="co-reward"><Coin /> +{fmt(me.reward)} coins</p>}
      <div className="co-plates">
        {plates.slice().sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((p) => (
          <div key={p.seat} className={`card co-plate ${p.winner ? 'won' : ''}`}>
            {photos[p.photo] ? <img src={photos[p.photo]} alt="" /> : <span className="co-ph" />}
            <b>{p.winner ? '🏆 ' : ''}{p.name}{p.me ? ' (you)' : ''}</b><span className="desc">{p.votes || 0} vote{p.votes === 1 ? '' : 's'} · {byId.get(p.recipe_id)?.title}</span>
          </div>
        ))}
      </div>
      <Link className="btn wide" href="/compete">Back to Compete</Link>
    </div>
  );
}
