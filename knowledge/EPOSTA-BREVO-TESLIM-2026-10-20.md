# Brevo canlı gönderim — teslim doğrulandı

Tarih: 2026-10-20. Bu not önceki EPOSTA-SUNUCU-DURUM-2026-10-20.md belgesindeki gönderim engelinin çözümünü kaydeder.

- Kullanıcı API anahtarı oluşturmayı, Natro'ya koymayı ve test gönderimini açıkça onayladı; Brevo e-posta doğrulamasını kendisi tamamladı.
- `auraproject.com.tr` Brevo'da Authenticated; `AURA <info@auraproject.com.tr>` Verified.
- Cloudflare'a Brevo doğrulama TXT ve iki DKIM CNAME kaydı eklendi (DNS only). Aster MX, SPF, DKIM ve mevcut quarantine DMARC korunmuştur. Brevo mevcut DMARC'ı kabul etti; ikinci SPF/DMARC oluşturulmadı.
- Anahtar yalnız Transactional email kategorisine izin veren Restricted anahtardır; bu kategoride Brevo gönderim, şablon yönetimi, engelleme ve günlük silme yetkilerini birlikte sunuyor. Başka kategorilere erişim verilmedi. Son kullanma: 2027-10-20; 90 gün kullanılmazsa ayrıca sona erebilir.
- Anahtar yalnız Natro `api/forma-secrets.php` dosyasına `mail_api_key` olarak eklendi; `submit_enabled=true`. İmza anahtarı ve özel proje dizini korundu. Hiçbir anahtar Git'e veya bu nota yazılmadı.
- Gerçek canlı stüdyo `/tasarla.html` üzerinden bir örnek koltuk projeye eklenerek test edildi. Ad: `AURA teknik gönderim testi`; notta gerçek müşteri/sipariş olmadığı açıkça belirtildi; müşteri kopyası alıcısı `info@auraproject.com.tr` seçildi.
- Stüdyo sonucu: **Gönderildi**, proje **F261020-134008-ae1c60**.
- Aster'de aynı proje numaralı **design@ proje bildirimi** ve **info@ müşteri onay kopyası** ayrı ayrı görüldü. İkisi Aster'in **İndirimler** sekmesine teslim edildi; spam'e düşmedi.
- Paket indirme bağlantısının ve gönderilen PDF'in ayrıca açılma testi bu teslimde yapılmadı.
- Ücretli plan veya ek hizmet satın alınmadı. PHP mail() kullanılmıyor; mevcut HTTPS Brevo yolu çalışıyor. Natro Remote Mail Exchanger ayarı değiştirilmeden bu test başarıyla teslim edildi.

Sitenin e-posta adresleri değişmiyor: genel iletişim info@auraproject.com.tr, tasarım/proje design@auraproject.com.tr.
