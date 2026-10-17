'use client';
import { useWhisk } from './AppShell';

// Progress bars under a recipe's nutrition: how much of a day each number is. Values come from the recipe page; the
// day is your own calorie goal if you set one, otherwise the 2,000 kcal reference. Protein, carbs and fat use the
// FDA % Daily Value references (50 g, 275 g, 78 g). A guide, not medical advice.
const DV = { protein_g: ['Protein', 50, 'var(--accent, #f5b700)'], carbs_g: ['Carbs', 275, '#4c9be8'], fat_g: ['Fat', 78, '#e8814c'] };

function Bar({ label, text, pct, color, id }) {
  const w = Math.min(100, Math.round(pct * 100));
  return (
    <div data-testid={id} style={{ display: 'grid', gridTemplateColumns: '64px 1fr 56px', alignItems: 'center', gap: 8, fontSize: 12 }}>
      <span style={{ fontWeight: 800, color: 'var(--muted)' }}>{label}</span>
      <span role="progressbar" aria-label={`${label} ${Math.round(pct * 100)}% of the day`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(pct * 100))}
        style={{ height: 10, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', display: 'block' }}>
        <span style={{ display: 'block', height: '100%', width: `${w}%`, background: color, borderRadius: 99 }} />
      </span>
      <b style={{ textAlign: 'right' }}>{text}</b>
    </div>
  );
}

export function MacroBars({ nutrition: n }) {
  const { profile } = useWhisk();
  if (!n || !(n.calories > 0)) return null;
  const goal = profile?.calorie_goal || 2000;
  return (
    <div className="stack" style={{ gap: 6 }} data-testid="macro-bars" aria-label="Share of a day, per serving">
      <Bar id="mb-kcal" label="Calories" pct={n.calories / goal} text={`${Math.round((n.calories / goal) * 100)}%`} color="var(--ok, #2fb344)" />
      {Object.entries(DV).map(([k, [label, dv, color]]) => (n[k] != null ? <Bar key={k} id={`mb-${k}`} label={label} pct={n[k] / dv} text={`${Math.round((n[k] / dv) * 100)}%`} color={color} /> : null))}
      <small className="desc">Share of a day per serving: {profile?.calorie_goal ? `your ${goal} kcal goal` : '2,000 kcal reference'}; protein, carbs and fat against FDA daily values.</small>
    </div>
  );
}

// Batch cooking: scale the recipe up, see how many portions that is and how to store them. Storage times are the USDA
// guidance for cooked leftovers: cool within 2 hours, fridge 3 to 4 days, freezer 2 to 6 months for best quality, reheat to 165°F (74°C).
export function BatchCook({ base, factor, onChange, kcal }) {
  const portions = Math.round(base * factor * 2) / 2;
  const week = Math.max(1, Math.ceil(7 / base));
  return (
    <div className="stack" style={{ gap: 8 }} data-testid="batch-cook">
      <div className="row" style={{ gap: 6, alignItems: 'center' }}>
        <b style={{ flex: '0 0 auto' }}>Batch cook</b>
        {[2, 3, 4].map((m) => <button key={m} type="button" className={`chip ${factor === m ? 'on' : ''}`} data-testid={`batch-${m}`} aria-pressed={factor === m} onClick={() => onChange(factor === m ? 1 : m)}>×{m}</button>)}
        {base * 7 > 0 && <button type="button" className={`chip ${factor === week ? 'on' : ''}`} data-testid="batch-week" aria-pressed={factor === week} onClick={() => onChange(factor === week ? 1 : week)}>A week</button>}
      </div>
      {factor > 1 && (
        <p className="desc" style={{ margin: 0 }} data-testid="batch-info">
          Makes {portions} portions{kcal ? ` (${Math.round(kcal * portions)} kcal in all)` : ''}. Cool within 2 hours, then fridge up to 3 to 4 days or freeze for 2 to 6 months. Reheat until steaming hot (74°C / 165°F). The ingredient amounts and steps below are scaled.
        </p>
      )}
    </div>
  );
}
