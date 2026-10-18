# METİN-01 araştırma planı

Durum: PR 1 araştırma taslağı; kurucu yaklaşım 2026-10-18 tarihinde 30 denemeye temel olarak onaylandı.
Erişim tarihi: 2026-10-18. Araştırma ve denemeler ayrıca denetime sunulacak.

## Bu PR'nin sınırı

İş emrinin aşamalar bölümündeki açık parantez esas alınır: ilk iki derleme **fenomenoloji ve malzeme**dir.
Numaralı programın ikinci başlığı olan edebiyat bu PR'de tamamlandı sayılmaz. Edebî eserlerden düşünce
karşılaştırması için yararlanılması, ayrı dünya edebiyatı derlemesinin yerine geçmez.

| Alan | PR 1 | Sonraki aşama için araştırma sorusu |
| --- | --- | --- |
| Fenomenoloji / barınma | 15 birincil metinden seçili bölüm okuması | Aynı ayrıntıya farklı düşünceler nasıl farklı sorular sorar? |
| Nesneyle yaşamak / edebiyat | Başlanmadı, PR 2 | Hafıza anlatısı ile ürüne uydurulmuş geçmiş nasıl ayrılır? |
| Malzeme | 17 teknik/kurumsal kaynak; ilk kart dilimi | Duyu, yüzey işlemi ve kullanım koşulu nasıl ayrılır? |
| Parça / birleşim | Başlanmadı, PR 2 | Motor seçeneğinin bedensel karşılığı ve etkinlik koşulu nedir? |
| Tarzların kökleri / sesleri | Başlanmadı, PR 2 | On tarzı tek sakin sıfat dağarcığına indirmeden nasıl yazılır? |
| Mekân / kullanım anı | Başlanmadı, PR 2 | Senaryo ile gerçek yerleşim bilgisi nasıl ayrılır? |
| Yazı zanaatı | Başlanmadı, PR 2 | Tekrarı azaltırken ayrıntı ve ilişki nasıl korunur? |
| Çok dillilik | Tam derleme başlanmadı, PR 2 | TR ve EN'de aynı karar hangi farklı cümle yapısını ister? |

Her kalan alan için en az 15 doğrulanmış eser hedefi korunur. PR 1'de kullanılan kaynak sayısı diğer
alanların kotasına aktarılmaz. Henüz okunmayan eserler doğrulanmış kaynak listesine katılmaz.

## Okuma ve kanıt yöntemi

Kaynak kaydı eser/kurum, baskı veya çevirmen, erişilen adres, okunan sayfa/bölüm, kendi cümlelerimizle fikir,
AURA ilkesi ve kullanım sınırından oluşur. Sayfasız HTML için bölüm adı kullanılır; hayalî sayfa numarası verilmez.
PDF'de basılı ve fiziksel sayfa ayrılır. Bir kitabın iki bölümü iki kaynak sayılmaz; arama sonuçları kaynak
okuması sayılmaz. Buradaki doğrulama, bağlantı ve belirtilen bölümün okunmasıdır; bütün kitabın tüketildiği
veya bir fiziksel ürünün test edildiği iddiası değildir.

Dış kaynaklardan doğrudan alıntı alınmadı; bütün fikir notları yeniden ifade edildi. İnternette okunabilir
olmak açık lisans anlamına gelmez. Tam kitaplar ve görseller depoya kopyalanmaz. Kurucu belge alıntıları
ayrı, kullanıcı tarafından görevde belirtilen yerel kaynaklardan gelir.

Fenomenoloji başlığı bütün gelenekleri Avrupa fenomenolojisinin alt dalı yapmaz. İlk dilim: Avrupa 3,
Doğu Asya 3, Güney Asya 2, İslam düşüncesi 2, Afrika 2, Amerikalar 3. Bu editoryal gruplama kimliklerin
tümünü temsil etmez. Okyanusya ve başka dillerin eksikliği sonraki genişletmede giderilecek; dünya
düşüncesinin tamamının kapsandığı iddia edilmeyecek. İngilizce çevirilerin ağırlığı da açık bir sınırlılıktır.

Malzeme derlemesindeki koruma kaynaklarının çoğu müze bağlamındadır. Bunlar yaşlanmayı ve belirsizliği
anlamaya yarar; yeni mobilyaya bakım reçetesi veya dayanım sertifikası olarak aktarılmaz. Meslek birliği
ve üretici yayınlarında teknik ayrım kullanılabilir; reklam, çevre veya sağlık üstünlüğü taşınmaz.

## Malzeme kartlarının ilk yarısının hesabı

Sabit referans: `tests/ai-eval/vocab.json`, main `cedd083`. Katalog anahtarları + katalog dışında kalan
malzeme kavramları birlikte sayılır. Aynı kavramın farklı ailelerde tekrarı bir kez sayılır.

| Küme | Toplam | Bu dilimde |
| --- | ---: | ---: |
| WOODS | 9 | 9 |
| STAINS | 12 | 12 |
| FINISHES | 4 | 4 |
| STONES | 8 | 8 |
| METALS | 5 | 5 |
| GLASS | 5 | 5 |
| FIBERS | 9 | 9 |
| Dokumalar (`fabric.weave`) | 7 | 7 |
| Yüzeyler (`surface`, `same` hariç) | 6 | 6 |
| Hasır ve ayna kavramları | 2 | 2 |
| COLORS | 48 | 0 |
| PATTERNS | 11 | 0 |
| SINK_FINISHES | 4 | 0 |
| **Toplam** | **130** | **67** |

67/130, %51,5. Bu sayı motorun bütün parça seçeneklerini kapsama oranı değildir. `polish`, `board`, ayna
biçimleri, malzeme etkinleştiren parça seçenekleri ve bütün geometrik seçenekler PR 2 parça envanterine
ayrıca girecek. `same` yeni malzeme değil, başka slotun etkin malzemesini devralan bağdır. 63 kalan katalog
kartı ve bu bağlantı kuralları tamamlanmadan tam kapsama denmez.

## Onaydan sonra PR 1 denemeleri

On adet gerçek motor tasarımı; altı aileden temsil, malzeme ve tür çeşitliliği. Her biri için üç ayrı
editoryal hareket; TR ve EN örnekleri. Kart kümesinin kendisi özgünlük garantisi değildir: aynı malzemeyi
paylaşan tasarımların oran, parça ve ilişki odağı değişebilir. Aynı tasarımın üç taslağı farklı sıfatlarla
aynı cümlelerin tekrarından oluşmamalı.

Her taslak: `ad`, `tanik` (50–120 kelime), `iz` (tek somut cümle), somut iddialar için tam tasarım yollarını
gösteren `dayanak`, kullanılan kart kimlikleri ve dil. Tasarımdaki pasif varsayılan slotlardan iddia
çıkarılmayacak. `top.surface=stone` iken dolu gelen `top.species=oak`, ahşap tabla kanıtı değildir.

Bu PR'deki dosya bütünlüğü/kapsama kontrolleri PR 2'de istenen anlamsal dayanak denetleyicisi ve rubrik
değildir. Farklı model onayı, kör okuma ve altın küme kurulması sonraki aşamalara aittir; denemelere
başarı puanı, insan onayı veya eğitim uygunluğu uydurulmaz. TASARIM-01, ARAŞTIRMA ve eğitim koşuları beklemede.
