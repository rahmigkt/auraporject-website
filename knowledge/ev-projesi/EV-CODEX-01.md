# EV-CODEX-01 — Ev projesi katmanı için kaynak araştırması

Tarih: 2026-10-20 · Karar: kullanıcı · Hazırlayan: Claude · Uygulayan: Codex (yalnız araştırma ve veri; `assets/` klasörüne dokunmaz)

## Bağlam

AURA'da yapay zekânın asıl işi bütün ev projesi olacak: kullanıcıyla birlikte evin her odasını tasarlamak. Kapsam ışık, perde, halı, duvar ve zemin ile odaya göre ölçülendirilmiş mobilya. Mobilya tasarımı bugünkü seviyede kalıyor.

Aşağıdaki unsurlar **sitede ürün olarak gösterilmeyecek**. Yalnızca proje katmanında, stüdyonun arka plan yeteneği olarak bulunacak. Yapay zekâ bunları projeye yerleştirebilecek ve tasarımcıya giden pakete girecekler.

## İstenen: kategori başına kaynak ve veri

Her kategori için şunlar istenir:
- **Kaynaklar:** açık lisanslı 3B model ya da prosedürel üretici kaynakları. Lisans türü ve ticari kullanım durumu ayrıca belirtilmeli.
- **Ölçüler:** gerçek piyasa ölçü aralıkları.
- **Teknik değerler:** standartlar ve kurallar (aşağıda örnekler).
- **Veri dosyası:** önerilen JSON şeması ile `knowledge/ev-projesi/veri/` klasörüne örnek bir veri dosyası.

1. **Aydınlatma**
   - Türler: avize, sarkıt, aplik, lambader, masa lambası, spot, ray spot, gizli LED, tablo ışığı.
   - Teknik değerler: lümen ve renk sıcaklığı (K) aralıkları; oda türüne göre önerilen lüks değerleri (EN 12464-1 ya da benzer kaynak); montaj yükseklikleri.
2. **Perde ve jaluzi**
   - Türler: fon, tül, stor, zebra, jaluzi, Roma.
   - Teknik değerler: büzgü oranları (1,5×–3×); korniş ve ray türleri; pencere ölçüsünden perde ölçüsü hesabı; piyasa kumaş eni ve gramajı.
3. **Halı**
   - Türler: standart ölçüler, malzemeler, dokuma türleri.
   - Teknik değerler: oda ve mobilya düzenine göre yerleşim kuralları (ön ayakların halıya basması gibi).
4. **Duvar ve zemin**
   - Malzemeler: boya, duvar kâğıdı, lambiri, taş, parke, seramik.
   - Kaplama hesabı ve fire oranları.
   - Açık lisanslı doku kaynakları; örneğin ambientCG ve Poly Haven, ikisi de CC0 olduğu için doğrulanacak.
5. **Aksesuar**
   - Ayna, tablo ve çerçeve, saksı ve bitki, vazo, kitap, yastık, örtü, sepet.
   - Hepsi düşük ayrıntılı 3B olmalı ve ölçüsü bilinmeli.
6. **Mimari unsurlar**
   - Kapı ve pencere türleri ile standart ölçüleri (Türkiye ve AB); pervaz, süpürgelik ve kartonpiyer profilleri.
   - Tavan türleri: düz, asma, kademeli.
7. **Konut planı kuralları**
   - Oda türleri ve asgari ölçüler (Planlı Alanlar İmar Yönetmeliği gibi kaynaklar).
   - Geçiş ve dolaşım genişlikleri; mutfak çalışma üçgeni; yatak çevresindeki boşluklar.

## Ayrıca bakılacaklar

- **Infinigen Indoors** (BSD-3): prosedürel lamba, halı, perde ve aksesuar üreticileri var. Hangi parçaları tarayıcıya JavaScript olarak taşınabilir, bunu çıkar. Depoda zaten `assets/vendor/infinigen` var.
- **Ev ve kat planı formatları:** IFC, SweetHome3D ve açık kat planı veri setleri. Bir ev projesini tanımlamak için hangi şema yeterli olur?

## Kurallar

- Belgesiz bilgi yazılmaz. Her sayı bir kaynağa bağlanır; kaynak bulunamazsa "kaynak bulunamadı" yazılır.
- Lisansı belirsiz ya da ticari kullanıma kapalı kaynak "kullanılamaz" olarak işaretlenir.
- Teslim yeri: `knowledge/ev-projesi/EV-ARASTIRMA-01.md` ve `knowledge/ev-projesi/veri/*.json`.
- Kod yazılmaz. Stüdyoya entegrasyonu Claude yapar.
