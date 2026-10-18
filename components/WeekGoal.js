'use client';
import { useCached } from '@/lib/cache';
import { fetchWeek } from './tabData';
import { useWhisk } from './AppShell';
import { fmt, weekStart, HOME_MEAL_COST } from '@/lib/game';

// Food in each bento compartment, drawn inside a w×h cell.
const FOODS = [
  (w, h) => <g><circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * .32} fill="#fff" /><circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * .14} fill="#FFD37A" /></g>,                       // rice + yolk
  (w, h) => <g fill="#7BC95A"><circle cx={w * .35} cy={h * .55} r={h * .22} /><circle cx={w * .55} cy={h * .4} r={h * .26} /><circle cx={w * .7} cy={h * .6} r={h * .2} /></g>,        // greens
  (w, h) => <g><rect x={w * .2} y={h * .25} width={w * .6} height={h * .5} rx={h * .2} fill="#FF9F43" /><path d={`M${w * .3} ${h * .5}h${w * .4}`} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></g>, // carrot / tamago
  (w, h) => <g><ellipse cx={w / 2} cy={h / 2} rx={w * .32} ry={h * .26} fill="#FF7A6B" /><path d={`M${w * .25} ${h / 2}q${w * .25} ${-h * .3} ${w * .5} 0`} stroke="#fff" strokeWidth="1.4" fill="none" /></g>, // salmon
  (w, h) => <g><circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * .3} fill="#E8483B" /><path d={`M${w / 2} ${h * .22}q${w * .1} ${-h * .12} ${w * .18} ${-h * .04}`} stroke="#4a9e3f" strokeWidth="2" fill="none" strokeLinecap="round" /></g>, // tomato
  (w, h) => <g><rect x={w * .22} y={h * .3} width={w * .56} height={h * .4} rx="3" fill="#2b2524" /><rect x={w * .28} y={h * .38} width={w * .44} height={h * .24} rx="2" fill="#fff" /></g>, // sushi
  (w, h) => <g><circle cx={w * .4} cy={h * .55} r={h * .22} fill="#9B6CFF" /><circle cx={w * .62} cy={h * .45} r={h * .22} fill="#B58BFF" /></g> // grapes
];

// The weekly meals goal, in the Cook banner: a bento box that fills up, one compartment per meal.
export default function WeekGoal() {
  const { supabase, profile, dataVersion } = useWhisk();
  const [meals] = useCached('week', () => fetchWeek(supabase), [dataVersion]);   // remembered between tabs
  if (!meals) return null;
  const goal = Math.min(7, Math.max(1, profile?.weekly_goal || 4));
  const since = weekStart();
  const n = meals.filter((m) => new Date(m.cooked_at) >= since).length;
  const left = Math.max(0, goal - n);
  const saved = Math.round(meals.length * Math.max(0, Number(profile?.takeout_price ?? 15) - HOME_MEAL_COST));
  // compartments: one big on the left, the rest stacked on the right (or side by side when there are only two)
  const W = 84, H = 56, pad = 5, gap = 3;
  const cells = [];
  if (goal === 1) cells.push([pad, pad, W - 2 * pad, H - 2 * pad]);
  else {
    const lw = goal === 2 ? (W - 2 * pad - gap) / 2 : (W - 2 * pad - gap) * .46;
    cells.push([pad, pad, lw, H - 2 * pad]);
    const rest = goal - 1, rx = pad + lw + gap, rw = W - pad - rx, rh = (H - 2 * pad - gap * (rest - 1)) / rest;
    if (goal === 2) cells.push([rx, pad, rw, H - 2 * pad]);
    else for (let i = 0; i < rest; i++) cells.push([rx, pad + i * (rh + gap), rw, rh]);
  }
  return (
    <div className="weekgoal" role="status" aria-label={`${n} of ${goal} meals this week`}>
      <svg width="84" height="56" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="9" fill="rgba(255,255,255,.14)" stroke="#fff" strokeWidth="3" />
        {cells.map(([x, y, w, h], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {i < n
              ? <><rect width={w} height={h} rx="5" fill="rgba(255,255,255,.92)" /><g transform="translate(0 0)">{FOODS[i % FOODS.length](w, h)}</g></>
              : <rect x=".8" y=".8" width={w - 1.6} height={h - 1.6} rx="5" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" strokeDasharray="3 3" />}
          </g>
        ))}
      </svg>
      <span><b>{left ? `${n} of ${goal} boxes packed` : 'Bento full! Goal hit'}</b>{left ? <small>{left} more meal{left === 1 ? '' : 's'} this week</small> : meals.length > 0 && saved > 0 ? <small>~${fmt(saved)} saved vs takeout</small> : null}{left > 0 && meals.length > 0 && saved > 0 && <small>~${fmt(saved)} saved vs takeout</small>}</span>
    </div>
  );
}
