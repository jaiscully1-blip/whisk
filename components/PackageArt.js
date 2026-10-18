'use client';
import { useId } from 'react';
import { packageFor } from '@/lib/packages';

// A pantry item drawn as the thing on your shelf: a ketchup bottle with red ketchup in it, a milk carton,
// a loaf of bread, a bowl of lemons. `fill` (0 to 1) is how much is left, so you can see Full / Low / Out at a glance.
const INK = '#1d1a1a';
const GLASS = 'rgba(255,255,255,.3)';
const shade = (hex, k) => {               // k < 0 darker, k > 0 lighter
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

// containers: [outline/body path, top of the inside, bottom of the inside, opaque body colour key or null]
const BODY = {
  squeeze: ['M7 9h14v19a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z', 9, 32],
  bottle: ['M11.5 8h5v3l3.5 4.2V30a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V15.2l3.5-4.2z', 10, 32],
  jar: ['M6.5 9h15v20a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3z', 10, 32],
  shaker: ['M8 11h12v19a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z', 11, 32],
  tub: ['M5 15h18l-1.8 15.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8z', 15, 32],
  carton: ['M8 12l2.5-5h7l2.5 5v18a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z', 12, 32, 'window'],
  can: ['M6 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v21.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', 7, 32, 'window'],
  bag: ['M7 8.5h14l1.4 20.8a2.4 2.4 0 0 1-2.4 2.7H8a2.4 2.4 0 0 1-2.4-2.7z', 9, 32, 'window'],
  box: ['M7 5.5h14v25a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 7 30.5z', 6, 32, 'window'],
};
const WINDOW = { carton: [10, 15, 8, 15], can: [8.5, 12, 11, 17], bag: [9.5, 14, 9, 15], box: [9.5, 11, 9, 18] }; // x, y, w, h

function Container({ shape, fill, cap, f, id }) {
  const [d, top, bot, opaque] = BODY[shape];
  const lvl = bot - (bot - top) * f;
  const w = WINDOW[shape];
  const liquid = (
    <g clipPath={`url(#${id})`}>
      <rect x="0" y={lvl} width="28" height={34 - lvl} fill={fill} />
      {f > 0 && <rect x="0" y={lvl} width="28" height="1.3" fill={shade(fill.length === 7 ? fill : '#888888', .35)} opacity=".8" />}
    </g>
  );
  return (
    <>
      <defs>
        <clipPath id={id}>{opaque ? <rect x={w[0]} y={w[1]} width={w[2]} height={w[3]} rx="2" /> : <path d={d} />}</clipPath>
      </defs>
      {/* caps, lids, tops */}
      {shape === 'squeeze' && <><rect x="12" y="1.5" width="4" height="4" rx="1" fill={cap} stroke={INK} strokeWidth="1.1" /><rect x="8.5" y="5" width="11" height="4.5" rx="1.5" fill={cap} stroke={INK} strokeWidth="1.2" /></>}
      {shape === 'bottle' && <rect x="10.8" y="3" width="6.4" height="5" rx="1.2" fill={cap} stroke={INK} strokeWidth="1.2" />}
      {shape === 'jar' && <><rect x="5.5" y="4" width="17" height="5.5" rx="1.6" fill={cap} stroke={INK} strokeWidth="1.2" /><path d="M8 6.8h12" stroke={INK} strokeOpacity=".3" strokeWidth="1" /></>}
      {shape === 'shaker' && <><rect x="7.2" y="5.5" width="13.6" height="5.8" rx="2" fill={cap} stroke={INK} strokeWidth="1.2" /><g fill={INK} opacity=".55"><circle cx="11" cy="7.6" r=".8" /><circle cx="14" cy="7.6" r=".8" /><circle cx="17" cy="7.6" r=".8" /></g></>}
      {shape === 'tub' && <rect x="3.6" y="11.5" width="20.8" height="4" rx="1.5" fill={cap} stroke={INK} strokeWidth="1.2" />}
      {shape === 'carton' && <rect x="10.5" y="3.5" width="7" height="3.5" rx=".6" fill={shade(cap, .55)} stroke={INK} strokeWidth="1.1" />}
      {shape === 'bag' && <path d="M7 4.5h14v4H7z" fill={shade(cap, 0)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />}
      {/* body */}
      <path d={d} fill={opaque ? (shape === 'can' ? '#d9d9d9' : shape === 'bag' ? '#e8d3ad' : shade(cap, .82)) : GLASS} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      {opaque && <rect x={w[0]} y={w[1]} width={w[2]} height={w[3]} rx="2" fill="rgba(255,255,255,.35)" />}
      {liquid}
      {opaque && <rect x={w[0]} y={w[1]} width={w[2]} height={w[3]} rx="2" fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1" />}
      {shape === 'can' && <><path d="M6 10.5h16M6 28.5h16" stroke={INK} strokeOpacity=".35" strokeWidth="1" /><rect x="6" y="29.5" width="16" height="2.5" fill={cap} opacity=".0" /></>}
      {shape === 'can' && <rect x="8.5" y="8.5" width="11" height="2.4" rx="1" fill={cap} />}
      {shape === 'box' && <><path d="M7 5.5l2-2h10l2 2" fill="none" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" /><rect x="9.5" y="7.5" width="9" height="2.6" rx="1.2" fill={cap} /></>}
      {shape === 'carton' && <rect x="10" y="27.5" width="8" height="2.2" rx="1" fill={cap} />}
      {shape === 'bag' && <rect x="9.5" y="24.5" width="9" height="3.2" rx="1.2" fill={cap} />}
      {!opaque && <path d={shape === 'tub' ? 'M8 18v8' : 'M10 14v12'} stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />}
    </>
  );
}

function Eggs({ f, fill }) {
  const k = Math.round(f * 6);
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => i < k && <ellipse key={i} cx={4.4 + i * 3.84} cy="15.6" rx="2.2" ry="3.1" fill={fill} stroke={INK} strokeWidth="1" />)}
      <path d="M2.5 18.5h23l-1.8 10a1.5 1.5 0 0 1-1.5 1.2H5.8a1.5 1.5 0 0 1-1.5-1.2z" fill="#CDB48D" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M2.5 18.5q1.9 2.8 3.8 0t3.8 0 3.8 0 3.8 0 3.8 0 3.9 0" fill="none" stroke={INK} strokeWidth="1" strokeOpacity=".5" />
    </>
  );
}

function Loaf({ f, fill, cap, id }) {
  const d = 'M3 30V19a7 7 0 0 1 7-7h8a7 7 0 0 1 7 7v11z';
  const w = 22 * f;
  return (
    <>
      <defs><clipPath id={id}><rect x="3" y="0" width={w} height="34" /></clipPath></defs>
      <path d={d} fill="none" stroke={INK} strokeOpacity=".35" strokeWidth="1.1" strokeDasharray="2 2" />
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={fill} stroke={INK} strokeWidth="1.3" />
        <path d="M5 28V20a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v8z" fill={cap} />
        {[7.5, 12, 16.5, 21].map((x) => <path key={x} d={`M${x} 15v15`} stroke={INK} strokeOpacity=".25" strokeWidth="1" />)}
      </g>
      {f > 0 && f < 1 && <path d={`M${3 + w} 13v17`} stroke={INK} strokeWidth="1.3" />}
    </>
  );
}

function Tray({ f, fill, cap }) {
  const s = f ? .55 + .45 * f : 0;
  return (
    <>
      {s > 0 && <g transform={`translate(14 21) scale(${s}) translate(-14 -21)`}>
        <path d="M4 22c0-6 5-9 10-9s10 2.5 10 8c0 4-4 5-10 5S4 26 4 22z" fill={fill} stroke={INK} strokeWidth="1.2" />
        <path d="M8 19c3-2 6 1 9-1M10 23c3-1.5 5 .5 8-1" fill="none" stroke={cap} strokeWidth="1.5" strokeLinecap="round" />
      </g>}
      <path d="M2 24.5h24l-2.2 5.6a1.8 1.8 0 0 1-1.7 1.2H5.9a1.8 1.8 0 0 1-1.7-1.2z" fill="#F1F1EE" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
    </>
  );
}

function Wedge({ f, fill, cap, id }) {
  return (
    <>
      <defs><clipPath id={id}><rect x={26 - 24 * f} y="0" width={24 * f + 1} height="34" /></clipPath></defs>
      <path d="M2 30h24V13z" fill="none" stroke={INK} strokeOpacity=".35" strokeDasharray="2 2" strokeWidth="1.1" />
      <g clipPath={`url(#${id})`}>
        <path d="M2 30h24V13z" fill={fill} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M2 30L26 13V9.5L2 26.5z" fill={shade(fill, .35)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <g fill={cap}><circle cx="19" cy="25" r="1.9" /><circle cx="23" cy="20.5" r="1.4" /><circle cx="13" cy="28" r="1.2" /></g>
      </g>
    </>
  );
}

function Stick({ f, fill, cap, id }) {
  return (
    <>
      <defs><clipPath id={id}><rect x="2" y="0" width={24 * f} height="34" /></clipPath></defs>
      <path d="M3 19l3-4h20l-3 4zM3 19h20v9H3zM23 19l3-4v9l-3 4z" fill={cap} stroke={INK} strokeOpacity=".35" strokeWidth="1" strokeDasharray="2 2" />
      <g clipPath={`url(#${id})`}>
        <path d="M3 19l3-4h20l-3 4z" fill={shade(fill, .35)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M3 19h20v9H3z" fill={fill} stroke={INK} strokeWidth="1.2" />
        <path d="M23 19l3-4v9l-3 4z" fill={shade(fill, -.12)} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      </g>
    </>
  );
}

function Piece({ x, y, p }) {
  if (p.leaf) return <g transform={`translate(${x} ${y})`}><path d="M0 4C-5 2-5-5 0-6 5-5 5 2 0 4z" fill={p.fill} stroke={INK} strokeWidth="1" /><path d="M0 4V-4" stroke={p.cap} strokeWidth="1.1" /></g>;
  if (p.long) return <g transform={`translate(${x} ${y}) rotate(-35)`}><ellipse rx="6" ry="2.4" fill={p.fill} stroke={INK} strokeWidth="1" /><path d="M5.6 0h1.8" stroke={p.cap} strokeWidth="1.6" strokeLinecap="round" /></g>;
  if (p.small) return <g transform={`translate(${x} ${y})`} fill={p.fill} stroke={INK} strokeWidth=".9"><circle cx="-2" cy="1" r="2" /><circle cx="2" cy="1" r="2" /><circle cx="0" cy="-2.2" r="2" /></g>;
  return <g transform={`translate(${x} ${y})`}><circle r="4.3" fill={p.fill} stroke={INK} strokeWidth="1.1" /><path d="M0-4.2c0-1.4.6-2.2 1.6-2.6" stroke={p.cap} strokeWidth="1.4" fill="none" strokeLinecap="round" /><circle cx="-1.5" cy="-1.3" r="1" fill="#fff" opacity=".45" /></g>;
}

function Produce({ f, p }) {
  const n = f >= 1 ? 4 : f >= .6 ? 3 : f > 0 ? 1 : 0;
  const at = [[14, 18], [8.5, 20], [19.5, 20], [14, 12.5]];
  const order = n === 1 ? [0] : n === 3 ? [1, 2, 0] : n === 4 ? [1, 2, 0, 3] : [];
  return (
    <>
      {order.map((i) => <Piece key={i} x={at[i][0]} y={at[i][1]} p={p} />)}
      <path d="M2.5 21.5h23l-2.3 8.4a2 2 0 0 1-1.9 1.5H6.7a2 2 0 0 1-1.9-1.5z" fill="#C9955A" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5 25h18M6 28.3h16" stroke={INK} strokeOpacity=".3" strokeWidth="1" />
    </>
  );
}

export default function PackageArt({ name, aisle, fill = 1, size = 30 }) {
  const id = useId().replace(/:/g, '');
  const p = packageFor(name, aisle);
  const f = Math.max(0, Math.min(1, fill));
  let art;
  if (p.shape === 'eggs') art = <Eggs f={f} fill={p.fill} />;
  else if (p.shape === 'loaf') art = <Loaf f={f} fill={p.fill} cap={p.cap} id={id} />;
  else if (p.shape === 'tray') art = <Tray f={f} fill={p.fill} cap={p.cap} />;
  else if (p.shape === 'wedge') art = <Wedge f={f} fill={p.fill} cap={p.cap} id={id} />;
  else if (p.shape === 'stick') art = <Stick f={f} fill={p.fill} cap={p.cap} id={id} />;
  else if (p.shape === 'produce') art = <Produce f={f} p={p} />;
  else art = <Container shape={p.shape} fill={p.fill} cap={p.cap} f={f} id={id} />;
  return <svg className="pkg-art" viewBox="0 0 28 34" width={size * 28 / 34} height={size} aria-hidden="true" data-shape={p.shape} data-fill={f}>{art}</svg>;
}
