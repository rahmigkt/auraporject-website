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
| ev | `duvar_ekle`, `duvar_sil`, `duvar_tasi`, `aciklik_ekle`, `oda_tanimla`. `kat_ekle`, `merdiven` ve `oda_birlestir` henüz yok; dürüstçe reddedilir |
| yerlesim | `yerlestir {oda, esyalar[{tur, en, derinlik}], kisitlar[{tur: bakar, yakin, uzak; a; b; mm}]}`, `secenek_sec` |
| tekstil | `perde {...}`, `hali {...}` (tekstil.js sürüm 2 alanları) |
| proje | `projeye_ekle`, `tasarimciya_gonder` |

Rapor alanları:
- `kabul`, `red` (her ret nedeniyle birlikte), `uyari`;
- `uyari` içindeki kodlar: `sinira_takildi` (hedef ölçüye ulaşılamadı), fizik uyarıları, `oda_alani_olagan_disi`, `kapi_eni`, `sigmiyor`, `kisit_karsilanmadi`;
- `olcum`, `gecti`.

Qwen konum yazmaz. Yerleşimde kısıt yazar, konumu çözücü bulur. Motor, kısıtları en çok karşılayan seçeneği seçer ve karşılanmayan kısıtları raporlar.
