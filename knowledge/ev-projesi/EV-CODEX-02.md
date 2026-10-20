# EV-CODEX-02 — Ev planı (kroki) editörü: araştırma ve görsel yön

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex (yalnız araştırma, örnek veri ve görsel referans; `assets/` klasörüne dokunmaz)

## Bağlam

Ev projesinin temeli, **evin tamamının planıdır**. Çalışma iki aşamada ilerleyecek:

1. Stüdyoda evin 2B planı (kroki) çizilir ve düzenlenir.
2. Duvarlar aynı veriden yükseltilir ve odaların içinde 3B gezinilir.

Mevcut 3B motoru Three.js'tir. Plan verisi EV-01 şemasıyla (`knowledge/ev-projesi/veri/ev-projesi.schema.json`) uyumlu olmalıdır. Bu şemada duvarlar ve açıklıklar ortaktır, ölçüler kilitlidir.

## İstenenler

### 1. Açık kaynak plan editörleri

GitHub ve benzeri yerlerde en az 8 proje incelenecek. Örnekler:
- react-planner
- blueprint3d
- Sweet Home 3D
- FloorspaceJS (NREL)
- Arcada
- three.js tabanlı diğer kat planı projeleri

Her proje için şunlar yazılacak:
- lisans ve ticari kullanım;
- son etkinlik tarihi;
- teknoloji;
- duvar, kapı ve pencere modeli;
- 2B'den 3B'ye geçiş yöntemi;
- dokunmatik ve tablet desteği;
- **bizim koda alınabilecek parçalar.** Örneğin: duvar birleşim ve köşe algoritması, ölçü yakalama, açıklıkların duvara gömülmesi.

GPL ve NC lisanslı projeler yalnızca fikir kaynağı olarak işaretlenecek; kodları alınmaz.

### 2. Görsel ve estetik yön

AURA'nın kimliğine uygun **plan çizim dili** önerilecek. Bunun için mimari sunum planları, iç mimarlık sunumları ve iyi tasarlanmış uygulamalar incelenecek. Örnek: Planner 5D, Floorplanner, magicplan, RoomSketcher, Apple RoomPlan çıktıları. Önerilecekler:
- duvar kalınlığı ve dolgu (poşe);
- çizgi ağırlıkları;
- kapı açılış yayı ve pencere sembolü;
- oda adı, alan (m²) ve ölçü zinciri yazımı;
- mobilya sembolleri (üstten sade çizgi);
- zemin malzemesinin planda gösterimi;
- renk paleti (mevcut site: krem kâğıt, koyu mürekkep, kiremit kırmızı vurgu).

Her öneri bir referans görselle ya da kaynakla desteklenecek. Ekran görüntüsü depoya konmayacak; bağlantı ve kısa tarif yeterli.

### 3. Plan etkileşimi

Telefon ve tablette kullanım öncelikli. İncelenecek davranışlar:
- **duvar çizme:** tıkla–tıkla ya da sürükle; dik açıya yakalama; ölçüyü sayıyla girme;
- **oda şablonları:** dikdörtgen ve L oda;
- **köşe düzenleme:** köşeyi taşıyınca bağlı duvarların birlikte gelmesi;
- **kapı ve pencere:** duvara sürükleyip bırakma;
- **katlar.**

En iyi örneklerin akışı adım adım tarif edilecek.

### 4. 2B'den 3B'ye geçiş

- Duvar yükseltme yöntemi: poligon → extrude.
- Kapı ve pencere boşluklarının açılması (CSG ya da parçalı duvar).
- Süpürgelik ve pervazın otomatik yerleştirilmesi.
- Tavan.
- Oda içinde gezinme kamerası:
  - birinci şahıs ya da yürüme;
  - "oda kamerası" (köşeden bakış);
  - kuşbakışı kesit (duvarlar kesilmiş, ev maketi görünümü).
- Telefonda gezinme kontrolleri.
- Performans: tek ev için poligon bütçesi.

### 5. Fotoğraf ve tarama ile plan

- Apple RoomPlan çıktı biçimi (USDZ, JSON).
- Android ve web'de AR ölçüm seçenekleri.
- Tek fotoğraftan oda düzeni tahmini yapan açık modeller (HorizonNet, LayoutNet gibi; lisanslarıyla).

Bu bölüm sonraki aşama içindir; kısa tutulacak.

## Teslim

- `knowledge/ev-projesi/EV-PLAN-ARASTIRMA-02.md`
- `knowledge/ev-projesi/veri/plan-stili.json`: çizgi ağırlıkları, renkler, semboller, yazı boyutları; makine okunur.
- `knowledge/ev-projesi/veri/ornek-plan-3oda.json`: EV-01 şemasına uygun 3+1 sentetik daire.
  - Ortak duvarlar, kapılar, pencereler, ölçüler.
  - Sentetik olduğu açıkça yazılmalı.

## Kurallar

- Belgesiz bilgi yok. Lisans her proje için kaynakla belirtilir.
- Kod yazılmaz, `assets/` klasörüne dokunulmaz. Uygulamayı Claude yapar.
