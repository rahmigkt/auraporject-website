# CODEX-IS-EMRI-PERDE-01 — Perde ve pencere giydirme: ülke ve kültürlere göre kapsamlı araştırma ve uygulanabilir veri

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex (araştırma ve veri). Uygulamayı Claude yapar.
`assets/` yasak; `knowledge/` ve `tools/` serbest.

## Amaç

Perde AURA'da ayrı bir ürün olarak satılmaz. Ama ev projesinin içinde her pencere için doğru öneri yapılmalı:
- ölçüsü, kumaş metrajı ve montajıyla;
- kullanıcının **ülkesine ve kültürüne** uygun olarak.

Claude bu veriyle stüdyoda parametrik perdeyi çizecek (ev.html: plan, maket, kesit, oda içi) ve asistan bu veriyle öneri yapacak.

**Ders:** Önceki çalışmalarda uzman sayılan bir asistan bile 20 m² banyo, 33 m² giriş, kalıp cümle gibi büyük hatalar yaptı. Bu iş emrinde **her sayı kaynaklı**, her kural **ülke kapsamlı**, her örnek **gerçek hayattan doğrulanabilir** olmalı.

## Kapsam: ülkeler ve kültürler

Belçika (Flaman, Brüksel, Valon), Hollanda, Almanya, Avusturya, İsviçre, Fransa, Birleşik Krallık, İrlanda, Danimarka, İsveç, Norveç, İspanya, Portekiz, İtalya, Türkiye.

Her ülke için şunlar araştırılır (kaynaklı: perakendeci rehberleri, üretici föyleri, standartlar, tasarım literatürü, kültür araştırmaları):

1. **Pencere giydirme kültürü:**
   - Perde kullanımı ne kadar yaygın? Örneğin Hollanda'daki "perdesiz pencere" geleneği, Kuzey'de ışık önceliği, Türkiye'de tül + fon ikilisi, Belçika'da vitrage, İspanya'da persiana, İtalya'da tapparella ve iç perde.
   - Mahremiyet ve dışarıdan görünme algısı.
   - Oda bazında alışkanlıklar: salon, yatak odası, mutfak, banyo, çocuk odası.
2. **Pencere tipleri ve kepenk/panjur geleneği:** dış panjur, jaluzi, kepenk, Fransız balkonu, çatı penceresi, sürgülü bahçe kapısı, cumba ve bay window, tam boy cam. Ülkeye göre standart pencere ölçü aralıkları ve denizlik yükseklikleri.
3. **Perde türleri ve ülkedeki adları:**
   - fon (drape);
   - tül (sheer, voilage, vitrage, Gardine, store);
   - karartma (blackout);
   - stor (roller), zebra;
   - Roma (Raffrollo, store bateau);
   - plise (Plissee), jaluzi (Venetian), dikey perde;
   - kafe perdesi (Scheibengardine, brise-bise);
   - panel perde (Flächenvorhang).
   
   Her türün o ülkede ne kadar yaygın olduğu ve hangi odada kullanıldığı yazılır.
4. **Başlık ve montaj:**
   - başlık tipleri: pile (pinch, pencil, wave/S-fold), halka, kuşgözü, büzgü, tünel, cırt bant;
   - montaj: rustik çubuk, ray (tavan, duvar, gömme/kartonpiyer içi);
   - ülkeye göre tercih edilen tipler;
   - ray ve çubuğun pencereden taşma payı;
   - tavan ve duvar montaj yükseklikleri;
   - perdenin yere değme biçimi: değmeyen, tam boy, yere yığılan (puddle).
5. **Ölçü ve kumaş hesabı (en önemli kısım):**
   - büzgü katsayısı (fullness), başlık tipine göre (1,5× – 3×);
   - panel sayısı;
   - kumaş eni (140, 280, 300 cm boydan boya tül), desen tekrarı, dikiş ve kıvırma payları, çekme payı;
   - stor ve plise için iç veya dış montaj toleransları.
   
   Kaynaklı formül ve 5 tam çözülmüş örnek hesap yazılır. Örnek: 160×140 cm pencere, tavana ray, wave başlık, 300 cm boydan tül.
6. **Kumaş:**
   - tür, gramaj ve opaklık sınıfları (sheer / dimout / blackout);
   - ısı ve ses yalıtımlı kumaşlar;
   - yıkama ve çekme;
   - ışık haslığı;
   - yanmazlık sınıfları ve hangi yerlerde zorunlu olduğu: B1 / M1 / EN 13773 / BS 5867, konut ile kamu yapısı ayrımı.
7. **Renk ve estetik eğilimler** (kaynaklı): ülke ve iklime göre tercih edilen tonlar ve desenler. Duvar ve zemin rengiyle uyum ilkeleri, iç mimarlık literatüründen.
8. **Güvenlik:** çocuk güvenliği için kordon ve zincir standartları (EN 13120, EN 16433/16434), ağırlık ve montaj taşıma kapasitesi.
9. **Fiyat aralıkları (yalnızca bilgi):** ülkeye göre hazır ve ısmarlama perde fiyat bandı. Kaynak, tarih ve para birimiyle; teklif değildir.

## Teslim

1. `knowledge/ev-projesi/PERDE-ARASTIRMA-01.md`: ülke ülke rapor ve kaynak listesi.
2. `knowledge/ev-projesi/veri/perde-kulturu.json`, ülke anahtarlı. Her ülke için:
   - oda bazında varsayılan giydirme önerisi (ör. `{salon: ['tül', 'fon'], yatak: ['karartma stor', 'fon']}`);
   - yaygınlık düzeyleri;
   - yerel adlar (8 dil + Türkçe);
   - kaynak kimlikleri.
3. `knowledge/ev-projesi/veri/perde-hesap.json`: başlık tipine göre büzgü katsayıları, paylar, kumaş enleri, montaj taşma ve yükseklik kuralları, iç/dış montaj toleransları; her değer kaynaklı ya da "öneri" olarak işaretli.
4. `knowledge/ev-projesi/veri/perde-gorunum.json`: Claude'un parametrik çizimi için görsel parametreler:
   - kıvrım sayısı ve derinliği (başlık tipine göre);
   - tül saydamlığı, fon dökümü;
   - ray ve çubuk kesitleri;
   - stor, plise ve Roma perdenin kaldırılmış ve indirilmiş hâlleri.
   
   Görsel referanslar yalnızca bağlantı olarak verilir, kopyalanmaz.
5. `tools/perde/hesap.py` ve testleri: pencere ölçüsü, başlık, montaj ve ülke girdisiyle kumaş metrajı, panel sayısı, ray boyu ve stor ölçüsü üretir. Testlerde 5 örnek hesabın sonucu birebir doğrulanır.
6. Asistan için en az **30 örnek diyalog parçası**:
   - kullanıcının kendi dilinde, doğal cümlelerle;
   - kültüre uygun öneri: Hollanda'da perdesiz pencere tercihine saygı, Türkiye'de tül + fon gibi;
   - ölçü bilinmediğinde soru sorma;
   - çelişkili istek ("tamamen karanlık ama tül istiyorum").
   
   Kalıp cümle yok; her kullanıcı farklı konuşur. Asistan tonu sıcak ve AURA'nın "mekânın aurası" bakışıyla uyumlu olur: ışık ve mahremiyet dengesi.

## Kurallar

- Belgesiz sayı yok. Kaynak bulunamazsa "kaynak bulunamadı" yazılır, uydurulmaz.
- Lisanslı içerik (fotoğraf, katalog metni) kopyalanmaz; bağlantı ve özet verilir.
- Perakendeci rehberleri kaynak olarak kullanılabilir. Ancak tek bir markanın kuralı ülke geneli diye sunulmaz; en az iki bağımsız kaynakla karşılaştırılır.
- Ücretli servis, GPU ve eğitim yok.
