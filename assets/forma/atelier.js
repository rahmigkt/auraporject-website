// Designer workshop: open a customer's design, shape parts by hand (silhouettes of flat parts, turned profiles of
// legs) on a touch screen or with a mouse, see the physical and production checks live, then hand it to production.
// No AI: the designer gives the form, the engine builds it and checks it.
import {normalizeDesign, compileDesign} from './generate.js';
import {readLink, designLink, projectLink} from './link.js';
import {editableParts, currentShape, sampleCurve, bbox, silhouetteDxf, ADD_SHAPES, EDGE_TYPES} from './overrides.js';
import {analyse} from './physics.js';
import {loadCsg} from './csg.js';
import {worldPositions, worldMesh} from './build.js';
import {WOODS, STAINS, FINISHES, STONES, METALS, COLORS, GLASS} from './catalog.js';
import {download, jpegPdf, svgToJpeg, dataUrlJpeg} from './package.js';
import {drawingSheet} from './drawing.js';
import {t} from './i18n.js';
import {autoCorrectDesign,reviewDesign} from './auto-correct.js';
import {findingText} from './review-document.js';
import {partDimensions,partDimensionsCsv} from './part-dimensions.js';

const $ = s => document.querySelector(s);
const NAMES = {top: 'Tabla', 'back-panel': 'Arka panel', apron: 'Kayıt', leg: 'Ayak', 'case-top': 'Üst tabla', 'vanity-top': 'Lavabo tezgahı', 'mirror-frame': 'Ayna arkalığı', mirror: 'Ayna camı', 'arm-post': 'Kol dikmesi',
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
  try {const saved=JSON.parse(localStorage.getItem('aura-atelier-revisions')||'{}');S.items=S.items.map(i=>{const r=saved[JSON.stringify(i.design)];return r?.design?{...i,customerOriginal:structuredClone(i.design),design:normalizeDesign(r.design),correction:r}:i;});}catch{}
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
  const shown=S.compare?(S.items[S.cur].customerOriginal||{...d,overrides:[]}):d;
  viewer?.setDesign(S.compare ? compileDesign(shown) : S.compiled, shown.materials);
  viewer?.structure(!!S.frameView);
  persistRevision();
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
function persistRevision(){
 const item=S.items[S.cur];if(!item?.customerOriginal)return;
 try{const all=JSON.parse(localStorage.getItem('aura-atelier-revisions')||'{}');all[JSON.stringify(item.customerOriginal)]={design:item.design,changes:item.correction?.changes||[],production_approved:false};localStorage.setItem('aura-atelier-revisions',JSON.stringify(all));}catch{}
}
function correctionPanel(){
 const d=design(),item=S.items[S.cur],r=reviewDesign(d),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const labels={restoreShelfSupports:'Silinen raf desteklerini geri kur',restoreGeneratedFrame:'Silinen taşıyıcıları geri kur',increaseLegSection:'Ayak kesitini örnek senaryoya göre büyüt',addTableAprons:'Ahşap masa kuşaklarını ekle'};
 return `<h2>Tasarım değerlendirme notları</h2><p class="a-note">Otomatik düzelt özgün tasarımın kopyasında uygulanır. Sonuç bir tasarımcı önerisidir; üretim onayı değildir. Ergonomi ve estetik son kararı tasarımcı verir.</p><div class="a-tools"><button data-autocorrect>Otomatik düzelt</button><button data-frameview aria-pressed="${!!S.frameView}">İskeleti göster</button>${item.customerOriginal?'<button data-original>Özgün modeli geri yükle</button>':''}</div>${item.correction?.changes?.length?`<p class="a-note">Uygulanan öneriler: ${item.correction.changes.map(k=>escape(labels[k]||k)).join(' · ')}</p>`:''}<ul class="a-checks">${r.findings.map(f=>`<li class="warn">${escape(findingText(f,'tr'))}</li>`).join('')}</ul>`;
}
function memberScenarioPanel(){
 const rows=reviewDesign(design()).construction?.bending_scenarios||[];
 if(!rows.length)return '';
 return `<details><summary>Taşıyıcı eleman örnek hesapları (${rows.length})</summary><p class="a-note">Tek eleman, basit mesnet, merkezde1000N, varsayılan E=9000MPa. Lif doğrultusu ve birleşim rijitliği doğrulanmış değildir. Bütün iskeletin analizi veya standart deney sonucu değildir.</p><ul class="a-checks">${rows.slice().sort((a,b)=>b.deflection_mm-a.deflection_mm).slice(0,8).map(r=>`<li class="warn">${r.id.replace(/[^a-z0-9_-]/gi,'')} · açıklık ${Math.round(r.span_mm)} mm · sehim ${r.deflection_mm.toFixed(2)} mm · eğilme gerilmesi ${r.bending_stress_MPa.toFixed(2)} MPa</li>`).join('')}</ul></details>`;
}

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
  return `<div class="a-tools"><button data-multi aria-pressed="${S.multiOn}">Çoklu seçim</button><button data-snap aria-pressed="${S.snap}">Yakalama 5 mm / 5°</button></div>${S.multiOn ? arrangePanel(null) : ''}${jointPanel()}<h2>Seçili parça</h2>${q ? `<p class="a-note"><b>${NAMES[q.role] || q.role}</b> · ${q.id}${q.added ? ' · eklenen' : ''}</p>
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
// ---- Joints between two touching parts (EKSIKLER #6), from the sourced table knowledge/atolye/veri/birlesim.json ----
// Only sourced sizes are used: dowel Ø/length (Hettich), DOMINO thickness/length (Festool), confirmat 5/7/10 (Häfele).
// Depths the table leaves open (mortise/tenon) are entered by the designer; connector depth = length / 2 per side.
const JOINTS = {
  dowel6: {tr: 'Kavela Ø6×35', kind: 'hole', dia: 6, len: 35}, dowel8: {tr: 'Kavela Ø8×40', kind: 'hole', dia: 8, len: 40},
  domino5: {tr: 'DOMINO 5×30', kind: 'slot', t: 5, len: 30, w: 18.8}, domino6: {tr: 'DOMINO 6×40', kind: 'slot', t: 6, len: 40, w: 20}, domino8: {tr: 'DOMINO 8×40', kind: 'slot', t: 8, len: 40, w: 22}, domino10: {tr: 'DOMINO 10×50', kind: 'slot', t: 10, len: 50, w: 23.9},
  confirmat: {tr: 'Konfirmat 7×50', kind: 'confirmat', len: 50},
  mortise: {tr: 'Kör zıvana (kalınlık T/3)', kind: 'mortise'}
};
const rotM = ([x, y, z]) => { const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  return [[cy * cz, -cy * sz, sy], [cx * sz + sx * sy * cz, cx * cz - sx * sy * sz, -sx * cy], [sx * sz - cx * sy * cz, sx * cz + cx * sy * sz, cx * cy]]; }; // three.js Euler XYZ
const toLocal = (q, w) => { const R = rotM(q.rot), d = w.map((v, i) => v - q.pos[i]); return [0, 1, 2].map(j => R[0][j] * d[0] + R[1][j] * d[1] + R[2][j] * d[2]); };
const dirLocal = (q, v) => { const R = rotM(q.rot); return [0, 1, 2].map(j => R[0][j] * v[0] + R[1][j] * v[1] + R[2][j] * v[2]); };
function addJoint(key, count, depthIn) {
  const [ia, ib] = S.multi.slice(-2), A = partOf(ia), B = partOf(ib), ba = worldBox(ia), bb = worldBox(ib); if (!A || !B) return 'İki parça seçin.';
  const ov = [0, 1, 2].map(k => Math.min(ba.hi[k], bb.hi[k]) - Math.max(ba.lo[k], bb.lo[k]));
  if (ov.some(v => v < -3)) return 'Parçalar birbirine değmiyor.';
  const ax = ov.indexOf(Math.min(...ov)), lo = [0, 1, 2].map(k => Math.max(ba.lo[k], bb.lo[k])), hi = [0, 1, 2].map(k => Math.min(ba.hi[k], bb.hi[k]));
  const face = [0, 1, 2].map(k => (lo[k] + hi[k]) / 2), along = [0, 1, 2].filter(k => k !== ax).sort((a, b) => (hi[b] - lo[b]) - (hi[a] - lo[a]))[0];
  const J = JOINTS[key], n = Math.max(1, Math.min(12, count || Math.max(2, Math.round((hi[along] - lo[along]) / 160)))), span = hi[along] - lo[along];
  const pts = Array.from({length: n}, (_, i) => { const p = face.slice(); p[along] = n === 1 ? face[along] : lo[along] + span * (0.15 + 0.7 * i / (n - 1)); return p; });
  const sgnA = Math.sign(bb.c[ax] - ba.c[ax]) || 1, list = ovs(), add = (q, sg, mk) => {
    const n3 = [0, 0, 0]; n3[ax] = sg; const nl = dirLocal(q, n3), lax = [0, 1, 2].reduce((m, i) => Math.abs(nl[i]) > Math.abs(nl[m]) ? i : m, 0), dirAlong = [0, 0, 0]; dirAlong[along] = 1;
    const al = dirLocal(q, dirAlong), turn = Math.abs(al[lax === 0 ? 1 : 0]) > Math.abs(al[lax === 2 ? 1 : 2]) ? 0 : 90;
    const ops = pts.map(p => ({...mk(), at: toLocal(q, p).map(v => Math.round(v * 10) / 10), axis: lax, sign: nl[lax] < 0 ? -1 : 1, dir: turn, label: J.tr}));
    const prev = list.filter(o => o.tool === 'cut' && o.id === q.id).at(-1)?.ops || [];
    return {tool: 'cut', id: q.id, ops: [...prev, ...ops]};
  };
  let mkA, mkB;
  if (J.kind === 'hole') { mkA = mkB = () => ({type: 'hole', dia: J.dia, depth: J.len / 2 + 1}); }
  else if (J.kind === 'slot') { mkA = mkB = () => ({type: 'slot', a: J.w, b: J.t, depth: J.len / 2 + 1}); }
  else if (J.kind === 'confirmat') { mkA = () => ({type: 'hole', dia: 7, depth: 0}); mkB = () => ({type: 'hole', dia: 5, depth: J.len - 10}); }
  else { // mortise in B, tenon thickness T/3 of A's thickness along the joint axis' smaller section; depth from the designer
    if (!(depthIn > 0)) return 'Zıvana derinliğini girin (kaynak tabloda derinlik yok).';
    const tA = Math.min(...[0, 1, 2].filter(k => k !== ax).map(k => ba.hi[k] - ba.lo[k])), t = Math.round(tA / 3), w = Math.round(Math.min(span * 0.8, Math.max(...[0, 1, 2].filter(k => k !== ax).map(k => ba.hi[k] - ba.lo[k])) * 0.8));
    pts.splice(0, pts.length, face); mkA = null; mkB = () => ({type: 'pocket', a: w, b: t, depth: depthIn});
  }
  const next = list.filter(o => !(o.tool === 'cut' && (o.id === A.id || o.id === B.id)));
  if (mkA) next.push(add(A, sgnA, mkA)); else { const pa = list.filter(o => o.tool === 'cut' && o.id === A.id).at(-1); if (pa) next.push(pa); }
  next.push(add(B, -sgnA, mkB)); commit(next); return `${J.tr}: ${pts.length} adet eklendi.`;
}
// ---- Auto-join: close small gaps between parts that face each other (stretch the smaller part to touch) ----
const SKIP_JOIN = /stitch|welt|inlay|line|pull|knob|handle|hinge|grommet|drain|tap|led|dugme/;
function autoJoin(maxGap = 40) {
  // Faces are measured on the real meshes, at the bottom and top of the part: a tapered leg gives an angled end.
  const ps = S.compiled.parts.filter(q => !SKIP_JOIN.test(q.role)).map(q => ({q, b: worldBox(q.id), straight: q.rot.every(v => Math.abs(v) < 1e-3)})).filter(x => x.b && [0, 1, 2].every(k => x.b.hi[k] - x.b.lo[k] >= 6));
  const vol = b => [0, 1, 2].reduce((m, k) => m * (b.hi[k] - b.lo[k]), 1), plans = new Map(), P = new Map();
  const mesh = q => P.get(q.id) || (P.set(q.id, worldMesh(q)), P.get(q.id));
  for (const A of ps) for (const B of ps) { if (A === B || !A.straight) continue; // A grows when B covers A's height (a leg beside a panel), whatever their sizes
    if (A.q.role === B.q.role || [A, B].some(x => x.q.mat === 'fabric' || /front|door|drawer|cushion|pillow|mattress/.test(x.q.role))) continue;
    for (let k = 0; k < 3; k++) for (const dir of [1, -1]) {
      const gap = dir > 0 ? B.b.lo[k] - A.b.hi[k] : A.b.lo[k] - B.b.hi[k]; if (!(gap > -60 && gap <= maxGap)) continue;
      const others = [0, 1, 2].filter(x => x !== k); // j = the longer in-plane axis of A (height of a panel), m = its thickness
      const [j, m] = others.sort((x, y) => (A.b.hi[y] - A.b.lo[y]) - (A.b.hi[x] - A.b.lo[x]));
      const ovj = Math.min(A.b.hi[j], B.b.hi[j]) - Math.max(A.b.lo[j], B.b.lo[j]), ovm = Math.min(A.b.hi[m], B.b.hi[m]) - Math.max(A.b.lo[m], B.b.lo[m]);
      if (ovj < 0.6 * (A.b.hi[j] - A.b.lo[j]) || ovm < 0.5 * (A.b.hi[m] - A.b.lo[m])) continue;
      const edgeA = dir > 0 ? A.b.hi[k] : A.b.lo[k], {P: V, I} = mesh(B.q);
      const mc = (A.b.lo[m] + A.b.hi[m]) / 2;
      const face = yj => { let best = null; // B's surface on the line {height yj, mid-thickness of A}: plane cut of each triangle, then the cut segment at mc
        const cross = (a, c, out) => { const ya = V[a * 3 + j], yc = V[c * 3 + j]; if ((ya - yj) * (yc - yj) > 0 || ya === yc) return; const t = (yj - ya) / (yc - ya);
          out.push([V[a * 3 + k] + t * (V[c * 3 + k] - V[a * 3 + k]), V[a * 3 + m] + t * (V[c * 3 + m] - V[a * 3 + m])]); };
        for (let i = 0; i < I.length; i += 3) { const pts = []; cross(I[i], I[i + 1], pts); cross(I[i + 1], I[i + 2], pts); cross(I[i + 2], I[i], pts); if (pts.length < 2) continue;
          const [p0, p1] = pts; if ((p0[1] - mc) * (p1[1] - mc) > 0) continue; const x = p0[1] === p1[1] ? Math.min(p0[0], p1[0]) : p0[0] + (mc - p0[1]) / (p1[1] - p0[1]) * (p1[0] - p0[0]);
          if (dir > 0 ? x < edgeA - 80 : x > edgeA + 80) continue; best = best === null ? x : dir > 0 ? Math.min(best, x) : Math.max(best, x); }
        return best; };
      const sp = A.b.hi[j] - A.b.lo[j]; let g0 = face(A.b.lo[j] + 0.1 * sp), g1 = face(A.b.hi[j] - 0.1 * sp); // inside the ends (a tenon or cap there is not the face)
      if (g0 === null && g1 === null) continue; g0 ??= g1; g1 ??= g0;
      const f0 = g0 - (g1 - g0) * 0.125, f1 = g1 + (g1 - g0) * 0.125; // extend the line to the part's own ends
      const e0 = Math.max(0, dir * (f0 - edgeA)), e1 = Math.max(0, dir * (f1 - edgeA)); // only grows: a part already housed in the leg stays
      if (Math.max(e0, e1) < 0.5 || Math.max(e0, e1) > maxGap) continue;
      const pl = plans.get(A.q.id) || {k, j, neg: [0, 0], pos: [0, 0], names: new Set()}; if (pl.k !== k || pl.j !== j) continue;
      pl[dir > 0 ? 'pos' : 'neg'] = [e0, e1].map(v => Math.round(v * 10) / 10); pl.names.add(NAMES[B.q.role] || B.q.role); plans.set(A.q.id, pl);
    } }
  if (!plans.size) return 'Kapatılacak boşluk bulunmadı.';
  let list = ovs();
  for (const [id, pl] of plans) {
    const t = structuredClone(list.filter(o => o.tool === 'transform' && o.id === id).at(-1) || {tool: 'transform', id, move: [0, 0, 0], rot: [0, 0, 0], scale: [1, 1, 1]});
    const prev = t.ends && t.ends.k === pl.k && t.ends.j === pl.j ? t.ends : {neg: [0, 0], pos: [0, 0]};
    t.ends = {k: pl.k, j: pl.j, neg: prev.neg.map((v, i) => v + pl.neg[i]), pos: prev.pos.map((v, i) => v + pl.pos[i])};
    list = [...list.filter(o => !(o.tool === 'transform' && o.id === id)), t];
  }
  commit(list); return `${plans.size} parça komşusunun yüzeyine oturtuldu: ${[...plans.keys()].map(id => NAMES[partOf(id)?.role] || id).join(', ')}. Konik yüzeylerde uç açılı uzar. Geri almak için “Yapı geri”.`;
}
function jointPanel() {
  if (!S.multiOn || S.multi.length < 2) return `<h2>Birleşim · zıvana, kavela, DOMINO</h2><div class="a-tools"><button data-autojoin>Otomatik birleştir (40 mm'ye kadar boşluklar)</button></div>${S.jmsg ? `<p class="a-note"><b>${S.jmsg}</b></p>` : ''}<p class="a-note">1) ${S.multiOn ? '<b>Çoklu seçim açık.</b>' : '<button data-multi aria-pressed="false">Çoklu seçimi aç</button>'} 2) Modelde birbirine değen iki parçaya sırayla tıklayın (${S.multi.length}/2 seçili). 3) Burada türü seçip “Birleşimi ekle”ye basın. Zıvana ikinci parçaya açılır.</p>`;
  return `<h2>Birleşim (son iki parça)</h2><div class="a-grid a-grid2"><span>Tür</span><select id="jType">${Object.entries(JOINTS).map(([k, j]) => `<option value="${k}">${j.tr}</option>`).join('')}</select>
    <span>Adet (0 = otomatik)</span><input id="jCount" type="number" value="0" inputmode="numeric"><span>Zıvana derinliği mm</span><input id="jDepth" type="number" value="" placeholder="yalnız zıvana" inputmode="numeric"></div>
    <div class="a-tools"><button data-joint>Birleşimi ekle</button></div><p class="a-note" id="jOut">${S.jmsg ? `<b>${S.jmsg}</b><br>` : ''}Ölçüler: Hettich kavela, Festool DOMINO, Häfele konfirmat kayıtları (birlesim.json). Mukavemet onayı değildir.</p>`;
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
    const dims = (turned || (Array.isArray(q.cut) && q.geom.fn !== 'ends' ? q.cut.slice() : hi.map((v, k) => Math.round(v - lo[k])))).sort((a, b) => b - a);
    const ops = (q.cuts || []).map(c => c.label ? `${c.label}` : c.type === 'hole' ? `delik Ø${c.dia}${c.depth ? ' d' + c.depth : ''}` : `${c.type} ${c.a}×${c.b}${c.depth ? ' d' + c.depth : ''}${c.count > 1 ? ' ×' + c.count : ''}`).join('; ');
    const sw = g.fn === 'sweep' ? g : g.fn === 'clipped' && g.inner?.fn === 'sweep' ? g.inner : null;
    let bent = '';
    if (q.geom.fn === 'ends') { const e = q.geom, side = (a, n) => a[0] || a[1] ? `${n} uç alt +${a[0]} / üst +${a[1]} mm` : ''; bent = `açılı uç (konik ayağa göre): ${[side(e.neg, 'sol'), side(e.pos, 'sağ')].filter(Boolean).join(', ')}; boy en geniş yerden verildi`; }
    if (sw && sw.bow) { // bent member: blank length along the curve (arc ≈ L(1 + 8/3·(f/L)²); sabre ≈ same with f the foot offset)
      const L0 = sw.L, f0 = Math.abs(sw.bow), arc = Math.round(L0 * (1 + 8 / 3 * (f0 / L0) ** 2) + 30), R = Math.round((L0 * L0 / 4 + f0 * f0) / (2 * f0));
      bent = `bükülmüş: ham boy ~${arc} mm, yarıçap ~${R} mm — ${/wood|veneer/.test(q.matSpec?.surface || 'wood') ? (R < 600 ? 'lamine (ince katman) ya da masiften CNC kesim' : 'buharla bükme ya da lamine') : 'metal bükme'}`;
      dims[0] = Math.max(dims[0], arc);
    }
    rows.push([NAMES[q.role] || q.role, q.id, matName(q), ...dims.slice(0, 3), q.grain || 'boyuna', ops, [q.added ? 'eklenen' : '', q.shaped ? 'biçimli (CNC)' : '', bent].filter(Boolean).join(' · ')]);
  }
  return '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
}

// ---- Panel ------------------------------------------------------------------------------------------------------
function renderPanel() {
  const d = design(), p = $('#panel');
  if (!d) { p.innerHTML = '<p class="a-note">Tasarım bulunamadı. Müşterinin bağlantısını yapıştırın.</p>'; return; }
  const parts = editableParts(S.compiled);
  p.innerHTML = correctionPanel()+structurePanel() + `<h2>Parça biçimi</h2><div class="a-parts">${parts.map(t => `<button data-part="${t.key}" aria-pressed="${S.target?.key === t.key}">${nameOf(t)}${(d.overrides || []).some(o => (o.id && 'id:' + o.id === t.key) || (o.role && 'role:' + o.role === t.key && o.tool === 'profile')) ? ' ✎' : ''}</button>`).join('') || '<span class="a-note">Bu üründe biçimlendirilebilir parça yok.</span>'}</div>
  ${S.target ? `<h2>${nameOf(S.target)}</h2>
  <div class="a-tools">${S.target.tool === 'silhouette' ? `<button data-sym aria-pressed="${S.sym}">Simetri</button><button data-preset="soft">Yumuşak köşe</button><button data-preset="oval">Oval</button><button data-preset="boat">Tekne</button><button data-preset="bow">İçbükey kenar</button>`
    : `<button data-preset="taper">Konik</button><button data-preset="swell">Şişkin</button><button data-preset="spindle">Torna halkalı</button>`}</div>
  <svg id="editor"></svg>
  <div class="a-tools"><button data-undo>↶ Geri</button><button data-redo>↷ İleri</button><button data-del>Noktayı sil</button><button data-zoom="0.85">+</button><button data-zoom="1.18">−</button><button data-fit>Sığdır</button><button data-reset>Özgün biçim</button></div>
  <p class="a-note">Noktayı sürükleyin; eğriye dokunarak nokta ekleyin; noktaya uzun basarak silin. İki parmakla yakınlaştırın. Kesik çizgi özgün biçimdir.</p>` : '<p class="a-note">Biçimlendirmek için bir parça seçin.</p>'}
  ${versionPanel()}
  <h2>Fizik ve üretim</h2><ul class="a-checks" id="checks"></ul>
  <h2>Teslim</h2><div class="a-acts"><button class="f-primary" data-act="prod">Üretime gönder →</button><button data-act="link">Bağlantıyı kopyala</button><button data-act="dxf">CNC (DXF) ↓</button><button data-act="pdf">Sunum PDF ↓</button><button data-act="glb">3B model (GLB) ↓</button><button data-act="stl">STL (3B yazıcı) ↓</button><button data-act="cut">Kesim listesi ↓</button><button data-act="dimensions">Parça ölçüleri (mm) ↓</button><button data-act="json">design.json ↓</button></div>
  <input id="linkOut" readonly hidden>`;
  if (S.target) { drawEditor(); bindEditor(); renderToolState(); }
  renderChecks();
  $('#checks')?.insertAdjacentHTML('afterend',memberScenarioPanel());
}
function renderToolState() {
  const q = s => $(s); if (!q('[data-undo]')) return;
  q('[data-undo]').disabled = !S.undo.length; q('[data-redo]').disabled = !S.redo.length; q('[data-del]').disabled = S.sel < 0; q('[data-reset]').disabled = !S.pts;
}
function renderChecks() {
  const el = $('#checks'); if (!el || !S.compiled) return;
  const r = analyse(S.compiled, design().materials, design().family);
  el.innerHTML = '<li class="warn">Aşağıdakiler varsayımlı hesap sonuçlarıdır; bağlantı, malzeme ve bütün ürün testleri tamamlanmadan üretim onayı sayılmaz.</li>'+r.checks.filter(c=>!c.tr.includes('denetimleri geçti')).map(c => `<li class="${c.level==='error'?'error':'warn'}">Örnek senaryo: ${c.tr}</li>`).join('') + `<li class="warn">Malzeme/boşluk varsayımlarıyla tahmini ağırlık ~${r.mass} kg</li>`;
}

$('#panel').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if(b.hasAttribute('data-frameview')){S.frameView=!S.frameView;rebuild();renderPanel();return;}
  if(b.hasAttribute('data-autocorrect')){
   const item=S.items[S.cur],r=autoCorrectDesign(design());item.customerOriginal ||= structuredClone(design());item.design=r.design;item.correction={...r,original:structuredClone(item.customerOriginal),changes:[...new Set([...(item.correction?.changes||[]),...r.changes])]};
   S.compare=false;S.target=null;S.part=null;S.frameView=true;rebuild();renderItems();renderPanel();return;
  }
  if(b.hasAttribute('data-original')){
   const item=S.items[S.cur];if(item.customerOriginal){item.design=structuredClone(item.customerOriginal);item.correction=null;S.compare=false;S.target=null;S.part=null;rebuild();renderItems();renderPanel();}return;
  }
  if (b.dataset.mode) { S.mode = b.dataset.mode; renderPanel(); syncViewerSel(); return; }
  if (b.dataset.shape) { const t = editableParts(S.compiled).find(x => x.key === b.dataset.shape); S.view = null; pickTarget(t); return; }
  if (b.hasAttribute('data-dup')) return duplicatePart(false);
  if (b.hasAttribute('data-mirror')) return duplicatePart(true);
  if (b.hasAttribute('data-delpart')) return deletePart();
  if (b.hasAttribute('data-tfreset')) return commit(ovs().filter(o => !(o.tool === 'transform' && o.id === S.part)));
  if (b.hasAttribute('data-add')) return addPart();
  if (b.hasAttribute('data-joint')) { const msg = addJoint($('#jType').value, +$('#jCount').value, +$('#jDepth').value); S.jmsg = msg; renderPanel(); return; }
  if (b.hasAttribute('data-compare')) { S.compare = !S.compare; rebuild(); renderPanel(); return; }
  if (b.dataset.restore !== undefined) { const v = versions()[+b.dataset.restore]; if (v) commit(v.ov.slice(), false); return; }
  if (b.hasAttribute('data-share')) {
    const d = design(), h = await contentHash(d), link = await designLink(d, 'tr'), url = link.replace(/tasarla\.html/, 'tasarla.html') + `&onay=${h}`;
    $('#shareOut').innerHTML = `Bağlantı kopyalandı. Onay kodu <b>${h}</b> — müşteri bu tasarımı açınca aynı kodu görür; onay bu koda bağlıdır.`; try { await navigator.clipboard.writeText(url); } catch {} saveVersion('müşteriye gönderildi ' + h); return;
  }
  if (b.hasAttribute('data-matoff')) return commit(ovs().filter(o => !(o.tool === 'material' && o.id === S.part)));
  if (b.hasAttribute('data-autojoin')) { S.jmsg = autoJoin(); renderPanel(); return; }
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
  if (act === 'glb' && viewer) { const data = await viewer.exportGLB(); download(`AURA-${design().kind}.glb`, new Uint8Array(data), 'model/gltf-binary'); }
  if (act === 'pdf' && viewer) { // photo + dimensioned drawing sheet with the design link: opens on any phone or PC
    b.disabled = true; try {
      const T = k => t(k, 'tr'), lab = {front: T('frontView'), side: T('sideView'), top: T('topView'), section: T('sectionView'), scale: T('scaleLabel'), units: T('units'), title: T(design().kind), note: T('concept'), seatDepth: T('seatDepth'), rake: T('rake'), status: T('status'), spec: T('spec'), knee: T('knee'), edgeDetail: T('edgeDetail'), mattressTop: T('mattressTop'), link: T('designLink')};
      const sheet = drawingSheet(S.compiled, lab, {title: `AURA · ${T(design().kind)}`}), photo = await dataUrlJpeg(await viewer.photo(2, {width: 1800, height: 1200, samples: 24}));
      download(`AURA-${design().kind}-sunum.pdf`, jpegPdf([photo, {...await svgToJpeg(sheet.svg), link: {url: link, rect: [12 / 420, (297 - 18) / 297, 0.62, (297 - 11) / 297]}}]), 'application/pdf');
    } finally { b.disabled = false; }
  }
  if (act === 'cut') download(`AURA-${design().kind}-kesim-listesi.csv`, cutList(), 'text/csv');
  if (act === 'dimensions') download(`AURA-${design().kind}-parca-olculeri.csv`,partDimensionsCsv(partDimensions(S.compiled)), 'text/csv');
  if (act === 'json') download(`AURA-${design().kind}-design.json`, JSON.stringify({...design(),dimensions:partDimensions(S.compiled)}, null, 2), 'application/json');
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
window.__atelier = {S, pickPart}; // test hook
load(location.hash);
