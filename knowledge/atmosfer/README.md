# ATMOSFER-01 · PR 1

Bu aşama yalnız ayrı son görüntü motorunu, ışığı, sessiz mekânı ve genel
kareleri kapsar. Yakın plan, yeni malzeme ayrıntısı, proje bitirme akışı ve
indirme/tasarımcı paketi PR 2'ye aittir. Tanık metninin yeri boştur.

Karar sahibinin güncel talimatıyla dal, `codex/aura-gorsel-01` üstünde açıldı.
#58 birleştirilmez; karar sahibi onayı bekler. Birleştikten sonra bu dal main'e
taşınır ve PR tabanı main yapılır.

## Motor sınırı

`assets/forma/atmosfer.js` yalnız çağrıldığında yüklenir. Mevcut stüdyo onu
ithal etmez. `scene.js` içindeki `createRenderAsset`, aynı gerçek parça
geometrisini ve hazır dokuma/ahşap/taş malzemelerini kullanır; geometriyi kendi
kopyasına alır ve stüdyonun önbelleğine dokunmadan temizler.

`renderAtmosphere({compiled, materials, family, canvas, width, height,
preset, samples, mode, signal, onProgress})` ilerleme bildirir ve
`AbortSignal` ile iptal edilir. Varsayılan çıktı 2400 × 1600 JPEG'dir.
`mode: path` başarısız olursa hata verir. `auto`, desteklenmeyen veya
başarısız yol izleyici için açık gerekçeli `mode: raster` döndürür.
Boş/siyah/tekdüze çıktı başarı sayılmaz. Sonuç modu ve örnek sayısı rapora
yazılır; raster çıktıya yol izleme etiketi konmaz.

Yol izleyici yerel, sürümü sabit MIT paketidir; kaynak ve lisanslar
[`assets/vendor/pathtracer/README.md`](../../assets/vendor/pathtracer/README.md)
içindedir. BVH ayrı yerel worker'da hazırlanır. Harici servis, görüntü üretimi,
API anahtarı veya çalışma anında CDN gerektirmez.

## Mekân ve ışık

`atmosfer-room.js`, ürün boyutunu değiştirmeden onu oda merkezine alır.
Duvara asılı parçanın gerçek yüksekliği korunur. 55 mm kamera, bütün ürün
sınırlarını kadrajda tutar; ufuk düzdür. Banyo ve mutfak taş, diğer aileler
ahşap zemin kullanır. Duvar, süpürgelik, tavan ve gerçek pencere açıklığı
geometridir; ürünün bir parçası değildir. Dört ışık seçimi: kuzey, sabah,
öğle ve akşam. Dekoratif eşya eklenmez.

Ortam göğü analitik, oda yüzeyleri bu değişiklik için yazılmış prosedürel
haritalardır. İndirilmiş HDRI/doku yoktur. Yol izleme pencere alan ışığı ve
gökyüzünden dolaylı ışığı hesaplar. Raster yedek 4096 gölge haritası, GTAO ve
SMAA kullanır. İlk aşamada gürültü giderici bulunmaz.

## Tekrar üretim

Depo kökünde `python -m http.server 8768 --bind 127.0.0.1` çalıştırın.
`http://127.0.0.1:8768/tests/visual/atmosfer-01/review.html` iç inceleme
sayfasıdır. Stüdyo ve son görüntü yan yanadır; genel kareyi oluşturma ve
iptal denetlenebilir. Müşteri akışına bağlanmamıştır.

Playwright kurulu ortamda:

```sh
node tests/visual/atmosfer-01/capture.mjs --mode=raster
node tests/visual/atmosfer-01/browser-check.mjs
node tests/atmosfer-check.mjs
node tests/camera-framing-check.mjs
node tests/studio-tools-check.mjs
node tests/sketch-check.mjs
```

Playwright normal modül yolunda yoksa `PLAYWRIGHT_MODULE` kurulumun mutlak
yolunu alır. Çekim yeni headless Chrome profili kullanır, yalnız localhost
isteklerine izin verir. Her aileden iki sabit tasarım `designs.json` içindedir.
Kareler ve gerçek çekim raporları `kareler/` altında, karşılaştırmalar
[`ornekler.md`](ornekler.md) içindedir. Estetik kabul karar sahibine aittir;
bu PR birleştirilmez.
