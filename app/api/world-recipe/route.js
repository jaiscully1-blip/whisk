import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { worldCountry, worldRecipe, worldByType, worldSample, fitLite } from '@/lib/recipes/worldData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Yoke's own recipes for every dish in the world list. ?id=w-it-lasagna → the full recipe,
// ?ids=a,b,c → several full recipes, ?iso=IT → light rows for that country (no steps). ?sample=n&seed=s → one dish from each of n countries.
// ?type=dessert → every dish of a type. One recipe by id always comes back (a saved one, a party's): the recipe
// sheet shows the swaps, or says plainly what's in it.
export async function GET(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const p = new URL(req.url).searchParams;
  // Lists leave out what's on the player's Never show me list (read here, so no list can skip it). The app adds
  // ?nv=<their list> to every list it asks for, so changing the setting never serves an old cached list.
  const listed = p.get('sample') || p.get('type') || p.get('iso');
  const never = listed ? ((await supabase.from('profiles').select('never_show').eq('id', user.id).maybeSingle()).data?.never_show || []) : [];
  const headers = { 'Cache-Control': 'private, max-age=3600' };
  if (p.get('id')) {
    const r = await worldRecipe(p.get('id'));
    return r ? NextResponse.json({ recipe: r }, { headers }) : NextResponse.json({ error: 'No recipe like that.' }, { status: 404 });
  }
  if (p.get('ids')) {
    const ids = p.get('ids').split(',').slice(0, 40);
    const recipes = (await Promise.all(ids.map(worldRecipe))).filter(Boolean);
    return NextResponse.json({ recipes }, { headers });
  }
  if (p.get('sample')) return NextResponse.json({ recipes: await worldSample(+p.get('sample') || 60, +p.get('seed') || 1, never) }, { headers: { 'Cache-Control': 'private, max-age=60' } });
  if (p.get('type')) return NextResponse.json({ recipes: await worldByType(p.get('type'), never) }, { headers });
  if (p.get('iso')) {
    const list = await worldCountry(p.get('iso'));
    return list ? NextResponse.json({ recipes: fitLite(list, never) }, { headers }) : NextResponse.json({ recipes: [] }, { headers });
  }
  return NextResponse.json({ error: 'Ask for an id, ids or iso.' }, { status: 400 });
}
