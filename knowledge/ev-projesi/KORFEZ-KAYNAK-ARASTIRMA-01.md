# Suudi Arabistan ve Körfez: konut planı kaynak araştırması 01

21 Ekim 2026 · Başlangıç main: `80b540e` · Araştırma ve Arapça çalışmasına devir.

Türkiye için EV-SOHBET-02 içinde üç sohbet mevcut. Bu, Türkiye'deki bütün konut tiplerinin, plan kaynaklarının veya mevzuatın tamamlandığı anlamına gelmez. Bu teslim, EV-ARAP-01 bölüm A'ya kaynak araştırması sağlar; bölüm A'nın tamamlandığını veya 12 Arapça sohbetin üretildiğini söylemez. Diğer çalışmanın Arapça arayüzüne ve sohbet dosyalarına müdahale edilmedi.

## Sonuç ve kullanım kararı

Suudi Arabistan ve Körfez'de emlak ve konut kayıtları bulunuyor. İncelenen kayıtların önemli bölümü satış, yapı özellikleri, konut sayıları veya parsel dağılımı; bunlardan oda duvarı, kapı, pencere ve merdiven geometrisi çıkarılamaz. Bu taramada lisansı ve ölçülü iç geometrisi birlikte doğrulanmış yerel plan sayısı **0**. Bu, böyle bir veri setinin hiç olmadığı iddiası değildir.

En somut yerel çizim adayı Bahreyn'in resmî konut tasarım kataloğu. Ayrı bir teknik fırsat, KAUST bağlantılı FloorplanQA'nın açık mekânsal muhakeme araçları. İlki yeniden kullanım izni ve dosya incelemesi bekliyor; ikincisi Suudi konut tipolojisi olarak sunulamaz. İlan sitelerinden toplu fotoğraf/plan çekmek yerine bu iki hattı ayrı ilerletmek daha sağlamdır.

Makinece okunabilir kaynak ve ülke durumu: [korfez-kaynaklari-01.json](veri/korfez-kaynaklari-01.json). Kaynak kimlikleri aşağıdaki kayıtlarla eşleşir. `null`, kontrol edilmemiş bilgidir; varsayılan ölçü değildir. Kaynak dosyaları indirilmedi, üretim aktarımı kapalıdır.

## Öncelikli ülkeler

| Ülke | Bulunan kanıt | Kullanılabilecek bilgi | Açık kalan konu |
|---|---|---|---|
| BAE | AE-DLD, AE-CODE, GCC-MAJLIS | Yapı kayıtları; Dubai için kod kaynağı; meclis kültürü | İç planlar, emirlik bazlı kurallar, tipik net alan |
| Suudi Arabistan | SA-TX, SA-LIC, SA-CODE, GCC-MAJLIS | İşlem verisi kaynağı; lisans politikası; SBC 2024 katalog kaydı | Yeniden kullanılabilir gerçek villa geometrisi ve madde bazlı ölçüler |
| Katar | QA-CENSUS, GCC-MAJLIS | 2010/2020 konut tipi ve belediye kırılımı; meclis kültürü | Oda geometrisi, villa net alan dağılımı, güncel mevzuat maddeleri |
| Kuveyt | KW-PAHW | Resmî yerleşim/parsel dağıtım haritaları | Bunların evin iç planı olduğu doğrulanmadı; iç plan ve izin gerekli |

**AE-DLD.** [Dubai Land Department, Real Estate Data](https://dubailand.gov.ae/en/open-data/real-estate-data): görünen yapı alanları arasında kat, daire, oda, otopark ve farklı alan tanımları var. Bunlar vektör oda sınırları değildir. Arsa alanı, toplam inşaat alanı ve ortak alanı net yaşam alanıyla eşitleme. Ayrı broker/kişi iletişim tablolarını proje verisine alma. İlgili dışa aktarımın lisans ve kullanım koşulları ayrıca kaydedilmeli.

**SA-TX.** [Saudi-Real-Estate-Data deposu](https://github.com/civillizard/Saudi-Real-Estate-Data) ve [veri lisansı açıklaması](https://github.com/civillizard/Saudi-Real-Estate-Data/blob/main/LICENSE-DATA.md): yayıncı MOJ/REGA işlem CSV'leri sunuyor; kod lisansı ile veri lisansı ayrılmış. Milyonlarca işlem olması milyonlarca ev planı demek değildir. Depo açıklamasını özgün resmî dosyanın lisans teyidi yerine kullanma; veri sayıları bağımsız doğrulanmadığı için burada aktarılmadı.

**SA-LIC.** [Riyad Belediyesi açık veri politikası](https://www.alriyadh.gov.sa/en/content/government-open-data): atıflı yeniden kullanım çerçevesi bulunuyor; veri tabanının lisansı içerikteki her görüntünün haklarını otomatik çözmez. Bir belediyenin politika sayfası başka yayıncının çizimlerine izin vermez.

**QA-CENSUS.** [National Planning Council veri kartı](https://www.data.gov.qa/explore/dataset/housing-units-by-type-of-units-and-municipality-in-census-2010-2020/information/): konut türü, sayım yılı ve belediye değerleri; kartta CC BY yazıyor, sürümü burada teyit edilmedi. Pazar örneklerini çeşitlendirmeye yarar; oda ölçüsü veya güncel piyasa temsili sağlamaz.

**KW-PAHW.** [Kuveyt Konut Refahı Kurumu dağıtım haritaları](https://www.pahw.gov.kw/Distribution_Charts): mahalle/proje haritaları için resmî başlangıç. Parsel dağıtımını iç mekân çizimi diye etiketleme; ev tipi dosyaları ve yeniden kullanım izni ayrı aranmalı.

## İkinci grup ve gerçek çizim adayı

**Bahreyn — BH-DESIGNS / BH-T8.** [Bakanlığın konut tasarım kataloğu](https://www.housing.gov.bh/unit-design) arama dizininde D-11, MS3, MV ve TV tiplerini, iki kat ve dört oda bilgilerini gösteriyor. Örneğin D-11 için 239,92 m² yazıyor; **net alan olduğu doğrulanmadığı için** ülke profilinde `null` tutuldu. [T8 çizim PDF bağlantısı](https://housing.gov.bh/UnitDesign/HousingSite-637171065199721301.pdf) dizinde zemin kat planı olarak görünüyor. Bu oturumda doğrudan katalog/PDF erişimi 403 verdi; ölçek, kat eşleşmesi, duvar ve merdiven ayrıntıları görsel olarak doğrulanmadı. Erişim engeli aşılmadı. Ticari kullanım/eğitim/yeniden dağıtım lisansı bulunmadı; dosyalar içe aktarılmadı. İlk izin ve teknik inceleme adayı budur.

**Umman — OM-STATS.** [Resmî konut veri portalı](https://data.gov.om/OMHSNG2016/housing?lang=en&region=1000620-wilayat-ibra): yapı izinleri/konut istatistiği için başlangıç; seçili bölge bütün ülkeyi temsil etmez. İç plan geometrisi değil, ülke profili bağlamıdır.

**Mısır — EG-STATS.** [Resmî CAPMAS konut istatistiği yayını](https://mediadr.sis.gov.eg/bitstream/handle/123456789/33497/CAPMAS20230300_0100.pdf%3Fsequence%3D1%26isAllowed%3Dy): keşif adayı; ayrıntılı PDF ve lisans incelemesi tamamlanmadı. Özel villa plan veri seti bulunduğu iddia edilmiyor.

**Ürdün — JO-HUDC.** [HUDC proje listesi](https://www.hudc.gov.jo/EN/List/Projects_in_Progress): konut projeleri için resmî giriş noktası. Proje adı veya arazi geliştirme sayfası ölçülü daire planı değildir; proje özelinde dosya/izin kontrolü gerekir.

**Fas — MA-HCP.** [HCP RGPH 2024 indirmeleri](https://www.hcp.ma/downloads/RGPH-2024_t22752.html): konut stoğu ve tipoloji incelemesi için kaynak. Fas'ı Körfez villa modelinin bir uzantısı sayma; yerel konut kategorilerini kendi yayınından al. Bu tur tipik net alan veya iç geometri doğrulanmadı.

## Mekân kültürü: varsayım yerine soru

**GCC-MAJLIS.** [UNESCO meclis kaydı](https://ich.unesco.org/en/RL/majlis-a-cultural-and-social-space-01076), BAE, Suudi Arabistan, Umman ve Katar ortak başvurusudur. Misafir ağırlama/toplanma, duvar boyunca minderler ve halı gibi kullanım özelliklerini açıklar; kadınların meclislerinden de söz eder. Bu, her evde iki ayrı misafir salonu bulunacağı veya belirli bir ölçünün zorunlu olduğu anlamına gelmez. Kuveyt, Bahreyn, Mısır, Ürdün ve Fas için bu kaydı ülkeye özel kanıt gibi genişletme.

Sohbet yazarı müşteriye, uygun olduğunda sırayla şu ihtiyaçları sormalı:

- Misafir alanı aile yaşamından ayrı olsun mu; kimler ve kaç kişi kullanacak?
- Ayrı giriş isteniyor mu; mevcut kapıların yeri ve açılma yönü nedir?
- Tek mutfak mı, ikinci hazırlık mutfağı mı isteniyor? Islak tesisat ve havalandırma nerede?
- Personel odası, ibadet/abdest alanı veya erişilebilir banyo ihtiyacı var mı?
- Kaç banyo mevcut; hangi alanların korunması gerekiyor?

Bunlar **müşteri tercih sorularıdır**, ülke bazında kanıtlanmış zorunlu özellikler değildir. Kıble istenirse konum ve tercih teyit edilir; kuzey oku veya ölçü olmadan yön çizilmez. Ayrı kadın/erkek alanı otomatik eklenmez. Son üretim ve uygulama kararını tasarımcı doğrular.

## Mobilya, perde, halı: mevcut sözleşmeye eklenebilecek bilgiler

[PERDE-HALI-ARASTIRMA-02](PERDE-HALI-ARASTIRMA-02.md) ile [TEKSTİL-02 iş emrindeki](CLAUDE-IS-EMRI-TEKSTIL-02.md) mevcut ölçü/malzeme alanlarını yeniden kullan. Bu araştırma yeni bir arayüz veya ikinci kayıt biçimi getirmiyor.

Meclis için `requested_seating_layout` (L/U/duvar boyunca), kullanıcı sayısı, bitmiş ürün derinliği/yüksekliği, minder kalınlığı ve temizlik tercihi alınabilir. Bunlar **önerilen kavramsal alanlardır**, bugün desteklenen API iddiası değildir. Kaynaklı tipik sedir ölçüsü bu tur bulunmadı; üretici teknik föyü veya müşteri ölçüsü gelmeden sayı doldurma. Çözücüde destek yoksa normal kanepeyi meclis türüymüş gibi kaydetme; tasarımcıya açık ihtiyaç olarak ilet.

Perdede açıklık ölçüsü, pencere yönü, güneş etkisi, mahremiyet, tül/karartma katmanları, korniş taşıma kapasitesi ve bakım sorulur. Ağır perde veya siyah karartma ülke varsayılanı değildir. Halıda gerçek ölçü, lif, hav/dokuma, kapı altı boşluğu, kaymaz taban ve temizlik önemlidir. UNESCO kültür açıklaması her müşteriye el dokuması ya da büyük halı satma gerekçesi değildir. Hiçbir yeni ürün ölçüsü bu tur doğrulanmadı.

## Mevzuat: kaynağı bulmak, ölçüyü doğrulamak değildir

**SA-CODE:** [SBC 1101–1102 / 2024 resmî katalog kaydı](https://sbc.gov.sa/ar/BC/Pages/BuildingCode/BCDetails.aspx?codeId=1101&year=2024). **AE-CODE:** [Dubai Building Code 2021 resmî PDF](https://u.ae/-/media/Documents-2023/Dubai-Building-Code_English_2021-Edition_compressed-%281%29.pdf) ve [belediyenin yayın listesi](https://www.dm.gov.ae/municipality-business/building-publications/).

Bu tur ilgili bina sınıfı, madde, istisna ve güncel değişiklikler birlikte doğrulanmadı. Bu nedenle kapı net geçişi, koridor ve merdiven genişlikleri dokuz ülkede de `null`. Dubai kuralını tüm BAE'ye veya SBC kuralını tüm Körfez'e yayma. Her uygulanacak kural için ülke/yerel idare, sürüm, madde, bina/erişilebilirlik kapsamı, ölçüm tanımı ve değişiklik tarihi saklanmalı. Mobilya boşluğu hedefiyle yasal asgari ölçü ayrı tutulmalı.

## Açık kaynak teknik fırsatlar ve eleme

**FPQA-CODE / FPQA-DATA.** [FloorplanQA kodu](https://github.com/OldDeLorean/FloorplanQA) MIT; [veri kartı](https://huggingface.co/datasets/OldDelorean/FloorplanQA-Layouts/blob/main/README.md) yayıncı beyanıyla CC BY 4.0. Kart 2.000 JSON düzeni listeliyor: 1.800 sentetik oda ve HSSD'den türetilmiş 200 düzen. Sınır, nesne, kapı/pencere alanları bizim mekânsal denetim yaklaşımımıza uygun bir aday. Suudi bir araştırma kurumuyla bağlantı, verinin Suudi evlerinden geldiğini kanıtlamaz. HSSD alt kümesinin üst kaynak koşulları ayrıca incelenmeli; ilk değerlendirme için sentetik alt küme tercih edilebilir. Kodun görsel üretim/ücretli API bölümüne ihtiyaç yok. Bu teslim kurulum, veri indirme veya performans testi yapmadı. Ayrı kapalı değerlendirmede kullanılırsa aynı örnekler eğitime karıştırılmamalı.

**RESPLAN.** [Yayıncı deposu](https://github.com/m-agour/ResPlan) veri için CC BY 4.0, kod için MIT belirtiyor. Güney Asya kaynaklı, tek kat; çok katlı Körfez villası değildir. Kaynak ilanların hakları, sürüm ve atıf bilgisi ayrıca incelenmeli. Depo yakın kopyaların eğitim/test ayrımına sızabildiğini açıklıyor; planları geometri gruplarına göre ayır. Duvar komşuluğunu geçilebilir kapı bağlantısı sanma. Mevcut Swiss Dwellings kayıtları da uyarlanmış referans etiketiyle korunmalı; ülke etiketi değiştirerek yerel gerçek eve dönüştürülemez.

**CUBICASA.** [Asıl lisans dosyası](https://github.com/CubiCasa/CubiCasa5k/blob/master/LICENSE) CC BY-NC 4.0. AURA'nın ticari veri hattına açık lisanslıymış gibi eklenmedi. RPLAN ve yeniden yüklenmiş ilan arşivleri için bu taramada ticari kullanım izni doğrulanmadı; bunlar da kabul edilmiş kaynak değildir.

## Arapça çalışmasını yapan kişiye devir

1. Önce BAE, Suudi Arabistan, Katar, Kuveyt; sonra Bahreyn ve Umman; Mısır/Ürdün/Fas ayrı profiller. Ülke sırası dosyası eski PR durumları da içeriyor; başka çalışmayla çakışmamak için burada değiştirilmedi.
2. EV-ARAP-01'deki 12 sohbet dağılımı korunabilir. Bu rapor sohbet veya doğrulanmış plan teslimi değildir. İki katlı iki villa şartı, mevcut tek katlı planları üst üste koyarak karşılanmış sayılamaz. İzinli, katları ve merdiveni eşleşen kaynak gelene kadar bu örnekler açık eksik kalmalı.
3. Bahreyn katalog dosyasının normal erişimi ve yeniden kullanım izni teyit edilirse iki kat çizimini görsel olarak kontrol et; ölçek, kapı, merdiven ve kat ilişkisini doğrula. Bu adım tamamlanmadan çizim kopyalama veya otomatik sayısallaştırma başlatma.
4. FloorplanQA sentetik kısmını mevcut doğrulayıcıya uyarlamak ayrı küçük teknik deneme olabilir. Önce birim/koordinat/kapı sözleşmesi ve veri sürümü sabitlenmeli; bugün stüdyoya kurulmuş araç gibi anlatılmamalı.
5. Asistanın dili sade MSA; kullanıcının lehçesi ve rakam biçimi korunur. Kaynak/provenans sohbet dışındaki metadata'da durur. Gerçek müşteri görüntüsü eğitim için kendiliğinden kullanılamaz. Ülke ve kültür bilgisi kullanıcı tercihini geçersiz kılamaz.

## Kalan açıklar / teslim sınırı

Dokuz ülkenin tipik **net** alan dağılımları, madde bazlı yasal ölçüler, kaynaklı ürün ölçüleri ve yeniden kullanılabilir yerel plan geometrisi henüz yok. Özellikle iki katlı villa kaynağı kritik. Kaynak kayıtlarında bu eksikler sıfır/boş zorunluluk listesi veya `null` ile açık tutuldu; kültür kanıtı yalnız ilgili dört ülkeye bağlandı. Araştırma raporu ve JSON teslim edildi; assets, canlı arayüz, mevcut sohbetler ve eğitim hattı değiştirilmedi. Eğitim/GPU/ücretli API başlatılmadı.
