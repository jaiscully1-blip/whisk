import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';
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
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,categories_tags,quantity`, {
      headers: { 'User-Agent': 'Whisk/0.1 (home cooking app)' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store'
    });
    if (!res.ok) return NextResponse.json({ error: 'Product not found. Type the name instead.' }, { status: 404 });
    const json = await res.json();
    const p = json?.product;
    if (!p?.product_name) return NextResponse.json({ error: 'Product not found. Type the name instead.' }, { status: 404 });
    return NextResponse.json({
      name: String(p.product_name).slice(0, 60),
      brand: p.brands ? String(p.brands).split(',')[0].slice(0, 40) : null,
      quantity: p.quantity ? String(p.quantity).slice(0, 30) : null,
      category: categorize(p.categories_tags)
    });
  } catch {
    return NextResponse.json({ error: 'Barcode lookup is unavailable right now. Type the name instead.' }, { status: 502 });
  }
}
