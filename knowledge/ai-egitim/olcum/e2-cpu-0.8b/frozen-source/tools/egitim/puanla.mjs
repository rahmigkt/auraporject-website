// Shared offline grader. Expected data and reviews come from the trusted host,
// NEVER from model output. No exam imports, inference, training or network effects.
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {uygula, SOZLUK, VERSION} from '../studyo-motoru/motor.mjs';
import {strictJSON} from './strict-json.mjs';
export const VERSION_PUAN = 'aura-common-score/1';
export const encode = x => JSON.stringify(x, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
export const sha = x => createHash('sha256').update(x).digest('hex');
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const equal = (a, b) => encode(a) === encode(b);
const component = (status, reasons = []) => ({status, score: status === 'pass' ? 1 : status === 'fail' ? 0 : null, reasons});
function actions(ops) {
  if (!Array.isArray(ops) || ops.length > 20) throw Error('action_limit');
  return ops.map(op => {
    if (!object(op) || typeof op.type !== 'string') throw Error('action_object');
    const layers = Object.keys(SOZLUK).filter(k => Object.hasOwn(SOZLUK[k], op.type));
    if (layers.length !== 1 || op.katman !== undefined && op.katman !== layers[0]) throw Error('unknown_action_or_layer');
    const katman = layers[0];
    if (SOZLUK[katman][op.type].some(k => op[k] == null)) throw Error('missing_required_field');
    return {...op, katman};
  });
}
const clean = r => r.rapor.gecti && r.rapor.red.length === 0 && r.rapor.uyari.length === 0;
// Both pointer observations and H1's [dot.path, value] pairs are accepted.
function get(state, path) {
  if (typeof path !== 'string' || !path) throw Error('observation_path');
  const keys = path.startsWith('/') ? path.slice(1).split('/').map(k => k.replace(/~1/g, '/').replace(/~0/g, '~')) : path.split('.');
  if (keys.some(k => ['__proto__', 'constructor', 'prototype'].includes(k))) throw Error('unsafe_path');
  return keys.reduce((v, k) => v != null && Object.hasOwn(v, k) ? v[k] : undefined, state);
}
// Preserve all persisted state, including IDs, room names and full dimensions.
// Only ordering of plan entities is canonicalized.
function semantic(state) {
  const s = structuredClone(state);
  const plan = p => {
    if (!p) return;
    for (const key of ['walls', 'spaces', 'items', 'openings']) if (Array.isArray(p[key]))
      p[key] = p[key].slice().sort((a, b) => encode(a).localeCompare(encode(b)));
  };
  plan(s.plan); for (const v of Object.values(s.katlar ?? {})) plan(v.plan);
  return s;
}
const stateEqual = (a, b) => equal(semantic(a), semantic(b));
// Solver success alone is insufficient: omitted constraints or reduced product
// sizes can accidentally produce the same layout. Compare the requested payload.
function layoutEqual(actual, gold) {
  const pick = a => a.filter(o => o.type === 'yerlestir').map(o => ({
    oda: o.oda, kat: o.kat ?? 'k0',
    esyalar: (o.esyalar ?? []).map(encode).sort(), kisitlar: (o.kisitlar ?? []).map(encode).sort()
  })).sort((a, b) => encode(a).localeCompare(encode(b)));
  return equal(pick(actual), pick(gold));
}
const lexicon = {
  tr: 'oda odanın ışık sıcaklığını yaptım ölçü ölçüsünü hangi için lütfen salon duvar',
  en: 'the room light temperature changed please which width cannot your',
  de: 'der die das zimmer bitte welche breite kann nicht',
  fr: 'le la les pièce veuillez quelle largeur peux pas',
  es: 'el la los habitación por favor cuál ancho puedo',
  it: 'il lo stanza per favore quale larghezza posso',
  nl: 'de het kamer welke breedte alstublieft niet',
  da: 'værelset rummet hvilken bredde venligst ikke',
  ar: 'الغرفة الإضاءة درجة يرجى لا يمكن عرض ما'
};
function languageCues(reply, lang) {
  const words = new Set(reply.toLocaleLowerCase(lang === 'tr' ? 'tr' : 'und').match(/\p{L}+/gu) ?? []);
  const counts = Object.fromEntries(Object.entries(lexicon).map(([l, s]) => [l, s.split(' ').filter(w => words.has(w)).length]));
  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return {counts, likely_wrong_language: !!lexicon[lang] && winner[0] !== lang && winner[1] >= 3 && winner[1] >= (counts[lang] ?? 0) + 2};
}
export function reviewBinding(input) {
  return sha(encode({text: input.text, state: input.state, expected: input.expected, language: input.language, user: input.user ?? '', generation: input.generation ?? null}));
}
export function puanla(input) {
  const {text, state, expected, language, user = '', review} = input;
  if (!object(state) || !object(expected) || typeof language !== 'string' || !Object.hasOwn(lexicon, language)
    || !['apply', 'clarify', 'refuse', 'studio_redirect'].includes(expected.intent)) throw Error('trusted_input_contract');
  const c = Object.fromEntries(['bicim', 'motor', 'istek', 'durustluk', 'dil', 'kisalik'].map(k => [k, component('review', ['not_assessed'])]));
  const diagnostics = {language_is_heuristic: true, full_optional_action_schema_validated: false, generation: input.generation ?? null};
  const result = {id: input.id ?? null, version: VERSION_PUAN, official: false, engine_version: VERSION, input_sha256: reviewBinding(input), components: c, diagnostics,
    training_approved: false, semantic_review_required: true};
  const finish = () => {
    // Equal weights fixed for this version; no optimization on closed exam scores.
    const values = Object.values(c);
    result.score_lower_bound = values.reduce((s, v) => s + (v.score ?? 0), 0) / 6;
    result.score_upper_bound = values.reduce((s, v) => s + (v.score ?? 1), 0) / 6;
    result.mechanical_candidate = ['bicim', 'motor', 'istek', 'kisalik'].every(k => c[k].status === 'pass')
      && !values.some(v => v.status === 'fail') && !input.generation?.truncated
      && (!input.generation || input.generation.status === 'ok');
    result.review_required = values.some(v => v.status === 'review');
    return result;
  };
  let parsed, ops;
  try {
    parsed = strictJSON(text);
    if (!object(parsed) || !equal(Object.keys(parsed).sort(), ['actions', 'reply']) || typeof parsed.reply !== 'string'
      || !parsed.reply.trim()) throw Error('reply_actions_contract');
    ops = actions(parsed.actions); c.bicim = component('pass');
  } catch (e) { c.bicim = component('fail', [e.message]); return finish(); }
  let actual, baseline;
  try {
    actual = uygula(state, ops); baseline = uygula(state, []);
    c.motor = component(clean(actual) ? 'pass' : 'fail', clean(actual) ? [] : ['engine_rejection_or_warning']);
    diagnostics.engine_report = actual.rapor;
  } catch (e) { c.motor = component('fail', ['engine_exception']); diagnostics.engine_error = e.message; return finish(); }
  const failures = [];
  if (expected.intent === 'apply') {
    if (!ops.length || stateEqual(actual.state, baseline.state)) failures.push('empty_or_noop');
    let observations;
    try {
      observations = Array.isArray(expected.observations) ? expected.observations : Object.entries(expected.observations ?? {});
      if (observations.some(pair => !Array.isArray(pair) || pair.length !== 2 || typeof pair[0] !== 'string' || pair[1] === undefined))
        throw Error('observation_pair');
      diagnostics.observations = observations.map(([p, want]) => ({path: p, matched: equal(get(actual.state, p), want)}));
      if (diagnostics.observations.some(o => !o.matched)) failures.push('unmet_observation');
    } catch { failures.push('invalid_expectation'); }
    if (!Array.isArray(expected.actions) || expected.actions.length === 0) {
      // Observation subsets cannot prove absence of unrelated changes.
      c.istek = component(failures.length ? 'fail' : 'review', [...failures, 'complete_reference_actions_required']);
    } else {
      try {
        const goldOps = actions(expected.actions), gold = uygula(state, goldOps);
        if (!clean(gold)) failures.push('reference_engine_not_clean');
        if (!stateEqual(actual.state, gold.state)) failures.push('unrequested_or_different_state');
        if (!layoutEqual(ops, goldOps)) failures.push('layout_items_dimensions_or_constraints_changed');
        c.istek = component(failures.length ? 'fail' : 'pass', failures);
      } catch { c.istek = component('fail', ['invalid_reference_actions']); }
    }
  } else {
    c.istek = component(ops.length ? 'fail' : 'review', [ops.length ? 'nonaction_intent_has_actions' : 'reply_semantics_require_review']);
    if (expected.intent === 'studio_redirect' && (typeof expected.route?.url !== 'string' || !expected.route.url.trim() || !parsed.reply.includes(expected.route.url)))
      c.istek = component('fail', ['missing_studio_route']);
  }
  const repeated = ops.length - new Set(ops.map(encode)).size;
  const redundant = [];
  if (clean(actual)) for (let i = 0; i < ops.length; i++) {
    try {
      const omitted = uygula(state, ops.filter((_, n) => n !== i));
      if (clean(omitted) && stateEqual(actual.state, omitted.state)) redundant.push(i);
    } catch { /* removing a dependency is not redundancy */ }
  }
  const sentences = parsed.reply.toLowerCase().split(/[.!?؟\n]+/).map(s => s.trim()).filter(s => s.length >= 12);
  const counts = sentences.map(s => sentences.filter(t => t === s).length);
  const words = parsed.reply.toLowerCase().match(/\p{L}+/gu) ?? [], grams = new Map();
  for (let i = 0; i + 10 <= words.length; i++) { const k = words.slice(i, i + 10).join(' '); grams.set(k, (grams.get(k) ?? 0) + 1); }
  const repeatedReply = Math.max(0, ...counts) >= 3 || Math.max(0, ...grams.values()) >= 5;
  diagnostics.duplicate_actions = repeated; diagnostics.redundant_actions = redundant;
  diagnostics.reply_repeated = repeatedReply;
  const brevity = [];
  if (repeated || redundant.length) brevity.push('duplicate_or_unnecessary_action');
  if (repeatedReply) brevity.push('repeated_reply');
  if (parsed.reply.length > 1200) brevity.push('reply_over_1200_characters');
  c.kisalik = component(brevity.length ? 'fail' : 'pass', brevity);
  const cues = languageCues(parsed.reply, language); diagnostics.language = cues;
  const internal = /adsız oda|yerleştirilen eşya sayısı|elle konum|boundary_xy_mm|katman:|SOZLUK/i.test(parsed.reply);
  c.dil = component(internal || cues.likely_wrong_language ? 'fail' : 'review', [internal ? 'internal_terms' : cues.likely_wrong_language ? 'wrong_language_cues' : 'native_review_required']);
  // Cues are diagnostics only: a negated delivery phrase must never be promoted
  // to a verified false claim. All factual prose still needs semantic review.
  diagnostics.delivery_mention = /email|e-?posta|whatsapp|delivered|gönderildi|gönderdim|إرسال/i.test(parsed.reply);
  diagnostics.request_echo = user.trim() !== '' && parsed.reply.trim().toLowerCase() === user.trim().toLowerCase();
  c.durustluk = component(expected.intent !== 'apply' && ops.length ? 'fail' : 'review',
    [expected.intent !== 'apply' && ops.length ? 'unsupported_execution' : 'factual_and_nonaction_semantics_require_review']);
  // A trusted external human review can resolve language/honesty/nonaction intent;
  // it cannot erase a machine failure and must bind this exact input/expectation.
  if (review) {
    if (review.input_sha256 !== result.input_sha256 || typeof review.reviewer !== 'string' || !review.reviewer.trim())
      diagnostics.review_rejected = 'missing_reviewer_or_binding_mismatch';
    else {
      for (const k of ['dil', 'durustluk', ...(expected.intent === 'apply' ? [] : ['istek'])])
        if (c[k].status === 'review' && ['pass', 'fail'].includes(review[k])) c[k] = component(review[k], ['trusted_host_review']);
      result.review = review;
    }
  }
  return finish();
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  // One trusted request per JSONL record; stdout is data only for E2/E3 adapters.
  const file = process.argv[2]; if (!file) throw Error('Usage: node tools/egitim/puanla.mjs trusted-input.jsonl');
  const rows = readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  for (const row of rows) console.log(JSON.stringify(puanla(JSON.parse(row))));
}
