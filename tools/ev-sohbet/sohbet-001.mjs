// Simulated assistant session (training example): a customer in Brussels describes her apartment, the assistant
// draws the plan, suggests finishes and places studio furniture. Writes the EV plan the viewer opens
// (assets/ev/ornekler/sohbet-1.json) and the conversation with tool calls (knowledge/ai-egitim/veri/sohbet-ornekleri/).
// Run: node tools/ev-sohbet/sohbet-001.mjs
import {writeFileSync} from 'node:fs';
import {sample} from '../../assets/forma/generate.js';
import {compileItem} from '../../assets/ev/items.js';

const M = (v, status = 'customer_stated') => ({value: v, unit: 'mm', status, evidence_ids: ['sohbet-001'], uncertainty: null});
const EXT = 300, INT = 120, H = 2700;
// ---- plan: rooms on the axis grid (mm, north up), walls between them --------------------------------------
const R = {salon: [0, 0, 6000, 4800], yatak1: [6000, 0, 9600, 4800], hol: [2600, 4800, 9600, 6200], yatak2: [0, 4800, 2600, 9000],
  banyo: [2600, 6200, 5200, 9000], wc: [5200, 6200, 6600, 9000], kiler: [6600, 6200, 7800, 9000], calisma: [7800, 6200, 9600, 9000]};
const META = {salon: ['Salon + mutfak', 'living'], yatak1: ['Yatak odası', 'bedroom'], hol: ['Antre / hol', 'hall'], yatak2: ['Çocuk odası', 'bedroom'],
  banyo: ['Banyo', 'bath'], wc: ['WC', 'wc'], kiler: ['Çamaşır / kiler', 'utility'], calisma: ['Çalışma', 'study']};
const W = 9600, D = 9000, inset = (r) => { const [x0, y0, x1, y1] = r, e = v => v === 0 || v === W || v === D ? EXT / 2 : INT / 2;
  return [[x0 + (x0 === 0 ? EXT / 2 : INT / 2), y0 + (y0 === 0 ? EXT / 2 : INT / 2)], [x1 - (x1 === W ? EXT / 2 : INT / 2), y0 + (y0 === 0 ? EXT / 2 : INT / 2)], [x1 - (x1 === W ? EXT / 2 : INT / 2), y1 - (y1 === D ? EXT / 2 : INT / 2)], [x0 + (x0 === 0 ? EXT / 2 : INT / 2), y1 - (y1 === D ? EXT / 2 : INT / 2)]]; };
const spaces = Object.entries(R).map(([id, r]) => ({id, level_id: 'kat-0', name: META[id][0], kind: META[id][1], boundary_xy_mm: inset(r), ceiling_height: M(H), geometry_status: 'customer_stated', locked_boundary: true}));
spaces.push({id: 'balkon', level_id: 'kat-0', name: 'Balkon', kind: 'balcony', boundary_xy_mm: [[1500, -1700], [6000, -1700], [6000, -150], [1500, -150]], ceiling_height: M(H), geometry_status: 'customer_stated'});
const walls = [], wall = (id, a, b, t, sp) => walls.push({id, level_id: 'kat-0', from_xy_mm: a, to_xy_mm: b, thickness: M(t), space_ids: sp, structural_status: id.startsWith('dis') ? 'load_bearing_assumed' : 'partition'});
wall('dis-guney', [0, 0], [W, 0], EXT, ['salon', 'yatak1']); wall('dis-dogu', [W, 0], [W, D], EXT, ['yatak1', 'hol', 'calisma']);
wall('dis-kuzey', [W, D], [0, D], EXT, ['calisma', 'kiler', 'wc', 'banyo', 'yatak2']); wall('dis-bati', [0, D], [0, 0], EXT, ['yatak2', 'salon']);
wall('ic-1', [6000, 0], [6000, 4800], INT, ['salon', 'yatak1']); wall('ic-2', [0, 4800], [2600, 4800], INT, ['salon', 'yatak2']);
wall('ic-3', [2600, 4800], [6000, 4800], INT, ['salon', 'hol']); wall('ic-4', [6000, 4800], [W, 4800], INT, ['yatak1', 'hol']);
wall('ic-5', [2600, 4800], [2600, D], INT, ['yatak2', 'hol', 'banyo']); wall('ic-6', [2600, 6200], [W, 6200], INT, ['hol', 'banyo', 'wc', 'kiler', 'calisma']);
wall('ic-7', [5200, 6200], [5200, D], INT, ['banyo', 'wc']); wall('ic-8', [6600, 6200], [6600, D], INT, ['wc', 'kiler']); wall('ic-9', [7800, 6200], [7800, D], INT, ['kiler', 'calisma']);
const openings = [], op = (id, wall_id, kind, a, w, h, sill, sp) => openings.push({id, wall_id, kind, space_ids: sp, offset_from_wall_start: M(a), width: M(w), height: M(h), sill_height: M(sill), swing: 'unknown'});
op('giris', 'dis-dogu', 'door', 5150, 950, 2100, 0, ['hol']);
op('balkon-kapi', 'dis-guney', 'door', 3000, 1800, 2250, 0, ['salon', 'balkon']);
op('salon-pencere', 'dis-guney', 'window', 700, 1800, 1500, 850, ['salon']); op('yatak1-pencere', 'dis-guney', 'window', 7000, 1600, 1500, 850, ['yatak1']);
op('yatak1-dogu', 'dis-dogu', 'window', 1600, 1400, 1500, 850, ['yatak1']); op('mutfak-pencere', 'dis-bati', 'window', 5700, 1300, 1200, 1050, ['salon']);
op('yatak2-pencere', 'dis-bati', 'window', 1100, 1400, 1500, 850, ['yatak2']); op('banyo-pencere', 'dis-kuzey', 'window', 5300, 800, 700, 1500, ['banyo']);
op('calisma-pencere', 'dis-kuzey', 'window', 300, 1200, 1500, 850, ['calisma']);
op('salon-hol', 'ic-3', 'door', 1900, 1400, 2200, 0, ['salon', 'hol']); op('yatak1-hol', 'ic-4', 'door', 400, 900, 2100, 0, ['yatak1', 'hol']);
op('yatak2-hol', 'ic-5', 'door', 300, 850, 2100, 0, ['yatak2', 'hol']); op('banyo-hol', 'ic-6', 'door', 1500, 800, 2100, 0, ['banyo', 'hol']);
op('wc-hol', 'ic-6', 'door', 2750, 750, 2100, 0, ['wc', 'hol']); op('kiler-hol', 'ic-6', 'door', 4250, 750, 2100, 0, ['kiler', 'hol']);
op('calisma-hol', 'ic-6', 'door', 5650, 800, 2100, 0, ['calisma', 'hol']);

// ---- furniture from the studio families ---------------------------------------------------------------
const pick = (family, kind, seed, params = {}, style = 'japandi') => { const d = sample({family, kind, style, seed}); return {...d, params: {...d.params, ...params}}; };
const items = [], put = (id, space_id, design, at, rot, name) => items.push({id, space_id, decision: 'new', design, pos_xy_mm: at, rot_deg: rot, name});
const size = des => compileItem({design: des}).size;
const kit = pick('kitchen', 'run', 3, {width: 3000}), sz = size(kit); put('mutfak', 'salon', kit, [150 + sz.w / 2, 4740 - sz.d / 2], 0, 'Mutfak');
const sofa = pick('seating', 'sofa', 4, {width: 2300}); put('kanepe', 'salon', sofa, [2350, 1700], 90, 'Kanepe');
const tv = pick('storage', 'tvunit', 2, {width: 1800}); const tvs = size(tv); put('tv', 'salon', tv, [5940 - tvs.d / 2, 1700], 270, 'TV ünitesi');
const cof = pick('table', 'coffee', 5, {length: 1100, width: 650}); put('orta-sehpa', 'salon', cof, [3650, 1700], 90, 'Orta sehpa');
const din = pick('table', 'dining', 2, {length: 1400, width: 850}); put('yemek', 'salon', din, [1500, 3150], 0, 'Yemek masası');
const bed1 = {schema: 'aura.forma.design/1', family: 'bedroom', kind: 'bed', style: 'japandi', params: {mattressWidth: 1600}}; const b1 = size(bed1); put('yatak1', 'yatak1', bed1, [9450 - b1.d / 2, 2400], 90, 'Çift kişilik yatak');
const ward = pick('storage', 'wardrobe', 3, {width: 2000}); const ws = size(ward); put('gardirop', 'yatak1', ward, [6060 + ws.d / 2, 2400], 90, 'Gardırop');
const bed2 = {schema: 'aura.forma.design/1', family: 'bedroom', kind: 'bed', style: 'japandi', params: {mattressWidth: 900}}; const b2 = size(bed2); put('yatak2', 'yatak2', bed2, [1300, 8850 - b2.d / 2], 180, 'Tek kişilik yatak');
// positions above are a first guess; the layout solver decides (assets/ev/yerlesim.js)
const desk = pick('table', 'desk', 2, {length: 1200, width: 600}); const ds = size(desk); put('calisma-masasi', 'calisma', desk, [8700, 8850 - ds.d / 2], 180, 'Çalışma masası');
const basin = pick('bath', 'basin', 2, {width: 900}); const bs = size(basin); put('lavabo', 'banyo', basin, [3600, 8850 - bs.d / 2], 180, 'Lavabo dolabı');

const {solveRoom} = await import('../../assets/ev/yerlesim.js');
const val = q => (q && typeof q === 'object' ? q.value : q) ?? 0;
const evw = walls.map(w => { const [x0, y0] = w.from_xy_mm, [x1, y1] = w.to_xy_mm, L = Math.hypot(x1 - x0, y1 - y0); return {...w, x0, y0, x1, y1, L, ux: (x1 - x0) / L, uy: (y1 - y0) / L, t: val(w.thickness)}; });
const evo = openings.map(o => ({...o, a: val(o.offset_from_wall_start), w: val(o.width), h: val(o.height), sill: val(o.sill_height)}));
const solved = {};
for (const sp of spaces) { const its = items.filter(i => i.space_id === sp.id); if (!its.length) continue; const r = solveRoom(sp, its, {walls: evw, ops: evo}, {beam: 60});
  if (!r.ok) throw new Error(sp.id + ': ' + r.reason); solved[sp.id] = r; for (const pl of r.alternatives[0].placements) Object.assign(items.find(i => i.id === pl.id), {pos_xy_mm: pl.pos_xy_mm, rot_deg: pl.rot_deg}); }
const plan = {schema_version: '0.1', project_id: 'sohbet-001', revision: 4, status: 'concept', coordinate_system: 'mm; x east, y north; z up', language: {customer: 'tr', designer: 'tr'},
  brief: {whole_home: true, city: 'Brüksel', goals: ['Aydınlık salon, açık mutfak', 'İki yatak odası ve küçük çalışma odası', 'Sıcak, doğal malzemeler']},
  scheme: 'toprak', levels: [{id: 'kat-0', name: 'Daire', elevation: M(0)}], spaces, walls, openings, items, finishes: [], connections: [], notes: ['Simüle edilmiş eğitim sohbeti; gerçek müşteri değildir.'], issues: [], evidence: [{id: 'sohbet-001', kind: 'conversation'}], example_only: true};
writeFileSync('assets/ev/ornekler/sohbet-1.json', JSON.stringify(plan));
console.log('plan', spaces.length, walls.length, openings.length, items.length);

// ---- the conversation (training record): customer language, assistant replies, tool calls on the shared record
const call = (operation, payload, target_id = 'sohbet-001', expected_revision) => ({operation, target_id, expected_revision, payload});
const it = id => { const i = items.find(x => x.id === id); return {id: i.id, space_id: i.space_id, family: i.design.family, kind: i.design.kind, params: Object.fromEntries(Object.entries(i.design.params).filter(([k]) => ['width', 'length', 'depth', 'height'].includes(k))), pos_xy_mm: i.pos_xy_mm.map(Math.round), rot_deg: i.rot_deg}; };
const turns = [
  {role: 'user', lang: 'tr', text: 'Merhaba, Brüksel\'de 2+1 bir daire aldık, yaklaşık 85 metrekare. Evin tamamını sizinle tasarlamak istiyoruz.'},
  {role: 'assistant', text: 'Hoş geldiniz. Önce evin planını birlikte çizelim. Elinizde tapu ya da emlakçı planı var mı? Yoksa odaları tek tek anlatın; ölçüleri biliyorsanız yazın, bilmediklerinizi sonra birlikte netleştiririz. Bir de balkon ve giriş kapısı hangi cephede?',
    questions: ['Plan çizimi var mı?', 'Balkon ve giriş hangi yönde?'], proposed_changes: []},
  {role: 'user', lang: 'tr', text: 'Planımız yok. Daire yaklaşık 9,6 m\'ye 9 m. Güneyde salon ve açık mutfak var, salonun önünde balkon. Güneydoğu köşede yatak odamız. Girişi doğudan, uzun bir holden. Holün kuzeyinde banyo, ayrı bir WC, küçük bir çamaşır odası ve küçük bir çalışma odası var. Batıda kuzeyde de çocuğun odası.'},
  {role: 'assistant', text: 'Anlattığınıza göre planı çizdim: güneyde 26,6 m² salon ve açık mutfak, güneydoğuda 15,6 m² yatak odası, doğudan girişli 8,7 m² hol, kuzeyde banyo, WC, çamaşır odası ve çalışma odası, kuzeybatıda 9,5 m² çocuk odası, salonun önünde 7 m² balkon. Dış duvarları 30 cm, iç duvarları 12 cm kabul ettim; bunlar tahmini ölçüler, tasarımcımız yerinde doğrulayacak. Plan ve maket ekranda; bir yer yanlışsa söyleyin.',
    assumptions: ['Dış duvar 300 mm, iç duvar 120 mm', 'Tavan yüksekliği 2700 mm', 'Kuzey plan yukarısı'],
    proposed_changes: [call('propose_brief_update', {whole_home: true, city: 'Brüksel', household: 'çift + bir çocuk', total_area_m2: 85}),
      ...spaces.map(s => call('propose_space_update', {id: s.id, name: s.name, kind: s.kind, boundary_xy_mm: s.boundary_xy_mm})),
      ...openings.map(o => call('propose_opening', {id: o.id, wall_id: o.wall_id, kind: o.kind, offset_mm: o.offset_from_wall_start.value, width_mm: o.width.value, sill_mm: o.sill_height.value})),
      call('request_studio_render', {views: ['plan', 'maket']})]},
  {role: 'user', lang: 'tr', text: 'Evet, aşağı yukarı böyle. Sıcak, doğal bir ev istiyoruz; çok beyaz olmasın. Ahşap seviyoruz.'},
  {role: 'assistant', text: 'O zaman "Toprak tonları" önerisiyle başlayalım: duvarlarda kum ve kil tonları, yatak odasında greige; salon, yatak odaları ve holde doğal meşe parke, banyo ve WC\'de terrazzo, mutfakta çimento karo. Boya ve kaplamayı biz yapmıyoruz, öneri olarak paketinize ekliyoruz. Oda içi görünümde günün saatini ve mevsimi değiştirip ışığı görebilirsiniz.',
    proposed_changes: [call('propose_finish', {scheme: 'toprak'})]},
  {role: 'user', lang: 'tr', text: 'Güzel. Şimdi mobilyalar: salonda 3 kişilik bir kanepe, karşısında televizyon, ortada sehpa. Mutfağın önünde 4 kişilik yemek masası. Yatak odasına 160\'lık yatak ve gardırop, çocuğa tek kişilik yatak, çalışma odasına bir masa. Banyoya da lavabo dolabı.'},
  {role: 'assistant', text: 'Hepsini evin ölçüsüne göre yerleştirdim. Mutfak 3 m; yemek masası 140×85 cm, dört kişilik, mutfakla salonun arasında. Kanepe 230 cm, batıda pencereye yakın, doğu duvarındaki 180 cm TV ünitesine bakıyor; arada 110 cm\'lik sehpa. Yatak odasında yatağın başı penceresiz, dolu bir duvarda; iki yanında ve ayak ucunda 60 cm geçiş var; gardırop kapının açılışına girmeyen duvarda. Çocuk odasında tek kişilik yatak kuzey duvarında, çalışma odasında masa pencerenin önünde, banyoda 90 cm lavabo dolabı. Bunların hepsi AURA stüdyosunda özel ölçüyle üretilebilen tasarımlar; renk ve malzemeyi birlikte seçebiliriz.',
    intent: ['TV penceresiz duvarda, ekrana ışık vurmasın', 'kanepe TV\'ye baksın, 1,8–3,6 m', 'yemek masası mutfağa yakın', 'yatağın iki yanından geçilsin', 'çalışma masası gün ışığında'],
    proposed_changes: items.map(i => call('propose_item_placement', it(i.id))).concat([call('request_studio_render', {views: ['maket', 'kesit:salon', 'oda:salon']})])},
  {role: 'user', lang: 'tr', text: 'Çok güzel olmuş. Tasarımcıya gönderebilir miyiz?'},
  {role: 'assistant', text: 'Tabii. Plan, maket görüntüleri, renk ve zemin önerileri ve mobilyaların ölçülü çizimleriyle bir proje paketi hazırlıyorum. Tasarımcımız ölçüleri yerinde doğruladıktan sonra size dönecek; son karar ve fiyat onda.',
    proposed_changes: [call('prepare_designer_handoff', {include: ['plan', 'maket', 'finishes', 'items', 'drawings'], open_questions: ['Duvar kalınlıkları ve tavan yüksekliği yerinde ölçülecek', 'Kapı açılış yönleri']})]}
];
const layout = Object.fromEntries(Object.entries(solved).map(([k, r]) => [k, {alternatives: r.alternatives.length, chosen_score: r.alternatives[0].score, notes: r.alternatives[0].notes}]));
const record = {schema: 'aura.ev.sohbet/1', layout_solver: 'assets/ev/yerlesim.js', layout, id: 'sohbet-001', synthetic: true, note: 'Simüle edilmiş eğitim sohbeti; gerçek müşteri değildir. Asistan sözleşmesi: knowledge/ev-projesi/veri/asistan-sozlesme.json.',
  customer_language: 'tr', city: 'Brüksel', result_plan: 'assets/ev/ornekler/sohbet-1.json',
  designer_summary_tr: 'Brüksel, 2+1, ~85 m², çift + bir çocuk. Güneyde açık mutfaklı salon ve balkon, doğudan girişli hol, kuzeyde ıslak hacimler ve çalışma odası. Sıcak, doğal, ahşap ağırlıklı (Toprak tonları). 10 özel ölçü ürün yerleştirildi. Ölçüler müşteri beyanı; yerinde doğrulanacak.',
  turns};
writeFileSync('knowledge/ai-egitim/veri/sohbet-ornekleri/sohbet-001.json', JSON.stringify(record, null, 1));
console.log('sohbet', turns.length, 'tur,', turns.reduce((n, t) => n + (t.proposed_changes?.length || 0), 0), 'işlem');
