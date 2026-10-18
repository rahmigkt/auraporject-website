# Codex iş emri önerisi — TASARIM-01: söyleneni anlayıp tasarımı çizen model

> **BEKLEMEDE (2026-10-18):** karar sahibinin yönüyle öncelik METİN-01'de. Bu iş emri Codex'e iletilmedi.

Hazırlayan: denetçi (Claude), 2026-10-18. Karar sahibinin yönü: yapay zekâ cümle ayıklamakla kalmasın; söyleneni
anlayıp mevcut kategorilerde **eksiksiz, üretilebilir bir tasarım (çizim)** çıkarsın, sonra **özgün** tasarımlara
geçsin. SINAV-01B bu modelin "dinleme" sınavı olarak kalır; asıl hedef aşağıdadır.

## Görev tanımı

Girdi: müşterinin serbest anlatımı (+ varsa mevcut tasarım). Örnek: "Salon dar, 3 kişilik ama 2 metreyi geçmesin,
kollar alçak, meşe ayaklı, açık renk keten; kedim var tüylü kumaş olmasın."
Çıktı: stüdyonun tasarım JSON'u — `{family, kind, style, params, materials}` (normalizeDesign şeması). Stüdyo bunu
doğrudan çizer: 3D, teknik çizim, parça listesi. Model asla serbest çizim üretmez; motorun dilinde tasarım üretir,
motor çizer. Bu yüzden her çıktı üretilebilir olmak zorunda.

## Aşama A — Mevcut kategorileri tamamlama

1. **Veri: ters üretim (tasarımdan anlatıma).** Motor sınırsız geçerli tasarım üretebiliyor (`generate.js`
   `sample`, aile `starts`, `normalizeDesign`, `validate`). Her aile ve türden çeşitli, hatasız tasarımlar örnekle
   (tarz × tür × tohum; başlangıç modelleri ve onların değiştirilmişleri). Her tasarım için gelişmiş bir yapay zekâ
   (API) 3–5 farklı müşteri anlatımı yazar: kısa / uzun / dolaylı / olumsuz içeren / birimsiz; 8 dil, ağırlık
   Türkçe. Anlatım tasarımın **söylenen** özelliklerini içerir, söylenmeyenler "serbest" sayılır.
   Kayıt: `{brief, lang, design, stated: [söylenen özelliklerin listesi], forbidden: [...]}`.
   Hedef: ilk tur 6.000 çift; aileler eşit; dev/test tasarım bazında ayrılır (aynı tasarımın anlatımları aynı tarafta).
2. **Model:** yerel Qwen3.5 4B, LoRA ince ayar, çıktı JSON'a kısıtlı (grammar/JSON şeması). Eğitim kiralık GPU'da
   (tahmini 1–3 saat koşu başına). Karşılaştırma tabanları: (B1) kural okuyucu + başlangıç modeli, (B2) API modeli
   aynı istemle, eğitimsiz (B3) Qwen 4B.
3. **Sınav (TASARIM-01, donmuş):** 300 anlatım; test tasarımları eğitimde hiç görülmemiş. Ayrıca 60 anlatım
   tamamen insan elinden (gerçek müşteri gibi), yapay zekâ üretimi değil.

## Ölçütler (önkayıt eki)

| Ölçüt | Tanım | Canlı eşiği |
|---|---|---|
| Geçerlilik | Çıktı şemaya uyuyor, `compile` + `validate` hatasız | ≥ %98 |
| İsteğe uyum | `stated` özelliklerin karşılanma oranı (sayılarda ±%3 ya da adım) | ≥ %90 |
| Yasak ihlali | `forbidden` özelliklerden birinin çıktıda bulunması | ≤ %2 |
| Tamlık | Söylenmeyen her şey tarza uygun değerle dolu (boş/varsayılan yığını değil) | uzman puanı ≥ 4/5 |
| Tasarım kalitesi | Tasarımcı (ya da onay yapay zekâsı) 1–5 puan: oran, tarz tutarlılığı, üretilebilirlik | ort. ≥ 4 |

## Aşama B — Özgün tasarım (A eşiği geçtikten sonra)

- Model başlangıç modellerini kopyalamadan yeni bileşimler önerir: "özgünlük" = en yakın başlangıç modeline
  parametre uzaklığı (normalize). Özgün sayılması için uzaklık eşiğin üstünde **ve** geçerlilik + kalite eşiği
  tutmalı.
- Tasarımcı (insan) seçimleri birikince tercih eğitimi (DPO): aynı anlatıma iki tasarım, seçilen kazanır.
- Motorun ifade edemediği biçimler (yeni parça türleri) modelle değil motora parça ekleyerek açılır; model ancak
  motorun söz dağarcığında özgün olabilir. Yeni parça ihtiyaçları ayrı listelenir.

## Onay: gelişmiş yapay zekâ ile

Karar sahibinin talebi: altın cevaplar ve kalite puanları gelişmiş bir yapay zekâdan onay alır.
- Onaylayan model üreten modelden **farklı** olur (üreten ve onaylayan aynı model olamaz).
- Kayıtta `label: {review: "approved", reviewed_by: "ai:<model-adı>", rubric: "<sürüm>"}`; puanlayıcı bunları
  "yapay zekâ onaylı" diye ayrı raporlar.
- Her turda rastgele %10'u insan (karar sahibi ya da tasarımcı) kontrol eder; insan–yapay zekâ uyumu < %90 ise o
  tur onayları geçersiz sayılır.
- SINAV-01B için de aynı yol: `uzman-onay-01b.csv` onay yapay zekâsına verilir, sonuçlar `onaylar-01b.json`'a.

## Yapma
`assets/` motorunu ve `score.mjs`'yi değiştirme (motor eksikleri rapora). Müşteri verisi kullanma. Test
tasarımlarını eğitime sokma. API anahtarlarını depoya koyma.

## Teslim (ilk PR)
Örnekleyici + ters üretim betikleri, 6.000 çift (dev/test ayrımıyla), donmuş TASARIM-01 testi + 60 insan anlatımı
yeri (boş şablon; anlatımları karar sahibi yazar), tasarım puanlayıcısı önerisi (`score-design.mjs`, denetçi
onayına), B1–B3 taban ölçümleri, `RAPOR-TASARIM-01.md`. Eğitim koşusu ikinci PR'da, D4 denetiminden sonra.
