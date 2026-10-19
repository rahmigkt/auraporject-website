# STEP / LGPL — karar sahibi için tek sayfalık not

19 Ekim 2026 · ATOLYE-CODEX-02 / iş5. **Hukuki görüş değildir; dağıtım onayı verilmedi.**

**Öneri:** STEP'i ihtiyaçta yüklenen, ayrı JS/WASM worker modülü yapalım; lisans ve
yeniden oluşturma paketi tamamlanana kadar varsayılan dağıtıma eklemeyelim.
Sunucu/hesap gerekmiyor. Ayrı worker performans ve paketleme kararıdır; lisans muafiyeti değildir.

**Hangi lisans?** [Replicad MIT](https://github.com/sgenoud/replicad/blob/main/LICENSE);
[replicad-opencascadejs 1.1.0 LGPL-2.1-only](https://github.com/sgenoud/replicad/blob/main/packages/replicad-opencascadejs/package.json).
OCCT'nin [ek istisnası](https://github.com/Open-Cascade-SAS/OCCT/blob/master/OCCT_LGPL_EXCEPTION.txt)
belirli başlık kullanımında nesne kodunun seçilen koşullarla dağıtımına izin verir,
belirgin OCCT kullanım bildirimi ister. Bu metin çekirdeği MIT yapmaz.

**Dağıtımdan önce somut teslim:**

1. Sürüm/hash ve tüm alt bileşen lisans envanteri; MIT/LGPL/OCCT istisna metinleri,
   telif ve garanti bildirimleri. Ayarlarda ve indirme paketinde erişilebilir “Açık kaynaklar”.
2. Dağıtılan çekirdeğin **tam karşılık gelen kaynakları**: OCCT ve binding revision'ları,
   yamalar, Emscripten/toolchain, build config, bağlama komutları ve gerekli kaynaklar.
   Sadece değişebilen GitHub ana dalına link yeterli kabul edilmesin. Değişiklikler işaretlensin.
3. LGPL §4/§6 yoluna uygun kaynak/yeniden bağlama veya kütüphaneyi değiştirme düzeni.
   Ayrı dosya adı tek başına yeterli kanıt değil; değiştirilmiş uyumlu çekirdeğin
   örnek uygulamayla çalıştığı gösterilsin. Seçilen paketleme yoluna göre uygulamanın
   gerekli object/source parçalarının sağlanıp sağlanmayacağını lisans uzmanı doğrulasın.
4. Kullanım koşulları, kullanıcının kütüphaneyi değiştirme ve bu değişikliği hata
   ayıklamak için tersine mühendislik haklarını yasaklamasın. Kaynak dağıtım yöntemi
   ve sürüm arşivi belgeli olsun. [LGPL 2.1 metni, özellikle §4–6](https://github.com/donalffons/opencascade.js/blob/master/LICENSE).

**Kanal farkı — teknik/uyum değerlendirmesi:**

| Kanal | Gerekli düzen / açık soru |
|---|---|
| Statik web | Tarayıcıya JS/WASM kopyası teslim ediliyor; “sunucuda duruyor” muafiyeti varsayma. Aynı sürüme bağlı kaynak/build arşivi ve ayrı modül/loader sağla. |
| PWA | Aynı teslim + offline cache. Kaynak/lisans paketi kurulan sürümle eşleşsin; service worker güncellemesi kaynak erişimini koparmasın. |
| Mağaza / WebView | Yukarıdakilere ek imza, DRM, EULA ve değiştirilebilir modül/yeniden bağlama yolunun mağaza şartlarıyla uyumu incelensin. Genel bir “kesin uygun/uygunsuz” sonucu çıkarılmadı. |

**Kullanıcı bildirimi taslağı:** “İsteğe bağlı STEP modülü Replicad, OpenCascade.js
ve Open CASCADE Technology kullanır. Sürümler, lisanslar, kaynaklar, değişiklikler ve
yeniden oluşturma yönergesi Açık kaynaklar bölümündedir.” Gerçek sürüm/telifler
envanterden doldurulmalı; bu taslak lisans metinlerinin yerine geçmez.

**Açık karar:** LGPL yükümlülükleri kabul ediliyor mu? Dağıtılacak build'in kesin
alt bileşenleri ve §6'ya uyum yolu henüz doğrulanmadı; mağaza kanalı ayrıca incelenecek.
Kabul edilmezse Manifold/mesh + STL/DXF yolu sürdürülebilir; bu, analitik B-rep STEP
ile eşdeğer değildir. AURA'nın bütün kodunu açmak gerektiği de, hiçbir kaynak yükümlülüğü
olmadığı da varsayılmıyor. Bu PR yalnız karar notudur; yazılım dağıtmaz.
