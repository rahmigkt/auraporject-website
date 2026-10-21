# Colab denemesinden AURA'ya aktarılan kontroller

22 Ekim 2026 kullanıcı talimatı: “Oradaki işimize yarayan yöntemleri de kullan, hataları tekrarlama.” H4 → C7 → H5 → E1–E6 sırası korunur. Bu kayıt eğitim/GPU/ücretli kaynak/dağıtım izni değildir; eğitim kapısı kapalı kalır.

## Kaynak ve aktarım sınırı

`türkçe ai devam` sohbetindeki Qwen3.5-0.8B Türkçe çözümleme deneyi: 20 eğitim adımı, 60 doğrulama örneği, aynı 20 kelimede temel model/adaptör katı kabulü 0/20 → 0/20. Adaptörde tekrar gözlendi. Görünen tüketim 0,51 Colab işlem birimiydi; yeni satın alma yapılmadı. Sonuç arşivi ve kontrol noktası SHA ile geri alındı; raporda oturumun silindiği yazıyor. Bu tarihsel kayıt güncel hesap bakiyesi/oturum durumu değildir.

Kaynak teslim: [Türkçe AI doğrulama kaydı](https://github.com/rahmigkt/turkce-ai/commit/16bd39305430d5220c032df7691219d1915d09b7). Yerelde `2026-10-19/se/outputs/QWEN-UCRETSIZ-OTURUM/T4-SONUC-DOGRULAMA.json`, `SONUC-YEREL/run/RUN.json` ve model sabitleme kaydı okundu. Ham yanıtlar, veri veya adaptör bu depoya taşınmadı. AURA Qwen3.5-9B ve ev projesi sözleşmesi kullanır; 0.8B adaptörü AURA adaptörü sayılmaz. Diğer sohbette hâlen yapılan düzeltmeler doğrulanmış sonuç gibi aktarılmaz.

## Şimdi doğrulanan AURA durumu

İncelenen kaynak main: `0de8f67c3b80fb5fd7d5d5492a211a50a7ddff4b`.

| Kontrol | Kanıt ve sınır |
|---|---|
| İstem açık JSON sözleşmesi ister | `tools/egitim/sistem.md` ilk satırı yalnız `reply` ve `actions` ister. Serbest yorum istemi ile farklı bir hedef şeması kullanılmaz. |
| Gerçek eğitim yolu doğru belirlenir | `train_gpu.py` giriş noktası `egitim01_runner` → `egitim01_features.prepare_features` kullanır. Aynı dosyadaki tarihsel `response_features` yardımcısı gerçek EGITIM-01 yolunun kanıtı değildir. |
| Hedef ve maske korunur | `tests/egitim01-mask-check.py`: 12/12 geçti. Bütün asistan JSON hedefleri ve EOS denetlenir; istem/başlık/boş thinking bölümü maskelenir, bağlam taşması sessiz kırpılmaz. Bu stdlib karakter düzeni testi gerçek Qwen bölücüsü veya model başarısı sayılmaz. |
| Eğitim izni ayrı kalır | Aynı testler açık yürütme onayı ve kapalı eğitim kapısının aşılmadığını denetler. Bu çalışmada model yüklenmedi, eğitim başlatılmadı. |

## H5 ve E1 tesliminde uygulanacak ölçüm

1. Sabit model revizyonu, bölücü/şablon SHA'ları, veri ve sınav SHA'ları, kod SHA'sı, üretim ayarları ve aynı örnek kimlikleri raporlanır. Train/dev/sınav ayrımı korunur; kabul sorularıyla eğitim veya istem seçimi yapılmaz. Protokol geliştirme örnekleri ile son kapalı sınav ayrı tutulur.
2. Eğitimdeki **gerçek** şablon ile kullanımda her asistan turundan önce verilen üretim öneki, düşünme ayarı, hedef başlangıcı ve EOS yerel gerçek bölücüyle karşılaştırılır. Çok turlu geçmiş de kapsanır. Mevcut maske testinin geçmesi bu karşılaştırmanın yapıldığı anlamına gelmez; yeni gerçek-öneki kanıtı henüz yoktur. Uyuşmazlık bulunursa eğitimden önce düzeltilir; kanıt eksikken hazır denmez.
3. Ham serbest üretim ve varsa şema zorlamalı üretim ayrı koşul/ayrı puan olur. JSON onarımı, kod çiti temizleme veya tekrar durdurma ham başarısızlığı başarıya çevirmiş gibi gösterilmez. Üretim değiştirilirse özgün yanıt ve dönüşüm ayrı kaydedilir.
4. Boş yanıt, geçersiz JSON, eksik/fazla alan, sınırda kesilme ve tekrar ayrı sayılır. `reply` içindeki cümle döngüleri ile gereksiz yinelenen `actions` ayrı incelenir. Kasıtlı çoklu eşya eylemleri yalnız aynı türden oldukları için tekrar hatası sayılmaz. E1'de pozitif/negatif örneklerle bu ayrım sınanır.
5. Biçim puanı, motor geçerliliği, kullanıcının isteği/kısıtları, tam ölçüler, dürüstlük, dil ve kısalık ayrı raporlanır. Şema zorlamasıyla geçerli JSON elde edilmesi veya loss azalması modelin doğru yerleşimi öğrendiğini kanıtlamaz. Temel model ve gelecekteki adaptör aynı protokolde karşılaştırılır; kötü adaptör otomatik yayımlanmaz.
6. Sonuç paketi alınırsa izinli dosya listesi, boyut, SHA ve arşiv bütünlüğü doğrulanır; gerçek optimizer adımı ve ağırlık bütünlüğü raporlanır. Alınamayan sonuç tamamlandı sayılmaz. Kaynak sınırı ve oturum kapatma ancak o koşuya açık izin varsa uygulanır; Türkçe AI sohbetindeki 5 birim izni AURA'ya taşınmaz.

## Açık işler ve denetim

Bu belge H5/E1 uygulamasının veya bütün test paketinin tamamlandığı iddiası değildir. Gerçek bölücüde kullanım öneki karşılaştırması, gerçek üretim/tekrar ölçümü ve kapalı sınav hâlâ kendi sıralarında yapılacaktır. Önceki Forma 180 saniye zaman aşımı açık kalır. H4 çalışan motor/kaynak/günlük fingerprint'i değişmedi; pahalı koşu çoğaltılmadı.

Denetçi: Codex. `review_mode=user_authorized_self_review`; 21–26 Ekim 2026 20:00 UTC kullanıcı istisnası kapsamında ikinci geçiş; bağımsız Claude incelemesi değildir. Kaynak dosyalar ve yukarıdaki 12 test yeniden incelendi. Doküman tesliminin kod SHA'sı PR açıklamasında kaydedilir.
