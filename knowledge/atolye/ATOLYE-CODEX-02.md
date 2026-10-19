# ATOLYE-CODEX-02 — Codex'e verilen işler (atölye geliştirmesine paralel)

Tarih: 2026-10-19 · Yazan: Claude · Karar sahibi: Hüseyin · Uygulayan: Codex
Geliştirmeyi (A dizi/hizalama, B malzeme, C fizik, D çıktılar, E–I) Claude sırayla yapıyor.
Codex **`assets/` dosyalarına dokunmaz**; veri, araştırma, test ve denetim üretir. Her iş ayrı PR, birleştirme karar sahibinde.

## 1. Birleştirme (joinery) standart tablosu — E için veri
`knowledge/atolye/veri/birlesim.json` + kısa rapor. Zıvana (kör/geçme), kırlangıç, kavela, Domino (5/6/8/10/14 mm),
lamello, minifix/konfirmat için: parça kalınlığına göre ölçüler (zıvana kalınlığı ≈ T/3 vb.), derinlik, kenara min.
mesafe, tolerans, CNC ile yapılabilirlik (takım çapı, iç köşe yarıçapı), tipik kullanım. Kaynak zorunlu
(Festool/Häfele/Hettich katalogları, ders kitapları); kaynaksız değer yazma, belirsizse aralık ve not.

## 2. Malzeme ve bağlantı fiziği verisi — C için
`knowledge/atolye/veri/malzeme-fizik.json`: catalog.js'deki her ağaç (gurgen, meşe, dişbudak, kayın, ceviz, kiraz, tik,
füme/siyah meşe), MDF/kontrplak/sunta, çelik/alüminyum/pirinç, mermer/traverten/granit için: yoğunluk, E (lif boyu/enine),
eğilme dayanımı, vida/kavela çekme değerleri, öneri emniyet katsayısı. Kaynak + birim. `physics.js` mevcut değerleriyle farkları listele.

## 3. Aile aile yakın plan kalite denetimi — ara düzeltmeler için
Masa, dolap, mutfak, banyo (oturma bitti). Her ailede ≥6 başlangıç modeli, `tests/visual/foto/` araçlarıyla
(stüdyo fotoğrafı + yakın plan) görüntü al; hata listesi çıkar: doku yönü/ek yeri, havada parça, iç içe geçme,
yanlış ölçek, kaba kenar, renk. `knowledge/atolye/DENETIM-AILE-01.md` + görüntüler `tests/visual/denetim-01/`.
Düzeltme yapma; Claude düzeltecek.

## 4. Qwen sözleşmesine atölye eylemleri — QWEN-YEREL-02 devamı
Yeni atölye işlemleri: `add, remove, duplicate, transform, edge, sweep, cut` (+ gelecek: array, align, material).
Biçimleri `assets/forma/overrides.js` `normalizeOverrides` içinde. Her biri için: doğal TR/EN komut örnekleri
(≥30/işlem), beklenen JSON, reddedilmesi gereken örnekler (geçersiz ölçü, olmayan parça), doğrulama betiği
(Node'da `compileDesign` ile derlenip parça sayısı/ölçü kontrolü). İnsan onayı için 40'lık paket.
`outputs/qwen-local/atolye-v1/` (siteye yüklenmez). Stüdyo kaynak hash'ine bağla; bayatlık testi.

## 5. STEP / LGPL karar notu
Replicad+OpenCascade'i ayrı, isteğe bağlı modül olarak dağıtmanın LGPL yükümlülüklerini somutlaştır:
ne yayımlanmalı, kullanıcıya hangi bildirim, statik site/PWA/mağaza uygulamasında fark. Karar sahibine 1 sayfa.
Hukuki görüş değildir; belirsiz noktaları açık yaz.

## Sınırlar
`assets/` ve canlı site yok; ücretli kaynak yok; GPU yok. Çıktılar `knowledge/`, `tests/`, `outputs/` altında.
