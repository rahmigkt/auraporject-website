# PR 1 doğrulama kaydı

2026-10-18. Bu kayıt dosya bütünlüğü ve editoryal incelemenin sınırlarını bildirir; onay modeli veya kör
insan değerlendirmesi sonucu değildir.

## Tekrarlanabilir kontrol

Depo kökünde: `node tests/text-eval/verify-stage1.mjs`.

Kontrol mevcut motoru ve sözlüğü salt okunur kullanır; API çağrısı veya üretim yapmaz. Sayımlar, kimlik
tekilliği, kartların sözlük yolları, kaynak kimlikleri, tasarımların normalizasyonu ve motor hata kayıtları,
metinlerin alanları/uzunlukları, kayıtlı dayanak/etkinlik değerlerinin tasarımla eşleşmesi ve Markdown
inceleme kopyalarının güncelliği denetlenir. Yerel belge bağlantıları da kontrol edilir.

| Kontrol | Sonuç |
| --- | --- |
| Kurucu yaklaşım kapısı | Karar sahibi 30 denemeye temel olarak onayladı |
| Fenomenoloji | 15 ayrı birincil metin; bölüm/sayfa ve kullanım sınırı kayıtlı |
| Malzeme | 17 ayrı teknik/kurumsal yayın; okunan bölüm ve kullanım sınırı kayıtlı |
| İlk malzeme dilimi | 67/130 kavram (%51,5); sözlük bağları geçerli |
| Tasarımlar | 10; altı aile, on stil kimliği; mevcut motorla hata yok |
| Denemeler | 30 ayrı kayıt; tasarım başına 3; 20 TR + 10 EN |
| Tanıklık uzunluğu | 68–84 kelime; boşlukla ayrılmış kelime sayımı |
| İz alanı | Her kayıtta tek cümle |
| Dayanak | JSON yolları ve değerleri, etkinlik koşullarıyla kayıtlı ve eşleşiyor |
| Yayın / eğitim onayı | Yok; bütün denemeler `denetim_bekliyor` |

## Editoryal inceleme

Kurucu ilkeler kurucu PDF ve beş HTML paragrafıyla karşılaştırıldı; PDF'nin basılı numaraları tekrar ettiği
için fiziksel sayfa numarası kullanıldı. Şablon artıklarından ilke türetilmedi. Araştırma notlarında dış
eserlerden doğrudan alıntı kullanılmadı; erişim bütün kitapların okunduğu iddiası olarak sunulmadı.

Otuz denemede malzeme adı, biçim, sayı, gövde/yüzey ve parça iddiaları tek tek tasarım karşılığıyla okundu.
Özellikle meşe rengi/ağaç türü, kaplama/masif, bronz cam/metal, ebonize/abanoz, lake/urushi ayrımları
korundu. Hiçbir denemede müşteri geçmişi, yaşanmış patina, gerçek ocak/menşe, sertifika, ergonomi,
akustik veya sağlık sonucu öne sürülmedi. Kullanım anları olasılık ve düşünme çağrısı olarak yazıldı.
Etkin olmayan varsayılanlar iddia kaynağı yapılmadı: M04 cam tablasının dolu ahşap alanları, M07 taş
tezgâhının varsayılan meşe alanı ve M10 ayna tasarımının kullanılmayan tezgâh alanı bunlara örnek.

Denemeler reklam sıfatları yerine yaklaşma, el uzatma, yan yana olma, geri koyma, çalışma ve bakışın
dönmesi gibi ilişkilerden hareket eder. Aynı tasarımın üç metni ayrı yazıldı; EN üçüncü metinler bağımsız
yeniden yazımlardır. Bu, dil ve ses kalitesinin bağımsız olarak kanıtlandığı anlamına gelmez.

## Açık işler ve yorum sınırı

- Kartlar ilk dilimdir. Renk/desen/lavabo bitişi için 63 katalog kartı, ayrıca parça/etkinlik bağları,
  türlere özgü botanik ve zanaat monografileri tamamlanmadı. Her karttaki ortak duyusal notlar bu
  belirsizlikleri gizlemek yerine yazıcıya sınır koyar.
- Kaynak dengesi ilk karşılaştırma zemini sağlar; bütün dünya geleneklerini kapsamaz. İngilizce çeviri
  ağırlığı ve Okyanusya eksikliği kayıtlıdır. Müze koruma ve sektör kaynakları yeni ürün testi değildir.
- `gurgen` etiketinin botanik uyuşmazlığı çözülmedi; tür iddiası bekletildi, motor değiştirilmedi.
- Dayanak yollarının eşleşmesi tek başına bütün doğal dil iddialarının otomatik denetlendiği anlamına
  gelmez. Anlamsal denetleyici, rubrik, farklı model incelemesi ve sistematik benzerlik ölçümü PR 2 işidir.
- Tekrar eden yaklaşma/geri dönme imgelerinin ses üzerindeki etkisini karar sahibi ve denetçi ayrıca
  değerlendirmeli. İlk denemeler nihai ses standardı veya çeşitlilik başarısı olarak puanlanmadı.
- Karar sahibinin kör seçimi, seçilmiş/düzeltilmiş altın küme, API üretimi, Qwen ince ayarı ve eğitim
  koşusu yapılmadı. Diğer bekleyen iş emirlerine geçilmedi.

Değişiklik kapsamı yalnız `knowledge/aura-ses/` ve bu dosyaları okuyan `tests/text-eval/verify-stage1.mjs`.
`assets/`, `tests/ai-eval/score.mjs`, 01A/01B sınav kayıtları ve bekleyen iş emirleri değiştirilmez.
