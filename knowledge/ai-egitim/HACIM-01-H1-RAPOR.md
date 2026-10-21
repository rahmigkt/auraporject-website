# HACİM-01 — H1: dokuz dilde mobilya komutları

Başlangıç: `main` a724690 (#179). Dal: `hacim-1-komut`. Eğitim, model koşusu/indirme, GPU, ücretli API veya dağıtım yapılmadı. Bu teslim H1 grubudur; H2–H5 tamamlandı sayılmaz. İş emrindeki bir grup / bir PR sırası korunur.

## Sayım ve kapsam

| Dil | Tek işlem | Çoklu işlem | Netleştirme | Desteklenmeyen | Toplam |
|---|---:|---:|---:|---:|---:|
| TR | 120 | 50 | 20 | 10 | 200 |
| EN | 120 | 50 | 20 | 10 | 200 |
| DE | 120 | 50 | 20 | 10 | 200 |
| FR | 120 | 50 | 20 | 10 | 200 |
| NL | 120 | 50 | 20 | 10 | 200 |
| DA | 120 | 50 | 20 | 10 | 200 |
| ES | 120 | 50 | 20 | 10 | 200 |
| IT | 120 | 50 | 20 | 10 | 200 |
| AR | 120 | 50 | 20 | 10 | 200 |
| **Toplam** | **1.080** | **450** | **180** | **90** | **1.800** |

Arapça kullanıcı satırlarının 40/200'ü Körfez ağzı; asistan yanıtları Modern Standart Arapça. İnsan veya ana dil incelemesi taklit edilmedi. Kullanıcı metinlerinde kod alan adları yerine günlük ölçü, parça ve malzeme adları var. Belirsiz isteklerde asistan ölçü/niyet sorar; olmayan yeteneklerde sınırı söyler. İkisinde de `actions: []` ve başlangıç durumu aynen korunur.

Üç gerçek ürün ailesi: kanepe, yemek masası, gardırop. Ölçü, kumaş/lif, renk, ahşap türü ve ahşap tonu ayrı hedeflerdir. Oturma ürününün ahşap türünü değiştirdiğini iddia eden yanlış etiket yok; ahşap **tonu** `wood.stain` ile hedeflenir. Masa ve dolapta gerçek tür değişimi ayrı doğrulanır. Kumaş seçimi yangın/antibakteriyel sertifikası veya üretilebilirlik garantisi değildir.

Bu **1.800 bağımsız insan örneği değildir**. Her dil için ayrı yazılmış 20 olumlu cümle ailesi altışar gerçek değerle; aynı üründeki 25 işlem çifti ikişer birleşimle genişletilir. 20 soru ve 10 desteklenmeyen istek ayrı yazılmıştır. Çapraz dil ve değer çeşitleri aynı başlangıç ürünü grubunda tutulur. Sayı, bağımsız niyet kapsamı olarak sunulmaz.

## Motor, sözleşme ve karantina

- Her satır canlı `vocabulary(design)`, `sanitizeActions` ve `tools/studyo-motoru` üzerinden geçer. Gerçek `actions.js` çalışır; başsız taklit motor yoktur.
- Yalnız `rapor.gecti` yeterli sayılmadı: her istenen değer sonuçta bire bir kontrol edildi. Son teslimde **1.800/1.800 kabul, 0 ret, 0 uyarı, 0 hedef farkı**. İlk denemede 52 cm kol yüksekliğinin 56 cm'ye sınırlanması yakalandı; yanlış hedef teslim edilmedi. Sınırlama mutasyon testiyle korunur.
- `state + user → {reply, actions}` ham hedefidir. `karantina.jsonl`, aynı hedeflerin `AURA-EGITIM-1` izdüşümüdür; ek 1.800 kayıt olarak sayılmaz. Kaynak dosya SHA'sı, motor ağacı SHA'sı ve doğrulama her kayda/rapora bağlıdır.
- Yeni H1 karantinası mevcut birleşik 2.590 satırı ve donmuş bölüm atamalarını değiştirmez. Envanter: **2.590 + 1.800 = 4.390 aday satır**, benzersiz proje sayısı değil. Birleşik korpusla tekrar incelemesi bekler. Eğitim için uygun satır **0**; mevcut eğitim dışa aktarımları boştur.
- İnsan onayı, ana dil doğrulaması ve birleşik korpus tekrarı çözülmeden eğitim kapısı açılamaz. Bu H1 izdüşümü bağımsız karantinadır; eski tam dönüştürücünün tüm kümeleri yeniden üretmesi bu teslimin parçası değildir.

## Kapalı sınavdan ayrım

Üretici sınav dosyasını okumaz. Ayrı salt okunur denetim, 120 donmuş görevin **kullanıcı metnini** aynı dilde karşılaştırır; hedef işlemler üretime taşınmaz. Sayı/aksan/noktalama normalizasyonu, karakter üçlüleri ve sözcük kapsama kontrolü uygulanır. Çoklu isteklerin her bölümü ayrı taranır. Belirlenen eşiklerde **0 yakın eşleşme**; en yüksek skor yaklaşık 0,784. Tam kopya, sayı değiştirme ve ek cümleyle gizleme negatif testleri geçer.

Bu sözcüksel taramadır; bütün anlamsal benzerlikleri veya çeviri sızıntısını ispatlayan bir model değildir. Aynı stüdyo becerileri sınanacağı için genişlik/renk gibi genel işlem türlerinin ortak olması beklenir. İnsan sızıntı incelemesi hâlâ gereklidir. Sınav dosyaları değişmedi, eğitim girdilerine alınmadı.

## İnceleme ve tekrar üretme

[Bütün 1.800 kaydı filtrele](HACIM-01-H1-inceleme.html). Dil/tür filtresi, Arapça sağdan sola gösterim, başlangıç ürünü, kısa yanıt, tam işlem dizisi ve motor raporu bulunur. Sayfa salt okunurdur; insan kararı üretmez.

```text
node tools/hacim-01/build.mjs
node tools/hacim-01/audit.mjs
python tools/hacim-01/common.py
node tools/hacim-01/review.mjs
node tests/hacim-komut-check.mjs
python tests/hacim-komut-schema-check.py
node tests/hepsi.mjs
```

Python `jsonschema` gerektirir; yerel mevcut bağımlılık kullanılır. Katalog Git bloblarını okur: yeni JSON dosyaları commit edildikten sonra `python tools/toparlama/katalog.py` çalıştırılır. Tekrar üretme onayları devralmaz.

## Açık işler ve sonraki grup

Ana dil ve tasarımcı incelemesi yok. Bu ilk 1.800 satır `set`/`material` odaklıdır; göreli `delta`, biçim `enum`, mutfak/banyo ve daha bağımsız söyleyiş kapsamı sonraki veri iyileştirmesidir. Dil karışması/yasaklı terim taraması mekaniktir, ana dil kalitesi onayı değildir. Eski birleşik korpusla anlamsal tekrar incelemesi tamamlanmadı.

H2'nin ilk ülkesi **BE**: mevcut 8 geometrili sohbetten 30'a tamamlanacak. Sonra NL, DE, FR, UK, IE, DK, ES, IT, AT, CH, TR; her ülke ayrı tur ve PR. H3/H4/H5 kendi ayrı PR'larında. Yeni kapı/meclis/kat/merdiven desteği bu H1'e varsayılmadı; geldiğinde ilgili kayıtlar güncel motorla tekrar doğrulanacak.
