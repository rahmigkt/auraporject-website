# EGITIM-01 hazırlık ve CPU denetimi

`train_gpu.py` artık varsayılan olarak `outputs/egitim-01/{train,dev}.jsonl` okur. Eski geometri egzersizi dosyasına otomatik geri dönmez. `egitim01_runner.py` yeni giriş yoludur; `egitim01_features.py` CPU ve GPU için aynı metin/maske üretimini kullanır. Eski pilot betiği `archive/train_gpu-before-egitim01.py` içinde Git 128dd93 baytlarıyla saklanır. `response_features` adı eski pilot çağıranları için korunur; yeni EGITIM yolu bu son-tur yardımcısını kullanmaz.

## Kullanım

```sh
python -m pip install -r tools/qwen-local/requirements-egitim01-cpu.txt
node tools/egitim/derle.mjs
python tools/qwen-local/train_gpu.py
python tools/qwen-local/train_gpu.py --dry-run --samples 5 --tokenizer-dir PATH_TO_LOCAL_QWEN_TOKENIZER --output work/egitim01-cpu
```

Yerel dizinde yalnız `tokenizer.json`, `tokenizer_config.json` ve `chat_template.jinja` gerekir. Ağırlık indirilmez veya okunmaz; CPU yolu Torch/Transformers/Unsloth yüklemez. Beş örnek yalnız train'den, sıralama boyunca eşit aralıklarla seçilir. Dev örnekleri train'e katılmaz. `--output` yeni bir dizin olmalıdır.

Varsayılan komut yalnız biçimi denetler; tokenizasyon yapılmış gibi davranmaz. CPU denetimi `features.jsonl` ve `dry-run.json` yazar. Bağlam taşarsa **çıkış kodu 2** ve `status: dry_run_context_overflow` döner. Bu, maske başarısızlığı anlamına gelmez: `assistant_payload_and_eos_masks_passed` ve `context_gate_passed` ayrı alanlardır. Hiçbir örnek sessizce kırpılmaz veya atılmaz.

## Maske sözleşmesi

- Her asistan turu tam `{"reply": string, "actions": array}` JSON'u olmalıdır; son tur asistan olmalıdır.
- Baştaki sistem istemi ve `DURUM` sistem mesajı içerik kaybetmeden birleştirilir. Qwen şablonu ortada yeni sistem mesajı kabul etmez; bu durum reddedilir.
- Yerel gerçek Qwen şablonu uygulanır, gerçek BPE tokenları ve karakter ofsetleri kullanılır. Şablonun rol/payload sınırları girişle bire bir doğrulanır.
- Loss yalnız **bütün asistan turlarının JSON içeriği ve EOS** üzerinde hesaplanır. Sistem, kullanıcı, rol başlığı ve boş düşünme bloğu `-100` alır. GPU batch collator'ında padding etiketi de `-100`'dür.
- Denetim, loss verilen tokenları tekrar decode ederek bütün asistan JSON'ları + EOS ile tam eşitlik arar. Kontrol işareti enjeksiyonu, sınırı geçen token, bozuk JSON, yinelenen anahtar ve train/dev ID çakışması reddedilir.

## Bu teslimde ölçülen

Güncel main `af8ed63` üzerinde H1 onayı (#187, #202) korunarak derleme yenilendi: **1851 kayıt, 1759 train + 92 dev**. Beş örnekte yerel BPE/maske denetimi tamamlandı (DK-02 ve DE/ES/IT/TR H1 örnekleri); aynı işlem tekrarlandığında hem özellik dosyası hem rapor aynı baytları verdi. Ardından 1759 train örneğinin tamamı bağlam uzunluğu için ölçüldü; maskeler hepsinde doğru. Önceki 49 train + 2 dev ölçümü H1 onayı öncesine aittir.

Çevirilerde aynı motor girdileri tekrarlandığından derleyici yalnız aynı koşu içindeki bire bir aynı durum/işlem JSON'unun sonucunu paylaşır. 1535 işlemli kayıt için 149 farklı girdi güncel motorda çalıştırıldı, 1386 tekrar kullanıldı. Önceki koşudan sonuç okunmaz; farklı durum, farklı işlem ve ret sonuçları için negatif test vardır. Mevcut motor ret kapısının anlamı değiştirilmedi.

4096 sınırını aşan beş kayıt: DK-02 **35511**, IT-01 **25880**, IT-02 **23695**, IT-03 **29176**, IT-04 **22102** token. Kaynaklar silinmedi, metin kırpılmadı, sınır otomatik yükseltilmedi. Bu beş eski ev kaydının `DURUM` temsili/bağlam bütçesi G9 derleme işinde çözülmelidir. Dev'in tamamı bu ek train denetimine katılmadı; GPU ön hazırlığı her iki bölmeyi de denetler.

İkinci engel: H1 tek sentetik plan kullanmasına rağmen derleyicinin intent grubu nedeniyle 1710 H1 kaydı train'e, 90 kayıt dev'e ayrılıyor. ID'ler farklı olsa da bu bağımsız ev ölçümü değildir. Ortak plan grubu G9'da düzeltilmeli, derleme ve CPU kapıları yenilenmelidir. Bu teslim veri bölümlemesinin güvenli olduğunu veya eğitimin hazır olduğunu iddia etmez.

GPU yürütmesi ancak ayrıca verilen `--execute`, `--approved-run` ve gözden geçirilmiş plandaki açık eğitim kapısıyla mümkündür. Bütün train/dev örnekleri, ağırlık veya model çerçevesi yüklenmeden önce bağlam sınırından geçmelidir. Bu teslimde GPU yolu çalıştırılmadı veya CUDA uyumluluğu yeniden kanıtlanmış sayılmadı. Eğitim döngüsü zaman sınırı sağlayıcı faturasını/kaynak kapatmasını yönetmez; sağlayıcı harcama kontrolü ayrı altyapı işidir.

Denetimler: `python tests/egitim01-mask-check.py` (12 sözleşme/negatif test), `node tests/egitim-motor-onbellek-check.mjs`, eski pilot maske uyumluluğu, eğitim planı ve büyük eğitim kapısı testleri geçti. Tam `node tests/hepsi.mjs` koşusu Forma testinin 180 saniyelik süre sınırını aşmasının ardından durduruldu; tam yeşil sonuç iddia edilmez. Tamamlanan alt sonuçlar ve makine kanıtı `knowledge/ai-egitim/C8-CPU-DOGRULAMA.json` içindedir. Bu rapor eğitim veya model temel ölçümü değildir.
