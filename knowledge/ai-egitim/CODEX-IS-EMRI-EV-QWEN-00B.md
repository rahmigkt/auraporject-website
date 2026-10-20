# CODEX-IS-EMRI-EV-QWEN-00B — Gerçekçi ev planı: mimari kurgu, kalite ölçüsü ve doğru eğitim biçimi

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex
**Sıra:** EV-QWEN-00'ın devamı. EV-QWEN-01 hâlâ bekler. `assets/` yasak; `tools/` ve `knowledge/` serbest.

## 1. Neden ikinci tur

EV-QWEN-00 altyapıyı kurdu. Şema v0.2, doğrulayıcı, veri hattı ve 19 test sağlam. Ancak üretilen planların mimari kalitesi eğitime uygun değil. Claude'un 40 örneklik incelemesinde görülenler:

- Neredeyse bütün tipler aynı kalıpta: boydan boya orta koridor ve iki yanında eşit kutu odalar. "Koridorlu daire", "açık mutfaklı daire" ve "iki katlı müstakil ev" zemin katı birbirinden ayırt edilemiyor.
- Çeşitlilik ölçüde var, **kurguda (topoloji) yok**. 2.068 plan, 10 kalıbın boyut varyasyonu.
- Gerçek dairelerin temel ilişkileri eksik. Antre ve giriş holü, salon–mutfak–balkon ilişkisi, ıslak hacim çekirdeği, yatak odası kanadı (gündüz/gece ayrımı) ve cephe yönü kurulmuyor.
- Çok katlı tiplerde merdivenin plandaki yeri, kat ilişkisi ve galeri okunmuyor.

Bu veriyle eğitilen model ev tasarlamayı değil, kutu dizmeyi öğrenir. Bu turun amacı, **eğitime girecek planların mimari olarak inandırıcı ve çeşitli olması**.

## 2. Temel tasarım kararı: Qwen koordinat değil, kurgu üretir

Qwen'e duvar koordinatı ürettirmek kırılgandır ve ölçeklenmez. Doğru ayrım şöyle:

- **Qwen'in işi (dil → kurgu):** Kullanıcıyla konuşarak bir **plan programı** çıkarmak:
  - oda listesi ve hedef alanlar;
  - bölgeler (gündüz / gece / ıslak / servis);
  - komşuluk grafı (hangi oda hangisine kapı ya da açıklıkla bağlı, hangisi bağlı olmamalı);
  - giriş yönü ve cephe yönleri (salon güneyde, yatak odaları sessiz cephede gibi);
  - dış biçim (dikdörtgen, L, derin plan, köşe parsel);
  - kat sayısı ve merdiven tipi;
  - korunacak sabitler (mevcut duvar, şaft, kolon).
- **Çözücünün işi (kurgu → geometri):** Deterministik bir yerleşim motoru bu programdan birden fazla geçerli plan üretir ve doğrulayıcıdan geçirir.
- **Düzeltme döngüsü:** Kullanıcı "salonu büyüt, mutfağı salona aç" dediğinde Qwen programı ya da tek tek işlemleri değiştirir; çözücü yeniden yerleştirir.

Bu ayrım şema ve asistan sözleşmesine yazılmalı: `plan_program` nesnesi ve çözücü araç çağrıları. EV-QWEN-00 raporunda bu yönde bir başlangıç var, bu turda netleşmeli.

## 3. Görevler

### A · Kurgu bilgisi (araştırma, kaynaklı)

Konut tipolojileri. Her biri için kaynaklı tarif ve şematik komşuluk grafı:

1. **Türkiye'deki yaygın apartman daireleri:**
   - antre veya giriş holü;
   - salon–balkon;
   - mutfak–balkon ya da kiler;
   - ebeveyn banyosu;
   - koridorlu yatak kanadı;
   - köşe daire;
   - ara daire;
   - tek ve çift cephe.
2. **Dubleks:** iç merdivenin yeri, üst katta yatak kanadı, galeri.
3. **Müstakil ev:**
   - giriş sundurması ve rüzgârlık;
   - zemin katta gündüz yaşamı, üst katta gece;
   - bahçeye açılan salon;
   - teras;
   - bodrum ya da çatı katı seçeneği.
4. **Kurgu tipleri:**
   - açık plan;
   - yarı açık mutfak;
   - kapalı mutfak;
   - koridorsuz hol merkezli plan;
   - avlulu / L plan;
   - derin plan, aydınlık ve şaft ile.

Kaynaklar: mimari tipoloji literatürü, açık erişimli plan arşivleri. Planlar yalnızca **incelenir ve tarif edilir**; kopyalanmaz. Lisans her kaynak için kaynakla belirtilir. Ticari kullanıma kapalı veri setleri yalnızca okunur, içerikleri veriye girmez.

Teslim: `knowledge/ev-projesi/KURGU-ARASTIRMA-01.md` ve `knowledge/ev-projesi/veri/kurgu-tipleri.json`. Her tip için program, bölgeler, komşuluk grafı, tipik alan aralıkları ve kaynak.

### B · Yerleşim çözücüsü v2 (`tools/ev-plan/solver/`)

Mevcut kalıp üreticiyi bırakmadan yanına **programdan plan üreten** bir çözücü yazılacak. Önerilen yöntemler karşılaştırılıp biri seçilecek:

- dilimleme ağacı (slicing tree / bölme);
- komşuluk grafı → kabarcık diyagramı → ızgaraya oturtma;
- kısıt çözücü (ör. OR-Tools CP-SAT, Apache-2.0).

Lisans ve hız karşılaştırması rapora yazılır. Zorunlu davranışlar:

- **Dış biçim girdisi:** dikdörtgen, L, U, kırık cephe ve müstakil evde parsel çekme mesafeleri.
- **Giriş dizisi:** dış kapı → antre/hol → gündüz bölgesi; gece bölgesine salondan geçmeden ulaşım.
- **Islak çekirdek:** banyo, WC ve mutfak tesisat duvarında ya da şafta yakın gruplanır. Çok katlıda ıslak hacimler üst üste gelir.
- **Cephe ve ışık:** yaşama ve yatak odaları dış cephede. Banyo ve kiler iç bölgede olabilir; cephe yönü programdan alınır.
- **Merdiven:** kat planında yer kaplar. Alt ve üst katta aynı konumdadır, döşeme boşluğuyla gösterilir. Tipleri tek kol, L, U ve galeri.
- **Taşıyıcı ızgara (isteğe bağlı):** kolon aksları 3,5–6 m. Kolon ve perde duvar programa sabit olarak verilebilir.
- **Mobilya sığma testi:** Her yatak odasına çift kişilik yatak (160×200) ve geçiş payı sığmalı; salona oturma grubu ve yemek masası, mutfağa tezgâh boyu. Bu bir kalite ölçütüdür; kriter tablosu kaynaklı olacak.

### C · Kalite ve çeşitlilik ölçüleri (`tools/ev-plan/metrics.py`)

Doğrulayıcı "geçerli mi?" sorusunu cevaplıyor; şimdi **"iyi mi?"** sorusu ölçülmeli. Her plan için sayısal skor üretilecek:

- **Dolaşım oranı:** koridor ve hol alanı / toplam net alan.
- **Oda oranları:** en/boy; çok uzun ve dar oda cezası.
- **Bölgelenme:** gündüz ve gece ayrımı; yatak odasına salondan geçmeden erişim.
- **Islak çekirdek:** ıslak hacimlerin birbirine ve şafta uzaklığı; katlar arası üst üste gelme.
- **Işık:** yaşama ve yatak odası başına dış cephe uzunluğu ve cam oranı.
- **Mobilya sığma testi sonucu.**
- **Kompaktlık:** dış çevre / alan.
- **Program uyumu:** istenen oda sayısı ve alanlardan sapma.

Çeşitlilik ayrıca ölçülecek:

- **Topoloji çeşitliliği:** komşuluk grafı izomorfizm sınıfı sayısı.
- **Biçim çeşitliliği:** dış biçim ve oda dizilimi imzası.
- Veri setindeki her ev tipi için bu sayılar raporlanır. Hedef: tip başına onlarca farklı kurgu, tek kalıbın ölçü varyasyonları değil.

v1 (EV-QWEN-00) ve v2 aynı ölçülerle karşılaştırılır.

### D · İnsan incelemesi

- Her tipten 6, toplam **en az 60 plan**, okunabilir inceleme sayfasında sunulur.
- Oda adları rakam yerine yazıyla; m²; giriş oku; merdiven sembolü; kat başlığı; kalite skorlarının özeti.
- Planlar `ev.html` görüntüleyicisinde de açılabilir biçimde verilir (kat başına JSON). Claude görüntüleyiciye kat seçici, merdiven ve bahçe çizimini ekleyecek.
- Kullanıcının (Hüseyin) işaretlemesi için her plana kimlik ve "iyi / zayıf / neden" alanı bırakılır (`review.json`).

### E · Veri seti v2 ve eğitim biçimi

- Eğitim örneği biçimi: **istek → plan_program** ve **plan_program + düzeltme isteği → değişiklik işlemleri**. Koordinatlar çözücü tarafında kalır; Qwen hedefinde ham duvar koordinatı olmaz.
- Doğal dil:
  - şablon cümleler azaltılır;
  - eksik bilgili istekler ve asistanın soru sorması gereken durumlar eklenir;
  - çelişkili istekler eklenir ("3+1, 60 m²");
  - sadece Türkçe ve İngilizce;
  - en az 1.500 farklı, elle yazılmış ya da çeşitlendirilmiş istek.
- Test seti: v1'de olduğu gibi eğitimde görülmemiş kurgu tiplerinden oluşur. Ek olarak kullanıcı incelemesinde "iyi" işaretlenen planlardan bir altın set ayrılır.

### F · Taban ölçüm (yarım kalanı tamamla)

- EV-QWEN-00'da CPU üzerinde Qwen3.5:9b tamamlanamadı. Bu turda:
  - daha küçük bir dilim (ör. 50 istek);
  - kısaltılmış çıktı: yalnız `plan_program`, koordinat yok;
  - mümkünse daha küçük bir Qwen boyutu ile tamamlanmış bir taban ölçümü alınır. Süreler ve ham yanıtlar kaydedilir.
- Ölçüt: programın şemaya uyması, çözücünün o programdan geçerli plan üretebilmesi ve kalite skorları.

## 4. Kapanış koşulu

- v2 planlarının topoloji çeşitliliği v1'den belirgin biçimde yüksek; sayılarla raporlanır.
- 60 plan inceleme sayfasında; kalite skorları ve kullanıcı işaretleme alanı hazır.
- Taban ölçüm tamamlanmış ya da neden tamamlanamadığı ham kayıtlarla gösterilmiş.
- Kiralık GPU kapısı bu turda da **kapalı**. Eğitim kararı kullanıcı incelemesinden sonra verilir.

## 5. Kurallar

- Belgesiz bilgi yok. Her eşik ya kaynaklı ya da "öneri" olarak işaretlenir.
- Gerçek müşteri verisi yok; bütün planlar sentetik ve işaretli.
- Ücretli servis, GPU kiralama yok. `assets/` klasörüne dokunulmaz.
- Rapor: `knowledge/ai-egitim/EV-QWEN-00B-RAPOR.md`. Kusur listesi `QWEN-KUSURLAR.md` dosyasında güncellenir.
