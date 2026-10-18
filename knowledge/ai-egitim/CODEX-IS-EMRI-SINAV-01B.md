# Codex iş emri önerisi — SINAV-01B: doğal dil ana sınavı

Hazırlayan: denetçi (Claude), 2026-10-18, D1 sonrası. Öneri niteliğindedir.

## Ön koşul

PR #44 main'e birleştirilmiş olmalı. Mevcut dosyalar **SINAV-01A (kalıp sınavı)** olarak kalır, donmuş haliyle
değişmez; yalnız raporun başlığına "01A — kalıp sınavı; ana sınav değildir" notu eklenir. Dal: `main`'den
`codex/aura-ai-sinav-01b`.

## Ne değişiyor (D1 bulgularına göre)

1. **Üretici yok.** Kayıtlar tek tek yazılır; kalıp + sayı değiştirme yasak. Bir cümle iskeleti (sayılar ve nezaket
   sözleri çıkarılınca) sınavda en çok 2 kez geçebilir. Teslimde bunu ölçen küçük bir denetim betiği olsun
   (`tests/ai-eval/iskelet.mjs`): farklı iskelet oranı ≥ %90.
2. **Gerçek müşteri dili:** yazım hataları ve Türkçe karakter eksikliği ("mese", "cekmece"), kısaltma, devrik
   cümle, dolaylı istek ("salon dar, sığsın", "çocuk var köşeler sivri olmasın"), birden fazla parça, önceki
   seçime gönderme ("az önceki rengi geri al"), birimsiz sayı ("120 olsun"), aralık ("170-180 arası").
   Sayılar her kayıtta farklı olsun ve aralıkların içinde gerçekçi değerler kullanılsın.
3. **Bağlam çeşitliliği:** her ailede her tür en az 8 kayıtta bağlam olsun (kanepe, ikili, berjer; yemek masası,
   sehpa, yan sehpa, konsol, çalışma masası; gardırop, komodin, şifonyer, makyaj masası, TV ünitesi, kitaplık,
   vitrin, büfe; düz mutfak, ada; lavabo dolabı, boy dolabı, ayna).
4. **Yasaklar yuvasız:** malzeme yasakları `slot` belirtmez (`{"type":"material","key":"species","value":"oak"}`),
   böylece her yuvada yasak olur. Yuva önemliyse ("kapaklar meşe olmasın, gövde olabilir") ayrıca yuvalı yazılır.
5. **İfade edilemeyen istek:** `clarify: true` ve `gold.unsupported` birlikte. Hiçbir şey yapmayan sistem bunlardan
   "soru doğruluğu" ile puan alır, "tam doğru"ya karışmaz (puanlayıcıda bu ayrımı denetçi yapacak).
6. **Yabancı diller doğal:** etiket ön eki yok; her dilde en az 10 farklı niyet. Anadil denetimi yoksa `notes`'a yaz.

## Bileşim

- En az 400 kayıt; tr %60, en %15, kalan altı dil %25 (her dil ≥ 15).
- Kategori, aile ve bölüm oranları `ONKAYIT-SINAV-01.md` ile aynı; dev %35 / test %65, iskelet bazında ayrım.
- Dosyalar: `sinav-01b-dev.jsonl`, `sinav-01b-test.jsonl`; test donar (`FREEZE.json`, yalnız Linux yolu).

## Yapma

01A dosyalarını, `assets/`, `score.mjs`, önkayıt ve denetim dosyalarını değiştirme. Kural okuyucuya bakarak altın
yazma; altınlar tamamlanınca bir kez koş.

## Teslim

İki sınav dosyası, `iskelet.mjs` ve çıktısı, `uzman-onay-01b.csv`, iki rapor JSON'u, `RAPOR-SINAV-01B.md`.
D2'de denetçi 60 rastgele kaydı kör okuyacak (uyum ≥ %90), iskelet oranını ve bağlam dağılımını yeniden ölçecek.
