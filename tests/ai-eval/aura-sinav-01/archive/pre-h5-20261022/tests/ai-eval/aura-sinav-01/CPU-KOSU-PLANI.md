# GPU'suz temel model koşusu — hazırlık, çalıştırılmadı

120 görev / 240 mekanik puan. 40 mobilya (9 dil, 5 Arapça), 40 ev/yerleşim, 20 tekstil, 20 zor durum. Görev ve motor ağacı FREEZE.json ile kilitli. Bağımsız AURA özgün sınav odaları `exam-only-*` kaynak kimliği kullanır; mevcut birleşik adaylarda bu kimlikler yoktur. Dışarıda bulunmayan kaynaklarla karşılaştırma iddiası yoktur.

Önce uzmanlar her hedefi, ölçüyü, dili ve rubriği onaylamalı. Şimdiki gold motor doğrulaması model başarısı veya insan onayı değildir. İlk iki taslak model görülmeden arşivlendi: ölçü/kapı tutarlılığı, sonra istemde cevap ipucu ve dil geçişi düzeltildi. Hiçbiri eğitimde kullanılamaz.

1. Tam model revizyonu, tokenizer/chat template, yerel CPU runtime sürümü ve kuantizasyonu kaydet. 36 GB RAM kapasite bilgisi yeterli hız/uyumluluk kanıtı değildir; eğitim yapılmaz.
2. `node tools/aura-sinav-01/prompts.mjs > work/sinav-prompts.jsonl` yalnız istem hazırlar. PHP gerekir. Mobilya canlı PHP istemini kullanır; diğer katmanların ortak istemi taslaktır, canlı sohbet entegrasyonu tamamlanmadan eşdeğerlik iddia edilmez. Gold/rubrik modele gönderilmez.
3. Modeli tek CPU işi, sabit seed, temperature=0, sabit çıktı token sınırı ile elle başlat; ağ servisi açma. Her cevap için `{id,output}` JSONL sakla. Kesilmiş, geçersiz ve zaman aşımı cevaplarını eksiltme; eksik cevap sıfırdır. İlk birkaç görevin süre/RAM ölçümünden toplam tahmini çıkar; yavaşsa durdur ve raporla. Bu iş emri koşuyu yetkilendirmiyor.
4. `node tests/ai-eval/aura-sinav-01/score.mjs work/predictions.jsonl > work/sinav-score.json`. Tahmin ve puanlayıcı SHA raporda saklanır. Aynı dosya ve koşullar ileride adapter ile karşılaştırılır; sınav eğitime taşınmaz.
5. Zor durum puanı dil ipuçlarıyla ön elemedir; anlamsal doğruluk ve ana dil incelemesi zorunludur. Mekanik puan resmi kabul ölçüsü değildir. Reddedilen eylemi yaptığını söyleyen cevapları insan ayrıca tarar. Uzman değerlendirmesi olmadan GPU kapısı açılamaz.

Süre/maliyet: ölçüm yok; bu aşamada model yüklenmedi, tahmini CPU hızı uydurulmadı. Eğitim maliyeti ayrı hazırlık raporuna aittir. Aday havuzu ile sınav hiçbir exportta birleştirilmez; `toparlama-sinav-check.mjs` mevcut aday kimlikleriyle sızıntıyı denetler.
