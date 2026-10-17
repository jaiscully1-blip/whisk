// Drop a game card into a chat (the database checks the game really is yours), then tell the group's phones.
export async function postGame(supabase, group, kind, code = null) {
  const { data, error } = await supabase.rpc('send_chat_game', { p_group: group, p_kind: kind, p_code: code });
  if (error) return { error };
  fetch('/api/push/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ msg: data.id }) }).catch(() => {});
  try { window.dispatchEvent(new CustomEvent('yoke:chat-posted', { detail: group })); } catch {}
  return { id: data.id };
}
