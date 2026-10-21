# AURA yapay zekâ eğitimi — çalışma düzeni

Başlangıç: 2026-10-18. Bu klasör, AURA stüdyosunun yapay zekâ işlerinin (komut anlama, görselden tasarım, tarz) nasıl
yürütüleceğini ve denetleneceğini tanımlar.

Güncel karar (2026-10-19): kiralık sunucu yerine yerel Qwen3.5-9B hazırlığı.
Mimari, veri pilotu ve sıradaki ölçümler: [QWEN-YEREL-01.md](QWEN-YEREL-01.md).
SUNUCU-01'in sunucu kiralama önerisi uygulanmayacak. Aşağıdaki eski aşama özeti
tarihsel bağlamdır; yeni yerel hazırlığın sırası QWEN-YEREL-01'de tanımlıdır.

## Roller

| Rol | Kim | İş |
|---|---|---|
| Karar | Hüseyin Rahmi Göktaş | Kapsamı, uzmanı, modeli ve her aşamaya geçişi onaylar. |
| Yürütücü | Codex | İş emirlerindeki önerileri uygular: veri, değerlendirme koşuları, raporlar. |
| Denetçi | Claude | Ölçütleri önceden kayda geçirir, main'e gelen işi bağımsız denetler (D0, D1, …), bir sonraki iş emrini önerir. |
| Uzman | (belirlenecek) | Altın cevapları ve tarz işaretlerini onaylar. Onay olmadan hiçbir kayıt "resmi" sayılmaz. |

İş emirleri öneridir; karar sahibi değiştirebilir. Denetçi, yürütücünün ürettiği altın cevapları kendi yargısını
görmeden ayrıca okuyabilir (kör ikinci okuma).

## Ilkeler

1. **Önce ölçüm, sonra eğitim.** Donmuş bir sınav seti ve önkayıtlı ölçütler olmadan hiçbir model, kural ya da
   istem (prompt) değişikliği "iyileşme" diye raporlanmaz.
2. **Sınav seti donar.** `test` bölümü bir kez dondurulur (`tests/ai-eval/FREEZE.json`, SHA-256). Donmuş dosya
   değişirse puanlayıcı bunu raporlar ve sonuç geçersizdir. Geliştirme yalnız `dev` bölümüyle yapılır.
3. **Altın cevap insan onaylıdır.** Codex'in ya da bir modelin ürettiği etiket `unreviewed` kalır; resmi puan yalnız
   `approved` kayıtlarla hesaplanır. Onaysız puan "ön skor" diye etiketlenir.
4. **Çok dilli şema, Türkçe ağırlık.** Ürün yalnız Türkçe ile sınırlı kalmayacak. Her kayıt `lang` taşır; sitenin
   sekiz dili (tr, en, de, fr, nl, da, es, it) aynı şemada. Anadil denetimi olmayan çeviriler `notes` içinde işaretlenir.
5. **Müşteri verisi yok.** Sınav ve eğitim verisi müşteri sohbeti, iletişim bilgisi ya da fotoğrafı içermez.
   Tasarımcı onay kayıtları ileride ancak açık rızayla ve ayrı bir karar ile veri olur.
6. **Yapay zekâ önerir, müşteri onaylar.** Model çıktısı doğrudan uygulanmaz; puanlayıcı da yalnız önerilen eylemleri ölçer.

## Dosyalar

- `CODEX-IS-EMRI-SINAV-01.md` — ilk iş emri önerisi: komut sınav seti ve taban ölçüm.
- `ONKAYIT-SINAV-01.md` — ölçütler ve karar kuralları (sonuçlar gelmeden önce yazıldı).
- `DENETIM-D0.md` — başlangıç denetimi: bugünkü kural okuyucunun bilinen hataları.
- `tests/ai-eval/score.mjs` — puanlayıcı (denetçinin; yürütücü değiştirmez).
- `tests/ai-eval/ornek.jsonl` — 10 biçim örneği. Sınavın parçası değildir.

## Aşamalar (yol haritası özeti)

1. Komut sınav seti ve taban ölçüm ← **şimdi**
2. Sunucu yapay zekâsını beş aileye genişletmek; kural okuyucu ile aynı sınavda karşılaştırma
3. Görsel sınav seti (fotoğraf → parametre) ve ölçüm
4. Tarz işaretleme (uzman) → tarz başına parametre kuralları
5. Tasarımcı onaylarından gerçek veri (rıza ile)
6. Model ince ayarı — yalnız sınav bunu gerektirirse
