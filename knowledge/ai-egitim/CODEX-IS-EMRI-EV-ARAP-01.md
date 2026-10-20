# CODEX-IS-EMRI-EV-ARAP-01: Arap ülkeleri, Arapça ev sohbetleri ve pazar araştırması

Başlangıç: güncel `main`. Önceki işler EV-SOHBET-02 (#138) ve UK/IE (#146) birleştirildi; iyi bulundu. Aynı yöntemle devam et. `assets/` klasörüne dokunma.

AURA Arap ülkelerine de satış yapacak. Ülke sırasında Danimarka'dan önce bu grup gelir (`EV-ULKE-SIRASI.md`'yi güncelle).

## A · Araştırma (`knowledge/ev-projesi/ARAP-ARASTIRMA-01.md` + `veri/arap-ulkeleri.json`)

1. **Ülkeler:**
   - **Önce:** BAE, Suudi Arabistan, Katar, Kuveyt.
   - **Sonra:** Bahreyn, Umman, Mısır, Ürdün, Fas.
   - Her ülke için konut tipleri (apartman, villa, dubleks, kompound evi) ve bunların tipik net alanları. Kaynaklı olmalı; kaynak yoksa `null`.
2. **Mekân kültürü:**
   - Erkek ve kadın misafir için ayrı **mecliste** oturma (majlis), aile salonu.
   - Ayrı giriş, hizmetli odası, "dirty kitchen" ile gösteriş mutfağının ayrımı.
   - Abdest ve namaz alanı. Kıble yönü, ancak bir yerleşim kuralı olarak değil, müşteriye sorulacak bir şey olarak.
   - Banyo ve WC sayısı.
   - Hepsi ülke ülke ve kaynaklı. Kalıp yargı yok: "her Suudi evi böyledir" denmez.
3. **Mobilya ve tekstil:**
   - Meclis oturması: yer minderi, U ya da L düzen, sedir. Tipik ölçüleri.
   - Ağır perde, katmanlı tül, karartma ihtiyacı ve güneş kontrolü.
   - Halı kültürü: el dokuması, büyük ölçüler.
   - PERDE-01 ve TEKSTİL-02 yapısına eklenecek biçimde yaz.
4. **Ölçü ve mevzuat:**
   - Dubai Building Code, Suudi Building Code (SBC) gibi kaynaklardan kapı, koridor ve merdiven ölçüleri.
   - Kaynak bulunamayan değer `null` kalır.
5. **Plan kaynağı:** Körfez villalarına benzeyen, lisansı açık plan veri seti ara.
   - Bulunamazsa Swiss Dwellings ya da ResPlan planları **uyarlanmış referans** olarak kullanılır ve bu kayıtta açıkça yazılır.
   - Gerçek bir Körfez evi gibi sunulmaz.

## B · Sohbetler (`knowledge/ai-egitim/veri/ev-sohbet-arap/`)

- **12 sohbet:**
  - BAE 3, Suudi Arabistan 3, Katar 2, Kuveyt 2, Mısır 1, Fas 1.
  - Her biri en az 8 tur.
  - En az 2'si villa ve iki katlı, merdivenli.
- **Dil:**
  - Asistan Modern Standart Arapça kullanır.
  - Kullanıcı yer yer Körfez ya da Mısır ağzıyla yazabilir; asistan anlayıp MSA ile cevap verir.
  - Aynı sohbette dil karışmaz.
  - Ölçüler ve sayılar kullanıcının yazdığı biçimde kalır (Arap rakamı ya da Doğu Arap rakamı).
- **Üslup.** Bu, önceki teslimlerdeki tek ciddi eksik; mutlaka düzeltilecek:
  - Kullanıcı **kendi evini** anlatır. "Bu İsviçre çizimini referans al" gibi veri seti cümleleri yasak. Plan kaynağı yalnızca kaydın `source` alanında durur.
  - Asistan sıcak, saygılı ve sade konuşur.
  - Sohbete şu kelimeler girmez: "çözücü", "kaynak istisnası", "proje hedefi", "dolaşım zarfı", "lisanslı kaynak", "referans plan".
  - Belirsizlik tek ve insanca bir cümleyle söylenir. Örnek: "Kapının hangi yöne açıldığını bilmiyorum; yerinde bakmamız gerek."
  - Mahremiyet ve aile düzeniyle ilgili sorular nazikçe sorulur. Asistan varsayımda bulunmaz.
- **Mobilya:** `assets/ev/yerlesim.js` içindeki `solveRoom` ile yerleştirilir; elle koordinat yazılmaz.
  - Meclis için çözücüde parça türü yoksa bunu raporda belirt; ben eklerim.
  - O sohbette meclisi "sığmıyor" diye bırak ya da salon olarak çöz.
- **Denetim:**
  - `denetim.py` ve tekrar üretim (byte aynılığı) önceki turlardaki gibi.
  - Yeni kontrol: asistan mesajlarında yasaklı iç terimlerin sayısı 0 olmalı.

## C · Önceki 28 sohbetin üslup düzeltmesi

EV-SOHBET-02 ve UK/IE sohbetlerindeki asistan ve kullanıcı cümlelerini yukarıdaki üslup kuralına göre yeniden yaz. Plan, işlem ve yerleşim sonuçları değişmez. Yasaklı terim sayımı 0 olmalı.

## Teslim

- Rapor, veri, araçlar ve inceleme HTML'i.
- PR aç, birleştirme.
- Eğitim çalıştırma, GPU ve ücretli API yok.
