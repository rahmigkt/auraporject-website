# Birleşim verisi — ilk kaynaklı referans

19 Ekim 2026 · ATOLYE-CODEX-02 / iş 1. Veri: [veri/birlesim.json](veri/birlesim.json).

13 kayıt; kör/geçme zıvana, kırlangıç, kavela, DOMINO 5/6/8/10/14, Lamello,
Minifix ve Konfirmat kapsanır. Rastex yalnız ayrı SKU örneği olarak bulunur.
Bu bir standart/taşıma kapasitesi tablosu değil, kaynaklı başlangıç verisidir.

Eş kalınlıklı zıvanada T/3 öğretici oranı [WOOD'un kendi anlatımına](https://www.woodmagazine.com/woodworking-tips/techniques/joinery/mortises-tenons)
ve DOMINO için [FAU üniversite atölyesindeki yaklaşık kurala](https://fablab.fau.de/tool/holzbearbeitung/duebelfraese/)
bağlandı. 3×d stok örnekleri **üretici minimum kalınlığı değildir**. Yük, lif ve geometri
bu oranı değiştirebilir. [Veritas](https://www.leevalley.com/en-us/shop/tools/hand-tools/marking-and-measuring/marking-accessories/49424-veritas-dovetail-saddle-markers)
kırlangıç eğimlerini destekler; otomatik kuyruk sayısı/derinliği türetilmedi.

Üretici katalogları/SKU sayfaları JSON'da URL + bölümle izlenir. Konfirmat için
[Häfele'nin gerçek delik çizimi](https://files.hafele.co.uk/catalogfiles/www/105-61.pdf)
5 mm pilot / 7 mm geçiş / 10 mm havşa ayrımını destekler. Minifix B=24/34 bir
yerleşim ölçüsüdür; kenara güvenli minimum değildir. Rastex ile Minifix karıştırılmaz.
Lamello tarihsel katalog özeti indeks üzerinden okunabildi; doğrudan PDF doğrulaması
404 verdiği için kayıtta yeniden doğrulama şartı var. Konum toleransı ±1 mm, tutkal
geçme toleransı olarak kullanılmaz.

Kaynağı doğrulanmayan minimum kenar mesafesi, delik derinliği ve geçme toleransı
**null** bırakıldı; sıfırla doldurulamaz. Farklı malzeme/tutkal/vida ve yük şartları
için evrensel tek değer yoktur. Hangi SKU/kalınlık/derinlik kombinasyonlarının güvenli
olduğu, satın alınacak donanımın güncel teknik çizimiyle tamamlanmalıdır.

CNC alanları üretilebilirliğin koşullarını belirtir. D/2 yalnız kesici geometrisi
çıkarımıdır; dik iç köşe için ayrı işlem/yuvarlatılmış zıvana gerekir. Lamello disk
yarığı, düz cep değildir; kırlangıçta takım erişimi ve alttan kesme kontrolü gerekir.
Hiçbir kayıt otomatik üretim onayı taşımıyor; Claude eksik alanlarda soru sormalı.

Kontrol: JSON ayrıştırma, benzersiz kimlikler, bütün source_ids referansları ve
beş DOMINO kalınlığının kapsandığı doğrulandı. assets veya canlı site değişmedi.
