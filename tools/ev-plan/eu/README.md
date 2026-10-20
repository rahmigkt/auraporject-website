# EV-QWEN-00C — ülke bağlamı prototipi

Python ve bağımlılıklar `../real/README.md` ile aynı. Depo kökünde `PYTHONPATH=tools/ev-plan` ayarlanır. Büyük Swiss kaynak/indeks dosyaları depo dışında tutulur. Kaynak dönüştürücünün hash'i korunmalıdır; Windows checkout satır sonları manifest hash'ini değiştiriyorsa yeniden dönüşüm gerekir, hash kontrolü atlanmaz.

```powershell
python -m eu.catalog
python -m eu.rules
python -m eu.language
python -m eu.contract
python -m eu.data --data C:/aura-data/converted-v1 --output C:/aura-data/eu-data-NEW
python -m eu.review --data C:/aura-data/converted-v1 --profile C:/aura-data/calibration-v1.json --output C:/aura-data/eu-review-NEW
```

Veri/inceleme çıktı klasörleri yeni olmalıdır. `eu.review --output ... --refresh-html` yalnız mevcut gömülü SVG'leri yeniden serileştirir ve HTML'yi yeniler; geometriyi veya kayıt hash'lerini değiştirmez.

İsteğe bağlı gerçek yerel taban ölçüm (eğitim değildir):

```powershell
ollama pull qwen2.5:0.5b-instruct
python -m eu.benchmark --output C:/aura-data/eu-baseline-NEW
python -m eu.audit --data C:/aura-data/eu-data-NEW --review C:/aura-data/eu-review-NEW --baseline C:/aura-data/eu-baseline-NEW
python -m unittest discover -s tools/ev-plan -p 'test*.py'
node tools/ev-plan/eu/review-smoke.cjs C:/aura-data/eu-review-NEW
node tools/ev-plan/real/viewer-smoke.cjs C:/aura-data/eu-review-NEW/viewer 104
```

Playwright ve yerel Chrome gerekir. Test indirmesi `saveAs` kullanır; tarayıcı süreçleri test sonunda kapatılır. Bu teslimde audit sıfır geçerli model programı buldu. Gelecekte geçerli program varsa audit onu araçtan geçirmeden başarı yazmaz; açık hata ile gerçek çalıştırma ister.

`eu.contract.SYSTEM` ve `response_schema()` aday veri, ölçüm ve araç prototipinin tek sözleşmesidir: **0.5-eu**. Eski 0.4 sözleşmesi ve canlı site değiştirilmez. `eu.planner.plan` ülke teyidi, bölge ve yabancı referans izni ister. `revise` ülke/bölgeyi ve revizyon korumasını muhafaza eder. Bilinmeyen ülkede veya referansı olmayan ev/kat tipinde netleştirme döner.

Ülke profili, kaynak ülke ve mevzuat taraması ayrı alanlardır. Kaynak CH kalır; hedef BE olması Belçika'da ölçülmüş veya mevzuata uygun plan anlamına gelmez. `screen` yalnız verilen kapsam/ölçü biliniyorsa karşılaştırır; eksikler `unknown`, bütünsel uygunluk her zaman doğrulanmamıştır. Alan tanımları (net/GIA/GO/ağırlıklı alan) birbirine çevrilmez.

2400 metin, yazılmış bileşenlerin bileşimidir; ana dil incelemesi bekleyen **aday veri**. Test tipi ve kaynak bina ayrımı vardır; tekrar eden dil kalıpları nedeniyle bu bölmeler bağımsız doğal dil genellemesi kanıtı değildir. Eğitim, kiralık GPU ve ücretli API bu araçlarda yoktur.
