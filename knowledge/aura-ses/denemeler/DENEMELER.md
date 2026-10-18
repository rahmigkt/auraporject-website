# On tasarım, otuz deneme

Kurucu yaklaşım karar sahibince 2026-10-18 tarihinde **yalnız bu denemelere temel olarak** onaylandı.
30 taslağın tamamı tek tek yazıldı; dış API, şablonla cümle birleştirme veya otomatik varyasyon kullanılmadı.
20 TR + 10 EN. İngilizce üçüncü metinler aynı tasarım hakkında bağımsız denemelerdir; ilk metnin birebir
çevirileri değildir. Kartlar nihai metnin kalıbı değil, düşünme zemini olarak kullanıldı.

[Tam tasarımlar](tasarimlar.json) / [makine okunur metinler ve dayanak kayıtları](metinler.jsonl).
Tasarımlar main cedd083 motorundan sabit seed ve kayıtlı seçimlerle örneklendi; müşteriye ait veri yok.
Altı aile ve on stil temsil edilir; 10 örnek bütün türlerin temsili veya istatistiksel sınav değildir.
Stil kimlikleri tarihsel köken veya özgül tarz sesi onayı değildir; tarz sesi belgeleri PR 2'de hazırlanacak.
Geometri derleyicisinin hata vermemesi gerçek üretim, dayanım veya ergonomi sertifikası sayılmaz.

Her tasarımın altındaki dayanak tablosu üç taslağın somut iddia sözlüğüdür. Bir taslak bu sözlüğün alt
kümesini kullanabilir. Sahneler açıkça düşünme/hayal çağrısıdır; olmuş olay veya kullanıcı bilgisi değildir.
Adlar editoryal öneridir; marka tescili kontrol edilmiş değildir. Tüm metinler **denetim bekliyor**;
ikinci model onayı, karar sahibinin kör seçimi, altın küme ve eğitim koşusu yapılmadı.
Görsel modeldeki yüzey eğilimleri gerçek numunede ölçülmüş duyusal özellik gibi sunulmadı.

## M01 — seating / armchair / aura

Seed: 101. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| tekli koltuk / armchair | `/kind` | `"armchair"` |
| ahşap kollar / wooden arms | `/params/armType` | `"wood"` |
| keten döşeme / linen upholstery | `/materials/fabric/fiber` | `"linen"` |
| dişbudak / ash | `/materials/wood/species` | `"ash"` |
| doğal ton | `/materials/wood/stain` | `"natural"` |
| mat bitiş | `/materials/wood/finish` | `"matte"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"seating"`
- `/kind` = `"armchair"`
- `/params/armType` = `"wood"`
- `/params/baseType` = `"frame"`

### M01-1 — Elin Dönüşü (tr)

Bir konuşma uzadığında el bazen oturulacak yerden önce bir dayanak arar. Burada keten döşemenin iki yanında dişbudak kollar var. Yaklaşırken birine dokunup henüz oturmamayı düşünelim; bedenin kararıyla konuşmanın akışı aynı anda tamamlanmak zorunda değil. Koltuk, böyle bir aralıkta yalnız beklenen yer olabilir. Tek kişilik oluşu da yalnızlık buyurmaz. Bir başkasını dinlemek, karşılık vermek veya biraz durmak: aynı eşyanın çevresinde birbirine benzemeyen yakınlıklar kurulabilir. Elin kaldığı yer bu karşılaşmalardan yalnız birinin başlangıcıdır.

**İz:** Ahşap kollar, keten seçilmiş döşemenin iki yanında yer alır.

**Kartlar:** fibers.linen, woods.ash, finishes.matte. **Kurucu ilkeler:** K01, K02, K05.

### M01-2 — Yakın Ölçek (tr)

Uzaktan bir koltuk, yaklaşınca iki ahşap kol ve aralarında keten bir yüzey. Bakışın ölçeği yürüdükçe değişebilir. Dişbudakta doğal ton ve mat bitiş, bu karşılaşmanın somut ayrıntıları. Onları fark etmek için bütün odayı yeniden okumak gerekmiyor; geçerken durmak da yeterli olabilir. Bir eşyanın tanınması her zaman bir anda olmaz. Önce bir kenar, başka bir gün bir yüzey, sonra düşünmeden yöneldiğimiz bir yer. Yakınlık, nesnenin kendini anlatmasından çok ona tekrar dönmenin içinde kurulabilir.

**İz:** Dişbudak ahşap için doğal ton ve mat bitiş seçilmiştir.

**Kartlar:** woods.ash, stains.natural, finishes.matte, fibers.linen. **Kurucu ilkeler:** K05, K06, K09.

### M01-3 — Before Sitting (en)

A conversation can reach a chair before anyone sits down. Wooden arms sit beside the linen upholstery, offering a place for the eye to pause while someone is still listening. Imagine a hand finding one arm and staying there for a moment. Sitting can wait; the conversation can continue. The ash belongs to the object, but the meaning of that small gesture belongs to the person. An armchair may become familiar through just such unfinished decisions, repeated without becoming quite the same.

**İz:** The design combines wooden arms with linen upholstery.

**Kartlar:** woods.ash, fibers.linen. **Kurucu ilkeler:** K01, K02, K06.
## M02 — seating / sofa / art_deco

Seed: 102. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| kanepe / sofa | `/kind` | `"sofa"` |
| kanal sırt / channel back | `/params/backType` | `"channel"` |
| beş kanal / five channels | `/params/channelCount` | `5` |
| tek parça oturum / bench seat | `/params/seatType` | `"bench"` |
| kadife / velvet | `/materials/fabric/fiber` | `"velvet"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"seating"`
- `/kind` = `"sofa"`
- `/params/backType` = `"channel"`
- `/params/seatType` = `"bench"`

### M02-1 — Beş Aralık (tr)

Beş kanal sırtın boyunca yan yana duruyor; oturum ise kesintisiz bir yüzey. Aynı kanepede bölünmek ve birlikte sürmek için iki ayrı çizgi var. Kadife döşemenin önünde bir konuşmayı düşünelim: herkes aynı yöne bakmak, aynı anda karşılık vermek zorunda değil. Birinin gözü sırttaki aralıklarda oyalanırken öteki sözünü tamamlayabilir. Eşyanın ilişkideki payı, konuşmanın konusu olmak kadar büyük olmayabilir. Bazen yan yana bulunmanın farklı hızlarına yer açan bir sınır olarak kalması yeterlidir.

**İz:** Kanal sırt seçeneğinde beş kanal bulunur.

**Kartlar:** fibers.velvet, weaves.plain. **Kurucu ilkeler:** K01, K04, K09.

### M02-2 — Yan Yana (tr)

Yan yana oturmak, aynı şeyi yaşamak demek değil. Tek parça oturum bu kanepede birlikte uzanıyor; beş kanallı sırt başka bir ritim tutuyor. Kadife yüzeyin önünde biri konuşmaya hazırlanırken bir başkası dinlemeyi seçebilir. Böyle bir anı düşününce nesnenin yeri de değişiyor: herkesin duygusunu birleştiren bir merkez olmaktan çıkıp farklı hâllerin yanında durabiliyor. Aradaki mesafenin ne olacağını eşya tek başına belirlemez. Fakat aynı yüzeyin birden fazla insana ayrı ayrı yer olabilmesi, beraberliğe dair küçük bir soru bırakır.

**İz:** Tek parça oturum, beş kanallı sırtla birlikte düzenlenmiştir.

**Kartlar:** fibers.velvet. **Kurucu ilkeler:** K01, K02, K08.

### M02-3 — A Longer Glance (en)

Five channels divide the back; a continuous bench seat carries another rhythm below. The velvet sofa can be approached through either line. Imagine two people arriving at a pause in their conversation. One follows a division in the back, while the other is still looking across the room. Being together does not require their attention to settle in the same place. A shared seat can hold that difference without explaining it, leaving the next word to arrive from either side.

**İz:** A continuous bench seat sits beneath a five-channel back.

**Kartlar:** fibers.velvet, weaves.plain. **Kurucu ilkeler:** K01, K04, K09.
## M03 — table / dining / japandi

Seed: 103. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| yemek masası / dining table | `/kind` | `"dining"` |
| oval tabla | `/params/topShape` | `"oval"` |
| ahşap tabla | `/materials/top/surface` | `"wood"` |
| meşe tabla / oak top | `/materials/top/species` | `"oak"` |
| yağ bitişi / oil finish | `/materials/top/finish` | `"oil"` |
| yuvarlak ayaklar | `/params/legType` | `"round"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"table"`
- `/kind` = `"dining"`
- `/materials/top/surface` = `"wood"`
- `/params/baseType` = `"legsOnly"`

### M03-1 — Dönen Bakış (tr)

Masaya yaklaşırken görülen kenar, çevresinde yürüdükçe başka bir çizgiye dönüşebilir. Oval meşe tabla, tek bir cepheye bağlı kalmadan böyle okunmaya açık. Yağ bitişiyle birlikte, yemeğin henüz başlamadığı bir anı düşünelim: biri elindekini nereye bırakacağına karar veriyor, başka biri yerini arıyor. Ortak bir masa, bu küçük hareketler birbirine değdikçe kurulabilir. Üstündeki şeyler kadar çevresinde kalan insanlar da ona anlam verecek. Daha kimse oturmadan, bir araya gelmenin ilk kararı belki kenarında başlamıştır.

**İz:** Oval tablada meşe ve yağ bitişi seçilmiştir.

**Kartlar:** surfaces.wood, woods.oak, finishes.oil. **Kurucu ilkeler:** K01, K02, K08.

### M03-2 — Ortaya Bırakılan (tr)

Ortaya bir kap bırakıldığında masanın merkezi de bir an için orası olabilir. Oval meşe tabla, bu ortak noktaya farklı yönlerden yaklaşmayı düşündürüyor. Aşağıda yuvarlak ayaklar, yukarıda yağ bitişli yüzey; aralarında ise henüz kimin nasıl yerleşeceği belli olmayan bir kullanım ihtimali var. Her şeyin baştan düzenlenmesi gerekmeyebilir. Bir sandalye çekilir, bir şey el değiştirir, yer açılır. Masa, birlikte olmanın resmini tamamlamak yerine her defasında yeniden kurulacak bu küçük düzenin yanında durabilir.

**İz:** Oval tabla, yuvarlak ayaklarla birlikte seçilmiştir.

**Kartlar:** woods.oak, finishes.oil, surfaces.wood. **Kurucu ilkeler:** K01, K06, K08.

### M03-3 — Around the Edge (en)

Before a meal begins, the edge of a table already has work to do. Someone walks around it, carrying something that has not yet found its place. The oval oak top can be followed from more than one direction; its oil finish belongs to a surface still awaiting ordinary use. Imagine the bowl being set down and another person drawing near. A shared centre need not be declared in advance. It can begin with these small adjustments around the same boundary.

**İz:** The dining table has an oval oak top with an oil finish.

**Kartlar:** woods.oak, finishes.oil, surfaces.wood. **Kurucu ilkeler:** K01, K02, K08.
## M04 — table / coffee / industrial

Seed: 104. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| sehpa / coffee table | `/kind` | `"coffee"` |
| dikdörtgen / rectangular | `/params/topShape` | `"rect"` |
| cam tabla / glass top | `/materials/top/surface` | `"glass"` |
| füme cam / smoked glass | `/materials/top/glass` | `"smoked"` |
| metal altlık / metal base | `/materials/base/surface` | `"metal"` |
| siyah bitiş / black finish | `/materials/base/metal` | `"black"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"table"`
- `/kind` = `"coffee"`
- `/materials/top/surface` = `"glass"`
- `/materials/base/surface` = `"metal"`
- `/params/baseType` = `"sled"`

### M04-1 — Aradan Görünen (tr)

Bir kitabı bırakmak için eğildiğimiz anı düşünelim. Füme cam tabla ile siyah metal altlık aynı bakışın içinde, biri yüzey, öteki çizgi olarak yer bulabilir. Sehpanın dikdörtgen sınırı orada dururken dikkat yalnız üstte kalmak zorunda değil. Henüz elden bırakılmamış şey ile aşağıda görülebilecek olan arasında kısa bir tereddüt var. Eşyanın çevresiyle ilişkisi bazen böyle küçük bir hareketin içinde açılır: bakış bir sınırdan geçer, sonra kitabın bırakılacağı yere geri döner.

**İz:** Dikdörtgen füme cam tabla, siyah metal altlıkla eşleşir.

**Kartlar:** glass.smoked, surfaces.glass, metals.black. **Kurucu ilkeler:** K01, K03, K04.

### M04-2 — Bırakmadan Önce (tr)

Bir yüzeye bakmakla onun ardına bakmak aynı şey değil. Bu sehpanın füme camı iki hareketi bir arada düşünmeye çağırıyor; siyah metal altlık, bakışın izleyebileceği başka bir çizgi veriyor. Yanına yaklaşan birinin önce aşağıyı fark ettiğini hayal edelim. Sonra elindeki nesneye yer aradığında dikdörtgen tabla yeniden öne gelir. Bir eşyanın fark edilmesi tek bakışta bitmeyebilir. Bırakmak, almak, yeniden eğilmek: günlük hareketler onun hangi tarafını gördüğümüzü her defasında biraz değiştirebilir.

**İz:** Tabla malzemesi füme cam olarak seçilmiştir.

**Kartlar:** glass.smoked, surfaces.glass, metals.black. **Kurucu ilkeler:** K04, K06, K08.

### M04-3 — Through and Along (en)

There is a moment before a book reaches a table when the hand is still carrying and the eye is already choosing. Here, a rectangular smoked-glass top meets a black metal base. Imagine the glance travelling beneath the surface before returning to the place where the book will rest. The table can enter the room through that brief movement, rather than through a claim to transform it. Looking through and looking along remain different ways of arriving at the same object.

**İz:** A smoked-glass top is paired with a black metal base.

**Kartlar:** glass.smoked, metals.black, surfaces.metal. **Kurucu ilkeler:** K01, K03, K04.
## M05 — storage / sideboard / mid_century_modern

Seed: 105. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| büfe / sideboard | `/kind` | `"sideboard"` |
| kaplama gövde / veneer case | `/materials/case/surface` | `"veneer"` |
| ceviz / walnut | `/materials/case/species` | `"walnut"` |
| hasır benzeri cephe / cane-style front | `/params/frontStyle` | `"cane"` |
| düğme kulp / knob pulls | `/params/pull` | `"knob"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"storage"`
- `/kind` = `"sideboard"`
- `/materials/case/surface` = `"veneer"`
- `/params/frontStyle` = `"cane"`

### M05-1 — Örtünün Payı (tr)

Bir kapağın ardındaki şeyler bize ait oldukça, ona yaklaşmanın yolu da tanıdıklaşabilir. Bu büfede ceviz kaplama gövde, hasır görünümlü cephe ve düğme kulp, o yolun ayrı ayrıntıları. Bir şey almak üzere durmayı düşünelim: göz yüzeyde kalırken el aradığı noktaya yönelebilir. İçeridekinin adını baştan koymak gerekmiyor. Başka bir evde başka şey saklanacak, başka bir el aynı yere uzanacak. Kapalı duran nesne, kendisi değişmeden bu farklı ilişkilerin her birinde yeniden yer bulabilir.

**İz:** Ceviz kaplama gövdede hasır benzeri cephe ve düğme kulp seçilmiştir.

**Kartlar:** surfaces.veneer, woods.walnut, special.cane. **Kurucu ilkeler:** K01, K06, K08.

### M05-2 — Açılacak Yer (tr)

Saklamak, bir şeyi bütünüyle unutmak demek olmayabilir. Bazen yalnız gözün önünden çekilir, gerektiğinde yeniden yaklaşılacak bir yerde kalır. Ceviz kaplama gövdeyle hasır görünümlü cephe bu büfede yan yana; düğme kulp, kapalı yüzeyden sonraki hareketi düşündürüyor. Bir eşyayı yerine geri koyduğumuzu hayal edelim. O yerin anlamı kapasitesinden başka bir şey de olabilir: aradığımızda döneceğimizi bildiğimiz bir nokta. Nesnenin evdeki payı böylece sergilediklerinden çok, yanında sürdürülen bu küçük alışkanlıklarla kurulabilir.

**İz:** Gövde yüzeyi ceviz kaplamadır; cephede cane seçeneği vardır.

**Kartlar:** surfaces.veneer, woods.walnut, special.cane. **Kurucu ilkeler:** K02, K06, K07.

### M05-3 — At the Handle (en)

A closed sideboard can become part of a familiar route: approach, reach, open, return. Here, knob pulls meet cane-style fronts and a walnut-veneer case. Imagine putting something back without needing to look for its place. Such familiarity would belong to the person using it, not to a past supplied with the object. The front can keep its own visible arrangement while the belongings behind it change. What is stored and what is remembered need not remain identical for the route to continue.

**İz:** The case is specified as walnut veneer with cane-style fronts.

**Kartlar:** surfaces.veneer, woods.walnut, special.cane. **Kurucu ilkeler:** K01, K06, K08.
## M06 — storage / bookcase / brutalism

Seed: 106. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| kitaplık / bookcase | `/kind` | `"bookcase"` |
| arka panel yok / no back panel | `/params/backPanel` | `"off"` |
| açık bölmeler / open compartments | `/params/bays/0/cells/1/type` | `"open"` |
| ebonize görünüş / ebonized appearance | `/materials/case/species` | `"ebonized"` |
| siyah gövde / black case | `/materials/case/stain` | `"black"` |
| mat bitiş / matte finish | `/materials/case/finish` | `"matte"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"storage"`
- `/kind` = `"bookcase"`
- `/materials/case/surface` = `"wood"`
- `/params/backPanel` = `"off"`
- `/params/bays/0/cells/1/type` = `"open"`

### M06-1 — Arkası Açık (tr)

Bir kitaplığın açıklığı yalnız henüz doldurulmamış yer değildir. Bu arka panelsiz düzende açık bölmeler, bakışı arkada ne bulunabileceğine de yöneltebilir. Mat siyah ve ebonize görünüşlü gövde, o açıklığın yanında koyu bir sınır kuruyor. Bir kitabı geri koymadan önce durmayı düşünelim. Düzen bir an için tamamlanmış görünmek yerine yeniden karar verilecek bir şey olur. Nesnenin içinde yer bulanlar değişirken, aynı açıklık her defasında başka bir ilişkiyi çevreleyebilir. Boş kalan yer de bu ilişkinin dışında değildir.

**İz:** Kitaplık arka panelsiz düzenlenmiştir.

**Kartlar:** woods.ebonized, stains.black, finishes.matte. **Kurucu ilkeler:** K03, K06, K08.

### M06-2 — Sıralanmadan (tr)

Rafa geri dönen bir kitap için her zaman eski yerini seçmek zorunda değiliz. Açık bölmeli, arka panelsiz bu kitaplık böyle bir kararı düşünmeye açılıyor. Gövdenin mat siyah, ebonize görünüşü açıklıklarla birlikte okunabilir; fakat henüz sıralanmış bir hayatın resmini vermiyor. Elimizdeki kitabı başka bir yere koymayı hayal edelim. Küçük bir değişiklik, bildiğimiz düzeni yeniden fark etmemize yetebilir. Nesne, düzeni bir kere kurup bitirmekten çok, onunla tekrar tekrar karşılaşacağımız bir yer olarak kalabilir.

**İz:** Mat siyah gövde seçimi açık bölmelerle birlikte bulunur.

**Kartlar:** woods.ebonized, stains.black, finishes.matte. **Kurucu ilkeler:** K01, K03, K09.

### M06-3 — Room Behind (en)

Returning a book can be a small act of rearrangement. This bookcase has open compartments and no back panel; its matte black, ebonized case gives the openings a dark boundary. Imagine pausing before choosing a different place for something familiar. The arrangement need not be finished for the object to belong in a day. An empty interval can remain among the books, carrying no instruction to be filled. What stays and what moves may continue to change around that interval.

**İz:** The bookcase combines open compartments with no back panel.

**Kartlar:** woods.ebonized, stains.black, finishes.matte. **Kurucu ilkeler:** K01, K03, K08.
## M07 — kitchen / island / bauhaus

Seed: 107. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| mutfak adası / kitchen island | `/kind` | `"island"` |
| taş sınıfında tezgâh | `/materials/top/surface` | `"stone"` |
| terrazzo | `/materials/top/stone` | `"terrazzo"` |
| lake cephe / lacquer fronts | `/materials/front/surface` | `"lacquer"` |
| düz cephe / flat fronts | `/params/frontStyle` | `"flat"` |
| çizgi kulp / bar pulls | `/params/pull` | `"bar"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"kitchen"`
- `/kind` = `"island"`
- `/materials/top/surface` = `"stone"`
- `/materials/front/surface` = `"lacquer"`

### M07-1 — Küçük Bütünler (tr)

Hazırlık sırasında bir yüzeye iki türlü bakabiliriz: yakından küçük parçaları izleyerek, sonra yapılacak iş için daha geniş bir yer arayarak. Bu mutfak adasının terrazzo tezgâhı ve düz lake cepheleri böyle bir ölçek değişimini düşündürüyor. Çizgi kulpa uzanmadan önce kısa bir duruşu hayal edelim. İş henüz tamamlanmış değil, yüzeyin etrafındaki hareket de bitmemiş. Bir eşya bazen en çok bu arada fark edilir; kullanılırken geri çekilir, durduğumuzda yeniden bakışa katılır. Hazırlığın ritmi ikisine de yer verebilir.

**İz:** Terrazzo tezgâh, düz lake cephelerle birlikte seçilmiştir.

**Kartlar:** stones.terrazzo, surfaces.lacquer. **Kurucu ilkeler:** K01, K05, K06.

### M07-2 — Hazırlığın Arası (tr)

Bir şeyi bırakıp yeniden almak, mutfakta aynı yere farklı bir işle dönmek demek olabilir. Terrazzo tezgâhlı bu adada düz lake cephe ve çizgi kulp, üst yüzeye bakmaktan el uzatmaya geçiş için ayrı ayrıntılar veriyor. Yarım kalan bir hazırlığa döndüğümüzü düşünelim. Önce nerede durduğumuzu hatırlarız, sonra sıradaki hareket başlar. Nesnenin hayatın içinde edindiği yer yalnız bitmiş yemekle ölçülmeyebilir. Arada kalan, tekrar edilen ve çoğu zaman anlatılmayan bu dönüşler de onunla kurulan ilişkinin parçası olabilir.

**İz:** Cephelerde düz yüzey ve çizgi kulp seçimi bulunur.

**Kartlar:** stones.terrazzo, surfaces.lacquer. **Kurucu ilkeler:** K01, K02, K08.

### M07-3 — Between Tasks (en)

Preparation moves between attention and habit. A terrazzo worktop, flat lacquer fronts and bar pulls give this kitchen island different points at which either might begin. Imagine leaving a task unfinished, then returning to it. The eye finds the larger surface before a hand reaches for something below. The object has not changed in the interval, but the next movement gives it another place in the work. A shared day may gather around such returns without needing to make each one an occasion.

**İz:** The island pairs a terrazzo worktop with flat lacquer fronts.

**Kartlar:** stones.terrazzo, surfaces.lacquer. **Kurucu ilkeler:** K01, K02, K06.
## M08 — bath / basin / minimalism

Seed: 108. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| lavabo tasarımı / basin | `/kind` | `"basin"` |
| duvar tipi / wall-mounted | `/params/base` | `"wall"` |
| taş üst yüzey | `/materials/top/surface` | `"stone"` |
| Carrara seçimi | `/materials/top/stone` | `"carrara"` |
| dikdörtgen ayna / rectangular mirror | `/params/mirror` | `"rect"` |
| tek lavabo / single basin | `/params/basins` | `"single"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"bath"`
- `/kind` = `"basin"`
- `/materials/top/surface` = `"stone"`
- `/params/base` = `"wall"`
- `/params/mirror` = `"rect"`

### M08-1 — Önünde Durmak (tr)

Güne başlamadan önce bir yerde durmak, daha hiçbir şey yapmadan çevreyle karşılaşmak da olabilir. Bu duvar tipi düzende tek lavabo, Carrara desenli üst yüzey ve dikdörtgen ayna birlikte bulunuyor. Bakışın aynadan dönüp yeniden yüzeye gelmesini düşünelim. Aynı yerde kısa süre içinde birkaç ayrı yakınlık kurulabilir: görmek, yaklaşmak, sonra başka yere yönelmek. Nesne bu hareketlerin hiçbirini büyük bir olaya çevirmek zorunda değil. Gündelik hayatın geçerken uğradığı bir yer olarak da anlam edinebilir.

**İz:** Duvar tipi düzen, tek lavabo ve dikdörtgen aynayla seçilmiştir.

**Kartlar:** stones.carrara, special.mirror. **Kurucu ilkeler:** K01, K02, K10.

### M08-2 — Bakışın Geri Gelişi (tr)

Bir aynanın karşısında çevremizin bir kısmı bize geri gelir. Dikdörtgen aynayla Carrara desenli üst yüzey, bu banyo düzeninde böyle bir dönüşün iki ayrı sınırı. Duvara asılı gövde onların yanında yer alıyor. Bir işi bitirip gitmeden önce son kez bakmayı hayal edelim. O kısa an ne bütün günü anlatır ne de belirli bir duygu ister. Bazen eşyanın ilişkideki payı, geldiğimiz yerle gideceğimiz yer arasında bir duruşa eşlik etmektir. Geri kalanı hayatın kendisi sürdürür.

**İz:** Üst yüzeyde Carrara, aynada dikdörtgen biçim seçilmiştir.

**Kartlar:** stones.carrara, special.mirror. **Kurucu ilkeler:** K04, K06, K09.

### M08-3 — A Brief Return (en)

Before moving on, someone may stop for one more glance. A rectangular mirror, a Carrara-patterned top and a single basin belong to this wall-mounted arrangement. Imagine the eye returning from the mirror to the surface below. These are different directions of attention within one brief stay. The object need not prescribe what the person feels or what the day will become. It can acquire a place through being approached and left again, an ordinary point of return between other things.

**İz:** The wall-mounted design has a single basin and a rectangular mirror.

**Kartlar:** stones.carrara, special.mirror. **Kurucu ilkeler:** K01, K06, K10.
## M09 — bedroom / bed / wabi_sabi

Seed: 109. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| yatak / bed | `/kind` | `"bed"` |
| döşemeli başlık / upholstered headboard | `/params/headType` | `"upholstered"` |
| yuvarlatılmış başlık / rounded headboard | `/params/headShape` | `"rounded"` |
| yün / wool | `/materials/fabric/fiber` | `"wool"` |
| balıksırtı / herringbone | `/materials/fabric/weave` | `"herringbone"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"bedroom"`
- `/kind` = `"bed"`
- `/params/headType` = `"upholstered"`
- `/params/headShape` = `"rounded"`
- `/params/view` = `"piece"`

### M09-1 — Çizginin Döndüğü (tr)

Odanın içinden geçerken önce başlığın yuvarlatılmış çizgisi fark edilebilir; yanına gelince yün döşemenin balıksırtı yönü başka bir ölçek açar. Bir yatağa yaklaşmak, aynı nesneyi giderek daha küçük ayrıntılarla tanımak da olabilir. Başlığın yanında durduğumuz bir anı düşünelim. Günün nasıl geçtiğini söylemek zorunda değiliz. Yakından görülen düzen, uzaktan izlediğimiz sınırın içinde kalır. Nesneyle kurulacak yakınlık da belki bu iki bakış arasında, her dönüşte başka ayrıntının fark edilmesiyle yavaş yavaş yerini bulur.

**İz:** Yuvarlatılmış döşemeli başlıkta yün ve balıksırtı seçilmiştir.

**Kartlar:** fibers.wool, weaves.herringbone. **Kurucu ilkeler:** K02, K05, K10.

### M09-2 — Yaklaşınca (tr)

Bir eşyanın bize yakın olması, her ayrıntısını her gün gördüğümüz anlamına gelmez. Yuvarlatılmış döşemeli başlık, yün ve balıksırtı seçimiyle bu yatakta iki ayrı dikkat ölçeği taşıyor. Bazen bütün çizgiye bakarız, bazen yüzeyin küçük dönüşlerine. Yanından geçerken kısa süreliğine durmayı düşünelim. Gündelik yakınlık, yeni bir şey keşfetmek kadar bildiğimize yeniden bakmak da olabilir. Nesne günün nasıl biteceğine karar vermez; fakat ona her yaklaşış, aynı yerde başka bir ayrıntının görünmesine imkân bırakabilir.

**İz:** Yuvarlatılmış başlıkta balıksırtı döşeme seçilmiştir.

**Kartlar:** fibers.wool, weaves.herringbone. **Kurucu ilkeler:** K05, K09, K10.

### M09-3 — Two Distances (en)

A headboard can be known first as an outline and later as a surface close enough to study. Here, the rounded upholstered form meets wool and a herringbone weave selection. Imagine approaching from across a room and stopping beside it. The scale of attention changes, though the object remains where it was. Familiarity may grow through these different distances, rather than through a single decisive impression. The bed can be part of an ending to the day without telling that day how to end.

**İz:** The headboard combines a rounded outline with wool and herringbone selections.

**Kartlar:** fibers.wool, weaves.herringbone. **Kurucu ilkeler:** K02, K05, K10.
## M10 — bath / mirror / scandinavian_modern

Seed: 110. Somut iddiaların dayanak sözlüğü:

| İddia | JSON yolu | Değer |
| --- | --- | --- |
| ayna / mirror | `/kind` | `"mirror"` |
| yuvarlak / round | `/params/mirror` | `"round"` |

Etkinlik koşulları (malzeme/parça varlığı birlikte okunur):

- `/family` = `"bath"`
- `/kind` = `"mirror"`
- `/params/mirror` = `"round"`
- `/params/mirrorCabinet` = `"none"`

### M10-1 — Çemberde Kalan (tr)

Yuvarlak ayna, geri dönen bakışa bir kenar veriyor. Önünden geçerken bir an durduğumuzu düşünelim: gördüğümüz yalnız ayna değil, bulunduğumuz yerin bir parçası da olabilir. Çemberin içinde kalmak, o görüntünün tek anlamı olmak zorunda değil. Bazen bir ayrıntıyı fark eder, bazen bakmadan geçeriz. Eşyanın gündelik hayattaki varlığı bu iki hâlde de sürebilir. Kendini her seferinde göstermesi gerekmeden, ona döndüğümüzde çevreyi başka bir yönden görmemize eşlik eden bir sınır olarak orada kalır.

**İz:** Ayna yuvarlak biçimdedir.

**Kartlar:** special.mirror. **Kurucu ilkeler:** K01, K03, K10.

### M10-2 — Dönüp Bakmak (tr)

Aynaya dönmek, aynı yere bakıp aynı şeyi görmemek ihtimalini taşır. Yuvarlak sınır yerinde dururken önünden geçenler değişir. Bir hareketi tamamlayıp yeniden baktığımızı hayal edelim. Az önce dikkat etmediğimiz şey bu kez çemberin içinde yer bulabilir. Nesneye yaklaşmanın anlamı yalnız kendimizi görmekte kalmayabilir; arkamızdaki yer de bakışa katılır. Böyle bir eşya, evin içinde hem belirli bir noktadır hem başka yönlere açılan bir karşılaşma. Hangi ayrıntının önemli olacağını o anın içinden seçeriz.

**İz:** Yuvarlak biçim, bu ayna tasarımının seçilmiş sınırıdır.

**Kartlar:** special.mirror. **Kurucu ilkeler:** K01, K08, K09.

### M10-3 — What Comes Back (en)

A round mirror gives a returning glance an edge, while what enters that edge can change. Imagine passing, turning, and noticing something behind you that went unseen a moment earlier. The same object now holds another direction of attention. It need not announce a transformation to become part of a place. Sometimes it may be passed without a look; sometimes the circle becomes a brief meeting between a person and their surroundings. Both encounters can belong to the ordinary life around it.

**İz:** The mirror is specified with a round shape.

**Kartlar:** special.mirror. **Kurucu ilkeler:** K01, K03, K09.
