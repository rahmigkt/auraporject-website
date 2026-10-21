// AURA ev planı — whole-home record (EV-01 schema) drawn as a measured plan and raised to 3D from the same data.
// Plan graphics follow the EV-QWEN-00D review drawings the user approved: rooms tinted by function, dark slate walls,
// blue windows across the wall, light door gaps, red entrance mark, north up (plan y grows to the north).
import * as THREE from '../vendor/three.module.js?v=20261016b';
import {PAINTS, FLOORS, SCHEMES, paintHex, floorTexture} from './finishes.js?v=20261020r';
import {compileItem, footprint, itemName} from './items.js?v=20261022a';
import {applyRoomLayout, placedItems} from './layout-state.js?v=20261022a';
import {accessories} from './aksesuar.js?v=20261021e';
import {rugMesh} from './hali.js?v=20261021e';
import {migrate, merged, chooserHTML, applyChoice, TEXTILE_CSS, TEXTILE_KEY} from './tekstil.js?v=20261021e';
import {curtains, STATES as PSTATES} from './perde.js?v=20261021e';

const $ = s => document.querySelector(s), NS = 'http://www.w3.org/2000/svg';
const val = q => (q && typeof q === 'object' ? q.value : q) ?? 0;
const S = {view: 'plan', room: null, name: ''}, hooks = {};
const COLORS = {living: '#ecd7ae', kitchen: '#cddbbf', bath: '#bbdce1', wc: '#a9cfd7', hall: '#eee9df', bedroom: '#ccdae7', utility: '#ded5e3', other: '#d4e0e5', balcony: '#d3e4bf', terrace: '#d3e4bf', stair: '#d5cce4', study: '#e4dccb', dining: '#ecd7ae'};
const NAMES = {living: 'Salon', kitchen: 'Mutfak', bath: 'Banyo', wc: 'WC', hall: 'Hol', bedroom: 'Yatak odası', utility: 'Kiler / servis', other: 'Oda', balcony: 'Balkon', terrace: 'Teras', stair: 'Merdiven', study: 'Çalışma', dining: 'Yemek'};
const INK = {wall: '#424949', window: '#4b9dc0', door: '#faf8f1', roomLine: '#b7bab8', text: '#24333c', entry: '#b44e31', paper: '#f6f4ef', select: '#AD503E'};
const EXAMPLES = [['ornekler/sohbet-1.json', 'Sohbet örneği · Brüksel 2+1, mobilyalı'], ['ornek-plan.json', 'Örnek 3+1 (sentetik)'], ...Array.from({length: 6}, (_, i) => [`ornekler/gercek-${i + 1}.json`, `Gerçek plan ${i + 1} · İsviçre`])];

// ---- record → geometry ------------------------------------------------------------------------------------
let D, walls, W, ops, H, all;
const area = b => Math.abs(b.reduce((s, [x, y], i) => { const [u, v] = b[(i + 1) % b.length]; return s + x * v - u * y; }, 0)) / 2e6;
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; };
// Openings of a wall, plus openings of any overlapping parallel wall (imported plans can carry duplicate wall
// segments; a door must cut through all of them or it renders as a solid wall and blocks walking).
const opsCache = new Map();
const opsOf = id => { if (opsCache.has(id)) return opsCache.get(id); const w = W[id], out = ops.filter(o => o.wall_id === id).map(o => ({...o}));
  if (w) for (const o of ops) { if (o.wall_id === id) continue; const v = W[o.wall_id]; if (!v || Math.abs(v.ux * w.ux + v.uy * w.uy) < 0.985) continue;
    const off = Math.abs((v.x0 - w.x0) * -w.uy + (v.y0 - w.y0) * w.ux); if (off > (v.t + w.t) / 2) continue;
    const p0 = [v.x0 + v.ux * o.a, v.y0 + v.uy * o.a], p1 = [v.x0 + v.ux * (o.a + o.w), v.y0 + v.uy * (o.a + o.w)];
    let a = (p0[0] - w.x0) * w.ux + (p0[1] - w.y0) * w.uy, b = (p1[0] - w.x0) * w.ux + (p1[1] - w.y0) * w.uy; if (a > b) [a, b] = [b, a];
    a = Math.max(0, a); b = Math.min(w.L, b); if (b - a > 50) out.push({...o, a, w: b - a, ghost: true}); }
  out.sort((p, q) => p.a - q.a); opsCache.set(id, out); return out; };
function load(rec, name, keep = false) {
  D = rec; if (!D.decor) { let t = null; try { t = JSON.parse(localStorage.getItem(TEXTILE_KEY)); } catch {} D.decor = migrate(t); } else D.decor = migrate(D.decor); for (const s of D.spaces || []) if (s.decor) s.decor = migrate(s.decor); S.name = name; if (!keep) { S.room = null; vb = null; }
  walls = D.walls.map(w => { const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0) || 1;
    return {...w, x0, y0, x1, y1, L, ux: (x1 - x0) / L, uy: (y1 - y0) / L, t: val(w.thickness) || 120}; });
  W = Object.fromEntries(walls.map(w => [w.id, w]));
  ops = D.openings.map(o => ({...o, a: val(o.offset_from_wall_start), w: val(o.width), h: val(o.height) || 2100, sill: val(o.sill_height),
    entry: o.entry ?? (o.kind === 'door' && (o.space_ids || []).length === 1)}));
  H = Math.max(...D.spaces.map(s => val(s.ceiling_height) || 2600)); opsCache.clear();
  all = bbox([...walls.flatMap(w => [[w.x0 - w.t / 2, w.y0 - w.t / 2], [w.x1 + w.t / 2, w.y1 + w.t / 2]]), ...D.spaces.flatMap(s => s.boundary_xy_mm)]);
}
// solid pieces of a wall along its length: [from, to, bottom, top] in mm (openings leave sill and lintel)
function pieces(w) {
  const out = []; let s = 0;
  for (const o of opsOf(w.id)) {
    if (o.a > s) out.push([s, o.a, 0, H]);
    if (o.sill > 0) out.push([o.a, o.a + o.w, 0, o.sill]);
    if (o.sill + o.h < H) out.push([o.a, o.a + o.w, o.sill + o.h, H]);
    s = Math.max(s, o.a + o.w);
  }
  if (s < w.L) out.push([s, w.L, 0, H]);
  return out;
}
const band = (w, a, b) => { const nx = -w.uy * w.t / 2, ny = w.ux * w.t / 2, p = t => [w.x0 + w.ux * t, w.y0 + w.uy * t], [ax, ay] = p(a), [bx, by] = p(b);
  return [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]; };
const centroid = b => { let x = 0, y = 0, A = 0; b.forEach(([x0, y0], i) => { const [x1, y1] = b[(i + 1) % b.length], c = x0 * y1 - x1 * y0; A += c; x += (x0 + x1) * c; y += (y0 + y1) * c; }); return A ? [x / (3 * A), y / (3 * A)] : b[0]; };

// ---- 2D plan (SVG): plan y is north, the screen shows north up --------------------------------------------
const svg = $('#plan'), el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; };
const pts = arr => arr.map(([x, y]) => `${x.toFixed(1)},${(-y).toFixed(1)}`).join(' ');
let vb = null;
function drawPlan() {
  svg.innerHTML = '';
  const pad = 900; vb ??= [all.x0 - pad, -all.y1 - pad, all.x1 - all.x0 + 2 * pad, all.y1 - all.y0 + 2 * pad];
  svg.setAttribute('viewBox', vb.join(' '));
  el('rect', {x: vb[0] - 1e5, y: vb[1] - 1e5, width: 3e5, height: 3e5, fill: INK.paper});
  for (const s of D.spaces) el('polygon', {points: pts(s.boundary_xy_mm), fill: COLORS[s.kind] || '#ddd', stroke: S.room === s.id ? INK.select : INK.roomLine, 'stroke-width': S.room === s.id ? 50 : 8, 'data-room': s.id, style: 'cursor:pointer'});
  const g = el('g', {fill: INK.wall});
  for (const w of walls) for (const [a, b, lo] of pieces(w)) if (lo === 0) el('polygon', {points: pts(band(w, a, b)), 'data-wall': w.id}, g);
  for (const o of ops) { const w = W[o.wall_id]; if (!w) continue; el('polygon', {points: pts(band(w, o.a, o.a + o.w)), fill: o.kind === 'window' ? INK.window : INK.door, 'data-op': o.id, 'data-wall': w.id}); }
  const ACC = accessories(D);
  for (const r of ACC.rugs) el('polygon', {points: pts(r.poly), fill: r.color, 'fill-opacity': 0.35, stroke: r.color, 'stroke-width': 14, 'stroke-dasharray': '60 40', style: 'pointer-events:none'});
  for (const it of placedItems(D.items)) { if (!it.design) continue; const f = footprint(it), k = Math.max(vb[2], vb[3]) / 900;
    el('polygon', {points: pts(f), fill: 'rgba(255,253,248,.78)', stroke: '#6b645a', 'stroke-width': 14, 'data-item': it.id});
    const fr = [(f[2][0] + f[3][0]) / 2, (f[2][1] + f[3][1]) / 2], c = centroid(f); el('line', {x1: c[0], y1: -c[1], x2: fr[0], y2: -fr[1], stroke: '#b9b1a3', 'stroke-width': 10});
    const t = el('text', {x: c[0], y: -c[1] + 50, 'text-anchor': 'middle', 'font-size': 120, fill: '#5d574e', style: 'pointer-events:none'}); t.textContent = itemName(it); }
  for (const l of ACC.lights) { const [x, y] = l.pos, r = l.kind === 'ceiling' ? 110 : 80, g2 = el('g', {stroke: '#b08a3e', 'stroke-width': 14, fill: 'none', style: 'pointer-events:none'});
    el('circle', {cx: x, cy: -y, r}, g2); el('line', {x1: x - r * .7, y1: -y - r * .7, x2: x + r * .7, y2: -y + r * .7}, g2); el('line', {x1: x - r * .7, y1: -y + r * .7, x2: x + r * .7, y2: -y - r * .7}, g2); }
  for (const s of D.spaces) {
    const b = bbox(s.boundary_xy_mm), [cx, cy] = centroid(s.boundary_xy_mm), fs = Math.min(260, Math.max(130, Math.min(b.x1 - b.x0, b.y1 - b.y0) / 6));
    const t = el('text', {x: cx, y: -cy, 'text-anchor': 'middle', 'font-size': fs, fill: INK.text, style: 'pointer-events:none'});
    t.textContent = (s.name || NAMES[s.kind] || 'Oda').replace(/\s+\d+$/, '');
    const m = el('tspan', {x: cx, dy: fs * 1.3}, t); m.textContent = `${area(s.boundary_xy_mm).toFixed(1)} m²`;
  }
  for (const o of ops.filter(o => o.entry)) { const w = W[o.wall_id]; if (!w) continue; const m = o.a + o.w / 2, x = w.x0 + w.ux * m, y = w.y0 + w.uy * m;
    el('circle', {cx: x, cy: -y, r: 210, fill: 'none', stroke: INK.entry, 'stroke-width': 60});
    const t = el('text', {x, y: -y - 300, 'font-size': 220, 'text-anchor': 'middle', fill: '#963e28'}); t.textContent = 'GİRİŞ'; }
  const n = el('text', {x: all.x1 + 200, y: -all.y1 - 300, 'font-size': 240, fill: INK.text}); n.textContent = 'K ↑';
  hooks.overlay?.();
}
{ // pan / zoom: one finger or mouse drags, wheel or two fingers zoom, tap a room to select it
  const P = new Map(); let last = null;
  const toMM = (dx, dy) => { const r = svg.getBoundingClientRect(), k = Math.max(vb[2] / r.width, vb[3] / r.height); return [dx * k, dy * k]; };
  const zoom = k => { const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2; vb[2] *= k; vb[3] *= k; vb[0] = cx - vb[2] / 2; vb[1] = cy - vb[3] / 2; svg.setAttribute('viewBox', vb.join(' ')); };
  svg.addEventListener('pointerdown', e => { if (P.size === 0 && hooks.down?.(e)) { S.tool_drag = e.pointerId; svg.setPointerCapture(e.pointerId); return; } P.set(e.pointerId, [e.clientX, e.clientY]); svg.setPointerCapture(e.pointerId); last = null; S.moved = false; });
  svg.addEventListener('pointermove', e => {
    hooks.move?.(e, S.tool_drag === e.pointerId); if (S.tool_drag === e.pointerId) return;
    if (!P.has(e.pointerId)) return; const prev = P.get(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
    if (P.size === 1) { const [dx, dy] = toMM(e.clientX - prev[0], e.clientY - prev[1]); if (Math.abs(dx) + Math.abs(dy) > 1) S.moved = true; vb[0] -= dx; vb[1] -= dy; svg.setAttribute('viewBox', vb.join(' ')); }
    else if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) zoom(last / d); last = d; S.moved = true; }
  });
  const up = e => { P.delete(e.pointerId); last = null; };
  svg.addEventListener('pointerup', e => { if (S.tool_drag === e.pointerId) { S.tool_drag = null; hooks.up?.(e); return; } const t = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-room]'); if (!S.moved && t) pick(t.dataset.room); up(e); });
  svg.addEventListener('pointercancel', e => { if (S.tool_drag === e.pointerId) { S.tool_drag = null; hooks.up?.(e); } up(e); });
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); }, {passive: false});
}

// ---- 3D (same data; plan y → −z so north stays north) -----------------------------------------------------
const canvas = $('#three'), renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
const scene = new THREE.Scene(); scene.background = new THREE.Color(INK.paper);
const cam = new THREE.PerspectiveCamera(50, 1, 0.05, 300);
const hemi = new THREE.HemisphereLight('#fffaf0', '#b9ae9a', 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(6, 12, -4); scene.add(sun); scene.add(sun.target);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
// ---- atmosphere: the aura of the room through the day ------------------------------------------------------
// Sun from latitude, season and hour (solar position, north up on the plan); daylight enters only through the
// window openings when the ceiling is on. Moments combine daylight with warm lamp light.
const CITIES = {bruksel: ['Brüksel', 50.85], amsterdam: ['Amsterdam', 52.37], berlin: ['Berlin', 52.52], paris: ['Paris', 48.86], londra: ['Londra', 51.51], kopenhag: ['Kopenhag', 55.68], madrid: ['Madrid', 40.42], roma: ['Roma', 41.9], istanbul: ['İstanbul', 41.01]};
const SEASONS = {kis: ['Kış', 355], ilkbahar: ['İlkbahar', 80], yaz: ['Yaz', 172], sonbahar: ['Sonbahar', 266]};
const MOMENTS = {gun: ['Gün ışığı', 13, 0], sabah: ['Sabah kahvesi', 8, 0], aksam: ['Akşam okuması', 20, 1], misafir: ['Misafir yemeği', 21, 1.5]};
const A = {perde: 'acik', wallH: 1100, city: 'bruksel', season: 'sonbahar', hour: 13, moment: 'gun', lamps: 0, human: true};
function sunPos() {
  const lat = CITIES[A.city][1] * Math.PI / 180, N = SEASONS[A.season][1], dec = 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (284 + N) / 365), Ha = (A.hour - 12) * 15 * Math.PI / 180;
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(Ha));
  const az = Math.atan2(Math.sin(Ha), Math.cos(Ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI; // from north, clockwise
  return {alt, az};
}
const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t)));
function applyAtmos() {
  const {alt, az} = sunPos(), up = Math.sin(alt), day = Math.max(0, Math.min(1, (alt + 0.05) / 0.25));
  const cx = (all.x0 + all.x1) / 2000, cz = -(all.y0 + all.y1) / 2000, R = Math.max(all.x1 - all.x0, all.y1 - all.y0) / 1000 + 4;
  sun.target.position.set(cx, 0, cz); sun.position.set(cx + Math.sin(az) * Math.cos(alt) * 40, Math.max(0.5, up * 40), cz - Math.cos(az) * Math.cos(alt) * 40);
  Object.assign(sun.shadow.camera, {left: -R, right: R, top: R, bottom: -R, near: 1, far: 120}); sun.shadow.camera.updateProjectionMatrix();
  sun.intensity = alt > 0 ? 0.6 + 2.6 * Math.sqrt(up) : 0; sun.color = mix('#ff9a52', '#fff4e2', up / 0.45);
  hemi.intensity = 0.25 + 1.25 * day; hemi.color = mix('#2c3c5c', '#f3f1ea', day); hemi.groundColor = mix('#1d1f24', '#b9ae9a', day);
  const lamp = A.lamps, own = lampLights.length > 0; roomLight.color.set('#ffcf9a'); roomLight.intensity = (S.view === 'room' ? 0.4 + lamp * 3.2 : lamp * 1.5) * (own ? 0.35 : 1);
  for (const pl of lampLights) pl.intensity = lamp * (pl.userData.k === 'ceiling' ? 1.4 : pl.userData.k === 'desk' ? 0.8 : 1.8); shadeMat.emissiveIntensity = lamp ? 0.9 : 0;
  ceilMat.emissiveIntensity = 0.06 + 0.12 * day + lamp * 0.12; ceilMat.emissive.set(lamp ? '#ffe2bf' : '#fbf9f4');
  scene.background = S.view === 'room' ? mix('#141b2b', mix('#f4c49a', '#d7e3ea', up / 0.4), day) : new THREE.Color(INK.paper);
}
const human = new THREE.Group(); { const m = new THREE.MeshStandardMaterial({color: '#d8d2c6', roughness: 0.9});
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.12, 6, 16), m); body.position.y = 0.73; body.scale.set(1, 1, 0.62);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 14), m); head.position.y = 1.58; human.add(body, head); human.traverse(o => { o.castShadow = true; }); }
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({color: '#b7b29f', roughness: 1})); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true;
const wallMat = new THREE.MeshStandardMaterial({color: '#f2ede3', roughness: 0.9}), capMat = new THREE.MeshStandardMaterial({color: INK.wall, roughness: 0.9});
const ceilMat = new THREE.MeshStandardMaterial({color: '#fbf9f4', emissive: '#fbf9f4', emissiveIntensity: 0.35, roughness: 1, side: THREE.DoubleSide});
const roomLight = new THREE.PointLight('#fff6e8', 0, 0, 1.2); scene.add(roomLight);
const floorMats = {}; const floorMat = k => floorMats[k] ??= new THREE.MeshStandardMaterial({color: COLORS[k] || '#ddd', roughness: 0.85, side: THREE.DoubleSide});
const selMat = new THREE.MeshStandardMaterial({color: '#e2b49f', roughness: 0.8, side: THREE.DoubleSide});
const finishOf = s => { const sc = SCHEMES[D.scheme] || SCHEMES.iskandinav, f = s.finish || {};
  return {wall: f.wall || sc.walls[s.kind] || sc.walls._, floor: f.floor || sc.floors[s.kind] || sc.floors._}; };
const paintMats = {}, paintMat = id => paintMats[id] ??= new THREE.MeshStandardMaterial({color: paintHex(id), roughness: 0.92});
const floorMats2 = {}, floorFinish = id => floorMats2[id] ??= new THREE.MeshStandardMaterial({map: floorTexture(id), roughness: 0.72, side: THREE.DoubleSide});
const spaceAt = p => D.spaces.find(s => inside(p, s.boundary_xy_mm));
const lampLights = [], shadeMat = new THREE.MeshStandardMaterial({color: '#f3ead8', emissive: '#ffd9a8', emissiveIntensity: 0, roughness: 0.8, side: THREE.DoubleSide}), metalMat = new THREE.MeshStandardMaterial({color: '#3c3a36', roughness: 0.5, metalness: 0.4});
function lampObject(l) { const g = new THREE.Group(), add = (geo, m, y) => { const o = new THREE.Mesh(geo, m); o.position.y = y; g.add(o); return o; };
  if (l.kind === 'ceiling') add(new THREE.CylinderGeometry(0.17, 0.2, 0.07, 32), shadeMat, H / 1000 - 0.04);
  else if (l.kind === 'pendant') { const y = l.h / 1000; add(new THREE.CylinderGeometry(0.004, 0.004, H / 1000 - y - 0.2, 6), metalMat, (H / 1000 + y + 0.2) / 2); add(new THREE.CylinderGeometry(0.05, 0.24, 0.22, 32, 1, true), shadeMat, y + 0.11); }
  else if (l.kind === 'floor') { const y = l.h / 1000; add(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 24), metalMat, 0.01); add(new THREE.CylinderGeometry(0.011, 0.011, y - 0.3, 8), metalMat, (y - 0.3) / 2); add(new THREE.CylinderGeometry(0.19, 0.21, 0.3, 32, 1, true), shadeMat, y - 0.15); }
  else { const y = l.h / 1000; add(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 16), metalMat, y + 0.01); add(new THREE.CylinderGeometry(0.008, 0.008, 0.34, 6), metalMat, y + 0.18); add(new THREE.CylinderGeometry(0.05, 0.09, 0.12, 24, 1, true), shadeMat, y + 0.38); }
  g.traverse(o => { o.castShadow = o.material !== shadeMat; }); return g; }
let house = null, productObject = null; const products = new Map();
function build(cut) {
  if (house) { scene.remove(house); house.traverse(o => { if (o.geometry && !o.userData.keep) o.geometry.dispose(); }); }
  house = new THREE.Group(); scene.add(house); if (S.view === 'room') house.add(ground); ground.userData.keep = true;
  if (placedItems(D.items).some(i => i.design)) { if (!productObject) import('../forma/scene.js').then(m => { productObject = m.productObject; if (S.view !== 'plan') show(S.view); });
    else for (const it of placedItems(D.items)) { if (!it.design) continue; const key = it.id + JSON.stringify([it.design, it.size_mm]); let o = products.get(key);
      if (!o) { const {compiled, materials} = compileItem(it); o = productObject(compiled, materials, {onReady: () => render()}); o.traverse(x => { x.userData.keep = true; }); products.set(key, o); }
      o.position.set(it.pos_xy_mm[0] / 1000, 0, -it.pos_xy_mm[1] / 1000); o.rotation.y = (it.rot_deg || 0) * Math.PI / 180; house.add(o); } }
  const hs = D.spaces.find(x => x.id === S.room); if (A.human && hs && S.view !== 'maket') { // stand where nothing is placed: free floor point closest to the room centre
    const b = bbox(hs.boundary_xy_mm), [cx0, cy0] = centroid(hs.boundary_xy_mm), feet = placedItems(D.items).filter(i => i.design).map(i => footprint(i)); let best = [cx0, cy0], bd = Infinity;
    for (let x = b.x0 + 400; x < b.x1 - 400; x += 200) for (let y = b.y0 + 400; y < b.y1 - 400; y += 200) { const p = [x, y]; if (!inside(p, hs.boundary_xy_mm) || feet.some(f => inside(p, f) || f.some(q => Math.hypot(q[0] - x, q[1] - y) < 450))) continue; const d = Math.hypot(x - cx0, y - cy0); if (d < bd) { bd = d; best = p; } }
    human.position.set(best[0] / 1000, 0, -best[1] / 1000); human.traverse(o => { o.userData.keep = true; }); house.add(human); }
  for (const s of D.spaces) {
    const sh = new THREE.Shape(s.boundary_xy_mm.map(([x, y]) => new THREE.Vector2(x / 1000, y / 1000)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), S.room === s.id && S.view === 'maket' ? selMat : floorFinish(finishOf(s).floor)); m.rotation.x = -Math.PI / 2; m.position.y = 0.001; m.receiveShadow = true; m.userData = {floor: s.id}; house.add(m);
    if (S.view === 'room') { const c = new THREE.Mesh(new THREE.ShapeGeometry(sh), ceilMat); c.rotation.x = -Math.PI / 2; c.position.y = H / 1000; c.castShadow = true; house.add(c);
      const cap = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({colorWrite: false})); cap.rotation.x = -Math.PI / 2; cap.position.y = H / 1000 + 0.15; cap.castShadow = true; house.add(cap); }
  }
  { const ACC = accessories(D); lampLights.length = 0;
    for (const r of ACC.rugs) { const c = r.poly.reduce((m, p) => [m[0] + p[0] / 4, m[1] + p[1] / 4], [0, 0]), a = Math.hypot(r.poly[1][0] - r.poly[0][0], r.poly[1][1] - r.poly[0][1]), f = Math.hypot(r.poly[2][0] - r.poly[1][0], r.poly[2][1] - r.poly[1][1]);
      const m = rugMesh(a, f, r.rug); m.position.set(c[0] / 1000, 0, -c[1] / 1000); m.rotation.y = Math.atan2(r.poly[1][1] - r.poly[0][1], r.poly[1][0] - r.poly[0][0]); m.receiveShadow = true; house.add(m); }
    for (const l of ACC.lights) { if (S.view === 'maket' && (l.kind === 'ceiling' || l.kind === 'pendant')) continue;
      const g3 = lampObject(l), y = l.kind === 'ceiling' ? H / 1000 - 0.12 : l.kind === 'desk' ? l.h / 1000 + 0.3 : l.h / 1000 - 0.15;
      g3.position.set(l.pos[0] / 1000, 0, -l.pos[1] / 1000); if (!(S.view === 'kesit' && l.kind === 'ceiling')) house.add(g3);
      const pl = new THREE.PointLight('#ffcf9a', 0, l.kind === 'ceiling' ? 7 : 5, 2); pl.position.set(l.pos[0] / 1000, y, -l.pos[1] / 1000); pl.userData.k = l.kind; house.add(pl); lampLights.push(pl); } }
  if (S.view !== 'maket') house.add(curtains(walls, ops, spaceAt, H, A.perde, sp => ({...merged(D.decor, sp.decor), room: !!sp.decor})));
  for (const w of walls) for (const [a, b, lo, hi0] of pieces(w)) {
    const hi = Math.min(hi0, cut); if (hi <= lo) continue;
    const mid = (a + b) / 2, mx = w.x0 + w.ux * mid, my = w.y0 + w.uy * mid, o = w.t / 2 + 150; // each face takes the paint of the room it faces
    const side = k => { const sp = spaceAt([mx + w.uy * o * k, my - w.ux * o * k]); return sp ? paintMat(finishOf(sp).wall) : wallMat; };
    const m = new THREE.Mesh(new THREE.BoxGeometry((b - a) / 1000, (hi - lo) / 1000, w.t / 1000), [wallMat, wallMat, hi < hi0 ? capMat : wallMat, wallMat, side(1), side(-1)]); m.position.set((w.x0 + w.ux * mid) / 1000, (lo + hi) / 2000, -(w.y0 + w.uy * mid) / 1000);
    m.rotation.y = Math.atan2(w.uy, w.ux); m.userData = {wall: true, id: w.id, L: w.L, mx: mx / 1000, mz: -my / 1000, lo, hi, y: (lo + hi) / 2000}; m.castShadow = m.receiveShadow = true; house.add(m);
  }
}
const orbit = {target: null, yaw: 0.7, pitch: 0.75, dist: 16, eye: null, fov: 52, corner: 0};
function place() {
  const tx = orbit.target ? orbit.target[0] : (all.x0 + all.x1) / 2000, tz = orbit.target ? orbit.target[1] : -(all.y0 + all.y1) / 2000;
  // inside a room: a level architectural camera (no tilt, so verticals stay vertical and walls keep their true proportion)
  if (orbit.eye) { cam.position.set(...orbit.eye); cam.lookAt(orbit.eye[0] + Math.sin(orbit.yaw), orbit.eye[1], orbit.eye[2] + Math.cos(orbit.yaw)); return; }
  cam.position.set(tx + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist, Math.sin(orbit.pitch) * orbit.dist, tz + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist);
  cam.lookAt(tx, 0, tz);
}
// ---- walking: half-metre steps at eye height; walls and window sills stop you, door openings let you through ----------
const inside = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
const crosses = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b); };
function blocked(a, b) { // a, b in plan mm
  const inDoor = p => ops.some(o => { if (o.kind !== 'door') return false; const w = W[o.wall_id]; if (!w) return false; const t = (p[0] - w.x0) * w.ux + (p[1] - w.y0) * w.uy, n = Math.abs((p[0] - w.x0) * -w.uy + (p[1] - w.y0) * w.ux); return t > o.a && t < o.a + o.w && n < w.t / 2 + 60; });
  if (!D.spaces.some(s => inside(b, s.boundary_xy_mm)) && !inDoor(b)) return 'outside';
  for (const w of walls) for (const [s0, s1, lo] of pieces(w)) { if (lo > 0) continue; // solid at floor level: keep 60 cm off its face
    const A = [w.x0 + w.ux * s0, w.y0 + w.uy * s0], B = [w.x0 + w.ux * s1, w.y0 + w.uy * s1];
    const nx = -w.uy * (w.t / 2 + 350), ny = w.ux * (w.t / 2 + 350); // 35 cm in front of each face; door gaps leave these lines open
    for (const k of [0]) if (crosses(a, b, [A[0] + nx * k, A[1] + ny * k], [B[0] + nx * k, B[1] + ny * k])) return 'line ' + w.id + ' ' + k;
    const t = Math.max(0, Math.min(s1 - s0, (b[0] - A[0]) * w.ux + (b[1] - A[1]) * w.uy)), q = [A[0] + w.ux * t, A[1] + w.uy * t];
    if (Math.hypot(b[0] - q[0], b[1] - q[1]) < w.t / 2 + 150) return 'near ' + w.id; }
  return false;
}
let walking = 0;
function step(dir) {
  if (!orbit.eye || walking) return; const e = orbit.eye, a = [e[0] * 1000, -e[2] * 1000], d = 500 * dir, b = [a[0] + Math.sin(orbit.yaw) * d, a[1] - Math.cos(orbit.yaw) * d];
  if (blocked(a, b)) { $('#hint').textContent = 'Önünüzde duvar var · dönüp başka yöne yürüyün'; return; }
  const from = [...e], to = [b[0] / 1000, e[1], -b[1] / 1000], t0 = performance.now(); walking = 1;
  const tick = now => { const t = Math.min(1, (now - t0) / 320), k = t * t * (3 - 2 * t); orbit.eye = from.map((v, i) => v + (to[i] - v) * k); render(); if (t < 1) requestAnimationFrame(tick); else walking = 0; };
  requestAnimationFrame(tick); $('#hint').textContent = '';
}
function render() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = orbit.eye ? orbit.fov : 45; cam.updateProjectionMatrix(); place(); applyAtmos(); if (S.view === 'kesit') cutaway(); renderer.render(scene, cam); }
// Dollhouse: walls between the camera and the chosen room drop to 30 cm, so the room is seen whole from above
// while the rest of the home stays standing around it. Recomputed as the camera turns.
function cutaway() {
  const [tx, tz] = orbit.target, dx = cam.position.x - tx, dz = cam.position.z - tz, L = Math.hypot(dx, dz) || 1, R = orbit.radius;
  house?.children.forEach(m => { const u = m.userData; if (!u.wall) return;
    const vx = u.mx - tx, vz = u.mz - tz, along = (vx * dx + vz * dz) / L, side = Math.abs(vx * dz - vz * dx) / L;
    const cut = along > -0.15 && along < R + 0.6 && side < R + 0.6, top = cut ? Math.max(u.lo, Math.min(u.hi, 300)) : u.hi;
    if (top <= u.lo) { m.visible = false; return; } m.visible = true; const k = (top - u.lo) / (u.hi - u.lo); m.scale.y = k; m.position.y = (u.lo + top) / 2000; });
}
{
  const P = new Map(); let last = null;
  canvas.addEventListener('pointerdown', e => { P.set(e.pointerId, [e.clientX, e.clientY]); canvas.setPointerCapture(e.pointerId); last = null; });
  canvas.addEventListener('pointermove', e => {
    if (!P.has(e.pointerId)) return; const prev = P.get(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
    if (P.size === 1) { if (orbit.eye) { orbit.yaw -= (e.clientX - prev[0]) * 0.004; render(); return; } orbit.yaw += (e.clientX - prev[0]) * 0.006; orbit.pitch = Math.max(0.12, Math.min(1.5, orbit.pitch + (e.clientY - prev[1]) * 0.005)); render(); }
    else if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) { if (orbit.eye) orbit.fov = Math.max(38, Math.min(62, orbit.fov * last / d)); else orbit.dist = Math.max(3, Math.min(60, orbit.dist * last / d)); render(); } last = d; }
  });
  const up = e => { P.delete(e.pointerId); last = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (orbit.eye) orbit.fov = Math.max(38, Math.min(62, orbit.fov * (e.deltaY > 0 ? 1.06 : 0.94))); else orbit.dist = Math.max(3, Math.min(60, orbit.dist * (e.deltaY > 0 ? 1.1 : 0.9))); render(); }, {passive: false});
  let downAt = null; canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => { if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6 || !house) return;
    const r = canvas.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), cam);
    const hit = ray.intersectObjects(house.children.filter(o => o.visible && (o.userData.wall || o.userData.floor)))[0]; if (!hit) return; const u = hit.object.userData;
    if (u.wall) { const w = W[u.id]; $('#hint').textContent = `Duvar ${Math.round(w.L).toLocaleString('tr-TR')} mm · kalınlık ${Math.round(w.t)} mm · tavan ${Math.round(H).toLocaleString('tr-TR')} mm · dokunduğunuz nokta yerden ${Math.round(hit.point.y * 1000).toLocaleString('tr-TR')} mm`; }
    else { const sp = D.spaces.find(x => x.id === u.floor), b = bbox(sp.boundary_xy_mm); $('#hint').textContent = `${(sp.name || NAMES[sp.kind] || 'Oda').replace(/\s+\d+$/, '')} · ${area(sp.boundary_xy_mm).toFixed(1)} m² · ${Math.round(b.x1 - b.x0).toLocaleString('tr-TR')} × ${Math.round(b.y1 - b.y0).toLocaleString('tr-TR')} mm · hacim ${(area(sp.boundary_xy_mm) * H / 1000).toFixed(0)} m³`; } });
  canvas.addEventListener('dblclick', () => { if (orbit.eye) { orbit.corner++; show('room'); } });
  addEventListener('keydown', e => { if (!orbit.eye || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    const k = e.key.toLowerCase(); if (k === 'arrowup' || k === 'w') step(1); else if (k === 'arrowdown' || k === 's') step(-1);
    else if (k === 'arrowleft' || k === 'a') { orbit.yaw += 0.12; render(); } else if (k === 'arrowright' || k === 'd') { orbit.yaw -= 0.12; render(); } else return; e.preventDefault(); });
  $('#walk').addEventListener('click', e => { const b = e.target.closest('[data-walk]'); if (!b) return; const w = b.dataset.walk;
    if (w === 'f') step(1); if (w === 'b') step(-1); if (w === 'l') { orbit.yaw += 0.3; render(); } if (w === 'r') { orbit.yaw -= 0.3; render(); } });
  new ResizeObserver(() => { if (!canvas.hidden) render(); }).observe(canvas);
}

// ---- views and side panel ---------------------------------------------------------------------------------
const HINT = {plan: 'Sürükleyin: kaydır · tekerlek / iki parmak: yakınlaştır · odaya dokunun: seç', maket: 'Ev maketi · duvar yüksekliğini üstteki çubuktan ayarlayın · sürükleyin: çevir · iki parmak: yakınlaştır', '3d': 'Tam yükseklik · sürükleyin: çevir · iki parmak: yakınlaştır', kesit: 'Tavansız kesit · seçili oda önde açık · sürükleyin: etrafında dönün · iki parmak: yakınlaştır · listeden oda seçin', room: 'Göz hizası 1,5 m · oklar ya da W/S: yürü · sürükleyin: dönün · iki parmak: görüş açısı · çift dokunun: başka köşe'};
function show(v) {
  S.view = v; document.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
  svg.hidden = v !== 'plan'; canvas.hidden = v === 'plan'; $('#walk').hidden = v !== 'room'; $('#atmos').hidden = !['room', 'kesit', 'maket'].includes(v); atmosUI(); $('#hint').textContent = ''; decorUI();
  if (v === 'plan') return drawPlan();
  const sp = D.spaces.find(s => s.id === S.room) || D.spaces.find(s => s.kind === 'living') || D.spaces[0]; S.room = sp.id;
  build(v === 'maket' ? Math.min(A.wallH, H) : H);
  const span = Math.max(all.x1 - all.x0, all.y1 - all.y0) / 1000;
  orbit.target = null;
  if (v === 'room') { // stand in a corner of the room (0.45 m from the walls) at eye height, looking across to the far side
    const b = sp.boundary_xy_mm, [cx, cy] = centroid(b), far = b.map((p, i) => [i, Math.hypot(p[0] - cx, p[1] - cy)]).sort((p, q) => q[1] - p[1]);
    const c = b[far[orbit.corner % Math.min(4, far.length)][0]], dx = cx - c[0], dy = cy - c[1], L = Math.hypot(dx, dy) || 1, step = Math.min(650, L * 0.35);
    orbit.eye = [(c[0] + dx / L * step) / 1000, 1.5, -(c[1] + dy / L * step) / 1000]; orbit.yaw = Math.atan2(dx, -dy); orbit.fov = 52;
    roomLight.position.set(cx / 1000, H / 1000 - 0.35, -cy / 1000); }
  else if (v === 'kesit') { roomLight.intensity = 0; orbit.eye = null; const b = bbox(sp.boundary_xy_mm), [cx, cy] = centroid(sp.boundary_xy_mm);
    orbit.target = [cx / 1000, -cy / 1000]; orbit.radius = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2000; orbit.pitch = 0.82; orbit.dist = Math.max(6, orbit.radius * 4.2); }
  else { roomLight.intensity = 0; orbit.eye = null; orbit.pitch = v === 'maket' ? 1.0 : 0.6; orbit.dist = span * (v === 'maket' ? 1.5 : 1.6); }
  side(); render();
}
// ---- decor: curtain and rug, chosen by model and colour (for the selected room, else for the whole home) ---------
const DEC = {tab: 'curtain'};
function decorUI() {
  const el = $('#dekor'); el.hidden = S.view === 'plan'; if (el.hidden) return;
  const sp = D.spaces.find(x => x.id === S.room), t = merged(D.decor, sp?.decor);
  el.innerHTML = `<div class="dk-tabs"><button data-dt="curtain" aria-pressed="${DEC.tab === 'curtain'}">Perde</button><button data-dt="rug" aria-pressed="${DEC.tab === 'rug'}">Halı</button><span>${sp ? (sp.name || NAMES[sp.kind] || 'Oda').replace(/\s+\d+$/, '') + (sp.decor ? ' · odaya özel' : ' · ev geneli') : 'Bütün ev'}</span></div>
  <div class="tx">${chooserHTML(t, DEC.tab, {compact: true})}</div>${sp?.decor ? '<button data-dr="1" class="dk-reset">Ev geneline dön</button>' : ''}`;
}
{ const D0 = $('#dekor'), st = document.createElement('style'); st.textContent = TEXTILE_CSS; document.head.append(st);
  const change = el => { const sp = D.spaces.find(x => x.id === S.room);
    if (el.dataset.dt) { DEC.tab = el.dataset.dt; return decorUI(); }
    if (el.dataset.dr) delete sp.decor;
    else { const target = sp ? (sp.decor ??= JSON.parse(JSON.stringify(merged(D.decor)))) : D.decor; if (!applyChoice(target, el)) return; if (!sp) try { localStorage.setItem(TEXTILE_KEY, JSON.stringify(D.decor)); } catch {} }
    decorUI(); build(S.view === 'maket' ? Math.min(A.wallH, H) : H); render(); side(); };
  D0.addEventListener('click', e => { const b = e.target.closest('button'); if (b) change(b); });
  D0.addEventListener('change', e => { if (e.target.matches('input[type=range]')) change(e.target); }); }
function atmosUI() {
  const el = $('#atmos'); if (el.hidden) return;
  el.innerHTML = `<select data-a="moment">${Object.entries(MOMENTS).map(([k, v]) => `<option value="${k}" ${A.moment === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
  <label>Saat <b>${String(Math.floor(A.hour)).padStart(2, '0')}:${A.hour % 1 ? '30' : '00'}</b><input type="range" data-a="hour" min="5" max="23" step="0.5" value="${A.hour}"></label>
  <select data-a="season">${Object.entries(SEASONS).map(([k, v]) => `<option value="${k}" ${A.season === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
  <select data-a="city">${Object.entries(CITIES).map(([k, v]) => `<option value="${k}" ${A.city === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
  ${S.view === 'maket' ? `<label>Duvar <b>${A.wallH >= H ? 'tam' : (A.wallH / 1000).toFixed(1) + ' m'}</b><input type="range" data-a="wallH" min="300" max="${H}" step="100" value="${Math.min(A.wallH, H)}"></label>` : ''}
  ${S.view !== 'maket' ? `<select data-a="perde" title="Perdeler">${Object.entries(PSTATES).map(([k, v]) => `<option value="${k}" ${A.perde === k ? 'selected' : ''}>${v}</option>`).join('')}</select>` : ''}
  <label class="chk"><input type="checkbox" data-a="human" ${A.human ? 'checked' : ''}> İnsan ölçeği</label>`;
}
$('#atmos').addEventListener('input', e => { const k = e.target.dataset.a; if (!k) return;
  if (k === 'moment') { const m = MOMENTS[e.target.value]; A.moment = e.target.value; A.hour = m[1]; A.lamps = m[2]; atmosUI(); }
  else if (k === 'hour') { A.hour = +e.target.value; A.lamps = A.hour >= 19 || A.hour < 7 ? Math.max(A.lamps, 1) : A.lamps; e.target.previousElementSibling.textContent = `${String(Math.floor(A.hour)).padStart(2, '0')}:${A.hour % 1 ? '30' : '00'}`; }
  else if (k === 'human') { A.human = e.target.checked; show(S.view); return; }
  else if (k === 'wallH') { A.wallH = +e.target.value; e.target.previousElementSibling.textContent = A.wallH >= H ? 'tam' : (A.wallH / 1000).toFixed(1) + ' m'; build(Math.min(A.wallH, H)); }
  else if (k === 'perde') { A.perde = e.target.value; build(S.view === 'maket' ? Math.min(A.wallH, H) : H); }
  else A[k] = e.target.value;
  render(); });
// ---- furniture layout (solver: assets/ev/yerlesim.js) -----------------------------------------------------
const LAY = {room: null, res: null, pick: 0};
function layoutPanel() {
  const r = D.spaces.find(x => x.id === S.room), its = (D.items || []).filter(i => i.design && i.space_id === S.room); if (!r || !its.length) return '';
  const res = LAY.room === r.id ? LAY.res : null;
  const acc = accessories(D), rr = acc.rugs.filter(x => x.space === r.id), ll = acc.lights.filter(x => x.space === r.id), LN = {ceiling: 'tavan', pendant: 'sarkıt', floor: 'lambader', desk: 'masa lambası'};
  return `<h2>Mobilya yerleşimi</h2><p class="note">${its.length} ürün · kurallar: kapı açılışı, pencere, geçiş payları, TV–kanepe, masa–mutfak.</p>
  <div class="ev-row" style="display:flex;gap:6px;flex-wrap:wrap"><button data-lay="solve">Yerleşim önerileri</button></div>
  <p class="note">Proje katmanı: ${rr.length ? rr.map(x => `halı ${x.size[0] / 10}×${x.size[1] / 10}`).join(', ') : 'halı yok'} · ${ll.map(x => LN[x.kind]).join(', ') || 'ışık yok'}</p>
  ${res ? (res.ok ? `${''}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${res.alternatives.map((a, i) => `<button data-lay="alt" data-i="${i}" aria-pressed="${LAY.pick === i}">Seçenek ${i + 1}</button>`).join('')}</div><p class="note">${res.alternatives[LAY.pick].notes.join(' · ')}</p>` : `<p class="note" style="color:#a63030">${res.reason}.</p>`) : ''}`;
}
async function layoutAction(b) { try { await layoutRun(b); } catch (err) { console.error('layout', err); LAY.res = {ok: false, reason: 'Yerleşim hesaplanamadı: ' + err.message}; side(); } }
async function layoutRun(b) {
  const {solveRoom} = await import('./yerlesim.js?v=20261022a');
  if (b.dataset.lay === 'solve') { const r = D.spaces.find(x => x.id === S.room); LAY.room = r.id; LAY.pick = 0; LAY.res = solveRoom(r, D.items.filter(i => i.design && i.space_id === r.id), {walls, ops}, {beam: 60}); }
  if (b.dataset.lay === 'alt') LAY.pick = +b.dataset.i;
  if (LAY.res?.ok) D.items = applyRoomLayout(D.items, LAY.res.alternatives[LAY.pick].placements, LAY.room);
  side(); if (S.view === 'plan') drawPlan(); else show(S.view);
}
function finishPanel() {
  const r = D.spaces.find(x => x.id === S.room), f = r && finishOf(r);
  return `<h2>Renk ve zemin · öneri</h2><select id="scheme">${Object.entries(SCHEMES).map(([k, v]) => `<option value="${k}" ${(D.scheme || 'iskandinav') === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
  <p class="note">Bütün eve uygulanır; odayı seçip ayrıca değiştirebilirsiniz. Boya ve kaplamayı AURA yapmaz, önerir.</p>
  ${r ? `<p class="note"><b>${(r.name || NAMES[r.kind] || 'Oda').replace(/\s+\d+$/, '')}</b> · duvar</p><div class="sw">${PAINTS.map(([id, n, hex]) => `<button data-paint="${id}" title="${n}" aria-pressed="${f.wall === id}" style="background:${hex}"></button>`).join('')}</div>
  <label class="note" style="display:block;margin:8px 0">Zemin <select id="floorPick">${Object.entries(FLOORS).map(([id, v]) => `<option value="${id}" ${f.floor === id ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>` : '<p class="note">Bir oda seçin.</p>'}`;
}
function pick(id) { S.room = id; side(); decorUI(); if (S.view === 'plan') drawPlan(); else show(S.view); }
function side() {
  const tot = D.spaces.reduce((s, x) => s + area(x.boundary_xy_mm), 0), real = /gercek-|licensed|plan_import/.test(S.name + JSON.stringify(D.walls[0] || {}));
  $('#side').innerHTML = `<h2>Plan</h2><select id="pickPlan">${EXAMPLES.map(([f, t]) => `<option value="${f}" ${f === S.name ? 'selected' : ''}>${t}</option>`).join('')}${EXAMPLES.some(e => e[0] === S.name) ? '' : `<option selected>${S.name}</option>`}</select>
  <label class="note" style="display:block;margin-top:8px">Plan dosyası aç (EV JSON) <input type="file" id="openFile" accept=".json,application/json"></label>
  <p class="note">${real ? 'Gerçek konut planı: Swiss Dwellings (Archilyse AG), CC BY 4.0. Ölçüye uyarlanmış; tasarımcı onayı gerekir.' : 'Sentetik örnek (gerçek ev değil).'} Ölçüler mm, alanlar net iç ölçüden. Kuzey yukarı.</p>
  <h2>Odalar · ${tot.toFixed(1)} m²</h2>${D.spaces.map(s => `<div class="room ${S.room === s.id ? 'on' : ''}" data-pick="${s.id}"><b><i style="display:inline-block;width:10px;height:10px;background:${COLORS[s.kind] || '#ddd'};margin-right:6px;border:1px solid #b7bab8"></i>${(s.name || NAMES[s.kind] || 'Oda').replace(/\s+\d+$/, '')}</b><span>${area(s.boundary_xy_mm).toFixed(1)} m²</span></div>`).join('')}
  ${layoutPanel()}
  ${finishPanel()}
  ${hooks.panel?.() || ''}
  <h2>Kayıt</h2><p class="note">${walls.length} duvar · ${ops.filter(o => o.kind === 'door').length} kapı · ${ops.filter(o => o.kind === 'window').length} pencere · tavan ${Math.round(H)} mm</p>`;
}
$('#side').addEventListener('click', e => { const lb = e.target.closest('[data-lay]'); if (lb) { layoutAction(lb); return; } const pb = e.target.closest('[data-paint]'); if (pb) { const r = D.spaces.find(x => x.id === S.room); if (r) { r.finish = {...(r.finish || {}), wall: pb.dataset.paint}; side(); if (S.view !== 'plan') show(S.view); } return; }
  if (hooks.click?.(e)) return; const t = e.target.closest('[data-pick]'); if (t) pick(t.dataset.pick); });
$('#side').addEventListener('change', async e => {
  if (e.target.id === 'scheme') { D.scheme = e.target.value; for (const r of D.spaces) delete r.finish; side(); if (S.view !== 'plan') show(S.view); return; }
  if (e.target.id === 'floorPick') { const r = D.spaces.find(x => x.id === S.room); if (r) { r.finish = {...(r.finish || {}), floor: e.target.value}; side(); if (S.view !== 'plan') show(S.view); } return; }
  if (hooks.change?.(e)) return;
  if (e.target.id === 'pickPlan') await open(e.target.value);
  if (e.target.id === 'openFile' && e.target.files[0]) { try { load(JSON.parse(await e.target.files[0].text()), e.target.files[0].name); side(); show(S.view); } catch (err) { alert('Plan okunamadı: ' + err.message); } }
});
document.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => show(b.dataset.v)));
async function open(f) { load(await (await fetch(`assets/ev/${f}?v=20261020m`)).json(), f); side(); show(S.view); }
await open(new URLSearchParams(location.search).get('plan') || EXAMPLES[0][0]);
const toPlan = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, -q.y]; };
const pxMM = () => { const r = svg.getBoundingClientRect(); return Math.max(vb[2] / r.width, vb[3] / r.height); };
const refresh = (full = true) => { load(D, S.name, true); if (S.view === 'plan') drawPlan(); else show(S.view); if (full) side(); };
const ev = {orbit: () => orbit, blocked, get D() { return D; }, get walls() { return walls; }, get ops() { return ops; }, get H() { return H; }, S, hooks, show, open, load, refresh, drawPlan, side, toPlan, pxMM, el, pts, band, area, centroid, NAMES, COLORS, INK, svg};
window.__ev = ev;
(await import('./edit.js?v=20261020r')).install(ev);
