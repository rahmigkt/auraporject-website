# CODEX-IS-EMRI-TOPARLAMA-01: Eğitime hazırlık için büyük toparlama

Başlangıç: güncel `main`. Önce `knowledge/ai-egitim/EGITIM-PLANI-STUDYO.md` dosyasını oku; bu iş o planın veri ayağıdır.

21 Ekim 2026'da yapılan birleştirmeler:
- **Doğrudan birleştirilenler:** #138, #146 (UK/IE), #151 (DK/ES/IT), #152 (Körfez kaynakları).
- **İçerikleri taşınıp kapatılanlar:** #119, #127 ve #69. İçerikleri #154 ile main'e taşındı; PR'lar kapandı.
- **Taşınmadan kapatılan:** #132, yerini EV-SOHBET-02 aldı.

Bu iş uzun. Aşamalar halinde ve **her aşama ayrı PR** olarak teslim edilecek. Dev bir PR açılmayacak.

## Genel kurallar (bütün aşamalar)

- `assets/`, `api/`, kök `.html` dosyaları ve `.htaccess`'e dokunma. Stüdyo kodu benim işim.
- **Silme yok.** Eskiyen veri `archive/` altına taşınır ve katalogda `superseded` olarak işaretlenir.
- Eğitim çalıştırma, GPU, ücretli API ve canlı siteye dağıtım yok.
- Her aşamanın PR'ında şunlar olur:
  - ne yapıldığı;
  - ne yapılamadığı ve neden;
  - doğrulama komutları ve çıktıları;
  - ayrı bir "açık kusurlar" bölümü.
- Sayı uydurma yok. Bilinmeyen değer `null` kalır; sonuç olmayan iş "yapıldı" diye raporlanmaz.
- Kullanıcıya dönük her metin (sohbetler) EV-ARAP-01 bölüm B'deki üslup kurallarına uyar. Yasaklı iç terim sayısı 0 olmalı.

## Aşama 1: Depo hijyeni (PR: `toparlama-1-hijyen`)

1. **Çakışmalar:** #154 sırasında 9 dosya çakıştığı için main'deki sürüm korundu. Bunları içerik olarak birleştir, hiçbir taraftaki bilgi kaybolmasın:
   - `knowledge/ai-egitim/QWEN-KUSURLAR.md` (#119 ve #69 sürümleri);
   - `knowledge/ev-projesi/veri/plan-program.schema.json`;
   - `tools/ev-plan/metrics.py`;
   - `tools/ev-plan/solver/__init__.py`;
   - `tools/ev-plan/solver/program.py`;
   - `.gitattributes` (#127 ve #69 satırları);
   - `.gitignore`.

   Eski dalları git'te bul: `codex/ev-qwen-00b`, `codex/ev-qwen-00c`, `codex/aura-qwen-local-01`.
2. **#69'un `outputs/qwen-local/` klasörü:** main'e alınmadı, çünkü `outputs/` FTP ile sunucuya yükleniyor. Gerekli rapor ve ölçümleri `knowledge/ai-egitim/qwen-pilot-01/` altına taşı. Ağırlık ve anahtar dosyası olmasın.
3. **#132:** `tools/ev-yerlesim/` altındaki işe yarar test ve denetimleri değerlendir. Benim `assets/ev/yerlesim.js` çözücümle çakışan ikinci bir çözücü main'e girmeyecek. Yalnızca testleri ve denetim fikirlerini al; raporda neyi neden aldığını yaz.
4. **`knowledge/ai-egitim/` düzeni:**
   - `README.md`: hangi belge ne işe yarar, hangisi güncel, hangisi eski. Tek sayfa olsun.
   - `IS-SIRASI.md`: bugünkü gerçek durum.
   - `EV-ULKE-SIRASI.md`: Arap grubu DK'den önce gelir (EV-ARAP-01).
5. **Testler:** `tests/` altındaki bütün denetimleri tek komutla çalıştıran bir `tests/hepsi.sh` (ya da `.mjs`). Kırık test kalmayacak; kırıklar düzeltilecek ya da nedeniyle birlikte raporlanacak.

## Aşama 2: Veri kataloğu (PR: `toparlama-2-katalog`)

`knowledge/ai-egitim/KATALOG.json` ve okunur bir `KATALOG.html`. Depodaki **her** eğitim adayı veri seti için:

- `id`, yol ve içerik özeti (sha256);
- kaynak ve lisans (Swiss Dwellings CC BY 4.0, ResPlan CC BY 4.0, ProcTHOR Apache-2.0, AURA özgün…);
- kayıt sayısı, diller, ülkeler;
- hangi stüdyo katmanına bağlandığı: `mobilya` | `ev-plani` | `yerlesim` | `tekstil` | `genel-sohbet`;
- durum: `egitim-adayi` | `inceleme-bekliyor` | `superseded` | `yalnizca-arastirma`;
- bilinen kusurlar.

En az şunlar katalogda olmalı:
- `ev-sohbet-02`, `ev-sohbet-uk-ie`, `ev-sohbet-dk`, `ev-sohbet-es`, `ev-sohbet-it`;
- `ev-plan-eu-00c`, `ev-plan-reel-00d`, `ev-plan-veriseti`, `ev-plan-veriseti-v2`;
- `sohbet-ornekleri` (sohbet-001);
- `qwen-local` stüdyo işlem örnekleri;
- `perde-diyaloglar`, PERDE ve TEKSTİL verileri;
- `tests/ai-eval` sınavları;
- benim yerleşim verim (`tools/yerlesim-veri`, `claude/yerlesim-veri` dalı main'e girince).

Katalog bir sayfada şu tabloları göstersin:
- dil × ülke × katman;
- eğitim adayı, inceleme bekleyen ve eski kayıt sayıları;
- lisans dağılımı.

## Aşama 3: Birleşik eğitim biçimi (PR: `toparlama-3-bicim`)

`knowledge/ai-egitim/AURA-EGITIM-1.schema.json`: bütün eğitim örnekleri bu tek biçime çevrilecek.

```
{ id, dil, ulke, katman, kaynak:{veri_seti, kayit, lisans},
  durum_once: {...stüdyo durumu: tasarım | ev planı | oda + eşyalar},
  mesajlar: [{rol, metin}],
  islemler: [{tur, ...}],          // stüdyo işlem sözlüğü (aşağıda)
  denetim: {gecti, uyarilar[], yasakli_terim: 0, dil_tutarli: true},
  bolum: "train" | "dev" | "test" }
```

- **İşlem sözlüğü taslağı.** `EGITIM-PLANI-STUDYO.md` bölüm "stüdyo motoru"ndaki sözlük kullanılacak:
  - **mobilya:** `set`, `delta`, `enum`, `material`, `style`, `kind` (mevcut `sanitizeActions`);
  - **ev:** `duvar_ekle`, `duvar_tasi`, `aciklik_ekle`, `oda_tanimla`, `oda_birlestir`, `kat_ekle`, `merdiven`;
  - **yerleşim:** `yerlestir {oda, esyalar, kisitlar}`, `secenek_sec`. Qwen koordinat üretmez, kısıt yazar;
  - **tekstil:** `perde`, `hali` (`assets/ev/tekstil.js` sürüm 2 kaydı);
  - **proje:** `projeye_ekle`, `tasarimciya_gonder`.
- **Stüdyo motoru:** `tools/studyo-motoru/` aşaması bende. Hazır olana kadar mevcut doğrulayıcılarla çalış: `sanitizeActions`, `solveRoom`, `denetim.py`, `verify02.mjs`. Motor main'e girince bütün veri bir kez daha motordan geçirilir ve rapor güncellenir.
- **Dönüştürücüler:** Aşama 2'deki her eğitim adayı için `tools/egitim-donustur/`.
- **Bölme:** Aynı kaynak plan (aynı Swiss Dwellings ya da ProcTHOR kimliği) hem train'de hem test'te olamaz; sızıntı denetimi yazılacak. Yaklaşık oran train 80 / dev 10 / test 10. Sınav seti (Aşama 6) ayrıca tutulur.
- **Çıktı:** `knowledge/ai-egitim/veri/birlesik/{train,dev,test}.jsonl` ve sayım raporu.

## Aşama 4: Üslup düzeltmesi (PR: `toparlama-4-uslup`)

- EV-SOHBET-02, UK/IE, DK ve ES sohbetlerinin tamamı yeniden yazılacak:
  - kullanıcı kendi evini anlatır;
  - asistan sıcak ve sade konuşur;
  - iç terim kullanılmaz;
  - belirsizlik tek ve insanca bir cümleyle söylenir.
- İtalya turu örnek alınacak; yine de onu da yasaklı terim listesiyle tara. "Le due stanze senza nome" gibi veri seti kokan ifadeler de temizlenecek: odaların adı yok diye kullanıcı "isimsiz oda" demez.
- Plan, işlem ve yerleşim sonuçları değişmez; yalnızca metin değişir. Her kayıtta eski metnin hash'i saklanır.
- `tools/ev-sohbet/uslup_denetim.py`:
  - yasaklı terimler (TR, EN, NL, FR, DE, DA, ES, IT ve AR karşılıklarıyla);
  - dil karışması;
  - tekrar eden asistan cümlesi;
  - 60 kelimeyi geçen asistan cevabı.

## Aşama 5: Arap dünyası (EV-ARAP-01'in tamamlanması) (PR: `toparlama-5-arap`)

- EV-ARAP-01 bölüm A, B ve C eksiksiz yapılacak. #152'deki Körfez kaynak araştırması temel alınacak.
- Bahreyn çizimleri gibi izni doğrulanmamış hiçbir kaynak içe aktarılmayacak.
- **Meclis:**
  - Çözücüde meclis parçası yok.
  - Meclis düzenlerini ölçüleriyle (minder derinliği, U ya da L düzen, orta alan, geçişler) kaynaklı olarak `knowledge/ev-projesi/veri/meclis.json` dosyasına yaz.
  - Ben bu dosyadan çözücüye meclis ekleyeceğim.
  - O zamana kadar meclisli sohbetlerde yerleşim "beklemede" olarak işaretlenir; uydurma koordinat yazılmaz.
- **Arapça stüdyo:** Arayüz çevirisi `assets/forma/i18n-ar.js` dosyasında (benim yaptığım).
  - Ana dili Arapça olan bir değerlendiricinin göreceği biçimde bir **inceleme listesi** hazırla: Körfez'de yaygın mobilya terimleri, yanlış ya da yapay duran karşılıklar.
  - Bu bir rapor olacak; `assets/` dosyasını değiştirme, ben uygularım.

## Aşama 6: Sınav seti (PR: `toparlama-6-sinav`)

`tests/ai-eval/aura-sinav-01/`: eğitime **hiç girmeyecek** 120 görev.

| Grup | Sayı | İçerik |
|---|---|---|
| Mobilya düzenleme | 40 | 9 dilde komutlar (5'i Arapça). Hedef: işlem dizisi ve beklenen son ölçü/malzeme |
| Ev ve yerleşim | 40 | Plan anlatımı → oda işlemleri; oda + eşya + istek → kısıtlar. Hedef: çözücünün kabul ettiği kısıt seti |
| Tekstil | 20 | Perde ve halı istekleri → `tekstil.js` sürüm 2 kaydı |
| Zor durum | 20 | Sığmayan eşya, kural dışı istek (yük taşıyan duvarı kaldırma), belirsiz ölçü, dil değiştiren kullanıcı, kaba ya da alakasız istek |

- Her görev için puanlama kuralı yazılır: tam, kısmi, sıfır.
- `score.mjs` mevcut altyapıya eklenecek.
- Görevler eğitim verisindeki planlarla aynı kaynak planı kullanmaz.
- Temel Qwen (eğitimsiz) bu sınavdan **GPU'suz bir koşu planıyla** geçirilecek şekilde hazırlanır; koşu yapılmaz.

## Aşama 7: Hacim (PR'lar: ülke başına)

- **Hedef:** Ülke başına 30–40 sohbet. Ülkeler:
  - Avrupa: BE, NL, DE, FR, UK, IE, DK, ES, IT, AT, CH;
  - Türkiye;
  - Arap ülkeleri: AE, SA, QA, KW, EG, MA.
- Her sohbet en az 8 tur. Sohbet türleri çeşitlensin:
  - yalnızca mobilya;
  - bütün ev projesi;
  - perde ve halı;
  - "sığmıyor" durumu;
  - fikir değiştiren kullanıcı;
  - tasarımcıya gönderme.
- Her sohbet AURA-EGITIM-1 biçiminde yazılır, denetimden ve üslup denetiminden geçer.
- **Mobilya komutları:** 9 dilde, dil başına en az 200 doğal komut ("kolları biraz alçalt", "ceviz ayak", "240'lık 3 kapaklı"). `vocabulary(design)` ile gerçek seçeneklere bağlanır. #69'daki `studio_data.mjs` altyapısı kullanılır.
- **Hız:** Bir turda bir ülke grubu. Her tur ayrı PR. Önce Aşama 1–4'ü bitir, sonra hacme geç.

## Aşama 8: Eğitim hazırlığı (çalıştırmadan) (PR: `toparlama-8-hazirlik`)

- `tools/qwen-local/training-plan.json` birleşik biçime göre güncellenecek. Model: Qwen3.5-9B, LoRA; yalnızca cevap loss'u.
- Tahmini maliyet ve süre: A40 ve benzeri; veri boyutuna göre.
- Dağıtım seçenekleri raporu: sunucuda barındırma ya da istekle çalışan GPU; aylık maliyet aralığı.
- "Başlat" komutunu kullanıcı onayı verince ben ya da sen çalıştırırız. Bu işte çalıştırılmayacak.

## Kabul

- Her aşamanın PR'ı ayrı. Doğrulama komutları ve çıktıları açıklamada olacak.
- `tests/hepsi.sh` yeşil.
- Katalog, birleşik veri ve sınav seti birbirine sızmıyor; denetim kanıtı eklenecek.
- Yasaklı terim 0, dil karışması 0.
- Açık kusurlar dürüstçe listelenecek.

Sıra: 1 → 2 → 3 → 4 → 5 → 6 → 7 (sürekli) → 8. Bir aşamada takılırsan raporla ve bir sonrakine geç; takılan iş kaybolmasın.
