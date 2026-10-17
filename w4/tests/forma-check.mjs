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

// 8. Bedroom set: one piece designed, the rest proposed to match; every piece valid, on the floor, finite.
const BR = await import('../assets/forma/bedroom.js');
const SET = await import('../assets/forma/set.js');
const {BEDROOM_STYLES} = await import('../assets/forma/styles-bedroom.js');
const {worldPositions: wp} = await import('../assets/forma/build.js');
let bedroomN = 0;
for (const st of BEDROOM_STYLES) for (const kind of Object.keys(SET.KINDS)) for (let seed = 1; seed <= 2; seed++) {
  const bd = sample({family: 'bedroom', style: st.id, kind, seed});
  for (const view of ['set', 'piece']) {
    const bc = SET.compile({...bd.params, view});
    assert.equal(SET.validate(bc, bd.materials, buildMesh).filter(i => i.level === 'error').length, 0, `${st.id}/${kind}/${seed}/${view}`);
    let floor = Infinity;
    for (const q of bc.parts) { const w = wp(q); assert.ok(w.length && w.every(Number.isFinite), `${st.id}/${kind} ${q.id}`); if (!q.internal && !q.decor) for (let i = 1; i < w.length; i += 3) floor = Math.min(floor, w[i]); }
    assert.ok((floor > -3 && floor < 2) || (view === 'piece' && kind === 'nightstand' && bc.params.nsBase === 'wall'), `${st.id}/${kind}/${seed}/${view} floor ${floor}`);
  }
  const units = new Set(SET.compile({...bd.params, view: 'set'}).parts.map(q => q.unit));
  for (const u of ['bed', 'wardrobe', 'dresser', 'nightstand']) assert.ok(units.has(u), `${st.id} set has ${u}`);
  bedroomN++;
}
// The piece in focus proposes the others.
const hz = SET.harmonize(SET.normalize({headType: 'cane', headShape: 'arch', legType: 'roundTaper', bedBase: 'frame', mirror: 'rect'}), 'bed');
assert.ok(hz.wdDoorStyle === 'cane' && hz.frontStyle === 'cane' && hz.mirror === 'arch' && hz.drBase === 'legs', `bed → set ${JSON.stringify(hz).slice(0, 80)}`);
const hw = SET.harmonize(SET.normalize({wdDoorStyle: 'fluted', wdHandle: 'bar', wdBase: 'legs'}), 'wardrobe');
assert.ok(hw.headType === 'channel' && hw.frontStyle === 'fluted' && hw.pull === 'bar' && hw.nsBase === 'legs', 'wardrobe → set');
{
  const bd = sample({family: 'bedroom', style: 'mid_century_modern', kind: 'wardrobe', seed: 5}), bc = SET.compile(bd.params);
  const sh = drawingSheet(bc, {...labels, mattressTop: 'Top', edgeDetail: 'Edge'}, {rows: [['A', 'B']]});
  assert.ok(!sh.svg.includes('NaN') && !sh.svg.includes('undefined'), 'set sheet');
  assert.ok(drawingDxf(bc).includes('ENTITIES'));
  const bb = bom(bc, bd.materials, 'tr');
  for (const u of ['Gardırop', 'Karyola', 'Komodin', 'Şifonyer']) assert.ok(bb.rows.some(r => r.nameTr.startsWith(u)), `set bom ${u}`);
  const piece = bom(SET.compile({...bd.params, view: 'piece'}), bd.materials, 'tr');
  assert.ok(piece.rows.some(r => r.nameTr.startsWith('Şifonyer')), 'piece view still orders the whole set');
}
const bp = (text, want, family = 'bedroom') => { const a = parse(text, {family}).actions; for (const w of want) assert.ok(a.some(x => Object.entries(w).every(([k, v]) => JSON.stringify(x[k]) === JSON.stringify(v))), `bedroom "${text}" → ${JSON.stringify(a)} lacks ${JSON.stringify(w)}`); };
bp('kemerli kapitone yatak başlığı', [{type: 'family', value: 'bedroom'}, {key: 'headType', value: 'tufted'}, {key: 'headShape', value: 'arch'}], 'seating');
bp('160x200 sandıklı baza', [{type: 'mattress', value: [1600, 2000]}, {key: 'bedBase', value: 'baza'}, {key: 'storage', value: 'lift'}]);
bp('başlığı 10 cm yükselt', [{type: 'delta', key: 'headHeight', value: 100}]);
bp('3 çekmeceli şifonyer, oluklu ön, pirinç halka kulp', [{type: 'kind', value: 'dresser'}, {key: 'frontStyle', value: 'fluted'}, {key: 'pull', value: 'ring'}, {key: 'rows', value: 3}]);
bp('gardırop sürgülü, oluklu kapak, deri kulp', [{type: 'kind', value: 'wardrobe'}, {key: 'wdDoorType', value: 'sliding'}, {key: 'frontStyle', value: 'fluted'}, {key: 'pull', value: 'leather'}]);
bp('makyaj nişli gardırop', [{key: 'wdNiche', value: 'vanity'}]);
bp('Kleiderschrank mit Schiebetüren', [{type: 'family', value: 'bedroom'}, {type: 'kind', value: 'wardrobe'}, {key: 'wdDoorType', value: 'sliding'}], 'table');
bp('cama con cabecero de rejilla', [{key: 'headType', value: 'cane'}]);

// 9. Line details (stitch, inlay, groove): every family draws them as finite meshes; sheets and BOM stay clean.
let lineN = 0;
const lineOk = (c, label) => {
  const ls = c.parts.filter(q => q.line); assert.ok(ls.length, `${label}: no line parts`);
  for (const q of ls) { const m = buildMesh(q); assert.ok(m.positions.length && m.positions.every(Number.isFinite), `${label} ${q.id}`); lineN++; }
};
for (const stitch of ['single', 'double']) for (const seatType of ['split', 'bench', 'tight']) for (const cushionEdge of ['boxed', 'knife', 'bullnose']) lineOk(compile({stitch, seatType, cushionEdge}), `sofa ${stitch}/${seatType}/${cushionEdge}`);
for (const inlay of ['single', 'double', 'groove']) for (const topShape of T.ENUMS.topShape) for (const edge of T.ENUMS.edge) lineOk(T.compile({inlay, topShape, edge}), `table ${inlay}/${topShape}/${edge}`);
for (const headType of ['upholstered', 'wingback', 'framed']) for (const headShape of SET.ENUMS.headShape) lineOk(SET.compile({stitch: 'double', headType, headShape, bedBase: 'baza'}), `bed ${headType}/${headShape}`);
for (const caseLine of ['groove', 'inlay']) lineOk(SET.compile({caseLine, frontStyle: 'flat', wdDoorStyle: 'flat'}), `set ${caseLine}`);
{
  const c = SET.compile({stitch: 'single', caseLine: 'inlay', frontStyle: 'flat', wdDoorStyle: 'flat'}), sh = drawingSheet(c, {...labels, mattressTop: 'Top', edgeDetail: 'Edge'}, {rows: [['A', 'B']]});
  assert.ok(!sh.svg.includes('NaN'), 'line sheet');
  const rowsTr = bom(c, sample({family: 'bedroom', style: 'japandi', kind: 'bed', seed: 1}).materials, 'tr').rows;
  assert.ok(rowsTr.some(r => r.nameTr.endsWith('Dekoratif dikiş')) && rowsTr.some(r => r.nameTr.endsWith('Metal kakma')), 'line BOM rows');
  for (const fam of ['seating', 'table', 'bedroom']) for (let seed = 1; seed <= 3; seed++) { const d = sample({family: fam, seed}); assert.ok(['stitch', 'inlay', 'caseLine'].every(k => d.params[k] === undefined || d.params[k] === 'none'), 'lines start empty'); }
}
{
  const one = (t, family, want) => assert.ok(parse(t, {family}).actions.some(x => Object.entries(want).every(([k, v]) => x[k] === v)), `line command: ${t}`);
  one('çift dikiş', 'seating', {key: 'stitch', value: 'double'}); one('Doppelnaht', 'seating', {key: 'stitch', value: 'double'});
  one('pirinç kakma', 'table', {slot: 'hardware', value: 'brass'}); one('kenarda kanal', 'table', {key: 'inlay', value: 'groove'}); one('filete doble', 'table', {key: 'inlay', value: 'double'});
  one('çekmecelere gölge kanal', 'bedroom', {key: 'caseLine', value: 'groove'}); one('başlığa çift dikiş', 'bedroom', {key: 'stitch', value: 'double'});
  assert.ok(!parse('çekmecelere gölge kanal', {family: 'bedroom'}).actions.some(x => x.key === 'headType'), 'groove is not a channel headboard');
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
console.log(`PASS forma: ${startN} curated starting models (10 styles incl. AURA) valid;`);
console.log(`PASS forma: ${lineN} line-detail parts (stitch, inlay, groove) on seating, tables and the bedroom set;`);
console.log(`PASS forma: ${bedroomN} bedroom sets valid (wardrobe, bed, bedside, chest; set and piece views); matching, drawings, BOM, commands;`);
console.log(`PASS forma: ${tables} table designs valid; patterns, stain and stone maps;`);
console.log(`PASS forma: ${designs} style/kind/seed designs valid; 4 styles × 12 diverse proposals; ${Object.keys(WEAVES).length} weave drafts; 8-language commands; drawings, DXF, BOM, ZIP, PDF; AI output sanitised.`);
