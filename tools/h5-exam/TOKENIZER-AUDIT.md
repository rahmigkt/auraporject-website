# H5 gerçek bölücü ön kontrolü

`tokenizer-audit.py` model ağırlığı, GPU, eğitim veya servis yüklemeden mevcut
yerel Qwen bölücüsünü kullanır. Giriş `prompts.mjs` ile dondurulmuş 120 görevden
üretilir. `load.mjs` sınav/kaynak/motor kapıları aynen çalışır.

```powershell
python tools/h5-exam/tokenizer-audit.py --tokenizer-dir LOCAL_TOKENIZER --output work/h5-tokenizer-new.json
```

`tokenizers==0.22.2` ve `Jinja2==3.1.6` ile doğrulandı. Çıktı yolu yeni olmalıdır;
eski kanıt ezilmez. Bölücü, şablon, kaynak SHA ve çalıştırılan kod SHA raporlanır.

120 istemin her birinde gerçek eğitim yolu `egitim01_features.prepare_features`
ile kullanım öneki token token karşılaştırıldı; payload ve EOS maskesi denetlendi.
İki asistan turlu ayrı sentetik geçmiş kontrolü geçti. Her kontrolde yanlış EOS
ve eksik boş düşünme öneki reddedildi: toplam 242 olumsuz kontrol.

Hedefler bu denetim için sentetiktir: sabit probe yanıtı ve mevcut beklenen
eylemler, gerçek SOZLUK eşlemesiyle açıkça eklenen `katman` alanını kullanır.
Dondurulmuş gold değiştirilmez; bu kayıt eğitim örneği veya anadil onayı değildir.
H5 istemi henüz canlı PHP akışıyla eşdeğer sayılmaz. Yerel bölücü dosyaları tekrar
kullanıldı; upstream model revizyonu bu kontrolde yeniden doğrulanmadı.

Kanıt `knowledge/ai-egitim/H5-TOKENIZER-ONKONTROL.json`. 120 örnek 6144 token
sınırında kaldı; bu sentetik hedef uzunlukları modelin üreteceği uzunluk değildir.
Model üretimi ve eğitimsiz küçük Qwen CPU temel ölçümü bekliyor; C6 tamamlanmadı.
Denetçi Codex, review_mode=user_authorized_self_review; bağımsız Claude değildir.
