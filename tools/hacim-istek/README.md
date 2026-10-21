# Ev projesi istekleri — H1 / C1

21 Ekim kapsam kararı (#180) uygulanır. Mobilya detay işlem hedefi yoktur. Eski `hacim-1-komut` çalışması bu teslimin veri kaynağı değildir; o dal ve dosyalar yerinde korunur.

Sıra: `node tools/hacim-istek/build.mjs`, `node tools/hacim-istek/audit.mjs`, `python tools/hacim-istek/common.py`, `python tools/hacim-istek/style.py`, `node tools/hacim-istek/review.mjs`. `jsonschema` yerel bağımlılığı gereklidir. Dış API/model/eğitim çalıştırılmaz.

`build.mjs` sınavı okumaz. `leakage.mjs` yalnız hariç tutma denetimi için kapalı sınavın kullanıcı metnini okur; sınav hedefleri üretilen veriye taşınmaz. Eşikler önceki H1'deki sözcüksel denetimle aynıdır. Anlamsal/çapraz dil sızıntısı için bağımsız model denetimi beklenir; insan incelemesi isteğe bağlıdır (#185).

Her işlem dizisi gerçek motorla çalışır. Tam aynı başlangıç ve işlem baytları tekrarlandığında aynı motor kanıtı önbellekten paylaşılır; dil değişince gereksiz aynı geometrinin tekrar çözülmesi sayıca yeni kanıt diye sunulmaz. Hedef gözlemleri ve bütün eşya ölçüleri ayrı denetlenir. Ret/uyarı/hedef farkı üretimi durdurur.

Ortak şema izdüşümü ayrı karantinadır. Aynı sentetik oda planını paylaşan bütün diller ve değerler aynı bölmede tutulur; bağımsız doğrulama/sınav kümesi olduğu iddia edilmez. `tur` işlem adı ile oda/açıklık türünün çakışmaması için yerel alanlar `arguments` içine alınır; ortak motor adaptörü eski düz işlemleri de destekler. Mevcut birleşik veri sayısı ve bölmeleri korunur; 52 eski sohbet izdüşümünün motor kanıtı yenilenir. Eğitim dışa aktarımları boş kalır.

Eski yerleşimlerin yenilenmesi: `refresh_legacy.mjs`, `finalize_legacy.py`, `refresh_arabic.py`, `revalidate_exam.mjs <eski-donmuş-kaynak-klasörü>` sırası. İlk üç araç özgün a724690 kaynaklarını okur; yeniden hesaplanan çıktılar arşivlenmiş özgün veriye karşı karşılaştırılır, arşivler değiştirilmez. Sınav aracının ikinci geçişinde önce özgün `FREEZE-before.json` çalışma manifestine alınır; aynı özgün sınav ve kaynakla yeni motora karşı karşılaştırma yapılır. Kaynak JSON'ları commit edildikten sonra `revalidate_common.py`. `finalize_legacy.py`, Python'daki eski `1.0` sayılarının JS'de `1` yazılmasından doğan hash farklarını eski Python kanıtıyla karşılaştırır; geometrik ya da metinsel değişikliği saklamaz.

Proje gönderme motoru yalnız kabul kaydı üretir; gerçek teslim/kayıt etkisi yoktur. Aydınlatma için işlem yoktur. Bu sürüm bunları başarı hedefi olarak üretmez. Tekstil durumu seçili oda çalışmasına aittir; çok odalı bağımsız tekstil kalıcılığı iddia edilmez.

## C1 üretimi ve çeşitlilik

`curriculum.mjs` bağlantılı, sentetik beş odalı plan ve 24 işlem ailesini tanımlar. `phrases-*.mjs` her tek işlem için beş ayrı ifade, isteğe özgü sonuçlar ve konuya özgü netleştirme soruları içerir. `multi-layout.mjs` metinleri tekstil tercihiyle tek cümlede birleştirir. Kaynak bağlamı sabit ölçüleri içerir; yakın/uzak eşiği AURA operasyonel yorumudur.

`quality.mjs` değişken/sayı/noktalama/aksan normalizasyonuyla yüzey kalıplarını sayar. Dil başına en az 150 kullanıcı ve yanıt kalıbı, en fazla iki aynı yanıt kalıbı, çoklu isteklerde en az %20 kısıt ve üç kısıt türü doğrulanır. İç terim, noktalı virgüllü çoklu istek ve yeni uzak oda poligonu kabul edilmez. Sayılar bağımsız niyet veya ana dil onayı değildir.

`C1-kalite-raporu.json` ve `source.user_template/reply_template` sayımı izlenebilir kılar. Önceki H1 Git 4fad6f3 baytları arşivde korunur. Claude'un önceki toplu duzelt kararı manifestte gösterilir; yeniden inceleme beklenir. C1 üretimi eğitim dışa aktarmaz.
