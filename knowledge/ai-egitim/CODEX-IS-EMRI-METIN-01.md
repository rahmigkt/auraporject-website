# Codex iş emri önerisi — METİN-01: AURA'nın sesi — tasarıma tanıklık eden metinler

Hazırlayan: denetçi (Claude), 2026-10-18. **Bu iş önceliklidir.** Karar sahibinin yönü: stüdyo yeterli; eksik olan
ürünlerin metinsel anlatımı. AURA bir mobilya parçası satmaz, insanın birlikte yaşayacağı **tanıkları** üretir.
Yapay zekânın kuracağı cümleler bu düzeyde, güçlü ve sanatsal olmalı. ARAŞTIRMA-01 bu işin ikinci planına iner:
teknik kaynak taraması yalnız metne malzeme olduğu ölçüde yapılır.

## Kanon (sesin kaynağı)

- `knowledge/aura-kaynak/AURA_PROJECT.pdf` (+ `.txt`) — manifesto, politika, terimler.
- Eski site alt marka metinleri (`archive/site-v1/`): VEREV, GÖNYE, MASİF, İSKARPELA, KAVELA. Örnek:
  "İki yüzeyin kavuştuğu yerdeki o kusursuz, sessiz sadakat."
- Karar sahibinin bundan sonra yazacağı ve onaylayacağı metinler. **Kanonun son sözü karar sahibindedir.**

## 1. Ses kılavuzu (`knowledge/aura-ses/SES-KILAVUZU.md`)

Kanondan çıkar, uydurma: temalar (mekân, beden, sessizlik, zaman, el teması, tanıklık, bütünlük), cümle ritmi ve
uzunluğu, bakış (nesne konuşmaz, gözlenir), sözcük dağarcığı ve **AURA terimleri sözlüğü** (her terim: kanondaki
tanımı + alıntı yeri). Yasaklar: pazarlama kalıpları ("lüks", "kaliteli", "şık", "modern çizgiler", "zamansız
tasarım"), üstünlük sıfatları, ünlem, emoji, ürün özelliği sıralaması. Her kural kanondan bir örnekle gösterilir.
Karar sahibi onaylamadan kılavuz kesinleşmez.

## 2. İlham kataloğu (`knowledge/aura-ses/ilham.jsonl`)

Nesne, mekân, ev, zanaat, malzeme ve dokunma üzerine edebî ve felsefî metinler; Türkçe ağırlıklı, çok dilli.
- Telif süresi dolmuş ya da açık lisanslı metinlerden kısa alıntı alınabilir (kaynak, lisans yazılır).
- Telifli eserlerden **alıntı alınmaz**; yalnız fikir ve tema notu (eser, yazar, fikir özeti, AURA'da nereye).
- Kayıt: `{eser, yazar, tarih, lisans, alıntı|null, fikir, tema, aura_bağlantısı}`. Hedef 100+ kayıt.

## 3. Görev: tasarımdan metin

Girdi: stüdyonun tasarım JSON'u (aile, tür, tarz, ölçü, malzeme, parça, çizgi). Çıktı (JSON, 8 dil; önce tr, en):
- `ad` — parçaya özgü kısa isim (alt marka geleneğinde; marka/kişi adı değil),
- `tanik` — 50–110 kelime AURA sesinde metin,
- `iz` — tek cümle: elin ya da gözün fark edeceği somut bir ayrıntı (birleşim, yüzey, oran),
- `dayanak` — metindeki her somut iddianın tasarımdaki karşılığı (ör. "ceviz" → `materials.wood.species`).

**Doğruluk zorunlu:** metin tasarımda olmayan malzeme, ölçü, işçilik ya da köken iddia edemez. `dayanak`
otomatik denetlenir.

## 4. Veri ve onay

- Her aile/türden 300 çeşitli tasarım (motor örnekler); her biri için gelişmiş bir yapay zekâ 3 taslak yazar,
  kılavuz + kanon + ilham notları istemde.
- Onay yapay zekâsı (yazandan farklı model) rubrikle puanlar: ses uyumu, doğruluk, özgünlük, klişe, tekrar.
- **Altın küme:** en iyi 120 taslak karar sahibine gider; o düzeltir ya da yeniden yazar. Bu 120 metin sesin
  ölçüsüdür; insan elinden geçmemiş metin altın sayılmaz.
- Yerel model (Qwen3.5 4B) ince ayarı, altın küme + yapay zekâ onaylı metinlerle; karşılaştırma: eğitimsiz Qwen
  ve API modeli aynı istemle.

## 5. Ölçütler (başlangıç değerleri)

| Ölçüt | Yöntem | Hedef |
|---|---|---|
| Doğruluk | `dayanak` otomatik denetim | %100, ihlal = ret |
| Ses uyumu | onay yapay zekâsı 1–5 + karar sahibinin kör seçimi (altın metinle yan yana) | ort. ≥ 4; kör seçimde altına ≥ %35 tercih |
| Klişe | yasak listesi + n-gram tekrarı | yasak 0; ürünler arası tekrar düşük |
| Çeşitlilik | aynı aile içi metin benzerliği | eşik rapordan |

## Teslim (ilk PR)
Ses kılavuzu taslağı + terim sözlüğü, ilham kataloğu, 30 örnek tasarım için taslak metinler (3'er), dayanak
denetleyicisi, onay rubriği, karar sahibine gidecek okuma dosyası. Toplu üretim ve eğitim, kılavuz onaylanınca.
Dal: `codex/aura-metin-01`. PR açılır, birleştirilmez; denetim D3.
