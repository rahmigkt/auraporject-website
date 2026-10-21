// AURA stüdyo motoru — the studio without a browser. Takes a studio state and a list of studio operations, applies
// them with the SAME code the site uses (assets/forma/actions.js, assets/ev/yerlesim.js, assets/ev/tekstil.js) and
// returns the new state plus an audit: accepted / rejected operations with reasons, clamped values, physics checks,
// plan geometry checks, layout constraints met or not. Training data and the exam are validated here: an example
// whose operations the studio rejects does not enter training (knowledge/ai-egitim/EGITIM-PLANI-STUDYO.md).
import {normalizeDesign, compileDesign, sample} from '../../assets/forma/generate.js';
import {FAMILIES} from '../../assets/forma/families.js';
import {vocabulary, sanitizeActions} from '../../assets/forma/ai.js';
import {applyDesignActions, headlessEnv} from '../../assets/forma/actions.js';
import {analyse} from '../../assets/forma/physics.js';
import {solveRoom} from '../../assets/ev/yerlesim.js';
import {migrate} from '../../assets/ev/tekstil.js';

export const VERSION = 'studyo-motoru/1';
// ---- operation vocabulary (versioned). layer → op → required fields --------------------------------------------
export const SOZLUK = {
  mobilya: {set: ['key', 'value'], delta: ['key', 'value'], enum: ['key', 'value'], material: ['slot', 'key', 'value'], style: ['value'], kind: ['value'], family: ['value'], seats: ['value'], drawers: ['value'], mattress: ['value']},
  ev: {duvar_ekle: ['from', 'to'], duvar_sil: ['id'], duvar_tasi: ['id', 'dx', 'dy'], aciklik_ekle: ['wall_id', 'tur', 'konum', 'en'], oda_tanimla: ['id'], kat_ekle: [], merdiven: [], oda_birlestir: ['a', 'b']},
  yerlesim: {yerlestir: ['oda', 'esyalar'], secenek_sec: ['index']},
  tekstil: {perde: [], hali: []},
  proje: {projeye_ekle: [], tasarimciya_gonder: []}
};
const NOT_YET = {kat_ekle: 'çok katlı plan motorda henüz yok', merdiven: 'merdiven motorda henüz yok', oda_birlestir: 'oda birleştirme motorda henüz yok'};

// ---- small geometry ----------------------------------------------------------------------------------------------
const area = b => Math.abs(b.reduce((s, [x, y], i) => { const [u, v] = b[(i + 1) % b.length]; return s + x * v - u * y; }, 0)) / 2e6;
const crosses = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
const selfIntersects = b => b.some((p, i) => b.some((q, j) => Math.abs(i - j) > 1 && !(i === 0 && j === b.length - 1) && !(j === 0 && i === b.length - 1) && crosses(p, b[(i + 1) % b.length], q, b[(j + 1) % b.length])));
const wallLen = w => Math.hypot(w.to_xy_mm[0] - w.from_xy_mm[0], w.to_xy_mm[1] - w.from_xy_mm[1]);
const val = v => (v && typeof v === 'object' ? v.value : v) ?? 0;

// ---- layers --------------------------------------------------------------------------------------------------------
function mobilya(state, ops, rep) {
  let d = normalizeDesign(state.design || sample({family: 'seating', kind: 'sofa', style: 'aura', seed: 1}));
  for (const op of ops) {
    const v = vocabulary(d); let ok;
    if (op.type === 'family') ok = FAMILIES[op.value] ? [op] : [];
    else if (op.type === 'seats') ok = Number.isInteger(op.value) && op.value >= 1 && op.value <= 14 ? [op] : [];
    else if (op.type === 'drawers') ok = Number.isInteger(op.value) && op.value >= 1 && op.value <= 6 ? [op] : [];
    else if (op.type === 'mattress') ok = Array.isArray(op.value) && op.value.length === 2 ? [op] : [];
    else ok = sanitizeActions([op], v);
    if (!ok.length) { rep.red.push({katman: 'mobilya', op, neden: 'stüdyo sözlüğünde yok ya da bu ürün için geçersiz'}); continue; }
    const r = applyDesignActions(d, ok, headlessEnv());
    // the studio clamps to its ranges: a target that was not reached is reported, never silently counted as success
    if ((op.type === 'set' || op.type === 'delta') && r.changed) { const want = op.type === 'set' ? op.value : d.params[op.key] + op.value, got = r.design.params[op.key];
      if (typeof got === 'number' && Math.abs(got - want) > 0.5) rep.uyari.push({katman: 'mobilya', kod: 'sinira_takildi', op, hedef: want, gerceklesen: got, aralik: v.params[op.key]}); }
    d = r.design; rep.kabul.push({katman: 'mobilya', op, not: r.notes});
  }
  state.design = d;
  try { const c = compileDesign(d), a = analyse(c, d.materials, d.family);
    rep.olcum.mobilya = {aile: d.family, tur: d.kind, olcu: c.meta?.overall || null, kutle_kg: Math.round(a.mass || 0), parca: c.parts.length};
    for (const k of a.checks) if (k.level !== 'ok') rep.uyari.push({katman: 'mobilya', kod: k.code, seviye: k.level, metin: k.tr, deger: k.value}); }
  catch (e) { rep.red.push({katman: 'mobilya', op: null, neden: 'derlenemedi: ' + e.message}); }
}

function ev(state, ops, rep) {
  const P = state.plan ??= {walls: [], openings: [], spaces: [], items: []}; let n = P.walls.length + P.openings.length + P.spaces.length;
  const no = (op, neden) => rep.red.push({katman: 'ev', op, neden});
  for (const op of ops) {
    if (NOT_YET[op.type]) { no(op, NOT_YET[op.type]); continue; }
    if (op.type === 'duvar_ekle') { const w = {id: op.id || 'w' + (++n), from_xy_mm: op.from, to_xy_mm: op.to, thickness: op.kalinlik || 120};
      if (wallLen(w) < 100) { no(op, 'duvar 100 mm\'den kısa'); continue; } P.walls.push(w); }
    else if (op.type === 'duvar_sil') { const i = P.walls.findIndex(w => w.id === op.id); if (i < 0) { no(op, 'böyle bir duvar yok'); continue; } P.walls.splice(i, 1); P.openings = P.openings.filter(o => o.wall_id !== op.id); }
    else if (op.type === 'duvar_tasi') { const w = P.walls.find(x => x.id === op.id); if (!w) { no(op, 'böyle bir duvar yok'); continue; }
      for (const k of ['from_xy_mm', 'to_xy_mm']) w[k] = [w[k][0] + op.dx, w[k][1] + op.dy]; }
    else if (op.type === 'aciklik_ekle') { const w = P.walls.find(x => x.id === op.wall_id); if (!w) { no(op, 'böyle bir duvar yok'); continue; }
      if (!['door', 'window', 'kapi', 'pencere'].includes(op.tur)) { no(op, 'açıklık türü kapı ya da pencere olmalı'); continue; }
      if (op.konum < 0 || op.konum + op.en > wallLen(w)) { no(op, 'açıklık duvarın dışına taşıyor'); continue; }
      const kind = op.tur === 'kapi' ? 'door' : op.tur === 'pencere' ? 'window' : op.tur;
      if (P.openings.some(o => o.wall_id === w.id && op.konum < val(o.offset_from_wall_start) + val(o.width) && op.konum + op.en > val(o.offset_from_wall_start))) { no(op, 'aynı duvarda başka bir açıklıkla çakışıyor'); continue; }
      P.openings.push({id: op.id || 'o' + (++n), wall_id: w.id, kind, offset_from_wall_start: op.konum, width: op.en, height: op.yukseklik || (kind === 'door' ? 2100 : 1400), sill_height: kind === 'door' ? 0 : op.denizlik ?? 900}); }
    else if (op.type === 'oda_tanimla') { let s = P.spaces.find(x => x.id === op.id);
      if (!s) { if (!op.kose || op.kose.length < 3) { no(op, 'yeni oda için köşe noktaları gerekli'); continue; } s = {id: op.id, boundary_xy_mm: op.kose}; P.spaces.push(s); }
      if (op.kose) s.boundary_xy_mm = op.kose; if (op.tur) s.kind = op.tur; if (op.ad) s.name = op.ad; }
    else { no(op, 'ev katmanında bilinmeyen işlem'); continue; }
    rep.kabul.push({katman: 'ev', op});
  }
  // plan audit: shapes, areas, openings
  const rooms = []; for (const s of P.spaces) { const A = area(s.boundary_xy_mm); rooms.push({id: s.id, tur: s.kind, m2: +A.toFixed(1)});
    if (selfIntersects(s.boundary_xy_mm)) rep.uyari.push({katman: 'ev', kod: 'oda_kendini_kesiyor', oda: s.id});
    const lim = {bath: [2.5, 12], wc: [0.9, 3], bedroom: [6, 30], living: [10, 60], kitchen: [4, 30], hall: [1, 20]}[s.kind];
    if (lim && (A < lim[0] || A > lim[1])) rep.uyari.push({katman: 'ev', kod: 'oda_alani_olagan_disi', oda: s.id, m2: +A.toFixed(1), olagan: lim}); }
  for (const o of P.openings) if (o.kind === 'door' && (val(o.width) < 700 || val(o.width) > 1200)) rep.uyari.push({katman: 'ev', kod: 'kapi_eni', aciklik: o.id, mm: val(o.width)});
  rep.olcum.ev = {oda: rooms, toplam_m2: +rooms.reduce((s, r) => s + r.m2, 0).toFixed(1), duvar: P.walls.length, aciklik: P.openings.length};
}

// constraints the assistant writes; the solver places, the engine checks which constraints the result meets
const CONS = {
  bakar: (P, c) => { const a = P[c.a], b = P[c.b]; if (!a || !b) return null; const t = a.rot_deg * Math.PI / 180, f = [Math.sin(t), -Math.cos(t)], d = [b.pos_xy_mm[0] - a.pos_xy_mm[0], b.pos_xy_mm[1] - a.pos_xy_mm[1]], L = Math.hypot(...d) || 1; return (f[0] * d[0] + f[1] * d[1]) / L > Math.cos(Math.PI / 6); },
  yakin: (P, c) => { const a = P[c.a], b = P[c.b]; if (!a || !b) return null; return Math.hypot(a.pos_xy_mm[0] - b.pos_xy_mm[0], a.pos_xy_mm[1] - b.pos_xy_mm[1]) <= (c.mm || 2500); },
  uzak: (P, c) => { const a = P[c.a], b = P[c.b]; if (!a || !b) return null; return Math.hypot(a.pos_xy_mm[0] - b.pos_xy_mm[0], a.pos_xy_mm[1] - b.pos_xy_mm[1]) >= (c.mm || 1500); }
};
const KINDS = {kanepe: 'sofa', sofa: 'sofa', tv: 'tvunit', tvunit: 'tvunit', sehpa: 'coffee', coffee: 'coffee', masa: 'dining', dining: 'dining', yatak: 'bed', bed: 'bed', gardirop: 'wardrobe', wardrobe: 'wardrobe',
  ikili: 'loveseat', loveseat: 'loveseat', tekli: 'armchair', kahve_kosesi: 'reading', reading: 'reading', yan_sehpa: 'side', side: 'side', bufe: 'sideboard', sideboard: 'sideboard', ayakkabilik: 'shoe', shoe: 'shoe', portmanto: 'coatrack', coatrack: 'coatrack', komodin: 'nightstand', nightstand: 'nightstand', calisma: 'desk', desk: 'desk', berjer: 'armchair', armchair: 'armchair', kitaplik: 'bookcase', bookcase: 'bookcase', sifonyer: 'dresser', dresser: 'dresser', mutfak: 'run', run: 'run', lavabo: 'basin', basin: 'basin'};
function yerlesim(state, ops, rep) {
  const P = state.plan;
  for (const op of ops) {
    if (op.type === 'secenek_sec') { const r = state.yerlesim?.[op.oda || state.sonOda]; if (!r || !r.alternatives[op.index]) { rep.red.push({katman: 'yerlesim', op, neden: 'böyle bir seçenek yok'}); continue; } state.secili = op.index; rep.kabul.push({katman: 'yerlesim', op}); continue; }
    if (op.type !== 'yerlestir') { rep.red.push({katman: 'yerlesim', op, neden: 'bilinmeyen işlem'}); continue; }
    const sp = P?.spaces.find(s => s.id === op.oda); if (!sp) { rep.red.push({katman: 'yerlesim', op, neden: 'böyle bir oda yok'}); continue; }
    const items = []; let bad = null;
    for (const e of op.esyalar) { const kind = KINDS[e.tur]; if (!kind || !(e.en > 0 && e.derinlik > 0)) { bad = e; break; } items.push({id: e.id || e.tur, name: e.ad || e.tur, design: {kind}, size: {w: e.en, d: e.derinlik, h: e.yukseklik || 800}}); }
    if (bad) { rep.red.push({katman: 'yerlesim', op, neden: `eşya tanınmadı ya da ölçüsü eksik: ${JSON.stringify(bad)}`}); continue; }
    const walls = P.walls.map(w => { const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0) || 1; return {...w, x0, y0, ux: (x1 - x0) / L, uy: (y1 - y0) / L, L, t: val(w.thickness) || 120}; });
    const opsE = P.openings.map(o => ({...o, a: val(o.offset_from_wall_start), w: val(o.width), h: val(o.height) || 2100, sill: val(o.sill_height)}));
    const res = solveRoom(sp, items, {walls, ops: opsE}, {count: 4, beam: 40});
    (state.yerlesim ??= {})[sp.id] = res; state.sonOda = sp.id;
    if (!res.ok) { rep.kabul.push({katman: 'yerlesim', op}); rep.uyari.push({katman: 'yerlesim', kod: 'sigmiyor', oda: sp.id, metin: res.reason}); rep.olcum.yerlesim = {oda: sp.id, sigdi: false}; continue; }
    // pick the alternative that meets most constraints (ties: solver score)
    const ids = Object.fromEntries(op.esyalar.map(e => [e.tur, e.id || e.tur]));
    const score = alt => { const P2 = Object.fromEntries(alt.placements.map(p => [p.id, p])), by = k => P2[ids[k] || k];
      return (op.kisitlar || []).map(c => ({c, ok: CONS[c.tur] ? CONS[c.tur](new Proxy({}, {get: (_, k) => by(k)}), c) : null})); };
    const scored = res.alternatives.map((alt, i) => ({i, alt, r: score(alt)})).sort((a, b) => b.r.filter(x => x.ok).length - a.r.filter(x => x.ok).length || b.alt.score - a.alt.score);
    const best = scored[0]; state.secili = best.i;
    for (const x of best.r) { if (x.ok === null) rep.uyari.push({katman: 'yerlesim', kod: 'kisit_anlasilmadi', kisit: x.c}); else if (!x.ok) rep.uyari.push({katman: 'yerlesim', kod: 'kisit_karsilanmadi', kisit: x.c}); }
    P.items = [...(P.items || []).filter(i => i.space_id !== sp.id), ...best.alt.placements.map(p => ({id: p.id, space_id: sp.id, pos_xy_mm: p.pos_xy_mm, rot_deg: p.rot_deg, size_mm: items.find(i => i.id === p.id).size}))];
    rep.kabul.push({katman: 'yerlesim', op}); rep.olcum.yerlesim = {oda: sp.id, sigdi: true, secenek: res.alternatives.length, secilen: best.i, kisit_karsilanan: best.r.filter(x => x.ok).length, kisit_toplam: best.r.length};
  }
}

function tekstil(state, ops, rep) {
  let t = migrate(state.tekstil);
  const merge = (a, b) => { for (const [k, v] of Object.entries(b)) if (v && typeof v === 'object' && !Array.isArray(v)) a[k] = merge({...(a[k] || {})}, v); else a[k] = v; return a; };
  for (const op of ops) { const {type, ...rest} = op; if (type !== 'perde' && type !== 'hali') { rep.red.push({katman: 'tekstil', op, neden: 'bilinmeyen işlem'}); continue; }
    const key = type === 'perde' ? 'curtain' : 'rug', before = JSON.stringify(t[key]); t[key] = merge({...t[key]}, rest); t = migrate(t);
    rep.kabul.push({katman: 'tekstil', op, degisti: before !== JSON.stringify(t[key])}); }
  state.tekstil = t;
}

// ---- entry point -----------------------------------------------------------------------------------------------
// state: {design?, plan?, tekstil?}; ops: [{katman, type, ...}] — order kept within each layer
export function uygula(state0, ops) {
  const state = structuredClone(state0 || {}), rep = {surum: VERSION, kabul: [], red: [], uyari: [], olcum: {}};
  const by = {}; for (const o of ops || []) { if (!SOZLUK[o.katman]?.[o.type]) { rep.red.push({katman: o.katman, op: o, neden: 'sözlükte yok'}); continue; }
    const miss = SOZLUK[o.katman][o.type].filter(f => o[f] == null); if (miss.length) { rep.red.push({katman: o.katman, op: o, neden: 'eksik alan: ' + miss.join(', ')}); continue; }
    (by[o.katman] ??= []).push(o); }
  if (by.mobilya || state.design) mobilya(state, (by.mobilya || []).map(({katman, ...a}) => a), rep);
  if (by.ev) ev(state, by.ev, rep);
  if (by.yerlesim) yerlesim(state, by.yerlesim, rep);
  if (by.tekstil) tekstil(state, by.tekstil, rep);
  for (const o of by.proje || []) rep.kabul.push({katman: 'proje', op: o});
  rep.gecti = rep.red.length === 0 && !rep.uyari.some(u => u.seviye === 'error' || u.kod === 'oda_kendini_kesiyor');
  return {state, rapor: rep};
}
