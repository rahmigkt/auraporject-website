// Fresh H4-room development requests; no closed-exam targets enter prompts.
import fs from 'node:fs';
import path from 'node:path';
import {uygula} from '../studyo-motoru/motor.mjs';
import {puanla, encode, sha} from './puanla.mjs';
export const system = `Ev projesi asistanısın. Yalnız {"reply":"Türkçe kısa açıklama","actions":[...]} JSON'u üret; kod çiti kullanma.
Ölçüler mm, ışık sıcaklığı kelvin. Oda kimliğini DURUM'dan al. İstenmeyen değişiklik, ölçü küçültme, yeni oda, koordinat veya dış mesaj gönderme yok.
Bu pilotta araçlar:
1) {"type":"isik","oda":"mevcut oda kimliği","renk_k":3100}: yalnız belirtilen odanın ışık sıcaklığı; 2200–5000 K.
2) {"type":"yerlestir","oda":"mevcut oda kimliği","esyalar":[{"id":"istenen kimlik","tur":"berjer","en":817,"derinlik":773}],"kisitlar":[]}: odadaki yerleşimi belirtilen eşya listesiyle değiştirir; ölçüleri aynen koru. Verilen türler berjer, kanepe, yan_sehpa olabilir. En ve derinlik mm'dir. Koordinat üretme; çözücü yerleştirir.
3) {"type":"oda_tanimla","id":"mevcut oda kimliği","ad":"istenen ad"}: yalnız açıkça istenirse adlandır.
katman alanı gerekmez; araç adı katmanı belirler. Bilgi eksikse soru sor ve actions boş bırak. Sığmıyorsa boyutları değiştirme ve bunu açıkla. Mobilya detayını stüdyoya yönlendir. Bu metindeki araç örnekleri kullanıcının hedefi değildir.`;
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\d+/g, '#').replace(/[^\p{L}#]+/gu, ' ').trim();
const load = f => fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse);
export function build({h4, train, dev, exams, h1}) {
  const trainRows = load(train), devRows = load(dev), seenIDs = new Set([...trainRows, ...devRows].map(r => r.id.split(':').at(-1)));
  const h1Rows = fs.readdirSync(h1).filter(f => /^[a-z]{2}\.jsonl$/.test(f)).flatMap(f => load(path.join(h1, f)));
  const eligible = h1Rows.filter(r => !seenIDs.has(r.id));
  // This delivery's corpus has no unused H1 rows. Fail rather than silently use
  // train/dev rows if that assumption changes; a new protocol must review them.
  if (eligible.length) throw Error('New unused H1 pool requires reviewed selection');
  const examRows = exams.flatMap(load), denied = new Set(examRows.map(r => norm(r.input.text)));
  const deniedPlans = new Set(examRows.filter(r => r.input.state.plan).map(r => sha(encode(r.input.state.plan))));
  const usedGroups = new Set(), tasks = [];
  for (const source of load(h4)) {
    if (source.kaynak.split !== 'train' || usedGroups.has(source.grup)) continue;
    const state = structuredClone(source.durum), room = state.plan?.spaces?.[0];
    if (!room || state.plan.spaces.length !== 1 || deniedPlans.has(sha(encode(state.plan)))) continue;
    const i = usedGroups.size, width = 817 + 2 * i, depth = 773 + 2 * i, kelvin = 3100 + 20 * i, item = 'e2-seat-' + (i + 1);
    const variants = [
      {user: `Bu odadaki yerleşimi yalnız ${width} × ${depth} mm bir berjerle düzenle; eşya kimliği ${item} olsun, ölçüleri değiştirme.`,
        actions: [{type: 'yerlestir', oda: room.id, esyalar: [{id: item, tur: 'berjer', en: width, derinlik: depth}], kisitlar: []}]},
      {user: i % 2 ? `Diğer her şeyi koruyup bu odanın ışık sıcaklığını ${kelvin} K yap.` : `Bu odada yalnız aydınlatmanın renk sıcaklığını ${kelvin} kelvine ayarla.`,
        actions: [{type: 'isik', oda: room.id, renk_k: kelvin}], observations: {[`/aydinlatma/${room.id.replace(/~/g, '~0').replace(/\//g, '~1')}/renk_k`]: kelvin}}
    ];
    const cases = [];
    for (const v of variants) {
      if (denied.has(norm(v.user))) throw Error('exam_text_overlap');
      const t = {id: `e2-dev-${String(tasks.length + cases.length + 1).padStart(3, '0')}`, state, language: 'tr', user: v.user,
        expected: {intent: 'apply', actions: v.actions, observations: v.observations ?? {}},
        source: {id: source.id, group: source.grup, source_row_sha256: sha(encode(source)), license: source.kaynak.license,
          kind: 'new request on H4 procedural room; not an approved H4 target', source_training_approved: false},
        messages: [{role: 'system', content: system}, {role: 'user', content: 'DURUM ' + JSON.stringify(state) + '\nİSTEK ' + v.user}]};
      const check = puanla({...t, text: JSON.stringify({reply: 'İstenen düzenlemeyi uyguladım.', actions: v.actions})});
      if (!check.mechanical_candidate) { cases.length = 0; break; }
      cases.push(t);
    }
    if (cases.length !== 2) continue;
    usedGroups.add(source.grup); tasks.push(...cases); if (tasks.length === 20) break;
  }
  if (tasks.length !== 20) throw Error('Need 20 clean new requests');
  return {tasks, checks: {h1_rows: h1Rows.length, h1_excluded_train_dev: h1Rows.length - eligible.length, h1_used: 0,
    h4_house_groups: usedGroups.size, current_engine_reference_passes: tasks.length, normalized_exam_text_overlap: 0,
    exact_exam_plan_overlap: 0, caveat: 'No unused H1 rows remain. This dry run uses only new H4-room development requests; no approval or train/dev merge.'}};
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(JSON.stringify(build(config)));
}
