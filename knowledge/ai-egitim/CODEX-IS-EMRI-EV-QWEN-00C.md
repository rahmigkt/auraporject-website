# CODEX-IS-EMRI-EV-QWEN-00C — Avrupa konutu: ülke profilleri, kurgular, kurallar ve dil

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex
**Sıra:** EV-QWEN-00B bittikten sonra. `assets/` yasak; `tools/` ve `knowledge/` serbest.

## 1. Neden

AURA'nın asıl hedef kitlesi **Avrupa**: Belçika başta olmak üzere sitenin dilleri olan İngilizce, Almanca, Fransızca, Felemenkçe, Danca, İspanyolca ve İtalyanca konuşulan ülkeler. Türkiye de pazarlardan biri ve EV-QWEN-00B'de ayrıntılı çıkarıldı.

00B'deki her şey yerinde kalır: şema v0.2, programdan plan çözücüsü, kalite ve çeşitlilik ölçüleri, inceleme sayfası. Bu iş emri onlara **ülke profilleri** ekler. Kullanıcının yazdığı dil, evinin hangi ülkede ve hangi tipte olduğuna dair ilk ipucudur. Asistan bunu varsayım olarak kullanır ve teyit eder: Fransızca Belçika, Fransa ya da İsviçre olabilir; Felemenkçe Belçika ya da Hollanda olabilir.

## 2. Kapsam: ülkeler

Öncelik sırası:
1. **Belçika:** Flaman, Brüksel ve Valon bölgeleri ayrı.
2. **Hollanda.**
3. **Almanya.**
4. **Fransa.**
5. **Birleşik Krallık ve İrlanda.**
6. **Danimarka.**
7. **İspanya.**
8. **İtalya.**
9. **Avusturya ve İsviçre.** Kısa, Almanca ve Fransızca ile ortak.

## 3. Görevler

### A · Ülke başına konut tipolojisi (araştırma, kaynaklı)

Her ülke için en yaygın 5–8 konut tipi. Her tip için şunlar yazılır:
- program (oda listesi), tipik net alan aralıkları;
- dış biçim (cephe genişliği ve derinlik);
- kat sayısı, merdiven tipi ve konumu;
- giriş dizisi;
- ıslak hacim düzeni (ayrı WC, banyo, çamaşır yeri);
- servis alanları;
- şematik komşuluk grafı.

Örnek tipler (liste kapalı değil, araştırma belirler):

- **Belçika:** rijwoning / maison mitoyenne (dar ve derin sıra ev, 2–3 kat, arka bahçe); halfopen bebouwing; vrijstaande woning (villa); appartement 1–3 slaapkamers; arka ek bina (achterbouw) ve veranda.
- **Hollanda:** eengezinswoning (sıra ev, doorzon woonkamer); portiekflat; galerijflat; bovenwoning ve benedenwoning; zolder ve vliering.
- **Almanya:** Altbauwohnung (Berliner Zimmer, uzun koridor); Neubau 2/3/4-Zimmer-Wohnung; Reihenhaus; Doppelhaushälfte; Einfamilienhaus (Keller, Dachgeschoss).
- **Fransa:** appartement T1–T5 (séjour, cuisine ouverte ya da fermée, WC séparé, cellier); Haussmann dairesi (enfilade); maison individuelle (plain-pied, à étage, garage).
- **Birleşik Krallık ve İrlanda:** Victorian / Edwardian terraced (two-up two-down, back extension); semi-detached; detached; purpose-built flat; maisonette; loft conversion.
- **Danimarka:** etagebolig; rækkehus; parcelhus. Açık mutfak–yaşam alanı ve bryggers.
- **İspanya:** piso (salón-comedor, cocina con galería / lavadero, terraza); adosado; chalet.
- **İtalya:** appartamento in condominio (soggiorno, cucina abitabile ya da angolo cottura, ripostiglio, balcone); villetta a schiera.

Kaynaklar: ulusal istatistik kurumları (konut stoku ve tip dağılımı), mimari tipoloji literatürü, açık erişimli plan arşivleri. Planlar yalnızca incelenir ve tarif edilir; kopyalanmaz. Lisans her kaynak için kaynakla belirtilir. Ticari kullanıma kapalı veri setleri veriye girmez.

### B · Ülke başına kurallar (makine okunur)

Asgari oda ve konut alanları, koridor ve kapı genişlikleri, merdiven kuralları (rıht, basamak, baş yüksekliği), tavan yüksekliği, gün ışığı ve havalandırma, erişilebilirlik. Örnek kaynaklar (araştırma doğrular, güncel sürüm ve madde numarasıyla):
- **Hollanda:** Besluit bouwwerken leefomgeving (Bbl).
- **Almanya:** Landesbauordnung, DIN 18065 (merdiven), DIN 18011 ve DIN 18040.
- **Birleşik Krallık:** Nationally Described Space Standard, Approved Document K.
- **Fransa:** décret décence, Code de la construction.
- **Belçika:** Vlaamse Wooncode / woningkwaliteit, Brüksel RRU / GSV, Valon code du logement.
- **Diğer ülkeler:** ilgili ulusal yapı yönetmelikleri.

Bulunamayan değer "kaynak bulunamadı" olarak kalır, uydurulmaz. Kural dosyası 00B'deki yapıya ülke anahtarı ekler: `plan-kurallari.v2.json` genişletilir ya da `plan-kurallari.eu.json`.

### C · Dil ve adlandırma

Her dilde konut ve oda terimleri ile oda sayısı gösterimi (çok önemli; asistan isteği bunlardan anlar):
- Türkçe "3+1";
- Fransızca "T3 / F3";
- Almanca "3-Zimmer-Wohnung";
- Felemenkçe "3 slaapkamers" ve "4-kamerwoning";
- İngilizce "3-bed / 2-bed flat";
- İspanyolca "3 dormitorios";
- İtalyanca "trilocale";
- Danca "3-værelses".

Aynı sayının ülkeye göre farklı anlama geldiğine dikkat: T3 ve 3-Zimmer salonu sayar, "3-bed" saymaz. Bunun için bir eşleme tablosu hazırlanır.

Ayrıca:
- alan ölçüsü alışkanlıkları (m²; Birleşik Krallık'ta sq ft da kullanılır);
- kat numaralama farkları (zemin = 0 ya da 1; "first floor" Birleşik Krallık ile ABD'de farklıdır);
- yön ve cephe ifadeleri.

Teslim: `knowledge/ev-projesi/veri/dil-ulke-sozlugu.json`

### D · Çözücü ve veri setine ülke profili

- `plan_program` nesnesine `country` ve `region` alanları eklenir. Çözücü, kural ve tipolojiyi buna göre seçer.
- **Yeni tipler:** dar ve derin sıra ev (Belçika ve Hollanda, 5–7 m cephe), ayrı WC zorunluluğu olan planlar, bodrum ve çatı katı, kış bahçesi ve veranda.
- **Veri seti:**
  - her ülke dilinde en az 300 doğal istek (8 dil, toplam en az 2.400);
  - eksik bilgili ve çelişkili istekler;
  - asistanın ülke ve bölgeyi teyit ettiği örnek konuşmalar.
- **Test seti:** her ülkenin en az bir tipi eğitimde hiç görülmemiş olmalı.
- **İnceleme sayfası:** ülke başına en az 4 plan, toplam en az 40. Ülke, tip ve dil etiketleriyle.

### E · Taban ölçüm

00B'deki yöntemle, her dilden küçük bir dilimle eğitimsiz Qwen ölçülür. Ölçütler:
- dilden ülke ve tip çıkarımı;
- oda sayısı gösteriminin doğru anlaşılması (T3, 3-bed, trilocale);
- programın çözücüden geçerli plan üretmesi.

## 4. Kapanış koşulu

- 9 ülke profili, kaynaklı tipoloji ve kural dosyalarıyla.
- Dil ve ülke sözlüğü ile oda sayısı eşleme tablosu.
- Çözücü ülke profiliyle plan üretiyor; inceleme sayfasında ülke başına örnekler var.
- Taban ölçüm her dil için kayıtlı.
- **GPU kapısı kapalı.** Eğitim kararı kullanıcı incelemesinden sonra verilir.

## 5. Kurallar

- Belgesiz bilgi yok; her eşik kaynaklı ya da "öneri" olarak işaretlenir.
- Gerçek müşteri verisi yok; planlar sentetik ve işaretli.
- Ücretli servis ve GPU kiralama yok.
- Rapor: `knowledge/ai-egitim/EV-QWEN-00C-RAPOR.md`. `QWEN-KUSURLAR.md` güncellenir.
