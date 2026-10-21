# AURA görev listesi

Tek kaynak bu dosyadır. Her iş başında güncel `main`'den okunur. Biten iş `[x]` yapılır, PR numarası yazılır. Yeni iş buraya eklenir. Kapsam: yapay zekâ yalnızca ev projesi (plan, oda, eşya türü + toplam ölçü, yerleşim, perde/halı/ışık, tasarımcıya gönderme). Onay: çapraz denetim (`EGITIM-PLANI-STUDYO.md`).

**Geçici kullanıcı yetkisi (21 Ekim 2026):** Claude'un beş günlük yokluğunda Codex ikinci geçişte kendi denetimini yaparak H4 → C7 → H5 → E1–E6 sırasını sürdürür. Öz denetim kararları `denetci: Codex`, `review_mode: user_authorized_self_review` ve gerçek kanıtla kaydedilir; Claude incelemesi gibi gösterilmez. İstisna 26 Ekim 2026 23.00 (İstanbul) sonrasında yeni kararlara uygulanmaz. Plan ve denetim ölçütleri: `CODEX-BES-GUN-PLANI.md`. Merge/GPU/ücretli işlem sınırları değişmez.

## Codex

Kurallar: `assets/`, `api/`, kök `.html` dosyalarına dokunulmaz. Silme yok, sayı uydurma yok. Eğitim, GPU, ücretli API, dağıtım yok. Her iş ayrı PR. Merge kullanıcı onayıyla.

- [x] **C1 · #187 düzeltmeleri.** PR #187'de C1/2 teslimi: 9 dil × 200 kayıt, dil başına 200 kullanıcı kalıbı, çokluda 40/50 kısıtlı istek. Claude yeniden denetimi bekliyor; önceki `duzelt` kararı korunur, onay sayılmaz. Rapor: `HACIM-01-H1-ISTEK-RAPOR.md`. Özet:
  - asistan cevabı isteğe özgü olur, sabit cümle yok;
  - "duvar çalışma alanı" kalıbı (9 dilde) çıkar;
  - çoklu istekler `;` yapıştırması değil, tek doğal cümle; en az %20'si kısıtlı (`bakar/yakin/uzak`);
  - soru cevapları isteğin kendisini sorar (halı → ölçü/renk/doku);
  - dil başına en az 150 farklı kalıp; ev sahibinin kendi evini anlattığı istekler artar;
  - plana uzakta boş oda ekleme kalıbı azalır.
- [x] **C1b · #187 kalan düzeltmeler** (Claude ikinci denetimi, `kararlar.json`): EN/FR/ES/IT/DA'da 'for the furniture' türü yapıştırma bağlacı olan 42 satır yeniden yazılır; asistan açılış kalıpları çeşitlenir. Tekstil satırları kalır (kullanıcı kararı: perde/halı asistanın işinde). #193 (eski mobilya komutu sürümü) kapsam dışı; kullanıcı onayıyla kapatılır.
- [x] **C8 · Eğitim betiğini EGITIM-01 biçimine bağla — PR #204.** `tools/qwen-local/train_gpu.py` `outputs/egitim-01/{train,dev}.jsonl` (messages; son asistan turu `{"reply","actions"}`) okur, loss yalnız asistan turlarında. CPU'da 5 örnekle kuru koşu (model yüklemeden tokenizasyon + maske denetimi). GPU açılmaz. (`EGITIM-01.md`)
  - PR #204 main'de; G9a (#205) sonrasında eski beş uzun kayıt gerçek tokenizer ile yeniden kontrol edildi: 6131 / 4515 / 4313 / 5232 / 3920 token, hepsi 6144 içinde; yanıt maskeleri doğru, kırpma yok. Kanıt: `H4-G9A-CPU-DOGRULAMA.json`. Bu beş kayıt kontrolüdür; tüm küme veya H4 token kapısı sayılmaz. H1 intent bölmesi G9a kararıyla aynı ev içindeki niyet ölçümüdür, yeni ev genellemesi değildir. Eğitim başlatılmadı.
- [ ] **E1 · Ortak puanlayıcı** `tools/egitim/puanla.mjs` (biçim, motor, istek, dürüstlük, dil, kısalık; hile testleri).
- [ ] **E2 · Süzerek öğrenme döngüsü** `tools/egitim/ornekle.py`; CPU kuru koşu.
- [ ] **E3 · Pekiştirmeli öğrenme hazırlığı** (GRPO yapılandırması, KL, sınav aralığı; CPU kuru koşu).
- [ ] **E4 · Görsel hakem araştırması** → `GORSEL-HAKEM-01.md`.
- [ ] **E5 · Serbest çizim araçları sözleşmesi** → `SERBEST-CIZIM-SOZLESME-01.md`.
- [ ] **E6 · Ev tekstili seçenek kataloğu** → `knowledge/ev-projesi/veri/ev-tekstili-katalog.json`.
- [ ] **C2 · 47 kaydın üslup düzeltmesi.** `inceleme/kararlar.json` içindeki `duzelt` kayıtları (ev-sohbet-02, uk-ie, dk 01/03/04, es, arap-olculu):
  - asistan satırlarında iç terim kalmaz ("adsız oda", "hesap", "kayıt", "yerleştirilen eşya sayısı", "elle konum");
  - kullanıcı satırları doğal olur, kendi evini anlatır;
  - Arapça ölçülü sohbetler kısa ve robotik olmaktan çıkar (selam, ihtiyaç, soru, öneri akışı);
  - motorda yeniden doğrulanır, sonra Claude'a yeniden denetime sunulur.
- Not: motorda artık `aydinlatma/isik` ve kalıcı `tasarimciya_gonder` var (G4, G5); C1 ve C3'te kullanılabilir.
- [ ] **C3 · H2 Avrupa sohbetleri.** Sıra BE, NL, DE, FR, UK, IE, DK, ES, IT, AT, CH, TR. Her ülke 30 sohbete tamamlanır; bir PR bir ülke.
  - gerçek plan (Swiss Dwellings/ResPlan, atıflı), en az 8 tur;
  - `yerlestir` + `kisitlar`, koordinat yok;
  - gerçek takımlar: salon 3+2+1 (+kahve köşesi, yan sehpa), yatak odası yatak + 2 komodin + gardırop + şifonyer, çocuk odası, antre ayakkabılık + portmanto;
  - otomatik küçültme yok; sığmazsa asistan söyler ve sorar;
  - sohbet türleri: bütün ev, tek oda, eşya değişimi, perde/halı, sığmıyor, fikir değiştiren kullanıcı, tasarımcıya gönderme;
  - yasaklı terim 0.
- [ ] **C4 · H3 Arap dünyası.** AE, SA, QA, KW, sonra EG, MA; her ülke 30 sohbet.
  - aile salonu ve daire senaryoları;
  - meclis senaryoları (meclis main'de, #183);
  - villa/dubleks (kat ve merdiven main'de, #184); gerçek Körfez planı yoksa "uyarlanmış referans" yazılır;
  - ağır perde, katmanlı tül, büyük halı (`tekstil.js` sürüm 2).
- [ ] **C5 · H4 yerleşim verisi kısıt biçimine.** ProcTHOR çözücü kayıtları → girdi (oda JSON + eşya listesi + kısa istek, 9 dil), hedef (`yerlestir` + `kisitlar`). Kısıtlar sonuçtan çıkarılır, motorda yeniden çözülür; tutmayan kayıt girmez. Claude'un yeni takımlı verisi (G3) gelince aynı araçla işlenir.
  - Taslak PR #206: dönüşüm aracı, negatif testler, kesilince sürdürme ve işçi sayısından bağımsız çıktı denetimi hazır. 4340 kaynak yapısal olarak ayrıştırıldı; tam motor koşusu `work/h4-full.jsonl` günlüğünde sürüyor. Kontrol noktası: `veri/yerlesim-kisit/denetim/ilk-kisim.json`. Henüz tamamlanmayan odalar kabul edilmiş sayılmaz; C5 açık kalır. Yeni Codex dönüşüm hedefleri Claude denetimini bekler; kaynak Claude verisinin C7 denetimi ayrıdır. Kullanım: `tools/yerlesim-veri/H4.md`.
- [ ] **C6 · H5 sınav.** `aura-sinav-01`'deki 40 mobilya düzenleme görevini arşivle; yerine 40 ev projesi isteği koy (5'i mobilya detayı → stüdyoya yönlendirme). Yeni sürümü dondur. Küçük yerel Qwen ile CPU'da uçtan uca ilk koşu; sonuç "eğitimsiz temel ölçüm" olarak kaydedilir.
- [ ] **C7 · Claude verisinin denetimi.** sohbet-001, yerleşim kayıtları, motor örnekleri. Kararlar `inceleme/codex-kararlari.json`.

## Claude

- [x] **G1 · Merdiven doğrulama hataları** (#189) (Codex #187 bulgusu): özel değerlerde rıht 150–190 mm, basamak 250 mm alt sınırı uygulanır; kat yüksekliği pozitif olmalı. Test eklenir.
- [x] **G2 · #187 denetimi** (karar: düzeltilmeli). 1.800 istek örneklenerek okunur (her dilden), kararlar `kararlar.json`'a ve inceleme sayfasına yazılır. Uygunsa kullanıcı onayıyla merge.
- [x] **G3 · Yerleşim verisinin takımlarla yeniden üretimi.** 3+2+1, okuma köşesi, yatak takımı; 2 saatten kısa parçalar, akışlı yazım. `procthor-aura-cozucu.jsonl.gz` yenilenir, rapor güncellenir.
- [x] **G4 · Aydınlatma motor sözlüğüne.** `aksesuar.js` ışık kuralları motorda `isik` işlemi olur (H1'de eksik kaldı).
- [x] **G5 · Tasarımcıya gönderme hedefi.** `proje` katmanında `tasarimciya_gonder` işleminin motorda kalıcı kaydı.
- [x] **G7 · Ev tekstili ürün araştırması** (`knowledge/ev-projesi/EV-TEKSTILI-URUN-ARASTIRMA-03.md`). Uygulama kullanıcı kararından sonra.
- [x] **G8 · Eğitim kümesi derleyici** (`tools/egitim/derle.mjs`, `sistem.md`, `EGITIM-01.md`). İlk koşu: 51 uygun kayıt.
- [x] **G9a · C8 engelleri (#204):** (1) Uzun sohbetler: istemdeki durum artık özet (`derle.mjs` `ozet()`: duvar, açıklık, oda, eşya kimlik ve ölçüleri; kanıt/meta yok). DK-02 durumu 92.829 → 6.709 karakter; en uzun örnek 11.051 karakter. `max_sequence_length` 4096 → 6144 (A40 için yeterli). Codex gerçek tokenizer ile 5 kaydın sınır içinde kaldığını doğrular. (2) H1 tek kurgusal evde: dev bölmesi niyet grubuna göre kalır; bu "yeni ev" genellemesini ölçmez, onu kapalı sınav ve H4 (4.340 farklı gerçek oda) ölçer. Kabul.
- [ ] **G9 · Eğitim öncesi kararlar:** H1 ve H4 geldikçe denetim, kümeyi derleme, sınav puanlayıcısını yeni biçime bağlama.
  - G9a sonrası Codex CPU doğrulaması: eski beş bağlam taşması 6144 sınırı içinde (`H4-G9A-CPU-DOGRULAMA.json`). H1'in aynı evde intent bölmesi kararı korunur; yeni ev genellemesi iddia edilmez. H4'te aynı kaynak evin odaları ortak `split + house` grubu taşır. Tam H4 motor koşusu, çapraz denetim ve son küme/sınav kapıları hâlâ bekler.
- [ ] **G10 · Ev tekstili ürün ailesi** (stüdyoda perde ve halı; E6 kataloğu gelince).
- [ ] **G11 · Serbest çizim araçlarının stüdyoda uygulanması** (E5 sözleşmesinden sonra).
- [ ] **G6 · C2 ve C3 çıktılarının denetimi** (her PR geldikçe).

## Kullanıcı kararları

Verildi (21 Ekim 2026): model Qwen3.5-9B; GPU sınırı 6 saat / 4 dolar; perde ve halı asistanın işinde (seçim ve ölçü projeye eklenir). Eğitim sırası `EGITIM-01.md`.

**Codex için öncelik sırası (eğitime giden yol):** C1b (bitti, #187 uygun ve main'de) → C8 → H4 (C5) → C7 → H5 (C6) → EGITIM-02 işleri E1–E6 (`CODEX-IS-EMRI-EGITIM-02.md`). C2, C3, C4 eğitim sonrasına kalır.

Kararların güncel durumu:

- [x] GPU harcama sınırı: oturum başına 6 saat / 4 dolar (#201).
- [x] Model: Qwen3.5-9B (#201).
- [ ] Sitede kullanıcı oturumlarının izinle kaydı.
