# Aura e-posta adresleri — Claude için uygulama notu

Tarih: 2026-10-20

Kullanıcı bu bilgilerin doğrudan main'e eklenmesini ve Claude tarafından işlenmesini istedi.

## Kullanılacak adresler

- Genel iletişim: **info@auraproject.com.tr**
- Tasarım ve proje iletişimi: **design@auraproject.com.tr**
- `tasarim@`, `desing@` ve `desinger@` kullanılmayacak; doğru yazım `design`.

## Doğrulanan kurulum

- Sağlayıcı: Aster Mail, ücretsiz hesap.
- Her iki adres Aster panelinde oluşturuldu ve etkin görünüyor.
- Bunlar iki bağımsız kullanıcı/posta kutusu değil, aynı gelen kutusuna bağlı takma adreslerdir.
- Alan adının yetkili DNS hizmeti Cloudflare; kayıt kuruluşu ve site barındırması Natro.
- Alan adı sahipliği TXT, MX (`mx.astermail.org`, öncelik 10), SPF ve DKIM kayıtları Cloudflare'a eklendi. Aster, alan adını etkin/doğrulanmış olarak bildirdi.
- DMARC TXT kaydı da eklendi: `v=DMARC1; p=quarantine; sp=quarantine; adkim=r; aspf=r; pct=100`. Dış adrese toplu rapor gönderimi tanımlanmadı.
- Harici bir posta sağlayıcısından uçtan uca gönderme/alma testi henüz yapılmadı. 'Test edildi' veya 'teslim garantili' denmemeli.

## Claude'un siteye işlemesi

- Genel iletişim alanlarında, uygun `mailto:` bağlantılarında ve iletişim metinlerinde `info@auraproject.com.tr` kullan.
- Tasarım/proje iletişiminde `design@auraproject.com.tr` kullan.
- Site formunun alıcı adresiyle gönderici kimliğini birbirinden ayır. Bir alıcı adresinin hazır olması otomatik gönderim altyapısının hazır olduğu anlamına gelmez.
- Aster ücretsiz hesabından siteye SMTP/API erişiminin çalıştığı doğrulanmadı. Bu adresleri yazmak için ücretli plana geçme, yeni sağlayıcı satın alma veya otomatik bildirim servisi kurma.
- Önce mevcut form/gönderim uygulamasını incele; otomatik gönderim gerekiyorsa eksik altyapıyı açıkça belirt. Salt `From:` adresi değiştirerek teslim edilebilirlik varsayma.
- Şifre, oturum bilgisi, API anahtarı ve diğer gizli bilgiler depoya eklenmeyecek.

Bu teslim yalnızca bilgi notudur; bu commit site kodunu veya canlı dağıtımı değiştirmez.
