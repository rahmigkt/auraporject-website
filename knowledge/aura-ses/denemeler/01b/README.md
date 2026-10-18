# METİN-01 aşama 1b — D3 ses revizyonu

[D3](../../../ai-egitim/DENETIM-D3.md) altyapıyı kabul etti; sesin fazla temkinli kalmasını düzeltmemizi istedi.
Karar sahibinin 2026-10-18 tarihli açık talimatıyla kurucu yaklaşıma [K11](../../KURUCU-YAKLASIM.md) eklendi:
**olguda tam doğruluk; imgede, ritimde ve kesinlikte serbestlik**. Yeni bir kurucu onay kapısı açılmadı;
bu düzeltmeyi ve 30 yeniden yazımı karar sahibi doğrudan istedi.

## Teslimin birimi

“Aynı 30 tasarım”, D3 ve ilk PR'deki veriyle birlikte, mevcut **10 tasarım × 3 deneme = 30 metin kaydı**
olarak uygulandı. Yeni tasarım örneklenmedi. Tasarım kimlikleri, eski 30 metin, kartlar, somut izler,
dayanaklar ve etkinlik koşulları korundu. Yeniden yazılan bölüm `tanik`tir; 20 TR ve 10 EN dağılımı aynı.
Her metin tek tek yazıldı; otomatik cümle üretimi, model API'si, toplu varyasyon veya eğitim koşusu yok.

## Kör okuma

Karar sahibine önce **yalnız** [okuma.html](okuma.html) dosyasını verin. Ağ bağlantısı ve kurulum istemeyen
tek bir HTML dosyasıdır. Masaüstünde A/B metinleri yan yana, dar ekranda alt alta görünür. Her eşleşmede
ad ve olgusal iz ortaktır. Otuz eşleşmenin her birinde A, B, eşit, ikisi de değil veya kararsız seçilebilir;
not bırakılabilir. Hiçbir seçim önceden yapılmamıştır.

“Seçimlerimi indir” düğmesi o sekmedeki yanıtları `aura-okuma-secimleri.json` olarak kaydeder. Dosyada yalnız
eşleşme kimliği, tercih ve not vardır; yazar/sürüm çözümü yoktur. Sayfa seçimleri bir sunucuya göndermez,
tarayıcı depolamasına yazmaz. Sekmeyi kapatmadan önce indirmek gerekir. Yerel sayfayı yeniden yüklemek
yanıtları sıfırlar; indirilen dosya karar sahibinin kaydıdır. Bu PR'ye gerçek yanıt dosyası eklenmedi.

GitHub'da veya basılı okumada [KOR-OKUMA.md](KOR-OKUMA.md) aynı 30 eşleşmeyi yine A/B olarak sunar.
A/B tarafları dengeli biçimde karıştırılmıştır. Aynı taraf sürekli yeni sürüm değildir. Dağılım yeniden
derlemelerde değişmez; yanıtlar çift kimlikleriyle eşlenir.

**Tercihler kaydedilmeden aşağıdaki anahtar ve sürüm dosyalarını açmayın.** Depoya erişimi olan biri
eşleşmeyi çözebilir; bu, gizleme veya erişim güvenliği sistemi değildir. Kör okuma, karar sahibinin
etiketsiz okuma dosyasını tek başına kullanmasıyla sağlanır.

## Denetçi için — kör okumadan sonra

- [inceleme-anahtari.json](inceleme-anahtari.json): eşleşme → kayıt/tasarım ve yeni sürümün tarafı.
- [metinler.jsonl](metinler.jsonl): 30 yeni kayıt, korunan olgusal dayanaklar ve güncellenmiş yorum sınırı.
- [yeniden-yazimlar.json](yeniden-yazimlar.json): tek tek yazılmış 30 tanıklık; serileştirici için metin kaynağı.
- Önceki kayıtlar: [ilk aşama metinleri](../metinler.jsonl) ve [aynı tasarımlar](../tasarimlar.json).

`tests/text-eval/build-blind-01b.mjs` yalnız bu kayıtları biçimlendirir; metin yazmaz. A/B anahtarı okuma
HTML'sine veya Markdown'ına gömülmez ve ikisinden yüklenmez. Anahtar dosyası silinirse yeni dağılım doğar;
gerçek okuma başladıktan sonra anahtar korunmalıdır. Dosyanın LF'ye normalize SHA-256 kaydı eski metin
kaynağına bağlanır; Windows satır sonu dönüşümü eşleşmeyi bozmaz.

## Doğrulama

Depo kökünde:

```sh
node tests/text-eval/build-blind-01b.mjs
node tests/text-eval/verify-01b.mjs
node tests/text-eval/verify-stage1.mjs
```

| Ölçüm | İlk aşama | Aşama 1b |
| --- | ---: | ---: |
| TR ortalama cümle uzunluğu (kelime) | 11,41 | 7,55 |
| EN ortalama cümle uzunluğu (kelime) | 13,81 | 9,03 |
| Yeni TR metinlerde en uzun cümle | — | 16 |
| Yeni EN metinlerde en uzun cümle | — | 18 |
| Yeni tanıklıkların kelime aralığı | — | 60–74 |
| Tanımlı çekince kalıpları kullanımı | — | 0 |

Çekince üst sınırı metin başına birdir; bu 30 metinde hiç kullanılmadı. Aynı kalıbın tekrarı ayrı sayılır.
Türkçe yeterlik/olasılık ekleri ve yaygın EN çekinceleri de sayaca dahildir. Eşanlamlı kaçışlara karşı
metinler ayrıca editoryal olarak okundu. Sayaç ve cümle ölçüsü ses kalitesini veya anlam doğruluğunu
otomatik olarak kanıtlamaz; D3'ün istediği değişimin denetlenebilir izleridir.

Olgusal kayıtlar eskiyle aynı kaldı ve aynı tasarım yollarıyla eşleştirildi. Yeni imgesel fiiller, kurucu
metinlerdeki tanıklık ve ilişki bakışını taşır. Örneğin elin kıyı bulması, sözün aradan geçmesi ve aynanın
bakışı geri vermesi teknik veya sağlık iddiası değildir. Bedenin ölçüsünü bulması ergonomi sertifikası,
eşyanın beklemesi yaşanmış müşteri geçmişi sayılmaz. Ahşap türü, kaplama, cam, taş adı ve parça seçimleri
bu imgesel serbestliğin dışında, kayıttaki olgusal sınırlarını korur.

Kontrol eski metin/tasarım kaynağının sabit hash'lerini, 30 birebir eşleşmeyi, korunmuş dayanakları,
etkinlik değerlerini, 50–120 kelime sözleşmesini, çekince sınırını, cümle uzunluğunu, A/B dengesini,
iki okuma kopyasının içeriğini ve HTML'de anahtar/yazar/sürüm/ağ isteği bulunmadığını doğrular.
Tercihler henüz toplanmadı; farklı model onayı, kör kazanan veya nihai ses başarısı ilan edilmez.

Kapsam yalnız aşama 1b'dir. Aşama 2, TASARIM-01, ARAŞTIRMA-01 ve yerel model eğitimi başlatılmadı.
