# EV-QWEN-00 — sentetik veri teslimi

Büyük veri çıktıları Git'e eklenmez. Tam üretim:

    python -m pip install -r tools/ev-plan/requirements.txt
    python tools/ev-plan/dataset.py --count 2200 --out outputs/ev-qwen-00
    node tools/ev-plan/convert.mjs outputs/ev-qwen-00 outputs/ev-qwen-00/sft

Üretici, test ve kullanım sözleşmesi `tools/ev-plan/common.py` içindedir. Kaynak
hashleri değişirse eski veriyle ölçüm yapılmaz. Üretim kodu, şema ve kural profili
üretim süresince sabit kalmalıdır. `origin/main` uzak main'in son fetch anıdır.

`examples/`: her aile için v0.2 tam kayıt. `viewer/`: mevcut ev.html için kayıplı,
kat başına v0.1 biçimli görünüm. Çok katlı bütün evin tek kaydı examples dosyasıdır;
viewer dosyaları katları birleştiren proje veya geri dönüşlü format değildir.
`review/`: yeni görev için 40 onaysız örnek. `sample-chat.jsonl`: küçük sohbet dilimi;
bütün eğitim kümesi veya insan onaylı veri değildir.

Kanıt manifestleri ve rapor, veri/araç hattı sonucu ile gerçek model başarısını ayırır.
Her dosya sentetiktir. Gerçek müşteri verisi, model ağırlığı veya API anahtarı yoktur.

SFT dönüştürücü proje kimliği/tohumu yok sayan geometri imzasıyla tekrarları çıkarır; aynı planın bütün dil ve düzenleme türevleri birlikte çıkarılır. Ham araştırma kayıtları denetim için korunur.
