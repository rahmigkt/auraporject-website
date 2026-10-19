# QWEN-YEREL-02 — Stüdyo ile birlikte gelişen yerel eğitim (iş emri)

Tarih: 2026-10-19 · Yazan: Claude (denetçi) · Karar sahibi: Hüseyin · Uygulayan: Codex

## Karar sahibinin yönü

Amaç, Qwen ile stüdyonun **aynı amaçla, aynı anda** gelişmesidir. Eğitim döngüsü
**yerelde** (karar sahibinin bilgisayarı) kurulur ve olgunlaştırılır; birkaç saat süren
küçük turlar normaldir. **Kiralık GPU yalnız şu koşulda açılır:** yerel turlarda bütün
bilinen kusurlar kapanmış, ölçüm kapıları geçilmiş ve karar sahibi büyük eğitime açıkça
onay vermiştir. Bu iş emrinde kiralık sunucu kullanılmaz.

## PR #69'dan çıkan dersler (denetim)

- Adaptör tasarım değil, tek bir istem/çıktı biçimini öğrendi: biçim değişince 0/40.
- Veri iç parametre adlarıyla, makine üretimi; doğal Türkçe komut ve insan onayı yok.
- Veri, stüdyonun eski bir anına kilitli; stüdyo o gün içinde değişti (ahşap dikme-ayak,
  damar yönü, kumaş, fotoğraf). Stüdyo değiştikçe veri yeniden üretilmeli.
- Altyapı (hash, ölçüm, maliyet sınırı, temizlik) iyi: korunacak.

## Yapılacaklar (yerel, sırayla)

1. **Tek sözleşme:** Eğitim, deneme ve canlı kullanım aynı istemi/çıktıyı kullanır
   (`api/forma-ai.php` istemi + `ai.js` `vocabulary`/`sanitizeActions`). Çıktı her zaman
   `{"actions":[...]}`; dizi ya da başka biçim → kusur sayılır.
2. **Stüdyoyla eşzamanlılık:** Veri üreticisi her çalıştırmada main'deki güncel stüdyoyu
   okur; kaynak hash'i değişince eski veri "bayat" işaretlenir ve yeniden üretilir.
   Stüdyoya yeni parametre/araç eklendiğinde ilgili örnek ailesi otomatik büyür.
3. **Doğal komutlar:** Her işlem için çok sayıda doğal Türkçe (ve İngilizce) söyleyiş;
   belirsiz komutta netleştirme sorusu, reddedilen istekte işlem yok, çok adımlı düzenleme.
4. **Gerçek sonuç denetimi:** Her örnek tarayıcıdaki gerçek `applyActions` yoluyla geri
   oynatılır; derlenen parça, ölçü değişimi ve `physics.js` uyarıları kayda girer.
5. **Yerel küçük turlar:** Karar sahibinin GPU'sunda (≈24 GB) LoRA turları; her turda
   aynı kapalı test, biçim sağlamlığı testi (istem varyasyonları) ve gerileme ölçümü.
6. **İnsan onayı:** Her turdan 30–50 örnek karar sahibine kısa liste olarak sunulur;
   onaylananlar "reviewed" olur. Estetik örnekler yalnız insan onaylı veriden.
7. **Kusur listesi:** `knowledge/ai-egitim/QWEN-KUSURLAR.md` — her bulunan kusur, kaynağı,
   düzeltmesi ve kapandığı tur. Liste boşalmadan büyük eğitim önerilmez.

## Kiralık büyük eğitime geçiş kapısı (hepsi gerekli)

- Kusur listesi kapalı; biçim sağlamlığı ≥ %98 (istem varyasyonlarında), kapalı test ≥ %95.
- Doğal Türkçe komut testi ≥ %90; reddetme/netleştirme doğruluğu ≥ %95.
- Önceki turlara göre gerileme yok; veri güncel stüdyo hash'ine bağlı.
- Maliyet ve süre tahmini yazılı; karar sahibinin açık onayı.

## Sınırlar

- `assets/` değişikliği gerekiyorsa ayrı, kapsamı açık PR. Canlı siteye bağlanmaz.
- `outputs/`, `tools/`, `work/` siteye yüklenmez (deploy hariç listesine eklendi).
- Ağırlıklar ve anahtarlar Git'e girmez.
