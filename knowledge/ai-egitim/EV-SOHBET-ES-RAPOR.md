# Ev sohbetleri: İspanya turu

21 Ekim 2026 · Önceki ülke sırasının devamı. Dört farklı gerçek kaynak planıyla, tek tek yazılmış dört İspanyolca sohbet. Her biri sekiz kullanıcı–asistan alışverişi; toplam 64 mesaj. Her kayıtta Türkçe tasarımcı özeti bulunur. [İnceleme sayfası](EV-SOHBET-ES-inceleme.html).

## Senaryolar

| Şehir / bölge | Kullanıcı durumu | Swiss Dwellings kaynak kimliği | Net iç alan | Ürün |
|---|---|---|---:|---:|
| Barcelona / Catalunya | Kiracı; fotoğraf ve cèdula onayı isteği | sd-029f06baade84d7b813cd6b4 | 87.6 m² | 8 |
| Madrid / Comunidad de Madrid | Çift ve çocuk; oda sayısı ve ölçülmemiş yemek masası | sd-035dd88082c3d780707f28b9 | 74.4 m² | 6 |
| Valencia / Comunitat Valenciana | İki katlı adosado; üst kat/merdiven verisi eksik | sd-037b110a098ce5610a87866a | 69.7 m² | 6 |
| Sevilla / Andalucía | Yürüteç kullanan anne; müstakil ev ve ölçülmemiş patio | sd-03a3d3e59376e86135ab4ba4 | 71.5 m² | 6 |

Kaynak: [Swiss Dwellings 3.0.0 / Archilyse AG / CC BY 4.0](https://zenodo.org/records/7788422). Önceki 32 kayıttan farklı dört kaynak, toplam 36 farklı kimlik. Lisans ve atıf her fixture/kayıtta korunur. `fixture_sha256` kanonik JSON içerik özetidir; yeniden üretim manifestindeki kayıt özetleri ise ham UTF-8/LF baytlarının SHA256 değeridir.

Tüm kaynaklar **tek katlı İsviçre geometrileridir**. Bunlar Barcelona'da ölçülmüş piso, Valencia'daki adosado veya Sevilla'da patio'lu ev keşfi değildir. Mevcut duvarlar/odalar yeniden boyutlanmadı; döndürme/öteleme ve eksen düğümleme kayıtlıdır. Genel oda etiketlerinin salon/yatak odasına atanması üçüncü alışverişte açıkça seçilir ve işlem listesine yazılır. İkinci kat, merdiven ve patio uydurulmadı.

Dil tercihi İspanyolcadır; Barcelona ve Valencia örneklerinde kullanıcı bunu açıkça belirtir. Katalanca, Valensiyaca, Baskça veya Galiçyaca kapsamı sağlandığı söylenmez. Bölge, kullanıcının dilini veya zevkini tek başına belirlemez. `habitación` kelimesinden yatak odası sayısı varsayılmadı; ülke adından galería veya patio üretilmedi.

Yatak nesneleri mevcut eski derleyicinin **boyut referanslarıdır**; AURA'nın kaldırılmış yatak serisini satışa döndürmez. Mutfak/zemin gibi korunan öğeler yeni ölçülmüş imalat diye sunulmaz. Yemek masası, halı/perde, ışık, erişim ve diğer açık ihtiyaçlar tasarımcı özetinde görünür. Son proje ve üretim kararı tasarımcıdadır; bu teslim bütün ev projesinin tamamlandığını iddia etmez.

## Kaynaklı sınırlar

- [CTE DB-SUA](https://www.codigotecnico.org/DocumentosCTE/SeguridadUtilizacionAccesibilidad.html): güvenli kullanım ve erişilebilirlik çerçevesi. Resmî sayfa ve normatif PDF açıldı; tüm maddeler için otomatik denetleyici yapılmadı. Sayfanın 15 Temmuz 2024 yorum belgesi ile normatif metin karıştırılmadı. Mobilyanın sığması erişilebilirlik onayı değildir.
- [CTE DB-HS](https://www.codigotecnico.org/DocumentosCTE/Salubridad.html), [normatif PDF](https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf): 14 Haziran 2022 normatif PDF'nin giriş ve HS3 çerçevesi incelendi; sayfada ayrıca 12 Şubat 2025 yorum sürümü var. Havalandırma, yalnız pencere sembolü bulunmasıyla onaylanmadı.
- [Catalunya Decret 141/2012 yorum sayfası](https://habitatge.gencat.cat/ca/ambits/cedules-habitabilitat/decret-141-2012/index.html): ekler ve yapı geçmişi ayrımı görülüyor. Gerçek bina yaşı, müdahale ve uygulanacak ek belirlenmedi; cèdula uygunluğu verilmedi.
- [Madrid resmî konut satın alma rehberi](https://www.comunidad.madrid/consumo/informacion-completa-comprar-vivienda): ilan ve belge bağlamı için okundu. Güncel belediye oda boyutu kodunun tamamı incelenmiş gibi gösterilmedi; yeni sayısal eşik çıkarılmadı. Katalonya'nın cèdula süreci Madrid'e kopyalanmadı.
- [Valencia resmî 2023 değişiklik kaydı](https://dogv.gva.es/datos/2023/11/23/pdf/2023_11769.pdf): resmî indeks içeriği bulundu; tam PDF isteği zaman aşımına uğradı. Sonraki değişiklikler ve güncel konsolide uygulanabilirlik doğrulanmadı; 80/2023 numarasından yürürlük varsayılmadı. Katalonya eşikleri Valencia'ya aktarılmadı.
- [Andalucía erişilebilirlik kaynak sayfası](https://www.juntadeandalucia.es/fomentoyvivienda/portal-web/web/servicios/buscador_normativas/95339977-1fea-11e0-89b8-998a90d310ed): 293/2009 ve düzeltme kaydı var. Bu sayfa tek başına 2026 konsolide uygunluk belgesi sayılmadı; gerçek güzergâh, kot ve banyo ölçüleri eksik.
- [Catastro dergisi 89](https://www.catastro.hacienda.gob.es/documentos/publicaciones/ct/ct89/Catastro_89_accesible.pdf): tarihsel bilgilendirme bağlamı; ortak paylı inşa alanını net iç alanla eşitlememek için başvuruldu. Güncel normatif `superficie útil` tanımı olarak kullanılmadı ve sabit dönüştürme katsayısı üretilmedi.

21 Ekim 2026'da kontrol edilen erişim/sürüm/kapsam kayıtları `veri/ev-sohbet-es/ulke-kaynaklari.json` içinde. Bölgesel kaynaklar tam bir İspanya mevzuat envanteri değildir. Gerçek yapıya uygulanacak ulusal/bölgesel/belediye hükümleri uzman incelemesine açık kalır. Tüm kayıtlarda mevzuat sonucu `unknown_not_certified`; resmî yararlı alan, kadastro alanı, serbest kapı geçişi ve havalandırma sonucu `null`.

## Kontrol sonuçları

| Kontrol | Sonuç |
|---|---|
| Yeni kaynak/oda/duvar/açıklık/yerleşim hatası | 0; 4/4 kaynak istisnaları ayrı tutularak geçiyor |
| Tüm proje ölçü hedeflerini istisnasız karşılama | **0/4** |
| Korunmuş kaynak ölçü sapması | **18:** 12 kapı eni, 4 ham pencere/zemin oranı, 1 banyo alanı, 1 WC alanı |
| Yeni çözücü tekrarları | 4 kayıt / 13 deneme; sonuçlar birebir aynı |
| Yeni turda sığmama | 0; başarısızlık uydurulmadı |
| Önceki turlar | 20 kayıt / 74 deneme / 10 no-fit; 8 / 23 / 0; 4 / 14 / 0 aynı |
| Yeni testler | 8/8; alan, kapı, havalandırma, sahte uygunluk, bölge karışması, kat, elle konum ve ham dosya özetleri |
| Önceki geometri testleri | 14/14 geçti |
| Çevrimdışı yeniden üretim | 4/4 kayıt bayt düzeyinde aynı |
| Güncel main arayüzü ile dosya açma | 4/4; net alan/oda sayısı, plan ve maket; sayfa hatası yok |

`accepted`, kaynaktaki ölçü sapmalarının düzeltildiği veya ulusal kuralların geçildiği demek değildir. Önceki iş emri hedefleri ulusal mevzuat diye etiketlenmedi. Mobilya konumları değiştirilmemiş stüdyo `solveRoom` sonucudur; elle koordinat eklenmedi. Kapı menteşesi bilinmediğinde ihtiyatlı açıklık zarfı kullanılır; gerçek donanım/serbest geçiş ve kişisel erişim ihtiyaçları yerinde incelenmelidir.

Test için güncel main `eb2501d` içerikli ayrı çalışma kopyası kullanıldı; tekstil güncellemesi dahil arayüzde gerçek `#openFile` girdisiyle açıldı, ağ yanıtı değiştirilmedi. Plan/maket ekran görüntüleri ve `viewer-results.json`, [ev-sohbet-es-ornekler](ev-sohbet-es-ornekler/) altında ve inceleme sayfasından bağlantılıdır. Tam kayıtlar balkonları korur; açılabilir örnekler görüntüleyici net alanını tutarlı göstermek için yalnız iç mekân izdüşümüdür. Varsayılan tavan, pusula ve ışık şehri keşif verisi değildir; maket dekorasyonu sohbetin tamamlanmış tasarım kararı sayılmaz.

Görsel incelemede Barcelona planında tek kaynak girişinin eksen parçaları nedeniyle iki “GİRİŞ” etiketi çizildiği görüldü; Danimarka raporundaki görüntüleyici kusuru burada da mevcut. Açıklıklar denetimde `source_opening_id` ile birleştirilir; iki bağımsız giriş kapısı sayılmaz. `assets/` değiştirilmediğinden etiket düzeltmesi bu teslimde yapılmadı. Alan/oda sayısı testinin geçmesi, bütün görsel kusurların giderildiği anlamına gelmez.

## Yeniden çalıştırma

Python + Shapely 2.1.2, Node; tarayıcı kontrolü için Playwright ve Chrome. Dört lisanslı fixture depoda olduğundan büyük kaynak arşivi gerekmez:

```text
python tools/ev-sohbet/es.py
node tools/ev-sohbet/place02.mjs knowledge/ai-egitim/veri/ev-sohbet-es
python tools/ev-sohbet/es_dialogues.py
python tools/ev-sohbet/es_audit.py
python tools/ev-sohbet/es_review.py
node tools/ev-sohbet/verify02.mjs knowledge/ai-egitim/veri/ev-sohbet-es
python -m unittest discover -s tools/ev-sohbet -p test_es.py -v
python -m unittest discover -s tools/ev-sohbet -p test02.py -v
node tools/ev-sohbet/viewer02.cjs knowledge/ai-egitim/ev-sohbet-es-ornekler
```

Ham kayıt dosyaları LF ile yazılır; `.gitattributes` bunu Git'te ve Windows checkout'unda korur. Yeni içerik bilinçli değiştirildiğinde yeniden üretim manifestinin özetleri de yeni iki üretim karşılaştırmasıyla yenilenmelidir; eski özeti geçerliymiş gibi bırakmayın. Güncel main arayüzü testi için araç ve veri dizini bu dalın mutlak yolu, çalışma dizini ise main içerikli ayrı kopya olabilir.

## Dal, PR ve devam

Dal `codex/ev-sohbet-es`, #145'in `codex/ev-sohbet-dk` dalı üzerine açıldı. İnceleme zinciri #138 → #142 → #145 → İspanya'dır; önceki PR'lar birleştikten sonra taban main'e taşınmalıdır. Bu teslim önceki 32 kaydı ve `assets/` içeriğini değiştirmez. Eğitim, GPU, ücretli model/API, otomatik mail veya canlı dağıtım yok.

[Ülke sırası](EV-ULKE-SIRASI.md): sonraki **İtalya**, ardından Avusturya ve İsviçre. İspanya'nın bütün dil, konut tipi ve teknik mevzuat kapsamı tamamlanmış sayılmıyor.
