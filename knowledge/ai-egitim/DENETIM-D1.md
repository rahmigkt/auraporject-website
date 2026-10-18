# Denetim D1 — SINAV-01 teslimi (PR #44, 77cce55) — 2026-10-18, Claude

## Karar önerisi

**Altyapı kabul, sınav kısmen kabul.** PR #44 birleştirilebilir; ama bu sınav "SINAV-01A — kalıp sınavı" diye
adlandırılmalı ve önkayıttaki ana sınavın yerini tutmaz. Gerçek müşteri dilini ölçen ana sınav için SINAV-01B
iş emri önerildi.

## Doğrulananlar (geçti)

- `assets/` ve `score.mjs` değişmemiş; yalnız `tests/ai-eval/` ve `knowledge/ai-egitim/` dosyaları.
- Şema hatası yok; donmuş test dosyasının SHA-256'sı tutuyor (232f7b09…); `.gitattributes` ile satır sonu sabit.
- Bileşim oranları önkayda uyuyor: 600 kayıt; tr 360, en 90, diğer altı dil 25'er; aileler 120'şer; dev 210 / test 390.
- Bütün olumsuz kayıtlarda `forbid` var. Altınlar söz dağarcığı dışına çıkmıyor (üretici bunu ayrıca denetliyor).
- Raporun sayıları rapor JSON'uyla aynı; denetçinin bağımsız koşusu aynı sonucu verdi:
  test tam doğru 0,459 · F1 0,517 · **yasak ihlali 0,815** · soru doğruluğu 0,389 (ön skor).
- Dev/test ayrımı kalıp grubuna göre yapılmış; aynı kalıbın kopyaları iki tarafa düşmüyor. Doğru.
- Uzman onay CSV'si ve içe aktarma aracı çalışıyor; onaylar ayrı dosyada tutuluyor.

## Bulgular

**B1 — Çeşitlilik çok düşük (ana sorun).** Kayıtlar `build-sinav-01.mjs` ile 24 kalıptan üretilmiş. 600 kaydın
yalnız 327'si farklı metin; sayılar ve "lütfen / rica etsem" çıkarıldığında **195 farklı iskelet, Türkçede 75**.
Her ailede sayılar yalnız üç değer (180/190/200 cm, mutfakta 60/65/70). Yazım hatası, kısaltma, devrik cümle,
dolaylı anlatım ("salon küçük, sığsın"), birden fazla parça adı neredeyse yok. Önkayıttaki "gerçek müşteri gibi"
şartı karşılanmadı. Bu sınav kalıpları ölçer; bir sistem kalıplara uyarak yüksek puan alabilir.

**B2 — Bağlam tek tür.** Her ailede yalnız varsayılan tür var: kanepe, yemek masası, büfe, düz mutfak, lavabo
dolabı. Gardırop, komodin, ada, ayna, boy dolabı, sehpa, berjer bağlamı hiç yok.

**B3 — Yasak kalıpları fazla dar.** "meşe istemiyorum" için yasak yalnız `slot: case`. Sistem meşeyi kapaklara
uygularsa ihlal sayılmaz. Malzeme yasakları yuva belirtmeden yazılmalı (her yuvada yasak).

**B4 — Düzen kayıtları bedava puan.** `layout` kayıtlarında beklenen eylem yok ve soru da istenmiyor; hiçbir şey
yapmayan sistem tam puan alıyor. Bu kayıtlar ya `clarify: true` olmalı ya da puana katılmamalı.

**B5 — Yabancı dil cümleleri yapay.** Hepsi "Breite: …" gibi etiket ön ekiyle başlıyor; gerçek bir kullanıcı böyle
yazmaz. Diller arası karşılaştırma için zayıf.

**B6 — Küçük:** `FREEZE.json` aynı dosyayı Windows yoluyla ikinci kez listeliyor (zararsız; puanlayıcı Linux yolunu
kullanıyor). İngilizce "Slightly increase the width a little" gibi doğal olmayan cümleler var.

## Kör ikinci okuma

Kalıp üretimi olduğu için okuma kalıp düzeyinde yapıldı: 24 Türkçe kalıp × 5 aile, İngilizce 6 kalıp ve Almanca
5 kalıp. Altın cevaplarda içerik hatası bulunmadı; uyum B3 ve B4 dışında tam. Ancak 60 bağımsız kayıtlık örnek
okuması anlamlı değil, çünkü kayıtlar bağımsız değil.

## Taban hakkında not

Kural okuyucunun en büyük açığı doğrulandı: **olumsuz isteklerin %81,5'inde yasak eylemi uyguluyor.** Bu sayı kalıp
sınavından gelse de yön olarak güvenilir; D0'daki gözlemle aynı.

## Sonraki adım

`CODEX-IS-EMRI-SINAV-01B.md`.
