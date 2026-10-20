// AURA ev planı — first step: one whole-home record (EV-01 schema v0.1) drawn as a measured plan and raised to 3D
// from the same data. Plan style: knowledge/ev-projesi/veri/plan-stili.json (cream paper, dark poché, terracotta accent).
import * as THREE from '../vendor/three.module.js?v=20261016b';

const $ = s => document.querySelector(s), NS = 'http://www.w3.org/2000/svg';
const D = await (await fetch('assets/ev/ornek-plan.json?v=20261020l')).json();
const val = q => (q && typeof q === 'object' ? q.value : q) ?? 0;
const S = {view: 'plan', room: null};

// ---- geometry --------------------------------------------------------------------------------------------
const walls = D.walls.map(w => {
  const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0);
  return {...w, x0, y0, x1, y1, L, ux: (x1 - x0) / L, uy: (y1 - y0) / L, t: val(w.thickness) || 120};
});
const W = Object.fromEntries(walls.map(w => [w.id, w]));
const ops = D.openings.map(o => ({...o, a: val(o.offset_from_wall_start), w: val(o.width), h: val(o.height), sill: val(o.sill_height)}));
const opsOf = id => ops.filter(o => o.wall_id === id).sort((p, q) => p.a - q.a);
const H = Math.max(...D.spaces.map(s => val(s.ceiling_height) || 2700));
const area = b => Math.abs(b.reduce((s, [x, y], i) => { const [u, v] = b[(i + 1) % b.length]; return s + x * v - u * y; }, 0)) / 2e6;
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; };
const all = bbox(walls.flatMap(w => [[w.x0 - w.t / 2, w.y0 - w.t / 2], [w.x1 + w.t / 2, w.y1 + w.t / 2]]));
// solid pieces of a wall along its length: [from, to, bottom, top] in mm (openings leave sill and lintel)
function pieces(w) {
  const out = []; let s = 0;
  for (const o of opsOf(w.id)) {
    if (o.a > s) out.push([s, o.a, 0, H]);
    if (o.sill > 0) out.push([o.a, o.a + o.w, 0, o.sill]);
    if (o.sill + o.h < H) out.push([o.a, o.a + o.w, o.sill + o.h, H]);
    s = o.a + o.w;
  }
  if (s < w.L) out.push([s, w.L, 0, H]);
  return out;
}

// ---- 2D plan (SVG) ----------------------------------------------------------------------------------------
const svg = $('#plan'), el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); (parent || svg).appendChild(e); return e; };
let vb = null;
function drawPlan() {
  svg.innerHTML = '';
  const pad = 900; vb ??= [all.x0 - pad, all.y0 - pad, all.x1 - all.x0 + 2 * pad, all.y1 - all.y0 + 2 * pad];
  svg.setAttribute('viewBox', vb.join(' '));
  el('rect', {x: vb[0] - 1e4, y: vb[1] - 1e4, width: vb[2] + 2e4, height: vb[3] + 2e4, fill: '#F7F3E8'});
  for (const s of D.spaces) {
    const on = S.room === s.id;
    el('polygon', {points: s.boundary_xy_mm.join(' '), fill: on ? '#efe2cf' : '#EAE3D6', stroke: on ? '#AD503E' : 'none', 'stroke-width': 30, 'data-room': s.id, style: 'cursor:pointer'});
  }
  const g = el('g', {fill: '#45413B'});
  for (const w of walls) for (const [a, b, lo] of pieces(w)) {
    if (lo > 0) continue; // plan cuts at ~1 m: sills below a window show as the window symbol, not as wall
    const nx = -w.uy * w.t / 2, ny = w.ux * w.t / 2, p = t => [w.x0 + w.ux * t, w.y0 + w.uy * t];
    const [ax, ay] = p(a), [bx, by] = p(b);
    el('polygon', {points: [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]].join(' ')}, g);
  }
  for (const o of ops) {
    const w = W[o.wall_id]; if (!w) continue;
    const nx = -w.uy * w.t / 2, ny = w.ux * w.t / 2, p = t => [w.x0 + w.ux * t, w.y0 + w.uy * t], [ax, ay] = p(o.a), [bx, by] = p(o.a + o.w);
    if (o.kind === 'window') {
      el('polygon', {points: [[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]].join(' '), fill: '#F7F3E8', stroke: '#292722', 'stroke-width': 14});
      el('line', {x1: ax, y1: ay, x2: bx, y2: by, stroke: '#292722', 'stroke-width': 14});
    } else {
      for (const [x, y] of [[ax, ay], [bx, by]]) el('line', {x1: x + nx, y1: y + ny, x2: x - nx, y2: y - ny, stroke: '#292722', 'stroke-width': 18});
      if (o.swing && o.swing !== 'unknown') { /* hinge side known: leaf + arc (EV schema extension pending) */ }
      else el('line', {x1: ax, y1: ay, x2: bx, y2: by, stroke: '#8B6B3F', 'stroke-width': 12, 'stroke-dasharray': '60 50'}); // swing unknown: not invented
    }
  }
  for (const s of D.spaces) {
    const b = bbox(s.boundary_xy_mm), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, small = Math.min(b.x1 - b.x0, b.y1 - b.y0) < 1600;
    const fs = small ? 170 : 230;
    el('text', {x: cx, y: cy - fs * 0.4, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 600, fill: '#292722', style: 'pointer-events:none'}).textContent = s.name;
    el('text', {x: cx, y: cy + fs * 0.9, 'text-anchor': 'middle', 'font-size': fs * 0.75, fill: '#746D63', style: 'pointer-events:none'}).textContent = `${area(s.boundary_xy_mm).toFixed(1)} m² · ${Math.round(b.x1 - b.x0)}×${Math.round(b.y1 - b.y0)}`;
  }
  // overall dimension chains
  const dim = (x0, y0, x1, y1, txt, vert) => {
    el('line', {x1: x0, y1: y0, x2: x1, y2: y1, stroke: '#746D63', 'stroke-width': 10});
    for (const [x, y] of [[x0, y0], [x1, y1]]) el('line', {x1: x - 60, y1: y + 60, x2: x + 60, y2: y - 60, stroke: '#746D63', 'stroke-width': 14});
    const t = el('text', {x: (x0 + x1) / 2, y: (y0 + y1) / 2 - 60, 'text-anchor': 'middle', 'font-size': 170, fill: '#746D63'}); t.textContent = txt;
    if (vert) t.setAttribute('transform', `rotate(-90 ${(x0 + x1) / 2} ${(y0 + y1) / 2})`);
  };
  dim(all.x0, all.y0 - 450, all.x1, all.y0 - 450, `${Math.round(all.x1 - all.x0)}`);
  dim(all.x0 - 450, all.y0, all.x0 - 450, all.y1, `${Math.round(all.y1 - all.y0)}`, true);
}
// pan / zoom: one finger or mouse drags, wheel or two fingers zoom
{
  const pts = new Map(); let last = null;
  const toMM = (dx, dy) => { const r = svg.getBoundingClientRect(), k = Math.max(vb[2] / r.width, vb[3] / r.height); return [dx * k, dy * k]; };
  svg.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); svg.setPointerCapture(e.pointerId); last = null; S.moved = false; });
  svg.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { const [dx, dy] = toMM(e.clientX - prev[0], e.clientY - prev[1]); if (Math.abs(dx) + Math.abs(dy) > 1) S.moved = true; vb[0] -= dx; vb[1] -= dy; svg.setAttribute('viewBox', vb.join(' ')); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) zoom(last / d); last = d; S.moved = true; }
  });
  const up = e => { pts.delete(e.pointerId); last = null; };
  svg.addEventListener('pointerup', e => { const t = e.target.closest?.('[data-room]'); if (!S.moved && t) pick(t.dataset.room); up(e); });
  svg.addEventListener('pointercancel', up);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); }, {passive: false});
  function zoom(k) { const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2; vb[2] *= k; vb[3] *= k; vb[0] = cx - vb[2] / 2; vb[1] = cy - vb[3] / 2; svg.setAttribute('viewBox', vb.join(' ')); }
}

// ---- 3D (same data) --------------------------------------------------------------------------------------
const canvas = $('#three'), renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
const scene = new THREE.Scene(); scene.background = new THREE.Color('#F7F3E8');
const cam = new THREE.PerspectiveCamera(50, 1, 0.05, 200);
scene.add(new THREE.HemisphereLight('#fffaf0', '#b9ae9a', 1.6));
const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(6, 12, 4); scene.add(sun);
const cx = (all.x0 + all.x1) / 2000, cz = (all.y0 + all.y1) / 2000;
const wallMat = new THREE.MeshStandardMaterial({color: '#f2ede3', roughness: 0.9}), capMat = new THREE.MeshStandardMaterial({color: '#45413B', roughness: 0.9});
const floorMat = new THREE.MeshStandardMaterial({color: '#d9c6a6', roughness: 0.8, side: THREE.DoubleSide}), selMat = new THREE.MeshStandardMaterial({color: '#e2b49f', roughness: 0.8, side: THREE.DoubleSide});
const ceilMat = new THREE.MeshStandardMaterial({color: '#fbf9f4', roughness: 1, side: THREE.DoubleSide});
let house = null;
function build(cut) {
  if (house) { scene.remove(house); house.traverse(o => o.geometry?.dispose()); }
  house = new THREE.Group(); scene.add(house);
  for (const s of D.spaces) {
    const sh = new THREE.Shape(s.boundary_xy_mm.map(([x, y]) => new THREE.Vector2(x / 1000, y / 1000)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), S.room === s.id && S.view !== 'room' ? selMat : floorMat); m.rotation.x = Math.PI / 2; m.position.y = 0.001; house.add(m);
    if (S.view === 'room') { const c = new THREE.Mesh(new THREE.ShapeGeometry(sh), ceilMat); c.rotation.x = Math.PI / 2; c.position.y = H / 1000; house.add(c); }
  }
  for (const w of walls) for (const [a, b, lo, hi0] of pieces(w)) {
    const hi = Math.min(hi0, cut); if (hi <= lo) continue;
    const len = (b - a) / 1000, g = new THREE.BoxGeometry(len, (hi - lo) / 1000, w.t / 1000);
    const m = new THREE.Mesh(g, [wallMat, wallMat, hi < hi0 ? capMat : wallMat, wallMat, wallMat, wallMat]);
    const mid = (a + b) / 2; m.position.set((w.x0 + w.ux * mid) / 1000, (lo + hi) / 2000, (w.y0 + w.uy * mid) / 1000);
    m.rotation.y = -Math.atan2(w.uy, w.ux); house.add(m);
  }
}
const orbit = {yaw: 0.7, pitch: 0.75, dist: 16, tx: cx, ty: 0, tz: cz, eye: null};
function place() {
  if (orbit.eye) { cam.position.set(...orbit.eye); cam.lookAt(orbit.eye[0] + Math.sin(orbit.yaw), orbit.eye[1] - Math.sin(orbit.pitch - 0.75) * 0.5, orbit.eye[2] + Math.cos(orbit.yaw)); return; }
  cam.position.set(orbit.tx + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist, orbit.ty + Math.sin(orbit.pitch) * orbit.dist, orbit.tz + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist);
  cam.lookAt(orbit.tx, orbit.ty, orbit.tz);
}
function render() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = orbit.eye ? 70 : 45; cam.updateProjectionMatrix(); place(); renderer.render(scene, cam); }
{
  const pts = new Map(); let last = null;
  canvas.addEventListener('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); canvas.setPointerCapture(e.pointerId); last = null; });
  canvas.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { const k = orbit.eye ? -0.005 : 0.006; orbit.yaw += (e.clientX - prev[0]) * k; orbit.pitch = Math.max(orbit.eye ? 0.2 : 0.12, Math.min(orbit.eye ? 1.3 : 1.5, orbit.pitch + (e.clientY - prev[1]) * 0.005)); render(); }
    else if (pts.size === 2 && !orbit.eye) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) { orbit.dist = Math.max(3, Math.min(40, orbit.dist * last / d)); render(); } last = d; }
  });
  const up = e => { pts.delete(e.pointerId); last = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (!orbit.eye) { orbit.dist = Math.max(3, Math.min(40, orbit.dist * (e.deltaY > 0 ? 1.1 : 0.9))); render(); } }, {passive: false});
  new ResizeObserver(() => { if (!canvas.hidden) render(); }).observe(canvas);
}

// ---- views and side panel ---------------------------------------------------------------------------------
const HINT = {plan: 'Sürükleyin: kaydır · tekerlek / iki parmak: yakınlaştır · odaya dokunun: seç', maket: 'Duvarlar 1,1 m\'den kesilmiş ev maketi · sürükleyin: çevir', '3d': 'Tam yükseklik · sürükleyin: çevir · iki parmak: yakınlaştır', room: 'Seçili odanın içindesiniz · sürükleyin: etrafa bakın'};
function show(v) {
  S.view = v; document.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
  svg.hidden = v !== 'plan'; canvas.hidden = v === 'plan'; $('#hint').textContent = HINT[v];
  if (v === 'plan') return drawPlan();
  const sp = D.spaces.find(s => s.id === S.room) || D.spaces[0]; S.room = sp.id;
  build(v === 'maket' ? 1100 : H);
  if (v === 'room') { const b = bbox(sp.boundary_xy_mm); orbit.eye = [(b.x0 + 300) / 1000, 1.6, (b.y0 + 300) / 1000]; orbit.yaw = Math.atan2((b.x1 - b.x0), (b.y1 - b.y0)); orbit.pitch = 0.75; }
  else { orbit.eye = null; orbit.pitch = v === 'maket' ? 1.0 : 0.6; orbit.dist = v === 'maket' ? 20 : 21; }
  side(); render();
}
function pick(id) { S.room = id; side(); if (S.view === 'plan') drawPlan(); else show(S.view); }
function side() {
  const tot = D.spaces.reduce((s, x) => s + area(x.boundary_xy_mm), 0);
  $('#side').innerHTML = `<h2>Örnek plan</h2><p class="note">${D.example_only ? 'Sentetik 3+1 daire (gerçek ev değil). ' : ''}Ölçüler mm, alanlar net iç ölçüden. Kapı açılış yönü kayıtta olmadığı için kesikli çizgiyle gösteriliyor.</p>
  <h2>Odalar · ${tot.toFixed(1)} m²</h2>${D.spaces.map(s => `<div class="room ${S.room === s.id ? 'on' : ''}" data-pick="${s.id}"><b>${s.name}</b><span>${area(s.boundary_xy_mm).toFixed(1)} m²</span></div>`).join('')}
  <h2>Kayıt</h2><p class="note">${walls.length} duvar · ${ops.filter(o => o.kind === 'door').length} kapı · ${ops.filter(o => o.kind === 'window').length} pencere · tavan ${H} mm</p>
  <p class="note">Bu sayfa ev projesi editörünün ilk adımıdır: aynı kayıttan plan, maket ve 3B. Duvar çizme ve düzenleme sonraki adımda.</p>`;
}
$('#side').addEventListener('click', e => { const t = e.target.closest('[data-pick]'); if (t) pick(t.dataset.pick); });
document.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => show(b.dataset.v)));
side(); show('plan');
window.__ev = {D, S, show};
