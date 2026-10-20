# Gerçek plan hattı — EV-QWEN-00D

Depo kökünden Python 3.11+; `shapely==2.1.2`, `jsonschema==4.26.0`, `fastjsonschema==2.21.2` gerekir. `PYTHONPATH` içine `tools/ev-plan` eklenir. Büyük kaynak ve türevler depo dışına yazılır.

```powershell
$env:PYTHONPATH='tools/ev-plan'
python -m real.pipeline --raw C:/aura-data/swiss --output C:/aura-data/run-NEW --review C:/aura-data/review-NEW
```

Hedefler yeni klasör olmalıdır. Kaynak arşiv sabit yayıncı kaydı ve MD5 ile, yerel dosyalar SHA-256 ile doğrulanır. İndirme yalnızca Zenodo'daki açık lisanslı veri içindir. GPU, model indirme, API anahtarı veya ücretli servis kullanılmaz.

Adımları ayrı çalıştırmak için:

```powershell
python -m real.fetch --destination C:/aura-data/swiss
python -m real.swiss stage --source C:/aura-data/swiss --database C:/aura-data/stage.sqlite
python -m real.swiss convert --database C:/aura-data/stage.sqlite --output C:/aura-data/converted-NEW
python -m metrics fit --data C:/aura-data/converted-NEW --output C:/aura-data/profile.json
python -m real.programs --data C:/aura-data/converted-NEW --output C:/aura-data/pairs-NEW
python -m real.review --data C:/aura-data/converted-NEW --profile C:/aura-data/profile.json --output C:/aura-data/review-NEW
python -m real.audit --data C:/aura-data/converted-NEW --profile C:/aura-data/profile.json --review C:/aura-data/review-NEW --output C:/aura-data/audit.json
```

`retrieve.py --help` tek program JSON'undan 3–5 seçenek üretir. Kaynak/geometri kodu veya dosya hash'i değiştiyse indeks açılmaz; yeni dönüşüm gerekir. Program, test ve aday eğitim hedefi `solver/program.py` içindeki aynı sistem istemini ve `plan-program.schema.json` v0.4 sözleşmesini kullanır. Bu bir canlı site entegrasyonu değildir; `assets/` değiştirilmez.

Bir bina yalnızca bir bölmede bulunur. Eğitim referans havuzu yalnız `train`; inceleme istekleri `test` binalarından gelir. Aynı net poligon kümesinin birebir tekrarları çıkarılır. Yakın tekrarların tamamının temizlendiği iddia edilmez. Kısa TR/EN komutların hedef grafı tek mümkün cevap değildir; bu dosyalar insan onayı bekleyen aday eğitim verisidir, dil modeli başarımı değildir.

`plans.jsonl` satırında EV-01 v0.2 `plan` ve zorunlu `geometry` yan kaydı vardır. `geometry` gerçek oda/duvar/açıklık poligonlarını korur. EV'nin duvar eksenleri ve oda `axis_boundary` alanı açıkça işaretlenmiş uyumluluk yaklaşımıdır; ölçülmüş ortak duvar eksenleri değildir. Gerçek kaynak için `real.geometry.validate_record` kullanılır. Eski sentetik eksen-kapanış doğrulayıcısının geçtiği iddia edilmez. SVG incelemesi kaynak poligonlarından çizilir; eski `ev.html` görüntüleyicisi yalnız uyumluluk izdüşümünü gösterir.

Kapı komşulukları sınırlı normal ışınların ilk oda kesişiminden çıkarılır; belirsiz veya bağlantısız kayıt karantinaya alınır. Kaynak `ROOM` etiketi yatak odasına çevrilmez. Banyo/WC ayrımı donatı çıkarımıysa bu bilgi saklanır. Kapı menteşesi, taşıyıcılık, döşeme yüksekliği ve bütün evin kat bağlantıları uydurulmaz.

Şu an yalnız CH tek kat konut birimleri desteklenir. Sabit mevcut yapı elemanları, müstakil veya çok katlı istekler açıklama/tasarımcı gerektirir. ±%15 ölçek sınırı ve kalite puanı eşiği mühendislik önerisidir; öğrendirilmiş, mevzuata uygun veya yapısal olarak onaylanmış sınır değildir. Her uyarlama tasarımcı incelemesi bekler.

Test: `python -m unittest discover -s tools/ev-plan -p 'test*.py'`. Atıf ve veri hakları için `knowledge/ai-egitim/VERI-ATIF.md`, kaynak envanteri için `knowledge/ev-projesi/veri/real-dataset-registry.json` kullanılır.

Node ve Playwright kurulu ortamda `node tools/ev-plan/real/review-smoke.cjs <review-directory> 60` inceleme ekranını; `node tools/ev-plan/real/viewer-smoke.cjs <review-directory>/viewer` mevcut `ev.html` içinde 120 dosyayı sınar. İkinci test tek sayfayı tekrar kullanır ve sonuçları her dosyadan sonra kaydeder. Testler kendi Chrome oturumunu açar; kapanış sınırlı sürede bitmezse yalnız kendilerinin başlattığı tarayıcı sürecini kapatır. Bu, kullanıcı tarayıcısını veya stüdyonun kodunu değiştirmez.
