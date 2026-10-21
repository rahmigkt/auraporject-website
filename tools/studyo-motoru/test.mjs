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
  const big = [{tur: 'mutfak', en: 3000, derinlik: 600}, {tur: 'tv', en: 2000, derinlik: 450}, {tur: 'kanepe', en: 2400, derinlik: 950}, {tur: 'sehpa', en: 1200, derinlik: 600}, {tur: 'masa', en: 2000, derinlik: 1000}];
  const rk = uygula({plan}, [{katman: 'yerlesim', type: 'yerlestir', oda: 'salon', esyalar: big}]);
  ok(rk.rapor.uyari.some(u => u.kod === 'sigmiyor') && rk.rapor.oneri?.length > 0, 'büyük takım sığmıyor; öneri verildi: ' + JSON.stringify(rk.rapor.oneri));
  const rk2 = uygula({plan}, [{katman: 'yerlesim', type: 'yerlestir', oda: 'salon', esyalar: big, kucultme: 'izinli'}]);
  ok(rk.rapor.oneri?.[0]?.kod !== 'kucultme_onerisi' || (rk2.rapor.olcum.yerlesim?.sigdi && rk2.rapor.uyari.some(u => u.kod === 'kucultuldu')), 'küçültme önerildiyse izinle uygulanır: ' + JSON.stringify(rk2.rapor.uyari));
  const r3 = uygula({plan}, [{katman: 'ev', type: 'aciklik_ekle', wall_id: D.walls[0].id, tur: 'kapi', konum: -50, en: 900}]); ok(r3.rapor.red.length === 1, 'duvar dışına taşan kapı reddedilir');
  const r4 = uygula({plan}, [{katman: 'ev', type: 'merdiven'}]); ok(r4.rapor.red[0]?.neden.includes('henüz'), 'merdiven: motorda henüz yok diye dürüst ret');
  ok(uygula({plan}, []).rapor.gecti !== undefined, 'boş işlem listesi'); }
// tekstil
{ const r = uygula({}, [{katman: 'tekstil', type: 'perde', system: 'tul-fon', drape: {family: 'pamuk-kadife', color: 'zeytin'}}, {katman: 'tekstil', type: 'hali', construction: 'bukle', color: 'kum'}]);
  ok(r.state.tekstil.curtain.drape.family === 'pamuk-kadife' && r.state.tekstil.rug.construction === 'bukle' && r.state.tekstil.v === 2, 'perde kadife, halı bukle'); }
{ const r = uygula({}, [{katman: 'sihir', type: 'uc'}]); ok(r.rapor.red.length === 1, 'sözlükte olmayan katman reddedilir'); }
console.log(fail ? `${fail} test kaldı` : 'hepsi geçti'); process.exit(fail ? 1 : 0);
