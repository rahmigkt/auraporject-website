# TOPARLAMA-01 — denetçiye teslim

21 Ekim 2026. PR'lar açık, hiçbiri birleştirilmedi. İnceleme zinciri aşağıda; yalnız ilk PR main tabanlıdır, her sonraki PR önceki aşamanın üstündedir.

| Aşama | PR | Gerçek teslim |
|---|---|---|
| 1 Hijyen | [#157](https://github.com/rahmigkt/auraporject-website/pull/157) | Eski çakışmalar/arşiv,45hafif pilot dosyası,gerçek çözücü testleri,toplu denetim komutu |
| 2 Katalog | [#159](https://github.com/rahmigkt/auraporject-website/pull/159) | Dosya/hash/lisans/kayıt/dil/ülke/katman; güncel son katalog37küme1034dosya |
| 3 Ortak biçim | [#162](https://github.com/rahmigkt/auraporject-website/pull/162) | Şema/dönüştürücü, kaynak gruplu bölme, onay kapısı; son toplam2578karantina,train/dev/test0 |
| 4 Üslup | [#165](https://github.com/rahmigkt/auraporject-website/pull/165) | 40sohbet tarandı,38sohbette178mesaj düzenlendi; gövde/geometri korunmuş,old/new inceleme |
| 5 Arap | [#166](https://github.com/rahmigkt/auraporject-website/pull/166) | **Kısmi:** kaynak profilleri,meclis/UI incelemesi,12ön görüşme/192mesaj. Yeni ölçülü yerleşim0 |
| 6 Sınav | [#167](https://github.com/rahmigkt/auraporject-website/pull/167) | 120ayrı görev,100olumlu motor gold kontrolü,puanlayıcı ve CPU koşu planı; model koşusu yok |
| 7 Hacim | [#168](https://github.com/rahmigkt/auraporject-website/pull/168) | **Durum raporu, veri teslimi değil.** 18ülke açığı ve ön koşullar;30–40/ülke ve9×200komut tamam değil |
| 8 Hazırlık | [#170](https://github.com/rahmigkt/auraporject-website/pull/170) | Plan2,cevap maskesi,koşullu süre/maliyet/dağıtım; eski pilot planı arşivde,başlatma kapalı |

## İnceleme girişleri

- [Katalog](KATALOG.html)
- [40 sohbet eski/yeni inceleme](TOPARLAMA-4-inceleme.html)
- [12 Arapça ön görüşme](EV-SOHBET-ARAP-inceleme.html)
- [Aşama6 sınav raporu](toparlama-01/ASAMA-6-RAPOR.md)
- [Hacim açığı](toparlama-01/ASAMA-7-HACIM-DURUM.md)
- [Eğitim/dağıtım hazırlığı](toparlama-01/ASAMA-8-HAZIRLIK.md)

## Claude/stüdyo sorumlusuna bağımlılıklar

- Ev/yerleşim/tekstil için canlı sohbet istemi ve eylem köprüsü, tur başına durum/eylem etiketi. Son yerleşim sonucunu bütün mesajların etiketi yapmak yanlış olur.
- Meclis parçaları ve iki kat/merdiven: izinli ölçülü kaynak gelmeden koordinat/üretim onayı yok.
- Arapça mobilya terimleri native inceleme listesi; özellikle masa uzatması ile dolap kapaklarını ayıran anahtarlar.
- Eski dış services bağımlılıkları ve normalize tasarım snapshotları; sahiplikli ayrı düzeltme gerekir.

## Açık kabul koşulları

İnsan/native onayı, kaynak geometri istisnaları, tam yeşil depo testi,120sınav uzman onayı,gerçek temel model/biçim/gerileme ölçümleri ve hacim eksik. Bunlar kapanmış gösterilmedi. Kayıt bazlı eski40onay yeni2578adaya genellenmedi. GPU/onay kapısı kapalıdır; yeni eğitim veya ücretli kaynak açılmadı.

Korunanlar: TOPARLAMA dalında stüdyo/assets/API/kökHTML/.htaccess ve eski tests/ai-eval/score.mjs üzerinde özgün değişiklik yok. Aşama1'e alınan main#156 ortak motor değişiklikleri upstream kaynak olarak korunmuştur. İnceleme tabanı motorcommit523bd813; sonradan değişen stüdyoda tekrar doğrulama gerekir. Anahtar/ağırlık/müşteri fotoğrafı eklenmedi; canlı deploy yok.

## Son toplu doğrulama

`node tests/hepsi.mjs`: **57/62 geçti**, çıkış1. Ham çıktı [hepsi-sonuc.json](toparlama-01/hepsi-sonuc.json). Python bağımlılık yolu ev-plan-deps, timeout180sn. `forma-check.mjs` 148.665ms'de geçti; ilk koşudaki60sn süre aşımı giderilmiş ölçüm sınırıdır, işlevsel hata değildir.

Kalan beş hata:

| Test | Neden |
|---|---|
| assistant-contract-check | Dış services/design/style-training.mjs yok |
| codesign-check | Dış services/design/server.mjs yok |
| studio-agent-check | Dış services/design/studio-agent.mjs yok |
| qwen-studio-data-check | İlk toplu koşuda main#156 nedeniyle eski VM fonksiyon sınırı kayıptı; ortak actions.js importuna düzeltildi. Ayrı son koşuda tarihsel snapshot yeni body alanları nedeniyle yine başarısız; eski kanıt değiştirilmedi |
| text-eval/verify-stage1 | Tarihsel M01 güncel normalizasyonda noncanonical |

Takipte `toparlama-studio-replay-check.mjs` ayrı geçti:5aile×set/delta,derlenmiş geometri,girdi değişmezliği,bilinmeyen anahtar reddi. Bu yeni test toplu koşu başladıktan sonra eklendiği için57/62 sayısına dahil edilmedi. [Takip ham kaydı](toparlama-01/replay-son-denetim.json). Etkilenen tek eski import eden test ayrıca yeniden çalıştırıldı. Büyük toplu koşu tekrar edilmedi.

Yeni sınav:120görev/100olumlu motor gold kontrolü/119assertion grubu geçti; model koşusu yok. Stil taraması40sohbet/640mesajda yasaklı terim0,60kelimeüstü0,dil karışması sezgisi0,tekrar0; ana dil incelemesi hâlâ bekliyor. Beş ülke kümesinin137yerleşim isteği tekrar karşılaştırıldı;10sığmama korunuyor. Katalog/şema/kaynak bölmesi ve eğitim planı kontrolleri geçti.

İlk46/52 raporu tarihsel olarak saklıdır. Tam yeşil kabul ve5/7aşamalarının tamamlanması iddia edilmez.
