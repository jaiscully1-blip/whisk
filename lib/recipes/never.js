// "Never show me": allergen groups and single ingredients a player never wants to see. A recipe is hidden when any
// of its ingredients (the full measured list, plus its main and minor ingredient names) mentions one. Shared by
// the app and Whisk Play. This reads ingredient NAMES only: packaged foods can hide allergens a recipe doesn't name,
// so the app tells players to keep checking labels.

// Each group: the words that mean it's in there. Kept broad on purpose (a false "hidden" is fine; a miss is not).
export const ALLERGENS = {
  peanuts: ['peanut', 'peanuts', 'peanut butter', 'groundnut', 'satay'],
  'tree nuts': ['almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 'pecan', 'pecans', 'pistachio', 'pistachios', 'hazelnut', 'hazelnuts', 'macadamia', 'pine nut', 'pine nuts', 'brazil nut', 'nut', 'nuts', 'praline', 'marzipan', 'nutella', 'pesto'],
  shellfish: ['shrimp', 'prawn', 'prawns', 'crab', 'lobster', 'crayfish', 'langoustine', 'clam', 'clams', 'mussel', 'mussels', 'oyster', 'oysters', 'oyster sauce', 'scallop', 'scallops', 'squid', 'calamari', 'octopus', 'shellfish'],
  fish: ['fish', 'fish sauce', 'anchovy', 'anchovies', 'salmon', 'tuna', 'cod', 'tilapia', 'sardine', 'sardines', 'mackerel', 'trout', 'haddock', 'halibut', 'snapper', 'bonito', 'dashi', 'worcestershire', 'caesar'],
  eggs: ['egg', 'eggs', 'mayonnaise', 'mayo', 'aioli', 'meringue', 'egg noodles'],
  dairy: ['milk', 'butter', 'buttermilk', 'cheese', 'cheddar', 'parmesan', 'parmigiano', 'mozzarella', 'feta', 'gruyere', 'colby', 'havarti', 'ricotta', 'paneer', 'cream', 'sour cream', 'yogurt', 'yoghurt', 'ghee', 'whey', 'kibbeh', 'queso', 'cotija', 'tzatziki', 'condensed milk', 'evaporated milk'],
  'gluten / wheat': ['flour', 'wheat', 'bread', 'breadcrumbs', 'panko', 'pasta', 'spaghetti', 'penne', 'ziti', 'macaroni', 'fettuccine', 'lasagna', 'ditalini', 'noodles', 'lo mein', 'udon', 'ramen', 'couscous', 'bulgur', 'barley', 'rye', 'semolina', 'tortilla', 'tortillas', 'pita', 'baguette', 'buns', 'pastry', 'puff pastry', 'soy sauce', 'hoisin', 'teriyaki', 'beer', 'seitan', 'farro', 'crackers', 'teff'],
  soy: ['soy', 'soy sauce', 'soya', 'tofu', 'edamame', 'miso', 'tamari', 'tempeh', 'hoisin', 'teriyaki'],
  sesame: ['sesame', 'sesame oil', 'tahini', 'hummus', 'za’atar', "za'atar", 'zaatar', 'furikake', 'gomashio']
};
export const ALLERGEN_LABELS = { peanuts: 'Peanuts', 'tree nuts': 'Tree nuts', shellfish: 'Shellfish', fish: 'Fish', eggs: 'Eggs', dairy: 'Dairy', 'gluten / wheat': 'Gluten / wheat', soy: 'Soy', sesame: 'Sesame' };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// "coconut milk" is not dairy, "peanut" doesn't hide "nutmeg" or "butternut squash", "egg" doesn't hide "eggplant".
const SAFE = /\b(coconut milk|coconut cream|nutmeg|butternut|eggplant|almond milk|oat milk|soy milk|cream of tartar|cocoa butter|peanut oil)\b/g;
function words(list) {
  const all = list.flatMap((w) => ALLERGENS[w] || [w]).map((w) => w.trim().toLowerCase()).filter(Boolean);
  if (!all.length) return null;
  return new RegExp(`\\b(${[...new Set(all)].map(esc).join('|')})(e?s)?\\b`, 'i');
}
const cache = new Map();
function matcher(never) {
  const key = (never || []).join('|');
  if (!cache.has(key)) cache.set(key, words(never || []));
  return cache.get(key);
}

/** The first never-show word a recipe uses, or null. `never` holds group keys (see ALLERGENS) and/or plain words. */
export function blockedBy(recipe, never) {
  const re = matcher(never); if (!re) return null;
  const names = [...(recipe.ingredients || []).map((i) => i.item), ...(recipe.key || []), ...(recipe.minor || [])];
  for (const n of names) {
    const t = String(n || '').toLowerCase().replace(SAFE, ' ');
    const m = t.match(re); if (m) return m[1];
  }
  return null;
}
export const allowed = (recipe, never) => !blockedBy(recipe, never);
