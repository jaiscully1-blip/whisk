'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useWhisk } from '@/components/AppShell';
import RecipeSheet from '@/components/RecipeSheet';
import Icon, { Coin } from '@/components/Icon';
import { levelFor, freshness, inPantry, norm, fmt } from '@/lib/game';

export default function Home() {
  const { supabase, profile } = useWhisk();
  const [pantry, setPantry] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [open, setOpen] = useState(null);
  const lvl = levelFor(profile?.xp);

  useEffect(() => {
    (async () => {
      const [p, r, c] = await Promise.all([
        supabase.from('pantry_items').select('id, name, category, status, expires_on').order('expires_on', { ascending: true, nullsFirst: false }),
        supabase.from('recipes').select('id, title, cuisine, data').order('created_at', { ascending: false }).limit(50),
        supabase.rpc('get_weekly_challenges')
      ]);
      setPantry(p.data || []); setRecipes(r.data || []); setChallenges(c.data || []);
    })();
  }, [supabase]);

  const names = useMemo(() => (pantry || []).filter((i) => i.status !== 'out').map((i) => norm(i.name)), [pantry]);
  const scored = useMemo(() => recipes.map((r) => {
    const ings = r.data?.ingredients || [];
    const missing = ings.filter((i) => !inPantry(names, i.item));
    return { ...r, missing };
  }), [recipes, names]);
  const ready = scored.filter((r) => r.missing.length === 0);
  const almost = scored.filter((r) => r.missing.length >= 1).sort((a, b) => a.missing.length - b.missing.length)[0];
  const expiring = (pantry || []).map((i) => ({ ...i, f: freshness(i) })).filter((i) => i.f && i.f.pct <= 40 && i.status !== 'out').slice(0, 3);

  return (
    <div className="stack" style={{ paddingTop: 16 }}>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--accent)', color: 'var(--btn-ink)', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 18, flex: 'none' }}>{lvl.level}</div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}><span>{lvl.title}</span><span className="muted">{fmt(profile?.xp)}{lvl.next ? ` / ${fmt(lvl.next)}` : ''} XP</span></div>
          <div className="bar" style={{ height: 10, marginTop: 5 }}><i style={{ width: `${lvl.pct}%` }} /></div>
        </div>
      </div>

      <div className="card row" style={{ gap: 14, flexWrap: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 42, lineHeight: 1, color: 'var(--accent)' }}>{pantry === null ? '–' : ready.length}</span>
        <div><b style={{ fontSize: 16 }}>saved recipes you can make right now</b><div className="muted" style={{ fontSize: 13 }}>Updates as your pantry changes</div></div>
      </div>

      {almost ? (
        <div className="card stack">
          <span className="eyebrow">Almost ready · {almost.missing.length} item{almost.missing.length > 1 ? 's' : ''} away</span>
          <h2 style={{ fontSize: 24 }}>{almost.title}</h2>
          <div className="row">
            {almost.missing.slice(0, 4).map((m, i) => <span key={i} className="chip need">+ {m.item}</span>)}
          </div>
          <div className="row">
            <button className="btn ghost" style={{ flex: 1 }} onClick={async () => { await supabase.from('shopping_items').insert(almost.missing.map((m) => ({ name: m.item.slice(0, 60) }))); }}>Add to list</button>
            <button className="btn" style={{ flex: 1 }} onClick={() => setOpen(almost)}>Open recipe</button>
          </div>
        </div>
      ) : (
        <div className="empty"><b>Let’s find your first meal</b>Add what’s in your kitchen, then Whisk suggests recipes.<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}><Link className="btn" href="/pantry">Add pantry items</Link><Link className="btn ghost" href="/cook">Get recipe ideas</Link></div></div>
      )}

      {expiring.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>Use it or lose it</h3><span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Cook before it expires</span></div>
          {expiring.map((i) => (
            <div key={i.id} className="card row" style={{ padding: '10px 14px', flexWrap: 'nowrap' }}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}><span>{i.name}</span><span style={{ color: `var(--${i.f.tone})` }}>{i.f.label}</span></div>
                <div className="bar" style={{ marginTop: 6 }}><i style={{ width: `${i.f.pct}%`, background: `var(--${i.f.tone === 'fresh' ? 'accent' : i.f.tone + '-bar'})` }} /></div>
              </div>
              <span className="chip xp">+{i.f.tone === 'bad' ? 30 : 20} XP</span>
            </div>
          ))}
        </div>
      )}

      <Link href="/cook?raid=1" className="card row" style={{ textDecoration: 'none', background: 'var(--pop-soft)', flexWrap: 'nowrap' }}>
        <Icon name="gift" size={32} />
        <span style={{ flex: 1 }}><b style={{ display: 'block', fontSize: 16 }}>Fridge Raid</b><span className="muted" style={{ fontSize: 13 }}>Deal 4 random items, get a surprise recipe</span></span>
        <Icon name="chevron" />
      </Link>

      {challenges.length > 0 && (
        <Link href="/compete" className="card stack" style={{ textDecoration: 'none', gap: 8 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}><h3>This week’s challenges</h3><Icon name="chevron" /></div>
          {challenges.map((c) => (
            <div key={c.id} className="row" style={{ justifyContent: 'space-between', opacity: c.completed_at ? .6 : 1 }}>
              <span style={{ fontWeight: 700 }}>{c.completed_at ? '✓ ' : ''}{c.meal_name}</span>
              <span className="row" style={{ gap: 4, fontWeight: 800 }}><Coin />{fmt(c.coins)}</span>
            </div>
          ))}
        </Link>
      )}

      {open && <RecipeSheet recipe={open.data} savedId={open.id} pantryNames={names} onClose={() => setOpen(null)} />}
    </div>
  );
}
