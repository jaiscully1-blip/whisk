'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWhisk } from '@/components/AppShell';
import Icon from '@/components/Icon';
import { Crowned } from '@/components/Crown';
import Globe from '@/components/Globe';
import PartyPlates from '@/components/PartyPlates';
import PartyChallenges from '@/components/PartyChallenges';
import { useCached } from '@/lib/cache';
import { seatColor, fetchPartyGlobe } from '@/components/PartyHub';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';

export default function PartyPage() { return <Suspense fallback={null}><Party /></Suspense>; }

// A party: its plates (photos members post), a shared globe for the month (whoever has cooked a country the most owns it,
// most countries at month end wins) and this week's three challenges, played together.
function Party() {
  const { supabase, say, setUi, dataVersion } = useWhisk();
  const router = useRouter();
  const gid = useSearchParams().get('g');
  const valid = /^[0-9a-f-]{36}$/i.test(gid || '');
  const [d, , reload] = useCached(`party:${gid}`, () => (valid ? fetchPartyGlobe(supabase, gid) : undefined), [dataVersion]);
  const [failed, setFailed] = useState(false);
  // always refresh when it opens (the saved copy shows meanwhile), then every 30 s
  useEffect(() => { if (valid) reload(); }, [valid, gid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!valid) return undefined; const t = setInterval(() => { if (!document.hidden) reload(); }, 30000); return () => clearInterval(t); }, [valid, reload]);
  useEffect(() => { if (!valid || d) { setFailed(false); return undefined; } const t = setTimeout(() => setFailed(true), 6000); return () => clearTimeout(t); }, [valid, d]);
  const err = !valid ? 'That party link isn’t right.' : failed && !d ? 'Couldn’t open that party.' : '';

  const paint = useMemo(() => new Map((d?.countries || []).map((c) => [c.iso, seatColor(c.seat)])), [d]);
  const bySeat = useMemo(() => new Map((d?.members || []).map((m) => [m.seat, m])), [d]);
  const standings = useMemo(() => [...(d?.members || [])].sort((a, b) => b.countries - a.countries || b.cooked - a.cooked || a.seat - b.seat), [d]);
  const daysLeft = d ? Math.max(1, Math.ceil((new Date(d.month_end) - Date.now()) / 864e5)) : 0;
  const owned = useMemo(() => [...(d?.countries || [])].sort((a, b) => b.n - a.n).slice(0, 12), [d]);

  if (err) return (
    <div className="stack">
      <div className="page-title"><h1>Party</h1><Link href="/compete" className="title-link"><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />Compete</Link></div>
      <div className="empty"><b>{err}</b></div>
    </div>
  );
  return (
    <div className="stack">
      <div className="page-title party-title">
        <span><h1>{d?.group?.name || 'Party'}</h1><span className="muted">{d ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in this month’s race` : ''}</span></span>
        <Link href="/compete" className="title-link"><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} />Compete</Link>
      </div>

      {d && (
        <section className="card stack party-board" style={{ gap: 6 }} aria-label="Standings" data-testid="party-standings">
          {standings.map((m, i) => (
            <div key={m.code} className="pb-row">
              <span className="pb-rank">{i + 1}</span>
              <span className="post-av" style={{ background: seatColor(m.seat) }} aria-hidden="true">{m.name.slice(0, 1).toUpperCase()}</span>
              <b style={{ flex: 1, minWidth: 0 }}><Crowned code={m.code} me={m.me} size={14}>{m.me ? 'You' : m.name}</Crowned></b>
              <span className="pb-n" style={{ background: seatColor(m.seat) }}>{m.countries} {m.countries === 1 ? 'country' : 'countries'}</span>
            </div>
          ))}
        </section>
      )}

      {valid && <PartyPlates gid={gid} />}

      <div data-testid="party-globe">
        <Globe paint={paint} onCook={(hit) => { setUi({ cookMode: 'named', cookDish: hit.name }); router.push('/cook'); }} />
      </div>

      {valid && <PartyChallenges gid={gid} />}

      {owned.length > 0 && (
        <section className="stack" style={{ gap: 6 }} aria-label="Countries">
          <span className="eyebrow">Countries this month</span>
          {owned.map((c) => {
            const m = bySeat.get(c.seat); const name = COUNTRY_BY_ISO[c.iso]?.[1] || c.iso;
            const toTake = m?.me ? 0 : c.n - c.mine + 1;
            return (
              <div key={c.iso} className="card pb-country" data-testid="party-country">
                <img className="flagimg" src={`/flags/${c.iso.toLowerCase()}.svg`} alt="" width="30" height="22" />
                <span style={{ flex: 1, minWidth: 0 }}><b>{name}</b><span className="desc" style={{ display: 'block' }}>{m?.me ? `Yours · cooked ${c.n}×` : `${m?.name || 'Someone'} · cooked ${c.n}× · ${toTake} more to take it`}</span></span>
                <span className="pb-dot" style={{ background: seatColor(c.seat) }} aria-hidden="true" />
              </div>
            );
          })}
        </section>
      )}

      <Link href={`/compete/friends?chat=${gid}`} className="btn ghost wide" data-testid="party-chat"><Icon name="send" size={18} />Party chat</Link>
    </div>
  );
}
