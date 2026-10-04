// Whisk 3D engine — ported from the Whisk Closet prototype. Client-only (imported dynamically).
import * as THREE from 'three';
/* eslint-disable */
// ---------- helpers ----------
const T = THREE;
const INK = 0x2A2433, CREAM = 0xFFEFD6, PIST = 0x4E9A2F, STEEL = 0xC9D1DB, HANDLE = 0x17171B;
const _mats = new Map();
function M(c, o) {
  const key = c + JSON.stringify(o || {});
  if (!o || !o.map) { if (_mats.has(key)) return _mats.get(key); }
  const m = new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: 0 }, o || {}));
  if (!o || !o.map) _mats.set(key, m);
  return m;
}
const metal = (c = STEEL, r = .3) => M(c, { metalness: .8, roughness: r });
const glow = (c, i = 1) => M(c, { emissive: c, emissiveIntensity: i, roughness: .4 });
const glass = (c, op = .5) => M(c, { transparent: true, opacity: op, roughness: .08, metalness: .15, depthWrite: false });
const cloth = (c) => M(c, { roughness: .85 });
const DS = (m) => { const k = m.clone(); k.side = T.DoubleSide; return k; };
function mesh(g, m) { return new T.Mesh(g, m); }
function at(o, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s) {
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  if (s !== undefined) { if (typeof s === 'number') o.scale.setScalar(s); else o.scale.set(s[0], s[1], s[2]); }
  return o;
}
function G(...kids) { const g = new T.Group(); kids.flat().forEach((k) => k && g.add(k)); return g; }
const BOX = (w, h, d, m) => mesh(new T.BoxGeometry(w, h, d), m);
const CYL = (rt, rb, h, m, s = 28, open = false, ts, tl) => mesh(new T.CylinderGeometry(rt, rb, h, s, 1, open, ts, tl), open ? DS(m) : m);
const SPH = (r, m, ws = 28, hs = 18) => mesh(new T.SphereGeometry(r, ws, hs), m);
const DOME = (r, m, frac = .5) => mesh(new T.SphereGeometry(r, 36, 18, 0, Math.PI * 2, 0, Math.PI * frac), DS(m));
const TOR = (R, r, m, arc = Math.PI * 2, rs = 12, ts = 48) => mesh(new T.TorusGeometry(R, r, rs, ts, arc), m);
const CONE = (r, h, m, s = 24) => mesh(new T.ConeGeometry(r, h, s), m);
const V = (x, y, z) => new T.Vector3(x, y, z);
function curve(pts, closed = false) { return new T.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V(p[0], p[1], p[2]))), closed); }
function TUBE(pts, r, m, closed = false, seg = 48) { return mesh(new T.TubeGeometry(curve(pts, closed), seg, r, 10, closed), m); }
// Tube whose radius shrinks from r0 to r1 along the path (horns, toes, tails, tassels)
function TAPER(pts, r0, r1, m, seg = 40, rad = 14) {
  const path = curve(pts);
  const g = new T.TubeGeometry(path, seg, 1, rad, false);
  const pos = g.attributes.position;
  for (let i = 0; i <= seg; i++) {
    const c = path.getPointAt(i / seg); const rr = r0 + (r1 - r0) * (i / seg);
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * rr, c.y + (pos.getY(k) - c.y) * rr, c.z + (pos.getZ(k) - c.z) * rr);
    }
  }
  g.computeVertexNormals();
  return mesh(g, m);
}
function LATHE(pts, m, seg = 40) { return mesh(new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg), DS(m)); }
function shapeFrom(pts) { const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return s; }
function EXTRUDE(pts, depth, m, holeScale) {
  const s = shapeFrom(pts);
  if (holeScale) { const h = new T.Path(); pts.slice().reverse().forEach(([x, y], i) => (i ? h.lineTo(x * holeScale, y * holeScale) : h.moveTo(x * holeScale, y * holeScale))); s.holes.push(h); }
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -depth / 2);
  return mesh(g, m);
}
function FLAT(pts, m) { return mesh(new T.ShapeGeometry(shapeFrom(pts)), DS(m)); }
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function aimZ(obj, dir) { obj.quaternion.setFromUnitVectors(V(0, 0, 1), dir.clone().normalize()); }
function aimY(obj, dir) { obj.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize()); }

// 2D point sets for lens/rim shapes
const P2 = {
  circle: (r, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r]; }),
  rrect: (w, h, r, n = 8) => {
    const out = []; const cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 1], [-w / 2 + r, -h / 2 + r, 2], [w / 2 - r, -h / 2 + r, 3]];
    cs.forEach(([cx, cy, q]) => { for (let i = 0; i <= n; i++) { const a = (q + i / n) * Math.PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
    return out;
  },
  aviator: (n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; let x = .17 * Math.cos(a), y = .12 * Math.sin(a); if (y < 0) { y = .165 * Math.sin(a); x *= 1 - .18 * Math.sin(a) * (Math.cos(a) < 0 ? 1 : -.4); } return [x, y + .01]; }),
  cat: (n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; const x = .17 * Math.cos(a); let y = .11 * Math.sin(a); if (x > .03 && y > -.02) y += .075 * Math.pow(x / .17, 2); return [x, y]; }),
  heart: (s = .0105, n = 48) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return [s * 16 * Math.pow(Math.sin(t), 3), s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + .01]; }),
  almond: (w, h, n = 40) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [w * Math.cos(a), h * Math.sin(a) * Math.abs(Math.cos(a * .5) + .35)]; }),
  angular: () => [[-.17, .1], [.12, .1], [.2, .16], [.18, -.02], [.1, -.12], [-.12, -.12], [-.18, -.04]]
};

// ---------- head profile ----------
const HEAD_PROFILE = [[0.001, 1.05], [.16, 1.18], [.4, 1.4], [.6, 1.66], [.73, 1.94], [.76, 2.18], [.69, 2.42], [.52, 2.6], [.28, 2.69], [0.001, 2.72]];
const PROF = new T.SplineCurve(HEAD_PROFILE.map(([r, y]) => new T.Vector2(r, y))).getPoints(70);
function rAt(y) { for (let i = 0; i < PROF.length - 1; i++) { const a = PROF[i], b = PROF[i + 1]; if (y >= a.y && y <= b.y) { return a.x + (b.x - a.x) * ((y - a.y) / ((b.y - a.y) || 1)); } } return 0; }
function onFace(y, phi, out = 0) { const r = rAt(y) + out; return V(r * Math.sin(phi), y, r * Math.cos(phi)); }
const EYE_Y = 1.95, BR = .78;
const BOOT_H = .26;        // tall boots reach this high (a third of the leg)
const LEG = BOOT_H * 3, LIFT = LEG - .1;   // Whisk always stands on legs
const LOW_H = .15;         // low shoes stay at the foot
const FOOT_L = .42;        // every shoe is sized to this foot length
const GLASSES_GAP = .1;    // glasses hover this far in front of the face

// ---------- poses ----------
// arm control points: [shoulder, elbow, hand]
const POSES = {
  default: { L: [[-.16, .84, 0], [-.46, .68, .1], [-.64, .6, .18]], R: [[.16, .84, 0], [.52, .95, .06], [.68, 1.34, .1]],
             hat: { p: [-.05, 2.27, 0], r: [0, 0, .3] }, head: [0, 0, 0], wave: 1 },
  cooked:  { L: [[-.16, .84, 0], [-.5, 1.02, .06], [-.64, 1.44, .1]], R: [[.16, .84, 0], [.5, 1.02, .06], [.64, 1.44, .1]],
             hat: { p: [0, 2.42, -.02], r: [-.12, 0, -.1] }, head: [-.08, 0, 0], wave: 0 },
  back:    { L: [[-.16, .84, 0], [-.5, .66, .14], [-.78, .5, .2]], R: [[.16, .84, 0], [.5, .66, .14], [.78, .5, .2]],
             hat: { p: [0, 1.9, .02], r: [.06, 0, 0] }, head: [.06, 0, 0], wave: 0 },
  late:    { L: [[-.16, .84, 0], [-.42, .66, .2], [-.46, .7, .38]], R: [[.16, .84, 0], [.34, .58, .06], [.42, .3, .1]],
             hat: { p: [-.04, 2.24, 0], r: [-.08, 0, .26] }, head: [.1, 0, .06], wave: 0 }
};
const POSE_TITLES = { cooked: 'Cooked it!', back: 'We’re so back!', late: 'Late night snack...' };

// static anchor spots (used for thumbnails and as the rest position on the character)
const ANCHOR_REST = {
  neck: [0, 1.0, 0], chest: [0, .86, .24], back: [0, .74, -.24], waist: [0, .5, 0], hipL: [-.27, .44, .06], hipR: [.27, .44, .06], float: [0, 0, 0]
};

// ---------- the character ----------
class Whisk {
  constructor() {
    this.root = new T.Group();
    this.body = new T.Group(); this.root.add(this.body);
    this.head = new T.Group(); this.body.add(this.head);
    this.ticks = []; this.slotTicks = { top: [], hat: [], glasses: [], shoes: [], acc: [] };
    this.parts = { top: [], hat: [], glasses: [], shoes: [], acc: [] };
    this.top = null; this.handItem = null; this.hideFeet = false;
    this.pose = 'default';
    this.cur = this._copyPose(POSES.default); this.goal = this._copyPose(POSES.default);
    this.anchors = {};
    this._buildBody(); this._buildHead(); this._buildAnchors();
    this.arm = { L: null, R: null }; this.sleeve = { L: null, R: null }; this.cuff = { L: null, R: null };
    this.equipDefaultHat();
    this.setPose('default', true);
  }
  _copyPose(p) { return { L: p.L.map((v) => V(...v)), R: p.R.map((v) => V(...v)), hatP: V(...p.hat.p), hatR: V(...p.hat.r), head: V(...p.head) }; }
  _buildBody() {
    const b = this.body;
    const handleM = M(HANDLE, { roughness: .35 });
    this.handle = at(CYL(.15, .15, .76, handleM, 28), 0, .62, 0); b.add(this.handle);
    b.add(at(SPH(.15, handleM), 0, .24, 0));
    b.add(at(TOR(.17, .055, metal()), 0, 1.02, 0, Math.PI / 2));
    const legM = M(INK, { roughness: .5 });
    [-1, 1].forEach((side) => b.add(at(CYL(.045, .05, LEG, legM, 16), side * .1, -LIFT + LEG / 2 + .02, 0)));
    this.feet = G(
      at(SPH(.11, M(INK, { roughness: .6 })), -.11, .055, .04, 0, 0, 0, [1, .5, 1.45]),
      at(SPH(.11, M(INK, { roughness: .6 })), .11, .055, .04, 0, 0, 0, [1, .5, 1.45]));
    this.feet.position.y = -LIFT; this.lift = LIFT;
    b.add(this.feet);
    this.handL = SPH(.085, M(CREAM, { roughness: .7 })); this.handR = SPH(.085, M(CREAM, { roughness: .7 }));
    b.add(this.handL, this.handR);
  }
  _buildHead() {
    const h = this.head;
    // balloon of steel wires
    // see-through like a real whisk: only a faint glassy hint between the wires
    const shell = mesh(new T.LatheGeometry(PROF.map((p) => new T.Vector2(p.x * .965, p.y)), 56), new T.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: .07, roughness: .1, metalness: 0, depthWrite: false, side: T.DoubleSide }));
    shell.renderOrder = 2; h.add(shell);
    const wireM = metal(0xB8C1CC, .25);
    const step = PROF.filter((_, i) => i % 3 === 0 || i === PROF.length - 1);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a);
      const pts = [];
      step.forEach((p) => pts.push(V(p.x * ca, p.y, p.x * sa)));
      step.slice(1, -1).reverse().forEach((p) => pts.push(V(-p.x * ca, p.y, -p.x * sa)));
      h.add(mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 120, .02, 8, true), wireM));
    }
    // faces
    this.faces = {};
    const eyeWhite = M(0xFFFFFF, { roughness: .3 }), pupilM = M(0x1E1A26, { roughness: .2 }), hiM = M(0xFFFFFF, { emissive: 0xFFFFFF, emissiveIntensity: .4 });
    const blushM = M(0xFF9C8A, { transparent: true, opacity: .75, roughness: .9 });
    const inkM = M(INK, { roughness: .5 });
    const eye = (y, phi, look = [0, 0]) => {
      const g = new T.Group(); g.position.copy(onFace(y, phi, -.02)); g.rotation.y = phi;
      g.add(at(SPH(.15, eyeWhite), 0, 0, 0, 0, 0, 0, [1, 1.12, .5]));
      g.add(at(SPH(.08, pupilM), look[0], look[1], .06, 0, 0, 0, [1, 1, .55]));
      g.add(at(SPH(.028, hiM), look[0] + .035, look[1] + .04, .1));
      return g;
    };
    const blush = (y, phi) => { const d = mesh(new T.CircleGeometry(.085, 24), blushM); d.position.copy(onFace(y, phi, .006)); d.rotation.y = phi; d.scale.set(1.3, .75, 1); return d; };
    const mouthCurve = (y, p0, p1, dip, out = .012) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(onFace(y - dip * Math.sin(Math.PI * t), p0 + (p1 - p0) * t, out)); } return pts; };
    // default: curious, one eye peeking under the hat, tongue out
    const fd = new T.Group();
    fd.add(eye(EYE_Y + .02, .33, [.02, -.03]), eye(EYE_Y - .02, -.33, [.03, -.05]));
    fd.add(blush(1.7, -.48), blush(1.72, .5));
    fd.add(TUBE(mouthCurve(1.6, -.2, .22, .05), .022, inkM));
    fd.add(at(SPH(.05, M(0xFF7A6B, { roughness: .4 })), 0, 0, 0, 0, 0, 0, [1, 1.2, .6])); fd.children[fd.children.length - 1].position.copy(onFace(1.55, .16, 0));
    this.eyeGroups = [fd.children[0], fd.children[1]];
    // cooked: happy closed eyes, big open smile
    const fc = new T.Group();
    [[-.33, EYE_Y], [.33, EYE_Y]].forEach(([phi, y]) => { const a = TOR(.085, .022, inkM, Math.PI); a.position.copy(onFace(y - .04, phi, .02)); a.rotation.y = phi; fc.add(a); });
    fc.add(blush(1.72, -.48), blush(1.72, .5));
    const om = SPH(.15, M(0x7A2B2B, { roughness: .6 })); om.position.copy(onFace(1.6, 0, -.05)); om.scale.set(1.25, .7, .45); fc.add(om);
    const tg = SPH(.07, M(0xFF7A6B)); tg.position.copy(onFace(1.55, .03, -.02)); tg.scale.set(1.3, .6, .5); fc.add(tg);
    // back: wobbly mouth (hat covers eyes)
    const fb = new T.Group();
    fb.add(blush(1.7, -.5), blush(1.7, .5));
    const wob = []; for (let i = 0; i <= 16; i++) { const t = i / 16; wob.push(onFace(1.56 + .035 * Math.sin(t * Math.PI * 3), -.22 + .44 * t, .012)); }
    fb.add(TUBE(wob, .02, inkM));
    // late: sleepy lids, small smile
    const fl = new T.Group();
    [-.33, .33].forEach((phi) => { const a = TOR(.08, .02, inkM, Math.PI); a.position.copy(onFace(EYE_Y - .02, phi, .02)); a.rotation.set(0, phi, Math.PI); fl.add(a);
      const lid = TOR(.08, .014, inkM, Math.PI * .9); lid.position.copy(onFace(EYE_Y + .05, phi, .02)); lid.rotation.set(0, phi, Math.PI * 1.05); fl.add(lid); });
    fl.add(blush(1.7, .5));
    fl.add(TUBE(mouthCurve(1.6, -.1, .12, .025), .02, inkM));
    this.faces = { default: fd, cooked: fc, back: fb, late: fl };
    Object.values(this.faces).forEach((f) => h.add(f));
    // anchors living on the head
    this.hatAnchor = new T.Group(); h.add(this.hatAnchor);
    this.headTop = new T.Group(); this.headTop.position.set(0, 2.72, 0); h.add(this.headTop);
    this.faceAnchor = new T.Group(); this.faceAnchor.position.set(0, EYE_Y, 0); h.add(this.faceAnchor);
    this.headAnchor = new T.Group(); h.add(this.headAnchor);
  }
  _buildAnchors() {
    Object.entries(ANCHOR_REST).forEach(([k, p]) => { const g = new T.Group(); g.position.set(...p); this.body.add(g); this.anchors[k] = g; });
    ['handL', 'handR', 'wristL', 'wristR'].forEach((k) => { const g = new T.Group(); this.body.add(g); this.anchors[k] = g; });
    this.anchors.hat = this.hatAnchor; this.anchors.headTop = this.headTop; this.anchors.face = this.faceAnchor; this.anchors.head = this.headAnchor;
    this.anchors.feet = this.body; this.anchors.body = this.body;
    this.spoon = this._spoon(); this.toast = this._toast(); this.anchors.handL.add(this.spoon, this.toast);
  }
  _spoon() { const g = G(at(CYL(.022, .026, .7, M(0xC08A52, { roughness: .6 })), 0, .25, 0), at(SPH(.09, M(0xD49A5C, { roughness: .55 })), 0, -.13, 0, 0, 0, 0, [1, 1.35, .5])); g.rotation.z = 2.2; return g; }
  _toast() {
    const crust = M(0xC98B45, { roughness: .8 }), bread = M(0xF7DDA6, { roughness: .9 });
    const g = G(at(BOX(.34, .32, .07, crust), 0, .05, 0), at(BOX(.27, .25, .072, bread), 0, .05, .002), at(SPH(.04, M(0xF4C93A, { roughness: .3 })), .05, .1, .04, 0, 0, 0, [1.4, .6, .3]));
    g.rotation.set(-.4, .3, .2); g.position.set(0, .06, .05); return g;
  }
  setPose(name, instant) {
    this.pose = name; this.goal = this._copyPose(POSES[name]);
    Object.entries(this.faces).forEach(([k, f]) => (f.visible = k === name));
    if (instant) this.cur = this._copyPose(POSES[name]);
    this._refreshHandDefaults();
  }
  _refreshHandDefaults() {
    const holding = !!this.handItem;
    // Hands stay empty unless an accessory is equipped.
    this.spoon.visible = false;
    this.toast.visible = false;
  }
  equipDefaultHat() { this.clearSlot('hat'); const g = classicToque(); this.hatAnchor.add(g); this.parts.hat = [g]; this.defaultHat = true; }
  clearSlot(slot) {
    this.parts[slot].forEach((o) => o.parent && o.parent.remove(o));
    this.parts[slot] = []; this.slotTicks[slot] = [];
    if (slot === 'top') { this.top = null; this._rebuildArms(true); }
    if (slot === 'shoes') { this.feet.visible = true; }
    if (slot === 'acc') { this.handItem = null; this._refreshHandDefaults(); }
  }
  equip(slot, item) {
    this.clearSlot(slot);
    if (!item) { if (slot === 'hat') this.equipDefaultHat(); return; }
    const ctx = { tick: (fn) => this.slotTicks[slot].push(fn), side: 1, thumb: false };
    if (slot === 'top') {
      const spec = item.build(ctx); this.top = spec;
      const torso = makeTorso(spec); this.body.add(torso); this.parts.top.push(torso);
      (spec.extras ? spec.extras(ctx) : []).forEach(({ a, o }) => { this.anchors[a].add(o); this.parts.top.push(o); });
      this._rebuildArms(true);
    } else if (slot === 'shoes') {
      this.feet.visible = false;
      const built = [-1, 1].map((side) => [side, item.build(Object.assign({}, ctx, { side }))]);
      // Every shoe is sized to the foot; tall boots reach a third of the way up the leg, low shoes stay at the foot.
      const size = new T.Box3().setFromObject(built[0][1]).getSize(V());
      const k = FOOT_L / size.z, hb = item.tall ? BOOT_H : Math.min(size.y * k, LOW_H), ky = hb / (size.y * k);
      built.forEach(([side, s]) => { s.scale.set(k, k * ky, k); s.position.set(side * .11, s.position.y - LIFT, s.position.z + .02); this.body.add(s); this.parts.shoes.push(s); });
    } else {
      const parts = item.build(ctx);
      (Array.isArray(parts) ? parts : [{ a: slot === 'hat' ? 'hat' : 'face', o: parts }]).forEach(({ a, o, grip }) => {
        if (slot === 'glasses' && a === 'face') { const hover = G(o); hover.position.z = GLASSES_GAP; o = hover; }   // float a little off the face
        this.anchors[a].add(o); this.parts[slot].push(o);
        if (a === 'handL' || a === 'handR') { this.handItem = { o, grip: grip || 'hold', a }; }
      });
      if (slot === 'acc') this._refreshHandDefaults();
    }
  }
  _armCurve(pts) { return new T.CatmullRomCurve3(pts); }
  _rebuildArms() {
    const top = this.top;
    ['L', 'R'].forEach((s) => {
      const c = this._armCurve(this.cur[s]);
      if (this.arm[s]) { this.arm[s].geometry.dispose(); this.body.remove(this.arm[s]); }
      this.arm[s] = mesh(new T.TubeGeometry(c, 28, .042, 8, false), M(INK, { roughness: .5 })); this.body.add(this.arm[s]);
      const hand = s === 'L' ? this.handL : this.handR; hand.position.copy(c.getPoint(1));
      ['sleeve', 'cuff'].forEach((k) => { if (this[k][s]) { this[k][s].traverse((o) => o.geometry && o.geometry.dispose()); this.body.remove(this[k][s]); this[k][s] = null; } });
      if (top && top.sleeve > 0) {
        const n = 24, pts = []; for (let i = 0; i <= n; i++) pts.push(c.getPoint(i / n * top.sleeve));
        const sc = new T.CatmullRomCurve3(pts);
        const r = top.sleeveR || .078;
        const sm = top.sleeveMat || top.mat;
        this.sleeve[s] = mesh(new T.TubeGeometry(sc, 20, r, 14, false), sm); this.body.add(this.sleeve[s]);
        const end = sc.getPoint(1), tan = sc.getTangent(1);
        const cuffG = new T.Group(); cuffG.position.copy(end); aimZ(cuffG, tan);
        if (top.flare) cuffG.add(at(mesh(new T.CylinderGeometry(r * top.flare, r, .13, 20, 1, true), sm), 0, 0, .04, Math.PI / 2));
        else cuffG.add(TOR(r + .004, top.cuffR || .017, top.cuffMat || sm));
        cuffG.add(at(CYL(r * .98, r * .98, .01, M(INK)), 0, 0, -.001, Math.PI / 2));
        this.cuff[s] = cuffG; this.body.add(cuffG);
      }
      // wrist + hand anchors
      const w = this.anchors['wrist' + s]; w.position.copy(c.getPoint(.86)); aimZ(w, c.getTangent(.86));
      const ha = this.anchors['hand' + s]; ha.position.copy(c.getPoint(1));
      const dir = c.getPoint(1).clone().sub(c.getPoint(0)).normalize();
      const hold = this.handItem && this.handItem.a === 'hand' + s ? this.handItem.grip : 'hold';
      if (hold === 'hang') ha.quaternion.identity();
      else { aimY(ha, V(dir.x * .55, 1, dir.z * .4 + .15)); }
    });
  }
  update(t, dt) {
    const k = Math.min(1, dt * 7);
    ['L', 'R'].forEach((s) => this.cur[s].forEach((v, i) => v.lerp(this.goal[s][i], k)));
    this.cur.hatP.lerp(this.goal.hatP, k); this.cur.hatR.lerp(this.goal.hatR, k); this.cur.head.lerp(this.goal.head, k);
    // idle: wave, bob, blink
    const wave = POSES[this.pose].wave ? Math.sin(t * 3.2) * .08 : 0;
    const R = this.cur.R; const saveR = R[2].clone(); R[2].x += wave; R[2].y += Math.abs(wave) * .6;
    this._rebuildArms();
    R[2].copy(saveR);
    this.hatAnchor.position.copy(this.cur.hatP); this.hatAnchor.rotation.set(this.cur.hatR.x, this.cur.hatR.y, this.cur.hatR.z + Math.sin(t * 1.7) * .02);
    this.head.rotation.set(this.cur.head.x, this.cur.head.y, this.cur.head.z);
    this.head.position.set(0, 0, 0);
    const bob = this.pose === 'cooked' ? Math.abs(Math.sin(t * 5)) * .07 : Math.sin(t * 1.6) * .015;
    this.body.position.y = bob + (this.lift || 0);
    const blink = (t % 3.6) < .12 ? .12 : 1;
    this.eyeGroups.forEach((e) => (e.scale.y = blink));
    Object.values(this.slotTicks).forEach((arr) => arr.forEach((fn) => fn(t, dt)));
  }
}

// torso for any top; spec from the item list
const TORSO_LEN = { shirt: [.4, 1.0, .205, .235], jacket: [.32, 1.0, .21, .255], coat: [.16, 1.0, .21, .3], robe: [.13, 1.0, .21, .37] };
function makeTorso(spec) {
  const [y0, y1, rt, rb] = TORSO_LEN[spec.len || 'shirt'];
  const g = new T.Group();
  const tex = spec.tex ? canvasTex(512, 256, (c, w, h) => { c.fillStyle = spec.base; c.fillRect(0, 0, w, h); spec.tex(c, w, h); }) : null;
  const opts = Object.assign({ roughness: .8 }, spec.matOpts || {}, tex ? { map: tex, color: 0xFFFFFF } : {});
  const mat = new T.MeshStandardMaterial(Object.assign({ color: spec.color }, opts)); mat.side = T.DoubleSide;
  spec.mat = spec.mat || new T.MeshStandardMaterial(Object.assign({ color: spec.color, roughness: .8 }, spec.matOpts || {}));
  spec.mat.side = T.DoubleSide;
  if (spec.sleeveColor) { spec.sleeveMat = new T.MeshStandardMaterial(Object.assign({ color: spec.sleeveColor, roughness: .8 }, spec.matOpts || {})); spec.sleeveMat.side = T.DoubleSide; }
  spec.torsoMat = mat;
  const body = mesh(new T.CylinderGeometry(rt, rb, y1 - y0, 48, 4, true, Math.PI, Math.PI * 2), mat);
  body.position.y = (y0 + y1) / 2; g.add(body);
  const sh = mesh(new T.CylinderGeometry(.125, rt, .1, 48, 1, true), DS(spec.mat)); sh.position.y = y1 + .05; g.add(sh);
  g.add(at(TOR(rb, .016, spec.hemMat || spec.mat), 0, y0, 0, Math.PI / 2));
  if (spec.collar) g.add(spec.collar());
  return g;
}

// the classic toque Whisk wears when the hat slot is empty
function classicToque() {
  const w = M(0xFFFFFF, { roughness: .7 });
  const g = G(
    at(CYL(BR, BR, .26, w, 40, true), 0, .13, 0),
    at(SPH(.42, w), -.38, .52, 0), at(SPH(.5, w), 0, .66, 0), at(SPH(.42, w), .38, .52, 0), at(SPH(.4, w), 0, .5, -.3), at(SPH(.4, w), 0, .5, .28),
    at(SPH(.08, M(0xE8622F, { roughness: .4 })), .34, .78, .3, 0, 0, 0, [1.2, .5, 1])
  );
  return g;
}
// ---------- TOPS (21) ----------
// spec: base/color, tex (front centered at x=256), sleeve (0 none … 1 full arm), len, extras → parts on anchors
function txt(c, s, x, y, size, fill, stroke) { c.font = `700 ${size}px Fredoka, Nunito, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; if (stroke) { c.lineWidth = size / 6; c.strokeStyle = stroke; c.strokeText(s, x, y); } c.fillStyle = fill; c.fillText(s, x, y); }
function dots(c, xs, y0, y1, step, r, fill) { c.fillStyle = fill; xs.forEach((x) => { for (let y = y0; y <= y1; y += step) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }); }
function stripeH(c, y, h, fill, w = 512) { c.fillStyle = fill; c.fillRect(0, y, w, h); }
function pocket(c, x, y, w, h, fill, line) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeStyle = line; c.lineWidth = 3; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x - 3, y + 16); c.lineTo(x + w + 3, y + 16); c.stroke(); }
function zipper(c, x = 256, fill = '#C9D1DB') { c.strokeStyle = fill; c.lineWidth = 4; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }
function collarRing(color, R = .135, r = .035, y = 1.08) { return () => at(TOR(R, r, M(color, { roughness: .7 })), 0, y, 0, Math.PI / 2); }

function capeMesh(len, width, mat, ctx, wave = .035) {
  const geo = new T.PlaneGeometry(width, len, 12, 18);
  const pos = geo.attributes.position; const base = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const u = x / (width / 2); const v = (len / 2 - y) / len; // 0 top → 1 bottom
    const flare = 1 + v * .35;
    const nx = x * flare, nz = -Math.sqrt(Math.max(0, 1 - u * u * .6)) * .22 - v * .18;
    pos.setXYZ(i, nx, y - len / 2, nz); base.push([nx, y - len / 2, nz, v]);
  }
  geo.computeVertexNormals();
  const m = mesh(geo, DS(mat));
  if (ctx && !ctx.thumb) ctx.tick((t) => { for (let i = 0; i < pos.count; i++) { const [x, y, z, v] = base[i]; pos.setZ(i, z - Math.sin(t * 2.2 + v * 5 + x * 2) * wave * v); } pos.needsUpdate = true; geo.computeVertexNormals(); });
  return m;
}
function flameCone(ctx, color, s = 1) {
  const f = G(at(CONE(.05 * s, .16 * s, glow(color, 1.6), 10), 0, .08 * s, 0), at(CONE(.028 * s, .1 * s, glow(0xFFF3A0, 2), 10), 0, .06 * s, .01));
  if (ctx && !ctx.thumb) { const ph = Math.random() * 6; ctx.tick((t) => { const k = .75 + .35 * Math.sin(t * 18 + ph) * Math.sin(t * 7 + ph); f.scale.set(1, k, 1); }); }
  return f;
}

const TOPS = [
  { name: 'White Chef Coat', build: () => ({ base: '#F6F6F2', color: 0xF6F6F2, sleeve: .82, len: 'jacket',
      tex: (c) => { dots(c, [226, 286], 40, 190, 34, 8, '#2A2433'); c.strokeStyle = '#D8D8D2'; c.lineWidth = 3; c.beginPath(); c.moveTo(196, 0); c.lineTo(196, 256); c.stroke(); txt(c, 'whisk', 330, 60, 22, '#4E9A2F'); },
      collar: collarRing(0xF6F6F2, .14, .045) }) },
  { name: 'Polo Shirt', build: () => ({ base: '#2E5AAC', color: 0x2E5AAC, sleeve: .34, sleeveR: .085,
      tex: (c) => { c.fillStyle = '#3A68BC'; c.fillRect(242, 0, 28, 80); dots(c, [256], 22, 64, 26, 5, '#F2F2EE'); c.fillStyle = '#F4C93A'; c.beginPath(); c.arc(320, 56, 10, 0, 7); c.fill(); },
      collar: () => G(at(BOX(.13, .03, .1, M(0x2E5AAC, { roughness: .8 })), -.07, 1.07, .1, .5, 0, .35), at(BOX(.13, .03, .1, M(0x2E5AAC, { roughness: .8 })), .07, 1.07, .1, .5, 0, -.35), at(TOR(.13, .03, M(0x2E5AAC, { roughness: .8 })), 0, 1.07, 0, Math.PI / 2)) }) },
  { name: 'Lifeguard Shirt', build: () => ({ base: '#E2342A', color: 0xE2342A, sleeve: .3,
      tex: (c) => { c.fillStyle = '#FFFFFF'; c.fillRect(244, 34, 24, 70); c.fillRect(221, 57, 70, 24); txt(c, 'LIFEGUARD', 256, 150, 34, '#FFFFFF'); } , collar: collarRing(0xE2342A) }) },
  { name: 'Hawaiian Shirt', build: () => ({ base: '#1E9C8E', color: 0x1E9C8E, sleeve: .32, sleeveR: .088,
      tex: (c) => { const r = rng(7); for (let i = 0; i < 26; i++) { const x = r() * 512, y = r() * 256; c.fillStyle = '#2F6E3A'; c.beginPath(); c.ellipse(x + 14, y + 10, 18, 7, r() * 3, 0, 7); c.fill();
        const col = ['#FF6B57', '#F4C93A', '#FFFFFF', '#F49AC1'][i % 4]; c.fillStyle = col; for (let p = 0; p < 5; p++) { c.beginPath(); c.arc(x + Math.cos(p * 1.26) * 9, y + Math.sin(p * 1.26) * 9, 8, 0, 7); c.fill(); } c.fillStyle = '#F4C93A'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
        c.strokeStyle = '#167A6F'; c.lineWidth = 3; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 256); c.stroke(); dots(c, [266], 40, 230, 46, 5, '#F2E6CF'); },
      collar: () => G(at(BOX(.15, .025, .12, M(0x1E9C8E, { roughness: .8 })), -.08, 1.03, .13, .9, 0, .5), at(BOX(.15, .025, .12, M(0x1E9C8E, { roughness: .8 })), .08, 1.03, .13, .9, 0, -.5)) }) },
  { name: 'Basketball Jersey', build: () => ({ base: '#E8781F', color: 0xE8781F, sleeve: 0, len: 'shirt',
      tex: (c) => { stripeH(c, 0, 10, '#FFFFFF'); c.fillStyle = '#FFFFFF'; c.fillRect(120, 0, 14, 256); c.fillRect(378, 0, 14, 256); txt(c, 'WHISK', 256, 58, 30, '#FFFFFF'); txt(c, '07', 256, 140, 92, '#FFFFFF', '#23301F'); },
      collar: collarRing(0xFFFFFF, .14, .03) }) },
  { name: 'Construction Vest', build: () => ({ base: '#FF7A1A', color: 0xFF7A1A, sleeve: 0, matOpts: { roughness: .6 },
      tex: (c) => { const ref = (y) => { c.fillStyle = '#D9DEE3'; c.fillRect(0, y, 512, 22); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, y + 4, 512, 5); }; ref(120); ref(186); c.fillStyle = '#D9DEE3'; c.fillRect(206, 0, 20, 120); c.fillRect(286, 0, 20, 120); zipper(c, 256, '#B85A10'); },
      extras: () => [{ a: 'neck', o: at(TOR(.15, .04, M(0x777E86, { roughness: .8 })), 0, .02, 0, Math.PI / 2) }] }) },
  // rare
  { name: 'Varsity Jacket', build: () => ({ base: '#7A1F2B', color: 0x7A1F2B, sleeve: .86, sleeveColor: 0xF2E6CF, len: 'jacket', cuffMat: M(0x7A1F2B), cuffR: .025,
      tex: (c) => { for (let i = 0; i < 4; i++) stripeH(c, 216 + i * 10, 5, i % 2 ? '#F2E6CF' : '#7A1F2B'); stripeH(c, 216, 40, 'rgba(0,0,0,0)'); for (let i = 0; i < 5; i++) stripeH(c, 222 + i * 7, 3, '#F2E6CF');
        txt(c, 'W', 316, 80, 70, '#F2E6CF', '#4A0F18'); dots(c, [256], 24, 200, 36, 6, '#F2E6CF'); },
      collar: collarRing(0x7A1F2B, .14, .045) }) },
  { name: 'Trench Vest', build: () => ({ base: '#C9A66B', color: 0xC9A66B, sleeve: 0, len: 'coat',
      tex: (c) => { dots(c, [222, 290], 40, 120, 38, 7, '#5A3A1E'); c.strokeStyle = '#A88A55'; c.lineWidth = 3; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 256); c.stroke(); },
      extras: () => [{ a: 'waist', o: G(at(TOR(.262, .028, M(0x7A5A35, { roughness: .6 })), 0, .12, 0, Math.PI / 2), at(BOX(.08, .07, .02, metal(0xC9A15A)), 0, .12, .27)) }],
      collar: () => G(at(BOX(.16, .03, .12, M(0xC9A66B)), -.09, 1.03, .13, .9, 0, .5), at(BOX(.16, .03, .12, M(0xC9A66B)), .09, 1.03, .13, .9, 0, -.5)) }) },
  { name: 'Military Field Jacket', build: () => ({ base: '#5E6B3A', color: 0x5E6B3A, sleeve: .86, len: 'jacket',
      tex: (c) => { pocket(c, 186, 40, 52, 48, '#57643A', '#3E4826'); pocket(c, 274, 40, 52, 48, '#57643A', '#3E4826'); pocket(c, 180, 140, 58, 56, '#57643A', '#3E4826'); pocket(c, 274, 140, 58, 56, '#57643A', '#3E4826'); zipper(c, 256, '#3E4826'); },
      collar: collarRing(0x55602F, .14, .045),
      extras: () => [{ a: 'neck', o: G(at(BOX(.08, .025, .12, M(0x55602F)), -.19, -.02, 0, 0, 0, -.3), at(BOX(.08, .025, .12, M(0x55602F)), .19, -.02, 0, 0, 0, .3)) }] }) },
  { name: 'Puffer Jacket', build: () => ({ base: '#E2342A', color: 0xE2342A, sleeve: .86, sleeveR: .1, len: 'jacket', matOpts: { roughness: .35 },
      tex: (c) => { for (let y = 20; y < 256; y += 38) stripeH(c, y, 4, '#B8221A'); zipper(c, 256, '#2A2433'); },
      collar: collarRing(0xE2342A, .15, .06),
      extras: () => [{ a: 'waist', o: G([.0, .14, .28, .42].map((y, i) => at(TOR(.25 + i * -.008, .045, M(0xE2342A, { roughness: .35 })), 0, y - .14, 0, Math.PI / 2))) }] }) },
  { name: 'Fisherman Vest', build: () => ({ base: '#B49B6A', color: 0xB49B6A, sleeve: 0,
      tex: (c) => { [[176, 30], [282, 30], [170, 120], [222, 120], [282, 120], [334, 120]].forEach(([x, y]) => pocket(c, x, y, 46, 50, '#A88E5E', '#7A6440')); zipper(c, 256, '#7A6440'); c.strokeStyle = '#C9D1DB'; c.lineWidth = 4; c.beginPath(); c.arc(330, 30, 9, 0, 7); c.stroke(); } }) },
  // epic
  { name: 'Samurai Chest Armor', build: () => ({ base: '#8E1B1B', color: 0x8E1B1B, sleeve: 0, matOpts: { roughness: .3 },
      tex: (c) => { for (let y = 0; y < 256; y += 32) { stripeH(c, y, 3, '#3A0C0C'); dots(c, Array.from({ length: 26 }, (_, i) => i * 20 + 10), y + 16, y + 16, 1, 3, '#E0B12A'); } },
      extras: () => { const plate = (s) => G([0, 1, 2].map((i) => at(BOX(.26, .07, .05, M(0x8E1B1B, { roughness: .3 })), 0, -i * .075, 0, 0, 0, 0)), [0, 1, 2].map((i) => at(BOX(.27, .012, .055, metal(0xE0B12A)), 0, -i * .075 - .035, 0)));
        const L = plate(); at(L, -.3, .97, 0, 0, 0, .6); const R = plate(); at(R, .3, .97, 0, 0, 0, -.6); return [{ a: 'body', o: G(L, R) }]; } }) },
  { name: 'Pirate Captain Coat', build: () => ({ base: '#7A1C1C', color: 0x7A1C1C, sleeve: .86, len: 'coat', sleeveR: .085, flare: 1.55, cuffMat: M(0xE0B12A),
      tex: (c) => { c.fillStyle = '#F6F2E8'; c.fillRect(236, 0, 40, 256); for (let y = 10; y < 140; y += 22) { c.fillStyle = '#E6E0D2'; c.beginPath(); c.arc(256, y, 12, 0, Math.PI); c.fill(); } c.fillStyle = '#E0B12A'; c.fillRect(226, 0, 8, 256); c.fillRect(278, 0, 8, 256); dots(c, [214, 298], 30, 230, 40, 8, '#E0B12A'); stripeH(c, 244, 12, '#E0B12A'); },
      collar: () => at(TOR(.16, .05, M(0x7A1C1C)), 0, 1.05, 0, Math.PI / 2) }) },
  { name: 'Alchemist Coat', build: () => ({ base: '#1F4E4A', color: 0x1F4E4A, sleeve: .86, len: 'coat',
      tex: (c) => { c.strokeStyle = '#E0B12A'; c.lineWidth = 4; c.beginPath(); c.arc(256, 70, 30, 0, 7); c.stroke(); c.beginPath(); c.moveTo(256, 44); c.lineTo(282, 88); c.lineTo(230, 88); c.closePath(); c.stroke(); c.fillStyle = '#E0B12A'; c.fillRect(250, 0, 3, 256); },
      collar: collarRing(0x173A37, .15, .05),
      extras: () => { const vial = (x, col) => G(at(CYL(.03, .03, .1, glass(0xDDEEFF, .45)), 0, .05, 0), at(CYL(.026, .026, .055, glow(col, 1.1)), 0, .03, 0), at(CYL(.018, .018, .02, M(0x7A4A2A)), 0, .11, 0));
        const belt = G(at(TOR(.27, .028, M(0x5A3A1E, { roughness: .6 })), 0, 0, 0, Math.PI / 2), at(BOX(.07, .06, .02, metal(0xE0B12A)), 0, 0, .28));
        [[-.2, 0x8FD46A], [-.12, 0xFF6B57], [.14, 0x7EA6FF], [.21, 0xF4C93A]].forEach(([x, col]) => { const v = vial(x, col); const a = Math.atan2(x, .26); v.position.set(Math.sin(a) * .29, -.02, Math.cos(a) * .27); belt.add(v); });
        return [{ a: 'waist', o: at(belt, 0, .12, 0) }]; } }) },
  { name: 'Wizard Robe', build: () => ({ base: '#3B2A8B', color: 0x3B2A8B, sleeve: .82, sleeveR: .095, flare: 1.9, len: 'robe',
      tex: (c) => { const r = rng(3); for (let i = 0; i < 40; i++) { const x = r() * 512, y = r() * 240; const s = 4 + r() * 6; c.fillStyle = '#F4C93A'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? s * .45 : s; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
        c.fillStyle = '#F4C93A'; c.beginPath(); c.arc(300, 60, 14, 0, 7); c.fill(); c.fillStyle = '#3B2A8B'; c.beginPath(); c.arc(307, 55, 12, 0, 7); c.fill(); stripeH(c, 238, 18, '#E0B12A'); },
      collar: collarRing(0x2E2070, .15, .05) }) },
  { name: 'Knight Breastplate', build: () => ({ base: '#C9D1DB', color: 0xC9D1DB, sleeve: 0, matOpts: { metalness: .85, roughness: .28 },
      tex: (c) => { c.strokeStyle = '#7E8893'; c.lineWidth = 4; c.beginPath(); c.moveTo(256, 0); c.lineTo(256, 256); c.stroke(); [70, 150, 220].forEach((y) => { c.beginPath(); c.moveTo(130, y); c.quadraticCurveTo(256, y + 26, 382, y); c.stroke(); }); dots(c, [150, 362], 20, 240, 44, 5, '#5A636C'); },
      extras: () => [{ a: 'body', o: G(at(DOME(.17, metal(0xB8C1CC, .25), .5), -.25, .95, 0, 0, 0, .7, [1, .8, 1.1]), at(DOME(.17, metal(0xB8C1CC, .25), .5), .25, .95, 0, 0, 0, -.7, [1, .8, 1.1])) }] }) },
  { name: 'Bathrobe', build: () => ({ base: '#8FD0E8', color: 0x8FD0E8, sleeve: .8, sleeveR: .095, flare: 1.4, len: 'coat', matOpts: { roughness: 1 },
      tex: (c) => { const r = rng(11); for (let i = 0; i < 2600; i++) { c.fillStyle = r() > .5 ? 'rgba(255,255,255,.25)' : 'rgba(0,60,90,.08)'; c.fillRect(r() * 512, r() * 256, 3, 3); }
        c.fillStyle = '#B9E3F2'; c.beginPath(); c.moveTo(200, 0); c.lineTo(256, 150); c.lineTo(312, 0); c.lineTo(286, 0); c.lineTo(256, 100); c.lineTo(226, 0); c.fill(); pocket(c, 300, 160, 50, 46, '#86C6DE', '#6FB0C9'); },
      extras: () => [{ a: 'waist', o: G(at(TOR(.29, .03, M(0x6FB0C9, { roughness: 1 })), 0, .1, 0, Math.PI / 2), at(TUBE([[.06, .1, .29], [.1, 0, .31], [.12, -.18, .3]], .025, M(0x6FB0C9, { roughness: 1 })), 0, 0, 0), at(TUBE([[.06, .1, .29], [.02, -.02, .31], [-.01, -.2, .3]], .025, M(0x6FB0C9, { roughness: 1 })), 0, 0, 0)) }] }) },
  // exotic
  { name: 'Neon Holographic Jacket', build: (ctx) => { const mo = { roughness: .25, metalness: .3, emissive: 0x7A3FD0, emissiveIntensity: .5 };
      const spec = { base: '#1B1F3B', color: 0x2A2F5A, sleeve: .86, len: 'jacket', matOpts: mo,
        tex: (c) => { const g = c.createLinearGradient(0, 0, 512, 256); ['#FF5FD2', '#5FE1FF', '#9B6BFF', '#5FFFB0', '#FF5FD2'].forEach((col, i) => g.addColorStop(i / 4, col)); c.globalAlpha = .55; c.fillStyle = g; c.fillRect(0, 0, 512, 256); c.globalAlpha = 1; c.strokeStyle = '#E8FFFF'; c.lineWidth = 3; [140, 372].forEach((x) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); }); zipper(c, 256, '#E8FFFF'); },
        collar: collarRing(0x5FE1FF, .14, .04) };
      if (!ctx.thumb) ctx.tick((t) => { const h = (t * .08) % 1; [spec.mat, spec.torsoMat].forEach((m) => m && m.emissive && m.emissive.setHSL(h, .9, .45)); });
      return spec; } },
  { name: 'Levitating Panel Jacket', build: (ctx) => ({ base: '#E9EDF2', color: 0xE9EDF2, sleeve: .86, len: 'jacket', matOpts: { roughness: .35, metalness: .4 },
      tex: (c) => { c.strokeStyle = '#3AE0FF'; c.lineWidth = 3; const r = rng(5); for (let i = 0; i < 14; i++) { let x = r() * 512, y = r() * 256; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { if (k % 2) x += (r() - .5) * 120; else y += (r() - .5) * 90; c.lineTo(x, y); } c.stroke(); c.fillStyle = '#3AE0FF'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); } zipper(c, 256, '#9AA6B4'); },
      collar: collarRing(0xC9D1DB, .14, .04),
      extras: (ctx2) => { const g = new T.Group(); const panels = [];
        for (let i = 0; i < 6; i++) { const p = G(at(BOX(.2, .14, .015, metal(0xDDE3EA, .2)), 0, 0, 0), at(BOX(.21, .015, .02, glow(0x3AE0FF, 1.4)), 0, .075, 0), at(BOX(.21, .015, .02, glow(0x3AE0FF, 1.4)), 0, -.075, 0)); g.add(p); panels.push(p); }
        const place = (t) => panels.forEach((p, i) => { const a = i / 6 * Math.PI * 2 + t * .5; p.position.set(Math.sin(a) * .42, .7 + Math.sin(t * 2 + i) * .06 + (i % 2) * .18, Math.cos(a) * .42); p.rotation.y = a; });
        place(0); if (!ctx2.thumb) ctx2.tick((t) => place(t));
        return [{ a: 'float', o: g }]; } }) },
  { name: 'Living Alien Jacket', build: (ctx) => { const spec = { base: '#1D3A22', color: 0x2A5A2E, sleeve: .86, len: 'jacket', matOpts: { roughness: .45, emissive: 0x6CFF6A, emissiveIntensity: .25 },
      tex: (c) => { c.strokeStyle = '#8CFF6A'; c.lineWidth = 4; const r = rng(21); for (let i = 0; i < 18; i++) { c.beginPath(); let x = r() * 512, y = r() * 256; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - .5) * 90; y += (r() - .5) * 70; c.quadraticCurveTo(x + 20, y - 20, x, y); } c.stroke(); } c.fillStyle = '#B06BFF'; for (let i = 0; i < 30; i++) { c.beginPath(); c.arc(r() * 512, r() * 256, 4 + r() * 5, 0, 7); c.fill(); } },
      extras: (ctx2) => { const g = new T.Group(); const tendrils = [];
        [-1, 1].forEach((s) => [0, 1].forEach((k) => { const t = TAPER([[0, 0, 0], [s * .1, .15, -.05], [s * .18, .32, -.12], [s * .14, .48, -.2]], .045, .008, M(0x3E8A3A, { roughness: .4, emissive: 0x6CFF6A, emissiveIntensity: .3 })); const holder = G(t); holder.position.set(s * (.17 + k * .05), 1.0, -.08 - k * .06); g.add(holder); tendrils.push([holder, s, k]); }));
        if (!ctx2.thumb) ctx2.tick((t) => tendrils.forEach(([h, s, k]) => { h.rotation.z = Math.sin(t * 2 + k * 2) * .35 * s; h.rotation.x = Math.sin(t * 1.4 + k) * .2; }));
        return [{ a: 'body', o: g }]; } };
      if (!ctx.thumb) ctx.tick((t) => { const k = .2 + .25 * (1 + Math.sin(t * 2.4)) / 2; [spec.mat, spec.torsoMat].forEach((m) => m && (m.emissiveIntensity = k)); });
      return spec; } },
  // mythic
  { name: 'Phoenix Mantle', build: () => ({ base: '#8E1B10', color: 0xA3260F, sleeve: .5, sleeveR: .088, len: 'jacket', matOpts: { roughness: .5, emissive: 0x6A1500, emissiveIntensity: .35 },
      tex: (c) => { for (let row = 0; row < 9; row++) for (let i = 0; i < 18; i++) { const x = i * 30 + (row % 2) * 15, y = 256 - row * 30; const g = c.createLinearGradient(x, y - 30, x, y); g.addColorStop(0, '#FFD34D'); g.addColorStop(1, '#D23A10'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 14, 13, 22, 0, 0, 7); c.fill(); } },
      extras: (ctx2) => { const mantle = new T.Group();
        for (let i = 0; i < 14; i++) { const a = -Math.PI * .95 + i / 13 * Math.PI * 1.9; const f = CONE(.07, .34, M(i % 2 ? 0xFF8A1E : 0xFFC53A, { roughness: .4, emissive: 0xFF5A00, emissiveIntensity: .45 }), 8); f.position.set(Math.sin(a) * .3, -.08, Math.cos(a) * .26); f.rotation.set(Math.cos(a) * 2.6, 0, -Math.sin(a) * 2.6); mantle.add(f); }
        const capeTex = canvasTex(256, 512, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#FFB23A'); g.addColorStop(.45, '#E8481F'); g.addColorStop(1, '#5A0C06'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.globalAlpha = .35; for (let i = 0; i < 60; i++) { c.fillStyle = i % 2 ? '#FFE07A' : '#FF6A1E'; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 6, 20, 0, 0, 7); c.fill(); } });
        const cape = capeMesh(.95, .62, new T.MeshStandardMaterial({ map: capeTex, roughness: .6, emissive: 0x7A1A00, emissiveIntensity: .4 }), ctx2, .05);
        const capeG = G(cape); capeG.position.set(0, .04, -.05);
        const flames = new T.Group(); for (let i = 0; i < 16; i++) { const f = flameCone(ctx2, i % 3 ? 0xFF6A1E : 0xFFB23A, .8 + (i % 3) * .3); const a = -Math.PI * .9 + i / 15 * Math.PI * 1.8; f.position.set(Math.sin(a) * .34, -.02 + (i % 2) * .05, Math.cos(a) * .3); flames.add(f); }
        for (let i = 0; i < 8; i++) { const f = flameCone(ctx2, 0xFF6A1E, 1.1); f.position.set(-.3 + i * .085, -.92, -.42); flames.add(f); }
        return [{ a: 'neck', o: G(mantle, capeG, flames) }]; } }) }
];
// ---------- HATS (21) ----------  origin = band bottom on the head, band radius BR
const H = (o) => [{ a: 'hat', o }];
function brimHalf(r, depth, m) { const b = mesh(new T.CylinderGeometry(r, r, depth, 40, 1, false, -Math.PI / 2, Math.PI), m); return b; }
function knitTex(base, line) { return canvasTex(256, 128, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); c.strokeStyle = line; c.lineWidth = 3; for (let x = 0; x < w; x += 10) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }); }
function furTex(base, dark) { return canvasTex(256, 128, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 1800; i++) { c.strokeStyle = r() > .5 ? dark : 'rgba(255,255,255,.18)'; c.lineWidth = 2; const x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * 6, y + 6); c.stroke(); } }); }

const HATS = [
  { name: 'Baseball Cap', build: () => { const m = M(0x3D7BFF, { roughness: .7 }), w = M(0xFFFFFF, { roughness: .7 });
      return H(G(at(DOME(BR + .02, m), 0, 0, 0, 0, 0, 0, [1, .8, 1]), at(brimHalf(.66, .035, M(0x2A5FD0, { roughness: .6 })), 0, .03, .55, .14, 0, 0, [1, 1, 1.3]),
        at(SPH(.055, m), 0, .64, 0), at(mesh(new T.CircleGeometry(.17, 24), w), 0, .3, .72, -.4, 0, 0), at(TOR(.09, .02, M(PIST)), 0, .3, .735, -.4))); } },
  { name: 'Cowboy Hat', build: () => { const m = M(0x8B5A2B, { roughness: .75 });
      return H(G(LATHE([[.001, .52], [.25, .46], [.5, .58], [.62, .5], [.8, .1], [.82, 0]], m),
        at(LATHE([[.8, .02], [1.1, 0], [1.32, .06], [1.42, .2]], m, 48), 0, 0, 0, 0, 0, 0, [1, 1, 1.15]),
        at(TOR(.8, .035, M(0x3A2A1E)), 0, .07, 0, Math.PI / 2), at(BOX(.09, .07, .02, metal(0xC9D1DB)), 0, .07, .82))); } },
  { name: 'Chef Hat', build: () => { const w = M(0xFFFFFF, { roughness: .65 }); const g = G(at(CYL(BR, BR, .3, w, 40, true), 0, .15, 0), at(CYL(.95, .82, .6, w, 40, true), 0, .6, 0), at(SPH(.95, w), 0, .88, 0, 0, 0, 0, [1, .42, 1]));
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; g.add(at(BOX(.03, .58, .02, M(0xE6E8EC)), Math.sin(a) * .89, .6, Math.cos(a) * .89, 0, a, 0)); } return H(g); } },
  { name: 'Construction Helmet', build: () => { const y = M(0xF4C430, { roughness: .35 });
      return H(G(at(DOME(BR + .05, y), 0, 0, 0, 0, 0, 0, [1, .9, 1.04]), at(CYL(BR + .17, BR + .17, .04, y, 40), 0, .02, .04, 0, 0, 0, [1, 1, 1.08]),
        at(TOR(BR * .8, .05, y, Math.PI), 0, .05, 0, 0, Math.PI / 2, 0, [1, 1.05, 1]), at(mesh(new T.CircleGeometry(.12, 24), M(PIST)), .45, .45, .45, -.6, .8, 0))); } },
  { name: 'Beanie', build: () => { const tex = knitTex('#E2482F', 'rgba(0,0,0,.12)'); const m = new T.MeshStandardMaterial({ map: tex, roughness: 1 });
      return H(G(at(DOME(BR + .03, m), 0, .12, 0, 0, 0, 0, [1, 1, 1]), at(CYL(BR + .06, BR + .06, .26, new T.MeshStandardMaterial({ map: knitTex('#F2F2EE', 'rgba(0,0,0,.15)'), roughness: 1 }), 40, true), 0, .13, 0), at(SPH(.2, M(0xF2F2EE, { roughness: 1 })), 0, .98, 0))); } },
  { name: 'Boonie Hat', build: () => { const m = M(0x9C8F5E, { roughness: .9 });
      return H(G(at(CYL(.8, .84, .42, m, 40, true), 0, .21, 0), at(SPH(.8, m), 0, .42, 0, 0, 0, 0, [1, .28, 1]), LATHE([[.82, .04], [1.05, 0], [1.28, -.14]], m, 48),
        at(TOR(.84, .03, M(0x6E6440)), 0, .08, 0, Math.PI / 2))); } },
  // rare
  { name: 'Bike Helmet', build: () => { const m = M(0x8FD46A, { roughness: .3 }); const g = G(at(DOME(BR + .1, m), 0, 0, -.05, 0, 0, 0, [1, .78, 1.22]), at(brimHalf(.35, .03, M(INK)), 0, .1, .82, .3, 0, 0, [1, 1, .5]));
      [-.3, -.1, .1, .3].forEach((x) => g.add(at(BOX(.07, .05, .7, M(0x23301F)), x, .58 - Math.abs(x) * .45, -.05, 0, 0, 0)));
      [-1, 1].forEach((s) => g.add(TUBE([[s * .76, .05, .05], [s * .7, -.35, .25], [s * .3, -.72, .55]], .018, M(INK))));
      return H(g); } },
  { name: 'Sombrero', build: () => { const straw = M(0xE8C36A, { roughness: .9 });
      const bandTex = canvasTex(256, 32, (c, w, h) => { c.fillStyle = '#C8281E'; c.fillRect(0, 0, w, h); c.fillStyle = '#F4C93A'; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 8, 0); c.lineTo(x + 16, h); c.fill(); } c.fillStyle = '#2E7D4F'; c.fillRect(0, h - 5, w, 5); });
      const g = G(LATHE([[.001, .95], [.25, .9], [.44, .52], [.58, 0]], straw), at(CYL(.5, .55, .18, new T.MeshStandardMaterial({ map: bandTex, roughness: .8 }), 40, true), 0, .14, 0),
        LATHE([[.58, .02], [1.1, .05], [1.5, .16], [1.65, .34], [1.6, .4]], straw, 56));
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.add(at(SPH(.05, M(i % 2 ? 0xC8281E : 0x2E7D4F, { roughness: 1 })), Math.sin(a) * 1.62, .38, Math.cos(a) * 1.62)); }
      return H(g); } },
  { name: 'Winter Ear Flap Hat', build: () => { const tex = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#C8281E'; c.fillRect(0, 0, w, h); c.fillStyle = '#F2F2EE'; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 70); c.lineTo(x + 16, 54); c.lineTo(x + 32, 70); c.lineTo(x + 16, 86); c.fill(); } c.fillRect(0, 100, w, 8); c.fillRect(0, 30, w, 8); });
      const m = new T.MeshStandardMaterial({ map: tex, roughness: 1 }), wm = M(0xF2F2EE, { roughness: 1 });
      const g = G(at(DOME(BR + .04, m), 0, .06, 0), at(CYL(BR + .04, BR + .04, .12, m, 40, true), 0, .06, 0), at(SPH(.18, wm), 0, .9, 0));
      [-1, 1].forEach((s) => { g.add(at(SPH(.2, m), s * .8, -.18, 0, 0, 0, 0, [.35, 1.2, .9])); g.add(TUBE([[s * .8, -.4, 0], [s * .78, -.7, .04], [s * .74, -.95, .06]], .022, wm)); g.add(at(SPH(.065, wm), s * .74, -.98, .06)); });
      return H(g); } },
  { name: 'Santa Hat', build: () => { const red = M(0xC8281E, { roughness: .8 }), fur = M(0xFFFFFF, { roughness: 1 });
      return H(G(TAPER([[0, .05, 0], [0, .5, 0], [.15, .9, -.05], [.45, 1.0, -.1], [.75, .75, -.12]], .76, .07, red), at(TOR(BR + .02, .11, fur), 0, .06, 0, Math.PI / 2), at(SPH(.14, fur), .78, .7, -.12))); } },
  { name: 'Graduation Hat', build: () => { const blk = M(0x1E1E22, { roughness: .6 }), gold = M(0xE0B12A, { roughness: .4 });
      return H(G(at(CYL(BR, BR, .3, blk, 40, true), 0, .15, 0), at(SPH(BR, blk), 0, .3, 0, 0, 0, 0, [1, .25, 1]), at(BOX(1.55, .05, 1.55, blk), 0, .45, 0, 0, .25, 0),
        at(CYL(.05, .05, .04, gold), 0, .5, 0), TUBE([[0, .5, 0], [.4, .5, .35], [.68, .46, .52], [.7, .2, .55]], .014, gold), at(CYL(.035, .06, .16, gold, 12), .7, .12, .55))); } },
  // epic
  { name: 'Viking Horn Helmet', build: () => { const iron = metal(0x9AA3AA, .4), brass = metal(0xC08A3E, .35), ivory = M(0xF2E6CF, { roughness: .5 });
      const g = G(at(DOME(BR + .05, iron), 0, 0, 0, 0, 0, 0, [1, .95, 1]), at(TOR(BR + .05, .05, brass), 0, .05, 0, Math.PI / 2), at(TOR(BR * .96, .04, brass, Math.PI), 0, .02, 0, 0, Math.PI / 2, 0));
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.add(at(SPH(.025, brass), Math.sin(a) * (BR + .09), .05, Math.cos(a) * (BR + .09))); }
      [-1, 1].forEach((s) => g.add(TAPER([[s * .7, .3, 0], [s * 1.0, .42, 0], [s * 1.18, .75, .05], [s * 1.1, 1.05, .1]], .13, .015, ivory)));
      return H(g); } },
  { name: 'Spartan Helmet', build: () => { const bronze = metal(0xC08A3E, .35), red = M(0xC8281E, { roughness: 1 });
      const g = G(at(DOME(BR + .06, bronze), 0, -.02, 0, 0, 0, 0, [1, 1.05, 1.05]), at(CYL(BR + .06, BR + .06, .22, bronze, 40, true, Math.PI * .35, Math.PI * 1.3), 0, -.1, 0));
      [-1, 1].forEach((s) => g.add(at(BOX(.06, .5, .34, bronze), s * .74, -.36, .26, 0, s * -.35, s * .08)));
      const crest = TOR(.88, .1, red, Math.PI, 10, 40); at(crest, 0, .02, 0, 0, Math.PI / 2, 0, [1, 1, .55]); g.add(crest);
      for (let i = 0; i < 18; i++) { const a = i / 17 * Math.PI; g.add(at(BOX(.06, .14, .03, M(0xA81E16, { roughness: 1 })), 0, .02 + Math.sin(a) * 1.0, Math.cos(a) * 1.0, a - Math.PI / 2)); }
      return H(g); } },
  { name: 'Military Officer Cap', build: () => { const green = M(0x2F3B2A, { roughness: .7 }), gold = metal(0xE0B12A, .3);
      return H(G(at(CYL(BR, BR, .24, green, 40, true), 0, .12, 0), at(CYL(1.0, .8, .2, green, 40), 0, .32, -.02), at(brimHalf(.6, .03, M(0x111111, { roughness: .2 })), 0, .04, .6, .3, 0, 0, [1, 1, .9]),
        at(TOR(.79, .018, gold, Math.PI), 0, .12, 0, 0, 0, 0), at(CYL(.08, .08, .03, gold, 6), 0, .2, .79, Math.PI / 2), at(TOR(BR + .01, .025, M(0xA81E16)), 0, .2, 0, Math.PI / 2))); } },
  { name: 'Samurai Kabuto', build: () => { const iron = metal(0x2B2B30, .45), gold = metal(0xE0B12A, .25), lace = M(0x2D5BB8, { roughness: .8 });
      const g = G(at(DOME(BR + .06, iron), 0, 0, 0));
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(at(TOR(BR + .065, .012, gold, Math.PI / 2), 0, 0, 0, 0, a, Math.PI / 2)); }
      [0, 1, 2].forEach((k) => { g.add(at(CYL(BR + .1 + k * .07, BR + .17 + k * .07, .12, iron, 40, true, Math.PI * .3, Math.PI * 1.4), 0, -.06 - k * .11, 0)); g.add(at(TOR(BR + .17 + k * .07, .012, lace, Math.PI * 1.4), 0, -.12 - k * .11, 0, Math.PI / 2, 0, Math.PI * .3 + Math.PI / 2)); });
      [-1, 1].forEach((s) => { g.add(TAPER([[s * .06, .45, .74], [s * .3, .8, .8], [s * .48, 1.2, .74], [s * .5, 1.45, .66]], .06, .02, gold)); g.add(at(BOX(.24, .22, .03, iron), s * .86, .08, .4, 0, s * .9, 0)); });
      g.add(at(SPH(.09, gold), 0, .45, .76));
      return H(g); } },
  { name: 'Plague Doctor Mask', build: () => { const blk = M(0x1E1E22, { roughness: .7 }), bone = M(0xE9DCC0, { roughness: .6 }), brass = metal(0xC08A3E, .35), red = glass(0x8A1A1A, .75);
      const hat = G(at(CYL(.82, .78, .5, blk, 40), 0, .25, 0), at(CYL(1.3, 1.3, .03, blk, 48), 0, .02, 0), at(TOR(.8, .03, M(0x4A3A2A)), 0, .08, 0, Math.PI / 2));
      const beak = G(TAPER([[0, -.12, .64], [0, -.22, .9], [0, -.36, 1.2], [0, -.52, 1.42]], .2, .02, bone));
      [-1, 1].forEach((s) => { beak.add(at(TOR(.11, .025, brass), s * .25, .02, .7, 0, s * .18, 0)); beak.add(at(mesh(new T.CircleGeometry(.11, 24), red), s * .25, .02, .71, 0, s * .18, 0)); });
      [.75, .95, 1.15].forEach((z) => beak.add(at(TOR(.18 - (z - .7) * .25, .008, M(0x8A7A5A), Math.PI), 0, -.15 - (z - .7) * .5, z, 0, Math.PI / 2, Math.PI / 2)));
      return [{ a: 'hat', o: hat }, { a: 'face', o: beak }]; } },
  { name: 'Ushanka', build: () => { const fur = new T.MeshStandardMaterial({ map: furTex('#6B4A2E', 'rgba(30,18,8,.4)'), roughness: 1 }), metalG = metal(0xC9A15A, .3);
      const g = G(at(CYL(.86, .88, .44, fur, 40), 0, .22, 0), at(SPH(.86, fur), 0, .44, 0, 0, 0, 0, [1, .22, 1]), at(BOX(.9, .26, .14, fur), 0, .3, .82, -.3, 0, 0), at(CYL(.07, .07, .02, metalG, 24), 0, .32, .9, Math.PI / 2 - .3));
      [-1, 1].forEach((s) => g.add(at(BOX(.14, .4, .5, fur), s * .9, .44, 0, 0, 0, s * -.5)));
      g.add(TUBE([[-.95, .66, 0], [0, .62, 0], [.95, .66, 0]], .015, M(0x3A2A1E)));
      return H(g); } },
  // exotic
  { name: 'Floating Crown', build: (ctx) => { const gold = metal(0xF4C93A, .2); const g = G(at(CYL(.5, .55, .26, gold, 40, true), 0, .13, 0));
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(at(CONE(.08, .3, gold, 12), Math.sin(a) * .52, .4, Math.cos(a) * .52)); g.add(at(SPH(.05, M(i % 2 ? 0xC8281E : 0x2D5BB8, { roughness: .1, metalness: .3 })), Math.sin(a) * .56, .55, Math.cos(a) * .56)); g.add(at(SPH(.04, M([0x8FD46A, 0xE8578A][i % 2], { roughness: .1 })), Math.sin(a + .4) * .555, .13, Math.cos(a + .4) * .555)); }
      const holder = G(g); holder.position.y = .5;
      if (!ctx.thumb) ctx.tick((t) => { holder.position.y = .5 + Math.sin(t * 2) * .06; g.rotation.y = t * .6; });
      return [{ a: 'headTop', o: holder }]; } },
  { name: 'Galaxy Planet Hat', build: (ctx) => { const tex = canvasTex(256, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1A1240'); gr.addColorStop(.5, '#3B2A8B'); gr.addColorStop(1, '#0E1A3A'); c.fillStyle = gr; c.fillRect(0, 0, w, h); const r = rng(4); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${.4 + r() * .6})`; c.fillRect(r() * w, r() * h, 2, 2); } c.globalAlpha = .35; c.fillStyle = '#FF5FD2'; c.beginPath(); c.ellipse(80, 60, 60, 20, .4, 0, 7); c.fill(); });
      const m = new T.MeshStandardMaterial({ map: tex, roughness: .5, emissive: 0x2A1A6A, emissiveIntensity: .5 });
      const g = G(at(DOME(BR + .04, m), 0, 0, 0, 0, 0, 0, [1, .85, 1]), at(SPH(.4, m), .1, .55, -.05, 0, 0, .3, [1.3, .5, 1.3]));
      const orbit = new T.Group(); orbit.position.y = .55; orbit.rotation.set(.3, 0, .2); g.add(orbit);
      const planets = [[.13, 0xFF8A3D, 1.15], [.09, 0x7EA6FF, .95], [.07, 0x8FD46A, 1.3], [.11, 0xF4C93A, 1.05]].map(([r, c, d], i) => { const p = G(SPH(r, M(c, { roughness: .5, emissive: c, emissiveIntensity: .25 }))); if (i === 3) p.add(at(TOR(r * 1.7, .012, M(0xF2E6CF), Math.PI * 2), 0, 0, 0, 1.2)); orbit.add(p); return [p, d, i]; });
      const place = (t) => planets.forEach(([p, d, i]) => { const a = t * (.5 + i * .15) + i * 1.6; p.position.set(Math.cos(a) * d, Math.sin(a * 1.3) * .05, Math.sin(a) * d); });
      place(1); if (!ctx.thumb) ctx.tick(place);
      return H(g); } },
  { name: 'UFO Hover Hat', build: (ctx) => { const silver = metal(0xD9DEE3, .2);
      const ufo = G(at(SPH(.7, silver), 0, 0, 0, 0, 0, 0, [1, .22, 1]), at(DOME(.32, glass(0x8FE8FF, .5)), 0, .1, 0), at(SPH(.12, M(0x8FD46A, { roughness: .4 })), 0, .16, 0), at(SPH(.03, M(INK)), -.04, .2, .1), at(SPH(.03, M(INK)), .04, .2, .1));
      const lights = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const lc = i % 2 ? 0xF4C93A : 0x3AE0FF; const l = SPH(.04, new T.MeshStandardMaterial({ color: lc, emissive: lc, emissiveIntensity: 1.5 })); l.position.set(Math.sin(a) * .62, -.03, Math.cos(a) * .62); ufo.add(l); lights.push(l); }
      const beam = at(CONE(.55, .7, M(0x8FE8FF, { transparent: true, opacity: .18, emissive: 0x8FE8FF, emissiveIntensity: .6, depthWrite: false }), 32), 0, -.38, 0);
      const holder = G(ufo, beam); holder.position.y = .95;
      if (!ctx.thumb) ctx.tick((t) => { ufo.rotation.y = t * 1.2; holder.position.y = .95 + Math.sin(t * 1.8) * .05; lights.forEach((l, i) => l.material.emissiveIntensity = (Math.sin(t * 6 + i) > 0 ? 1.8 : .3)); });
      return [{ a: 'headTop', o: holder }]; } },
  // mythic
  { name: 'Halo', build: (ctx) => { const halo = G(TOR(.55, .065, M(0xFFD84D, { emissive: 0xFFC21A, emissiveIntensity: 1.2, roughness: .3, metalness: .4 })), TOR(.62, .02, M(0xFFF2B0, { transparent: true, opacity: .5, emissive: 0xFFE07A, emissiveIntensity: 1, depthWrite: false })));
      halo.rotation.x = Math.PI / 2; const holder = G(halo); holder.position.y = .45;
      if (!ctx.thumb) ctx.tick((t) => { holder.position.y = .45 + Math.sin(t * 1.5) * .04; halo.rotation.z = t * .4; });
      return [{ a: 'headTop', o: holder }]; } }
];
// ---------- GLASSES (21) ----------  face anchor: eye height, head center; lenses at x ±.25, z ≈ .72
const LX = .25, LZ = .73;
const F = (o) => [{ a: 'face', o }];
function frames({ pts, frame, lens, op = .45, depth = .035, hole = .82, mirror = false, temples = true, bridge = true, lensMat, frameMat }) {
  const g = new T.Group();
  const fm = frameMat || M(frame, { roughness: .35, metalness: .2 });
  const lm = lensMat || glass(lens, op);
  [-1, 1].forEach((s) => {
    const side = new T.Group(); side.position.set(s * LX, 0, LZ); side.rotation.y = s * .2;
    const rim = EXTRUDE(pts, depth, fm, hole); const ln = FLAT(pts.map(([x, y]) => [x * (hole + .04), y * (hole + .04)]), lm);
    if (mirror && s < 0) { rim.scale.x = -1; ln.scale.x = -1; }
    side.add(rim, ln); g.add(side);
  });
  if (bridge) g.add(TUBE([[-.1, .03, LZ + .02], [0, .07, LZ + .05], [.1, .03, LZ + .02]], .016, fm));
  if (temples) [-1, 1].forEach((s) => g.add(TUBE([[s * .41, .03, LZ - .1], [s * .66, .03, .3], [s * .76, -.02, -.05]], .014, fm)));
  return g;
}
function strap(color, y = 0, h = .1, r = .775) { return at(CYL(r, r, h, M(color, { roughness: .8 }), 48, true), 0, y, 0); }
function curvedLens(r, h, arc, m) { return mesh(new T.CylinderGeometry(r, r, h, 40, 1, true, -arc / 2, arc), DS(m)); }

const GLASSES = [
  { name: 'Sunglasses', build: () => F(frames({ pts: P2.rrect(.34, .24, .07), frame: 0x1E1E22, lens: 0x22252E, op: .88 })) },
  { name: 'Aviator Polarized Sunglasses', build: () => { const g = frames({ pts: P2.aviator(), frame: 0xD4AF5A, frameMat: metal(0xD4AF5A, .2), lensMat: M(0x2F6E66, { transparent: true, opacity: .78, metalness: .7, roughness: .05 }), depth: .02, hole: .9, mirror: true });
      g.add(TUBE([[-.1, .1, LZ + .02], [0, .11, LZ + .04], [.1, .1, LZ + .02]], .01, metal(0xD4AF5A, .2))); return F(g); } },
  { name: 'Safety Glasses', build: () => F(G(at(curvedLens(.79, .26, 1.6, glass(0xFFF2A0, .35)), 0, 0, 0), at(curvedLens(.8, .045, 1.6, M(0x5A636C, { roughness: .4 })), 0, .14, 0),
      ...[-1, 1].map((s) => TUBE([[s * .72, .05, .3], [s * .77, .03, 0], [s * .76, -.02, -.15]], .016, M(0x5A636C)))) ) },
  { name: 'Thick Frame Glasses', build: () => F(frames({ pts: P2.rrect(.33, .25, .05), frame: 0x2A2420, lens: 0xE8F4FA, op: .22, depth: .06, hole: .7 })) },
  { name: 'Cat-Eye Glasses', build: () => { const g = frames({ pts: P2.cat(), frame: 0xC8281E, lens: 0xFFE0E6, op: .3, mirror: true, hole: .8 });
      [-1, 1].forEach((s) => g.add(at(SPH(.022, M(0xFFFFFF, { metalness: .5, roughness: .05 })), s * (LX + .16), .09, LZ + .02))); return F(g); } },
  { name: 'Heart Shape Glasses', build: () => F(frames({ pts: P2.heart(), frame: 0xE8578A, lens: 0xF49AC1, op: .6, hole: .8 })) },
  // rare
  { name: 'Ski Goggles', build: () => F(G(at(curvedLens(.8, .3, 1.5, M(0xFF8A2A, { metalness: .85, roughness: .1 })), 0, 0, 0), at(curvedLens(.79, .36, 1.62, M(0xF2F2EE, { roughness: .9 })), 0, 0, 0),
      at(CYL(.78, .78, .14, M(0x2D5BB8, { roughness: .8 }), 48, true), 0, 0, 0))) },
  { name: 'Welding Goggles', build: () => { const g = new T.Group(); const iron = metal(0x3A3A3E, .5), brass = metal(0xC08A3E, .3);
      [-1, 1].forEach((s) => { const cup = G(at(CYL(.15, .13, .13, iron, 24), 0, 0, 0, Math.PI / 2), at(TOR(.15, .025, brass), 0, 0, .07), at(mesh(new T.CircleGeometry(.13, 24), glass(0x1E5A2A, .9)), 0, 0, .066)); cup.position.set(s * LX, 0, LZ - .02); cup.rotation.y = s * .2; g.add(cup); });
      g.add(TUBE([[-.12, 0, LZ + .02], [0, .02, LZ + .04], [.12, 0, LZ + .02]], .02, brass), strap(0x5A3A1E, 0, .09));
      return F(g); } },
  { name: 'Night Vision Goggles', build: (ctx) => { const olive = M(0x3E4826, { roughness: .6 }); const lensM = glow(0x6CFF6A, 1.2);
      const g = G(strap(0x2A2A2A, .02, .1), at(CYL(.8, .8, .1, olive, 48, true, -.4, .8), 0, .3, 0), at(BOX(.36, .14, .12, olive), 0, .24, .74),
        ...[-1, 1].map((s) => G(at(CYL(.075, .085, .32, olive, 20), s * .13, 0, .92, Math.PI / 2), at(mesh(new T.CircleGeometry(.065, 20), lensM), s * .13, 0, 1.081))));
      if (!ctx.thumb) ctx.tick((t) => (lensM.emissiveIntensity = 1 + Math.sin(t * 9) * .15));
      return F(g); } },
  { name: 'Motorcycle Goggles', build: () => { const g = new T.Group(); const leather = M(0x6B4A2E, { roughness: .8 }), brass = metal(0xC08A3E, .3);
      [-1, 1].forEach((s) => { const cup = G(at(TOR(.15, .045, leather), 0, 0, 0), at(TOR(.13, .015, brass), 0, 0, .03), at(mesh(new T.CircleGeometry(.13, 24), glass(0xF4C26A, .5)), 0, 0, .02)); cup.position.set(s * LX, 0, LZ); cup.rotation.y = s * .2; g.add(cup); });
      g.add(TUBE([[-.1, 0, LZ + .03], [0, .02, LZ + .05], [.1, 0, LZ + .03]], .03, leather), strap(0x3A2A1E, 0, .1));
      return F(g); } },
  { name: 'VR Headset', build: (ctx) => { const white = M(0xF2F2EE, { roughness: .4 }); const led = glow(0x3AE0FF, 1.5);
      const g = G(at(BOX(.68, .3, .24, white), 0, 0, .8), at(BOX(.62, .24, .02, M(0x1E1E22, { roughness: .15 })), 0, 0, .925), strap(0x2A2A2E, 0, .1), at(TOR(.6, .04, M(0x2A2A2E), Math.PI), 0, .1, 0, 0, Math.PI / 2, 0), at(SPH(.025, led), .24, .09, .93));
      if (!ctx.thumb) ctx.tick((t) => (led.emissiveIntensity = (Math.sin(t * 3) > 0 ? 1.8 : .4)));
      return F(g); } },
  // epic
  { name: 'Futuristic Visor', build: (ctx) => { const v = M(0x3AE0FF, { transparent: true, opacity: .55, emissive: 0x3AE0FF, emissiveIntensity: .6, roughness: .1, depthWrite: false });
      const edge = glow(0x8FF4FF, 1.6);
      const g = G(at(curvedLens(.8, .2, 1.9, v), 0, 0, 0), at(curvedLens(.81, .02, 1.9, edge), 0, .1, 0), at(curvedLens(.81, .02, 1.9, edge), 0, -.1, 0));
      if (!ctx.thumb) ctx.tick((t) => (v.emissiveIntensity = .5 + Math.sin(t * 2.5) * .25));
      return F(g); } },
  { name: 'Pilot Goggles', build: () => { const g = new T.Group(); const leather = M(0x7A4A2A, { roughness: .8 }), fleece = M(0xF2EAD8, { roughness: 1 }), brass = metal(0xC9A15A, .3);
      [-1, 1].forEach((s) => { const cup = G(at(TOR(.17, .06, fleece), 0, 0, -.02), at(TOR(.14, .02, brass), 0, 0, .03), at(mesh(new T.CircleGeometry(.14, 24), glass(0x9BC1FF, .45)), 0, 0, .025)); cup.position.set(s * LX, 0, LZ); cup.rotation.y = s * .2; g.add(cup); });
      g.add(TUBE([[-.1, 0, LZ + .03], [0, .02, LZ + .05], [.1, 0, LZ + .03]], .035, leather), strap(0x7A4A2A, 0, .11));
      return F(g); } },
  { name: '3D Movie Glasses', build: () => { const g = frames({ pts: P2.rrect(.32, .2, .02), frame: 0xF6F6F2, lens: 0xE8312A, op: .7, depth: .025, hole: .8 });
      g.children[1].children[1].material = glass(0x2AC6E8, .7); return F(g); } },
  { name: 'Monocle with Chain', build: () => { const gold = metal(0xE0B12A, .2);
      return F(G(at(TOR(.14, .02, gold), LX, 0, LZ + .01, 0, .2, 0), at(mesh(new T.CircleGeometry(.135, 28), glass(0xE8F4FA, .25)), LX, 0, LZ + .005, 0, .2, 0),
        TUBE([[LX + .1, -.1, LZ - .02], [LX + .18, -.4, .6], [.25, -.7, .6], [.12, -.92, .34]], .008, gold))); } },
  { name: 'Robotic Scanning Eye', build: (ctx) => { const gun = metal(0x5A636C, .35), red = glow(0xFF2A2A, 1.6);
      const scan = BOX(.24, .012, .01, glow(0xFF6A6A, 2));
      const plate = G(EXTRUDE(P2.rrect(.36, .3, .08), .05, gun), at(mesh(new T.CircleGeometry(.1, 28), red), 0, 0, .03), at(TOR(.1, .015, metal(0x2A2A2E, .3)), 0, 0, .03), scan,
        ...[[-.13, .1], [.13, .1], [-.13, -.1], [.13, -.1]].map(([x, y]) => at(SPH(.018, metal(0xC9D1DB)), x, y, .03)), at(CYL(.008, .008, .2, gun), .14, .22, -.02), at(SPH(.02, red), .14, .32, -.02));
      plate.position.set(LX, 0, LZ - .01); plate.rotation.y = .2; scan.position.z = .035;
      if (!ctx.thumb) ctx.tick((t) => { scan.position.y = Math.sin(t * 2.6) * .09; red.emissiveIntensity = 1.3 + Math.sin(t * 8) * .3; });
      return F(G(plate, TUBE([[LX + .16, .02, LZ - .08], [.66, .03, .3], [.76, -.02, -.05]], .016, gun))); } },
  { name: 'Flame Lenses', build: (ctx) => { const g = frames({ pts: P2.rrect(.33, .22, .08), frame: 0x1E1E22, lensMat: M(0xFF8A1E, { transparent: true, opacity: .8, emissive: 0xFF6A00, emissiveIntensity: .7, roughness: .1 }) });
      [-1, 1].forEach((s) => [-.1, -.03, .04, .11].forEach((x, i) => { const f = flameCone(ctx, i % 2 ? 0xFFB23A : 0xFF5A1E, .9 + (i % 2) * .3); f.position.set(s * LX + x, .12, LZ + .02); g.add(f); }));
      return F(g); } },
  // exotic
  { name: 'Glowing Third Eye Frames', build: (ctx) => { const gold = metal(0xE0B12A, .2); const g = frames({ pts: P2.circle(.14), frame: 0xE0B12A, frameMat: gold, lens: 0xE8DDFF, op: .3, depth: .02, hole: .9 });
      const iris = glow(0xB06BFF, 1.4);
      const third = G(EXTRUDE(P2.almond(.13, .09), .02, gold, .8), at(FLAT(P2.almond(.11, .075), M(0xF4ECFF, { emissive: 0xE8D8FF, emissiveIntensity: .6 })), 0, 0, .005), at(mesh(new T.CircleGeometry(.05, 20), iris), 0, 0, .012), at(mesh(new T.CircleGeometry(.022, 16), M(0x14101E)), 0, 0, .014));
      third.position.set(0, .3, rAt(EYE_Y + .3) + .03); g.add(third, TUBE([[0, .06, LZ + .04], [0, .2, rAt(EYE_Y + .2) + .02]], .012, gold));
      if (!ctx.thumb) ctx.tick((t) => (iris.emissiveIntensity = 1 + Math.sin(t * 2.4) * .6));
      return F(g); } },
  { name: 'Tiny Planet Orbit Glasses', build: (ctx) => { const g = frames({ pts: P2.circle(.14), frame: 0xC9D1DB, frameMat: metal(0xC9D1DB, .2), lens: 0x9BC1FF, op: .3, depth: .02, hole: .9 });
      const orbit = new T.Group(); orbit.position.set(0, 0, LZ); orbit.rotation.set(.25, 0, .15); g.add(orbit);
      const ps = [[.045, 0xFF8A3D], [.035, 0x7EA6FF], [.03, 0x8FD46A], [.05, 0xF4C93A]].map(([r, c], i) => { const p = G(SPH(r, M(c, { emissive: c, emissiveIntensity: .3 }))); if (i === 3) p.add(at(TOR(r * 1.8, .006, M(0xF2E6CF)), 0, 0, 0, 1.2)); orbit.add(p); return p; });
      const place = (t) => ps.forEach((p, i) => { const a = t * (.9 + i * .2) + i * 1.57; p.position.set(Math.cos(a) * .55, Math.sin(a * 2) * .04, Math.sin(a) * .18); });
      place(.5); if (!ctx.thumb) ctx.tick(place);
      return F(g); } },
  { name: 'Divine Vision', build: (ctx) => { const gold = metal(0xF4C93A, .15);
      const g = frames({ pts: P2.circle(.14), frame: 0xF4C93A, frameMat: gold, lensMat: M(0xFFD84D, { transparent: true, opacity: .85, emissive: 0xFFC21A, emissiveIntensity: 1.3, roughness: .1 }), depth: .025, hole: .88 });
      const halo = G(TOR(1.15, .045, M(0xFFE07A, { emissive: 0xFFC21A, emissiveIntensity: 1.3, metalness: .4, roughness: .3 })));
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; halo.add(at(BOX(.025, .3, .01, M(0xFFF2B0, { transparent: true, opacity: .55, emissive: 0xFFE07A, emissiveIntensity: 1, depthWrite: false })), Math.cos(a) * 1.38, Math.sin(a) * 1.38, 0, 0, 0, a - Math.PI / 2)); }
      halo.position.set(0, .35, -.45); g.add(halo);
      if (!ctx.thumb) ctx.tick((t) => (halo.rotation.z = t * .25));
      return F(g); } },
  // mythic
  { name: 'Dragon Vision', build: (ctx) => { const g = frames({ pts: P2.angular(), frame: 0x1E1A16, frameMat: metal(0x2A2420, .3), lens: 0x3A1A0A, op: .55, depth: .035, hole: .82, mirror: true });
      const eyeM = M(0xFFB21A, { emissive: 0xFF7A00, emissiveIntensity: 1.4, roughness: .2 });
      [-1, 1].forEach((s) => { const e = G(at(SPH(.1, eyeM), 0, 0, 0, 0, 0, 0, [1, .62, .3]), at(BOX(.018, .11, .01, M(0x120A04)), 0, 0, .03)); e.position.set(s * LX, -.005, LZ - .015); e.rotation.y = s * .2; g.add(e); });
      const smoke = []; for (let i = 0; i < 6; i++) { const p = SPH(.04, new T.MeshStandardMaterial({ color: 0x5A5050, transparent: true, opacity: .35, depthWrite: false })); g.add(p); smoke.push(p); }
      if (!ctx.thumb) ctx.tick((t) => { eyeM.emissiveIntensity = 1.1 + Math.sin(t * 3) * .5; smoke.forEach((p, i) => { const k = (t * .6 + i / 6) % 1; const s = i % 2 ? 1 : -1; p.position.set(s * (LX + .18 + k * .1), .05 + k * .5, LZ - .05); p.scale.setScalar(.6 + k * 1.4); p.material.opacity = .35 * (1 - k); }); });
      return F(g); } }
];
// ---------- SHOES (21) ----------  one shoe; origin = ground under the ankle, toe toward +z; ctx.side = -1 left, 1 right
function soleShape(w, l, r = .07) { return P2.rrect(w, l, r).map(([x, y]) => [x, y]); }
function SOLE(w, l, h, m, y = 0, z = .03) { const s = EXTRUDE(soleShape(w, l), h, m); s.rotation.x = -Math.PI / 2; s.position.set(0, y + h / 2, z); return s; }
function upper(m, sx = .11, sy = .11, sz = .19, y = .1, z = .04) { return at(SPH(1, m, 32, 20), 0, y, z, 0, 0, 0, [sx, sy, sz]); }
function shaft(m, h = .22, r = .105, y = .1) { return at(CYL(r, r * 1.05, h, m, 28), 0, y + h / 2, -.03); }
function laces(n, color, y0 = .16, z0 = .02, dz = .045) { const g = new T.Group(); for (let i = 0; i < n; i++) g.add(at(BOX(.1, .014, .016, M(color)), 0, y0 - i * .012, z0 + i * dz, -.5)); return g; }
const sideStripe = (ctx, color, y = .1) => TUBE([[ctx.side * .105, y + .03, -.08], [ctx.side * .112, y, .02], [ctx.side * .1, y + .035, .1]], .014, M(color));

const SHOES = [
  { name: 'Running Shoes', build: (ctx) => G(SOLE(.22, .4, .055, M(0xF6F6F2, { roughness: .6 })), upper(M(0x3D7BFF, { roughness: .55 })), laces(3, 0xFFFFFF), sideStripe(ctx, 0xFF8A3D), at(BOX(.06, .08, .03, M(0xFF8A3D)), 0, .14, -.14)) },
  { name: 'Skate Shoes', build: (ctx) => G(SOLE(.24, .42, .07, M(0xC9A15A, { roughness: .8 })), at(BOX(.22, .12, .36, M(0x2A2A2E, { roughness: .9 })), 0, .13, .03), at(SPH(.11, M(0x2A2A2E, { roughness: .9 })), 0, .12, .2, 0, 0, 0, [1, .6, .5]),
      TUBE([[ctx.side * .112, .1, -.12], [ctx.side * .114, .15, -.02], [ctx.side * .112, .1, .06], [ctx.side * .11, .14, .13]], .012, M(0xF6F6F2)), laces(3, 0xF6F6F2, .2, .02)) },
  { name: 'Hiking Boots', tall: true, build: () => { const lea = M(0x7A4E2A, { roughness: .8 }); const g = G(SOLE(.24, .42, .07, M(0x2A2420, { roughness: .9 })), upper(lea, .115, .11, .19, .12), shaft(lea, .2, .11, .1), at(TOR(.11, .03, M(0x5A3A1E)), 0, .3, -.03, Math.PI / 2), laces(5, 0xC8281E, .26, .04, .03));
      for (let i = 0; i < 5; i++) g.add(at(BOX(.2, .02, .03, M(0x1A1612)), 0, -.005, -.14 + i * .08)); return g; } },
  { name: 'Soccer Cleats', build: (ctx) => { const g = G(SOLE(.2, .4, .03, M(0x1E1E22)), upper(M(0x8FD46A, { roughness: .35 }), .1, .09, .2, .07), sideStripe(ctx, 0x23301F, .06), laces(3, 0x23301F, .13, .03));
      [[-.06, -.12], [.06, -.12], [-.06, .05], [.06, .05], [-.05, .15], [.05, .15]].forEach(([x, z]) => g.add(at(CYL(.018, .014, .04, M(0xF6F6F2)), x, -.02, z))); g.position.y = .03; return g; } },
  { name: 'Cowboy Boots', tall: true, build: () => { const tan = M(0xB5763C, { roughness: .6 }); const tex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#B5763C'; c.fillRect(0, 0, w, h); c.strokeStyle = '#F2E6CF'; c.lineWidth = 3; c.beginPath(); c.moveTo(64, 120); c.quadraticCurveTo(20, 70, 64, 20); c.quadraticCurveTo(108, 70, 64, 120); c.stroke(); });
      return G(SOLE(.2, .42, .04, M(0x3A2A1E)), at(CONE(.1, .26, tan, 20), 0, .09, .2, Math.PI / 2, 0, 0, [1.1, 1, .7]), upper(tan, .105, .1, .14, .1, 0), at(CYL(.11, .11, .34, new T.MeshStandardMaterial({ map: tex, roughness: .6 }), 28), 0, .29, -.04), at(BOX(.12, .07, .1, M(0x3A2A1E)), 0, .035, -.15), at(BOX(.04, .08, .01, tan), 0, .48, .08), at(BOX(.04, .08, .01, tan), 0, .48, -.16)); } },
  { name: 'Flip Flops', build: (ctx) => G(SOLE(.2, .4, .03, M(0x2D9CDB, { roughness: .7 })), at(SPH(.11, M(INK, { roughness: .6 })), 0, .07, .04, 0, 0, 0, [1, .5, 1.45]),
      TUBE([[0, .03, .14], [-.07, .08, .02], [-.1, .03, -.04]], .014, M(0xF4C93A)), TUBE([[0, .03, .14], [.07, .08, .02], [.1, .03, -.04]], .014, M(0xF4C93A))) },
  // rare
  { name: 'Clogs Sandal', build: () => { const m = M(0x8FD46A, { roughness: .5 }); const g = G(SOLE(.24, .42, .06, M(0x6CB84A)), upper(m, .12, .11, .2, .1), TUBE([[-.12, .1, -.04], [0, .13, -.17], [.12, .1, -.04]], .02, m));
      [[-.05, .17, .1], [.05, .17, .1], [0, .18, .16], [-.06, .14, .2], [.06, .14, .2], [0, .19, .04]].forEach(([x, y, z]) => g.add(at(SPH(.016, M(0x2F6A22)), x, y, z))); return g; } },
  { name: 'Ballet Shoes', build: (ctx) => { const pink = M(0xF7B9CF, { roughness: .35 }); const g = G(SOLE(.18, .38, .02, M(0xE89AB4)), upper(pink, .095, .07, .18, .05));
      const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 3.5; pts.push([Math.cos(a) * .1, .06 + i * .012, Math.sin(a) * .1]); } g.add(TUBE(pts, .01, pink, false, 96)); return g; } },
  { name: 'Boat Shoes', build: () => { const lea = M(0x8A5A2A, { roughness: .45 }); return G(SOLE(.22, .4, .05, M(0xF6F6F2)), upper(lea, .11, .09, .19, .08), at(TOR(.1, .01, M(0xE8D8B0), Math.PI * 2, 8, 40), 0, .13, -.02, Math.PI / 2 - .1, 0, 0, [1, 1.5, 1]), at(SPH(.025, M(0xE8D8B0)), .1, .13, .02)); } },
  { name: 'Moccasins', build: () => { const sue = M(0xB88A5A, { roughness: 1 }); const g = G(SOLE(.21, .4, .03, sue), upper(sue, .11, .09, .19, .07));
      ['#C8281E', '#2D5BB8', '#F4C93A', '#FFFFFF'].forEach((col, i) => [-1, 1].forEach((s) => g.add(at(SPH(.013, M(parseInt(col.slice(1), 16), { roughness: .2 })), s * .03 * (i % 2 + 1), .15 - i * .01, .06 + i * .025))));
      for (let i = 0; i < 6; i++) g.add(at(BOX(.008, .06, .008, sue), .11, .06, -.08 + i * .03)); return g; } },
  { name: 'Ski Boots', tall: true, build: () => { const shell = M(0x2F6AE6, { roughness: .2 }), wh = M(0xF6F6F2, { roughness: .3 }); const g = G(SOLE(.24, .42, .05, M(0x2A2A2E)), upper(shell, .12, .12, .2, .1), at(CYL(.12, .125, .3, shell, 28), 0, .27, -.03), at(TOR(.12, .03, wh), 0, .42, -.03, Math.PI / 2));
      [.14, .22, .3, .38].forEach((y) => g.add(at(BOX(.08, .025, .03, metal()), 0, y, .1 - (y - .14) * .2))); return g; } },
  // epic
  { name: 'Ice Skates', tall: true, build: () => { const wh = M(0xF6F6F2, { roughness: .4 }), steel = metal(0xD9DEE3, .15); return G(at(BOX(.02, .1, .46, steel), 0, -.02, .04), at(TOR(.05, .01, steel, Math.PI), 0, -.02, .25, 0, Math.PI / 2, 0),
      at(CYL(.015, .015, .08, steel), 0, .04, -.1), at(CYL(.015, .015, .08, steel), 0, .04, .15), SOLE(.19, .36, .03, M(0x8A5A2A), .06), upper(wh, .1, .1, .17, .16), at(CYL(.1, .105, .22, wh, 28), 0, .26, -.03), laces(5, 0xF6F6F2, .32, .05, .03)); } },
  { name: 'Jester Shoes', build: (ctx) => { const a = M(0x7A3FD0, { roughness: .5 }), b = M(0xF4C93A, { roughness: .5 });
      const bell = SPH(.04, metal(0xF4C93A, .2)); bell.position.set(0, .26, .3);
      const g = G(SOLE(.2, .36, .03, M(0x3A2A1E)), at(SPH(1, ctx.side < 0 ? a : b), 0, .08, .0, 0, 0, 0, [.1, .09, .17]), TAPER([[0, .08, .12], [0, .09, .3], [0, .2, .42], [0, .27, .32]], .07, .015, ctx.side < 0 ? b : a), bell);
      if (!ctx.thumb) { const ph = ctx.side; ctx.tick((t) => { bell.position.x = Math.sin(t * 4 + ph) * .015; }); } return g; } },
  { name: 'Dragon-Scale Boots', tall: true, build: () => { const tex = canvasTex(128, 128, (c, w, h) => { c.fillStyle = '#1E5A36'; c.fillRect(0, 0, w, h); for (let y = 0; y < h + 16; y += 14) for (let x = (y / 14 % 2) * 8; x < w + 16; x += 16) { const g = c.createRadialGradient(x, y - 4, 1, x, y, 10); g.addColorStop(0, '#5FC27A'); g.addColorStop(1, '#174A2C'); c.fillStyle = g; c.beginPath(); c.arc(x, y, 9, 0, Math.PI); c.fill(); } });
      const m = new T.MeshStandardMaterial({ map: tex, roughness: .35, metalness: .2 }); const g = G(SOLE(.22, .42, .05, M(0x1A2A1E)), upper(m, .115, .11, .2, .1), at(CYL(.11, .115, .28, m, 28), 0, .24, -.03));
      for (let i = 0; i < 4; i++) g.add(at(CONE(.025, .09, M(0xE8D8B0, { roughness: .4 }), 8), 0, .14 + i * .08, -.15, -1.2)); return g; } },
  { name: 'Pirate Captain Boots', tall: true, build: () => { const blk = M(0x1E1A16, { roughness: .25 }); return G(SOLE(.22, .42, .05, M(0x3A2A1E)), upper(blk, .11, .1, .2, .1), at(CYL(.11, .115, .36, blk, 28), 0, .3, -.03), at(CYL(.17, .125, .12, blk, 28, true), 0, .5, -.03), at(BOX(.08, .06, .02, metal(0xE0B12A, .2)), 0, .18, .12, -.4)); } },
  { name: 'Cyberpunk Boots', tall: true, build: (ctx) => { const blk = M(0x1A1A20, { roughness: .4 }); const cy = new T.MeshStandardMaterial({ color: 0x3AE0FF, emissive: 0x3AE0FF, emissiveIntensity: 1.5 }), mg = new T.MeshStandardMaterial({ color: 0xFF4FD8, emissive: 0xFF4FD8, emissiveIntensity: 1.5 });
      const g = G(SOLE(.25, .44, .11, M(0x2A2A30, { roughness: .5 })), at(BOX(.255, .015, .445, cy), 0, .055, .03), upper(blk, .12, .11, .2, .17), at(CYL(.11, .12, .2, blk, 28), 0, .3, -.03), at(BOX(.02, .14, .02, mg), ctx.side * .12, .28, -.03), at(TOR(.112, .012, mg), 0, .4, -.03, Math.PI / 2));
      if (!ctx.thumb) ctx.tick((t) => { cy.emissiveIntensity = 1.2 + Math.sin(t * 4) * .6; mg.emissiveIntensity = 1.2 + Math.cos(t * 4) * .6; }); return g; } },
  { name: 'Space Moon Boots', tall: true, build: (ctx) => { const wh = M(0xF2F2EE, { roughness: .8 }); const led = glow(0x3D7BFF, 1.4); const g = G(SOLE(.27, .46, .09, M(0x8A929C, { roughness: .7 })), upper(wh, .135, .13, .22, .15));
      [.2, .28, .36].forEach((y, i) => g.add(at(SPH(.13 - i * .005, wh), 0, y, -.03, 0, 0, 0, [1, .55, 1]))); g.add(at(SPH(.025, led), ctx.side * .13, .3, 0)); return g; } },
  // exotic
  { name: 'Swimming Flippers', build: () => { const blk = M(0x1E1E22, { roughness: .5 }), fin = M(0xF4D23A, { roughness: .35, transparent: true, opacity: .95 });
      const finG = EXTRUDE([[-.1, 0], [.1, 0], [.17, .42], [.06, .46], [0, .43], [-.06, .46], [-.17, .42]], .015, fin); finG.rotation.x = -Math.PI / 2; finG.position.set(0, .02, .12);
      const g = G(upper(blk, .11, .09, .18, .07), finG); [-.07, 0, .07].forEach((x) => g.add(at(BOX(.012, .02, .36, M(0xE0B12A)), x, .03, .32))); return g; } },
  { name: 'Tiny Thruster Shoes', build: (ctx) => { const silver = metal(0xD9DEE3, .25); const g = G(SOLE(.22, .4, .05, M(0x2A2A30)), upper(M(0xF2F2EE, { roughness: .4 })), sideStripe(ctx, 0x3AE0FF), at(CYL(.045, .06, .08, silver, 16), 0, .06, -.18, .6));
      const fl = flameCone(ctx, 0x3AE0FF, 1.1); fl.rotation.x = Math.PI - .6; fl.position.set(0, .02, -.22); g.add(fl);
      g.position.y = .07; if (!ctx.thumb) ctx.tick((t) => { g.position.y = .07 + Math.sin(t * 3 + ctx.side) * .015; }); return g; } },
  { name: 'Winged Shoes', build: (ctx) => { const g = G(SOLE(.22, .4, .05, M(0xF6F6F2)), upper(M(0xF4C93A, { roughness: .3, metalness: .4 })), laces(3, 0xFFFFFF));
      const wing = new T.Group(); [0, 1, 2, 3].forEach((i) => wing.add(at(SPH(1, M(0xFFFFFF, { roughness: .6 }), 16, 10), 0, .03 + i * .025, -.03 - i * .05, 0, 0, 0, [.012, .03, .07 - i * .008])));
      wing.position.set(ctx.side * .12, .12, -.02); wing.rotation.set(.5, 0, ctx.side * -.4); g.add(wing);
      if (!ctx.thumb) ctx.tick((t) => (wing.rotation.z = ctx.side * (-.4 - Math.sin(t * 9) * .35))); return g; } },
  // mythic
  { name: 'Hover Sneakers', build: (ctx) => { const sole = new T.MeshStandardMaterial({ color: 0x3AE0FF, emissive: 0x3AE0FF, emissiveIntensity: 1.3, roughness: .3 });
      const ring = at(TOR(.16, .02, new T.MeshStandardMaterial({ color: 0x8FF4FF, emissive: 0x8FF4FF, emissiveIntensity: 1.6, transparent: true, opacity: .8 })), 0, -.06, .03, Math.PI / 2, 0, 0, [1, 1.5, 1]);
      const shoe = G(SOLE(.22, .42, .06, sole), upper(M(0x1A1A20, { roughness: .35 }), .11, .1, .2, .1), sideStripe(ctx, 0x3AE0FF), laces(3, 0x3AE0FF));
      const g = G(shoe, ring); g.position.y = .13;
      if (!ctx.thumb) ctx.tick((t) => { g.position.y = .13 + Math.sin(t * 2.2 + ctx.side) * .03; ring.scale.set(1 + Math.sin(t * 5) * .08, 1.5, 1 + Math.sin(t * 5) * .08); sole.emissiveIntensity = 1.1 + Math.sin(t * 3) * .4; }); return g; } }
];
// ---------- ACCESSORY (21) ----------  parts on anchors: wristL/R, handL (hold = item points up, hang = item hangs down), neck, chest, back, waist, hipL/R, head, float
function wingShape(scallops = 4) { const pts = [[0, 0], [.25, .32], [.6, .5], [.95, .55], [1.05, .3]]; for (let i = 0; i <= scallops; i++) { const x = 1.05 - i * (1.05 / scallops); pts.push([x - .13, .02 + Math.sin(i * 1.3) * .03 - .12]); pts.push([x - .26, .1]); } pts.push([0, -.05]); return pts; }
function wings(ctx, makeHalf, flapAmp = .35, speed = 2.2) {
  const g = new T.Group(); const halves = [];
  [-1, 1].forEach((s) => { const h = makeHalf(s); const pivot = G(h); pivot.position.set(s * .1, .2, -.06); g.add(pivot); halves.push([pivot, s]); });
  const set = (t) => halves.forEach(([p, s]) => { p.rotation.y = s * (.35 + Math.sin(t * speed) * flapAmp); p.rotation.z = s * .1; });
  set(0); if (!ctx.thumb) ctx.tick(set);
  return g;
}
function backStraps(color) { const m = M(color, { roughness: .7 }); return [-1, 1].map((s) => TUBE([[s * .12, .2, -.02], [s * .17, .32, .12], [s * .16, .2, .5], [s * .14, -.02, .5]], .022, m)); }

const ACCESSORIES = [
  { name: '50 lb Dumbbell', key: 'acc-watch', build: () => {
      // round, heavy dumbbell held by the bar: two big iron balls with a "50" stamp
      const iron = M(0x24252B, { roughness: .45, metalness: .5 }), bar = metal(0xC9D1DB, .2);
      const stamp = canvasTex(128, 64, (c, w, h) => { c.fillStyle = '#24252B'; c.fillRect(0, 0, w, h); txt(c, '50 LB', w / 2, h / 2 + 2, 30, '#E8EAEE'); });
      const ballM = new T.MeshStandardMaterial({ map: stamp, roughness: .45, metalness: .5 });
      const g = G(at(CYL(.03, .03, .34, bar, 16), 0, 0, 0, 0, 0, Math.PI / 2),
        ...[-1, 1].map((s) => G(at(SPH(.17, s > 0 ? ballM : iron, 32, 20), s * .29, 0, 0, 0, s > 0 ? -Math.PI / 2 : Math.PI / 2, 0), at(CYL(.06, .06, .05, iron, 20), s * .15, 0, 0, 0, 0, Math.PI / 2))));
      g.position.set(0, -.06, .02);
      return [{ a: 'handL', grip: 'hang', o: g }]; } },
  { name: 'Bracelet + Chain', build: () => { const gold = metal(0xE8C04A, .18);
      const chain = new T.Group(); for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; chain.add(at(TOR(.02, .006, gold, Math.PI * 2, 6, 12), Math.sin(a) * .2, -Math.cos(a) * .05 - .02, Math.cos(a) * .2, 0, a + (i % 2) * Math.PI / 2, 0)); }
      chain.add(at(CYL(.035, .035, .012, gold, 20), 0, -.09, .21, Math.PI / 2)); chain.rotation.x = .25;
      return [{ a: 'wristR', o: G(TOR(.055, .012, gold), at(TOR(.06, .006, gold), 0, 0, .015)) }, { a: 'neck', o: chain }]; } },
  { name: 'Headphones', build: () => { const blk = M(0x2A2A2E, { roughness: .4 }), pad = M(0x8FD46A, { roughness: .9 });
      return [{ a: 'head', o: G(at(TOR(.83, .045, blk, Math.PI), 0, 2.0, 0, 0, 0, 0), ...[-1, 1].map((s) => G(at(CYL(.2, .2, .13, blk, 28), s * .81, 1.98, 0, 0, 0, Math.PI / 2), at(TOR(.15, .045, pad), s * .74, 1.98, 0, 0, Math.PI / 2, 0)))) }]; } },
  { name: 'Skateboard', build: () => { const deck = G(EXTRUDE(P2.rrect(.26, .9, .12), .03, M(0x2D5BB8, { roughness: .6 })), at(EXTRUDE(P2.rrect(.25, .88, .12), .005, M(0x1E1E22, { roughness: 1 })), 0, 0, .018));
      [-.3, .3].forEach((y) => { deck.add(at(BOX(.2, .03, .03, metal()), 0, y, -.035)); [-1, 1].forEach((s) => deck.add(at(CYL(.035, .035, .04, M(0xF4C93A, { roughness: .4 }), 16), s * .11, y, -.06, 0, 0, Math.PI / 2))); });
      const g = G(deck); g.rotation.set(0, Math.PI / 2, 0); g.position.set(0, .28, 0); return [{ a: 'handL', grip: 'hold', o: g }]; } },
  { name: 'Shopping Bag', build: () => { const kraft = M(0xC9A06B, { roughness: .9 }); const g = G(at(BOX(.34, .38, .17, kraft), 0, -.3, 0), at(mesh(new T.CircleGeometry(.07, 24), M(PIST)), 0, -.3, .086),
      TUBE([[-.08, -.11, .06], [0, .02, .06], [.08, -.11, .06]], .012, M(0x7A5A35)), TUBE([[-.08, -.11, -.06], [0, .02, -.06], [.08, -.11, -.06]], .012, M(0x7A5A35)),
      at(CYL(.035, .03, .34, M(0xE2B36A, { roughness: .7 }), 12), .08, -.08, 0, 0, 0, -.25), at(SPH(.07, M(0x2E7D4F, { roughness: .8 })), -.07, -.1, .02), at(SPH(.055, M(0x4E9A2F, { roughness: .8 })), -.12, -.08, -.03));
      return [{ a: 'handL', grip: 'hang', o: g }]; } },
  { name: 'Baseball Bat', build: () => { const wood = M(0xD4A464, { roughness: .45 }); const g = G(at(CYL(.06, .025, .9, wood, 20), 0, .42, 0), at(CYL(.027, .027, .2, M(0x1E1E22, { roughness: .9 }), 16), 0, .02, 0), at(CYL(.04, .04, .02, wood, 16), 0, -.08, 0), at(SPH(.06, wood), 0, .87, 0, 0, 0, 0, [1, .3, 1]));
      return [{ a: 'handL', grip: 'hold', o: g }]; } },
  // rare
  { name: 'Fishing Rod', build: (ctx) => { const g = G(at(CYL(.012, .028, 1.6, M(0x1E1E22, { roughness: .3 }), 12), 0, .72, 0), at(CYL(.035, .035, .2, M(0xC9A06B, { roughness: 1 }), 12), 0, 0, 0),
      at(CYL(.06, .06, .05, metal(0xC9D1DB, .3), 20), .06, .14, 0, 0, 0, Math.PI / 2), at(BOX(.08, .012, .012, metal()), .1, .17, 0));
      const line = new T.Group(); line.position.set(0, 1.52, 0); g.add(line);
      const bob = G(TUBE([[0, 0, 0], [0, -.35, 0], [0, -.7, 0]], .003, M(0xF2F2EE)), at(SPH(.04, M(0xC8281E, { roughness: .3 })), 0, -.72, 0), at(SPH(.04, M(0xFFFFFF, { roughness: .3 })), 0, -.76, 0, 0, 0, 0, [1, .6, 1]));
      line.add(bob); if (!ctx.thumb) ctx.tick((t) => { bob.rotation.z = Math.sin(t * 1.6) * .25; bob.rotation.x = Math.cos(t * 1.1) * .12; });
      return [{ a: 'handL', grip: 'hold', o: g }]; } },
  { name: 'Binoculars', build: () => { const blk = M(0x23262B, { roughness: .5 }); const b = G(...[-1, 1].map((s) => G(at(CYL(.06, .065, .2, blk, 20), s * .07, 0, 0, Math.PI / 2), at(mesh(new T.CircleGeometry(.05, 20), glass(0x6A8AB0, .8)), s * .07, 0, .101))), at(BOX(.08, .05, .1, blk), 0, 0, 0));
      return [{ a: 'chest', o: at(b, 0, -.02, .1) }, { a: 'neck', o: at(TOR(.21, .01, M(0x5A3A1E), Math.PI * 2, 6, 40), 0, -.07, .04, Math.PI / 2 + .45) }]; } },
  { name: 'Camera Bag', build: () => { const blk = M(0x2A2A2E, { roughness: .7 }); const strapM = M(0x4E5560, { roughness: .8 });
      return [{ a: 'body', o: G(TUBE([[.18, 1.0, .1], [.08, .86, .27], [-.12, .62, .27], [-.27, .48, .14]], .022, strapM), TUBE([[.18, 1.0, -.1], [0, .82, -.27], [-.22, .56, -.24], [-.3, .46, -.06]], .022, strapM),
        at(BOX(.24, .2, .14, blk), -.34, .38, .04), at(BOX(.25, .07, .15, M(0x3A3A40)), -.34, .46, .045), at(TOR(.045, .012, metal()), -.34, .36, .115), at(mesh(new T.CircleGeometry(.04, 20), glass(0x3A5A7A, .9)), -.34, .36, .112)) }]; } },
  { name: 'Shoulder Radio', build: (ctx) => { const led = new T.MeshStandardMaterial({ color: 0xFF3A2A, emissive: 0xFF3A2A, emissiveIntensity: 1.5 });
      const r = G(at(BOX(.1, .17, .05, M(0x1E1E22, { roughness: .5 })), 0, 0, 0), at(CYL(.008, .008, .16, M(0x1E1E22)), .03, .16, 0), at(SPH(.012, led), -.03, .07, .028), at(BOX(.07, .05, .006, M(0x3A3A40)), 0, -.03, .027), TUBE([[-.03, -.08, 0], [-.05, -.18, .02], [0, -.26, .03]], .007, M(0x1E1E22)));
      if (!ctx.thumb) ctx.tick((t) => (led.emissiveIntensity = (t % 1.4) < .2 ? 2 : .3));
      return [{ a: 'chest', o: at(r, -.12, .06, .02, -.2, .3, 0) }]; } },
  { name: 'Briefcase', build: () => { const lea = M(0x6B3E1E, { roughness: .45 }), gold = metal(0xE0B12A, .2);
      return [{ a: 'handL', grip: 'hang', o: G(at(BOX(.46, .32, .1, lea), 0, -.22, 0), at(TOR(.06, .014, M(0x3A2410), Math.PI), 0, -.06, 0), ...[-1, 1].map((s) => at(BOX(.05, .03, .02, gold), s * .13, -.08, .055))) }]; } },
  // epic
  { name: 'Cowboy Holster with Gun', build: () => { const lea = M(0x7A4A22, { roughness: .6 }), brass = metal(0xC9A15A, .25), steel = metal(0x7E8893, .3);
      const holster = G(at(BOX(.11, .22, .07, lea), 0, -.08, 0), at(BOX(.04, .1, .035, steel), .0, .07, .0, 0, 0, .1), at(BOX(.05, .1, .045, M(0x5A3A1E, { roughness: .5 })), -.02, .13, 0, 0, 0, -.4), at(CYL(.012, .012, .03, steel), .012, .13, .03, Math.PI / 2));
      return [{ a: 'waist', o: G(at(TOR(.265, .028, lea), 0, -.02, 0, Math.PI / 2), at(BOX(.1, .08, .02, brass), 0, -.02, .28)) }, { a: 'hipR', o: at(holster, .04, 0, 0, 0, .3, 0) }]; } },
  { name: 'Medical Bag', build: () => { const bag = M(0x2E4A3A, { roughness: .55 }); return [{ a: 'handL', grip: 'hang', o: G(at(BOX(.4, .24, .2, bag), 0, -.27, 0), at(CYL(.1, .1, .4, bag, 20, false, 0, Math.PI), 0, -.15, 0, 0, 0, Math.PI / 2, [1, .6, 1]),
      at(TOR(.06, .014, M(0x1A2A20), Math.PI), 0, -.06, 0), at(mesh(new T.CircleGeometry(.065, 24), M(0xFFFFFF)), 0, -.27, .101), at(BOX(.06, .018, .002, M(0xC8281E)), 0, -.27, .103), at(BOX(.018, .06, .002, M(0xC8281E)), 0, -.27, .103)) }]; } },
  { name: 'Basketball Backpack', key: 'acc-crystal-backpack', build: () => {
      // a basketball-shaped pack on the back, straps over both shoulders, under the arms and back to the pack
      const ballTex = canvasTex(512, 256, (c, w, h) => {
        c.fillStyle = '#E8742A'; c.fillRect(0, 0, w, h); const r = rng(4); c.fillStyle = 'rgba(120,50,10,.18)'; for (let i = 0; i < 2600; i++) c.fillRect(r() * w, r() * h, 2, 2);
        c.strokeStyle = '#1E1410'; c.lineWidth = 7; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
        [w * .25, w * .75].forEach((x) => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); });
        [0, w / 2].forEach((x0) => { c.beginPath(); c.moveTo(x0 + w * .06, 0); c.quadraticCurveTo(x0 + w * .25, h / 2, x0 + w * .06, h); c.stroke(); c.beginPath(); c.moveTo(x0 + w * .44, 0); c.quadraticCurveTo(x0 + w * .25, h / 2, x0 + w * .44, h); c.stroke(); });
      });
      const strapM = M(0xB8743A, { roughness: .6 }), zip = metal(0xC9D1DB, .25);
      const ball = at(SPH(.3, new T.MeshStandardMaterial({ map: ballTex, roughness: .75 }), 40, 28), 0, .7, -.36, 0, Math.PI / 2, 0, [1, 1.08, .78]);
      const pocket = at(SPH(.16, M(0x1E1E22, { roughness: .6 }), 24, 16), 0, .6, -.58, 0, 0, 0, [1, .8, .35]);
      const zipper = at(TOR(.13, .008, zip, Math.PI), 0, .66, -.6, 0, 0, 0);
      const straps = [-1, 1].map((s) => TUBE([[s * .1, .93, -.24], [s * .13, 1.05, -.1], [s * .15, 1.06, .06], [s * .16, .94, .16], [s * .17, .76, .17], [s * .19, .6, .09], [s * .18, .54, -.06], [s * .14, .52, -.2], [s * .12, .5, -.26]], .022, strapM, false, 64));
      return [{ a: 'body', o: G(ball, pocket, zipper, ...straps) }]; } },
  { name: 'Royal Cape', build: (ctx) => { const velvet = new T.MeshStandardMaterial({ color: 0x8E1020, roughness: .75 });
      const erm = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#FBFAF6'; c.fillRect(0, 0, w, h); c.fillStyle = '#1A1A1A'; for (let x = 8; x < w; x += 26) { c.beginPath(); c.ellipse(x, 22 + (x % 52 ? 16 : 0), 3, 7, 0, 0, 7); c.fill(); } });
      const cape = capeMesh(.98, .7, velvet, ctx, .04);
      return [{ a: 'neck', o: G(at(cape, 0, .02, -.04), at(TOR(.2, .07, new T.MeshStandardMaterial({ map: erm, roughness: 1 })), 0, .02, 0, Math.PI / 2), at(SPH(.04, metal(0xE0B12A, .2)), 0, -.02, .23)) }]; } },
  { name: 'Samurai Stick in Back Holster', build: () => { const wood = M(0x5A3A1E, { roughness: .5 }), strapM = M(0x1E1E22, { roughness: .7 });
      const staff = G(at(CYL(.03, .03, 1.7, wood, 14), 0, 0, 0), at(CYL(.032, .032, .08, metal(0xC9A15A, .3), 14), 0, .82, 0), at(CYL(.032, .032, .08, metal(0xC9A15A, .3), 14), 0, -.82, 0), at(CYL(.06, .06, .4, M(0x2A2A30, { roughness: .6 }), 16), 0, -.3, 0));
      return [{ a: 'back', o: at(staff, 0, .12, -.12, 0, 0, .75) }, { a: 'body', o: G(TUBE([[.2, .98, .08], [.08, .86, .27], [-.14, .6, .26], [-.26, .46, .1]], .02, strapM), TUBE([[.2, .98, -.08], [0, .82, -.27], [-.2, .58, -.25], [-.28, .46, -.06]], .02, strapM)) }]; } },
  { name: 'Wizard Staff', build: (ctx) => { const wood = M(0x6B4A2E, { roughness: .8 }); const orbM = new T.MeshStandardMaterial({ color: 0x8FF4FF, emissive: 0x3AE0FF, emissiveIntensity: 1.5, transparent: true, opacity: .9, roughness: .05 });
      const orb = SPH(.12, orbM); orb.position.y = 1.45;
      const g = G(TAPER([[0, -.25, 0], [.02, .3, .01], [-.02, .8, 0], [.03, 1.25, .02], [0, 1.32, 0]], .05, .035, wood), orb,
        ...[0, 1, 2].map((i) => TAPER([[0, 1.3, 0], [Math.cos(i * 2.1) * .12, 1.42, Math.sin(i * 2.1) * .12], [Math.cos(i * 2.1) * .06, 1.58, Math.sin(i * 2.1) * .06]], .025, .006, wood)));
      if (!ctx.thumb) ctx.tick((t) => { orbM.emissiveIntensity = 1.2 + Math.sin(t * 3) * .5; orb.scale.setScalar(1 + Math.sin(t * 3) * .05); });
      return [{ a: 'handL', grip: 'hold', o: g }]; } },
  // exotic
  { name: 'Demon Wings', build: (ctx) => { const mem = new T.MeshStandardMaterial({ color: 0x7A1020, roughness: .55, side: T.DoubleSide }), bone = M(0x2A0A10, { roughness: .4 });
      const g = wings(ctx, (s) => { const w = G(FLAT(wingShape(4), mem), TUBE([[0, 0, .005], [.5, .45, .005], [.95, .55, .005]], .018, bone), TUBE([[.3, .25, .005], [.5, .08, .005]], .012, bone), TUBE([[.6, .45, .005], [.75, .08, .005]], .012, bone), at(CONE(.03, .1, bone, 8), .98, .6, 0, 0, 0, -.6)); w.scale.set(s, 1, 1); return w; }, .3, 2.4);
      return [{ a: 'back', o: at(g, 0, .05, -.05) }]; } },
  { name: 'Jetpack', build: (ctx) => { const red = M(0xC8281E, { roughness: .3, metalness: .4 }), steel = metal(0xC9D1DB, .25);
      const pack = G(at(BOX(.18, .36, .14, steel), 0, .02, -.1), ...[-1, 1].map((s) => G(at(CYL(.1, .1, .44, red, 24), s * .15, .02, -.12), at(SPH(.1, red), s * .15, .24, -.12), at(CONE(.08, .1, steel, 16), s * .15, -.25, -.12, Math.PI))), ...backStraps(0x2A2A2E).map((s) => at(s, 0, 0, 0, 0, Math.PI, 0)));
      [-1, 1].forEach((s) => { const f = flameCone(ctx, 0xFF8A1E, 2.2); f.rotation.x = Math.PI; f.position.set(s * .15, -.31, -.12); pack.add(f); });
      return [{ a: 'back', o: pack }]; } },
  { name: 'Floating Books', build: (ctx) => { const g = new T.Group(); const books = [0x2D5BB8, 0xC8281E, 0x4E9A2F, 0x7A3FD0, 0xE0B12A].map((c) => { const b = G(at(BOX(.2, .26, .055, M(c, { roughness: .6 })), 0, 0, 0), at(BOX(.19, .245, .05, M(0xF6F2E6, { roughness: .9 })), .008, 0, 0), at(BOX(.012, .26, .056, M(c, { roughness: .6 })), -.1, 0, 0)); g.add(b); return b; });
      const place = (t) => books.forEach((b, i) => { const a = t * .45 + i / books.length * Math.PI * 2; b.position.set(Math.cos(a) * .95, 1.25 + Math.sin(t * 1.6 + i) * .14 + (i % 2) * .35, Math.sin(a) * .95); b.rotation.set(Math.sin(t + i) * .3, -a + Math.PI / 2, Math.cos(t * .8 + i) * .2); });
      place(.3); if (!ctx.thumb) ctx.tick(place); return [{ a: 'float', o: g }]; } },
  // mythic
  { name: 'Angel Wings', build: (ctx) => { const fm = new T.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .5, emissive: 0xFFF2CC, emissiveIntensity: .35, side: T.DoubleSide });
      const g = wings(ctx, (s) => { const w = new T.Group(); const rows = [[9, .55, .2], [8, .42, .1], [7, .3, 0]];
        rows.forEach(([n, len, y], r) => { for (let i = 0; i < n; i++) { const t = i / (n - 1); const f = at(SPH(1, fm, 12, 8), 0, 0, 0, 0, 0, 0, [len * .5 * (1 - t * .35), .055, .012]); const holder = G(f); f.position.x = len * .45; holder.position.set(.12 + t * .7, .5 - t * .25 + y - r * .02, -r * .01); holder.rotation.z = -.4 - t * 1.1 + r * .15; w.add(holder); } });
        w.scale.set(s * .82, .82, 1); return w; }, .22, 1.4);
      // sized to the body and centered on the middle of the back (not the neck)
      return [{ a: 'back', o: at(g, 0, -.28, -.02) }]; } }
];

// ---------- catalog ----------
export const RARITY = [['common', 1500, 6], ['rare', 5000, 5], ['epic', 7000, 6], ['exotic', 10000, 3], ['mythic', 25000, 1]];
export const SLOTS = [
  { key: 'top', label: 'Tops', list: TOPS },
  { key: 'hat', label: 'Hats', list: HATS },
  { key: 'glasses', label: 'Glasses', list: GLASSES },
  { key: 'shoes', label: 'Shoes', list: SHOES },
  { key: 'acc', label: 'Accessory', list: ACCESSORIES }
];
export const slugify = (slot, name) => (slot + '-' + name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const ITEMS_BY_ID = {};
SLOTS.forEach((c) => { let i = 0; RARITY.forEach(([r, price, n]) => { for (let k = 0; k < n; k++, i++) { const it = c.list[i]; it.rarity = r; it.price = price; it.slot = c.key; it.sort = i; it.id = it.key || slugify(c.key, it.name); ITEMS_BY_ID[it.id] = it; } }); });

// ---------- thumbnails ----------
let _thumb = null;
function thumbKit() {
  if (_thumb) return _thumb;
  const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(184, 184);
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight(0xFFFFFF, 0x9FB38F, 1)); const k = new T.DirectionalLight(0xFFFFFF, .8); k.position.set(3, 5, 4); scene.add(k);
  const cam = new T.PerspectiveCamera(28, 1, .05, 50);
  const w = new Whisk(); w.update(0, 1); w.root.updateMatrixWorld(true);
  const rest = {}; Object.entries(w.anchors).forEach(([key, a]) => { rest[key] = a.matrixWorld.clone(); });
  _thumb = { r, scene, cam, rest, w, cache: {} };
  return _thumb;
}
export function renderThumb(item) {
  const K = thumbKit();
  if (K.cache[item.id]) return K.cache[item.id];
  const ctx = { tick: () => {}, side: 1, thumb: true };
  const g = new T.Group();
  if (item.slot === 'top') {
    const spec = item.build(ctx); g.add(makeTorso(spec));
    ['L', 'R'].forEach((s) => { const c = new T.CatmullRomCurve3(K.w.cur[s]); if (spec.sleeve > 0) { const pts = []; for (let i = 0; i <= 20; i++) pts.push(c.getPoint(i / 20 * spec.sleeve)); g.add(mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 16, spec.sleeveR || .078, 12), spec.sleeveMat || spec.mat)); } });
    (spec.extras ? spec.extras(ctx) : []).forEach(({ a, o }) => { const h = new T.Group(); K.rest[a].decompose(h.position, h.quaternion, h.scale); h.add(o); g.add(h); });
  } else if (item.slot === 'shoes') {
    const s = item.build(ctx); s.rotation.y = -.7; g.add(s);
  } else {
    item.build(ctx).forEach(({ a, o }) => { const h = new T.Group(); K.rest[a].decompose(h.position, h.quaternion, h.scale); h.add(o); g.add(h); });
    if (item.slot === 'glasses' || item.slot === 'hat') g.rotation.y = -.35;
  }
  K.scene.add(g);
  const box = new T.Box3().setFromObject(g); const size = box.getSize(V()), center = box.getCenter(V());
  const rad = Math.max(size.x, size.y, size.z) * .62;
  const dist = rad / Math.tan(T.MathUtils.degToRad(K.cam.fov / 2));
  K.cam.position.copy(center).add(V(.35, .3, 1).normalize().multiplyScalar(dist)); K.cam.lookAt(center);
  K.r.render(K.scene, K.cam);
  const url = K.r.domElement.toDataURL('image/png');
  K.scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  K.cache[item.id] = url; return url;
}

// ---------- a mounted stage (Me page, popups) ----------
export function mountStage(container, { pose = 'default', interactive = true, zoom = 1 } = {}) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  container.appendChild(renderer.domElement);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;' + (interactive ? 'cursor:grab' : '');
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, .1, 50);
  scene.add(new T.HemisphereLight(0xFFFFFF, 0x9FB38F, .95));
  const key = new T.DirectionalLight(0xFFFFFF, .85); key.position.set(3, 5, 4); scene.add(key);
  const rim = new T.DirectionalLight(0xDDEEFF, .45); rim.position.set(-3, 3, -4); scene.add(rim);
  const fill = new T.DirectionalLight(0xFFF2E0, .25); fill.position.set(-4, 1, 3); scene.add(fill);
  const shadowTex = canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(20,30,18,.35)'); g.addColorStop(1, 'rgba(20,30,18,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const shadow = mesh(new T.PlaneGeometry(1.8, 1.2), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = .002; scene.add(shadow);
  const whisk = new Whisk(); scene.add(whisk.root); whisk.setPose(pose, true);
  const resize = () => { const w = container.clientWidth || 300, h = container.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.set(0, 1.85, (w / h < .8 ? 10.8 : 9.6) / zoom); camera.lookAt(0, 1.6, 0); camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  let yaw = -.25, vel = 0, dragging = false, lastX = 0, lastTouch = -10, raf = 0;
  const cvs = renderer.domElement;
  const down = (e) => { dragging = true; lastX = e.clientX; cvs.setPointerCapture(e.pointerId); };
  const move = (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; yaw += dx * .012; vel = dx * .012; lastTouch = clock.elapsedTime; };
  const up = () => { dragging = false; };
  if (interactive) { cvs.addEventListener('pointerdown', down); cvs.addEventListener('pointermove', move); cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up); }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new T.Clock();
  const loop = () => {
    const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    if (!dragging) { yaw += vel; vel *= .92; if (t - lastTouch > 3 && !reduce) yaw += Math.sin(t * .5) * .0025; }
    whisk.root.rotation.y = yaw; whisk.update(reduce ? 0 : t, dt); renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();
  const equipped = {};
  return {
    setPose: (p) => whisk.setPose(p),
    setOutfit: (outfit) => {
      ['top', 'hat', 'glasses', 'shoes', 'acc'].forEach((slot) => {
        const id = outfit ? outfit[slot] : null;
        if (equipped[slot] === (id || null)) return;
        equipped[slot] = id || null;
        try { whisk.equip(slot, id ? ITEMS_BY_ID[id] : null); } catch (e) { console.error('equip failed', id, e); whisk.equip(slot, null); }
      });
    },
    destroy: () => { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); renderer.forceContextLoss(); cvs.remove(); }
  };
}
export { POSE_TITLES };
