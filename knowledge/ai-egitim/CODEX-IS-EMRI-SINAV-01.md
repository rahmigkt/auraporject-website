# Codex iş emri önerisi — SINAV-01: komut sınav seti ve taban ölçüm

Hazırlayan: denetçi (Claude), 2026-10-18. Öneri niteliğindedir; karar sahibi değiştirebilir.
Önce oku: `README.md`, `ONKAYIT-SINAV-01.md`, `DENETIM-D0.md`, `tests/ai-eval/ornek.jsonl`.

## Amaç

Stüdyonun komut kutusuna yazılan (ya da söylenen) isteklerin ne kadar doğru anlaşıldığını ölçen, çok dilli, donmuş bir
sınav seti kurmak ve bugünkü kural okuyucunun taban puanını çıkarmak. **Bu işte model eğitilmez, kural okuyucu
(`assets/forma/commands.js`) değiştirilmez.**

## Çalışma dalı

`main`'den yeni dal: `codex/aura-ai-sinav-01`. Başka dallarla karıştırma. Bitince main'e PR; birleştirmeden önce
denetim (D1) beklenir.

## Adımlar

### 1. Söz dağarcığı dökümü
`tests/ai-eval/vocab.mjs` yaz: `assets/forma/families.js` içindeki her aile için `mod.RANGES` (sayısal anahtarlar ve
aralıkları), `mod.ENUMS` (seçenekler), `kinds`, malzeme yuvaları ve seçenekleri (`assets/forma/catalog.js`:
WOODS, STAINS, FINISHES, COLORS, STONES, METALS, GLASS, FIBERS, PATTERNS, SINK_FINISHES) ve kural okuyucunun ürettiği
eylem türlerini `tests/ai-eval/vocab.json` olarak dök. Altın cevaplar yalnız bu söz dağarcığını kullanır.

### 2. Sınav kayıtları
Şema `tests/ai-eval/ornek.jsonl` ile aynıdır (alanlar: id, lang, split, category, context, text, gold{expect, forbid,
clarify}, notes, label). Kurallar:

- Bileşim `ONKAYIT-SINAV-01.md`'deki hedefe uyar (≥500 kayıt; dil, kategori, aile ve bölüm oranları).
- Cümleler gerçek müşteri gibi olsun: kısa, eksik, yazım hatalı, konuşma dili, birim karışık ("1.80", "180 cm",
  "bir seksen", "2 metre", "60'lık"), göreli ("biraz", "daha", "yarısı kadar"), olumsuz ("olmasın", "istemem",
  "hariç", "yerine"), karışık ("meşe olsun ama kapaklar beyaz"), aile değiştiren, belirsiz ve konu dışı.
- `expect`: uygulanması gereken eylemler. Sayısal hedef kesinse `value`; göreli isteklerde `sign` ve makul `range`.
- `forbid`: kesinlikle uygulanmaması gerekenler. **Her olumsuz cümlede en az bir `forbid` zorunlu.** Bilinen
  karışmalar için de yaz (örnek: "taş" → renk eylemi yasak).
- `clarify: true`: doğru davranış hiçbir şeyi değiştirmeyip sormaksa (belirsiz, konu dışı, kendi içinde çelişkili).
- İsteğin bir kısmı bugünkü eylemlerle ifade edilemiyorsa (örnek: "3 kapaklı" bölme düzeni) onu `gold` içine
  yazma; `gold.unsupported` dizisine düz metin olarak ekle. Puanlayıcı bu alanı saymaz; sonraki iş emri için gerekir.
- İngilizce dışındaki yabancı dillerde anadil denetimi yoksa `notes`'a "anadil denetimi yok" yaz.
- Hepsi `label: {"by":"codex","reviewed_by":null,"review":"unreviewed"}`.
- Dosyalar: `tests/ai-eval/sinav-01-dev.jsonl` ve `tests/ai-eval/sinav-01-test.jsonl`. Aynı kalıbın sayı değişmiş
  kopyaları aynı dosyada kalır.
- **Kural okuyucunun çıktısına bakarak altın cevap yazma.** Önce bütün altınları yaz, sonra koş.

### 3. Şema kontrolü ve dondurma
- `node tests/ai-eval/score.mjs tests/ai-eval/sinav-01-dev.jsonl --all` ve test dosyası için aynısı hatasız
  çalışmalı (puanlayıcı önce şemayı denetler).
- Test dosyasının SHA-256'sını `tests/ai-eval/FREEZE.json` içine yaz:
  `{"tests/ai-eval/sinav-01-test.jsonl": {"sha256": "...", "frozen": "2026-10-..", "by": "codex"}}`.
  Dondurduktan sonra test dosyası değişmez.

### 4. Uzman onay sayfası
`tests/ai-eval/uzman-onay.mjs` yaz:
- `--export` her kayıt için bir satırlık CSV üretir: id, dil, aile, cümle, beklenen eylemlerin okunur Türkçe özeti,
  yasaklar, soru mu, boş "karar" (onay / ret / düzelt) ve "not" sütunları. Dosya: `tests/ai-eval/uzman-onay-01.csv`.
- `--import <csv> --reviewer "<ad>"` kararları kayıtlara işler (`approved` / `rejected`, `reviewed_by`, tarih).
  Donmuş test dosyasına onay işlemek dosyayı değiştirir; bu yüzden onaylar **ayrı** bir dosyada tutulur:
  `tests/ai-eval/onaylar-01.json` ({id: {review, reviewed_by, date, note}}). Puanlayıcıya bu dosyayı okuyacak
  `--approvals <dosya>` seçeneği eklemek için denetçiye öneri yaz; puanlayıcıyı kendin değiştirme.

### 5. Taban ölçüm
- `node tests/ai-eval/score.mjs tests/ai-eval/sinav-01-dev.jsonl --all --out tests/ai-eval/rapor-01-dev-rules.json`
- `node tests/ai-eval/score.mjs tests/ai-eval/sinav-01-test.jsonl --all --out tests/ai-eval/rapor-01-test-rules.json`
- Bu ikisi "ön skor"dur (onaysız). Uzman onayı gelince resmi taban yeniden koşulur.

### 6. Rapor
`knowledge/ai-egitim/RAPOR-SINAV-01.md`:
- Bileşim tablosu (dil × aile × kategori sayıları) ve önkayıttaki hedeflere uyup uymadığı.
- Taban puanları (genel, dil, kategori). Sayıları raporun içine elle değil rapor JSON'undan aktar.
- `dev` hatalarından en sık 10 hata kalıbı, her biri için bir örnek. `test` hatalarını kalıplara dökme
  (önkayıt kural 4).
- `gold.unsupported` içinde en sık geçen ifade edilemeyen istekler (sonraki eylem türleri için girdi).
- Açık kalan sorular ve sınırlar.

## Yapma

- `assets/` altında hiçbir dosyayı değiştirme.
- Puanlayıcıyı (`score.mjs`), önkayıdı ve denetim dosyalarını değiştirme; öneri varsa rapora yaz.
- Kural okuyucuyu ya da bir modeli sınavı geçecek şekilde ayarlama; bu iş emrinde eğitim yok.
- Müşteri verisi, gerçek kişi adı, marka/ürün adı kullanma.
- Onaysız kayıtları "onaylı" diye işaretleme.

## Teslim ve kabul

PR içeriği: `vocab.mjs`, `vocab.json`, iki sınav dosyası, `FREEZE.json`, `uzman-onay.mjs`, `uzman-onay-01.csv`,
iki rapor JSON'u, `RAPOR-SINAV-01.md`. Denetçi D1'de şunlara bakar: şema hatası yok; bileşim önkayda uyuyor;
donmuş hash tutuyor; olumsuz kayıtların hepsinde `forbid` var; altın cevaplar söz dağarcığının dışına çıkmıyor;
kör ikinci okumada rastgele 60 kayıtta denetçi ile Codex arasındaki uyum ≥ %90; raporun sayıları JSON ile aynı.
