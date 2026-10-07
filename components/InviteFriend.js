'use client';
import { useEffect, useState } from 'react';
import { useWhisk } from './AppShell';
import Icon, { Coin } from './Icon';

// Get coins → Invite a friend. Your code (or a link with it); a new player enters it. When you two finish the same
// Cook Off, you each get 1,000 coins. Up to 10 friends, no time limit. Rules live on the server (migration 0017).
export const REF_KEY = 'whisk-ref';
export default function InviteFriend() {
  const { supabase, say, refreshProfile } = useWhisk();
  const [inv, setInv] = useState(null);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { supabase.rpc('get_my_invite').then(({ data }) => setInv(data || null)); }, [supabase]);
  if (!inv) return null;
  const link = typeof window !== 'undefined' ? `${window.location.origin}/login?ref=${inv.code}` : '';
  async function share() {
    const text = `Play Whisk with me! Use my code ${inv.code} and we both get 1,000 coins when we finish a Cook Off together.`;
    try { if (navigator.share) await navigator.share({ text, url: link }); else { await navigator.clipboard.writeText(`${text} ${link}`); say('Invite copied'); } } catch {}
  }
  async function claim(e) {
    e.preventDefault(); setErr('');
    const { data, error } = await supabase.rpc('claim_invite', { p_code: code.trim().toUpperCase() });
    if (error) { setErr(String(error.message || '').replace(/^\w/, (c) => c.toUpperCase())); return; }
    setInv(data); setCode(''); refreshProfile(); say(`Done! Finish a Cook Off with ${data.invited_by || 'your friend'} for 1,000 coins each`);
  }
  const full = inv.earned >= inv.max;
  return (
    <section className="card stack invite" aria-labelledby="inv-h">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}><h3 id="inv-h" style={{ fontSize: 20 }}>Invite a friend</h3><span className="chip xp"><Coin size={14} /> 1,000 each</span></div>
      <p style={{ margin: 0 }}>Your friend starts Whisk with your code. When you both finish the same Cook Off, you each get 1,000 coins.</p>
      <div className="invite-code"><span className="desc">Your code</span><b>{inv.code}</b></div>
      <button className="btn wide" onClick={share} disabled={full}><Icon name="link" size={18} />{full ? 'All 10 invite rewards earned' : 'Share my invite'}</button>
      <span className="desc">{inv.earned} of {inv.max} friends rewarded{inv.waiting ? ` · ${inv.waiting} waiting to play a Cook Off with you` : ''}. Friends must be new to Whisk.</span>
      {inv.invited_by && <span className="desc">You joined with {inv.invited_by}’s code{inv.mine_paid ? ' · reward paid' : ' · finish a Cook Off together to get your 1,000'}.</span>}
      {inv.can_enter && (
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={claim}>
          <label htmlFor="inv-in" className="sr">A friend’s invite code</label>
          <input id="inv-in" className="input co-code-in" value={code} onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase())} placeholder="Friend’s code" autoCapitalize="characters" autoComplete="off" />
          <button className="btn ghost" type="submit" disabled={code.length !== 6}>Use</button>
        </form>
      )}
      {err && <p className="err" role="alert" style={{ margin: 0 }}>{err}</p>}
    </section>
  );
}
