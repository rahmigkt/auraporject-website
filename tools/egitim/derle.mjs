// AURA eğitim kümesi derleyici (EGITIM-01). Yalnız şu üç koşulu sağlayan kaydı eğitime alır:
//   1. stüdyo motoru işlemleri kabul ediyor (burada yeniden çalıştırılır, kayıttaki bayrağa güvenilmez);
//   2. üreten tarafın dışındaki model "uygun" demiş (Codex verisi → inceleme/kararlar.json, Claude verisi → inceleme/codex-kararlari.json);
//   3. sınav görevleriyle aynı kullanıcı cümlesi yok.
// Çıktı: outputs/egitim-01/{train,dev}.jsonl (sohbet biçimi, hedef = {"reply","actions"}) ve rapor.json. Ağırlık, GPU, eğitim yok.
// Kullanım: node tools/egitim/derle.mjs [--cikti outputs/egitim-01] [--dev 0.1]
import {readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {uygula, SOZLUK, VERSION} from '../studyo-motoru/motor.mjs';
import {motorDenetimi} from './motor-onbellek.mjs';
import {h4Kaynak} from './h4-kaynak.mjs';
import * as SINAV from '../aura-sinav-01/tasks.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('--cikti', 'outputs/egitim-01'), DEV = +arg('--dev', 0.1), K = 'knowledge/ai-egitim';
const jsonl = f => existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const json = (f, d) => existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : d;

// ---- kararlar: "veri_seti:id" ya da "veri_seti:*" anahtarı; tek kayıt kararı kümenin kararını ezer
const K_CLAUDE = json(`${K}/inceleme/kararlar.json`, {kararlar: {}}).kararlar;
const K_CODEX = json(`${K}/inceleme/codex-kararlari.json`, {kararlar: {}}).kararlar || {};
const karar = (id, ureten) => { const set = id.split(':')[0], tab = ureten === 'Claude' ? K_CODEX : K_CLAUDE, r = tab[id] || tab[`${set}:*`];
  return r ? r.karar : 'bekliyor'; };

// ---- sınav sızıntısı: normalize edilmiş kullanıcı cümleleri
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\d+/g, '#').replace(/[^\p{L}#]+/gu, ' ').trim();
const SINAV_METIN = new Set(Object.values(SINAV).filter(Array.isArray).flat().map(t => Array.isArray(t) ? norm(t[1]) : norm(t?.user || t?.metin || '')).filter(Boolean));

const SISTEM = readFileSync(new URL('./sistem.md', import.meta.url), 'utf8').replace('{{SOZLUK}}', JSON.stringify(Object.fromEntries(Object.entries(SOZLUK).filter(([k]) => k !== 'mobilya').map(([k, v]) => [k, Object.keys(v)]))));

// ---- kaynaklar → ortak biçim {id, ureten, dil, durum, mesajlar:[{rol, metin}], islemler, grup}
const kayitlar = [];
for (const r of jsonl(`${K}/veri/birlesik/adaylar.jsonl`)) {
  if (r.id.startsWith('ev-plan-eu-00c') || r.id.startsWith('ev-plan-reel-00d')) continue; // eski sözleşme (plan_program); motor işlemi yok
  kayitlar.push({id: r.id, ureten: r.id.startsWith('sohbet-ornekleri') ? 'Claude' : 'Codex', dil: r.dil, durum: r.durum_once || {}, mesajlar: r.mesajlar.filter(m => m.rol !== 'system'), islemler: (r.islemler || []).map(o => ({...o, type: o.type || o.tur})), grup: r.denetim?.grup || r.id});
}
const H1 = `${K}/veri/hacim-1-istek`;
if (existsSync(H1)) for (const f of readdirSync(H1).filter(f => /^[a-z]{2}\.jsonl$/.test(f))) for (const r of jsonl(`${H1}/${f}`))
  kayitlar.push({id: `hacim-1-istek:${r.id}`, ureten: r.review?.producer || 'Codex', dil: r.language, durum: r.state || {}, mesajlar: [{rol: 'user', metin: r.user}, {rol: 'assistant', metin: r.assistant.reply}], islemler: r.assistant.actions || [], grup: r.source?.group || r.id});
const H4 = `${K}/veri/yerlesim-kisit`;
if (existsSync(H4)) for (const f of readdirSync(H4).filter(f => f.endsWith('.jsonl'))) for (const r of jsonl(`${H4}/${f}`))
  kayitlar.push(h4Kaynak(r));

// ---- süzme
const sayim = {toplam: kayitlar.length, alinan: 0, neden: {}}, al = [], ret = (k, n) => { sayim.neden[n] = (sayim.neden[n] || 0) + 1; };
const motor = motorDenetimi(uygula);
for (const k of kayitlar) {
  const kr = karar(k.id, k.ureten); if (kr !== 'uygun') { ret(k, `karar:${kr}`); continue; }
  if (k.islemler.some(o => o.katman === 'mobilya')) { ret(k, 'kapsam:mobilya-detay'); continue; }
  if (k.mesajlar.some(m => m.rol === 'user' && SINAV_METIN.has(norm(m.metin)))) { ret(k, 'sinav-sizintisi'); continue; }
  if (k.islemler.length && !motor.kabul(k.durum, k.islemler)) { ret(k, 'motor:red'); continue; }
  if (!k.mesajlar.length || k.mesajlar.at(-1).rol !== 'assistant') { ret(k, 'bicim:son-tur-asistan-degil'); continue; }
  al.push(k);
}
sayim.alinan = al.length;

// ---- modelin gördüğü durum özeti: yalnız işlemlerin başvurduğu kimlikler ve ölçüler (kanıt, şema ve meta alanları yok).
// Motor tam durumu ayrıca kullanır; özet yalnız istem içindir. Ölçüler mm, tam sayı.
const mm = v => Math.round(typeof v === 'object' && v ? v.value : v);
const pt = p => Array.isArray(p) ? p.map(mm) : p;
function ozet(d) {
  const P = d.plan || {}, o = {};
  if (P.walls?.length) o.duvar = P.walls.map(w => [w.id, pt(w.from_xy_mm ?? w.from), pt(w.to_xy_mm ?? w.to), mm(w.thickness)]);
  if (P.openings?.length) o.aciklik = P.openings.map(a => [a.id, a.wall_id, a.kind ?? a.tur, mm(a.offset_from_wall_start ?? a.konum), mm(a.width ?? a.en)]);
  if (P.spaces?.length) o.oda = P.spaces.map(s => [s.id, s.kind ?? s.tur, s.name ?? s.ad ?? null]);
  if (P.items?.length) o.esya = P.items.map(i => [i.id, i.space_id, i.kind ?? i.design?.kind ?? null, i.size_mm ? [mm(i.size_mm.w), mm(i.size_mm.d)] : null]);
  if (d.katlar) o.kat = Object.entries(d.katlar).map(([id, k]) => [id, mm(k.yukseklik)]);
  if (d.tekstil) o.tekstil = d.tekstil;
  return o;
}

// ---- sohbet biçimi: son asistan turu işlemleri taşır, önceki asistan turları yalnız cevap
const ornek = k => ({id: k.id, dil: k.dil, messages: [{role: 'system', content: SISTEM},
  ...(Object.keys(k.durum).length ? [{role: 'system', content: 'DURUM ' + JSON.stringify(ozet(k.durum))}] : []),
  ...k.mesajlar.map((m, i, a) => ({role: m.rol, content: m.rol === 'assistant' ? JSON.stringify({reply: m.metin, actions: i === a.length - 1 ? k.islemler : []}) : m.metin}))]});
const dev = g => parseInt(createHash('sha256').update(String(g)).digest('hex').slice(0, 8), 16) / 0xffffffff < DEV; // grup bazında, aynı evin kayıtları aynı bölmede
mkdirSync(OUT, {recursive: true});
const tr = al.filter(k => !dev(k.grup)), dv = al.filter(k => dev(k.grup));
writeFileSync(`${OUT}/train.jsonl`, tr.map(k => JSON.stringify(ornek(k))).join('\n') + (tr.length ? '\n' : ''));
writeFileSync(`${OUT}/dev.jsonl`, dv.map(k => JSON.stringify(ornek(k))).join('\n') + (dv.length ? '\n' : ''));
const dagilim = a => a.reduce((o, k) => (o[k.id.split(':')[0]] = (o[k.id.split(':')[0]] || 0) + 1, o), {});
const rapor = {surum: 'egitim-01', motor: VERSION, motor_denetimi: motor.sayim, tarih: new Date().toISOString(), ...sayim, train: tr.length, dev: dv.length, kume: dagilim(al), dil: al.reduce((o, k) => (o[k.dil] = (o[k.dil] || 0) + 1, o), {})};
writeFileSync(`${OUT}/rapor.json`, JSON.stringify(rapor, null, 1));
console.log(JSON.stringify(rapor, null, 1));
