# Denetim D0 — başlangıç durumu (2026-10-18, Claude)

Main: `b37f51c` (PR #42). Bu denetim, sınav seti kurulmadan önce bugünkü durumu kayda geçirir.

## Yapay zekâ altyapısı

- Sunucu tarafı (`api/forma-ai.php`, Anthropic Messages API) **kapalı**: `ai_enabled: false`, anahtar yok.
  Sistem istemi yalnız oturma ailesini tanıyor; masa, dolap, mutfak ve banyo eklenmemiş.
- Stüdyoda komutları bugün yalnız kural okuyucu (`assets/forma/commands.js`, `parse`) anlıyor; sekiz dilde
  kelime listeleriyle çalışıyor.
- Eğitim yapılmadı. `knowledge/style-training/candidates.jsonl` 52 sentetik, onaysız tarz örneği; yalnız
  seviyorum / istemiyorum ayrımı için. Komut sınavı yok.

## Kural okuyucunun gözlenen hataları (elle 7 deneme)

| Cümle (aile) | Çıktı | Sorun |
|---|---|---|
| koltuğu 2 metre yap (oturma) | hiçbir eylem | "metre" birimi okunmuyor |
| mermer olmasın (masa) | tezgah = taş | **olumsuzlama tersine uygulanıyor** |
| tezgah taş olsun (mutfak) | renk = gümüş | "taş" malzeme değil renk sanılıyor |
| şu an 2 çekmece var 4 yap (dolap) | çekmece = 2 | ilk sayı hedef sanılıyor |
| 3 kapaklı meşe gardırop 240 cm (dolap) | tür, kapak tipi, meşe | genişlik 240 cm atlanıyor; bölme sayısı ifade edilemiyor |
| kolları biraz alçalt (oturma) | kol yüksekliği −15 | doğru |
| make it oak and 180 wide (dolap) | meşe, genişlik 1800 | doğru |

`tests/ai-eval/ornek.jsonl` üzerindeki ön skor (10 biçim örneği, onaysız): tam doğru 0,50; F1 0,57;
yasak ihlali 0,75. Bu sayı sınav değildir, yalnız puanlayıcının çalıştığını gösterir.

## Risk notu

En ağır hata türü olumsuzlamanın tersine uygulanması: müşteri "istemiyorum" dediği şeyi tasarımında görür.
Önkayıtta "yasak ihlali oranı" bu yüzden ayrı ölçüt ve canlıya alma eşiği ≤ 0,02.

## Sıradaki denetim

D1: Codex'in SINAV-01 teslimi (kabul ölçütleri iş emrinin sonunda).
