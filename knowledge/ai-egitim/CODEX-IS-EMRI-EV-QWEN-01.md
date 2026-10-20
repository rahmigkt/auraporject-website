# CODEX-IS-EMRI-EV-QWEN-01 — Ev projesi için Qwen'in görevleri: araştırma, veri ve ölçüm planı

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex (araştırma, veri, değerlendirme seti; `assets/` klasörüne dokunmaz)

## Yön değişikliği

Mobilya tasarımı bugünkü menü seviyesinde kalıyor. Yapay zekânın asıl işi **bütün ev projesi**:
- evi tanımak ve krokisini çizmek;
- odaları farklı biçimlerde (girinti, çıkıntı, L, kırık duvar) üretmek;
- kullanıcının yüklediği mobilya fotoğraflarını tanıyıp stüdyoya en yakın tasarım olarak aktarmak.

Bu işler önce büyük bir genel model ya da tarayıcıda çalışan küçük açık modellerle yapılacak, gerçek denemelerden sonra gerekirse Qwen'e eğitim verilecek. Bağlam belgeleri:
- `knowledge/ev-projesi/EV-ARASTIRMA-01.md` ve `EV-PLAN-ARASTIRMA-02.md`;
- örnek plan `knowledge/ev-projesi/veri/ornek-plan-3oda.json`;
- ilk görüntüleyici `ev.html`.

## Görevler

### G1 · Fotoğraftan en yakın tasarım (ücretsiz yol)

- **Model:** Tarayıcıda çalışabilecek açık görüntü gömme modelleri; örneğin CLIP, SigLIP ve MobileCLIP (transformers.js veya ONNX Runtime Web ile). Her model için:
  - lisans;
  - boyut (MB);
  - telefonda ilk yükleme ve çıkarım süresi (kaynaktan);
  - mobilya benzerliğindeki başarıyı gösteren kaynak.
- **Katalog:** Stüdyonun önceden çizilmiş tasarım kataloğuyla eşleştirme yöntemi. Kaç çeşit gerekir, hangi açılardan çizilmeli, arka plan nasıl olmalı? Fotoğraf tarafında arka plan temizleme seçenekleri (açık modeller, lisanslarıyla).
- **Değerlendirme seti:** En az 60 fotoğraflık bir set. Aileler: oturma, masa ve sehpa, dolap, yatak. Her fotoğraf için:
  - kaynak bağlantısı;
  - lisans; yalnızca ticari kullanıma izin veren ya da sadece bağlantıyla kullanılacak test görselleri;
  - beklenen aile ve tür;
  - görünen temel özellikler (kol, ayak, sırt, panel yanlı taban gibi), stüdyo parametre adlarıyla.
- **Teslim:** `knowledge/ai-egitim/veri/foto-benzerlik-seti.json`

### G2 · İstekten ev krokisi

- Kullanıcı cümleleri: "3+1, 120 m², salon güneyde, mutfak salona açık" gibi en az 40 örnek istek, Türkçe ve İngilizce.
- Her biri için EV-01 şemasına uygun beklenen plan özellikleri: oda listesi, yaklaşık alanlar, bitişiklik ve geçiş ilişkileri, zorunlu kurallar (asgari ölçüler, ıslak hacimlerin gruplanması, dolaşım).
- Açık lisanslı ve ticari kullanıma uygun konut planı veri setleri. CubiCasa5k NC olduğu için hariç.
- Kural tabanlı plan üretimi ile model tabanlı üretimin karşılaştırması: hangisi önce, hangisi sonra kullanılmalı?
- **Teslim:** `knowledge/ai-egitim/veri/plan-istek-seti.json`

### G3 · Kırık ve özel oda biçimleri

- Gerçek dairelerde sık görülen oda biçimleri: L, girinti ve çıkıntı, kolon, eğik duvar, balkon bağlantısı, niş, şaft.
- Her biri için örnek geometri (EV-01 şeması) ve plan editörünün desteklemesi gereken işlemler.
- **Teslim:** `knowledge/ev-projesi/veri/oda-bicimleri.json`

### G4 · Fotoğraf ya da planın fotoğrafından kroki

- Kâğıt plan veya tapu planı fotoğrafından duvar çıkarma için açık yöntemler ve modeller: vektörleştirme, raster-to-vector; lisansları ve doğrulukları.
- Oda fotoğrafından düzen tahmini: HorizonNet ve benzerleri; ağırlık ve veri lisansları ayrı.
- **Teslim:** kısa rapor.

### G5 · Qwen'in rolü ve araç sözleşmesi

- Yukarıdaki işlerde büyük model mi, küçük açık model mi, kural mı daha uygun?
- Qwen'in hangi araçları çağıracağı: plan oluştur, oda böl, duvar taşı, mobilya yerleştir, fotoğraftan tasarım bul.
- Asistan sözleşmesi (`knowledge/ev-projesi/veri/asistan-sozlesme.json`) bu araçlarla güncellenecek. Değişiklikler öneri olarak yazılır, mevcut dosyanın üzerine yazılmaz.
- Ölçüm planı: eğitimden önce hangi testlerde hangi başarı oranı aranmalı?

## Kurallar

- Belgesiz bilgi yok. Lisans her model ve veri için kaynakla belirtilir. Ticari kullanıma kapalı kaynaklar "kullanılamaz" olarak işaretlenir.
- Eğitim, GPU kiralama ya da ücretli servis başlatılmaz. Kod yazılmaz, `assets/` klasörüne dokunulmaz.
- Ana rapor: `knowledge/ai-egitim/EV-QWEN-ARASTIRMA-01.md`
