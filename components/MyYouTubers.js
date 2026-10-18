'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { useWhisk } from './AppShell';
import { cleanChefs, parseChef, PLATFORMS, MAX_CHEFS } from '@/lib/chefs';

// The logo of each site, drawn small.
export function PlatformLogo({ id, size = 22 }) {
  if (id === 'youtube') return <Icon name="yt" size={size} />;
  if (id === 'tiktok') return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3c.3 2.4 1.7 3.9 4 4.1v3a7 7 0 0 1-4-1.3v6.1a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.8 2.4V3z" fill="currentColor" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" /></svg>;
}

// The player's own cooking chefs (YouTube, TikTok or Instagram), saved with their game. "Add Chef" takes a link or an @handle.
// YouTube chefs open their cooking videos inside Yoke (/cook/channel); TikTok and Instagram open in their own app.
export default function MyYouTubers() {
  const { ui, setUi, say } = useWhisk();
  const list = cleanChefs(ui.youtubers);
  const [open, setOpen] = useState(false);
  const [plat, setPlat] = useState('youtube');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const P = PLATFORMS.find((p) => p.id === plat);

  function add(e) {
    e.preventDefault();
    const p = parseChef(plat, link);
    if (!p) { setErr(plat === 'youtube' ? 'That doesn’t look like a YouTube channel. Paste the channel link, or type its @handle.' : `That doesn’t look like a ${P.label} ${P.noun}. Paste the link, or type the @username.`); return; }
    if (list.some((x) => parseChef(x.platform, x.url)?.key === p.key)) { setErr('Already on your list.'); return; }
    const nm = String(p.handle || '').replace(/^@/, '').replace(/[_.-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').slice(0, 40) || p.handle;   // @MockKitchen → Mock Kitchen
    setUi({ youtubers: [...list, { name: nm, url: p.url, platform: plat }] });
    setLink(''); setErr(''); setOpen(false); say(`Added ${nm}`);
  }
  const remove = (url) => setUi({ youtubers: list.filter((x) => x.url !== url) });

  return (
    <>
      <div className="stack" data-tour="channels" data-tip="channels" style={{ gap: 8, marginTop: 8 }}>
        {list.map((c) => {
          const inner = <><span className={`social ${c.platform}`} aria-hidden="true"><PlatformLogo id={c.platform} /></span><b style={{ flex: 1, minWidth: 0 }}>{c.name}</b>{c.platform === 'youtube' ? <Icon name="chevron" /> : <span className="desc">Opens {PLATFORMS.find((p) => p.id === c.platform).label}</span>}</>;
          return (
            <div key={c.url} className="card row channel">
              {c.platform === 'youtube'
                ? <Link href={`/cook/channel?u=${encodeURIComponent(c.url)}&n=${encodeURIComponent(c.name)}`} className="row yt-link" aria-label={`${c.name}: cooking videos`}>{inner}</Link>
                : <a href={c.url} target="_blank" rel="noopener noreferrer" className="row yt-link" aria-label={`${c.name} on ${PLATFORMS.find((p) => p.id === c.platform).label}`}>{inner}</a>}
              <button type="button" className="btn ghost sm" style={{ border: 0, width: 40, padding: 0 }} onClick={() => remove(c.url)} aria-label={`Remove ${c.name}`}><Icon name="x" size={18} /></button>
            </div>
          );
        })}
        {open ? (
          <form className="card stack yt-add" onSubmit={add} noValidate>
            <div className="plat-pick" role="radiogroup" aria-label="Where is the chef?">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={plat === p.id} aria-label={p.label} data-testid={`plat-${p.id}`} className={`plat ${p.id} ${plat === p.id ? 'on' : ''}`}
                  onClick={() => { setPlat(p.id); setErr(''); setLink(''); }}><PlatformLogo id={p.id} size={26} /></button>
              ))}
            </div>
            <div><label className="lbl" htmlFor="yt-link">{plat === 'youtube' ? '@handle' : '@username'}</label>
              <input id="yt-link" className="input" value={link || '@'} onChange={(e) => { const v = e.target.value; setLink(v.startsWith('@') || v.includes('/') || !v ? v : `@${v}`); setErr(''); }} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} inputMode="url" maxLength={200} aria-invalid={!!err} aria-describedby={err ? 'yt-err' : undefined} /></div>
            {err && <p id="yt-err" className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
            <div className="row" style={{ gap: 8 }}>
              <button className="btn" type="submit" style={{ flex: 1 }}>Add</button>
              <button className="btn ghost" type="button" onClick={() => { setOpen(false); setErr(''); }}>Cancel</button>
            </div>
          </form>
        ) : list.length < MAX_CHEFS ? (
          <button type="button" className="btn ghost wide" onClick={() => setOpen(true)}><Icon name="plus" size={18} />Add Chef</button>
        ) : <p className="desc" style={{ margin: 0 }}>That’s {MAX_CHEFS}, the most you can add. Remove one to add another.</p>}
      </div>
    </>
  );
}
