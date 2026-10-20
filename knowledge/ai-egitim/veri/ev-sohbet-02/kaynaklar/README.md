# Kaynak atfı ve kapsam

Bu klasör Swiss Dwellings **v3.0.0** veri kümesinden seçilmiş 20 birimin geometri ve EV uyumluluk kayıtlarını içerir.

**Kaynak:** Matthias Standfest, Michael Franzen, Yvonne Schröder, Luis Gonzalez Medina, Yarilo Villanueva Hernandez, Jan Hendrik Buck, Yen-Ling Tan, Milena Niedzwiecka, Rachele Colmegna (Archilyse AG), 2023. *Swiss Dwellings: A large dataset of apartment models including aggregated geolocation-based simulation results covering viewshed, natural light, traffic noise, centrality and geometric analysis.* [Yayın ve veri](https://zenodo.org/records/7788422), DOI `10.5281/zenodo.7788422`.

**Lisans:** [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Lisans ve atıf her JSON'un `geometry` kaydında da bulunur. Her sohbet, ilgili kaynak dosyası ve kanonik JSON içeriğinin SHA-256'sı ile ilişkilidir (`sort_keys=True`, `ensure_ascii=False`); bu ham dosya byte hash'i değildir.

**AURA değişiklikleri:** önceki EV-QWEN-00D hattında konum/adres alanlarının dışlanması, birim bazında yerel başlangıç, metre→mm dönüşümü, semantik eşleme ve yaklaşık EV duvar ekseni/açıklık desteği. Bu klasör o dönüşümün seçilmiş fikstürüdür. EV-SOHBET-02'nin döndürme/öteleme, eksen düğümleme, kullanıcı kullanım onayı, önerilen kat/merdiven ve mobilya çözücü işlemleri sohbet kayıtlarında ayrı tutulur.

Kaynak ülkesi **İsviçre**, bütün seçilmiş kaynaklar **tek kat birimi**. Sohbetlerin BE/NL/DE/FR/TR ülkeleri kurgusal kullanıcı bağlamıdır; bu dosyalar o ülkelerde ölçülmüş konut veya kaynaktan gelmiş dubleks iddiası taşımaz. Görseller, lisanslı fotoğraf kopyası değil, bu geometrinin AURA çizimlerinden alınan ekran görüntüleridir.
