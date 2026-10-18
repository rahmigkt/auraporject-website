# GÖRSEL-01 · PR 1 denetimi

Bu PR yalnızca eskizin çizgi düzenini değiştirir. Ürün geometrisi, parça listesi, malzeme,
ölçü, üretim dosyası ve renkli render yolu değişmez. Son görüntü, atmosfer, yakın plan ve
arayüz dili sonraki PR'ların konusudur.

## Çizgi kararları

- Dış siluet: ekran ölçeğinde 1,35 CSS piksel, koyu grafit. Kamera uzaklığı veya milimetre
  cinsinden model boyutu çizginin ağırlığını değiştirmez.
- Parça kenarı: 1 piksel, daha açık grafit ve %62 örtücülük; 36° eşik, küçük yüzey kırıklarının
  çizgi kalabalığını azaltır. Bu, üretim geometrisinin sadeleştirilmesi değildir.
- Kulp, fitil, düğme, hasır ve benzeri iç ayrıntı: 1 piksel, daha açık ton ve %42 örtücülük.
  WebGL'nin taşınabilir çizgi genişliği 1 piksel olduğu için bu basamak tonal ağırlıkla ayrılır.
  Dikiş/kakma çizgileri kırmızı kalır, örtücülüğü %58'e iner.
- Komşu parçaların dünya koordinatındaki aynı veya kısmen örtüşen eşdoğrusal kenarları tek
  aralığa birleştirilir. Gerçek kapak aralıkları, ayrı çizgiler ve yön değiştiren köşeler korunur.
  Derinlik testi arkada kalan çizgileri örter; görünmeyen çizgiler öne zorlanmaz.
- Yalnızca üç genel ölçü korunur; uç işaretleri kısalır, çizgi ve etiket sakinleşir.
  100 mm / 1 m perspektif ızgarası kaldırılır. Kâğıt sabit, dokusuz bir renktir.

## Sabit önce/sonra karşılaştırması

`designs.json` altı aileyi içerir: seating, table, storage, kitchen, bath, bedroom.
Her iki sürüm aynı JSON'u, aynı gerçek motoru, aynı pencere boyutunu ve aynı kamera
başlangıcını (`angle`, yaw 0.62, pitch 0.2) kullanır. Kamera veya tasarım rastgele yenilenmez.
Başlıktaki parça sayısı da görünür. Başlangıç çizgileri `f99efc17273ef0b61ffd779bd24a174568e67f62`
commit'inden okunur; motor dosyaları bu PR'da değişmemiştir.

Depo kökünde:

```sh
python tests/visual/gorsel-01/serve.py
```

Tarayıcıda aşağıdaki yolları `http://127.0.0.1:8766` köküyle açın. `view=front`,
`view=side`, `view=top` da kullanılabilir. Önce/sonra aynı görünüşte tutulmalıdır.

| Aile | Önce yolu | Sonra yolu |
|---|---|---|
| Oturma | `/tests/visual/gorsel-01/capture.html?family=seating&version=before` | `/tests/visual/gorsel-01/capture.html?family=seating&version=after` |
| Masa | `/tests/visual/gorsel-01/capture.html?family=table&version=before` | `/tests/visual/gorsel-01/capture.html?family=table&version=after` |
| Depolama | `/tests/visual/gorsel-01/capture.html?family=storage&version=before` | `/tests/visual/gorsel-01/capture.html?family=storage&version=after` |
| Mutfak | `/tests/visual/gorsel-01/capture.html?family=kitchen&version=before` | `/tests/visual/gorsel-01/capture.html?family=kitchen&version=after` |
| Banyo | `/tests/visual/gorsel-01/capture.html?family=bath&version=before` | `/tests/visual/gorsel-01/capture.html?family=bath&version=after` |
| Yatak odası | `/tests/visual/gorsel-01/capture.html?family=bedroom&version=before` | `/tests/visual/gorsel-01/capture.html?family=bedroom&version=after` |

## Eksik görsel kanıt — PR taslak olarak açık

2026-10-18 oturumunda **hiçbir gerçek tarayıcı ekran görüntüsü alınamadı**. In-app browser
sekmesi bağlanma zaman aşımına uğradı. Bilgisayar kullanımı aracı, ayrı Chrome penceresi
açıldıktan sonra mevcut URL'yi yeterli güvenle belirleyemediği için bu turu güvenlik
katmanında durdurdu:

> Computer Use has been stopped for this turn because it could not determine the current
> browser URL on Windows with enough confidence to enforce policy.

Bu durdurma başka otomasyonla aşılmadı. Hazır karşılaştırma sayfası ekran görüntüsü yerine
sayılmaz. Altı ailenin 12 gerçek önce/sonra ekran görüntüsü ve görsel onayı eklenene kadar
bu teslim **tamamlanmış görsel denetim değildir**; PR birleştirilmemelidir. Siluet shader'ının
gerçek WebGL cihazındaki sonucu, ince ayrıntıların okunurluğu ve etkileşim hızı da bu
görsel denetim sırasında doğrulanmalıdır.

## Otomatik kontroller

`node tests/sketch-check.mjs` eşdoğrusallık, ters yönlü kopyalar, kısmi örtüşme, gerçek
boşlukların korunması ve altı ailede sonlu/değiştirilmemiş motor geometrisini kontrol eder.
Bu geometri kontrolü görsel kalite onayı veya WebGL shader derleme testi değildir.

İlk taramada 17 mevcut kontrol ve yeni `sketch-check.mjs` geçti: ai-workspace, brief-pdf,
camera-framing, catalogue, catalogue-graph, choice-flow, kitchen-studies, model, panel-engine,
preference-evidence, reference-studies, ritmo, room-family, sectional, space, studio-tools,
upholstery-engine. Geniş `forma-check.mjs` koşusu ayrıca izlenmektedir.

Üç arşiv kontrolü başlangıç dalında da bulunmayan `../../services/design/` modüllerini
istediğinden `ERR_MODULE_NOT_FOUND` ile durur; bu PR onları veya eksik servisleri değiştirmez.
Test dosyalarının mevcut ve `f99efc1` blob SHA'ları aynıdır:

| Test | Eksik modül | Her iki sürümde test blob SHA |
|---|---|---|
| assistant-contract-check | style-training.mjs | `5d76a589bf662877e31958ddb20df30866256844` |
| codesign-check | server.mjs | `3762b7c2392db38ed049c1f33c319536dc4a42bc` |
| studio-agent-check | studio-agent.mjs | `043a10a111d0c14c7e10ceeddea185f53db2e36d` |

Başlangıç commit'inde bu üç servis için `git ls-tree` boş döner; importların çözüldüğü
depo dışındaki `../services/design/` yolları da yoktur. Dolayısıyla tüm testler geçti
iddiasında bulunulmaz.
