// Client for the optional server AI (api/forma-ai.php). The site works fully without it:
// typed/spoken commands are parsed locally first; only unparsed requests and image reading use the AI.
import {normalizeDesign, sample} from './generate.js';
import {RANGES, ENUMS} from './sofa.js';
import {STYLE_BY_ID} from './styles.js';
import {COLORS, FIBERS, WEAVES, PATTERNS, WOODS, FINISHES, METALS, STAINS, STONES, GLASS, SURFACES, SINK_FINISHES} from './catalog.js';
import {FAMILIES} from './families.js';

const ENDPOINT = 'api/forma-ai.php';
let status = null;

export async function aiStatus() {
  if (status) return status;
  try {
    const r = await fetch(`${ENDPOINT}?action=health`, {cache: 'no-store'});
    const j = r.ok ? await r.json() : null;
    status = {available: !!j?.available, vision: !!j?.vision};
  } catch { status = {available: false, vision: false}; }
  return status;
}

async function call(action, body) {
  const r = await fetch(`${ENDPOINT}?action=${action}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) throw Error(j?.error || `AI ${r.status}`);
  return j;
}

/** Options for one material key (slot-aware: a metal or sink finish is not a wood finish). */
const OPTIONS = (slot, key) => ({fiber: FIBERS, weave: WEAVES, pattern: PATTERNS, color: COLORS, color2: COLORS, species: WOODS, stain: STAINS, stone: STONES, glass: GLASS, surface: SURFACES, metal: METALS,
  polish: {honed: 1, polished: 1}, finish: slot === 'metal' ? METALS : slot === 'sink' ? Object.fromEntries(SINK_FINISHES.map(k => [k, 1])) : FINISHES})[key];
/** Schema the server passes to the model for the design in hand, so it can only answer with known values. */
export function vocabulary(design = {family: 'seating', kind: 'sofa', materials: {}}) {
  const fam = FAMILIES[design.family] || FAMILIES.seating, mod = fam.mod, p = {kind: design.kind, ...(design.params || {})};
  const params = Object.fromEntries(Object.keys(mod.RANGES || {}).map(k => { const [lo, hi] = mod.rangeFor ? mod.rangeFor(k, p) : mod.RANGES[k]; return [k, [lo, hi]]; }));
  const materials = {};
  const mats = design.materials && Object.keys(design.materials).length ? design.materials : sample({family: fam.id, kind: design.kind}).materials;
  for (const [slot, spec] of Object.entries(mats)) for (const key of Object.keys(spec || {})) { const o = OPTIONS(slot, key); if (o) (materials[slot] ??= {})[key] = Object.keys(o); }
  return {family: fam.id, params, enums: mod.ENUMS || {}, styles: fam.styles.map(s => s.id), kinds: Object.keys(fam.kinds), materials};
}

/** Free-text edit → validated actions (same format as commands.parse). */
export async function interpret(text, design, lang) {
  const v = vocabulary(design);
  const j = await call('command', {text: String(text).slice(0, 600), lang, design: {family: design.family, kind: design.kind, style: design.style, params: design.params, materials: design.materials}, vocabulary: v});
  return sanitizeActions(j.actions || [], v);
}

export function sanitizeActions(list, v = vocabulary()) {
  const out = [];
  for (const a of Array.isArray(list) ? list.slice(0, 20) : []) {
    if (!a || typeof a !== 'object') continue;
    if ((a.type === 'set' || a.type === 'delta') && typeof a.key === 'string' && Object.hasOwn(v.params, a.key) && Number.isFinite(+a.value)) out.push({type: a.type, key: a.key, value: +a.value});
    else if (a.type === 'enum' && typeof a.key === 'string' && Object.hasOwn(v.enums, a.key) && v.enums[a.key].includes(a.value)) out.push({type: 'enum', key: a.key, value: a.value});
    else if (a.type === 'style' && v.styles.includes(a.value)) out.push({type: 'style', value: a.value});
    else if (a.type === 'kind' && v.kinds.includes(a.value)) out.push({type: 'kind', value: a.value});
    else if (a.type === 'material' && typeof a.slot === 'string' && typeof a.key === 'string' && Object.hasOwn(v.materials, a.slot) && Object.hasOwn(v.materials[a.slot], a.key) && v.materials[a.slot][a.key].includes(a.value)) out.push({type: 'material', slot: a.slot, key: a.key, value: a.value});
  }
  return out;
}

/**
 * Photo or sketch → editable parametric design. The model reads the image with the FDE part vocabulary and
 * answers only with known part types and ranges; dimensions it cannot see are marked as estimates.
 */
export async function designFromImage(dataUrl, lang) {
  const j = await call('vision', {image: dataUrl, lang, vocabulary: vocabulary(sample({family: 'seating', kind: 'sofa'}))});
  return mapVisionToDesign(j.design || {});
}

/** Map a model reading onto a valid design: unknown values fall back to a style sample. */
export function mapVisionToDesign(read) {
  const style = STYLE_BY_ID[read.style] ? read.style : 'japandi', kind = ['sofa', 'loveseat', 'armchair'].includes(read.kind) ? read.kind : 'sofa';
  const base = sample({style, kind, seed: 7});
  const params = {...base.params}, estimated = [];
  for (const [k, val] of Object.entries(read.params || {})) {
    if (RANGES[k] && Number.isFinite(+val)) params[k] = +val;
    else if (ENUMS[k]?.includes(val)) params[k] = val;
  }
  for (const k of ['width', 'depth', 'height', 'seatHeight', 'armHeight']) if (!(read.measured || []).includes(k)) estimated.push(k);
  const m = structuredClone(base.materials), rm = read.materials || {};
  for (const key of ['fiber', 'weave', 'pattern', 'color', 'color2']) if (rm.fabric?.[key]) m.fabric[key] = rm.fabric[key];
  if (rm.wood?.species) m.wood.species = rm.wood.species; if (rm.wood?.finish) m.wood.finish = rm.wood.finish;
  if (rm.metal?.finish) m.metal.finish = rm.metal.finish;
  const design = normalizeDesign({kind, style, seed: base.seed, params, materials: m});
  return {design, estimated, confidence: Math.max(0, Math.min(1, +read.confidence || 0)), notes: String(read.notes || '').slice(0, 400)};
}
