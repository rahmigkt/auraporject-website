// AURA ev planı — whole-home record (EV-01 schema) drawn as a measured plan and raised to 3D from the same data.
// Plan graphics follow the EV-QWEN-00D review drawings the user approved: rooms tinted by function, dark slate walls,
// blue windows across the wall, light door gaps, red entrance mark, north up (plan y grows to the north).
import * as THREE from '../vendor/three.module.js?v=20261016b';

const $ = s => document.querySelector(s), NS = 'http://www.w3.org/2000/svg';
const val = q => (q && typeof q === 'object' ? q.value : q) ?? 0;
const S = {view: 'plan', room: null, name: ''}, hooks = {};
const COLORS = {living: '#ecd7ae', kitchen: '#cddbbf', bath: '#bbdce1', wc: '#a9cfd7', hall: '#eee9df', bedroom: '#ccdae7', utility: '#ded5e3', other: '#d4e0e5', balcony: '#d3e4bf', terrace: '#d3e4bf', stair: '#d5cce4', study: '#e4dccb', dining: '#ecd7ae'};
const NAMES = {living: 'Salon', kitchen: 'Mutfak', bath: 'Banyo', wc: 'WC', hall: 'Hol', bedroom: 'Yatak odası', utility: 'Kiler / servis', other: 'Oda', balcony: 'Balkon', terrace: 'Teras', stair: 'Merdiven', study: 'Çalışma', dining: 'Yemek'};
const INK = {wall: '#424949', window: '#4b9dc0', door: '#faf8f1', roomLine: '#b7bab8', text: '#24333c', entry: '#b44e31', paper: '#f6f4ef', select: '#AD503E'};
const EXAMPLES = [['ornek-plan.json', 'Örnek 3+1 (sentetik)'], ...Array.from({length: 6}, (_, i) => [`ornekler/gercek-${i + 1}.json`, `Gerçek plan ${i + 1} · İsviçre`])];

// ---- record → geometry ------------------------------------------------------------------------------------
let D, walls, W, ops, H, all;
const area = b => Math.abs(b.reduce((s, [x, y], i) => { const [u, v] = b[(i + 1) % b.length]; return s + x * v - u * y; }, 0)) / 2e6;
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return {x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys)}; };
const opsOf = id => ops.filter(o => o.wall_id === id).sort((p, q) => p.a - q.a);
function load(rec, name, keep = false) {
  D = rec; S.name = name; if (!keep) { S.room = null; vb = null; }
  walls = D.walls.map(w => { const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0) || 1;
    return {...w, x0, y0, x1, y1, L, ux: (x1 - x0) / L, uy: (y1 - y0) / L, t: val(w.thickness) || 120}; });
  W = Object.fromEntries(walls.map(w => [w.id, w]));
  ops = D.openings.map(o => ({...o, a: val(o.offset_from_wall_start), w: val(o.width), h: val(o.height) || 2100, sill: val(o.sill_height),
    entry: o.entry ?? (o.kind === 'door' && (o.space_ids || []).length === 1)}));
  H = Math.max(...D.spaces.map(s => val(s.ceiling_height) || 2600));
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
scene.add(new THREE.HemisphereLight('#fffaf0', '#b9ae9a', 1.6));
const sun = new THREE.DirectionalLight('#ffffff', 1.4); sun.position.set(6, 12, -4); scene.add(sun);
const wallMat = new THREE.MeshStandardMaterial({color: '#f2ede3', roughness: 0.9}), capMat = new THREE.MeshStandardMaterial({color: INK.wall, roughness: 0.9});
const ceilMat = new THREE.MeshStandardMaterial({color: '#fbf9f4', roughness: 1, side: THREE.DoubleSide});
const floorMats = {}; const floorMat = k => floorMats[k] ??= new THREE.MeshStandardMaterial({color: COLORS[k] || '#ddd', roughness: 0.85, side: THREE.DoubleSide});
const selMat = new THREE.MeshStandardMaterial({color: '#e2b49f', roughness: 0.8, side: THREE.DoubleSide});
let house = null;
function build(cut) {
  if (house) { scene.remove(house); house.traverse(o => o.geometry?.dispose()); }
  house = new THREE.Group(); scene.add(house);
  for (const s of D.spaces) {
    const sh = new THREE.Shape(s.boundary_xy_mm.map(([x, y]) => new THREE.Vector2(x / 1000, y / 1000)));
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), S.room === s.id && S.view !== 'room' ? selMat : floorMat(s.kind)); m.rotation.x = -Math.PI / 2; m.position.y = 0.001; house.add(m);
    if (S.view === 'room') { const c = new THREE.Mesh(new THREE.ShapeGeometry(sh), ceilMat); c.rotation.x = -Math.PI / 2; c.position.y = H / 1000; house.add(c); }
  }
  for (const w of walls) for (const [a, b, lo, hi0] of pieces(w)) {
    const hi = Math.min(hi0, cut); if (hi <= lo) continue;
    const m = new THREE.Mesh(new THREE.BoxGeometry((b - a) / 1000, (hi - lo) / 1000, w.t / 1000), [wallMat, wallMat, hi < hi0 ? capMat : wallMat, wallMat, wallMat, wallMat]);
    const mid = (a + b) / 2; m.position.set((w.x0 + w.ux * mid) / 1000, (lo + hi) / 2000, -(w.y0 + w.uy * mid) / 1000);
    m.rotation.y = Math.atan2(w.uy, w.ux); house.add(m);
  }
}
const orbit = {yaw: 0.7, pitch: 0.75, dist: 16, eye: null};
function place() {
  const tx = (all.x0 + all.x1) / 2000, tz = -(all.y0 + all.y1) / 2000;
  if (orbit.eye) { cam.position.set(...orbit.eye); cam.lookAt(orbit.eye[0] + Math.sin(orbit.yaw), orbit.eye[1] - Math.sin(orbit.pitch - 0.75) * 0.5, orbit.eye[2] + Math.cos(orbit.yaw)); return; }
  cam.position.set(tx + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist, Math.sin(orbit.pitch) * orbit.dist, tz + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.dist);
  cam.lookAt(tx, 0, tz);
}
function render() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / Math.max(1, r.height); cam.fov = orbit.eye ? 70 : 45; cam.updateProjectionMatrix(); place(); renderer.render(scene, cam); }
{
  const P = new Map(); let last = null;
  canvas.addEventListener('pointerdown', e => { P.set(e.pointerId, [e.clientX, e.clientY]); canvas.setPointerCapture(e.pointerId); last = null; });
  canvas.addEventListener('pointermove', e => {
    if (!P.has(e.pointerId)) return; const prev = P.get(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
    if (P.size === 1) { const k = orbit.eye ? -0.005 : 0.006; orbit.yaw += (e.clientX - prev[0]) * k; orbit.pitch = Math.max(orbit.eye ? 0.2 : 0.12, Math.min(orbit.eye ? 1.3 : 1.5, orbit.pitch + (e.clientY - prev[1]) * 0.005)); render(); }
    else if (P.size === 2 && !orbit.eye) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (last) { orbit.dist = Math.max(3, Math.min(60, orbit.dist * last / d)); render(); } last = d; }
  });
  const up = e => { P.delete(e.pointerId); last = null; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (!orbit.eye) { orbit.dist = Math.max(3, Math.min(60, orbit.dist * (e.deltaY > 0 ? 1.1 : 0.9))); render(); } }, {passive: false});
  new ResizeObserver(() => { if (!canvas.hidden) render(); }).observe(canvas);
}

// ---- views and side panel ---------------------------------------------------------------------------------
const HINT = {plan: 'Sürükleyin: kaydır · tekerlek / iki parmak: yakınlaştır · odaya dokunun: seç', maket: 'Duvarlar 1,1 m\'den kesilmiş ev maketi · sürükleyin: çevir', '3d': 'Tam yükseklik · sürükleyin: çevir · iki parmak: yakınlaştır', room: 'Seçili odanın içindesiniz · sürükleyin: etrafa bakın'};
function show(v) {
  S.view = v; document.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v));
  svg.hidden = v !== 'plan'; canvas.hidden = v === 'plan'; $('#hint').textContent = HINT[v];
  if (v === 'plan') return drawPlan();
  const sp = D.spaces.find(s => s.id === S.room) || D.spaces.find(s => s.kind === 'living') || D.spaces[0]; S.room = sp.id;
  build(v === 'maket' ? 1100 : H);
  const span = Math.max(all.x1 - all.x0, all.y1 - all.y0) / 1000;
  if (v === 'room') { const [cx, cy] = centroid(sp.boundary_xy_mm), b = bbox(sp.boundary_xy_mm); orbit.eye = [(cx - (b.x1 - b.x0) * 0.3) / 1000, 1.6, -(cy - (b.y1 - b.y0) * 0.3) / 1000]; orbit.yaw = Math.PI * 0.75; orbit.pitch = 0.75; }
  else { orbit.eye = null; orbit.pitch = v === 'maket' ? 1.0 : 0.6; orbit.dist = span * (v === 'maket' ? 1.5 : 1.6); }
  side(); render();
}
function pick(id) { S.room = id; side(); if (S.view === 'plan') drawPlan(); else show(S.view); }
function side() {
  const tot = D.spaces.reduce((s, x) => s + area(x.boundary_xy_mm), 0), real = /gercek-|licensed|plan_import/.test(S.name + JSON.stringify(D.walls[0] || {}));
  $('#side').innerHTML = `<h2>Plan</h2><select id="pickPlan">${EXAMPLES.map(([f, t]) => `<option value="${f}" ${f === S.name ? 'selected' : ''}>${t}</option>`).join('')}${EXAMPLES.some(e => e[0] === S.name) ? '' : `<option selected>${S.name}</option>`}</select>
  <label class="note" style="display:block;margin-top:8px">Plan dosyası aç (EV JSON) <input type="file" id="openFile" accept=".json,application/json"></label>
  <p class="note">${real ? 'Gerçek konut planı: Swiss Dwellings (Archilyse AG), CC BY 4.0. Ölçüye uyarlanmış; tasarımcı onayı gerekir.' : 'Sentetik örnek (gerçek ev değil).'} Ölçüler mm, alanlar net iç ölçüden. Kuzey yukarı.</p>
  <h2>Odalar · ${tot.toFixed(1)} m²</h2>${D.spaces.map(s => `<div class="room ${S.room === s.id ? 'on' : ''}" data-pick="${s.id}"><b><i style="display:inline-block;width:10px;height:10px;background:${COLORS[s.kind] || '#ddd'};margin-right:6px;border:1px solid #b7bab8"></i>${(s.name || NAMES[s.kind] || 'Oda').replace(/\s+\d+$/, '')}</b><span>${area(s.boundary_xy_mm).toFixed(1)} m²</span></div>`).join('')}
  ${hooks.panel?.() || ''}
  <h2>Kayıt</h2><p class="note">${walls.length} duvar · ${ops.filter(o => o.kind === 'door').length} kapı · ${ops.filter(o => o.kind === 'window').length} pencere · tavan ${Math.round(H)} mm</p>`;
}
$('#side').addEventListener('click', e => { if (hooks.click?.(e)) return; const t = e.target.closest('[data-pick]'); if (t) pick(t.dataset.pick); });
$('#side').addEventListener('change', async e => {
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
const ev = {get D() { return D; }, get walls() { return walls; }, get ops() { return ops; }, get H() { return H; }, S, hooks, show, open, load, refresh, drawPlan, side, toPlan, pxMM, el, pts, band, area, centroid, NAMES, COLORS, INK, svg};
window.__ev = ev;
(await import('./edit.js?v=20261020o')).install(ev);
