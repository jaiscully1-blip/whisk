'use client';
import { useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { parseVideo, embedSrc, openSrc, PLATFORM } from '@/lib/video';
import { addToShoppingList, listMsg } from '@/lib/shoplist';

// the card in the chat
export function VideoCard({ m, onWatch, onMore }) {
  const { t } = useWhisk();
  const v = m.meta || {}; const n = (v.ingredients || []).length, s = (v.steps || []).length;
  return (
    <div className="chat-bubble video" data-testid="chat-video-card">
      <span className="vid-top"><span className="chat-oi gm"><Icon name="play" size={22} /></span><b>{v.title || 'Recipe video'}</b>
        <button type="button" className="chat-more" onClick={onMore} aria-label="Message options"><Icon name="more" size={18} /></button></span>
      <small className="muted">{PLATFORM[v.platform] || 'Video'}{n ? ` · ${n} ingredient${n === 1 ? '' : 's'}` : ''}{s ? ` · ${s} step${s === 1 ? '' : 's'}` : ''}</small>
      <button type="button" className="btn sm" onClick={onWatch} data-testid="chat-video-watch"><Icon name="play" size={16} />{t('Watch with recipe')}</button>
    </div>
  );
}

// watch the video inside the app, with the ingredients and steps next to it
export function VideoSheet({ m, group, onGroupList, onClose }) {
  const { supabase, say, t } = useWhisk();
  const v = m.meta || {}; const src = embedSrc(v); const link = openSrc(v);
  const [busy, setBusy] = useState(false);
  async function addAll() {
    setBusy(true); const n = await addToShoppingList(supabase, v.ingredients || []); setBusy(false); say(listMsg(n));
  }
  async function addGroup() {
    setBusy(true); const { data, error } = await supabase.rpc('add_chat_list', { p_group: group, p_names: v.ingredients || [] }); setBusy(false);
    if (error) { say('Couldn’t add to the group list'); return; }
    onGroupList?.(); say(data ? `Added ${data} to the group list` : 'Already on the group list');
  }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack vid-sheet" role="dialog" aria-modal="true" aria-label={v.title || 'Recipe video'} data-testid="chat-video-sheet">
        <h2 style={{ fontSize: 22, margin: 0 }}>{v.title || 'Recipe video'}</h2>
        {src && <iframe className={`vid-frame ${v.platform}`} src={src} title={v.title || 'Recipe video'} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" referrerPolicy="strict-origin-when-cross-origin" loading="lazy" />}
        {link && <a className="desc" href={link} target="_blank" rel="noopener noreferrer">Doesn’t play? Open it in {PLATFORM[v.platform]}</a>}
        {(v.ingredients || []).length > 0 && <>
          <span className="eyebrow">{t('Ingredients')}</span>
          <ul className="vid-list" data-testid="vid-ingredients">{v.ingredients.map((x, i) => <li key={i}>{x}</li>)}</ul>
          <button type="button" className="btn ghost wide" onClick={addAll} disabled={busy} data-testid="vid-add-list"><Icon name="bag" size={18} />{t('Add all to my shopping list')}</button>
          {group && <button type="button" className="btn ghost wide" onClick={addGroup} disabled={busy} data-testid="vid-add-group"><Icon name="users" size={18} />{t('Add all to the group list')}</button>}
        </>}
        {(v.steps || []).length > 0 && <>
          <span className="eyebrow">{t('Steps')}</span>
          <ol className="vid-list" data-testid="vid-steps">{v.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
        </>}
        {!(v.ingredients || []).length && !(v.steps || []).length && <p className="desc">{m.name} didn’t type out the recipe. Ask them for it in the chat.</p>}
        <button className="btn wide" onClick={onClose}>{t('Close')}</button>
      </div>
    </div>
  );
}

// share one: paste the link, then type the ingredients and steps as you watch (nothing is read from the video automatically)
export function VideoShare({ initialUrl = '', onSend, onClose }) {
  const { t } = useWhisk();
  const [url, setUrl] = useState(initialUrl); const [title, setTitle] = useState(''); const [ing, setIng] = useState(''); const [steps, setSteps] = useState(''); const [busy, setBusy] = useState(false);
  const ok = !!parseVideo(url);
  const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
  async function go(e) { e.preventDefault(); if (!ok || busy) return; setBusy(true); const done = await onSend({ url: url.trim(), title: title.trim(), ingredients: lines(ing), steps: lines(steps) }); setBusy(false); if (done) onClose(); }
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="sheet stack" onSubmit={go} role="dialog" aria-modal="true" aria-label={t('Share a recipe video')} data-testid="video-share">
        <h2 style={{ fontSize: 24, margin: 0 }}>{t('Share a recipe video')}</h2>
        <label className="field"><span>{t('Link (TikTok, Instagram or YouTube)')}</span><input id="vid-url" inputMode="url" autoComplete="off" placeholder="https://www.tiktok.com/@name/video/…" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        {url.trim() && !ok && <span className="desc" style={{ color: 'var(--bad)' }}>Use the full link. Short links like vm.tiktok.com don’t work; open the video and copy its address.</span>}
        <label className="field"><span>{t('Name (optional)')}</span><input id="vid-title" maxLength={80} placeholder="Creamy tomato pasta" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field"><span>{t('Ingredients, one per line')}</span><textarea id="vid-ing" rows={5} placeholder={'200g pasta\n2 cloves garlic'} value={ing} onChange={(e) => setIng(e.target.value)} /></label>
        <label className="field"><span>{t('Steps, one per line')}</span><textarea id="vid-steps" rows={5} placeholder={'Boil the pasta\nFry the garlic'} value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
        <span className="desc">Type the recipe as you watch. Yoke doesn’t read videos, so what you type is what your friends see.</span>
        <button className="btn wide" type="submit" disabled={!ok || busy} data-testid="video-send">{t('Send to the chat')}</button>
        <button className="btn ghost wide" type="button" onClick={onClose}>{t('Cancel')}</button>
      </form>
    </div>
  );
}
