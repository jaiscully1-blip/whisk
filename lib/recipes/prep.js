// Prep groups: which bowl does each ingredient go in?
//   dry  = flours, sugars, salt, spices, powders, leaveners (one bowl, mixed together)
//   wet  = liquids, eggs, oils, dairy, sauces (the other bowl)
//   cook = everything that goes straight into the pan or pot (meat, veg, aromatics, pasta, rice)
// Rule-based and on-device: no AI. Checked in order so "garlic powder" is dry, "garlic" is cook, "rice vinegar" is wet.
const MEAT = /\b(chicken|beef|pork|turkey|sausages?|bacon|shrimp|salmon|tuna|tofu|ham|lamb|steak|mince)\b/i;
const POWDERY = /\b(powder|flakes|ground|seasoning|peppercorns?|bouillon)\b/i;
const WET_FIRST = /\b(vinegar|sauce|paste|broth|stock|juice|oil|milk|cream|wine|sherry|cognac|brandy|mirin|sake|dressing|soup|water(?! chestnuts?))\b/i;
const COOK_FIRST = /\b(tortillas?|potato(?:es)?|noodles?|beans?|peas?|chestnuts?|bell peppers?|green peppers?|chil(?:i|li|e)(?:es)?|jalape\w*|habanero|scotch bonnet|garlic|ginger|onions?|shallots?|rice|pasta|macaroni|spaghetti|fresh|leaves|sprigs?|basil|parsley|cilantro|boiled eggs?)\b/i;
const DRY = /\b(flour|sugar|salt|pepper|baking|yeast|cornstarch|starch|breadcrumbs?|panko|oats|oatmeal|cocoa|cumin|paprika|oregano|thyme|dill|rosemary|sage|cayenne|turmeric|coriander|cinnamon|nutmeg|cloves|spice|masala|garam|curry|sumac|cornmeal|semolina|masa|dried|allspice|cardamom|mustard seeds?|sesame seeds?|chia|flax)\b/i;
const WET = /\b(eggs?|yolks?|egg whites?|butter|ghee|honey|syrup|molasses|vanilla|extract|yogurt|yoghurt|mayo|mayonnaise|mustard|beer|buttermilk|ketchup|sriracha|salsa|miso|tahini|worcestershire|cream cheese|sour cream|ricotta)\b/i;

export const BOWLS = [
  { id: 'wet', label: 'Wet bowl', hint: 'Whisk together' },
  { id: 'dry', label: 'Dry bowl', hint: 'Stir together' },
  { id: 'cook', label: 'Straight to the pan', hint: 'Cut and keep ready' }
];

export function bowlOf(ing) {
  const name = String(ing?.item || '').toLowerCase();
  if (MEAT.test(name) && !/\b(broth|stock|sauce|bouillon|powder|seasoning)\b/.test(name)) return 'cook';
  if (POWDERY.test(name)) return 'dry';
  if (WET_FIRST.test(name)) return 'wet';
  if (COOK_FIRST.test(name)) return 'cook';
  if (DRY.test(name)) return 'dry';
  if (WET.test(name)) return 'wet';
  return 'cook';
}

// → [{ id, label, hint, items:[ingredient…] }] in bowl order, empty bowls left out
export function prepGroups(ingredients) {
  const by = { wet: [], dry: [], cook: [] };
  for (const g of ingredients || []) by[bowlOf(g)].push(g);
  return BOWLS.map((b) => ({ ...b, items: by[b.id] })).filter((b) => b.items.length);
}
// Worth showing the switch only when the recipe really splits across 2+ bowls
export const hasBowls = (ingredients) => prepGroups(ingredients).length >= 2 && (ingredients || []).length >= 4;
