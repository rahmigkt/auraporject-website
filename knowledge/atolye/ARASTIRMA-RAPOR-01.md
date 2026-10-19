# ATÖLYE araştırma raporu 01

19 Ekim 2026 · Codex · Karar için araştırma; uygulama değildir.
İş emri: [ATOLYE-ARASTIRMA-01](ATOLYE-ARASTIRMA-01.md).
Okunan depo anı: `7d4d0d45d87fb02b904fea94488d336e0ef6a7c7`.

## Karar önerisi

**Tek bir kütüphane bütün eksikleri kapatmaz.** Mevcut tanımlayıcı tabanlı motor korunsun.
İlk katman: mevcut three.js sürümüyle eşleşen TransformControls, gerektiğinde
three-mesh-bvh; 2D ofsette Clipper2-WASM; katı üçgen ağ işlemlerinde Manifold.
Hassas kenar profili, loft/süpürme ve gerçek STEP için **isteğe bağlı Replicad +
OpenCascade worker'ı** öneriyorum. Bu ikinci katman LGPL yükümlülükleri kabul edilmeden
dağıtıma eklenmemeli. Katı model kaydı, ekran mesh'i ve CNC işlemleri ayrı tutulmalı.

MIT/BSD/Apache/Boost ağırlıklı ilk katman sunucusuz çalışabilir. Ancak yalnız bu
katmanla B-rep kalitesinde STEP ve genel CAD fillet/loft vaat edilmemeli.
LGPL kabul edilmiyorsa bu yetenekler açıkça desteklenmiyor olarak gösterilmeli;
üçgen ağı STEP içine koymak bunların eşdeğeri değildir.

## Mevcut motorun bulguları

İstenen `atelier.js`, `overrides.js`, `physics.js`, `mesh.js`, `build.js`, `generate.js`
ve `production/app.js` okundu; kayıt/üretim bağı için `link.js` ve `bom.js` de incelendi.

- `normalizeDesign` şeması `aura.forma.design/1`. `compileDesign`, aile derlemesinden
  sonra `applyOverrides` çağırıyor. Override yalnız siluet (`id`) ve tornalı profil
  (`role`) tanıyor; bilinmeyen işlem normalizasyonda düşer. En fazla 40 override,
  siluette 80, profilde 40 kontrol noktası korunuyor.
- `role` hedefi birden çok ayağı birlikte değiştirir; tek parçayı hedefleme ile rol
  grubunu değiştirme yeni şemada ayrı olmalı. Parametre değişiminde kaybolan parça
  kimliklerine sessizce başka hedef bağlanmamalı.
- `mesh.js` mm, +Y yukarı, +Z ön kullanıyor; sonuç pozisyon/normal/UV/indeks dizileri.
  `build.js` geometri tanımlayıcısıyla cache yapıyor. Sonradan eklenen operasyon,
  tolerans ve çekirdek sürümü cache anahtarına girmezse eski mesh gösterilebilir.
- Bugünkü siluet DXF'i R12 POLYLINE; kapalı dış kontur var, kör delik/cep derinliği,
  iç kontur, takım ve işleme sırası yok. Ebatlama/montaj akışı öncelikle panel
  ailelerine bağlı; BOM ve kesim planı bütün yeni parçaları otomatik anlamayacak.
- `physics.js` kütle/devrilme, yaklaşık kiriş sehimi, kesit ve CNC iç yarıçapı
  uyarıları içeriyor. Delikle zayıflamış kesit, bağlantı rijitliği ve genel serbest
  yapı için doğrulanmış FEA değil. Yeni geometriyle aynı varsayımlar geçerli sayılmamalı.
- `#d=` / `#p=` bugün v1, deflate-raw + base64url; destek yoksa sıkıştırılmamış JSON.
  Boyut ve açılmış veri için açık bir sınır görünmüyor. Büyük operasyon geçmişi bu
  bağlantıya doğrudan eklenmemeli.

## Boyut ve bakım ölçümünün kapsamı

Aşağıdaki sürüm/tarih ve bağımlılıklar **19 Ekim 2026'da resmî npm registry'den**
okundu; yayımlanan tarball'lar kurulum/lifecycle betiği çalıştırmadan incelendi.
Belirtilen dosyalar ayrı ayrı Python `gzip.compress(level=9, mtime=0)` ile sıkıştırıldı;
toplamları KiB (1024 bayt), büyükler MiB (1048576 bayt). Kaynak haritası, tipler ve
ikinci UMD/ESM kopyası aynı bütçeye eklenmedi. Tarball indirme boyutu uygulama boyutu sayılmadı.

**Bunlar seçilmiş dağıtım dosyalarının ölçümü; tree-shake edilmiş tam uygulama bundle'ı
değil.** Bağımlılıklar hariçse tabloda belirtiliyor. HTTP'de gzip açılmamışsa bu kazanç
elde edilmez. Npm'nin son yayını bakımın devam edeceğine garanti değildir; “2026 yayını”
yayın göstergesidir. Tablet/iPad/Android üzerinde bu araştırmada benchmark yapılmadı.
Performans sütunu mimari çıkarım ve entegrasyon riski; ölçülmüş FPS/süre değildir.

### Katı, yüzey ve 2D çekirdekler

| Kütüphane ve birincil kaynak | Sürüm / son npm yayını | Lisans; WASM | Ölçülen gzip | Çözdüğü eksik; tablet ve entegrasyon riski |
|---|---|---|---|---|
| [manifold-3d](https://github.com/elalish/manifold) | 3.5.4 / 2026-09-25 | Apache-2.0; evet | **218,5 KiB**: manifold.js + manifold.wasm | #2/#5: manifold girişte sağlam mesh boolean, kesit/extrude. Worker'da iyi aday; ardışık ince yivler üçgen sayısını büyütür. UV/malzeme aktarımı ve açık ağlar ayrıca sınanmalı; B-rep fillet/STEP değildir. |
| [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) | 0.0.18 / 2026-02-17 | MIT; hayır | **32,7 KiB** build/index.module.js; + BVH **61,3 KiB**, three hariç | #5 önizleme yedeği. Doğrudan BufferGeometry; kapalı, kendisiyle kesişmeyen girdiler bekler. İnce eşdüzlemli kesimler/bozuk sonuç riski; varsayılan üretim çekirdeği yapmam. Peer three ≥0.179, BVH ≥0.9.7; vendored sürümle doğrulanmalı. |
| [replicad](https://github.com/sgenoud/replicad) + [çekirdek paketi](https://registry.npmjs.org/replicad-opencascadejs) | İkisi 1.1.0 / 2026-09-04 | Sarmalayıcı MIT; çekirdek LGPL-2.1-only + içerdiği OCCT koşulları; WASM | JS parçaları **134,9 KiB**; tek iş parçacıklı çekirdek JS+WASM **6,88 MiB**; flatbush/opentype hariç | #3–7/#12: CAD fillet/chamfer, sweep/loft, boolean, STEP. Tablet açılış/bellek riski yüksek; yalnız ihtiyaçta yükle. Bu wasm açılınca ~21,9 MiB ham ikili; heap ayrıca büyür. |
| [opencascade.js](https://github.com/donalffons/opencascade.js) | npm latest 1.1.1 / 2020-09-27 | LGPL-2.1-only; WASM | dist/opencascade.wasm.js + .wasm **13,14 MiB** | Aynı B-rep gücünün düşük seviye yedeği. Eski npm latest'i güncel GitHub/custom build ile karıştırma. API ve build bakımı ağır; tablet için genel paket yerine daraltılmış, sabitlenmiş build gerekir. |
| [@jscad/modeling](https://github.com/jscad/OpenJSCAD.org) | 2.13.0 / 2026-02-22 | MIT; hayır | dist/jscad-modeling.min.js **57,6 KiB** | #2/#4/#5/#7: JS solid, extrude ve kesitler. Hafif yedek; dönüştürücü ve kendi tessellation/boolean sınırları var. Genel NURBS/B-rep fillet ve gerçek STEP çözümü değil. |
| [verb-nurbs](https://github.com/pboyer/verb) | 3.0.3 / 2025-04-23 | MIT; hayır | build/js/verb.es.js **55,0 KiB**, web-worker bağımlılığı hariç | #4/#7 yüzey/loft alternatifi. Yüzeyi katıya kapatma, trimming, boolean, STEP ve topoloji ayrı iş; tek CAD çekirdeği olarak seçme. Karmaşık yüzey tessellation'ını worker'a taşı. |
| [clipper2-wasm](https://github.com/ErikSom/Clipper2-WASM) | 0.4.0 / 2026-05-18 | BSL-1.0 (Boost); evet | dist/es/clipper2z.js + .wasm **93,1 KiB** | #5/#8/#12: 2D union/difference/ofset. CNC kontur ve takım yarıçapı için ilk tercih. Integer ölçek/koordinat aralığı ve delik yönü açık tanımlanmalı; G-code/CAM motoru değil. |
| [clipper2-js](https://github.com/IRobot1/clipper2-ts) | 1.2.4 / 2024-01-01 | Registry “Boost Software License”; hayır | fesm2020/clipper2-js.mjs **33,0 KiB**, tslib hariç | Ofsette WASM'sız yedek. Upstream Clipper2 ile aynı proje/sürüm değil; yayını eski, büyük koordinatlarda JS sayı hassasiyeti ve API kapsamı doğrulanmalı. Tarball'da ayrı LICENSE bulunamadı; dağıtımdan önce upstream/türetme lisansı izini tamamla. |
| [makerjs](https://github.com/microsoft/maker.js) | 0.19.2 / 2026-01-27 | Apache-2.0; hayır | dist/browser.maker.js **81,6 KiB** | #8/#12: çizgi/yay, 2D model, DXF. Hafif 2D üretim yardımcısı; derinlikli cep, katı boolean, STEP veya tam CAM değil. Browser dist ve Node/PDF/font yollarını ayır. |
| [paper](https://github.com/paperjs/paper.js) | 0.13.0 / 2026-10-19 | MIT; hayır | dist/paper-core.min.js **71,3 KiB** | #14/#4: kalem eğrisi, Bézier düzenleme ve 2D path. Dokunma arayüzü için yedek; SVG editörü ve ölçü/CAM otoritesinin yerine geçirme. Yeni aynı gün sürümünü doğrudan üretime alma. |
| [earcut](https://github.com/mapbox/earcut) | 3.2.4 / 2026-09-28 | ISC; hayır | dist/earcut.min.js **4,2 KiB** | #5/#12: delikli panelin görüntü üçgenlemesi. Küçük tablet yükü; kesme/ofset/katı doğrulama değil. Kendini kesen konturda başarılı çizim, üretilebilirlik kanıtı sayılmaz. |

Manifold WASM nesneleri elle serbest bırakılmalı; yalnız JS garbage collection'a
güvenilmemeli. Deneme sonu worker/heap yaşam döngüsü tasarlanmalı.
[Resmî WASM belgesi](https://github.com/elalish/manifold/blob/master/bindings/wasm/documents/bindings.md).
Replicad `mesh()` ile three.js'e üçgen verir, `blobSTEP()` ve `blobSTL()` sağlar;
STL için tessellation toleransı tanımlanmalıdır.
[Resmî Shape API](https://replicad.xyz/docs/api/classes/Shape/).

### Seçme, ölçü, fizik ve çıktılar

| Kütüphane / kaynak | Sürüm / son npm yayını | Lisans; WASM | Ölçülen gzip | İşlev, tablet ve risk |
|---|---|---|---|---|
| [three TransformControls](https://threejs.org/docs/pages/TransformControls.html) | three 0.186.1 / 2026-09-24, **araştırma sürümü** | MIT; hayır | examples/jsm/controls/TransformControls.js **9,4 KiB**, three hariç | #1: taşı/döndür/ölçek, snap. Uygulamada mevcut vendored three ile aynı revizyon eklentisi seçilmeli. Touch hit alanı, orbit çatışması, yerel/dünya ekseni ve undo transaction uygulama sorumluluğu. |
| [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) | 0.9.16 / 2026-10-08 | MIT; hayır | build/index.umd.cjs **61,3 KiB**, three hariç | #1/#6: hızlandırılmış ray seçimi, yakınlık sorguları. Az parçada önce normal raycast; BVH oluşturma belleği tablet yükü. Geometri değişince rebuild/refit kararı; CSG topoloji değişiminde eski BVH kullanılamaz. |
| [@lume/kiwi](https://github.com/lume/kiwi) | 0.4.4 / 2024-09-17 | BSD-3-Clause; bu paket JS | 7 dist JS dosyası toplam **10,7 KiB** | #8 doğrusal hizalama/eşit aralık için hafif ilk tercih. Yayını seyrek; güçlü bakım varsayma. Genel açı, teğetlik ve dairesel uzaklık gibi doğrusal olmayan CAD kısıtlarını çözmez. |
| [kiwi.js](https://github.com/IjzerenHein/kiwi.js) | 1.1.3 / 2021-12-02 | BSD-3-Clause; hayır | npm gzip arşivi **37,3 KiB**; runtime ölçümü değil | Repo arşivlenmiş ve LUME fork'una yönlendiriyor. Yeni entegrasyonda seçme; tarihsel karşılaştırma. |
| [@salusoft89/planegcs](https://github.com/Salusoft89/planegcs) | 1.3.0 / 2026-10-05 | **LGPL**; WASM | dist JS + WASM toplam **189,4 KiB** | #8 tam 2D geometrik kısıtlarda koşullu tercih. Tek worker, iterasyon sınırı; under/over-constrained, çatışma ve çözüm değişimi görünür olmalı. Hafif doğrusal yedeği Kiwi; eşdeğer değil. |
| [ml-matrix](https://github.com/mljs/matrix) | 6.15.1 / 2026-10-19 | MIT; hayır | matrix.umd.js **16,8 KiB** | #11 küçük kiriş/çerçeve rijitlik denklemleri için sayısal yardımcı. Hazır FEA/mobilya/birleşim modeli değil. Yoğun matris büyük modelde belleği büyütür; sparse çözüm ayrıca gerekir. |
| [FEAScript](https://github.com/FEAScript/FEAScript-core) | 0.2.0 / 2026-02-25 | MIT; JS, isteğe bağlı WebGPU | dist/feascript.esm.js **16,7 KiB**, mathjs/Plotly ve diğer yollar hariç | Tarayıcı PDE alternatifi araştırıldı; yayımlanan örnekler ısı/akış vb. Mobilya kiriş/birleşim solver'ı hazır sayılmaz. Büyük görselleştirme/vendor yükleri ve gelişen API nedeniyle ilk tercih değil. |
| [@tarikjabiri/dxf](https://github.com/dxfjs/writer) | 2.9.0 / 2026-09-15 | MIT; hayır | lib/index.mjs **31,5 KiB** | #12: katman, daire/yay/polyline vb. DXF yazımı için ilk tercih; derinlik/takım operasyon eşlemesi ayrıca tasarlanmalı. Tablet maliyeti çıktı öğesi sayısıyla artar. |
| [three STLExporter](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/exporters/STLExporter.js) | three 0.186.1 / 2026-09-24 | MIT; hayır | examples/jsm/exporters/STLExporter.js **1,6 KiB**, three hariç | #12 basit binary STL. Birim/malzeme/takım ve CAD geçmişi taşımaz; mm bilgisi eşlikçi manifestte. Açık/self-intersecting mesh'i kendisi onarmaz. |
| [@jscad/stl-serializer](https://github.com/jscad/OpenJSCAD.org/tree/master/packages/io/stl-serializer) | 2.1.23 / 2026-02-22 | MIT; hayır | 3 JS dosyası toplam **2,6 KiB**, modeling/array-utils hariç | STL için yedek; geom3 dönüşümü gerekir. Çekirdek zaten yoksa yalnız STL için JSCAD ekleme. |
| [@jscad/3mf-serializer](https://github.com/jscad/OpenJSCAD.org/tree/master/packages/io/3mf-serializer) | 2.1.17 / 2026-02-22 | MIT; hayır | src/index.js **2,5 KiB**, modeling/array-utils/onml/fflate hariç | #12 3MF için ilk aday. Asıl yük bağımlılıklardır; çok parçalı model kimlikleri/renk/birim ve slicer roundtrip sınanmalı. Bütün malzeme uzantıları destekli varsayılmaz. |

Her satırın sürüm/tarih verisi şu birincil kayıt biçiminden alınır:
`https://registry.npmjs.org/<paket>`; örneğin
[Manifold registry](https://registry.npmjs.org/manifold-3d),
[Replicad registry](https://registry.npmjs.org/replicad),
[PlaneGCS registry](https://registry.npmjs.org/@salusoft89%2fplanegcs).
Tablodaki dağıtım dosyası o sürümün tarball'ına aittir; GitHub ana dalı yeni olabilir.

## Lisans kararı

Apache-2.0/MIT/ISC/BSD-3-Clause ve **Boost BSL-1.0**, gerekli bildirimler korunarak
ticari dağıtım için elverişli adaylardır. Buradaki BSL, Business Source License değildir.
Üçüncü taraf notice/alt bileşenler de sabitlenen sürümde listelenmelidir.
[Clipper2 lisansı](https://github.com/AngusJohnson/Clipper2/blob/main/LICENSE),
[three lisansı](https://github.com/mrdoob/three.js/blob/dev/LICENSE).

Replicad'ın MIT etiketi OCCT ikilisini MIT yapmaz. Npm çekirdeği LGPL-2.1-only
bildiriyor; OCCT'nin istisna metni ve ek bileşen koşulları da incelenmeli. Dağıtımda
ilgili kaynak/build yamaları, lisanslar, sürüm bilgisi ve kullanıcının değiştirilmiş
kütüphaneyi kullanabilmesine uygun düzen gerekir. Worker'a ayırmak yükümlülüğü
kaldırmaz; otomatik olarak bütün AURA kodunun açılması gerektiği sonucu da çıkarılmaz.
Öneri: değiştirilebilir ayrı vendor modülü, tekrar üretilebilir build ve lisans incelemesi.
[OpenCascade.js LICENSE](https://github.com/donalffons/opencascade.js/blob/master/LICENSE),
[OCCT deposu](https://github.com/Open-Cascade-SAS/OCCT).

PlaneGCS npm metadata'sı `LGPL-2.0-or-later`, paket/depo LICENSE metni ise LGPL **2.1**.
Bu uyuşmazlık çözülmeden “saf MIT” veya kesin LGPL sürümü diye etiketlememek gerekir;
LGPL uyum incelemesine tabi koşullu adaydır. Kullanıcının kaynak/yeniden bağlama
hakları uygulama paketlemesinde korunmalı.
[package.json](https://github.com/Salusoft89/planegcs/blob/main/package.json),
[LICENSE](https://github.com/Salusoft89/planegcs/blob/main/LICENSE).

[Frame3DD](https://github.com/hpgavin/frame3dd) kiriş/çerçeve için güçlü fakat GPL
ve hazır tarayıcı JS modülü değil; özel WASM portu gerekir. Bu teslimde runtime gzip
boyutu yok; ölçülmüş hazır web paketi gibi sunulmuyor. Varsayılan yığına alınmamalı.
GPL dağıtımının kaynak/uyum yükümlülükleri ayrıca karşılanır. AGPL seçenek seçilmedi.
FEAScript'in MIT olması da mobilya yapısal doğrulamasını hazır sağladığı anlamına gelmez.

## Eksik listesine göre ilk tercih ve yedek

| EKSIKLER maddesi | İlk tercih | Yedek / kapsam sınırı |
|---|---|---|
| #1 seçme/gizmo | Mevcut three raycast + aynı sürüm TransformControls; gerekirse BVH | GPU pick buffer; uygulama kodu gerekir, transparan yüzey davranışı ayrıca |
| #2 parça ekle/sil/çoğalt | Mevcut descriptor derleyicisi + kalıcı parça UUID'si | JSCAD primitive/extrude; kütüphane ürün geçmişini yönetmez |
| #3 kenar başına profil | Doğrusal panelde mevcut profiledSlab genişletmesi; genel fillet/chamfer için Replicad | Manifold ile kesici profili çıkarma; sınırlı profil ve tessellation, genel fillet eşdeğeri değil |
| #4 sabre ayak/eğri kayıt | Replicad sketch+sweep/loft, değişken kesit | JSCAD extrudeFromSlices; kapalı katı ve dönüş çerçevesi doğrulaması |
| #5 delik/cep/kanal/fluting | Panelde analitik işlem kaydı + Manifold; kesin B-rep gerekiyorsa Replicad | three-bvh-csg önizleme; sonuç bozuksa önceki geçerli revizyon korunur |
| #6 görünür birleştirme | Parametrik zıvana/kavela/Domino özellikleri + kesici solid, bağlantı grafı | Replicad doğrulanmış B-rep; yakınlık adayları BVH'den, onay/mukavemet kuralı uygulamadan |
| #7 bükme/lamine | Replicad sweep/loft ile tasarlanmış şekil ve katman kalınlığı | JSCAD/verb yüzey önizleme; fiziksel lamine üretilebilirliği otomatik çözülmez |
| #8 ayna/dizi/hiza/kısıt | Descriptor transform/dizi + doğrusal Kiwi; tam sketch için koşullu PlaneGCS | Sınırlı analitik ölçü editörü; genel doğrusal olmayan CAD çözücüsüne eşdeğer değil |
| #9 malzeme/damar | Kalıcı part.material + yerel grainDirection, BOM eşlemesi | Mevcut slot mirası; renderer malzemesi tek başına üretim malzemesi değil |
| #10 döşeme | Mevcut cushion/loft/welt altyapısı; parça bazlı parametre/dikiş yolu | three eğri+deformasyon önizlemesi; hazır kalıp/gerilim çözücüsü bulunmadı |
| #11 fizik | Mevcut analiz genişletmesi + doğrulanmış küçük çerçeve hesabı, gerekirse ml-matrix | Analitik kiriş üst/alt sınırı; FEAScript genel PDE adayı, hazır ahşap bağlantı çözümü yok |
| #12 üretim çıktısı | DXF writer + STLExporter + isteğe bağlı Replicad STEP | maker.js DXF / JSCAD STL-3MF; STEP'te OCCT düşük seviye özel build |
| #13 geçmiş/onay | Sürümlü işlemler + IndexedDB snapshot + onaylanan content hash | Yerel proje JSON/ZIP; “müşteriye gönderme” için paylaşım dosyası, hesap/sunucu kurulmaz |
| #14 kalem/tablet | Pointer Events, pointer capture, ayrı tek-parmak edit / iki-parmak orbit | Paper.js eğri araçları; basınç yoksa varsayılan, ölçü basınçla sessiz değişmez |

Özellikle #6/#10/#11/#13/#14 bir kütüphane eklenerek bitmiş sayılmamalı.
Bağlantı standardı/toleransı, ortotropik ahşap, döşeme kalıbı ve müşteri onay akışı
uygulama ve alan doğrulaması gerektirir. Oyma/rölyef/heykel yüzeyi kapsam dışıdır.

## Kayıt biçimi önerisi — v2, işlemler ve parça kimliği

Eski v1 okunmaya devam etsin; eski normalize fonksiyonundan v2 geçirmek veri
kaybettirir. Açık migrasyon ve v2 loader gerekir. Eski siluet/profil override'ları
korunur, v2'de legacy-operation olarak deterministik sırada uygulanır.

```json
{
  "schema": "aura.forma.design/2",
  "units": "mm",
  "coordinateSystem": "Y_UP_Z_FRONT_RIGHT_HANDED",
  "base": {"family": "table", "kind": "dining", "style": "japandi", "seed": 7},
  "source": {"compilerVersion": "PINNED", "baseDesignHash": "SHA256"},
  "workshop": {
    "schema": "aura.workshop/1",
    "parts": [{
      "id": "user:rail-1",
      "origin": "added",
      "geometry": {"type": "box", "size": [700, 40, 25]},
      "transform": {"translation": [0, 420, 0], "rotationQuaternion": [0, 0, 0, 1], "scale": [1, 1, 1]},
      "material": {"slot": "wood", "grainDirection": [1, 0, 0]}
    }],
    "operations": [{
      "id": "op:hole-1",
      "type": "hole",
      "target": {"partId": "base:top", "featureId": "face:top"},
      "placement": {"space": "part-local", "origin": [120, 0, 80], "axis": [0, -1, 0]},
      "diameterMm": 8,
      "extent": {"mode": "blind", "depthMm": 18}
    }],
    "constraints": [],
    "joints": [],
    "revision": 1
  }
}
```

Örnek yalnız biçim önerisi; bir parçada yüzey referansının ve 18 mm derinliğin gerçekten
geçerli olduğuna dair geometri kanıtı değil. Tam v2 belge params/materials ve eski
override bilgilerini de taşır; örnek kısa tutuldu.

Parça dizisine tüm derlenmiş mesh'leri kopyalamak yerine ek parçalar ve base parça
işlemleri kaydedilmeli. İşlem türleri: add/remove/duplicate/transform, profile,
sweep/loft, edgeProfile, hole/pocket/slot/groove, boolean, material, mirror/array,
constraint ve joint. İşlem sırası anlamlıdır; bağımlılık grafı döngüsüz olmalı.
UUID ve köken bağı korunmalı; “üçüncü üçgen/kenar” kalıcı hedef olamaz.
Kenar/yüz için anlamsal featureId + geometrik fingerprint kullanılmalı; temel
model değişince eşleme belirsizse kullanıcıdan yeniden seçim istenmeli.

Koordinatlar parça yerel sisteminde mm; rotasyon quaternion, ölçek pozitif ve sınırlı.
Ayna ayrı işlem olsun, negatif ölçek/normaller sessizce bırakılmasın. Şekil
işlemleri yerel uzayda, montaj dönüşümü sonra uygulansın. Bükülmüş parçanın ham blank
ölçüsü ile bitmiş dış kutusu ayrı kaydedilsin. Malzeme ve damar parça uzayında,
montajla birlikte dönsün. Ahşabı büyütmek için render scale yerine geometri ölçüsü
değişmeli; gerçek ölçek üretim boyutuna uygulanmalı.

Boolean araç gövdeleri de tanımlayıcı/UUID ile kayıtlı, export dışı tooling nesnesi
olmalı. Eklem grafı bağlantı tipini, eşleşen iki parçayı, tolerans/boşluk ve donanımı
taşımalı; tasarımın topolojisi sırf temas var diye rijit birleşim sayılmamalı.

### Derleme ve hata davranışı

Tek doğruluk kaynağı tasarım + işlem grafı: temel derleme → ek/silinmiş parçalar →
yerel özellik/boolean → malzeme/damar → montaj → ortak üretim modeli → mesh/B-rep/çizimler.
Her çıktı aynı revizyona bağlı olsun. Boolean hatasında eski mesh'i yeni işlem
başarılıymış gibi sunma; son geçerli revizyon ayrı, işlem hatası görünür kalsın.
Cache anahtarı kaynak/işlem/çekirdek sürümü ve tolerans içerir; BVH topolojide yenilenir.

Çekirdek seçimi dosyada kullanıcıya ait rastgele kod değil, uygulamanın sürümlü
capability tablosu olsun. Toleranslar merkezi; tessellation toleransı ile işleme
boşluğu ayrı kavramlar. Worker işine revisionId eklenip bayat sonuç atılmalı.
WASM nesneleri dispose edilmeli; iptal gerekiyorsa worker sonlandırılıp yeniden kurulmalı.

### Bağlantı ve dosya boyutu

Önerilen **ürün sınırı**: sıkıştırılmış ve base64url yapılmış fragment en fazla
8 KiB ASCII. Bu evrensel tarayıcı URL sınırı değildir; e-posta/QR/mesajlaşma için
uygulamanın seçtiği eşiktir. Eşik aşılırsa sunucu gerektirmeyen proje JSON/ZIP indir;
link içinde IndexedDB anahtarı başka cihazda çalışırmış gibi paylaşılmamalı.

Dosya parça/işlem/kontrol noktası için açık üst sınır taşımalı. İlk öneri 500 parça,
2.000 işlem, 10.000 sketch noktası, açılmış JSON için 10 MiB; bunlar ölçümle ayarlanacak
koruma sınırlarıdır. Sıkıştırılmış veri açılırken akış üzerinden açılmış bayt sınırı
uygulanmalı; yalnız açtıktan sonra kontrol yeterli değil. Bilinmeyen sürüm ve işlem
sessizce düşürülmemeli. Mesh/STEP/B-rep cache ve undo geçmişinin tamamı linke girmesin.

## Üretim çıktısı ve geometri tutarlılığı

DXF geometrisi **CAM takım yolu değildir**. Önce analitik üretim özellikleri saklanmalı:
dış/iç kontur, daire, kör/geçişli delik, cep derinliği, takım çapı, minimum iç yarıçap,
giriş yüzü ve iş sırası. Clipper2 yalnız kontur/ofset yardımcısıdır; takım geçişi,
stepdown/stepover, giriş rampası, stok/bağlama çarpışması ve makine postprocessor'ı sağlamaz.
Bu araştırmada tarayıcıda hazır ve doğrulanmış bütünleşik mobilya CAM'i seçilmedi.

DXF katmanları OUTLINE/HOLE/POCKET/GROOVE/ENGRAVE gibi standartlaştırılsın; delik
merkezi CIRCLE olarak kalabilsin. Çap/derinlik/takım ve toleranslar eşlikçi
`operations.json` dosyasında operationId ile bağlansın; katman adına gömülmüş bilgiye
veya her CNC yazılımının okuyacağı varsayılan XDATA'ya güvenilmesin.

Kesim listesi blank stok ölçüsünü, bitmiş ölçüyü, konturu, miktarı, malzemeyi, damar ve
kenar bandını ayırsın. Kesilen delik sayısı parça adedi değildir. Üretim BOM'u silinen
parçayı düşürmeli, ek parça/donanımı eklemeli; gruplama yalnız ölçüyle değil malzeme,
damar, işlem imzası ve revizyonla yapılmalı. Nesting, 90° dönüşü damar izin veriyorsa
kullanmalı; birleşim geçmeleri montaj boşluğuna bağlanmalı.

STL binary üretimi için pozitif hacim, kapalı yüzey, indeks ve normal denetimi;
3MF için birim, nesne kimliği ve çok parçalı slicer turu gerekir. STEP, desteklenen
analitik/B-rep işlemlerinden yeniden kurulmalı. Yalnız mesh kalan döşeme/deformasyon
parçasında B-rep STEP yoksa dosya bunu açıkça bildirmeli; sahte hassasiyet üretmemeli.
Montaj çizimi ve üretim çıktısı ekrandaki final derleme revizyonunu kullanmalı.

## Qwen sözleşmesine bağlama

Bugünkü canlı vocabulary/sanitizeActions yalnız set/delta/enum/material/style/kind
kapsıyor. Aşağıdakiler **öneri**, mevcut canlı eylemler değil:

| Eylem adı | Zorunlu doğrulama ve gerçek sonuç ölçütü |
|---|---|
| part.add / part.remove / part.duplicate | Yetkili primitive, UUID, sayım sınırı; bağlı işlemlere etkisi; gerçek parça/BOM farkı |
| part.transform | Yerel/dünya alanı açık; sonlu sınırlı değer; ankraj/bağlantı korunumu ve yeni bbox |
| feature.hole / pocket / slot / groove | Hedef yüz/parça; çap, derinlik, kalınlık, kenara mesafe ve kör/geçişli ayrımı; kesit/hacim farkı |
| feature.edgeProfile | Geçerli featureId, profil, yarıçap/pah; komşu duvar kalınlığı ve başarılı topoloji |
| feature.sweep / loft | Kapalı kesitler, yol, kesit sırası, çerçeve, kendini kesme; hacim/kapalılık |
| sketch.constraint.add | Geçerli geometrik referans; tutarlılık, residual/DOF, çatışma; çözülen ölçüler |
| part.material / grain.set | Katalog ve parça türü; yerel birim vektör; BOM/nesting ile uyum |
| assembly.mirror / array / align | Referans ve sayı sınırı; yeni kimlikler, bağlantılar, beklenen aralık |
| joint.add | İki mevcut parça, geçme ölçüleri ve tolerans; çarpışma/mesafe; mukavemet onayı ayrı |

Tek sözleşme sürümü örneği `aura.actions/2`; dış cevap yine actions nesnesi ve reply.
Yeni türü yalnız eğitim üreticisine eklemek yetmez: canlı istem, capability/vocabulary,
sanitizer, UI işlem yürütücüsü, sonuç denetimi ve veri üretimi **aynı sürüme** geçmeli.
Model JavaScript, Python, WASM, shader veya serbest kernel çağrısı üretmemeli; yalnız
tipli izinli öneriler üretmeli. Netleştirme/ret actions boş ve anlamlı reply taşır.
Sözlükte olmayan yüz/işlem veya eksik derinlikte soru sormalı; ölçü uydurmamalı.

Model kullanıcı onayından önce uygulanmış işlem iddia etmemeli. Önizleme transaction'ı
hazırla → şema ve geometriyi doğrula → diff/fizik uyarılarını göster → onayla → commit.
Her adım önceki designHash/revision'a bağlanmalı; bayat modele öneri uygulanmamalı.
Reply'ın canlı arayüzde gösterilmesi de sözleşmenin parçasıdır.

Main kaynak/hash'i, kernel/builder/capability sürümü ve insan onaylı içerik hash'leri
veri manifestine girsin. Yeni araçta olumlu/yanlış/refuse/clarify TR/EN örnekleri,
çok adım ve geri alma testi eklensin. Gerçek tarayıcı yürütme, mesh/B-rep sonucu,
physics, BOM ve export roundtrip aynı örneğe bağlansın; JSON eşitliği tek puan olmasın.

Onaylı eski 40 örnek yeni CAD işlemlerinin onayı sayılmaz. Sabit kapalı sınava yeni
yetenek eklenmesi yeni benchmark sürümüdür; karşılaştırılan modeller aynı sürümde
yeniden ölçülür. Estetik etiketler insan onaylı olmalı. Bu araştırma eğitim veya
kiralık GPU başlatmaz; QWEN-YEREL-02'nin onay/maliyet kapılarını değiştirmez.

## Tahmini yükleme bütçesi ve tablet kabul denemesi

Ölçümlere dayanan **hedef bütçe**, uygulama benchmark sonucu değildir:

| Açılma anı | Ek gzip bütçesi | Not |
|---|---:|---|
| Atölye ilk görünüm | ≤150 KiB | Gizmo + gerektiğinde BVH + basit ölçü/UI; mevcut three ve dokular hariç |
| Mesh boolean ilk kullanım | ≤350 KiB | Manifold ~218,5 KiB + wrapper/worker; CLI, GLTF ve bütün npm paketi yüklenmez |
| Ofset ilk kullanım | ≤150 KiB | Clipper2-WASM ~93,1 KiB + köprü |
| CAD/STEP ilk kullanım | yaklaşık 7,2–8 MiB | Replicad + tek-thread OCCT + bağımlılıklar; ilk açılışa yüklenmez |
| Tam sketch çözücü | ≤250 KiB | PlaneGCS ~189,4 KiB + köprü; lisans kapısı ayrı |
| Dışa aktarma | STL ≤10, DXF ≤50, 3MF ≤120 KiB ek | Sonuncuda JSCAD modeling ve ZIP/XML bütçesi; gerçek bundle ölçümüyle kesinleşir |

MIME `application/wasm`, doğru gzip ve sabit içerik hash'li cache gerekir. İlk prototipte
tek-thread WASM seç; çok-thread için SharedArrayBuffer ve cross-origin isolation
başlıklarının site/CDN kaynaklarıyla uyumu ayrıca incelensin. WASM dosya boyutu
tarayıcı bellek kullanımı değildir; heap, kopyalar ve kernel nesneleri ölçülmeli.

Claude'un uygulama PR'larında en az iPad Safari ve orta sınıf Android Chrome üzerinde
100 parçalı, yaklaşık 200 bin üçgenli sahnede şu senaryoları ölçmesini öneriyorum:
10 ve 100 delik, 20 kanal, 8 kenar fillet, 12 kesit sweep, 100/500 sketch kısıtı.
Soğuk yükleme/bayt, p50/p95 gecikme, uzun main-thread görevleri, bellek artışı ve 30
işlem/undo sonrası sızıntı kaydedilsin. Fiziksel tablet yoksa “tablet geçti” yazılmasın.

Önerilen hedefler: etkileşim önizlemesi ≥30 FPS, sürüklemede p95 <50 ms,
kısa işlemlerde UI kilitlenmemesi; pahalı CAD işleminde ilerleme ve iptal. 2 saniye
üzeri işlem durumu gösterilsin, örneğin 10 saniyede kullanıcı iptal edebilsin.
Bunlar ölçülecek ürün hedefleridir; kütüphane garantisi değildir. Model büyürse
önizleme çözünürlüğü düşürülür; final üretim toleransı sessiz düşürülmez.

## Claude için uygulama sırası ve karar kapısı

EKSIKLER sırası korunmalı: 1 → 2 → 3 → 4 → 5 → 8 → 9 → 6 → 7 → 11 → 12 → 10 → 13 → 14.
Önce v2 kimlik/işlem taslağı ve v1 roundtrip; ardından seçme/transform ve parça yaşam
döngüsü. Geometri çekirdeklerini ayrı adapter/worker ile ekle. Üretim verisini
görüntü tessellation'ından ayır; yeni işlem başına test, gerçek tarayıcı, yakın plan
ve bağımsız çıktı doğrulaması iste. Bir PR'da bütün motoru değiştirme.

İlk kararlar: LGPL koşullu CAD/solver dağıtımı kabul edilecek mi; v2 kimlik/migrasyon
ve 8 KiB paylaşım sınırı uygun mu; fiziksel tablet ölçüm cihazları hangileri?
Bu kararlar alınmadan performans/STEP/üretilebilirlik tamamlandı denmemeli.
Bu teslim yalnız rapordur; uygulama kodu, assets, site, eğitim ve ücretli kaynaklar değiştirilmedi.
