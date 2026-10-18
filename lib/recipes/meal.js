// Which meal a recipe suits. Recipes carry no meal tag, so this is read from the title: a dish can fit more than one.
export const MEALS = [
  { id: 'breakfast', label: 'Breakfast', icon: 'mug' },
  { id: 'lunch', label: 'Lunch', icon: 'burger' },
  { id: 'dinner', label: 'Dinner', icon: 'cloche' },
  { id: 'snack', label: 'Snack', icon: 'popcorn' },
  { id: 'dessert', label: 'Dessert', icon: 'cupcake' },
  { id: 'sauce', label: 'Sauces', icon: 'bottle' }
];
const has = (t, re) => re.test(t);
export function mealsOf(r) {
  const t = String(r.title || '').toLowerCase();
  const out = new Set();
  const mainy = has(t, /\b(chicken|beef|pork|pasta|noodles?|rice|sausage|biscuits|tortillas?|shrimp|prawn|fish|steak)\b/);
  if (!mainy && has(t, /\b(sauce|gravy|salsa|dressing|chutney|marinade|pesto|aioli|glaze|dip|tzatziki)\b/)) out.add('sauce');
  if (has(t, /\b(pancakes?|omelet+e?|omelette|toast|oatmeal|porridge|waffles?|granola|hash|shakshuka|tamago|chilaquiles|egg on rice|mush|biscuits and|eggs?)\b/)) out.add('breakfast');
  if (!has(t, /\b(chicken|pot|shepherd|beef|pork)\b/) && has(t, /\b(cake|cookies?|brownies?|pudding|cobbler|ice cream|pie|dessert|bread pudding|peanut butter bread)\b/)) out.add('dessert');
  if (has(t, /\b(cornbread|croquettes|quesadillas?|falafel|fries|nachos|bread|dip|toast|potato pancakes)\b/)) out.add('snack');
  if (has(t, /\b(soup|sandwich|salad|burgers?|wrap|burritos?|tacos?|sloppy|quesadillas?|bowls?|toast|noodle soup)\b/)) out.add('lunch');
  const lightOnly = out.has('dessert') || (out.has('sauce') && !mainy) || (out.has('snack') && !out.has('lunch') && !mainy);
  if (!lightOnly && !(out.has('breakfast') && !mainy && out.size === 1)) out.add('dinner');
  if (!out.size) out.add('dinner');
  return [...out];
}
export const fitsMeal = (r, meal) => !meal || mealsOf(r).includes(meal);
