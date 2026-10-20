// AURA ev planı — window dressing as a hidden layer of the home project (curtains, sheers, roller and pleated blinds).
// Geometry follows Codex's PERDE-01 research (knowledge/ev-projesi/veri/perde-gorunum.json, perde-hesap.json):
// rail overhang ≥150 mm each side (IKEA BE VIDGA), 10 mm floor clearance (HEMA), wave fullness 2.3 and stack
// 180 mm per metre of track (Silent Gliss), fold pitch 120 / depth 60 and shader opacities sheer .25, dimout .8,
// blackout 1 (AURA visual proposals). The flat fabric width (rail × fullness) is kept in the folds; an open panel
// parks in its stack, it is never squeezed to zero. Country never picks the treatment — the room and the person do.
import * as THREE from '../vendor/three.module.js?v=20261016b';

export const TREAT = { // default suggestion per room function; a starting point for the conversation
  living: {sheer: true, drape: 'dimout', heading: 'wave'},
  bedroom: {sheer: true, drape: 'blackout', heading: 'wave'},
  study: {sheer: true, drape: 'dimout', heading: 'wave'},
  kitchen: {shade: 'roller'},
  bath: {shade: 'pleated'}, wc: {shade: 'pleated'}
};
// customer choices: model and colour (per room, falling back to the whole home)
import {MODELS, FABRICS} from './tekstil.js?v=20261021d';
export {MODELS, FABRICS};
export const TREAT_NAME = {sheer: 'tül', dimout: 'fon (ışık kesen)', blackout: 'karartma fon', roller: 'stor', pleated: 'plise'};
const FULL = {wave: 2.3}, OVER = 150, FLOOR_GAP = 10, PITCH = 120, STACK_PER_M = 180;
const OPACITY = {sheer: 0.25, dimout: 0.8, blackout: 1};
const COLOR = {sheer: '#fbf8f1', dimout: '#d8cdbb', blackout: '#8d9188', roller: '#e8e1d3', pleated: '#efe8da', rail: '#8b857a'};
// state: 'acik' day (sheer drawn, drapes parked), 'yarim' drapes half, 'kapali' night (all drawn), 'yok' none
export const STATES = {acik: 'Gündüz · tül', yarim: 'Yarı kapalı', kapali: 'Gece · kapalı', yok: 'Perdesiz'};

const mats = {};
const mat = (k, col) => mats[k + (col || '')] ??= new THREE.MeshStandardMaterial({color: k === 'sheer' || k === 'rail' ? COLOR[k] : col || COLOR[k], roughness: 0.9, side: THREE.DoubleSide,
  transparent: (OPACITY[k] ?? 1) < 1, opacity: OPACITY[k] ?? 1, depthWrite: (OPACITY[k] ?? 1) >= 1});

// one panel: displayed width w (m), flat fabric width f (m), height h (m); soft S folds that keep the fabric length
function panel(w, f, h, kind, col) {
  const n = Math.max(2, Math.round(f * 1000 / (2 * PITCH))), P = w / n, r = Math.max(1, f / w);
  const a = Math.min(P * 0.6, P / Math.PI * Math.sqrt((r * r - 1) / 2)), seg = n * 8;
  const g = new THREE.PlaneGeometry(w, h, seg, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + w / 2; p.setZ(i, a * Math.sin(2 * Math.PI * x / P)); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, mat(kind, col)); m.castShadow = kind !== 'sheer'; m.receiveShadow = true; return m;
}

// walls/ops in mm (plan.js frames), spaceAt(p) → space, H ceiling mm, state one of STATES
export function curtains(walls, ops, spaceAt, H, state = 'acik', choice = () => ({})) {
  const G = new THREE.Group(); if (state === 'yok') return G;
  const W = Object.fromEntries(walls.map(w => [w.id, w]));
  for (const o of ops) {
    const w = W[o.wall_id]; if (!w || o.ghost || o.entry) continue;
    const mid = o.a + o.w / 2, mx = w.x0 + w.ux * mid, my = w.y0 + w.uy * mid, probe = w.t / 2 + 300;
    const sides = [1, -1].map(k => ({k, s: spaceAt([mx + w.uy * probe * k, my - w.ux * probe * k])}));
    const out = sp => !sp || sp.kind === 'balcony' || sp.kind === 'terrace';
    const inner = sides.find(x => x.s && !out(x.s)), outer = sides.find(x => x !== inner);
    if (!inner || !out(outer?.s)) continue;                // only openings to the outside or a balcony
    if (o.kind === 'door' && outer.s == null) continue;    // a street door gets no curtain
    const ch = choice(inner.s) || {}, T = (ch.model && MODELS[ch.model]?.[1]) || TREAT[inner.s.kind]; if (!T || ch.model === 'yok') continue;
    const col = (FABRICS.find(f => f[0] === ch.color) || [])[2];
    const nx = w.uy * inner.k, ny = -w.ux * inner.k;      // unit normal into the room (plan)
    const at = (along, off) => [ (w.x0 + w.ux * along + nx * off) / 1000, -(w.y0 + w.uy * along + ny * off) / 1000 ];
    const rot = Math.atan2(w.uy, w.ux), top = o.sill + o.h;
    if (T.shade) { // inside the reveal: a fabric blind lowered from the window head
      const c = {acik: 0.12, yarim: 0.5, kapali: 1}[state], drop = Math.max(60, o.h * c), [x, z] = at(mid, w.t / 2 - 50);
      const m = new THREE.Mesh(new THREE.BoxGeometry((o.w - 20) / 1000, drop / 1000, 0.006), mat(T.shade, col));
      if (T.shade === 'pleated') { const g = m.geometry, n = Math.max(4, Math.round(drop / 25)); m.geometry = new THREE.PlaneGeometry((o.w - 20) / 1000, drop / 1000, 1, n * 2);
        const p = m.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (Math.round((p.getY(i) + drop / 2000) * 1000 / 12.5) % 2) * 0.008); m.geometry.computeVertexNormals(); g.dispose(); }
      m.position.set(x, (top - drop / 2) / 1000, z); m.rotation.y = rot; m.castShadow = true; G.add(m);
      const box = new THREE.Mesh(new THREE.BoxGeometry(o.w / 1000, 0.045, 0.045), mat('rail')); box.position.set(x, top / 1000 - 0.02, z); box.rotation.y = rot; G.add(box);
      continue;
    }
    const railW = o.w + 2 * OVER, railY = Math.min(top + 150, H - 40), hgt = (railY - 30 - FLOOR_GAP) / 1000, cy = (FLOOR_GAP / 1000) + hgt / 2;
    const layers = [];
    if (T.sheer) layers.push({kind: 'sheer', off: w.t / 2 + 90, c: state === 'yarim' ? 1 : 1});
    if (T.drape) layers.push({kind: T.drape, off: w.t / 2 + 190, c: {acik: 0, yarim: 0.5, kapali: 1}[state]});
    for (const L of layers) {
      const half = railW / 2, stack = Math.max(120, STACK_PER_M * railW / 1000 / 2), flat = half * FULL[T.heading];
      const disp = stack + (half - stack) * L.c;                      // displayed width of each panel
      for (const s of [0, 1]) { // left panel from rail start, right panel from rail end
        const pm = panel(disp / 1000, flat / 1000, hgt, L.kind, col), along = s ? o.a + o.w + OVER - disp / 2 : o.a - OVER + disp / 2, [x, z] = at(along, L.off);
        pm.position.set(x, cy, z); pm.rotation.y = rot; G.add(pm);
      }
      const [x, z] = at(mid, L.off), rail = new THREE.Mesh(new THREE.BoxGeometry(railW / 1000, 0.015, 0.02), mat('rail'));
      rail.position.set(x, railY / 1000 - 0.01, z); rail.rotation.y = rot; G.add(rail);
    }
  }
  return G;
}
