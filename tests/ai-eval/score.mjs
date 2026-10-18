// AURA command exam scorer. The metric is fixed by the auditor (see knowledge/ai-egitim/ONKAYIT-SINAV-01.md);
// the system under test does not change it.
//   node tests/ai-eval/score.mjs <exam.jsonl> [--system rules | --system preds:<predictions.jsonl>] [--out report.json] [--all] [--ornek]
// Predictions file: one {"id": ..., "actions": [...]} per line (for a model run outside this repo).
// By default only records with label.review === "approved" count; --all scores every record (marked "ön skor").
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, resolve, relative} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '../..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const file = args.find(a => a.endsWith('.jsonl') && args[args.indexOf(a) - 1] !== '--system');
if (!file) { console.error('usage: score.mjs <exam.jsonl> [--system rules|preds:<file>] [--out report.json] [--all]'); process.exit(2); }
const system = opt('--system') || 'rules', all = args.includes('--all');
const CATEGORIES = ['size', 'relative', 'material', 'color', 'part', 'kind', 'family', 'layout', 'negation', 'mixed', 'units', 'colloquial', 'ambiguous', 'offtopic', 'style'];

const raw = readFileSync(file, 'utf8'), records = raw.split('\n').filter(l => l.trim()).map((l, n) => { try { return JSON.parse(l); } catch { throw new Error(`${file}:${n + 1} is not JSON`); } });
// Schema check: every record must be well formed before anything is scored.
const errors = [], ids = new Set();
for (const r of records) {
  const where = r.id || '(no id)';
  if (!r.id || ids.has(r.id)) errors.push(`${where}: missing or duplicate id`); ids.add(r.id);
  if (!/^[a-z]{2}$/.test(r.lang || '')) errors.push(`${where}: lang must be a two-letter code`);
  if (!['dev', 'test', 'ornek'].includes(r.split)) errors.push(`${where}: split must be dev | test | ornek`);
  if (!CATEGORIES.includes(r.category)) errors.push(`${where}: unknown category ${r.category}`);
  if (!r.context?.family) errors.push(`${where}: context.family missing`);
  if (typeof r.text !== 'string' || !r.text.trim()) errors.push(`${where}: empty text`);
  if (!r.gold || !Array.isArray(r.gold.expect) || !Array.isArray(r.gold.forbid || []) || typeof (r.gold.clarify ?? false) !== 'boolean') errors.push(`${where}: gold must have expect[], forbid[], clarify`);
  if (r.gold?.clarify && r.gold.expect.length) errors.push(`${where}: clarify records expect no actions`);
  if (!['unreviewed', 'approved', 'rejected'].includes(r.label?.review)) errors.push(`${where}: label.review must be unreviewed | approved | rejected`);
  if (r.label?.review === 'approved' && !r.label.reviewed_by) errors.push(`${where}: approved without reviewed_by`);
}
if (errors.length) { console.error(`SCHEMA: ${errors.length} error(s)\n` + errors.slice(0, 40).join('\n')); process.exit(1); }

// Freeze check: a test file listed in FREEZE.json must match its hash.
const freezePath = resolve(here, 'FREEZE.json'), sha = createHash('sha256').update(raw).digest('hex'), rel = relative(root, resolve(file));
const frozen = existsSync(freezePath) ? JSON.parse(readFileSync(freezePath, 'utf8')) : {};
const freeze = frozen[rel] ? (frozen[rel].sha256 === sha ? 'donmuş, eşleşiyor' : 'DONMUŞ DOSYA DEĞİŞMİŞ') : 'donmamış';

// System under test.
let predict;
if (system === 'rules') { const {parse} = await import(resolve(root, 'assets/forma/commands.js')); predict = r => parse(r.text, {...r.context}).actions; }
else if (system.startsWith('preds:')) {
  const map = new Map(readFileSync(system.slice(6), 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l)).map(p => [p.id, p.actions || []]));
  predict = r => map.get(r.id) ?? null;
} else { console.error('unknown --system'); process.exit(2); }

const FIELDS = ['type', 'slot', 'key', 'name'];
function matches(pattern, a) {
  for (const f of FIELDS) if (pattern[f] !== undefined && pattern[f] !== a[f]) return false;
  if (pattern.value !== undefined && pattern.value !== a.value) return false;
  if (pattern.range && !(typeof a.value === 'number' && a.value >= pattern.range[0] && a.value <= pattern.range[1])) return false;
  if (pattern.sign && !(typeof a.value === 'number' && Math.sign(a.value) === (pattern.sign === '+' ? 1 : -1))) return false;
  return true;
}
// A family switch that equals the current family is not an action.
const clean = (acts, ctx) => acts.filter(a => !(a.type === 'family' && a.value === ctx.family));

const scored = records.filter(r => (r.split !== 'ornek' || args.includes('--ornek')) && r.label.review !== 'rejected' && (all || r.label.review === 'approved'));
const rows = [];
for (const r of scored) {
  const out = predict(r), missing = out === null, acts = missing ? [] : clean(out, r.context);
  const used = new Set(); let hit = 0;
  for (const e of r.gold.expect) { const i = acts.findIndex((a, k) => !used.has(k) && matches(e, a)); if (i >= 0) { used.add(i); hit++; } }
  const extra = acts.length - used.size, violations = acts.filter(a => (r.gold.forbid || []).some(f => matches(f, a))).length;
  const clarifyOk = r.gold.clarify ? acts.length === 0 : null;
  const exact = !missing && hit === r.gold.expect.length && extra === 0 && violations === 0 && clarifyOk !== false;
  rows.push({id: r.id, lang: r.lang, category: r.category, split: r.split, exact, hit, expected: r.gold.expect.length, extra, violations, forbid: (r.gold.forbid || []).length > 0, clarify: r.gold.clarify ? clarifyOk : null, missing, text: r.text, got: acts});
}
const sum = list => {
  const n = list.length, tp = list.reduce((s, x) => s + x.hit, 0), exp = list.reduce((s, x) => s + x.expected, 0), fp = list.reduce((s, x) => s + x.extra, 0);
  const P = tp + fp ? tp / (tp + fp) : 1, R = exp ? tp / exp : 1, fb = list.filter(x => x.forbid), cl = list.filter(x => x.clarify !== null);
  return {n, exact: n ? +(list.filter(x => x.exact).length / n).toFixed(3) : null, precision: +P.toFixed(3), recall: +R.toFixed(3), f1: +(P + R ? 2 * P * R / (P + R) : 0).toFixed(3),
    forbidViolationRate: fb.length ? +(fb.filter(x => x.violations).length / fb.length).toFixed(3) : null, clarifyAccuracy: cl.length ? +(cl.filter(x => x.clarify).length / cl.length).toFixed(3) : null, missing: list.filter(x => x.missing).length};
};
const group = key => Object.fromEntries([...new Set(rows.map(x => x[key]))].sort().map(k => [k, sum(rows.filter(x => x[key] === k))]));
const report = {file: rel, sha256: sha, freeze, system, mode: all ? 'ön skor (onaysız kayıtlar dahil)' : 'resmi (yalnız onaylı kayıtlar)', date: new Date().toISOString(),
  records: records.length, scored: rows.length, overall: sum(rows), bySplit: group('split'), byLang: group('lang'), byCategory: group('category'), failures: rows.filter(x => !x.exact).map(({id, text, got, hit, expected, extra, violations, clarify}) => ({id, text, got, hit, expected, extra, violations, clarify}))};
if (opt('--out')) writeFileSync(opt('--out'), JSON.stringify(report, null, 2));
const o = report.overall;
console.log(`${rel} · ${report.mode} · ${system} · ${freeze}`);
console.log(`kayıt ${rows.length}/${records.length} · tam doğru ${o.exact} · P ${o.precision} R ${o.recall} F1 ${o.f1} · yasak ihlali ${o.forbidViolationRate} · soru doğruluğu ${o.clarifyAccuracy}${o.missing ? ` · tahminsiz ${o.missing}` : ''}`);
for (const [k, v] of Object.entries(report.byCategory)) console.log(`  ${k.padEnd(11)} n=${String(v.n).padStart(3)} tam ${v.exact} F1 ${v.f1}${v.forbidViolationRate !== null ? ` ihlal ${v.forbidViolationRate}` : ''}`);
