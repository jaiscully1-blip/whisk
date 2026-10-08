'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useWhisk } from './AppShell';
import { cleanList, parseYouTuber, MAX_YOUTUBERS } from '@/lib/youtubers';

// The player's own cooking channels, saved with their game. "Add Channel" takes a link or an @handle;
// tapping a channel opens its cooking videos inside Whisk (/cook/channel).
export default function MyYouTubers() {
  const { ui, setUi, say } = useWhisk();
  const list = cleanList(ui.youtubers);
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  function add(e) {
    e.preventDefault();
    const p = parseYouTuber(link);
    if (!p) { setErr('That doesn’t look like a YouTube channel. Paste the channel link, or type its @handle.'); return; }
    if (list.some((x) => parseYouTuber(x.url)?.key === p.key)) { setErr('Already on your list.'); return; }
    const nm = (name.trim() || String(p.handle || '').replace(/^@/, '').replace(/[_.-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')).slice(0, 40) || p.handle;   // @MockKitchen → Mock Kitchen
    setUi({ youtubers: [...list, { name: nm, url: p.url }] });
    setLink(''); setName(''); setErr(''); setOpen(false); say(`Added ${nm}`);
  }
  const remove = (url) => setUi({ youtubers: list.filter((x) => x.url !== url) });

  return (
    <>
      <div className="stack" data-tour="channels" data-tip="channels" style={{ gap: 8, marginTop: 8 }}>
        {list.map((c) => (
          <div key={c.url} className="card row channel">
            <Link href={`/cook/channel?u=${encodeURIComponent(c.url)}&n=${encodeURIComponent(c.name)}`} className="row yt-link" aria-label={`${c.name}: cooking videos`}>
              <span className="social yt" aria-hidden="true"><Icon name="yt" size={22} /></span>
              <b style={{ flex: 1, minWidth: 0 }}>{c.name}</b>
              <Icon name="chevron" />
            </Link>
            <button type="button" className="btn ghost sm" style={{ border: 0, width: 40, padding: 0 }} onClick={() => remove(c.url)} aria-label={`Remove ${c.name}`}><Icon name="x" size={18} /></button>
          </div>
        ))}
        {open ? (
          <form className="card stack yt-add" onSubmit={add} noValidate>
            <div><label className="lbl" htmlFor="yt-link">@handle</label>
              <input id="yt-link" className="input" value={link || '@'} onChange={(e) => { const v = e.target.value; setLink(v.startsWith('@') || v.includes('/') || !v ? v : `@${v}`); setErr(''); }} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="url" maxLength={200} aria-invalid={!!err} aria-describedby={err ? 'yt-err' : undefined} /></div>
            {err && <p id="yt-err" className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" type="submit" style={{ flex: 1 }}>Add</button>
              <button className="btn ghost" type="button" onClick={() => { setOpen(false); setErr(''); }}>Cancel</button>
            </div>
          </form>
        ) : list.length < MAX_YOUTUBERS ? (
          <button type="button" className="btn ghost wide" onClick={() => setOpen(true)}><Icon name="plus" size={18} />Add Channel</button>
        ) : <p className="desc" style={{ margin: 0 }}>That’s {MAX_YOUTUBERS}, the most you can add. Remove one to add another.</p>}
      </div>
    </>
  );
}
