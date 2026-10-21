# Ölçülü Arapça referans çalışması

Eğitim veya model çalıştırmaz. `build.py` yalnız mevcut, kaynaklı tek seviye planları okur; `place.mjs` üretim çözücüsünü çağırır. Sekiz turluk metinler `cases.py` içinde yazılıdır. Önceki ölçüsüz ön görüşmeler değişmez.

```text
python tools/ev-arap/olculu/build.py
python tools/ev-arap/olculu/review.py
node tests/ev-arap-olculu-check.mjs
python tests/ev-arap-olculu-geometry-check.py
```

Python için mevcut Shapely bağımlılıkları gerekir. `qa.cjs` ayrıca Playwright ve Chrome ile yalnız yerel inceleme HTML'ini açar; site veya model çağrısı yoktur. Oluşturucular çalışma kopyasındaki üretilmiş dosyaları yeniler; arşiv ve eski ön görüşmeleri değiştirmez.

Koordinatlar yalnız solveRoom çıktısından gelir. Bağımsız denetimden geçen ilk gerçek alternatif seçilir; başarısız seçenekler de saklanır. Kaynak istisnası ve kısmi ev kapsamı eğitim onayı değildir. `native_motor` yalnız işlem sözleşmesi denetimidir; seçilen ham alternatifle native koordinat eşliği kanıtlanmış değildir.

Kaynak özeti: `solver.sha256`, özgün Windows kanıtını korumak için UTF-8 metnin satır sonları CRLF'ye sabitlendikten sonraki SHA256 değeridir. LF veya CRLF checkout aynı değeri verir; yerleştirme testi iki biçimi de sınar. Diğer dosya/fixture SHA değerleri kendilerinde belirtilen bayt veya canonical JSON yöntemini kullanır.

`byte-tekrar.json` ikinci oluşturmadaki 39 dosyanın birebir eşitliğini kaydeder. Kaynak veya çıktı değişirse kanıtı sessizce kabul etmeyin; yeniden denetleyin. Birleştirme ve eğitim için ayrıca kullanıcı kararı gerekir.
