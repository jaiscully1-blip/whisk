'use client';
import { useCallback, useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import { addToShoppingList, listMsg } from '@/lib/shoplist';

// the group's shared shopping list: anyone in the chat can add, tick off or remove things
export default function ChatShopList({ group, onClose, onChanged }) {
  const { supabase, say } = useWhisk();
  const [items, setItems] = useState(null);
  const [text, setText] = useState('');
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_chat_list', { p_group: group });
    if (!error) setItems(data || []);
  }, [supabase, group]);
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15000);
    const h = () => load(); window.addEventListener('yoke:chat-ping', h);
    return () => { clearInterval(t); window.removeEventListener('yoke:chat-ping', h); };
  }, [load]);
  const fail = (e) => say(String(e?.message || 'Couldn’t do that.').replace(/^\w/, (x) => x.toUpperCase()));
  async function add(e) {
    e.preventDefault(); const names = text.split(',').map((x) => x.trim()).filter(Boolean); if (!names.length) return;
    const { error } = await supabase.rpc('add_chat_list', { p_group: group, p_names: names });
    if (error) { fail(error); return; }
    setText(''); await load(); onChanged?.();
  }
  async function tick(it) {
    setItems((l) => l.map((x) => (x.id === it.id ? { ...x, done: !x.done, done_by: x.done ? null : 'You' } : x)));
    const { error } = await supabase.rpc('set_chat_list_done', { p_item: it.id, p_done: !it.done });
    if (error) fail(error); await load(); onChanged?.();
  }
  async function remove(it) { const { error } = await supabase.rpc('remove_chat_list', { p_item: it.id }); if (error) fail(error); await load(); onChanged?.(); }
  async function clear() { await supabase.rpc('clear_chat_list_done', { p_group: group }); await load(); onChanged?.(); }
  async function copy() { const n = await addToShoppingList(supabase, (items || []).filter((x) => !x.done).map((x) => x.name)); say(listMsg(n)); }
  const todo = (items || []).filter((x) => !x.done), done = (items || []).filter((x) => x.done);
  return (
    <div className="scrim" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet stack menu-sheet" role="dialog" aria-modal="true" aria-label="Group shopping list" data-testid="chat-shoplist">
        <h2 style={{ fontSize: 24, margin: 0 }}>Shopping list</h2>
        <p className="desc" style={{ margin: 0 }}>Shared with everyone in this chat. Only the list is shared, never your pantry.</p>
        <form className="row" style={{ flexWrap: 'nowrap', gap: 8 }} onSubmit={add}>
          <input id="gl-add" className="chat-in" style={{ flex: 1 }} maxLength={60} autoComplete="off" placeholder="Add things (commas for several)" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn sm" type="submit" disabled={!text.trim()} data-testid="gl-add-btn">Add</button>
        </form>
        {items === null ? <p className="muted">Loading…</p> : items.length === 0 ? <p className="muted">Nothing on the list yet.</p> : (
          <ul className="gl-list" data-testid="gl-items">
            {[...todo, ...done].map((it) => (
              <li key={it.id} className={it.done ? 'done' : ''}>
                <button type="button" className="gl-tick" role="checkbox" aria-checked={it.done} aria-label={`${it.name}, ${it.done ? 'got it' : 'still needed'}`} onClick={() => tick(it)}>{it.done && <Icon name="check" size={16} />}</button>
                <span className="gl-name"><b>{it.name}</b><small>{it.done ? `Got by ${it.done_by}` : `Added by ${it.by}`}</small></span>
                <button type="button" className="chat-more" onClick={() => remove(it)} aria-label={`Remove ${it.name}`}><Icon name="x" size={16} /></button>
              </li>
            ))}
          </ul>
        )}
        {todo.length > 0 && <button type="button" className="btn ghost wide" onClick={copy} data-testid="gl-copy"><Icon name="bag" size={18} />Copy to my own list</button>}
        {done.length > 0 && <button type="button" className="btn ghost wide" onClick={clear} data-testid="gl-clear">Clear {done.length} ticked</button>}
        <button className="btn wide" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
