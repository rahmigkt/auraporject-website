# CODEX-IS-EMRI-HACIM-01: Eğitim verisinin hacmi

Başlangıç: güncel `main`. TOPARLAMA-01 bitti; testler 63/63 geçiyor. Aşama 1–4 kapısı kapandı, şimdi hacme geçiliyor. Kurallar TOPARLAMA-01 ile aynı:
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

### H1: Mobilya komutları, 9 dil (PR: `hacim-1-komut`)

- **Dağılım:** TR, EN, DE, FR, NL, DA, ES, IT ve AR'nin her biri için en az 200 doğal mobilya komutu. Toplam en az 1.800.
- **Gerçek seçenekler:** Komutlar canlı `vocabulary(design)` seçeneklerine bağlanır.
- **Doğallık:** İnsanın yazacağı biçimde olacak: "kolları biraz alçalt", "ceviz ayak olsun", "240'lık, üç kapaklı", "biraz daha derin". Parametre adı geçen satır doğal komut sayılmaz.
- **İçerik karışımı (dil başına):**
  - %60 tek işlem;
  - %25 birden çok işlem;
  - %10 belirsiz istek (asistan soru sorar, işlem üretmez);
  - %5 stüdyoda olmayan istek (asistan dürüstçe söyler).
- **Hedef ve doğrulama:** Hedef, `actions.js` işlem dizisi ve kısa cevaptır. Her satır `tools/studyo-motoru` ile doğrulanır; motorun reddettiği satır karantinaya gider.
- **Arapça:** Modern Standart Arapça. Körfez ağzıyla yazılmış kullanıcı satırları %20.
- **Sızma yok:** Sınav setindeki (`aura-sinav-01`) komutlarla aynı ya da çok benzer satır olmayacak; benzerlik denetimi yazılacak.

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
  - mobilya değişikliği;
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
- 1.800+ mobilya komutu;
- birkaç bin yerleşim becerisi kaydı.

İlk gerçek eğitim, bunların tasarımcı onayından geçen kısmıyla yapılacak.
