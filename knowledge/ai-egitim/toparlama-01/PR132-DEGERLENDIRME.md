# #132 test/denetim değerlendirmesi

Kaynak dal: `codex/ev-sohbet-01`. `test_placement.py` ve `audit.py` incelendi. `placement.py`, `adapter.py`, `house.py` ve alternatif çözücü içe aktarılmadı. Yerleşimin tek uygulayıcısı `assets/ev/yerlesim.js`.

Alınan fikirler: sığmayan eşyada boş alternatif/dürüst ret, giriş verisini değiştirmeme, tekrarlanabilirlik; bunlar doğrudan mevcut çözücüye karşı `tests/yerlesim-adversarial-check.mjs` ile sınandı. Test 0 çıkış koduyla geçti. Boş oda davranışı da denetlendi.

Mevcut EV-SOHBET-02 denetiminde bulunan poligon dışına taşma, örtüşme, ürün ölçüsü, kaynak istisnasını başarı saymama ve kayıt mutasyon testleri korunur. Beş ülke grubunun `verify02.mjs` geri oynatması toplu komuta bağlandı.

Aktarılmayanlar: ikinci çözücüye özgü koordinat API'si, eski sentetik ev üretimi, 20 turluk kapatılmış sohbetler ve onun ürün kataloğu. Bunları yeni çözücüye kopyalamak iki ayrı doğruluk kaynağı yaratırdı. Test iddiaları da otomatik taşınmadı.

Açık test fikirleri: gerçek kapı menteşesi/açılma yönü, radyatör, tavan yüksekliği, engellenmiş dolaşım rotası, TV görüşü ve masa gün ışığı ilişkisi. Mevcut çözücünün eksik girdisi/geometrik yeteneği varsa test yeşile boyanmaz; bu başlıklar yeni motorun yetenek testlerine aktarılmalıdır. Bu PR assets değiştirerek bunları tamamlamaz. Geometri testleri mevzuat/taşıyıcı veya insan onayı değildir.
