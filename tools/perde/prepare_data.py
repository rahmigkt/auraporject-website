"""Curated PERDE-01 tables. Not a crawler or a dialogue generator."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'knowledge/ev-projesi/veri'
OUT.mkdir(parents=True, exist_ok=True)
DATE = '2026-10-20'


def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


# A source ID identifies a publisher and a concrete document, not a national rule.
SOURCE_ROWS = [
('HEMA', 'HEMA', 'NL', 'https://www.hema.nl/inspiratie/wonen-en-slapen/gordijnen-opmeten', 'Ölçü referansı; tek pile 2, çift 2–2.5, üçlü 2.5–3; zeminden 10 mm.'),
('HEMA-BE', 'HEMA', 'BE', 'https://www.hema.com/nl-be/klantenservice/raamdecoratie/technische-informatie', 'Belçika teknik ürün bilgisi; nüfus yaygınlığı vermez.'),
('IKEA-NL', 'IKEA', 'NL', 'https://www.ikea.com/nl/nl/ideas/raam-opmeten-voor-gordijnen-pubf4dbe0f0/', 'En az 150 mm yan taşma; basit pile 1.5–2, çift 2–2.5; üretici tavsiyesi.'),
('CIERAAD', 'Irene Cieraad', 'NL', 'https://www.researchgate.net/publication/326462092_Dutch_Windows_Female_Virtue_and_Female_Vice', 'Yazarın yüklediği antropoloji bölümü; At Home, 2006. Açık pencerenin tarihsel anlamı; güncel yüzde değildir.'),
('IKEA-BE', 'IKEA', 'BE', 'https://www.ikea.com/be/fr/product-guides/comment-acheter-les-rails-vidga-en-4-etapes-simples-pub48ba9410/', 'VIDGA ray modülü ve en az 150 mm yan taşma.'),
('HEYTENS', 'Heytens', 'BE', 'https://www.heytens.com/be-fr/blog/comment-prendre-mesures-fenetre/', '18.07.2024; ısmarlama perde ve stor, açıklık engellerinin ölçülmesi.'),
('HORN', 'HORNBACH', 'DE', 'https://media.hornbach.de/cmsm/de/soluna-broschuere-l81.pdf', 'Eski ürün broşürü: plise, stor, jaluzi ve ölçü yerleri. Güncel fiyat kaynağı değildir.'),
('IKEA-DE', 'IKEA', 'DE', 'https://www.ikea.com/de/de/files/pdf/a4/f2/a4f2bcc7/bf_leitfaden_fenster_07-2026_online.pdf', '2026 pencere giydirme kılavuzu; ulusal pencere ölçüsü standardı değildir.'),
('LUTZ', 'XXXLutz', 'AT', 'https://www.xxxlutz.at/c/vorhaenge-ausmessen', '200 mm yan taşma; genel 2–3 katsayısı; zemini birkaç noktada ölçme.'),
('IKEA-AT', 'IKEA', 'AT', 'https://www.ikea.com/at/de/ideas/verschiedene-arten-deine-vorhaenge-aufzuhaengen-pub3e877bd0/', 'Başlık bandı ve tünel seçenekleri; ülke tercihi araştırması değildir.'),
('PFISTER', 'Pfister', 'CH', 'https://www.pfister.ch/de/vorhang/messanleitung', '200 mm yan taşma; zeminden 15 mm; isteğe bağlı yığılma 100–200 mm.'),
('PFISTER-SERVICE', 'Pfister', 'CH', 'https://www.pfister.ch/de/services/beratung/vorhang', '2–2.5 katsayısı; ürün fiyat örnekleri. Ismarlama hizmet teklife bağlı.'),
('IKEA-CH', 'IKEA', 'CH', 'https://www.ikea.com/ch/de/customer-service/knowledge/articles/9g47eg95-7cbc-4010-8d7g-2bd2bf6f40d8.html', 'Ürün başlık ve asma seçenekleri.'),
('MONDIAL', 'Mondial Tissus', 'FR', 'https://www.mondialtissus.fr/tutos-et-inspiration/mon-guide-couture/les-tissus-pour-refaire-sa-decoration/quel-tissu-pour-des-rideaux.html', '1.5 veya 2 dolgunluk; üst 100, alt 200, yan toplam 80 mm; yerden 20 mm. Alan ile doğrusal metraj karıştırılmamalı.'),
('IKEA-FR', 'IKEA', 'FR', 'https://www.ikea.com/fr/fr/p/lill-rideaux-filet-2-pieces-blanc-avec-ourlet-pour-tringle-90111980/', 'LILL çift 280×250 cm, €3.99; bu SKU için azami %2 çekme.'),
('JL', 'John Lewis', 'GB', 'https://www.johnlewis.com/buying-guides/curtains-buying-guide', 'Hazır/ısmarlama başlıklar ve astar seçenekleri; fiyatlandırma ürüne bağlı.'),
('DUNELM', 'Dunelm', 'GB', 'https://www.dunelm.com/info/buying-guides/curtain-buying-guide', 'Net/voile, karartma, termal katman, başlık ve pencere biçimine göre seçim.'),
('DIRECT', 'Direct Fabrics', 'GB', 'https://www.direct-fabrics.co.uk/fabric-calculation-for-curtains', 'Boy sayısı ve desen tekrarına yukarı yuvarlama; kaynak örneğinin aritmetiği aynen alınmadı.'),
('DIRECT-WIDTH', 'Direct Fabrics', 'GB', 'https://www.direct-fabrics.co.uk/fabrics/curtain-fabrics', 'Pasco ürün ailesinde 140/280 cm en seçenekleri; ülke standardı değil.'),
('HILLARYS', 'Hillarys', 'IE', 'https://www.hillarys.ie/inspiration/curtains-buying-guide/', '04.09.2026 güncellemesi; başlık/astar ve ölçüye özel hizmet.'),
('IKEA-IE', 'IKEA', 'IE', 'https://www.ikea.com/ie/en/files/pdf/27/0c/270c040b/vidga.pdf', 'VIDGA yerel kılavuzu; markaya ait montaj önerileri.'),
('JYSK', 'JYSK', 'DK', 'https://gardiner.jysk.dk/opmaalingsvejledning', 'İç roller/plise: en küçük açıklık eninden müşteri 10 mm düşer; üretim siparişten tekrar düşmez. Dış roller: en büyük en +100, en büyük boy +80 mm. Kumaş eni kasadan küçüktür.'),
('HEMTEX', 'Hemtex', 'SE', 'https://www.hemtex.se/inspiration/guider/gardinguide/mata-fonster', 'Yerden 20 mm; gerçek askı noktasından boy ölçüsü.'),
('IKEA-SE', 'IKEA', 'SE', 'https://www.ikea.com/se/sv/rooms/living-room/how-to/sa-hanger-du-gardiner-snyggt-pub69fdc421/', '250/300 cm hazır boylar; ulusal pencere boyu değildir.'),
('KID', 'Kid', 'NO', 'https://www.kid.no/inspirasjon/guider/gardinguide', 'Oda, ışık ve katman seçenekleri; Hemtex ile aynı grup, bağımsız karşılaştırma sayılmaz.'),
('KID-MEASURE', 'Kid', 'NO', 'https://www.kid.no/globalassets/kid.no/m2m/maleguider/rullgardiner/ny_maaleguide_rullegardiner.pdf', 'Belirli stor için niş derinliği 40 mm; diğer ürünlere taşınmaz.'),
('IKEA-NO', 'IKEA', 'NO', 'https://www.ikea.com/no/no/rooms/living-room/how-to/vidga-serien-pub989e5c48/', '150 mm yan/üst tavsiyesi; hazır ürün fiyatları.'),
('LEROY-ES', 'Leroy Merlin', 'ES', 'https://www.leroymerlin.es/ideas-y-consejos/paso-a-paso/como-medir-una-ventana-para-tus-cortinas-estores.html', '09.10.2024; iç stor için toplam 10 mm en düşümü; dışta her yanda en az 100 mm; kol/panjur kutusu kontrolü.'),
('CORTINA', 'Cortinadecor', 'ES', 'https://www.cortinadecor.com/info/35/como-medir', 'Ürün bazlı stor, perde ve panjur ölçü yolları.'),
('LEROY-PT', 'Leroy Merlin', 'PT', 'https://www.leroymerlin.pt/bricolage/aprenda-mais/como-instalar-varoes.html', 'Çubuk için en az 150 mm yan taşma; ürün ve duvar kontrolü.'),
('LEROY-IT', 'Leroy Merlin', 'IT', 'https://www.leroymerlin.it/guide-alla-scelta/come-scegliere-tende-a-pacchetto.html', 'Tenda a pacchetto; cam/duvar/tavan ölçüleri birbirinin yerine kullanılmaz.'),
('TAPPARELLA', 'Leroy Merlin', 'IT', 'https://www.leroymerlin.it/guide-alla-scelta/quali-sono-migliori-tapparelle-da-avere-e-come-installarle-passo-passo.html', 'Dış panjur kutusu ve kılavuzları; iç kumaş stor toleransı değildir.'),
('TAC', 'Taç', 'TR', 'https://www.tac.com.tr/aninda-perde', 'Tül, fon, güneşlik ve karartma; ölçüye özel hizmet. Kültürel kullanım oranı vermez.'),
('KOCTAS', 'Koçtaş / satıcı Perde Pendik', 'TR', 'https://www.koctas.com.tr/perde-pendik-tul-perde-kum-desenli-orme-kumas-1-2-5-pileli-orta-pile-ekru/p/5003940557', '2.5 pile belirli SKU; hazır bitmiş ölçüye ikinci kez katsayı uygulanmaz.'),
('SG', 'Silent Gliss', 'product', 'https://www.silentgliss.co.uk/fileadmin/redaktion/contentserv/Images/Web_Partner_Downloads/SGGB/Various_Documents/Wave_-_Curtain_Workroom_Guide.pdf', 'Ağustos 2024, s.5: 80 mm standart glider, 7 pocket: yaklaşık 2.3; derinlik 160 mm, stack 180 mm/metre + uç parça; min açıklık 100 mm.'),
('DAYBREAK', 'Kvadrat', 'product', 'https://www.kvadrat.dk/da-dk/produkter/curtains/7401-daybreak-2', 'Daybreak 2: en 300 cm, 270 g/doğrusal m, döndürülebilir; warp/weft yaklaşık %3/%1; PES FR; 60°C nazik. 90 g/m² türetilir.'),
('DAWN', 'Kvadrat', 'product', 'https://kvadrat-downloadcenter.azurewebsites.net/api/downloadcenter/assets/987399-64ac9ec8/T_5868_STechnical-specifications.pdf', 'Dawn 2 teknik föyü, 3 sayfa: dimout, 300 cm, 780 g/doğrusal m; %2/%0 çekme. ISO105-B02 5–7; düz testte ışık geçirgenliği %0–0.37. Ses yutumu 100 mm boşlukla düz 0.45/D, dalgalı 0.65/C. Oda ses yalıtımı değildir.'),
('BSI-13120', 'BSI', 'safety', 'https://knowledge.bsigroup.com/products/internal-blinds-performance-requirements-including-safety', 'BS EN 13120:2009+A1:2014 ürün standardı; kamu sayfasında current etiketi kontrol edildi.'),
('BBSA', 'BBSA', 'safety', 'https://www.makeitsafe.org.uk/trade/', 'Kordon güvenliği; EN 13120, EN 16433 ve EN 16434 ilişkisi. Kurulum ve ürün testi gerekir.'),
('DIN-16434', 'DIN Media', 'safety', 'https://www.dinmedia.de/en/standard/din-en-16434/188715197', 'İç stor güvenlik cihazlarının test kapsamı; yazılım sertifikası değildir.'),
('BSI-13773', 'BSI', 'fire', 'https://knowledge.bsigroup.com/products/textiles-and-textile-products-burning-behaviour-curtains-and-drapes-classification-scheme', 'EN 13773 sınıflandırması; konutta her perde için otomatik zorunluluk anlamına gelmez.'),
('FR-AM12', 'Légifrance', 'FR', 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000020304496/2021-12-31', 'Erişilen tarihli AM12 sürümü: kapalı merdiven M1, diğer dolaşım ve 50 m² üzeri odalar M2. Tarihsiz güncel bağlantı 403 verdi; yürürlük teyidi yapılmadı. Uygulama onayı değildir.'),
('MONDIAL-FABRIC', 'Mondial Tissus', 'FR', 'https://www.mondialtissus.fr/tissus/rideaux-et-voilages-au-metre/rideaux-au-metre.html', 'Keten, pamuk, kadife ve astar seçenekleri; lif adı tek başına karartma ya da bakım sertifikası değil.'),
('UK-FIRE', 'UK Government', 'GB', 'https://www.gov.uk/government/publications/fire-safety-risk-assessment-sleeping-accommodation/fire-safety-risk-assessment-sleeping-accommodation-accessible', 'Uyuma amaçlı ticari tesislerde risk değerlendirmesi; BS 5867-2 bağlamı. Özel konuta doğrudan aktarılmaz.'),
]
sources = {k:dict(publisher=p, scope=s, url=u, checked=DATE, finding=f) for k,p,s,u,f in SOURCE_ROWS}

# Local retail observations, NOT statistically sampled country price bands.
prices = {
 'DE':('EUR','https://www.ikea.com/de/de/p/lill-gardinenstore-2-schals-weiss-mit-tunnelsaum-90111980/', [('LILL',3.50,2,[280,250])]),
 'BE':('EUR','https://www.ikea.com/be/fr/cat/voilages-700221/', [('HILDRUN',9.99,2,[145,300]),('GJERTRUD',29.99,2,[145,300])]),
 'NL':('EUR','https://www.ikea.com/nl/nl/cat/gordijnen-10700/', [('BENGTA',9.99,1,[210,300]),('GINSTMOTT',24.99,2,[145,300])]),
 'AT':('EUR','https://www.ikea.com/at/de/cat/vorhaenge-10700/', [('LILL',3.99,2,[280,250]),('STOCKHOLM 2025',59.99,1,[300,300])]),
 'CH':('CHF','https://www.pfister.ch/de/services/beratung/vorhang', [('Isola',19.95,None,None),('Bonne Nuit regular',99.95,None,None)]),
 'FR':('EUR',sources['IKEA-FR']['url'], [('LILL',3.99,2,[280,250])]),
 'GB':('GBP','https://www.ikea.com/gb/en/cat/curtains-10700/', [('BENGTA',12,1,[210,250]),('GINSTMOTT',22,2,[145,250])]),
 'IE':('EUR','https://www.ikea.com/ie/en/cat/curtains-10700/', [('BENGTA',13,1,[210,250]),('GINSTMOTT',22,2,[145,250])]),
 'DK':('DKK','https://www.ikea.com/dk/da/cat/gardiner-10700/', [('BENGTA',99,1,[210,250]),('SANELA',449,2,[140,250])]),
 'SE':('SEK','https://www.ikea.com/se/sv/cat/gardiner-10700/', [('BENGTA',129,1,[210,250]),('STENFRÖ',199,2,[145,250])]),
 'NO':('NOK',sources['IKEA-NO']['url'], [('LILL',65,2,[280,250]),('DYTÅG',995,2,[145,300])]),
 'ES':('EUR','https://www.ikea.com/es/es/cat/cortinas-10700/', [('LILL sale to 2026-12-31 / stock',4.99,2,[280,300]),('GINSTMOTT',24.99,2,[145,300])]),
 'PT':('EUR','https://www.ikea.com/pt/pt/p/lill-cortinados-rede-par-branco-com-bolsa-para-varao-10070262/', [('LILL',4.99,2,[280,300])]),
 'IT':('EUR','https://www.ikea.com/it/it/p/lill-tenda-a-rete-2-teli-bianco-con-canale-per-bastone-10070262/', [('LILL',4.95,2,[280,300])]),
 'TR':('TRY','https://www.tac.com.tr/perde-hazir-perde-tul-perde', [('Taç Şerit',2725,None,[250,260]),('Taç Lecino',2905,None,[250,260])])
}
for c,(_,u,_) in prices.items():
    sources['PRICE-'+c] = dict(publisher='Taç' if c=='TR' else ('Pfister' if c=='CH' else 'IKEA'),scope=c,url=u,checked=DATE,finding='Tarih damgalı hazır ürün örnekleri; piyasa alt/üst sınırı veya teklif değil. Paket ve ölçüyle birlikte okunur.')
write('perde-kaynaklar.json', dict(schema_version='1.0', checked=DATE, sources=sources))

types = ['drape','sheer','blackout','roller','zebra','roman','pleated','venetian','vertical','cafe','panel']
translations = {
 'tr':['fon perde','tül','karartma perde','stor','zebra stor','Roma perde','plise','jaluzi','dikey perde','kafe perdesi','panel perde'],
 'en':['drape / curtain','sheer / voile / net','blackout curtain','roller blind','day and night blind','Roman blind','pleated blind','Venetian blind','vertical blind','café curtain','panel blind'],
 'nl':['overgordijn','vitrage / inbetween','verduisterend gordijn','rolgordijn','duo rolgordijn','vouwgordijn','plisségordijn','jaloezie','lamellen','café gordijn','paneelgordijn'],
 'fr':['rideau','voilage / vitrage','rideau occultant','store enrouleur','store jour-nuit','store bateau','store plissé','store vénitien','store à bandes verticales','brise-bise','panneau japonais'],
 'de':['Vorhang','Gardine / Store','Verdunkelungsvorhang','Rollo','Doppelrollo','Raffrollo','Plissee','Jalousie','Lamellenvorhang','Scheibengardine','Flächenvorhang'],
 'da':['gardin','tyndt gardin / netgardin','mørklægningsgardin','rullegardin','dobbelt rullegardin','foldegardin','plisségardin','persienne','lamelgardin','cafégardin','panelgardin'],
 'sv':['gardin','skir gardin','mörkläggningsgardin','rullgardin','duorullgardin','hissgardin','plisségardin','persienn','lamellgardin','cafégardin','panelgardin'],
 'no':['gardin','tynn gardin','mørkleggingsgardin','rullegardin','duorullegardin','liftgardin','plisségardin','persienne','lamellgardin','kafégardin','panelgardin'],
 'es':['cortina','visillo','cortina opaca','estor enrollable','estor noche y día','estor plegable','estor plisado','persiana veneciana','cortina vertical','cortina de café','panel japonés'],
 'pt':['cortinado','cortina transparente','cortinado blackout','estore de rolo','estore dia e noite','estore romano','estore plissado','estore veneziano','estore vertical','cortina de café','painel japonês'],
 'it':['tenda','tenda a velo','tenda oscurante','tenda a rullo','tenda giorno e notte','tenda a pacchetto','tenda plissettata','veneziana','tenda verticale','tendina a vetro','pannello giapponese']
}
language_sources={'tr':['TAC','KOCTAS'],'en':['JL','DUNELM','HILLARYS'],'nl':['HEMA','IKEA-NL'],'fr':['HEYTENS','MONDIAL'],'de':['HORN','LUTZ','PFISTER'],'da':['JYSK','PRICE-DK'],'sv':['HEMTEX','IKEA-SE'],'no':['KID','IKEA-NO'],'es':['LEROY-ES','CORTINA'],'pt':['LEROY-PT','PRICE-PT'],'it':['LEROY-IT','TAPPARELLA']}
dictionary={lang:{t:dict(name=n,status='editorial_translation_check_selected_vendor_term',source_ids=language_sources[lang]) for t,n in zip(types,names)} for lang,names in translations.items()}

rows=[
('BE','Belçika',['nl','fr','de'],['IKEA-BE','HEYTENS'],'Vitrage/voilage yerel kataloglarda bulunuyor. Flaman, Brüksel ve Valon bölgeleri arasında kullanım sıklığını karşılaştıran veri bulunamadı.','Panjur, bahçe kapısı ve pencere kolunu mevcut evden sor.'),
('NL','Hollanda',['nl'],['HEMA','IKEA-NL'],'Cieraad açık pencerelerin tarihsel toplumsal anlamını tartışır; perdesizliği bütün Hollandalılara mal etmek yanlış. Kullanıcının açık pencere tercihine saygı duy.','Sokak kotu ve komşu görüşünü sor; tüm camı kapatmak zorunlu değil.'),
('DE','Almanya',['de'],['HORN','IKEA-DE'],'Gardine, Rollo ve Plissee seçenekleri ürün kaynaklarında var; hangisinin ülke çapında daha sık olduğu doğrulanmadı.','İçe açılan/vasistas kanadın hareketi ve cam çıtasına bağlantı olanağı ölçülecek.'),
('AT','Avusturya',['de'],['LUTZ','IKEA-AT'],'Lutz genel 2–3 dolgunluk önerir; bu bir ulusal başlık tercihi değildir.','Radyatör ve kanat açılımı uzunca perdenin önüne geçebilir.'),
('CH','İsviçre',['de','fr','it'],['PFISTER','IKEA-CH'],'Pfister ölçü tavsiyeleri yerel hizmete ait; kantonlar arasında zevk veya kullanım yüzdesi çıkarılmaz.','Tavan rayı varsa yeni delik açmadan önce profil ve glider uyumunu belirle.'),
('FR','Fransa',['fr'],['MONDIAL','IKEA-FR'],'Voilage, rideau ve store bateau yerel seçeneklerdir; brise-bise her Fransız mutfağının varsayılanı değildir.','Fransız balkonunda kapının açılması, dış kepenk ve radyatör ayrı ölçülür.'),
('GB','Birleşik Krallık',['en'],['JL','DUNELM'],'Net/voile ve astarlı curtain farklı ihtiyaçlara hizmet eder; bay window bir ölçü durumu, ulusal yaygınlık sayısı değildir.','Cumba rayı tek düz açıklık gibi hesaplanmaz; köşeler ve dönüşler ölçülür.'),
('IE','İrlanda',['en'],['HILLARYS','IKEA-IE'],'Hillarys başlık ve astar alternatiflerini sunar; ülke geneline ait kullanım oranı yok.','Hava sızıntısı ile camdan geçen ışığı ayır; termal astar onarım yerine geçmez.'),
('DK','Danimarka',['da'],['JYSK','PRICE-DK'],'JYSK folde/plisse/rulle alternatifleri sunuyor; açık renk sevgisini ulusal veri diye kodlamıyoruz.','Gündüz ışığını ne kadar korumak ve gece ne kadar kapatmak istediğini ayrı sor.'),
('SE','İsveç',['sv'],['HEMTEX','IKEA-SE'],'Hemtex ve IKEA oda/ışık seçenekleri veriyor; hazır 250/300 cm boylar standart pencere boyu değil.','Yaz sabahı uykusu bir kullanıcı gereksinimidir; enleme göre otomatik perde seçilmez.'),
('NO','Norveç',['no'],['KID','IKEA-NO'],'Kid ile Hemtex aynı grupta; bağımsız karşılaştırma için IKEA kullanıldı. Kış ışığı ve yaz uykusu kullanıcıya sorulur.','Rullgardin niş derinliği yalnız seçilen ürünün föyünden alınır.'),
('ES','İspanya',['es'],['LEROY-ES','CORTINA'],'Persiana dış panjur ile estor iç stor ayrılır; her evde işlevsel dış panjur olduğu varsayılmaz.','Panjur kutusu ve kol çıkıntısı ray/stor yerini değiştirebilir.'),
('PT','Portekiz',['pt'],['LEROY-PT','PRICE-PT'],'Cortinado ve estore seçenekleri var; kıyı/şehir zevkleri için karşılaştırmalı kültür verisi bulunamadı.','Deniz ışığı gibi genellemeler yerine yön, kamaşma ve mevcut estore durumu sorulur.'),
('IT','İtalya',['it'],['LEROY-IT','PRICE-IT'],'Tapparella dış panjur, tenda a rullo iç perdedir. Birinin ölçü toleransı diğerine uygulanmaz.','Panjur kutusu, balkon kapısı ve pacchetto toplama yüksekliği kontrol edilir.'),
('TR','Türkiye',['tr'],['TAC','KOCTAS'],'Tül/fon/güneşlik yerel ürün kaynaklarında birlikte yer alır. Tül+fon uygun bir başlangıç önerisi olabilir; zorunlu kültürel tercih değildir.','Kartonpiyer nişi, korniş sırası, petek ve balkon kapısı ölçülecek.')]
rooms={
 'salon':dict(options=['sheer','drape','none'],condition='Gündüz görüşü, gece mahremiyeti ve açık pencere tercihi sorulur.'),
 'yatak':dict(options=['blackout','drape'],condition='Uyku için karanlık istenirse kenar sızıntısı da çözülür; tül tek başına yeterli değil.'),
 'mutfak':dict(options=['roller','venetian','cafe','none'],condition='Ocak/ısı kaynağı, yağ ve açılan kanat varsa uzaklık ve temizlenebilirlik değerlendirilir.'),
 'banyo':dict(options=['pleated','roller','none'],condition='Nem, havalandırma, gece görüşü ve ürünün ıslak hacim uygunluğu doğrulanır.'),
 'cocuk':dict(options=['blackout','roller'],condition='Kordonsuz seçenek öncelikli; yatak/tırmanılabilir eşya ve güvenli kurulum kontrolü gerekir.')}
countries={}
type_rooms={'drape':['salon','yatak'],'sheer':['salon'],'blackout':['yatak','cocuk'],'roller':['yatak','mutfak','banyo'],'zebra':['salon'],'roman':['salon','yatak'],'pleated':['salon','banyo'],'venetian':['mutfak','salon'],'vertical':['salon'],'cafe':['mutfak'],'panel':['salon']}
for code,name,langs,refs,culture,window in rows:
    price=None
    if code in prices:
        currency,url,items=prices[code]
        price=dict(status='observed_sku_sample_not_market_band',date=DATE,currency=currency,source_ids=['PRICE-'+code],
                   observed_price_span=[min(x[1] for x in items),max(x[1] for x in items)],
                   items=[dict(sku=n,price=v,pack_panels=p,panel_dimensions_cm=d) for n,v,p,d in items])
    countries[code]=dict(name=name,locales=langs,source_ids=refs,culture=dict(summary=culture,prevalence='source_not_found',quantified_prevalence=None),
        windows=dict(site_questions=window,national_standard_width_height_mm=None,national_standard_sill_height_mm=None,status='source_not_found_measure_actual_opening'),
        rooms={r:dict(**v,status='AURA_conditional_proposal',source_ids=refs) for r,v in rooms.items()},
        types={t:dict(commonness='source_not_found',rooms=type_rooms[t],status='AURA_conditional_proposal_not_observed_habit',source_ids=refs) for t in types},
        headings_mounts=dict(national_preference='source_not_found',instruction='Ülke değil seçilen ürün ve askı noktası belirler.',source_ids=refs),
        aesthetics=dict(national_colour_or_pattern_preference='source_not_found',proposal='Duvar ve zeminden renk örneği al; aynı alt tonu sakin bir bağ için, kontrollü kontrastı vurgu için kullanıcıya göster. Gün/gece numune kontrolü yap.',status='AURA_proposal_not_country_trend'),
        prices=dict(ready=price or dict(status='source_not_found',note='DE kategori erişimi başarısız; eski fiyat taşınmadı.'),made_to_measure=dict(status='quote_required_no_comparable_band_found',amount=None,source_ids=refs)),
        fire=dict(domestic_blanket_requirement='not_established',public_building='local_project_fire_review_required',source_ids=['BSI-13773']+(['FR-AM12'] if code=='FR' else ['UK-FIRE'] if code=='GB' else [])))
countries['BE']['regions']={r:dict(locales=l,prevalence='source_not_found',difference_from_other_regions='not_established',source_ids=['HEMA-BE','HEYTENS','IKEA-BE']) for r,l in [('VLG',['nl']),('BRU',['fr','nl']),('WAL',['fr','de'])]}
countries['NL']['culture']['source_ids']=['CIERAAD','HEMA','IKEA-NL']
write('perde-kulturu.json',dict(schema_version='1.0',checked=DATE,policy='Vatandaşlıktan zevk, ev ölçüsü veya mahremiyet tercihi çıkarılmaz. unknown değer öneriyle doldurulmaz.',names=dictionary,countries=countries))

headings={
 'single':([1.5,2],['HEMA','IKEA-NL']), 'double':([2,2.5],['HEMA','IKEA-NL']),
 'triple':([2.5,3],['HEMA']), 'wave':([2.1,2.3],['SG']),
 'pencil':([1.5,2.5],['JL','DUNELM']), 'eyelet':([1.5,2.5],['JL','DUNELM']),
 'rings':([1.5,2.5],['IKEA-CH','IKEA-AT']),
 'rod_pocket':([1.5,2.5],['IKEA-AT']), 'velcro':([1,1],['LEROY-IT'])}
headings={k:dict(estimation_range=v,status='source_range' if k in ('single','double','triple') else 'AURA_estimation_envelope_confirm_workroom',source_ids=s,production_fullness='selected_hardware_and_workroom_required') for k,(v,s) in headings.items()}
write('perde-hesap.json',dict(schema_version='1.0',unit='mm',headings=headings,
    sewing_profiles={
      'mondial':dict(top_mm=100,bottom_mm=200,side_each_mm=40,join_each_edge_mm=20,status='mixed_source_and_proposal',source_ids=['MONDIAL'],note='Üst/alt/yan kaynaklı; birleşimde her kenar 20 mm AURA önerisi, atölye onayı ister.'),
      'hema':dict(top_mm=100,bottom_mm=100,side_each_mm=40,join_each_edge_mm=20,status='mixed_source_and_proposal',source_ids=['HEMA','MONDIAL'],note='Üst/alt HEMA; yan Mondial; birleşim 20 mm öneri. Karma ön tahmin profili.')},
    mount_profiles={
      'ikea_150':dict(side_extension_mm=150,above_window_mm=150,status='manufacturer_guidance_not_country_rule',source_ids=['IKEA-NL','IKEA-NO']),
      'lutz_200':dict(side_extension_mm=200,above_window_mm=None,status='manufacturer_guidance_not_country_rule',source_ids=['LUTZ']),
      'pfister_200':dict(side_extension_mm=200,above_window_mm=None,status='manufacturer_guidance_not_country_rule',source_ids=['PFISTER'])},
    floor_gaps=[dict(value_mm=10,source_ids=['HEMA']),dict(value_mm=15,source_ids=['PFISTER']),dict(value_mm=20,source_ids=['MONDIAL','HEMTEX'])],
    blind_profiles={
      'jysk_recess_roller':dict(mount='recess',deduct_width_mm=10,deduct_height_mm=0,status='raw_opening_to_order_then_no_factory_deduction',source_ids=['JYSK']),
      'jysk_outside_roller':dict(mount='outside',deduct_width_mm=-100,deduct_height_mm=-80,status='manufacturer_max_opening_plus_overlap',source_ids=['JYSK']),
      'leroy_es_recess_width':dict(mount='recess',deduct_width_mm=10,deduct_height_mm=0,status='width_guidance_height_no_extra_deduction_proposal',source_ids=['LEROY-ES'],note='Yalnız genel en ön tahmini; son boy ve mekanizma üretici onayı ister.')},
    exterior_blind=dict(side_extension_mm=100,status='manufacturer_minimum_not_universal',source_ids=['LEROY-ES'],order_dimensions='selected_product_required'),
    puddle=dict(extra_drop_range_mm=[100,200],status='manufacturer_style_option_not_floor_clearance',source_ids=['PFISTER'],calculator_support=False,note='Çocuk, robot süpürge, dolaşım yolu ve nemli hacimde ayrıca değerlendirilir.'),
    fabric_rolls=[dict(width_mm=1400,source_ids=['DIRECT-WIDTH']),dict(width_mm=2800,source_ids=['DIRECT-WIDTH']),dict(width_mm=3000,source_ids=['DAYBREAK'])],
    fabric_samples=[dict(id='daybreak2',composition='100% polyester FR',opacity='sheer',width_mm=3000,rotatable=True,
       weight=dict(value=270,unit='g/linear_m'),derived_weight=dict(value=90,unit='g/m2',formula='270 / 3'),shrink_warp=0.03,shrink_weft=0.01,
       care='60°C nazik; ağartma/kurutma makinesi yok; ütü azami 150°C; güncel renk/SKU etiketini kontrol et.',
       lightfastness=None,visible_transmission=None,acoustic_numeric_result=None,source_ids=['DAYBREAK'],
       fire='Üretici sertifika bağlantıları ayrı kapsamları temsil eder; B1, M1, EN13773 sınıf1 ve BS5867-2 typeB birbirinin yerine geçmez.'),
       dict(id='dawn2',composition='100% polyester FR',opacity='dimout',width_mm=3000,rotatable=None,
       weight=dict(value=780,unit='g/linear_m'),derived_weight=dict(value=260,unit='g/m2',formula='780 / 3'),
       shrink_warp=0.02,shrink_weft=0,lightfastness=dict(range=[5,7],test='ISO 105-B02'),
       visible_transmission=dict(percent_range=[0,0.37],test='DIN EN 410',condition='flat_state_colour_range_not_installed_room'),
       sound_absorption=dict(airgap_mm=100,flat=dict(value=0.45,classification='D'),waved=dict(value=0.65,classification='C'),test='EN ISO 354',note='Ses geçiş kaybı/dB yalıtımı değildir.'),
       care='60°C azami yıkama; asarak kurutma; güncel etiket esas.',source_ids=['DAWN'])],
    fabric_taxonomy=[dict(family=k,grammage_g_m2=None,shrink=None,care='SKU etiketinden alınır; lif adına göre sıcaklık veya çekme atanmaz.',
       opacity='construction_and_lining_dependent',status='qualitative_material_option',source_ids=['MONDIAL-FABRIC']) for k in ['linen','cotton','polyester','velvet']],
    performance_policy=dict(thermal_saving_percent=None,sound_isolation_db=None,
       blackout='Kumaşın karartması odada sıfır ışık garantisi değil; yan/üst/alt kaçak ve ray-mekanizma birlikte değerlendirilir.',
       lightfastness='ISO105-B02 sayısı yoksa unknown; renk/SKU ve test standardı birlikte saklanır.',
       source_ids=['DAWN','DUNELM','DAYBREAK']),
    safety=dict(default='cordless_preferred_not_automatically_certified',source_ids=['BSI-13120','BBSA','DIN-16434'],
      mounting_load_kg=None,fixing_spacing_mm=None,cord_safe_length_mm=None,
      missing='Ürün test belgesi, mekanizma, duvar/tavan malzemesi, dübel taşıması ve çocuk erişimi bilinmeden güvenli kurulum onayı üretilmez.'),
    formulas=dict(normal='n=max(1,ceil((rail*fullness/panels+2*side-2*join)/(usable_width*(1-shrink_weft)-2*join))); drops=n*panels; cut=ceil_to_repeat((drop+top+bottom)/(1-shrink_warp)); metres=drops*cut/1000',
      railroad='cut_drop=(drop+top+bottom)/(1-shrink_weft) <= usable_width; metres=(rail*fullness+2*panels*side)/(1-shrink_warp)/1000',
      limitation='Payların tamamı da çekme telafisine dahil edilir; ön yıkama yapıldıysa yalnız belgelendirilmiş kalan çekme girilir. Kesim boyu mm, toplam sipariş doğrusal m olarak yukarı yuvarlanır; desen faz başlangıcı ayrı rezerve edilir.')))

write('perde-gorunum.json',dict(schema_version='1.0',unit='mm',status='renderer_proposals_not_photometric_or_manufacturing_certification',
 coordinate_system=dict(x='ray boyunca',y='odaya doğru',z='zeminden yukarı',closed_fraction='0 fully raised/open; 1 fully down/closed'),
 curtain_motion=dict(split='panel_count=2: iki panel karşı yönlere; panel_count=1: kullanıcı sağ/sol seçer',
     closed='Toplam örtü ray eni; R*f düz kumaş kıvrımlarda korunur.',
     open='Panel hacmi park bölgesinde kalır; sıfır ene sıkıştırılmaz. Wave stack eni kaynak tablosundan, uç parça SKUdan alınır; diğer başlıklarda ölçülmüş paket eni istenir.',
     returned_edges='Yan dönüş ve merkez örtüşme ölçüsü bilinmiyorsa null; imalat eni diye varsayılmaz.',status='AURA_geometry_contract'),
 headings={k:dict(fold_model='alternating_soft_folds' if k!='wave' else 'smooth_periodic_S',fold_count='ceil(flat_width / proposed_fold_pitch_mm)',
     proposed_fold_pitch_mm=120,proposed_depth_mm=60,status='AURA_visual_proposal',source_ids=s['source_ids']) for k,s in headings.items()},
 wave_hardware=dict(carrier_spacing_mm=80,pockets=7,approx_fullness=2.3,front_back_depth_mm=160,minimum_clearance_mm=100,
     stack_width_mm_per_m_track=180,end_piece_allowance_mm=None,glider='standard_not_roller',source_ids=['SG'],note='Tablo s.5; en sona eklenen uç parça ayrıca seçilir. Sinüs kıvrım sayısı kanca siparişi değildir.'),
 materials={k:dict(shader_opacity=v,roughness=0.9,status='AURA_shader_proposal_not_measured_transmittance',drape='flexible' if k=='sheer' else 'weighted',source_ids=['DAYBREAK','DUNELM']) for k,v in [('sheer',0.25),('dimout',0.8),('blackout',1)]},
 hardware=dict(rail=dict(shape='rounded_rectangle',width_mm=20,height_mm=15,status='AURA_placeholder_replace_by_SKU'),rod=dict(shape='circle',diameter_mm=28,status='AURA_placeholder_replace_by_SKU'),load_capacity_kg=None),
 states=dict(roller=dict(down='flat rectangular cloth under cassette',up='cloth wound onto tube; cassette remains',fabric_width='mechanism_width minus SKU offsets, unknown until selected'),
     pleated=dict(down='accordion pleats between rails',up='compressed stack; never zero height',proposed_pleat_pitch_mm=20,status='AURA_visual_proposal'),
     roman=dict(down='flat cloth with horizontal batten lines',up='stacked horizontal folds below headrail',proposed_batten_spacing_mm=250,status='AURA_visual_proposal')),
 transitions='Açık/kapalı sınırları arasında kesintisiz ölçekle; kumaş yan açıklıkları ve toplanma hacmi koldan, kanattan ve tavandan geçmesin.',
 references=[dict(source_id=k,url=sources[k]['url']) for k in ['SG','JYSK','LEROY-IT','DAYBREAK','JL']],
 not_supported='Ölçülmemiş gerçek mekanizma, sertifikalı ışık/ses/ısı simülasyonu ve imalat kıvrımı bu görsel yaklaşımın dışında.'))


if __name__ == '__main__':
    print('Curated tables written to', OUT)
