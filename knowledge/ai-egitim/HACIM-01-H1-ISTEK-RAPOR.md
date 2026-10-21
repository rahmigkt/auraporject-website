# HACIM-01 — H1: ev projesi istekleri

Başlangıç: `main` e7a8efc, 21 Ekim 2026 kapsam kararı (#180). Dal: `hacim-1-istek`. Bu teslim H1 grubudur. H2–H5 tamamlanmış değildir. Eğitim, model indirme/koşusu, GPU, ücretli API, dağıtım ve PR birleştirmesi yapılmadı. `assets/`, `api/`, kök HTML ve puanlayıcı değiştirilmedi.

## Kapsam ve sayım

TR, EN, DE, FR, NL, DA, ES, IT ve AR'nin **her birinde 200** kayıt: 120 tek işlem, 50 çoklu işlem, 20 netleştirme, 10 kapsam dışı istek. Toplam **1.800**. Arapça kullanıcı satırlarının **40/200'ü Körfez ağzı**, kalanları ve asistan yanıtları Modern Standart Arapça adayıdır. Ana dil onayı bekleniyor.

Hedefler yeni oda sınırı ve türü, bağımsız duvar çalışması, kapı/pencere, toplam eşya ölçüsü ve yerleşim, seçili odada perde/halı ve oda adıdır. Salon 3+2+1, yatak ve iki komodin, çocuk yatağı ve masa, gardırop, ayakkabılık ve yemek masası örnekleri vardır. `mobilya` katmanına işlem yoktur. Kol, ayak, kapak, dikiş ve benzeri istekler stüdyoya yönlendirilir ve `actions: []` döner. Belirsiz istekte de soru sorulur, durum değişmez.

1.800 bağımsız gerçek müşteri niyeti olduğu iddia edilmez. Her dilde 20 tek-istek ailesi altışar değerle, 25 işlem çifti ikişer birleşimle, 10 soru ailesi ikişer oda adıyla ve 10 kapsam yanıtı ile hazırlanmıştır. Oda geometrisi AURA'nın sentetik, birbirinden bağımsız oda çalışmalarıdır; gerçek bina kaynağı veya mimari uygunluk onayı değildir. Aynı temel planı paylaşan bütün diller/değerler tek kaynak grubunda tutulur; bağımsız dev/test kapsamı sunulmaz.

## Motor ve karantina

**1.800/1.800 kabul; ret 0, uyarı 0, hedef farkı 0.** Üretim motoru kullanılır. Sadece kabul bayrağına bakılmaz: oda sınırı, türü, açıklık konumu/eni, tekstil seçimi ve her eşyanın toplam eni/derinliği sonuçla karşılaştırılır. Tam aynı durum/işlem dizileri dil çeşitlerinde aynı motor kanıtını paylaşır; bu bağımsız geometrik örnek diye sayılmaz.

Birincil hedef `state + user → {reply, actions}` biçiminde dokuz JSONL dosyasıdır. `karantina.jsonl` aynı kayıtların `AURA-EGITIM-1` izdüşümüdür; fazladan 1.800 kayıt değildir. Ortak sözleşmedeki `tur` işlem adı ile yerel oda/açıklık `tur` değerinin çakışması `arguments` alanıyla kayıpsız giderildi; ortak adaptör eski düz işlemleri de destekler. Her izdüşüm birincil işlem dizisine bire bir geri çevrilerek denetlenir.

İnsan onayı **0**, eğitime uygun satır **0**, yeni eğitim dışa aktarımı **0**. Mevcut birleşik 2.590 aday ile bu 1.800 aday toplam 4.390 aday satırdır; benzersiz proje sayısı değildir. Eski mobilya detayı odaklı `hacim-1-komut` dalındaki kayıtlar bu teslimin kaynakları değildir; o çalışma yerinde korunmuştur. Birleşik korpusla anlamsal tekrar ve yeni kapsamın eski korpusa uygulanması ayrı inceleme gerektirir.

## Sızma ve dil denetimi

Üretici sınavı okumaz. Ayrı denetim 120 donmuş görevin yalnız kullanıcı metnini dışlama için okur. Sayı/aksan/noktalama normalizasyonu, karakter üçlüleri, sözcük kapsaması ve noktalı virgülle ayrılmış alt istek taraması kullanılır. Değişmeyen eşiklerde yakın eşleşme **0**; en yüksek skor yaklaşık **0,817**. İlk taramada eski Almanca TV'ye dönük kanepe ailesinde 10 eşleşme bulundu; o hedef ailesi bütün dillerde farklı 3+2+1 setiyle değiştirildi. Sınav hedefleri kopyalanmadı, eşikler düşürülmedi. Tam kopya, sayı değiştirme ve ek istekle gizleme negatif testleri var.

Bu sözcüksel taramadır; bütün anlamsal veya diller arası benzerliklerin yokluğunu kanıtlamaz. Var olan dokuz dil üslup taramasında yasaklı terim **0**, mekanik dil karışması **0**, 60 sözcüğü aşan asistan yanıtı **0**. Kısa yanıt/cümle ailesi tekrarı açıktır. Ana dil değerlendirmesi taklit edilmedi.

## Main'deki eski kanıtların yeniden doğrulanması

Başlangıç motorunda 11 eski kanıt uyuşmazlığı temiz a724690 çalışma kopyasında tekrarlandı (`main-baslangic-hatalari.json`). e7a8efc ile bu başlangıç arasındaki fark yalnız kapsam belgeleridir; motor ağacı aynıdır. H1 kontrollerini geçirtmek için puanlayıcı veya eski görev metinleri değiştirilmedi.

- 40 Avrupa sohbetinin ve 12 ölçülü Arapça sohbetin yerleşim çıktıları güncel motorla yenilendi. Eski Git dosya baytları arşivdedir. Avrupa'da kullanıcı girdileri, konuşmalar, ölçüler ve sığma kararları eşitlik kontrolüyle korunur. Arapça 39 inceleme çıktısı iki tam üretimde aynı baytları verdi; konuşmalar değişmedi. Güvensiz eski kapı önü seçeneği negatif test olarak arşivden okunmaya devam eder.
- Eski üslup hash'leri arşivdeki özgün Python verisine karşı kontrol edilir. Yalnız motor çıktıları için yeni hash zinciri eklenir. DK/ES/IT eski tam üretim iddiaları arşivlendi; yeni dosya hash'leri güncellendi, bütün eski üreticinin yeniden aynı çıktıyı verdiği iddia edilmedi.
- Birleşik korpusun 64 sohbet izdüşümü incelendi; 52 motorlu izdüşüm yenilendi, diğer 2.526 aday değişmedi. Sayı, kaynak bölmeleri ve boş eğitim dışa aktarımları korunur.
- Donmuş sınavın **120 görev baytı ve puanlayıcısı aynı**. 100 olumlu hedef hâlâ tam makine puanı alır; 89 çıktı aynı, 11 yerleşim çıktısı yeni motorla farklıdır. Eski kaynak manifesti arşivlendi; yeni kaynak manifesti açık mekanik karşılaştırmaya bağlıdır. Bu model koşusu veya insan onayı değildir. H5'teki yeni kapsam sınavına geçiş ayrıca yapılacaktır.

## İnceleme ve doğrulama

[1.800 kaydı dil ve türe göre incele](HACIM-01-H1-ISTEK-inceleme.html). Sayfa yalnız inceleme içindir; insan kararını kaydetmez. JavaScript ayrıştırma, dokuz dil sayımı, işlem üretmeyen kartlar, Arapça RTL niteliği ve sayfalama yerel DOM taklidiyle kontrol edildi. Tarayıcı bağlantısı erişim kısıtıyla açılamadığı için görsel/cihaz doğrulaması yapılmış sayılmadı.

Tekrar üretme komutları: `tools/hacim-istek/README.md`. H1 testleri: `node tests/hacim-istek-check.mjs` ve `python tests/hacim-istek-schema-check.py`. Tam depo koşusu ve son kabul sonucu teslimden önce bu rapora eklenecek.

## Açık kusurlar ve sıra

İnsan ve tasarımcı incelemesi bekliyor. Yerleşim hedefleri eşya grubu/ölçü odaklıdır; bu pakette yakınlık/bakış gibi ek kısıt çeşitliliği yoktur. Aydınlatma motor sözlüğünde yoktur. Proje gönderme işlemi yalnız kabul kaydı üretir; gerçek gönderim/kalıcılık hedefi olarak kullanılmadı. Tekstil seçili oda çalışmasına aittir; çok odalı bağımsız kalıcılık iddia edilmez. Yeni veri sayısı bu eksikleri kapatmış sayılmaz.

Bir sonraki grup H2-BE: mevcut 8 geometrili sohbeti 30'a tamamlayan 22 yeni sohbet, ayrı tur ve ayrı PR. Devamında iş emrindeki ülke sırası uygulanır. Her grup karantinaya girer; eğitim kapısı insan onayına bağlı kalır.
