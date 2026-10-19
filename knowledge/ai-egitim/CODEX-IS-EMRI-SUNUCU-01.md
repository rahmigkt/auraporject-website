# Codex iş emri önerisi — SUNUCU-01: AURA yapay zekâ sunucusu (Qwen, canlı çizim, render)

Hazırlayan: denetçi (Claude), 2026-10-19. Karar: dış API yerine kiralık GPU sunucuda Qwen. Önerilen makine Hetzner
GEX44 (RTX 4000 SFF Ada 20 GB, 64 GB RAM; aylık sabit ücret + bir kerelik kurulum). Hesabı karar sahibi açar;
SSH anahtarı ve kök erişim bilgisi depoya girmez.

## Kurulum
1. Ubuntu LTS, NVIDIA sürücüsü + CUDA, Docker + NVIDIA container toolkit; güvenlik duvarı yalnız 22 (anahtarla) ve 443.
2. **vLLM** (OpenAI uyumlu uç) ile **Qwen3.5-9B** (Apache-2.0, görüntü girdili). 20 GB'a sığacak nicemleme
   (FP8 ya da AWQ); sunulan model adı `aura-qwen`; düşünme kipi kapalı; JSON çıktı (`response_format`).
   Bağlam 16–32 k yeterli; eşzamanlı istek ve gecikme ölç.
3. **Caddy** ile `https://ai.auraproject.com.tr` (DNS A kaydı karar sahibinden), Let's Encrypt; uç yalnız
   `Authorization: Bearer <token>` ile; IP başına hız sınırı. Token yalnız sunucuda ve sitenin `forma-secrets.php`'sinde.
4. Sistem servisleri: yeniden başlatmada açılsın; günlükler 14 gün; sağlık ucu `/health`.

## Sitenin bağlanması
`api/forma-ai.php` hazır (`ai_provider: 'qwen'`, `qwen_url`, `qwen_token`, `qwen_model`). Görev: SINAV-01B
testini sunucuya karşı koş (`score.mjs --system preds:`) ve kural okuyucu ile karşılaştır; görsel okuma için 20 örnek
fotoğraf/eskizle duman testi. Sonuçları `RAPOR-SUNUCU-01.md`'ye yaz.

## Canlı çizim
`canli-cizim.html` eskiz alanı → görüntü → `forma-ai.php?action=vision`. Görsel okuma şu an oturma ailesi; beş aileye
genişlet (aile seçimi + o ailenin söz dağarcığı, `ai.js` `vocabulary()` ile). Model önerir, müşteri onaylar.

## Aynı makinede
- Blender (başsız) — SAHNELER.md sahne kütüphanesi ve isteğe bağlı tam render; GPU (OptiX) ile.
- İleride: QLoRA ince ayar (METİN-01 altın kümesi, SINAV/TASARIM verisi) — 20 GB'da 9B için QLoRA yeterli.

## Kabul
Komut cevabı ortalama ≤ 2 sn, görsel okuma ≤ 8 sn; SINAV-01B'de kural okuyucudan iyi (önkayıt kuralı 2);
yasak ihlali ≤ 0,02. Teslim: kurulum betikleri (`tools/server/`, sırsız), rapor. PR açılır, birleştirilmez.
