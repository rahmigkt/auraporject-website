# PERDE-01 araştırma araçları

Bağımlılık: Python 3.10+ standart kütüphane. Ağ, API anahtarı ve eğitim yok.

```powershell
python tools/perde/prepare_data.py
python tools/perde/dialogue_data.py
python tools/perde/example_data.py
python -m unittest discover -s tools/perde -p 'test_*.py' -v
python tools/perde/hesap.py tools/perde/ornek-girdi.json
```

Üç kayıt betiği kaynak araştırmasını veya diyalog yazımını otomatik yapmaz; dosyalarındaki elle hazırlanmış içeriği JSON'a kaydeder. Veriyi değiştirirken ilgili kayıt betiğini de güncelleyin ve tekrar kaydedin. `hesap.py` bu betikleri çalıştırmaz; depodaki JSON'ları okur. Kullanıcı girdisi eksikse CLI sıfır metraj üretmek yerine çıkış kodu 2 döndürür.

Girdi ve hesap sonuçları için [rapor](../../knowledge/ev-projesi/PERDE-ARASTIRMA-01.md). Beş senaryo `perde-ornekler.json` içinde. `ornek-girdi.json` ilk senaryonun tek istek olarak çalıştırılabilir kopyasıdır. Boy/en mm, çekme oranı kesir (ör. 0.03); doğrusal m ile m² karıştırılmaz.

Güvenli uygulama sözleşmesi:

- `geometry: straight`; cumba/eğri açıklık reddedilir.
- Ülke, başlık, panel sayısı ve montaj profili açık seçilir. Ülkeden katsayı türetilmez.
- Kumaşın kullanılabilir eni, kaynak kimliği/açıklaması, kalan warp/weft çekmesi ve dayanağı gerekir. Bilinmeyen çekme `0` değildir.
- Wave ray altı, kuşgözü/tünel çubuk üstü, kancalı başlık taşıma noktası referansını kullanır. Pencere yüksekliğinden perde boyu tahmin edilmez.
- Stor girdileri üç ham açıklık en/boyudur. JYSK niş içi rollerda müşteri en düşümü 10 mm; dış rollerda en büyük en/boy +100/+80 mm. Fabrika siparişten bir daha düşmez.
- Stor sipariş kasa eni ile kumaş eni farklıdır. Mekanizma seçilmeden kumaş eni `null` kalır.
- Çıktı her zaman `production_ready: false`: atölye/hardware/taşıyıcı yüzey/çocuk güvenliği ve yerinde ölçü onayı yerine geçmez.
- Aynı referans kaydı plan, kesit ve oda içi çizimde kullanılır. Shader önerisi kumaşın ölçülmüş ışık geçirgenliği olarak kullanılmaz.
