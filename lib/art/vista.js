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
export const minaret = (x, y, h, col = '#F2E6D0', cap = '#2E8A8F', w = 8, ink = true) => { const b = w + 5, t = w + 1, top = y - h * 0.84; return `<path d='M${x - b / 2} ${y}L${x - t / 2} ${top}h${t}L${x + b / 2} ${y}z' fill='${col}' ${ink ? O : ''}/><rect x='${x - w / 2 - 3}' y='${y - h * 0.62}' width='${w + 6}' height='4' rx='2' fill='${col}' ${ink ? o : ''}/><rect x='${x - w / 2 - 3}' y='${top - 2}' width='${w + 6}' height='4' rx='2' fill='${col}' ${ink ? o : ''}/><path d='M${x - w / 2 - 1} ${top - 2}q${w / 2 + 1} -${w * 2.6} ${w + 2} 0z' fill='${cap}' ${ink ? O : ''}/><path d='M${x} ${top - w * 1.3 - 2}v-5' stroke='#E2B33E' stroke-width='1.6'/>`; };
export const cow = (x, y, s = 1, col = '#FFFFFF') => tx(x, y, s, `<path d='M${x - 11} ${y - 12}v12h4l1-10M${x + 7} ${y - 12}l1 12h4l1-12' fill='#7A6A5A' ${o}/><path d='M${x - 17} ${y - 21}c0-6 4-8 10-8h16c6 0 10 3 10 8v8c0 3-3 4-6 4h-26c-3 0-4-2-4-4z' fill='${col}' ${o}/><path d='M${x - 6} ${y - 29}c3 0 5 3 4 6-3 2-6 0-4-6zM${x + 6} ${y - 26}c4 0 5 3 3 5-3 1-5-1-3-5z' fill='${INK}'/><path d='M${x + 15} ${y - 28}l6-1c3 0 5 3 5 7l-1 5c-1 3-3 4-6 4h-4z' fill='${col}' ${o}/><path d='M${x + 20} ${y - 17}h5l1 3h-6z' fill='#F2B8B0' ${o}/><path d='M${x + 16} ${y - 29}l-2-5 4 1zM${x + 21} ${y - 29}l1-5 3 3z' fill='${col}' ${o}/><circle cx='${x + 21}' cy='${y - 23}' r='1.1' fill='${INK}'/><path d='M${x - 17} ${y - 24}q-5 2-4 10' fill='none' stroke='${INK}' stroke-width='1.6' stroke-linecap='round'/><path d='M${x - 8} ${y - 12}v12h4V${y - 11}M${x + 10} ${y - 12}v12h4l-1-11' fill='${col}' ${o}/>`);
export const sheep = (x, y, s = 1) => tx(x, y, s, `<path d='M${x - 7} ${y - 8}v8M${x + 6} ${y - 8}v8' stroke='${INK}' stroke-width='2.6' stroke-linecap='round'/><g fill='#FFFFFF' ${o}><circle cx='${x - 9}' cy='${y - 12}' r='6'/><circle cx='${x - 2}' cy='${y - 16}' r='7'/><circle cx='${x + 6}' cy='${y - 14}' r='6.5'/><circle cx='${x + 1}' cy='${y - 9}' r='6'/><circle cx='${x - 7}' cy='${y - 8}' r='5'/></g><path d='M${x + 10} ${y - 17}c4-2 8 0 8 4l-1 5c-1 2-4 2-6 0z' fill='#3B3A3A' ${o}/><path d='M${x + 10} ${y - 17}l-3-3 4 1z' fill='#3B3A3A'/><circle cx='${x + 14}' cy='${y - 14}' r='.9' fill='#fff'/>`);
export const camel = (x, y, s = 1, col = '#C99A5A') => tx(x, y, s, `<path d='M${x - 19} ${y - 24}l-1 24h4l2-17M${x + 14} ${y - 24}l1 24h4l1-18' fill='#A9793F' ${o}/><g transform='translate(0 -7)'><path d='M${x - 24} ${y - 20}c-3-8 2-11 8-11 2-11 12-11 14 0 8 0 18 1 24-1 5-2 6 3 6 8 0 6-4 11-9 12h-34c-5 0-8-3-9-7z' fill='${col}' ${o}/><path d='M${x + 18} ${y - 29}c4-6 6-12 8-19l7 2c-2 7-3 13-5 20z' fill='${col}' ${o}/><path d='M${x + 26} ${y - 49}c4-3 10-2 13 1 1 3-1 6-5 6l-7 1z' fill='${col}' ${o}/><circle cx='${x + 31}' cy='${y - 48}' r='1.2' fill='${INK}'/><path d='M${x + 27} ${y - 50}l-1-4 3 2z' fill='${col}' ${o}/><path d='M${x - 25} ${y - 24}q-5 3-4 11' fill='none' stroke='#7A5A2F' stroke-width='2' stroke-linecap='round'/></g><path d='M${x - 14} ${y - 24}l-1 24h4l1-18M${x + 20} ${y - 24}l1 24h4l-1-18' fill='${col}' ${o}/>`);
export const llama = (x, y, s = 1, col = '#F2E6D0') => tx(x, y, s, `<path d='M${x - 8} ${y - 10}v10h3l1-8M${x + 8} ${y - 10}v10h3l-1-8' fill='#CDBA98' ${o}/><path d='M${x - 17} ${y - 16}c-1-8 5-11 11-11h12c6 0 10 3 10 10 0 5-3 9-8 9h-17c-5 0-8-3-8-8z' fill='${col}' ${o}/><path d='M${x + 7} ${y - 24}c2-8 3-14 4-20l5 1c-1 7-1 14-2 21z' fill='${col}' ${o}/><path d='M${x + 10} ${y - 45}c3-3 8-2 10 1 1 3-1 5-4 5l-6 1z' fill='${col}' ${o}/><path d='M${x + 11} ${y - 47}l-1-6 3 4zM${x + 15} ${y - 47}l1-6 2 5z' fill='${col}' ${o}/><circle cx='${x + 16}' cy='${y - 44}' r='1' fill='${INK}'/><path d='M${x - 13} ${y - 10}v10h3l1-8M${x + 12} ${y - 10}v10h3l-1-8' fill='${col}' ${o}/>`);
export const balloon = (x, y, s = 1, col = '#E8735A', t = 0, c) => tx(x, y, s, `<path d='M${x} ${y + 18}c-14-8-16-18-16-24a16 16 0 0 1 32 0c0 6-2 16-16 24z' fill='${c ? hz(c, col, t) : col}' ${t < 0.2 ? o : ''}/><path d='M${x - 5} ${y + 18}l2 8h6l2-8' fill='none' stroke='${INK}' stroke-width='1.2'/><rect x='${x - 4}' y='${y + 25}' width='8' height='6' fill='#8A5A34' ${t < 0.2 ? o : ''}/>`);
export const acacia = (x, y, s = 1, col = '#6E8F3E', ink = true) => tx(x, y, s, `<path d='M${x} ${y}q-4-24 0-40M${x} ${y - 34}q-14-8-22 2M${x} ${y - 34}q14-8 22 2' fill='none' stroke='#6B4A2B' stroke-width='4' stroke-linecap='round'/><path d='M${x - 34} ${y - 34}q34-22 68 0-18 7-34 5t-34-5z' fill='${col}' ${ink ? O : ''}/>`);
// curved bands stepping back like rice or tea terraces: from y0 (near) to y1 (far)
export const terraces = (c, y0, y1, n, cols, bow = 30) => recede(n, 0.75).map((t, i) => { const y = lerp(y0, y1, t); const b = lerp(bow, bow * 0.3, t); return `<path d='M-20 ${y + b * 0.4}Q200 ${y - b} 420 ${y + b * 0.4}V200H-20z' fill='${hz(c, cols[i % cols.length], t * 0.5)}' ${t < 0.85 ? O : ''}/>`; }).reverse().join('');

export const horse = (x, y, s = 1, col = '#8A5A3A') => tx(x, y, s, `<path d='M${x - 14} ${y - 18}l-1 18h3l2-13M${x + 10} ${y - 18}l1 18h3l1-13' fill='${col}' opacity='.8' ${o}/><path d='M${x - 20} ${y - 22}c-1-7 4-10 10-10h18c6 0 11 2 12 8 0 7-4 11-10 11h-22c-5 0-8-3-8-9z' fill='${col}' ${o}/><path d='M${x + 10} ${y - 30}c3-6 6-11 9-15l6 3c-2 5-3 10-3 17z' fill='${col}' ${o}/><path d='M${x + 17} ${y - 46}c3-3 9-2 12 1 1 3-1 5-4 6l-8 1z' fill='${col}' ${o}/><path d='M${x + 15} ${y - 46}l1-5 3 3zM${x + 10} ${y - 32}q4-8 9-14' fill='${INK}' ${o}/><circle cx='${x + 24}' cy='${y - 45}' r='1' fill='${INK}'/><path d='M${x - 20} ${y - 26}q-8 2-8 14' fill='none' stroke='${INK}' stroke-width='2.4' stroke-linecap='round'/><path d='M${x - 8} ${y - 18}l-1 18h3l1-13M${x + 16} ${y - 18}l1 18h3l-1-13' fill='${col}' ${o}/>`);
export const elephant = (x, y, s = 1, col = '#9AA5B4') => tx(x, y, s, `<g transform='translate(${x} ${y})'><path d='M-16-14v14h8l1-12M10-14v14h8l-1-12' fill='#8E99A8' ${o}/><path d='M-26-22c0-12 8-18 20-18h16c10 0 16 6 16 14v10c0 4-2 6-6 6h-38c-5 0-8-4-8-12z' fill='${col}' ${o}/><path d='M12-36c6-4 14-2 16 4l2 14c0 6-4 8-8 6-2-8-4-10-10-12z' fill='${col}' ${o}/><path d='M26-20c4 2 6 8 4 14-1 4-5 4-6 1l2-8c-2-3-3-5-3-8z' fill='${col}' ${o}/><path d='M-6-34c8 0 12 6 10 16-6 4-14 0-16-6-1-6 2-10 6-10z' fill='#8E99A8' ${o}/><circle cx='22' cy='-26' r='1.3' fill='${INK}'/><path d='M-26-22q-6 2-6 12' fill='none' stroke='${INK}' stroke-width='2' stroke-linecap='round'/><path d='M-20-14v14h8l1-12M16-14v14h8l-1-12' fill='${col}' ${o}/></g>`);

// houses seated on a hill outline: P = the hill's [x,y] points, xs = where they go (they sit a little into the slope)
export const slopeY = (P, x) => { for (let j = 0; j < P.length - 1; j++) if (x >= P[j][0] && x <= P[j + 1][0]) return P[j][1] + (P[j + 1][1] - P[j][1]) * (x - P[j][0]) / (P[j + 1][0] - P[j][0]); return P[P.length - 1][1]; };
export const slopeHouses = (P, xs, cols, k0 = 0.7, k1 = 1.05, w = 22, h = 24, roof = null) => xs.map((x, i) => { const k = k0 + (k1 - k0) * (i / Math.max(1, xs.length - 1)); const y = slopeY(P, x) + 12 * k; return tx(x, y, k, block(x, y, w, h, cols[i % cols.length]) + (roof ? `<path d='M${x - w / 2 - 2} ${y - h}h${w + 4}l-3-5h-${w - 2}z' fill='${roof}' stroke='#3B2C24' stroke-width='1.6'/>` : '')); }).join('');
