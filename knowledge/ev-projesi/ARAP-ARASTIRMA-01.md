# ARAP-ARASTIRMA-01 · kaynak ve uygulama sınırı

21 Ekim 2026 · TOPARLAMA-01 Aşama 5. Temel araştırma: [Körfez kaynak raporu](KORFEZ-KAYNAK-ARASTIRMA-01.md). Ülke kaydı: [arap-ulkeleri.json](veri/arap-ulkeleri.json); meclis girdileri: [meclis.json](veri/meclis.json).

Önce BAE, Suudi Arabistan, Katar ve Kuveyt; sonra Bahreyn, Umman, Mısır, Ürdün, Fas. Dokuz ülke için önceki 18 kaynağın tür/lisans/erişim ayrımı korundu. Konut satış kaydı, mahalle/parsel haritası ve iç plan birbirinin yerine kullanılmadı. Kaynaklı tipik net alan ve tam madde/kapsam doğrulaması bu tur da sağlanmadı; sayılar null. Bu dosya tam bir ulusal tipoloji/mevzuat incelemesi değildir.

## Ülke bazında kullanım

| Ülke | Dayanak | Güvenle kullanılabilecek bağlam | Kullanıma açılmayan bilgi |
|---|---|---|---|
| BAE | DLD, Dubai Belediyesi, UNESCO | Yapı kayıtlarının alan türlerini ayırmak; müşteriye meclis/mahremiyet tercihlerini sormak | Net konut alanı tipikleri, bütün emirliklere aynı kural, açık iç plan korpusu |
| Suudi Arabistan | MOJ/REGA kaynak envanteri, SBC, UNESCO | İşlem verisi/plan ayrımı; bina sınıfını önce belirlemek | Her apartmanı SBC 1101–1102'ye tabi saymak, kaynaksız kapı/merdiven ölçüsü |
| Katar | NPC konut tipi sayımı, UNESCO | Villa/daire gibi istatistik kategorileri; kullanıcının ağırlama biçimini sormak | Sayım tablosundan oda ölçüsü çıkarmak |
| Kuveyt | PAHW haritaları | Proje/yerleşim ile evin iç planını ayırmak | Parsel çizimini oda geometrisi saymak; mahremiyet düzenini zorunlu tutmak |
| Bahreyn | Bakanlığın konut tasarım kataloğu | İki katlı model çizimi adayı olarak takip | Lisans ve dosya incelemesi doğrulanmadan içe aktarım |
| Umman | Resmî konut veri portalı, UNESCO | İstatistik bağlamı ve müşteriye sorulacak tercihler | Bölgesel istatistiği bütün ülkeye veya zorunlu ev düzenine genişletmek |
| Mısır | CAPMAS keşif kaynağı | Ayrı ülke araştırması için başlangıç | Körfez villa ölçülerini Mısır apartmanına uygulamak |
| Ürdün | HUDC proje kataloğu | Proje/arsa geliştirme bağlamı | Proje listesine bakarak doğrulanmış konut planı/alanı ilan etmek |
| Fas | HCP RGPH 2024 | Yerel konut kategorilerini kendi kaynağından incelemek | Bütün evleri aynı riad veya Körfez meclisi kalıbına sokmak |

[UNESCO meclis kaydı](https://ich.unesco.org/en/RL/majlis-a-cultural-and-social-space-01076) yalnız AE/SA/OM/QA ortak kültür kaydıdır. Her hanede kadın/erkek için iki salon, ayrı giriş, personel odası, ikinci mutfak veya ibadet odası var denmez. Bunlar bütün ülkelerde **tercih sorusu** olarak tutulur; country-specific prevalence olmadığı açık. Banyo/WC sayısı da müşteriden ve ölçülü plandan alınır. Kıble, konum/yön teyidiyle kullanıcıya sorulur; ülke kodundan çizilmez.

[SBC 2024 katalog açıklaması](https://sbc.gov.sa/ar/BC/Pages/BuildingCode/BCDetails.aspx?codeId=1101&year=2024) 1101–1102 kapsamını bir veya iki ailelik, en çok üç katlı konutlar için açıklar. Sayısal madde/istisna kontrolü yapılmadan kapı/koridor/merdiven alt sınırı yazılmadı. Önceki Dubai PDF bağlantısı yeniden denemede 404 verdi; güncel doküman için [Dubai Belediyesi resmî yayın sayfası](https://www.dm.gov.ae/municipality-business/building-publications/) kaydedildi. Bu erişim sorunu sessizce geçerli kaynak gibi tutulmadı.

## Meclis: kaynaklı ürün örneği, genel ölçü kuralı değil

[Jwana Hamdan üretici sayfası](https://www.jwanahamdan.com/en/products/sofas/majlis-on-structure) dış mekân modüler sisteminde dış derinliği 121 cm, alçak/yüksek seçenekte oturma yüksekliğini 28/38 cm ve toplam yüksekliği 56/66 cm olarak yayımlıyor. JSON'da mm'ye çevrildi. Bunlar Körfez iç mekân standardı veya yararlı minder derinliği değildir; ürün genişliği, minder kalınlığı, gerçek oturma derinliği ve köşe birleşimi doğrulanmadığı için null kaldı. Görsel/CAD alınmadı. Alıntı/faktüel ölçü kaydı tam kataloğun yeniden kullanım izni demek değildir.

L/U düzeni için iki/üç kol niyeti, köşe birleşimi ve açık orta alan gereksinimleri yazıldı. Ölçüsüz bir ürünün dış sınırı hesaplanmadı. `RULES.passage=600` mevcut stüdyonun kendi dolaşım önerisi olarak kaynak gösterildi; yerel yapı veya erişilebilirlik kuralı sayılmadı. Kullanıcının yardımcı cihazı ve ihtiyaçları için ayrıca değerlendirme gerekir. Gerçek meclis parçası henüz yok; normal kanepenin adı değiştirilerek meclis yapılmadı. Claude'un modül eklemesi ve ürün ölçülerinin doğrulanması bekleniyor.

## Tekstil ve proje kapsamı

PERDE-01 / TEKSTİL-02 alanları kullanılır: pencere ölçüsü/yönü, mahremiyet ve gece kullanımı, katman, karartma, askı, bakım. Ağır fon veya büyük el dokuması halı ülke varsayılanı değildir. Halı ölçüsü yerleşim ve gerçek ürünle; aydınlatma elektrik/saha bilgisiyle; aksesuar müşterinin tercihiyle seçilir. Factual malzeme, ölçü, köken ve performans vaadi teknik föy veya üretici teyidi olmadan söylenmez.

## Sohbet tesliminin gerçek sınırı

12 **Arapça ön görüşme taslağı** yazıldı: AE 3, SA 3, QA 2, KW 2, EG 1, MA 1. Her biri sekiz kullanıcı/asistan çifti, toplam 192 mesaj. Kullanıcılar farklı ağızlar kullanabilir, asistan MSA; Salmiya örneğinde Doğu Arap rakamı korunur. İki ayrı iki katlı villa isteği var; ölçülü üst kat ve merdiven eksikliği açıkça sorulur.

**Ölçülü, çözücüyle döşenmiş yeni Arap planı sayısı 0.** Bu konuşmalar 12 tamamlanmış yerleşim sohbetinin yerine geçmiş sayılmaz. Fotoğraf okunduğu/ölçü çıkarıldığı veya dosyanın gerçekten gönderildiği iddia edilmiyor; gerçek müşteri görüntüsü yok. `plan=null`, işlemler ve yerleşim sonuçları boş, denetim gecti=false. Meclisli kayıtlar destek/ölçü bekliyor. İsviçre kaynağı kullanılarak yerel villa uydurulmadı; Bahreyn'in izni belirsiz çizimleri alınmadı. Aşama 5/B'nin plan/ürün geri oynatma ve iki katlı geometri şartı **açık**.

Önceki 28 sohbetin üslup işi Aşama 4'te diğer ülkelerle birlikte yapıldı. Kaynak, plan, işlem ve yerleşim hash'leri korundu; yeni Arap kayıtları için aynı başarı varsayılmadı. Eğitim, GPU, ücretli API ve dağıtım yok. İş emrinin tıkanan başlığı raporlayıp sonraki aşamaya geç kuralı uygulanır.
