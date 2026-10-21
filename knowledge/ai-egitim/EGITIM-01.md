# EGITIM-01: ilk gerçek eğitim

21 Ekim 2026. Hazırlayan: Claude. Kullanıcı kararı: stüdyo işi bitti, eğitime geçiliyor.

**Kararlar (kullanıcı, 21 Ekim 2026):**
- Model Qwen3.5-9B.
- GPU sınırı 6 saat / 4 dolar.
- Perde ve halı yapay zekânın işinde kalır: asistan tür, kumaş, renk ve ölçü seçimini alıp projeye ekler (`tekstil` katmanı). Ürünün ayrıntılı tasarımı stüdyonun ev tekstili ailesindedir.

## Ne eğitilecek

Qwen, AURA'nın **ev projesi asistanı** olur. Kullanıcıyla kendi dilinde konuşur ve yalnız `{"reply", "actions"}` döndürür. `actions` stüdyo motorunun işlemleridir:
- `ev`: duvar, açıklık, oda, kat, merdiven;
- `yerlesim`: eşya türü, toplam ölçü ve kısıtlar;
- `aydinlatma`;
- `proje`.

Perde ve halı seçimi (`tekstil`) de asistanın işidir. Mobilya detayı stüdyonun işidir; asistan yönlendirir. Sistem istemi `tools/egitim/sistem.md`, işlem sözlüğü motordan otomatik gelir.

## Kapı: bir kayıt eğitime nasıl girer

`tools/egitim/derle.mjs` her çalıştırmada şunları denetler:
1. üreten tarafın dışındaki model "uygun" demiş (`inceleme/kararlar.json`, `inceleme/codex-kararlari.json`);
2. stüdyo motoru işlemleri **yeniden** çalıştırıp kabul ediyor;
3. sınavdaki 120 görevle aynı kullanıcı cümlesi yok;
4. mobilya detay işlemi yok.

Bölme ev ya da grup bazında yapılır; aynı evin kayıtları aynı tarafta kalır. Dev payı %10. Çıktı `outputs/egitim-01/` altına yazılır ve Git'e girmez.

## Bugünkü durum (ilk koşu)

| | Kayıt |
|---|---|
| Aday (eski sözleşme hariç) | 181 |
| Eğitime uygun | **51** (perde 34, Arapça 12, İtalyanca 4, Danca 1) |
| Düzeltilmeli | 47 |
| Ret | 82 |

`ev-plan-eu-00c` (2.400) ve `ev-plan-reel-00d` ret aldı. İkisi de eski sözleşmede: plan_program JSON'u, motor işlemi yok, kalıp cevaplar.

51 kayıt eğitim için yetmez. Kümeyi dolduracak işler:

| Kaynak | Beklenen | Durum |
|---|---|---|
| H1 ev projesi istekleri (#187) | ~1.800 (tekstil dahil) | C1b düzeltmesi, sonra Claude onayı |
| H4 yerleşim becerisi (G3 verisinden) | ~3.000 çözülen + ~1.200 "sığmıyor" | Codex dönüştürür, Codex denetler (Claude verisi) |
| 47 eski sohbet (C2) | 47 | Codex düzeltir, Claude denetler |
| H2 Avrupa sohbetleri | ülke başına 30 | Codex üretir |

**İlk eğitim eşiği (öneri):** H1 ve H4 onaylanınca, yaklaşık 4.000–5.000 örnekle. Sohbetler sonraki eğitimlere eklenir.

## Eğitim ayarı

Pilotta çalıştığı kanıtlanmış ayar (`QWEN-PILOT-01-RAPOR.md`, `tools/qwen-local/train_gpu.py`):
- Qwen3.5-9B, BF16 LoRA (rank/alpha 16);
- kiralık tek GPU (A40, 48 GB);
- loss yalnız yanıt tokenlarında;
- 2 tur.

**Maliyet:** A40 saatte yaklaşık 0,59 dolar. Pilot 196 örnek, 50 adımda 227 saniye sürdü ve toplam oturum yaklaşık 0,49 dolardı. 5.000 örnek × 2 tur yaklaşık 1.250 adım eder; tahminen 1,5–3 saat GPU, yani 1–2 dolar. **Sınır: 6 saat, en fazla 4 dolar** (6 × 0,59 ≈ 3,5 dolar + disk). Hangisine önce ulaşılırsa oturum kapatılır ve kaynaklar silinir.

## Ölçüm

Eğitimden önce ve sonra aynı sınav (`aura-sinav-01`, H5 ile ev projesi kapsamına uyarlanmış) kullanılır. Ölçütler:
- motorun kabul ettiği işlem oranı;
- kural ihlali;
- isteği karşılama;
- dil ve üslup.

Temel modelden iyi değilse yayına alınmaz.

## Sıra

1. **Codex:**
   - C1b (#187 kalan düzeltmeler);
   - C8 (`train_gpu.py` EGITIM-01 biçimi ve model yüklemeden CPU tokenizasyon/maske denetimi);
   - H4 (yerleşim verisini kısıt biçimine çevirmek);
   - C7 (Claude verisini denetlemek);
   - H5 (sınav temel ölçümü, CPU).
2. **Claude:** H1 ve H4 kararlarını vermek; `derle.mjs` ile kümeyi derlemek; sınav puanlayıcısını yeni biçime bağlamak.
3. **Kullanıcı:** Eğitimi başlatma onayı. Model Qwen3.5-9B ve 6 saat / 4 dolar sınırı zaten verilmiştir (#201).
4. Eğitim (Codex altyapısı, kiralık GPU). Ardından sınav ve rapor.

Güncel tek iş sırası `GOREVLER.md` içindedir. C8 CPU girişi ve ölçümleri: `tools/qwen-local/EGITIM-01-CPU.md`. Beş örneğin asistan JSON/EOS maskeleri doğru; ek 49 train denetiminde beş eski ev sohbeti 4096 token sınırını aşıyor (22102–35511). Kırpma yapılmadı. Bu bağlam engeli G9'da çözülmeden ve eğitim kapıları açılmadan GPU başlatılmaz; CPU denetimi eğitim yapılmış sayılmaz.
