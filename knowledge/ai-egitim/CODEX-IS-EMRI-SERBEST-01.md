# Codex iş emri önerisi — SERBEST-01: Tasarımcı Atölyesi (dokunmatik serbest biçim, yapay zekâsız çekirdek)

Hazırlayan: denetçi (Claude), 2026-10-19. **Acil ve öncelikli.** Karar sahibinin yönü: tasarımcı müşteriden gelen
hazır çizimi alır, estetik bir tasarıma dönüştürmek için ince dokunuşlar yapar; dizüstü ya da dokunmatik ekran/kalemle.
Pahalı model kullanılmaz. Çekirdek **yapay zekâ gerektirmez**: tasarımcı biçimi elle verir, motor geometriyi kurar ve
fizik/üretim kurallarını anında denetler. Qwen 9B sonra yardımcı olarak eklenir ve tasarımcının düzenlemelerinden öğrenir.

## 1. Sayfa ve akış
- `atolye.html`'in yerine (eski içerik arşive) ya da yeni `tasarimci.html` (noindex, menüde yok; `uretim.html` gibi).
- Tasarımcı müşteri bağlantısını (`#d=` / `#p=`) açar → ürün 3D + önden/yandan/üstten 2B görünüm → parçaya dokunur →
  düzenler → kaydeder → yeni bağlantı + `uretim.html`'e "onayla ve üret".
- Dokunmatik ve kalem: Pointer Events, iki parmakla yakınlaştırma/kaydırma, kalem basıncı gerekmez; büyük tutamaçlar;
  geri al/yinele; mm'ye ve ızgaraya yapışma; simetri (eksene göre aynala) varsayılan açık.

## 2. Düzenleme araçları (aşama 1)
| Araç | Uygulandığı parçalar | Motor karşılığı |
|---|---|---|
| **Siluet** | tabla, raf, kapak, yan panel, başlık, ayna, kol paneli, sırt paneli | `slab` dış çizgisi: tutamaçlı eğri (Catmull-Rom/Bezier), köşe yarıçapı |
| **Kenar profili** | levha parçaları | mevcut kenar profilleri + özel profil eğrisi (kesit çizimi) |
| **Torna profili** | ayak, kulp, sütun | `lathe` profili: yarıçap–yükseklik eğrisi |
| **Eğik / konik** | ayak, dikme | eğim açısı, uçta incelme |
| **Kıvrım (aşama 2)** | kavisli ayak, kol, kızak, sırt | kesit + yol eğrisi (`loft`/sweep) |

Düzenleme tasarıma **katman** olarak yazılır: `design.overrides[partId] = {tool, outline|profile|path, ...}`. Derleyici
(`compile`) önce parametrik parçaları üretir, sonra katmanları uygular; birleşim noktaları (ayak–tabla, kapak–gövde)
korunur. Bağlantı (`link.js`), teknik çizim, parça listesi ve üretim katmanı taşır.

## 3. Anlık fizik ve üretim denetimi (yeşil / sarı / kırmızı, sebebiyle)
- **Devrilme:** ağırlık merkezi + kenara 100 kg (oturma) / 30 kg (tabla kenarı) / kapak açık yükleri.
- **Eğilme:** tabla/raf sehimi — malzeme E modülü (masif türleri, MDF), kesit ataleti, açıklık; sınır L/300.
- **Kırılma riski:** kavisli parçada kısa lif (lif yönüyle eğri teğeti açısı), en dar kesit, en az kalınlık (malzemeye göre).
- **Birleşim:** zıvana/kavela/dübel/metal bağlantı için yeterli temas alanı ve kenar mesafesi.
- **Üretim:** levha boyu, CNC takım yarıçapı (iç köşe ≥ 3 mm), torna boyu/çapı, büküm yarıçapı; kaplama/lake uygunluğu.
- **Ergonomi:** oturma ve masa yükseklikleri, diz boşluğu; uyarı, engel değil.
Denetim saf hesaptır (`assets/forma/physics.js`), birim testli; değerler ve kaynakları `knowledge/` altında belgelenir.

## 4. Üretime çıkış
Özel siluetler için CNC DXF (parça başına, takım yarıçapı telafisiyle); kesim listesi ve levha planı katmanlı geometriden;
montaj kitapçığı aynı. Torna parçası için ölçülü profil çizimi.

## 5. Veri (Qwen için)
Her kayıtta: müşteri tasarımı, tasarımcı katmanları, denetim sonuçları, onay. Bu, ileride Qwen 9B'nin "zarif dokunuş"
önerilerini öğreneceği veridir (müşteri kişisel verisi olmadan; tasarımcı onayıyla).

## 6. Kabul
Dokunmatik bir dizüstünde ve tablette: bir yemek masasının tablasını serbest siluetle, ayaklarını torna profiliyle
değiştirip üretime gönderebilmek; fizik denetimi anında; mevcut testler + yeni fizik testleri geçer.
Dal `codex/aura-serbest-01`; PR 1: sayfa, katman modeli, siluet + torna araçları, fizik çekirdeği. PR 2: kenar profili,
eğim, DXF. PR 3: kıvrım (sweep). PR açılır, birleştirilmez.
