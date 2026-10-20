// ProcTHOR-10K rooms (shapes, doors, windows; Apache-2.0) + AURA's layout solver (assets/ev/yerlesim.js) → training
// examples whose placements follow AURA's interior rules, not ProcTHOR's procedural ones. Furniture sets use common
// European sizes and vary per room; when the solver finds no rule-abiding layout the example says so honestly.
// Usage: node cozucu_ornekleri.mjs <yerlesim-tum-odalar.jsonl> <out.jsonl> [limit]
import {readFileSync, writeFileSync} from 'node:fs';
const {solveRoom} = await import('../../assets/ev/yerlesim.js');
const [src, dst, lim, part] = process.argv.slice(2), LIMIT = +lim || Infinity, [PI, PN] = (part || '0/1').split('/').map(Number);
let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[Math.floor(R() * a.length)];
const AREA = {bedroom: [7, 25], living: [12, 45]};
const NAME = {sofa: 'kanepe', tvunit: 'TV ünitesi', coffee: 'orta sehpa', armchair: 'berjer', dining: 'yemek masası', bed: 'yatak', wardrobe: 'gardırop', nightstand: 'komodin', desk: 'çalışma masası', dresser: 'şifonyer', bookcase: 'kitaplık'};
const it = (id, kind, w, d, h) => ({id, name: NAME[kind], design: {kind}, size: {w, d, h}});
function set(kind, area) {
  if (kind === 'living') { const s = [it('kanepe', 'sofa', pick([1800, 2100, 2300]), pick([850, 900, 950]), 800), it('tv', 'tvunit', pick([1400, 1600, 1800]), 420, 500), it('sehpa', 'coffee', pick([900, 1100, 1200]), pick([550, 600, 650]), 400)];
    if (area > 18 && R() < 0.6) s.push(it('berjer', 'armchair', 800, 800, 800)); if (area > 22 && R() < 0.6) s.push(it('masa', 'dining', pick([1200, 1400, 1600]), pick([800, 850, 900]), 750));
    if (R() < 0.4) s.push(it('kitaplik', 'bookcase', pick([800, 1000]), 350, 1900)); return s; }
  const dbl = area >= 10 && R() < 0.8, s = [it('yatak', 'bed', dbl ? pick([1400, 1600, 1800]) + 100 : 1000, 2100, 1000)];
  if (area >= 9) s.push(it('gardirop', 'wardrobe', pick([1000, 1500, 2000]), 600, 2200)); if (dbl) s.push(it('komodin1', 'nightstand', 450, 400, 500), it('komodin2', 'nightstand', 450, 400, 500));
  if (area > 14 && R() < 0.5) s.push(it('masa', 'desk', 1200, 600, 750)); else if (area > 13 && R() < 0.4) s.push(it('sifonyer', 'dresser', 1000, 450, 850)); return s;
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
  out.push(JSON.stringify({id: `aura-cozucu-${rec.source.split}-${rec.source.house}-${rec.source.room}`, source: {...rec.source, placements: 'AURA yerlesim.js', note: 'oda geometrisi ProcTHOR-10K (Apache-2.0); yerleşim AURA kuralları'}, ok: res.ok, messages: [{role: 'user', content: user}, {role: 'assistant', content: assistant}]}));
}
writeFileSync(dst, out.join('\n') + '\n'); console.log(JSON.stringify({oda: n, cozuldu: ok, sigmadi: no, sn: (Date.now() - t0) / 1000}));
