# CODEX-IS-EMRI-EV-QWEN-00D — Gerçek plan verisiyle çalış: açık veri setleri, kurgu çıkarımı, gerçek plandan üretim

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex
**Sıra:** Bu iş emri EV-QWEN-00B'nin sentetik yerleşim yaklaşımının **yerine geçer**. 00C (Avrupa) bunun üzerine kurulur. `assets/` yasak; `tools/`, `knowledge/` ve büyük veri için depo dışı çalışma klasörü serbest.

## 1. Karar

Ev planını kurallarla sıfırdan keşfetmeye çalışmak yanlış bir yol. 00B'de bunun sonucu görüldü:
- WC, kiler ve banyo 10–12 m² çıktı;
- odalar eşit şeritlere bölündü;
- bu planlar ölçülerden yine de 87–100 puan aldı.

Açık lisanslı on binlerce **gerçek** konut planı var. Kullanıcı (Hüseyin) da bunları GitHub'da gördüğünü belirtti. Bu iş emrinden itibaren plan bilgisinin kaynağı gerçek plan verisidir. Kurallar yalnızca doğrulama ve düzeltme için kullanılır.

## 2. Bilinen adaylar (Claude ön tespiti; Codex doğrular ve genişletir)

| Veri seti | Büyüklük | Lisans (doğrulanacak) | Not |
|---|---|---|---|
| **Swiss Dwellings** (Archilyse, Zenodo 10.5281/zenodo.7070952 ve yeni sürümleri) | ~42.000 daire, ~242.000 oda, ~3.100 bina | CC BY 4.0 | **Avrupa.** Duvar, kapı, pencere, oda, donatı ve oda başına güneş, manzara ve gürültü simülasyonu. Hedef pazarımıza en uygun kaynak. |
| **Modified Swiss Dwellings (MSD)** (4TU, arXiv 2407.10121) | 5,5 GB, bina kompleksleri | Sayfada belirtilmemiş; doğrulanacak | Swiss Dwellings'ten türetilmiş, makine öğrenmesine hazır biçim. |
| **ResPlan** (github.com/m-agour/ResPlan, arXiv 2508.14006) | 17.000 plan, vektör ve graf | Veri CC BY 4.0, kod MIT | Komşuluk grafı üretme araçları hazır. |
| RPLAN, CubiCasa5k, 3D-FRONT, Structured3D, LIFULL, FloorPlanCAD | çeşitli | Çoğu ticari kullanıma kapalı ya da izne bağlı | **Eğitim verisine girmez.** Yalnızca kurgu istatistiğini karşılaştırmak için okunabilirlik notu. |

Codex GitHub, Zenodo, Hugging Face, Kaggle ve akademik kaynaklarda **kapsamlı tarama** yapacak. En az 15 veri seti incelenecek. Özellikle aranacaklar:
- Avrupa ülkeleri: Belçika, Hollanda, Almanya, Fransa, Birleşik Krallık, Danimarka, İspanya, İtalya; ulusal açık veri portalları ve belediye plan arşivleri;
- çok katlı ve müstakil konutlar.

Her veri seti için şunlar raporlanır:
- lisans metni bağlantısı ve **ticari kullanım ile türev model dağıtımı kararı**;
- plan sayısı, ülke ve bölge;
- biçim (vektör, raster, graf);
- ölçek bilgisi var mı (gerçek metre);
- oda etiketleri, kapı ve pencere bilgisi;
- kat bilgisi;
- kalite sorunları.

Lisansı CC BY olanlar için atıf yükümlülüğü `knowledge/ai-egitim/VERI-ATIF.md` dosyasına yazılır.

## 3. Görevler

### A · İndirme ve dönüştürme (`tools/ev-plan/real/`)

- Lisansı uygun veri setleri indirilir. Büyük dosyalar Git'e konmaz: indirme komutu, hash ve manifest kaydedilir.
- Her plan **EV-01 v0.2 şemasına** dönüştürülür: duvarlar, açıklıklar, odalar, oda tipleri, katlar. Dönüştürücü ölçeği korur (mm).
- Oda tipleri ortak bir sözlüğe eşlenir (salon, mutfak, yatak, banyo, WC, kiler, hol, balkon...). Eşlenemeyen etiketler raporlanır.
- Bozuk ya da ölçeksiz planlar ayıklanır. Ayıklama oranı ve nedenleri raporlanır.

### B · Gerçek istatistikler (00B'deki yanlış eşiklerin yerine)

Gerçek verilerden ülke ve plan tipine göre çıkarılacaklar:
- oda tipi başına **alan ve en dağılımları** (yüzdelikler);
- dolaşım oranı;
- oda sayısı ve toplam alan ilişkisi;
- tipik komşuluklar.

Kalite ölçüleri (`metrics.py`) bu dağılımlara göre yeniden kalibre edilir. Hedef: 00B'deki "WC 10,9 m²" planı düşük puan almalı; gerçek planlar yüksek puan almalı. Bu, gerçek ve sentetik planlarla test edilir.

### C · Kurgu çıkarımı (`plan_program`)

Her gerçek plandan 00B sözleşmesindeki `plan_program` çıkarılır: odalar, alanlar, bölgeler, komşuluk grafı, cephe ilişkileri, dış biçim. Böylece **binlerce gerçek program–plan çifti** oluşur. Bunlar hem Qwen'in eğitim hedefi hem çözücünün referansıdır.

### D · Plan üretimi: önce gerçek plandan uyarlama

Önerilen sıra (Codex karşılaştırıp gerekçeyle seçer):

1. **Getir ve uyarla (eğitimsiz, hemen):** Kullanıcının isteğinden çıkan programa en yakın gerçek planlar bulunur. Ölçüt: oda sayısı, alan, graf benzerliği, dış biçim. Plan istenen dış ölçüye ölçeklenir ve uyarlanır; doğrulayıcıdan geçirilir. Kullanıcıya 3–5 gerçekçi seçenek sunulur. Bu, eğitim gerektirmeden bugün en gerçekçi sonucu verir.
2. **Öğrenilmiş yerleşim (sonra):** Gerçek veriyle eğitilmiş graftan plana modeller. HouseDiffusion, Graph2Plan ve MSD'deki taban modeller incelenir: lisansları, eğitim maliyeti, ticari kullanım. Hangisinin, hangi veriyle, hangi donanımda eğitilebileceği raporlanır. Bu adım ayrı bir onayla başlar.
3. **Qwen'in rolü:** İstek → `plan_program` ve düzeltme işlemleri. Eğitim verisi gerçek planlardan çıkarılan programlar ve bunlara yazılan çok dilli istek cümleleridir. 00B'deki sentetik istekler yalnızca bu gerçek programlara bağlanarak tekrar kullanılabilir.

### E · İnceleme

- Her ülke ve tipten gerçek planlar ile "getir ve uyarla" sonuçları yan yana gösterilir; en az 60 örnek. 00B'deki inceleme sayfası kullanılır (iyi / zayıf / neden).
- Örnek planlar `ev.html` ile açılabilir kat JSON'u olarak verilir.

### F · Taban ölçüm

Kullanıcının makinesinde 9B model tamamlanamadı. Bu turda şu iki yoldan biri seçilir:
- 0,5–2B parametreli küçük bir Qwen ile CPU'da ölçüm;
- ölçümün donanım ihtiyacını ve tahmini maliyetini raporlamak. Karar kullanıcınındır; **GPU kiralanmaz**.

## 4. Kapanış koşulu

- Kapsamlı veri seti raporu; lisans kararlarıyla en az 15 kaynak.
- En az bir büyük Avrupa veri seti (Swiss Dwellings) EV-01 v0.2'ye dönüştürülmüş; manifest ve ayıklama raporu hazır.
- Gerçek dağılımlarla kalibre edilmiş kalite ölçüleri. 00B'nin hatalı planları düşük, gerçek planlar yüksek puan alıyor.
- "Getir ve uyarla" çalışıyor; 60 örneklik inceleme sayfası hazır.
- GPU kapısı kapalı. Öğrenilmiş model eğitimi ayrı onayla.

## 5. Kurallar

- Lisansı ticari kullanıma ya da türev model dağıtımına kapalı veri **eğitime, uyarlamaya ve ürün çıktısına girmez**. Belirsiz lisans "kullanılamaz" sayılır.
- CC BY verilerinde atıf zorunludur; atıf dosyası güncel tutulur.
- Kişisel veri içeren kaynak (adres, isim) kullanılmaz ya da temizlenir.
- Rapor: `knowledge/ai-egitim/EV-QWEN-00D-RAPOR.md`. `QWEN-KUSURLAR.md` güncellenir.
