# Arapça stüdyo · ana dil inceleme listesi

TOPARLAMA-01 Aşama 5. İncelenen `assets/forma/i18n-ar.js` Git-blob SHA256: `26a85bbeac83e8f3796a6e7d8e563d8b499318acc0872b2e9a385ae3be281fe3`. Bu bir değişiklik raporudur; assets düzenlenmedi. Güncel canlı arayüzün veya başka dalın aynı kaldığı varsayılmıyor.

Aşağıdaki öneriler ana dil uzmanı ve tasarımcı kararı bekler; hepsi kesin çeviri hatası değildir. Modern Standart Arapça ana dil, Körfez'de yaygın karşılıklar kullanıcı tercihi olarak değerlendirilmeli. Kontrol eden kişi **uygun / değiştir / bağlam gerekli**, tercih edilen karşılık ve gerekçeyi kaydetsin.

| Anahtar | Mevcut | İncelenecek karşılık / anlam | Kontrol sorusu |
|---|---|---|---|
| famSeating | الجلسات | أثاث الجلوس veya mevcut karşılık | هل يفهم المستخدم أنها فئة أثاث وليست غرفة أو مناسبة؟ |
| nightstand | كومودينو | طاولة جانبية للسرير; bölgesel كومودينو korunabilir | أي تسمية أوضح في السوق المقصود؟ |
| headboard | ظهر السرير | لوح رأس السرير veya mevcut | هل يشير المصطلح إلى الجزء الصحيح من السرير؟ |
| coffee | طاولة قهوة | طاولة وسط / طاولة قهوة | هل المقصود طاولة الجلسة الوسطى، لا قطعة مخصصة لتحضير القهوة؟ |
| console | كونسول | طاولة كونسول | هل يحتاج الاسم إلى وصف قصير للموقع أو الاستخدام؟ |
| solidWood | خشب صلب | خشب مصمت | هل يميز التعبير بين الخشب المصمت وصلابة نوع الخشب؟ |
| bedding | العرض | مظهر السرير / طريقة عرض السرير | هل هو عرض المرتبة وحدها أو السرير مرتبًا، وليس لون الأقمشة؟ |
| linen | لون المفارش | Mevcut bağlamda yatak tekstili rengi | Burada İngilizce linen malzeme olarak keten değil; kumaş lifini çevirdiğini varsayma. |
| leaves | ضلف الأبواب | Dolapta ضلف الأبواب; masada ألواح تمديد الطاولة | Aynı anahtar iki farklı parça için kullanılıyor; tek sözlük karşılığı yeterli mi? |
| backPanel | لوح أمامي سفلي | Masa diz paneli için ayrı ad; dolap arka paneli için اللوح الخلفي | Mobilya ailesine göre bağlam ayrılmalı mı? |
| caseLayout | توزيع الأدراج | Çekmece düzeni bağlamında mevcut karşılık | Gerçek kontrol çekmece mi, bütün dolap içi mi? Kaynağa göre karar ver. |
| woodNote | Kesin الزان/ahşap vaadi | Teknik ürün bilgisinden doğrulanacak dinamik ifade | Kaynak dillerde beech/gürgen birlikte geçiyor; türü ve gerçek ürün malzemesini doğrulamadan yeni bir vaat üretme. |

`leaves` için kaynak incelemesi: `i18n.js` önce masa uzatma tablası anlamını, sonra kapak anlamını aynı anahtarda tanımlıyor. `studio.js` masa ve dolap göstergelerinde aynı `L('leaves')` anahtarını kullanıyor. Bu yalnız Arapça kelime seçimi sorunu değil; bağlama göre anahtar ayrımı gerektiren bir arayüz anlam çakışmasıdır. Önerilen ayrı anahtar adları uygulama sahibinin kararıdır; bu görev yeni anahtar veya assets değişikliği yapmadı.

İkinci turda sağdan sola yön, sayı/birim sırası, mm/cm, 240 ile ٢٤٠ kullanımı, L/U düzeni, seçili ürün adı ve dar tablet ekranında etiket kesilmesi kontrol edilsin. Bu tur yalnız kaynak/dil incelemesidir; Arapça gerçek cihaz/ana dil kullanıcı testi yapıldığı söylenmez. Hane düzeni, kadın/erkek meclisi ve ibadet alanı ülke veya dil seçilince otomatik varsayılmamalı.
