# CODEX-IS-EMRI-HACIM-01: Eğitim verisinin hacmi

Başlangıç: güncel `main`.

> **Kapsam kararı (kullanıcı, 21 Ekim 2026):** Yapay zekâ yalnızca **ev projesi** üzerinde çalışır. Mobilyanın detay tasarımı (kol yüksekliği, ayak, dikiş, kapak düzeni, malzeme ayrıntısı) stüdyonun ve kullanıcının işidir; yapay zekâ buna girmez, bu tür eğitim verisi üretilmez.
>
> Yapay zekânın işi:
> - evin planı (duvar, kapı, pencere, oda);
> - hangi odaya hangi eşyanın gireceği ve **toplam ölçüsü** (örneğin "üçlü kanepe 220×90");
> - yerleşim isteği ve kısıtları;
> - perde, halı ve aydınlatma;
> - projeyi tasarımcıya gönderme.
>
> Kullanıcı bir mobilyanın detayını değiştirmek isterse asistan onu stüdyoya yönlendirir ("Kol yüksekliğini stüdyoda kanepeyi açıp ayarlayabilirsiniz") ve kendisi işlem üretmez. TOPARLAMA-01 bitti; testler 63/63 geçiyor. Aşama 1–4 kapısı kapandı, şimdi hacme geçiliyor. Kurallar TOPARLAMA-01 ile aynı:
- `assets/`, `api/`, kök `.html` dosyalarına dokunulmaz;
- silme yok; sayı uydurma yok; onay taklit edilmez;
- eğitim, GPU, ücretli API ve dağıtım yok;
- her grup ayrı PR.

## Paralel giden Claude işleri (bunları bekleme, ama haberin olsun)

1. **Kapı açılma alanı hatası:** Çözücü bazı seçeneklerde kapı önünü kapatıyordu (senin EV-ARAP-ÖLÇÜLÜ 04 bulgun). Düzeltilince ilgili kayıtları motorla yeniden doğrula.
2. **`leaves` anlam çakışması:** Masada uzatma tablası, dolapta kapak anlamına geliyor. Düzeltilince sözlük (`ISLEM-SOZLUGU`) güncellenir; senin üreticin yeni anahtarı kullanır.
3. **Meclis:** `meclis.json` çözücüye bir parça türü olarak eklenecek: U ya da L düzen, minder derinliği, orta alan. Ölçüsü `null` olan değerler için ben varsayım yapmayacağım; her kayıtta "kaynaklı" ya da "AURA önerisi" diye işaretlenecek.
4. **Kat ve merdiven:** Motorda `kat_ekle` ve `merdiven` işlemleri. Gelince villa ve dubleks sohbetlerinin önü açılır.
5. **İnceleme sayfası:** Tasarımcı ve ana dili Arapça olan değerlendirici için. Her kaydı "uygun / düzeltilmeli / ret" diye işaretleyecekler. İşaretler ortak bir veritabanına gidecek; senin araçların bunları okuyacak (biçimi `karar-kaydi` olarak PR'da bildireceğim).
6. **Yerleşim verisi:** ProcTHOR odaları, oturma grubu ve yatak takımıyla parça parça yeniden üretilecek.

## Senin işlerin (sırayla, her biri ayrı PR)

### H1: Ev projesi istekleri, 9 dil (PR: `hacim-1-istek`)

- **Dağılım:** TR, EN, DE, FR, NL, DA, ES, IT ve AR'nin her biri için en az 200 kısa ve doğal ev projesi isteği. Toplam en az 1.800.
- **Örnekler:**
  - "salona 3+2+1 koy, tekliyi pencere yanına";
  - "yatak odasına 160'lık yatak ve iki komodin";
  - "çocuk odasıyla çalışma odasının yerini değiştir";
  - "balkon kapısının önünü boş bırak";
  - "perdeleri koyu yeşil yap, salona kilim";
  - "antreye ayakkabılık sığar mı";
  - "projeyi tasarımcıya gönder".
- **Hedef:** Stüdyo motoru işlemleri. Kullanılacak katmanlar:
  - `ev`;
  - `yerlesim` (`esyalar` + `kisitlar`; eşyanın türü ve toplam ölçüsü);
  - `tekstil`;
  - `proje`.

  **`mobilya` katmanındaki detay işlemleri (`set/delta/enum/material` ile kol, ayak, kapak gibi parçalar) kullanılmaz.**
- **İçerik karışımı (dil başına):**
  - %60 tek işlem;
  - %25 birden çok işlem;
  - %10 belirsiz istek (asistan ölçü ya da oda sorar);
  - %5 kapsam dışı istek: mobilya detayı ("kolu alçalt") ya da stüdyoda olmayan bir şey. Asistan stüdyoya yönlendirir ya da dürüstçe söyler; işlem üretmez.
- **Doğrulama:** Her satır `tools/studyo-motoru` ile doğrulanır; reddedilen satır karantinaya gider. Sınavla benzerlik denetimi yapılır.
- **Arapça:** Modern Standart Arapça. Körfez ağzıyla yazılmış kullanıcı satırları %20.

### H2: Avrupa sohbetleri (PR'lar: `hacim-2-<ülke>`)

- **Sıra:** BE, NL, DE, FR, UK, IE, DK, ES, IT, AT, CH, TR. Her ülke 30 geometrili sohbete tamamlanır (eksik sayılar `ASAMA-7-HACIM-DURUM.md` tablosunda).
- **Bir turda bir ülke.** Her sohbet:
  - gerçek plan (Swiss Dwellings ya da ResPlan, atıflı);
  - en az 8 tur;
  - `yerlestir` + `kisitlar` (koordinat yok);
  - motor doğrulaması;
  - üslup denetimi (yasaklı terim 0).
- **Eşya takımları gerçek ev takımları olacak:**
  - **Salon:** üçlü + ikili + tekli; büyük salonda kahve köşesi ve yan sehpalar.
  - **Yatak odası:** yatak, 2 komodin, gardırop, şifonyer.
  - **Çocuk odası:** tek kişilik yatak, çalışma masası, gardırop.
  - **Antre:** ayakkabılık, portmanto.
  - Ölçüleri kullanıcı söyler ya da asistan sorar.
- **Otomatik küçültme yok.** Kullanıcı kararı. Sığmıyorsa asistan bunu söyler ve kullanıcının ne yapmak istediğini sorar; kendi başına ölçü değiştirmez.
- **Sohbet türleri çeşitli olacak:**
  - bütün ev projesi;
  - tek oda;
  - mevcut eşyanın değişmesi (ne ve hangi ölçüde, detay tasarımı değil);
  - perde ve halı;
  - "sığmıyor" durumu;
  - fikir değiştiren kullanıcı;
  - tasarımcıya gönderme.

### H3: Arap dünyası (PR'lar: `hacim-3-<ülke>`)

- **Sıra:** AE, SA, QA, KW, sonra EG, MA. Her ülke 30 sohbete tamamlanır.
- **Tek katlı aile salonu ve daire senaryoları:** Hemen başlanabilir.
- **Meclisli senaryolar:** Benim meclis desteğim main'e girince başlar. O zamana kadar en fazla 2 "meclis isteği → asistan ölçü sorar" görüşmesi yazılabilir, yerleşimsiz.
- **Villa ve dubleks:** Kat ve merdiven desteği gelince. Gerçek Körfez planı bulunamazsa uyarlanmış referans olduğu kayıtta açıkça yazılır.
- **Tekstil:** Ağır perde, katmanlı tül, büyük halı istekleri `tekstil.js` sürüm 2 kayıtlarıyla.

### H4: Yerleşim verisinin kısıt biçimine çevrilmesi (PR: `hacim-4-yerlesim`)

- `knowledge/ai-egitim/veri/yerlesim/` altındaki ProcTHOR çözücü kayıtları "oda + eşya + istek" girdisine ve `yerlestir`/`kisitlar` hedefine çevrilir. Kısıtlar sonuçtan çıkarılır; örneğin kanepe TV'ye bakıyorsa `bakar`.
- Motorda yeniden çözülür. Kısıtları tutmayan kayıt eğitime girmez.
- Benim yeni ürettiğim veri (oturma grubu ve takımlar) gelince aynı araçla işlenir.
- Her odada doğal dil girdisi yazılmaz, kalıp cümle de kullanılmaz. Bu küme "yerleşim becerisi" katmanıdır, sohbet değildir. Girdi yapısal olur (oda JSON'u + eşya listesi + kullanıcının kısa isteği). Kısa istekler 9 dilde ve çeşitli olur.

### H5: Sınavın ilk koşusu, CPU (PR: `hacim-5-sinav-cpu`)

- **Önce sınavı kapsama uydur:** `aura-sinav-01` içindeki 40 "mobilya düzenleme" görevi kapsam dışı kaldı. Bunları arşive al ve yerlerine 40 ev projesi isteği görevi koy (H1 türünde, sızma denetimiyle). İçlerinde 5 "mobilya detayı isteniyor → asistan stüdyoya yönlendirir, işlem üretmez" görevi olsun. Yeni sınav sürümünü dondur (`FREEZE`).

- `aura-sinav-01`, `CPU-KOSU-PLANI.md`'ye göre küçük bir yerel Qwen ile (ya da en küçük uygun sürümle) çalıştırılır. GPU yok.
- Amaç puan değil, puanlayıcının, istem biçiminin ve motor bağlantısının uçtan uca çalıştığını göstermek.
- Sonuç, eğitimsiz temel modelin ilk ölçümü olarak kaydedilir.

## Kabul (her PR)

- `node tests/hepsi.mjs` yeşil.
- Yeni kayıtlar karantinada; sayım raporu güncel; katalog güncel.
- Sınavla sızma 0.
- Yasaklı terim 0, dil karışması 0.
- Açık kusurlar dürüstçe yazılmış.

**Tahmini hacim (hepsi tamamlanınca):**
- 18 ülke × 30 = 540 sohbet;
- 1.800+ ev projesi isteği;
- birkaç bin yerleşim becerisi kaydı.

İlk gerçek eğitim, bunların tasarımcı onayından geçen kısmıyla yapılacak.
