// Client for the optional server AI (api/forma-ai.php). The site works fully without it:
// typed/spoken commands are parsed locally first; only unparsed requests and image reading use the AI.
import {normalizeDesign, sample} from './generate.js';
import {RANGES, ENUMS} from './sofa.js';
import {STYLE_BY_ID} from './styles.js';
import {COLORS, FIBERS, WEAVES, PATTERNS, WOODS, FINISHES, METALS} from './catalog.js';

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

/** Schema the server passes to the model, so the model can only answer with known values. */
export function vocabulary() {
  return {
    params: Object.fromEntries(Object.entries(RANGES).map(([k, [lo, hi]]) => [k, [lo, hi]])),
    enums: ENUMS, styles: Object.keys(STYLE_BY_ID), kinds: ['sofa', 'loveseat', 'armchair'],
    fabric: {fiber: Object.keys(FIBERS), weave: Object.keys(WEAVES), pattern: Object.keys(PATTERNS), color: Object.keys(COLORS)},
    wood: {species: Object.keys(WOODS), finish: Object.keys(FINISHES)}, metal: {finish: Object.keys(METALS)}
  };
}

/** Free-text edit → validated actions (same format as commands.parse). */
export async function interpret(text, design, lang) {
  const j = await call('command', {text: String(text).slice(0, 600), lang, design: {kind: design.kind, style: design.style, params: design.params, materials: design.materials}, vocabulary: vocabulary()});
  return sanitizeActions(j.actions || []);
}

export function sanitizeActions(list) {
  const v = vocabulary(), out = [];
  for (const a of Array.isArray(list) ? list.slice(0, 20) : []) {
    if (!a || typeof a !== 'object') continue;
    if ((a.type === 'set' || a.type === 'delta') && v.params[a.key] && Number.isFinite(+a.value)) out.push({type: a.type, key: a.key, value: +a.value});
    else if (a.type === 'enum' && v.enums[a.key]?.includes(a.value)) out.push(a);
    else if (a.type === 'style' && v.styles.includes(a.value)) out.push(a);
    else if (a.type === 'kind' && v.kinds.includes(a.value)) out.push(a);
    else if (a.type === 'material' && ((a.slot === 'fabric' && v.fabric[a.key]?.includes(a.value)) || (a.slot === 'wood' && v.wood[a.key]?.includes(a.value)) || (a.slot === 'metal' && a.key === 'finish' && v.metal.finish.includes(a.value)) || (a.slot === 'welt' && a.key === 'color' && v.fabric.color.includes(a.value)))) out.push(a);
  }
  return out;
}

/**
 * Photo or sketch → editable parametric design. The model reads the image with the FDE part vocabulary and
 * answers only with known part types and ranges; dimensions it cannot see are marked as estimates.
 */
export async function designFromImage(dataUrl, lang) {
  const j = await call('vision', {image: dataUrl, lang, vocabulary: vocabulary()});
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
