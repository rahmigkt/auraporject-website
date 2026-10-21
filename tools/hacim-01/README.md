# HACIM-01 / H1

Kapsam ve çalıştırma sırası: [rapor](../../knowledge/ai-egitim/HACIM-01-H1-RAPOR.md).

`languages.mjs`: dokuz dilde yazılmış cümle/yanıt aileleri ve malzeme adları.
`build.mjs`: gerçek sözlük ve motorla hedef üretimi; harici model/API yok.
`leakage.mjs`, `audit.mjs`: salt okunur sınav yakınlık denetimi; üreticide sınav girdisi yok.
`common.py`: ortak şemada, onaysız ayrı karantina. Eski birleşik satırlar/dışa aktarımlar değişmez.
`review.mjs`: yerel HTML inceleme; insan onayı çıkarmaz.

`refresh_legacy.mjs`, `refresh_arabic.py`: eski kaynakları arşivleyip güncel çözücü çıktılarını doğrular; metin/ölçü değiştirmez. `revalidate_common.py`: commit edilmiş kaynakların mevcut 64 sohbet izdüşümünü, eski bölümleri koruyarak yeniler. `revalidate_exam.mjs <eski-kaynak-kopyası>`: 100 eski/yeni altın hedefi karşılaştırır; yalnız yerleşim çıktı farkına izin verir, görev baytını ve puanlayıcıyı değiştirmez. Bu bakım araçları sıradan komut üretme zincirinden ayrıdır; arşivler başka durumla ezilemez.

Varsayılan ürünler motor ağacına bağlıdır. Motor değişirse veri bayattır; yeniden üretip sonuçları inceleyin. Kaynak kilidini yalnız geçsin diye değiştirmeyin. Dokuz dilin tümü tasarımcı ve ana dil incelemesini bekler.
