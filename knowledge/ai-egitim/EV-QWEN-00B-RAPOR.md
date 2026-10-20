# EV-QWEN-00B — program sözleşmesi ve yerleşim prototipi

20 Ekim 2026 · Main tabanı `6a28902` · Dal `codex/ev-qwen-00b`.

**Durum: denetime açık, kısmi prototip. İş emrinin bütün mimari kapsamı
tamamlanmadı; eğitim için hazır değil.** Aşağıdaki teslimler, eksik kurgu ve
model tabanı koşullarını kapatmış sayılmaz. Kiralık GPU kapısı kapalıdır.
EV-QWEN-00C ve EV-QWEN-01 başlatılmadı. `assets/` ve `score.mjs` değişmedi.

## Çalışan teslim

- Türkiye konut kurgusu için [araştırma](../ev-projesi/KURGU-ARASTIRMA-01.md),
  kaynak/lisans sınırları ve [10 makine kartı](../ev-projesi/veri/kurgu-tipleri.json).
- [Plan programı şeması](../ev-projesi/veri/plan-program.schema.json): oda listesi,
  alan hedefi, bölgeler, zorunlu/yasak bağlantılar, katlar, yönler, dış biçim ve sabit
  eleman referansları. Model hedefinde duvar koordinatı yok.
- Eğitim/test/yerel model için tek `aura-plan-program/0.3` sistem istemi ve yanıt
  doğrulaması. Düzenlemeler sürüm denetimli; eski kaydı değiştirmez. Açık mutfak
  işlemi yalnız etiketi değil gereken bağlantıyı da değiştirir.
- Deterministik, sınırlı bölge dilimleme araması; eski üretici yalnız belge
  kabuğunun kurulmasında ve v1 karşılaştırmasında kullanılır. Yeni geometri onun
  oda kalıplarından kopyalanmaz. Servis çekirdeği, parçalı dağılım holü, bağımsız
  satır bölmeleri ve ayrıca kompakt T-hol prototipi var.
- Açık mutfakta gerçek `passage`, yarı açıkta geniş sürgülü eşik; kapı/açıklık
  grafı aynı doğrulayıcıdan geçer. Doğrulayıcıya geçerli `passage` dolaşım desteği
  eklendi. Bu kapsam dışında canlı site değişikliği yok.
- Aynı konumda U merdiven ve döşeme boşluğu, çok katlı ıslak hacim örtüşme ölçüsü,
  L/kırık dış köşe, sentetik müstakil parsel ve bahçe örnekleri.
- [Kalite kriterleri](../ev-projesi/veri/kalite-kriterleri.json): dolaşım, en/boy,
  salondan geçmeden yatak erişimi, ıslak yakınlığı/örtüşmesi, cam ve dış cephe,
  birlikte mobilya sığması, kompaktlık ve program alan sapması. Eşiklerin tamamı
  kaynak veya öneri olarak işaretli.
- [60 plan inceleme sayfası](veri/ev-plan-veriseti-v2/okuma.html): on tipten altışar
  taslak, 72 kat, oda adları, m², giriş oku, pencere/kapı, merdiven ve boşluk,
  puan özeti. `iyi/zayıf/neden` alanları ve `review.json` indirme çalışır.
  Açmak veya otomatik arayüz testi yapmak onay sayılmaz.

## Sayılar ve kanıt

Üretim: `outputs/ev-qwen-00b/build-03`, 38,47 saniye. Önceki eksik denemelerin
dizinleri yeniden kullanılmadı; başarılı manifest yalnız bütün üretim sonunda,
başlangıç/bitiş kaynakları aynıysa yazıldı.

| Veri | Sayı |
|---|---:|
| v0.2 geometrik doğrulamadan geçen inceleme planı | 60 |
| Kat başına görüntüleyici JSON'u | 72 |
| İstek → program | 1.500 |
| Önceki program + düzeltme → işlem | 120 |
| TR/EN netleştirme, çelişki ve reddetme örneği | 6 |
| Toplam farklı kullanıcı bağlamı | 1.626 |
| Eğitim / doğrulama / kapalı test aday satırı | 945 / 297 / 384 |
| Tam tür etiketli kapı/merdiven grafı izomorfizm sınıfı | 20 |
| Bölümler arası aynı topoloji sınıfı | 0 |
| İnsan onaylı / altın test planı | 0 / 0 |

1.500 istek, 60 programın Türkçe/İngilizce bileşimsel ihtiyaç listesi
çeşitlemeleridir. **1.500 insan tarafından yazılmış serbest diyalog değildir.**
İstekler varyasyon numarası içermez; buna karşılık program alanları ve oda
kimlikleri oldukça yapılandırılmıştır. Gerçek doğal dil yeterliği kanıtlanmadı.
120 işlem hedefi sözleşmeye uygundur; her düzenlemenin çözülebilir ve iyi bir
yeniden yerleşim vereceği topluca kanıtlanmış değildir.

Bölme, yalnız katalog tip adına göre yapılmadı: farklı adlar altında aynı graf
bulunabiliyor. Gerçekleştirilmiş tür etiketli grafın **tam izomorfizm** grubu ve
bütün dil/düzenleme türevleri birlikte tutuldu. Tip etiketleri bölümler arasında
bulunabilir; aynı gerçekleşmiş graf bulunmaz. İd/ölçü değişikliği yeni topoloji
sayılmaz. İnsan onayı gelmediği için altın set boştur; `review_v2.py` hash'i
uyuşan açık insan kararlarını alır. Eğitimdeki onaylı örneği sessizce test setine
taşımaz; yeni donmuş bölme gereğini bildirir.

### v1 / v2 karşılaştırması

Tam sonuç: [comparison.json](veri/ev-plan-veriseti-v2/comparison.json).
Aynı yedi kalite kontrolü iki sürüme de uygulandı. v1'in program alan hedefi
olmadığından, bu kontrol **her iki tarafın karşılaştırma puanından** çıkarıldı.
İnceleme sayfasının sekizli puanı alan sapmasını da gösterir.

| Tip | v1 / v2 graf sınıfı (6 örnekte) | v1 / v2 ortak öneri puanı |
|---|---|---|
| Kapalı | 3 / 6 | 80,95 / 100 |
| Açık | 3 / 6 | 73,81 / 100 |
| Yarı açık | 3 / 6 | 80,95 / 100 |
| Hol | 1 / 2 | 85,71 / 100 |
| Köşe | 3 / 6 | 80,95 / 100 |
| Çift cephe | 3 / 6 | 80,95 / 100 |
| Derin plan araştırması | 3 / 6 | 80,95 / 100 |
| Dubleks | 3 / 6 | 59,52 / 100 |
| Müstakil | 3 / 6 | 59,52 / 100 |
| L/bahçeli | 3 / 6 | 80,95 / 100 |

**Bu sonuç mimari kalite onayı değildir.** Öneri kontrolleri ince taneli değil;
şaft, gerçek cephe kısıtı, ebeveyn banyosu ilişkisi gibi eksikleri kaçırır.
Örnekler farklı oda sayısı ve kiler/WC programları içerir. Dolayısıyla artışın
bir kısmı program değişikliğidir; **aynı programda tip başına onlarca farklı
kurgu** kanıtı değildir. Bu hedef açık kaldı. İsimleri farklı bazı tipler aynı
çözücü uzayını paylaşır; özellikle derin/tek cepheli örnekler tamamlanmış tip
olarak eğitim verisine kabul edilemez.

Alan uyumu birçok örnekte zayıf: son dilime dağıtılan boşluk hedefi büyütebiliyor;
geniş banyo/WC ve yardımcı hacimler mimari inceleme ister. Bu kusur puanda ve
ham sapmalarda görünür. “Geçerli” yalnız mevcut araştırma doğrulayıcısı demektir.

## Yerel Qwen tabanı

Küçük mevcut model `qwen2.5:7b-instruct`, CPU (`num_gpu=0`), 4096 bağlam,
1200 çıktı sınırı, sıcaklık 0, `keep_alive=0`. Yeni model indirilmedi.
İstek başına 30 saniye, toplam yaklaşık 65 saniye **ayrı istemci işlemiyle kesin
süre sınırı** uygulandı. Dört kapalı örnek seçildi; üçü denenebildi.

- Süreler: 30,782 / 30,078 / 4,532 saniye.
- Tamamlanmış yanıt: **0**; süre aşımı: **3**; denenmeyen: **1**.
- Bu nedenle biçim, niyet, çözülebilirlik ve kalite için model başarı oranı
  hesaplanamaz. Süre aşımı “model yanlış cevap verdi” demek değildir.
- [Seçim, ham istekler, süre aşımı kayıtları ve özet](veri/ev-plan-veriseti-v2/baseline/baseline.json)
  ayrı dosyalarla PR'dadır. Tam yanıt alınmadığı için sahte ham cevap yazılmadı.
- Sonrasında `ollama ps` boştu; yüklü kalan model saptanmadı. Başka kullanıcının
  işlemi veya yerel Ollama hizmeti durdurulmadı.

50 istekten oluşan tamamlanmış model ölçümü **yoktur**. Eğitim ve ücretli servis
çalıştırılmadı. 36 GB RAM tek başına GPU hızını sağlamaz; bu turdaki tamamlanamama
nedeni zaman bütçesi içinde CPU çıkarımından yanıt alınamamasıdır.

## Açık mimari kapsam

| İş emri gereği | Mevcut sınır |
|---|---|
| Genel programdan çok kurgu, aynı programda onlarca topoloji | Sınırlı dilimleme ve iki hol yaklaşımı; hedef kapanmadı. |
| Genel yön/cephe, tek/çift sağır cephe | Batı giriş/güney salon prototipi. Desteklenmeyen yön reddedilir. Derin/çift cephe isimleri bu özelliği kanıtlamaz. |
| U biçim ve gerçek iç avlu / aydınlık | L/kırık köşe var; U ve şaftlı aydınlık yok. U talebi açıkça reddedilir. |
| Tek kol, L, U, galeri | Yalnız U geometrisi; diğerleri açıkça reddedilir. |
| Ölçülmüş kolon, duvar, şaft; taşıyıcı ızgara | Sözleşmede referans var; çözücü bunları görmezden gelmez, desteklenmediğini bildirir. Yerleşim entegrasyonu eksik. |
| Mutfak-kiler/balkon ve ebeveyn banyosu | Şematik araştırma var; katalogda zorunlu bağlantıları genel olarak sağlama eksik. |
| Sundurma, rüzgârlık, teras, bodrum/çatı | Parsel/bahçe ve iki kat var; diğer kurgu/bağlantılar tamamlanmadı. |
| Kaynaklı gerçek mobilya/kapı çakışması ve tesisat | 2B öneri dikdörtgeni ve en yakın ıslak mesafesi; katı geometri/tesisat hesabı yok. |
| Üç yöntem için ölçülen hız karşılaştırması | Yalnız seçilen yöntem ölçüldü; diğerleri kuramsal/lisans karşılaştırması. |
| İnsan onayı ve iyi planlardan altın test | İnceleme aracı hazır; karar bekleniyor. |

## Doğrulama ve yeniden üretim

38 birim testi geçti: mevcut 19 test + yeni 19 test. Yeni sınamalar; ham koordinat
reddi, ilişkiler, sürüm denetimi, gerçek açıklık, mobilya sığması, graf izomorfizmi,
desteklenmeyen kısıtların sessizce yok sayılmaması ve kompakt holü kapsar.
Arayüz: 60 kart, 72 SVG, JavaScript hatası yok; 390 px'de yatay taşma yok;
`review.json` indirme denemesi geçti. Otomatik işaretleme insan onayı değildir.
Mevcut `ev.html` üzerinde 72/72 kat dosyası oda sayısı, 3B maket açılması ve
JavaScript hataları bakımından geçti: [viewer-results.json](veri/ev-plan-veriseti-v2/viewer-results.json).
Bu test merdiven/bahçe çiziminin görsel kalite onayı veya dosya seçici entegrasyonu değildir.

Komutlar ve paket sınırı [veri README](veri/ev-plan-veriseti-v2/README.md)
dosyasındadır. Kaynak parmak izi:
`de4020df1c5838af4995e86c286cdb2a03370a2b178931901e48e75da5e99f42`.
Ham eğitim adayı dosyalar `outputs/` içindedir; PR'da örnek dilim, manifest,
60 inceleme planı ve 72 viewer JSON'u vardır. Hiçbiri eğitim onayı değildir.
