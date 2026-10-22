# AURA için isteğe bağlı yerel Ruflo yardımcı katmanı

Ruflo 3.59.17 iki yerel düzeltme ve better-sqlite3 12.9.0 ile sınandı.
Bu araç, çalışma kayıtlarını bir yere kopyalayıp SHA ile geri okumak içindir.
GOREVLER.md, H5 frozen dosyaları, denetim kararları ve asıl JSON kayıtları
otorite olarak kalır. Site, eğitim, model, ajan, MCP veya daemon başlatılmaz.
Kurulum/retest otomatik değildir. Bir arka plan hizmeti veya site bağımlılığı yoktur.

## Pilot kurulumu

Bu klasörün dosyalarını **ayrı yeni bir pilot dizinine** kopyalayın. Eski pilotu
ezmeyin. Paketler exact sürümlü ve package-lock.json ile sabittir.

```powershell
npm.cmd ci --ignore-scripts --omit=optional --no-audit --no-fund
npm.cmd rebuild better-sqlite3 --foreground-scripts
python fix-pilot.py
New-Item -ItemType Directory -Path .claude -Force
```

İkinci komut yalnız denetlenen SQLite bileşeninin native kurulumu içindir;
Ruflo'nun diğer kurulum betikleri etkinleştirilmez. Ücretli servis kullanılmaz.
`fix-pilot.py` özgün kaynak SHA'larını denetler; beklenmeyen sürümde durur.
Yama üç dosyayla sınırlıdır; orijinalleri patches/original içinde saklanır.

- CLI hata yolları `process.exitCode` ve `return` ile sarmalayıcının kapanışına ulaşır.
- Görev önkoşulları doğrulanır, saklanır, status/list yanıtında gösterilir ve
  önkoşul tamamlanmadan başlatma/tamamlama/atama reddedilir. Retry kenarları korur.
- Eski görevlerde kaybolmuş kenarlar kendiliğinden geri üretilemez.

Bu bir upstream Ruflo sürümü değil, `3.59.17+aura-local` yerel yamasıdır.
Windows/x64 Node24 pilotunda doğrulanan SQLite ikilisinin SHA'sı pilot-lock.json
içindedir. Başka platform/ABI ikilisini incelemeden kilidi değiştirmeyin.

## Tek yönlü bağlantı

AURA repo kökünde, açık dizinlerle çalıştırılır:

```powershell
node tools/ruflo/aura-index.mjs sync --state-root PATH_TO_CANONICAL_WORK --pilot-root PATH_TO_ISOLATED_PILOT
node tools/ruflo/aura-index.mjs query --key H5 --state-root PATH_TO_CANONICAL_WORK --pilot-root PATH_TO_ISOLATED_PILOT
node tests/ruflo-evidence-check.mjs PATH_TO_ISOLATED_PILOT
```

Yalnız H5, C7 ve yayın kayıtlarının izinli durum alanları kopyalanır. Kaynak
dosyalar yazılmaz. Her okumada kaynak SHA ve içerik yeniden karşılaştırılır;
eski/değişmiş kayıt reddedilir. Ruflo başarısı H5 başarısı veya eğitim izni
değildir. Eşzamanlı sync atomik toplu işlem değildir; hatalı/kısmi indeks
otorite değildir ve her query güncellik kapısından geçer. Devre dışı bırakmak
için aracı çağırmayı bırakmak yeterlidir; AURA dosyaları geri alınmaz.

Çocuk süreç ortamına API anahtarı taşınmaz. Node ağ/alt süreç/worker çağrıları
yükleme öncesi korumayla engellenir. Native SQLite bu JavaScript korumasından
ayrıdır; bu tam OS sandbox'ı veya tüm bağımlılıkların güvenlik denetimi değildir.
Çalışma alanı izinleri ve sabit kaynak/ikili SHA kapıları korunur.

## Kanıt

retest.json: 18 bağımlılık kontrolü, altı temiz hata çıkışı, özgün kayıt korunumu,
ayrı süreçte kenar okuma, açık WAL ile native yedek ve integrity_check=ok.
JSON import/export kanıt arşivi yerine geçmez; memory backup native SQLite
görüntüsü alır. Anlamsal arama/model/ajan performansı değerlendirilmedi.
API/site dosyaları değişmedi; tam site/vendor/mobil denetimi bitmiş sayılmaz.
H5 gerçek tokenizer ön kontrolü ayrı PR257'de; model CPU temel ölçümü bekliyor.

Denetçi Codex, review_mode=user_authorized_self_review. Bu yerel test,
bağımsız Claude incelemesi veya uluslararası ürün uygunluğu değildir.
