# Stüdyo motoru

Stüdyonun tarayıcısız hâli. Eğitim verisi ve sınav seti buradan geçer (`knowledge/ai-egitim/EGITIM-PLANI-STUDYO.md`).

- `motor.mjs`: `uygula(durum, islemler)` → `{state, rapor}`. Site ile aynı kodu kullanır:
  - mobilya: `assets/forma/actions.js`, `ai.js`, `physics.js`;
  - yerleşim: `assets/ev/yerlesim.js`;
  - tekstil: `assets/ev/tekstil.js`.
- `uygula.mjs`: komut satırı. `node tools/studyo-motoru/uygula.mjs girdi.json [--rapor]`. Çıkış kodu 0 ise geçti, 2 ise kaldı.
- `test.mjs`: davranış testleri.

İşlem sözlüğü `SOZLUK` içinde (sürüm `studyo-motoru/1`):

| katman | işlemler |
|---|---|
| mobilya | `set`, `delta`, `enum`, `material`, `style`, `kind`, `family`, `seats`, `drawers`, `mattress` |
| ev | `duvar_ekle`, `duvar_sil`, `duvar_tasi`, `aciklik_ekle`, `oda_tanimla`. `kat_ekle {id, yukseklik}` (yükseklik 2200–6000) (dış duvarlar kopyalanır), `merdiven {alt, ust, konum, aci, en}` (rıht 150–190, basamak ≥ 250, en ≥ 800, 2·rıht + basamak ≈ 630 ± 30, sahanlık ≥ en, rıhtlar kat yüksekliğini tam tutar; alt kattaki bir odaya sığmalı; üst katta boşluk açılır, merdiven yerleşimde engel sayılır). Her ev ve yerleşim işlemi `kat` alır. `oda_birlestir` henüz yok; dürüstçe reddedilir |
| yerlesim | `yerlestir {oda, esyalar[{tur, en, derinlik}]` (meclis: `{tur: meclis, duzen: U|L, derinlik}` — duvar boyunca oturma, kapılar açık kalır, derinlik bilinmiyorsa 800 mm AURA önerisi)`,, kisitlar[{tur: bakar, yakin, uzak; a; b; mm}]}`, `secenek_sec` |
| tekstil | `perde {...}`, `hali {...}` (tekstil.js sürüm 2 alanları) |
| aydinlatma | `isik {oda, tur?: tavan, sarkit, lambader, masa, aplik; adet? 0–12; kapat?; renk_k? 2200–5000}`. Işıklar eşyadan otomatik türetilir (`aksesuar.js`); işlem türü kapatır, adedini değiştirir ya da renk sıcaklığını verir. Ölçüm: oda başına ışık sayısı |
| proje | `projeye_ekle`, `tasarimciya_gonder {not?}` (en az bir oda gerekir; gönderim durumda `proje.gonderimler` olarak kalır) |

Rapor alanları:
- `kabul`, `red` (her ret nedeniyle birlikte), `uyari`;
- `uyari` içindeki kodlar: `sinira_takildi` (hedef ölçüye ulaşılamadı), fizik uyarıları, `oda_alani_olagan_disi`, `kapi_eni`, `sigmiyor`, `kisit_karsilanmadi`;
- `olcum`, `gecti`.

Qwen konum yazmaz. Yerleşimde kısıt yazar, konumu çözücü bulur. Motor, kısıtları en çok karşılayan seçeneği seçer ve karşılanmayan kısıtları raporlar.
