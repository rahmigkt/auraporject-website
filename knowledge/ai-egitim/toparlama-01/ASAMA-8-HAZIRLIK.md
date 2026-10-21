# Aşama 8 — eğitim ve dağıtım hazırlığı; çalıştırılmadı

## Gerçek veri ve kapalı kapılar

2.578 aday karantinada, train/dev/test 0/0/0. Aday mesajlarda 6.798.231 karakter (ortanca 2.779, en uzun 3.038); bunlar tokenizer token sayısı değildir. Kaynak ağacı ve dosya hash'leri estimate çıktısında. Model/tokenizer indirilmedi, CPU/GPU eğitimi ve temel model sınavı yapılmadı. Bu makinede CUDA GPU yok; 36 GB RAM eğitim performansı kanıtı değildir.

Eski training-plan.json, Git baytları ve SHA ile `archive/training-plan-pre-toparlama.json` olarak saklandı. Eski196/40/40 pilot ve4saat/3dolar onayı yeni işe taşınmadı. Güncel plan2 ortak biçimi ve karantinayı esas alır. Modelin resmi [kartı](https://huggingface.co/Qwen/Qwen3.5-9B) Qwen3.5-9B'yi Apache2.0 image-text-to-text olarak tanımlar; burada yalnız metin LoRA taslağı vardır, görüntü eğitimi yoktur.

## Eğitim sözleşmesi

- Temel revizyon, tokenizer/processor ve chat-template hash'i sabitlenmeli. Aynı istem ve `{reply,actions}` dış biçimi eğitim/sınav/canlıda kullanılmalı. Mobilyada PHP istemi okunuyor; ev/yerleşim/tekstil köprüsü canlıda eksik. Stüdyo sözlüğü değişirse bütün etiketler bayat sayılıp yeniden doğrulanmalı.
- Ortak kayıttaki mesajlar ve son yerleşim işlemleri henüz tur başına SFT etiketi değildir. Her asistan turu için önceki durum, o turun eylemi, gerçek motor sonucu ve kullanıcıya doğru açıklama gerekir. Son eylemi bütün cevaplara kopyalamak yasaktır. Bu eşleme tamamlanmadan trainer/export başlatılmaz.
- LoRA bf16 öneri ayarları: rank16/alpha16, microbatch1, accumulation8, tek GPU, checkpointing, packing kapalı, başlangıç LR1e-4; bunlar denenmiş optimum değildir. Görüntü kodlayıcı dondurulur; hedef modül isimleri gerçek model revizyonunda doğrulanmadan PEFT kurulumu sayılmaz. 48 GB VRAM adaydır, sığma garantisi yoktur; VRAM48GB/host RAM64GB/disk100GB hedefleri gerçek podla kontrol edilmeli.
- Yalnız asistan cevabı loss'a girer. System/user/tool/padding etiketleri -100; tokenization chat-template maskesi kullanılmalı. Substring/karakter sayısıyla maskeleme yok. Boş asistan maskesi, hizasızlık ve padding çakışması hata olur. `response_mask.py` bunun model yüklemeyen saf yardımcı/testidir; tam trainer değildir. 4.096 token aşılırsa sessiz kırpma yok; tam tur sınırında böl veya reddet.
- Onaylı kayıt hash'i, lisans, kaynak grubu ve bölüm sabitliği kontrol edilir; sınav120 hiçbir eğitim exportuna giremez. İlk10warmup+20ölçülen optimizer adımı ileride ölçülür; tam adım8microbatch içerir. Token/s, step/s, peakVRAM, seed, sürümler ve revizyon kaydedilir. Bu işte ölçülmedi.

## Koşullu süre hesabı

Formül: adım=ceil(N/8)×epoch; toplam saat=adım×saniye/3600×1,25+1saat hazırlık/değerlendirme. 10/20/40saniye **varsayımsal tam optimizer adımıdır**, ölçüm değildir. Veri hazırlama, insan/native onayı ve tekrar denemeleri dahil değildir.

| Gelecekte onaylı train hedefi | Epoch | Adım | 10/20/40sn varsayımında toplam saat | A40 salt GPU hesap bedeli |
|---|---:|---:|---|---|
| 200 | 2 | 50 | 1,17 / 1,35 / 1,69 | 0,69 / 0,80 / 1,00 USD |
| 1000 | 2 | 250 | 1,87 / 2,74 / 4,47 | 1,10 / 1,62 / 2,64 USD |

**Bugünün eğitim süresi/maliyeti null:** onaylı train0, benchmark yok. Tablodaki veri mevcut değil. Diğer GPU için aynı adım süresini varsaymak hız eşitliği kanıtı değildir.

## Dağıtım seçenekleri — yalnız rapor

21Ekim2026 [resmi fiyat sayfasında](https://www.runpod.io/pricing) Pod A40/A6000 0,59USD/saat, L40S1,09; serverless A40/A6000 saat eşdeğeri1,22 görülüyor. Stok/hesap teklifi değildir. 730saat kesintisiz A40≈430,70USD/ay; L40S≈795,70. Serverless ayda10–100 **faturalanan işçi saati** varsayımıyla12,20–122USD hesap bedeli. [Resmi faturalama belgesi](https://docs.runpod.io/serverless/pricing) flex'in sıfıra inebildiğini ve işçi tamamen durana kadar faturalandığını açıklar. Soğuk başlangıç/bekleme süreleri bu saate dahildir. Vergi, depolama ve ağ eklenir. Bunlar kullanıcı başına gecikme tahmini değildir.

| Yol | Kullanım | Açık sınır |
|---|---|---|
| Yerelde kuantize çıkarım | Öncelikli; kiralık GPU aylığı0 | CPU gecikmesi/elektrik ölçülmedi; dışarıdan eve erişim otomatik açılmaz |
| Sürekli sunucu | Düzenli trafik varsa sonra değerlendirilir | Boş bekleme de maliyet, şu anda açılmayacak |
| İstekle çalışan GPU | Değişken trafik için olası | Soğuk başlangıç, kuyruk, kişisel ev fotoğrafları için rıza/saklama/silme politikası ve ayrı güvenli entegrasyon gerekir |

Hiçbir kaynak oluşturulmadı; anahtar, müşteri verisi veya ağırlık depoya konmadı. Sunucu seçimi bu raporla yapılmış sayılmaz.

## Başlatmadan önce

Kusurlar kapanacak; güncel motor tekrarları, hash bağlı insan/native onayları, tur/eylem sözleşmesi ve aynı kapalı test tamamlanacak. Biçim≥%98, kapalı test≥%95, doğalTR≥%90, netleştirme/ret≥%95, gerileme yok; hepsi gerçek modelde ölçülecek. Ana dil/anlam uzman incelemesi olmadan mekanik sınav puanı resmi kabul değildir. Yeni yazılı süre/maliyet ve karar sahibinin açık başlatma onayı olmadan kiralık GPU/eğitim yok. Şimdi kapı kapalıdır.

## Doğrulama

`tests/qwen-training-plan-check.py`: adım/kısmi batch aritmetiği,0onaylı kayıt, null gerçek süre/maliyet, eski plan hash'i, kapalıGPUkapısı, maske hizası/boş/padding/bozuk ret testleri geçti. `estimate.py` yalnız dosya ölçer, model veya ağ çağırmaz. Tam depo sonuçları ayrı son doğrulama raporunda; yeşil olduğu varsayılmaz.


Son takip: hepsi.mjs57/62 geçti; beş eski servis/snapshot hatası açık. Forma148,7sn geçti. Main#156 sonrasında eski studio_data VM çıkarımı ortak üretim actions.js importuna taşındı; yeni beş aile tekrar testi geçti. Tarihsel snapshot hâlâ değişmiş normalizasyon nedeniyle başarısız; geçmiş veri yeniden yazılmadı. Ayrıntı/ham kayıtlar SON-DURUM sayfasında. Maskenin ve estimate testlerinin ilk girişleri geçti. Yeni tekrar testinin ilk fixture'ında mutfak için olmayan genel height alanı aranmıştı; gerçek worktopHeight sözlüğü seçilerek düzeltildi, uygulama kodu gevşetilmedi.
