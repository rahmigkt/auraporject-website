# SINAV-01B — doğal dil ana sınavı teslimi

2026-10-18. Başlangıç: main `8f5e0d9`; PR #44 kullanıcı talimatıyla birleştirildi. D1 ve 01B iş emri okundu. Bu teslim D2 ve uzman onayı bekler. **Tüm sonuçlar ön skordur; hiçbir kayıt insan onaylı değildir.** 01A puanları ile bu yeni örneklemin puan farkı bir sistem değişikliği veya iyileşme ölçüsü değildir.

## Yazım ve bölümleme

Her cümle, aile/tür bağlamı ve altın eylem listesi tek tek yazıldı. Kalıp üreticisi, sayı değiştirme döngüsü veya nezaket varyantlarıyla çoğaltma kullanılmadı. Yalnız hazır kayıtların JSONL alanlarına yerleştirilmesi, id/etiket eklenmesi ve bölüm atanması otomatik biçimlendirildi; metin ve altın cevaplar bu işlemde türetilmedi. Teslimde kayıt üreten betik yoktur.

Bölümleme, önceden yazılmış kayıtların iskeletlerinin SHA-256 sırasıyla dil kotasına atanmasıdır (sabit önek: `01b-split:`). Dev dil kotaları: tr 84, en 21, de 7, fr/nl/da 6, es/it 5. Tahminlerden bağımsızdır. Altınların tamamı söz dağarcığı ve bağlam denetiminden geçtikten sonra test donduruldu. Her bölüm kural okuyucuyla yalnız bir kez koşuldu; sonrasında sınav dosyaları değiştirilmedi.

## Bileşim

| Ölçüt | Gerçekleşen | Hedef / sonuç |
| --- | --- | --- |
| Kayıt | 400 | ≥400; geçti |
| Türkçe | 240 | %60; geçti |
| İngilizce | 60 | %15; geçti |
| Diğer altı dil | 100 | %25; her dil ≥15; geçti |
| Her aile | seating: 80; table: 80; storage: 80; kitchen: 80; bath: 80 | Her biri %20 ≥%12; geçti |
| Bölüm | 140 dev / 260 test | %35 / %65; geçti |
| negation | 51 (%12.75) | ≥%8; geçti |
| mixed | 50 (%12.5) | ≥%8; geçti |
| units | 46 (%11.5) | ≥%8; geçti |
| Farklı iskelet | 400/400 (%100) | ≥%90; geçti |
| İskelet başına en çok kayıt | 1 | ≤2; geçti |
| Dev/test iskelet sızıntısı | 0 | 0; geçti |

### Dil ve niyet çeşitliliği

| Dil | Toplam | Dev | Test | Farklı iskelet | Farklı kategori |
| --- | --- | --- | --- | --- | --- |
| tr | 240 | 84 | 156 | 240 | 15 |
| en | 60 | 21 | 39 | 60 | 11 |
| de | 20 | 7 | 13 | 20 | 12 |
| fr | 16 | 6 | 10 | 16 | 10 |
| nl | 16 | 6 | 10 | 16 | 13 |
| da | 16 | 6 | 10 | 16 | 10 |
| es | 16 | 5 | 11 | 16 | 11 |
| it | 16 | 5 | 11 | 16 | 13 |

İngilizce dışındaki altı yabancı dilin her biri en az 10 kategoriye yayılan farklı niyet içerir; aile/tür değiştirme, malzeme ve renk seçimi, ölçü, göreli değişim, olumsuzluk, düzen ve konu dışı istekler örneklenmiştir. Kategoriler niyet için kaba bir alt sınırdır; doğal dil ve altın anlamı D2’de ayrıca okunmalıdır.

### Tür bağlamları

| Aile | Tür | Adet |
| --- | --- | --- |
| seating | sofa | 27 |
| seating | loveseat | 27 |
| seating | armchair | 26 |
| table | dining | 16 |
| table | coffee | 16 |
| table | console | 16 |
| table | side | 16 |
| table | desk | 16 |
| storage | wardrobe | 10 |
| storage | nightstand | 10 |
| storage | dresser | 10 |
| storage | bookcase | 10 |
| storage | sideboard | 10 |
| storage | tvunit | 10 |
| storage | vanity | 10 |
| storage | vitrine | 10 |
| kitchen | run | 40 |
| kitchen | island | 40 |
| bath | column | 26 |
| bath | basin | 27 |
| bath | mirror | 27 |

İş emrinde sayılan tüm türler en az 8 kayıtta bağlamdır. Başlangıç değeri gerektiren yarısı kadar / önceki sayı örneklerinde değer context.params içine yazılmıştır. Geçmişi bulunmayan eski seçim isteği için tahmin yürütülmez; clarify ve unsupported kullanılır.

### Dil × aile × kategori

| Dil | Aile | size | relative | material | color | part | kind | family | layout | negation | mixed | units | colloquial | ambiguous | offtopic | style | Toplam |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tr | seating | 4 | 4 | 3 | 2 | 3 | 1 | 1 | 2 | 6 | 6 | 6 | 3 | 4 | 1 | 2 | 48 |
| tr | table | 4 | 5 | 3 | 2 | 2 | 1 | 1 | 3 | 6 | 6 | 6 | 3 | 3 | 1 | 2 | 48 |
| tr | storage | 4 | 4 | 2 | 2 | 3 | 1 | 1 | 3 | 6 | 6 | 6 | 3 | 3 | 2 | 2 | 48 |
| tr | kitchen | 4 | 4 | 3 | 2 | 3 | 1 | 1 | 2 | 6 | 6 | 6 | 3 | 4 | 1 | 2 | 48 |
| tr | bath | 4 | 4 | 3 | 2 | 3 | 1 | 1 | 2 | 6 | 6 | 6 | 3 | 4 | 1 | 2 | 48 |
| en | seating | 1 | 1 | 0 | 1 | 1 | 0 | 0 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 1 | 12 |
| en | table | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 2 | 1 | 0 | 1 | 0 | 1 | 12 |
| en | storage | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 0 | 12 |
| en | kitchen | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 0 | 12 |
| en | bath | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 1 | 2 | 2 | 1 | 0 | 1 | 0 | 0 | 12 |
| de | seating | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 4 |
| de | table | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 4 |
| de | storage | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 4 |
| de | kitchen | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 4 |
| de | bath | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 4 |
| fr | seating | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 4 |
| fr | table | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 3 |
| fr | storage | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| fr | kitchen | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| fr | bath | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| nl | seating | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 3 |
| nl | table | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 4 |
| nl | storage | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| nl | kitchen | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| nl | bath | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 3 |
| da | seating | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 3 |
| da | table | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 3 |
| da | storage | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 | 0 | 0 | 4 |
| da | kitchen | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 3 |
| da | bath | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| es | seating | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| es | table | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| es | storage | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| es | kitchen | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 4 |
| es | bath | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 3 |
| it | seating | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 3 |
| it | table | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 3 |
| it | storage | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 3 |
| it | kitchen | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 3 |
| it | bath | 1 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 4 |

## Değiştirilmemiş puanlayıcının ham ön skorları

Tablolar `rapor-01b-dev-rules.json` ve `rapor-01b-test-rules.json` içinden aktarılmıştır. Bu dosyalar score.mjs çıktısıdır; sonradan puanları değiştirilmemiştir.

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dev | 140 | 0.257 | 0.368 | 0.511 | 0.428 | 0.359 | 0.333 |
| test | 260 | 0.277 | 0.311 | 0.472 | 0.375 | 0.585 | 0.421 |

### dev — dil

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| da | 6 | 0 | 0.286 | 0.333 | 0.308 | 1 | 0 |
| de | 7 | 0.571 | 0.667 | 0.667 | 0.667 | 0 | 0 |
| en | 21 | 0.238 | 0.379 | 0.524 | 0.44 | 0.667 | 0.25 |
| es | 5 | 0 | 0.2 | 0.2 | 0.2 | 0.5 | 0 |
| fr | 6 | 0.5 | 0.375 | 0.75 | 0.5 | 0.5 | 0.333 |
| it | 5 | 0.2 | 0.4 | 0.667 | 0.5 | 0 | — |
| nl | 6 | 0.333 | 0.571 | 0.667 | 0.615 | — | 1 |
| tr | 84 | 0.25 | 0.345 | 0.494 | 0.406 | 0.269 | 0.375 |

### dev — kategori

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ambiguous | 10 | 0.6 | 0 | 1 | 0 | — | 0.6 |
| colloquial | 4 | 0 | 0 | 0 | 0 | 0 | — |
| color | 7 | 0.143 | 0.333 | 0.667 | 0.444 | 0 | 0 |
| family | 1 | 1 | 1 | 1 | 1 | — | — |
| kind | 2 | 0.5 | 0.667 | 1 | 0.8 | 0 | — |
| layout | 3 | 0.667 | 0 | 1 | 0 | — | 0.667 |
| material | 7 | 0.286 | 0.429 | 0.6 | 0.5 | — | — |
| mixed | 25 | 0.36 | 0.587 | 0.643 | 0.614 | 0.273 | — |
| negation | 16 | 0.063 | 0.053 | 0.25 | 0.087 | 0.563 | 0 |
| offtopic | 1 | 1 | 1 | 1 | 1 | — | 1 |
| part | 10 | 0.2 | 0.375 | 0.3 | 0.333 | 0.286 | — |
| relative | 13 | 0.154 | 0.182 | 0.154 | 0.167 | 0 | — |
| size | 17 | 0.294 | 0.429 | 0.529 | 0.474 | — | — |
| style | 9 | 0.222 | 0.563 | 1 | 0.72 | — | — |
| units | 15 | 0.067 | 0.2 | 0.267 | 0.229 | — | — |

### test — dil

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| da | 10 | 0.1 | 0.182 | 0.25 | 0.211 | 1 | 0.333 |
| de | 13 | 0.385 | 0.467 | 0.583 | 0.519 | 0.5 | 0.5 |
| en | 39 | 0.308 | 0.326 | 0.455 | 0.38 | 0.75 | 0.385 |
| es | 11 | 0.364 | 0.5 | 0.7 | 0.583 | — | 1 |
| fr | 10 | 0.2 | 0.143 | 0.286 | 0.19 | 0.5 | 0 |
| it | 11 | 0.273 | 0.3 | 0.375 | 0.333 | 1 | 0.333 |
| nl | 10 | 0.3 | 0.286 | 0.333 | 0.308 | 0.5 | 0.75 |
| tr | 156 | 0.269 | 0.302 | 0.484 | 0.372 | 0.512 | 0.409 |

### test — kategori

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ambiguous | 18 | 0.444 | 0 | 1 | 0 | — | 0.444 |
| colloquial | 11 | 0.091 | 0.158 | 0.273 | 0.2 | 0.5 | — |
| color | 13 | 0.308 | 0.474 | 0.6 | 0.529 | 0.5 | — |
| family | 8 | 0.25 | 1 | 0.25 | 0.4 | 0 | — |
| kind | 9 | 0.333 | 0.4 | 0.444 | 0.421 | 0.75 | — |
| layout | 19 | 0.632 | 0 | 1 | 0 | — | 0.632 |
| material | 19 | 0.263 | 0.433 | 0.684 | 0.531 | 0.571 | 0 |
| mixed | 25 | 0.2 | 0.65 | 0.531 | 0.584 | 0 | — |
| negation | 35 | 0.114 | 0.02 | 0.125 | 0.035 | 0.8 | 0.111 |
| offtopic | 9 | 1 | 1 | 1 | 1 | — | 1 |
| part | 17 | 0.294 | 0.4 | 0.471 | 0.432 | 0.2 | — |
| relative | 22 | 0.182 | 0.25 | 0.35 | 0.292 | 0 | 0 |
| size | 14 | 0.357 | 0.409 | 0.643 | 0.5 | 0 | — |
| style | 10 | 0.3 | 0.476 | 1 | 0.645 | — | — |
| units | 31 | 0.065 | 0.2 | 0.25 | 0.222 | 0 | — |

## Desteklenmeyen istekleri ayrı gösterme

Mevcut score.mjs, gold.unsupported alanını dışlamıyor. Bu yüzden ham tam doğru oranı desteklenmeyen isteklerdeki boş eylem başarılarını da içerir. İş emri bu ayrımı denetçiye bırakıyor; puanlayıcıya dokunulmadı. Aşağıdaki **ek hesap**, aynı JSON’lardaki sayısal sonuçlardan unsupported kayıtları tam doğru/P/R/F1 tablosundan çıkarır. Yeni bir tahmin koşusu, resmi metrik değişikliği veya bağımsız ölçüm değildir.

| Bölüm / grup | n | Tam doğru | P | R | F1 | Yasak ihlali | Soru doğruluğu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dev: unsupported hariç | 132 | 0.25 | 0.389 | 0.511 | 0.442 | 0.359 | 0.316 |
| test: unsupported hariç | 225 | 0.236 | 0.333 | 0.472 | 0.391 | 0.603 | 0.317 |

Desteklenmeyen istekler yalnız ayrı soru doğruluğu hesabında:

| Bölüm | Desteklenmeyen kayıt | Eylemsiz doğru durma | Soru doğruluğu |
| --- | --- | --- | --- |
| dev | 8 | 3 | 0.375 |
| test | 35 | 19 | 0.543 |

Burada “soru doğruluğu” yalnız eylem üretmeme ölçüsüdür; gerçekten soru cümlesi üretildiğini kanıtlamaz. Görünür yanıt metni ölçülmüyor. Denetçiye öneri: resmi sonraki skor sürümünde unsupported kayıtları ana metrikten çıkarıp ayrı clarify tablosuna taşısın.

## Yalnız dev: en sık 10 hata kalıbı

Gruplar kategori, dil ve beklenen/üretilen eylem anahtarlarıyla oluşturulur; sayılar yalnız dev JSON’undan gelir. Test için cümle örneği veya hata kalıbı analizi yapılmadı.

| Kalıp | Adet | Dev örneği | Altın | Gözlenen |
| --- | --- | --- | --- | --- |
| Tarza geçişte eksik veya fazladan eylem (tr) | 5 | sinav01b-tr-seating-047: Bauhaus çizgisine bir bakabilir miyiz bu ikilide? | {"expect":[{"type":"style","value":"bauhaus"}],"forbid":[],"clarify":false} | [{"type":"style","value":"bauhaus"},{"type":"kind","value":"loveseat"}] |
| Yasaklanan seçimin uygulanması veya gereksiz eylem (tr) | 2 | sinav01b-tr-seating-005: Kadife istemem ben, başka kumaşlara bakalım. | {"expect":[],"forbid":[{"type":"material","key":"fiber","value":"velvet"}],"clarify":true} | [{"type":"material","slot":"fabric","key":"fiber","value":"velvet"}] |
| Parça tercihinin yanlış veya fazladan yorumlanması (da) | 1 | sinav01b-da-kitchen-311: Jeg vil gerne have vasken med to kummer. | {"expect":[{"type":"enum","key":"sink","value":"double"}],"forbid":[],"clarify":false} | [] |
| Malzeme hedefinin yuva veya eylem karışması (da) | 1 | sinav01b-da-kitchen-312: Lågerne på køkkenøen skal være i valnød. | {"expect":[{"type":"material","slot":"front","key":"species","value":"walnut"}],"forbid":[],"clarify":false} | [{"type":"material","slot":"front","key":"species","value":"walnut"},{"type":"delta","key":"height","value":-50},{"type":"kind","value":"island"}] |
| Renk hedefinin yuva veya eylem karışması (da) | 1 | sinav01b-da-seating-072: Jeg synes, at stoffet skal være cremefarvet. | {"expect":[{"type":"material","slot":"fabric","key":"color","value":"cream"}],"forbid":[],"clarify":false} | [{"type":"material","slot":"fabric","key":"color","value":"oat"}] |
| Yasaklanan seçimin uygulanması veya gereksiz eylem (da) | 1 | sinav01b-da-seating-074: Læder er udelukket for mit vedkommende. | {"expect":[],"forbid":[{"type":"material","key":"fiber","value":"leather"}],"clarify":true} | [{"type":"material","slot":"fabric","key":"fiber","value":"leather"}] |
| Birimli veya yazıyla ölçünün yanlış okunması (da) | 1 | sinav01b-da-storage-231: Kommoden skal være 127 centimeter bred. | {"expect":[{"type":"set","key":"width","value":1270}],"forbid":[],"clarify":false} | [{"type":"kind","value":"dresser"}] |
| Birden fazla niyetin eksik veya fazla eylemle çözülmesi (da) | 1 | sinav01b-da-table-153: Jeg vil have en rund plade og en fod af metal. | {"expect":[{"type":"enum","key":"topShape","value":"round"},{"type":"material","slot":"base","key":"surface","value":"metal"}],"forbid":[],"clarify":false} | [{"type":"enum","key":"topShape","value":"round"}] |
| Birimli veya yazıyla ölçünün yanlış okunması (de) | 1 | sinav01b-de-kitchen-301: Die Oberschränke dürfen 33,5 Zentimeter tief sein. | {"expect":[{"type":"set","key":"wallDepth","value":335}],"forbid":[],"clarify":false} | [] |
| Sayısal hedefe farklı/ek eylem üretilmesi (de) | 1 | sinav01b-de-seating-061: Bis zur Tür sind es nur 254 Zentimeter, so breit darf das Sofa werden. | {"expect":[{"type":"set","key":"width","value":2540}],"forbid":[],"clarify":false} | [{"type":"kind","value":"sofa"}] |

## Desteklenmeyen kapsam

| Kategori | Desteklenmeyen kayıt |
| --- | --- |
| relative | 2 |
| material | 1 |
| color | 1 |
| layout | 22 |
| negation | 2 |
| ambiguous | 15 |

Bunlar; konumlu modül/raf/çekmece düzenleme, kaydedilmemiş geçmiş seçimi çağırma, bağımsız parça ekleme, özel ayna işlevleri ve mevcut eylem şemasının dışındaki detayları içerir. Her birinde clarify=true, expect boş ve unsupported açıklaması vardır. Layout kayıtları eylemsiz tam puan için boş bırakılmadı.

## Yasak kapsamı

Malzeme yasaklarından 33 tanesi yuvasız, 18 tanesi özellikle belirtilmiş yuvalıdır. Yuva yalnız kapak/gövde/ayak ayrımı gibi cümlede açık kapsam bulunduğunda kullanıldı; genel meşe/ceviz/deri yasağı tüm yuvalara uygulanır. Beklenen ve yasak eylemler parser çıktısına bakılarak yazılmadı.

## Dondurma, uyumluluk ve korunan dosyalar

01B SHA-256: `52e73a6d4b53949e71bcd6ccde615ecc7b1e0e8e3e31b1c14c28982e6df807d3`. Manifest: `tests/ai-eval/sinav-01b/FREEZE.json`; tek anahtar `tests/ai-eval/sinav-01b-test.jsonl` (Linux yolu). `verify-01b.mjs` bunu bağımsız doğrular. Yeni kök .gitattributes yalnız 01B JSONL dosyalarının LF satır sonunu sabitler.

01A dosyalarını değiştirmeme talimatı nedeniyle eski `tests/ai-eval/FREEZE.json` ve 01A rapor başlığı dahil hiçbir eski dosya değiştirilmedi. Puanlayıcı yalnız eski manifest konumunu okuduğundan ham JSON’un freeze alanı **donmamış** kalır; bu durum gizlenmedi veya rapor JSON’unda düzeltilmedi. Yeni manifestteki hash eşleşmesi ayrı denetimdir. Denetçiye öneri: sonraki puanlayıcı sürümüne manifest yolu seçeneği eklemek.

Windows’ta mevcut, değiştirilmemiş run-score-windows.mjs başlatıcısı kullanıldı. Bu yalnız mutlak import yolunu file URL’ye çevirir. Puanlayıcı ve assets değişmedi. Kural okuyucuya yeniden bakılmadı veya ayar yapılmadı; altınlar tamamlandıktan sonra her bölüm bir kez koşuldu.

## Tekrar denetim ve uzman onayı

```text
node tests/ai-eval/verify-01b.mjs
node tests/ai-eval/iskelet.mjs tests/ai-eval/sinav-01b-dev.jsonl tests/ai-eval/sinav-01b-test.jsonl --out tests/ai-eval/iskelet-01b.json
node --test tests/ai-eval/test-01b.mjs
node tests/ai-eval/uzman-onay-01b.mjs --export
node tests/ai-eval/report-01b.mjs
```

Taban ölçümü için yapılan tek koşular:

```text
node tests/ai-eval/run-score-windows.mjs tests/ai-eval/sinav-01b-dev.jsonl --all --out tests/ai-eval/rapor-01b-dev-rules.json
node tests/ai-eval/run-score-windows.mjs tests/ai-eval/sinav-01b-test.jsonl --all --out tests/ai-eval/rapor-01b-test-rules.json
```

POSIX’te aynı argümanlarla doğrudan score.mjs kullanılabilir. Ancak denetim için bu teslimde ek puanlama koşusu yapılmadı.

400 satırlık uzman-onay-01b.csv’de karar/not alanları boştur. Ayrı araç `--import <csv> --reviewer "<ad>"` ile yalnız onaylar-01b.json yazar; donmuş sınavlara veya 01A onaylarına yazmaz. Ortak, değişmemiş CSV karar doğrulayıcısı kullanılır. Kayıtların hiçbirine approved işlenmedi. Yeni araç testleri sayı/nezaket iskelet eşliğini, sızıntı tespitini, CSV bütünlüğünü, bellek içi onay sırasında değişmezliği ve 01B hash’ini denetler.

## Sınırlar ve D2’ye kalanlar

- Tüm cümleler sentetiktir; gerçek müşteri trafiği, kişi bilgisi veya müşteri verisi yoktur. Elle yazılmış olması bağımsız insan etiketlemesi anlamına gelmez.
- iskelet.mjs sayıları, sayı sözcüklerini, nezaket ifadelerini ve noktalama işaretlerini çıkarır. %100 farklı iskelet, anlamsal bağımsızlık veya eşanlamlı/parafraz sızıntısının kesin yokluğu değildir; D2 bunu kör okuyarak değerlendirmeli.
- Yazım hataları, Türkçe karakter eksikliği, kısaltmalar, önceki sayıdan hedef sayıya geçiş, birimsiz sayı, aralık, dolaylı istek ve geçmiş seçime gönderme kayıtları var. Belirsiz aralık ve bağlamsız sayı otomatik olarak tek sayıya çevrilmedi.
- İngilizce dışındaki altı yabancı dil için anadil denetimi yok; ilgili her kayıtta yazılıdır. Tüm dillerde altınlar uzman onayı bekler.
- Malzeme adı species seçimi olarak ele alındı; yüzey türünü açıkça istemeyen cümleye otomatik surface eylemi eklenmedi. Sayısal ölçüler eylem düzeyinde mm; derleme sırasında yuvarlama/uygulanabilirlik bu sınavın ölçtüğü şey değildir.
- Bazı küçük alt gruplarda kayıt sayısı düşüktür. Ön skorlar bir canlıya alma kararı veya istatistiksel iyileşme kanıtı değildir.
- D2’nin rastgele 60 kayıtta kör ikinci okuması ve ≥%90 uyum koşulu henüz yapılmadı. Puanlayıcıdaki unsupported ayrımı ve manifest seçimi denetçiye bırakıldı. Yeni PR birleştirilmeden denetim beklenir.
