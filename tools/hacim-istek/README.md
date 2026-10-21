# Ev projesi istekleri — H1

21 Ekim kapsam kararı (#180) uygulanır. Mobilya detay işlem hedefi yoktur. Eski `hacim-1-komut` çalışması bu teslimin veri kaynağı değildir; o dal ve dosyalar yerinde korunur.

Sıra: `node tools/hacim-istek/build.mjs`, `node tools/hacim-istek/audit.mjs`, `python tools/hacim-istek/common.py`, `python tools/hacim-istek/style.py`, `node tools/hacim-istek/review.mjs`. `jsonschema` yerel bağımlılığı gereklidir. Dış API/model/eğitim çalıştırılmaz.

`build.mjs` sınavı okumaz. `leakage.mjs` yalnız hariç tutma denetimi için kapalı sınavın kullanıcı metnini okur; sınav hedefleri üretilen veriye taşınmaz. Eşikler önceki H1'deki sözcüksel denetimle aynıdır. Anlamsal/çapraz dil sızıntısı için insan incelemesi gerekir.

Her işlem dizisi gerçek motorla çalışır. Tam aynı başlangıç ve işlem baytları tekrarlandığında aynı motor kanıtı önbellekten paylaşılır; dil değişince gereksiz aynı geometrinin tekrar çözülmesi sayıca yeni kanıt diye sunulmaz. Hedef gözlemleri ve bütün eşya ölçüleri ayrı denetlenir. Ret/uyarı/hedef farkı üretimi durdurur.

Ortak şema izdüşümü ayrı karantinadır. Aynı sentetik oda planını paylaşan bütün diller ve değerler aynı bölmede tutulur; bağımsız doğrulama/sınav kümesi olduğu iddia edilmez. `tur` işlem adı ile oda/açıklık türünün çakışmaması için yerel alanlar `arguments` içine alınır; ortak motor adaptörü eski düz işlemleri de destekler. Mevcut birleşik veri sayısı ve bölmeleri korunur; 52 eski sohbet izdüşümünün motor kanıtı yenilenir. Eğitim dışa aktarımları boş kalır.

Eski yerleşimlerin yenilenmesi: eski kaynak sürümündeyken `refresh_legacy.mjs`, `finalize_legacy.py`, `refresh_arabic.py`, `revalidate_exam.mjs <eski-donmuş-kaynak-klasörü>` sırası. Kaynak JSON'ları commit edildikten sonra `revalidate_common.py`. Bunlar bir kerelik geçiş araçlarıdır; eski Git arşivinin üzerine yazmayı reddederler. Yeni başta çalıştırmak için Git'teki kaynak sürümü doğru seçilmelidir. `finalize_legacy.py`, Python'daki eski `1.0` sayılarının JS'de `1` yazılmasından doğan hash farklarını eski Python kanıtıyla karşılaştırır; geometrik ya da metinsel değişikliği saklamaz.

Proje gönderme motoru yalnız kabul kaydı üretir; gerçek teslim/kayıt etkisi yoktur. Aydınlatma için işlem yoktur. Bu sürüm bunları başarı hedefi olarak üretmez. Tekstil durumu seçili oda çalışmasına aittir; çok odalı bağımsız tekstil kalıcılığı iddia edilmez.
