# AURA sahneleri — atmosfer ve mekân tanımı (denetçi, 2026-10-19)

Sahne ürünü anlatmaz, ona yer açar. Kurucu yaklaşım: boşluk da tasarımın parçasıdır; ışık, sessizlik ve malzeme
konuşur, eşya kalabalığı yoktur. Sahnede ürün dışında en çok **bir** sessiz nesne bulunur.

## 1. Mekân dokuları (müşteri seçer)

| Kod | Ad | Duvar | Zemin | Süpürgelik / ayrıntı | Uyduğu tarzlar (varsayılan) |
|---|---|---|---|---|---|
| KIREC | Kireç | Sıcak kırık beyaz kireç sıva, ince tane, hafif el izi (#ECE6DC civarı) | Açık meşe, geniş tahta (18–22 cm), mat yağ | Duvar renginde, 6 cm, ince gölge derzi | Japandi, İskandinav, Minimalizm, AURA |
| TAS | Taş | Açık bej traverten tadında mineral sıva, düşük kontrast | Honlu açık kireçtaşı plaka (60×120), ince derz | Taş, 4 cm | Brütalizm, Bauhaus, Endüstriyel, Mid-Century |
| TOPRAK | Toprak | Sıcak kil/toprak tonlu kireç boya (#B9A08A civarı), mat | Koyu füme meşe ya da terrakota karo (mutfak/banyo) | Duvar renginde | Art Deco, Wabi-Sabi, Mid-Century |

Dokular CC0 kaynaktan (Poly Haven, ambientCG) ya da prosedürel; büyük ölçekte tekrar etmeyecek çözünürlükte.
Dama, desenli karo, beton lekesi, parlak zemin **yok**.

## 2. Işık (müşteri seçer)

| Kod | Ad | Kurulum |
|---|---|---|
| SABAH | Sabah | Soldan büyük pencere, yumuşak serin gün ışığı (≈5600 K), uzun yumuşak gölge, açık gölge tonu; pencere dışı aşırı pozlanmış bulanık bahçe/gökyüzü |
| AKSAM | Akşam | Pencere ışığı alacakaranlık (≈4200 K, düşük); odada sıcak bir lamba (≈2700 K) ürünün yanında kadraj dışında; derin ama yumuşak gölge, sıcak vurgu |

Varsayılan: tarzın satırındaki doku + SABAH. Gölgeler her zaman yumuşak kenarlı, temas gölgesi belirgin.

## 3. Odalar (aile × ürün büyüklüğü)

Her oda kapalı üç duvar + pencere duvarı; tavan kadraja girmez (yükseklik 2,8 m). "Büyüklük" ürünün genişliğine göre
seçilir; ürün kadraj genişliğinin %60–75'i.

| Aile | Küçük (≤ 900 mm) | Orta (900–2000) | Büyük (> 2000) | Sessiz nesne (en çok bir, isteğe bağlı) |
|---|---|---|---|---|
| Oturma | köşe 2,6 × 2,4 m; berjer/tekli | duvar önü 3,4 × 3,0; kanepe | 4,4 × 3,4; geniş kanepe | yerde kitap yığını ya da seramik vazo |
| Masa | yan/orta sehpa: halı kenarı + duvar | yemek/çalışma 3,4 × 3,2 | uzun yemek masası 4,6 × 3,6 | masada tek seramik kase |
| Dolap/kitaplık | komodin: duvar + pencere kenarı | büfe/şifonyer/TV 3,6 × 3,0 | gardırop/kitaplık 4,2 × 3,2 | büfe üstünde tek obje; kitaplıkta ürünün kendi rafları boş kalır |
| Mutfak | — | düz mutfak 3,8 × 3,0 | ada + düz 4,8 × 4,2 | tezgahta tek ahşap kesme tahtası |
| Banyo | ayna/boy dolabı 2,2 × 2,0 | lavabo 2,6 × 2,4 | çift lavabo 3,2 × 2,6; zemin ve ıslak duvar honlu taş | lavaboda katlı keten havlu |

## 4. Kamera

Her oda için iki sabit kamera: **A — üç çeyrek** (yaklaşık 30–35°, göz yüksekliği 1,15–1,30 m, 50 mm eşdeğeri) ve
**B — cepheden** (0–10°, 1,0–1,1 m, 70 mm). Dikey çizgiler dik (iki noktalı perspektif). Yakın planlar
(85–100 mm, f/2,8 eşdeğeri alan derinliği) arka planda odanın flu parçasıyla, ürünün kendi ayrıntısında.

## 5. Üretim ve boyut

Aile × büyüklük × doku (3) × ışık (2) × kamera (2). Her plaka: 2400 px JPEG (kalite 88) + ürün noktası için
256 px HDR ışık haritası + JSON (kamera, zemin düzlemi, gölge yönü). Hedef toplam ≤ 120 MB; sitede yalnız
gereken plaka yüklenir. Müşteri arayüzü: proje sonunda "Mekân: Kireç · Taş · Toprak" ve "Işık: Sabah · Akşam"
seçimi; seçim değişince ürün yeniden yerleştirilir (sunucu yok).

## 6. Kabul

Karar sahibi her aileden bir oda için 6 seçeneği (3 doku × 2 ışık) onaylar. Ölçüt: ürün kadrajda baskın, mekân
sessiz, ışık yumuşak; katalog fotoğrafından ayırt edilmesi zor.
