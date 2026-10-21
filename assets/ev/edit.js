// AURA ev planı — plan editor: draw walls, move corners, add doors and windows, rename rooms. Edits the same
// EV record the plan, maquette and 3D views read, so every change shows everywhere. Undo/redo and a local draft.
const SNAP_PX = 14, GRID = 10, ANGLE = 6 * Math.PI / 180;
const DEF = {door: {w: 900, h: 2100, sill: 0}, window: {w: 1200, h: 1400, sill: 900}};
const r1 = v => Math.round(v);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const meas = v => ({value: r1(v), unit: 'mm', status: 'designer_edit', evidence_ids: [], uncertainty: null});
const fmt = v => r1(v).toLocaleString('tr-TR');

export function install(ev) {
  const {S, hooks} = ev;
  const E = {on: false, tool: 'select', sel: null, drag: null, chain: null, hover: null, wallT: 120, undo: [], redo: [], msg: ''};
  const snap = () => JSON.stringify(ev.D);
  const push = () => { E.undo.push(snap()); if (E.undo.length > 80) E.undo.shift(); E.redo = []; };
  const commit = (full = true) => { ev.refresh(full); try { localStorage.setItem('aura-ev-taslak', JSON.stringify({name: S.name, D: ev.D})); } catch {} };
  const restore = json => { ev.load(JSON.parse(json), S.name, true); E.sel = null; commit(); };

  // ---- geometry helpers -------------------------------------------------------------------------------------
  const nodes = () => { const m = new Map(); for (const w of ev.D.walls) for (const p of [w.from_xy_mm, w.to_xy_mm]) m.set(`${r1(p[0])},${r1(p[1])}`, p); return [...m.values()]; };
  const wallOf = id => ev.walls.find(w => w.id === id);
  const opOf = id => ev.D.openings.find(o => o.id === id);
  const uid = (pre, list) => { let k = list.length; while (list.some(x => x.id === `${pre}-${k}`)) k++; return `${pre}-${k}`; };
  function nearestWall(p) { const tol = 10 * ev.pxMM(); let best = null;
    for (const w of ev.walls) { const a = project(w, p), q = [w.x0 + w.ux * a, w.y0 + w.uy * a], d = dist(p, q) - w.t / 2; if (d < tol && (!best || d < best.d)) best = {d, w}; }
    return best?.w; }
  const project = (w, p) => Math.max(0, Math.min(w.L, (p[0] - w.x0) * w.ux + (p[1] - w.y0) * w.uy));
  function snapPoint(p, from) {
    const tol = SNAP_PX * ev.pxMM();
    let best = null; for (const n of nodes()) { const d = dist(n, p); if (d < tol && (!best || d < best.d)) best = {d, n}; }
    if (best) return {p: [...best.n], kind: 'node'};
    if (from) { // keep right angles and 45°, round the length
      const dx = p[0] - from[0], dy = p[1] - from[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), q = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
      const ang = Math.abs(a - q) < ANGLE ? q : a, Lr = Math.round(L / GRID) * GRID;
      return {p: [from[0] + Math.cos(ang) * Lr, from[1] + Math.sin(ang) * Lr], kind: ang === q ? 'angle' : 'free'};
    }
    return {p: [Math.round(p[0] / GRID) * GRID, Math.round(p[1] / GRID) * GRID], kind: 'grid'};
  }
  // moving a corner moves every wall end on it and the room outline corners around it (within half a wall)
  function moveNode(old, to) {
    const dx = to[0] - old[0], dy = to[1] - old[1], tMax = Math.max(120, ...ev.walls.map(w => w.t)) * 0.75 + 60; // room corners sit half a wall in from the axis node, on both sides
    for (const w of ev.D.walls) for (const k of ['from_xy_mm', 'to_xy_mm']) if (dist(w[k], old) < 2) w[k] = [r1(to[0]), r1(to[1])];
    for (const s of ev.D.spaces) s.boundary_xy_mm = s.boundary_xy_mm.map(p => dist(p, old) < tMax ? [r1(p[0] + dx), r1(p[1] + dy)] : p);
    fitOpenings();
  }
  function fitOpenings() { // openings stay on their wall: clamp offset, drop the ones that no longer fit
    const L = Object.fromEntries(ev.D.walls.map(w => [w.id, Math.hypot(w.to_xy_mm[0] - w.from_xy_mm[0], w.to_xy_mm[1] - w.from_xy_mm[1])]));
    ev.D.openings = ev.D.openings.filter(o => L[o.wall_id] >= (o.width?.value ?? 0) + 20);
    for (const o of ev.D.openings) o.offset_from_wall_start = meas(Math.max(10, Math.min(L[o.wall_id] - o.width.value - 10, o.offset_from_wall_start.value)));
  }
  function addWall(a, b) {
    if (dist(a, b) < 100) return;
    ev.D.walls.push({id: uid('wall', ev.D.walls), level_id: ev.D.levels?.[0]?.id || 'level-0', from_xy_mm: [r1(a[0]), r1(a[1])], to_xy_mm: [r1(b[0]), r1(b[1])], thickness: meas(E.wallT), space_ids: [], structural_status: 'designer_edit'});
  }
  function addOpening(w, at, kind) {
    const d = DEF[kind], width = Math.min(d.w, w.L - 40); if (width < 400) { E.msg = 'Bu duvar açıklık için çok kısa.'; return null; }
    const a = Math.max(20, Math.min(w.L - width - 20, at - width / 2));
    if (ev.ops.some(o => o.wall_id === w.id && a < o.a + o.w + 20 && a + width + 20 > o.a)) { E.msg = 'Bu noktada başka bir açıklık var.'; return null; }
    const o = {id: uid(kind === 'door' ? 'door' : 'window', ev.D.openings), wall_id: w.id, kind, space_ids: w.space_ids || [], offset_from_wall_start: meas(a), width: meas(width), height: meas(d.h), sill_height: meas(d.sill), swing: 'unknown'};
    ev.D.openings.push(o); return o;
  }
  const del = () => {
    if (!E.sel) return; push();
    if (E.sel.type === 'wall') { ev.D.walls = ev.D.walls.filter(w => w.id !== E.sel.id); ev.D.openings = ev.D.openings.filter(o => o.wall_id !== E.sel.id); }
    if (E.sel.type === 'op') ev.D.openings = ev.D.openings.filter(o => o.id !== E.sel.id);
    E.sel = null; commit();
  };

  // ---- overlay (drawn after the plan) --------------------------------------------------------------------
  const pill = (x, y, text, g) => { const k = ev.pxMM(), fs = 12 * k, w = (text.length * 7 + 14) * k, h = 20 * k;
    ev.el('rect', {x: x - w / 2, y: -y - h / 2, width: w, height: h, rx: h / 2, fill: '#fffdf8', stroke: ev.INK.select, 'stroke-width': 1.2 * k}, g);
    const t = ev.el('text', {x, y: -y + fs * 0.36, 'font-size': fs, 'text-anchor': 'middle', fill: '#5a2a1c', 'font-weight': 600}, g); t.textContent = text; };
  function dimLine(a, b, off, g) { // dimension parallel to a–b, off mm to the left
    const L = dist(a, b); if (L < 1) return; const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy * off, ny = ux * off, k = ev.pxMM();
    const A = [a[0] + nx, a[1] + ny], B = [b[0] + nx, b[1] + ny];
    ev.el('line', {x1: A[0], y1: -A[1], x2: B[0], y2: -B[1], stroke: ev.INK.select, 'stroke-width': 1.2 * k}, g);
    for (const [p, q] of [[a, A], [b, B]]) ev.el('line', {x1: p[0] + nx * 0.25, y1: -(p[1] + ny * 0.25), x2: q[0] + nx * 0.15, y2: -(q[1] + ny * 0.15), stroke: ev.INK.select, 'stroke-width': 1 * k}, g);
    pill((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, `${fmt(L)} mm`, g);
  }
  hooks.overlay = () => {
    if (!E.on || S.view !== 'plan') return;
    const g = ev.el('g', {style: 'pointer-events:none'}), k = ev.pxMM(), gn = ev.el('g', {});
    if (E.sel?.type === 'wall') { const w = wallOf(E.sel.id); if (w) { ev.el('polygon', {points: ev.pts(ev.band(w, 0, w.L)), fill: 'none', stroke: ev.INK.select, 'stroke-width': 2.5 * k}, g); dimLine([w.x0, w.y0], [w.x1, w.y1], w.t / 2 + 28 * k, g); } }
    if (E.sel?.type === 'op') { const o = ev.ops.find(x => x.id === E.sel.id), w = o && wallOf(o.wall_id);
      if (w) { ev.el('polygon', {points: ev.pts(ev.band(w, o.a, o.a + o.w)), fill: 'none', stroke: ev.INK.select, 'stroke-width': 2.5 * k}, g);
        dimLine([w.x0 + w.ux * o.a, w.y0 + w.uy * o.a], [w.x0 + w.ux * (o.a + o.w), w.y0 + w.uy * (o.a + o.w)], w.t / 2 + 28 * k, g); } }
    if (E.chain && E.hover) { const a = E.chain, b = E.hover.p, L = dist(a, b);
      if (L > 1) { const fake = {x0: a[0], y0: a[1], ux: (b[0] - a[0]) / L, uy: (b[1] - a[1]) / L, t: E.wallT};
        ev.el('polygon', {points: ev.pts(ev.band(fake, 0, L)), fill: 'rgba(173,80,62,.28)', stroke: ev.INK.select, 'stroke-width': 1.2 * k, 'stroke-dasharray': `${6 * k} ${4 * k}`}, g);
        dimLine(a, b, E.wallT / 2 + 28 * k, g); } }
    if (E.tool !== 'select' || E.sel?.type === 'wall' || E.drag) for (const n of nodes()) ev.el('circle', {cx: n[0], cy: -n[1], r: 5.5 * k, fill: '#fffdf8', stroke: ev.INK.select, 'stroke-width': 1.6 * k, 'data-node': `${n[0]},${n[1]}`, style: 'cursor:move'}, gn);
    if (E.hover && E.tool !== 'select') { const p = E.hover.p; ev.el('circle', {cx: p[0], cy: -p[1], r: (E.hover.kind === 'node' ? 8 : 4) * k, fill: E.hover.kind === 'node' ? 'none' : ev.INK.select, stroke: ev.INK.select, 'stroke-width': 2 * k}, g); }
  };

  // ---- pointer -------------------------------------------------------------------------------------------
  hooks.down = e => {
    if (!E.on || S.view !== 'plan' || e.button > 0) return false;
    const p = ev.toPlan(e), t = e.target;
    if (E.tool === 'wall') { const s = snapPoint(p, E.chain); push(); if (E.chain) { addWall(E.chain, s.p); commit(false); } E.chain = s.p; E.hover = s; ev.drawPlan(); return true; }
    if (E.tool === 'door' || E.tool === 'window') { const w = nearestWall(p); if (!w) { E.msg = 'Açıklık için bir duvara dokunun.'; ev.side(); return true; }
      push(); const o = addOpening(w, project(w, p), E.tool); if (o) { E.sel = {type: 'op', id: o.id}; E.tool = 'select'; } else E.undo.pop(); commit(); return true; }
    const node = t.closest?.('[data-node]'); if (node) { const n = node.dataset.node.split(',').map(Number); push(); E.drag = {type: 'node', at: n}; return true; }
    const op = t.closest?.('[data-op]'); if (op) { E.sel = {type: 'op', id: op.dataset.op}; push(); E.drag = {type: 'op', id: op.dataset.op, grab: null}; commit(); return true; }
    const wl = t.closest?.('[data-wall]'); if (wl) { E.sel = {type: 'wall', id: wl.dataset.wall}; commit(); return true; }
    const rm = t.closest?.('[data-room]'); if (rm) { E.sel = {type: 'room', id: rm.dataset.room}; S.room = rm.dataset.room; commit(); return true; }
    if (E.sel) { E.sel = null; commit(); } return false; // empty paper: pan
  };
  hooks.move = (e, dragging) => {
    if (!E.on || S.view !== 'plan') return; const p = ev.toPlan(e);
    if (E.tool !== 'select') { E.hover = snapPoint(p, E.chain); ev.drawPlan(); return; }
    if (!dragging || !E.drag) return;
    if (E.drag.type === 'node') { const s = snapPoint(p); if (dist(s.p, E.drag.at) < 1) return; moveNode(E.drag.at, s.p); E.drag.at = s.p; E.drag.moved = true; ev.refresh(false); }
    if (E.drag.type === 'op') { const o = opOf(E.drag.id), w = o && wallOf(o.wall_id); if (!w) return; const at = project(w, p);
      E.drag.grab ??= at - o.offset_from_wall_start.value; const a = Math.max(10, Math.min(w.L - o.width.value - 10, at - E.drag.grab));
      if (Math.abs(a - o.offset_from_wall_start.value) < 1) return; o.offset_from_wall_start = meas(Math.round(a / GRID) * GRID); E.drag.moved = true; ev.refresh(false); }
  };
  hooks.up = () => { if (E.drag && !E.drag.moved) E.undo.pop(); E.drag = null; commit(); };

  // ---- panel ---------------------------------------------------------------------------------------------
  const field = (label, key, v, attrs = '') => `<label class="ev-f"><span>${label}</span><input data-f="${key}" type="number" value="${r1(v)}" ${attrs}></label>`;
  function inspector() {
    const s = E.sel; if (!s) return `<p class="note">${E.tool === 'wall' ? 'Duvar: dokunarak köşe köşe çizin; dik açı ve köşelere kendiliğinden yapışır. Bitirmek için “Bitti”.' : E.tool === 'select' ? 'Bir duvara, kapıya, pencereye ya da odaya dokunun. Köşeleri sürükleyerek taşıyın.' : 'Açıklığı koymak istediğiniz duvara dokunun.'}</p>`;
    if (s.type === 'wall') { const w = wallOf(s.id); if (!w) return ''; return `<h3>Duvar</h3>${field('Uzunluk mm', 'len', w.L, 'step="10" min="100"')}${field('Kalınlık mm', 'thick', w.t, 'step="10" min="50" max="600"')}
      <div class="ev-row"><button data-e="addDoor">+ Kapı</button><button data-e="addWin">+ Pencere</button><button data-e="del" class="ev-del">Sil</button></div>`; }
    if (s.type === 'op') { const o = opOf(s.id); if (!o) return ''; const win = o.kind === 'window';
      return `<h3>${win ? 'Pencere' : 'Kapı'}</h3>${field('Genişlik mm', 'ow', o.width.value, 'step="10" min="400"')}${field('Yükseklik mm', 'oh', o.height.value, 'step="10" min="300"')}${win ? field('Denizlik mm', 'os', o.sill_height.value, 'step="10" min="0"') : ''}${field('Duvar başından mm', 'oa', o.offset_from_wall_start.value, 'step="10" min="0"')}
      <div class="ev-row"><button data-e="del" class="ev-del">Sil</button></div>`; }
    if (s.type === 'room') { const r = ev.D.spaces.find(x => x.id === s.id); if (!r) return '';
      return `<h3>Oda</h3><label class="ev-f"><span>Ad</span><input data-f="rname" value="${(r.name || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"></label>
      <label class="ev-f"><span>İşlev</span><select data-f="rkind">${Object.entries(ev.NAMES).map(([k, n]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <p class="note">${ev.area(r.boundary_xy_mm).toFixed(1)} m² · sınırı köşeleri taşıyarak değişir.</p>`; }
    return '';
  }
  hooks.panel = () => `<h2>Düzenleme</h2>
    <div class="ev-row"><button data-e="toggle" aria-pressed="${E.on}">${E.on ? 'Düzenleme açık' : 'Düzenlemeyi aç'}</button></div>
    ${E.on ? `<div class="ev-tools">${[['select', 'Seç'], ['wall', 'Duvar'], ['door', 'Kapı'], ['window', 'Pencere']].map(([k, n]) => `<button data-tool="${k}" aria-pressed="${E.tool === k}">${n}</button>`).join('')}</div>
    ${E.tool === 'wall' ? `<label class="ev-f"><span>Yeni duvar kalınlığı</span><select data-f="wallT">${[100, 120, 150, 200, 250, 300].map(v => `<option ${E.wallT === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>${E.chain ? '<div class="ev-row"><button data-e="endChain">Bitti</button></div>' : ''}` : ''}
    <div class="ev-insp">${inspector()}</div>${E.msg ? `<p class="ev-msg">${E.msg}</p>` : ''}
    <div class="ev-row"><button data-e="undo" ${E.undo.length ? '' : 'disabled'}>↶ Geri</button><button data-e="redo" ${E.redo.length ? '' : 'disabled'}>↷ İleri</button><button data-e="save">Planı indir</button></div>` : ''}`;
  hooks.click = e => {
    const b = e.target.closest('[data-e],[data-tool]'); if (!b) return false; E.msg = '';
    if (b.dataset.tool) { E.tool = b.dataset.tool; E.chain = null; E.hover = null; if (E.tool !== 'select') E.sel = null; ev.side(); ev.drawPlan(); return true; }
    const a = b.dataset.e;
    if (a === 'toggle') { E.on = !E.on; E.tool = 'select'; E.chain = null; E.sel = null; if (E.on && S.view !== 'plan') ev.show('plan'); ev.side(); ev.drawPlan(); document.body.classList.toggle('ev-editing', E.on); }
    if (a === 'endChain') { E.chain = null; E.hover = null; ev.side(); ev.drawPlan(); }
    if (a === 'undo' && E.undo.length) { E.redo.push(snap()); restore(E.undo.pop()); }
    if (a === 'redo' && E.redo.length) { E.undo.push(snap()); restore(E.redo.pop()); }
    if (a === 'del') del();
    if (a === 'addDoor' || a === 'addWin') { const w = wallOf(E.sel.id); push(); const o = addOpening(w, w.L / 2, a === 'addDoor' ? 'door' : 'window'); if (o) E.sel = {type: 'op', id: o.id}; else E.undo.pop(); commit(); }
    if (a === 'save') { const u = URL.createObjectURL(new Blob([JSON.stringify(ev.D, null, 1)], {type: 'application/json'})), l = document.createElement('a'); l.href = u; l.download = `aura-ev-plani-${new Date().toISOString().slice(0, 10)}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 1000); }
    return true;
  };
  hooks.change = e => {
    const f = e.target.dataset?.f; if (!f) return false; const v = +e.target.value;
    if (f === 'wallT') { E.wallT = v; return true; }
    push();
    if (f === 'len' || f === 'thick') { const w = ev.D.walls.find(x => x.id === E.sel.id);
      if (f === 'thick') w.thickness = meas(Math.max(50, Math.min(600, v)));
      else { const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0), k = Math.max(100, v) / L; moveNode([x1, y1], [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]); } }
    if (['ow', 'oh', 'os', 'oa'].includes(f)) { const o = opOf(E.sel.id), key = {ow: 'width', oh: 'height', os: 'sill_height', oa: 'offset_from_wall_start'}[f]; o[key] = meas(Math.max(0, v)); fitOpenings(); }
    if (f === 'rname' || f === 'rkind') { const r = ev.D.spaces.find(x => x.id === E.sel.id); if (f === 'rname') r.name = e.target.value; else { r.kind = e.target.value; if (!r.name || Object.values(ev.NAMES).includes(r.name.replace(/\s+\d+$/, ''))) r.name = ev.NAMES[r.kind]; } }
    commit(); return true;
  };
  addEventListener('keydown', e => {
    if (!E.on || /INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if (e.key === 'Escape') { E.chain = null; E.hover = null; E.tool = 'select'; ev.side(); ev.drawPlan(); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && E.sel && E.sel.type !== 'room') { e.preventDefault(); del(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); hooks.click({target: {closest: () => ({dataset: {e: e.shiftKey ? 'redo' : 'undo'}})}}); }
  });
  const css = document.createElement('style');
  css.textContent = `.ev-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0}.ev-tools button{padding:8px 4px}.ev-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
  .ev-f{display:grid;grid-template-columns:1fr 110px;align-items:center;gap:8px;margin:6px 0;font-size:13px;color:#4a4740}.ev-f input,.ev-f select{font:inherit;padding:6px;border:1px solid #ddd6c6;background:#fff;width:100%}
  .ev-insp h3{font-size:13px;margin:12px 0 4px;letter-spacing:.06em}.ev-del{color:#a63030}.ev-msg{color:#a63030;font-size:12px}button:disabled{opacity:.4}
  body.ev-editing #plan{cursor:crosshair}#plan{user-select:none;-webkit-user-select:none}`;
  document.head.appendChild(css);
  ev.side();
}
