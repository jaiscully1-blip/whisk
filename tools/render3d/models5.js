// Batch 5: modern appliances, the dish disaster, and the redone ice cream machine / chocolate fountain / skillet. Real sizes in cm.
import { INK, lin, hash, fbm, clamp, mix3, skin, mat, plain, tube } from './models.js';
function add(T, G, geo, m, p, r, s) { const x = new T.Mesh(geo, m); x.castShadow = x.receiveShadow = true; if (p) x.position.set(...p); if (r) x.rotation.set(...r); if (s) x.scale.set(...s); G.add(x); return x; }
const M = (T, c, o = {}) => new T.MeshPhysicalMaterial(Object.assign({ roughness: .4, metalness: 0, clearcoat: .35, clearcoatRoughness: .3 }, o, { color: lin(T, c) }));
const steel = (T) => M(T, 0xc9ced3, { metalness: .5, roughness: .3, clearcoat: .6, clearcoatRoughness: .15 });
const iron = (T) => M(T, 0x2d2b2c, { roughness: .5, clearcoat: .2 });
const gold = (T) => M(T, 0xe3ae3e, { metalness: .55, roughness: .28, clearcoat: .6 });
const copper = (T) => M(T, 0xc9784a, { metalness: .5, roughness: .3, clearcoat: .6 });
const white = (T) => M(T, 0xf6f4ee, { roughness: .2, clearcoat: .9, clearcoatRoughness: .1 });
const clay = (T) => M(T, 0xc2603a, { roughness: .7, clearcoat: .05 });
const wood = (T, c = 0xa97b55) => M(T, c, { roughness: .6, clearcoat: .2 });
const glass = (T, c = 0xcfe8f0, op = .35) => M(T, c, { roughness: .05, clearcoat: 1, transparent: true, opacity: op });
const enamel = (T, c) => M(T, c, { roughness: .25, clearcoat: .9, clearcoatRoughness: .1 });
const texM = (T, fn, o = {}) => mat(T, skin(T, fn), o);
// body of revolution from [radius, height] points (bottom → top)
const lathe = (T, G, pts, m, pos, rot, scale) => { const g = new T.LatheGeometry(pts.map((p) => new T.Vector2(Math.max(.001, p[0]), p[1])), 72); const x = add(T, G, g, new Proxy(m, {}), pos, rot, scale); x.material.side = T.DoubleSide; return x; };
const ring = (T, G, R, r, arc, m, pos, rot) => add(T, G, new T.TorusGeometry(R, r, 12, 40, arc), m, pos, rot);
const cyl = (T, G, rt, rb, h, m, pos, rot) => add(T, G, new T.CylinderGeometry(rt, rb, h, 36), m, pos, rot);
const sph = (T, G, r, m, pos, s) => add(T, G, new T.SphereGeometry(r, 32, 24), m, pos, null, s);
const box = (T, G, w, h, d, m, pos, rot) => add(T, G, new T.BoxGeometry(w, h, d), m, pos, rot);
const rbox = (T, G, w, h, d, m, pos, e = .22) => { const g = new T.SphereGeometry(1, 64, 64); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const f = (q) => Math.sign(q) * Math.pow(Math.abs(q), e); p.setXYZ(i, f(p.getX(i)) * w / 2, f(p.getY(i)) * h / 2, f(p.getZ(i)) * d / 2); } g.computeVertexNormals(); return add(T, G, g, m, pos); };
const done = (G, dims, ry = -.4) => { G.rotation.y = ry; return { g: G, dims }; };
const leafBlobs = (T, G, n, c, R, y, size, x0 = 0) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283 + hash(i, 1, 2), tilt = .3 + hash(i, 2, 2) * .5; const lf = sph(T, G, size, M(T, c, { roughness: .5, clearcoat: .15 }), [x0 + Math.cos(a) * R * .5, y + hash(i, 3, 2) * R * .5, Math.sin(a) * R * .5], [1.8, .35, 1.1]); lf.rotation.set(0, -a, tilt); } };


const chrome = (T) => M(T, 0xf2f5f8, { metalness: .5, roughness: .2, clearcoat: .9, clearcoatRoughness: .06 });
const matteBlack = (T) => M(T, 0x23262b, { roughness: .45, clearcoat: .4 });
const tubeAlong = (T, G, pts, r, m) => add(T, G, new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(...p)), false, 'catmullrom', .35), 64, r, 20, false), m);
const emissive = (T, c, k = 1.4) => new T.MeshStandardMaterial({ color: lin(T, c), emissive: lin(T, c), emissiveIntensity: k, roughness: .4 });
// a tall kitchen faucet standing at (x, y, z); style 'modern' is the black pull-down, 'classic' the chrome gooseneck
function faucet(T, G, style, x = 0, y = 0, z = 0, s = 1) {
  const g = new T.Group(); g.position.set(x, y, z); g.scale.setScalar(s); G.add(g);
  if (style === 'modern') {
    const b = matteBlack(T), c = chrome(T);
    cyl(T, g, 2.9, 3.2, 1.6, b, [0, .8, 0]); cyl(T, g, 2.1, 2.1, 22, b, [0, 12, 0]);
    tubeAlong(T, g, [[0, 22, 0], [0, 28, 0], [2.2, 31.6, 0], [7, 32.4, 0], [11.5, 30.4, 0], [13.4, 27, 0]], 1.65, b);
    cyl(T, g, 2.1, 1.7, 7.4, c, [13.6, 22.6, 0]); cyl(T, g, 1.2, 2.1, 1.2, matteBlack(T), [13.6, 18.4, 0]); cyl(T, g, .95, .95, .3, M(T, 0x9fd8ff, { roughness: .1, clearcoat: 1 }), [13.6, 17.7, 0]);
    box(T, g, 6.6, 1.5, 1.7, b, [4.6, 6, 3.8], [0, -.5, .2]); sph(T, g, .9, c, [8, 6, 5.6]);
  } else {
    const c = chrome(T);
    cyl(T, g, 3.8, 4.4, 1.8, c, [0, .9, 0]); cyl(T, g, 2.2, 2.6, 14, c, [0, 8.8, 0]);
    tubeAlong(T, g, [[0, 15, 0], [0, 23, 0], [2, 29, 0], [7.4, 30.6, 0], [11.4, 28, 0], [12.2, 23, 0]], 1.5, c);
    cyl(T, g, 1.8, 1.4, 3.4, c, [12.2, 21, 0]);
    cyl(T, g, 1, 1, 6, c, [0, 14, 4.2], [Math.PI / 2, 0, 0]); sph(T, g, 1.5, M(T, 0xd9452b, { clearcoat: .9, roughness: .2 }), [0, 14, 7.6]);
    tubeAlong(T, g, [[-3.2, 4, 0], [-7, 10, 3.5], [-9, 16, 3]], .5, c);
    cyl(T, g, 1, 1.2, 4.6, c, [-9, 18, 3]);
  }
  return g;
}
const water = (T) => M(T, 0x8fd4ff, { roughness: .05, clearcoat: 1, transparent: true, opacity: .6 });
const foodBlob = (T, G, c, r, p, s) => sph(T, G, r, M(T, c, { roughness: .5, clearcoat: .2 }), p, s || [1.4, .5, 1.1]);
// one plate lying at an angle, with a smear of food
function plate(T, G, pos, rot, r = 11, c = 0xf6f4ee, food) {
  const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g);
  lathe(T, g, [[0, 0], [r * .62, 0], [r * .92, r * .15], [r, r * .17], [r * .98, r * .2], [r * .6, .5], [0, .5]], M(T, c, { roughness: .2, clearcoat: .9, clearcoatRoughness: .1 }));
  ring(T, g, r * .94, .16, 6.283, M(T, 0x2f6db5, { roughness: .2 }), [0, r * .19, 0], [Math.PI / 2, 0, 0]);
  if (food) foodBlob(T, g, food, r * .26, [r * .12, .9, -r * .05], [1.7, .45, 1.2]);
  return g;
}
const fork = (T, G, pos, rot) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); const s = steel(T); box(T, g, .9, .25, 7.5, s, [0, 0, 5]); box(T, g, 3.6, .25, 3, s, [0, 0, -1]); for (const x of [-1.3, -.45, .45, 1.3]) box(T, g, .3, .25, 3.4, s, [x, 0, -3.6]); return g; };
const knifeP = (T, G, pos, rot) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); box(T, g, 1.3, .3, 9, M(T, 0x2d2b2c), [0, 0, 6]); box(T, g, 1.5, .25, 9.5, steel(T), [0, 0, -3.5]); return g; };
const spoonP = (T, G, pos, rot) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); box(T, g, 1, .25, 8.5, steel(T), [0, 0, 4.5]); sph(T, g, 2.1, steel(T), [0, 0, -1.5], [.8, .2, 1.2]); return g; };
const mugP = (T, G, pos, c, rot = [0, 0, 0]) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); lathe(T, g, [[0, 0], [3.4, 0], [3.7, 8], [3.4, 8.2], [3.1, 8], [3, .6], [0, .5]], M(T, c, { roughness: .25, clearcoat: .9 })); ring(T, g, 2.4, .55, Math.PI, M(T, c, { roughness: .25, clearcoat: .9 }), [3.4, 4.2, 0], [0, 0, -Math.PI / 2]); return g; };
const bowlP = (T, G, pos, c, r = 8, rot = [0, 0, 0], food) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); lathe(T, g, [[0, 0], [r * .4, 0], [r * .8, r * .4], [r, r * .8], [r * .96, r * .84], [r * .74, r * .44], [0, r * .1]], M(T, c, { roughness: .25, clearcoat: .85 })); if (food) foodBlob(T, g, food, r * .5, [0, r * .22, 0], [1.3, .35, 1.3]); return g; };
const glassP = (T, G, pos, rot = [0, 0, 0], liquid) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); lathe(T, g, [[0, 0], [2.6, 0], [3.2, 11], [3.4, 11.4], [3, 11.2], [2.4, .7], [0, .6]], glass(T, 0xd6ecf5, .4)); if (liquid) lathe(T, g, [[0, .7], [2.4, .7], [2.8, 4]], M(T, liquid, { roughness: .2, clearcoat: .8, transparent: true, opacity: .8 })); return g; };
const panP = (T, G, pos, rot, r = 11, c = 0x3a3d44) => { const g = new T.Group(); g.position.set(...pos); g.rotation.set(...rot); G.add(g); lathe(T, g, [[0, 0], [r * .8, 0], [r, 5], [r * 1.03, 5.3], [r * .96, 5.3], [r * .78, .6], [0, .5]], M(T, c, { metalness: .4, roughness: .45 })); box(T, g, 14, 1.4, 2.6, M(T, c, { metalness: .3, roughness: .5 }), [r + 6, 3.4, 0]); return g; };
// a sink basin: steel rim and walls, water, drain
function basin(T, G, w, d, h, y, water_) {
  const s = steel(T);
  box(T, G, w, 1.6, 1.4, s, [0, y + h, -d / 2]); box(T, G, w, 1.6, 1.4, s, [0, y + h, d / 2]); box(T, G, 1.4, 1.6, d, s, [-w / 2, y + h, 0]); box(T, G, 1.4, 1.6, d, s, [w / 2, y + h, 0]);
  box(T, G, w, h, .6, M(T, 0xaab0b6, { metalness: .6, roughness: .35 }), [0, y + h / 2, -d / 2 + .5]); box(T, G, .6, h, d, M(T, 0xb4bac0, { metalness: .6, roughness: .35 }), [-w / 2 + .5, y + h / 2, 0]);
  box(T, G, w, .6, d, M(T, 0x8d949b, { metalness: .6, roughness: .4 }), [0, y, 0]); cyl(T, G, 2.2, 2.2, .3, M(T, 0x30343a, { metalness: .5 }), [0, y + .4, d * .1]);
  if (water_) box(T, G, w - 3, 3.6, d - 3, M(T, 0x9bb08a, { roughness: .1, clearcoat: 1, transparent: true, opacity: .75 }), [0, y + 2, 0]);
}

export const MODELS5 = {
  faucet: (T) => { const G = new T.Group(); faucet(T, G, 'classic'); return done(G, [26, 32, 12], -.5); },
  faucet_modern: (T) => { const G = new T.Group(); faucet(T, G, 'modern'); return done(G, [26, 34, 12], -.5); },
  sink_modern: (T) => {
    const G = new T.Group(), cer = M(T, 0xf8f6f1, { roughness: .15, clearcoat: 1, clearcoatRoughness: .06 });
    rbox(T, G, 54, 18, 38, cer, [0, 9, 0], .3);
    add(T, G, new T.CylinderGeometry(21.5, 21.5, .7, 56), M(T, 0xb9c0c6, { metalness: .6, roughness: .3, clearcoat: .5 }), [0, 18.6, 0], null, [1, 1, .66]);
    add(T, G, new T.CylinderGeometry(19.6, 19.6, .8, 56), M(T, 0x7f878f, { metalness: .55, roughness: .4 }), [0, 18.8, 0], null, [1, 1, .66]);
    add(T, G, new T.CylinderGeometry(18.4, 18.4, .5, 56), water(T), [0, 19.4, 0], null, [1, 1, .66]);
    cyl(T, G, 2, 2, .3, M(T, 0x30343a, { metalness: .6 }), [0, 19.5, 2]);
    faucet(T, G, 'modern', 0, 18.4, -14.5, .78);
    return done(G, [56, 44, 40], -.5);
  },
  microwave: (T) => {
    const G = new T.Group(), body = M(T, 0xdcdfe3, { metalness: .55, roughness: .3, clearcoat: .6 });
    rbox(T, G, 48, 28, 36, body, [0, 14, 0], .22);
    rbox(T, G, 30, 20, 1.6, M(T, 0x14181c, { roughness: .08, clearcoat: 1 }), [-5, 14.4, 18], .25);
    box(T, G, 29, .4, .6, M(T, 0x4a5058), [-5, 4.6, 18.6]);
    box(T, G, 11, 24, 1.6, M(T, 0x23262b, { roughness: .35, clearcoat: .6 }), [18, 14, 18.1]);
    box(T, G, 8, 3.4, .5, M(T, 0x061008, { roughness: .1 }), [18, 22, 19]); box(T, G, 5.6, 1.6, .3, emissive(T, 0x45ff7a, 1.8), [18, 22, 19.3]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) cyl(T, G, 1.15, 1.15, .6, M(T, 0xc9cdd2, { metalness: .5, roughness: .3 }), [15.6 + c * 4.8, 17 - r * 3.2, 19], [Math.PI / 2, 0, 0]);
    cyl(T, G, 2, 2, 1.2, M(T, 0xd9452b, { roughness: .3, clearcoat: .8 }), [18, 6.4, 19.2], [Math.PI / 2, 0, 0]);
    box(T, G, 1.4, 17, 1.6, chrome(T), [10.6, 14.4, 19.8]);
    for (const x of [-18, 18]) cyl(T, G, 2, 2, 1.2, matteBlack(T), [x, -.4, 13]);
    return done(G, [48, 29, 36], -.45);
  },
  rice_cooker_m: (T) => {
    const G = new T.Group(), cream = M(T, 0xf1ece0, { roughness: .22, clearcoat: .9, clearcoatRoughness: .1 }), mint = M(T, 0x7ed9b4, { roughness: .25, clearcoat: .8 });
    rbox(T, G, 28, 20, 28, cream, [0, 10, 0], .5);
    lathe(T, G, [[0, 0], [12.4, 0], [13.2, 1.6], [12, 5], [8, 7.6], [0, 8.4]], cream, [0, 19.5, 0]);
    cyl(T, G, 2.4, 2.4, 1.6, matteBlack(T), [0, 28.2, 0]); ring(T, G, 7, .8, Math.PI, mint, [0, 26.4, 0], [Math.PI / 2, 0, 0]);
    rbox(T, G, 16, 6.4, 1.6, M(T, 0x15191d, { roughness: .1, clearcoat: 1 }), [0, 9, 14.2], .3);
    box(T, G, 8, 2, .3, emissive(T, 0x7affb0, 1.6), [-1.4, 9.2, 15.1]);
    for (const x of [4.6, 7]) cyl(T, G, .9, .9, .6, mint, [x, 9, 15.1], [Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) box(T, G, 2, 5, 6, mint, [s * 14.6, 14, 0], [0, 0, 0]);
    return done(G, [30, 30, 30], -.45);
  },
  coffee_maker: (T) => {
    const G = new T.Group(), bk = M(T, 0x1d2025, { roughness: .35, clearcoat: .7 });
    rbox(T, G, 24, 3.4, 22, bk, [0, 1.7, 2], .35);
    rbox(T, G, 12, 34, 12, bk, [0, 18, -7], .3);
    rbox(T, G, 24, 8, 22, bk, [0, 33, 1], .3);
    lathe(T, G, [[0, 0], [3.2, 0], [4.6, 2.4], [4.8, 3]], steel(T), [0, 24.6, 5.4]); cyl(T, G, 1, 1, 1.2, steel(T), [0, 28, 5.4]);
    // glass carafe full of coffee
    lathe(T, G, [[0, 0], [5.2, 0], [6, 2], [6.4, 10], [5.2, 15.4], [4.2, 16.4], [3.4, 16.4]], glass(T, 0xdde9ee, .32), [0, 3.4, 5.4]);
    lathe(T, G, [[0, .6], [5, .6], [5.8, 2.4], [6, 8.4], [5.8, 8.6], [0, 8.6]], M(T, 0x4a2a16, { roughness: .1, clearcoat: 1, transparent: true, opacity: .9 }), [0, 3.4, 5.4]);
    lathe(T, G, [[3.4, 0], [4.2, 0], [4.2, 1.2], [3.4, 1.2]], matteBlack(T), [0, 19.6, 5.4]);
    ring(T, G, 4.2, .75, Math.PI * 1.1, matteBlack(T), [6.2, 11.8, 5.4], [0, 0, -Math.PI * .55]);
    box(T, G, 6, 1.8, .4, emissive(T, 0xff5a3c, 1.5), [0, 36.2, 12.2]); cyl(T, G, 1.3, 1.3, .6, chrome(T), [8, 33, 12], [Math.PI / 2, 0, 0]);
    return done(G, [26, 42, 24], -.5);
  },
  kettle_m: (T) => {
    const G = new T.Group(), body = M(T, 0xe3e7ea, { metalness: .55, roughness: .28, clearcoat: .7 });
    lathe(T, G, [[0, 0], [8.4, 0], [9, 1.6], [9, 3.4], [0, 3.4]], matteBlack(T));
    ring(T, G, 9, .5, 6.283, emissive(T, 0x4fc3ff, 2.4), [0, 2.4, 0], [Math.PI / 2, 0, 0]);
    lathe(T, G, [[0, 3.4], [8, 3.4], [8.6, 5], [8.2, 18], [7.2, 22], [5.4, 24.4], [0, 25]], body);
    lathe(T, G, [[0, 24.6], [4.4, 24.6], [4, 26], [0, 26.6]], matteBlack(T)); sph(T, G, 1.4, chrome(T), [0, 27.4, 0]);
    box(T, G, 1.6, 15, 1, glass(T, 0xbfe6ff, .55), [0, 12, 8.5]);   // the water-level window
    lathe(T, G, [[2.2, 0], [3, 0], [2, 7]], body, [8.4, 18, 0], [0, 0, -1.0]);
    tubeAlong(T, G, [[-7, 22.2, 0], [-12.6, 20.6, 0], [-14, 12.6, 0], [-9.2, 6.4, 0]], 1.2, matteBlack(T));
    return done(G, [26, 28, 20], -.55);
  },
  ice_cream: (T) => {
    const G = new T.Group(), cream = M(T, 0xfff3e6, { roughness: .2, clearcoat: .85 }), red = M(T, 0xd9362b, { roughness: .25, clearcoat: .8 }), pink = M(T, 0xffb3cf, { roughness: .3, clearcoat: .6 });
    rbox(T, G, 34, 30, 30, cream, [0, 15, -2], .3);
    rbox(T, G, 34.6, 6, 30.6, red, [0, 33, -2], .3);
    lathe(T, G, [[0, 0], [10.8, 0], [11.6, 4], [10, 10], [5, 13], [0, 13.4]], glass(T, 0xdfeef5, .3), [0, 36, -2]);
    lathe(T, G, [[0, 0], [9.4, 0], [10.2, 3.6], [8.8, 8]], pink, [0, 36.4, -2]);
    cyl(T, G, 1.4, 1.4, 1.6, steel(T), [0, 50.2, -2]);
    rbox(T, G, 24, 20, 3, M(T, 0xe9e2d6, { roughness: .3, clearcoat: .6 }), [0, 17, 14.4], .3);
    for (const x of [-6.2, 6.2]) { cyl(T, G, 2.2, 3, 4.6, steel(T), [x, 9, 17.6]); cyl(T, G, 1.1, 1.1, 8, steel(T), [x * 1.6, 28, 15.4], [0, 0, x < 0 ? .5 : -.5]); sph(T, G, 2, x < 0 ? pink : red, [x * 2.3, 33, 15.4]); }
    box(T, G, 30, 1.4, 20, M(T, 0xc9ced3, { metalness: .5, roughness: .3 }), [0, .2, 18]);
    lathe(T, G, [[0, 0], [2.8, 0], [2.8, 0]], pink); cone(T, G);
    return done(G, [38, 52, 36], -.45);
    function cone(T, G) { const c = new T.Mesh(new T.ConeGeometry(5.4, 13, 32), M(T, 0xd9a05a, { roughness: .7, clearcoat: 0 })); c.rotation.x = Math.PI; c.position.set(0, 6.8, 19); c.castShadow = true; G.add(c); }
  },
  choc_fountain: (T) => {
    const G = new T.Group(), ch = M(T, 0x4d2814, { roughness: .12, clearcoat: 1, clearcoatRoughness: .04 }), chL = M(T, 0x6a3a1c, { roughness: .12, clearcoat: 1, clearcoatRoughness: .04 });
    lathe(T, G, [[0, 0], [13, 0], [14, 2.2], [13, 4.4], [0, 4.4]], steel(T));
    lathe(T, G, [[0, 4.4], [12, 4.4], [12.4, 5.2], [0, 5.4]], ch);
    const tiers = [[11, 6, 6], [8, 14.5, 5.4], [5.2, 23, 4.6]];
    cyl(T, G, 1.1, 1.3, 38, steel(T), [0, 20, 0]);
    tiers.forEach(([r, y, dl], ti) => {
      lathe(T, G, [[0, 0], [r * .8, 0], [r, 1.2], [r + 1, 2.4], [r + .2, 2.4], [r - .2, 1.6], [0, .8]], ch, [0, y, 0]);
      // the curtain of chocolate pouring over the rim, and long drips hanging from it
      lathe(T, G, [[r + .5, y + 2.3], [r + 1.3, y + .6], [r + 1.5, y - dl * .8], [r + 1.2, y - dl]], chL);
      for (let i = 0; i < 11; i++) { const a = i / 11 * 6.283 + ti * .4, L = dl * (.55 + hash(i, ti, 11) * 1.25), rr = r + 1.35; const px = Math.cos(a) * rr, pz = Math.sin(a) * rr, w = .55 + hash(i, ti, 12) * .35;
        cyl(T, G, w, w, L, chL, [px, y - dl * .4 - L / 2 + dl * .4, pz]); sph(T, G, w * 1.25, chL, [px, y - L + dl * .4 - .2, pz], [1, 1.35, 1]); }
    });
    sph(T, G, 1.8, chL, [0, 39.4, 0]); lathe(T, G, [[1.5, 38], [2.4, 36.4], [3, 34], [1.8, 35]], chL);
    // pool of chocolate round the bottom and strawberries to dip
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .4, px = Math.cos(a) * 15.6, pz = Math.sin(a) * 15.6; sph(T, G, 2.1, M(T, 0xd9262b, { roughness: .3, clearcoat: .8 }), [px, 2.1, pz], [1, 1.15, 1]); sph(T, G, 1.1, M(T, 0x3f8a2c), [px, 4.3, pz], [1.2, .4, 1.2]); }
    return done(G, [34, 42, 34], 0);
  },
  cast_iron: (T) => {
    const G = new T.Group(), pan = M(T, 0x6b707a, { metalness: .55, roughness: .38, clearcoat: .35 }), dark = M(T, 0x3b3e45, { metalness: .4, roughness: .5 });
    lathe(T, G, [[0, 0], [11, 0], [13, 1], [13.4, 5], [13.8, 5.4], [13.2, 5.4], [12.7, 4.6], [10.6, 1.4], [0, 1.2]], pan);
    lathe(T, G, [[0, 1.3], [10.4, 1.5], [12.4, 4.6], [12.2, 4.7], [0, 1.4]], dark);
    cyl(T, G, 1.6, 1.9, 22, pan, [23, 3.8, 0], [0, 0, Math.PI / 2 + .06]); sph(T, G, 2, pan, [34, 3.9, 0]);
    cyl(T, G, 2.1, 2.1, 13, M(T, 0xd9452b, { roughness: .45, clearcoat: .3 }), [26, 3.9, 0], [0, 0, Math.PI / 2 + .06]);
    cyl(T, G, 1.8, 1.8, 3, pan, [-14, 3.2, 0], [0, 0, 1.4]);
    // two fried eggs and a strip of bacon so it reads at a glance
    for (const [x, z, r] of [[-3.8, 2.6, 4.2], [3.6, -3.6, 3.8]]) { sph(T, G, r, M(T, 0xfffdf6, { roughness: .2, clearcoat: .8 }), [x, 2, z], [1.15, .22, 1]); sph(T, G, r * .46, M(T, 0xf6b21a, { roughness: .15, clearcoat: 1 }), [x, 2.9, z], [1, .8, 1]); }
    for (const [x, z, a] of [[-1, -7, .15], [4, 5.6, -.1]]) { const b = box(T, G, 9, .7, 2.2, M(T, 0xb4402a, { roughness: .4, clearcoat: .5 }), [x, 2.1, z], [0, a, 0]); box(T, G, 9, .72, .7, M(T, 0xf0c9a8), [x, 2.15, z + .2], [0, a, 0]); }
    return done(G, [46, 8, 27], -.6);
  },
  // ---- the dish disaster (50,000 coins): a sink heaped over, a table covered, and a counter pile ----
  mess_sink: (T) => {
    const G = new T.Group(); basin(T, G, 60, 40, 14, 0, true);
    faucet(T, G, 'classic', 0, 14.6, -19, .8);
    // everything heaped in, tilted every which way
    plate(T, G, [-12, 8, 2], [.5, .2, -.3], 12, 0xf6f4ee, 0xd8742c); plate(T, G, [8, 10, 6], [-.3, 1.2, .5], 11, 0xfaf3e0, 0x9a3b25); plate(T, G, [-2, 13.5, -3], [.2, 2, -.5], 12, 0xf6f4ee, 0xe0c25a); plate(T, G, [14, 8, -6], [.7, 0, .4], 10, 0xe9eef5, 0x5a8a3a);
    plate(T, G, [-16, 13, -8], [-.6, .5, .9], 10, 0xf6f4ee, 0x7a4a2a);
    bowlP(T, G, [4, 9, -10], 0x2f6db5, 8, [.5, 0, .6], 0xd8b45a); bowlP(T, G, [-6, 14, 9], 0xc8352f, 7.4, [2.4, 0, .3], 0x9a3b25);
    panP(T, G, [10, 16, 8], [.3, 2.5, -.7], 11, 0x2d2b2c); panP(T, G, [-20, 11, 6], [-.4, .6, .5], 9, 0x6b707a);
    lathe(T, G, [[0, 0], [8, 0], [8.4, 11], [7.6, 11.4], [0, .8]], steel(T), [-6, 9, -4], [.5, 0, .2]);
    mugP(T, G, [18, 12, 10], 0xe0a93b, [1.2, 0, .5]); mugP(T, G, [-12, 17, 0], 0x7a4a9a, [.3, 0, 1.6]); mugP(T, G, [22, 8, -12], 0x2f9b78, [-1.4, 0, .4]);
    glassP(T, G, [-24, 10, -10], [1.1, 0, .8], 0xcc7a3a); glassP(T, G, [2, 18, 2], [.5, 0, -1.2]);
    const cut = [[fork, 0], [knifeP, 0], [spoonP, 0], [fork, 1], [spoonP, 1], [knifeP, 1], [fork, 2], [spoonP, 2], [fork, 0], [knifeP, 2], [spoonP, 1], [fork, 2]];
    cut.forEach(([f, _], i) => f(T, G, [-14 + i * 2.6, 17 + hash(i, 1, 9) * 4, -4 + hash(i, 2, 9) * 14], [hash(i, 3, 9) * 1.2 - .6, hash(i, 4, 9) * 6.283, hash(i, 5, 9) * 1.4 - .7]));
    for (let i = 0; i < 14; i++) foodBlob(T, G, [0x9a3b25, 0xe0c25a, 0x5a8a3a, 0xd8742c, 0xf6f4ee][i % 5], 1 + hash(i, 6, 9) * 1.6, [-22 + hash(i, 7, 9) * 44, 4 + hash(i, 8, 9) * 10, -14 + hash(i, 9, 9) * 28]);
    box(T, G, 8, 2.2, 5, M(T, 0xf0d24a, { roughness: .9 }), [18, 3.4, 6], [0, .5, 0]); box(T, G, 8.2, .6, 5.2, M(T, 0x3f8a2c, { roughness: .9 }), [18, 4.7, 6], [0, .5, 0]);
    return done(G, [66, 40, 46], -.4);
  },
  mess_table: (T) => {
    const G = new T.Group(); box(T, G, 78, 3, 48, M(T, 0xa97b55, { roughness: .6, clearcoat: .2 }), [0, -1.5, 0]);
    for (const [x, z] of [[-34, -20], [34, -20], [-34, 20], [34, 20]]) cyl(T, G, 2, 1.6, 30, M(T, 0x8a5d3a), [x, -17, z]);
    box(T, G, 36, 1.6, 26, M(T, 0xd9452b, { roughness: .8 }), [-4, .2, 2], [0, .15, 0]);   // a stained tablecloth patch
    plate(T, G, [-24, 0, -8], [0, .3, 0], 12, 0xf6f4ee, 0xd8742c); plate(T, G, [6, 0, -6], [0, 1, 0], 12, 0xfaf3e0, 0x9a3b25); plate(T, G, [22, 0, 8], [0, 2, 0], 11, 0xe9eef5, 0xe0c25a); plate(T, G, [-8, 1.4, 10], [.15, .5, .1], 11, 0xf6f4ee, 0x7a4a2a); plate(T, G, [-8, 3, 10], [-.1, 2, .2], 9, 0xf6f4ee, 0x5a8a3a);
    bowlP(T, G, [-24, 0, 14], 0x2f6db5, 7, [0, 0, 0], 0xd8b45a); bowlP(T, G, [28, 0, -12], 0xc8352f, 7.4, [.2, 0, .3], 0x9a3b25);
    glassP(T, G, [-30, 0, 2], [0, 0, 0], 0xcc7a3a); glassP(T, G, [12, 0, 16], [Math.PI / 2 - .1, 0, .3]); glassP(T, G, [30, 0, 18], [0, 0, 0], 0xd9362b);
    mugP(T, G, [14, 0, -14], 0xe0a93b); mugP(T, G, [-14, 0, -16], 0x7a4a9a, [0, 0, 1.2]);
    panP(T, G, [0, 3, -14], [0, 2.6, 0], 9, 0x2d2b2c);
    for (let i = 0; i < 16; i++) { const f = [fork, knifeP, spoonP][i % 3]; f(T, G, [-32 + hash(i, 1, 4) * 64, .2 + (i % 4 === 0 ? 1.4 : 0), -18 + hash(i, 2, 4) * 36], [0, hash(i, 3, 4) * 6.283, 0]); }
    for (let i = 0; i < 22; i++) foodBlob(T, G, [0x9a3b25, 0xe0c25a, 0x5a8a3a, 0xd8742c, 0xf6f4ee, 0x5a3a1c][i % 6], .6 + hash(i, 6, 4) * 1.4, [-34 + hash(i, 7, 4) * 68, .4, -20 + hash(i, 8, 4) * 40]);
    box(T, G, 16, 2, 16, M(T, 0xc99a5e, { roughness: .8 }), [24, 1, -18], [0, .4, 0]); box(T, G, 16, .3, 16, M(T, 0xe0b27a, { roughness: .8 }), [24, 2.1, -18], [0, .4, 0]);
    return done(G, [80, 34, 50], -.45);
  },
  mess_counter: (T) => {
    const G = new T.Group();
    plate(T, G, [-8, 0, 2], [0, .3, 0], 12, 0xf6f4ee, 0xd8742c); plate(T, G, [-8, 1.7, 2], [.1, 1.2, .1], 11, 0xfaf3e0, 0x9a3b25); plate(T, G, [-8, 3.3, 2], [-.1, 2.4, .1], 10, 0xf6f4ee, 0xe0c25a);
    bowlP(T, G, [10, 0, -4], 0x2f6db5, 7, [0, 0, 0], 0xd8b45a); bowlP(T, G, [10, 4, -4], 0xc8352f, 6, [.2, 0, .1]);
    panP(T, G, [4, 0, 12], [0, 3.4, 0], 9, 0x2d2b2c); mugP(T, G, [18, 0, 8], 0xe0a93b); mugP(T, G, [-20, 0, -8], 0x7a4a9a, [0, 0, 1.3]); glassP(T, G, [-20, 0, 10], [Math.PI / 2 - .15, 0, .5], 0xcc7a3a);
    for (let i = 0; i < 9; i++) { const f = [fork, knifeP, spoonP][i % 3]; f(T, G, [-22 + hash(i, 1, 5) * 44, .2, -12 + hash(i, 2, 5) * 24], [0, hash(i, 3, 5) * 6.283, 0]); }
    for (let i = 0; i < 12; i++) foodBlob(T, G, [0x9a3b25, 0xe0c25a, 0x5a8a3a, 0xd8742c, 0xf6f4ee][i % 5], .6 + hash(i, 6, 5) * 1.3, [-22 + hash(i, 7, 5) * 44, .4, -14 + hash(i, 8, 5) * 28]);
    return done(G, [50, 14, 30], -.4);
  }
};
