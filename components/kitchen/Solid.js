'use client';
// Draws a solid 3D model (lib/kitchen/solids.js) in the CSS 3D kitchen: real boxes and cylinders with a top,
// four sides and face details, standing on the surface under it. Drawn R× bigger and shrunk back so it stays
// sharp when you zoom in (a 3D layer is painted at its own size). `rot` turns it around its own middle.
import { C, HU } from '@/lib/kitchen/models';

const R = 3;
const shade = (c, k) => `linear-gradient(rgba(${k < 0 ? '0,0,0' : '255,255,255'},${Math.abs(k)}),rgba(${k < 0 ? '0,0,0' : '255,255,255'},${Math.abs(k)})),${c}`;
const deco = (list = [], key) => list.map((d, i) => <i key={`${key}${i}`} style={{ position: 'absolute', left: `${d[0] * 100}%`, top: `${d[1] * 100}%`, width: `${d[2] * 100}%`, height: `${d[3] * 100}%`, ...css(d[4]) }} />);
function css(s) { const o = {}; String(s || '').split(';').forEach((kv) => { const i = kv.indexOf(':'); if (i < 0) return; const k = kv.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()); o[k] = kv.slice(i + 1).trim(); }); return o; }
const GRAIN = 'repeating-linear-gradient(90deg,rgba(90,55,20,.13) 0 2px,rgba(0,0,0,0) 2px 9px),';

function Box({ p, rot }) {
  const x = p.x * C * R, y = p.y * C * R, w = p.w * C * R, d = p.d * C * R, h = Math.max(1, p.h * HU * R), z = p.z * HU * R;
  const rad = Math.min((p.rad || 0) * R, h / 3, w / 3, d / 3), g = p.grain ? GRAIN : '';
  // light comes from the front-left of the room, so sides darken as the model turns away from it
  const lit = (a) => 0.18 * Math.cos(((a + rot) * Math.PI) / 180 + 0.6);
  const f = (k, st, kids) => <div className="ksf" style={{ ...st, background: `${g}${shade(p.c, k)}` }}>{kids}</div>;
  return <>
    {f(0.16, { left: x, top: y, width: w, height: d, transform: `translateZ(${z + h}px)`, borderRadius: rad }, deco(p.top, 't'))}
    {f(lit(0) - 0.04, { left: x, top: y + d - h, width: w, height: h, transformOrigin: '50% 100%', transform: `translateZ(${z}px) rotateX(-90deg)`, borderRadius: `${rad}px ${rad}px 2px 2px` }, deco(p.front, 'f'))}
    {f(lit(180) - 0.1, { left: x, top: y - h, width: w, height: h, transformOrigin: '50% 100%', transform: `translateZ(${z}px) rotateX(-90deg)`, borderRadius: `${rad}px ${rad}px 2px 2px` })}
    {f(lit(90) - 0.08, { left: x - h, top: y, width: h, height: d, transformOrigin: '100% 50%', transform: `translateZ(${z}px) rotateY(90deg)`, borderRadius: `${rad}px 2px 2px ${rad}px` })}
    {f(lit(-90) - 0.08, { left: x + w, top: y, width: h, height: d, transformOrigin: '0 50%', transform: `translateZ(${z}px) rotateY(-90deg)`, borderRadius: `2px ${rad}px ${rad}px 2px` })}
  </>;
}

const N = 16;
function Cyl({ p, rot }) {
  const cx = p.x * C * R, cy = p.y * C * R, r = p.r * C * R, h = Math.max(1, p.h * HU * R), z = p.z * HU * R;
  const s = 2 * r * Math.tan(Math.PI / N) + 1.5;
  return <>
    {Array.from({ length: N }, (_, i) => {
      const a = (i * 360) / N;   // 0 = facing you
      const k = 0.2 * Math.cos(((a + rot) * Math.PI) / 180 + 0.6) - 0.06 + (p.glass ? 0 : 0);
      return <div key={i} className="ksf" style={{ left: cx - s / 2, top: cy - h, width: s, height: h, transformOrigin: '50% 100%', transform: `translateZ(${z}px) rotateZ(${a}deg) translateY(${r}px) rotateX(-90deg)`, background: shade(p.c, k), opacity: p.glass ? 0.8 : 1 }} />;
    })}
    <div className="ksf" style={{ left: cx - r, top: cy - r, width: 2 * r, height: 2 * r, borderRadius: '50%', transform: `translateZ(${z + h}px)`, background: shade(p.c, 0.14), opacity: p.glass ? 0.7 : 1 }} />
  </>;
}

export default function Solid({ parts, w, d, rot = 0 }) {
  return (
    <div className="ksolid" style={{ width: w * C, height: d * C, transform: `rotateZ(${rot}deg)` }}>
      <div className="ksolid-in" style={{ width: w * C * R, height: d * C * R, transform: `scale3d(${1 / R}, ${1 / R}, ${1 / R})` }}>
        {parts.map((p, i) => (p.t === 'cyl' ? <Cyl key={i} p={p} rot={rot} /> : <Box key={i} p={p} rot={rot} />))}
      </div>
    </div>
  );
}
