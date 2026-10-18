# Önkayıt — SINAV-01 (komut anlama)

Yazıldı: 2026-10-18, denetçi (Claude). Sonuçlar gelmeden önce kayda geçti; değişiklik ancak karar sahibinin onayıyla
ve tarihli bir ek olarak yapılır.

## Ölçülen şey

Bir müşteri cümlesi ve o anki aile/tür verildiğinde sistemin önerdiği eylem listesi (`set`, `delta`, `enum`,
`material`, `kind`, `family`, `drawers`, `seats`, `style`, `command`…). Görünür metin cevabı ölçülmez.

## Ölçütler (puanlayıcı: `tests/ai-eval/score.mjs`)

| Ölçüt | Tanım |
|---|---|
| Tam doğru | Beklenen bütün eylemler var, fazladan eylem yok, yasak eylem yok, soru gereken yerde hiçbir eylem yok. |
| P / R / F1 | Eylem düzeyinde kesinlik, duyarlılık ve F1 (mikro ortalama). |
| Yasak ihlali oranı | `forbid` taşıyan kayıtlarda en az bir yasak eylem üreten kayıtların oranı. **Olumsuzlama ve "taş ≠ renk" türü hatalar burada görünür.** |
| Soru doğruluğu | `clarify: true` kayıtlarda hiçbir eylem uygulamama oranı (belirsiz ve konu dışı istekler). |

Raporlar dil ve kategoriye göre ayrıca verilir. Resmi puan yalnız `approved` kayıtlarla hesaplanır.

## Sınav bileşimi (hedef)

- En az 500 kayıt. Dil: tr %60, en %15, kalan altı dil (de, fr, nl, da, es, it) birlikte %25 ve her dil en az 15 kayıt.
- Kategoriler: size, relative, material, color, part, kind, family, layout, negation, mixed, units, colloquial,
  ambiguous, offtopic, style. Her kategori her ailede en az bir kez; negation, mixed ve units her biri en az %8.
- Beş aile: seating, table, storage, kitchen, bath; hiçbiri %12'nin altında olmaz.
- Bölüm: `dev` %35, `test` %65. Aynı cümle kalıbının yalnız sayısı değişmiş kopyaları aynı bölümde kalır.

## Karar kuralları

1. **Taban:** Bugünkü kural okuyucu (`--system rules`) donmuş `test` bölümünde ölçülür. Bu sayı sonraki her
   sistemin karşılaştırma noktasıdır.
2. **Bir sistem "daha iyi" sayılır** ancak donmuş testte (a) tam doğru oranında taban +0,10 ya da daha fazla,
   (b) yasak ihlali oranında tabandan kötü değil, (c) hiçbir dilde tam doğru oranı tabanın 0,05'ten fazla altında
   değilse.
3. **Canlıya alma eşiği:** tam doğru ≥ 0,85, yasak ihlali ≤ 0,02, soru doğruluğu ≥ 0,90 (Türkçe ve İngilizce ayrı
   ayrı). Eşik altındaki sistem yalnız "öneri" modunda ve onay düğmesiyle çalışabilir.
4. **Kural okuyucu düzeltmeleri** yalnız `dev` hatalarından yapılır; düzeltmeden sonra `test` bir kez koşulur.
   `test` hatasına bakıp kural yazmak yasaktır; yapılırsa o test sürümü yanmış sayılır ve yenisi dondurulur.
5. **Model ince ayarı** ancak API sistemi 2. kuraldaki eşiği geçemezse ve en az 1500 onaylı eğitim kaydı varsa
   gündeme gelir.
