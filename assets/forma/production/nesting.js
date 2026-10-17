// Production: from an approved design to the workshop's cutting (ebatlama) list and sheet layouts.
// Panels are grouped by board (material + thickness), cut sizes take off the edge-banding thickness on banded
// edges, grain-direction boards (veneer, solid) are not rotated, and parts are packed on standard sheets with a
// guillotine packer (every cut runs edge to edge, as on a panel saw). Units: mm.

/** Standard sheets in Turkey (boy × en). */
export const SHEETS = {
  mdf: {l: 2800, w: 2100, label: 'MDF 2800 × 2100'}, veneer: {l: 2800, w: 2100, label: 'Kaplamalı MDF 2800 × 2100'},
  back: {l: 2800, w: 2100, label: 'MDF / HDF 2800 × 2100'}, ply: {l: 2500, w: 1250, label: 'Huş kontrplak 2500 × 1250'},
  solid: {l: 2400, w: 1200, label: 'Masif tutkallı panel 2400 × 1200'}
};
export const CUT_RULES = {kerf: 4.4, trim: 10, band: 1};

/** Board a part is cut from: material family, thickness and whether the grain fixes its direction. */
export function boardOf(q, design) {
  const m = design.materials, p = design.params, T = p.board === 'solid' ? p.solidThickness : 18, TF = p.frontBoard === 'solid' ? p.solidThickness : 18;
  const surf = s => s?.surface === 'wood' ? 'solid' : s?.surface === 'veneer' ? 'veneer' : 'mdf';
  if (q.role === 'back') return {key: 'back-8', kind: 'back', t: 8, grain: false, label: 'MDF 8 mm (arkalık)'};
  if (q.mat === 'frame') { const t = Math.round(Math.min(...(q.cut || [q.geom.w, q.geom.h, q.geom.d]))); return {key: `ply-${t}`, kind: 'ply', t, grain: false, label: `Huş kontrplak ${t} mm`}; }
  if (q.mat === 'case' || q.mat === 'front' || q.mat?.startsWith('lac:')) {
    const spec = q.mat === 'case' ? m.case : m.front, kind = q.mat.startsWith('lac:') ? 'mdf' : surf(spec), t = q.mat === 'case' ? T : TF;
    const name = kind === 'solid' ? `Masif ${spec.species}` : kind === 'veneer' ? `Kaplamalı MDF (${spec.species})` : 'MDF (boya / lake için ham)';
    return {key: `${kind}-${kind === 'mdf' ? '' : spec.species}-${t}`, kind, t, grain: kind !== 'mdf', label: `${name} ${t} mm`};
  }
  return null; // worktop, glass, mirror, metal: ordered separately
}

/** Banded edges: [long edges, short edges]. */
const BANDS = {front: [1, 0], long: [1, 0], three: [1, 2], four: [2, 2]};

/** Cutting list for a compiled design × order quantity. Lacquered parts are not banded (painted edges). */
export function cuttingList(compiled, design, qty = 1, rules = CUT_RULES) {
  const rows = new Map(), extra = new Map();
  const banded = q => (q.mat === 'case' && design.materials.case.surface === 'veneer') || (q.mat === 'front' && design.materials.front.surface === 'veneer');
  for (const q of compiled.parts) {
    if (q.nocut || q.line || q.decor || q.role === 'seam' || q.role === 'reeds') continue;
    const dims = (q.cut || [q.geom.w, q.geom.h, q.geom.d]).map(v => Math.round(v * 10) / 10).sort((a, b) => b - a), [l, w, t] = dims, board = boardOf(q, design);
    if (!board) { const k = `${q.role}|${q.mat}|${Math.round(l)}x${Math.round(w)}x${Math.round(t)}`; const e = extra.get(k) || {role: q.role, mat: q.mat, l: Math.round(l), w: Math.round(w), t: Math.round(t), qty: 0}; e.qty += qty; extra.set(k, e); continue; }
    const [bl, bs] = banded(q) ? BANDS[q.band] || [0, 0] : [0, 0];
    const cl = Math.round((l - bs * rules.band) * 10) / 10, cw = Math.round((w - bl * rules.band) * 10) / 10;
    const k = `${board.key}|${q.role}|${cl}x${cw}|${bl}${bs}|${q.mat}`;
    const r = rows.get(k) || {board, role: q.role, mat: q.mat, l: cl, w: cw, t: board.t, net: [Math.round(l), Math.round(w)], bandLong: bl, bandShort: bs, qty: 0, ids: []};
    r.qty += qty; r.ids.push(q.id); rows.set(k, r);
  }
  // Parts longer than a sheet (kitchen plinths, island panels) are cut in equal lengths and joined on site.
  for (const r of rows.values()) { const sh = SHEETS[r.board.kind] || SHEETS.mdf, max = sh.l - 2 * rules.trim; if (r.l > max) { const n = Math.ceil(r.l / max); r.split = n; r.l = Math.round(r.l / n * 10) / 10 + 2; r.qty *= n; } }
  const list = [...rows.values()].sort((a, b) => a.board.key.localeCompare(b.board.key) || b.l * b.w - a.l * a.w);
  list.forEach((r, i) => { r.code = `E${String(i + 1).padStart(3, '0')}`; });
  return {rows: list, extra: [...extra.values()]};
}

/** Guillotine packing of one board's parts on sheets. Returns [{sheet, placed:[{code,x,y,l,w,rot}], used}]. */
export function packBoard(rows, sheet, rules = CUT_RULES) {
  const items = [];
  for (const r of rows) for (let i = 0; i < r.qty; i++) items.push({code: r.code, l: r.l, w: r.w, grain: r.board.grain, role: r.role});
  items.sort((a, b) => Math.max(b.l, b.w) - Math.max(a.l, a.w) || b.l * b.w - a.l * a.w);
  const k = rules.kerf, W = sheet.l - 2 * rules.trim, H = sheet.w - 2 * rules.trim, sheets = [];
  const newSheet = () => { const s = {free: [{x: 0, y: 0, w: W, h: H}], placed: []}; sheets.push(s); return s; };
  for (const it of items) {
    if ((it.l > W || it.w > H) && (it.grain || it.w > W || it.l > H)) { (sheets.oversize ??= []).push(it); continue; }
    let best = null;
    for (const s of sheets.length ? sheets : [newSheet()]) for (const [fi, f] of s.free.entries()) for (const rot of it.grain ? [false] : [false, true]) {
      const pw = rot ? it.w : it.l, ph = rot ? it.l : it.w;
      if (pw <= f.w + 0.01 && ph <= f.h + 0.01) { const score = Math.min(f.w - pw, f.h - ph); if (!best || score < best.score || (score === best.score && sheets.indexOf(s) < sheets.indexOf(best.s))) best = {s, fi, f, rot, pw, ph, score}; }
    }
    if (!best) { const s = newSheet(), f = s.free[0], rot = !it.grain && it.l > W; best = {s, fi: 0, f, rot, pw: rot ? it.w : it.l, ph: rot ? it.l : it.w}; }
    const {s, fi, f, pw, ph} = best;
    s.placed.push({code: it.code, role: it.role, x: f.x, y: f.y, l: pw, w: ph, rot: best.rot});
    s.free.splice(fi, 1);
    // Split the leftover along the shorter side (shorter-axis rule): two new free rectangles, kerf subtracted.
    const rw = f.w - pw - k, rh = f.h - ph - k;
    if (f.w - pw < f.h - ph) { if (rw > 0) s.free.push({x: f.x + pw + k, y: f.y, w: rw, h: ph}); if (rh > 0) s.free.push({x: f.x, y: f.y + ph + k, w: f.w, h: rh}); }
    else { if (rh > 0) s.free.push({x: f.x, y: f.y + ph + k, w: pw, h: rh}); if (rw > 0) s.free.push({x: f.x + pw + k, y: f.y, w: rw, h: f.h}); }
  }
  return sheets.map(s => ({sheet, placed: s.placed, used: s.placed.reduce((a, p) => a + p.l * p.w, 0) / (sheet.l * sheet.w)})).concat(sheets.oversize ? [{sheet, placed: [], oversize: sheets.oversize, used: 0}] : []);
}

/** Whole cutting plan: per board the list rows, sheets and yield. */
export function cuttingPlan(compiled, design, qty = 1, rules = CUT_RULES) {
  const {rows, extra} = cuttingList(compiled, design, qty, rules), boards = new Map();
  for (const r of rows) { const b = boards.get(r.board.key) || {board: r.board, rows: []}; b.rows.push(r); boards.set(r.board.key, b); }
  const plan = [...boards.values()].map(b => { const sheets = packBoard(b.rows, SHEETS[b.board.kind] || SHEETS.mdf, rules); return {...b, sheet: SHEETS[b.board.kind] || SHEETS.mdf, sheets, sheetCount: sheets.filter(s => s.placed.length).length, yield: sheets.length ? sheets.reduce((a, s) => a + s.used, 0) / Math.max(1, sheets.filter(s => s.placed.length).length) : 0}; });
  return {rows, extra, plan, rules, qty};
}

const SIDE_TR = {front: 'ön kenar', long: 'uzun kenar'};
/** CSV for the panel saw / ebatlama service (Turkish headers; finished and cut sizes, banding, grain). */
export function cuttingCsv(cp, nameOf = r => r.role) {
  const head = ['Kod', 'Parça', 'Malzeme', 'Kalınlık', 'Kesim boy', 'Kesim en', 'Adet', 'Net boy', 'Net en', 'Bant uzun kenar', 'Bant kısa kenar', 'Desen yönü'];
  const cell = v => { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [head, ...cp.rows.map(r => [r.code, nameOf(r), r.board.label, r.t, r.l, r.w, r.qty, r.net[0], r.net[1], r.bandLong, r.bandShort, (r.board.grain ? 'boy yönünde' : 'serbest') + (r.split ? ` · ${r.split} parçada ek` : '')])];
  lines.push([], ['Levha', 'Adet', 'Verim %']);
  for (const b of cp.plan) lines.push([b.board.label + ' · ' + b.sheet.label, b.sheetCount, Math.round(b.yield * 100)]);
  if (cp.extra.length) { lines.push([], ['Ayrı sipariş (kesim dışı)', 'Ölçü', 'Adet']); for (const e of cp.extra) lines.push([nameOf(e), `${e.l} × ${e.w} × ${e.t}`, e.qty]); }
  lines.push([], [`Testere payı ${cp.rules.kerf} mm, kenar temizliği ${cp.rules.trim} mm, bant payı ${cp.rules.band} mm`]);
  void SIDE_TR;
  return '﻿' + lines.map(l => l.map(cell).join(';')).join('\r\n');
}

/** One sheet as an SVG page (A4 landscape), parts labelled with their codes and sizes. */
export function sheetSvg(b, s, index, info = {}) {
  const PW = 297, PH = 210, m = 12, scale = Math.min((PW - 2 * m) / s.sheet.l, (PH - 2 * m - 22) / s.sheet.w), ox = m, oy = m + 16;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const out = [`<rect x="${ox}" y="${oy}" width="${s.sheet.l * scale}" height="${s.sheet.w * scale}" fill="#f4efe6" stroke="#1f2420" stroke-width="0.4"/>`];
  const t = CUT_RULES.trim * scale;
  for (const p of s.placed) {
    const x = ox + t + p.x * scale, y = oy + t + p.y * scale, w = p.l * scale, h = p.w * scale, fs = Math.max(1.6, Math.min(3.2, w / 9, h / 3));
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" stroke="#1f2420" stroke-width="0.25"/>`);
    out.push(`<text x="${x + w / 2}" y="${y + h / 2}" font-size="${fs}" text-anchor="middle" fill="#1f2420">${esc(p.code)}</text>`);
    if (h > 3 * fs) out.push(`<text x="${x + w / 2}" y="${y + h / 2 + fs * 1.15}" font-size="${fs * 0.8}" text-anchor="middle" fill="#5c625a">${p.l} × ${p.w}${p.rot ? ' ↻' : ''}</text>`);
  }
  const head = `${esc(info.title || '')} · ${esc(b.board.label)} · ${esc(b.sheet.label)} · ${index + 1} / ${b.sheetCount} · %${Math.round(s.used * 100)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}mm" height="${PH}mm" viewBox="0 0 ${PW} ${PH}" font-family="Helvetica, Arial, sans-serif"><rect width="${PW}" height="${PH}" fill="#fff"/><text x="${m}" y="${m + 4}" font-size="4.2" font-weight="700">${head}</text><text x="${m}" y="${m + 10}" font-size="2.8" fill="#5c625a">${esc(info.note || '')}</text>${out.join('')}</svg>`;
}
