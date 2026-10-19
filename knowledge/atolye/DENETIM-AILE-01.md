# Aile aile yakın plan denetimi 01

19 Ekim 2026 · ATOLYE-CODEX-02 / iş3. Kaynak: `5fc42511eddefc31987d4caa6311e4698e4ca36f`.

**24 başlangıç modeli,48 gerçek JPEG: masa/dolap/mutfak/banyo ×6, her biri genel+yakın.**
[Yan yana galeri](../../tests/visual/denetim-01/index.html); ham görüntüler ve girdiler aynı klasörde.
Oturma kapsam dışı. Altı seed ve aile içindeki farklı kind/style'lar kullanıldı; rastgele tüm ürün uzayını kapsamaz.

## Yöntem ve sınırlar

Mevcut tests/visual/foto/foto.html → createViewer → photo/studioPhoto yolu kullanıldı.
Fotoğraf test yanıtına bellekte kind/gözlem kancası eklendi; assets dosyası değişmedi.
Yerel Playwright+Edge; dış ağ engelli. Yazılımsal rasterizer ilk denemesi ağır olduğu
için bırakıldı, Direct3D11 ile devam edildi. Aynı kaynaklı başarılı kareler korundu.
Çoğu kare1000×667/6 örnek; table-1 çiftinde1200×800/12 örnek korunmuştur. Bunlar final2400px katalog kareleri değil. Her modelde gerçek girdi,
seed/style/kind, hedef parça ve odak kaydedildi. CSG/uygulama düzeltmesi yapılmadı.

Görseller Codex tarafından incelendi; karar sahibi onayı değildir. Doku/kenar/renk,
havada parça ve görünür iç içelik değerlendirildi. Kapalı iç bölmeler, bütün
montaj açıları, gerçek dünyadaki ölçek/kalibre renk veya mukavemet iki kareyle
onaylanamaz. Belirgin hata görülmeyen örnek hatasız sertifikası almaz.

## Bulunan kusurlar

| Kimlik | Öncelik | Kanıt / gözlem | Claude için sonraki denetim |
|---|---|---|---|
| G01 | P2 | Özellikle table-2/3, storage-2, bath-4 yakınlarında çapraz/dalgalı ahşap | Üst/yan/uç lif koordinatları, doku ölçeği ve parça grain değeri; doğal lif referansı |
| G02 | P1 | kitchen-4: üç kulp y üstü967,5mm; tezgah üstü900mm; **67,5mm taşma** | Kapak ölçüsüne göre kulp konumu/uzunluğu; tezgah çarpışması. Ölçüm inspection.json |
| G03 | P1 | bath-4: undermount, sink.finish=white fakat açıklıkta ahşap yüzey | Hazne/gövde/çekmece-top geometrisi örtüşmesi ve sink materyal yolu; kök neden henüz kanıtlanmadı |
| G04 | P2 | storage-5, bath-3/6: duvar ürünü zeminden kopuk boşlukta | Fotoğraf duvar algısı dünya geometrisinden kurulmalı; askılı tasarıma ayak ekleme önerisi değil |
| G05 | P2 | table-5/kitchen-5 açık lake ile fon arasında sınır kaybı | Beyaz fon/pozlama/dolgu ve küçük temas gölgeleri; kalibre renk ölçümü değil |
| G06 | P3 | bath-6 ince çevrede noktalı/dişli kenar | Daha yüksek örnek/tessellation karşılaştırması; raster aliası ile geometriyi ayır |

## Model bazında gözlem ve dosyalar

| Model | Tür / tarz | Gözlem | Genel / yakın |
|---|---|---|---|
| table-1 | dining / aura | G01; ön tabla kenarı ile üst yüzeyin damar ölçeği geçişi sert. | [Genel](../../tests/visual/denetim-01/table-1-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-1-yakin.jpg) |
| table-2 | coffee / japandi | G01; tabla ve alt raf üzerinde çapraz tekrar çok belirgin. | [Genel](../../tests/visual/denetim-01/table-2-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-2-yakin.jpg) |
| table-3 | side / scandinavian_modern | G01; tabla/çekmece önünde dalga ve çapraz lif izi. | [Genel](../../tests/visual/denetim-01/table-3-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-3-yakin.jpg) |
| table-4 | console / mid_century_modern | Bu iki karede belirgin yeni çakışma veya havada parça saptanmadı; metal ayak ankrajı ayrıca görünmüyor. | [Genel](../../tests/visual/denetim-01/table-4-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-4-yakin.jpg) |
| table-5 | desk / minimalism | G05; beyaz tabla/kayıt sınırı fonla karışıyor. | [Genel](../../tests/visual/denetim-01/table-5-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-5-yakin.jpg) |
| table-6 | dining / wabi_sabi | G01; yan panelde yatay lif görülüyor, grain kararıyla karşılaştırılmalı; otomatik yanlış yön hükmü yok. | [Genel](../../tests/visual/denetim-01/table-6-genel.jpg) · [Yakın](../../tests/visual/denetim-01/table-6-yakin.jpg) |
| storage-1 | wardrobe / aura | Kapak bölünmesi/kulplar görünür; bu iki karede belirgin yeni geometri hatası saptanmadı. | [Genel](../../tests/visual/denetim-01/storage-1-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-1-yakin.jpg) |
| storage-2 | nightstand / japandi | G01; slat ön yüzde yatay/çapraz lif; lif yönü kararı ve kenar eşlemesi ayrıca incelenmeli. | [Genel](../../tests/visual/denetim-01/storage-2-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-2-yakin.jpg) |
| storage-3 | dresser / scandinavian_modern | Mavi lake tutarlı görünüyor; fiziksel/kalibre renk referansı yok. | [Genel](../../tests/visual/denetim-01/storage-3-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-3-yakin.jpg) |
| storage-4 | vanity / mid_century_modern | Çekmece yüzü ve yan yüz arasında damar ölçeği belirgin farklı; malzeme yön/ölçek kuralıyla karşılaştırılmalı. | [Genel](../../tests/visual/denetim-01/storage-4-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-4-yakin.jpg) |
| storage-5 | tvunit / minimalism | G04; askılı gövde için duvar/ankraj bağlamı eksik. | [Genel](../../tests/visual/denetim-01/storage-5-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-5-yakin.jpg) |
| storage-6 | bookcase / wabi_sabi | Raf-gövde birleşimleri görünür; bu açılarda belirgin yeni boşluk/çakışma saptanmadı. | [Genel](../../tests/visual/denetim-01/storage-6-genel.jpg) · [Yakın](../../tests/visual/denetim-01/storage-6-yakin.jpg) |
| kitchen-1 | run / aura | Evye, ocak ve dolap yerleşimi okunuyor; içteki geçmeler bu iki görünüşle denetlenemez. | [Genel](../../tests/visual/denetim-01/kitchen-1-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-1-yakin.jpg) |
| kitchen-2 | island / japandi | Yivli cephe/tezgah birleşimi görünür; açık evye içinin derinlik okunurluğu sınırlı. | [Genel](../../tests/visual/denetim-01/kitchen-2-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-2-yakin.jpg) |
| kitchen-3 | run / scandinavian_modern | G01; ön cephe ahşapta geniş dalga/çapraz izler. | [Genel](../../tests/visual/denetim-01/kitchen-3-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-3-yakin.jpg) |
| kitchen-4 | island / mid_century_modern | G02; kulplar tezgah üstüne çıkıyor, nicel mesh sınırı kanıtı var. | [Genel](../../tests/visual/denetim-01/kitchen-4-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-4-yakin.jpg) |
| kitchen-5 | run / minimalism | G05; açık lake/duvar/tezgah ayrımı düşük; küçük açıklıklar zor okunuyor. | [Genel](../../tests/visual/denetim-01/kitchen-5-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-5-yakin.jpg) |
| kitchen-6 | island / wabi_sabi | Yiv/tezgah birleşimi görünür; bu karelerde belirgin yeni geometri hatası saptanmadı. | [Genel](../../tests/visual/denetim-01/kitchen-6-genel.jpg) · [Yakın](../../tests/visual/denetim-01/kitchen-6-yakin.jpg) |
| bath-1 | basin / aura | G01; yivli cephede çapraz doku. Çanak yakın karede kesiliyor; haznenin tamamı genel karede. | [Genel](../../tests/visual/denetim-01/bath-1-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-1-yakin.jpg) |
| bath-2 | column / japandi | Kolonun ön ve yan yüzleri okunuyor; bu karelerde belirgin havada/çakışan parça saptanmadı. | [Genel](../../tests/visual/denetim-01/bath-2-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-2-yakin.jpg) |
| bath-3 | mirror / scandinavian_modern | G04; ayna duvar yerine boşlukta ve zemin gölgesiyle sunuluyor. | [Genel](../../tests/visual/denetim-01/bath-3-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-3-yakin.jpg) |
| bath-4 | basin / mid_century_modern | G01 + G03; beyaz tezgah altı haznesi yerine ahşap yüzey görülüyor. | [Genel](../../tests/visual/denetim-01/bath-4-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-4-yakin.jpg) |
| bath-5 | column / minimalism | Askılı kolon duvarla ilişkili okunuyor; montaj taşıma hesabı görüntüyle doğrulanmaz. | [Genel](../../tests/visual/denetim-01/bath-5-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-5-yakin.jpg) |
| bath-6 | mirror / wabi_sabi | G04 + G06; duvarsız ayna ve çevrede noktalı kenar; düz mavi/gri ayna ortam yansımasını da zayıf gösteriyor. | [Genel](../../tests/visual/denetim-01/bath-6-genel.jpg) · [Yakın](../../tests/visual/denetim-01/bath-6-yakin.jpg) |

Kayıtlar: manifest.json,24 ayrı girdi JSON,inspection.json (kusurlar+mesh ölçümü+görüntü hash).
Doğrulama:24 başarılı kayıt, aile başına6,48 benzersiz JPEG ve her kayıttaki boyutla eşleşme;
pageerror kayıtları boş. Bu ifade console/WebGL uyarılarının tamamını ölçtüğümüz anlamına gelmez.
Düzeltme yapılmadı. Claude düzeltmelerinden sonra aynı girdiler/kameralarla yeniden karşılaştırılmalı.
