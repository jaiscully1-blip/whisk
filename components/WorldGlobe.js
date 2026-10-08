'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWhisk } from './AppShell';
import { useWorld } from './usePantry';
import Globe from './Globe';

// The globe with your countries on it (Bronze 1 dish, Silver 3, Gold 5). The dart's "Cook it" opens that country's dishes.
export default function WorldGlobe() {
  const { setUi } = useWhisk();
  const router = useRouter();
  const [world] = useWorld();
  const countries = world?.countries || [];
  const counts = useMemo(() => new Map(countries.map((c) => [c.country, c.n])), [countries]);
  const done = useMemo(() => new Set(countries.filter((c) => c.done || c.n >= 5).map((c) => c.country)), [countries]);
  return <div data-tour="stage" data-tip="stage"><Globe counts={counts} done={done} onCook={(hit) => { setUi({ cookMode: 'named', cookDish: hit.name }); router.push('/cook'); }} /></div>;
}
