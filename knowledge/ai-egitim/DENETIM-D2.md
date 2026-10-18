# Denetim D2 — SINAV-01B (PR #47) — 2026-10-18, Claude

**Karar önerisi: kabul.** PR #47 birleştirilebilir. SINAV-01B ana komut sınavıdır.

Doğrulanan: 400 kayıt, 400 farklı iskelet (sayılar çıkarılınca da); tr 240, en 60, diğer diller 16–20;
21 tür bağlamı, her biri ≥10 kayıt; olumsuz kayıtların hepsinde yasak var; ifade edilemeyen isteklerin hepsi
soru olarak işaretli; malzeme yasaklarının 33/51'i yuvasız, yuvalılar yuvanın önemli olduğu cümlelerde.
Donmuş test SHA-256 52e73a6d… tutuyor. `assets/` ve `score.mjs` değişmemiş.

Kör okuma: token sınırı nedeniyle 60 yerine rastgele 20 kayıt (tohum 7) okundu; 20/20 altın cevap uygun.
Kalan 40 kayıt uzman onayında okunacak.

Düzeltme (denetçi): dondurma ayrı manifestte olduğu için puanlayıcı "donmamış" diyordu. Kayıt kök
`FREEZE.json`'a eklendi; 01A'nın Windows yollu yinelenen kaydı çıkarıldı.

Ön taban (kural okuyucu, onaysız, test): tam doğru 0,277 · F1 0,375 · yasak ihlali 0,585 · soru doğruluğu 0,421.
Doğal dilde taban kalıp sınavına göre belirgin düşük; beklenen yön.

Sıradaki: uzman onayı (`uzman-onay-01b.csv`), ardından Aşama 2 — sunucu yapay zekâsının aynı sınavda ölçülmesi.
