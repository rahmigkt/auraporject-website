# PERDE-01 — Pencere giydirme araştırması ve uygulama verisi

Araştırma tarihi: **20 Ekim 2026**. Başlangıç: `main` / `b19e691`. Araştırma ve hesap: Codex. Stüdyo uygulaması: Claude. Bu teslim stüdyoyu değiştirmez; ücretli servis, eğitim ve GPU kullanılmadı.

## Sonuç ve kanıt sınırı

Ülke, kullanıcının dilini ve yerel ürün aramasını yönlendirmeli; pencere ölçüsünü, zevkini veya mahremiyet ihtiyacını belirlememeli. Öneriyi asıl belirleyenler gündüz/gece görüşü, pencerenin hareketi, gerçek askı noktası, mevcut panjur ve seçilen ürünün föyüdür. Perde ev projesinin bir bileşeni; ayrı AURA ürünü değil.

Veride üç şey ayrıldı:

- **Kaynak bulgusu:** belirli üretici rehberi, ürün föyü, tarihli fiyat veya araştırma. Kaynak kimliği ve bağlantısı var.
- **AURA önerisi:** oda seçeneği, görsel yaklaşım veya atölyeye sunulacak tahmin. Ülke geleneği veya imalat standardı sayılmaz.
- **Kaynak bulunamadı:** ulusal kullanım yüzdeleri, türlerin ülke bazında sıklığı, bölgesel renk tercihleri, bütün konutlara uyan pencere/denizlik ölçü aralıkları ve karşılaştırılabilir ısmarlama fiyat bandı. Bunlar `null` / `source_not_found`; sayı uydurulmadı.

Her ülke için iki bağımsız yayıncı karşılaştırıldı. Aynı markanın iki sayfası iki bağımsız kaynak sayılmadı. Kid/Hemtex aynı grupta olduğundan birbirleriyle bağımsız karşılaştırma yapılmadı. Katalogda bulunmak, toplumda yaygın olmak anlamına gelmiyor. Ulusal bina standardı araştırması sonuçsuz kalan alanlar, yerinde ölçünün yerine perakendeci hazır boyları konularak doldurulmadı.

## Dosyalar ve Claude'a kullanım sırası

| Dosya | İçerik |
|---|---|
| [perde-kulturu.json](veri/perde-kulturu.json) | 15 ülke; BE üç bölge; beş oda; 11 perde türü; 11 dilde adlar; kaynak/bilinmeyen/öneri ayrımı |
| [perde-hesap.json](veri/perde-hesap.json) | Başlık, montaj, dikim ve stor profilleri; kumaş örnekleri; güvenlik sınırları |
| [perde-gorunum.json](veri/perde-gorunum.json) | Parametrik çizim için kıvrım, malzeme, donanım ve açık/kapalı durum tarifleri |
| [perde-kaynaklar.json](veri/perde-kaynaklar.json) | Bağlantılar, yayıncı, kapsam, kontrol tarihi ve kısa bulgu |
| [perde-ornekler.json](veri/perde-ornekler.json) | Beş açıkça tanımlı ölçü senaryosu ve bağımsız beklenen sonuç |
| [perde-diyaloglar.jsonl](veri/perde-diyaloglar.jsonl) | Tek tek yazılmış 34 doğal kullanıcı/asistan parçası |
| [hesap.py](../../tools/perde/hesap.py) | Yalnız standart Python kütüphanesiyle ön metraj CLI / `calculate(request)` |

Önce kullanıcının ihtiyacı ve açıklığın hareketi alınır. Sonra ülke/dil verisiyle yerel seçenekler konuşulur. **Ülke kodundan katsayı seçilmez.** Kullanıcının seçtiği başlık, gerçek kumaş ve montaj profili hesaplanır. Sonuçtaki `production_ready: false` korunur; eksik donanım ve güvenlik bilgisi tasarımcıya gider. Kullanıcıdan fotoğraf istenirken kişiler ve özel belgeler kadraja alınmaz; fotoğraf, ölçülü keşfin yerine geçmez.

Ad sözlüğü TR, EN, NL, FR, DE, DA, SV, NO, ES, PT, IT içerir. Bazı adlar editoryal çeviri/eşanlamdır; satın alma sırasında satıcının terimiyle eşleştirilir. Örneğin Türkçe “stor”, dış kepenk/panjurla; İspanyolca `persiana` ve İtalyanca `tapparella` da iç kumaş ruloyla karıştırılmaz.

## Ülke karşılaştırmaları

Aşağıdaki oda seçenekleri **koşullu tasarım önerisidir**, gözlenmiş ulusal alışkanlık değildir. Her ülkenin JSON kaydı salon, yatak, mutfak, banyo ve çocuk odasını ayrı taşır. Her türün yaygınlığı için sayısal araştırma bulunmadığından `source_not_found` kullanılır. Ulusal pencere eni/boyu ve denizlik yüksekliği için doğrulanmış kapsayıcı değer bulunamadı; Fransız balkon, sürgü, vasistas, çatı penceresi ve cumba gerçek projeden tanımlanmalı.

### Belçika — VLG, BRU, WAL

[IKEA BE / VIDGA](https://www.ikea.com/be/fr/product-guides/comment-acheter-les-rails-vidga-en-4-etapes-simples-pub48ba9410/) yan taşmayı en az 150 mm tarif eder; [Heytens](https://www.heytens.com/be-fr/blog/comment-prendre-mesures-fenetre/) ürün ve açıklık engellerine göre ölçüye özel keşif önerir. Birincisi belirli ray sistemi, ikincisi kişiye özel hizmettir. Voilage/vitrage ürün seçenekleri gece mahremiyetini kendiliğinden çözmez.

**Flaman (VLG):** NL terimleri sunulur. **Brüksel (BRU):** FR/NL seçilebilir, kullanıcının dili sorulur. **Valon (WAL):** FR; Almanca konuşulan kullanıcıya DE sunulabilir. Bölgeler arasında perde kullanım oranı veya renk tercihi farkı doğrulanamadı; üçüne farklı zevkler atanmadı. Salonda hafif katman ve gerekirse gece katmanı, yatakta mevcut panjurun gerçek karartmasına göre tamamlayıcı çözüm önerilir. Banyo için nem ve karşı bina görüşü ayrıca sorulur.

### Hollanda

[Cieraad'ın araştırması](https://www.researchgate.net/publication/326462092_Dutch_Windows_Female_Virtue_and_Female_Vice) açık pencerelerin tarihsel toplumsal anlamını inceler; bu, güncel “Hollandalılar perde kullanmaz” istatistiği değildir. Kullanıcı perdesiz salon istiyorsa saygı duyulur. Gece görünürlüğü ve zemin kat/sokak ilişkisi konuşulur.

[HEMA](https://www.hema.nl/inspiratie/wonen-en-slapen/gordijnen-opmeten) tek pileyi 2× verirken [IKEA NL](https://www.ikea.com/nl/nl/ideas/raam-opmeten-voor-gordijnen-pubf4dbe0f0/) basit pilede 1.5–2× aralığı verir. Bu fark tek bir “Hollanda katsayısı” olamayacağını gösterir. HEMA'nın 10 mm yer boşluğu da ürün/işçilik profili olarak saklandı. Vitrage, inbetween ve verduisterend gordijn farklı işlevlerdir; güneş ve gece mahremiyeti ayrı değerlendirilir.

### Almanya

[HORNBACH SOLUNA](https://media.hornbach.de/cmsm/de/soluna-broschuere-l81.pdf) cam çıtası, çerçeve, niş ve dış montaj seçeneklerini ayırır; broşür eski olduğundan güncel fiyat kaynağı yapılmadı. [IKEA'nın 2026 pencere kılavuzu](https://www.ikea.com/de/de/files/pdf/a4/f2/a4f2bcc7/bf_leitfaden_fenster_07-2026_online.pdf) diğer bir ürün sistemidir; aynı mekanizma varsayılmadı.

Gardine, Vorhang, Rollo, Plissee, Raffrollo ve Scheibengardine isimleri yerel aramayı kolaylaştırır. İçe açılım/vasistas, conta, pencere kolu ve kiracı için delmeden montaj olanağı sorulur. Salonda tül/fon, mutfakta temizlenebilir iç stor veya jaluzi **seçenek** olarak kalır. DIN B1'in her Alman konutunda bütün perdeler için zorunlu olduğu iddia edilmez.

### Avusturya

[XXXLutz](https://www.xxxlutz.at/c/vorhaenge-ausmessen) 200 mm yan taşma ve genel 2–3× dolgunluk önerir. [IKEA AT](https://www.ikea.com/at/de/ideas/verschiedene-arten-deine-vorhaenge-aufzuhaengen-pub3e877bd0/) farklı başlık/asma yolları gösterir. Lutz'un genel aralığı her başlığın imalat katsayısı yapılmadı.

Eski binada eğri zemin için üç boy ölçüsü, radyatör ve kanat hareketi alınır. Yatakta karartma ihtiyacı, salonda manzara ve toplanma alanı belirleyicidir. Ulusal perde başlığı veya renk tercihi için kanıt yok.

### İsviçre

[Pfister ölçü rehberi](https://www.pfister.ch/de/vorhang/messanleitung) 200 mm yan taşma ve 15 mm yer boşluğu tarif eder; [IKEA CH](https://www.ikea.com/ch/de/customer-service/knowledge/articles/9g47eg95-7cbc-4010-8d7g-2bd2bf6f40d8.html) kendi asma aksesuarlarını açıklar. Var olan ray ile her gliderın uyumlu olduğu varsayılmaz. Almanca/Fransızca/İtalyanca kullanıcıya dil seçimi sunulur; kantona göre zevk atanmaz.

Pfister'ın 100–200 mm yere yığma seçeneği stil alternatifi olarak kaydedildi; robot süpürge, dolaşım ve çocuk varsa ayrıca değerlendirilir. Bu ilk hesaplayıcı serbest yere yığılmayı hesaplamaz. Keten için verilen bir uzunluk tavsiyesi bütün kumaşlara çekme yüzdesi yapılmaz.

### Fransa

[Mondial Tissus](https://www.mondialtissus.fr/tutos-et-inspiration/mon-guide-couture/les-tissus-pour-refaire-sa-decoration/quel-tissu-pour-des-rideaux.html) dikim için üst/alt/yan payları sunar; [IKEA FR LILL](https://www.ikea.com/fr/fr/p/lill-rideaux-filet-2-pieces-blanc-avec-ourlet-pour-tringle-90111980/) bitmiş hazır paneldir. Hazır panel eni, ham kumaş metrajıyla karıştırılmaz. Voilage, rideau occultant, store bateau ve brise-bise seçenekleri oda ihtiyacına göre konuşulur.

Fransız balkonunun açılımı, mevcut dış kepenk ve radyatör alınır. Tül ile tam karanlık çelişkisi ikinci katman veya mevcut kepenkle çözülür; sadece kumaş adından ışık sızdırmaz oda sonucu çıkarılmaz. ERP yangın hükümleri konuta otomatik aktarılmaz.

### Birleşik Krallık

[John Lewis](https://www.johnlewis.com/buying-guides/curtains-buying-guide) hazır/ısmarlama başlık ve astar seçeneklerini, [Dunelm](https://www.dunelm.com/info/buying-guides/curtain-buying-guide) ışık, pencere ve kullanım seçimini anlatır. Pencil pleat, pinch pleat ve eyelet aynı katsayı değildir. Net/voile gündüz hafiflik sağlayabilir; aydınlık içeride gece mahremiyeti garanti edilmez.

Cumba için segmentler ve açılar istenir; düz ray hesaplayıcıya tek toplam en girilmez. Yatakta blackout katmanı, salonda toplanma yeri, mutfakta ısı kaynağı sorulur. Ismarlama başlığın stok hazır panelden daha pahalı olması bir ülke fiyat bandını kanıtlamaz.

### İrlanda

[Hillarys](https://www.hillarys.ie/inspiration/curtains-buying-guide/) ölçüye özel başlık/astar hizmeti sunar; [IKEA IE VIDGA](https://www.ikea.com/ie/en/files/pdf/27/0c/270c040b/vidga.pdf) hazır ray sistemine aittir. Bu ikisi aynı kapsamda fiyatlanamaz.

Gece çalışan kullanıcı için sabah ışığı ve kenar kaçakları, salonda gün ışığı ve mahremiyet sorulur. Termal astarın yararı ile pencere hava sızıntısının onarımı ayrı konulardır. “Standart Dublin penceresi” diye ölçü veya fiyat üretilmez.

### Danimarka

[JYSK ölçü rehberi](https://gardiner.jysk.dk/opmaalingsvejledning) iç/dış ve perde türüne göre ayrı talimat verir; [IKEA DK kataloğu](https://www.ikea.com/dk/da/cat/gardiner-10700/) hazır kumaş seçeneklerini gösterir. Katalog boyları niş ölçüsünün yerine geçmez.

JYSK iç roller/plise için en küçük ham enden 10 mm düşülür; siparişten fabrikada **yeniden** düşülmez. Dış roller için en büyük en +100 mm, en büyük boy +80 mm tarif edilir. Bu farklar profil seçimidir, “Danimarka toleransı” değildir. Gündüz bahçe görüşü ile gece kapanma ihtiyacı ayrı sorulur; kuzeyli kullanıcıya otomatik açık renk atanmaz.

### İsveç

[Hemtex](https://www.hemtex.se/inspiration/guider/gardinguide/mata-fonster) askı referansından ölçüp yerden 20 mm bırakmayı önerir; [IKEA SE](https://www.ikea.com/se/sv/rooms/living-room/how-to/sa-hanger-du-gardiner-snyggt-pub69fdc421/) hazır perde boyları ve farklı asma seçenekleri verir. Hazır boylar ülkenin pencere standardı değil.

Mörkläggningsgardin uyku ihtiyacına göre, skir gardin gündüz ışığına göre seçenek olur. Çocuk odasında erişilebilir zincir için doğaçlama düğüm önerilmez. Yaz uykusu kullanıcıya sorulur; ülke/enlem tek başına karartma emri üretmez.

### Norveç

[Kid](https://www.kid.no/inspirasjon/guider/gardinguide) ile [IKEA NO](https://www.ikea.com/no/no/rooms/living-room/how-to/vidga-serien-pub989e5c48/) karşılaştırıldı. Kid ve Hemtex bağımsız iki kaynak sayılmadı. [Kid stor ölçü PDF'sindeki](https://www.kid.no/globalassets/kid.no/m2m/maleguider/rullgardiner/ny_maaleguide_rullegardiner.pdf) 40 mm niş derinliği belirli çözüme ait; tüm mekanizmalara yetmez.

Kışın ışığı koruma ve yazın karanlıkta uyuma, kullanıcı ihtiyaçları olarak ayrı katmanlarla ele alınabilir. Liftgardin/Rullegardin/Plisségardin yerel seçeneklerdir; sıklık sıralaması doğrulanmadı. Genel bir %3–6 çekme uyarısı her kumaşa otomatik uygulanmadı.

### İspanya

[Leroy Merlin ES](https://www.leroymerlin.es/ideas-y-consejos/paso-a-paso/como-medir-una-ventana-para-tus-cortinas-estores.html) niş içi en düşümü ve dış taşma önerirken [Cortinadecor](https://www.cortinadecor.com/info/35/como-medir) ürün bazında ayrı ölçü yolları sunar. İkinci marka için aynı düşüm kendiliğinden kabul edilmedi.

Persiana dış panjur ile estor iç stor farklıdır. Panjur kutusu/kol çıkıntısı ve mevcut panjurun karartması kontrol edilir. İşlevsel panjur varsa yatakta gereksiz ikinci karartma zorunlu tutulmaz; salonda visillo yalnız gündüz ihtiyacına göre önerilir.

### Portekiz

[Leroy Merlin PT](https://www.leroymerlin.pt/bricolage/aprenda-mais/como-instalar-varoes.html) çubuk için en az 150 mm yan taşma önerir; [IKEA PT LILL](https://www.ikea.com/pt/pt/p/lill-cortinados-rede-par-branco-com-bolsa-para-varao-10070262/) hazır cortinado örneğidir. Yerel hazır 300 cm boy, pencere veya tavan yüksekliği standardı yapılmadı.

Varanda kapısının sürgü/içe açılımı ve kumaşın park yeri sorulur. Kıyı/şehir ayrımından renk zevki çıkarılmaz; yön, kamaşma ve mevcut estore ihtiyacı belirler. Islak hacimde kumaşın nem uygunluğu ayrı belgelenir.

### İtalya

[Leroy Merlin IT pacchetto rehberi](https://www.leroymerlin.it/guide-alla-scelta/come-scegliere-tende-a-pacchetto.html) cam, duvar ve tavan montajını ayırır; [IKEA IT LILL](https://www.ikea.com/it/it/p/lill-tenda-a-rete-2-teli-bianco-con-canale-per-bastone-10070262/) bitmiş tül örneğidir. [Tapparella rehberi](https://www.leroymerlin.it/guide-alla-scelta/quali-sono-migliori-tapparelle-da-avere-e-come-installarle-passo-passo.html) dış panjura aittir; toleransları iç kumaş ruloya taşınmaz.

Pacchetto toplandığında kasetin/balkon kapısının önünde bırakacağı hacim ölçülür. Salon için ince katman veya fon, yatak için mevcut panjurla birlikte çözüm seçenekleri konuşulur. Keten adından yıkama ve çekme sonucu çıkarılmaz.

### Türkiye

[Taç Anında Perde](https://www.tac.com.tr/aninda-perde) tül, fon, güneşlik ve karartma sunar; [Koçtaş'taki Perde Pendik SKU'su](https://www.koctas.com.tr/perde-pendik-tul-perde-kum-desenli-orme-kumas-1-2-5-pileli-orta-pile-ekru/p/5003940557) belirli 2.5 pileli üründür. Satıcının pile oranı bütün Türkiye'nin standardı yapılmaz; bitmiş panel ölçüsüne ikinci kez pile katsayısı çarpılmaz.

Salonda tül+fon konuşulabilir, kullanıcı düz ve sade istiyorsa seçenek buna göre değiştirilir. Korniş sırası, kartonpiyer nişi, petek ve balkon kapısı sorulur. Yatakta güneşlik/tül/karartma adından sonuç çıkarılmadan gerçek gece ışığı kontrol edilir. Ismarlama fiyat, ölçü ve kumaş seçimi sonrası alınır.

## Oda, estetik ve pencere kontrol listesi

| Durum | Koşullu öneri | Önce sorulacak |
|---|---|---|
| Salon | Hafif katman; gece gerekirse kapatılan ikinci katman veya stor; perdesiz de olabilir | Sokak/komşu görüşü, TV yansıması, manzara, park alanı |
| Yatak | Gerekli karartma katmanı ve kenar kaçaklarına uygun montaj | Uyku saatleri, mevcut kepenk/panjur, açılım |
| Mutfak | Kolay temizlenen, ısıdan uzak seçenek; bazen kafe perdesi veya hiç perde | Ocak, buhar, yağ, havalandırma |
| Banyo | Nem uygunluğu belgeli ürün; gece görüşü kontrolü | Karşı görüş, yoğuşma ve pencere açılımı |
| Çocuk | Kordonsuz seçenek önceliği ve belgeli güvenlik sistemi | Tırmanılan eşya, yatak konumu, erişilebilir halkalar |

Bunlar AURA tasarım çıkarımlarıdır; ülke alışkanlığı araştırmasının yerine konmaz. Alt tonu duvar/zemin numuneleriyle dengeleme, sakin devamlılık veya kontrollü kontrast gösterme, gündüz/gece kumaş numunesi kontrolü de **öneridir**. Ülkelere renk/desen zevki atayan karşılaştırmalı veri bulunmadı. Yerel katalog görsellerinden ulusal estetik eğilimi çıkarılmadı.

Ölçü kaydı: açıklık en/boy, tavan ve döşeme kotları, denizlik, duvar/tavan taşıyıcısı, kanat/kulp hareket hacmi, radyatör, panjur kutusu, ray altı/askı yatağı/çubuk üstü referansı ve toplanmış kumaşın kapladığı yer. Çatı penceresi eğimi, dış kepenk, sürgü, tam boy cam ve cumba ayrıca etiketlenir; bilmediğimiz donanım için ölçü tahmini yapılmaz.

## Başlık, pay ve metraj yöntemi

Başlık listesi: tek/çift/üçlü pile, pencil, wave/S, kuşgözü, halkalı kancalı asım, tünel ve cırt. `single/double/triple` aralıkları HEMA/IKEA rehberleriyle; diğer başlıkların hesap aralığı açıkça **AURA ön tahmin aralığı** olarak işaretli. Halkalı asımda halkaların altındaki gerçek taşıma noktası ölçülür; halkaların çapı kaynaksız varsayılmaz. Cırtlı düz Roma üstü için 1×, görsel/ön tahmin modelidir; Roma'nın bütün dikim/çubuk cepleri bu hesapta yoktur.

Rayın mevcut ölçüsü varsa o kullanılır. Yoksa seçilen üretici profilinin yan taşmasıyla taslak ray hesaplanır. Rayın duvar üst kotu veya tavan konumu mimariden ölçülür; bütün ülkeler için “pencereden şu kadar yukarı” uygulanmaz. 150 mm üst kot IKEA'nın ürün tavsiyesi; tavan rayında geçerli ölçülmüş boyun yerine konmaz.

Kullanılan karma dikim profili: Mondial üst **100 mm**, alt **200 mm**, her yan **40 mm**; birleşimde her kumaş kenarı **20 mm AURA atölye önerisi**. Bunlar her başlığa hazır imalat reçetesi değil. Kanca başı, wave bandı, kuşgözü ve astarın son reçetesi ayrıca onaylanır. Kumaş eni **kullanılabilir en** olmalı; kenar şeritleri veya kusurlu alan hesaba katılmaz.

Semboller: `R` ray eni, `f` büzgü, `P` eşit panel sayısı, `B` kullanılabilir kumaş eni, `s` her yan kıvırma, `j` her birleşim kenarı, `D` bitmiş boy, `t/b` üst/alt pay; `sw/sf` warp/weft çekme oranları. Bütün boylar mm. `D = gerçek askı–zemin − seçilen yer boşluğu`.

**Normal kullanım (kumaş boyu warp):**

```
hedef_panel_eni = R × f / P
n = max(1, ceil((hedef_panel_eni + 2s − 2j) / (B×(1−sf) − 2j)))
toplam_boy_sayısı = n × P
kesim_boyu = (D + t + b) / (1−sw)
desen varsa kesim_boyu = ceil(kesim_boyu / tekrar) × tekrar
kesim_boyu mm'ye yukarı yuvarlanır
doğrusal_m = toplam_boy_sayısı × kesim_boyu / 1000
```

Bu, her panel için **tam kumaş enleri ayıran muhafazakâr tahmindir**. Atölyenin yarım en/fire paylaşımı optimizasyonunu taklit etmez. Desenin ilk motife oturtulması için başlangıç firesi ayrıca gerekebilir. Yatay desen eşleşmesi ve yönlü hav, ayrı kesim planı gerektirir.

**Boydan boya / railroad:** sadece üreticinin döndürmeye uygun dediği kumaşta. Boy weft yönüne, yatay toplam warp yönüne geçer:

```
kesim_boyu = ceil((D+t+b)/(1−sf)) <= B olmalı
doğrusal_m = (R×f + 2P×s)/(1−sw)/1000
```

Sipariş doğrusal metresi 0.001 m'ye yukarı yuvarlanır; satıcının satış adımı daha büyükse ayrıca yukarı yuvarlanmalıdır. Kumaş alanı `m²` doğrusal `m` değildir. Mondial'in bazı anlatımlarındaki en×boy ifadesi alan verir; hesaplayıcı onu metraj formülü diye almaz. Direct Fabrics'in örnek sayısal tutarsızlığı da kopyalanmadı; burada aritmetik bağımsız test edildi.

Çekme için her iki oran ve dayanak zorunlu. `0`, “bilmiyorum” değildir. Ön yıkama sonrası kalan çekme kullanılır; kaynaklı yaklaşık oran ve atölye denemesi ayrı kayıtlardır. Dar en, negatif boy, yanlış birim, bilinmeyen kumaş/dönüş, önceden düşülmüş stor ölçüsü ve cumba hesaplayıcıda reddedilir. Astar, Roma çubuk cepleri, yönlü desen, eğri ray, yere yığılma ve motor aksesuarı bu metraja dahil değildir.

### Beş tam hesap

Bunlar gerçek müşteriden alınmış proje iddiası taşımayan **ölçü senaryolarıdır**. Ürün ve yöntem kaynaklı; ev ölçüleri ve sıfır kalan çekme/desen örneği açıkça senaryo girdisidir. Her sonucu test dosyası ayrı sabit değerle denetler.

1. **TR / 1600×1400 açıklık, tavanda wave:** ray 2000; ray altı–zemin 2600; yer boşluğu 10 → `D=2590`. Daybreak 2 en 3000, döndürülebilir, warp/weft yaklaşık %3/%1. İki panel; tahmini 2.3 → düz bitmiş en `4600`. Boy kontrolü `(2590+100+200)/.99 = 2919.192…` → **2920 mm**, 3000'e sığar. Satın alma `(4600+2×2×40)/.97/1000 = 4.907216…` → **4.908 doğrusal m**. Askı–zemin 2700 olsaydı boy yaklaşık 3021 mm olur, 3000 ene sığmaz; negatif test bunu yakalar. Wave donanımı ayrıca doğrulanır.
2. **GB / pencil, desenli normal en:** ray 1800, katsayı 2, iki panel, bitmiş boy 2200. Kullanılabilir en 1400; ön işlemli kalan çekme 0; senaryoda ölçülmüş tekrar 320. Her panel hedefi 1800; `ceil((1800+80−40)/(1400−40))=2`, toplam **4 boy**. Paylı boy 2500; `ceil(2500/320)×320=2560`. **4×2.560 = 10.240 doğrusal m**.
3. **FR / kuşgözü ön tasarım:** ray 2400, seçilmiş tahmin 1.5, iki panel; çubuk üstünden 2470, yer boşluğu 20 → `D=2450`. Kullanılabilir en 1400, çekme 0, tekrar 0. Hedef panel 1800 → 2 en/panel, toplam **4 boy**. Kesim `2450+300=2750`; **11.000 doğrusal m**. Kuşgözü üst payı gerçek donanıma göre sonradan değişebilir.
4. **CH / üçlü pile:** ray 2200, 2.5, iki panel; askı–zemin 2315, yer boşluğu 15 → `D=2300`. En 1400, çekme/tekrar 0. Hedef panel 2750; `ceil((2750+80−40)/1360)=3`. **6 boy × 2600 = 15.600 doğrusal m**. İki enin 2800 mm olması tek başına yeterli değil; kıvırma ve birleşim payları var.
5. **DK / JYSK niş içi roller:** ham enler 1200/1194/1198; boylar 1500/1498/1502. Rehberin en küçük ölçüleri 1194 ve 1498. Müşteri en düşümü 10 → **sipariş kasa eni 1184 mm, boy 1498 mm**. Fabrika tekrar düşmez. Gerçek kumaş eni `null`: kasa ile kumaş arasındaki fark seçilen mekanizmadan gelmeli. Dış roller aynı ham ölçülerle hesaplandığında en büyük ölçüler +100/+80 → **1300×1582 mm**; bu ek durum da testte.

## Kumaş, ışık, bakım ve performans

Lif (keten/pamuk/polyester), yüzey (kadife), yapım ve astar ayrı alanlar olmalı. “Keten” otomatik yıkama sıcaklığı, gramaj veya karartma sınıfı değildir. [Mondial kumaş rehberi](https://www.mondialtissus.fr/tissus/rideaux-et-voilages-au-metre/rideaux-au-metre.html) bu malzeme seçeneklerini sunar; kesin performans seçilen SKU'dan alınır.

| Doğrulanmış örnek | Kaynak verisi | Çıkarılmayacak sonuç |
|---|---|---|
| [Kvadrat Daybreak 2](https://www.kvadrat.dk/da-dk/produkter/curtains/7401-daybreak-2) | Saydam; 300 cm; 270 g/**doğrusal m** → türetilmiş 90 g/m²; yaklaşık warp/weft %3/%1; 60°C nazik | 270 g/m² denmez; tül gece mahremiyeti/blackout sayılmaz |
| [Kvadrat Dawn 2 teknik föyü](https://kvadrat-downloadcenter.azurewebsites.net/api/downloadcenter/assets/987399-64ac9ec8/T_5868_STechnical-specifications.pdf) | Dimout; 300 cm; 780 g/doğrusal m → 260 g/m²; %2/%0; ISO105-B02 5–7 | Dimout, kurulmuş odada mutlak karanlık değildir |
| [IKEA DE LILL](https://www.ikea.com/de/de/p/lill-gardinenstore-2-schals-weiss-mit-tunnelsaum-90111980/) | Hazır saydam ürün; ürün sayfası azami %4 çekme, 40°C nazik | Başka ülke/etiketteki LILL verisiyle otomatik birleştirilmez |

Dawn 2 föyündeki düz test ışık geçirgenliği renk aralığı %0–0.37'dir. Aynı föy 100 mm hava boşluğunda ses yutumu düzde 0.45/D, dalgalıda 0.65/C verir; bunlar **dB ses geçiş yalıtımı değildir**, başka asma koşuluna aktarılmaz. Termal tasarruf yüzdesi için uygun montajlı karşılaştırmalı test doğrulanmadı; kayıtta `null`.

Daybreak sayfasının ışık haslığı/geçirgenliği alanları dinamik şablon halinde döndü; sayı türetilmedi. Sertifika bağlantısı var diye test sonucu okunmuş sayılmadı. Karartma kumaşı için gerçek kenar kaçakları, kasa/yan kılavuz ve üst boşluk ayrıca çözülür. Kumaş ağırlığından ray taşıma kapasitesi çıkarılmaz.

## Güvenlik ve yangın kapsamı

[BSI EN 13120](https://knowledge.bsigroup.com/products/internal-blinds-performance-requirements-including-safety), [BBSA rehberi](https://www.makeitsafe.org.uk/trade/) ve [DIN EN 16434 kapsamı](https://www.dinmedia.de/en/standard/din-en-16434/188715197) birlikte kontrol edildi. EN 13120 ürün güvenliğini; EN 16433 test yöntemlerini, EN 16434 güvenlik cihazlarını ilgilendirir. Kordonsuz seçenek öncelikli olabilir; her “kordonsuz” ürün otomatik sertifikalı değildir. Zinciri düğümlemek, mobilyanın arkasına saklamak veya genel bir güvenli kordon boyu vermek yerine seçilen sistemin belgeli kurulumu gerekir. Bu teslim test standardının tam ücretli metnine sahipmiş gibi madde bazında uygunluk raporu üretmez.

Ray/çubuk yükü; kumaş+astar ağırlığı, açıklık, konsol aralığı, yüzey ve dübel birlikte değerlendirilir. Yük taşıma kapasitesi ve sabitleme aralığı kaynaklı SKU yoksa `null`; “şu kadar vida yeter” önerilmez. Çocuk yatağı veya tırmanılabilir eşyanın yanında erişilebilir halka kabul edilmez; yerinde güvenlik kontrolü tasarımcı/uygulamacı işidir.

[EN 13773](https://knowledge.bsigroup.com/products/textiles-and-textile-products-burning-behaviour-curtains-and-drapes-classification-scheme) bir sınıflandırma çerçevesidir. DIN 4102 B1, Fransız M1/M2 ve BS 5867-2 Type B farklı sınıflardır; birbirine dönüşüm tablosu yapılmadı. “Yanmaz” yerine belgelendirilmiş yanma davranışı ve kapsam yazılır. Kullanım, astar, son işlem, renk ve bakım sonrası geçerlilik üretici belgesiyle eşleştirilir.

Fransa'da erişilen [tarihli AM12 ERP metni](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000020304496/2021-12-31) kapalı merdiven ile diğer hacimleri ayırır; tüm ev perdeleri için genel M1 kuralı çıkarılamaz. Tarihsiz güncel sayfa 403 verdi; yürürlük teyidi **tamamlanmadı**. Birleşik Krallık'ta [uyuma amaçlı ticari tesis risk rehberi](https://www.gov.uk/government/publications/fire-safety-risk-assessment-sleeping-accommodation/fire-safety-risk-assessment-sleeping-accommodation-accessible) de özel evin otomatik şartnamesi değildir. Diğer ülkelerde yapı/kullanım bazlı zorunluluk doğrulanamadı; kamu/otel projesinde yerel yangın incelemesi olmadan uygunluk kararı verilmez.

## Görünüm sözleşmesi

`perde-gorunum.json` içinde üretici fiziksel ölçüleri ile shader/geometri önerileri ayrıdır. Kaynaklı [Silent Gliss Wave rehberi](https://www.silentgliss.co.uk/fileadmin/redaktion/contentserv/Images/Web_Partner_Downloads/SGGB/Various_Documents/Wave_-_Curtain_Workroom_Guide.pdf) **Ağustos 2024 s.5** standart glider 80 mm/7 pocket için yaklaşık 2.3 dolgunluk, 160 mm ön-arka derinlik, metre ray başına 180 mm toplama eni + uç parça ve 100 mm asgari mesafe verir. Roller gliderın tablosu farklıdır; bu kayıt onun için kullanılmaz.

Çizim için S kıvrım veya yumuşak pile yaklaşık geometri kullanılabilir. Öneri kıvrım adımı/derinliği gerçek kanca sayısını üretmez. Wave işçilik siparişi glider, pocket, kanca sayısı ve uç dönüşleriyle ayrıca çözülür. Ray/çubuk kesiti geçici çizim boyutudur, seçilmiş SKU profiliyle değiştirilir. Shader opaklığı gerçek ışık geçirgenlik yüzdesi değildir.

`closed_fraction`: 0 açık/kaldırılmış, 1 kapalı/indirilmiş. Stor açıkken kumaş tüpe sarılır; kasa kalır. Plise açıkken sıfır yükseklik olmaz, alt/üst ray ve sıkışmış paket kalır. Roma açıkken yatay kıvrımlar üstte toplanır. Plan, maket, kesit ve oda içi **aynı ölçü kaydını** kullanmalı; ayrı ekranlarda ayrı oran uydurulmamalı. Toplanma hacmi pencere kolu, açılan kanat ve geçiş yoluyla çakışıyorsa öneri geri alınır.

Fotoğraf/katalog PDF'si veya görsel kopyası depoya alınmadı; referanslar bağlantı. Çizim uygulaması ve gerçek kumaş shader'ı bu teslimin devamı olarak Claude'a ait.

## Fiyatların okunması

20.10.2026'da görülen **hazır SKU örnekleri** aşağıda. Bu örnek aralığı piyasa bandı, kalite eşdeğeri veya teklif değildir; ülkeler arası ucuzluk sıralaması yapılamaz. Nakliye, asma sistemi, dikim ve montaj kapsamları ayrıca karşılaştırılır. Tam SKU, paket adedi ve tek panel ölçüsü JSON'da; belirtilmeyen paket bilgisi `null` bırakıldı. Tek fiyat varsa aralık iddiası yok.

| Ülke | Gözlenen hazır örnekler | Kaynak |
|---|---|---|
| BE | €9.99–29.99, HILDRUN/GJERTRUD çift 145×300 cm | [IKEA BE](https://www.ikea.com/be/fr/cat/voilages-700221/) |
| NL | €9.99 BENGTA tek 210×300; €24.99 GINSTMOTT çift 145×300 | [IKEA NL](https://www.ikea.com/nl/nl/cat/gordijnen-10700/) |
| DE | €3.50 LILL çift 280×250 | [IKEA DE](https://www.ikea.com/de/de/p/lill-gardinenstore-2-schals-weiss-mit-tunnelsaum-90111980/) |
| AT | €3.99 LILL çift 280×250; €59.99 STOCKHOLM tek 300×300 | [IKEA AT](https://www.ikea.com/at/de/cat/vorhaenge-10700/) |
| CH | CHF19.95 Isola; CHF99.95 Bonne Nuit normal fiyat | [Pfister](https://www.pfister.ch/de/services/beratung/vorhang); bu gözlemde ölçü/paket bilinmiyor |
| FR | €3.99 LILL çift 280×250 | [IKEA FR](https://www.ikea.com/fr/fr/p/lill-rideaux-filet-2-pieces-blanc-avec-ourlet-pour-tringle-90111980/) |
| GB | £12 BENGTA tek 210×250; £22 GINSTMOTT çift 145×250 | [IKEA GB](https://www.ikea.com/gb/en/cat/curtains-10700/); mağaza indirimi ayrıca hesaplanmadı |
| IE | €13 BENGTA tek 210×250; €22 GINSTMOTT çift 145×250 | [IKEA IE](https://www.ikea.com/ie/en/cat/curtains-10700/) |
| DK | DKK99 BENGTA tek 210×250; DKK449 SANELA çift 140×250 | [IKEA DK](https://www.ikea.com/dk/da/cat/gardiner-10700/) |
| SE | SEK129 BENGTA tek 210×250; SEK199 STENFRÖ çift 145×250 | [IKEA SE](https://www.ikea.com/se/sv/cat/gardiner-10700/) |
| NO | NOK65 LILL çift 280×250; NOK995 DYTÅG çift 145×300 | [IKEA NO](https://www.ikea.com/no/no/rooms/living-room/how-to/vidga-serien-pub989e5c48/) |
| ES | €4.99 LILL çift 280×300 kampanya; €24.99 GINSTMOTT çift 145×300 | [IKEA ES](https://www.ikea.com/es/es/cat/cortinas-10700/); LILL 31.12.2026/stok sınırı |
| PT | €4.99 LILL çift 280×300 | [IKEA PT](https://www.ikea.com/pt/pt/p/lill-cortinados-rede-par-branco-com-bolsa-para-varao-10070262/) |
| IT | €4.95 LILL çift 280×300 | [IKEA IT](https://www.ikea.com/it/it/p/lill-tenda-a-rete-2-teli-bianco-con-canale-per-bastone-10070262/) |
| TR | ₺2725 Şerit; ₺2905 Lecino, listede 250×260 cm | [Taç](https://www.tac.com.tr/perde-hazir-perde-tul-perde); ölçünün bitmiş eni ve paket ayrıntısı siparişten önce doğrulanmalı |

Ismarlama için Heytens/Hillarys/Pfister/Taç gibi hizmetler ve yerel ölçü rehberleri araştırıldı; aynı en/boy, başlık, astar ve montaj kapsamıyla doğrulanabilir ülke bandı bulunamadı. Her ülkenin kaydında `quote_required_no_comparable_band_found` ve `amount: null` var. Eski 2023 fiyat listesi ve eski indekslenmiş Taç metre fiyatı 2026 fiyatı gibi taşınmadı. Fiyatlar sipariş öncesi yeniden kontrol edilir.

## Doğrulama ve kalan veri boşlukları

Çalıştırma:

```powershell
python -m unittest discover -s tools/perde -p 'test_*.py' -v
python tools/perde/hesap.py tools/perde/ornek-girdi.json
```

Testler beş hesabın sabit sonuçlarını; çekme yönlerini, enin yetmemesini, desen tekrarını, birleşim payının en sayısını artırmasını, iç/dış stor ölçü seçimini, çift düşüm engelini, yanlış birim/sonlu olmayan sayı/red durumlarını ve kaynak referanslarını denetler. Dil testleri kapsam ve tekrarları denetler; dilin doğallığı için otomatik başarı yüzdesi iddia edilmez. 34 metin insan incelemesi içindir; eğitim başlatılmadı.

Boşluklar açık veri olarak teslim edildi: güncel ulusal yaygınlık araştırması; ulusal pencere/denizlik ölçü serileri; bölgesel renk tercihleri; eşdeğer kapsamlı ısmarlama fiyat bandı; ülkelerin tüm yapı tiplerine ait yangın zorunluluk matrisi; seçilmeyen donanımların taşıma/derinlik ölçüleri. Bu alanlarda ilk kullanıcıya kesin cevap vermek yerine soru/yerinde ölçü/teklif gerekir. Eksik ülke verisini benzer ülkenin verisiyle doldurmak yasaktır.

Tam kaynak listesi [perde-kaynaklar.json](veri/perde-kaynaklar.json) içinde; araştırma bulgularının kapsamı orada da korunur. `prepare_data.py`, `dialogue_data.py`, `example_data.py` elle hazırlanmış içeriği deterministik kaydeder; dış API çağrısı veya modelle örnek üretimi yapmaz.
