# EV-SOHBET-02

Bu yol `sohbet-001.mjs` dosyasını çalıştırmaz/değiştirmez. EV-SOHBET-01 verisine dayanmaz. Eski teslimi arşivsel olarak korur; yeni 20 kayıt ayrı klasördedir. Stüdyo ve `assets/` salt okunur.

Python 3.11+, `requirements-02.txt` içindeki Shapely; Node 20+ gerekir. Tarayıcı kontrolü için ayrıca Playwright ve Chrome. Ücretli API, model, GPU veya eğitim yok.

Depo kökünden, bağımlılıkların kurulu olduğu Python/Node ortamıyla:

```powershell
python tools/ev-sohbet/build02.py
node tools/ev-sohbet/place02.mjs
python tools/ev-sohbet/denetim.py --geometry-only
python tools/ev-sohbet/dialogues02.py
python tools/ev-sohbet/denetim.py
python tools/ev-sohbet/review02.py
node tools/ev-sohbet/verify02.mjs
python -m unittest discover -s tools/ev-sohbet -p test02.py -v
node tools/ev-sohbet/viewer02.cjs
python tools/ev-sohbet/report02.py
```

İlk komut depodaki 20 lisanslı kaynak fikstürünü kullanır; indirme gerekmez. Önceki EV-QWEN-00D indeksinden yeniden almak için isteğe bağlı `--source <converted-v1>` kullanılır. Betikler yalnız bu yeni teslimi yeniden yazar; mevcut `assets/` veya önceki sohbetleri değiştirmez.

`--geometry-only` yalnız diyalog henüz yazılmadan veri hazırlamak için: bütün geometri/ölçü denetimleri ve kaynak istisnaları çalışır, sohbet sayısının tamamlanmaması geçici olarak çıkış kodunu etkilemez. **Son kabulde bu bayrak kullanılmaz.** `strict_pass`, kaynak istisnasız bütün hedefler geçti demektir; `accepted_with_documented_source_exceptions` farklıdır. Kaynak istisnası olmayan yeni bir hata çıkış kodunu 1 yapar.

`dialogues02.py` 20 elle yazılmış ayrı konuşmayı ölçülmüş sonuçlarla kaydeder; yalnız alan/ürün/istisna sayıları yerlerine konur. Bir modeli çağıran veya ortak cümleleri varyasyonlarla çoğaltan üretici değildir. `place02.mjs` yalnız istek gönderir ve çözücünün konumlarını kaydeder; elle mobilya koordinatı içermez. Bir odadaki arama sınırlı (`beam=6`); “sığmıyor” sonucu evrensel olanaksızlık ispatı değildir. Sığmayan oda/ürün ve kabul edilen azaltılmış set açıkça konuşulur.

`verify02.mjs`, kaydedilen her isteği canlı stüdyo modülünde yeniden çalıştırır ve derlenmiş ürün ayak izini de kontrol eder. Modül hash'i değişmişse eski sonucu güncelmiş gibi kabul etmez. Yataklar eski seti satışa geri getirmez: mevcut derleyiciyle yalnız ölçü referansı (`decision: reference`) olarak gösterilir.

İnceleme: `knowledge/ai-egitim/EV-SOHBET-02-inceleme.html`. Üç sohbetin dört kat dosyası `knowledge/ai-egitim/ev-sohbet-02-ornekler/` içinde, doğrudan `ev.html` → **Plan dosyası aç** ile yüklenir. Görüntüleyici kat seçmediği ve balkonları da topladığı için örnekler kat başına **yalnız iç alan izdüşümüdür**; tam kayıttan hiçbir balkon veya kat silinmez. Üst kat girişinin doldurulması ve merdiven boşluğu yeni tasarım varsayımıdır, yapısal onay değildir.
