// Perspective kit for the recipe postcards (lib/landmarks.js, lib/regions*.js → lib/scenes.js postcardSvg).
// A "vista" scene draws the whole view across the card (x 0–400, off both edges), not just a landmark in the
// middle: far things are smaller, paler (they fade into the sky colour) and carry no outline; near things are
// bigger with Yoke's dark outline. Bridges, walls, rivers, roads and rows of houses run off the card or shrink
// toward the horizon, so the eye travels into the picture. The table covers y > 160, the dish sits around
// x 190–300, the little buddy drawing at x ≈ 356, so the hero stands left of centre.
// Plain strings, no imports: shared by the app and Whisk Play.

export const INK = '#3B2C24';
export const O = `stroke='${INK}' stroke-width='2.2' stroke-linejoin='round' stroke-linecap='round'`;
export const o = `stroke='${INK}' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'`;
const HAZE = { day: '#D9F1FB', warm: '#FFE7B8', dusk: '#FFC2AE', sand: '#FCE7BF' };
const r1 = (n) => Math.round(n * 10) / 10;

// a scene that draws its own land and water: postcardSvg skips its default ground for these
export const V = (fn) => { const f = (x, c) => fn(c || { sky: 'day', ground: ['#8CC56B', '#6FAA52'], sea: false, gid: '' }).replace(/(\d\.\d)\d+/g, '$1').replace(/\s*\n\s*/g, ''); f.full = true; return f; };

export function mix(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
// a colour pushed toward the sky: t = 0 near, ~0.6 far
export const hz = (c, col, t) => mix(col, HAZE[c.sky] || HAZE.day, t);
export const tx = (cx, cy, s, body) => (s === 1 ? body : `<g transform='translate(${r1(cx)} ${r1(cy)}) scale(${r1(s * 100) / 100}) translate(${r1(-cx)} ${r1(-cy)})'>${body}</g>`);
export const q = (p0, c, p1, t) => { const u = 1 - t; return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]; };
export const lerp = (a, b, t) => a + (b - a) * t;
export const along = (pts, x) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1)); } return x < pts[0][0] ? pts[0][1] : pts[pts.length - 1][1]; };
// n spots from near (t=0) to far (t=1), bunching up with distance like real perspective
export const recede = (n, k = 0.72) => { if (n < 2) return [0]; if (Math.abs(k - 1) < 1e-6) return Array.from({ length: n }, (_, i) => i / (n - 1)); const out = []; let s = 0; const tot = (1 - k ** (n - 1)) / (1 - k); for (let i = 0; i < n; i++) { out.push(s / tot); s += k ** i; } return out; };

// smooth silhouette through [x, y] points, closed down to `bottom`
export function sil(pts, bottom = 200) {
  let d = `M${pts[0][0]} ${bottom}L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]]; d += `Q${a[0]} ${a[1]} ${r1((a[0] + b[0]) / 2)} ${r1((a[1] + b[1]) / 2)}`; }
  const z = pts[pts.length - 1]; return `${d}L${z[0]} ${z[1]}L${z[0]} ${bottom}z`;
}
// rolling hills across the card
export const hills = (c, pts, col, t = 0, ink = false, bottom = 200) => `<path d='${sil(pts, bottom)}' fill='${hz(c, col, t)}' ${ink ? O : ''}/>`;
// a mountain range: [x, height, half-width] peaks standing on y = base; snow caps on the tall ones
export function range(c, base, peaks, col, t = 0, { snow = true, ink = false, cap = 70 } = {}) {
  const fill = hz(c, col, t), white = hz(c, '#FFFFFF', t * 0.5), line = ink ? O : '';
  return peaks.map(([x, h, w]) => {
    const L = [x - w * 0.32, base - h * 0.7], R = [x + w * 0.36, base - h * 0.62];
    const body = `<path d='M${x - w} ${base}L${r1(L[0])} ${r1(L[1])}L${x} ${base - h}L${r1(R[0])} ${r1(R[1])}L${x + w} ${base}z' fill='${fill}' ${line}/>`;
    const sn = snow && h >= cap ? `<path d='M${r1(L[0] + (x - L[0]) * 0.25)} ${r1(L[1] + (base - h - L[1]) * 0.25)}L${x} ${base - h}L${r1(R[0] + (x - R[0]) * 0.25)} ${r1(R[1] + (base - h - R[1]) * 0.25)}l-${r1(w * 0.09)} ${r1(h * 0.08)}-${r1(w * 0.09)}-${r1(h * 0.05)}-${r1(w * 0.09)} ${r1(h * 0.08)}-${r1(w * 0.09)}-${r1(h * 0.06)}z' fill='${white}' ${line}/>` : '';
    return body + sn;
  }).join('');
}
// the near ground: a band from the horizon line down under the table, in the scene's own ground colours
export const land = (c, pts, col) => `<path d='${sil(pts)}' fill='${col || (c.gid ? `url(#${c.gid})` : c.ground[0])}' ${O}/>`;
// open water from the horizon to y1, with wave marks that get smaller toward the horizon
export function water(c, y0, y1 = 200, col = '#4FA9D6') {
  const far = hz(c, col, 0.35); const rows = recede(5, 0.7).map((t) => lerp(y1 - 8, y0 + 4, t));
  return `<rect x='-10' y='${y0}' width='420' height='${y1 - y0 + 2}' fill='${col}'/><rect x='-10' y='${y0}' width='420' height='${r1((y1 - y0) * 0.35)}' fill='${far}'/>` +
    rows.map((y, i) => { const w = lerp(26, 8, i / 4); let d = ''; for (let x = -10 + (i % 2) * w; x < 410; x += w * 3.2) d += `M${r1(x)} ${r1(y)}q${r1(w / 2)} -${r1(w / 6)} ${r1(w)} 0`; return `<path d='${d}' fill='none' stroke='#D6F0FA' stroke-width='${r1(lerp(2, 1, i / 4))}' stroke-linecap='round' opacity='.85'/>`; }).join('');
}
export const foam = (x, y, w) => `<ellipse cx='${r1(x)}' cy='${r1(y)}' rx='${r1(w)}' ry='${r1(Math.max(1.6, w / 9))}' fill='#FFFFFF' opacity='.9'/>`;
export const fog = (list) => `<g fill='#FFFFFF' opacity='.72'>${list.map(([x, y, w, h = w / 6]) => `<ellipse cx='${x}' cy='${y}' rx='${w}' ry='${r1(h)}'/>`).join('')}</g>`;
export const birds = (list) => `<path d='${list.map(([x, y, s = 1]) => `M${x - 4 * s} ${y}l${4 * s} -${4 * s} ${4 * s} ${4 * s}`).join('')}' fill='none' stroke='${INK}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>`;
// a ribbon (river, road, canal, wall top) from a near point to a far one: [x, y, width] centre points
export function ribbon(pts, fill, ink = true, extra = '') {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y, w] = pts[i]; const [a, b] = [pts[Math.max(0, i - 1)], pts[Math.min(pts.length - 1, i + 1)]];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; const nx = -dy / m, ny = dx / m;
    L.push([x + nx * w / 2, y + ny * w / 2]); R.push([x - nx * w / 2, y - ny * w / 2]);
  }
  const P = [...L, ...R.reverse()].map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
  return `<path d='${P}z' fill='${fill}' ${ink ? O : ''} ${extra}/>`;
}
// lines running from the bottom of the card to a vanishing point (vineyard and lavender rows, furrows, tiles)
export function rows(c, vx, vy, y0, xs, col, w = 4) {
  return `<g stroke='${col}' stroke-linecap='round'>${xs.map((x) => { const t = (y0 - vy) / (200 - vy); const sx = lerp(vx, x, t); return `<path d='M${r1(sx)} ${y0}L${x} 200' stroke-width='${w}'/>`; }).join('')}</g>`;
}
// things placed from a near spot to a far spot, getting smaller: f(x, y, s, i, t)
export const line = (p0, p1, n, s0, s1, f, k = 0.72) => recede(n, k).map((t, i) => f(lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t), lerp(s0, s1, t), i, t)).reverse().join('');

// --- small things, standing on (x, y) at scale s ---
export const pine = (x, y, s = 1, col = '#3F6E3A', ink = true) => tx(x, y, s, `<path d='M${x} ${y}v-6' stroke='#6B4A2B' stroke-width='3'/><path d='M${x - 12} ${y - 6}l12-34 12 34z' fill='${col}' ${ink ? O : ''}/><path d='M${x - 9} ${y - 18}l9-26 9 26z' fill='${col}' ${ink ? O : ''}/>`);
export const cypress = (x, y, s = 1, col = '#3F6E3A', ink = true) => tx(x, y, s, `<path d='M${x} ${y}q-9-34 0-66 9 32 0 66z' fill='${col}' ${ink ? O : ''}/>`);
export const palm = (x, y, s = 1, lean = 1) => tx(x, y, s, `<path d='M${x} ${y}q${4 * lean} -30 ${-2 * lean} -58' fill='none' stroke='#8A5A34' stroke-width='5' stroke-linecap='round'/><g fill='#4F9A4A' ${O}><path d='M${x - 2 * lean} ${y - 58}q-22-8-34 6 18-4 34-6z'/><path d='M${x - 2 * lean} ${y - 58}q22-10 34 4-18-4-34-4z'/><path d='M${x - 2 * lean} ${y - 58}q-14-18-30-14 16 2 30 14z'/><path d='M${x - 2 * lean} ${y - 58}q14-20 30-12-16 0-30 12z'/></g>`);
export const bush = (x, y, s = 1, col = '#5E9C4F', ink = true) => tx(x, y, s, `<path d='M${x - 14} ${y}q-4-16 8-18 4-10 14-4 12-2 10 14 4 6-2 8z' fill='${col}' ${ink ? O : ''}/>`);
export const tree = (x, y, s = 1, col = '#5E9C4F', ink = true) => tx(x, y, s, `<path d='M${x} ${y}v-18' stroke='#6B4A2B' stroke-width='4'/><circle cx='${x}' cy='${y - 26}' r='13' fill='${col}' ${ink ? O : ''}/>`);
export const boat = (x, y, s = 1, col = '#D9452B') => tx(x, y, s, `<path d='M${x - 18} ${y}h36l-6 8h-24z' fill='${col}' ${o}/><path d='M${x} ${y}v-24l14 20z' fill='#FFFFFF' ${o}/>`);
// a house: wall w × h on y, pitched roof
export const house = (x, y, w, h, wall, roof, ink = true, win = '#6E8FA8') => `<rect x='${r1(x - w / 2)}' y='${r1(y - h)}' width='${r1(w)}' height='${r1(h)}' fill='${wall}' ${ink ? O : ''}/><path d='M${r1(x - w / 2 - w * 0.1)} ${r1(y - h + 1)}L${r1(x)} ${r1(y - h - w * 0.42)}L${r1(x + w / 2 + w * 0.1)} ${r1(y - h + 1)}z' fill='${roof}' ${ink ? O : ''}/>${w > 14 ? `<rect x='${r1(x - w * 0.12)}' y='${r1(y - h * 0.5)}' width='${r1(w * 0.24)}' height='${r1(h * 0.5)}' fill='${win}' ${ink ? o : ''}/>` : ''}`;
// a flat-roofed block (towns, medinas, skylines): windows when big enough
export const block = (x, y, w, h, col, ink = true, win = 'rgba(59,44,36,.25)') => `<rect x='${r1(x - w / 2)}' y='${r1(y - h)}' width='${r1(w)}' height='${r1(h)}' fill='${col}' ${ink ? O : ''}/>${w >= 16 && h >= 18 ? Array.from({ length: Math.floor((h - 8) / 11) }, (_, r) => [0.3, 0.7].map((f) => `<rect x='${r1(x - w / 2 + w * f - 2.5)}' y='${r1(y - h + 6 + r * 11)}' width='5' height='6' fill='${win}'/>`).join('')).join('') : ''}`;
// a far town on the horizon: a strip of little blocks, pale
export const farTown = (c, x0, x1, y, col = '#B7C6D6', t = 0.45, hmax = 16, seed = 3) => { let s = seed, out = ''; for (let x = x0; x < x1;) { s = (s * 9301 + 49297) % 233280; const w = 6 + (s % 9), h = 4 + (s % hmax); out += `<rect x='${x}' y='${y - h}' width='${w}' height='${h + 1}' fill='${hz(c, col, t)}'/>`; x += w + 1; } return out; };
// an older single-landmark drawing (stands on y = 150, centred on x) placed at (x, base) and scaled
export const put = (draw, x, base, s = 1) => `<g transform='translate(0 ${r1(base - 150)})'>${tx(x, 150, s, draw(x))}</g>`;
// sea from the horizon, a beach or quay across the front right (the buddy drawing stands there at x ≈ 356)
export const frontShore = (c, col = '#F2DFA6', y = 146) => land(c, [[-20, y + 14], [120, y + 10], [230, y + 4], [300, y], [420, y - 4]], col);
export const grass = (c) => (c.gid ? `url(#${c.gid})` : c.ground[0]);
// a far skyline of towers between x0 and x1 standing on y, pale with distance
export function skyline(c, x0, x1, y, { t = 0.45, hmin = 16, hmax = 60, seed = 5, col = '#9AB0C8', gap = 2, wmin = 9, wvar = 11 } = {}) {
  let s = seed, out = ''; for (let x = x0; x < x1;) { s = (s * 9301 + 49297) % 233280; const w = wmin + (s % wvar), h = hmin + (s % (hmax - hmin + 1)); out += `<rect x='${x}' y='${y - h}' width='${w}' height='${h + 1}' fill='${hz(c, col, t)}'/>`; x += w + gap; }
  return out;
}
export const dome = (x, y, r, col, ink = true) => `<path d='M${x - r} ${y}a${r} ${r} 0 0 1 ${r * 2} 0z' fill='${col}' ${ink ? O : ''}/>`;
export const minaret = (x, y, h, col = '#F2E6D0', cap = '#2E8A8F', w = 8, ink = true) => `<rect x='${x - w / 2}' y='${y - h}' width='${w}' height='${h}' fill='${col}' ${ink ? O : ''}/><rect x='${x - w / 2 - 2}' y='${y - h * 0.62}' width='${w + 4}' height='3' fill='${col}' ${ink ? o : ''}/><path d='M${x - w / 2 - 1} ${y - h}l${w / 2 + 1} -${w * 1.8} ${w / 2 + 1} ${w * 1.8}z' fill='${cap}' ${ink ? O : ''}/>`;
export const cow = (x, y, s = 1, col = '#FFFFFF') => tx(x, y, s, `<rect x='${x - 12}' y='${y - 18}' width='24' height='12' rx='4' fill='${col}' ${o}/><circle cx='${x - 5}' cy='${y - 14}' r='3' fill='${INK}'/><rect x='${x + 9}' y='${y - 22}' width='8' height='8' rx='3' fill='${col}' ${o}/><path d='M${x - 9} ${y - 6}v6M${x + 8} ${y - 6}v6' stroke='${INK}' stroke-width='2.4'/>`);
export const sheep = (x, y, s = 1) => tx(x, y, s, `<ellipse cx='${x}' cy='${y - 10}' rx='11' ry='7' fill='#FFFFFF' ${o}/><circle cx='${x + 11}' cy='${y - 12}' r='4' fill='${INK}'/><path d='M${x - 6} ${y - 4}v4M${x + 5} ${y - 4}v4' stroke='${INK}' stroke-width='2.2'/>`);
export const camel = (x, y, s = 1, col = '#C99A5A') => tx(x, y, s, `<path d='M${x - 22} ${y}v-14c-4-2-4-8 0-10 4-8 12-8 14-2 4-6 12-6 14 0 4 2 6 6 4 10v16M${x - 10} ${y}v-12M${x + 8} ${y}v-12' fill='${col}' ${o}/><path d='M${x + 14} ${y - 14}c4-6 6-12 4-18 2-4 8-4 10 0l2 4-6 2c0 6-2 10-6 14' fill='${col}' ${o}/>`);
export const llama = (x, y, s = 1, col = '#F2E6D0') => tx(x, y, s, `<path d='M${x - 12} ${y}v-14h20v-18l6-4 2 6-2 2v14v14M${x - 8} ${y}v-14M${x + 4} ${y}v-14' fill='${col}' ${o}/><rect x='${x - 14}' y='${y - 22}' width='24' height='10' rx='4' fill='${col}' ${o}/>`);
export const balloon = (x, y, s = 1, col = '#E8735A', t = 0, c) => tx(x, y, s, `<path d='M${x} ${y + 18}c-14-8-16-18-16-24a16 16 0 0 1 32 0c0 6-2 16-16 24z' fill='${c ? hz(c, col, t) : col}' ${t < 0.2 ? o : ''}/><path d='M${x - 5} ${y + 18}l2 8h6l2-8' fill='none' stroke='${INK}' stroke-width='1.2'/><rect x='${x - 4}' y='${y + 25}' width='8' height='6' fill='#8A5A34' ${t < 0.2 ? o : ''}/>`);
export const acacia = (x, y, s = 1, col = '#6E8F3E', ink = true) => tx(x, y, s, `<path d='M${x} ${y}q-4-24 0-40M${x} ${y - 34}q-14-8-22 2M${x} ${y - 34}q14-8 22 2' fill='none' stroke='#6B4A2B' stroke-width='4' stroke-linecap='round'/><path d='M${x - 34} ${y - 34}q34-22 68 0-18 7-34 5t-34-5z' fill='${col}' ${ink ? O : ''}/>`);
// curved bands stepping back like rice or tea terraces: from y0 (near) to y1 (far)
export const terraces = (c, y0, y1, n, cols, bow = 30) => recede(n, 0.75).map((t, i) => { const y = lerp(y0, y1, t); const b = lerp(bow, bow * 0.3, t); return `<path d='M-20 ${y + b * 0.4}Q200 ${y - b} 420 ${y + b * 0.4}V200H-20z' fill='${hz(c, cols[i % cols.length], t * 0.5)}' ${t < 0.85 ? O : ''}/>`; }).reverse().join('');
