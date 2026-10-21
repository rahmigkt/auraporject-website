# Aşama 7 — hacim kapısı ve kalan işler

Bu PR yeni eğitim kaydı teslim etmez. İş emri “Önce Aşama 1–4'ü bitir, sonra hacme geç” diyor. Kabulde bütün testlerin yeşil olması isteniyor. Aşama 1'de beş hata ve bir süre aşımı raporlu; mevcut 40 sohbetin 39'unda kaynak geometri istisnası ve tüm adaylarda insan/dil incelemesi açık. Salt sayıyı artırmak bu kapıları kapatmaz. İş emrinin “Bir aşamada takılırsan raporla ve bir sonrakine geç” kuralıyla eğitim hazırlığına geçildi; bu hacim işi tamamlanmış sayılmaz.

## Ülke başına gerçek sayı ve alt sınır açığı

Hedef 30–40 sohbet/ülke; aşağıda 30'a kalan sayılar onaylı kayıt sayısı değildir.

| Ülke | Geometrili eski sohbet | Ek ön görüşme | 30 geometrili sohbete kalan |
|---|---:|---:|---:|
| BE | 8 | 0 | 22 |
| NL | 4 | 0 | 26 |
| DE | 3 | 0 | 27 |
| FR | 2 | 0 | 28 |
| UK | 4 | 0 | 26 |
| IE | 4 | 0 | 26 |
| DK | 4 | 0 | 26 |
| ES | 4 | 0 | 26 |
| IT | 4 | 0 | 26 |
| AT | 0 | 0 | 30 |
| CH | 0 | 0 | 30 |
| TR | 3 | 0 | 27 |
| AE | 0 | 3 | 30 |
| SA | 0 | 3 | 30 |
| QA | 0 | 2 | 30 |
| KW | 0 | 2 | 30 |
| EG | 0 | 1 | 30 |
| MA | 0 | 1 | 30 |

Bu sayılar 40 mevcut sohbet ve 12 yeni ön görüşme dosyasından gelir; CH referans geometrisini kullanmak CH ülke sohbeti teslim etmek değildir. Hiçbiri yeni eğitim onayı değildir.

## Kapanmadan unutulmayacak işler

1. Depo testlerindeki dış services bağımlılığı, eski normalize snapshot uyumsuzluğu ve uzun forma denetimi çözülmeli; veri motor ağacıyla yeniden doğrulanmalı.
2. Yerel kaynak/iki kat/meclis ihtiyacı olan türlerde izinli ölçülü plan ve motor desteği sağlanmalı. Ölçü olmayan intake taslağı çözümlü oda diye çoğaltılmamalı.
3. Sonraki hacim turu tek ülke grubu ve ayrı PR olmalı: Arap önceliğinde AE/SA/QA/KW, hazır ölçülü kaynak yoksa bu engel korunur. Yerel ölçü isterken teknik terim kullanıcı metnine taşınmaz.
4. 9 dil × en az 200 doğal mobilya komutu henüz teslim edilmedi. Eski şablon üreticisinin parametre adı içeren satırları doğal komut diye sayılmayacak. Canlı vocabulary seçenekleri, belirsizlik/reddetme ve gerçek motor sonuçları her komuta bağlanmalı.
5. Her yeni grup kaynak hash'i, en az 8 kullanıcı/asistan turu, değişmeyen kaynak bölmesi, native üslup incelemesi ve gerçek işlemlerle kaydedilmeli. Yeni veri karantinaya girer; onay taklit edilmez.

Eğitim başlamadı. Hacim hedefi açık; bu PR yalnız durum ve sıra düzeltmesidir.
