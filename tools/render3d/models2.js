// Batch 2: cans, bottles, jars, cartons, eggs, dairy blocks. Real sizes in cm. Labels are painted on canvases.
import { INK, lin } from './models.js';
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
function label(T, fn, w = 1024, h = 512) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; }
const std = (T, o) => new T.MeshPhysicalMaterial(Object.assign({ roughness: .4, metalness: 0, clearcoat: .35, clearcoatRoughness: .3 }, o, o.color !== undefined ? { color: lin(T, o.color) } : {}));
const metal = (T) => new T.MeshStandardMaterial({ color: lin(T, 0xd9dee3), metalness: .55, roughness: .38 });
function add(T, G, geo, m, p, r, s) { const x = new T.Mesh(geo, m); x.castShadow = x.receiveShadow = true; if (p) x.position.set(...p); if (r) x.rotation.set(...r); if (s) x.scale.set(...s); G.add(x); return x; }
// the front of a wrapped label is at the middle of the canvas (u = .5)
const front = (m) => { m.rotation.y = Math.PI - .35; return m; };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const circ = (g, x, y, r, c, ink) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = c; g.fill(); if (ink) { g.strokeStyle = INK; g.lineWidth = ink; g.stroke(); } };

function can(T, o) {
  const G = new T.Group(); const { r, h } = o;
  const tex = label(T, (g, w, hh) => { g.fillStyle = o.paper; g.fillRect(0, 0, w, hh); g.fillStyle = o.band; g.fillRect(0, 0, w, hh * .13); g.fillRect(0, hh * .87, w, hh * .13);
    g.fillStyle = 'rgba(255,255,255,.92)'; rr(g, w * .27, hh * .2, w * .46, hh * .6, 40); g.fill(); g.strokeStyle = o.band; g.lineWidth = 8; g.stroke(); o.icon(g, w * .5, hh * .5, hh); });
  front(add(T, G, new T.CylinderGeometry(r, r, h, 72, 1, true), std(T, { map: tex, roughness: .5, clearcoat: .2 }), [0, 0, 0]));
  add(T, G, new T.CylinderGeometry(r * .985, r * .985, .3, 72), metal(T), [0, h / 2 - .1, 0]); add(T, G, new T.CylinderGeometry(r * .985, r * .985, .3, 72), metal(T), [0, -h / 2 + .1, 0]);
  add(T, G, new T.TorusGeometry(r * .985, .13, 10, 72), metal(T), [0, h / 2 + .05, 0], [Math.PI / 2, 0, 0]); add(T, G, new T.TorusGeometry(r * .985, .13, 10, 72), metal(T), [0, -h / 2 - .05, 0], [Math.PI / 2, 0, 0]);
  add(T, G, new T.TorusGeometry(r * .6, .06, 8, 40), metal(T), [0, h / 2 + .12, 0], [Math.PI / 2, 0, 0]); G.rotation.y = 0; return { g: G, dims: [r * 2, h, r * 2] };
}
function bottle(T, o) {
  const G = new T.Group(); const { r, h, nr, nh } = o; // body radius, total height, neck radius, neck height
  const pts = []; const sh = h - nh - (o.cap || 2); const bodyTop = -h / 2 + sh;
  pts.push([0.001, -h / 2]); pts.push([r * .7, -h / 2 + .05]); pts.push([r * .97, -h / 2 + r * .25]); pts.push([r, -h / 2 + r * .6]); pts.push([r, bodyTop - r * .7]);
  for (let i = 1; i <= 10; i++) { const t = i / 10, e = t * t * (3 - 2 * t); pts.push([r + (nr - r) * e, bodyTop - r * .7 + (r * .7 + r * .5) * t]); }
  pts.push([nr, h / 2 - (o.cap || 2) - .1]);
  const geo = new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), 72);
  const tex = label(T, (g, w, hh) => { g.fillStyle = o.glass; g.fillRect(0, 0, w, hh); o.label(g, w, hh); });
  const body = new T.Mesh(geo, std(T, { map: tex, roughness: .12, clearcoat: 1, clearcoatRoughness: .05 })); body.castShadow = body.receiveShadow = true; front(body); G.add(body);
  add(T, G, new T.CylinderGeometry(nr * 1.08, nr * 1.08, o.cap || 2, 40), std(T, { color: o.capColor, roughness: .35, clearcoat: .5 }), [0, h / 2 - (o.cap || 2) / 2, 0]);
  if (o.tip) add(T, G, new T.CylinderGeometry(nr * .5, nr * .8, 1.4, 20), std(T, { color: o.capColor }), [0, h / 2 + .5, 0]);
  return { g: G, dims: [r * 2, h, r * 2] };
}
function jar(T, o) {
  const G = new T.Group(); const { r, h } = o; const lid = o.lid || 1.9;
  const tex = label(T, (g, w, hh) => { g.fillStyle = o.fill; g.fillRect(0, 0, w, hh); const grd = g.createLinearGradient(0, 0, 0, hh); grd.addColorStop(0, 'rgba(255,255,255,.18)'); grd.addColorStop(1, 'rgba(0,0,0,.12)'); g.fillStyle = grd; g.fillRect(0, 0, w, hh);
    g.fillStyle = o.paper; rr(g, w * .22, hh * .22, w * .56, hh * .56, 28); g.fill(); g.strokeStyle = o.band; g.lineWidth = 10; g.stroke(); o.icon(g, w * .5, hh * .5, hh); });
  front(add(T, G, new T.CylinderGeometry(r, r * .97, h - lid, 72, 1, true), std(T, { map: tex, roughness: .12, clearcoat: 1, clearcoatRoughness: .06 }), [0, -lid / 2, 0]));
  add(T, G, new T.CylinderGeometry(r * .97, r * .97, .3, 72), std(T, { color: o.fill }), [0, -h / 2 + .15, 0]);
  add(T, G, new T.CylinderGeometry(r * 1.03, r * 1.03, lid, 72), std(T, { color: o.lidColor, roughness: .35, clearcoat: .5 }), [0, h / 2 - lid / 2, 0]);
  for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; add(T, G, new T.BoxGeometry(.12, lid * .8, .12), std(T, { color: o.lidColor, roughness: .45 }), [Math.cos(a) * r * 1.035, h / 2 - lid / 2, Math.sin(a) * r * 1.035]); }
  return { g: G, dims: [r * 2, h, r * 2] };
}
function carton(T, o) {
  const G = new T.Group(); const w = o.w, d = o.w, h = o.h, g0 = o.gable || w * .55;
  const tex = (front) => label(T, (g, W, H) => { g.fillStyle = o.paper; g.fillRect(0, 0, W, H); g.fillStyle = o.band; g.fillRect(0, H * .52, W, H * .2); if (front) o.icon(g, W * .5, H * .3, H); }, 512, 1024);
  const side = std(T, { map: tex(false), roughness: .55, clearcoat: .2 }), fr = std(T, { map: tex(true), roughness: .55, clearcoat: .2 });
  const box = add(T, G, new T.BoxGeometry(w, h, d), [side, side, side, side, fr, side].map((m) => m)); // +x,-x,+y,-y,+z,-z
  box.material = [side, side, side, side, fr, side]; box.position.y = 0;
  // gable roof: two slanted panels and two triangular ends
  const roof = std(T, { color: o.paper, roughness: .55, clearcoat: .2 }), rf = o.roofColor ? std(T, { color: o.roofColor, roughness: .55 }) : roof;
  const sl = Math.hypot(w / 2, g0); const ang = Math.atan2(g0, w / 2);
  add(T, G, new T.BoxGeometry(sl, .12, d), roof, [-w / 4, h / 2 + g0 / 2, 0], [0, 0, ang]); add(T, G, new T.BoxGeometry(sl, .12, d), roof, [w / 4, h / 2 + g0 / 2, 0], [0, 0, -ang]);
  const tri = new T.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, g0); tri.lineTo(-w / 2, 0);
  for (const z of [d / 2, -d / 2]) add(T, G, new T.ShapeGeometry(tri), std(T, { color: o.paper, side: T.DoubleSide, roughness: .55 }), [0, h / 2, z]);
  add(T, G, new T.BoxGeometry(.22, .45, d * 1.04), roof, [0, h / 2 + g0 + .15, 0]);
  if (o.cap) add(T, G, new T.CylinderGeometry(1.1, 1.2, .8, 24), std(T, { color: o.cap, roughness: .35 }), [w * .17, h / 2 + g0 * .6, d * .05], [0, 0, -ang]);
  G.rotation.y = -.35; return { g: G, dims: [w, h + g0, d] };
}
const bandIcon = (c) => (g, x, y, H) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, H * .1, 0, 7); g.fill(); };
const tomatoIcon = (g, x, y, H) => { circ(g, x, y, H * .17, '#d9362b', 6); g.fillStyle = '#4a9a2e'; g.beginPath(); g.moveTo(x - 24, y - H * .15); g.lineTo(x, y - H * .22); g.lineTo(x + 24, y - H * .15); g.fill(); };
const beanIcon = (c) => (g, x, y, H) => { for (const [dx, dy] of [[-40, -16], [30, -24], [-12, 22], [44, 18]]) { g.save(); g.translate(x + dx, y + dy); g.rotate(dx / 60); g.beginPath(); g.ellipse(0, 0, 34, 20, 0, 0, 7); g.fillStyle = c; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.restore(); } };
const dropIcon = (c) => (g, x, y, H) => { g.fillStyle = c; g.beginPath(); g.moveTo(x, y - H * .16); g.bezierCurveTo(x + H * .2, y + H * .02, x + H * .12, y + H * .18, x, y + H * .18); g.bezierCurveTo(x - H * .12, y + H * .18, x - H * .2, y + H * .02, x, y - H * .16); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); };
const stripe = (bg, fg, txt) => (g, w, h) => { g.fillStyle = fg; rr(g, w * .3, h * .25, w * .4, h * .5, 26); g.fill(); g.fillStyle = bg; g.fillRect(w * .3, h * .46, w * .4, h * .1); if (txt) { g.fillStyle = bg; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.fillText(txt, w * .5, h * .4); } };

export const MODELS2 = {
  can_tomato: (T) => can(T, { r: 3.65, h: 10.8, paper: '#c8281f', band: '#f2c14e', icon: tomatoIcon }),
  can_beans: (T) => can(T, { r: 3.65, h: 10.8, paper: '#7a4a2a', band: '#e0a93b', icon: beanIcon('#c9864a') }),
  can_black: (T) => can(T, { r: 3.65, h: 10.8, paper: '#3a3636', band: '#c9cdd2', icon: beanIcon('#1f1c1c') }),
  can_chickpea: (T) => can(T, { r: 3.65, h: 10.8, paper: '#d9a84a', band: '#7a4a2a', icon: beanIcon('#f0d58f') }),
  can_coconut: (T) => can(T, { r: 3.65, h: 11, paper: '#f0ede4', band: '#2f7a4a', icon: (g, x, y, H) => { circ(g, x, y, H * .17, '#7a5230', 6); circ(g, x - 22, y - 14, 10, '#3b2c24'); circ(g, x + 14, y - 22, 10, '#3b2c24'); circ(g, x + 6, y - 2, 10, '#3b2c24'); } }),
  oil: (T) => bottle(T, { r: 4.6, h: 28, nr: 1.5, nh: 6, cap: 2, glass: '#e8c440', capColor: 0x3f7f25, capColor2: 0, tip: false, label: (g, w, h) => { g.fillStyle = '#f6efd2'; rr(g, w * .3, h * .3, w * .4, h * .42, 24); g.fill(); g.strokeStyle = '#3f7f25'; g.lineWidth = 8; g.stroke(); dropIcon('#9cbf4e')(g, w * .5, h * .52, h); } }),
  soy: (T) => bottle(T, { r: 3.4, h: 17, nr: 1.2, nh: 3.6, cap: 1.6, glass: '#2a170f', capColor: 0xd9452b, label: (g, w, h) => { g.fillStyle = '#e8dcc0'; rr(g, w * .3, h * .3, w * .4, h * .4, 22); g.fill(); g.strokeStyle = '#d9452b'; g.lineWidth = 8; g.stroke(); circ(g, w * .5, h * .5, h * .07, '#d9452b'); } }),
  fishsauce: (T) => bottle(T, { r: 3.5, h: 23, nr: 1.3, nh: 5, cap: 1.8, glass: '#c9762e', capColor: 0xd9452b, label: (g, w, h) => { g.fillStyle = '#f6e3b4'; rr(g, w * .3, h * .3, w * .4, h * .4, 22); g.fill(); g.strokeStyle = '#9c4a1a'; g.lineWidth = 8; g.stroke(); } }),
  vinegar: (T) => bottle(T, { r: 4.2, h: 24, nr: 1.5, nh: 5.5, cap: 2, glass: '#f4ecd0', capColor: 0x2f6db5, label: (g, w, h) => { g.fillStyle = '#ffffff'; rr(g, w * .3, h * .32, w * .4, h * .38, 22); g.fill(); g.strokeStyle = '#2f6db5'; g.lineWidth = 8; g.stroke(); dropIcon('#2f6db5')(g, w * .5, h * .5, h * .8); } }),
  hotsauce: (T) => bottle(T, { r: 2.6, h: 17, nr: 1.1, nh: 4, cap: 1.5, glass: '#d9452b', capColor: 0x3f7f25, tip: true, label: (g, w, h) => { g.fillStyle = '#f6e3b4'; rr(g, w * .3, h * .38, w * .4, h * .34, 18); g.fill(); g.strokeStyle = '#7a1e12'; g.lineWidth = 7; g.stroke(); } }),
  ketchup: (T) => bottle(T, { r: 4.3, h: 20, nr: 1.9, nh: 4.5, cap: 2.4, glass: '#d2301f', capColor: 0xffffff, label: (g, w, h) => { g.fillStyle = '#ffffff'; rr(g, w * .3, h * .34, w * .4, h * .34, 22); g.fill(); g.strokeStyle = '#a81f14'; g.lineWidth = 8; g.stroke(); circ(g, w * .5, h * .51, h * .07, '#d2301f', 5); } }),
  wine: (T) => bottle(T, { r: 3.75, h: 31, nr: 1.5, nh: 9.5, cap: 3.4, glass: '#2c1b22', capColor: 0x8a1530, label: (g, w, h) => { g.fillStyle = '#efe3c4'; rr(g, w * .28, h * .42, w * .44, h * .32, 14); g.fill(); g.strokeStyle = '#8a1530'; g.lineWidth = 6; g.stroke(); } }),
  honey: (T) => jar(T, { r: 3.6, h: 12.5, fill: '#e6a319', paper: '#fff4d2', band: '#9c5c06', lidColor: 0x4a2f1a, lid: 2.2, icon: (g, x, y, H) => { g.fillStyle = '#e6a319'; for (let i = 0; i < 3; i++) { const cx = x + (i - 1) * 40; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + .5; g.lineTo(cx + Math.cos(a) * 22, y + Math.sin(a) * 22); } g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; g.stroke(); } } }),
  salsa: (T) => jar(T, { r: 4, h: 13.5, fill: '#c63a1a', paper: '#fff0d4', band: '#c63a1a', lidColor: 0xd9452b, lid: 2, icon: tomatoIcon }),
  peanut_butter: (T) => jar(T, { r: 4.9, h: 12, fill: '#b87a3e', paper: '#f6e3b4', band: '#8a4a1a', lidColor: 0xc8352f, lid: 2.4, icon: (g, x, y, H) => { for (const dx of [-20, 20]) { g.beginPath(); g.ellipse(x + dx, y, 22, 32, 0, 0, 7); g.fillStyle = '#d9a35c'; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); } } }),
  milk: (T) => carton(T, { w: 9.5, h: 17, gable: 6, paper: '#ffffff', band: '#5aa9e6', cap: '#5aa9e6', icon: (g, x, y, H) => { dropIcon('#5aa9e6')(g, x, y + H * .02, H * .9); } }),
  cream: (T) => carton(T, { w: 7, h: 11.5, gable: 4.6, paper: '#fff6e4', band: '#f2c14e', cap: '#f2c14e', icon: bandIcon('#f2c14e') }),
  juice: (T) => carton(T, { w: 9.5, h: 17, gable: 6, paper: '#fbfaf5', band: '#f28c28', cap: '#f28c28', icon: (g, x, y, H) => { circ(g, x, y, H * .12, '#f28c28', 6); g.fillStyle = '#4a9a2e'; g.beginPath(); g.ellipse(x + 20, y - H * .13, 26, 12, -.5, 0, 7); g.fill(); } }),
  egg: (T) => {
    const G = new T.Group(); const mk = (c, x, z, ry, rz) => { const geo = new T.SphereGeometry(1, 64, 64); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - .12 * y; p.setXYZ(i, p.getX(i) * 2.2 * k, y * 2.85, p.getZ(i) * 2.2 * k); } geo.computeVertexNormals();
      const m = add(T, G, geo, std(T, { color: c, roughness: .45, clearcoat: .25 }), [x, 0, z], [rz, ry, 0]); return m; };
    mk(0xf8efe0, -2.1, .3, .3, .1); mk(0xd9a56c, 2.4, -.2, -.5, -.08); G.rotation.y = -.3; return { g: G, dims: [9, 5.7, 5] };
  },
  butter: (T) => {
    const G = new T.Group(); const wrapTex = label(T, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#5aa9e6'; g.fillRect(0, h * .35, w, h * .3); g.fillStyle = '#fff'; g.font = 'bold 120px Arial'; g.textAlign = 'center'; g.fillText('BUTTER', w * .5, h * .58); });
    add(T, G, new T.BoxGeometry(8.5, 3.2, 3.2), std(T, { map: wrapTex, roughness: .55, clearcoat: .1 }), [-1.5, 0, 0]);
    add(T, G, new T.BoxGeometry(3.4, 3.2, 3.2), std(T, { color: 0xffe07a, roughness: .35, clearcoat: .4 }), [4.6, 0, 0]); G.rotation.y = -.5; return { g: G, dims: [12, 3.2, 3.2] };
  },
  yogurt: (T) => {
    const G = new T.Group(); const tex = label(T, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#b5dcf2'; g.fillRect(0, h * .3, w, h * .4); circ(g, w * .5, h * .5, h * .12, '#ffffff', 6); });
    front(add(T, G, new T.CylinderGeometry(5.1, 4, 9.5, 72, 1, true), std(T, { map: tex, roughness: .4, clearcoat: .2 }), [0, 0, 0]));
    add(T, G, new T.CylinderGeometry(4, 4, .3, 60), std(T, { color: 0xffffff }), [0, -4.7, 0]); add(T, G, new T.CylinderGeometry(5.2, 5.2, .5, 72), metal(T), [0, 4.8, 0]); add(T, G, new T.TorusGeometry(5.1, .25, 10, 72), std(T, { color: 0xffffff }), [0, 4.6, 0], [Math.PI / 2, 0, 0]); return { g: G, dims: [10.2, 9.5, 10.2] };
  },
  cheddar: (T) => {
    const G = new T.Group(); const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(13, 0); sh.lineTo(13, 3.6); sh.lineTo(0, 5.8); sh.lineTo(0, 0);
    const geo = new T.ExtrudeGeometry(sh, { depth: 7, bevelEnabled: true, bevelSize: .15, bevelThickness: .15, bevelSegments: 3 }); geo.translate(-6.5, -2.9, -3.5);
    const tex = label(T, (g, w, h) => { g.fillStyle = '#f2a73a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,214,120,.35)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 16, 0, 7); g.fill(); } });
    add(T, G, geo, std(T, { color: 0xf4a73b, roughness: .5, clearcoat: .15 })); for (const [x, y, z] of [[3, 0, 3.55], [-3, 1, 3.55], [1, -1.2, 3.55]]) add(T, G, new T.CylinderGeometry(.5, .5, .1, 14), std(T, { color: 0xc98320 }), [x, y, z], [Math.PI / 2, 0, 0]);
    G.rotation.y = -.5; return { g: G, dims: [13, 5.8, 7] };
  },
  mozzarella: (T) => { const G = new T.Group(); add(T, G, new T.SphereGeometry(4.5, 64, 64), std(T, { color: 0xfdfcf6, roughness: .4, clearcoat: .55, clearcoatRoughness: .2 })); return { g: G, dims: [9, 9, 9] }; },
  tofu: (T) => { const G = new T.Group(); add(T, G, new T.BoxGeometry(9.5, 3.8, 6), std(T, { color: 0xfffaea, roughness: .55, clearcoat: .1 })); const m = G.children[0]; m.geometry = new T.BoxGeometry(9.5, 3.8, 6, 1, 1, 1); G.rotation.y = -.45; return { g: G, dims: [9.5, 3.8, 6] }; }
};
