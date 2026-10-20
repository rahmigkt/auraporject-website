# Türkiye konut kurgusu — EV-QWEN-00B

20 Ekim 2026. Sentetik araştırma; uygulama, taşıyıcı veya mevzuat onayı değildir.
Avrupa turu EV-QWEN-00C'ye başlanmadı. Kaynak planı, görseli, koordinatı veya
veri seti indirilmedi; aşağıdaki programlar tarafımızdan yazılmış önerilerdir.

## Kaynaklar ve kullanım sınırı

| Kimlik | Birincil kaynak | İncelenen bilgi | Lisans / bu teslimde kullanım |
|---|---|---|---|
| S1 | [Sev ve Özgen, Ataşehir konut mekân standartları](https://dergipark.org.tr/en/pub/tasarimkuram/article/240829) | Apartman mekân alanları ve ıslak hacim ilişkileri, sınırlı alan kullanımı | Makale sayfasında açık yeniden kullanım lisansı saptanmadı. Yalnız özet okundu; plan ve tablo aktarılmadı. |
| S2 | [Öztürk, konut tipolojilerinde iç mekân yerleşimi](https://dergipark.org.tr/tr/pub/tdad/article/1881082) | Türkiye'de dört tipoloji üzerinden dolaşım, yoğunluk ve esneklik değerlendirmesi | Sayfada CC BY-NC 4.0. Ticari eğitim verisine içerik alınmadı; yalnız araştırma referansı. |
| S3 | [NKBA Kitchen Planning Guidelines](https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf) | Çalışma üçgeni ve tezgâh yanında 36 inç yürüme aralığı | NKBA telifli rehber; görseller ve planlar kopyalanmadı. Ölçünün Türk mevzuatı olduğu iddia edilmez. |
| S4 | [OR-Tools CP-SAT resmî dokümanı](https://developers.google.com/optimization/cp/cp_solver) ve [lisans](https://github.com/google/or-tools/blob/stable/LICENSE) | Tamsayı değişkenlerle kısıt çözme ve çözüm durumu | Apache-2.0 kod. Bu teslimde bağımlılık eklenmedi. |
| S5 | [GEOS lisansı](https://github.com/libgeos/geos/blob/main/COPYING) | Shapely altındaki geometri motorunun dağıtım yükümlülüğü | LGPL-2.1; mevcut Python bağımlılığı üzerinden kullanılır. Shapely BSD-3-Clause lisansı bu alt bağımlılığın yükümlülüğünü ortadan kaldırmaz. |

S1/S2, her aşağıdaki özel kurgu için tek tek ampirik sıklık kanıtı değildir.
“Yaygınlık” oranı hesaplanmadı. Şematik ilişkiler, bu kaynakların araştırma
çerçevesinden hareketle **öneri** olarak yazılmıştır; kopya plan etiketleri değildir.
Kaynaklandırılmamış uygulama eşikleri özellikle öneri olarak işaretlidir.

## Kurgu kartları

Makine karşılığı `veri/kurgu-tipleri.json` dosyasındadır. Alanlar net m² hedef
aralığıdır; hepsi tasarım önerisidir. Ortak öneriler: antre 4–10, salon 20–36,
yatak odası 11–18, mutfak 8–16, banyo 3–7, WC 1,5–3, balkon 4–10.
S1 bu kesin aralıkları onaylayan bir standart olarak kullanılmaz.

| Tip | Program / bölgeler | Önerilen bağlantı grafı | Cephe / sınır ve özel kontrol |
|---|---|---|---|
| Kapalı mutfak | Gündüz salon, gece yatak kanadı, ortak servis çekirdeği | dış → antre → {salon, mutfak, gece holü}; gece holü → yataklar; salon → balkon | Yatak odasına salondan geçilmez. Mutfak kapısı ve kokunun ayrılması. |
| Açık mutfak | Gündüz salon+yemek+mutfak, ayrı gece kanadı | antre → {yaşam, gece holü}; mutfak ↔ yaşam geniş açıklık | “Açık” yalnız isim değil gerçek açıklıktır. Tezgâh/oturma geçişi ölçülür. |
| Yarı açık | Gündüz alanında kapanabilen mutfak | salon ↔ sürgülü/geniş eşik ↔ mutfak | Sürgülü açıklık ve kapalı durumda dolaşım ayrı değerlendirilir. |
| Hol merkezli | Kompakt dağılım holü çevresinde odalar | dış → T biçimli hol → {salon, mutfak, banyo, yataklar} | Boydan boya koridor yerine kısa, dallanan hol. Prototip iki yatak odasıyla sınırlı. |
| Köşe daire | İki komşu cepheye yayılan gündüz/gece | antre → gündüz ve gece dalları; salon → balkon | İki cephe; çapraz havalandırma ayrıca analiz ister. Prototipte kırık dış köşe örnekleri. |
| Çift cephe / ara daire | Giriş yanında servis, iki uçta yaşam/gece | antre → dağılım → iki farklı cephe kanadı | Komşu parsellerdeki sağır cepheler açıkça tanımlanmalı. Prototip henüz bunu kısıtlamıyor. |
| Derin / tek cephe | Cephede yaşama/yatak; içeride servis | antre → hol → cephe odaları; ıslaklar → şaft; derin kısım → aydınlık | Şaft, aydınlık ve tek cephe engeli geometrik olarak henüz çözülmedi. Mevcut örnekler araştırma yer tutucusudur; bu tip için onay adayı sayılmaz. |
| Dubleks | Alt katta gündüz, üstte gece | giriş holü → salon/mutfak/merdiven; merdiven → üst hol → yataklar | Üst üste merdiven, gerçek döşeme boşluğu, ıslakların düşey örtüşmesi. Galeri ayrı açıklık/koruma kontrolü ister. |
| Müstakil | Sundurma/rüzgârlık → gündüz; üst katta gece | dış → rüzgârlık → antre; salon → bahçe/teras; merdiven → üst hol | Parsel ve çekme mesafesi yerel imar verisinden gelir. Bodrum/çatı ve sundurma henüz çözücüde yok. |
| L / avlulu | Gündüz ve gece iki kanat; arada dış mekân | antre → iki kanat; yaşam → bahçe/avlu | L çentiği, iç avlu ve U plan aynı değildir. Prototip L köşe çentiğidir; gerçek çevrili avlu/U henüz yok. |

Ebeveyn banyosu için yatak → özel banyo; bu banyo diğer odaların dolaşım yolu
olamaz. Kiler için mutfak → kiler; mutfak balkonu için mutfak → balkon.
Bu iki bağlantı, mevcut örnek kataloğunda sistematik sağlanmış değildir.
Tek cephede çok yatak odası talebi, cephe uzunluğu yetmiyorsa netleştirilmelidir.

## Yöntem seçimi ve ölçülen hız

| Yöntem | Lisans / bağımlılık | Güç / sınır | Bu tur |
|---|---|---|---|
| Dilimleme ağacı ve bölge araması | Özgün Python, mevcut repo koşulları; Shapely/GEOS | Deterministik, düşük kurulum yükü; bitişiklik ve boşluklarda sınırlı arama uzayı | Uygulandı: bağımsız satır bölmeleri, servis çekirdeği, parçalı hol ve ayrı kompakt T-hol. Sonuçlar v0.2 doğrulayıcıdan geçirilir. |
| Graf → kabarcık → ızgara | Özgün algoritma yazılabilir; tek standart kütüphane seçilmedi | Serbest ilişkiler daha kolay; çakışmasız sınır/kapı geometrisine dönüşüm ayrıca çözülmeli | Uygulanmadı; hız sayısı yok. |
| OR-Tools CP-SAT | Apache-2.0 | Ayrık konum, çakışmama ve komşuluk kısıtları açık; doğrusal olmayan gün ışığı ve dolaşım ayrıca modellenmeli | Kurulmadı/koşturulmadı; hız karşılaştırması uydurulmadı. Genel kurgu çeşitliliği yetmezse sonraki tercih. |

Gerçek uçtan uca süre manifestte bulunur. Henüz üç yöntemin karşılaştırmalı
benchmark'ı yoktur; seçim kurulum ve deterministik doğrulama gerekçesiyledir.
6 örnek/tip, “tip başına onlarca topoloji” hedefini kanıtlamaz. Geometrik geçerlilik
ve mimari inandırıcılık ayrı tutulur; eğitim kapısı açılmaz.

## Kalite kriterleri

`veri/kalite-kriterleri.json`, kullanılan bütün sayısal eşiklerin kaynak veya
öneri statüsünü içerir. Mobilya testi 2B muhafazakâr dikdörtgen sığdırmadır;
kapı kanadı, kolon, gerçek ürün ve erişilebilirlik kontrolünün yerine geçmez.
Skor sekiz öneri kontrolünün eşit ağırlıklı özeti; eğitim için kabul eşiği değildir.
Islak çekirdek uzaklığı gerçek boru güzergâhı/şaft hesabı değildir.
