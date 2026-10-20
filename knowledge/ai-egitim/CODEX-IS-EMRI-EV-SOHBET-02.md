# CODEX-IS-EMRI-EV-SOHBET-02 — Ev planı sohbetleri, düzeltme turu (gerçek plan tabanlı)

Başlangıç: güncel `main`. Önceki iş: PR #132 (EV-SOHBET-01). Bu iş onun yerine geçer; #132'deki çözücü altyapısı korunabilir, sohbet ve planlar baştan yapılır. `assets/` klasörüne dokunma.

## #132'de bulunan hatalar (tekrarı kabul edilmez)

1. Bütün planlar aynı kalıp: üst üste eşit kutular + koridor.
2. Alanlar gerçek dışı: 120 m² stüdyo, 20 m² banyo, 33 m² antre, "60 m²" denip 116 m² çizilen daire.
3. Kalıp diyalog; Türkçe cümle içinde İngilizce oda adları; robot tonu.
4. Mobilyalar mekanik dizilmiş; kapı açılımı, pencere, geçiş payı gözetilmemiş.
5. Merdiven/dubleks yok.

## A · Planlar gerçek veriden

- Her sohbetin evi **Swiss Dwellings (CC BY 4.0)** veya **ResPlan (CC BY 4.0)** içinden gerçek bir plandan türetilir. Kaynak kimliği kayda yazılır (`source: {dataset, id, license}`).
- Kullanıcının tarifine göre değiştirmek serbest (oda birleştirme, duvar kaldırma), ama değişiklik sohbette geçer ve kayıtta işlem olarak durur.
- Format: `assets/ev/ornekler/gercek-*.json` ile aynı EV-01 kaydı (walls, openings, spaces, items). `ev.html` "Plan dosyası aç" ile açılabilmeli.
- 20 sohbet: Belçika 8 (Brüksel, Gent, Anvers, Liège; apartman + sıra ev), Hollanda 4, Almanya 3, Fransa 2, Türkiye 3. En az 3 tanesi iki katlı (merdiven: genişlik ≥ 800, basamak 2a+b ≈ 630 mm, sahanlık).

## B · Ölçü denetimi (kodla, her kayıtta)

`tools/ev-sohbet/denetim.py` yaz; teslimde bütün kayıtlar geçmeli:

| Kontrol | Sınır |
|---|---|
| Toplam net alan | sohbette söylenen değere ±%8 |
| Banyo | 3,5–9 m² (tek banyolu daire) |
| WC | 1,1–2,5 m² |
| Antre/hol | ≤ toplamın %12'si |
| Yatak odası | ≥ 7 m², kısa kenar ≥ 2,4 m |
| Kapı eni | iç 780–930, giriş ≥ 900 |
| Pencere/oda tabanı | yaşam odalarında ≥ %10 (ülke kuralını kaynakla) |
| Duvar kesişmesi, açık poligon, oda çakışması | sıfır |

Sınırların her biri için kaynak (ülke yönetmeliği veya Neufert) `denetim.py` başında yazılı olsun. Sınırı geçen gerçek plan varsa silme; neden geçtiğini kayda not et.

## C · Yerleşim

Mobilyaları `assets/ev/yerlesim.js` içindeki `solveRoom` ile yerleştir (Node'dan import et; değiştirme). Çözücü "sığmıyor" derse asistan bunu kullanıcıya dürüstçe söyler ve seçenek sunar (daha küçük masa, açılır yatak vb.). Elle koordinat yazmak yok.

## D · Sohbet

- Dil kullanıcının dili: TR, NL, FR, DE. Aynı sohbette dil karışmaz; oda adları o dilde.
- Her sohbet farklı bir insan ve durum: kiracı/ev sahibi, çocuklu aile, evden çalışan, yaşlı çift, öğrenci. En az 8 tur.
- Asistan önce ölçü ve kroki sorar, emin olmadığını söyler, yanlış söylenen ölçüyü düzeltir ("salon 40 m² dediniz ama çizdiğim 31 m² çıkıyor, hangi duvarı yanlış aldım?").
- Duvar rengi ve zemin AURA'nın tasarımı değildir; yalnızca mevcut evi tanımak için sorulur.
- Kalıp cümle yasak: 20 sohbetin hiçbirinde aynı asistan cümlesi iki kez geçmesin (denetim.py bunu da sayar).

## Teslim

- `knowledge/ai-egitim/veri/ev-sohbet-02/*.json` (sohbet + plan + işlemler), `tools/ev-sohbet/denetim.py` ve çıktısı, kısa rapor `EV-SOHBET-02-RAPOR.md` (her sohbet için: kaynak plan, alan, geçen/kalan kontroller).
- 3 sohbetin planını `ev.html`'de açılır örnek olarak `knowledge/` altında bırak; ben bakıp `assets/ev/ornekler/`'e taşırım.
- Eğitim çalıştırma, ücretli servis, GPU yok. PR aç, birleştirme.
