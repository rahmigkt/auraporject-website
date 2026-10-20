# CODEX-IS-EMRI-EV-QWEN-00 — ÖNCELİK 1: Qwen'e ev çizmeyi öğretmek

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex

**Sıra:** Bu iş emri, EV-QWEN-01'den (fotoğraftan tasarım vb.) **önce** yapılır. EV-QWEN-01 ikinci sıradadır.

## Amaç

Qwen, kullanıcının isteğinden **evin planını** çizebilmeli. Plan, EV-01 şemasına uygun, ölçülü ve kurallara uyan bir kayıt olmalı. Kapsam:
- tek oda;
- daire: 1+1'den 5+1'e;
- dubleks ve iki ya da daha fazla katlı ev;
- müstakil ev, bahçe ve dış cephe sınırıyla;
- farklı kurgular: açık mutfak, koridorlu, holsüz, köşe salon, kırık ve L odalar, kolon, niş, balkon.

Çizim kaydı stüdyonun `ev.html` görüntüleyicisinde açılabilmeli. Kayıttaki duvarlar, açıklıklar ve odalar aynı veriden 2B plana ve 3B'ye dönüşüyor; örnek olarak `assets/ev/ornek-plan.json`.

## Görevler

### A · Şemanın genişletilmesi (öneri)

EV-01 v0.1 şemasına şunlar eklenmeli:
- **Katlar:** kot ve kat yüksekliği.
- **Merdiven:** tür, basamak sayısı, rıht ve basamak ölçüleri, döşeme boşluğu.
- **Müstakil ev:** dış duvar, bahçe ve arsa sınırı.
- **Balkon ve teras.**
- **Kapı:** açılış yönü (menteşe tarafı).
- **Duvar ağı:** köşe düğümleri.
- **Odalar:** çokgen oda.

Sürüm v0.2 olarak `knowledge/ev-projesi/veri/ev-projesi.schema.v0.2.json` dosyasına yazılır. v0.1 ile geriye uyumluluk notu eklenir.

### B · Kural seti

Konut planlama kuralları makine okunur biçimde `knowledge/ev-projesi/veri/plan-kurallari.v2.json` dosyasına yazılır. Kapsam:
- asgari oda ölçüleri ve alanları;
- koridor ve kapı genişlikleri;
- ıslak hacimlerin gruplanması;
- yatak odası ile salon ayrımı;
- mutfak çalışma üçgeni;
- merdiven formülü (2 rıht + 1 basamak);
- pencere ve gün ışığı oranı.

Her kuralın yanında kaynak bulunur. Kaynak yoksa kural "öneri" olarak işaretlenir.

### C · Sentetik plan üretici ve doğrulayıcı (`tools/ev-plan/`)

Bu iş emrinde Codex `tools/` altında kod yazabilir; bu klasör siteye yüklenmez. `assets/` yine yasak.

- **Doğrulayıcı.** Bir plan kaydını şema ve kurallara göre denetler:
  - duvarlar kesişiyor mu, odalar kapalı mı;
  - her odaya kapıdan ulaşılıyor mu;
  - asgari ölçüler sağlanıyor mu;
  - merdiven katları bağlıyor mu.
- **Üretici.** Kurallarla geçerli planlar üretir. Hedef çeşitlilik:
  - 1+1'den 5+1'e daireler;
  - dubleksler;
  - 2–3 katlı müstakil evler;
  - farklı kurgular ve kırık odalar.

  En az **2000** geçerli plan üretilecek. Her plan doğrulayıcıdan geçmeli; geçemeyenler veri setine girmez.
- **İstek eşleştirme.** Her plan için kullanıcı istek cümleleri yazılır: Türkçe ve İngilizce, sade ve ayrıntılı, eksik bilgili; örneğin "3+1, 120 m², salon güneyde, mutfak açık". Bir plana birden fazla cümle düşebilir.
- **Düzeltme örnekleri.** Konuşma içinde değişiklik istekleri: "salonu büyüt", "banyoyu koridora al", "ikinci kat ekle". Her biri için önceki plan → istek → sonraki plan üçlüsü.

### D · Eğitim provası (yerel, GPU'suz) — QWEN-YEREL-02 ile birlikte

- **Veri seti biçimi:** Qwen sohbet formatında. Girdi kullanıcı isteği ve gerekirse önceki plan; çıktı araç çağrısı ve plan kaydı ya da değişiklik işlemleri.
- **Ayırma:** eğitim, doğrulama ve test olarak; test seti eğitimde hiç görülmemiş kurgulardan oluşmalı.
- **Ölçütler:**
  - geçerli plan oranı (doğrulayıcıdan geçen);
  - istenen oda sayısı ve alan tutarlılığı;
  - kural ihlali sayısı;
  - kat bağlantısı.
- **Taban ölçüm.** Eğitimsiz Qwen ve büyük genel model aynı test setinde ölçülür. Eğitimin ne kazandırdığı buradan görülür.
- **Yerel küçük deneme.** Kullanıcının makinesinde (36 GB RAM, GPU yok) veri hattının baştan sona çalıştığı gösterilir. **GPU kiralama yok**; büyük eğitim kullanıcının açık onayıyla ayrıca yapılır.

## Teslim

- `knowledge/ai-egitim/EV-QWEN-00-RAPOR.md`: sonuçlar, ölçümler, açık sorunlar.
- `tools/ev-plan/`: üretici, doğrulayıcı, veri seti dönüştürücü ve README.
- `knowledge/ai-egitim/veri/ev-plan-veriseti/`: üretilmiş veri. Büyükse yalnızca üretme komutu ve örnek dilim konur.
- Her ev tipinden birer örnek planın `ev.html` ile açılabilir JSON'u; Claude görüntüleyiciye bağlayacak.

## Kurallar

- Belgesiz bilgi yok. Lisanslar kaynakla belirtilir. Ticari kullanıma kapalı plan veri setleri kullanılmaz (CubiCasa5k, RPLAN, 3D-FRONT doğrulanmadan).
- Gerçek müşteri verisi kullanılmaz; bütün planlar sentetiktir ve öyle işaretlenir.
- Ücretli servis ve GPU kiralama başlatılmaz.
