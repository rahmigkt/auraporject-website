// Stüdyo motoru testleri: node tools/studyo-motoru/test.mjs
import {readFileSync} from 'node:fs';
import {uygula} from './motor.mjs';
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('✗', m); } else console.log('✓', m); };
// mobilya: valid edit, clamped edit, unknown op
{ const r = uygula({}, [{katman: 'mobilya', type: 'delta', key: 'width', value: 100}, {katman: 'mobilya', type: 'material', slot: 'wood', key: 'species', value: 'walnut'}]);
  ok(r.rapor.gecti && r.state.design.params.width === 2170, 'kanepe +100 mm ve ceviz kabul');
  const r2 = uygula({}, [{katman: 'mobilya', type: 'set', key: 'width', value: 9000}]); ok(r2.rapor.uyari.some(u => u.kod === 'sinira_takildi'), '9 m kanepe sınıra takıldı diye raporlanır');
  const r3 = uygula({}, [{katman: 'mobilya', type: 'enum', key: 'armType', value: 'uçan'}]); ok(r3.rapor.red.length === 1 && !r3.rapor.gecti, 'olmayan kol tipi reddedilir');
  const r4 = uygula({}, [{katman: 'mobilya', type: 'family', value: 'table'}, {katman: 'mobilya', type: 'seats', value: 6}]); ok(r4.state.design.family === 'table' && r4.rapor.olcum.mobilya.tur === 'dining', 'masa, 6 kişilik'); }
// ev + yerleşim on the Brussels example
{ const D = JSON.parse(readFileSync(new URL('../../assets/ev/ornekler/sohbet-1.json', import.meta.url)));
  const plan = {walls: D.walls, openings: D.openings, spaces: D.spaces, items: []};
  const r = uygula({plan}, [{katman: 'yerlesim', type: 'yerlestir', oda: 'salon', esyalar: [{tur: 'kanepe', en: 2100, derinlik: 900}, {tur: 'tv', en: 1600, derinlik: 420}, {tur: 'sehpa', en: 1000, derinlik: 600}],
    kisitlar: [{tur: 'bakar', a: 'kanepe', b: 'tv'}, {tur: 'yakin', a: 'sehpa', b: 'kanepe', mm: 1300}]}]);
  ok(r.rapor.olcum.yerlesim?.sigdi && r.rapor.olcum.yerlesim.kisit_karsilanan === 2, 'salon: kanepe TV\'ye bakar, sehpa yakın — çözücü yerleştirdi, kısıtlar tuttu');
  const r2 = uygula({plan}, [{katman: 'yerlesim', type: 'yerlestir', oda: 'wc', esyalar: [{tur: 'yatak', en: 1800, derinlik: 2100}]}]);
  ok(r2.rapor.uyari.some(u => u.kod === 'sigmiyor'), 'WC\'ye çift kişilik yatak: sığmıyor');
  for (const duzen of ['U', 'L']) { const rm = uygula({plan}, [{katman: 'yerlesim', type: 'yerlestir', oda: 'yatak1', esyalar: [{tur: 'meclis', duzen, derinlik: 800}, {tur: 'sehpa', en: 1000, derinlik: 600}]}]);
    const seg = rm.state.plan.items.filter(i => i.kind === 'majlis'); ok(rm.rapor.olcum.yerlesim?.sigdi && seg.length >= (duzen === 'U' ? 3 : 2), `meclis ${duzen}: ${seg.length} duvar boyunca oturma, sehpa ortada`); }
  const r3 = uygula({plan}, [{katman: 'ev', type: 'aciklik_ekle', wall_id: D.walls[0].id, tur: 'kapi', konum: -50, en: 900}]); ok(r3.rapor.red.length === 1, 'duvar dışına taşan kapı reddedilir');
  const kat = [{katman: 'ev', type: 'kat_ekle', id: 'k1', yukseklik: 2800}];
  const rs = uygula({plan}, [...kat, {katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k1', konum: [1500, 200], aci: 0, en: 900}]);
  ok(rs.rapor.gecti && rs.state.merdivenler?.[0]?.riser_count === 15, 'merdiven: 15 rıht ' + JSON.stringify(rs.rapor.olcum.ev.merdiven));
  const rs2 = uygula({plan}, [...kat, {katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k1', konum: [1500, 200], en: 700}]); ok(rs2.rapor.red[0]?.neden.includes('en az 800'), 'dar merdiven reddedilir');
  const rs3 = uygula({plan}, [...kat, {katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k1', konum: [1500, 200], en: 900, basamak_derinlik: 330}]); ok(rs3.rapor.red[0]?.neden.includes('adım kuralı'), 'adım kuralına uymayan merdiven reddedilir');
  const rs4 = uygula({plan}, [{katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k9', konum: [1500, 200], en: 900}]); ok(rs4.rapor.red.length === 1, 'olmayan kata merdiven reddedilir');
  const rs5 = uygula({plan}, [...kat, {katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k1', konum: [1500, 200], en: 900, basamak_sayisi: 12}]); ok(rs5.rapor.red[0]?.neden.includes('rıht'), 'yüksek rıht reddedilir');
  const rs6 = uygula({plan}, [...kat, {katman: 'ev', type: 'merdiven', alt: 'k0', ust: 'k1', konum: [1500, 200], en: 900, basamak_derinlik: 200}]); ok(rs6.rapor.red[0]?.neden.includes('basamak derinliği'), 'sığ basamak reddedilir');
  const rs7 = uygula({plan}, [{katman: 'ev', type: 'kat_ekle', id: 'k1', yukseklik: -2800}]); ok(rs7.rapor.red[0]?.neden.includes('kat yüksekliği'), 'negatif kat yüksekliği reddedilir');
  ok(uygula({plan}, []).rapor.gecti !== undefined, 'boş işlem listesi'); }
// tekstil
{ const r = uygula({}, [{katman: 'tekstil', type: 'perde', system: 'tul-fon', drape: {family: 'pamuk-kadife', color: 'zeytin'}}, {katman: 'tekstil', type: 'hali', construction: 'bukle', color: 'kum'}]);
  ok(r.state.tekstil.curtain.drape.family === 'pamuk-kadife' && r.state.tekstil.rug.construction === 'bukle' && r.state.tekstil.v === 2, 'perde kadife, halı bukle'); }
{ const r = uygula({}, [{katman: 'sihir', type: 'uc'}]); ok(r.rapor.red.length === 1, 'sözlükte olmayan katman reddedilir'); }
console.log(fail ? `${fail} test kaldı` : 'hepsi geçti'); process.exit(fail ? 1 : 0);
