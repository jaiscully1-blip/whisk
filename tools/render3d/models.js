// Real-size 3D models of groceries (units: cm), built from code. tools/render3d/render.cjs turns each into a sprite for the game.
// Style: physical shading and a glossy material, clean saturated colour, thin dark outline, soft shadow.
const INK = '#3B2C24';
function hash(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vn(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi; const u = (t) => t * t * (3 - 2 * t); let r = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const w = (i ? u(xf) : 1 - u(xf)) * (j ? u(yf) : 1 - u(yf)) * (k ? u(zf) : 1 - u(zf)); r += w * hash(xi + i, yi + j, zi + k); } return r; }
function fbm(x, y, z, o = 3) { let a = .5, f = 1, s = 0; for (let i = 0; i < o; i++) { s += a * vn(x * f, y * f, z * f); f *= 2; a *= .5; } return s; }
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

// colour(u, v, cx, cz) → [r,g,b]; u around 0..1, v along 0..1
function skin(T, colorFn, w = 1024, h = 512) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); const im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, v = y / h, a = u * Math.PI * 2; const [r, gg, b] = colorFn(u, v, Math.cos(a), Math.sin(a)); const k = (y * w + x) * 4;
    im.data[k] = clamp(r, 0, 255); im.data[k + 1] = clamp(gg, 0, 255); im.data[k + 2] = clamp(b, 0, 255); im.data[k + 3] = 255;
  }
  g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; t.wrapS = T.RepeatWrapping; return t;
}
function noiseBump(T, fx = .015, fy = .03) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(512, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 512; x++) { const t = Math.floor(fbm(x * fx * 2, y * fy * 2, 1.7, 3) * 255); const k = (y * 512 + x) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = t; im.data[k + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; return t;
}
function mat(T, map, o = {}) {
  return new T.MeshPhysicalMaterial({ map, bumpMap: o.bump ? noiseBump(T, o.bumpF || .015, o.bumpF2 || .03) : null, bumpScale: o.bumpScale ?? .05, roughness: o.rough ?? .4, metalness: 0, clearcoat: o.coat ?? .4, clearcoatRoughness: o.coatRough ?? .3, color: o.color || 0xffffff, side: o.side || T.FrontSide });
}
const plain = (T, c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: o.rough ?? .7, side: o.side || T.FrontSide });

// A body of revolution: f(yn, th) = radius factor (0..1.x), cav(phi, th) pulls the poles in/out. yn = cos(phi): +1 top … -1 bottom.
function solid(T, o) {
  const g = new T.SphereGeometry(1, 160, 160); const p = g.attributes.position; const v = new T.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const phi = Math.acos(clamp(v.y, -1, 1)), th = Math.atan2(v.z, v.x), yn = Math.cos(phi), s = Math.sin(phi);
    let r = s * (o.f ? o.f(yn, th, phi) : 1); let y = yn;
    if (o.cav) { const c = o.cav(phi, th); y += c[0]; r *= c[1]; }
    const lump = 1 + (o.lump || 0) * (fbm(v.x * 1.7 + 3, v.y * 1.7, v.z * 1.7, 3) - .5) * 2;
    r *= lump * (o.lobes ? 1 + o.lobes[0] * Math.cos(o.lobes[1] * th) * Math.pow(s, 1.2) : 1);
    p.setXYZ(i, Math.cos(th) * r * o.W / 2, y * o.H / 2, Math.sin(th) * r * (o.D || o.W) / 2);
  }
  g.computeVertexNormals(); return g;
}
// A tube along a curve with changing radius: rad(t, th) in cm, t 0..1 along. Ends close as rad → 0.
function tube(T, pts, rad, seg = 120, around = 48) {
  const curve = new T.CatmullRomCurve3(pts.map((q) => new T.Vector3(...q))); const fr = curve.computeFrenetFrames(seg, false);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) { const t = i / seg, c = curve.getPointAt(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= around; j++) { const th = j / around * Math.PI * 2, r = rad(t, th); pos.push(c.x + (N.x * Math.cos(th) + B.x * Math.sin(th)) * r, c.y + (N.y * Math.cos(th) + B.y * Math.sin(th)) * r, c.z + (N.z * Math.cos(th) + B.z * Math.sin(th)) * r); uv.push(j / around, 1 - t); } }
  for (let i = 0; i < seg; i++) for (let j = 0; j < around; j++) { const a = i * (around + 1) + j, b = a + around + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const cap = (t, e = .08) => Math.sqrt(clamp(Math.min(t, 1 - t) / e)) ;   // 0 at the ends, 1 after e

function add(T, grp, geo, material, opt = {}) {
  const m = new T.Mesh(geo, material); m.castShadow = true; m.receiveShadow = true; if (opt.pos) m.position.set(...opt.pos); if (opt.rot) m.rotation.set(...opt.rot); if (opt.scale) m.scale.set(...opt.scale); grp.add(m); return m;
}
function cone(T, r, h, material, pos, rot) { const g = new T.ConeGeometry(r, h, 16); return { g, m: material, pos, rot }; }

// ---------- the models ----------
const reds = (T) => ({});
export const MODELS = {
  apple(T) {
    const G = new T.Group(); const W = 7.5, H = 7;
    const geo = solid(T, { W, H, f: (yn) => 1 + .13 * yn - .02 * Math.cos(2 * Math.acos(yn)), cav: (phi) => [-.34 * Math.exp(-Math.pow(phi / .42, 2)) + .16 * Math.exp(-Math.pow((Math.PI - phi) / .36, 2)), phi < .55 ? 1 - .12 * Math.exp(-Math.pow(phi / .25, 2)) : 1], lobes: [.028, 5], lump: .012 });
    const map = skin(T, (u, v, cx, cz) => { const st = fbm(cx * 3 + 1, cz * 3 + 2, v * .8, 3), st2 = fbm(cx * 7 + 9, cz * 7 + 4, v, 2), side = fbm(cx * 1.1 + 5, cz * 1.1 + 7, v * .9, 3);
      let red = clamp((side + .05) * 3.6 + (st - .5) * .9 + (st2 - .5) * .3 - Math.abs(v - .45) * .25); red = red * red * (3 - 2 * red); const streak = clamp((st2 - .45) * 1.6);
      const base = [206 + 20 * st2, 176, 64], tone = mix3([184, 30, 30], [122, 12, 20], streak); const c = mix3(base, tone, red); const cav = Math.max(0, .1 - v) * 7 + Math.max(0, v - .93) * 9; return [c[0] - cav * 30, c[1] + cav * 8, c[2] - cav * 10]; });
    add(T, G, geo, mat(T, map, { bump: true, bumpScale: .05, rough: .38, coat: .45, coatRough: .3 }));
    const stem = new T.CatmullRomCurve3([new T.Vector3(0, H / 2 - .62, 0), new T.Vector3(.04, H / 2 - .2, .02), new T.Vector3(.13, H / 2 + .32, -.02), new T.Vector3(.3, H / 2 + .62, -.06)]);
    add(T, G, new T.TubeGeometry(stem, 24, .055 * 2, 10, false), plain(T, 0x4a2f1a, { rough: .85 }));
    G.add(leaf(T, [.12, H / 2 + .28, -.02], .95)); G.rotation.y = -.7; return { g: G, dims: [7.5, 7, 7.5] };
  },
  tomato(T) {
    const G = new T.Group(); const geo = solid(T, { W: 7, H: 6, f: (yn) => 1 + .03 * yn, cav: (phi) => [-.12 * Math.exp(-Math.pow(phi / .5, 2)) + .04 * Math.exp(-Math.pow((Math.PI - phi) / .4, 2)), 1], lobes: [.035, 6], lump: .01 });
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 3 + 1, cz * 3, v * 2, 3); const c = mix3([205, 30, 24], [236, 66, 38], clamp(n * 1.4 - .15)); const sh = Math.max(0, .12 - v) * 8; return [c[0] - sh * 30, c[1] + sh * 30, c[2] - sh * 5]; });
    add(T, G, geo, mat(T, map, { rough: .3, coat: .6, coatRough: .18, bump: true, bumpScale: .03 }));
    const gm = plain(T, 0x3f8a2c, { rough: .6, side: T.DoubleSide });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const sg = new T.ConeGeometry(.55, 2.1, 12); const s = add(T, G, sg, gm, { pos: [Math.cos(a) * .95, 3.05, Math.sin(a) * .95], rot: [Math.sin(a) * 1.35, 0, -Math.cos(a) * 1.35] }); s.scale.set(1, 1, .35); }
    add(T, G, new T.CylinderGeometry(.14, .2, .9, 10), plain(T, 0x4f7a2a), { pos: [0, 3.35, 0], rot: [.15, 0, .1] }); G.rotation.y = -.5; return { g: G, dims: [7, 6, 7] };
  },
  lemon(T) { return citrus(T, { W: 5.2, H: 7.4, nip: .5, c1: [250, 222, 40], c2: [240, 196, 20], dims: [5.2, 7.4, 5.2], tilt: .25 }); },
  lime(T) { return citrus(T, { W: 5.4, H: 5.6, nip: .2, c1: [120, 178, 40], c2: [76, 140, 28], dims: [5.4, 5.6, 5.4], tilt: .15 }); },
  onion(T) { return bulb(T, { c1: [226, 168, 84], c2: [176, 112, 44], dims: [7.5, 8.5, 7.5] }); },
  red_onion(T) { return bulb(T, { c1: [196, 70, 120], c2: [112, 28, 76], dims: [7.5, 8, 7.5] }); },
  garlic(T) {
    const G = new T.Group(); const geo = solid(T, { W: 5.6, H: 5.2, f: (yn) => (yn > .35 ? Math.max(.12, 1 - Math.pow((yn - .35) / .65, 1.6) * .9) : 1 - .08 * (-yn)), cav: (phi) => [.1 * Math.exp(-Math.pow((Math.PI - phi) / .4, 2)), 1], lobes: [.07, 6] });
    const map = skin(T, (u, v, cx, cz) => { const l = Math.pow(Math.abs(Math.sin(u * Math.PI * 12)), .3); const n = fbm(cx * 4, cz * 4, v * 3, 3); const c = mix3([238, 232, 222], [214, 188, 196], clamp(l * .5 + n * .6 - .2)); const p = clamp((1 - v) * 1.2 * (n - .3) * 2); return mix3(c, [150, 90, 130], p * .45); });
    add(T, G, geo, mat(T, map, { rough: .5, coat: .15 }));
    add(T, G, new T.CylinderGeometry(.08, .12, .9, 8), plain(T, 0xcfc2a0), { pos: [0, 2.9, 0] });
    add(T, G, new T.CylinderGeometry(.9, .6, .25, 14), plain(T, 0xb89c74), { pos: [0, -2.55, 0] }); G.rotation.y = .3; return { g: G, dims: [5.6, 5.2, 5.6] };
  },
  potato(T) {
    const G = new T.Group(); const geo = solid(T, { W: 9, H: 6, D: 6.4, f: (yn) => 1 - .06 * yn * yn, lump: .07 });
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 5, cz * 5, v * 5, 4); const c = mix3([196, 152, 98], [162, 118, 70], clamp(n * 1.6 - .3)); const e = hash(Math.floor(u * 40), Math.floor(v * 24), 2); if (e > .965) return [92, 62, 38]; return c; });
    add(T, G, geo, mat(T, map, { rough: .72, coat: 0, bump: true, bumpScale: .12 })); G.rotation.set(0, -.4, .05); G.rotation.z = Math.PI / 2 * 0; return { g: G, dims: [9, 6, 6.4] };
  },
  sweet_potato(T) {
    const G = new T.Group(); const pts = [[-7.5, -.6, 0], [-3.5, -.2, .2], [2, .3, -.1], [7.5, .9, 0]];
    const rad = (t) => { const b = 2.5 * Math.pow(Math.sin(Math.PI * clamp(t * .96 + .02)), .45) * (1 - .35 * t); return b * (1 + .06 * Math.sin(t * 22)); };
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 3, cz * 3, v * 6, 4); const c = mix3([180, 96, 66], [138, 62, 56], clamp(n * 1.8 - .4)); return c; });
    add(T, G, tube(T, pts, (t, th) => Math.max(.01, rad(t) * (1 + .05 * fbm(Math.cos(th) * 2, Math.sin(th) * 2, t * 6, 2)))), mat(T, map, { rough: .62, coat: .12, bump: true, bumpScale: .1 })); G.rotation.set(.1, -.3, 0); return { g: G, dims: [15, 5, 5] };
  },
  avocado(T) {
    const G = new T.Group(); const geo = solid(T, { W: 7, H: 11, f: (yn) => 1 - .4 * (() => { const x = clamp((yn + .2) / 1.2); return x * x * (3 - 2 * x); })(), lump: .02, cav: (phi) => [-.08 * Math.exp(-Math.pow(phi / .35, 2)), 1] });
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 8, cz * 8, v * 8, 4); const c = mix3([52, 70, 38], [30, 44, 28], clamp(n * 2 - .5)); const b = fbm(cx * 3, cz * 3, v * 3, 2); return mix3(c, [74, 92, 46], clamp(b - .4) * 1.2); });
    add(T, G, geo, mat(T, map, { rough: .62, coat: .2, bump: true, bumpScale: .45, bumpF: .05, bumpF2: .1 }));
    add(T, G, new T.CylinderGeometry(.14, .2, .8, 8), plain(T, 0x5a4a28), { pos: [0, 5.6, 0] }); G.rotation.set(0, -.5, 0); return { g: G, dims: [7, 11, 7] };
  },
  banana(T) {
    const G = new T.Group(); const pts = []; for (let i = 0; i <= 12; i++) { const a = -.95 + i / 12 * 1.9; pts.push([Math.sin(a) * 9, (Math.cos(a) - 1) * 9 + 0, 0]); }
    const rad = (t, th) => { const body = 1.75 * Math.pow(Math.sin(Math.PI * clamp(t * .92 + .04)), .55); const ridges = 1 + .07 * Math.cos(5 * th); const stalk = t < .06 ? .55 + (t / .06) * .5 : 1; return Math.max(.02, (t < .05 ? .55 : t > .96 ? .4 : body * ridges)) * (t < .05 ? 1 : 1); };
    const map = skin(T, (u, v) => { let c = mix3([252, 214, 52], [236, 184, 30], clamp(Math.abs(Math.sin(u * Math.PI * 10)) * .6)); if (v < .06) c = mix3(c, [98, 120, 48], 1 - v / .06); if (v > .95) c = [64, 40, 24]; const sp = hash(Math.floor(u * 90), Math.floor(v * 60), 7); if (sp > .985) c = mix3(c, [120, 80, 30], .8); return c; });
    add(T, G, tube(T, pts, rad, 140, 40), mat(T, map, { rough: .45, coat: .25 })); G.rotation.set(0, .4, 0); return { g: G, dims: [18, 4, 3.8] };
  },
  carrot(T) {
    const G = new T.Group(); const pts = [[0, -8.5, 0], [.3, 0, 0], [0, 8.5, 0]];
    const map = skin(T, (u, v) => { const n = fbm(u * 30, v * 6, 1, 3); const ring = Math.pow(Math.abs(Math.sin(v * 70 + hash(Math.floor(u * 8), 0, 0) * 6)), 8) * .25; const c = mix3([238, 124, 28], [214, 92, 18], clamp(n * 1.5 - .2)); return mix3(c, [150, 70, 20], ring); });
    add(T, G, tube(T, pts, (t) => (t < .02 ? .05 : .25 + 1.35 * Math.pow(t, .8)) * (t > .985 ? .7 : 1), 80, 32), mat(T, map, { rough: .55, coat: .12 }));
    const gm = plain(T, 0x3f8f2e, { rough: .6 }); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; add(T, G, new T.CylinderGeometry(.03, .12, 3.4, 6), gm, { pos: [Math.cos(a) * .5, 9.9, Math.sin(a) * .5], rot: [Math.sin(a) * .4, 0, -Math.cos(a) * .4] }); }
    G.rotation.set(0, -.3, 1.15); return { g: G, dims: [20, 3, 3] };
  },
  cucumber(T) { return longVeg(T, { len: 20, r: 2.1, c1: [30, 94, 36], c2: [14, 60, 24], stripe: [150, 190, 90], dims: [20, 4.2, 4.2], ends: .1 }); },
  zucchini(T) { return longVeg(T, { len: 20, r: 2.4, c1: [46, 110, 46], c2: [20, 70, 30], stripe: [150, 190, 100], dims: [20, 4.8, 4.8], ends: .06, stem: true }); },
  eggplant(T) {
    const G = new T.Group(); const geo = solid(T, { W: 8, H: 17, f: (yn) => { const t = (yn + 1) / 2; return t > .8 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - .8) / .2, 2))) * .74 : .55 + .45 * Math.sin(Math.PI * clamp(t / .8 * .85 + .1)); }, lump: .01 });
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 3, cz * 3, v * 3, 3); return mix3([62, 24, 82], [34, 12, 52], clamp(n * 1.6 - .2)); });
    add(T, G, geo, mat(T, map, { rough: .26, coat: .85, coatRough: .12 }));
    const gm = plain(T, 0x4d8a34, { side: T.DoubleSide }); add(T, G, new T.ConeGeometry(2.2, 1.6, 7, 1, true), gm, { pos: [0, 6.7, 0], rot: [Math.PI, 0, 0] }); add(T, G, new T.CylinderGeometry(.35, .5, 2.2, 8), gm, { pos: [0, 8.4, 0], rot: [0, 0, .15] });
    G.rotation.set(0, -.4, .25); return { g: G, dims: [8, 17, 8] };
  },
  pepper(T) { return bell(T, { c1: [224, 28, 28], c2: [150, 12, 22] }); },
  green_pepper(T) { return bell(T, { c1: [64, 152, 40], c2: [30, 98, 28] }); },
  chili(T) {
    const G = new T.Group(); const pts = [[-5, 0, 0], [-2, .3, 0], [1.8, -.8, 0], [4.8, -2.6, 0], [6.8, -5.4, 0]];
    const map = skin(T, (u, v) => { const n = fbm(u * 6, v * 8, 2, 3); return mix3([220, 24, 24], [160, 10, 18], clamp(n * 1.5 - .25)); });
    add(T, G, tube(T, pts, (t) => (t < .03 ? .1 : t > .985 ? .05 : .95 * Math.pow(1 - t, .6) * Math.min(1, t * 14 + .25) + .04), 90, 28), mat(T, map, { rough: .25, coat: .85, coatRough: .12 }));
    const gm = plain(T, 0x3f8a2c); add(T, G, new T.CylinderGeometry(.18, .26, 1.9, 8), gm, { pos: [-5.3, .4, 0], rot: [0, 0, 1.2] }); add(T, G, new T.SphereGeometry(.85, 16, 12), gm, { pos: [-4.5, .1, 0], scale: [.6, .75, .9] }); G.rotation.set(0, -.2, .15); return { g: G, dims: [13, 2, 2] };
  },
  broccoli(T) {
    const G = new T.Group(); const sm = plain(T, 0x7fb04f, { rough: .65 }); add(T, G, new T.CylinderGeometry(1.1, 1.6, 6, 14), sm, { pos: [0, -2.4, 0] });
    for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + .5; add(T, G, new T.CylinderGeometry(.35, .6, 3.2, 8), sm, { pos: [Math.cos(a) * 1.3, 1.1, Math.sin(a) * 1.3], rot: [Math.sin(a) * .55, 0, -Math.cos(a) * .55] }); }
    const fm = (k) => new T.MeshStandardMaterial({ color: new T.Color().setHSL(.33, .5, .12 + k * .05), roughness: .72 });
    for (let i = 0; i < 80; i++) { const a = hash(i, 1, 3) * 6.28, e = Math.acos(1 - hash(i, 2, 3) * .85), R = 3.6; const r = .55 + hash(i, 4, 3) * .5; add(T, G, new T.SphereGeometry(r, 12, 10), fm(hash(i, 5, 3)), { pos: [Math.sin(e) * Math.cos(a) * R * 1.2, 2.6 + Math.cos(e) * R * .8, Math.sin(e) * Math.sin(a) * R * 1.2] }); }
    G.rotation.y = .6; return { g: G, dims: [10, 11, 10] };
  },
  mushroom(T) {
    const G = new T.Group(); const cap = solid(T, { W: 6.4, H: 4.4, f: (yn) => (yn < 0 ? .94 + .06 * yn : 1), cav: (phi) => [phi > 2.2 ? -.65 * (1 - Math.cos((phi - 2.2) / (Math.PI - 2.2) * Math.PI / 2)) * 0 : 0, 1], lump: .015 }); const cp = cap.attributes.position;
    for (let i = 0; i < cp.count; i++) if (cp.getY(i) < 0) cp.setY(i, cp.getY(i) * .25); cap.computeVertexNormals();
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 3, cz * 3, v * 3, 3); return mix3([238, 226, 206], [200, 178, 148], clamp(n * 1.4 - .15) * (1 - v * .3)); });
    add(T, G, cap, mat(T, map, { rough: .55, coat: .2 }), { pos: [0, 1.6, 0] });
    add(T, G, new T.CylinderGeometry(1.2, 1.55, 3.6, 18), plain(T, 0xf0e6d2, { rough: .6 }), { pos: [0, -.9, 0] }); G.rotation.set(0, .3, 0); return { g: G, dims: [6.4, 6, 6.4] };
  },
  corn(T) {
    const G = new T.Group(); const pts = [[0, -9, 0], [0, 0, 0], [0, 9, 0]]; const map = skin(T, (u, v) => { const gx = Math.abs(Math.sin(u * Math.PI * 28)), gy = Math.abs(Math.sin(v * Math.PI * 46)); const k = Math.pow(gx * gy, .5); const n = hash(Math.floor(u * 28), Math.floor(v * 46), 4); return mix3([236, 180, 24], [255, 214, 70], clamp(k * .8 + n * .2)); }, 1024, 1024);
    add(T, G, tube(T, pts, (t) => (t < .03 ? .6 : t > .97 ? .3 : 1.85 * Math.pow(Math.sin(Math.PI * clamp(t * .94 + .03)), .35) * (1 - .25 * t)), 80, 40), mat(T, map, { rough: .35, coat: .5 }));
    const hm = plain(T, 0x7bb040, { rough: .7, side: T.DoubleSide }); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28 + .4; add(T, G, new T.ConeGeometry(2.1, 12, 12, 1, true), hm, { pos: [Math.cos(a) * 1.1, -5.5, Math.sin(a) * 1.1], rot: [Math.sin(a) * .25, 0, -Math.cos(a) * .25 + Math.PI], scale: [1, 1, .25] }); }
    G.rotation.set(0, -.3, .9); return { g: G, dims: [22, 4, 4] };
  },
  cabbage(T) {
    const G = new T.Group(); const geo = solid(T, { W: 16, H: 14, f: (yn) => 1 - .06 * yn * yn, lump: .02, lobes: [.04, 9] });
    const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 3, cz * 3, v * 3, 3); const vein = Math.pow(Math.abs(Math.sin(u * Math.PI * 14 + Math.sin(v * 9) * 1.5)), 14); const c = mix3([156, 200, 110], [96, 160, 74], clamp(n * 1.5 - .2)); return mix3(c, [226, 238, 190], vein * .7); });
    add(T, G, geo, mat(T, map, { rough: .55, coat: .12, bump: true, bumpScale: .12 })); G.rotation.y = .4; return { g: G, dims: [16, 14, 16] };
  }
};
function leaf(T, pos, s) {
  const sh = new T.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.25, .28, .9, .42, 1.55, 0); sh.bezierCurveTo(.9, -.38, .25, -.3, 0, 0);
  const lg = new T.ShapeGeometry(sh, 24); const lp = lg.attributes.position; for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), y = lp.getY(i); lp.setZ(i, Math.sin(x * 2) * .09 - Math.abs(y) * .35); } lg.computeVertexNormals();
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, '#25561a'); gr.addColorStop(1, '#3f8a26'); x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = 'rgba(190,225,130,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 64); x.lineTo(256, 64); x.stroke(); x.lineWidth = 1.5; for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(i * 34, 64); x.lineTo(i * 34 + 30, 6); x.moveTo(i * 34, 64); x.lineTo(i * 34 + 30, 122); x.stroke(); }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; const m = new T.Mesh(lg, new T.MeshStandardMaterial({ map: t, roughness: .55, side: T.DoubleSide })); m.position.set(...pos); m.rotation.set(-1.15, .55, -.1); m.scale.setScalar(s); m.castShadow = true; return m;
}
function citrus(T, o) {
  const G = new T.Group(); const geo = solid(T, { W: o.W, H: o.H, f: (yn) => 1 - .12 * Math.pow(Math.abs(yn), 4), cav: (phi) => { const e = Math.pow(Math.abs(Math.cos(phi)), 12); return [Math.sign(Math.cos(phi)) * e * o.nip * .25, 1 - e * .06]; }, lump: .01 });
  const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 9, cz * 9, v * 9, 3); const c = mix3(o.c1, o.c2, clamp(n * 1.6 - .3)); const p = hash(Math.floor(u * 160), Math.floor(v * 90), 9); return p > .86 ? mix3(c, [c[0] * .8, c[1] * .8, c[2] * .6], .5) : c; });
  add(T, G, geo, mat(T, map, { rough: .38, coat: .45, coatRough: .26, bump: true, bumpScale: .09, bumpF: .08, bumpF2: .14 })); G.rotation.set(0, -.5, o.tilt || 0); return { g: G, dims: o.dims };
}
function bulb(T, o) {
  const G = new T.Group(); const geo = solid(T, { W: o.dims[0], H: o.dims[1], f: (yn) => (yn > .15 ? Math.max(.1, Math.sqrt(Math.max(0, 1 - Math.pow((yn - .15) / .85, 1.6))) * (1 - .1 * yn)) + .08 * (yn > .75 ? 0 : 0) : 1 - .04 * (-yn)), cav: (phi) => [.05 * Math.exp(-Math.pow((Math.PI - phi) / .4, 2)), 1], lump: .02 });
  const map = skin(T, (u, v, cx, cz) => { const l = Math.pow(Math.abs(Math.sin(u * Math.PI * 22 + fbm(cx * 2, cz * 2, v * 4, 2) * 5)), .5); const n = fbm(cx * 4, cz * 4, v * 2, 3); const c = mix3(o.c1, o.c2, clamp(l * .55 + n * .7 - .3)); const top = clamp((.25 - v) * 4); return mix3(c, [196, 170, 120], top * .5); });
  add(T, G, geo, mat(T, map, { rough: .45, coat: .3, coatRough: .3 }));
  add(T, G, new T.ConeGeometry(.45, 2.3, 10), plain(T, 0xd8bf8a), { pos: [0, o.dims[1] / 2 + .5, 0] });
  const rm = plain(T, 0xd8c8a0); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28; add(T, G, new T.CylinderGeometry(.02, .06, 1.2, 5), rm, { pos: [Math.cos(a) * .5, -o.dims[1] / 2 - .1, Math.sin(a) * .5], rot: [Math.sin(a) * .5, 0, -Math.cos(a) * .5] }); }
  G.rotation.set(0, -.4, .05); return { g: G, dims: o.dims };
}
function longVeg(T, o) {
  const G = new T.Group(); const pts = [[-o.len / 2, 0, 0], [0, .2, 0], [o.len / 2, 0, 0]];
  const map = skin(T, (u, v) => { const n = fbm(u * 24, v * 4, 3, 3); const st = Math.pow(Math.abs(Math.sin(u * Math.PI * 7 + n * 3)), 12); const c = mix3(o.c1, o.c2, clamp(n * 1.7 - .3)); return mix3(c, o.stripe, st * .5); });
  add(T, G, tube(T, pts, (t) => o.r * Math.pow(Math.sin(Math.PI * clamp(t * (1 - o.ends * 2) + o.ends)), .22) * (t < .02 || t > .98 ? .8 : 1), 80, 40), mat(T, map, { rough: .32, coat: .55, coatRough: .2, bump: true, bumpScale: .04 }));
  if (o.stem) add(T, G, new T.CylinderGeometry(.5, .75, 1.5, 6), plain(T, 0x5a7a30), { pos: [-o.len / 2 - .5, 0, 0], rot: [0, 0, Math.PI / 2] });
  G.rotation.set(0, -.35, .1); return { g: G, dims: o.dims };
}
function bell(T, o) {
  const G = new T.Group(); const geo = solid(T, { W: 8.5, H: 9.5, f: (yn) => 1 - .08 * yn, cav: (phi) => [-.12 * Math.exp(-Math.pow(phi / .55, 2)) + .1 * Math.exp(-Math.pow((Math.PI - phi) / .6, 2)), 1], lobes: [.075, 3], lump: .012 });
  const map = skin(T, (u, v, cx, cz) => { const n = fbm(cx * 2, cz * 2, v * 2, 3); return mix3(o.c1, o.c2, clamp(n * 1.5 - .35 + (1 - Math.abs(v - .45)) * -.1)); });
  add(T, G, geo, mat(T, map, { rough: .22, coat: .9, coatRough: .1 }));
  const gm = plain(T, 0x3f7f2a); add(T, G, new T.CylinderGeometry(.5, .85, 1.8, 8), gm, { pos: [.1, 5.1, 0], rot: [0, 0, .12] }); add(T, G, new T.SphereGeometry(1.1, 14, 10), gm, { pos: [0, 4.2, 0], scale: [1.2, .4, 1.2] }); G.rotation.set(0, -.4, 0); return { g: G, dims: [8.5, 9.5, 8.5] };
}
export { INK };
