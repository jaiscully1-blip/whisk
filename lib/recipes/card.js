import { ingredientLine, plainStep } from './scale';

// The recipe on the back of a shared plate: { title, ingredients: [text], steps: [text] }. From the one you wrote, or the one you cooked.
export function recipeCard(title, recipe, wIng = [], wSteps = [], factor = 1) {
  const clean = (a) => a.map((x) => String(x || '').trim()).filter(Boolean);
  if (wIng.length || wSteps.length) return { title, ingredients: clean(wIng), steps: clean(wSteps) };
  if (!recipe) return null;
  let ingredients = [];
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) ingredients = recipe.ingredients.map((g) => (typeof g === 'string' ? g : ingredientLine(g, factor)));
  else if (recipe.amounts) ingredients = Object.entries(recipe.amounts).map(([k, v]) => `${k}: ${v}`);
  const steps = (recipe.steps || []).map((s) => plainStep(Array.isArray(s) ? s[0] : typeof s === 'string' ? s : s?.text || '', factor));
  const card = { title, ingredients: clean(ingredients), steps: clean(steps) };
  return card.ingredients.length || card.steps.length ? card : null;
}
