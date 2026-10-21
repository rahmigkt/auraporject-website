# TOPARLAMA-01 · Aşama 5: Arap dünyası — kısmi, açık teslim

Aşama 4 / PR #165 üzerine `toparlama-5-arap`. Bu aşama **tamamlandı sayılmıyor**; karşılanamayan geometri/işlem koşulları aşağıda açık. İş emrinin tıkanan bölümü raporlayıp sonraki aşamaya geç kuralı uygulanır.

## Yapılanlar

- `knowledge/ev-projesi/ARAP-ARASTIRMA-01.md` ve `veri/arap-ulkeleri.json`: dokuz ülke, önceki 18 kaynağın sınırları, ülke bazlı tercih soruları, null net alan/yasal ölçüler. SBC'nin aile/kat kapsamı resmî katalogdan yeniden kontrol edildi. Önceki Dubai PDF bağlantısının 404 verdiği kaydedildi; resmî belediye yayın sayfası alternatif olarak eklendi.
- `veri/meclis.json`: üreticinin açık sayfasından iki dış mekân modülünün dış derinlik/oturma/toplam yükseklikleri, kaynak ve mm dönüşümü. İç mekân veya ülke standardı sayılmadı. Gerçek minder derinliği, kalınlığı, modül genişliği ve köşe birleşimi doğrulanmadığı için null. L/U niyeti, orta alan/kapı/erişilebilirlik gereksinimleri ve Claude'a entegrasyon notları var; çalışır meclis parçası yok.
- 12 ayrı Arapça **ön görüşme**: AE 3 / SA 3 / QA 2 / KW 2 / EG 1 / MA 1; sekizer kullanıcı-asistan çifti, 192 mesaj. Farklı kullanıcı ağızları, ısrar/kural dışı duvar isteği, bütçe ve öncelik değişimi, korunacak eşya, perde/halı/ışık, mahremiyet ve hareket ihtiyacı. Asistan MSA, son karar tasarımcıda. Doğu Arap rakamı kullanılan konuşmada biçim korundu. Dış model/API veya gerçek müşteri fotoğrafı kullanılmadı.
- `ARAPCA-STUDYO-INCELEME-01.md`: ana dil değerlendiricisi için 12 bağlamlı terim satırı ve RTL/sayı/ölçü kontrol listesi. leaves anahtarının masa uzatma tablası ile dolap kapağında ortak kullanıldığı kaynak kodundan görüldü; yalnız kelimeyi değiştirmek anlam çakışmasını çözmez. assets değiştirilmedi. Diğer öneriler kesin dil hatası ilan edilmedi.
- EV-ARAP-01/C'deki önceki 28 sohbetin üslup işi Aşama 4'te tamamlanmış metin taramasına dahildir; burada yeniden geometri veya eski onay değiştirilmedi.

Okuma: `knowledge/ai-egitim/EV-SOHBET-ARAP-inceleme.html`. Kaynak kod: `tools/ev-arap/`. Dönüştürücü eksik planı işlem başarısına çevirmeyecek şekilde genişletildi; katalog bu kümeyi geometri kaynağı olmayan, inceleme bekleyen metin taslağı olarak tanır.

## Gerçek denetim

`python tools/ev-arap/build.py` → 12 konuşma / 192 mesaj; **qualified_solver_conversations=0**, iki katlı villa isteği 2, iki katlı villa geometrisi 0.

`python tests/toparlama-arap-check.py` → PASS: ülke sayıları, sekiz çift, iç terim/dil sezgiseli, Doğu Arap rakamı, eksik planı dolu/başarılı gösteren mutasyonlar, meclis derinliğini uydurmama kontrolleri. 12 dosya tekrar üretimde byte-identical. `git diff --check` geçti.

## Açık kusurlar / yapılamayanlar

**EV-ARAP-01/B'nin çözücüyle döşenmiş 12 planı teslim edilmedi.** Bütün yeni kayıtlar ölçülü plan/ürün işlemi bekler; plan=null, işlem ve yerleşim listeleri boş, denetim gecti=false. Bunlar bu eksik işin yerine veya bitmiş proje diye sayılmıyor. İki villa isteği iki katlıdır ama kat/merdiven doğrulanmış kaynağı yok; motorun kat ve merdiven yeteneği de henüz yok. Meclis parçası ekleme görevi assets sahibinde; sıradan kanepe adı değiştirilmedi. İzni belirsiz Bahreyn çizimleri alınmadı, yeni koordinat uydurulmadı.

Dokuz ülkenin tam tipoloji/net alan ve madde bazlı mevzuatı, yararlı minder/köşe ölçüleri ve ana dil/designer değerlendirmesi hâlâ açık. Üreticinin dış mekân ürünü iç mekân ergonomi standardı değildir. Dil/üslup kontrolü ana dil onayı sayılmaz. Aşama 1'in tam test yeşili açığı da sürüyor.

Sonraki sınav/hazırlık işi bu açıkları gizlemeyecek; Arap dosyaları eğitime hazır sayılmayacak. Eğitim/GPU/ücretli API, canlı dağıtım veya PR birleştirmesi yapılmadı.

## Birleşik veriye ekleme ve dondurulmuş bölme

12 ön görüşme karantinaya eklendi: toplam 2.578, yeterli eğitim kaydı 0. Önceki 2.566 satırın içeriği ve bölüm ataması birebir korundu; 40 motor raporu kaynak ağacı/girdi hash kontrolüyle kullanıldı, yeni koşu sayılmadı. 242 kaynak bileşeninde 193/24/25 grup, satırlarda 2191/191/196 var. Yeni veri eklendiğinde bütün kaynakları yeniden sıralayan önceki yaklaşım, ileride eski test kaydını train’e taşıyabilirdi. `split-ledger.json` bu atamaları dondurur; yeni dil aynı kaynak grubunda kalır ve eski train/test kaynaklarını bağlayan bir köprü açık hatadır. Yeni kaynaklar kararlı yaklaşık 80/10/10 kovasıyla eklenir. Split-ledger mutasyon/stabilite testi ve 2.578 ortak kayıt denetimi geçti.
