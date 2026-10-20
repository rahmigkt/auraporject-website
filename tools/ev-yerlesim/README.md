# EV-SOHBET-01 — bağımsız mobilya yerleşimi

Bu klasör `tools/ev-sohbet/` veya `sohbet-001.json` içeriğini kullanmaz. Ortak belgeler sohbet README'si, asistan sözleşmesi ve EV şemalarıdır. Kaynak sohbetten kod, cümle veya yerleşim alınmadı. `dialogues/` içindeki 12 dosyada her satır elle yazılmış bir kullanıcı–asistan çiftidir; yalnız `{survey}` yer tutucusu senaryonun açık ölçü cetveliyle doldurulur. Çeviri API'si veya cümle varyantı üreticisi yok.

## Çalıştırma

Python 3.11+, Shapely 2.1.2 ve jsonschema 4.26; ürün derlemek için Node gerekir. Depo kökünden:

```powershell
$env:PYTHONPATH='tools/ev-yerlesim'
python tools/ev-yerlesim/build.py --node node --cache C:/aura-data/ev-sohbet-01
python tools/ev-yerlesim/audit.py
python -m unittest discover -s tools/ev-yerlesim -p 'test*.py'
node tools/ev-yerlesim/viewer-smoke.cjs
```

Playwright ve yerel Chrome son komut için gerekir. Test gerçek dosya açma alanını kullanır, ürün ayak izlerini ve oda sayılarını denetler, maketi açar. Bu bir estetik/üretim onayı testi değildir. Cache veri ve kod/rule parmak izine bağlıdır. Eski çözüm yalnız aynı ürün kimlik/ölçüleri ve güncel bütün denetimler geçtiğinde tekrar doğrulanarak kullanılabilir; yeni ürün malzemeleri güncellenir. Kaynak değiştiğinde cache sessizce doğru sayılmaz.

## Sözleşme ve yöntem

Asistan ürün ailesi, parametre ve ilişki seçer. `placement.solve(room, products, intent)` koordinatları deterministik kafes araması ve sınırlı ışın aramasıyla bulur. Dört dik yön, 350 mm aday kafesi ve duvar yakınları denenir; bu sürekli uzayda tam çözüm garantisi değildir. Üç yeterince ayrık geçerli sonuç bulunmazsa `clarify` ve boş seçenek döner. Boyut/kapı verisi geçersizse açık hata çıkar; uygulama bunu ölçü sorusuna çevirmelidir.

`adapter.room_from_ev` gerçek EV v0.1/v0.2 odasını okur; v0.1'de bulunmayan menteşe bilgisi açık ölçüm yan kaydı gerektirir. Ölçülmemiş/tahmini oda, bilinmeyen kapı açılımı ve kayıp ölçü uydurulmaz. Poligonlar, ürün gövdeleri ve ön kullanım bölgeleri denetlenir. Kapı 90° yayı, pencere/radyatör şeridi, oda dışına çıkma, tavan, ürün çarpışması ve bedensel erişim için serbest uzay bağlantısı kontrol edilir. Rota, engellerin yarı rota eni kadar şişirilmesiyle konfigürasyon uzayında hesaplanır; yangın kaçışı veya erişilebilir bina sertifikası değildir.

Sofa–TV odak açısı ve ekran yüksekliğine bağlı asgari mesafe; masa–yan ışık ilişkisi ayrı kontrol edilir. Işık hesabı, priz, cihaz/çekmece gerçek açılımı ve mobilya parçalarının iç boşlukları çözülmez. Gövdeler derlenmiş dış kutulardır; bu muhafazakâr zarf gerçek sandalye/koltuk kullanımının bütün ayrıntılarını kanıtlamaz.

`rules.json` kaynak, lisans, sayfa/bölüm ve statü taşır. 600/900 mm rota, yatak yanları, dolap ve çalışma masası payları AURA önerisidir. ADA referansı Avrupa/Türkiye özel konutlarına otomatik uygulanmaz. Neufert'in ücretli metinleri okunmuş veya kopyalanmış gibi gösterilmez. Gerçek mobilyalı konut verisiyle kalibrasyon yapılmadı; `furnished-datasets.json` nedenleri ve adayları açıklar.

Ürünler `sample()` ile seçilmez. Konuşulan parametreler normalleştirilir ve `compileDesign().meta.overall` okunur. Mevcut genel normalleştirici eski bedroom ailesini storage'a taşıdığı için **yataklar**, mevcut `assets/ev/items.js` görüntüleyicisiyle aynı `bedroom.normalize/compile` uyumluluk yolunu kullanır. Bu istisna kayıt başına `compiler` bilgisinde belirtilir. Eski eşyalar aynı ölçüde stüdyo temsilleridir; gerçek eşyanın eşdeğerliği veya kesin ölçüsü kanıtlanmaz.

## Çıktılar ve sınırlar

`codex-001…012.json` ortak üst kayıt alanlarını taşır: turns, result_plan, designer_summary_tr. Her biri 20 çift / 40 mesajdır. Tam EV v0.1 kanonik plan ayrı doğrulanır. Görüntüleyici `design/pos_xy_mm/rot_deg/name` ve `scheme` ek alanlarını beklediği için viewer uzantısı **ayrı şemayla** doğrulanır; değiştirilmemiş temel şemayı geçtiği söylenmez.

Çok katlı dört senaryo vardır. `result_plan` ilk kat önizlemesidir; **bütün ev değildir**. `canonical_plan` tüm katları, `result_plans_by_level` her katın ayrı açılabilir JSON'unu taşır. Merdiven/döşeme/kat bağlantısı doğrulanmadı. Örnek ölçü cetvelleri sentetik ve sadeleştirilmiş koridorlu şemalardır; rijwoning/Altbau/Haussmann etiketleri doğrulanmış yerel mimari veri sayılmaz.

`codex-okuma.html` bütün 12 sohbeti, 16 katı ve 36 ev alternatifi için toplam 48 kat diyagramını gösterir. Ürün ve yerleşim yan kayıtları `planlar/codex-*-solver.json` içindedir. Boya/zemin için canlı finish şemasının kimliği kullanılır; aydınlatma, perde ve halı seçimleri konuşmada açıkça sonraya bırakılır veya korunur. Ölçülmüş şekilde yerleştirildikleri iddia edilmez.

Tüm kayıtlar `synthetic:true`, `author:"codex"`; insan incelemesi bekler. Nihai tasarımcı kararı, yapı/tesisat, merdiven, güvenlik ve maliyet açık konulardır. Ücretli API, GPU, eğitim, otomatik müşteri maili ve site yayını yok. `assets/` ve `score.mjs` değiştirilmez.
