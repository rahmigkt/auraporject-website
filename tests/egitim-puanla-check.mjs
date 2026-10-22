// Fresh synthetic development cases. No frozen exam records or model responses.
import assert from 'node:assert/strict';
import {puanla, reviewBinding, encode} from '../tools/egitim/puanla.mjs';
import {strictJSON} from '../tools/egitim/strict-json.mjs';
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const state = {plan: {walls: [{id: 'dev-wall', from_xy_mm: [0, 0], to_xy_mm: [6100, 0], thickness: 180}],
  openings: [], spaces: [{id: 'dev-lounge', name: 'Deneme alanı', kind: 'living', boundary_xy_mm: [[0, 0], [6100, 0], [6100, 4700], [0, 4700]]}], items: []}};
const op = {type: 'isik', oda: 'dev-lounge', renk_k: 3100};
const input = {state, language: 'tr', user: 'Deneme alanındaki ışığı 3100 kelvine ayarla.',
  expected: {intent: 'apply', actions: [op], observations: {'/aydinlatma/dev-lounge/renk_k': 3100}},
  text: JSON.stringify({reply: 'Işık sıcaklığını değiştirdim.', actions: [op]})};
let checks = 0; const cases = [];
function test(name, fn) { fn(); checks++; cases.push(name); }
const run = (actions, reply = 'Işık sıcaklığını değiştirdim.', patch = {}) => puanla({...input, ...patch, text: JSON.stringify({reply, actions})});
const fails = (r, k) => assert.equal(r.components[k].status, 'fail');
test('positive real engine operation; no automatic native/training approval', () => {
  const before = encode(state), r = puanla(input);
  for (const k of ['bicim', 'motor', 'istek', 'kisalik']) assert.equal(r.components[k].status, 'pass', k);
  assert.equal(r.mechanical_candidate, true); assert.equal(r.review_required, true);
  assert.equal(r.components.dil.score, null); assert.equal(r.training_approved, false); assert.equal(encode(state), before);
});
test('empty actions fail request despite clean engine', () => { const r = run([]); fails(r, 'istek'); assert.equal(r.components.motor.status, 'pass'); });
test('echo without operations fails', () => { const r = run([], input.user); fails(r, 'istek'); assert.equal(r.diagnostics.request_echo, true); });
test('five repeated operations fail brevity', () => { const r = run(Array(5).fill(op)); fails(r, 'kisalik'); assert.equal(r.mechanical_candidate, false); });
test('wrong language fails', () => fails(run([op], 'The room light temperature changed.'), 'dil'));
test('invented room fails engine and request', () => { const r = run([{...op, oda: 'imagined-room'}]); fails(r, 'motor'); fails(r, 'istek'); });
test('unrequested room name fails whole-state comparison', () => fails(run([op, {type: 'oda_tanimla', id: 'dev-lounge', ad: 'Invented'}]), 'istek'));
test('ignored reference observations cannot override mismatch', () => fails(run([{...op, renk_k: 3200}]), 'istek'));
test('H1 dot-path pair adapter', () => { const r = run([op], undefined, {expected: {...input.expected, observations: [['aydinlatma.dev-lounge.renk_k', 3100]]}}); assert.equal(r.components.istek.status, 'pass'); });
test('observation-only input requires review, never full request proof', () => { const r = run([op], undefined, {expected: {intent: 'apply', observations: input.expected.observations}}); assert.equal(r.components.istek.status, 'review'); assert.equal(r.mechanical_candidate, false); });
test('engine warning fails even when engine gecti is true', () => {
  const a = {type: 'oda_tanimla', id: 'dev-lounge', kose: [[0,0],[1000,0],[1000,1000],[0,1000]]};
  fails(run([a], undefined, {expected: {intent: 'apply', actions: [a]}}), 'motor');
});
test('same effect alternative JSON key order supported', () => assert.equal(run([{renk_k: 3100, oda: 'dev-lounge', type: 'isik', katman: 'aydinlatma'}]).components.istek.status, 'pass'));
test('legitimate distinct actions are not duplicate operations', () => {
  const a = {...op, tur: 'lambader', adet: 2}, b = {...op, renk_k: undefined, tur: 'tavan', adet: 3};
  const r = run([a, b], undefined, {expected: {intent: 'apply', actions: [a, b]}});
  assert.equal(r.components.kisalik.status, 'pass'); assert.equal(r.components.istek.status, 'pass');
});
test('overwritten operation is unnecessary even if not identical', () => fails(run([{...op, renk_k: 3200}, op]), 'kisalik'));
test('reply sentence loop fails', () => fails(run([op], 'Işık sıcaklığını değiştirdim. '.repeat(3)), 'kisalik'));
test('word loop without punctuation fails', () => fails(run([op], 'bu odada istediğiniz ışık sıcaklığını yeni bir değer ile değiştirdim '.repeat(7)), 'kisalik'));
test('internal terms fail language component', () => fails(run([op], 'boundary_xy_mm bilgisini değiştirdim.'), 'dil'));
test('nonaction intent cannot execute', () => { const r = run([op], undefined, {expected: {intent: 'clarify'}}); fails(r, 'istek'); fails(r, 'durustluk'); });
test('asking missing measurement stays semantic review, not regex approval', () => {
  const r = run([], 'Hangi ölçüyü kullanmalıyım?', {expected: {intent: 'clarify'}});
  assert.equal(r.components.istek.status, 'review'); assert.equal(r.components.durustluk.status, 'review');
});
test('no-fit explanation stays review; dimensions never silently changed', () => {
  const r = run([], 'Bu ölçüyle sığmıyor; farklı bir ölçü ister misiniz?', {expected: {intent: 'refuse', reason: 'no_fit'}});
  assert.equal(r.components.durustluk.status, 'review');
});
test('studio redirect requires route and no furniture operation', () => {
  const expected = {intent: 'studio_redirect', route: {url: '/tasarla.html'}};
  fails(run([], 'Stüdyoyu kullanın.', {expected}), 'istek');
  assert.equal(run([], 'Mobilya detayını /tasarla.html sayfasında düzenleyin.', {expected}).components.istek.status, 'review');
});
test('negated delivery mention is not counted as a false claim', () => {
  const r = run([], 'I cannot claim a real email was sent.', {language: 'en', expected: {intent: 'refuse'}});
  assert.equal(r.diagnostics.delivery_mention, true); assert.equal(r.components.durustluk.status, 'review');
});
test('affirmative delivery mention also needs semantic review, never automated truth', () => assert.equal(run([op], 'I sent the email.', {language: 'en'}).components.durustluk.status, 'review'));
test('review binds exact input and cannot erase machine failure', () => {
  const review = {reviewer: 'synthetic-test-reviewer', input_sha256: reviewBinding(input), dil: 'pass', durustluk: 'pass'};
  assert.equal(puanla({...input, review}).components.dil.status, 'pass');
  assert.equal(puanla({...input, text: input.text + ' ', review}).diagnostics.review_rejected, 'missing_reviewer_or_binding_mismatch');
  const bad = {...input, text: JSON.stringify({reply: 'The room light temperature changed.', actions: [op]})};
  fails(puanla({...bad, review: {...review, input_sha256: reviewBinding(bad)}}), 'dil');
});
test('review fields in model envelope rejected', () => fails(puanla({...input, text: JSON.stringify({reply: 'Işık değişti.', actions: [op], review: {dil: 'pass'}})}), 'bicim'));
for (const [name, text] of Object.entries({fence: '```json\n{}\n```', duplicate: '{"reply":"a","reply":"b","actions":[]}',
  unsafe: '{"reply":"a","actions":[],"__proto__":{}}', infinity: '{"reply":"a","actions":[{"value":1e999}]}',
  trailing: '{"reply":"a","actions":[]} more', emptyReply: '{"reply":" ","actions":[]}', extra: '{"reply":"a","actions":[],"x":1}'}))
  test('strict JSON: ' + name, () => fails(puanla({...input, text}), 'bicim'));
test('depth and size bounded', () => { assert.throws(() => strictJSON('['.repeat(40) + '0' + ']'.repeat(40))); assert.throws(() => strictJSON(' '.repeat(200001))); });
test('unknown operation and wrong layer rejected', () => { fails(run([{type: 'invented'}]), 'bicim'); fails(run([{...op, katman: 'ev'}]), 'bicim'); });
test('required field missing rejected', () => fails(run([{type: 'isik'}]), 'bicim'));
test('invalid language input fails closed', () => assert.throws(() => puanla({...input, language: 'xx'}), /trusted_input_contract/));
test('malformed expectation and unsafe paths fail closed', () => {
  for (const observations of [[['not-a-complete-pair']], [['__proto__.x', 1]]])
    fails(run([op], undefined, {expected: {...input.expected, observations}}), 'istek');
});
test('truncation and transfer failure stay separate from valid JSON', () => {
  for (const generation of [{condition: 'raw', status: 'ok', truncated: true}, {condition: 'schema', status: 'error', truncated: false}]) {
    const r = puanla({...input, generation}); assert.equal(r.components.bicim.status, 'pass'); assert.equal(r.mechanical_candidate, false);
    assert.deepEqual(r.diagnostics.generation, generation);
  }
});
for (const [language, reply] of Object.entries({tr: 'Işık sıcaklığını değiştirdim.', en: 'The room light temperature changed.',
  de: 'Die Temperatur im Zimmer wurde geändert.', fr: 'La lumière de la pièce a changé.', es: 'La temperatura de la habitación ha cambiado.',
  it: 'La temperatura della stanza è cambiata.', nl: 'De temperatuur in de kamer is veranderd.', da: 'Temperaturen i rummet er ændret.', ar: 'تم تغيير درجة الإضاءة في الغرفة.'}))
  test('native confirmation still pending: ' + language, () => assert.equal(run([op], reply, {language}).components.dil.status, 'review'));
// Exact product dimensions and constraint payloads: use fresh solver scenarios.
const place = {type: 'yerlestir', oda: 'dev-lounge', esyalar: [{id: 'dev-chair', tur: 'berjer', en: 817, derinlik: 773}]};
test('real layout positive', () => { const r = run([place], 'Odaya yerleştirdim.', {expected: {intent: 'apply', actions: [place]}}); assert.equal(r.components.motor.status, 'pass'); assert.equal(r.components.istek.status, 'pass'); });
test('silent product width reduction fails', () => {
  const small = {...place, esyalar: [{...place.esyalar[0], en: 701}]};
  fails(run([small], 'Odaya yerleştirdim.', {expected: {intent: 'apply', actions: [place]}}), 'istek');
});
test('missing constraint cannot pass by accidental layout match', () => {
  const gold = {...place, esyalar: [...place.esyalar, {id: 'dev-side', tur: 'yan_sehpa', en: 433, derinlik: 421}],
    kisitlar: [{tur: 'yakin', a: 'dev-chair', b: 'dev-side', mm: 10000}]};
  const {kisitlar, ...without} = gold;
  const r = run([without], 'Odaya yerleştirdim.', {expected: {intent: 'apply', actions: [gold]}});
  fails(r, 'istek'); assert(r.components.istek.reasons.includes('layout_items_dimensions_or_constraints_changed'));
});
test('JSONL CLI preserves IDs and raw/schema separation', () => {
  mkdirSync('work/e1-tests', {recursive: true});
  const file = 'work/e1-tests/cli.jsonl';
  writeFileSync(file, ['raw', 'schema'].map(condition => JSON.stringify({...input, id: 'dev-' + condition,
    generation: {condition, status: 'ok', truncated: false}})).join('\n') + '\n');
  const p = spawnSync(process.execPath, ['tools/egitim/puanla.mjs', resolve(file)], {encoding: 'utf8', windowsHide: true});
  assert.equal(p.status, 0, p.stderr);
  const rows = p.stdout.trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map(r => r.id), ['dev-raw', 'dev-schema']);
  assert.deepEqual(rows.map(r => r.diagnostics.generation.condition), ['raw', 'schema']);
  assert(rows.every(r => !r.training_approved && r.mechanical_candidate));
});
console.log(JSON.stringify({suite: 'E1 fresh synthetic development', checks, cases, model_run: false, training_started: false}));
