import { dietTags, DIET_CLASS } from '@/lib/recipes/diet';

// Diet tags (High protein, Keto, Vegan …) from the recipe's own nutrition and ingredients. See lib/recipes/diet.js.
export default function DietTags({ recipe, max = 7 }) {
  const tags = dietTags(recipe).slice(0, max);
  if (!tags.length) return null;
  return <div className="row diet-tags" style={{ gap: 6 }}>{tags.map((t) => <span key={t} className={`chip diet ${DIET_CLASS[t]}`}>{t}</span>)}</div>;
}
