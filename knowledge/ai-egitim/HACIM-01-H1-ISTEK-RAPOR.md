# HACIM-01 — H1 / C1 düzeltme teslimi

21 Ekim 2026 · PR #187 · main 544d901 (#189–192) dala alındı.
Görev kaynağı `GOREVLER.md` içindeki C1'dir. Claude'un `hacim-1-istek:* = duzelt` kararı korunur; bu sürüm yeniden incelemeye sunulur. Onaylı/eğitime uygun kayıt: **0**. Eğitim, GPU, ücretli API, dağıtım ve merge yapılmadı.

## C1 karşılıkları

| İstenen düzeltme | Bu sürüm |
|---|---|
| İsteğe özgü asistan yanıtı | 24 tek işlem ailesi, 10 işlem çifti, 10 netleştirme konusu ve 10 kapsam dışı talep için ayrı sonuç/soru metni; işlem ve ölçü belirtilir. |
| Duvar çalışma alanı kalıbını çıkar | Bu yapay çalışma türü üretimden çıkarıldı; kullanıcı/asistan metinlerinde iç terim taraması uygulanır. |
| Doğal çoklu istek ve en az %20 kısıt | Her dilde 50 doğal, tek cümleli çoklu istek; noktalı virgül birleştirmesi yok. 40/50 (%80) kısıtlı; bakar/yakin/uzak türlerinin tamamı var. |
| Konuya özgü netleştirme | Halıda ölçü/renk/doku, perdede katman/renk/başlık, açıklıklarda duvar/konum/ölçü gibi eksikler sorulur; işlem üretilmez. |
| Dil başına en az 150 kalıp | Her dilde 200 kullanıcı ve 190 yanıt kalıbı. Ölçü/değişken, sayı, noktalama ve aksan normalize edilir; sayı değiştirmek ayrı kalıp sayılmaz. Kanıt: `C1-kalite-raporu.json`. |
| Uzakta boş oda ekleme kalıbını azalt | Yeni oda poligonu ekleyen kayıt 0. İstekler mevcut ev planında uygulanır. Bütün örnekler bağlantılı beş odalı aynı kurgusal evdedir. |

TR, EN, DE, FR, NL, DA, ES, IT, AR: her dilde **200** kayıt (120 tek işlem, 50 çoklu, 20 netleştirme, 10 kapsam dışı), toplam **1.800**. Körfez ağzı kullanıcı satırı **40**; asistan yanıtları standart Arapça adayıdır. Dil başına toplam kısıtlı kayıt **80/200 (%40)**.

Kalıp sayıları yüzey çeşitliliğidir; 1.800 bağımsız niyet, gerçek müşteri veya gerçek ev kaynağı iddia edilmez. Tek işlemde 24 aile × beş elle yazılmış ifade, çokluda 10 çift × beş doğal çerçeve vardır. Claude yeniden dil/içerik denetimi beklenir; ana dil onayı taklit edilmez.

## Motor kanıtı ve sınırlar

Her işlem gerçek motorla çalıştırılır. Kabul, ret/uyarı, hedef gözlemleri ve eşya türü/toplam ölçüleri denetlenir; aynı girdi/işlem dizileri aynı kanıtı önbellekten paylaşır. Yeniden üretim ve negatif değişiklik testleri vardır. Kesin motor sayımı `sayim-raporu.json` içindedir.

Bakış yönü kullanıcı isteğidir. Yakın/uzak için milimetre eşikleri AURA'nın açık operasyonel yorumudur; müşterinin ölçtüğü boşluk veya erişilebilirlik sertifikası değildir. Bu yorum kaynak alanına yazılır. Kısa istekte verilmemiş sabit eşya ölçüleri başlangıç bağlamındaki senaryo envanterindedir. Koordinatlar kullanıcıdan istenmez; motor yerleştirir.

Plan; salon, yatak odası, çocuk odası, antre ve yemek odasını, ortak duvarları, kapı ve pencereleri içerir. Geometri sentetiktir; gerçek bina veya mimari uygunluk kanıtı değildir. Bütün dil ve değerler tek kaynak kümesinde tutulur; bağımsız dev/test kapsamı iddia edilmez.

Mobilya detayı hedefi yoktur. Desteklenmeyen talepte yönlendirme, belirsiz istekte konuya özgü soru ve boş işlem listesi vardır. Her dilde beş ışık renk sıcaklığı ve beş kalıcı tasarımcı inceleme talebi hedefi vardır (#191). Yüzdelik ışık kısma hâlâ motor sözlüğünde yoktur; kapsam dışı örnek özellikle bunu sorar. Tasarımcı hedefi yalnız projedeki kalıcı talep kaydıdır; dışarıya mesaj/teslim gerçekleştiği iddia edilmez. Tekstil yalnız seçili oda çalışma bağlamıdır; çok odalı kalıcılık iddia edilmez.

## Arşiv ve inceleme

Önceki H1'in dokuz JSONL dosyası, ortak izdüşümü, sayım raporu ve üretici kaynakları `toparlama-01/archive/hacim-istek-v1/` altında Git 4fad6f3 baytlarıyla korunur. Önceki teslim raporu ve test özeti de bu arşivdedir; bunlar tarihsel kanıttır. Arşiv kayıtları yeni veri diye sayılmaz.

Birincil dokuz JSONL ile `karantina.jsonl` aynı 1.800 kayıttır. Ortak şema, kayıpsız işlem dönüşümü, kaynak/digest bağları ve üretenden farklı denetçi kapısı korunur. `kararlar.json` değiştirilmez. Önceki toplu duzelt kararı yeni manifestte açıkça gösterilir; eski karar otomatik onay sayılmaz. Mevcut birleşik korpusun sayıları/bölmeleri ve boş eğitim dışa aktarımları korunur.

Üretici sınavı okumaz. Ayrı sözcüksel dışlama denetimi yalnız sınav kullanıcı metnini okur; eşikler düşürülmez. Sayı değiştirme ve ek taleple gizleme negatif testleri korunur. Bu tarama anlamsal/çapraz dil benzerlik yokluğunun kanıtı değildir.

Main #189 ve #191 motor ağacı değiştiği için eski 40 Avrupa + 12 Arapça sohbetin mekanik kanıt zinciri, 52 ortak motor izdüşümü ve donmuş sınav kaynak manifesti yeniden doğrulanır. Eski konuşma metinleri ve 120 donmuş sınav görev baytı korunur. Bu işlem C2'deki 47 üslup düzeltmesini tamamlamış sayılmaz. Önceki merdiven bulguları #189'da giderildi; tarihsel #184 denetimi yeni motor bulgusu diye sunulmaz.

[İnceleme sayfası](HACIM-01-H1-ISTEK-inceleme.html) dil/tür filtreleri, sayfalama ve Arapça RTL içerir. Sayfa karar kaydetmez. Görsel tarayıcı onayı veya ana dil onayı iddia edilmez.

Tekrar üretme sırası `tools/hacim-istek/README.md` içindedir. Güncel çevrimdışı test sonucu `veri/hacim-1-istek/test-ozeti.json` dosyasına yazılır. C1 tesliminden sonraki görev **C2: 47 kaydın üslup düzeltmesi**, ayrı PR'dır; H2–H5 tamamlanmış değildir.

Güncel motor ağacında genel çevrimdışı koşu **66/67** geçti. Tek hata, Türkçe perdedeki “katmanlı” sözcüğünün iç terim yasağına takılmasıydı. Metin “karartma özellikli fon” olarak sadeleştirildi; durum/işlem/hedef/motor kanıtı değişmedi. Ardından tam C1 deterministik motor testi, şema, sızma, üslup ve DOM kontrolleri yeniden geçti: **67 kontrolün tamamı doğrulandı, açık hata 0**. Geometri testi atlanmadı; 900 saniye/test sınırı kullanıldı. Son kullanıcı/yanıt metinleri üreticiden bire bir yeniden kurularak motorla tekrarlandı. Görsel tarayıcı QA yapılmış sayılmaz.
