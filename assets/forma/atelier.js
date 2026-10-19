// Designer workshop: open a customer's design, shape parts by hand (silhouettes of flat parts, turned profiles of
// legs) on a touch screen or with a mouse, see the physical and production checks live, then hand it to production.
// No AI: the designer gives the form, the engine builds it and checks it.
import {normalizeDesign, compileDesign} from './generate.js';
import {readLink, designLink, projectLink} from './link.js';
import {editableParts, currentShape, sampleCurve, bbox, silhouetteDxf} from './overrides.js';
import {analyse} from './physics.js';
import {download} from './package.js';

const $ = s => document.querySelector(s);
const NAMES = {top: 'Tabla', leg: 'Ayak', 'case-top': 'Üst tabla', 'vanity-top': 'Lavabo tezgahı', 'mirror-frame': 'Ayna arkalığı', mirror: 'Ayna camı', 'arm-post': 'Kol dikmesi',
  column: 'Sütun', foot: 'Taban', 'top-plate': 'Tabla altı tablası', shelf: 'Raf', worktop: 'Tezgah', led: 'Işık', headboard: 'Başlık'};
const nameOf = t => `${NAMES[t.role] || t.role}${t.tool === 'profile' ? ' · profil' : ' · siluet'}`;
const S = {items: [], cur: 0, target: null, pts: null, sel: -1, sym: true, undo: [], redo: [], view: null, compiled: null};
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
  S.cur = i; S.target = null; S.pts = null; S.undo = []; S.redo = [];
  rebuild(); renderItems(); renderPanel();
}
const design = () => S.items[S.cur]?.design;

// ---- Model ------------------------------------------------------------------------------------------------------
function rebuild() {
  const d = design(); if (!d) return;
  S.compiled = compileDesign(d);
  viewer?.setDesign(S.compiled, d.materials);
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

// ---- Panel ------------------------------------------------------------------------------------------------------
function renderPanel() {
  const d = design(), p = $('#panel');
  if (!d) { p.innerHTML = '<p class="a-note">Tasarım bulunamadı. Müşterinin bağlantısını yapıştırın.</p>'; return; }
  const parts = editableParts(S.compiled);
  p.innerHTML = `<h2>Parça</h2><div class="a-parts">${parts.map(t => `<button data-part="${t.key}" aria-pressed="${S.target?.key === t.key}">${nameOf(t)}${(d.overrides || []).some(o => (o.id && 'id:' + o.id === t.key) || (o.role && 'role:' + o.role === t.key && o.tool === 'profile')) ? ' ✎' : ''}</button>`).join('') || '<span class="a-note">Bu üründe biçimlendirilebilir parça yok.</span>'}</div>
  ${S.target ? `<h2>${nameOf(S.target)}</h2>
  <div class="a-tools">${S.target.tool === 'silhouette' ? `<button data-sym aria-pressed="${S.sym}">Simetri</button><button data-preset="soft">Yumuşak köşe</button><button data-preset="oval">Oval</button><button data-preset="boat">Tekne</button><button data-preset="bow">İçbükey kenar</button>`
    : `<button data-preset="taper">Konik</button><button data-preset="swell">Şişkin</button><button data-preset="spindle">Torna halkalı</button>`}</div>
  <svg id="editor"></svg>
  <div class="a-tools"><button data-undo>↶ Geri</button><button data-redo>↷ İleri</button><button data-del>Noktayı sil</button><button data-zoom="0.85">+</button><button data-zoom="1.18">−</button><button data-fit>Sığdır</button><button data-reset>Özgün biçim</button></div>
  <p class="a-note">Noktayı sürükleyin; eğriye dokunarak nokta ekleyin; noktaya uzun basarak silin. İki parmakla yakınlaştırın. Kesik çizgi özgün biçimdir.</p>` : '<p class="a-note">Biçimlendirmek için bir parça seçin.</p>'}
  <h2>Fizik ve üretim</h2><ul class="a-checks" id="checks"></ul>
  <h2>Teslim</h2><div class="a-acts"><button class="f-primary" data-act="prod">Üretime gönder →</button><button data-act="link">Bağlantıyı kopyala</button><button data-act="dxf">CNC (DXF) ↓</button><button data-act="json">design.json ↓</button></div>
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
  if (act === 'json') download(`AURA-${design().kind}-design.json`, JSON.stringify(design(), null, 2), 'application/json');
});
$('#items').addEventListener('click', e => { const b = e.target.closest('[data-item]'); if (b) select(+b.dataset.item); });
$('#loadBtn').onclick = () => { const v = $('#link').value.trim(); const h = v.slice(v.indexOf('#')); if (h.startsWith('#')) load(h); };

import('./scene.js').then(({createViewer}) => {
  viewer = createViewer($('#stage'));
  if (viewer) { viewer.mode('render'); if (S.compiled) viewer.setDesign(S.compiled, design().materials); }
}).catch(() => {});
load(location.hash);
