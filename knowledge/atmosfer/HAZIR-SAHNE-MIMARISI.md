# Hazır sahneler · ilk onay grubu

Tanım: [SAHNELER.md](SAHNELER.md). Main `6ed6eed` atmosfer dalına birleştirildi. Bu teslim, ürün başına tam oda render kuyruğunun yerine geçen ortak plaka prototipidir. Önceki ürün render denemeleri ve kısmi Cycles raporları geçmiş çalışmadır; hazır sahne grubunun tamamlandığının kanıtı değildir.

İlk grup yalnız **beş aile × orta oda × üç doku × iki ışık** içerir. Her seçeneğin iki kamerası vardır: toplam 60 adet 2400 × 1600 JPEG (kalite 88), 30 adet 256 × 128 Radiance HDR ve 30 JSON. Küçük/büyük oda üretimi karar sahibinin altı seçenek için görsel onayından sonra yapılacaktır.

## Üretim

`tests/visual/atmosfer-01/plates.py`, oda kabuğunu Blender'da kurar. Dört duvar, solda gerçek pencere açıklığı, 2,8 m yükseklik, mat prosedürel mineral sıva/ahşap/taş yüzey, süpürgelik bulunur. Ön duvar yalnız fotoğraf ışınlarına görünmez; tavan geometrisi yoktur. Sessiz nesne eklenmemiştir. Taş derzleri ince ve aynı renkte; dama veya parlak zemin kullanılmaz. Doku üretimi prosedüreldir, dış hizmete veri gönderilmez.

Plakalar **Blender EEVEE Next, 32 örnek, ray tracing açık**; ürün noktasındaki panoramik HDR haritaları **Cycles CPU, 16 örnek, OIDN** ile üretilir. Bu JPEG'ler Cycles ürün renderı olarak adlandırılmaz. JSON'daki `plateEngine`, `environmentEngine` alanları gerçek motorları belirtir. İstenirse aynı betiğin `--plate-engine CYCLES` seçeneği plakaları da Cycles'ta üretir; bu daha yavaştır. Bu ilk grup için motor seçimi ve görüntü kalitesi karar sahibinin incelemesine açıktır.

Kamera A 32° / 50 mm / 1,20 m, B 5° / 70 mm / 1,05 m'dir. Kamera yatay kalır; aileye göre sabit düşey lens kaydırması ürünün tamamını kadraja alır. JSON konumları metre ve tarayıcının Y-yukarı koordinatlarındadır. Zemin, ürün orijini, gölge yönü, HDR ölçüm noktası ve kamera verisi birlikte saklanır.

## Tarayıcı ve proje sonu

`assets/forma/scene-plates.js`, yalnız seçilen JSON + JPEG + HDR'ı yükler. Stüdyonun gerçek `createRenderAsset` geometrisi ve malzeme haritaları, JSON'daki kamerayla şeffaf WebGL katmanında işlenir; sonuç plakaya eklenir. Ürünün ölçeği değiştirilmez. Geniş yumuşak VSM gölgesi ve gerçek taban sınırlarından küçük temas gölgeleri eklenir. HDR dolaylı ışık/yansımayı verir; ürünün odaya geri yansıması ve oda üzerindeki tam ışık aktarımı bu tarayıcı prototipinde yaklaşık kalır.

Proje panelinde ürün, **Mekân: Kireç · Taş · Toprak**, **Işık: Sabah · Akşam** ve kamera seçilir. Seçim değişince yeniden yerleştirilir; tercih proje kaydında saklanır. Başlangıç dokusu tarzdan, ışık Sabah'tan gelir. İstek sırasında iptal edilen eski sonuç ekrana yazılmaz. Küçük/büyük ürünlere henüz üretilmemiş oda gösterilmez; sabit kadraja sığmayan ürün kesilerek sunulmaz. Sunucu ve API anahtarı gerekmez.

## İnceleme ve doğrulama

[ornekler.md](ornekler.md), her aile için altı seçenek ve iki gerçek, orta boy örnek tasarımı gösterir; her hücrede A görüntüsü ve B bağlantısı bulunur. Örneklerin tam parametre/malzeme kayıtları `sahneler/ornekler/examples.json` içindedir. Önceki 12 tasarımın aynısı oldukları iddia edilmez: bu grupta orta boy ölçüler, alçak kitaplık ve iki düz mutfak örneği açıkça kaydedilir.

`plates-calibrate.py`, Blender'ın bağımsız `world_to_camera_view` sonucunu dört referans noktası için çıkarır. `tests/scene-plates-check.mjs` bunu Three.js izdüşümüyle karşılaştırır; 30 seçenek / 60 plaka / boyut / toplam 120 MB sınırını da denetler. `plates-capture.mjs`, gerçek Playwright ürün yerleşimlerini, ürünün kesilmemesini ve kadrajdaki genişliğini kaydeder. Görsel beğeni ve katalog fotoğrafı ölçütü otomatik testin sonucu değil, karar sahibinin onayıdır.

Yerel üretim: `blender --background --python tests/visual/atmosfer-01/plates.py -- --output ABSOLUTE_DIR`. Ardından `plates-calibrate.py` betiğine aynı mutlak klasör verilir. Tarayıcı incelemesi `tests/visual/atmosfer-01/plates-review.html` sayfasındadır; yalnız yerel sunucu ve Playwright kullanılır.
