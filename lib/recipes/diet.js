// Diet tags for a recipe, worked out only from facts we have: the recipe's own nutrition (per serving, as printed on
// the source page) and its full ingredient list. Nothing is guessed: no nutrition → no nutrition-based tags; an
// ingredient we can't vouch for (a "homemade" sub-recipe) → no vegetarian/vegan tag. When an ingredient offers a
// choice ("chicken or vegetable broth"), the meat option counts, so a tag is never more generous than the recipe.
// Shared by the app and Whisk Play.

const MEAT = /\b(beef|chicken|pork|lamb|mutton|goat|veal|turkey|duck|bacon|ham|sausages?|andouille|chorizo|pepperoni|salami|prosciutto|pancetta|meat|mince|liver|livers|shrimp|prawns?|fish|anchov(y|ies)|salmon|tuna|cod|crab|lobster|clams?|mussels?|oysters?|scallops?|squid|calamari|octopus|dashi|bonito|worcestershire|lard|drippings|gelatin|suet)\b/;
const ANIMAL = /\b(eggs?|egg noodles|butter|cheese|cheddar|parmesan|parmigiano|feta|mozzarella|gruyere|colby|havarti|ricotta|paneer|cream|yogh?urt|ghee|honey|mayonnaise|kibbeh|whey|buttermilk)\b|(?<!coconut )\bmilk\b/;
// Starchy staples: a recipe built around them isn't called keto or low carb, even when the source's per-serving
// numbers leave the bread or rice out.
const STARCH = /\b(rice|pasta|spaghetti|penne|ziti|macaroni|noodles?|lasagna|fettuccine|bread|baguette|pita|tortillas?|buns?|potato(es)?|grits|couscous)\b/;
const UNKNOWN = /\bhomemade\b|\bsalad\b(?! (leaves|greens))/;

export const DIET_ORDER = ['High protein', 'Keto', 'Low carb', 'Calorie smart', 'Weight loss', 'Vegan', 'Vegetarian'];

// The rules, in plain words (per serving):
//   High protein: 25 g protein or more · Low carb: 20 g carbs or less · Keto: 10 g carbs or less and at least 60% of
//   calories from fat · Calorie smart: 500 kcal or less · Weight loss: 450 kcal or less with 25 g protein or more
//   (filling and lighter; not medical advice). Keto and Low carb are also
//   left off anything built on rice, pasta, noodles, bread, tortillas or potatoes · Vegetarian: no meat or fish · Vegan: also no egg, dairy or honey.
export function dietTags(r) {
  const tags = [];
  const n = r?.nutrition;
  if (n && Number.isFinite(n.calories) && n.calories > 0) {
    const starchy = (r.ingredients || []).some((i) => STARCH.test(String(i.item || '').toLowerCase()));
    const { calories: kcal, protein_g: p, carbs_g: c, fat_g: f } = n;
    if (p >= 25) tags.push('High protein');
    if (!starchy && c <= 10 && f * 9 >= 0.6 * kcal) tags.push('Keto');
    else if (!starchy && c <= 20) tags.push('Low carb');
    if (kcal <= 500) tags.push('Calorie smart');
    if (kcal <= 450 && p >= 25) tags.push('Weight loss');
  }
  const items = (r?.ingredients || []).map((i) => String(i.item || '').toLowerCase());
  if (items.length && !items.some((x) => UNKNOWN.test(x)) && !items.some((x) => MEAT.test(x))) {
    tags.push(items.some((x) => ANIMAL.test(x)) ? 'Vegetarian' : 'Vegan');
  }
  return tags;
}

export const DIET_CLASS = { 'High protein': 'protein', Keto: 'keto', 'Low carb': 'lowcarb', 'Calorie smart': 'cal', 'Weight loss': 'wl', Vegan: 'vegan', Vegetarian: 'veg' };
