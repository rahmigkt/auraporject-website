# Gerçek plan verisi atıf ve kullanım kaydı

EV-QWEN-00D · 20 Ekim 2026. Bu dosya, veri lisansını kod veya model lisansından
ayrı tutar. Bu turda eğitilmiş ağırlık yoktur.

## Ürün referanslarına alınan kaynak

**Swiss Dwellings v3.0.0** — Matthias Standfest, Michael Franzen, Yvonne Schröder,
Luis Gonzalez Medina, Yarilo Villanueva Hernandez, Jan Hendrik Buck, Yen-Ling Tan,
Milena Niedzwiecka ve Rachele Colmegna; Archilyse AG; Zenodo,
[doi:10.5281/zenodo.7788422](https://doi.org/10.5281/zenodo.7788422).
Lisans: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/legalcode.en).
Yayımlayıcı lisansı [resmî kayıt API'sinde](https://zenodo.org/api/records/7788422)
`cc-by-4.0` olarak doğrulandı. Kaydın yayın tarihi 2022; kullanılan v3 sürüm
güncellemesi 2023'tür.

AURA'nın değişiklikleri: kimlikleri takma kimlikle değiştirme, konum tablolarını
çalışmaya almama, geometriyi her birim için yerel orijine taşıma, metre → mm,
etiket eşleme, donatıdan belirtilmiş WC çıkarımı, kapı/açıklık grafı çıkarımı,
v0.2 uyumluluk görünümü ve açıkça kayıtlı afin ölçü uyarlaması. Kaynak duvar ve
açıklık poligonları ayrıca korunur; uyumluluk eksenleri ölçülmüş gerçek duvar
eksenleri diye sunulmaz. Yayımlayıcının AURA'yı onayladığı iddia edilmez.

Her teslim planının `notes.attribution` kaydı ve zorunlu geometri yan kaydı
kaynak, DOI, lisans ve değişiklik bilgisini taşır. İnceleme sayfasında aynı
atıf görünür. İleride çıktı/PDF/model kartı dağıtılırsa bu atıf ve değişiklik
bilgisi de taşınmalıdır. Orijinal lisanslı veri için ek kapalı kullanım kısıtı
konmaz. Yeni ağırlıkların lisansı ayrıca belirlenecek; veri atfı korunacaktır.

## Yalnız araştırma / yöntem referansları

- [Modified Swiss Dwellings, 4TU v2](https://data.4tu.nl/datasets/e1d89cb5-6872-48fc-be63-aadd687ee6f9/2):
  Casper van Engelenburg ve diğerleri, ECCV 2024; veri CC BY 4.0. Bu turda MSD
  arşivi kullanılmadı. Açık geçiş için 40 mm ve yakın açıklık için 50 mm yaklaşımı
  [makaledeki](https://arxiv.org/abs/2407.10121) yöntem karşılaştırmasında referanstır.
  Kalın duvarlar için ayrıca sınırlı normal ışın çıkarımı özgün olarak yazıldı;
  bu çıkarım ölçülmüş kapı semantiği veya kesin mimari doğruluk değildir.
- [ResPlan](https://github.com/m-agour/ResPlan/blob/main/LICENSE): veri CC BY 4.0,
  yazar katkılarıyla sınırlı lisans kapsamı; kod MIT. Özgün ilan görsellerine lisans
  verilmez. Bu teslimin eğitim/uyarlama korpusuna eklenmedi.

Diğer adayların kullanım kararları ve dışlama nedenleri
`knowledge/ev-projesi/veri/real-dataset-registry.json` dosyasındadır. Bir makalenin
açık lisansı veri setini, bir deponun MIT/GPL lisansı da ayrı veri/ağırlıkları
kendiliğinden lisanslamaz. Belirsiz ve ticari kullanımı kapalı kaynaklar çıktılara
ve eğitim adaylarına karıştırılmaz.
# EV-QWEN-00C ek kaynak notu — 20 Ekim 2026

00C'nin yeni geometri kaynağı da 00D'deki Swiss CC BY 4.0 korpusudur; kaynak
ülke CH korunur, farklı hedef ülkeye uyarlama sentetik öneri olarak işaretlenir.
Tam kaynak künyesi aşağıdaki 00D kaydında ve her örnek JSON'unda kalır.

Tipoloji sentezinde **IEE Projects TABULA + EPISCOPE (www.episcope.eu)**
[ülke matrisi](https://episcope.eu/building-typology/country/) ve
[kullanım/atıf koşulları](https://episcope.eu/communication/download/) incelendi.
Plan/fotoğraf kopyalanmadı; AURA alan ve boyut önerileri kaynak istatistiği sayılmaz.
Ulusal istatistik ve resmi mevzuat bağlantıları `ulke-profilleri.eu.json` ve
`plan-kurallari.eu.json` içinde erişim tarihi, sürüm ve kapsamla birlikte listelidir.
Mevzuat sayfalarının plan veri seti olarak açık lisanslı olduğu iddia edilmez;
uzun alıntılar ve ücretli DIN metinleri çoğaltılmadı.

Yerel CPU tabanı: [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct),
Apache-2.0. Model ağırlıkları depoya veya siteye eklenmez. Çok dilli metinler
AURA bileşenlerinden oluşturulmuş adaylardır; gerçek müşteri bilgisi içermez.
