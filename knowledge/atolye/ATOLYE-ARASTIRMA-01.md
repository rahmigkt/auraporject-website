# ATOLYE-ARASTIRMA-01 — Tasarımcı Atölyesi için açık kaynak araştırması ve geliştirme önerileri (Codex iş emri)

Tarih: 2026-10-19 · Yazan: Claude (denetçi) · Karar sahibi: Hüseyin · Uygulayan: Codex

## Amaç

`tasarimci.html` eğitimden önce **oymalar hariç her şeyi** yapabilmeli. Geliştirmeyi Claude
yapacak; Codex'ten istenen **araştırma ve öneri**. Eksik listesi: `knowledge/atolye/EKSIKLER.md`.

## Görev 1 — Açık kaynak taraması

Tarayıcıda çalışan (sunucu gerektirmeyen), three.js ile uyumlu, ticari kullanıma uygun lisanslı
kütüphaneleri araştır. Her biri için: lisans (MIT/BSD/Apache tercih; LGPL/GPL ise sonucu açıkça yaz),
boyut (gzip), WASM gerekip gerekmediği, bakım durumu (son sürüm, aktiflik), mobil/tablet performansı,
EKSIKLER.md'deki hangi maddeyi çözdüğü, entegrasyon riski.

En az şu alanlar:
- **Katı modelleme / boolean (delik, cep, kanal, yiv):** ör. manifold-3d, three-bvh-csg, replicad /
  opencascade.js, JSCAD.
- **Kenar profilleri, süpürme, loft, bükme:** ör. replicad, JSCAD extrude/sweep, verb-nurbs.
- **2D yol ve ofset (CNC, siluet, takım yarıçapı):** ör. Clipper2 (clipper2-js), maker.js, paper.js, earcut.
- **Seçme ve gizmo:** three TransformControls, three-mesh-bvh.
- **Kısıt ve ölçü (parametrik çizim):** ör. planegcs (FreeCAD çözücüsünün WASM'ı) ve benzerleri.
- **Çıktı:** DXF (delik/katman/takım bilgisi), STL, STEP/3MF yazıcılar.
- **Birleştirme/fizik:** basit FEA veya kiriş çözücüler (tarayıcıda), mobilya için yeterli olanlar.

## Görev 2 — Geliştirme önerileri

Mevcut kodu oku: `assets/forma/atelier.js`, `overrides.js`, `physics.js`, `mesh.js`, `build.js`,
`generate.js`, `production/app.js`. Öneriler:
- Override katmanının (bugün siluet + profil) yeni işlemlere nasıl genişleyeceği: veri biçimi önerisi
  (parça ekleme, dönüşüm, kenar profili, boolean, malzeme), bağlantı (`#d=`) boyut sınırı, geri uyum.
- Üretim çıktısına etkiler (kesim listesi, DXF, BOM).
- Qwen eğitimiyle ilişki: her yeni işlem için sözleşmede eylem adı ve doğrulama (QWEN-YEREL-02 ile uyumlu).

## Teslim

`knowledge/atolye/ARASTIRMA-RAPOR-01.md`: karşılaştırma tablosu, her madde için 1. tercih + yedek,
lisans uyarıları, tahmini boyut bütçesi, önerilen veri biçimi. İstersen küçük deneme sayfaları
`tests/atolye-deneme/` altında (siteye yüklenmez).

## Sınırlar

- `assets/` ve canlı siteye dokunma; geliştirmeyi Claude yapacak.
- GPL/AGPL bileşen önerirsen sonuçlarını açıkça yaz; varsayılan olarak önermeyin.
- Ücretli servis, sunucu, hesap açma yok.
- PR'ı karar sahibinin talebi olmadan birleştirme.
