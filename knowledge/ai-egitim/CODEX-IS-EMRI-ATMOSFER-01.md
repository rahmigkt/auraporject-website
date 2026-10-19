# Codex iş emri önerisi — ATMOSFER-01: projenin son görüntüleri (en önemli aşama)

Hazırlayan: denetçi (Claude), 2026-10-18. GÖRSEL-01 PR 2'nin yerine geçer ve onu genişletir.
Karar sahibinin yönü: **görüntü güzel çıkarsa ürünü almak isterler.** Stüdyodaki anlık görünüm gibi olmayacak;
çok kaliteli, ayrıntılı, kumaşı, kenarı ve özel birleşimleri gösteren birkaç fotoğraf.

## Ne zaman, nerede

- **Yalnız proje bittiğinde.** Müşteri tasarım sürecinde bu görüntülerle ya da metinle karşılaşmaz. Tetik:
  Proje sekmesinde "Projeyi tamamla / Son görüntüler" (ürün projeye eklendikten sonra); tasarımcıya gönderim
  paketi ve indirme bu görüntüleri içerir.
- Her ürün için **5 kare**: 1 genel (mekânda), 1 üç çeyrek, 3 yakın plan. İsteğe bağlı 1 oda karesi (projedeki
  bütün ürünler birlikte).
- Kare altında daha sonra 2–3 cümlelik tanık metni gelecek (METİN-01); bu PR'da yalnız yeri hazırlanır.

## Ölçüt: "stüdyo görünümü değil, katalog fotoğrafı"

Referans düzey: üst segment mobilya katalog fotoğrafçılığı. Somut şartlar:
1. **Işık:** fiziksel tabanlı; yumuşak gölge, temas gölgesi, dolaylı yansıma, pencere ışığı. Düz ve gölgesiz
   görüntü kabul edilmez.
2. **Malzeme yakın planda gerçek:** kumaşta örgü ve hav (mevcut `textile.js` dokuma çizimleri yüksek çözünürlükte,
   normal + pürüz haritası), dikiş/biye/fitil çizgisi, köşe dikişinde kumaş gerilimi; ahşapta lif yönü, kesit
   (uç) damarı, yağ/mat bitişin ışığı; taşta damar ve cila/honlu farkı; metalde fırça izi ve yumuşak yansıma; lakta
   derinlik.
3. **Kenar ve birleşim:** pahlar, yuvarlatılmış kenarların ışıkta parlaması, 2 mm derz gölgesi, çekmece/kapak
   aralıkları, kulp kesimi, ayak–gövde birleşimi, tabla kenar profili. Geometrideki kenar yarıçapları yakın planda
   faset göstermemeli (gerekirse yalnız son görüntü için yüksek bölümleme).
4. **Kamera:** gerçek objektif (genelde 50–85 mm eşdeğeri), yakın planda sığ alan derinliği, ufuk çizgisi düz,
   kompozisyon kuralları; ürün kadrajı doldurur ama sıkışmaz.
5. **Mekân:** sade ve sessiz — duvar (sıva/kireç dokusu), ahşap ya da taş zemin, süpürgelik, pencere ışığı; ürünün
   ailesine göre (salon, yemek, yatak odası, mutfak, banyo). Eşya kalabalığı ve dekor objesi yok; en çok bir sade
   nesne (kitap, seramik) isteğe bağlı.
6. **Dürüstlük:** görüntü tasarımın geometrisi ve malzemesidir. Görüntü üreten yapay zekâ (difüzyon vb.) ürün için
   **kullanılmaz**; olmayan ayrıntı uydurur. Ortam haritaları ve dokular açık lisanslı (ör. Poly Haven, ambientCG —
   CC0), kaynakları kayıtlı.

## Teknik yol (öneri; Codex daha iyisini gösterebilir)

- Mevcut three.js sahnesi (`assets/forma/scene.js`, GTAO + VSM gölge) korunur; son görüntü için **ayrı bir render
  modülü**: ilerlemeli yol izleme (ör. `three-gpu-pathtracer`, MIT) tarayıcıda; örnek sayısı kare başına hedeflenir
  (masaüstünde 30–90 sn'de 5 kare kabul edilebilir — bu bir bitiş anı, anlık değil), ilerleme çubuğu ve iptal.
- Gürültü giderme (ör. açık kaynak OIDN wasm ya da eşdeğeri) varsa kullanılır.
- Yol izlemeyi desteklemeyen cihaz: yüksek kaliteli rasterize yedek (yüksek çözünürlüklü gölge haritası, ortam
  ışığı, SSAO, yakın plan dokuları) — yine katalog düzeyine en yakın.
- Yakın plan noktaları otomatik: parça listesinden en anlamlı üç ayrıntı (ör. koltukta kol–sırt birleşimi + kumaş
  örgüsü + ayak; dolapta kapak derzi + kulp + kenar; tablada kenar profili + taş damarı + ayak birleşimi). Kural
  tablosu aile/tür başına.
- Çıktı: 2400 px uzun kenar JPEG (indirme), proje paketine ve tasarımcı paketine eklenir; tasarım bağlantısı
  (`#d=`) korunur.

## Kabul

- Her aileden (oturma, masa, dolap, mutfak, banyo) en az 2 tasarım için 5'er kare; karar sahibi onaylar.
  Önce/sonra yerine **stüdyo görünümü / son görüntü** yan yana bir sayfa (`knowledge/atmosfer/ornekler.md`).
- Stüdyonun anlık etkileşim hızı değişmez; son görüntü modülü yalnız istenince yüklenir.
- Mevcut testler geçer; yeni modül için duman testi (her aileden bir kare üretilir, boş/siyah kare yok).

## Sıra ve dal

GÖRSEL-01 PR 1 (eskiz temizliği, #58) karar sahibinin onayıyla birleştirildikten sonra `main`'den
`codex/aura-atmosfer-01`. PR 1: render modülü + ışık/mekân + genel kareler (örnek kareler PR'da). PR 2: yakın
planlar, malzeme ayrıntısı, proje sonu akışı ve paket. Her PR açılır, birleştirilmez.
