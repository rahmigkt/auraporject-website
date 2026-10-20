import {createHash} from 'node:crypto';
import {FAMILIES} from '../../assets/forma/families.js';
import {compileDesign, sample} from '../../assets/forma/generate.js';
import {buildMesh, worldPositions} from '../../assets/forma/build.js';
import {analyse} from '../../assets/forma/physics.js';

export const VERSION = 'aura.qwen-local.pilot/1';
export const hash = value => createHash('sha256').update(value).digest('hex');
export const json = value => JSON.stringify(value, null, 2) + '\n';
export const SYSTEM = 'AURA ön denetimi. Yalnız JSON döndür: {decision,issues}. issues: {code,level} dizisi. Hata varsa reject, yalnız uyarı varsa review, aksi halde pass_advisory. Bu sonuç üretim onayı değildir.';

// Reject malformed raw inputs before the engine can silently normalise them.
export function inspect(design) {
  const family = FAMILIES[design?.family];
  if (!family || !design.params || typeof design.params !== 'object') throw Error('Unknown family or missing params');
  for (const [key, value] of Object.entries(design.params)) {
    const range = family.mod.RANGES[key], choices = family.mod.ENUMS[key];
    if (range && (typeof value !== 'number' || !Number.isFinite(value) || value < range[0] || value > range[1])) throw Error(`Out of range: ${key}`);
    if (choices && !choices.includes(value)) throw Error(`Unknown enum: ${key}`);
  }
  const compiled = compileDesign(design);
  if (!compiled.parts.length) throw Error('Empty geometry');
  for (const part of compiled.parts.filter(p => !p.line && !p.planOnly)) {
    const mesh = buildMesh(part), world = worldPositions(part);
    if (!mesh.indices?.length || !world.length || !Array.from(world).every(Number.isFinite)) throw Error(`Invalid mesh: ${part.id}`);
    if (!Array.from(mesh.indices).every(i => Number.isInteger(i) && i >= 0 && i < mesh.positions.length / 3)) throw Error(`Invalid indices: ${part.id}`);
  }
  const physics = analyse(compiled, design.materials, design.family);
  if (!Number.isFinite(physics.mass) || !physics.com.every(Number.isFinite)) throw Error('Non-finite physics');
  const checks = [...family.mod.validate(compiled), ...physics.checks];
  const issues = [...new Map(checks.filter(c => c.level !== 'ok').map(c => {
    const issue = {code: c.code || c.key || c.type || 'engine-warning', level: c.level};
    return [JSON.stringify(issue), issue];
  })).values()].sort((a, b) => a.code.localeCompare(b.code) || a.level.localeCompare(b.level));
  return {decision: issues.some(c => c.level === 'error') ? 'reject' : issues.length ? 'review' : 'pass_advisory', issues};
}

export function records() {
  const result = [], rejected = [];
  // Keep whole family/kind/style groups together; seed variations never cross splits.
  for (const id of ['seating', 'table', 'storage', 'kitchen', 'bath']) {
    const family = FAMILIES[id];
    for (const [styleIndex, style] of family.styles.slice(0, 3).entries()) {
      const group = `${id}/${family.defaultKind}/${style.id}`;
      const split = ['train', 'dev', 'test'][styleIndex];
      for (let seed = 1; seed <= 3; seed++) {
        const design = sample({family: id, kind: family.defaultKind, style: style.id, seed});
        try {
          const expected = inspect(design);
          result.push({schema: VERSION, id: hash(`${VERSION}/${group}/${seed}`).slice(0, 20), group, split,
            task: 'engine_audit', lang: 'tr', review: 'unreviewed', labelSource: 'deterministic-engine',
            provenance: {generator: 'AURA sample', seed, externalData: false}, input: design, expected});
        } catch (error) { rejected.push({group, seed, reason: error.message}); }
      }
    }
  }
  return {result, rejected};
}

export function score(rows, predictions) {
  const ids = new Set(rows.map(r => r.id)), seen = new Set();
  for (const p of predictions) {
    if (!ids.has(p.id) || seen.has(p.id)) throw Error(`Unknown or duplicate prediction: ${p.id}`);
    seen.add(p.id);
  }
  const byId = new Map(predictions.map(p => [p.id, p.output]));
  let exact = 0, decisions = 0, falsePass = 0;
  for (const row of rows) {
    const p = byId.get(row.id);
    if (p?.decision === row.expected.decision) decisions++;
    if (p?.decision === 'pass_advisory' && row.expected.decision !== 'pass_advisory') falsePass++;
    const normal = p && Array.isArray(p.issues) ? {...p, issues: p.issues.slice().sort((a,b) => String(a.code).localeCompare(String(b.code)) || String(a.level).localeCompare(String(b.level)))} : null;
    if (normal?.decision === row.expected.decision && JSON.stringify(normal.issues) === JSON.stringify(row.expected.issues)) exact++;
  }
  return {status: 'provisional_unreviewed', total: rows.length, received: predictions.length, missing: rows.length - seen.size,
    exact, decisions, falsePass, exactRate: rows.length ? exact / rows.length : null,
    limitation: 'Engine imitation only; no aesthetic, engineering certification, command or vision score.'};
}
