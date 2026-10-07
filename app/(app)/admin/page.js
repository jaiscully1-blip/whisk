'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from '@/components/AppShell';
import { fmt } from '@/lib/game';

// Backend dashboard: what players do in Whisk. Only accounts with profiles.is_admin = true can load it
// (the database functions refuse everyone else). Players who said no to usage data are not recorded at all.
const PERIODS = [[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days']];

function Bars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="adm-bars" role="img" aria-label="Events per day">
      {rows.map((r) => <div key={r.d} title={`${r.d}: ${r.n} events, ${r.players} players`}><i style={{ height: `${Math.max(3, (r.n / max) * 100)}%` }} /><span>{String(r.d).slice(5, 10)}</span></div>)}
    </div>
  );
}
function Table({ title, cols, rows, empty = 'Nothing yet.' }) {
  return (
    <section className="adm-card">
      <h3>{title}</h3>
      {rows.length ? (
        <table><thead><tr>{cols.map(([k, l, num]) => <th key={k} className={num ? 'num' : ''}>{l}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{cols.map(([k, , num]) => <td key={k} className={num ? 'num' : ''}>{num ? fmt(r[k]) : (r[k] ?? '—')}</td>)}</tr>)}</tbody></table>
      ) : <p className="desc">{empty}</p>}
    </section>
  );
}

export default function Admin() {
  const { supabase } = useWhisk();
  const [days, setDays] = useState(7);
  const [ov, setOv] = useState(null);
  const [feed, setFeed] = useState([]);
  const [who, setWho] = useState('');
  const [denied, setDenied] = useState(false);
  const [live, setLive] = useState(true);
  const [reports, setReports] = useState([]);   // reported plates (friends feed)
  const [thumbs, setThumbs] = useState({});
  const loadReports = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_reports'); if (error) return;
    setReports(data || []);
    const paths = (data || []).map((r) => r.photo).filter(Boolean);
    if (paths.length) { const { data: s } = await supabase.storage.from('meal-photos').createSignedUrls(paths, 3600); setThumbs(Object.fromEntries((s || []).filter((x) => x.signedUrl).map((x) => [x.path, x.signedUrl]))); }
  }, [supabase]);
  useEffect(() => { if (ov) loadReports(); }, [ov ? 1 : 0, loadReports]); // eslint-disable-line react-hooks/exhaustive-deps   (admins only: after the overview loads)
  async function setHidden(r, hidden) { await supabase.rpc('admin_set_hidden', { p_meal: r.meal, p_hidden: hidden }); loadReports(); }

  const load = useCallback(async () => {
    const [o, f] = await Promise.all([supabase.rpc('admin_overview', { p_days: days }), supabase.rpc('admin_events', { p_limit: 100, p_player: who.trim() || null })]);
    if (o.error) { setDenied(true); return; }
    setOv(o.data); setFeed(f.data || []);
  }, [supabase, days, who]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!live || denied) return; const t = setInterval(load, 15000); return () => clearInterval(t); }, [live, load, denied]);
  async function more() {
    const last = feed[feed.length - 1]; if (!last) return;
    const { data } = await supabase.rpc('admin_events', { p_limit: 100, p_before: last.id, p_player: who.trim() || null });
    setFeed((f) => [...f, ...(data || [])]);
  }

  if (denied) return <div className="empty" style={{ marginTop: 24 }}><b>Not available</b>This page is only for Whisk admins.</div>;
  if (!ov) return <p className="muted">Loading…</p>;
  return (
    <div className="stack adm">
      <div className="page-title"><h1>Backend</h1>
        <label className="row" style={{ gap: 6, fontSize: 13, fontWeight: 800 }}><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />Live</label>
      </div>
      <div className="row" role="tablist" aria-label="Period">{PERIODS.map(([d, l]) => <button key={d} role="tab" aria-selected={days === d} className={`btn sm ${days === d ? '' : 'ghost'}`} onClick={() => setDays(d)}>{l}</button>)}</div>
      <div className="adm-tiles">
        {[['Players', ov.players], ['New', ov.new_players], ['Active', ov.active_players], ['Actions', ov.events], ['Meals cooked', ov.meals]].map(([l, v]) => <div key={l} className="adm-card"><span className="eyebrow">{l}</span><b>{fmt(v)}</b></div>)}
      </div>
      <section className="adm-card"><h3>Actions per day</h3>{ov.per_day.length ? <Bars rows={ov.per_day} /> : <p className="desc">No activity in this period.</p>}</section>
      <Table title="Pages" cols={[['page', 'Page'], ['n', 'Actions', true]]} rows={ov.by_page} />
      <Table title="Most-pressed buttons" cols={[['target', 'Button'], ['page', 'Page'], ['n', 'Taps', true]]} rows={ov.top_taps} />
      <Table title="Top searches" cols={[['q', 'Search'], ['n', 'Times', true]]} rows={ov.top_searches} />
      {reports.length > 0 && (
        <section className="adm-card">
          <h3>Reported plates</h3>
          <table><thead><tr><th>Plate</th><th>By</th><th>Reports</th><th></th></tr></thead>
            <tbody>{reports.map((r) => (
              <tr key={r.meal}>
                <td>{thumbs[r.photo] ? <img src={thumbs[r.photo]} alt="" width="56" height="56" style={{ objectFit: 'cover', borderRadius: 8, verticalAlign: 'middle', marginRight: 8 }} /> : null}{r.title}</td>
                <td>{r.name}</td><td>{r.reports} <span className="desc">({(r.reasons || []).join(', ')})</span></td>
                <td>{r.hidden ? <button className="btn ghost sm" onClick={() => setHidden(r, false)}>Put back</button> : <button className="btn sm" onClick={() => setHidden(r, true)}>Hide</button>}</td>
              </tr>
            ))}</tbody></table>
        </section>
      )}
      <section className="adm-card">
        <div className="row" style={{ justifyContent: 'space-between' }}><h3>Activity feed</h3>
          <input className="input" style={{ maxWidth: 180, minHeight: 36 }} placeholder="Filter by player" value={who} onChange={(e) => setWho(e.target.value.slice(0, 40))} aria-label="Filter by player" /></div>
        {feed.length ? (
          <table><thead><tr><th>When</th><th>Player</th><th>Action</th><th>Detail</th></tr></thead>
            <tbody>{feed.map((e) => (
              <tr key={e.id}><td className="nowrap">{new Date(e.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' })}</td>
                <td>{e.player}</td><td><span className={`adm-kind k-${e.kind}`}>{e.kind}</span> <span className="desc">{e.page}</span></td>
                <td>{e.target}{e.value ? <span className="desc"> → {e.value}</span> : null}{e.device ? <span className="desc"> · {e.device}</span> : null}</td></tr>
            ))}</tbody></table>
        ) : <p className="desc">Nothing recorded yet.</p>}
        {feed.length >= 100 && <button className="btn ghost wide" onClick={more}>Load older</button>}
      </section>
    </div>
  );
}
