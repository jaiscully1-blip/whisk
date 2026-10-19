import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { worldCountry, worldRecipe, lite } from '@/lib/recipes/worldData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Yoke's own recipes for every dish in the world list. ?id=w-it-lasagna → the full recipe,
// ?ids=a,b,c → several full recipes, ?iso=IT → light rows for that country (no steps).
export async function GET(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const p = new URL(req.url).searchParams;
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
  if (p.get('iso')) {
    const list = await worldCountry(p.get('iso'));
    return list ? NextResponse.json({ recipes: list.map(lite) }, { headers }) : NextResponse.json({ recipes: [] }, { headers });
  }
  return NextResponse.json({ error: 'Ask for an id, ids or iso.' }, { status: 400 });
}
