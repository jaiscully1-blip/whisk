import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
// Server-only setting; only the test suite changes it (to a local stand-in). Players can't influence it.
const OFF = () => process.env.OPENFOODFACTS_URL || 'https://world.openfoodfacts.org';
export const dynamic = 'force-dynamic';

// Maps Open Food Facts category tags onto Whisk pantry categories.
const MAP = [
  ['Proteins', ['meat', 'poultry', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'tofu', 'legume', 'bean']],
  ['Dairy & Eggs', ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'egg', 'cream']],
  ['Produce', ['fruit', 'vegetable', 'salad', 'fresh']],
  ['Frozen', ['frozen']],
  ['Carbs & Grains', ['bread', 'pasta', 'rice', 'cereal', 'grain', 'noodle', 'flour', 'tortilla']],
  ['Canned & Jarred', ['canned', 'jar', 'soup', 'preserve']],
  ['Sauces & Oils', ['sauce', 'oil', 'condiment', 'dressing', 'vinegar', 'ketchup', 'mayonnaise']],
  ['Spices & Seasonings', ['spice', 'seasoning', 'salt', 'pepper', 'herb']],
  ['Baking', ['baking', 'sugar', 'chocolate', 'yeast']]
];
function categorize(tags = []) {
  const t = tags.join(' ').toLowerCase();
  for (const [cat, words] of MAP) if (words.some((w) => t.includes(w))) return cat;
  return 'Other';
}

export async function GET(req) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const code = new URL(req.url).searchParams.get('code') || '';
  if (!/^\d{8,14}$/.test(code)) return NextResponse.json({ error: 'That doesn’t look like a barcode number.' }, { status: 400 });

  try {
    // Fixed host + validated digits only — no user-controlled URLs (SSRF-safe).
    // Product facts are public and the same for everyone, so the lookup itself is cached for a day on the server
    // (repeat scans are instant). The response to the player still isn't cached (it's an authenticated route).
    const get = async (c) => {
      const res = await fetch(`${OFF()}/api/v2/product/${c}.json?fields=product_name,product_name_en,generic_name_en,brands,categories_tags,quantity`, {
        headers: { 'User-Agent': 'Whisk/0.1 (home cooking app)' },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 86400 }
      });
      if (!res.ok) return null;
      const p = (await res.json())?.product;
      const name = p && (p.product_name_en || p.product_name || p.generic_name_en);
      return name ? { p, name } : null;
    };
    // US shelves print 12-digit UPC-A; Open Food Facts often files them as 13-digit EAN with a leading 0 (and back).
    const tries = [code, code.length === 12 ? '0' + code : null, code.length === 13 && code.startsWith('0') ? code.slice(1) : null].filter(Boolean);
    let hit = null; for (const c of tries) { hit = await get(c); if (hit) break; }
    if (!hit) return NextResponse.json({ error: 'Product not found. Type the name instead.', notFound: true }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    const { p, name } = hit;
    return NextResponse.json({
      name: String(name).trim().slice(0, 60),
      brand: p.brands ? String(p.brands).split(',')[0].trim().slice(0, 40) : null,
      quantity: p.quantity ? String(p.quantity).slice(0, 30) : null,
      category: categorize(p.categories_tags)
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Barcode lookup is unavailable right now. Type the name instead.' }, { status: 502 });
  }
}
