// Designer workshop: open a customer's design, shape parts by hand (silhouettes of flat parts, turned profiles of
// legs) on a touch screen or with a mouse, see the physical and production checks live, then hand it to production.
// No AI: the designer gives the form, the engine builds it and checks it.
import {normalizeDesign, compileDesign} from './generate.js';
import {readLink, designLink, projectLink} from './link.js';
import {editableParts, currentShape, sampleCurve, bbox, silhouetteDxf, ADD_SHAPES, EDGE_TYPES} from './overrides.js';
import {analyse} from './physics.js';
import {loadCsg} from './csg.js';
import {worldPositions} from './build.js';
import {WOODS, STAINS, FINISHES, STONES, METALS, COLORS, GLASS} from './catalog.js';
import {download} from './package.js';

const $ = s => document.querySelector(s);
const NAMES = {top: 'Tabla', leg: 'Ayak', 'case-top': 'Üst tabla', 'vanity-top': 'Lavabo tezgahı', 'mirror-frame': 'Ayna arkalığı', mirror: 'Ayna camı', 'arm-post': 'Kol dikmesi',
  column: 'Sütun', foot: 'Taban', 'top-plate': 'Tabla altı tablası', shelf: 'Raf', worktop: 'Tezgah', led: 'Işık', headboard: 'Başlık', 'added-box': 'Eklenen kutu', 'added-softbox': 'Eklenen yuvarlatılmış kutu', 'added-round': 'Eklenen yuvarlak çubuk', 'added-square': 'Eklenen kare çubuk', 'added-panel': 'Eklenen panel',
  rail: 'Kayıt', apron: 'Kayıt', stretcher: 'Germe', 'arm-top': 'Kol', 'base-rail': 'Çerçeve rayı', 'seat-deck': 'Oturma gövdesi', 'seat-cushion': 'Oturma minderi', 'back-cushion': 'Sırt minderi', arm: 'Kol', side: 'Yan', door: 'Kapak', drawer: 'Çekmece', back: 'Arkalık'};
const nameOf = t => `${NAMES[t.role] || t.role}${t.tool === 'profile' ? ' · profil' : ' · siluet'}`;
const S = {items: [], cur: 0, target: null, pts: null, sel: -1, sym: true, undo: [], redo: [], view: null, compiled: null, part: null, mode: 'translate', hist: [], fut: [], multi: [], multiOn: false, snap: true};
let viewer = null, checkTimer = 0;

// ---- Loading ---------------------------------------------------------------------------------------------------
async function load(hash) {
  const got = await readLink(hash);
  if (got?.design) S.items = [{id: 'U1', qty: 1, design: normalizeDesign(got.design)}];
  else if (got?.items) { S.items = got.items.map(i => ({...i, design: normalizeDesign(i.design)})); S.room = got.room; }
  else {
    try { const pr = JSON.parse(localStorage.getItem('aura-forma-project') || 'null'); if (pr?.items?.length) S.items = pr.items.map(i => ({...i, design: normalizeDesign(i.design)})); } catch {}
    if (!S.items.length) { try { const fam = JSON.parse(localStorage.getItem('aura-forma-family') || '"seating"'); const d = JSON.parse(localStorage.getItem('aura-forma-design-' + fam) || 'null'); if (d) S.items = [{id: 'U1', qty: 1, design: normalizeDesign(d)}]; } catch {} }
  }
  S.cur = 0; S.target = null; renderItems(); select(0);
}
function renderItems() {
  $('#items').innerHTML = S.items.map((it, i) => `<button data-item="${i}" aria-pressed="${i === S.cur}">${String(i + 1).padStart(2, '0')} · ${it.design.kind}${it.design.overrides?.length ? ' ✎' : ''}</button>`).join('');
}
function select(i) {
  S.cur = i; S.target = null; S.part = null; S.hist = []; S.fut = []; viewer?.select(null); viewer?.gizmo(null); S.pts = null; S.undo = []; S.redo = [];
  rebuild(); renderItems(); renderPanel();
}
const design = () => S.items[S.cur]?.design;

// ---- Model ------------------------------------------------------------------------------------------------------
function rebuild() {
  const d = design(); if (!d) return;
  S.compiled = compileDesign(d);
  viewer?.setDesign(S.compare ? compileDesign({...d, overrides: []}) : S.compiled, d.materials);
  clearTimeout(checkTimer); checkTimer = setTimeout(renderChecks, 120);
}
function writeOverride() {
  const d = design(), t = S.target; if (!d || !t) return;
  const list = (d.overrides || []).filter(o => !(o.tool === t.tool && (t.tool === 'silhouette' ? o.id === t.id : o.role === t.role)));
  if (S.pts) list.push(t.tool === 'silhouette' ? {tool: 'silhouette', id: t.id, symmetric: false, points: S.pts.map(p => p.slice())} : {tool: 'profile', role: t.role, points: S.pts.map(p => p.slice())});
  S.items[S.cur].design = normalizeDesign({...d, overrides: list});
  rebuild(); renderItems();
}
function snapshot() { S.undo.push(JSON.stringify(S.pts)); if (S.undo.length > 100) S.undo.shift(); S.redo = []; }

/** Ramer–Douglas–Peucker on a closed ring: few control points that keep the corners. */
function simplify(pts, tol) {
  const rdp = (a, b) => {
    let i0 = -1, dm = 0; const [x1, y1] = pts[a], [x2, y2] = pts[b % pts.length], L = Math.hypot(x2 - x1, y2 - y1) || 1;
    for (let i = a + 1; i < b; i++) { const [x, y] = pts[i % pts.length], dd = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / L; if (dd > dm) { dm = dd; i0 = i; } }
    return dm > tol ? [...rdp(a, i0), ...rdp(i0, b).slice(1)] : [a, b];
  };
  const n = pts.length, far = pts.reduce((m, p, i) => Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) > Math.hypot(pts[m][0] - pts[0][0], pts[m][1] - pts[0][1]) ? i : m, 0);
  const idx = [...rdp(0, far), ...rdp(far, n).slice(1, -1)];
  return idx.map(i => pts[i % n].slice());
}

function pickTarget(t) {
  S.target = t; S.sel = -1; S.undo = []; S.redo = [];
  const ov = (design().overrides || []).find(o => o.tool === t.tool && (t.tool === 'silhouette' ? o.id === t.id : o.role === t.role));
  const base = currentShape(compileDesign({...design(), overrides: (design().overrides || []).filter(o => o !== ov)}), t, 14);
  S.base = base;
  if (ov) S.pts = ov.points.map(p => p.slice());
  else if (t.tool === 'silhouette') S.pts = null; // nothing changed until the first touch
  else S.pts = null;
  renderPanel();
}
function ensurePts() {
  if (S.pts) return;
  const t = S.target, b = S.base;
  if (t.tool === 'silhouette') { const o = b.outline, bb = bbox(o); S.pts = simplify(o.map(([x, y]) => [(x - bb.cx) / bb.w, (y - bb.cy) / bb.h]), 0.004).map(([u, v]) => [Math.round(u * 1000) / 1000, Math.round(v * 1000) / 1000]); }
  else S.pts = b.points.map(p => p.slice());
}

// ---- Editor (SVG, mm) -------------------------------------------------------------------------------------------
// Turned profiles are shown 3× wider than tall so radii can be shaped by hand (the 3D view stays true).
const XS = 3;
const toMm = ([u, v]) => S.target.tool === 'silhouette' ? [u * S.base.size[0], v * S.base.size[1]] : [u, v];
function shapeMm() {
  const t = S.target;
  if (t.tool === 'silhouette') { const pts = S.pts || null; return pts ? sampleCurve(pts, {closed: true, per: 10}).map(toMm) : S.base.outline.map(([x, y]) => { const bb = bbox(S.base.outline); return [x - bb.cx, y - bb.cy]; }); }
  const pts = S.pts || S.base.points, H = S.base.height, c = sampleCurve(pts.map(([tt, r]) => [tt * H, r]), {closed: false, per: 8});
  return [...c.map(([y, r]) => [r * XS, -y]), ...c.slice().reverse().map(([y, r]) => [-r * XS, -y])];
}
function handlesMm() {
  const t = S.target, pts = S.pts || (t.tool === 'silhouette' ? null : S.base.points);
  if (!pts) return [];
  return t.tool === 'silhouette' ? pts.map(toMm) : pts.map(([tt, r]) => [r * XS, -tt * S.base.height]);
}
function viewBox() {
  if (S.view) return S.view;
  const t = S.target;
  if (t.tool === 'silhouette') { const [w0, h0] = S.base.size, m = Math.max(w0, h0) * 0.12; let w = w0 + 2 * m, h = h0 + 2 * m; if (w / h < 1.25) w = h * 1.25; else h = w / 1.25; return S.view = [-w / 2, -h / 2, w, h]; }
  const H = S.base.height * 1.12, w = H * 1.25; return S.view = [-w / 2, -S.base.height * 1.06, w, H];
}
function drawEditor() {
  const svg = $('#editor'); if (!svg || !S.target) return;
  const [x, y, w, h] = viewBox(); svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);
  const step = [10, 20, 50, 100, 200, 500].find(s => w / s < 40) || 1000, g = [];
  for (let gx = Math.ceil(x / step) * step; gx < x + w; gx += step) g.push(`<line class="grid" x1="${gx}" y1="${y}" x2="${gx}" y2="${y + h}"/>`);
  for (let gy = Math.ceil(y / step) * step; gy < y + h; gy += step) g.push(`<line class="grid" x1="${x}" y1="${gy}" x2="${x + w}" y2="${gy}"/>`);
  g.push(`<line class="axis" x1="0" y1="${y}" x2="0" y2="${y + h}"/>`);
  const t = S.target, orig = t.tool === 'silhouette' ? (() => { const bb = bbox(S.base.outline); return S.base.outline.map(([px, py]) => [px - bb.cx, py - bb.cy]); })() : (() => { const H = S.base.height, c = S.base.points.map(([tt, r]) => [tt * H, r]); return [...c.map(([yy, r]) => [r * XS, -yy]), ...c.slice().reverse().map(([yy, r]) => [-r * XS, -yy])]; })();
  const path = pts => 'M' + pts.map(p => p.map(n => n.toFixed(1)).join(' ')).join('L') + 'Z';
  const sh = shapeMm(), bb = bbox(sh), r = w / 70;
  svg.innerHTML = g.join('') + `<path class="orig" d="${path(orig)}"/><path class="shape" id="shapePath" d="${path(sh)}"/>`
    + handlesMm().map(([hx, hy], i) => `<circle class="h${i === S.sel ? ' sel' : ''}" data-h="${i}" cx="${hx}" cy="${hy}" r="${r}"/>`).join('')
    + `<text class="dim" x="${x + w * 0.02}" y="${y + h * 0.05}" font-size="${w / 55}">${t.tool === 'silhouette' ? `${Math.round(bb.w)} × ${Math.round(bb.h)} mm` : `yatay 3× · Ø en ince ${Math.round(Math.min(...(S.pts || S.base.points).map(p => p[1])) * 2)} mm · boy ${Math.round(S.base.height)} mm`}</text>`;
}
const svgPoint = (svg, e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
function fromMm(x, y, i) {
  const t = S.target;
  if (t.tool === 'silhouette') return [Math.round(x) / S.base.size[0], Math.round(y) / S.base.size[1]].map(v => Math.round(v * 1000) / 1000);
  const H = S.base.height, pts = S.pts, last = pts.length - 1;
  let tt = i === 0 ? 0 : i === last ? 1 : Math.min(pts[i + 1][0] - 0.005, Math.max(pts[i - 1][0] + 0.005, -y / H));
  return [Math.round(tt * 1000) / 1000, Math.max(3, Math.round(Math.abs(x) / XS * 2) / 2)];
}
function mirrorIndex(i) {
  if (!S.sym || S.target.tool !== 'silhouette') return -1;
  const [u, v] = S.pts[i]; if (Math.abs(u) < 0.004) return -1;
  let best = -1, bd = 0.03; S.pts.forEach(([a, b], k) => { if (k === i) return; const d = Math.hypot(a + u, b - v); if (d < bd) { bd = d; best = k; } });
  return best;
}
function bindEditor() {
  const svg = $('#editor'); if (!svg) return;
  let drag = -1, mirror = -1, press = 0, moved = false; const touches = new Map(); let pinch = null;
  svg.addEventListener('pointerdown', e => {
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), view: viewBox().slice()}; drag = -1; return; }
    const h = e.target.closest('[data-h]');
    if (h) {
      ensurePts(); drag = +h.dataset.h; S.sel = drag; mirror = mirrorIndex(drag); snapshot(); moved = false; svg.setPointerCapture(e.pointerId);
      clearTimeout(press); press = setTimeout(() => { if (!moved) removePoint(drag); drag = -1; }, 650);
      drawEditor(); renderToolState(); return;
    }
    if (e.target.id === 'shapePath' || e.detail === 2) insertPoint(svgPoint(svg, e));
  });
  svg.addEventListener('pointermove', e => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && touches.size === 2) { const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), k = pinch.d / Math.max(10, d), [x, y, w, h] = pinch.view; S.view = [x + w / 2 - w * k / 2, y + h / 2 - h * k / 2, w * k, h * k]; drawEditor(); return; }
    if (drag < 0) return; moved = true; clearTimeout(press);
    const p = svgPoint(svg, e); S.pts[drag] = fromMm(p.x, p.y, drag);
    if (mirror >= 0) S.pts[mirror] = [-S.pts[drag][0], S.pts[drag][1]];
    drawEditor(); writeOverrideSoon();
  });
  const end = e => { touches.delete(e.pointerId); if (touches.size < 2) pinch = null; clearTimeout(press); if (drag >= 0) { drag = -1; writeOverride(); renderToolState(); } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 0.89); }, {passive: false});
}
let soon = 0; function writeOverrideSoon() { cancelAnimationFrame(soon); soon = requestAnimationFrame(writeOverride); }
function insertPoint(p) {
  ensurePts(); snapshot();
  const t = S.target, pts = S.pts, mm = handlesMm(); let best = 0, bd = Infinity;
  const n = pts.length, segs = t.tool === 'silhouette' ? n : n - 1;
  for (let i = 0; i < segs; i++) { const a = mm[i], b = mm[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], L = ex * ex + ey * ey || 1, k = Math.max(0, Math.min(1, ((p.x - a[0]) * ex + (p.y - a[1]) * ey) / L)), d = Math.hypot(a[0] + ex * k - p.x, a[1] + ey * k - p.y); if (d < bd) { bd = d; best = i; } }
  const np = fromMm(p.x, p.y, -1);
  if (t.tool === 'profile') { const tt = Math.min(0.995, Math.max(0.005, -p.y / S.base.height)); pts.splice(best + 1, 0, [Math.round(tt * 1000) / 1000, Math.max(3, Math.round(Math.abs(p.x) / XS * 2) / 2)]); pts.sort((a, b) => a[0] - b[0]); }
  else { pts.splice(best + 1, 0, np); if (S.sym && Math.abs(np[0]) > 0.004) insertMirror(np); }
  S.sel = -1; writeOverride(); drawEditor(); renderToolState();
}
function insertMirror([u, v]) { const pts = S.pts, mm = pts.map(toMm), q = toMm([-u, v]); let best = 0, bd = Infinity; for (let i = 0; i < pts.length; i++) { const a = mm[i], b = mm[(i + 1) % pts.length], d = Math.hypot((a[0] + b[0]) / 2 - q[0], (a[1] + b[1]) / 2 - q[1]); if (d < bd) { bd = d; best = i; } } pts.splice(best + 1, 0, [-u, v]); }
function removePoint(i) {
  if (i < 0 || !S.pts) return; const t = S.target, min = t.tool === 'silhouette' ? 4 : 2;
  if (S.pts.length <= min || (t.tool === 'profile' && (i === 0 || i === S.pts.length - 1))) return;
  snapshot(); const m = mirrorIndex(i); S.pts.splice(i, 1); if (m >= 0) S.pts.splice(m > i ? m - 1 : m, 1);
  S.sel = -1; writeOverride(); drawEditor(); renderToolState();
}
function zoom(k) { const [x, y, w, h] = viewBox(); S.view = [x + w / 2 - w * k / 2, y + h / 2 - h * k / 2, w * k, h * k]; drawEditor(); }

// Starting shapes a designer can begin from (normalised silhouette, 0-centred).
const PRESETS = {
  oval: () => Array.from({length: 12}, (_, i) => { const a = i / 12 * Math.PI * 2; return [0.5 * Math.cos(a), 0.5 * Math.sin(a)]; }),
  soft: () => [[-0.5, -0.38], [-0.38, -0.5], [0.38, -0.5], [0.5, -0.38], [0.5, 0.38], [0.38, 0.5], [-0.38, 0.5], [-0.5, 0.38]],
  boat: () => [[-0.5, 0], [-0.4, -0.42], [0, -0.5], [0.4, -0.42], [0.5, 0], [0.4, 0.42], [0, 0.5], [-0.4, 0.42]],
  bow: () => [[-0.5, -0.5], [0, -0.42], [0.5, -0.5], [0.5, 0.5], [0, 0.42], [-0.5, 0.5]],
  taper: () => [[0, 1], [0.35, 1], [0.6, 0.9], [1, 0.55]], swell: () => [[0, 0.7], [0.3, 1.05], [0.75, 0.85], [1, 0.6]], spindle: () => [[0, 0.6], [0.12, 0.95], [0.25, 0.65], [0.5, 0.85], [0.75, 0.6], [1, 0.75]]
};
function applyPreset(k) {
  snapshot(); const t = S.target;
  if (t.tool === 'silhouette') S.pts = PRESETS[k]();
  else { const R = Math.max(...S.base.points.map(p => p[1])); S.pts = PRESETS[k]().map(([tt, f]) => [tt, Math.round(R * f * 2) / 2]); }
  S.sel = -1; writeOverride(); drawEditor(); renderToolState();
}


// ---- Structure: pick in 3D, move / rotate / scale, duplicate, mirror, delete, add ------------------------------
const R2D = 180 / Math.PI, round1 = v => Math.round(v * 10) / 10;
const partOf = id => S.compiled?.parts.find(q => q.id === id);
const ovs = () => (design().overrides || []).slice();
// ---- Versions: every structural change is kept (last 60) per design in this browser; restore or compare ------
const histKey = () => { const d = design(); return `aura-atelier-v-${d.family}-${d.kind}-${d.style}-${d.seed}`; };
function versions() { try { return JSON.parse(localStorage.getItem(histKey()) || '[]'); } catch { return []; } }
function saveVersion(label) { try { const v = versions(), ov = design().overrides || []; if (JSON.stringify(v.at(-1)?.ov) === JSON.stringify(ov)) return; v.push({t: Date.now(), label, ov}); localStorage.setItem(histKey(), JSON.stringify(v.slice(-60))); } catch {} }
async function contentHash(d) { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(d))); return [...new Uint8Array(buf)].slice(0, 6).map(b => b.toString(16).padStart(2, '0')).join(''); }
function versionPanel() {
  const v = versions().slice().reverse();
  return sec('ver', `Sürümler (${v.length})`, `<div class="a-tools"><button data-compare aria-pressed="${!!S.compare}">${S.compare ? 'Benim tasarımım' : 'Özgün tasarımla karşılaştır'}</button><button data-share>Müşteriye onaya gönder</button></div>
    <p class="a-note" id="shareOut"></p>
    ${v.length ? `<ul class="a-checks">${v.slice(0, 20).map((x, i) => `<li>${new Date(x.t).toLocaleString('tr-TR', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})} · ${x.label || 'değişiklik'} · ${x.ov.length} işlem <button data-restore="${v.length - 1 - i}">Geri yükle</button></li>`).join('')}</ul>` : '<p class="a-note">Henüz kayıtlı sürüm yok; her değişiklik otomatik saklanır.</p>'}`);
}
function commit(list, keepPart = true) {
  S.hist.push(JSON.stringify(design().overrides || [])); if (S.hist.length > 100) S.hist.shift(); S.fut = [];
  S.items[S.cur].design = normalizeDesign({...design(), overrides: list});
  if (!keepPart || (S.part && !partOf(S.part) && !compileDesign(design()).parts.some(q => q.id === S.part))) S.part = null;
  saveVersion(list.at(-1)?.tool); rebuild(); renderItems(); renderPanel(); syncViewerSel();
}
function syncViewerSel() { viewer?.select(S.multiOn && S.multi.length ? S.multi : S.part); viewer?.gizmo(S.part, S.mode, onGizmoEnd); }
const transformOf = id => ovs().filter(o => o.tool === 'transform' && o.id === id).at(-1) || {tool: 'transform', id, move: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1]};
function setTransform(id, f) { const t = structuredClone(transformOf(id)); f(t); commit([...ovs().filter(o => !(o.tool === 'transform' && o.id === id)), t]); }
function onGizmoEnd({pos, rot, scale}) {
  const q = partOf(S.part); if (!q) return;
  setTransform(S.part, t => { t.move = t.move.map((v, i) => round1(v + pos[i] - q.pos[i])); t.rot = t.rot.map((v, i) => v + rot[i] - q.rot[i]); t.scale = t.scale.map((v, i) => Math.round(v * scale[i] * 1000) / 1000); });
}
function pickPart(id) {
  if (S.multiOn && id) { S.multi = S.multi.includes(id) ? S.multi.filter(x => x !== id) : [...S.multi, id]; S.part = S.multi.at(-1) || null; renderPanel(); syncViewerSel(); return; }
  S.part = id; S.placing = false; renderPanel(); syncViewerSel(); }
function uniqueId(base) { const ids = new Set(S.compiled.parts.map(q => q.id)); let k = 2; while (ids.has(`${base}-${k}`)) k++; return `${base}-${k}`; }
function duplicatePart(mirror) { if (mirror === true) mirror = 'x'; const id = S.part; if (!id) return; const as = uniqueId(id); commit([...ovs(), {tool: 'duplicate', id, as, mirror}]); pickPart(as); }
function deletePart() {
  const id = S.part; if (!id) return; const list = ovs();
  const own = list.filter(o => (o.tool === 'add' && o.id === id) || (o.tool === 'duplicate' && o.as === id));
  const rest = list.filter(o => !own.includes(o) && !(o.tool === 'transform' && o.id === id));
  S.part = null; commit(own.length ? rest : [...rest, {tool: 'remove', id}], false); syncViewerSel();
}
function addPart() {
  const shape = $('#addShape').value, size = ['#addW', '#addH', '#addD'].map(k => +$(k).value || 0), mat = $('#addMat').value;
  const b = S.compiled.meta?.overall || {}, id = uniqueId('ek');
  const y = ['round', 'square'].includes(shape) ? 0 : Math.max(size[1] / 2, (b.height || 400) / 2);
  commit([...ovs(), {tool: 'add', id, shape, size, mat, pos: [0, y, 0], radius: shape === 'softbox' ? 20 : 2}]); pickPart(id);
}
function undoStructure() { if (!S.hist.length) return; S.fut.push(JSON.stringify(design().overrides || [])); S.items[S.cur].design = normalizeDesign({...design(), overrides: JSON.parse(S.hist.pop())}); if (S.part && !compileDesign(design()).parts.some(q => q.id === S.part)) S.part = null; rebuild(); renderItems(); renderPanel(); syncViewerSel(); }
function redoStructure() { if (!S.fut.length) return; S.hist.push(JSON.stringify(design().overrides || [])); S.items[S.cur].design = normalizeDesign({...design(), overrides: JSON.parse(S.fut.pop())}); rebuild(); renderItems(); renderPanel(); syncViewerSel(); }
const EDGE_TR = {square: 'Düz', eased: 'Kırık (yumuşak)', chamfer: 'Pah', underbevel: 'Alt pah', bullnose: 'Yarım yuvarlak', ogee: 'Ogee'};
const SIDE_TR = {front: 'Ön', back: 'Arka', left: 'Sol', right: 'Sağ'};
const g0 = q => q.geom.fn === 'cut' ? q.geom.inner : q.geom;
const edgeable = q => { if (!q) return false; const g = g0(q); return g.fn === 'slab' || (g.fn === 'cushion' && !g.crownTop && !g.crownFront); };
const edgeOf = id => ovs().filter(o => o.tool === 'edge' && o.id === id).at(-1)?.sides || {};
function setEdge(id, sides) { const cur = {...edgeOf(id), ...sides}; commit([...ovs().filter(o => !(o.tool === 'edge' && o.id === id)), {tool: 'edge', id, sides: cur}]); }
const sweepable = q => q && (q = {...q, geom: g0(q)}) && (q.geom.fn === 'lathe' || (q.geom.fn === 'clipped' && q.geom.inner?.fn === 'lathe') || q.geom.fn === 'sweep' || (q.geom.fn === 'clipped' && q.geom.inner?.fn === 'sweep') || ((q.geom.fn === 'cushion' || q.geom.fn === 'box') && !q.geom.crownTop && !q.geom.crownFront));
const sweepOf = q => ovs().filter(o => o.tool === 'sweep' && (o.id === q.id || (o.role && o.role === q.role))).at(-1);
function setSweep(q, v, all) { const list = ovs().filter(o => !(o.tool === 'sweep' && (o.id === q.id || (o.role && o.role === q.role)))); commit(v ? [...list, {tool: 'sweep', ...(all ? {role: q.role} : {id: q.id}), ...v}] : list); }
function sweepPanel(q) {
  if (!sweepable(q)) return '';
  const o = sweepOf(q) || {mode: 'straight', bow: 40, dir: 'out', taper0: 1, taper1: 1, shape: q.geom.square || q.geom.inner?.square || q.geom.fn === 'cushion' ? 'square' : 'round'};
  const opt = (k, map) => `<select data-sw="${k}">${Object.entries(map).map(([v, t]) => `<option value="${v}" ${String(o[k]) === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  return sec('sweep', 'Eğri ve incelme', `<div class="a-grid"><span>Biçim</span>${opt('mode', {straight: 'Düz', arc: 'Kavis', sabre: 'Kılıç'})}${opt('shape', {square: 'Kare kesit', round: 'Yuvarlak kesit'})}${opt('dir', {out: 'Dışa', in: 'İçe', '+x': '+X', '-x': '−X', '+z': 'Öne', '-z': 'Arkaya'})}
  <span>Kavis mm</span><input type="number" data-sw="bow" value="${o.bow}" inputmode="numeric"><span>Uç / dip %</span><input type="number" data-sw="taper0" value="${Math.round(o.taper0 * 100)}" inputmode="numeric">
  <span>Üst / baş %</span><input type="number" data-sw="taper1" value="${Math.round(o.taper1 * 100)}" inputmode="numeric"><label class="a-note"><input type="checkbox" data-swall ${o.role ? 'checked' : ''}> Aynı türdeki tüm parçalar</label><span></span></div>
  ${sweepOf(q) ? '<div class="a-tools"><button data-swoff>Eğriyi kaldır</button></div>' : ''}<p class="a-note">Kılıç: dipte açılan kavis. Uç %: alt ya da baş ucundaki kesit oranı (incelme).</p>`);
}
function readSweep() { const g = k => $(`[data-sw=${k}]`).value; return {mode: g('mode'), shape: g('shape'), dir: g('dir'), bow: +g('bow') || 0, taper0: (+g('taper0') || 100) / 100, taper1: (+g('taper1') || 100) / 100}; }
const CUT_TR = {hole: 'Delik', pocket: 'Cep', slot: 'Uzun delik (yarık)', groove: 'Kanal', flutes: 'Yiv dizisi (fluting)'};
const cutsOf = id => ovs().filter(o => o.tool === 'cut' && o.id === id).at(-1)?.ops || [];
function setCuts(id, ops) { commit([...ovs().filter(o => !(o.tool === 'cut' && o.id === id)), ...(ops.length ? [{tool: 'cut', id, ops}] : [])]); }
function readCut() { const g = k => +($(`[data-cut=${k}]`)?.value) || 0; const t = $('[data-cut=type]').value; return {type: t, dia: g('dia'), a: g('a'), b: g('b'), depth: g('depth'), count: g('count') || 1, pitch: g('pitch'), dir: g('dir')}; }
function cutPanel(q) {
  if (!q || q.line) return '';
  const t = S.cutType || 'hole', f = (k, label, v) => `<span>${label}</span><input type="number" data-cut="${k}" value="${v}" inputmode="decimal">`;
  const fields = t === 'hole' ? f('dia', 'Çap mm', 8) + f('depth', 'Derinlik mm (0 = boydan boya)', 12)
    : t === 'flutes' ? f('a', 'Uzunluk mm', 400) + f('b', 'Genişlik mm', 12) + f('depth', 'Derinlik mm', 5) + f('count', 'Adet', 7) + f('pitch', 'Aralık mm', 24) + f('dir', 'Yön °', 0)
    : t === 'groove' ? f('a', 'Uzunluk mm', 400) + f('b', 'Genişlik mm', 8) + f('depth', 'Derinlik mm', 6) + f('dir', 'Yön °', 0)
    : f('a', 'En mm', t === 'slot' ? 120 : 120) + f('b', 'Boy mm', t === 'slot' ? 25 : 80) + f('depth', 'Derinlik mm (0 = boydan boya)', t === 'slot' ? 0 : 10);
  const list = cutsOf(q.id);
  return sec('cut', 'İşleme (CNC)', `<div class="a-grid a-grid2"><span>Tür</span><select data-cut="type">${Object.entries(CUT_TR).map(([k, v]) => `<option value="${k}" ${k === t ? 'selected' : ''}>${v}</option>`).join('')}</select>${fields}</div>
  <div class="a-tools"><button data-place aria-pressed="${!!S.placing}">${S.placing ? 'Yüzeye dokunun…' : 'Yüzeye dokunarak yerleştir'}</button></div>
  ${list.length ? `<ul class="a-checks">${list.map((c, i) => `<li>${CUT_TR[c.type]} · ${c.type === 'hole' ? 'Ø' + c.dia : c.a + '×' + c.b}${c.depth ? ' · ' + c.depth + ' mm' : ' · boydan'}${c.type === 'flutes' ? ' · ' + c.count + ' adet' : ''} <button data-cutdel="${i}">Sil</button></li>`).join('')}</ul>` : ''}`);
}
function placeCut(hit) {
  const q = partOf(S.part); if (!q || hit.id !== q.id) return false;
  const n = hit.normal, ax = [0, 1, 2].reduce((m, i) => Math.abs(n[i]) > Math.abs(n[m]) ? i : m, 0);
  const op = {...readCut(), at: hit.local.map(v => Math.round(v * 10) / 10), axis: ax, sign: n[ax] < 0 ? -1 : 1};
  S.placing = false; setCuts(q.id, [...cutsOf(q.id), op]); return true;
}
function edgePanel(q) {
  if (!edgeable(q)) return '';
  const cur = edgeOf(q.id), gq = g0(q), def = gq.fn === 'slab' ? [gq.profile[0], gq.profile[2] ?? 6] : ['square', 0];
  const row = k => { const [t, v] = cur[k] || def; return `<span>${SIDE_TR[k]}</span><select data-edge="${k}">${EDGE_TYPES.map(e => `<option value="${e}" ${e === t ? 'selected' : ''}>${EDGE_TR[e]}</option>`).join('')}</select><input type="number" data-edgesize="${k}" value="${Math.round(v)}" min="1" max="80" inputmode="numeric"><span>mm</span>`; };
  return sec('edge', 'Kenar profili', `<div class="a-grid a-grid4">${['front', 'back', 'left', 'right'].map(row).join('')}
  <span>Tümü</span><select data-edge="all"><option value="">—</option>${EDGE_TYPES.map(e => `<option value="${e}">${EDGE_TR[e]}</option>`).join('')}</select><span></span><span></span></div>`);
}
const SHAPE_TR = {box: 'Kutu', softbox: 'Yuvarlatılmış kutu', round: 'Yuvarlak çubuk', square: 'Kare çubuk', panel: 'Panel'};
const MAT_TR = {wood: 'Ahşap', metal: 'Metal', fabric: 'Kumaş', dark: 'Koyu', case: 'Gövde', front: 'Kapak', top: 'Tabla', base: 'Alt yapı', steel: 'Çelik', frame: 'Çerçeve', welt: 'Biye'};
function structurePanel() {
  const q = S.part && partOf(S.part), t = q && transformOf(q.id), mats = [...new Set(S.compiled.parts.filter(p => !p.line && typeof p.mat === 'string' && !p.mat.startsWith('lac:')).map(p => p.mat))];
  const num = (k, v, step) => `<input type="number" data-tf="${k}" value="${v}" step="${step}" inputmode="decimal">`;
  const editable = q && editableParts(S.compiled).find(e => e.id === q.id || (e.tool === 'profile' && e.role === q.role));
  return `<div class="a-tools"><button data-multi aria-pressed="${S.multiOn}">Çoklu seçim</button><button data-snap aria-pressed="${S.snap}">Yakalama 5 mm / 5°</button></div>${S.multiOn ? arrangePanel(null) : ''}<h2>Seçili parça</h2>${q ? `<p class="a-note"><b>${NAMES[q.role] || q.role}</b> · ${q.id}${q.added ? ' · eklenen' : ''}</p>
  <div class="a-tools">${['translate', 'rotate', 'scale'].map(m => `<button data-mode="${m}" aria-pressed="${S.mode === m}">${{translate: 'Taşı', rotate: 'Döndür', scale: 'Ölçekle'}[m]}</button>`).join('')}${editable ? `<button data-shape="${editable.key}">Biçimi düzenle</button>` : ''}</div>
  <div class="a-grid"><span>Kaydır mm</span>${num('m0', round1(t.move[0]), 5)}${num('m1', round1(t.move[1]), 5)}${num('m2', round1(t.move[2]), 5)}
  <span>Döndür °</span>${num('r0', round1(t.rot[0] * R2D), 1)}${num('r1', round1(t.rot[1] * R2D), 1)}${num('r2', round1(t.rot[2] * R2D), 1)}
  <span>Ölçek %</span>${num('s0', round1(t.scale[0] * 100), 1)}${num('s1', round1(t.scale[1] * 100), 1)}${num('s2', round1(t.scale[2] * 100), 1)}</div>
  ${edgePanel(q)}${sweepPanel(q)}${materialPanel(q)}${upholsterPanel(q)}${cutPanel(q)}${arrangePanel(q)}
  <div class="a-tools"><button data-dup>Çoğalt</button><button data-mirror>Aynala (karşı taraf)</button><button data-tfreset>Konumu sıfırla</button><button data-delpart>Sil</button></div>`
  : '<p class="a-note">3D görünümde bir parçaya dokunun. Seçilen parçayı tutamaçlarla taşıyın, döndürün ya da ölçekleyin; sayıyla da girebilirsiniz.</p>'}
  <div class="a-tools"><button data-sundo ${S.hist.length ? '' : 'disabled'}>↶ Yapı geri</button><button data-sredo ${S.fut.length ? '' : 'disabled'}>↷ Yapı ileri</button></div>
  <h2>Parça ekle</h2><div class="a-grid"><span>Biçim</span><select id="addShape">${ADD_SHAPES.map(k => `<option value="${k}">${SHAPE_TR[k]}</option>`).join('')}</select>
  <select id="addMat">${mats.sort((a, b) => (b === 'wood') - (a === 'wood')).map(m => `<option value="${m}">${MAT_TR[m] || m}</option>`).join('')}</select><span></span>
  <span>G × Y × D mm</span><input id="addW" type="number" value="400" inputmode="numeric"><input id="addH" type="number" value="30" inputmode="numeric"><input id="addD" type="number" value="300" inputmode="numeric"></div>
  <div class="a-tools"><button data-add>+ Ekle</button></div><p class="a-note">Çubuklarda G çaptır, Y boydur.</p>`;
}


// ---- Arrays, mirrors, alignment, equal spacing ----------------------------------------------------------------
function worldBox(id) { const q = partOf(id); if (!q) return null; const P = worldPositions(q), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity]; for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i + k]); hi[k] = Math.max(hi[k], P[i + k]); } return {lo, hi, c: lo.map((v, k) => (v + hi[k]) / 2)}; }
function moveMany(moves) { // moves: {id: [dx,dy,dz]} added to each part's transform, one undo step
  let list = ovs();
  for (const [id, d] of Object.entries(moves)) { const t = structuredClone(transformOf(id)); t.move = t.move.map((v, i) => round1(v + d[i])); list = [...list.filter(o => !(o.tool === 'transform' && o.id === id)), t]; }
  commit(list);
}
function alignParts(axis, where) {
  const boxes = S.multi.map(id => [id, worldBox(id)]).filter(([, b]) => b); if (boxes.length < 2) return;
  const ref = boxes.at(-1)[1], target = where === 'min' ? ref.lo[axis] : where === 'max' ? ref.hi[axis] : ref.c[axis], moves = {};
  for (const [id, b] of boxes.slice(0, -1)) { const cur = where === 'min' ? b.lo[axis] : where === 'max' ? b.hi[axis] : b.c[axis], d = [0, 0, 0]; d[axis] = target - cur; moves[id] = d; }
  moveMany(moves);
}
function distribute(axis) {
  const boxes = S.multi.map(id => [id, worldBox(id)]).filter(([, b]) => b).sort((a, b) => a[1].c[axis] - b[1].c[axis]); if (boxes.length < 3) return;
  const a = boxes[0][1].c[axis], z = boxes.at(-1)[1].c[axis], moves = {};
  boxes.forEach(([id, b], i) => { if (i === 0 || i === boxes.length - 1) return; const d = [0, 0, 0]; d[axis] = a + (z - a) * i / (boxes.length - 1) - b.c[axis]; moves[id] = d; });
  moveMany(moves);
}
function makeArray() {
  const id = S.part; if (!id) return; const g = k => +($(`[data-arr=${k}]`)?.value) || 0, kind = $('[data-arr=kind]').value;
  const list = ovs().filter(o => !(o.tool === 'array' && o.id === id));
  commit([...list, {tool: 'array', id, kind, count: g('count'), step: [g('sx'), g('sy'), g('sz')], angle: g('angle'), center: [0, 0, 0]}]);
}
const SURF_TR = {wood: 'Masif ahşap', veneer: 'Ahşap kaplama', stone: 'Taş', metal: 'Metal', lacquer: 'Lake / boya', glass: 'Cam'};
const trName = (o, k) => o[k]?.tr || k;
const matOf = id => ovs().filter(o => o.tool === 'material' && o.id === id).at(-1);
function materialPanel(q) {
  if (!q) return '';
  const m = matOf(q.id), sp = m?.spec || {surface: 'wood', species: 'oak', stain: 'natural', finish: 'oil'}, grain = m?.grain || 'along';
  const sel = (k, obj, v) => `<select data-mat="${k}">${Object.keys(obj).map(x => `<option value="${x}" ${x === v ? 'selected' : ''}>${trName(obj, x)}</option>`).join('')}</select>`;
  const rows = sp.surface === 'wood' || sp.surface === 'veneer' ? `<span>Ağaç</span>${sel('species', WOODS, sp.species)}<span>Renk</span>${sel('stain', STAINS, sp.stain)}<span>Yüzey</span>${sel('finish', FINISHES, sp.finish)}
      <span>Damar</span><select data-mat="grain">${Object.entries({along: 'Boyuna', across: 'Enine', diag: '45°'}).map(([k, v]) => `<option value="${k}" ${k === grain ? 'selected' : ''}>${v}</option>`).join('')}</select>`
    : sp.surface === 'stone' ? `<span>Taş</span>${sel('stone', STONES, sp.stone)}<span>Yüzey</span><select data-mat="polish"><option value="honed" ${sp.polish !== 'polished' ? 'selected' : ''}>Mat</option><option value="polished" ${sp.polish === 'polished' ? 'selected' : ''}>Parlak</option></select>`
    : sp.surface === 'metal' ? `<span>Metal</span>${sel('metal', METALS, sp.metal)}`
    : sp.surface === 'glass' ? `<span>Cam</span>${sel('glass', GLASS, sp.glass)}`
    : `<span>Renk</span>${sel('color', COLORS, sp.color)}<span>Parlaklık</span><select data-mat="finish"><option value="matte">Mat</option><option value="lacquer" ${sp.finish === 'lacquer' ? 'selected' : ''}>Parlak lake</option></select>`;
  return sec('mat', 'Malzeme ve damar', `<div class="a-grid a-grid2"><span>Tür</span><select data-mat="surface">${Object.entries(SURF_TR).map(([k, v]) => `<option value="${k}" ${k === sp.surface ? 'selected' : ''}>${v}</option>`).join('')}</select>${rows}</div>
    ${m ? '<div class="a-tools"><button data-matoff>Tasarımın malzemesine dön</button></div>' : '<p class="a-note">Şu an tasarımın ortak malzemesi kullanılıyor; bir seçim yapınca yalnız bu parça değişir.</p>'}`);
}
const isCushion = q => q && q.geom.fn === 'cushion' && /fabric|welt|leather/.test(q.mat || '');
function upholsterPanel(q) {
  if (!isCushion(q)) return '';
  const o = ovs().filter(x => x.tool === 'upholster' && (x.id === q.id || x.role === q.role)).at(-1) || {crownTop: q.geom.crownTop || 0, crownFront: q.geom.crownFront || 0, r: q.geom.r || 20, rows: 0, cols: 0, depth: 0};
  const f = (k, label, v) => `<span>${label}</span><input type="number" data-up="${k}" value="${Math.round(v)}" inputmode="numeric">`;
  return sec('uph', 'Döşeme biçimi', `<div class="a-grid a-grid2">${f('crownTop', 'Üst kabarıklık mm', o.crownTop)}${f('crownFront', 'Ön kabarıklık mm', o.crownFront)}${f('r', 'Kenar yuvarlaklığı mm', o.r)}${f('rows', 'Kapitone sıra', o.rows)}${f('cols', 'Kapitone sütun', o.cols)}${f('depth', 'Düğme derinliği mm', o.depth)}
    <span>Desen</span><select data-up="diamond"><option value="">Kare ızgara</option><option value="1" ${o.diamond ? 'selected' : ''}>Baklava (kapitone)</option></select></div>
    <label class="a-note"><input type="checkbox" data-upall ${o.role ? 'checked' : ''}> Aynı türdeki tüm minderler</label>`);
}
function readMaterial() {
  const g = k => $(`[data-mat=${k}]`)?.value, surface = g('surface'), spec = {surface};
  if (surface === 'wood' || surface === 'veneer') Object.assign(spec, {species: g('species') || 'oak', stain: g('stain') || 'natural', finish: g('finish') || 'oil'});
  else if (surface === 'stone') Object.assign(spec, {stone: g('stone') || Object.keys(STONES)[0], polish: g('polish') || 'honed'});
  else if (surface === 'metal') spec.metal = g('metal') || Object.keys(METALS)[0];
  else if (surface === 'glass') spec.glass = g('glass') || Object.keys(GLASS)[0];
  else Object.assign(spec, {color: g('color') || 'white', finish: g('finish') || 'matte'});
  return {spec, grain: g('grain') || 'along'};
}
const AX = ['X', 'Y', 'Z'];
S.open = new Set(); const sec = (k, title, body) => `<details data-sec="${k}" ${S.open.has(k) ? 'open' : ''}><summary>${title}</summary>${body}</details>`;
function arrangePanel(q) {
  if (S.multiOn && q) return '';
  if (S.multiOn) return `<h2>Hizala ve dağıt (${S.multi.length} parça)</h2><p class="a-note">Son seçilen parça referanstır.</p>
    ${[0, 1, 2].map(a => `<div class="a-tools"><span class="a-note">${AX[a]}</span><button data-align="${a}:min">En küçük</button><button data-align="${a}:mid">Orta</button><button data-align="${a}:max">En büyük</button>${a !== 1 ? `<button data-dist="${a}">Eşit aralık</button>` : `<button data-dist="1">Eşit aralık</button>`}</div>`).join('')}`;
  if (!q) return '';
  const arr = ovs().filter(o => o.tool === 'array' && o.id === q.id).at(-1) || {kind: 'linear', count: 4, step: [0, 0, 150], angle: 90};
  const f = (k, label, v) => `<span>${label}</span><input type="number" data-arr="${k}" value="${v}" inputmode="decimal">`;
  return sec('array', 'Dizi ve ayna', `<div class="a-grid a-grid2"><span>Tür</span><select data-arr="kind"><option value="linear" ${arr.kind === 'linear' ? 'selected' : ''}>Doğrusal</option><option value="radial" ${arr.kind === 'radial' ? 'selected' : ''}>Dairesel (dikey eksen)</option></select>
    ${f('count', 'Adet (toplam)', arr.count)}${f('sx', 'Adım X mm', arr.step[0])}${f('sy', 'Adım Y mm', arr.step[1])}${f('sz', 'Adım Z mm', arr.step[2])}${f('angle', 'Açı ° (dairesel)', arr.angle)}</div>
    <div class="a-tools"><button data-arrmake>Diziyi uygula</button>${ovs().some(o => o.tool === 'array' && o.id === q.id) ? '<button data-arrdel>Diziyi kaldır</button>' : ''}<button data-mirrorz>Aynala (ön/arka)</button></div>`);
}

/** Cut list of the designed piece: every solid part with finished size (mm), material and machining. */
function cutList() {
  const rows = [['Parça', 'Kimlik', 'Malzeme', 'Boy', 'En', 'Kalınlık', 'Damar', 'İşlemler', 'Not']];
  const d = design(), matName = q => { const sp = q.matSpec; if (sp) return [sp.surface, sp.species || sp.stone || sp.metal || sp.color || sp.glass, sp.stain].filter(Boolean).join(' '); const m = d.materials?.[q.mat]; return [q.mat, m?.species || m?.stone || m?.color || m?.fiber || ''].filter(Boolean).join(' '); };
  for (const q of S.compiled.parts) {
    if (q.line || q.planOnly || q.decor || /fabric|welt|led/.test(q.mat || '')) continue;
    const P = worldPositions({...q, pos: [0, 0, 0], rot: [0, 0, 0]}), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < P.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], P[i + k]); hi[k] = Math.max(hi[k], P[i + k]); }
    const g = q.geom.fn === 'cut' ? q.geom.inner : q.geom, L = g.fn === 'lathe' ? g : g.fn === 'clipped' && g.inner?.fn === 'lathe' ? g.inner : null;
    const turned = L && [Math.round(Math.max(...L.profile.map(r => r[0])) / (g.fn === 'clipped' ? Math.cos(Math.max(...(g.rot || [0]).map(Math.abs))) : 1)), Math.round(2 * Math.max(...L.profile.map(r => r[1]))), Math.round(2 * Math.max(...L.profile.map(r => r[1])))];
    const dims = (turned || (Array.isArray(q.cut) ? q.cut.slice() : hi.map((v, k) => Math.round(v - lo[k])))).sort((a, b) => b - a);
    const ops = (q.cuts || []).map(c => c.type === 'hole' ? `delik Ø${c.dia}${c.depth ? ' d' + c.depth : ''}` : `${c.type} ${c.a}×${c.b}${c.depth ? ' d' + c.depth : ''}${c.count > 1 ? ' ×' + c.count : ''}`).join('; ');
    rows.push([NAMES[q.role] || q.role, q.id, matName(q), ...dims.slice(0, 3), q.grain || 'boyuna', ops, [q.added ? 'eklenen' : '', q.shaped ? 'biçimli (CNC)' : ''].filter(Boolean).join(' ')]);
  }
  return '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
}

// ---- Panel ------------------------------------------------------------------------------------------------------
function renderPanel() {
  const d = design(), p = $('#panel');
  if (!d) { p.innerHTML = '<p class="a-note">Tasarım bulunamadı. Müşterinin bağlantısını yapıştırın.</p>'; return; }
  const parts = editableParts(S.compiled);
  p.innerHTML = structurePanel() + `<h2>Parça biçimi</h2><div class="a-parts">${parts.map(t => `<button data-part="${t.key}" aria-pressed="${S.target?.key === t.key}">${nameOf(t)}${(d.overrides || []).some(o => (o.id && 'id:' + o.id === t.key) || (o.role && 'role:' + o.role === t.key && o.tool === 'profile')) ? ' ✎' : ''}</button>`).join('') || '<span class="a-note">Bu üründe biçimlendirilebilir parça yok.</span>'}</div>
  ${S.target ? `<h2>${nameOf(S.target)}</h2>
  <div class="a-tools">${S.target.tool === 'silhouette' ? `<button data-sym aria-pressed="${S.sym}">Simetri</button><button data-preset="soft">Yumuşak köşe</button><button data-preset="oval">Oval</button><button data-preset="boat">Tekne</button><button data-preset="bow">İçbükey kenar</button>`
    : `<button data-preset="taper">Konik</button><button data-preset="swell">Şişkin</button><button data-preset="spindle">Torna halkalı</button>`}</div>
  <svg id="editor"></svg>
  <div class="a-tools"><button data-undo>↶ Geri</button><button data-redo>↷ İleri</button><button data-del>Noktayı sil</button><button data-zoom="0.85">+</button><button data-zoom="1.18">−</button><button data-fit>Sığdır</button><button data-reset>Özgün biçim</button></div>
  <p class="a-note">Noktayı sürükleyin; eğriye dokunarak nokta ekleyin; noktaya uzun basarak silin. İki parmakla yakınlaştırın. Kesik çizgi özgün biçimdir.</p>` : '<p class="a-note">Biçimlendirmek için bir parça seçin.</p>'}
  ${versionPanel()}
  <h2>Fizik ve üretim</h2><ul class="a-checks" id="checks"></ul>
  <h2>Teslim</h2><div class="a-acts"><button class="f-primary" data-act="prod">Üretime gönder →</button><button data-act="link">Bağlantıyı kopyala</button><button data-act="dxf">CNC (DXF) ↓</button><button data-act="stl">STL ↓</button><button data-act="cut">Kesim listesi ↓</button><button data-act="json">design.json ↓</button></div>
  <input id="linkOut" readonly hidden>`;
  if (S.target) { drawEditor(); bindEditor(); renderToolState(); }
  renderChecks();
}
function renderToolState() {
  const q = s => $(s); if (!q('[data-undo]')) return;
  q('[data-undo]').disabled = !S.undo.length; q('[data-redo]').disabled = !S.redo.length; q('[data-del]').disabled = S.sel < 0; q('[data-reset]').disabled = !S.pts;
}
function renderChecks() {
  const el = $('#checks'); if (!el || !S.compiled) return;
  const r = analyse(S.compiled, design().materials, design().family);
  el.innerHTML = r.checks.map(c => `<li class="${c.level}">${c.tr}</li>`).join('') + `<li class="ok">Toplam ağırlık ~${r.mass} kg</li>`;
}

$('#panel').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.mode) { S.mode = b.dataset.mode; renderPanel(); syncViewerSel(); return; }
  if (b.dataset.shape) { const t = editableParts(S.compiled).find(x => x.key === b.dataset.shape); S.view = null; pickTarget(t); return; }
  if (b.hasAttribute('data-dup')) return duplicatePart(false);
  if (b.hasAttribute('data-mirror')) return duplicatePart(true);
  if (b.hasAttribute('data-delpart')) return deletePart();
  if (b.hasAttribute('data-tfreset')) return commit(ovs().filter(o => !(o.tool === 'transform' && o.id === S.part)));
  if (b.hasAttribute('data-add')) return addPart();
  if (b.hasAttribute('data-compare')) { S.compare = !S.compare; rebuild(); renderPanel(); return; }
  if (b.dataset.restore !== undefined) { const v = versions()[+b.dataset.restore]; if (v) commit(v.ov.slice(), false); return; }
  if (b.hasAttribute('data-share')) {
    const d = design(), h = await contentHash(d), link = await designLink(d, 'tr'), url = link.replace(/tasarla\.html/, 'tasarla.html') + `&onay=${h}`;
    $('#shareOut').innerHTML = `Bağlantı kopyalandı. Onay kodu <b>${h}</b> — müşteri bu tasarımı açınca aynı kodu görür; onay bu koda bağlıdır.`; try { await navigator.clipboard.writeText(url); } catch {} saveVersion('müşteriye gönderildi ' + h); return;
  }
  if (b.hasAttribute('data-matoff')) return commit(ovs().filter(o => !(o.tool === 'material' && o.id === S.part)));
  if (b.hasAttribute('data-multi')) { S.multiOn = !S.multiOn; S.multi = S.multiOn && S.part ? [S.part] : []; renderPanel(); syncViewerSel(); return; }
  if (b.hasAttribute('data-snap')) { S.snap = !S.snap; viewer?.snap(S.snap ? 5 : 0, S.snap ? 5 : 0); renderPanel(); return; }
  if (b.dataset.align) { const [a, w] = b.dataset.align.split(':'); return alignParts(+a, w); }
  if (b.dataset.dist) return distribute(+b.dataset.dist);
  if (b.hasAttribute('data-arrmake')) return makeArray();
  if (b.hasAttribute('data-arrdel')) return commit(ovs().filter(o => !(o.tool === 'array' && o.id === S.part)));
  if (b.hasAttribute('data-mirrorz')) return duplicatePart('z');
  if (b.hasAttribute('data-place')) { S.placing = !S.placing; renderPanel(); return; }
  if (b.dataset.cutdel !== undefined) { const l = cutsOf(S.part).slice(); l.splice(+b.dataset.cutdel, 1); return setCuts(S.part, l); }
  if (b.hasAttribute('data-swoff')) return setSweep(partOf(S.part), null);
  if (b.hasAttribute('data-sundo')) return undoStructure();
  if (b.hasAttribute('data-sredo')) return redoStructure();
  if (b.dataset.part) { const t = editableParts(S.compiled).find(x => x.key === b.dataset.part); S.view = null; pickTarget(t); return; }
  if (b.hasAttribute('data-sym')) { S.sym = !S.sym; b.setAttribute('aria-pressed', S.sym); return; }
  if (b.dataset.preset) return applyPreset(b.dataset.preset);
  if (b.hasAttribute('data-undo') && S.undo.length) { S.redo.push(JSON.stringify(S.pts)); S.pts = JSON.parse(S.undo.pop()); writeOverride(); drawEditor(); renderToolState(); return; }
  if (b.hasAttribute('data-redo') && S.redo.length) { S.undo.push(JSON.stringify(S.pts)); S.pts = JSON.parse(S.redo.pop()); writeOverride(); drawEditor(); renderToolState(); return; }
  if (b.hasAttribute('data-del')) return removePoint(S.sel);
  if (b.dataset.zoom) return zoom(+b.dataset.zoom);
  if (b.hasAttribute('data-fit')) { S.view = null; drawEditor(); return; }
  if (b.hasAttribute('data-reset')) { snapshot(); S.pts = null; writeOverride(); renderPanel(); return; }
  const act = b.dataset.act; if (!act) return;
  const link = S.items.length > 1 ? await projectLink(S.items, S.room, 'tr') : await designLink(design(), 'tr');
  if (act === 'link') { const o = $('#linkOut'); o.hidden = false; o.value = link; o.select(); try { await navigator.clipboard.writeText(link); } catch {} }
  if (act === 'prod') location.href = `uretim.html${link.slice(link.indexOf('#'))}`;
  if (act === 'dxf') download(`AURA-${design().kind}-siluet.dxf`, silhouetteDxf(S.compiled), 'application/dxf');
  if (act === 'stl' && viewer) { const data = await viewer.exportSTL(); download(`AURA-${design().kind}.stl`, new Uint8Array(data.buffer || data), 'model/stl'); }
  if (act === 'cut') download(`AURA-${design().kind}-kesim-listesi.csv`, cutList(), 'text/csv');
  if (act === 'json') download(`AURA-${design().kind}-design.json`, JSON.stringify(design(), null, 2), 'application/json');
});
$('#panel').addEventListener('toggle', e => { const k = e.target.dataset?.sec; if (k) e.target.open ? S.open.add(k) : S.open.delete(k); }, true);
$('#panel').addEventListener('change', e => {
  if (S.part && (e.target.dataset?.up !== undefined || e.target.hasAttribute?.('data-upall'))) {
    const q = partOf(S.part), all = $('[data-upall]').checked, g = k => +($(`[data-up=${k}]`).value) || 0;
    const v = {crownTop: g('crownTop'), crownFront: g('crownFront'), r: g('r'), rows: g('rows'), cols: g('cols'), depth: g('depth'), diamond: !!$('[data-up=diamond]').value};
    return commit([...ovs().filter(o => !(o.tool === 'upholster' && (o.id === q.id || o.role === q.role))), {tool: 'upholster', ...(all ? {role: q.role} : {id: q.id}), ...v}]);
  }
  if (S.part && e.target.dataset?.mat) { const prev = matOf(S.part)?.spec?.surface, r = readMaterial(); if (e.target.dataset.mat === 'surface' && prev !== r.spec.surface) { const sf = r.spec.surface; r.spec = sf === 'wood' || sf === 'veneer' ? {surface: sf, species: 'oak', stain: 'natural', finish: 'oil'} : {surface: sf}; } return commit([...ovs().filter(o => !(o.tool === 'material' && o.id === S.part)), {tool: 'material', id: S.part, ...r}]); }
  if (e.target.dataset?.cut === 'type') { S.cutType = e.target.value; renderPanel(); return; }
  if (S.part && (e.target.dataset?.sw || e.target.hasAttribute?.('data-swall'))) { const q = partOf(S.part); return setSweep(q, readSweep(), $('[data-swall]').checked); }
  const ed = e.target.dataset?.edge, es = e.target.dataset?.edgesize;
  if (S.part && (ed || es)) {
    if (ed === 'all') { if (!e.target.value) return; const sz = +($('[data-edgesize=front]')?.value) || 6; return setEdge(S.part, Object.fromEntries(['front', 'back', 'left', 'right'].map(k => [k, [e.target.value, sz]]))); }
    const k = ed || es, t = $(`[data-edge=${k}]`).value, v = +$(`[data-edgesize=${k}]`).value || 6; return setEdge(S.part, {[k]: [t, v]});
  }
  const k = e.target.dataset?.tf; if (!k || !S.part) return; const v = +e.target.value, i = +k[1];
  setTransform(S.part, t => { if (k[0] === 'm') t.move[i] = v; else if (k[0] === 'r') t.rot[i] = v / R2D; else t.scale[i] = Math.max(5, v) / 100; });
});
$('#items').addEventListener('click', e => { const b = e.target.closest('[data-item]'); if (b) select(+b.dataset.item); });
$('#loadBtn').onclick = () => { const v = $('#link').value.trim(); const h = v.slice(v.indexOf('#')); if (h.startsWith('#')) load(h); };

import('./scene.js').then(({createViewer}) => {
  viewer = createViewer($('#stage'));
  if (viewer) {
    viewer.mode('render'); if (S.compiled) viewer.setDesign(S.compiled, design().materials);
    // A tap (not an orbit drag) selects the part under the finger.
    const cv = $('#stage canvas'); let down = null;
    cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return; down = null; if (S.placing) { const hit = viewer.pickPoint(e.clientX, e.clientY); if (!hit || placeCut(hit) || hit.id !== S.part) return; } const id = viewer.pick(e.clientX, e.clientY); if (id !== S.part) pickPart(id); });
  }
}).catch(() => {});
loadCsg().then(() => rebuild());
load(location.hash);
