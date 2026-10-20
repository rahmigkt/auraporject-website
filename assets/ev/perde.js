// AURA — window dressing geometry and fabric, shared by the home plan (ev.html) and the studio preview (tasarla.html).
// Sources: Codex PERDE-01 (rail overhang ≥150 mm IKEA BE VIDGA, 10 mm floor gap HEMA, wave 2.3 fullness and
// 180 mm stack per metre Silent Gliss) and PERDE-HALI-ARASTIRMA-02 (separate layers with their own open fraction,
// headings that differ at the top, flat fabric length kept in every state, real-scale UVs, seeded textures).
// The panel solver keeps the arc length of the folds equal to the flat panel width (≤2 % error): when a panel parks
// in its stack it gets more, deeper folds — never less fabric. Visual proposals, not production data.
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {SHEERS, DRAPES, HEADINGS, hex, seeded} from './tekstil.js?v=20261021e';

export const TREAT = {living: 'tul-fon', bedroom: 'tul-fon', study: 'tul-fon', kitchen: 'stor', bath: 'plise', wc: 'plise'};
export const STATES = {acik: 'Gündüz · tül', yarim: 'Yarı kapalı', kapali: 'Gece · kapalı', yok: 'Perdesiz'};
export const STATE_OPEN = {acik: {sheer: 0, drape: 1, blind: 0.85}, yarim: {sheer: 0, drape: 0.5, blind: 0.5}, kapali: {sheer: 0, drape: 0, blind: 0}};
const OVER = 150, FLOOR_GAP = 10, TILE = 0.4; // m: one texture tile is 400 × 400 mm of fabric (Fabric061 scale, Codex)

// ---- fabric textures: grey-scale weave at real scale, coloured by the material; seeded, so they never change ------
const texCache = new Map();
function weaveTexture(weave, seed = 11) {
  const key = weave + seed; if (texCache.has(key)) return texCache.get(key);
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = seeded(seed * 7919 + weave.length);
  g.fillStyle = '#ececec'; g.fillRect(0, 0, N, N); const line = (y, w, a, col) => { g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, y, N, w); };
  const px = N / (TILE * 1000); // pixels per mm
  if (weave === 'slub' || weave === 'plain' || weave === 'taffeta' || weave === 'leno') {
    for (let y = 0; y < N; y += px * 0.8) line(y, 1, 0.08 + R() * 0.06, '#000');                 // weft
    for (let x = 0; x < N; x += px * 0.8) { g.globalAlpha = 0.06; g.fillStyle = '#000'; g.fillRect(x, 0, 1, N); } // warp
  }
  if (weave === 'slub') for (let i = 0; i < 260; i++) { const y = R() * N, x = R() * N, l = 20 + R() * 120; g.globalAlpha = 0.18 + R() * 0.2; g.fillStyle = R() < 0.5 ? '#fff' : '#9a9a9a'; g.fillRect(x, y, l, 1 + R() * 2.2); }
  if (weave === 'leno') { g.globalAlpha = 0.5; g.fillStyle = '#fff'; const s = px * 4; for (let y = 0; y < N; y += s) for (let x = 0; x < N; x += s) g.fillRect(x + s * 0.3, y + s * 0.3, s * 0.4, s * 0.4); }
  if (weave === 'taffeta') for (let y = 0; y < N; y += px * 1.6) line(y, px * 0.6, 0.12, '#fff');
  if (weave === 'velvet') for (let i = 0; i < 70; i++) { const x = R() * N, y = R() * N, r = 30 + R() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${R() < 0.5 ? '255,255,255' : '60,60,60'},.10)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  if (weave === 'jacquard') { for (let y = 0; y < N; y += px) line(y, 1, 0.07, '#000'); g.globalAlpha = 0.22; g.strokeStyle = '#555'; g.lineWidth = 3;
    const s = N / 4; for (let y = 0; y < N + s; y += s) for (let x = 0; x < N + s; x += s) { const o = (Math.round(y / s) % 2) * s / 2; g.beginPath(); g.ellipse(x + o, y, s * 0.18, s * 0.34, 0.6, 0, 7); g.stroke(); g.beginPath(); g.moveTo(x + o - s * 0.2, y + s * 0.3); g.quadraticCurveTo(x + o, y, x + o + s * 0.2, y - s * 0.3); g.stroke(); } }
  g.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  texCache.set(key, t); return t;
}
const matCache = new Map();
export function fabricMaterial(layer, family, color) {
  const F = layer === 'sheer' ? SHEERS[family] || SHEERS['acik-keten'] : layer === 'drape' ? DRAPES[family] || DRAPES['mat-dokuma'] : {weave: 'plain', opacity: 0.97, rough: 0.9};
  const key = layer + family + color; if (matCache.has(key)) return matCache.get(key);
  const col = new THREE.Color(hex(color)), m = new THREE.MeshPhysicalMaterial({color: col, map: weaveTexture(F.weave), roughness: F.rough, side: THREE.DoubleSide,
    transparent: F.opacity < 1, opacity: F.opacity, depthWrite: F.opacity >= 0.95, sheen: F.sheen || 0, sheenRoughness: 0.5, sheenColor: col.clone().lerp(new THREE.Color('#ffffff'), 0.35)});
  matCache.set(key, m); return m;
}
const railMat = new THREE.MeshStandardMaterial({color: '#8b857a', roughness: 0.5, metalness: 0.3});

// ---- panel geometry: arc length kept ----------------------------------------------------------------------------
const arcOf = (n, P, a) => { let L = 0, px = 0, pz = 0; const S = 64; for (let i = 1; i <= S; i++) { const x = P * i / S, z = a * Math.sin(2 * Math.PI * i / S); L += Math.hypot(x - px, z - pz); px = x; pz = z; } return n * L; };
// displayed width w, flat fabric f, amplitude limit amax (all m); start pitch from the heading → folds n, period P, amplitude a
export function solveFolds(w, f, pitch, amax) {
  let n = Math.max(2, Math.round(w / pitch));
  for (; n < 2000; n++) { const P = w / n; if (arcOf(n, P, amax) < f) continue; let lo = 0, hi = amax; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (arcOf(n, P, m) < f) lo = m; else hi = m; } return {n, P, a: (lo + hi) / 2}; }
  return {n, P: w / n, a: amax};
}
// one curtain panel in local space: x 0..w along the track, y 0..h from the hem up, z into the room
export function curtainPanel(w, f, h, heading, material) {
  const H = HEADINGS[heading] || HEADINGS.wave, displayedPitch = (2 * H.pitch / 1000) / H.full * (f / w > 1.6 ? 1 : 0.8);
  const {n, P, a} = solveFolds(w, f, displayedPitch, H.depth / 2000 * Math.max(1, Math.min(2.2, (f / w) / H.full)));
  const cols = n * 16 + 1, rows = 26, pos = [], uv = [], idx = [], top = H.pinch ? 0.13 : heading === 'pencil' ? 0.08 : 0;
  const zAt = (x, y) => { const s = Math.sin(2 * Math.PI * x / P) * a; if (!top) return s; const t = Math.max(0, (y - (h - top)) / top); if (t <= 0) return s;
    const u = ((x / P) % 1 + 1) % 1;
    if (heading === 'pencil') return s * (1 - t * 0.75) + Math.sin(2 * Math.PI * x / (P / 3)) * a * 0.18 * t;
    const bundle = u > 0.12 && u < 0.38 ? Math.sin((u - 0.12) / 0.26 * Math.PI) * a * 1.05 * (1 + 0.15 * Math.sin((u - 0.12) / 0.26 * Math.PI * H.pinch * 2)) : -a * 0.25; // pleat bundle, flat between
    return s * (1 - t) + bundle * t; };
  const arcX = []; { let L = 0, px = 0, pz = zAt(0, h / 2); arcX.push(0); for (let i = 1; i < cols; i++) { const x = w * i / (cols - 1), z = zAt(x, h / 2); L += Math.hypot(x - px, z - pz); arcX.push(L); px = x; pz = z; } }
  for (let j = 0; j < rows; j++) { const y = h * (j < rows - 6 ? j / (rows - 6) * (1 - 0.16) : 1 - 0.16 + (j - (rows - 6)) / 5 * 0.16);
    for (let i = 0; i < cols; i++) { const x = w * i / (cols - 1); pos.push(x, y, zAt(x, y)); uv.push(arcX[i] / TILE, y / TILE); } }
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const p = j * cols + i; idx.push(p, p + 1, p + cols, p + 1, p + cols + 1, p + cols); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, material); m.castShadow = material.opacity > 0.6; m.receiveShadow = true; m.userData = {arc: arcOf(n, P, a), flat: f, folds: n, amp: a}; return m;
}

// ---- one window: local frame x along the wall (0 = opening centre), y up from the floor, z into the room from the wall's
// room face. o: {w, sill, h} mm; H ceiling mm; c: curtain record (v2); open: {sheer, drape, blind} 0 closed … 1 open
export function windowTreatment(o, H, c, open = {}) {
  const G = new THREE.Group(); if (!c || c.system === 'yok') return G;
  const top = o.sill + o.h;
  if (c.system === 'stor' || c.system === 'plise') { // inside the reveal, lowered from the window head
    const ow = (o.w - 20) / 1000, op = open.blind ?? c.blind?.open ?? 0, drop = Math.max(0.06, o.h / 1000 * (1 - op)), mat = fabricMaterial('blind', 'x', c.blind?.color || 'sicak-tas');
    let g; if (c.system === 'plise') { const n = Math.max(3, Math.round(drop / 0.025)); g = new THREE.PlaneGeometry(ow, drop, 1, n * 2); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.round((p.getY(i) + drop / 2) / 0.0125) % 2) * 0.012); g.computeVertexNormals(); }
    else g = new THREE.PlaneGeometry(ow, drop);
    const m = new THREE.Mesh(g, mat); m.position.set(0, top / 1000 - drop / 2, -0.05); m.castShadow = true; G.add(m);
    const head = new THREE.Mesh(c.system === 'stor' ? new THREE.CylinderGeometry(0.022, 0.022, ow + 0.02, 20) : new THREE.BoxGeometry(ow + 0.02, 0.03, 0.035), railMat);
    if (c.system === 'stor') head.rotation.z = Math.PI / 2; head.position.set(0, top / 1000 - 0.02, -0.04); G.add(head);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(ow, 0.018, 0.02), railMat); bar.position.set(0, top / 1000 - drop, -0.045); G.add(bar);
    return G;
  }
  const Hd = HEADINGS[c.heading] || HEADINGS.wave, railW = o.w + 2 * OVER, railY = Math.min(top + 150, H - 40), hgt = (railY - 30 - FLOOR_GAP) / 1000, half = railW / 2;
  const layers = []; let z = 0.07;
  for (const L of ['sheer', 'drape']) {
    if (L === 'sheer' && !['tul-fon', 'tul'].includes(c.system)) continue; if (L === 'drape' && !['tul-fon', 'fon'].includes(c.system)) continue;
    const rec = c[L] || {}, heavy = L === 'sheer' ? 0.7 : rec.family === 'pamuk-kadife' ? 1.35 : rec.family === 'blackout' ? 1.2 : 1;
    const depth = Hd.depth / 1000 * heavy * 1.6; z += depth / 2; layers.push({L, rec, z, heavy}); z += depth / 2 + 0.03; }
  for (const {L, rec, z: lz, heavy} of layers) {
    const op = open[L] ?? rec.open ?? (L === 'sheer' ? 0 : 1), stack = Math.max(110, 180 * heavy * railW / 1000 / 2), flat = half * Hd.full, disp = half - (half - stack) * op;
    const mat = fabricMaterial(L, rec.family, rec.color);
    for (const s of [-1, 1]) { const p = curtainPanel(disp / 1000, flat / 1000, hgt, c.heading, mat); // left panel parks left, right panel right
      p.position.set(s < 0 ? -half / 1000 : half / 1000 - disp / 1000, FLOOR_GAP / 1000, lz); G.add(p); }
    if (c.heading === 'eyelet') { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, railW / 1000 + 0.12, 16), railMat); rod.rotation.z = Math.PI / 2; rod.position.set(0, railY / 1000 - 0.005, lz); G.add(rod); }
    else { const rail = new THREE.Mesh(new THREE.BoxGeometry(railW / 1000, 0.015, 0.022), railMat); rail.position.set(0, railY / 1000 - 0.008, lz); G.add(rail); }
  }
  return G;
}

// ---- every outside window of the home -------------------------------------------------------------------------
// walls/ops in mm (plan.js frames), spaceAt(p) → space, H ceiling mm, state one of STATES, choice(space) → v2 record
export function curtains(walls, ops, spaceAt, H, state = 'acik', choice = () => null) {
  const G = new THREE.Group(); if (state === 'yok') return G;
  const W = Object.fromEntries(walls.map(w => [w.id, w]));
  for (const o of ops) {
    const w = W[o.wall_id]; if (!w || o.ghost || o.entry) continue;
    const mid = o.a + o.w / 2, mx = w.x0 + w.ux * mid, my = w.y0 + w.uy * mid, probe = w.t / 2 + 300;
    const sides = [1, -1].map(k => ({k, s: spaceAt([mx + w.uy * probe * k, my - w.ux * probe * k])}));
    const out = sp => !sp || sp.kind === 'balcony' || sp.kind === 'terrace';
    const inner = sides.find(x => x.s && !out(x.s)), outer = sides.find(x => x !== inner);
    if (!inner || !out(outer?.s)) continue;
    if (o.kind === 'door' && outer.s == null) continue;
    const t = choice(inner.s); if (!t) continue;
    const kind = TREAT[inner.s.kind], c = {...t.curtain};
    if (!t.room) { if (!kind) continue; if (['stor', 'plise'].includes(kind) && c.system !== 'yok') c.system = kind; } // wet rooms keep blinds unless the room itself was chosen
    const g = windowTreatment({w: o.w, sill: o.sill, h: o.h}, H, c, STATE_OPEN[state]);
    const nx = w.uy * inner.k, ny = -w.ux * inner.k, off = w.t / 2, cx = mx + nx * off, cy = my + ny * off;
    g.position.set(cx / 1000, 0, -cy / 1000); g.rotation.y = Math.atan2(nx, -ny); G.add(g);
  }
  return G;
}
