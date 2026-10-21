# HACIM-01 / H1

Kapsam ve çalıştırma sırası: [rapor](../../knowledge/ai-egitim/HACIM-01-H1-RAPOR.md).

`languages.mjs`: dokuz dilde yazılmış cümle/yanıt aileleri ve malzeme adları.
`build.mjs`: gerçek sözlük ve motorla hedef üretimi; harici model/API yok.
`leakage.mjs`, `audit.mjs`: salt okunur sınav yakınlık denetimi; üreticide sınav girdisi yok.
`common.py`: ortak şemada, onaysız ayrı karantina. Eski birleşik satırlar/dışa aktarımlar değişmez.
`review.mjs`: yerel HTML inceleme; insan onayı çıkarmaz.

Varsayılan ürünler motor ağacına bağlıdır. Motor değişirse veri bayattır; yeniden üretip sonuçları inceleyin. Kaynak kilidini yalnız geçsin diye değiştirmeyin. Dokuz dilin tümü tasarımcı ve ana dil incelemesini bekler.
