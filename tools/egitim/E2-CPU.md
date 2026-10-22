# E2: yerel CPU süzme kuru koşusu

Teslim dalı E1 taslak PR #261 ve kabul düzeltmeleri PR #262 üzerine kuruludur; `main`e merge veya canlı siteye yayın değildir. Gerçek üretim ilk E1 tabanındaki `05f5412` koduyla tamamlandı; bu kod ayrı Git referansı ve kaynak baytlarıyla korunur. Çalışan motor ve E1 puanlayıcı değiştirilmez. H5 sınavı yeniden çalıştırılmaz. `ornekle.py` eğitim/optimizer içermez.

## Veri ve model sınırı

H1'in 1.800 isteğinin tamamı mevcut EGITIM-01 train/dev bölmelerindedir (1.710/90). Bu geliştirme koşusu hem train hem dev'i dışlar; H1'den kullanılabilecek yeni kayıt sayısı sıfırdır. Bölmeyi bozmak yerine 10 ayrı ProcTHOR kaynak ev grubunun H4 odalarından 20 yeni Türkçe istek hazırlanır. H4'ün eski hedefleri veya eğitim onayı devralınmaz: yeni hedefler mevcut motorda yeniden doğrulanır ve karantinadadır. İstekler yalnız berjer yerleşimi ve ışık sıcaklığı alt kapsamındadır; bütün ev projesi yeteneği ölçümü değildir.

İki kapalı sınav dosyasına karşı normalize edilmiş kullanıcı metni ve tam plan eşleşmesi dışlanır. Bu kontrol bütün anlamsal benzerlikleri veya bütün veri kümelerinin soy ağacını çözmez. Kaynak ev grupları, kaynak satır SHA'ları, sınav dosyaları, train/dev ve H1 kaynak dosyaları protokolde sabitlenir. Beklenen hedefler `tasks.jsonl` dosyasında yalnız puanlayıcıya verilir; `prompts.jsonl` yalnız sistem, durum ve kullanıcı isteğinden oluşur.

Yerel Qwen3.5-0.8B Q8_0, AURA eğitimi yapılmamış kontrol modelidir. Gerçek üretici `Qwen3.5-0.8B-untrained-CPU` olarak yazılır. İş emrindeki gelecekteki `Qwen-EGITIM-01` üreticisiyle aynı sayılmaz. AURA9B veya bir adaptörün başarısı hakkında sonuç çıkarılmaz.

## Dondurulan koşul

20 istek × 4 ham örnek; temperature 0,8; top_p 0,95; top_k 40; her istek için aynı dört önceden belirlenmiş seed; en çok 512 üretim tokeni. Şema zorlaması, JSON onarımı, başarısız yanıtı tekrar üretme, yanıt seçimine göre istem/ayar değiştirme yoktur. Bütün denemeler, kesilmeler ve aktarım hataları günlüğe yazılır. CPU sunucusu yalnız 127.0.0.1'e bağlanır; GPU aygıtları ve katman aktarımı kapalıdır, offline modu kullanılır. Çalışan işi çoğaltmayan dosya kilidi vardır.

Hazırlık gerçek `egitim01_features.prepare_features` yolunda 20 istemin üretim öneki, EOS ve loss maskesini doğrular; model sunucusunun `/tokenize` sonucu aynı 20 istemin yerel tokenizer token kimlikleriyle bire bir karşılaştırılır. Kaynak, gerçek çalışma dosyaları, bölücü, 26 CPU bileşeni, protokol ve model hash'leri başlangıçta ve sonda denetlenir. Çalışan protokol/kodu değiştirmek yerine yeni sürüm gerekir. Tamamlanmış koşu tekrar başlatılamaz.

## Seçim ve denetim

`score` E1'in **aynı** `puanla.mjs` CLI'sini kullanır. Bir yanıt ancak E1 `mechanical_candidate` kapısından geçip alt puanı en az 4/6 ise aday olabilir. Eşik örneklemeden önce seçildi: altı bileşenin dördü mekanik olarak geçmeli; herhangi bir makine ret/kesilme/aktarım hatası adaylığı engeller. Dil ve dürüstlükte çözümlenmemiş inceleme puan üretmez. Bu eşik kapalı sınavla veya bu koşunun sonuçlarıyla ayarlanmadı.

Her istekte en yüksek puanlı aday seçilir; eşitlikte en erken örnek seçilir. Uygun örnek yoksa istek `hard-requests.jsonl` listesine alınır. Seçilen yanıtlar `candidates.jsonl` içinde karantinadadır, eğitim onayı false kalır. Seçim; anadil, gerçeklik, tasarımcı, üretim veya eğitim onayı değildir. İnsan/Codex incelemesi ayrıca ham yanıt ve kaynak/çıktı SHA'sına bağlanır; bağımsız Claude incelemesi gibi sunulmaz. Bu araç onaylanan veriyi train/dev'e otomatik eklemez.

`tests/egitim-ornekle-check.py` gerçek model kullanmadan 80 yapay denemede seçim, başarısız istek listesi, eşitlik, karantina, üretici doğruluğu ve protokol/günlük değişikliği reddini sınar. Testte dosya doğrulamasının yalnız yerel test double'ı vardır; üretim CLI'sinde bypass anahtarı yoktur.

## Üretim ölçeği ve maliyet

İş emrindeki daha sonraki ölçek 2.000 istek × 8 örnek = 16.000 yanıttır. Güncel araç `--samples 4` veya `--samples 8` destekler (varsayılan 8); iki seçim yolu 80/160 yapay denemeyle sınanır. Gerçek koşu yalnız 20×4 CPU prototipidir; eğitilmiş 9B checkpoint'i, gerçek k=8 üretimi, aday onayı ve yeniden eğitim devreye alınmaz. Gerçek 9B gecikmesi ölçülmeden 0.8B CPU hızından 9B süresi/ücreti çıkarılamaz.

## Yerel koşu ve sayaç düzeltmesi

Üretim kodu `05f5412`, 80 özgün yanıtı ve sunucunun bütün durma meta verisini korudu. İlk kesilme sayacı `stop_type=limit` alanını atladığı için sıfır yazıyordu. Son denetimde 11 token-sınırı kesilmesi, sıfır bağlam kesilmesi doğrulandı. Özgün `predictions.jsonl`, `PROTOCOL.json`, `RUN-COMPLETE.json` ve ilk `SCORES.json` değiştirilmedi. Ayrı `termination-audit.json`, `audited-scores.jsonl` ve `AUDIT.json` sonlandırma hesabının doğru kaydıdır. Gelecek üretici düzeltildi ve yedi olumsuz/olumlu durma testi eklendi; bu yeni kodla aynı koşu tekrar üretilmedi.

Eski üreticinin beş kaynak dosyası protokoldeki gerçek bayt SHA'larıyla `frozen-source` altında saklandı; son denetim bunları Git `05f5412` içeriğiyle de karşılaştırır. Güncel puanlayıcı aynı kaldı, motor/model/tokenizer/26 CPU bileşeni ve bütün girişler tekrar doğrulandı. Kesilme düzeltmesi aday seçimini değiştirmedi: 49/80 katı JSON sözdizimi, 4/80 dış sözleşme, 0/80 istek başarısı, sıfır aday, 20 zor istek. Bu modelin başarısı değildir; başarısız veriyi eğitime sokmayan boru hattı kanıtıdır.

9B için hesap: `süre_saat = 16000 × ölçülen_saniye/yanıt ÷ 3600`; `ücret = süre_saat × doğrulanmış_saatlik_ücret`. Kurulum/inceleme/tekrar ve depolama ayrıca değerlendirilir. Bu çalışmada 9B hızı ve ücretli donanım fiyatı ölçülmediği için parasal tahmin sayısı uydurulmaz; ücretli kaynak başlatılmadı. Fiilî CPU koşusunun süre/token dağılımı sonuç raporunda ayrıca verilir.
