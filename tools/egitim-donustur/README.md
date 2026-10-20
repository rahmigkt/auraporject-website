# AURA-EGITIM-1 dönüşümü

`python tools/egitim-donustur/donustur.py` yalnız izlenen katalog adaylarını okur. `superseded` ve `yalnizca-arastirma` kümeleri eğitime çevrilmez. JSON şeması `knowledge/ai-egitim/AURA-EGITIM-1.schema.json`, motor sözlüğü `ISLEM-SOZLUGU-1.json`.

Ortak alanlar: id, dil/ülke (bilinmiyorsa null), katman, kaynak dosya/hash/lisans ve gruplayıcılar, önceki stüdyo durumu, rol/metin mesajlar, tur/katman işlemler, gerçek denetim, bölüm. `tur` yalnız inceleme biçiminin işlem anahtarıdır; ince `motor.mjs` adaptörü aynı motorun `type` anahtarına çevirir. Alternatif çözücü yoktur.

Ev sohbetlerinde mevcut planın eşyasız kopyası durumdur. Son başarılı oda taleplerinden ürünün gerçekten derlenen en/derinlik/yüksekliği alınır; koordinat hedefi yazılmaz. Mevcut kaynak plan koordinatları yalnız girdidedir. Kısıt uydurulmaz; kayıtta açık kısıt yoksa liste boş kalır. Motora istek gönderilir ve rapor kaydedilir. Bu, konuşmanın her turunun ayrı geri oynatılması iddiası değildir; tamamlanmış konuşmanın son yerleşim isteklerinin denetimidir. Özgün geometri/sohbet dosyaları değiştirilmez.

00C/00D program JSON'u, metin tavsiyesi veya eksik kaynak için hayalî stüdyo işlemi üretilmez; neden karantinaya ayrıldığı yazılır. Eski Qwen verisi bayatsa otomatik güncellenip eski onayını devralmaz. Konuşma olmayan metin denemeleri `missing_messages` ile tutulur ve eğitime girmez.

Her kaynak plan, bina ve geometri imzası birlikte gruplanır; farklı dil/ülke/kimlik bu grubu bölemez. Birleşik bağlı bileşenlerin %80/%10/%10'u train/dev/test'e atanır; **satır oranı aynı olmak zorunda değildir**. Sızıntı denetimi karantinadaki bütün adaylarda da çalışır. Donmuş eski sınavlar dönüştürücüye hiç alınmaz.

`adaylar.jsonl` başarısız/bekleyen ortak kayıtları taşır. `train/dev/test.jsonl` yalnız yeterli kayıtlar içindir. Şu an bu üç dosya boştur. İnsan ve dil onayı çıkarımla verilmez. İleride `birlesik/onaylar.json` içindeki karar `{id: {approved:true, language_ok:true, reviewer:"...", row_sha256:"..."}}` biçimindedir; `approval_digest` bütün girdi/mesaj/hedefe bağlı hash üretir. Bu dosya bu tur oluşturulmadı ve hiçbir gerçek onay uydurulmadı. Hedef değişirse onay geçersizleşir. Başka bir kusur/uyarı varsa onay tek başına örneği kabul ettirmez.

JSON şeması kayıt biçimini, motor işlem semantiğini, ayrı insan/dil incelemesi de anlatımı kontrol eder. İlk terim taraması sınırlıdır; Aşama 4'teki çok dilli üslup denetiminin yerine geçmez. Motorun uyarılı sonucu tam kabul sayılmaz. `source_lock` bütün assets ve motor Git ağacına bağlıdır; kirli motor kaynağı reddedilir. Kaynak değişince tekrar üretim/inceleme gerekir.

`python tests/toparlama-bicim-check.py`: şema, hash'e bağlı inceleme, kaynak/bina sızıntı mutasyonları, koordinatsız hedefler ve boş eğitim çıktıları. Model çağrısı/eğitim yoktur. Canlı sohbetin birleşik yanıt biçimine bağlanması ve tur bazlı etiketleme, assets sorumlusu ile ayrıca tamamlanmalıdır; kayıt standardı tek başına canlı istem eşitliği sağladı diye raporlanmaz.
