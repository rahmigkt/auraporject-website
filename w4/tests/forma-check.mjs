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

console.log(`PASS forma: ${designs} style/kind/seed designs valid; 4 styles × 12 diverse proposals; ${Object.keys(WEAVES).length} weave drafts; 8-language commands; drawings, DXF, BOM, ZIP, PDF; AI output sanitised.`);
