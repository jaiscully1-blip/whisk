'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import VideoCook from '@/components/VideoCook';
import { parseYouTuber } from '@/lib/youtubers';

// One of your channels: its recent cooking videos (vlogs, Q&As and such are left out). Tap one to cook along.
export default function ChannelPage() { return <Suspense fallback={null}><Channel /></Suspense>; }

function Channel() {
  const sp = useSearchParams();
  const u = sp.get('u') || ''; const name = (sp.get('n') || '').slice(0, 40);
  const p = parseYouTuber(u);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  async function load() {
    setErr(''); setData(null);
    try {
      const r = await fetch(`/api/channel?u=${encodeURIComponent(p.url)}`, { credentials: 'same-origin' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || 'Couldn’t load this channel.'); return; }
      setData(j);
    } catch { setErr('You look offline. Try again.'); }
  }
  useEffect(() => { if (p) load(); }, [u]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <div className="empty" style={{ marginTop: 24 }}><b>That channel link doesn’t work</b><Link className="btn ghost" href="/cook" style={{ marginTop: 12 }}>Back to Cook</Link></div>;
  const title = data?.title || name || p.handle;
  const vids = data?.videos || [];
  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      <div className="row" style={{ flexWrap: 'nowrap', gap: 10 }}>
        <Link href="/cook" className="btn ghost sm" aria-label="Back to Cook" style={{ width: 44, padding: 0 }}><Icon name="chevron" style={{ transform: 'rotate(180deg)' }} /></Link>
        {data?.avatar ? <img src={data.avatar} alt="" width="44" height="44" className="ch-avatar" /> : <span className="social yt" aria-hidden="true"><Icon name="yt" size={22} /></span>}
        <h1 style={{ fontSize: 26, flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{title}</h1>
      </div>
      {!data && !err && Array.from({ length: 3 }, (_, i) => <div key={i} className="card vid-card skel" aria-hidden="true"><span className="vid-thumb" /><span style={{ flex: 1 }}><i /><i /></span></div>)}
      {err && <div className="empty"><b>{err}</b><div className="row" style={{ justifyContent: 'center', marginTop: 10 }}><button className="btn ghost sm" onClick={load}>Try again</button><a className="btn ghost sm" href={p.url} target="_blank" rel="noopener noreferrer">Open on YouTube</a></div></div>}
      {data && !data.found && <div className="empty"><b>Whisk can’t list this channel’s videos</b>{data.needsKey ? 'Video lists need YouTube switched on for Whisk.' : 'YouTube doesn’t share this kind of channel link.'}<a className="btn ghost" href={p.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>Open on YouTube</a></div>}
      {data?.found && !vids.length && <div className="empty"><b>No cooking videos lately</b>Nothing recent here is about cooking.<a className="btn ghost" href={p.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>Open on YouTube</a></div>}
      {vids.map((v) => (
        <button key={v.id} type="button" className="card vid-card" onClick={() => setOpen(v)}>
          <img className="vid-thumb" src={v.thumb} alt="" loading="lazy" decoding="async" />
          <span className="stack" style={{ gap: 6, flex: 1, minWidth: 0 }}>
            <b className="vid-title">{v.title}</b>
            <span className="row" style={{ gap: 6 }}>
              {v.recipe.ingredients.length > 0 && <span className="chip have">Recipe</span>}
              {v.recipe.stepsFrom && <span className="chip">{v.recipe.steps.length} steps</span>}
              {v.short && <span className="chip">Short</span>}
            </span>
          </span>
        </button>
      ))}
      {open && <VideoCook video={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
