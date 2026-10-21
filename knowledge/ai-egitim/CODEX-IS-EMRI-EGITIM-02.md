# CODEX-IS-EMRI-EGITIM-02: modelin kendi kendini geliştirmesi

21 Ekim 2026. Hazırlayan: Claude. Başlangıç: güncel `main`.

## Kullanıcının talebi

> "Yapay zekâyı mobilya terimleri için tek tek eğitmek yerine, yapay zekânın kendi kendini eğittiği ya da bir başka modeli eğittiği bir düzen kurulamaz mı? Aracı kullanmak için kendi yollarını bulsun, geliştirsin, sonunda serbest çizim bile yapabilsin."

Karar: Evet, adım adım. Hakem stüdyo motorudur. Model ürettikçe motor puanlar; iyi denemeler bir sonraki eğitimin verisi olur. Zevk ve görünüm için ikinci bir hakem (görsel değerlendirme ve tasarımcı puanı) sonradan eklenir.

Sıra:
1. EGITIM-01: denetimli eğitim (`EGITIM-01.md`).
2. EGITIM-02: modelin kendi denemelerinden süzerek öğrenmesi.
3. EGITIM-03: pekiştirmeli öğrenme.
4. Serbest çizim.

Değişmeyen kurallar:
- `assets/`, `api/` ve kök `.html` dosyalarına dokunulmaz.
- Silme yok; sayı uydurma yok.
- Her iş ayrı PR'dır.
- GPU yalnız kullanıcı onayıyla açılır. Sınır oturum başına 6 saat / 4 dolar.
- Ürettiğin her veri Claude'un çapraz denetiminden geçer.

## Önce bitecekler (EGITIM-01'e giden yol)

C8 → H4 (C5) → C7 → H5 (C6). Ayrıntı `GOREVLER.md`'de. H1 (#187) Claude'dan "uygun" aldı ve main'e girdi.

## E1. Ortak puanlayıcı: `tools/egitim/puanla.mjs`

Sınav, süzme ve pekiştirmeli öğrenme aynı puanlayıcıyı kullanır. Girdi model çıktısı (metin), başlangıç durumu ve isteğin beklentisidir. Çıktı bileşenlere ayrılmış puandır:

| Bileşen | Ölçüt |
|---|---|
| `bicim` | Geçerli JSON, `{"reply","actions"}`, sözlükteki işlemler |
| `motor` | `uygula()` reddi yok, uyarı yok |
| `istek` | Beklenen gözlemler sağlanıyor mu: eşya, ölçü, kısıt, oda, renk (H1'in `expected.observations` alanı) |
| `durustluk` | Ölçü yoksa soru soruyor mu; sığmıyorsa söylüyor mu; mobilya detayında işlem üretmiyor mu |
| `dil` | Kullanıcının dilinde mi; yasaklı iç terim 0 |
| `kisalik` | Gereksiz ya da yinelenen işlem yok |

**Hile testleri zorunlu.** Şu çıktılar düşük puan almalı:
- boş işlem listesi;
- isteği tekrarlayan ama işlem üretmeyen cevap;
- aynı işlemin 5 kez yazılması;
- başka dilde cevap;
- ölçüyü kendiliğinden küçültme;
- uydurulmuş oda adı.

Her biri için negatif test yazılır.

## E2. Süzerek öğrenme döngüsü: `tools/egitim/ornekle.py`

1. İstemler kümesi: H1 kullanıcı satırları (eğitime girmiş olanlar hariç); H4 odalarından yeni istekler ve aynı isteklerin farklı söylenişleri. Sınavla sızma 0 olmalı.
2. Model her isteğe k=8 cevap üretir (sıcaklık 0,7–1,0).
3. `puanla.mjs` hepsini puanlar. En iyisi, eşik üstündeyse aday olur. Bütün denemeler başarısızsa istek "zor istek" listesine girer.
4. Adaylar `producer: "Qwen-EGITIM-01"` ile karantinaya yazılır. Claude örnekleyerek denetler (çapraz denetim).
5. Onaylananlar EGITIM-01 verisiyle birleşir ve EGITIM-02 eğitilir.

**Kuru koşu:** CPU'da en küçük uygun Qwen ile, 20 istek × 4 cevap. Amaç uçtan uca boru hattını göstermek. GPU açılmaz.

**Rapor:** puan dağılımı, eşik seçimi, zor istek listesi, maliyet tahmini (9B ile 2.000 istek × 8 cevap).

## E3. Pekiştirmeli öğrenme hazırlığı (GPU yok)

- TRL GRPO (ya da eşdeğeri) ile yapılandırma. Ödül E1'in bileşenlerinin ağırlıklı toplamıdır; ağırlıklar rapora yazılır.
- Ödülü aşırı kovalamayı önlemek için iki önlem: başlangıç modelinden sapma cezası (KL) ve her 50 adımda kapalı sınav ölçümü.
- Kuru koşu: CPU'da küçük model, 10 adım. Ödül hesaplanıyor mu, kayıp düşüyor mu.
- Maliyet ve süre tahmini. Kullanıcı onayı olmadan GPU açılmaz.

## E4. Görsel hakem araştırması (veri ve kod yok, rapor)

Kurallar "sığdı mı" der, "güzel mi" demez. Bunu ölçmenin yolları:
- stüdyo görüntüsü (Playwright) + açık lisanslı bir görsel dil modeli (Qwen-VL ailesi vb.) ile puanlama;
- tasarımcı puanıyla uyumunun nasıl ölçüleceği: 50 yerleşim, 1–5 puan, sıra korelasyonu;
- lisanslar, donanım ve maliyet.

**Çıktı:** `GORSEL-HAKEM-01.md`. Hangi model, hangi ölçüt, ne kadar güvenilir. Kaynaklı yazılır, sayı uydurulmaz.

## E5. Serbest çizim araçlarının sözleşmesi (tasarım belgesi)

Model bugün hazır işlemleri kullanıyor: duvar ekle, eşya yerleştir. Serbest çizim için stüdyonun temel çizim araçları açması gerekir.

Önerilecek araçlar:
- çizgi, yay, çoklu çizgi;
- kapalı profil;
- profili uzatma (extrude);
- döndürme (revolve);
- ölçü ve kısıt (paralel, dik, eşit, mesafe).

Her araç için:
- parametreler ve birim;
- doğrulama kuralları (kendini kesme, sıfır alan, ölçü aralığı);
- geri alma;
- motorda nasıl denetleneceği.

**Kaynaklar:** açık kaynak CAD çekirdekleri ve parametrik kısıt çözücüleri (lisansıyla birlikte), ayrıca bunların dil modeliyle kullanıldığı çalışmalar.

**Çıktı:** `SERBEST-CIZIM-SOZLESME-01.md`. Uygulamayı Claude yapar (`assets/`). Sen yalnız sözleşmeyi, örnek işlem dizilerini ve doğrulama testlerinin beklenen sonuçlarını hazırlarsın.

## E6. Ev tekstili seçenek kataloğu (veri dosyası)

Kullanıcı kararıyla perde ve halı hem stüdyoda ayrı ürün ailesi, hem asistanın işi. Uygulamayı Claude yapacak. Senden beklenen, araştırma `knowledge/ev-projesi/EV-TEKSTILI-URUN-ARASTIRMA-03.md`'den makine okunur bir katalog:

- `knowledge/ev-projesi/veri/ev-tekstili-katalog.json`;
- perde türleri, başlıklar, pile oranları, ölçü kuralları (pay, montaj), kumaşlar, renk paleti;
- halı yapımları, malzemeler, hazır ölçüler, hav yükseklikleri, kenar bitişleri;
- her değerin yanında `kaynak` ya da `aura_onerisi` işareti;
- 9 dilde adlar.

Tekstil işlemleri (`tekstil/perde`, `tekstil/hali`) bu katalogla uyumlu hale gelince H1'in tekstil satırları kataloğa göre yeniden doğrulanır.

## Kabul (her PR)

- `node tests/hepsi.mjs` yeşil. Container belleği yetmezse ilgili alt testler tek tek çalıştırılır ve bu yazılır.
- Negatif testler var.
- Sınavla sızma 0.
- Açık kusurlar dürüstçe yazılmış.
- GPU, ücretli API, dağıtım ve merge yok.
