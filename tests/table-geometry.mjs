// Geometry integrity for every table: supports under the top, touching it, on the floor, all parts connected.
import {compile, KINDS, ENUMS, edgeProfile} from '../assets/forma/table.js';
import {buildMesh} from '../assets/forma/build.js';
import {transformPositions} from '../assets/forma/mesh.js';
import {sample} from '../assets/forma/generate.js';
import {TABLE_STYLES} from '../assets/forma/styles-table.js';

function inside(poly, x, z) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; }
function edgeDist(poly, x, z) { let d = Infinity; for (let i = 0; i < poly.length; i++) { const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % poly.length], ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1, t = Math.max(0, Math.min(1, ((x - ax) * ex + (z - az) * ez) / l2)); d = Math.min(d, Math.hypot(x - ax - t * ex, z - az - t * ez)); } return d; }
const TOUCH = new Set(['apron', 'trestle-bearer', 'frame-rail', 'column', 'end-panel', 'mount-plate', 'drum']);

export function checkTable(params) {
  const c = compile(params), p = c.params, yu = c.meta.yu, problems = [];
  const tops = c.parts.filter(q => q.role === 'top' || q.role === 'leaf');
  const outline = c.meta.open ? null : tops[0].geom.outline;
  const under = edgeProfile(p.edge, p.topThickness, p.edgeSize)(1) || 0;
  const boxes = [];
  let floor = Infinity;
  for (const q of c.parts) {
    if (q.role === 'top' || q.role === 'leaf' || q.role === 'grommet') continue;
    const w = transformPositions(buildMesh(q).positions, q.pos, q.rot);
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], outside = 0;
    for (let i = 0; i < w.length; i += 3) {
      for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], w[i + k]); mx[k] = Math.max(mx[k], w[i + k]); }
      if (outline && q.role !== 'pull' && q.mat !== 'top' && (!inside(outline, w[i], w[i + 2]) || edgeDist(outline, w[i], w[i + 2]) < under - 1)) outside++;
    }
    if (outside) problems.push(`${q.id} outside the top (${outside} pts)`);
    if (mx[1] > yu + Math.max(2.5, p.topThickness * 0.4) && !q.internal) problems.push(`${q.id} pierces the top (${(mx[1] - yu).toFixed(1)} mm)`);
    if (!q.internal) floor = Math.min(floor, mn[1]);
    const touch = TOUCH.has(q.role) || (q.role === 'leg' && !q.id.startsWith('trestle'));
    if (touch && !q.internal && mx[1] < yu - 1.5) problems.push(`${q.id} stops ${(yu - mx[1]).toFixed(1)} mm below the top`);
    if (!q.internal) boxes.push({id: q.id, mn, mx, touch: mx[1] >= yu - 1.5});
  }
  if (floor < -4 || floor > 1) problems.push(`floor at ${floor.toFixed(1)}`);
  // Connectivity through overlapping boxes (3 mm tolerance), starting from parts touching the top.
  const ov = (a, b) => [0, 1, 2].every(k => a.mn[k] <= b.mx[k] + 3 && b.mn[k] <= a.mx[k] + 3);
  const seen = new Set(boxes.filter(b => b.touch).map(b => b.id)), queue = boxes.filter(b => b.touch);
  if (!queue.length) problems.push('nothing touches the top');
  while (queue.length) { const a = queue.pop(); for (const b of boxes) if (!seen.has(b.id) && ov(a, b)) { seen.add(b.id); queue.push(b); } }
  for (const b of boxes) if (!seen.has(b.id)) problems.push(`${b.id} floats`);
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let n = 0, bad = 0; const seen = {};
  const report = (tag, pr) => { n++; if (pr.length) { bad++; const k = tag.split(' ')[0] + ' ' + pr[0].replace(/[\d.]+/g, '#'); if (!seen[k]) { seen[k] = 1; console.log(tag, pr.slice(0, 3).join(' | ')); } } };
  for (const st of TABLE_STYLES) for (const kind of Object.keys(KINDS)) for (let seed = 1; seed <= 6; seed++) { const d = sample({family: 'table', style: st.id, kind, seed}); report(`${d.params.baseType}/${d.params.topShape} ${st.id}/${kind}/${seed}`, checkTable({...d.params, kind})); }
  // Every shape × base × leg type with demanding settings.
  for (const kind of ['dining', 'coffee', 'side', 'console', 'desk']) for (const topShape of ENUMS.topShape) for (const baseType of ENUMS.baseType) for (const legType of ENUMS.legType) for (const edge of ['square', 'underbevel', 'bullnose']) {
    const k = KINDS[kind], params = {kind, topShape, baseType, legType, edge, length: k.length[1], width: k.width[1], height: k.height[0], overhang: 40, sideOverhang: 20, legSplay: 8, legSize: 70, columnSize: 400, footSpread: 0.95, shelf: 'solid', stretcher: 'H', pedestalType: 'tulip', topThickness: 40, edgeSize: 30, cornerRadius: 300, boatBow: 0.2};
    report(`${baseType}/${topShape}/${legType}/${edge} ${kind}`, checkTable(params));
  }
  console.log(`${bad} of ${n} tables with geometry problems`);
  process.exit(bad ? 1 : 0);
}
