# AURA görev listesi

Tek kaynak bu dosyadır. Her iş başında güncel `main`'den okunur. Biten iş `[x]` yapılır, PR numarası yazılır. Yeni iş buraya eklenir. Kapsam: yapay zekâ yalnızca ev projesi (plan, oda, eşya türü + toplam ölçü, yerleşim, perde/halı/ışık, tasarımcıya gönderme). Onay: çapraz denetim (`EGITIM-PLANI-STUDYO.md`).

## Codex

Kurallar: `assets/`, `api/`, kök `.html` dosyalarına dokunulmaz. Silme yok, sayı uydurma yok. Eğitim, GPU, ücretli API, dağıtım yok. Her iş ayrı PR. Merge kullanıcı onayıyla.

- [ ] **C1 · #187 düzeltmeleri.** Karar: `kararlar.json` → `hacim-1-istek:*` = duzelt. Özet:
  - asistan cevabı isteğe özgü olur, sabit cümle yok;
  - "duvar çalışma alanı" kalıbı (9 dilde) çıkar;
  - çoklu istekler `;` yapıştırması değil, tek doğal cümle; en az %20'si kısıtlı (`bakar/yakin/uzak`);
  - soru cevapları isteğin kendisini sorar (halı → ölçü/renk/doku);
  - dil başına en az 150 farklı kalıp; ev sahibinin kendi evini anlattığı istekler artar;
  - plana uzakta boş oda ekleme kalıbı azalır.
- [ ] **C2 · 47 kaydın üslup düzeltmesi.** `inceleme/kararlar.json` içindeki `duzelt` kayıtları (ev-sohbet-02, uk-ie, dk 01/03/04, es, arap-olculu):
  - asistan satırlarında iç terim kalmaz ("adsız oda", "hesap", "kayıt", "yerleştirilen eşya sayısı", "elle konum");
  - kullanıcı satırları doğal olur, kendi evini anlatır;
  - Arapça ölçülü sohbetler kısa ve robotik olmaktan çıkar (selam, ihtiyaç, soru, öneri akışı);
  - motorda yeniden doğrulanır, sonra Claude'a yeniden denetime sunulur.
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
- [ ] **C6 · H5 sınav.** `aura-sinav-01`'deki 40 mobilya düzenleme görevini arşivle; yerine 40 ev projesi isteği koy (5'i mobilya detayı → stüdyoya yönlendirme). Yeni sürümü dondur. Küçük yerel Qwen ile CPU'da uçtan uca ilk koşu; sonuç "eğitimsiz temel ölçüm" olarak kaydedilir.
- [ ] **C7 · Claude verisinin denetimi.** sohbet-001, yerleşim kayıtları, motor örnekleri. Kararlar `inceleme/codex-kararlari.json`.

## Claude

- [x] **G1 · Merdiven doğrulama hataları** (#189) (Codex #187 bulgusu): özel değerlerde rıht 150–190 mm, basamak 250 mm alt sınırı uygulanır; kat yüksekliği pozitif olmalı. Test eklenir.
- [x] **G2 · #187 denetimi** (karar: düzeltilmeli). 1.800 istek örneklenerek okunur (her dilden), kararlar `kararlar.json`'a ve inceleme sayfasına yazılır. Uygunsa kullanıcı onayıyla merge.
- [ ] **G3 · Yerleşim verisinin takımlarla yeniden üretimi.** 3+2+1, okuma köşesi, yatak takımı; 2 saatten kısa parçalar, akışlı yazım. `procthor-aura-cozucu.jsonl.gz` yenilenir, rapor güncellenir.
- [ ] **G4 · Aydınlatma motor sözlüğüne.** `aksesuar.js` ışık kuralları motorda `isik` işlemi olur (H1'de eksik kaldı).
- [ ] **G5 · Tasarımcıya gönderme hedefi.** `proje` katmanında `tasarimciya_gonder` işleminin motorda kalıcı kaydı.
- [ ] **G6 · C2 ve C3 çıktılarının denetimi** (her PR geldikçe).

## Kullanıcı kararları (bekliyor)

- GPU harcama sınırı.
- Model boyutu: Qwen3.5-9B ile devam mı.
- Sitede kullanıcı oturumlarının izinle kaydı.
