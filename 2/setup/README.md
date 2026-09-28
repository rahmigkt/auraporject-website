# AURA /2 — kurulum ve sınırlar

Bu sürüm yalnızca /2 altına eklenir. Eski sayfalar, eski tablolar ve eski yönetim paneli değiştirilmez. Yeni katalog yalnızca aura_v2_* tablolarını kullanır. Furni görüntüleri **sunum örneğidir**, AURA ürünleri değildir; sunum ürünleri teklif listesine eklenemez.

## Supabase kurulumu
1. Mevcut projenin erişilebilir olduğunu doğrulayın (inceleme ortamında API 502 verdi; kesin kök neden belirlenmedi). Pause, ağ, anahtar ve proje durumunu Supabase Dashboard'da kontrol edin.
2. `schema.sql` dosyasını Supabase SQL Editor'da çalıştırın. İşlem eklemelidir; legacy tablolarını değiştirmez. Yönetici üyeliği otomatik verilmez.
3. Supabase Auth içinde mevcut, güvenilir yöneticinin UUID'sini doğrulayın ve şemanın sonundaki açık `aura_v2_admins` kaydını yapın. Parolayı depoya koymayın. MFA tercih edin. Rastgele her authenticated kullanıcı yönetici değildir.
4. `assets/config.js` içindeki URL ve **public anon key** doğru projeyi göstermeli. Service-role anahtarı yalnızca Edge Function secret olarak kalır.
5. `2/functions` içeriğini Supabase projesinin `supabase/functions` dizinine, `setup/config.toml` işlev ayarlarını `supabase/config.toml` içine alın. `supabase functions deploy submit-inquiry`, `create-checkout`, `payment-webhook` komutlarıyla yayınlayın.
6. Secret değerleri: `AURA_ALLOWED_ORIGINS=https://auraproject.com.tr,https://www.auraproject.com.tr`; `AURA_RATE_SALT` rastgele uzun gizli değer; `AURA_INQUIRIES_ENABLED=false` başlangıçta. Supabase URL, anon ve service role Edge ortamında sağlanır. **Yasal veri sorumlusu, iletişim, saklama süresi ve KVKK/GDPR metinleri tamamlandıktan sonra** `AURA_INQUIRIES_ENABLED=true`, `AURA_PRIVACY_VERSION` sürümünü ayarlayın. `gizlilik.html` metninin kaynağı assets/app.js'dir.
7. /2/admin/ üzerinden giriş yapın. Kategorileri ve gerçek ürünleri ekleyin. Taslaklar halka görünmez; `published` açıkça seçilmelidir. Görseller için bağımsız aura-v2-images bucket'ı kullanılır. JPEG/PNG/WebP, dosya başına en çok 8 MB. Müşteri özel dosyaları bu public bucket'a yüklenmez.
8. Formu test verisiyle gönderin; referansın taleplerde görünmesini doğrulayın. Hata olduğunda müşteri sahte başarı mesajı görmez. WhatsApp alternatif gönderimi otomatik yapılmaz. Yönetici talepleri panelden kontrol eder; e-posta bildirimi bu sürüme bağlı değildir.

## Ödeme sınırı — şu anda kapalı
`paymentEnabled:false`. Bu sürüm kart bilgisi toplamaz, çalışan ödeme varmış gibi davranmaz. `create-checkout` ismine rağmen şu anda bir **yönetici sipariş taslağı oluşturma** işlevidir. Ürün fiyatlarını DB'den okur, adet ve para birimini doğrular, teslimat/vergi tutarı ve şartları kaydeder. `awaiting_approval` durumundan otomatik ödeme başlatmaz.

Ticari hesap ve ödeme kuruluşu seçildikten sonra yapılacaklar: PSP'nin resmî SDK/API'siyle sunucu ödeme oturumu oluşturma, müşteri tarafından teklif/teslimat/şart onayı, siparişi `awaiting_payment` durumuna geçiren yetkili sunucu işlemi, gerçek PSP webhook imza kontrolü, iade akışı ve muhasebe. Provider callback doğrulanmadan dönüş URL'sine bakıp sipariş ödenmiş sayılmamalıdır.

`payment-webhook` **doğrudan bir ödeme kuruluşuna bağlanmaz**. Gelecekteki güvenilir PSP adaptörü, doğruladığı başarılı ödemeyi normalize edip ayrı HMAC anahtarıyla iletir. Varsayılan kapalıdır. Anahtarlar `AURA_PAYMENTS_ENABLED=true` ve `AURA_WEBHOOK_SECRET` ancak gerçek adaptör ve müşteri onay akışı tamamlandıktan sonra açılır. İmza `HMAC-SHA256(secret, timestamp+'.'+rawBody)`, header `x-aura-timestamp` Unix saniye, `x-aura-signature` hex. İçerik: event_id, order_id, amount_minor, currency, status:'paid', payment_reference. SQL aynı event'i tekrar işlemez; para birimi/tutar ve sipariş durumunu doğrular. Sipariş durumlarının sonraki lojistik geçişleri mevcut sürümde otomatik değildir.

## Gizlilik / hazırlık
- /2 HTML sayfaları noindex,nofollow taşır; bu erişim kontrolü değildir.
- E-posta adresi uydurulmadı. Şu an iletişim formu ve mevcut WhatsApp numarası kullanılır; üretime geçmeden numarayı doğrulayın.
- Örnek görselleri özgün/izinli ürün ve proje fotoğraflarıyla değiştirin. Önceki işler tarih ve katkı açıklamasıyla sunulmalı.
- Form dosya eki almaz; kişisel dosyalar açık katalog deposuna yazılmaz.
- Talepler veritabanında yalnızca yetkili yöneticilere açıktır. IP yalnızca gizli salt ile özetlenmiş hız sınırlama kaydında, 1 saatlik pencerede tutulur. Aynı IP başına 5 deneme/saat; anonim uç nokta CAPTCHA sağlayıcısına bağlı değildir. Yoğun suistimal durumunda WAF/CAPTCHA eklenmeli.
- Kişisel veriler için saklama ve silme prosedürünü gerçek işletmeye göre tamamlayın. Bu dosya hukuki metin yerine geçmez.

## Dağıtım
Mevcut GitHub main→Natro FTP iş akışı /2 dizinini yükler. Setup ve Edge kaynaklarının HTTP'den okunmasını engelleyen `.htaccess` dosyaları eklenmiştir; sunucu Apache değilse karşılık gelen deny kuralları gerekir. Edge Functions FTP'de çalışmaz, Supabase'e ayrıca kurulmalıdır. Ana site dosyaları değişmez.

Yerel kontrol: `python -m http.server 8080 --directory aura`; /2/index.html. JS sözdizimi: `node --check 2/assets/app.js`. Test raporu: `VERIFICATION.md`.
