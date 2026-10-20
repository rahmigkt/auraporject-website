# CODEX-IS-EMRI-EV-SOHBET-01 — Bağımsız ev asistanı sohbetleri ve mobilya yerleşim çözücüsü

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex
`assets/` yasak; `tools/` ve `knowledge/` serbest.

## Bağımsızlık kuralı

Bu çalışma Claude'un örneğinden **tamamen bağımsız** yapılacak. Qwen tek bir yazarın alışkanlıklarını öğrenmemeli.

- `knowledge/ai-egitim/veri/sohbet-ornekleri/sohbet-001.json` ve `tools/ev-sohbet/` dosyalarının **içeriğine bakma**. Senaryo, cümleler ve yerleşimler oradan alınmayacak.
- Yalnızca kayıt **biçimi** ortak olacak. Biçim için şu belgeler kullanılır:
  - `knowledge/ai-egitim/veri/sohbet-ornekleri/README.md`;
  - asistan sözleşmesi `knowledge/ev-projesi/veri/asistan-sozlesme.json`;
  - ev şeması `knowledge/ev-projesi/veri/ev-projesi.schema*.json`.

## A · Mobilya yerleşim çözücüsü (`tools/ev-yerlesim/`)

Asistan (Qwen) koordinat üretmez, **yerleşim niyeti** üretir. Örnekler: "kanepe TV'ye baksın, sırtı pencereye dönük olmasın", "yemek masası mutfağa yakın", "yatağın iki yanından geçilsin". Çözücü bu niyetten odayı ölçülü yerleştirir. Görevler:

1. **Kurallar.** Kaynaklı ve makine okunur bir kural dosyası hazırlanır; kaynağı olmayan kural "öneri" olarak işaretlenir. Kapsam:
   - geçiş payları (yatak çevresi, masa arkası, dolap önü, mutfak koridoru);
   - kapı açılma alanı;
   - pencere ve radyatör önü;
   - TV izleme mesafesi;
   - oturma grubu düzenleri;
   - yatak odası, çocuk odası ve çalışma alanı ergonomisi.

   Kaynaklar ergonomi ve iç mimarlık standartları (Neufert ve benzerleri, ulusal rehberler) olur; lisans ve sayfa numarası belirtilir.
2. **Çözücü.** Odanın geometrisi (EV planı, kapı ve pencereler) ile ürün listesi ve ölçüleri girdi olur. Ürün ölçüleri stüdyo ürünlerinden alınır: `assets/forma/generate.js` → `compileDesign().meta.overall`. Çıktı olarak 3–5 farklı geçerli yerleşim üretilir ve her biri puanlanır.
3. **Denetimler.** Çarpışma, duvara gömülme, kapı ve pencere önünü kapatma, geçiş payı ihlali, odak ilişkisi (kanepe–TV, masa–ışık).
4. **Gerçek veri.** Ticari kullanıma açık **mobilyalı** konut planı verisi araştırılır. 3D-FRONT ve benzerleri lisans nedeniyle kullanılamaz; doğrulanırsa kurallar gerçek yerleşim dağılımlarıyla kalibre edilir.

## B · Sohbet örnekleri

En az **12** simüle sohbet yazılacak. Her biri sonunda mobilyalı bir ev planı üretir.

- **Ülke ve dil:** Belçika (Felemenkçe ve Fransızca), Hollanda, Almanya, Fransa, Birleşik Krallık, Danimarka, İspanya, İtalya ve Türkiye. Kullanıcı kendi dilinde yazar; tasarımcı özeti Türkçe olur.
- **Ev tipleri:** dar sıra ev (rijwoning), dubleks, müstakil, stüdyo daire, Altbau, Haussmann, köşe daire.
- **Kullanıcı davranışları:**
  - ölçüsünü bilmeyen;
  - eski planının fotoğrafını tarif eden;
  - kararsız;
  - fikir değiştiren ("salonu büyütelim");
  - çelişkili istekte bulunan ("3+1, 60 m²");
  - mevcut eşyasını korumak isteyen;
  - bütçe kısıtı olan;
  - çocuklu ya da yaşlı bireyli aile.
- **Uzunluk:** Gerçekçi olmalı; sohbet başına en az 20 tur. Asistan soru sorar, varsayımlarını açıkça yazar, belirsiz ölçüyü "doğrulanacak" diye işaretler.
- **Ürün seçimi konuşmada kurulur:** tarz, renk, malzeme, mevcut eşya, ölçü kısıtı. Ürünler stüdyo ailelerinden (oturma, masa, dolap, mutfak, banyo, yatak) parametreleriyle seçilir; rastgele örnek kullanılmaz.
- **Yerleşim:** Her yerleşim A'daki çözücüyle yapılır. Kayda asistanın niyeti ve çözücünün sonucu birlikte yazılır.
- **Renk ve zemin:** Öneriler `assets/ev/finishes.js`'deki adlarla (boya, zemin, şema) kaydedilir.

## C · Doğrulama ve teslim

- Her plan şema doğrulayıcısından ve yerleşim denetimlerinden geçer; geçemeyen örnek teslim edilmez.
- Her sohbetin planı `assets/ev/ornekler/` biçiminde, ev.html'de açılabilir JSON olarak verilir. Plan `knowledge/ai-egitim/veri/sohbet-ornekleri/planlar/` klasörüne konur; `assets/` klasörüne konmaz, Claude oraya taşır.
- **Dosyalar:**
  - `knowledge/ai-egitim/veri/sohbet-ornekleri/codex-001.json` … `codex-012.json`;
  - `knowledge/ai-egitim/EV-SOHBET-01-RAPOR.md`: senaryo listesi, kural kaynakları, çözücü yöntemi, doğrulama sonuçları.
- **Etiket:** Bütün kayıtlar `synthetic: true` ve `author: "codex"` olarak işaretlenir.

## Kurallar

- Belgesiz sayı yok. Lisans her kaynak için belirtilir.
- Gerçek müşteri verisi yok. Ücretli servis ve GPU yok.
- Eğitim başlatılmaz. Veri, Claude'un örnekleriyle birleştirilip ölçüldükten sonra karar kullanıcınındır.
