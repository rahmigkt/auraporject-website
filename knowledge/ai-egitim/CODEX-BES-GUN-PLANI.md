# AURA: beş günlük çalışma ve öz denetim planı

Kullanıcı talimatı, 21 Ekim 2026: “H4 bitince beklemeden C7’ye geç, main’deki iş listesinden sırayla devam et. cloude 5 gün boyunca olmayacak kendi denetimini yaparak doğru yolu kendin çiz çok iyi planla”.

Bu talimat, aşağıdaki dönemde Claude incelemesini beklemeden Codex öz denetimiyle ilerlemeye açık yetkidir. Dönem: **21 Ekim 2026 23.00–26 Ekim 2026 23.00 (Europe/Istanbul)**; UTC karşılığı 21–26 Ekim 20.00. Yeni öz denetim kararlarında bu sürenin ardından olağan çapraz denetim kuralı uygulanır. Süre içinde verilmiş kararın kimin tarafından, hangi yetki ve kanıtla verildiği tarihçede korunur.

Öz denetim, bağımsız Claude denetimi olarak kaydedilmez. Üretici değişmez; denetçi `Codex`, yöntem `review_mode: user_authorized_self_review`, kullanıcı yetkisi bu belge ve sohbet talimatı olarak yazılır. Bu yetki, başarısız veya okunmamış kayıtları uygun sayma yetkisi değildir. Mevcut ret/düzeltme geçmişi silinmez; düzeltme ve yeni kanıtla yeni karar yazılır.

## Yürütme sırası

1. **H4 / C5:** Çalışan altı işçili CPU koşusu tamamlanır. Kaynak/kod/sınav fingerprint'i korunur; çalışan doğrulama çoğaltılmaz. Son rapor, adaylar, dışlamalar, 4340 kaynağın muhasebesi, dokuz dil, kaynak ev grupları, kısıtlar ve tam ölçüler kontrol edilir. Gerçekten tamamlanmadan C5 kapatılmaz. PR #206'ya doğrulanmış nihai teslim yazılır.
2. **C7:** Claude'un sohbet-001, kaynak yerleşim ve motor örnekleri incelenir. Girdi/istek ile hedef eylem aynı anlamı taşımalı; mekanik kabul tek başına yeterli sayılmaz. Sonuçlar `inceleme/codex-kararlari.json` içinde kaynak ve denetçi ayrımıyla tutulur. H4'ün yeni Codex dönüşüm etiketleri bu özgün Claude kaynaklarından ayrı değerlendirilir.
3. **H5 / C6:** Eski 40 mobilya düzenleme görevi arşivlenir, ev projesi kapsamındaki 40 görev ve beş stüdyoya yönlendirme kontrolü hazırlanır. Yeni sınav sürümü dondurulur; eğitimle sızma denetlenir. Yerel küçük modelle açıkça istenen CPU temel ölçümü yapılır; eğitilmiş model başarısı iddia edilmez.
4. **E1:** Ortak puanlayıcı; biçim, motor, istek, dürüstlük, dil ve kısalık ayrı gösterilir. Boş/tekrarlı işlem, yanlış dil, kendiliğinden küçültme ve uydurma oda gibi hileler negatif testlerle yakalanır.
5. **E2:** İstenen küçük CPU süzme kuru koşusu, sınavdan bağımsız istemlerle yapılır. Bütün denemeler saklanır; yalnız eşik üstündekiler, gerçek model/üretici adıyla karantinaya yazılır. Henüz yapılmamış EGITIM-01 eğitimi olmuş gibi etiketlenmez.
6. **E3:** İş emrindeki CPU hazırlığı ve küçük kuru koşu sınırları uygulanır; ödül, KL ve sınav aralığı açık yazılır. GPU/EGITIM-01 eğitimi başlatılmaz.
7. **E4, E5, E6:** Güncel birincil kaynaklarla görsel hakem araştırması, serbest çizim sözleşmesi ve kaynak/AURA önerisi ayrımlı dokuz dilli tekstil kataloğu hazırlanır. Stüdyo uygulama dosyaları değiştirilmez.

Her yeni işe başlamadan güncel `origin/main` ve `GOREVLER.md` okunur; oradaki yeni kullanıcı kararları uygulanır. C2/C3/C4 mevcut kararla eğitim sonrasındadır. Takvim uğruna sıra, sınav veya kalite eşiği değiştirilmez; bu belge beş günde bütün listenin biteceği iddiası değildir.

## Her teslimde iki denetim geçişi

İlk geçişte kapsam, kaynak, lisans/atıf, kayıt kimliği, istek-hedef uyumu, ev grubu ve gizli sınava sızma incelenir. Kısıtlar ve ölçüler kaynakla karşılaştırılır; işlem üretmeyen dürüst yanıtlar uygun senaryolardan ayrılır.

İkinci geçişte güncel motor kanıtı, bağımsız sonuç hesapları ve anlamlı negatif kontroller incelenir. Kaynak veya hedef değiştiyse eski kanıt geçerli sayılmaz. Dil metinleri ve farklı senaryo türleri okunur; otomatik testin ölçemediği tasarım/ana dil niteliği ölçülmüş gibi sunulmaz. Bu, aynı Codex'in ikinci geçişidir; ikinci model iddiası yoktur.

Karar kanıtında kaynak/kod SHA'ları, denetlenen kapsam ve örnekleme, gerçek test sonuçları, açık kusurlar, denetçi, yöntem ve zaman bulunur. Yalnız incelenmiş ve kontrolleri geçmiş kayıt uygun işaretlenir. Öz denetim kararının derleyicide kullanılması gerekirse üretici/denetçi korunarak açık kullanıcı istisnası ayrı bir kapıyla uygulanır; Claude adına karar yazılmaz ve motor/sızma kapıları gevşetilmez. Eğitim kapısı etkinleştirilmez.

## Süreklilik ve teslim

Bu sohbete bağlı “AURA H4 sonrası sıralı çalışma” takibi 10 dakikada bir uyanır. Aynı çalışan iş çoğaltılmaz. Değişmeyen ve eylem gerektirmeyen durumda sessiz kalır; tamamlanma, hata, anlamlı teslim veya gerekli kullanıcı eyleminde bildirir. H4 bitince nihai denetim ve PR güncellemesinin ardından kullanıcıdan yeni komut beklemeden C7'ye geçer. Liste tamamlanınca takip duraklatılır; öz denetim istisnası süre sonunda kendiliğinden genişletilmez.

Çalışma kökü `work/hacim-4-yerlesim`, işlem durumu `work/H4-runtime.json`, kaynak sonucu günlüğü `work/h4-full.jsonl` içindedir. Tam test paketinin önceki Forma 180 saniye süre aşımı açık kusur olarak korunur; geçmeyen pakete tam yeşil denmez. Gereksiz pahalı tekrar yerine değişikliğe uygun testler yapılır.

Her iş ayrı PR'dır; mevcut depo gönderim/PR yetkisi kullanılır. **Merge, GPU, ücretli API, dağıtım ve gerçek EGITIM-01 eğitimi için mevcut sınırlar sürer.** `assets/`, `api/`, kök HTML değiştirilmez; silme yapılmaz. Kullanıcının açıkça istediği iş emrindeki CPU kuru koşular kendi kapsamlarında yürütülür.
