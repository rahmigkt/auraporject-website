# Claude'a devir: Tasarla / Ev tekstili kalitesini düzelt

21 Ekim 2026 · Kullanıcı isteği üzerine araştırma devri. **Bu dosya uygulanmış değişiklik raporu değildir.** Codex yalnız araştırma teslim etti. Başlangıç incelemesi main `47457ed`; uygulamadan önce değişen dosyaları karşılaştır, başka işlerin değişikliklerini geri alma.

## Önce oku

1. `PERDE-HALI-ARASTIRMA-02.md` — mevcut kod bulguları ve kaynaklı araştırma.
2. `veri/tekstil-02-kaynaklar.json` — kaynak, erişim ve lisans sınırları.
3. `veri/tekstil-02-oneriler.json` — kumaş/halı/palet önerileri; gerçek ürün ölçümleri değildir.
4. Önceki `PERDE-ARASTIRMA-01.md`, `veri/perde-hesap.json`, `perde-gorunum.json` ve `tools/perde/hesap.py` — mevcut ölçü, kaynak ve güvenlik sınırlarını koru.

Araştırma PR'ı henüz main'de değilse `codex/perde-hali-arastirma-02` dalındaki bu dosyaları oku. Kullanıcının “araştırmayı Claude'a ver” talebi, buradaki önerilerin otomatik uygulandığı veya onaylandığı anlamına gelmez; uygulama mevcut depo kurallarına göre ayrı dal/PR üzerinden yapılır.

## Hedef

Tasarla'daki perde/halı, düz renk şeması yerine kumaş karakteri görülen, ölçüye bağlı ve Ev görünümüyle tutarlı bir önizleme olsun. Üç iyi örnek onaylanmadan onlarca yeni seçenek ekleme. Mevcut ev/mobilya yerleşim çözücüsünü değiştirerek kalite sorununun etrafından dolaşma.

### Öncelik 1 — tek veri sözleşmesi ve doğru biçim

- Lif, yapı, renk, ışık işlevi, başlık ve katmanlar ayrı alanlar. “Keten” eski renk anahtarını %100 keten iddiasına dönüştürme.
- Tül/fon bağımsız açılır; katman renkleri bağımsızdır. `open_fraction` yönü nettir: 0 kapalı / 1 açık önerilir; eski `closed_fraction` alanıyla terslik varsa açık migrasyon ve test gerekir.
- Wave, pencil ve dikilmiş çift pile, üst başlıkta ayırt edilir. Sonraki aşamada Roman/stor/plise kendi hareketini alır; aynı düzlemi yeniden adlandırma.
- Açık/yarım/kapalı geçişte düz kumaşın yay uzunluğu korunur. Mevcut 1800 mm pencere örneğinde açık panelin 2415 mm yerine 497.4 mm'ye düşmesi düzeltilmelidir. Sinüsün genliğini sınırsız büyütmek, panelin kendi içinden geçmesini kabul etmek değildir.
- Donanım profili park enini ve derinliğini belirler. Sabit 100 mm katman aralığı her kumaşa yetmez; profil uymuyorsa çarpışma/uyumsuzluk göster. Pencere kanadı, radyatör ve zeminle kesişme olmasın.
- Halıda yapı / desen / lif / hav yüksekliği / toplam kalınlık / kenar ayrı. Kilim = baklava deseni eşitliği kaldırılır; her modele aynı bordür eklenmez.

### Öncelik 2 — ortak gerçek önizleme

- `textilePreview()` SVG'si küçük açıklama şeması olarak kalabilir; ana önizleme aynı geometri/malzeme koduyla 3D olsun. Tasarla ve Ev ayrı malzeme tanımlarıyla görünüş değiştirmesin.
- Üç karşılaştırma sahnesi hazırla: **açık dokuma tül + mat fon**, **kadife fon**, **düz dokuma kilim ile kısa havlı halı**. Her sahnede genel görünüş ve yakın plan; perdede üç açılma durumu, tül+fonda iki katman ayrı kontrol edilsin.
- Lif normal/roughness ve kumaş kıvrımı ayrı; UV gerçek ölçekte ve kumaşa bağlı olsun. Metre ile milimetre karışmasın. Kumaş açılırken desen büyüyüp küçülmesin.
- Gün/gece karşılaştırması aynı malzeme tanımını kullanmalı; opacity ayarını güne göre keyfî değiştirerek sonucu kurtarma. Tülün gece mahremiyetini garanti etme. Blackout kumaş, kenar kaçağı sıfır oda anlamına gelmez.
- Üretici görsellerini indirme hakkı otomatik varsayılmaz. Önce CC0 aday veya özgün prosedürel haritalar. Kaynağı ve fiziksel ölçeği manifestte tut; karbon dokusunu keten diye kullanma.

### Öncelik 3 — kullanıcı seçimi ve kalıcılık

- Önce sistem ve kullanım ihtiyacı, sonra kumaş ailesi / başlık / renk. İleri ayarlar ayrı açılır; shader parametreleri kullanıcıya sunulmaz.
- Kumaş kartında gerçek ölçekli yakın görünüş ve düşüş kesiti olsun; sadece renk noktaları değil. Kart adları fiziksel tedarik kodu gibi davranmasın; numune doğrulaması gereken seçim açıkça belirtilsin.
- Eski `aura-tekstil` verisi okunur; yeni kayıt sürümlüdür. Kaydet/yükle sonrasında kumaş, katman, açılma, renk, seed ve oda/pencere tercihleri aynıdır. Ev JSON'undan gelen tercih localStorage'daki genel tercihle ezilmez.
- Bütün site dilleri, klavye kullanımı, seçili durum ve erişilebilir isimler korunur. Düzenleme paneli mobilde önizlemeyi kullanılmaz hâle getirmesin.

## Ölçülebilir kabul tablosu

Bunlar önerilen proje kabul hedefleridir, ürün standardı veya yapılmış benchmark değildir.

| Test | Beklenen |
|---|---|
| Kumaş boyu | Açık/yarım/kapalı mesh yatay yay boyu seçili düz panel eninden en çok %2 farklı; kendine/diğer katmana kesişme yok |
| Dalga/başlık | Aynı renkte wave, pencil ve çift pile görsel olarak farklı; başlık raydan kopmaz |
| Katman | Tülü kapalı tutup fonu açma ve tersini yapma; iki katmanın tercihleri kayıtta bağımsız |
| Gerçek ölçek | 400×400 mm alanı doğrulanan Fabric061 tekrarının UV'si metreye doğru çevrilir; başka kumaşa aynı ölçek kanıtsız taşınmaz |
| Boy değişimi | 1.2 / 1.8 / 3.0 m açıklık ve 2.2 / 2.8 m düşüşte doku/başlık esnemez; düşük ray/zemin farkı negatif geometri üretmez |
| Park hacmi | İnce tül ile ağır fonun parkı aynı blok gibi görünmez; donanımın desteklemediği konfigürasyona sahte başarı verilmez |
| Halı | Düz dokuma, kısa hav ve ilmek aynı renk/desende bile farklı okunur; yüksekliği bilinmeyen SKU üretim ölçüsü almaz |
| Tekrarlanabilirlik | Aynı proje + seed → aynı mesh/doku; Math.random kaynaklı farklılık yok |
| Kayıt gerilemesi | Eski tercih → yeni biçim → kaydet/yükle; mevcut oda/ürün/yerleşim bilgisi korunur |
| Render | WebGL düşük kalite yolu, katman şeffaflığı ve gölge; ön/arka/yan açı, gün/gece, açık/koyu arka plan |
| Performans | Gerçek cihaz/model, çözünürlük, p50/p95 kare süresi, draw call, doku indirme ve GPU belleği raporlanır; düşük kalite hedefi ≥30 fps öneridir, ölçülmüş sonuç değildir |
| Lisans | Kullanılan kodun commit'i ve lisansı; her asset'in kaynak URL'si, lisansı, ölçeği ve dosya özeti |

İlk uygulama PR'ına önce/sonra aynı kamera ve ışıkla ekran görüntüleri ekle. Veri ve geometri kusurları sayısal testlerle, malzeme görünüşü gerçek ekran görüntüleriyle değerlendirilsin. Sadece “testler geçti” görsel kabul yerine geçmez. Üç örnek kabulünden sonra diğer başlık ve kumaş aileleri genişletilsin.

## Şimdi kapsam dışı

GPU kiralama, Qwen eğitimi, generatif görsel API'si, sürekli soft-body fiziği, React'e geçiş, bütün ülkelerin kumaş tercihlerini uydurma, üretici kataloğunun tamamını kopyalama. Fiziksel malzeme ölçümü yoksa PBR ayarları önizleme parametresidir; üretim/yangın/akustik/ısı sertifikası değildir. Son proje ve üretim kararı tasarımcıya gider.
