# Tasarımcı Atölyesi — eksik tespiti (Claude, 2026-10-19)

Hedef (karar sahibi): eğitimden önce `tasarimci.html` **oymalar hariç her şeyi** yapabilmeli.
Bugünkü durum: düz parçada serbest siluet, tornalı parçada profil, simetri, hazır biçimler,
canlı fizik (devrilme, sehim, kesit, CNC yarıçap), DXF/JSON, üretime gönderme.

## Eksikler (öncelik sırasıyla)

| # | Yetenek | Neden gerekli |
|---|---|---|
| 1 | **3D'de doğrudan seçme ve taşıma/döndürme/ölçek (gizmo)**, sayısal giriş, yakalama | Parça listesinden seçmek yavaş; tasarımcı modele dokunarak çalışmalı |
| 2 | **Parça ekle / sil / çoğalt**: kutu, silindir, tornalı, profil-süpürme, panel, ray, kayıt, raf, ek ayak | Şu an yalnız var olanı biçimlendirebiliyor; yapı değiştiremiyor |
| 3 | **Kenar profilleri**: pah, yuvarlatma, ters pah, ogee, kademeli kenar — her kenarda ayrı | Masa tablası, kol, ray kenarları |
| 4 | **Kare kesitli incelen / kılıç (sabre) ayak, eğri kayıt ve kol**: kesit + yol boyunca süpürme | Tornalı olmayan ayaklar ve eğri elemanlar |
| 5 | **Delik, cep, yarık, kulp oyuğu, kanal, yiv ve fluting (lineer desen)** — boolean çıkarma | Oyma değil, CNC/makine işleri |
| 6 | **Görünür birleştirmeler**: geçme zıvana, kırlangıç kuyruğu, kavela, Domino; temas eden parçalarda otomatik öneri | Üretilebilirlik ve tasarım dili |
| 7 | **Bükme / lamine eğri**: planda eğri tabla, silindirik bükülmüş arkalık | Modern formlar |
| 8 | **Ayna, dizi (array), hizalama, eşit aralık, ölçü kısıtı** | Hız ve doğruluk |
| 9 | **Parça başına malzeme ve damar yönü** | Karışık malzemeli tasarım, doğru kesim listesi |
| 10 | **Döşeme biçimleme**: minder kabarıklığı, kapitone yerleşimi, biye yolu — parça bazında | Oturma ailesi |
| 11 | **Fizik genişlemesi**: yeni parçalar için sehim, birleşim dayanımı, çoklu yük, eğim/devrilme her yönde | Serbest yapı kurulunca standart iskelet yetmez |
| 12 | **Çıktılar**: delik/kanal/profil takım bilgisi olan DXF, STL/STEP, montaj çizimi, güncel kesim listesi | Atölyeye doğrudan iş |
| 13 | **Sürüm geçmişi, orijinalle karşılaştırma, müşteriye onaya gönderme** | Tasarımcı ↔ müşteri akışı |
| 14 | **Dokunmatik/kalem iyileştirmesi**: basınç, iki parmak döndürme, katmanlar | Tablet kullanımı |

Kapsam dışı: oyma, rölyef, serbest heykel yüzeyi.

## Uygulama sırası (Claude)

1 → 2 → 3 → 4 → 5 → 8 → 9 → 6 → 7 → 11 → 12 → 10 → 13 → 14.
Her adım: test (forma-check), gerçek tarayıcı denemesi, yakın plan görüntü kontrolü, ayrı PR.
Codex araştırması (ATOLYE-ARASTIRMA-01) gelince 3, 5 ve 12 için açık kaynak çekirdek seçilir.
