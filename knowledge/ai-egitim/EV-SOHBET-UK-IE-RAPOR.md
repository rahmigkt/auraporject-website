# Birleşik Krallık ve İrlanda: sonraki ülke turu

2026-10-21 · Kullanıcı isteği: Avrupa sırasındaki sonraki ülkeye başla.

## Teslim

[İnceleme sayfası](EV-SOHBET-UK-IE-inceleme.html): Londra, Edinburgh, Cardiff, Belfast, Dublin, Cork, Galway, Limerick. Sekiz ayrı, elle yazılmış İngilizce sohbet; her biri 8 kullanıcı–asistan alışverişi, toplam 128 mesaj. Birleşik Krallık'ın dört yetki alanı ayrı tutuldu. Galce, İskoç Galcesi ve İrlandaca bu turun kapsamında değil.

Sekiz farklı Swiss Dwellings 3.0.0 kaydı, önceki 20 kayıttan farklıdır. Kaynaklar CC BY 4.0: [Zenodo / Archilyse AG](https://zenodo.org/records/7788422). Her kayıtta atıf, kaynak kimliği ve tam kaynak geometri bulunur. `fixture_sha256`, anahtarları sıralanmış UTF-8 JSON içeriğinin özetidir; ham dosya bayt özeti değildir. Döndürme/öteleme ve duvar eksenlerini düğümleme işlemleri kayıtlıdır; kaynak odalar büyütülmedi. Bunlar yerel ev keşifleri veya ülkeye özgü bina tipolojisi kanıtı değildir.

Tüm örnekler tek kaynak katıdır. Belfast'ta istenen sıra evin üst katı uydurulmaz; ölçülü üst kat ve merdiven bilgisi istenir. Fotoğraftan ölçü çıkarıldığı, erişilebilirliğin onaylandığı, AURA'nın eski yatak ailesini tekrar satışa aldığı veya tam ev projesinin tamamlandığı söylenmez. Yatak nesneleri yalnız boyut referansıdır. Mutfak, döşeme gibi korunacak elemanlar yeni ölçülmüş imalat olarak gösterilmez. Son karar tasarımcıdadır.

## Ölçüm ve doğrulama

| Kontrol | Sonuç |
|---|---|
| Kaynak, oda geometrisi, duvar, açıklık ve yerleşim denetimi | 8/8 yeni hata olmadan; kaynak istisnaları ayrı |
| Bütün proje ölçü hedeflerini eksiksiz karşılama | **0/8** |
| Korunan kaynak hedef sapmaları | **25:** 19 kapı genişliği, 3 banyo alanı, 2 ham pencere/zemin oranı, 1 WC alanı |
| Çözücü tekrar çalıştırma | 8 kayıt, 23 istek denemesi; kayıtlı sonuçlarla aynı |
| Yeni turda çözülemeyen yerleşim | 0; başarısız deneme uydurulmadı |
| Önceki turda gerileme | 20 kayıt / 74 deneme / 10 gerçek no-fit sonucu aynı |
| Yeni kusur aşılama testleri | 8/8 geçti |
| Yerel kaynaklardan yeniden üretim | 8/8 kayıt bayt düzeyinde aynı |
| Önceki denetim testleri | 14/14 geçti |
| Gerçek stüdyo dosya açma | 4/4; oda sayısı ve net alan doğru; plan ve maket görünümleri; sayfa hatası yok |

Başarılı geometri denetimi, 25 kaynak sapmasının düzeltildiği anlamına gelmez. Kapı menteşeleri bilinmediğinde geniş ve ihtiyatlı açıklık zarfı kullanılır; pencere donanımı ve gerçek net geçiş yerinde doğrulanmalıdır. %10 ham pencere/zemin oranı gibi önceki iş emri hedefleri ulusal kanun olarak sunulmaz.

Yeni kayıtlar: `veri/ev-sohbet-uk-ie/`. Makine denetimi `denetim-sonucu.json`, çözücü kanıtı `solver-tekrar-sonucu.json`. [Dört stüdyo örneği ve ekran görüntüleri](ev-sohbet-uk-ie-ornekler/) altında `viewer-results.json` bulunur. Bunlar tek katın iç mekân dışa aktarımlarıdır; balkonlar yalnız görüntüleyicinin alan toplamından ayrılır, tam kayıtta kalır. Görüntüleyicideki varsayılan tavan yüksekliği ve kuzey etiketi gerçek keşif kanıtı değildir.

## Kaynaklı yetki alanı sınırları

- **İngiltere:** [NDSS](https://www.gov.uk/government/publications/technical-housing-standards-nationally-described-space-standard/technical-housing-standards-nationally-described-space-standard) yeni konut planlaması ve yerel kabul bağlamındadır. İç oda poligonları toplamını GIA yerine koymadık; mevcut kiralık daireye otomatik onay verilmez.
- **İskoçya:** [2025 domestic handbook](https://www.gov.scot/publications/building-standards-technical-handbook-january-2025-domestic/) ayrı mevzuat sistemidir. Açılan kaynak sayfası Temmuz 2025 güncellemesini bildirir; somut işin tarihine uygulanacak sürüm ve teknik maddeler henüz belirlenmedi. Bütün PDF hükümleri okunmuş gibi gösterilmez.
- **Galler:** [2021 kalite gereklilikleri](https://www.gov.wales/development-quality-requirements-housing-associations-and-local-authorities-2021) sayfası sosyal konut bağlamındadır, Mart 2026 güncellemesi görünür. Özel mevcut daireye koşulsuz uygulanmadı; PDF'nin bütün teknik maddeleri doğrulanmadı.
- **Kuzey İrlanda:** [Technical Booklet K](https://www.finance-ni.gov.uk/publications/technical-booklet-k) havalandırma konusundadır. İngiltere'deki K başlığıyla merdiven onayı üretilmedi; İrlanda Cumhuriyeti ile karıştırılmadı.
- **İrlanda Cumhuriyeti:** [Resmî kiralık konut asgari standartları](https://www.gov.ie/en/department-of-housing-local-government-and-heritage/publications/minimum-standards-in-rented-accommodation/) resmî arama indeksinden incelendi; tam sayfa erişimi 403 verdi. Aydınlatma/havalandırma için gerçek yapı bilgisi istenir. Güncel apartman planlama politikası ve sayısal eşikler bu turda doğrulanmadığı için geçer sonucu verilmedi.

Makine okunur erişim ve kapsam bilgisi `veri/ev-sohbet-uk-ie/ulke-kaynaklari.json` içindedir. Yerel mevzuat uygunluğu tüm kayıtlarda `unknown_not_certified`, GIA ise `null` kalır. Ülke profili, yasal onay değildir.

## Yeniden çalıştırma

Python ortamında Shapely 2.1.2 gerekir. Yerel kaynak arşivi olmadan, depoya eklenen lisanslı sekiz fixture ile tekrar üretilebilir:

```text
python tools/ev-sohbet/uk_ie.py
node tools/ev-sohbet/place02.mjs knowledge/ai-egitim/veri/ev-sohbet-uk-ie
python tools/ev-sohbet/uk_ie_dialogues.py
python tools/ev-sohbet/uk_ie_review.py --annotate
python tools/ev-sohbet/uk_ie_audit.py
python tools/ev-sohbet/uk_ie_review.py
node tools/ev-sohbet/verify02.mjs knowledge/ai-egitim/veri/ev-sohbet-uk-ie
python -m unittest discover -s tools/ev-sohbet -p test_uk_ie.py -v
python -m unittest discover -s tools/ev-sohbet -p test02.py -v
node tools/ev-sohbet/verify02.mjs
node tools/ev-sohbet/viewer02.cjs knowledge/ai-egitim/ev-sohbet-uk-ie-ornekler
```

Son komut Playwright ve Chrome gerektirir. Gerçek `ev.html` içindeki dosya girdisini kullanır; plan/maket ekran görüntülerini yeniler. Önceki tur araçlarının varsayılan dizin davranışı korunur; yeni dizin isteğe bağlı argümandır.

## Dal ve devam sırası

Bu teslim `codex/ev-sohbet-02` üzerine açılan `codex/ev-sohbet-uk-ie` dalındadır; #138 henüz birleştirilmediği için PR tabanı önceki daldır. #138 onaylanıp birleştirildikten sonra bu PR main'e taşınmalıdır. Önceki 20 sohbet ve `assets/` değiştirilmedi. Eğitim, GPU kiralama, ücretli API ve canlı dağıtım yapılmadı.

[Ülke durum tablosu](EV-ULKE-SIRASI.md): sıradaki Danimarka, ardından İspanya, İtalya, Avusturya–İsviçre. Bu tur yerel tipolojilerin tamamını ve bütün Avrupa'yı tamamlamaz.
