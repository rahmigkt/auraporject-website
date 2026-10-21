# Aşama 6 — kapalı sınav hazırlığı

120 özgün görev: 40 mobilya (9 dil, 5 Arapça), 40 ev/yerleşim, 20 tekstil, 20 zor durum. Mevcut eğitim planlarından kaynak kimliği alınmadı. Koordinat hedefi modelden istenmez; niyet ve kısıt gerçek motorla çözülür. FREEZE.json görev baytlarını ve motor kaynak ağacını kilitler; değişen kaynakta sessiz tekrar kullanım reddedilir.

Yeni puanlayıcı yalnız `tests/ai-eval/aura-sinav-01/score.mjs`; eski score.mjs değiştirilmedi. Canlı dış sözleşme `{reply,actions}` korunur. Geçersiz/ilgisiz eylem, sınırda kırpılma, yeni uyarı, ürün boyutunu değiştirme, koordinat uydurma ve yanlış dış JSON reddedilir. Eksik cevaplar 120 sabit paydada sıfırdır. Kısmi hedef ayrı puanlanır. Zor durum dil ipuçları yalnız mekanik ön elemedir, anlamsal/native değerlendirme değildir.

## Doğrulama

- `node tools/aura-sinav-01/build.mjs`: 120 kayıt; 100 olumlu gold motor denetimi geçti, 20 eylemsiz zor durum. Model yüklenmedi.
- `node tests/toparlama-sinav-check.mjs`: `{"tasks":120,"gold_engine_unit_cases":100,"assertion_groups":119,"model_run":false,"expert_review":"pending"}`.
- `node tests/toparlama-sinav-prompt-check.mjs`: `PASS 3 prompt contracts; expected/rubric mutation cannot leak to model; no inference`.
- İlk testte Arapça çok hedefli soruya İngilizce test cevabı verildiği için beklenen kısmi puan alınmadı. Test girdisi Arapçaya düzeltildi; puanlayıcı gevşetilmedi, son koşu yukarıdadır.
- İki model öncesi taslak silinmedi, `archive/draft-00` ve `draft-01` altında saklandı. Ölçü, kapı, isteme gold ipucu sızması, dil geçişi ve rubrik düzeltmeleri durum notlarında açıklandı.

## Açık kusurlar ve sınırlar

Uzman/native gold onayı yok. Qwen sınav koşusu yok. Ev/yerleşim/tekstil işlemleri motorda olsa da canlı sohbet istemi bu katmanlara henüz bağlı değil; ortak taslak istem canlı entegrasyonun tamamlandığı anlamına gelmez. CPU koşu planı aynı sınav klasöründe. Aday havuzunda 2.578 karantina kaydı, eğitim exportlarında 0 kayıt durumu değişmedi. Tüm depo testlerinin yeşil olduğu iddia edilmez: Aşama 1'in raporlu eski hataları açık. Aşama 5'in ölçülü Arap planı/meclis kaynağı eksikleri sürer. Assets/api/kök HTML/.htaccess ve eski score.mjs değişmedi; eğitim/ücretli servis/deploy yok.
