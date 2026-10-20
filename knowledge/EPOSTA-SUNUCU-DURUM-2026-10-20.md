# Natro otomatik posta — doğrulanan durum (2026-10-20)

Kullanıcı canlı gönderim hazırlığını onayladı. Site koduna bu çalışmada dokunulmadı.

## Tamamlananlar

- Canlı site kökü: `/home/u2768844/auraproject.com.tr/public_html`.
- Web kökü dışında `/home/u2768844/auraproject.com.tr/aura-projeler` oluşturuldu, izin 0700 olarak ayarlandı.
- Canlı `api/forma-secrets.php` oluşturuldu, izin 0600 olarak ayarlandı. Alıcı `design@auraproject.com.tr`, gönderen `info@auraproject.com.tr`, özel proje dizini ve kriptografik rastgele imza anahtarı tanımlandı. Anahtar yalnız sunucudadır; bu belgede veya Git'te yoktur.
- Ayarlar geçici olarak etkinleştirildiğinde GET `/api/forma-submit.php` yanıtı `{"available":true}` oldu: yol ve yazma koşulları sağlandı.

## Doğrulanan engel

Aynı ayar dosyasında yalnız `submit_enabled` değeri geçici olarak `function_exists('mail')` yapıldığında aynı uç nokta `{"available":false}` döndü. Bu ortamda PHP `mail()` işlevi kullanılamıyor. Main'deki `api/forma-submit.php` doğrudan bu işlevi çağırıyor.

Bu nedenle son durumda `submit_enabled` açıkça **false** bırakıldı. Gerçek gönderim ve alıcı teslim testi yapılmadı. Mevcut yerel paket indirme alternatifi kullanılmalı.

## Henüz yapılmayanlar ve sonraki iş

- SPF'ye Natro IP'si eklenmedi. cPanel paylaşımlı IP'si 94.73.150.132; bunun gerçek posta çıkış IP'si olduğu doğrulanmadı. PHP mail işlevi yokken yalnız bu IP'yi eklemek gönderimi çalıştırmaz.
- cPanel ana menüsünde e-posta yönlendirme/Mail Exchanger aracı yok. Remote ayarı bulunamadı ve değiştirilmedi; mevcut yönlendirmenin local olduğu da doğrulanmadı. Natro'nun ayrı yönetiminden veya desteğinden öğrenilmeli.
- SMTP veya işlem e-postası API'si destekleyen gönderim yolu eklenmeli; sağlayıcı/hesap ve gerçek kimlik bilgileri henüz seçilmedi. Kullanıcı ücretsiz/düşük maliyet tercih ediyor; ücretli hizmet satın alınmadı.
- Posta sağlayıcısı belirlendikten sonra gereken SPF/DKIM kayıtları mevcut Aster kayıtları korunarak düzenlenmeli. Birden fazla SPF kaydı oluşturulmamalı.
- Teslim testi ve hata davranışı doğrulandıktan sonra `submit_enabled` açılmalı. `mail()` çağrısını başarılı varsaymak veya yalnız `From` değiştirmek çözüm değil.

Aster'deki `info@` ve `design@` takma adresleri etkin kalıyor; bu engel sitenin otomatik gönderim yoluyla ilgilidir.
