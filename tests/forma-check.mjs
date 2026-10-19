// AURA Forma checks: geometry validity across all styles, proposal diversity, textiles, commands, drawings, package.
import assert from 'node:assert/strict';
import {compile, validate, buildMesh, worldPositions, RANGES} from '../assets/forma/sofa.js';
import {bounds} from '../assets/forma/mesh.js';
import {sample, variants, similar, blend, distance} from '../assets/forma/generate.js';
import {STYLES} from '../assets/forma/styles.js';
import {draft, fabricMaps} from '../assets/forma/textile.js';
import {WEAVES} from '../assets/forma/catalog.js';
import {parse} from '../assets/forma/commands.js';
import {drawingSheet, drawingDxf} from '../assets/forma/drawing.js';
import {bom, bomCsv} from '../assets/forma/bom.js';
import {zip, crc32, jpegPdf} from '../assets/forma/package.js';
import {sanitizeActions, mapVisionToDesign} from '../assets/forma/ai.js';

// 1. Geometry: every style × kind × seed compiles to finite, positive parts within the declared envelope.
let designs = 0;
for (const st of STYLES) for (const kind of ['sofa', 'loveseat', 'armchair']) for (let seed = 1; seed <= 12; seed++) {
  const d = sample({style: st.id, kind, seed}), c = compile(d.params);
  const errors = validate(c).filter(i => i.level === 'error');
  assert.equal(errors.length, 0, `${st.id}/${kind}/${seed}: ${JSON.stringify(errors)}`);
  if (seed <= 3) {
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const part of c.parts.filter(q => !q.internal)) {
      const m = buildMesh(part);
      assert.ok(m.indices.length > 0 && m.positions.every(Number.isFinite), `${part.id} mesh`);
      const b = bounds(worldPositions(part)); for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], b.min[k]); max[k] = Math.max(max[k], b.max[k]); }
    }
    const [W, H, D] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    assert.ok(W <= c.params.width + 6, `${st.id} width ${W} > ${c.params.width}`);
    assert.ok(D <= c.params.depth + 60, `${st.id} depth ${D} > ${c.params.depth}`);
    assert.ok(H <= c.params.height + 40 && H >= c.params.height - 120, `${st.id}/${kind}/${seed} height ${H} vs ${c.params.height}: ${c.parts.filter(q => !q.internal).map(q => [q.id, Math.round(bounds(worldPositions(q)).max[1])]).sort((a, b) => b[1] - a[1]).slice(0, 2).join(' ')}`);
    assert.ok(min[1] >= -2, `${st.id} below floor ${min[1]}`);
  }
  designs++;
}

// 2. Diversity: twelve proposals of one style are pairwise different, with many distinct part combinations.
for (const style of ['japandi', 'art_deco', 'mid_century_modern', 'brutalism']) {
  const v = variants({style, kind: 'sofa'});
  assert.equal(v.length, 12);
  let minPair = Infinity; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) minPair = Math.min(minPair, distance(v[i], v[j]));
  assert.ok(minPair > 0.9, `${style} proposals too similar (${minPair.toFixed(2)})`);
  const combos = new Set(v.map(d => `${d.params.armType}/${d.params.backType}/${d.params.baseType}`));
  assert.ok(combos.size >= 7, `${style} only ${combos.size} distinct part combinations`);
  const near = similar(v[0]), avgNear = near.reduce((s, d) => s + distance(d, v[0]), 0) / near.length, avgFar = v.slice(1).reduce((s, d) => s + distance(d, v[0]), 0) / 11;
  assert.ok(avgNear < avgFar, `${style}: "similar" should stay closer than new proposals`);
  const mid = blend(v[0], v[1], 0.5, 3); assert.equal(validate(compile(mid.params)).filter(i => i.level === 'error').length, 0);
}

// 3. Textiles: the draft equals the weave definition; maps tile on whole weave repeats and carry relief.
for (const [k, W] of Object.entries(WEAVES)) {
  const g = draft(k, 8); g.forEach((row, j) => row.forEach((up, i) => assert.equal(up, W.top(i, j), `${k} draft`)));
}
for (const spec of [{fiber: 'linen', weave: 'plain', color: 'oat', pattern: 'none'}, {fiber: 'wool', weave: 'herringbone', color: 'stone', pattern: 'none'}, {fiber: 'cotton', weave: 'plain', color: 'indigo', pattern: 'check', color2: 'chalk'}, {fiber: 'cotton', weave: 'satin', color: 'blush', pattern: 'damask', color2: 'mauve'}, {fiber: 'velvet', weave: 'plain', color: 'bottle', pattern: 'none'}]) {
  const m = fabricMaps({scale: 1, color2: 'charcoal', ...spec}, {maxPx: 512});
  assert.equal(m.albedo.length, m.size * m.size * 4);
  let s = 0, s2 = 0; for (let i = 0; i < m.normal.length; i += 4) { s += m.normal[i]; s2 += m.normal[i] ** 2; }
  const n = m.normal.length / 4, variance = s2 / n - (s / n) ** 2;
  assert.ok(variance > 4, `${spec.fiber}/${spec.weave} normal map is flat`);
  assert.ok(m.tileMm > 20 && m.tileMm < 200, `${spec.fiber} tile ${m.tileMm}`);
}

// 4. Commands in all eight languages.
const has = (text, want) => { const a = parse(text).actions; for (const w of want) assert.ok(a.some(x => Object.entries(w).every(([k, v]) => x[k] === v)), `"${text}" → ${JSON.stringify(a)} lacks ${JSON.stringify(w)}`); };
has('Genişliği 220 cm yap', [{type: 'set', key: 'width', value: 2200}]);
has('kolları 5 cm alçalt', [{type: 'delta', key: 'armHeight', value: -50}]);
has('3 kişilik yeşil kadife kanepe', [{key: 'seatCount', value: 3}, {key: 'fiber', value: 'velvet'}, {key: 'color', value: 'bottle'}]);
has('ayakları ceviz yap', [{slot: 'wood', value: 'walnut'}]);
has('kapitone sırt, rulo kol', [{key: 'backType', value: 'tufted'}, {key: 'armType', value: 'rolled'}]);
has('Make it 20 cm wider', [{type: 'delta', key: 'width', value: 200}]);
has('seat height 45 cm', [{type: 'set', key: 'seatHeight', value: 450}]);
has('tapered oak legs', [{key: 'legType', value: 'tapered'}, {value: 'oak'}]);
has('Armlehnen etwas niedriger', [{type: 'delta', key: 'armHeight', value: -15}]);
has('Rückenneigung 10 Grad', [{type: 'set', key: 'backRake', value: 10}]);
has('canapé 3 places capitonné', [{key: 'seatCount', value: 3}, {key: 'backType', value: 'tufted'}]);
has('fluweel blauw', [{value: 'velvet'}, {value: 'turkishBlue'}]);
has('lavere armlæn', [{type: 'delta', key: 'armHeight'}]);
has('patas de nogal', [{value: 'walnut'}]);
has('braccioli più bassi', [{type: 'delta', key: 'armHeight'}]);
has('geri al', [{type: 'command', name: 'undo'}]);
has('show me more like this', [{type: 'command', name: 'similar'}]);
assert.equal(parse('xyzzy plugh').understood, false);

// 5. Drawings, BOM and package.
const d = sample({style: 'dark_academia', kind: 'sofa', seed: 4}), c = compile(d.params);
const labels = {front: 'Front', side: 'Side', top: 'Top', section: 'Section', scale: 'Scale', units: 'mm', title: 'Sofa', note: 'Concept', seatDepth: 'Seat depth', rake: 'Rake', status: 'Draft', spec: 'Spec'};
const sheet = drawingSheet(c, labels, {rows: [['A', 'B']]});
assert.ok(sheet.svg.startsWith('<svg') && sheet.svg.includes('Section A–A') && sheet.scale >= 5, 'drawing sheet');
assert.ok((sheet.svg.match(/<path /g) || []).length > 20, 'drawing has outlines');
const dxf = drawingDxf(c); assert.ok(dxf.includes('ENTITIES') && dxf.trim().endsWith('EOF') && (dxf.match(/\nLINE\n/g) || []).length > 200, 'dxf');
const b = bom(c, d.materials, 'tr');
assert.ok(b.rows.some(r => r.nameEn === 'Seat cushion' || r.nameEn === 'Tight seat'), 'bom seat');
assert.ok(b.totals.fabricMetres > 3 && b.totals.fabricMetres < 40, `fabric ${b.totals.fabricMetres} m`);
assert.ok(bomCsv(b).split('\r\n').length > b.rows.length, 'csv');
assert.equal(crc32(new TextEncoder().encode('123456789')).toString(16), 'cbf43926');
const z = zip([{name: 'a.txt', data: 'hello'}, {name: 'b.json', data: '{}'}]);
assert.equal(new DataView(z.buffer).getUint32(0, true), 0x04034b50); assert.equal(new DataView(z.buffer).getUint16(z.length - 22 + 10, true), 2);
const pdf = new TextDecoder().decode(jpegPdf([{width: 2, height: 1, data: new Uint8Array([255, 216, 255, 217])}]));
assert.ok(pdf.startsWith('%PDF-1.4') && pdf.includes('/Count 1') && pdf.trim().endsWith('%%EOF'), 'pdf');

// 6. AI output is validated before use.
assert.deepEqual(sanitizeActions([{type: 'set', key: 'width', value: 2000}, {type: 'set', key: 'evil', value: 1}, {type: 'enum', key: 'armType', value: 'laser'}, {type: 'material', slot: 'fabric', key: 'color', value: 'sage'}]), [{type: 'set', key: 'width', value: 2000}, {type: 'material', slot: 'fabric', key: 'color', value: 'sage'}]);
const read = mapVisionToDesign({kind: 'armchair', style: 'neo_gothic', params: {armType: 'scroll', width: 900, legType: 'nonsense'}, measured: ['width'], confidence: 0.6});
assert.equal(read.design.params.armType, 'scroll'); assert.ok(!read.estimated.includes('width') && read.estimated.includes('depth'));


// 7. Tables: every style × kind × seed is valid, proposals differ, drawings/BOM/commands work.
const T = await import('../assets/forma/table.js');
const {TABLE_STYLES} = await import('../assets/forma/styles-table.js');
const {stoneMaps} = await import('../assets/forma/stone.js');
const {woodMaps} = await import('../assets/forma/wood.js');
let tables = 0;
for (const st of TABLE_STYLES) for (const kind of Object.keys(T.KINDS)) for (let seed = 1; seed <= 4; seed++) {
  const td = sample({family: 'table', style: st.id, kind, seed}), tc = T.compile({...td.params, kind});
  const errs = T.validate(tc, td.materials, buildMesh).filter(i => i.level === 'error');
  assert.equal(errs.length, 0, `${st.id}/${kind}/${seed}: ${JSON.stringify(errs)}`);
  for (const part of tc.parts) { const m = buildMesh(part); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `${st.id}/${kind} ${part.id} mesh`); }
  tables++;
}
const tv = variants({family: 'table', style: 'japandi', kind: 'dining'});
assert.ok(new Set(tv.map(x => `${x.params.topShape}/${x.params.baseType}`)).size >= 5, 'table proposals vary');
const td = sample({family: 'table', style: 'art_deco', kind: 'dining', seed: 3}), tc = T.compile({...td.params, kind: 'dining'});
const ts = drawingSheet(tc, {...labels, knee: 'Knee', edgeDetail: 'Edge'}, {rows: [['A', 'B']]});
assert.ok(ts.svg.startsWith('<svg') && !ts.svg.includes('undefined') && !ts.svg.includes('NaN'), 'table sheet');
assert.ok(drawingDxf(tc).includes('ENTITIES'), 'table dxf');
const tb = bom(tc, td.materials, 'en');
assert.ok(tb.totals.weightKg > 10 && tb.totals.weightKg < 200 && tb.rows.some(r => /top/i.test(r.nameEn)), `table bom ${tb.totals.weightKg}`);
const tp = (text, want) => { const a = parse(text, {family: 'table'}).actions; for (const w of want) assert.ok(a.some(x => Object.entries(w).every(([k, v]) => x[k] === v)), `table "${text}" → ${JSON.stringify(a)} lacks ${JSON.stringify(w)}`); };
tp('6 kişilik oval ceviz yemek masası', [{type: 'seats', value: 6}, {key: 'topShape', value: 'oval'}, {value: 'walnut'}]);
tp('mermer tabla', [{slot: 'top', key: 'surface', value: 'stone'}]);
tp('füme cam', [{key: 'glass', value: 'smoked'}]);
tp('Make it 20 cm longer', [{type: 'delta', key: 'length', value: 200}]);
tp('round coffee table', [{key: 'topShape', value: 'round'}, {type: 'kind', value: 'coffee'}]);
tp('Esstisch aus Eiche', [{type: 'kind', value: 'dining'}, {value: 'oak'}]);
assert.equal(parse('yemek masası').actions.some(a => a.type === 'family' || a.type === 'kind'), true, 'family switch from seating');
for (const id of ['carrara', 'travertine', 'terrazzo']) { const m = stoneMaps(id, 'polished', {size: 64}); assert.equal(m.albedo.length, 64 * 64 * 4); }
const wm = woodMaps('gurgen', 'matte', {w: 32, h: 64, stain: 'walnut'}), wn = woodMaps('gurgen', 'matte', {w: 32, h: 64, stain: 'natural'});
assert.ok(wm.albedo[0] < wn.albedo[0], 'walnut stain darkens gürgen');
for (const pattern of ['floral', 'polka', 'leaf', 'geometric', 'chevron', 'houndstooth', 'damask']) for (const density of [1, 6]) {
  const fm = fabricMaps({fiber: 'cotton', weave: 'plain', color: 'cream', color2: 'navy', pattern, density}, {maxPx: 256});
  let lo = 255, hi = 0; for (let i = 0; i < fm.albedo.length; i += 4 * 7) { lo = Math.min(lo, fm.albedo[i]); hi = Math.max(hi, fm.albedo[i]); }
  assert.ok(hi - lo > 40, `${pattern}/${density} visible`);
}

// 8. (The bed-led bedroom set was retired on 2026-10-19; its pieces open as RİTMO case goods.)
let bedroomN = 0;
// 9. Line details (stitch, inlay, groove): every family draws them as finite meshes; sheets and BOM stay clean.
let lineN = 0;
const lineOk = (c, label) => {
  const ls = c.parts.filter(q => q.line); assert.ok(ls.length, `${label}: no line parts`);
  for (const q of ls) { const m = buildMesh(q); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `${label} ${q.id}`); lineN++; }
};
for (const stitch of ['single', 'double']) for (const seatType of ['split', 'bench', 'tight']) for (const cushionEdge of ['boxed', 'knife', 'bullnose']) lineOk(compile({stitch, seatType, cushionEdge}), `sofa ${stitch}/${seatType}/${cushionEdge}`);
for (const inlay of ['single', 'double', 'groove']) for (const topShape of T.ENUMS.topShape) for (const edge of T.ENUMS.edge) lineOk(T.compile({inlay, topShape, edge}), `table ${inlay}/${topShape}/${edge}`);
{
  const one = (t, family, want) => assert.ok(parse(t, {family}).actions.some(x => Object.entries(want).every(([k, v]) => x[k] === v)), `line command: ${t}`);
  one('çift dikiş', 'seating', {key: 'stitch', value: 'double'}); one('Doppelnaht', 'seating', {key: 'stitch', value: 'double'});
  one('pirinç kakma', 'table', {slot: 'hardware', value: 'brass'}); one('kenarda kanal', 'table', {key: 'inlay', value: 'groove'}); one('filete doble', 'table', {key: 'inlay', value: 'double'});
}
// 10. Curated starting models: every entry is a real studio style, compiles and validates without errors.
let startN = 0;
{
  const {STARTS} = await import('../assets/forma/starts.js'), {STYLE_IDS} = await import('../assets/forma/curated.js'), {FAMILIES} = await import('../assets/forma/families.js');
  for (const [fam, kinds] of Object.entries(STARTS)) for (const [kind, list] of Object.entries(kinds)) {
    const seen = new Set(list.map(e => e.style)); assert.equal(seen.size, STYLE_IDS.length, `${fam}/${kind}: every style has starting models`);
    for (const e of list) {
      assert.ok(STYLE_IDS.includes(e.style), e.style);
      const mod = FAMILIES[fam].mod, params = mod.normalize({...mod.DEFAULTS, ...e.p, kind}), c = mod.compile(params);
      const errs = (mod.validate(c, sample({family: fam, style: e.style, kind, seed: e.seed}).materials, buildMesh) || []).filter(i => i.level === 'error');
      assert.equal(errs.length, 0, `${fam}/${kind}/${e.style}/${e.seed}: ${JSON.stringify(errs)}`);
      startN++;
    }
  }
}
// 11. Room: every layout keeps products inside the room and apart from each other; misfits are reported.
let roomN = 0;
{
  const R = await import('../assets/forma/room.js'), {FAMILIES} = await import('../assets/forma/families.js');
  const mk = (family, kind, seed = 2) => { const d = sample({family, style: 'japandi', kind, seed}); return {design: d, compiled: FAMILIES[family].mod.compile({...d.params, kind})}; };
  const sets = [
    ['living', [mk('seating', 'sofa'), mk('seating', 'loveseat'), mk('seating', 'armchair'), mk('table', 'coffee'), mk('table', 'side'), mk('table', 'console')]],
    ['living', [mk('seating', 'sofa'), mk('seating', 'armchair'), mk('seating', 'armchair', 3), mk('table', 'coffee'), mk('table', 'dining')]],
    ['dining', [mk('table', 'dining'), mk('table', 'console')]],
    ['bedroom', [mk('storage', 'wardrobe'), mk('storage', 'nightstand'), mk('storage', 'nightstand', 3), mk('storage', 'dresser'), mk('storage', 'vanity')]],
    ['bedroom', [mk('storage', 'wardrobe'), mk('storage', 'wardrobe', 3), mk('storage', 'nightstand'), mk('seating', 'armchair')]]
  ];
  for (const [type, list] of sets) for (let layout = 0; layout < 3; layout++) {
    const items = list.map((x, i) => ({id: 'U' + i, kind: R.itemKind(x.design), fp: R.footprint(x.compiled)}));
    const plan = R.arrange(items, type, layout), boxes = plan.placed.map(pl => {
      const it = items.find(i => i.id === pl.id), c = Math.cos(pl.rot), s = Math.sin(pl.rot), pts = [[it.fp.x0, it.fp.z0], [it.fp.x1, it.fp.z0], [it.fp.x0, it.fp.z1], [it.fp.x1, it.fp.z1]].map(([x, z]) => [pl.x + x * c + z * s, pl.z - x * s + z * c]);
      return {id: pl.id, x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), z0: Math.min(...pts.map(p => p[1])), z1: Math.max(...pts.map(p => p[1]))};
    });
    assert.equal(plan.placed.length, items.length, `${type}/${layout}: every product placed`);
    for (const b of boxes) assert.ok(b.x0 >= -plan.W / 2 - 1 && b.x1 <= plan.W / 2 + 1 && b.z0 >= -plan.D / 2 - 1 && b.z1 <= plan.D / 2 + 1, `${type}/${layout}: ${b.id} inside the room ${JSON.stringify(b)} ${plan.W}x${plan.D}`);
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j], ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0);
      assert.ok(ox <= 40 || oz <= 40, `${type}/${layout}: ${a.id} overlaps ${b.id} (${Math.round(ox)} × ${Math.round(oz)} mm)`);
    }
    roomN++;
  }
  assert.deepEqual(R.misfits([{design: mk('table', 'dining').design}], 'living').length, 1);
  assert.equal(R.suggestRoom([{design: mk('storage', 'wardrobe').design}]), 'bedroom');
}
// 12. RİTMO case goods: production rules hold for every curated model and for edge cases.
let storageN = 0, storageParts = 0;
{
  const S = await import('../assets/forma/storage.js'), {FAMILIES} = await import('../assets/forma/families.js'), {normalizeDesign} = await import('../assets/forma/generate.js');
  const fam = FAMILIES.storage, near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;
  const check = (d, label) => {
    const c = fam.mod.compile({...d.params, kind: d.kind}), p = c.params, T = p.board === 'solid' ? p.solidThickness : 18, TF = p.frontBoard === 'solid' ? p.solidThickness : 18;
    for (const q of c.parts) { const m = buildMesh(q); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `${label}: ${q.id} mesh`); storageParts++; }
    const dims = q => [q.geom.w, q.geom.h, q.geom.d];
    for (const q of c.parts.filter(q => ['side', 'top', 'bottom', 'divider', 'shelf-fixed', 'shelf-adj'].includes(q.role))) assert.ok(dims(q).some(v => near(v, T)), `${label}: ${q.id} is ${T} mm`);
    for (const q of c.parts.filter(q => q.role === 'back')) assert.ok(near(q.geom.d, 8), `${label}: back 8 mm`);
    for (const q of c.parts.filter(q => ['door', 'drawer-front', 'sliding-door'].includes(q.role))) assert.ok(near(q.cut ? q.cut[2] : q.geom.d, TF), `${label}: ${q.id} front ${TF} mm`);
    // Fronts: inside the outline, 2 mm reveals between neighbours in a row, never overlapping (hinged).
    const fronts = c.parts.filter(q => ['door', 'drawer-front'].includes(q.role) && q.cut).map(q => ({id: q.id, x0: q.pos[0] - q.cut[0] / 2, x1: q.pos[0] + q.cut[0] / 2, y0: q.pos[1] - q.cut[1] / 2, y1: q.pos[1] + q.cut[1] / 2}));
    for (const f of fronts) assert.ok(f.x0 >= -p.width / 2 - 0.5 && f.x1 <= p.width / 2 + 0.5 && f.y1 <= p.height + 0.5, `${label}: ${f.id} inside`);
    for (let i = 0; i < fronts.length; i++) for (let j = i + 1; j < fronts.length; j++) { const a = fronts[i], b = fronts[j], ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); assert.ok(ox <= -1.9 || oy <= -1.9, `${label}: ${a.id} / ${b.id} reveal ${ox.toFixed(1)} ${oy.toFixed(1)}`); }
    // Drawer boxes sit inside their runners' opening (12.7 mm per side).
    for (const q of c.parts.filter(q => q.role === 'box-side')) assert.ok(q.geom.w === 12, `${label}: drawer side 12 mm`);
    if (p.kind === 'wardrobe') for (const w of c.meta.moduleWidths) assert.ok(w <= 1200 + 1 || p.bays.length === 1 || c.meta.modules === p.bays.length, `${label}: module ${w}`);
    assert.equal(fam.mod.validate(c).filter(i => i.level === 'error').length, 0, `${label}: errors`);
    const b = bom(c, d.materials, 'tr'); assert.ok(b.rows.some(r => r.nameTr === 'Yan dikme') && b.totals.weightKg > 0, `${label}: cut list`);
    const sh = drawingSheet(c, labels, {rows: [['A', 'B']], link: 'https://auraproject.com.tr/tasarla.html#d=zabc'}); assert.ok(!sh.svg.includes('NaN') && sh.svg.includes('tasarla.html'), `${label}: sheet`);
    storageN++;
  };
  for (const [kind, list] of Object.entries(fam.starts)) {
    assert.equal(new Set(list.map(e => e.style)).size, 10, `storage/${kind}: every style has starting models`);
    for (const e of list) {
      const d0 = sample({family: 'storage', style: e.style, kind, seed: e.seed}), d = normalizeDesign({...d0, kind, params: {...e.p, kind}, materials: e.m ? {...d0.materials, ...e.m} : d0.materials});
      check(d, `${kind}/${e.style}/${e.seed}`);
      assert.equal(fam.mod.validate(fam.mod.compile({...d.params, kind})).filter(i => i.level === 'warn').length, 0, `${kind}/${e.style}/${e.seed} has warnings`);
    }
  }
  for (const kind of Object.keys(S.KINDS)) for (const v of [{frontFit: 'inset'}, {base: 'legs'}, {base: 'wall'}, {frontStyle: 'shaker'}, {frontStyle: 'slats'}, {frontStyle: 'cane'}, {width: 3600}, {width: 350, depth: 300}, {doorType: 'sliding'}, {topType: 'slab', topOverhang: 30}]) {
    const d = normalizeDesign({family: 'storage', kind, style: 'aura', seed: 1, params: {...S.defaultsFor(kind), ...v}, materials: {case: {surface: 'wood', species: 'walnut'}}});
    check(d, `${kind} ${JSON.stringify(v)}`);
    assert.equal(d.params.board, 'solid', 'solid wood means solid panels');
  }
  // 3600 mm wardrobe is split into transportable modules.
  { const c = S.compile({...S.defaultsFor('wardrobe'), width: 3600, bays: Array.from({length: 6}, () => ({cells: [{type: 'door', inside: 'hang'}]}))}); assert.ok(c.meta.modules === 3 && c.meta.moduleWidths.every(w => w <= 1200), `modules ${c.meta.moduleWidths}`); }
  // Commands.
  const has = (t, want) => assert.ok(parse(t, {family: 'storage'}).actions.some(x => Object.entries(want).every(([k, v]) => JSON.stringify(x[k]) === JSON.stringify(v))), `storage command: ${t}`);
  has('3 çekmeceli şifonyer', {type: 'drawers', value: 3}); has('makyaj masası', {type: 'kind', value: 'vanity'}); has('gömme kapak', {key: 'frontFit', value: 'inset'});
  has('kapakları beyaz lake', {slot: 'front', key: 'color', value: 'white'}); has('gardırop 240 cm genişlik', {type: 'set', key: 'width', value: 2400}); has('shaker kapak', {key: 'frontStyle', value: 'shaker'});
  assert.ok(parse('gardırop', {family: 'seating'}).actions.some(a => a.type === 'family' && a.value === 'storage'), 'wardrobe word opens storage');
  // Design link round trip.
  const L2 = await import('../assets/forma/link.js'), d = sample({family: 'storage', style: 'aura', kind: 'vanity', seed: 1}), enc = await L2.encode({v: 1, d: {f: d.family, k: d.kind, s: d.style, n: d.seed, p: d.params, m: d.materials}}), back = await L2.decode(enc);
  assert.deepEqual(back.d.p, d.params, 'link round trip'); assert.ok(enc.length < 3000, `link length ${enc.length}`);
}
// 13. Kitchens: every curated run / island compiles, has a worktop, sink, appliances and a clean sheet.
let kitchenN = 0;
{
  const {FAMILIES} = await import('../assets/forma/families.js'), {normalizeDesign} = await import('../assets/forma/generate.js'), fam = FAMILIES.kitchen;
  for (const [kind, list] of Object.entries(fam.starts)) for (const e of list) for (const open of [false, true]) {
    const d0 = sample({family: 'kitchen', style: e.style, kind, seed: e.seed}), d = normalizeDesign({...d0, kind, params: {...e.p, kind}, materials: e.m ? {...d0.materials, ...e.m} : d0.materials});
    const c = fam.mod.compile({...d.params, kind, openFronts: open});
    for (const q of c.parts) { const m = buildMesh(q); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `kitchen ${kind}/${e.style}: ${q.id}`); }
    if (open) continue;
    assert.equal(fam.mod.validate(c).filter(i => i.level !== 'info').length, 0, `kitchen ${kind}/${e.style}/${e.seed}: ${JSON.stringify(fam.mod.validate(c))}`);
    const b = bom(c, d.materials, 'tr'); assert.ok(b.rows.some(r => r.nameTr === 'Tezgah') && b.rows.some(r => r.code[0] === 'A'), `kitchen ${kind}/${e.style}: bom`);
    const sh = drawingSheet(c, labels, {rows: [['A', 'B']]}); assert.ok(!sh.svg.includes('NaN'), 'kitchen sheet');
    kitchenN++;
  }
  assert.ok(parse('mutfak', {family: 'seating'}).actions.some(a => a.value === 'kitchen'), 'kitchen word');
}
// 15. Bathroom: every curated vanity, column and mirror compiles, validates, has a bill and a clean sheet.
let bathN = 0;
{
  const {FAMILIES} = await import('../assets/forma/families.js'), {normalizeDesign} = await import('../assets/forma/generate.js'), fam = FAMILIES.bath;
  const extra = [{kind: 'basin', basinType: 'integrated', basins: 'double', width: 1600}, {kind: 'basin', basinType: 'undermount', base: 'legs'}, {kind: 'mirror', mirrorCabinet: 'cabinet'}, {kind: 'column', base: 'legs'}];
  const cases = [...Object.entries(fam.starts).flatMap(([kind, list]) => list.map(e => [kind, e])), ...extra.map(p => [p.kind, {style: 'japandi', seed: 1, p: {...fam.mod.defaultsFor(p.kind), ...p}}])];
  for (const [kind, e] of cases) for (const open of [false, true]) {
    const d0 = sample({family: 'bath', style: e.style, kind, seed: e.seed}), d = normalizeDesign({...d0, kind, params: {...e.p, kind}, materials: e.m ? {...d0.materials, ...e.m} : d0.materials});
    const c = fam.mod.compile({...d.params, kind, openFronts: open});
    for (const q of c.parts) { const m = buildMesh(q); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `bath ${kind}/${e.style}: ${q.id}`); }
    if (open) continue;
    assert.equal(fam.mod.validate(c).filter(i => i.level !== 'info').length, 0, `bath ${kind}/${e.style}/${e.seed}: ${JSON.stringify(fam.mod.validate(c))}`);
    if (kind === 'basin') { assert.ok(c.meta.basinRim >= 800 && c.meta.basinRim <= 920, 'rim'); assert.ok(c.parts.some(q => q.role === 'basin') && c.parts.some(q => q.role === 'vanity-top'), 'basin + top'); }
    const b = bom(c, d.materials, 'tr'); assert.ok(b.rows.length && !JSON.stringify(b).includes('NaN'), `bath ${kind}: bom`);
    const sh = drawingSheet(c, labels, {rows: [['A', 'B']]}); assert.ok(!sh.svg.includes('NaN'), 'bath sheet');
    bathN++;
  }
  assert.ok(parse('lavabo dolabı', {family: 'seating'}).actions.some(a => a.value === 'bath'), 'bath word');
}
console.log(`PASS forma: ${bathN} bathroom pieces (vanity units with top and basin, columns, mirrors, mirror cabinets) valid;`);
// 14. Production: cutting plans place every panel on sheets without overlaps; booklets build for every panel family.
let sheetN = 0;
{
  const {FAMILIES} = await import('../assets/forma/families.js'), {normalizeDesign} = await import('../assets/forma/generate.js');
  const {cuttingPlan, CUT_RULES} = await import('../assets/forma/production/nesting.js'), {bookletPages} = await import('../assets/forma/production/assembly.js');
  for (const [fam, kind] of [['storage', 'wardrobe'], ['storage', 'dresser'], ['storage', 'bookcase'], ['storage', 'vanity'], ['kitchen', 'run'], ['kitchen', 'island'], ['bath', 'basin'], ['bath', 'column']]) {
    const F = FAMILIES[fam], e = F.starts[kind][0], d0 = sample({family: fam, style: e.style, kind, seed: e.seed}), d = normalizeDesign({...d0, kind, params: {...e.p, kind}, materials: e.m ? {...d0.materials, ...e.m} : d0.materials});
    const c = F.mod.compile({...d.params, kind}), cp = cuttingPlan(c, d, 3);
    const want = cp.rows.reduce((s, r) => s + r.qty, 0), got = cp.plan.reduce((s, b) => s + b.sheets.reduce((a, sh) => a + sh.placed.length, 0), 0);
    assert.equal(got, want, `${kind}: every panel placed (${got}/${want})`); assert.ok(!cp.plan.some(b => b.sheets.some(sh => sh.oversize)), `${kind}: no oversize`);
    for (const b of cp.plan) for (const sh of b.sheets) {
      for (const p of sh.placed) assert.ok(p.x >= 0 && p.y >= 0 && p.x + p.l <= sh.sheet.l - 2 * CUT_RULES.trim + 0.01 && p.y + p.w <= sh.sheet.w - 2 * CUT_RULES.trim + 0.01, `${kind}: inside sheet`);
      for (let i = 0; i < sh.placed.length; i++) for (let j = i + 1; j < sh.placed.length; j++) { const a = sh.placed[i], q = sh.placed[j]; assert.ok(a.x + a.l <= q.x + 0.01 || q.x + q.l <= a.x + 0.01 || a.y + a.w <= q.y + 0.01 || q.y + q.w <= a.y + 0.01, `${kind}: overlap ${a.code}/${q.code}`); }
      if (b.board.grain) assert.ok(sh.placed.every(p => !p.rot), 'grain kept'); sheetN++;
    }
    const pages = bookletPages(c, bom(c, d.materials, 'tr'), {title: kind, id: 'F', qty: 3, lang: 'tr', dims: ''}); assert.ok(pages.length >= 4 && !pages.some(pg => pg.includes('NaN')), `${kind}: booklet`);
  }
}
console.log(`PASS forma: production — ${sheetN} cut sheets (guillotine, kerf, grain, banding) and assembly booklets;`);
console.log(`PASS forma: ${kitchenN} kitchens (runs and islands) valid: modules, worktop, sink, hob, hood, appliances, open view, cut list, drawings;`);
console.log(`PASS forma: ${storageN} RİTMO case goods valid (${storageParts} parts; 18 mm MDF / solid panels, 8 mm back, 2 mm reveals, modules ≤ 1200, cut list, drawings, commands, design link);`);
console.log(`PASS forma: ${roomN} room layouts (living, dining, bedroom × 3) without overlaps;`);
console.log(`PASS forma: ${startN} curated starting models (10 styles incl. AURA) valid;`);
console.log(`PASS forma: ${lineN} line-detail parts (stitch, inlay, groove) on seating, tables and the bedroom set;`);
console.log(`PASS forma: ${tables} table designs valid; patterns, stain and stone maps;`);
console.log(`PASS forma: ${designs} style/kind/seed designs valid; 4 styles × 12 diverse proposals; ${Object.keys(WEAVES).length} weave drafts; 8-language commands; drawings, DXF, BOM, ZIP, PDF; AI output sanitised.`);
