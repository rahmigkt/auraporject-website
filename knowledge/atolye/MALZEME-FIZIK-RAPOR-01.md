# Malzeme ve bağlantı fiziği — kaynaklı veri ve eksikler

19 Ekim 2026 · ATOLYE-CODEX-02 / iş 2. [veri/malzeme-fizik.json](veri/malzeme-fizik.json).
24 kayıt: katalogdaki 9 ahşap kimliği, 3 levha, 3 metal ve 8 taş/yüzey;
ayrıca katalogda olmayan granit. Bütün alanlarda birim ve bilinmeyen değer politikası var.

## Kaynakları doğru malzemeye bağlamak

Katalog tür, ülke, nem ve sınıf belirtmiyor. Bu nedenle doğrulanan sayılar birer
**koşullu referans**, doğrudan üretim hesabı sabiti değildir. Örneğin AHEC Amerikan
cevizi Juglans nigra, genel ceviz veya Avrupa cevizi değildir. Beş AHEC referansı
%12 nemdeki ortalama yoğunluk, lif boyu E ve eğilme kırılma dayanımını içerir:
[meşe](https://www.americanhardwood.org/en/american-hardwood/american-white-oak),
[dişbudak](https://www.americanhardwood.org/en/american-hardwood/american-ash),
[kayın](https://www.americanhardwood.org/en/american-hardwood/american-beech),
[ceviz](https://www.americanhardwood.org/en/american-hardwood/american-walnut),
[kiraz](https://www.americanhardwood.org/en/american-hardwood/american-cherry).
Dişbudakta canlı sayfa E=11977 MPa; bir karşılaştırma PDF'inde 11997 görüldüğünden
canlı türe ait sayfa seçildi ve bu fark kaydedildi.

`gurgen` Türkçe gürgen, İngilizce “Beech” olarak sunuluyor. Carpinus ve Fagus
ayrılmadan kayın verisi gürgene atanmadı. Füme/siyah meşe birer yüzey/işlem varyantı;
bağımsız ağaç türü değil. İşlem ve alt tür belirsizken otomatik miras yok.
Tik için Wood Handbook tablo5-5a'da %12 nemde E10700 MPa, MOR100,7 MPa doğrulandı;
yoğunluk yeşil haldeki özgül ağırlıktan türetilmedi ve null bırakıldı.

## Mevcut physics.js ile farklar

Kaynak anı `5fc4251`: yoğunluk wood680, MDF750, metal7850, stone2700 kg/m³;
E wood11000, MDF3500, metal200000, stone50000 MPa. WOODS import edilmiş olsa da
görülen kütle/sehim yolu sınıf sabitlerini kullanıyor. JSON her kayıtta bu temel
değere göre farkı hesaplıyor; değişiklik talimatı vermiyor.

| Koşullu referans | Yoğunluk kg/m³ | E MPa | Mevcut sınıf E farkı MPa |
|---|---:|---:|---:|
| Amerikan beyaz meşe | 769 | 12273 | +1273 |
| Amerikan dişbudak | 673 | 11977 | +977 |
| Amerikan kayın | 721 | 11859 | +859 |
| Amerikan siyah ceviz | 609 | 11584 | +584 |
| Amerikan kiraz | 561 | 10274 | -726 |
| EGGER hafif MDF, >12–19 mm | üretim yerine bağlı | 2200 | -1300 |
| EGGER P2 sunta, >13–20 mm | üretim yerine bağlı | 1600 | -1900 |
| AISI304 paslanmaz referansı | 7900 | 200000 | 0 |
| EN AW6082 alüminyum referansı | 2710 | 70000 | -130000 |
| UNS C26000 pirinç referansı | 8530 | 110316,117 | -89683,883 |

MDF ve suntada EN310 değerleri belirli üretici ürün/kalınlık grubuna aittir; bütün
levhalara atanamaz. MDF eğilme dayanımı20, P2 sunta11 MPa; iç bağ dayanımı vida çekme
dayanımı değildir. Kontrplakta katman/kalınlık ve yüz lif yönü gerekir.
Metal “eğilme dayanımı” ahşap MOR değeri değildir; kalite/temper/akma ve kesit hesabı gerekir.
Pirinç E dönüşümü: üretici 16000 ksi × 6,894757293 = 110316,117 MPa.

Taşlarda katalog yoğunluğu ayrı bir gözlem alanı; bağımsız doğrulanmış mekanik veri
diye kullanılmaz. Mermer/traverten/granitte ocak, parti, kalınlık, nem ve damar/test yönü
gerekir. [NSI](https://www.naturalstoneinstitute.org/resources/natural-stone-testing-services/)
yoğunluk, E, eğilme ve ankraj için farklı testler listeler. Bunları tek “stone”
sabitine indirmek özellikle tezgah deliği çevresinde geçersiz güven hissi üretir.
Katalogdaki `concrete` beton değil beton görünümlü seramik, terrazzo ise kompozittir.

## Bilerek açık bırakılan zorunlu araştırma alanları

- Lif enine E: radyal ve teğet ayrı. Kaynağı doğrulanmış eş tür/nem oranı yoksa
  lif boyu E kopyalanmaz. Kontrplakta yüz düzlemi/enine/kalınlık yönü farklıdır.
  Meşe, beyaz dişbudak, siyah ceviz ve siyah kiraz için [Wood Handbook tablo5-1](https://research.fs.usda.gov/download/treesearch/62244.pdf)
  oranlarından yaklaşık enine değerler ayrıca türetildi: E_axial≈1,1×E_bending,
  ardından ER/EL ve ET/EL. Bunlar ölçülmüş stok değerleri değildir; dişbudak
  referans grubu beyaz dişbudağa daraltılmadan uygulanamaz. Kayında tablo karşılığı yok.
- Vida ve kavela çekme: çap, gömülme, diş, lif yönü, kenar mesafesi, nem, yapıştırıcı,
  malzeme sınıfı ve deney düzeni olmadan tek N değeri yoktur. Ahşap Janka sertliği
  bu kuvvetin yerine geçmez. [Wood Handbook](https://research.fs.usda.gov/fpl/wood-handbook)
  bölüm8 bağlantı, bölüm5 ortotropi, bölüm7 sınıflandırılmış tasarım için başlangıçtır.
- Evrensel emniyet katsayısı yazılmadı. Ortalama temiz numune MOR'unu rastgele 2/3'e
  bölmek tasarım standardı değildir. Standart, karakteristik değer, yük süresi/nem,
  limit durum ve bağlantı testleri seçilmeden `recommended_safety_factor` null kalır.
- Gürgen, tik ve doğal taş/kontrplak referanslarının tamamlanması; tedarikçinin tam
  tür/ürün/ocak ve test sertifikasıyla yapılmalı. Bu teslimde bu alanlar tamamlanmış
  sayılmaz. Null, kontrolü geçiren sıfır/default olamaz.

Claude için öneri: malzeme kimliğine grade/species/condition/testStandard ekle;
görsel malzeme rengini fizik kaydıyla eşitleme. Eksik fizik özelliğinde “doğrulanmadı”
sonucu ver; salt geometriye dayanarak bağlantı dayanımı geçti deme.

JSON kimlik/birim/kaynak kontrolleri ve 24 kayıt kapsamı doğrulandı.
Kaynak betikleri/veri üretimi assets veya canlı siteyi değiştirmedi.
