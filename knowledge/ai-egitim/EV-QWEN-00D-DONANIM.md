# EV-QWEN-00D — yerel taban ölçümünün kaynak ihtiyacı

20 Ekim 2026. İş emrinin F bölümündeki **ikinci yol** seçildi: kaynak ve maliyet
planı. Bu turda model ölçümü, model indirme, eğitim veya GPU kiralama yapılmadı.
Getir–uyarla sonuçları dil modeli başarısı olarak sunulmaz.

Mevcut ortam kullanıcı beyanıyla 36 GB RAM ve ayrık GPU yok; ortam değişkenleri
8 mantıksal işlemci gösteriyor. Önceki büyük model süre aşımından bir küçük model
hız sonucu çıkarılamaz. Makinede başka işler de yürüdüğünden uzun CPU çıkarımı
bu veri dönüştürme işiyle birlikte başlatılmadı.

## Sonraki yerel ölçüm için öneri

[Qwen2.5-1.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct)
resmî model kartı: Apache-2.0, 1,54 milyar parametre, 28 katman, 2 KV başlığı.
Bu, Qwen3.5:9b'nin eğitilmiş ya da eşdeğer bir sürümü değildir; yalnız ucuz biçim
ve araç sözleşmesi tabanı olabilir. 0,5B alternatif
[resmî kartta](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) bulunur.

Önerilen ilk dilim 50 kapalı istek: 25 Türkçe, 25 İngilizce; program üretimi,
belirsizlik/çelişki, netleştirme ve reddetme dengeli. Aynı `0.4-real` istemi,
şeması ve getir–uyarla aracı kullanılmalı. Tam yanıt, süre ve gerçek araç sonucu
saklanmalı; yalnız JSON biçimi başarı sayılmamalı. Tek durum için kesin zaman
sınırı, her durumdan sonra kalıcı sonuç ve toplam oturum sınırı gerekir.

Bellek hesabı: 1,54B × 2 bayt yaklaşık 3,08 GB FP16 ağırlık; FP32 yaklaşık
6,16 GB. Önbellek, çalışma alanı ve çalışma zamanı ayrıca gerekir. 4K bağlamda
8–12 GB boş RAM hedefi **mühendislik önerisidir**, bu makinede ölçülmüş tepe kullanım
değildir. 36 GB toplam RAM yeterli görünür; asıl belirsizlik boş CPU zamanı ve
çıkarım hızıdır. Eğitim belleği bu hesaptan çıkarılamaz.

50 × 1.500 çıktı tokenı için yalnız çözme süresinin duyarlılığı:

| Varsayımsal hız | 75.000 çıktı tokenı |
|---|---:|
| 2 token/sn | 10,42 saat |
| 5 token/sn | 4,17 saat |
| 10 token/sn | 2,08 saat |

Bunlar ölçülmüş hız veya bitiş tahmini değildir. Girdi işleme ve model yükleme
ek süre getirir. Önce 5 istekte gerçek hız ölçülmeli; 50'ye ondan sonra çıkılmalı.
Yerel çalışmada API/GPU kira bedeli **0 USD**; elektrik ve kullanıcının bilgisayar
zamanı bu sayıya dahil değildir. Otomatik GPU'ya geçiş yoktur. Kiralık ölçüm
istenirse güncel sağlayıcı fiyatı ve yazılı üst sınır ayrı onaya sunulmalıdır.

## Öğrenilmiş yerleşim modelleri için karar

| Yol | Ticari engel / veri | Donanım ve süre durumu | Karar |
|---|---|---|---|
| [HouseDiffusion](https://github.com/aminshabani/house_diffusion/blob/main/LICENSE) | Depo özel lisansı kod ve ağırlıklarda ticari kullanımı yasaklıyor; GPL dosyasını tek başına okumak yanlış olur. Hazır ağırlıklar RPLAN ile ilişkili. | Bu üründe koşulacak eğitim bütçesi hesaplanmadı; uygun olmayan ağırlık için donanım kiralanmaz. | Kod/ağırlık kullanılmaz. |
| [Graph2Plan](https://github.com/HanHan55/Graph2plan) | İncelenen depoda açık ticari kod/ağırlık lisansı doğrulanmadı; RPLAN eğitim kaynağı ayrıca kapalı/belirsiz. | Lisans kapısı çözülmeden anlamlı bir ürün eğitim maliyeti taahhüdü yok. | Hazır model ürün yoluna alınmaz. |
| [MSD modelleri](https://arxiv.org/abs/2407.10121) | Veri CC BY; model/toolkit lisansı ayrı. MHD ve graf bilgili U-Net araştırma karşılaştırmasıdır. [Araç deposunda](https://github.com/cvaad-workshop/iccv23-challenge) veri lisansı kod/ağırlık lisansı yerine geçmez. | İncelenen makale gövdesinde bu bilgisayara aktarılabilir GPU-saat bilgisi saptanmadı. Swiss verisiyle özgün bir uygulama için GPU belleği/süre pilotu gerekir; doğrulanmamış saat fiyatı veya eğitim süresi verilmedi. | Yalnız araştırma; bağımsız açık uygulama ve küçük pilot ayrı onay konusu. |
| Gerçek planı getir–uyarla | Bu teslimin seçilmiş CC BY referansları, özgün kod | CPU ve disk; ücretli servis yok. Gerçek dönüşüm/inceleme süreleri manifestte. | Bu turda seçilen ve çalışan yol. |

Bu karar, gelecekte öğrenilmiş bir çözücü yazılamayacağı anlamına gelmez. İlgili
kod lisansı, kullanılacak veri ve küçük bellek/süre pilotu görülmeden “şu kadar
saatte şu fiyata eğitilir” taahhüdü verilmez. **GPU kapısı kapalıdır.**
