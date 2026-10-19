# QWEN-EGITIM-HAZIRLIK-02 — Claude için hazırlık ve devir planı

Tarih: 2026-10-19 · Karar sahibi: Hüseyin · Hazırlayan: Codex · Devralan: Claude

## Amaç ve gerçek donanım

Qwen3.5-9B ile Forma stüdyosunu birlikte geliştirmek; eğitimden sonra modeli yerelde kullanmak.
Karar sahibinin doğruladığı donanım **GPU yok, 36 GB RAM**. QWEN-YEREL-02'deki
“yaklaşık 24 GB GPU” varsayımı geçersizdir. Bu RAM bilgisi 9B eğitiminin birkaç saatte
yapılabileceği anlamına gelmez. Bu plan eğitim veya ücretli kaynak açma izni değildir.

Öncelik: veri, tek sözleşme, gerçek stüdyo denetimi, kapalı sınav ve insan incelemesi.
Canlı sitede süren diğer çalışmaları takip ederek kapsam büyütme.

## Devralınacak mevcut çalışma

PR #69: https://github.com/rahmigkt/auraporject-website/pull/69
Dal: codex/aura-qwen-local-01. Son onay kaydı commit'i:
d6c71be. PR açık ve taslak; bu plan PR'ın birleştirilmesi anlamına gelmez.

PR içindeki başlıca dosyalar:
- knowledge/ai-egitim/QWEN-YEREL-02-UYGULAMA.md
- knowledge/ai-egitim/QWEN-KUSURLAR.md
- knowledge/ai-egitim/QWEN-PILOT-01-RAPOR.md
- tools/qwen-local/current_studio.mjs, live_contract.php, browser_review.mjs
- tools/qwen-local/large_training_gate.py
- outputs/qwen-local/yerel-02/run-239e562f7354/

Güncel stüdyodan 1.470 şablon aday hazırlandı. Seçilen **40 train adayı** gerçek
tarayıcı applyActions yolunda geçti; karar sahibi bunların tamamını
“hepsi doğru onaylıyorum” diyerek onayladı. human-approval.json kimlikleri, özgün
inceleme paketinin ve okuma.html'nin hash'lerini bağlar. reviewed-40.jsonl ayrı ihracıdır.
Kalan 1.430 aday onaysızdır. 40/40 tarayıcı tekrarı **model başarı puanı değildir**.
Kaynak değişirse onayın yeni örneklere otomatik taşınması yasaktır.

Önceki GPU pilotu tamamlandı, adaptör yerelde doğrulandı; GPU ve disk silindi.
Biçim değişiminde temel model ve adaptör 0/40 verdi. Bu nedenle adaptör üretime hazır
veya estetik becerisi gelişmiş kabul edilmez.

## 1. Önce denetim ve donanım kararını düzelt

Claude önce QWEN-YEREL-02 ile bu planı, ardından PR #69'u okusun.
Mevcut hazırlığı denetlesin; özellikle PHP istem çıkarımının gerçekten canlı komut
dalıyla aynı olduğunu, kaynak değişince durmayı ve insan onayının hash bağını sınasın.

İş emrinde bir karar kilidi var: bütün kusurlar ve model eşikleri geçmeden GPU
kiralanamıyor; fakat ilk gerçek yerel tur için varsayılan GPU mevcut değil.
Bu kilidi çözülmüş sayma, CPU sonucunu GPU eğitimi gibi sunma.
Claude, iş emri için **karar sahibine sunulacak bir düzeltme önerisi** hazırlasın:
- GPU'suz hazırlık ve yerel çıkarım ölçümleri şimdi yapılabilir.
- İlk doğrulama eğitimi için donanım yolu ayrıca seçilmeli.
- Gerekirse ilk sınırlı GPU denemesi ile büyük eğitim için ayrı izin kapıları önerilmeli.
- Mevcut sunucu yasağı ve büyük eğitim eşikleri karar sahibi değiştirmeden geçerlidir.

Teslim: açık donanım kararı maddesi; ücretli kaynak oluşturulmamış olacak.

## 2. Tek sözleşme ve stüdyoyla eşzamanlı veri

Eğitim, deneme ve ilerideki yerel kullanım canlı PHP komut istemini ve
ai.js vocabulary/sanitizeActions sözleşmesini kullansın.
Çıktı actions dizisi içeren bir nesne ve reply metnidir. Dış dizi, bilinmeyen alan,
geçersiz tip veya sözlük dışı eylem kusurdur; değerlendirme bunları sessizce onarmasın.

Üretici güncel main'i alsın; çalışma kopyası farklıysa sessiz birleştirmek yerine dursun.
Kaynak parmak izi bütün ilgili modül ve varlıkları kapsasın. Önceki veri bayat işaretlensin.
Üretici/sözleşme sürümü de manifestte bulunsun; değişen üretici aynı koşu klasörünü
sessizce ezmesin. Yeni parametre ve araçlar kapsam raporunda görünmeli; desteklenmeyen
yeni eylem türü otomatik öğrenilmiş sayılmamalı.

Teslim: aynı girdide tekrar üretilebilir paket, bayatlık ve sözleşme testleri.
assets değişikliği gerekiyorsa ayrı, kapsamı açık PR; canlıya bağlantı yok.

## 3. İnsan onaylı veri ve gerçek sonuçlar

Onaylı 40 örneği koru; teknik parametre adlarına insan dilindeki TR/EN karşılıkları ekle.
Doğal komut, birim dönüşümü, çok adım, belirsizlik, çelişki, ret ve kapsam dışı istekleri
ayrı etiketle. “İşlem yok” ile “doğru netleştirme sorusu” aynı puan sayılmasın.
Estetik örnekler yalnız insan onayından gelsin.

Her yeni örneği gerçek tarayıcı applyActions yolundan geçir; önce/sonra tasarım,
ölçü farkı, derlenmiş parçalar ve physics.js uyarılarını kaydet. Normalizasyonla değişen
hedefleri saklama; düzelt veya kusur olarak ayır. Fizik uyarılarının yokluğu güvenlik
sertifikası değildir.

Her inceleme paketinde 30–50 örnek olsun. Onayı yalnız gösterilen kimlik ve içerik
hash'lerine bağla. Model kusurlarını sırf altyapı düzeldi diye kapatma.

## 4. Eğitimden önce kapalı sınavı ve ölçümü dondur

Mevcut train/dev/test aday ayrımı resmî kapalı sınav değildir.
İnsan denetimli sınavı ayrı sürümle dondur; tasarım, komut varyasyonu ve türetilmiş
örneklerin grupları eğitimle sızmasın. Model ayarlaması dev üzerinde yapılsın.
Aynı kapalı sınav sürümü her turda kullanılsın; sonuçtan sonra değiştirilmesin.
Stüdyo değişimi sınavı geçersiz kılıyorsa yeni sürüm gerekçeli yayımlansın ve
karşılaştırılacak modeller aynı yeni sürümde yeniden ölçülsün.

Rapor ayrı ayrı şunları içersin:
biçim doğruluğu, doğru işlem ve gerçek sonuç, doğal TR/EN, netleştirme, ret,
çok adım ve önceki becerilerde gerileme.
Biçim varyasyonlarında anlam/sözleşme değişmesin; üretim istemine rakip bir istem icat edilmesin.
Önceki adaptör ile temel model aynı koşullarda karşılaştırılsın.
Kapalı sınavın her turdaki sonuçları eğitim örneğine dönüştürülmesin.

## 5. GPU'suz yerel ölçüm ve eğitim hazırlığı

Önce mevcut yerel model/runtime varsa kısa bir çevrimdışı çıkarım ölçümü yap:
model biçimi, tam sürüm, RAM'in kullanılabilir kısmı, bellek tepe değeri, yanıt süresi,
token/s ve toplam değerlendirme süresi. Büyük model veya paket indirmesini
hazırlığın gizli yan etkisi yapma; gerekirse boyut ve disk ihtiyacını önce raporla.
CPU'da bütün ağır sınavı koşturmadan önce küçük ölçümle süreyi çıkar.

Bu ölçüm **eğitim değildir**. Küçük başka modelle yapılacak altyapı provası da
Qwen3.5-9B eğitimi veya onun kalite sonucu olarak sunulamaz.

Eğitim paketi için model revision'ı, ortam sürümleri, veri/onay/sınav hash'leri,
assistant-only loss, bağlam uzunluğu, durma koşulları, checkpoint ve sonuç alma
adımları hazır olsun. Gerçek donanımda ölçülmemiş eğitim süresini kesin yazma.

Uzun işleri tek betikle yürüt: süre ve kaynak sınırı, kalıcı log, hata/sonuç dosyası.
Sık sohbet sorgusu yapma; tamamlanma/hata durumunda tek sonuç denetimi.
Bulut ancak ayrıca yetkilendirilirse sağlayıcı tarafındaki harcamayı da durduracak
mekanizma ve kaynak temizliği kanıtı gerekir; yalnız eğitim döngüsü zaman aşımı yetmez.

## 6. Geçiş kapıları ve teslim sırası

Büyük eğitim için QWEN-YEREL-02 eşikleri korunur:
kusurlar kapalı, biçim ≥%98, kapalı sınav ≥%95, doğal TR ≥%90,
netleştirme ve ret ayrı ayrı ≥%95, önceki turlara göre gerileme yok,
kaynak güncel, yazılı maliyet/süre ve karar sahibinin açık onayı.
Eksik ölçüm başarı değildir; bu plan ve 40 örnek onayı harcama izni değildir.

Claude'un ilk teslimi:
1. PR #69 denetimi ve iş emrindeki donanım kilidi için karar önerisi.
2. Tek sözleşme/bayatlık eksiklerinin düzeltme PR'ı; kusur listesi güncellemesi.
3. İnsan inceleme paketi ve dondurulacak sınav taslağı.
4. Kısa yerel çıkarım ölçümü ve gerçekçi süre/bellek raporu.
5. Eğitim paketinin hazır/eksik matrisi; donanım kararı olmadan eğitim başlatma.

Planlama aralığı: GPU'suz hazırlık için ilk tahmin **2–4 çalışma günü**;
veri çeşitliliği ve insan incelemesine göre yeniden ölçülür. Bu bir taahhüt değildir.
İnsan yanıt bekleme ve olası model indirme süreleri ayrıca belirtilsin.
GPU eğitim süresi bu aralığa dahil değildir; gerçek donanım ölçümüne kadar belirsizdir.

## Değişmez sınırlar

assets değişikliği ayrı PR; score.mjs ve önceki sınav verileri korunur.
Ağırlık/anahtar Git'e girmez. outputs/tools/work canlı siteye yüklenmez.
Beklemedeki TASARIM-01 ve ARAŞTIRMA-01'e başlanmaz.
PR'lar karar sahibinin açık talebi olmadan birleştirilmez.
Bu belgeyi main'e gönderme izni yalnız bu hazırlık planına aittir.
