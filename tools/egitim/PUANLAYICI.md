# E1 ortak puanlayıcı

`puanla.mjs`, sınav adaptörleri, E2 süzme ve E3 ödül hazırlığı için aynı çevrimdışı API'yi sunar. Model çalıştırmaz, eğitim başlatmaz, ağ isteği yapmaz ve stüdyo dosyalarını değiştirmez. Mevcut frozen sınav puanlayıcıları ve H5 sonuçları korunur; bu sürüm geçmiş ölçümü yeniden puanlamaz. Sonraki sınav adaptörü sürümü ve fingerprint'i ayrıca kaydedilmelidir.

## Girdi ve çıktı

```js
import {puanla} from './puanla.mjs';
const sonuc = puanla({
  id: 'development-example',
  text: modelOutput,              // ham metin; JSON onarılmaz
  state: initialState,            // tam motor durumu, modelin özeti değil
  user: userRequest,
  language: 'tr',                 // tr/en/de/fr/es/it/nl/da/ar
  expected: {
    intent: 'apply',              // veya clarify/refuse/studio_redirect
    actions: trustedReferenceActions,
    observations: {'/aydinlatma/oda-1/renk_k': 3100}
  },
  generation: {condition: 'raw', status: 'ok', truncated: false}
});
```

`expected`, `state`, `language`, `generation` ve varsa `review` güvenilen çağıran tarafından verilir. Model yalnız `reply` ve `actions` üretir; model zarfına eklenen değerlendirme alanları biçim hatasıdır. İstem, başlangıç durumu ve beklenti değerlendirme için ayrı tutulur; beklenti modele verilmez. CLI bir JSONL dosyası alır ve satır başına bir sonuç yazar:

```text
node tools/egitim/puanla.mjs trusted-input.jsonl
```

| Alan | Denetim |
|---|---|
| bicim | Katı JSON; çit/onarım yok; yinelenen anahtar, tehlikeli anahtar, sonsuz sayı, fazla üst alan, boş reply, bilinmeyen işlem/katman ve eksik zorunlu alan reddedilir. 200.000 karakter, 32 derinlik, 20 işlem sınırı. |
| motor | Gerçek `uygula()` sonucu: ret **ve tüm uyarılar** sıfır olmalı. Boş işlemin motordan geçmesi istek başarısı değildir. |
| istek | Gözlemler, referans işlemlerinin tam durum sonucu ve yerleşim eşya/ölçü/kısıt yükü karşılaştırılır. Ek oda/ad, küçültülen ölçü, çıkarılan kısıt ve başka kalıcı değişiklik geçmez. |
| durustluk | İşlemsiz niyette işlem reddedilir. Ölçü sorusu, sığmama açıklaması, yönlendirme ve iddiaların anlamı insan incelemesine kalır. E-posta anılması veya olumsuz ifade tek başına yalan/başarı sayılmaz. |
| dil | Açık iç terimler ve güçlü yanlış dil ipuçları olumsuz kontrol sağlar. Dokuz dilde küçük sözcük listesi **dil tanıma veya anadil onayı değildir**; doğru görünen metin `review` kalır. |
| kisalik | Bire bir aynı işlem, çıkarıldığında aynı sonucu veren gereksiz işlem, cümle/sözcük döngüsü ve 1.200 karakter üstü yanıt ayrı işaretlenir. Aynı türde gerekli farklı işlemler geçebilir. |

Her bileşen `pass` (1), `fail` (0) veya `review` (null) döner. Alt/üst puan sınırları altı bileşenin eşit ağırlıklı ortalamasıdır; bunlar anlama başarısı veya eğitim izni değildir. Ağırlık/karakter sınırları bu geliştirme sürümünün mühendislik tercihleridir; kapalı sınavla seçilmedi. `mechanical_candidate` yalnız mekanik kapıları geçip bilinen olumsuzluk taşımayan adayı belirtir. Kesilme veya aktarım hatası adaylığı engeller. Ham ve şemalı üretimler `generation.condition` ile ayrı tutulur; çağıran koşulları birleştirmemelidir.

`training_approved` daima false; `official` false. `semantic_review_required` daima true: tam motor eşleşmesi bile kullanıcının serbest metninin doğru yorumlandığını veya açıklamanın gerçek olduğunu kanıtlamaz. E2 bu sonuçları yalnız karantinaya aday seçimi için kullanabilir. Tek toplam eşik mekanik retleri geçersiz kılamaz.

## Beklenti sözleşmesi ve sınırlar

- `observations` hem JSON pointer nesnesini hem H1'in `[dot.path, value]` çiftlerini kabul eder. Sayısal eşleşme tamdır; toleransla ölçü küçültme yoktur.
- `apply` için tamamı güvenilir referans işlemleri gerekir. Yalnız gözlem altkümesi varsa istek olumlu onaylanmaz; `review` kalır. Referansın motoru da uyarısız geçmelidir.
- Kalıcı durum karşılaştırmasında kimlikler, ölçüler, oda adları ve solver sonucu korunur; plan varlıklarının yalnız sırası normalize edilir. Eşdeğer fakat farklı solver alternatifleri veya farklı referans kimlikleri temkinli biçimde reddedilebilir. Bu sürüm tüm mümkün tasarımların anlamsal eşdeğerliğini çözmez.
- Yerleşimde eşya ve kısıt yükü ayrıca tam karşılaştırılır. Eşya sırası önemsiz; tür takma adları ve farklı ama eşdeğer kısıt yazımları bu sürümde normalize edilmez. Yanlış kabulü önlemek için bu kısıtlı kapsam açıktır.
- SOZLUK yalnız zorunlu alanları içerir. `bicim` tam isteğe bağlı/iç içe araç şeması doğrulaması değildir; motor ve tam sonuç kapısı ayrıca gereklidir. H5'in eksik araç açıklaması burada giderilmiş gibi gösterilmez.
- Her işlem çıkarılarak tekrar motor denenir; 20 işlem için en çok 23 motor çağrısı (gerçek, boş, referans ve 20 çıkarma). Büyük durumlarda maliyetli olabilir; motorun kendi katman gruplaması kullanılır, tarayıcıdaki etkileşim sırasını taklit etme iddiası yoktur.
- Yanlış dil ipuçları kısa/karma dilli yanıtta kaçırabilir veya yanlış işaretleyebilir. Anlam/dil uzmanı ve gerçek kullanıcı ergonomi/tasarım onayı ayrıdır.

İşlemsiz görevler `actions: []` ister; soru/ret/yönlendirme sözcükleri tek başına tam puan getirmez. Stüdyo yönlendirmesinde `expected.route.url` bulunmalı, yanıt içinde geçmelidir; URL'nin geçmesi anlamın onayı değildir.

Güvenilir dış inceleme `reviewBinding(input)` SHA'sı, `reviewer` ve `dil`/`durustluk`/işlemsiz `istek` için pass/fail taşır. Yalnız `review` kararları çözülebilir; makine retleri silinemez. SHA kimlik doğrulama veya dijital imza değildir; çağıran inceleme dosyasının yetki/kaynak kaydını ayrıca korur. Testteki sentetik incelemeci gerçek onay değildir. Gerçek Codex öz denetimleri izin dönemi ve `review_mode=user_authorized_self_review` ile ayrı kayıtlanmalıdır.

## Doğrulama

`node tests/egitim-puanla-check.mjs` yeni sentetik geliştirme senaryolarını gerçek motorda sınar. Altı zorunlu hile, boş işlem/istek tekrarı ayrımı, dokuz dilin inceleme gerekliliği, olumsuz gönderim ifadesi, tam ölçü, kısıt çıkarma, meşru çoklu işlem, JSON sınırları ve inceleme bağlamı kapsanır. Dondurulmuş sınavdan örnek veya model yanıtı geliştirme fixture'ına kopyalanmadı. Kapalı sınav/120 H5 yanıtı bu kodla yeniden çalıştırılmadı; eğitim verisi üretilmedi.

Tam paket sonucu ve açık kusurlar teslim kaydında ayrıca yer alır. Önceki Forma 180 saniye zaman aşımı, tamamlanmayan site/vendor/mobil denetimi, 390px tasarımcı kırpılması ve eski DOM fixture sorunları bu araçla çözülmüş değildir.
