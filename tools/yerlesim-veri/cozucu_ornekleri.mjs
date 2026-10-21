// ProcTHOR-10K rooms (shapes, doors, windows; Apache-2.0) + AURA's layout solver (assets/ev/yerlesim.js) → training
// examples whose placements follow AURA's interior rules, not ProcTHOR's procedural ones. Furniture sets use common
// European sizes and vary per room; when the solver finds no rule-abiding layout the example says so honestly.
// Usage: node cozucu_ornekleri.mjs <yerlesim-tum-odalar.jsonl> <out.jsonl> [limit]
import {readFileSync, writeFileSync, appendFileSync, existsSync} from 'node:fs';
const {solveRoom} = await import('../../assets/ev/yerlesim.js');
const [src, dst, lim, part] = process.argv.slice(2), LIMIT = +lim || Infinity, [PI, PN] = (part || '0/1').split('/').map(Number);
let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(R() * a.length)];
const AREA = {bedroom: [7, 25], living: [12, 45]};
const NAME = {loveseat: 'ikili koltuk', side: 'yan sehpa', reading: 'kahve köşesi berjeri', sideboard: 'büfe', sofa: 'kanepe', tvunit: 'TV ünitesi', coffee: 'orta sehpa', armchair: 'tekli koltuk (berjer)', dining: 'yemek masası', bed: 'yatak', wardrobe: 'gardırop', nightstand: 'komodin', desk: 'çalışma masası', dresser: 'şifonyer', bookcase: 'kitaplık'};
const it = (id, kind, w, d, h) => ({id, name: NAME[kind], design: {kind}, size: {w, d, h}});
// Furniture sets as homes really have them (Turkish "oturma grubu" 3+3+1 / 3+2+1; European 3+2 or sofa + armchairs),
// sizes from common retail ranges; a reading/coffee corner by the window in larger rooms.
function set(kind, area) {
  if (kind === 'living') {
    const s = [it('tv', 'tvunit', pick([1600, 1800, 2000]), 450, 500), it('kanepe', 'sofa', pick([2100, 2200, 2300]), pick([900, 950]), 820), it('sehpa', 'coffee', pick([1000, 1100, 1200]), pick([550, 600]), 420)];
    if (area >= 16) s.push(it('ikili', 'loveseat', pick([1600, 1700, 1800]), pick([900, 950]), 820));
    if (area >= 20) s.push(it('berjer', 'armchair', pick([800, 850]), pick([850, 900]), 850));
    if (area >= 14) s.push(it('yan1', 'side', 500, 500, 550));
    if (area >= 24) s.push(it('kahve', 'reading', 800, 850, 950), it('yan2', 'side', 450, 450, 550));
    if (area >= 26) s.push(it('masa', 'dining', pick([1400, 1600, 1800]), pick([850, 900]), 750));
    if (area >= 22 && R() < 0.6) s.push(it('bufe', 'sideboard', pick([1600, 1800]), 450, 800));
    return s; }
  const dbl = area >= 10, s = [it('yatak', 'bed', dbl ? pick([1600, 1800]) + 100 : 1000, 2100, 1000)];
  if (dbl) s.push(it('komodin1', 'nightstand', 500, 420, 520), it('komodin2', 'nightstand', 500, 420, 520));
  if (area >= 9) s.push(it('gardirop', 'wardrobe', dbl ? pick([1800, 2200, 2700]) : pick([1000, 1500]), 600, 2300));
  if (area >= 13) s.push(it('sifonyer', 'dresser', pick([1000, 1200]), 450, 850));
  if (!dbl && area >= 8) s.push(it('masa', 'desk', 1100, 550, 750));
  return s;
}
function ev(rec) { // each boundary edge becomes a wall; openings map to the edge they lie on
  const b = rec.room.boundary_xy_mm, walls = b.map((P, i) => { const Q = b[(i + 1) % b.length], L = Math.hypot(Q[0] - P[0], Q[1] - P[1]) || 1; return {id: 'w' + i, x0: P[0], y0: P[1], ux: (Q[0] - P[0]) / L, uy: (Q[1] - P[1]) / L, L, t: 100}; });
  const ops = []; rec.openings.forEach((o, k) => { for (const w of walls) { const d = p => Math.abs((p[0] - w.x0) * -w.uy + (p[1] - w.y0) * w.ux), s = p => (p[0] - w.x0) * w.ux + (p[1] - w.y0) * w.uy;
    if (d(o.p0) < 60 && d(o.p1) < 60) { const a = Math.min(s(o.p0), s(o.p1)), m = a + o.width / 2; if (m > 0 && m < w.L) { ops.push({id: 'o' + k, wall_id: w.id, a, w: o.width, sill: o.sill, h: o.height, kind: o.kind}); break; } } } });
  return {walls, ops};
}
const lines = readFileSync(src, 'utf8').split('\n'), out = []; let n = 0, ok = 0, no = 0; const t0 = Date.now();
for (const l of lines) { if (!l || n >= LIMIT) continue; const rec = JSON.parse(l), k = rec.room.kind;
  if (!AREA[k] || rec.source.house % PN !== PI || rec.room.area_m2 < AREA[k][0] || rec.room.area_m2 > AREA[k][1] || rec.room.boundary_xy_mm.length > 8) continue; n++;
  const items = set(k, rec.room.area_m2), E = ev(rec), res = solveRoom({boundary_xy_mm: rec.room.boundary_xy_mm}, items, E, {count: 3, beam: 24});
  const ops = rec.openings.map(o => `${o.kind === 'door' ? 'kapı' : 'pencere'} ${o.width} mm ${JSON.stringify(o.p0)}–${JSON.stringify(o.p1)}${o.kind === 'window' ? `, denizlik ${o.sill}` : ''}`).join('; ');
  const user = `${k === 'living' ? 'Oturma odası' : 'Yatak odası'}, ${rec.room.area_m2} m². Köşeler (mm): ${JSON.stringify(rec.room.boundary_xy_mm)}. Açıklıklar: ${ops || 'yok'}. Yerleştir: ${items.map(i => `${i.name} ${i.size.w}×${i.size.d}`).join('; ')}.`;
  let assistant;
  if (res.ok) { ok++; const a = res.alternatives[0]; assistant = JSON.stringify({yerlesim: a.placements.map(p => ({parca: items.find(i => i.id === p.id).name, merkez_mm: p.pos_xy_mm, on_derece: p.rot_deg})), gerekce: a.notes, secenek_sayisi: res.alternatives.length}); }
  else { no++; assistant = JSON.stringify({yerlesim: null, gerekce: [res.reason + '. Kapı açılımını, geçiş paylarını ve pencereyi koruyarak yer yok; daha küçük ölçü ya da parçayı çıkarmayı öneririm.']}); }
  appendFileSync(dst, JSON.stringify({id: `aura-cozucu-${rec.source.split}-${rec.source.house}-${rec.source.room}`, source: {...rec.source, placements: 'AURA yerlesim.js', note: 'oda geometrisi ProcTHOR-10K (Apache-2.0); yerleşim AURA kuralları'}, ok: res.ok, messages: [{role: 'user', content: user}, {role: 'assistant', content: assistant}]}) + '\n');
}
console.log(JSON.stringify({oda: n, cozuldu: ok, sigmadi: no, sn: (Date.now() - t0) / 1000}));
