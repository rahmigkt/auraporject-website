# Codex iş emri önerisi — GÖRSEL-01: yakın plan, gerçekçi görüntü ve temiz eskiz

Hazırlayan: denetçi (Claude), 2026-10-18. Amaç: tasarım bitince nesneyi bir mekânın içinde, ışıkta ve zamanda
gösteren "son görüntü"; malzemenin yakın planı; eskiz çizgisinin sessizleşmesi. Stüdyonun hızı ve kesinliği korunur.

## İlke
Görüntü **tasarımın kendisidir**: motorun ürettiği geometri ve malzeme. Görüntü üreten yapay zekâ (difüzyon vb.)
ürün görüntüsü için kullanılmaz; olmayan ayrıntı uydurur. Gerçekçilik ışık, malzeme ve kameradan gelir.

## 1. Eskiz temizliği (önce, küçük iş)
- Çizgi kalınlık hiyerarşisi: dış hat > parça kenarı > iç ayrıntı; gereksiz iç kenarlar ve üst üste binen çizgiler
  ayıklanır; ölçü çizgileri ince ve az.
- Kâğıt dokusu sakin; gürültü yok. Önce/sonra ekran görüntüleri her aileden.

## 2. Son görüntü (atmosfer katmanı)
- Tarayıcıda ilerlemeli yol izleme (ör. `three-gpu-pathtracer`, MIT) ya da eşdeğeri; "Son görüntü" düğmesiyle
  başlar, birkaç saniyede okunur hale gelir, beklendikçe incelir. Desteklemeyen cihazda iyileştirilmiş anlık render.
- Işık sahneleri (en az 4): sabah yan ışığı, öğle dolaylı ışık, akşam lamba, kuzey ışığı stüdyosu. Ortam
  haritaları açık lisanslı (ör. Poly Haven CC0).
- Mekân: ailenin odasına göre sade bir köşe (duvar, zemin, süpürgelik, pencere ışığı); eşya kalabalığı yok.
- Kamera: genel görünüm + **yakın planlar** (birleşim, kenar, doku, kumaş örgüsü, taş damarı, kulp); alan
  derinliği ile. Yakın plan noktaları parçalardan otomatik seçilir (birleşim yerleri, en ince kenar, malzeme
  geçişleri).
- Malzemeler: mevcut prosedürel ahşap/taş/kumaş haritaları korunur, gerekirse açık lisanslı PBR dokular
  (ör. ambientCG CC0) ile desteklenir; ahşap lif yönü, kumaş havı, taş cilası, metal pürüzü doğru.
- Çıktı: yüksek çözünürlüklü görüntü indirme; proje paketine ve tasarımcı paketine eklenir.

## 3. Arayüz dili (METİN-01'in kurucu yaklaşımı onaylandıktan sonra)
- "Bays / doors", "Cell", "Vanity unit" gibi teknik sözcükler kurucu yaklaşımın diliyle yeniden yazılır (8 dil).
- Son görüntünün yanında METİN-01 tanık metni.

## Ölçüt
- Karar sahibi her aileden 3 tasarımın son görüntüsünü ve yakın planlarını onaylar.
- Masaüstünde ilk okunur görüntü ≤ 5 sn, telefonda yedek render ≤ 2 sn; stüdyonun etkileşim hızı düşmez.
- Mevcut testler (`tests/forma-check.mjs` vb.) geçer.

## Teslim
PR 1: eskiz temizliği. PR 2: son görüntü + yakın planlar + ışık sahneleri. PR 3: arayüz dili (METİN-01 sonrası).
Dal: `codex/aura-gorsel-01`. Her PR açılır, birleştirilmez.
