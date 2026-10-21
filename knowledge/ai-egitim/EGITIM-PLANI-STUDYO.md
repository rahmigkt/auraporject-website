# AURA eğitim planı: Qwen stüdyo üzerinden eğitilir

21 Ekim 2026. Hazırlayan: Claude. Kararlar kullanıcının; bu belge eldeki işleri toplar ve sırayı önerir.

## Kapsam kararı (21 Ekim 2026)

Yapay zekâ yalnızca **ev projesi** üzerinde çalışır:
- plan;
- odalar;
- hangi eşyanın hangi toplam ölçüyle nereye gireceği;
- yerleşim kısıtları;
- perde, halı ve ışık;
- tasarımcıya gönderme.

Mobilyanın detay tasarımı (kol, ayak, dikiş, kapak düzeni, malzeme ayrıntısı) stüdyoda kullanıcının işidir. Yapay zekâ buna işlem üretmez, kullanıcıyı stüdyoya yönlendirir. Aşağıda "mobilya" katmanından söz edilen yerlerde yalnızca ürün türü ve toplam ölçü kastedilir; Codex #69'un mobilya detay örnekleri eğitim kapsamı dışındadır.

## İlke

Qwen çizim yapmaz, koordinat ezberlemez. **Stüdyoyu kullanır.**

- Müşteriyle konuşur ve konuşmadan **stüdyo işlemleri** üretir. Mobilyada parça, ölçü ve malzeme; evde duvar, kapı, pencere, oda; yerleşimde niyet ve kısıt; tekstilde perde ve halı.
- Stüdyo bu işlemleri uygular, kendi kurallarıyla denetler ve sonucu gösterir.
- Eğitim verisi de stüdyodan çıkar. Her örnek stüdyoda geri oynatılır. Stüdyonun kabul ettiği işlem dizisi doğru sayılır; reddettiği ya da uyarı ürettiği işlem dizisi yanlış sayılır.
- Stüdyo büyüdükçe (yeni aile, yeni araç) Qwen'in işlem sözlüğü de büyür. Model bir tasarım motoru olmaz; stüdyonun kullanıcısı olur.

Bu yaklaşım Codex'in `QWEN-STUDYO-BAGLANTISI.md` kararıyla ve araştırmadaki en iyi örnekle (Holodeck: dil modeli kısıt yazar, çözücü yerleştirir) aynı yönde.

## Eldekiler: stüdyonun hangi parçasına bağlanıyor

| Stüdyo katmanı | Kod | Eldeki veri | Durum |
|---|---|---|---|
| Mobilya tasarımı (5 aile) | `forma/generate.js`, `ai.js` (`vocabulary`, `sanitizeActions`), `commands.js` | Codex #69: 196/40/40 işlem örneği + Qwen3.5-9B LoRA pilotu (A40, ~0,5 USD) | Pilot çalıştı; tarayıcıda geri oynatma eksik |
| Ev planı (EV-01) | `ev/plan.js`, `ev/edit.js` | 40 sohbet (9 dil), gerçek Swiss Dwellings planları, işlem kayıtları | Main'de; 36'sının üslubu düzeltilecek |
| Mobilya yerleşimi | `ev/yerlesim.js` (`solveRoom`) | 12.827 denetimli ProcTHOR odası + ~5.000 çözücüyle döşenmiş oda | Üretim sürüyor (`claude/yerlesim-veri`) |
| Halı ve aydınlatma | `ev/aksesuar.js` | Kurallar | Kaynakla doğrulanacak |
| Perde ve halı | `ev/tekstil.js`, `perde.js`, `hali.js` | PERDE-01, TEKSTİL-02 araştırmaları, hesap aracı | Hazır |
| Arapça | `forma/i18n-ar.js` | Arayüz | Sohbetler Codex'te (EV-ARAP-01) |

## Eksik olan tek büyük parça: stüdyo motoru (başsız geri oynatma)

Stüdyonun işlem uygulama kodu tarayıcıya bağlı (`studio.js` içinde `applyActions`). Eğitim için bu kod aynı mantıkla tarayıcısız çalışmalı:

```
tools/studyo-motoru/
  uygula.mjs   durum + işlem dizisi → yeni durum + denetim raporu
  isler.json   işlem sözlüğü (sürümlü): mobilya | ev | yerlesim | tekstil
  denetle.mjs  kurallar: aralık/enum, fizik uyarıları, alan, kapı/pencere, çözücü sonucu, yasaklı iç terimler
  goruntu.mjs  aynı durumun stüdyo görüntüsü (Playwright), görsel kontrol ve tercih çiftleri için
```

- **İşlem sözlüğü:**
  - **Mobilya:** `set`, `delta`, `enum`, `material`, `style`, `kind`. Bunlar mevcut `sanitizeActions` işlemleri.
  - **Ev planı:** `duvar_ekle`, `duvar_tasi`, `aciklik_ekle`, `oda_tanimla`, `oda_birlestir`, `kat_ekle`, `merdiven`.
  - **Yerleşim:** `yerlestir` (niyet ve kısıtlar), `secenek_sec`.
  - **Tekstil:** `perde`, `hali`.
  - **Proje:** `projeye_ekle`, `tasarimciya_gonder`.
- `studio.js` da aynı modülü kullanacak. Böylece sitede yapılan işlem ile eğitimde doğrulanan işlem aynı kod olur.

**Sorumlu:** Claude (assets/). **Süre:** 2–3 gün.

## Veri: hepsi stüdyodan geçer

1. **Sohbetler** (Codex, sürüyor): Her sohbetin işlemleri motorda geri oynatılır. Geçemeyen sohbet eğitime girmez.
   - **Hedef:** Ülke başına 30–40 sohbet, toplam ~500.
   - **Üslup:** Kullanıcı kendi evini anlatır; asistanda iç terim bulunmaz.
2. **Stüdyo düzenleme komutları** (Codex #69'un devamı): "kolları biraz alçalt", "3 kapaklı, meşe, 240 cm" gibi, 9 dilde. Hedefi işlem dizisi; motor doğrular.
3. **Yerleşim niyeti:** ProcTHOR ve çözücü odalarından "oda + eşya + istek" girdisi ile "kısıtlar" hedefi üretilir. Koordinatları çözücü bulur; Qwen'e koordinat öğretilmez.
4. **Gerçek kullanım** (sonra): Sitede, izin veren kullanıcıların stüdyo oturumları kaydedilir (`consent`). Kayıtlar tasarımcı onayından geçer ve bir sonraki eğitime girer. Bu en değerli veridir.

## Ölçüm: ayrı sınav seti

Eğitime hiç girmeyen 120 görev: 40 ev projesi isteği (5'i mobilya detayı → stüdyoya yönlendirme), 40 ev ve yerleşim, 20 tekstil, 20 zor durum (sığmayan, belirsiz, kural dışı istek). Ölçütler:

- **İşlem geçerliliği:** Motor kabul ediyor mu (%).
- **Kural ihlali:** Fizik uyarısı, kapı veya pencere önü, alan sapması (sayı).
- **İstek karşılama:** Ölçü ve malzeme gerçekten istenen gibi mi (%).
- **Dil ve üslup:** Dil karışmıyor; yasaklı terim 0; "sığmıyor" durumunda dürüst cevap.
- **Görsel:** Önce ve sonra stüdyo görüntüsü. Tasarımcı 1–5 arası puanlar (20 örnek).

Temel model (eğitimsiz Qwen) ile her adaptör aynı sınavdan geçer. İlerleme yoksa yayına alınmaz.

## Takvim (öneri)

| Aşama | İş | Kim | Süre |
|---|---|---|---|
| 0 · Toparlama | Eski PR'ları kapatmak ya da birleştirmek (#132 kapat; #127, #119, #69 incele). Yerleşim verisini main'e almak | Claude, karar kullanıcıda | 1 gün |
| 1 · Stüdyo motoru | `tools/studyo-motoru`, `studio.js`'in aynı modülü kullanması, sınav setinin iskeleti | Claude | 2–3 gün |
| 2 · Veri | Sohbetleri motordan geçirmek, üslup düzeltmesi, ülkeleri 30–40'a çıkarmak, Arapça, 9 dilde düzenleme komutları | Codex (Claude denetler) | ~1 hafta (1. aşamayla paralel başlar) |
| 3 · Pilot eğitim | Qwen3.5-9B LoRA, kiralık GPU (A40, saatlik birkaç USD); sınav setiyle karşılaştırma | Codex (altyapı #69), Claude (değerlendirme) | 1 gün |
| 4 · Sitede deneme | AURA AI sohbeti stüdyo işlemlerini önerir, kullanıcı onaylayınca uygulanır. Bayrakla, önce yalnızca sizde | Claude | 2–3 gün |
| 5 · Döngü | Gerçek oturumlar → tasarımcı onayı → yeni eğitim | Hepsi | Sürekli |

**İlk gerçek eğitim:** yaklaşık 10 gün sonra. Pilot eğitim 1. aşama biter bitmez, mevcut ~50 sohbet ve #69 verisiyle denenebilir.

## Sizin vereceğiniz kararlar

1. **GPU:** Kiralık GPU kullanılsın mı (Runpod veya benzeri; pilot ~0,5 USD, tam eğitim tahminen 5–20 USD)? Harcama sınırı ne olsun?
2. **Model boyutu:** Pilottaki Qwen3.5-9B ile devam mı? Sunucuda çalışacağı için barındırma maliyeti de karara girer.
3. **Kayıt izni:** Sitede kullanıcı oturumlarının eğitim için (izinle) kaydedilmesi.
4. **Tasarımcı onayı:** Eğitime girecek örnekleri ve sınav setinin görsel puanını kim onaylayacak (Merve Hanım mı)?
