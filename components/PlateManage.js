'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon from './Icon';
import ShareChips, { NOT_SHARED } from './ShareChips';

// Your own plate: change who can see it, or delete the post. The XP and coins it earned stay.
export default function PlateManage({ mealId, photoPath, onDeleted, onShared }) {
  const { supabase, say, bump } = useWhisk();
  const [share, setShare] = useState(null);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let off = false; setShare(null);
    supabase.rpc('get_meal_sharing', { p_meal: mealId }).then(({ data }) => { if (!off) setShare(data ? { friends: !!data.friends, groups: data.groups || [] } : NOT_SHARED); }, () => { if (!off) setShare(NOT_SHARED); });
    return () => { off = true; };
  }, [mealId, supabase]);
  async function change(next) {
    const prev = share; setShare(next);
    const { data, error } = await supabase.rpc('set_meal_sharing', { p_meal: mealId, p_friends: next.friends, p_groups: next.groups });
    if (error || data === false) { setShare(prev); say(photoPath ? 'Couldn’t change that.' : 'Only plates with a photo can be shared.'); return; }
    onShared?.(next);
  }
  async function del() {
    setBusy(true);
    if (photoPath) await supabase.storage.from('meal-photos').remove([photoPath]).catch(() => {});
    const { error } = await supabase.from('meals').delete().eq('id', mealId);
    setBusy(false);
    if (error) { say('Couldn’t delete that post.'); setAsking(false); return; }
    say('Post deleted'); bump?.(); onDeleted?.(mealId);
  }
  return (
    <div className="stack" style={{ gap: 10 }} data-testid="plate-manage">
      {share && photoPath && <ShareChips value={share} onChange={change} />}
      {!asking
        ? <button type="button" className="btn ghost wide pm-del" data-testid="plate-delete" onClick={() => setAsking(true)}><Icon name="trash" size={18} />Delete post</button>
        : (
          <div className="card stack" style={{ gap: 8 }} role="alertdialog" aria-label="Delete this post?">
            <b>Delete this post?</b>
            <span className="desc">The photo and recipe are removed for good. The XP and coins you earned stay.</span>
            <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <button type="button" className="btn ghost" style={{ flex: 1 }} onClick={() => setAsking(false)} disabled={busy}>Keep it</button>
              <button type="button" className="btn pm-del-go" style={{ flex: 1 }} data-testid="plate-delete-yes" onClick={del} disabled={busy}>{busy ? 'Deleting…' : 'Delete'}</button>
            </div>
          </div>
        )}
    </div>
  );
}
