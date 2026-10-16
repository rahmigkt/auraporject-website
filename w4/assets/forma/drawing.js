// Technical drawings generated from the same meshes as the 3D view.
// Views: front, right side, top and a vertical section through the left seat. Hidden lines are removed by
// painting part silhouettes far→near. Output is an A3 landscape SVG at a true printable scale (paper mm).
import {worldPositions, buildMesh} from './sofa.js';
import {transformPositions} from './mesh.js';

const RES = 2; // mm per raster cell for silhouette extraction

/** Projection for a view: returns [h, v, depth] for a world point (mm). */
const PROJ = {
  front: (x, y, z) => [x, y, z],
  side: (x, y, z) => [-z, y, x],
  top: (x, y, z) => [x, -z, y]
};

/** Silhouette loops of a part in a view (paper-independent, mm). */
function silhouette(part, view) {
  const pos = worldPositions(part), idx = buildMesh(part).indices, P = PROJ[view];
  const n = pos.length / 3, h = new Float32Array(n), v = new Float32Array(n);
  let minH = Infinity, maxH = -Infinity, minV = Infinity, maxV = -Infinity, depth = 0, dmin = Infinity;
  for (let i = 0; i < n; i++) {
    const [a, b, d] = P(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); h[i] = a; v[i] = b; depth += d; dmin = Math.min(dmin, d);
    minH = Math.min(minH, a); maxH = Math.max(maxH, a); minV = Math.min(minV, b); maxV = Math.max(maxV, b);
  }
  const W = Math.ceil((maxH - minH) / RES) + 3, H = Math.ceil((maxV - minV) / RES) + 3, grid = new Uint8Array(W * H);
  const gx = a => (a - minH) / RES + 1, gy = b => (b - minV) / RES + 1;
  for (let t = 0; t < idx.length; t += 3) {
    const ax = gx(h[idx[t]]), ay = gy(v[idx[t]]), bx = gx(h[idx[t + 1]]), by = gy(v[idx[t + 1]]), cx = gx(h[idx[t + 2]]), cy = gy(v[idx[t + 2]]);
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) / area, w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) / area;
      if (w0 >= -0.02 && w1 >= -0.02 && 1 - w0 - w1 >= -0.02) grid[y * W + x] = 1;
    }
  }
  const loops = contours(grid, W, H).map(loop => simplify(loop, 0.7).map(([x, y]) => [minH + (x - 1) * RES, minV + (y - 1) * RES]));
  return {loops, depth: depth / n, dmin, box: [minH, minV, maxH, maxV]};
}

/** Marching squares → closed loops (grid coordinates). */
function contours(grid, W, H) {
  const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? grid[y * W + x] : 0);
  const segs = new Map(), key = (x, y) => `${x},${y}`;
  const add = (a, b) => { segs.set(key(...a), b); };
  for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
    const c = at(x, y) | at(x + 1, y) << 1 | at(x + 1, y + 1) << 2 | at(x, y + 1) << 3;
    const T = [x + 1, y + 0.5], R = [x + 1.5, y + 1], B = [x + 1, y + 1.5], L = [x + 0.5, y + 1];
    // Oriented segments with the filled region on the left.
    switch (c) {
      case 1: add(L, T); break; case 2: add(T, R); break; case 3: add(L, R); break; case 4: add(R, B); break;
      case 5: add(L, B); add(R, T); break; case 6: add(T, B); break; case 7: add(L, B); break; case 8: add(B, L); break;
      case 9: add(B, T); break; case 10: add(T, L); add(B, R); break; case 11: add(B, R); break; case 12: add(R, L); break;
      case 13: add(R, T); break; case 14: add(T, L); break;
    }
  }
  const loops = [];
  for (const start of [...segs.keys()]) {
    if (!segs.has(start)) continue;
    const loop = []; let k = start;
    while (segs.has(k)) { const nxt = segs.get(k); segs.delete(k); loop.push(k.split(',').map(Number)); k = key(...nxt); }
    if (loop.length > 3) loops.push(loop);
  }
  return loops;
}

function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > max) { max = d; idx = i; } }
    if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Section through plane x = xCut, seen like the side view. Returns cut loops per part. */
function section(part, xCut) {
  const pos = worldPositions(part), idx = buildMesh(part).indices, segs = [];
  for (let t = 0; t < idx.length; t += 3) {
    const pts = [idx[t], idx[t + 1], idx[t + 2]].map(i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]), hits = [];
    for (let k = 0; k < 3; k++) {
      const a = pts[k], b = pts[(k + 1) % 3], da = a[0] - xCut, db = b[0] - xCut;
      if ((da < 0) !== (db < 0)) { const s = da / (da - db); hits.push([-(a[2] + (b[2] - a[2]) * s), a[1] + (b[1] - a[1]) * s]); }
    }
    if (hits.length === 2) segs.push(hits);
  }
  if (!segs.length) return [];
  // Chain segments by nearest endpoints (tolerance 0.5 mm).
  const k = p => `${Math.round(p[0] * 2)},${Math.round(p[1] * 2)}`, adj = new Map();
  for (const [a, b] of segs) { for (const [p, q] of [[a, b], [b, a]]) { const kk = k(p); if (!adj.has(kk)) adj.set(kk, []); adj.get(kk).push([p, q]); } }
  const used = new Set(), loops = [];
  for (const [a, b] of segs) {
    const id = k(a) + '|' + k(b); if (used.has(id)) continue;
    const loop = [a]; let cur = b, prev = a; used.add(id); used.add(k(b) + '|' + k(a));
    for (let guard = 0; guard < 20000; guard++) {
      loop.push(cur); const next = (adj.get(k(cur)) || []).find(([, q]) => !used.has(k(cur) + '|' + k(q)));
      if (!next) break; used.add(k(cur) + '|' + k(next[1])); used.add(k(next[1]) + '|' + k(cur)); prev = cur; cur = next[1];
      if (k(cur) === k(a)) break;
    }
    if (loop.length > 3) loops.push(simplify(loop, 0.4));
  }
  return loops;
}

const FILL = {fabric: '#f3efe7', welt: '#e8e1d4', wood: '#efe3cf', metal: '#e4e4e2', dark: '#d9d6d0', frame: '#f6ecda'};

/**
 * Build all views. Returns {views:{front,side,top,section}, extents, xCut}. Coordinates in mm (model space).
 */
export function buildViews(compiled) {
  const visible = compiled.parts.filter(p => !p.internal);
  const views = {};
  for (const view of ['front', 'side', 'top']) {
    views[view] = visible.map(p => ({id: p.id, mat: p.mat, ...silhouette(p, view)})).sort((a, b) => a.depth - b.depth);
  }
  const m = compiled.meta, seatW = m.seatWidthEach;
  const xCut = Math.round(-m.innerWidth / 2 + seatW / 2);
  views.sideBehind = views.side.filter(s => s.dmin < xCut);
  views.section = compiled.parts.map(p => ({id: p.id, mat: p.mat, internal: !!p.internal, loops: section(p, xCut)})).filter(s => s.loops.length);
  return {views, xCut};
}

// ---- SVG sheet ------------------------------------------------------------------
const SCALES = [5, 10, 15, 20, 25, 30];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/**
 * A3 landscape sheet. labels: translated strings {front, side, top, section, scale, units, title, note, ...}.
 */
export function drawingSheet(compiled, labels, info = {}) {
  const {views, xCut} = buildViews(compiled), m = compiled.meta, p = compiled.params;
  const Wm = m.overall.width, Dm = m.overall.depth, Hm = m.overall.height;
  // Layout in model mm: [front | side] on top row, [top | section] bottom row.
  const scale = SCALES.find(s => (Wm + Dm) / s <= 300 && (Hm + Math.max(Dm, Hm)) / s <= 190) || 40;
  const k = 1 / scale, sheetW = 420, sheetH = 297, margin = 12;
  const cell = {front: [margin + 22, margin + 18], side: [margin + 22 + Wm * k + 40, margin + 18], top: [margin + 22, margin + 18 + Hm * k + 34], section: [margin + 22 + Wm * k + 40, margin + 18 + Hm * k + 34]};
  const out = [];
  const T = (view, [h, v], extent) => {
    const [ox, oy] = cell[view];
    if (view === 'front') return [ox + (h + Wm / 2) * k, oy + (extent - v) * k];
    if (view === 'side' || view === 'section') return [ox + (h + Dm / 2) * k, oy + (extent - v) * k];
    return [ox + (h + Wm / 2) * k, oy + (Dm / 2 - v) * k];
  };
  const path = (view, loops, extent) => loops.map(l => 'M' + l.map(pt => T(view, pt, extent).map(n => n.toFixed(2)).join(' ')).join('L') + 'Z').join('');
  const drawView = (view, list, extent) => {
    for (const s of list) out.push(`<path d="${path(view, s.loops, extent)}" fill="${FILL[s.mat] || '#fff'}" fill-rule="evenodd" stroke="#1f2420" stroke-width="0.25" stroke-linejoin="round"/>`);
  };
  out.push(`<g class="views">`);
  drawView('front', views.front, Hm); drawView('side', views.side, Hm); drawView('top', views.top, 0);
  // Section: everything beyond the cut in light line, then cut faces hatched.
  for (const s of views.sideBehind) out.push(`<path d="${path('section', s.loops, Hm)}" fill="#fbfaf7" stroke="#9aa096" stroke-width="0.15"/>`);
  for (const s of views.section) out.push(`<path d="${path('section', s.loops, Hm)}" fill="url(#${s.internal ? 'hatchWood' : s.mat === 'wood' ? 'hatchWood' : 'hatchFoam'})" fill-rule="evenodd" stroke="#1f2420" stroke-width="0.35"/>`);
  out.push(`</g>`);
  // Ground lines
  for (const v of ['front', 'side', 'section']) { const [x0, y0] = T(v, [v === 'front' ? -Wm / 2 - 60 : -Dm / 2 - 60, 0], Hm), [x1] = T(v, [v === 'front' ? Wm / 2 + 60 : Dm / 2 + 60, 0], Hm); out.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#1f2420" stroke-width="0.35"/>`); }
  // Dimensions
  const dim = (view, a, b, off, text, extent, orient) => {
    let [x1, y1] = T(view, a, extent), [x2, y2] = T(view, b, extent);
    const o = off * k;
    if (orient === 'h') { const y = Math.max(y1, y2) + o; out.push(dline(x1, y, x2, y, text, 'h', y1, y2)); }
    else { const x = Math.max(x1, x2) + o; out.push(dline(x, y1, x, y2, text, 'v', x1, x2)); }
  };
  const ext = 1.5;
  function dline(x1, y1, x2, y2, text, o, e1, e2) {
    const t = 1.2, s = [`<g class="dim" stroke="#3c5a46" stroke-width="0.18" fill="#3c5a46">`];
    if (o === 'h') {
      s.push(`<line x1="${x1}" y1="${e1 + 1}" x2="${x1}" y2="${y1 + ext}"/><line x1="${x2}" y1="${e2 + 1}" x2="${x2}" y2="${y2 + ext}"/>`);
      s.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line x1="${x1 - t}" y1="${y1 + t}" x2="${x1 + t}" y2="${y1 - t}" stroke-width="0.3"/><line x1="${x2 - t}" y1="${y2 + t}" x2="${x2 + t}" y2="${y2 - t}" stroke-width="0.3"/>`);
      s.push(`<text x="${(x1 + x2) / 2}" y="${y1 - 0.9}" text-anchor="middle" stroke="none" font-size="2.6">${esc(text)}</text>`);
    } else {
      s.push(`<line x1="${e1 + 1}" y1="${y1}" x2="${x1 + ext}" y2="${y1}"/><line x1="${e2 + 1}" y1="${y2}" x2="${x2 + ext}" y2="${y2}"/>`);
      s.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line x1="${x1 - t}" y1="${y1 + t}" x2="${x1 + t}" y2="${y1 - t}" stroke-width="0.3"/><line x1="${x2 - t}" y1="${y2 + t}" x2="${x2 + t}" y2="${y2 - t}" stroke-width="0.3"/>`);
      s.push(`<text x="${x1 + 1.2}" y="${(y1 + y2) / 2}" stroke="none" font-size="2.6" transform="rotate(-90 ${x1 + 1.2} ${(y1 + y2) / 2})" text-anchor="middle">${esc(text)}</text>`);
    }
    s.push('</g>'); return s.join('');
  }
  const hasArms = p.armType !== 'none';
  dim('front', [-Wm / 2, 0], [Wm / 2, 0], 70, `${Wm}`, Hm, 'h');
  dim('front', [Wm / 2, 0], [Wm / 2, Hm], 80, `${Hm}`, Hm, 'v');
  if (hasArms) dim('front', [Wm / 2, 0], [Wm / 2, p.armHeight], 30, `${p.armHeight}`, Hm, 'v');
  if (p.legHeight > 0 && p.baseType !== 'skirt') dim('front', [-Wm / 2 + p.legInset, 0], [-Wm / 2 + p.legInset, p.legHeight], -p.legInset - 140, `${p.legHeight}`, Hm, 'v');
  dim('side', [-Dm / 2, 0], [Dm / 2, 0], 70, `${Dm}`, Hm, 'h');
  dim('side', [Dm / 2, 0], [Dm / 2, p.seatHeight], 40, `${p.seatHeight}`, Hm, 'v');
  dim('side', [Dm / 2, 0], [Dm / 2, Hm], 110, `${Hm}`, Hm, 'v');
  dim('top', [-Wm / 2, -Dm / 2], [Wm / 2, -Dm / 2], 60, `${Wm}`, 0, 'h');
  dim('top', [Wm / 2, -Dm / 2], [Wm / 2, Dm / 2], 60, `${Dm}`, 0, 'v');
  if (hasArms) dim('top', [-m.innerWidth / 2, Dm / 2], [m.innerWidth / 2, Dm / 2], -60, `${m.innerWidth}`, 0, 'h');
  dim('section', [-(Dm / 2 + 12), 0], [-(Dm / 2 + 12) + m.seatDepth, 0], 70, `${labels.seatDepth} ${m.seatDepth}`, Hm, 'h');
  dim('section', [Dm / 2, 0], [Dm / 2, m.deckTop], 40, `${m.deckTop}`, Hm, 'v');
  // View titles and section marker on the front view.
  const title = (view, text, extent) => { const [x, y] = cell[view]; out.push(`<text x="${x}" y="${y - 6}" font-size="3.4" font-weight="600" fill="#1f2420">${esc(text)}</text>`); };
  title('front', labels.front); title('side', labels.side); title('top', labels.top); title('section', `${labels.section} A–A`);
  { const [x, y0] = T('front', [xCut, Hm + 60], Hm), [, y1] = T('front', [xCut, -60], Hm); out.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#a24a2a" stroke-width="0.3" stroke-dasharray="4 1 1 1"/><text x="${x + 1}" y="${y0}" font-size="3" fill="#a24a2a">A</text><text x="${x + 1}" y="${y1 + 3}" font-size="3" fill="#a24a2a">A</text>`); }
  { const [x, y] = T('section', [-Dm / 2, Hm + 30], Hm); out.push(`<text x="${x}" y="${y}" font-size="2.6" fill="#3c5a46">${esc(labels.rake)} ${p.backRake}°</text>`); }
  // Specification table in the free right column.
  if (info.rows?.length) {
    const x0 = Math.max(cell.side[0] + Dm * k + 34, sheetW - margin - 120), y0 = margin + 14, colW = sheetW - margin - 6 - x0;
    if (colW > 70) {
      out.push(`<g font-size="2.7" fill="#1f2420"><text x="${x0}" y="${y0}" font-size="3.4" font-weight="600">${esc(labels.spec || '')}</text>`);
      info.rows.forEach(([a, b], i) => { const y = y0 + 7 + i * 5.6; out.push(`<text x="${x0}" y="${y}" fill="#5c625a">${esc(a)}</text><text x="${x0 + colW * 0.42}" y="${y}">${esc(b)}</text><line x1="${x0}" y1="${y + 1.8}" x2="${x0 + colW}" y2="${y + 1.8}" stroke="#d8d4ca" stroke-width="0.15"/>`); });
      out.push('</g>');
    }
  }
  // Title block
  const tb = [sheetW - margin - 120, sheetH - margin - 30];
  out.push(`<g class="titleblock" font-size="2.8" fill="#1f2420"><rect x="${tb[0]}" y="${tb[1]}" width="120" height="30" fill="#fff" stroke="#1f2420" stroke-width="0.35"/>
<line x1="${tb[0]}" y1="${tb[1] + 10}" x2="${tb[0] + 120}" y2="${tb[1] + 10}" stroke="#1f2420" stroke-width="0.2"/><line x1="${tb[0] + 60}" y1="${tb[1] + 10}" x2="${tb[0] + 60}" y2="${tb[1] + 30}" stroke="#1f2420" stroke-width="0.2"/>
<text x="${tb[0] + 3}" y="${tb[1] + 6.5}" font-size="4" font-weight="700" letter-spacing=".6">AURA · ${esc(info.title || labels.title)}</text>
<text x="${tb[0] + 3}" y="${tb[1] + 15}">${esc(labels.scale)} 1:${scale} (A3)</text><text x="${tb[0] + 3}" y="${tb[1] + 20}">${esc(labels.units)}</text><text x="${tb[0] + 3}" y="${tb[1] + 25}">${esc(info.date || '')}</text>
<text x="${tb[0] + 63}" y="${tb[1] + 15}">${esc(info.style || '')}</text><text x="${tb[0] + 63}" y="${tb[1] + 20}">${esc(info.id || '')}</text><text x="${tb[0] + 63}" y="${tb[1] + 25}">${esc(labels.status)}</text></g>`);
  out.push(`<text x="${margin}" y="${sheetH - margin + 3}" font-size="2.4" fill="#5c625a">${esc(labels.note)}</text>`);
  const defs = `<defs><pattern id="hatchFoam" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="2.4" fill="#f6f1e6"/><line x1="0" y1="0" x2="0" y2="2.4" stroke="#8b8577" stroke-width="0.18"/></pattern><pattern id="hatchWood" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="1.4" height="1.4" fill="#ecd9b8"/><line x1="0" y1="0" x2="0" y2="1.4" stroke="#7a5a32" stroke-width="0.22"/></pattern></defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}mm" height="${sheetH}mm" viewBox="0 0 ${sheetW} ${sheetH}" font-family="Helvetica, Arial, sans-serif">${defs}<rect width="${sheetW}" height="${sheetH}" fill="#fff"/><rect x="${margin / 2}" y="${margin / 2}" width="${sheetW - margin}" height="${sheetH - margin}" fill="none" stroke="#1f2420" stroke-width="0.5"/>${out.join('')}</svg>`;
  return {svg, scale, views, xCut};
}

/** DXF (R12, model space in real mm) with one layer per view. */
export function drawingDxf(compiled) {
  const {views} = buildViews(compiled), m = compiled.meta, Wm = m.overall.width, Dm = m.overall.depth, Hm = m.overall.height;
  const off = {front: [0, 0], side: [Wm / 2 + 400 + Dm / 2, 0], top: [0, -(Dm / 2 + 400)], section: [Wm / 2 + 400 + Dm / 2, -(Hm + 400)]};
  const lines = ['0', 'SECTION', '2', 'ENTITIES'];
  const line = (layer, a, b) => lines.push('0', 'LINE', '8', layer, '10', a[0].toFixed(2), '20', a[1].toFixed(2), '30', '0', '11', b[0].toFixed(2), '21', b[1].toFixed(2), '31', '0');
  const emit = (view, list, layer) => { const [ox, oy] = off[view]; for (const s of list) for (const l of s.loops) for (let i = 0; i < l.length; i++) { const a = l[i], b = l[(i + 1) % l.length]; line(layer, [a[0] + ox, a[1] + oy], [b[0] + ox, b[1] + oy]); } };
  emit('front', views.front, 'FRONT'); emit('side', views.side, 'SIDE'); emit('top', views.top, 'TOP'); emit('section', views.section, 'SECTION_A');
  lines.push('0', 'ENDSEC', '0', 'EOF');
  return lines.join('\n');
}
