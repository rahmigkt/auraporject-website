# Codex iş emri önerisi — METİN-01 (2. sürüm): AURA'nın sesi — binlerce tasarım için tanıklık eden metinler

Hazırlayan: denetçi (Claude), 2026-10-18. Önceki sürümün yerine geçer. **Öncelikli iş.**

## Ne yapıyoruz, doğru anlamak için

AURA malzeme ya da mobilya satan bir site değil. Her tasarım, insanın birlikte yaşayacağı bir **tanık**tır; metin
onu tanıtmaz, onunla kurulacak ilişkiyi açar. Stüdyo onlarca tarzda, binlerce farklı tasarım üretiyor; her biri
kendine ait, doğru ve güçlü bir metni hak ediyor. Karar sahibinin yazdığı birkaç yüz kelime bunu tek başına
taşıyamaz ve taklit edilecek bir şablon da değildir. O metinler **kurucu metin**dir: AURA'nın fenomenolojik
yaklaşımının — nesneyi bedenle, mekânla, zamanla ve sessizlikle kurulan ilişki içinde görmenin — anayasası.
Bu iş, o anayasadan binlerce özgün metin doğuran bir **bilgi ve dil sistemi** kurmaktır; bunun için ciddi bir
araştırma gerekir.

## Kurucu metin (değişmez temel)

`knowledge/aura-kaynak/AURA_PROJECT.pdf` + eski site alt marka metinleri (`archive/site-v1/`: VEREV, GÖNYE, MASİF,
İSKARPELA, KAVELA). İlk iş: bunlardan **AURA'nın yaklaşımını** çıkarmak — cümleleri değil, bakışı: nesneye nasıl
bakıldığı, neyin söylendiği ve neyin bilinçle söylenmediği, beden–nesne–mekân ilişkisinin nasıl kurulduğu.
Çıktı: `knowledge/aura-ses/KURUCU-YAKLASIM.md` (her ilke kurucu metinden alıntıyla). Karar sahibi onaylamadan hiçbir
üretim başlamaz.

## Araştırma programı (`knowledge/aura-ses/arastirma/`)

Amaç alıntı toplamak değil, metinlerin dayanacağı **düşünce zeminini** kurmak. Her alan için bir derleme belgesi;
kaynakların fikirleri kendi cümlelerimizle, kaynak gösterilerek. Telifli eserden alıntı alınmaz (yalnız fikir,
eser ve sayfa bilgisi); telifi dolmuş ya da açık lisanslı metinden kısa alıntı alınabilir.

1. **Fenomenoloji ve oturma/barınma düşüncesi:** nesne, ev, mekân, beden, dokunma, alışkanlık, zaman ve sessizlik
   üzerine felsefe ve mimarlık düşüncesi (dünyanın bütün düşünce gelenekleri; tek bir kültüre ağırlık verilmez). Hangi kavram AURA'nın
   hangi ilkesine dayanak olur.
2. **Nesneyle yaşamak:** edebiyatta eşya ve ev — nesnenin hatıra, tanık, miras olarak anlatılışı; dünya edebiyatı,
   farklı dil ve kültürlerden dengeli.
3. **Malzemenin fenomenolojisi:** stüdyodaki her malzeme için (her ahşap türü, taş, metal, cam, ayna, her lif ve
   dokuma, deri, hasır, lake) — elde, gözde, zamanda nasıl davranır, nasıl yaşlanır, nasıl ses verir, ısısı, kokusu;
   zanaat bilgisi ve gelenekteki yeri. Her malzemeye bir **anlam kartı**.
4. **Parçanın ve birleşimin fenomenolojisi:** stüdyodaki her parça ve seçenek (kol, sırt, oturum, ayak, tabla
   kenarı, kapak, çekmece, kulp, derz, birleşim, lavabo, ayna biçimi…) bedenle nasıl karşılaşır. Her seçeneğe
   anlam kartı. Bu kartlar motorun söz dağarcığına (`tests/ai-eval/vocab.json`) birebir bağlanır.
5. **Tarzların düşünce kökleri:** stüdyodaki her tarzın (AURA, Japandi, İskandinav, Mid-Century, Minimalizm,
   Wabi-Sabi, Endüstriyel, Bauhaus, Art Deco, Brütalizm) kendi yazılı dünyası — manifestoları, kurucu metinleri,
   kavramları. Her tarz AURA sesinin içinde kendi tonunu nasıl bulur: **tarz sesi** belgesi.
6. **Mekân ve kullanım anları:** salon, yemek odası, yatak odası, mutfak, banyo, çalışma köşesi — gün içindeki
   anlar, ışık, ritüeller; nesnenin bu anlara nasıl eşlik ettiği.
7. **Yazı zanaatı:** nesne üzerine iyi yazının örnekleri ve yöntemleri; klişe ve pazarlama dilinin dökümü (ne
   yazılmayacak).
8. **Çok dillilik:** sesin diğer dillere çeviri değil yeniden yazım olarak aktarılması; her dilde karşılık gelen
   düşünce ve edebiyat zemini (AURA bir dünya markasıdır; ilk aşama en ve tr, diğerleri sonra).

Hedef derinlik: her alanda en az 15 doğrulanmış kaynak; malzeme ve parça kartları stüdyonun bütün seçeneklerini
kapsar.

## Üretim mimarisi (binlerce özgün metin için)

Metin şablondan değil, üç katmandan doğar:
1. **Kurucu yaklaşım** (sabit): bakış, ilkeler, yasaklar.
2. **Anlam katmanı** (tasarıma göre seçilir): tasarımın tarzı, türü, malzemeleri, parçaları, oranları ve konacağı
   mekân → ilgili anlam kartları ve tarz sesi. İki tasarım aynı kartları nadiren paylaşır; çeşitlilik buradan gelir.
3. **Yazıcı model**: kartları ve yaklaşımı alıp metni kurar; tasarımda olmayan hiçbir şeyi söyleyemez.

Çıktı (her tasarım): `ad` (parçaya özgü), `tanik` (50–120 kelime), `iz` (tek cümle somut ayrıntı), `dayanak`
(her somut iddianın tasarımdaki karşılığı — otomatik denetlenir), kullanılan kartlar.

## Değerlendirme

- **Doğruluk:** dayanak denetimi; ihlal = ret.
- **Ses:** onay yapay zekâsı (yazıcıdan farklı model) kurucu yaklaşıma göre rubrikle puanlar; karar sahibi kör
  okumada seçer.
- **Özgünlük:** aynı aile/tarzdaki metinler arası benzerlik ve tekrar eden ifade oranı; yasak/klişe listesi.
- **Derinlik:** metin bir kartı süslemek için değil bir ilişkiyi açmak için kullanıyor mu — rubrik maddesi.
- Karar sahibinin seçtiği/düzelttiği metinler **altın küme** olur; yerel Qwen ince ayarı bu küme ve yapay zekâ
  onaylı metinlerle, sonra.

## Aşamalar ve teslim

1. **PR 1:** `KURUCU-YAKLASIM.md` taslağı; araştırma planı ve ilk iki alanın (fenomenoloji, malzeme) derlemesi;
   malzeme anlam kartlarının ilk yarısı; 10 tasarım için deneme metinleri (her biri 3 taslak) + hangi kartlardan
   doğduğu. Karar sahibi okur, yön verir.
2. **PR 2:** kalan araştırma alanları, bütün anlam kartları, tarz sesleri, dayanak denetleyicisi, rubrik; 100 tasarım.
3. **PR 3:** ölçekli üretim (her aile/tür/tarz), değerlendirme raporu, eğitim verisi.

Dal: `codex/aura-metin-01`. Her PR açılır, birleştirilmez; denetim D3, D4, D5.
