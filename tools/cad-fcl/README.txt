AURA — CadQuery/FCL yerel CPU karşılaştırması

Bu araçlar isteğe bağlı yerel denetçidir. PHP/FTP sitesine Python,yerelDLL veya yeni ağ servisi eklemez. Kaynak tasarım kopyasını değişmez girdi olarak alır. Gerçek donanım CAD/yörünge,duvar,yük,pilot/tork ve fiziksel imalat onayı vermez.

Kurulum: ayrı Python3.12 Windows x64 ortamı;requirements-win-py312.lock tüm47wheel sürüm/hashlerini sabitler. Genel sistem Python'una kurmayın. Bu lock başka platformun wheel hashlerini içermez.
Örnek çalışma ana AURA çalışma alanından:
1. work/cad-fcl-env/Scripts/python.exe ortamını kullanın.
2. Bu dalın içinde node tools/cad-fcl/export-input.mjs SNAPSHOT.json OUT/input.json
3. İzole Python ile tools/cad-fcl/pilot.py --input OUT/input.json --baseline GARDIROP-v5-3B.zip --out OUT/run

SNAPSHOT: outputs/cad-fcl-pilot-hazirlik/wardrobe-input.json;beklenen92parça/392işlem.
BASELINE: outputs/yerel-inceleme/GARDIROP-v5-3B.zip;CRC,tasarım,kimlik,yerleşim ve zarf eşleşmesi kontrol edilir. Geometriyi üreten ilgili kodun değişmediği pilot kayıtlarında doğrulanır. Önceki üretim onayı aktarılmaz.
Geometrik amaç: CadQuery düzgün yuvarlatılmış stok katıları ve kaynak işlemler;AURA poligonal yüzeyinin STEP içine sarılması değildir. CAD/mesh yüzey farkları raporlanır.52özel/donanım parçası nativeCAD diye üretilmez;kimlikleri kapsam dışında tutulur.
FCL'de kaynakAURAmesh temasları hacimsel kesişme ile aynı kavram değildir. CCD kabul örneği sentetik doğrusal harekettir;gerçekBlum menteşe yörüngesi veya gerçekraystop onayı değildir.

Görüntüleyici entegrasyonu: rapor aynı tasarım+derlenmişparçalar+imalatreçetesi SHA256'sına bağlıdır. Yanlış/eski/modeli değişmiş veya onay yükselten rapor reddedilir. Bağımsız CAD sekmesi salt rapor okur;otomatik ağır hesap yok. Yeni rapor üretmek ve yayınlamak ayrı kontrollü adımdır.

Lisans zinciri: CadQuery Apache2.0;kurulu OCP bağlayıcısı metadata/lisansı Apache2.0,altındaki OCCT çekirdeği LGPL ve ilgili istisna/dağıtım koşulları;python-fcl/FCL BSD ailesi. Yerel ortamdaki dist-info lisansları kanıt paketinde kaydedilir. PaketDLL'leri bu depoya veya siteye eklenmez.

Doğrulanan CCD konfigürasyonu: sentetik Box/Box doğrusal ötelemede conservative advancement + GST_INDEP. Kurulu wheel varsayılan GST_LIBCCD aynı pozitif örnekte yanlış temiz sonuç verdi;kanıt ccd-preflight-matrix.json. Başka şekil/rotasyon/mekanizma yoluna genellenmez.
STEP kontrolü her solidi ayrı zarf/hacim ile eşler;Compound.Volume() ile solid hacimleri toplamı aynı ölçüm sayılmaz. İlk392işlem korunup STEP checkpoint üzerinden son karşılaştırma resume-step.py ile tamamlandı.
