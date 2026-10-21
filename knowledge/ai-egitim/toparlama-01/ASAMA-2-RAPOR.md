# TOPARLAMA-01 · Aşama 2: veri kataloğu

Dal `toparlama-2-katalog`; bağımlılık: Aşama 1 / PR #157. Motorun main'e gelen #156 sürümü tabana alındı; bu PR stüdyo kodu değiştirmez.

## Yapılanlar

[KATALOG.json](../KATALOG.json) ve tek sayfalık [KATALOG.html](../KATALOG.html): 32 veri/destek kümesi, 995 izlenen yapılandırılmış dosya. Her dosyanın Git blob byte'ı için SHA-256, kümenin dosya manifestinden hesaplanan toplu hash, birincil/destek rolü ve bilinen kusurlar var. Windows CRLF dönüşümü içerik kimliğini değiştirmez. Yeniden üretim: `python tools/toparlama/katalog.py`.

40 ev sohbeti ayrı kümelerde (20+8+4+4+4). 00C'nin Git'teki satırları, 00D'nin program örnekleri, eski sentetik veri örnekleri, sohbet-001, #69 pilot/stüdyo/geometri/onay paketleri, perde diyalogları, PERDE/TEKSTİL kaynakları, tarz adayları, metin denemeleri ve donmuş sınavlar katalogda. Viewer türevleri, kaynak plan fikstürleri ve araştırma tabloları ayrıca destek olarak sayılır; birincil örnek gibi çoğaltılmaz. Sınav kümesi yalnız araştırma/değerlendirme; eğitim dışıdır.

Dil×ülke×katman, durum ve lisans dağılımı tabloları var. Alanı olmayan dil/ülke/lisans tahmin edilmez; null/bilinmiyor kalır. Manifestte söylenen dış korpus büyüklüğü Git'te mevcut kayıt sayısına eklenmez. Kümeler birbirinin alt kümesi olabilir; toplamlar benzersiz proje sayısı değildir.

Durum dağılımı: eğitime hazır 0 küme; inceleme bekleyen 12 kümede 2.566 izlenen birincil kayıt, ayrıca sayısı bilinmeyen bir eksik kaynak; superseded 7 kümede 1.831 tarihsel birincil kayıt; yalnız araştırma 13 kümede 1.000 sınav kaydı. Destek tablolarında “eğitim kaydı” sayısı null. Bu etiketler toplu insan onayı veya model başarısı değildir.

## Doğrulama

`python tests/toparlama-katalog-check.py` → **PASS 32 groups; 995 Git-blob hashes; counts, completeness, tamper/count mutations, frozen-exam exclusion**. Dosya hash'i ve sayım bozulduğunda kontrolün reddettiği negatif testler var. Yerleşim sohbetleri 20/8/4/4/4 sayıldı. Eksik ProcTHOR sayısı null ve sınavın eğitim dışı durumu doğrulandı. HTML yapısı parse edildi, 32 açılır küme bölümü var, haricî script yok. `git diff --check` geçti.

`node tools/studyo-motoru/test.mjs` → **11/11 geçti**. Aşama 1'deki tam tarama farklı başlangıç sürümüne aittir; #156 sonrası bütün veri tekrarlarının geçtiği iddia edilmez. Bu PR sadece katalog eklediği için eski 52 iş tekrar çalıştırılmadı; Aşama 1'in açık test sorunları devam eder.

## Açık kusurlar / yapılamayanlar

- `tools/yerlesim-veri` henüz bu izlenen ağaçta yok. ProcTHOR'un 12.827/~5.000 sayıları teslim edilmiş veri diye yazılmadı; kayıt sayısı ve sürüm lisansı null. İş emrindeki Apache-2.0 beyanı özgün veri sürümünden henüz teyit edilmedi.
- ResPlan bu depoda eğitim adayı olarak içe alınmış değil; araştırma kaydında yayıncı lisansı var. Yokmuş gibi atlanmadı, mevcut bir eğitim korpusuymuş gibi de sayılmadı.
- Bütün kümeler için güncel motorda eylem geri oynatması, ana dil/üslup ve tasarımcı incelemesi bitmedi. Bu yüzden doğrudan `egitim-adayi` terfisi yapılmadı. Eski 40 örnek onayı yalnız hash'e bağlı kendi paketinin tarihsel onayıdır.
- Eski sentetik v1/v2 veri dizinleri bağımlı test ve rapor yolları nedeniyle bu aşamada yerinde `superseded` işaretlendi. Tam dizin taşıma/bağıl yol göçü henüz yapılmadı; silme yok. Çakışma sürümleri Aşama 1'de gerçek arşive alındı. Bu kalan taşıma işi unutulmuş veya bitmiş sayılmıyor.
- Bazı araştırma tablolarının dosya bazında lisansları bilinmiyor; koda ait lisans veriye devredilmedi. Bunlar eğitim girdisi olmayacak.

Eğitim, GPU, ücretli API ve dağıtım yok. Sonraki aşama tek biçim/dönüştürücüler; baştan bütün kayıtları geçerli saymak yerine güncel motor ve kaynak sınırıyla elemek gerekir.
