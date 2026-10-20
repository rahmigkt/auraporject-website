# EV-QWEN-00C — Avrupa bağlamı ve sekiz dil

20 Ekim 2026. Başlangıç main: `07963e5ff328b7e17853797d14b48f1549e09007`.
Dal: `codex/ev-qwen-00c`. PR inceleme içindir; birleştirilmez. Eğitim yapılmadı, GPU kapısı kapalı.

## Karar ve kapsam

Karar sahibi 00D'nin 60 örnekli görsel setini topluca onayladı; kayıt [00d-kullanici-onayi.json](veri/ev-plan-eu-00c/00d-kullanici-onayi.json) içindedir. Her alternatifin ayrı seçildiği veya 8.719 planın eğitim için onaylandığı anlamına gelmez. Eski 00D kanıt dosyaları değiştirilmedi.

00C'deki yeni ev geometrileri konusunda karar sahibi: **“Gerçek referans sınırını koru; eksik tiplerde ölçülü plan ve tasarımcı iste.”** Bu nedenle sıra ev, müstakil çok katlı ev, bodrum, çatı ve kış bahçesi geometri olarak uydurulmadı. Katalog bunları tanır; araç doğrulanmış kaynak olmadığında netleştirmeye döner. Yeni tam ev/kat çözümü tamamlandı denmiyor.

## Teslim

| Bileşen | Sonuç |
|---|---|
| Ülke | 9 öncelik grubu, 11 ülke: BE, NL, DE, FR, GB, IE, DK, ES, IT, AT, CH |
| Tip kartı | Her ülkede 6, toplam 66; yerel ad, oda programı, alan/cephe/derinlik önerisi, kat, giriş, merdiven, ıslak hacim, servis, komşuluk ve kaynak |
| Belçika | VLG, BRU ve WAL ayrı bağlamlar |
| Dil | TR, EN, DE, FR, NL, DA, ES, IT; oda sayısı, alan birimi, kat ve yön sözlüğü |
| Aday veri | Dil başına 300, toplam 2.400; 1.780 train / 198 validation / 422 test |
| Yanıt dağılımı | 383 program, 1.537 netleştirme, 480 ret |
| Bölmeler | Kaynak bina ve geometri imzası çakışması 0; her ülkenin bir tipi yalnız testte |
| İnceleme | 52 örnek, 156 alternatif; BE her bölgeye 4, diğer her ülkeye 4 |
| Yerel model | Eğitimsiz Qwen2.5 0.5B, CPU, 16 gerçek istek; ham yanıtlar saklandı |

Dosyalar: [ülke profilleri](../ev-projesi/veri/ulke-profilleri.eu.json), [kural taraması](../ev-projesi/veri/plan-kurallari.eu.json), [dil sözlüğü](../ev-projesi/veri/dil-ulke-sozlugu.json), [EU program şeması](../ev-projesi/veri/plan-program.eu.schema.json).

Tipolojilerin sayısal alan ve boyut aralıkları **AURA tasarım öncelikleri** olarak etiketlidir; ülke çapında ölçülmüş dağılım veya yasal alt sınır değildir. Altı tipin istatistiksel en yaygın altı tip olduğu iddia edilmez. [TABULA/EPISCOPE](https://episcope.eu/building-typology/overview/) geniş bina sınıfları ve dönemler için çerçevedir; tekil planların temsil gücünü kanıtlamaz. Ulusal istatistik bağlantıları profil kartlarındadır. Kaynak plan/fotoğraflar bu sitelerden kopyalanmadı.

## İnceleme ve kaynak sınırı

[52 örneği aç](veri/ev-plan-eu-00c/review/okuma.html). [Masaüstü](veri/ev-plan-eu-00c/review/desktop.png) ve [telefon](veri/ev-plan-eu-00c/review/mobile.png) görüntüleri PR içindedir.

Her önerinin **geometri kaynağı İsviçre'dir**. Hedef ülke etiketi, yerel tip özelliklerinin veya yerel mevzuatın gerçekleştiği anlamına gelmez. Yaş, galeri/enfilade, yerel cephe karakteri ve benzeri özellikler doğrulanmamıştır. Kaynak net poligonları ve açıklıkları korunur; EV eksen alanları 00D'deki uyumluluk yaklaşımıdır. Ortak duvar ekseni, taşıyıcılık veya ruhsat onayı değildir.

İstekler 00D'nin ayrılmış test binalarından, getirilen referanslar eğitim binalarındandır. 52 kartta 51 farklı önceki istek kullanıldı; nadir yatak sayısı nedeniyle biri tekrar kullanıldı. Aramada yeterli üç eşleşme bulunamayan 53 deneme atlandı. Her isteğin çözülebildiği veya 156 geometrinin küresel olarak benzersiz olduğu iddia edilmez.

Onaylar alternatifin SHA-256'sına bağlıdır; alternatif değişince karar temizlenir. İnceleyen olmadan işaretli karar dışa aktarılamaz. Yeni EU setinde insan onayı **0**; otomatik test kararları saklanmadı.

## Mevzuat: kapsam ve bilinmeyenler

Kurallar ülke, bölge, yapı/kullanım türü, alan tanımı ve sürümle birlikte tutulur. Bilinmeyen veri `unknown` kalır; sonuç hiçbir zaman bütünsel uygunluk belgesi değildir.

- Belçika'da [Flaman teknik raporu](https://codex.vlaanderen.be/PrintDocument.ashx?geannoteerd=false&id=1038765), [Brüksel 2026 açıklaması](https://be.brussels/fr/logement/nouvelles-normes-minimales-de-qualite-partir-de-2026) ve [Valon ağırlıklı alanı](https://logement.wallonie.be/fr/page/criteres-de-superficie-habitable) ayrı. Net oda toplamı ile ağırlıklı yaşanabilir alan eşit sayılmaz.
- Hollanda için [Bbl çalışma sürümü](https://iplo.nl/publish/pages/191189/bbl-werkversie-21-11-2025-.pdf) 21.11.2025 tarihli; 2026 konsolide hukuk doğrulaması değildir. Gün ışığında eşdeğer alan, ham pencere alanından farklıdır; kullanım/istisna teyidi gerekir.
- Almanya'da [Bavyera Art.45](https://www.gesetze-bayern.de/Content/Document/BayBO-45) Berlin'e uygulanmaz. Sınıf 1/2 ve çatı istisnaları saklıdır. İş emrinde geçen [DIN 18011 geri çekilmiş](https://www.dinmedia.de/de/norm/din-18011/1721435); güncel zorunluluk sayılmadı, ücretli DIN metinlerinden eşik kopyalanmadı.
- [Fransız décence açıklamasında](https://www.service-public.gouv.fr/particuliers/vosdroits/F35978/0_1) ana oda için alan+yükseklik **veya** hacim dalı korunur; bütün yatak odalarına genel 9 m² kuralı yazılmaz.
- [England NDSS](https://www.gov.uk/government/publications/technical-housing-standards-nationally-described-space-standard/technical-housing-standards-nationally-described-space-standard) yerel kabul koşulludur, bütün Birleşik Krallık mevzuatı değildir. GIA duvarları da içerir. [Approved K](https://assets.publishing.service.gov.uk/media/60d5bdcde90e07716f516cfd/Approved_Document_K.pdf) özel merdiven ve çatı istisnalarıyla ayrıdır.
- [Danimarka BR18](https://www.bygningsreglementet.dk/tekniske-bestemmelser/18/krav/377/) düzeltilmiş cam alternatifi, [İspanya DB-SUA](https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf) özel sınırlı kullanım merdiveni, [Avusturya OIB 2023](https://www.oib.or.at/sites/default/files/oib-rl_3_ausgabe_mai_2023.pdf) eyalet kabulü gerektiren yeterli çözüm olarak işlenir.
- İrlanda'da [2007 rehberinin](https://www.gov.ie/en/department-of-housing-local-government-and-heritage/publications/quality-housing-for-sustainable-communities/) yeni apartman politikasıyla ilişkisi; İtalya'da [Art.24 istisnalarının](https://www.normattiva.it/uri-res/N2Ls?urn%3Anir%3Astato%3A2001%3B380~art24%21vig=) genel şartlardan ayrımı bu turda sayısal genel kurala dönüştürülmedi. İsviçre [WBS](https://www.bwo.admin.ch/de/glossar) değerlendirme çerçevesidir, ülke çapında yapı yasası değildir.

Havalandırma, erişilebilirlik ve koridor/kapı genişliklerinde doğrulanamayan kapsamlar açıkça bilinmiyor. Ulusal ve yerel uzman denetimi hâlâ gerekli.

## Veri ve sözleşme

0.5-eu uzantısı country/region/housing_type ekler; eski 0.4 ve canlı site değiştirilmedi. Aday veriler, yerel ölçüm ve araç prototipi aynı istem/şemayı kullanır. Dil ülkeyi kesinleştirmez. T3, 3-Zimmer ve trilocale doğrudan üç yatak odası sayılmaz; ana oda kullanımı sorulur. 3.5-Zimmer yuvarlanmaz. Alan biriminin çevrilmesi, net alanı GIA'ya çevirmez.

Metinler yazılmış çok dilli bileşenlerden deterministik olarak oluşturuldu. Gerçek müşteri sözü veya tek tek insan yazımı 2.400 metin değildir. Ana dil incelemesi ve daha serbest doğal dil ölçümü açık. Aynı dil kalıplarının bölmelerde görülmesi nedeniyle bu test doğal dil genellemesi kanıtı değildir. Programlar tek mümkün doğru çözüm değil, gerçek referansa bağlı aday hedeflerdir. Tam adaylar ve audit kanıtları [data](veri/ev-plan-eu-00c/data/manifest.json) altında.

## Gerçek CPU tabanı

[Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) ücretsiz Apache-2.0 modelidir; bu **Qwen3.5 9B eğitimi veya ölçümü değildir**. İki CPU iş parçacığı, GPU=0, sıcaklık=0, seed=0, 4096 bağlam, 1000 çıktı token sınırı ve JSON modu kullanıldı. İstekler yalnız localhost Ollama'ya gitti. Model indirmesi dışında dış model servisi kullanılmadı.

| Ölçüt | Sonuç |
|---|---|
| Her dil | 2 gerçek istek: açık program ve belirsiz ülke/oda gösterimi |
| Katı sözleşme | **0/16** |
| Ülke/bölge ve oda gösterimi, geçerli sözleşmeyle | Her dilde **0/2** |
| Programdan geçerli araç geometrisi | **0/8**; geçerli program olmadığı için çözücü çağrılmadı |
| Ham hata | 6 kesilmiş JSON, 10 şema doğrulama hatası |
| Ana ölçüm süresi | 956,218 sn, yaklaşık 16 dk |

Ham yanıtlar düzeltilmedi, örnek hedefler model cevabı yerine konmadı. Hatalı biçimdeki metinlerin anlamsal doğruluğu bu katı skorla ayrıca ölçülmüş sayılmaz. İlk şema yönlendirmeli pilot 3 tamamlanmış yanıt sonrası durduruldu; 1400 token sınırında kesilme görüldü. Bu **kısmi başarısız pilot** da ayrı saklandı. 16 istek bir dil başarı oranı tahmini değildir; her ülkeyi kapsayan model testi de değildir. Küçük model bu sözleşmeyle kullanıma hazır değil.

## Doğrulama ve kalanlar

62 birim testi; 2.400 sözleşme/bölme denetimi; 52 ilk seçenek kaynak-uyarlama geometrisi denetimi; üretimde 156 alternatif doğrulaması; 104/104 JSON mevcut viewer'da oda sayısı ve maket açılışı; 52 kart/156 alternatif, ülke filtresi, karar sıfırlama, hash ile dışa aktarım, kalıcılık ve 390 px taşma testi geçti. SVG ad alanı sorunu tarayıcı testinde bulundu ve düzeltildi. Bunlar mimari onay değildir.

Kaynaklar ve yeniden üretim: [eu/README](../../tools/ev-plan/eu/README.md), [atıf](VERI-ATIF.md). Son paket hash'leri teslim anında hesaplanır; üretim başlangıcında bütün kaynak dosyalarının dondurulduğu iddia edilmez. Veri v1 bölme denemesi teslim edilmedi; v2 bina ayrımı doğrulanmış sürümdür. HTML SVG düzeltmesi geometriyi değiştirmeden yenilendi.

Yeni EU örneklerinin ve doğal dilin insan incelemesi; yerel gerçek çok katlı kaynak; kuralların uzman teyidi; daha güçlü yerel modelle aynı sözleşmede sağlamlık/gerileme ölçümü açık. Bunlar kapanmadan eğitim/GPU kararı yok. `assets/` ve `score.mjs` değişmedi.
