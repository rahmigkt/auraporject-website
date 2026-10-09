# Mizan v0.1 — kapsam ve teknik notlar

## Referans envanteri

Videoların her birinde farklı zamanlardan altı kare incelendi. Bu işlem kaynak kodu incelemesi veya bütün karelerin / ses kaydının ayrıntılı çözümlemesi değildir.

| Video | Görünen yaklaşım | Uygulamadaki karşılık | Fark / sınır |
|---|---|---|---|
| 1000263196.mp4 | Eğri → basamak → nota, bas eşliği | Matematik ve müzik | Ses Web Audio ile yeniden üretilir; orijinal ses kaydı kopyalanmaz. |
| 1000263197.mp4 | Aynı müzik anlatımı | Aynı sahne | Görsel içerik tekrar eder; dosyalar byte düzeyinde aynı değildir. |
| 1000263198.mp4 | At silueti, ayrı x/y Fourier zincirleri | At silueti | Kontur özgün olarak yeniden çizildi; hata tanımı normalize RMS. |
| 1000263199.mp4 | Sol anahtarı, kompleks Fourier ve ses | Sol anahtarı | Kontur ve nota eşleme uyarlaması; piksel/ses eşleşmesi iddia edilmez. |
| 1000263200.mp4 | π konturunu dönen vektörlerle çizme | π çizimi | Gerçek DFT; N=1…256. |
| 1000263201.mp4 | Sapma dikdörtgenleri, Pearson r | Korelasyon | 9 sürüklenebilir örnek nokta; canlı hesaplama. |
| 1000263202.mp4 | Kare çevresi yörüngeleri, harmonik toplam | Kare yörüngeler | Sabit çevresel hız; 1,3,5,7,9 karşılaştırması. |
| 1000263203.mp4 | F=(-y-xr²,x-yr²) vektör alanı | Vektör alanı | a=1, ω=1 referans durumu; analitik çözüm. |
| 1000263204.mp4 | sin³x sin³y yüzeyi ve sütunlar | Yüzey ve integral | Three.js, orta nokta Riemann toplamı, n=2…64. |

Ek sahneler: bağımsız motor tezgâhı ve Tûsî çifti.

## Matematik tanımları

1. Fourier: 256 eşit yay uzunluğu örneğinin karmaşık DFT'si. Bileşenler genliğe göre büyükten küçüğe seçilir. Negatif frekanslar ters yönlü döner. RMS hata = sqrt(sum|hedef-yaklaşım|² / sum|hedef-ortalama|²). At sahnesi ayrı x ve y serilerinin gerçek bileşenlerini birleştirir; burada toplam koordinat enerjisine göre RMS kullanılır. Videolardaki yüzde etiketinin tanımı bilinmediğinden aynı yüzdeler iddia edilmez.
2. Tûsî: iki eşit uzunluklu vektörün +θ ve −θ açılarıyla toplamı (2r cos θ, 0). Küçük çember büyük çember içinde kaymadan yuvarlanır. Mutlak küçük-çember dönüşü −θ, taşıyıcıya göre dönüşü −2θ'dir.
3. Vektör alanı: r(t)=r₀/sqrt(1+2ar₀²t), θ(t)=θ₀+ωt. Sabit zaman adımlı Euler yaklaşımı yerine tam analitik yörünge kullanılır.
4. İntegral: [0,π]² bölgesinde orta nokta toplamı; analitik sonuç (4/3)²=16/9. Yüzeyin düşey görsel ölçeği 1,8; sayısal integral gerçek fonksiyondan gelir.
5. Korelasyon: örnek verilerden Pearson r; sıfır varyansta null/tanımsız. Karışım kaydırıcısındaki değer doğrudan r diye sunulmaz.
6. Kare yörüngesi: köşeler arasında sabit çevresel hız; genlik (2k+1)^(-p), frekans (2k+1).

## Üretim araçları

- Oynat/duraklat, başa dön, zaman kaydırma, hız, 4–120 saniye döngü.
- Dört adımlı anlatım; başlık ve açıklama düzenleme.
- Izgara, yardımcı geometri, referans şekil, iz katmanları; sahneye göre anlamlı olan katmanlar.
- Yatay, kare, dikey kadraj; yakınlaştırma; 3B kamera sürükleme.
- Tek kapalı SVG path / tek vuruş serbest çizim → DFT.
- 32 bağımsız vektör motoru; yarıçap, frekans, faz.
- Tarayıcıda 40 sahnelik yerel kayıt, JSON taşıma ve geri yükleme.
- PNG, vektör eğrisi için SVG, tarayıcı destekliyorsa sesli video.
- İnternet CDN bağımlılığı olmadan yerel olarak sunulabilir.

## Sergi öncesi kalan işler

- Hedef tarihî aletlerin kesin envanteri, ölçüleri, mekanik ilişkileri, bilim tarihi kaynakları ve uzman onayı.
- Usturlap, rubu tahtası, güneş saati, su saati, dişli / bağlantı çubuğu mekanizmaları için ayrı doğru modeller.
- Fiziksel dokunmatik ekran, kiosk bilgisayarı, tarayıcı ve projeksiyon çözünürlüğünde test; 8–12 saat çalıştırma; enerji kesintisi / yeniden açılış senaryoları.
- İstenirse çok kullanıcılı arşiv, merkezi yedek, kullanıcı yetkileri, sunucuda sabit kare hızlı yüksek çözünürlüklü render.
- WebM/MP4 tarayıcı desteği, düşük donanımda akıcılık, mobil Safari ve Android ses/video kontrolleri.

## Araştırma kaynakları

- Three.js (uygulandı): https://github.com/mrdoob/three.js — MIT; kurulu sürüm 0.186.1.
- Manim Community (incelendi, eklenmedi): https://github.com/ManimCommunity/manim — programatik video üretimi; MIT.
- JSXGraph (incelendi, eklenmedi): https://github.com/jsxgraph/jsxgraph — etkileşimli geometri; MIT / LGPL çift lisans.
- Tûsî tarihî çerçevesi: https://mathshistory.st-andrews.ac.uk/Biographies/Al-Tusi_Nasir/

Bu sürüm Matharium'un özel motorunu kullandığını veya onunla eksiksiz özellik eşitliği sağladığını iddia etmez.

## Bu sürümde yapılan kontroller — 9 Ekim 2026

- 11 matematik testi geçti.
- Yerel Chromium 153 headless ortamında 10 sahne, 3B WebGL, adımlar, Fourier parametresi, tarayıcı kaydı, JSON geri yükleme, PNG, SVG dışa/içeri alma, serbest çizim, ses, video kaydı, Pearson hesabı ve mobil taşma kontrolü geçti; yakalanan JavaScript sayfa hatası: 0.
- 1440 piksel masaüstü ve 390 piksel mobil genişlikte ekran görüntüleri incelendi. Diğer sahnelerin çizim alanları ayrıca görsel olarak kontrol edildi.
- Test kaydı: 1280×908 VP9 görüntü ve Opus ses kanalları doğrulandı. Gerçek zamanlı kayıt cihaz performansına bağlıdır; sabit kare hızlı profesyonel render değildir.
- Gerçek Android cihazı, Safari, fiziksel kiosk veya kesintisiz uzun süreli sergi testi yapılmadı. Bu kontroller saha kabulünün yerini tutmaz.
