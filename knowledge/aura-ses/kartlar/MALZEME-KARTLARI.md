# Malzeme anlam kartları — ilk dilim

67 kart / tanımlı 130 malzeme ve görünüş kavramı. [Sayım ve sınırlar](../arastirma/PLAN.md).
Bu kartlar yayın metni veya üretim şablonu değildir; yazarın araştırma ve soru zemini.
[Makine okunur kartlar](malzeme-kartlari.json) aynı editoryal kayıtların serileştirilmiş hâlidir.
`vocab` bağı **olasılığın sözlükteki yerini** doğrular; o malzemenin bir tasarımda etkin olduğunu kanıtlamaz.
Katalogda bulunan ama etkin olmayan slot, `dayanak` olamaz. Her kartın ortak notu aşağıdaki gruba bağlıdır.
Kaynak kimlikleri [malzeme derlemesindeki](../arastirma/MALZEME.md) M01–M17 kayıtlarına gider.

## Ortak duyusal ve zamansal notlar

### ORTAK-WOODS
Gözdeki damar motordaki katalog çiziminin bir eğilimidir; gerçek tür/kesim/numune karşılaştırması değildir.
Elde doku ve hissedilen ısı bitiş ve ortamla değişir. Lif yönü ile elin hareketi araştırılabilir.
Koku, kesit ve bitiş bilinmeden verilmez. Ses gövde ve birleşime bağlıdır. M01–M03 zamanla kullanım,
ışık ve nemin yüzeyi değiştirebildiğini açıklar; tür bazında renk değişim takvimi doğrulanmadı.
Türlerin zanaat coğrafyaları ve mekanik üstünlükleri için uzman monografisi eksik; bu iddialar beklemede.

### ORTAK-STAINS
Renk adıdır; ısı, koku, tür, köken ve doğal içerik belirtmez. Görünürlük gerçek alt tür, uygulama ve
ışıkla değişir. Zamanla renk sabitliği test edilmedi. Ses veya el hissi renkten türetilmez. M02–M03.

### ORTAK-FINISHES
Bitiş bir temas arayüzüdür. Parlaklık, kimya, dokunma ve bakım ihtiyacı aynı alan değildir. M03 ve M11
tek görünüşün tek reçete olmadığını gösterir. Yaşlanma, çizilme ve koku ürün numunesi olmadan belirlenmez.
Akustik veya ısıl performans yok; geleneksel cila/urushi hikâyesi motor seçeneğine mal edilmez.

### ORTAK-STONES
Damar ve tane kataloğun temsilidir. Elin algıladığı serinlik gerçek yüzey/ortam/temasla değişir; oda
sıcaklığı veya sağlık hükmü değildir. Ses tabla ve altlığı bilinmeden yazılmaz; koku vaadi yok.
M09, M15 ve M16; kullanımda değişim olasılığı vardır, leke ve çatlak yeni ürünün yaşanmış geçmişi sayılmaz.
Taş ticari adı, ocak ve zanaat coğrafyası için sertifika değildir.

### ORTAK-METALS
Kod metal bitişini seçer, altlık alaşımını doğrulamaz. Bakış yansıma ve silueti, el kenarı fark edebilir;
gerçek pürüz, ısı ve ses ölçülmedi. Koku kullanılmaz. M04/M17'de patina ile aktif korozyon ayrılır;
her kararma iyi yaşlanma değildir. Geleneksel döküm/dövme imalat motor verisinden çıkarılmaz.

### ORTAK-GLASS
Şeffaflık, renk ve görüntü açıklığı farklı görsel sorulardır. Kenar kalınlığı, temper/laminasyon ve
güvenlik belgesi ayrıca gerekir. Elde ısı ve ses için numune/geometri şart; koku vaadi yok. M08/M13
yüzey ve hasar ayrımını açar; çizilmezlik veya zamana direnç garantisi yok. Buzlu görünüş yöntem değildir.

### ORTAK-FIBERS
Alan adı fiber olsa da son altı seçenek saf lif adı değildir. Görme ile elin beklentisi arasında soru
kurulur; dokunma, koku, akustik ve ısıl sonuç için iplik/yapı/bitiş/altlık gerekir. M05/M07/M12/M14;
ışık, sürtünme ve kıvrım görünüşü değiştirebilir, fakat güzel yaşlanma vaadi değildir. Tür/yöre/tezgâh
geleneği ürünün kökeni yerine kullanılamaz. Gelenek bilgisi için özgül monografiler PR 2 açık işidir.

### ORTAK-WEAVES
Yapısal yön ve tekrar yorumlanabilir. Motorun görsel modeli gerçek tezgâh çözümü/numune değildir.
M07/M10/M12; dokunuş, koku, ısı, ses ve aşınma iplik, sıklık, bitiş ve kullanımla değişir.
Bir örgünün tarihsel olarak bir bölgede bulunması bu ürünün o gelenekten geldiğini göstermez.

### ORTAK-SURFACES
Yüzey, tüm gövde veya malzeme kalınlığı demek değildir. Alt malzeme anahtarı, etkin parça ve malzeme
birlikte okunur. Duyu ve zaman bilgisi seçilmiş alt karta bağlanır; bu genel kart tek başına yeterli değil.
`same` miras bağı çözülmeden bağımsız malzeme gibi anlatılmaz. Kaynaklar M01/M03/M04/M08/M09/M11.

### ORTAK-SPECIAL
Parça seçeneğinde kodlanmış malzeme kavramlarıdır. Biçim seçeneklerinin tam parça kartları PR 2'de.
Hasırda ışık/nem/gerilme, aynada arka kaplama ve ortam değişimi önemlidir; ürün reçetesi yok.
M06/M08. Koku, ses, ısı ve yaş iddiası yapılmaz; belirli bölge/zanaat veya malzeme türü doğrulanmadı.

## Kartlar

### woods.gurgen — Gürgen — tür belirsizliği

Sözlük: `/catalogs/WOODS/gurgen`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Türkçe ad ile İngilizce Beech etiketi uyuşmuyor; açık ahşap görünüşü botanik kanıt değildir.

**İlişki sorusu:** Tekrarlanan el temasını düşün; türü çözümlenmeden tür adına dayalı sahne kurma.

**Sınır:** Gürgen/kayın dayanımı, koku, yetiştiği yer ve sertlik karşılaştırması askıda.

### woods.oak — Meşe

Sözlük: `/catalogs/WOODS/oak`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Katalogda belirgin damar yönü, yüzey boyunca izlenebilen bir yol önerir; gerçek kesim farklılaşabilir.

**İlişki sorusu:** Elin kenardan yüzeye geçişinde doğrultunun nasıl okunduğunu sor.

**Sınır:** Damar görseli masif kesit, meşe rengi de gerçek meşe kanıtı değildir.

### woods.ash — Dişbudak

Sözlük: `/catalogs/WOODS/ash`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Katalogdaki açık zemin ile çizgisel damar arasındaki fark, bakışın durması ve ilerlemesi için bir ayrıntıdır.

**İlişki sorusu:** Bir geniş yüzeyi tek leke yerine izlenebilir yön olarak düşün.

**Sınır:** Elastikiyet, hafiflik veya spor aleti geleneğinden mobilyaya performans çıkarma.

### woods.beech — Kayın

Sözlük: `/catalogs/WOODS/beech`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Katalog görünüşünün daha toplu damar ritmi, biçim ile yüzey arasındaki dikkat payını değiştirir.

**İlişki sorusu:** Temasın beklentisini yüzeyin gösterişinden önce düşün.

**Sınır:** gurgen ile aynı ağaç diye birleştirme; kesim ve bitiş bilinmeden pürüzsüzlük söyleme.

### woods.walnut — Ceviz

Sözlük: `/catalogs/WOODS/walnut`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Koyu-açık damar geçişi görsel sürekliliği tekdüzelikten ayırabilir; gerçek levha eşsizliği kanıtlanmadı.

**İlişki sorusu:** Masanın etrafındaki bakışın bir çizgide kalıp sonra yeniden insana dönmesini araştır.

**Sınır:** Amerikan ceviz, kök ceviz, yaş veya yağlı doğal parlaklık uydurma.

### woods.cherry — Kiraz

Sözlük: `/catalogs/WOODS/cherry`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Katalogdaki kızıl eğilim, komşu yüzeyle renk mesafesini düşündürür.

**İlişki sorusu:** Yakından bakış ile odanın karşısından bakışın farklı ayrıntıları seçmesini konu et.

**Sınır:** Zamanla kesin şu renge döner, belirli yörede yetişti veya meyve kokar deme.

### woods.teak — Tik

Sözlük: `/catalogs/WOODS/teak`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Katalogdaki sıcak kahverengi aralık görsel bir seçimdir; bitmiş nesnenin dokunma sıcaklığı değildir.

**İlişki sorusu:** İçeride sık temas edilen bir kenarın gündelik yerini düşün.

**Sınır:** Dış mekâna uygunluk, su geçirmezlik, yağ oranı, tropik köken ve sertifika varsayma.

### woods.smoked — Füme ahşap görünüşü

Sözlük: `/catalogs/WOODS/smoked`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Bu bir ağaç türü değil, koyulaştırılmış görünüş/işlem seçeneğidir; alt tür eksik.

**İlişki sorusu:** Yüzeyin kararmasıyla gölgenin okunması arasındaki sınırı sorgula.

**Sınır:** İs, yanık kokusu, özel fırın veya amonyak işlemi yapıldığını söyleme.

### woods.ebonized — Ebonize görünüş

Sözlük: `/catalogs/WOODS/ebonized`. Kaynak: M01, M02, M03; ORTAK-WOODS.

**Anlam:** Koyu yüzey, damar ile siluet arasındaki dikkat dağılımını değiştirir; abanoz ağacı değildir.

**İlişki sorusu:** Kütlenin çevresindeki açıklığın nasıl fark edildiğini araştır.

**Sınır:** Masif abanoz, nadir ağaç, geleneksel boyama reçetesi veya değişmez siyahlık iddia etme.

### stains.natural — Doğal ton

Sözlük: `/catalogs/STAINS/natural`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Renk seçiminin geri çekilmesi ahşabın görünür yönüne dikkat açabilir.

**İlişki sorusu:** Yüzeyi bir renk adı yerine gündelik temasın zemini olarak ele al.

**Sınır:** Doğal, işlenmemiş, yağsız veya kimyasalsız demek değildir.

### stains.lightOak — Açık meşe tonu

Sözlük: `/catalogs/STAINS/lightOak`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Açık ton, çevre yüzeyle görsel ayrımı azaltabilir; ışık koşulu bilinmiyor.

**İlişki sorusu:** Bir kenarın odadan nasıl ayrıldığını sorgula.

**Sınır:** Meşe türü veya odanın gerçekten aydınlandığı sonucu çıkmaz.

### stains.oak — Meşe tonu

Sözlük: `/catalogs/STAINS/oak`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Meşe adı burada renk ailesidir, gövdenin türü değildir.

**İlişki sorusu:** Aynı nesnede renk ile damar bilgisini ayrı tutarak okumayı dene.

**Sınır:** Gürgen üstündeki oak değerine meşe ayak deme.

### stains.teak — Tik tonu

Sözlük: `/catalogs/STAINS/teak`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Kahverengi ton seçimi, malzemenin menşeinden bağımsız görsel bir karardır.

**İlişki sorusu:** Çevredeki başka bir nesneyle yakınlık veya mesafe sorusu aç.

**Sınır:** Tik ağacı, doğal tik yağı veya dış mekân dayanımı anlamına gelmez.

### stains.cherry — Kiraz tonu

Sözlük: `/catalogs/STAINS/cherry`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Kızıl eğilimli renk adı sıcaklık hissi için mecaz olabilir, ölçüm değildir.

**İlişki sorusu:** Yaklaşınca fark edilen renk ayrımını insan hareketine bağla.

**Sınır:** Kiraz ağacı, meyve kokusu veya zamanla kızarma iddiası çıkarma.

### stains.walnut — Ceviz tonu

Sözlük: `/catalogs/STAINS/walnut`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Ceviz rengi, farklı ağaçlar üzerinde başka damar okumaları bırakabilir.

**İlişki sorusu:** Rengin birleştirdiği yüzeylerde yönün hâlâ nasıl ayrıldığını sor.

**Sınır:** Ceviz kaplama, ceviz gövde veya tür kökeni kanıtı değildir.

### stains.darkWalnut — Koyu ceviz tonu

Sözlük: `/catalogs/STAINS/darkWalnut`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Koyulaşan renk, görünür çizgi ile siluet arasındaki ağırlığı değiştirir.

**İlişki sorusu:** Yakın bakış ile uzaktan biçim okumasını karşılaştır.

**Sınır:** Daha değerli, daha eski veya daha sert ahşap demek değildir.

### stains.wenge — Venge tonu

Sözlük: `/catalogs/STAINS/wenge`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Koyu tonun adı bir ağaca gönderme yapsa da slot yalnız renktir.

**İlişki sorusu:** Bir ayağın zeminle görsel sınırını düşün.

**Sınır:** Gerçek venge, Afrika menşei ve nadirlik iddiası yok.

### stains.black — Siyah ahşap tonu

Sözlük: `/catalogs/STAINS/black`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Siyah renk seçimi yüzeyin algılanan ağırlığını etkileyebilir; fiziksel kütleyi değiştirmez.

**İlişki sorusu:** Taşıyan parçanın boşluğa karşı sınırını araştır.

**Sınır:** Ebonize işlem, kömürleşme veya opaklık oranı verilmedi.

### stains.white — Beyaz ahşap tonu

Sözlük: `/catalogs/STAINS/white`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Açık renk, ışıkla yüzey ayrımını yeniden kurar; damar örtülme derecesi bilinmez.

**İlişki sorusu:** Elin aradığı kenar ile gözün gördüğü sınırı birlikte düşün.

**Sınır:** Beyaz lake, beyazlatma kimyası veya kiri göstermeme garantisi yok.

### stains.greige — Grej ahşap tonu

Sözlük: `/catalogs/STAINS/greige`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Gri-bej aralığı, çevredeki farklı renklerin arasına bir geçiş önerebilir.

**İlişki sorusu:** Aynı yüzeyin başka bir nesneyle yan yana oluşuna dikkat ver.

**Sınır:** Her dekorasyona uyum, nötr duygu ve boya bileşimi kesinlenmez.

### stains.anthracite — Antrasit ahşap tonu

Sözlük: `/catalogs/STAINS/anthracite`. Kaynak: M02, M03; ORTAK-STAINS.

**Anlam:** Koyu gri görünüşte gölge ile malzeme rengi karıştırılabilir.

**İlişki sorusu:** Bir kenarın ışık değişince fark edilmesini soru olarak kullan.

**Sınır:** Metal, taş veya antrasit kömürü değildir; yanmazlık iddiası yok.

### finishes.matte — Mat bitiş

Sözlük: `/catalogs/FINISHES/matte`. Kaynak: M02, M03, M11; ORTAK-FINISHES.

**Anlam:** Parlama beklentisinin azalması yüzeye bakışı uzatabilir; gerçek parlaklık ölçülmedi.

**İlişki sorusu:** Dikkatin yansıma yerine biçim veya damara dönmesini düşün.

**Sınır:** Tam yansımasız, çizilmez, yağsız veya açık gözenekli deme.

### finishes.oil — Yağ bitiş

Sözlük: `/catalogs/FINISHES/oil`. Kaynak: M02, M03, M11; ORTAK-FINISHES.

**Anlam:** İşlem adı yüzeyin hangi ilişkiyle korunacağını düşündürür; reçete verilmemiştir.

**İlişki sorusu:** Kullanılan yüzeyle bakım emeğinin devam eden bağını araştır.

**Sınır:** Gıda güvenliği, doğal yağ türü, bakım aralığı ve su direnci yok.

### finishes.satin — Saten bitiş

Sözlük: `/catalogs/FINISHES/satin`. Kaynak: M02, M03, M11; ORTAK-FINISHES.

**Anlam:** Mat ile parlak arasında tarif edilen bir ışık davranışı hedefidir; nicel değer değil.

**İlişki sorusu:** Bir ayrıntının bakış açısıyla belirip geri çekilmesini dene.

**Sınır:** Saten kumaş veya ipek değildir; evrensel dokunma yumuşaklığı vermez.

### finishes.lacquer — Lake bitiş

Sözlük: `/catalogs/FINISHES/lacquer`. Kaynak: M02, M03, M11; ORTAK-FINISHES.

**Anlam:** Kaplama katmanı, ahşap ile el arasındaki gerçek arayüzün parçasıdır.

**İlişki sorusu:** Görünen renk ile dokunulan bitişin aynı şey olmadığını düşün.

**Sınır:** Urushi, el cilası, solvent türü veya çizilmezlik çıkarılamaz.

### stones.carrara — Carrara seçimi

Sözlük: `/catalogs/STONES/carrara`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Katalogdaki açık zemin ve damar, gözün yüzeyde izlediği sürekliliğe konu olabilir.

**İlişki sorusu:** Sofraya bırakılan bir nesneyle damar yönünün karşılaşmasını düşün.

**Sınır:** Gerçek Carrara ocağı, İtalya menşei veya tam levha deseni doğrulanmadı.

### stones.calacatta — Calacatta seçimi

Sözlük: `/catalogs/STONES/calacatta`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Daha belirgin damar vurgusu, yüzeyin bölünmeden farklı yoğunluklarda okunmasını önerir.

**İlişki sorusu:** Boş bırakılan tabla bölümünün de görsel değerini araştır.

**Sınır:** Damarın her üründe aynı akışı, mermer kalite sınıfı ve nadirlik garantisi yok.

### stones.nero — Nero seçimi

Sözlük: `/catalogs/STONES/nero`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Koyu zemin üzerinde çizgi görünüşü, yansıma ve gölgenin farkını düşündürür.

**İlişki sorusu:** Elin koyacağı nesne ile koyu yüzeyin sınırına dikkat ver.

**Sınır:** Belirli jeolojik tür, ocak ve siyahın kalıcı niteliği yalnız koddan çıkmaz.

### stones.emperador — Emperador seçimi

Sözlük: `/catalogs/STONES/emperador`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Kahverengi taş görünüşü, damar ile geniş renk alanının ilişkisini açar.

**İlişki sorusu:** Yanına yaklaşınca fark edilen ayrıntının uzaktan birleşmesini düşün.

**Sınır:** İspanya menşei, sertlik ve leke direnci verilmedi.

### stones.verde — Verde seçimi

Sözlük: `/catalogs/STONES/verde`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Yeşil taş görünüşü malzeme ve renk beklentilerini üst üste getirebilir.

**İlişki sorusu:** Taşın bir renk lekesi olmaktan çıkıp yüzey olarak görülmesini sor.

**Sınır:** Serpantinit bileşimi, doğa dostu üretim veya belirli ocak uydurma.

### stones.travertine — Traverten seçimi

Sözlük: `/catalogs/STONES/travertine`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Gözenekli taş görünüşü, boşluğun malzemenin içinde de okunabildiğini düşündürür.

**İlişki sorusu:** Gözün oyuk beklentisiyle elin temas beklentisini ayır.

**Sınır:** Gerçek gözeneklerin açık, dolgulu veya cilalı olduğu; hijyen ve Roma kökeni bilinmiyor.

### stones.terrazzo — Terrazzo seçimi

Sözlük: `/catalogs/STONES/terrazzo`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Küçük taneler ile onları bir arada tutan zemin, parçalı ve sürekli okumayı birlikte sunar.

**İlişki sorusu:** Bakışın ayrıntıdan bütüne gidip gelişini dene.

**Sınır:** Agrega, epoksi/çimento bağlayıcı ve geri dönüşüm oranı kodda yok.

### stones.concrete — Beton seçimi

Sözlük: `/catalogs/STONES/concrete`. Kaynak: M09, M15, M16; ORTAK-STONES.

**Anlam:** Tek yüzey görünüşünün arkasında agrega ve bağlayıcıdan oluşan bir yapı fikri vardır.

**İlişki sorusu:** Bir kütlenin çevresindeki küçük hareketlerle ilişkisini araştır.

**Sınır:** Gerçek döküm, donatı, kalıp izi, basınç dayanımı veya çatlama öngörüsü yok.

### metals.brass — Pirinç metal bitişi

Sözlük: `/catalogs/METALS/brass`. Kaynak: M04, M17; ORTAK-METALS.

**Anlam:** Sarı metal görünüşü, küçük bir bağlantının ışıkla fark edilmesini sağlayabilecek bir ayrıntıdır.

**İlişki sorusu:** Taşıyıcı olmayan küçük parçada elin yer bulmasını düşün.

**Sınır:** Masif pirinç, alaşım oranı, antibakteriyellik veya altın kaplama deme.

### metals.bronze — Bronz metal bitişi

Sözlük: `/catalogs/METALS/bronze`. Kaynak: M04, M17; ORTAK-METALS.

**Anlam:** Koyu metal tonu, parlak nokta ile geniş yüzeyin dikkat farkını açabilir.

**İlişki sorusu:** Yakınlaşınca görülen kenarla uzaktan görülen gölgeyi karşılaştır.

**Sınır:** Gerçek bronz döküm, eski patina veya yıllar içinde kesin renk değişimi yok.

### metals.black — Siyah metal bitişi

Sözlük: `/catalogs/METALS/black`. Kaynak: M04, M17; ORTAK-METALS.

**Anlam:** Koyu taşıyıcı çizgi siluetin okunmasını etkileyebilir.

**İlişki sorusu:** Ayağın zemine değdiği noktayı kütlenin bütünüyle ilişkilendir.

**Sınır:** Demir/çelik altlık, elektrostatik boya veya paslanmazlık kanıtlanmadı.

### metals.chrome — Krom bitişi

Sözlük: `/catalogs/METALS/chrome`. Kaynak: M04, M17; ORTAK-METALS.

**Anlam:** Parlak metal görünüşü çevrenin parçalarını yüzeye taşıyabilir.

**İlişki sorusu:** Bir nesnenin yalnız kendi renginden oluşmadığına dikkat ver.

**Sınır:** Masif krom, ayna düzeyi parlaklık, kaplama kalınlığı ve korozyon sınıfı yok.

### metals.nickel — Nikel bitişi

Sözlük: `/catalogs/METALS/nickel`. Kaynak: M04, M17; ORTAK-METALS.

**Anlam:** Daha yumuşak metal parıltısı bir görsel hedef olabilir; numune ölçülmedi.

**İlişki sorusu:** Kulp çevresindeki ışık ile el hareketinin zamanını birlikte düşün.

**Sınır:** Saf nikel, fırçalanmış işlem, hipoalerjenik veya bakım istemez deme.

### glass.clear — Şeffaf cam

Sözlük: `/catalogs/GLASS/clear`. Kaynak: M08, M13; ORTAK-GLASS.

**Anlam:** Bakışın yüzeyin ardına devam etmesi, eşyanın çevresinin de algıya katılmasını mümkün kılar.

**İlişki sorusu:** Tabla ile aşağısında görünen ayak arasındaki ilişkiyi incele.

**Sınır:** Temper, kalınlık ve gerçek ışık geçirgenliği burada kanıtlanmaz.

### glass.extra — Ekstra berrak cam seçimi

Sözlük: `/catalogs/GLASS/extra`. Kaynak: M08, M13; ORTAK-GLASS.

**Anlam:** Katalogda daha az renkli görünüş hedeflenir; kimyasal bileşim belirtilmez.

**İlişki sorusu:** Kenarın varlığı ile bakışın devamı arasındaki gerilimi düşün.

**Sınır:** Düşük demir sertifikası, sıfır renk veya cam yokmuş etkisi garanti değil.

### glass.smoked — Füme cam

Sözlük: `/catalogs/GLASS/smoked`. Kaynak: M08, M13; ORTAK-GLASS.

**Anlam:** Koyulaşan görünüş bakışı bütünüyle kapatmadan onun açıklığını değiştirebilir.

**İlişki sorusu:** Arkasındaki eşyanın hemen mi, yaklaşınca mı seçileceğini soru yap.

**Sınır:** Tam mahremiyet, UV koruması ve belirli geçirgenlik yüzdesi yok.

### glass.bronze — Bronz tonlu cam

Sözlük: `/catalogs/GLASS/bronze`. Kaynak: M08, M13; ORTAK-GLASS.

**Anlam:** Renkli saydamlık çevredekinin görünüşüne camın tonunu da katar.

**İlişki sorusu:** Görmek ile doğrudan görmek arasındaki küçük farkı ele al.

**Sınır:** Metal bronz, yansıtıcı ayna veya güneş kontrol camı demek değildir.

### glass.frosted — Buzlu cam

Sözlük: `/catalogs/GLASS/frosted`. Kaynak: M08, M13; ORTAK-GLASS.

**Anlam:** Net görüntü yerine ışık ve biçim izinin kalması, görünürlük ile örtülme arasında alan açar.

**İlişki sorusu:** Gizlemenin tam kapalılık olmadan nasıl düşünülebileceğini sor.

**Sınır:** Kumlama/asitleme yöntemi, mutlak mahremiyet ve güvenlik sınıfı yok.

### fibers.linen — Keten

Sözlük: `/catalogs/FIBERS/linen`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Lif adı bir bileşim başlangıcıdır; kıvrım ve dokunma dokuma ve bitişle değişir.

**İlişki sorusu:** Oturulan yüzeyin bakıştan farklı, yakından okunan bir ölçeği olduğunu düşün.

**Sınır:** Yüzde yüz keten, Avrupa keteni, keten kokusu veya serin tutma garantisi yok.

### fibers.cotton — Pamuk

Sözlük: `/catalogs/FIBERS/cotton`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** İplik ve yapı bilinmeden pamuk adından tek bir yumuşaklık çıkmaz.

**İlişki sorusu:** Gündelik el temasının aşinalığına dikkat ver, konforu kullanıcı adına kesinleme.

**Sınır:** Organik sertifika, alerjisizlik, saflık veya lekesizlik verisi yok.

### fibers.wool — Yün

Sözlük: `/catalogs/FIBERS/wool`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Lifin kıvrımı ve iplikte tuttuğu hava hacim fikrini açar; bitmiş kumaş reçetesi değil.

**İlişki sorusu:** Yüzeye yaklaşınca fark edilen derinlikle uzaktan görülen biçimi ilişkilendir.

**Sınır:** Merino, Woolmark, kaşıntısızlık veya oda sıcaklığını düzenleme iddiası yok.

### fibers.velvet — Kadife

Sözlük: `/catalogs/FIBERS/velvet`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Havlı yüzey görünüşü bakış yönüne bağlı ton farkını araştırmaya açar; gerçek hav bilinmiyor.

**İlişki sorusu:** Elin geçişi ile gözün yön değiştirmesinin iki ayrı okuma oluşunu düşün.

**Sınır:** İpek, pamuk veya polyester bileşimi; saray kökeni ve aşınma puanı çıkarma.

### fibers.boucle — Bukle

Sözlük: `/catalogs/FIBERS/boucle`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** İlmekli/iplikli yüzey adı, küçük düzensizliklerle büyük biçimin birlikte algılanmasını önerir.

**İlişki sorusu:** Parmak ucunun beklediği ayrıntı ile oturma bütününü ayır.

**Sınır:** Yün bileşimi, el dokuması, sabit ilmek ölçüsü veya takılmazlık yok.

### fibers.chenille — Şönil

Sözlük: `/catalogs/FIBERS/chenille`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Yüzeyli iplik görünüşü, çizgiden çok küçük bir hacim olarak okunabilir.

**İlişki sorusu:** Bir minderin yakınlık hissini sıfat yerine yüzey ölçeğiyle sorgula.

**Sınır:** Pamuk/ipek oranı, gerçek iplik reçetesi ve tüy dökmezlik doğrulanmadı.

### fibers.leather — Deri

Sözlük: `/catalogs/FIBERS/leather`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Yüzey ve kullanım izi arasındaki ilişki tabaklama ve kaplamaya bağlıdır.

**İlişki sorusu:** Yeni eşyanın henüz edinmediği izlere yer bırakmayı düşün.

**Sınır:** Tam sırça, anilin, hayvan türü, etik köken ve güzel patina garantisi yok.

### fibers.suede — Süet seçimi

Sözlük: `/catalogs/FIBERS/suede`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** Havlı deri görünüşü sert sınır yerine yönlü bir yüzey beklentisi açar.

**İlişki sorusu:** Elin durup yeniden geçtiği bir temasın görsel karşılığını araştır.

**Sınır:** Hayvan, deri katmanı, boyama reçetesi, suya direnç veya mutlak yumuşaklık yok.

### fibers.nubuck — Nubuk seçimi

Sözlük: `/catalogs/FIBERS/nubuck`. Kaynak: M05, M07, M12, M14; ORTAK-FIBERS.

**Anlam:** İnce havlı görünüş, rengi tek sabit leke gibi okumayı zorlaştırabilir.

**İlişki sorusu:** Yakınlaşmanın yüzeye başka bilgi katmasını düşün.

**Sınır:** Gerçek zımparalama işlemi, sırça kalitesi, hayvan ve leke direnci koddan çıkmaz.

### weaves.plain — Bezayağı

Sözlük: `/families/seating/materialSlots/fabric/weave` → `plain`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Düzenli kesişme, görsel bir eşik veya tekrar fikri verir; iplik kalınlığı ayrıca gerekir.

**İlişki sorusu:** Yüzeydeki küçük düzenin beden ölçeğinde geri çekilmesini düşün.

**Sınır:** Sıkılık, pürüzlülük ve dayanım örgü adından hesaplanamaz.

### weaves.twill22 — 2/2 dimi

Sözlük: `/families/seating/materialSlots/fabric/weave` → `twill22`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Çapraz yön, aynı yüzeye bakışın bir doğrultu edinmesini düşündürür.

**İlişki sorusu:** Elin yatay hareketiyle görünen çapraz yön arasındaki farkı araştır.

**Sınır:** Gerçek çözgü/atkı reçetesi ve aşınma direnci doğrulanmadı.

### weaves.twill31 — 3/1 dimi

Sözlük: `/families/seating/materialSlots/fabric/weave` → `twill31`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Asimetrik kesişme adı yüz ile tersin farklılığı için başlangıçtır.

**İlişki sorusu:** Görülen tarafın arka yüzün bütün bilgisini vermediğini düşün.

**Sınır:** Kot kumaş, pamuk bileşimi veya belirli parlaklık varsayma.

### weaves.satin — Saten dokuma

Sözlük: `/families/seating/materialSlots/fabric/weave` → `satin`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Uzun yüzey geçişleri ışık okumasına konu olabilir; motor kodu gerçek tezgâh raporu değildir.

**İlişki sorusu:** Bakış açısıyla beliren bir yüzey ayrıntısını araştır.

**Sınır:** İpek, kayganlık derecesi, parlaklık ölçümü ve takılma direnci bilinmiyor.

### weaves.basket — Sepet dokuma

Sözlük: `/families/seating/materialSlots/fabric/weave` → `basket`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Gruplu kesişme küçük birimlerin beraber hareket eden görsel bloklarını düşündürür.

**İlişki sorusu:** Tek iplik yerine tekrar biriminin fark edilmesine odaklan.

**Sınır:** Gerçek bitkisel hasır veya iri gözenek olduğuna hükmetme.

### weaves.herringbone — Balıksırtı

Sözlük: `/families/seating/materialSlots/fabric/weave` → `herringbone`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Yönün dönüşmesi, kesintisiz bir yüzey içinde farklı doğrultular kurar.

**İlişki sorusu:** Gözün dönüş noktalarına takılıp yeniden ilerlemesini düşün.

**Sınır:** Balık kılçığı motifi ile dokuma yapısını karıştırma; yün veya İskoç kökeni çıkarma.

### weaves.diamond — Elmas dokuma

Sözlük: `/families/seating/materialSlots/fabric/weave` → `diamond`. Kaynak: M07, M10, M12; ORTAK-WEAVES.

**Anlam:** Kapalı yön tekrarları, çizginin başlayıp döndüğü küçük alanlar önerir.

**İlişki sorusu:** Büyük minderin içinde daha küçük bir ölçünün görünmesini araştır.

**Sınır:** Gerçek iplik düzeni, jakar tezgâhı veya kabartma miktarı kanıtı yok.

### surfaces.wood — Ahşap yüzey

Sözlük: `/families/table/materialSlots/top/surface` → `wood`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Yüzeyin damarını okumakla tüm kesiti bilmek farklıdır.

**İlişki sorusu:** Bir malzemenin temas edilen kısmı ile taşıyıcı bütünü arasındaki farkı düşün.

**Sınır:** Bu seçim her ailede masif tahta kanıtı değildir; board ve parça yapısı gerekir.

### surfaces.veneer — Kaplama yüzey

Sözlük: `/families/table/materialSlots/top/surface` → `veneer`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Görülen ince ahşap katman ile onu taşıyan altlık ayrı bilgi katmanıdır.

**İlişki sorusu:** Yüzey dürüstlüğünü kalınlık gösterisi yerine doğru adlandırmayla kur.

**Sınır:** MDF/kontrplak altlık, kaplama kalınlığı veya masiflik varsayma.

### surfaces.lacquer — Lake yüzey

Sözlük: `/families/table/materialSlots/top/surface` → `lacquer`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Renk ve bitiş arayüzü, taşıyıcı malzemeyi görünüşten ayırır.

**İlişki sorusu:** Bir kenara yaklaşmanın yüzey hakkında neyi söyleyip neyi söylemediğini düşün.

**Sınır:** Altlık, kat sayısı, urushi, el cilası ve çizilmezlik bilinmiyor.

### surfaces.stone — Taş yüzey

Sözlük: `/families/table/materialSlots/top/surface` → `stone`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Görünür yüzeyin akışı, kenar ve taşıyıcıyla birlikte okunur.

**İlişki sorusu:** Üst yüzey ile altındaki açıklığın karşılaşmasını konu et.

**Sınır:** Gerçek levha ağırlığı, taş türü ve ocak için stone alt anahtarı ve ürün verisi gerekir.

### surfaces.glass — Cam yüzey

Sözlük: `/families/table/materialSlots/top/surface` → `glass`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Tabla sınırı ile altındaki görüntü aynı anda algılanabilir.

**İlişki sorusu:** Bir eşyanın ötekini örtmeden yanında bulunmasını araştır.

**Sınır:** Her cam saydam değildir; etkin glass anahtarı seçilmeden berraklık iddia etme.

### surfaces.metal — Metal yüzey

Sözlük: `/families/table/materialSlots/base/surface` → `metal`. Kaynak: M01, M03, M04, M08, M09, M11; ORTAK-SURFACES.

**Anlam:** Görsel süreklilik ve ışık noktaları malzemenin yüzeyde nasıl yer aldığını düşündürür.

**İlişki sorusu:** İnce çizgi ile taşıma beklentisi arasındaki ilişkiyi sor.

**Sınır:** Altlık alaşımı, kalınlık, kaynak veya yük kapasitesi surface kodundan çıkmaz.

### special.cane — Hasır benzeri malzeme kavramı

Sözlük: `/families/storage/enums/frontStyle` → `cane`. Kaynak: M06, M08; ORTAK-SPECIAL.

**Anlam:** Şerit ve aralık birlikteliği, tam kapalılıktan başka bir yüzey okuması açar.

**İlişki sorusu:** Gizlemek ile göstermenin aynı cephedeki payını düşün.

**Sınır:** frontStyle veya headType seçimi doğal rattan, bambu veya oturum taşıma kapasitesi kanıtı değil.

### special.mirror — Ayna malzeme kavramı

Sözlük: `/families/bath/kinds/mirror`. Kaynak: M06, M08; ORTAK-SPECIAL.

**Anlam:** Karşıdaki şeyin görüntüsünü yüzeye katmak, nesnenin kendi sınırını çevresiyle ilişkilendirir.

**İlişki sorusu:** Bakışın nesneden dönüp bulunduğu yere yeniden gelmesini ele al.

**Sınır:** Odayı iki kat büyütme, buğu önleme, ışık donanımı ve ayna kaplama türü verilmedi.
