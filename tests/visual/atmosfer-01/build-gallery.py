"""Build the review page from actual fixtures and completed render artifacts."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[3];page=root/'knowledge/atmosfer/ornekler.md';frames=page.parent/'kareler'
fixtures=json.loads((root/'tests/visual/atmosfer-01/designs.json').read_text(encoding='utf-8'))
previous='https://github.com/rahmigkt/auraporject-website/blob/f2fe9dc672ae4ffae6cc2da07d9863e0c3eabd9b/knowledge/atmosfer/kareler/'
lines=['# ATMOSFER-01 · main #61 sonrası yeniden çekim','','Yeni sahneler güncel çizim motoruyla yeniden üretildi: dama zemin yok, açık kireç sıva, ürüne göre oda, dikeyleri paralel tutan 55 mm kaydırmalı kamera. Yatak odası takımı kaldırıldı; son iki örnek Dolap (`storage/wardrobe`) ailesidir. Bu iki satırın önceki karesi eski takımı gösterir, aynı ürün karşılaştırması değildir.','','Yeni raster **2400×1600**; deneysel Vulkan **800×534 / 16 örnek**; CPU Cycles/OIDN genel ve yakın planlar **2400×1600**. Önceki 18 Ekim rasterları sabit commit bağlantısıyla korunur. Ton eşleme ve örnek farkları açıkça etiketlenir; görsel onay karar sahibinindir.','','| Tasarım | Önceki raster · 18 Ekim | Yeni raster | Yol izleme · deneysel | Cycles · CPU/OIDN |','|---|---|---|---|---|']
def local(name,label):
 assert (frames/name).is_file(),name
 return f'![{label}](kareler/{name})'
for f in fixtures:
 i=f['id'];old=f.get('previousId',i);label=i+(' · yeni Dolap tasarımı' if 'previousId' in f else '')
 lines.append('| '+label+' | '+f'![Önceki {old}]({previous}{old}-final.jpg?raw=true)'+' | '+' | '.join(local(i+suffix,label) for suffix in ['-final.jpg','-path.jpg','-cycles.jpg'])+' |')
lines+=['','## Ürüne göre seçilmiş yakın planlar','','85 mm, f/5.6, 2400×1600; gerçek parça rolü ve dışarıdan görünür yüzey raycast ile doğrulanır. Kumaş olmayan ürüne kumaş, taş olmayan ürüne taş eklenmez. Genel lens kaydırması makro kameralarda sıfırlanır.','','| Tasarım | Ayrıntı 1 | Ayrıntı 2 | Ayrıntı 3 |','|---|---|---|---|']
for f in fixtures:
 lines.append('| '+f['id']+' | '+' | '.join(local(f['id']+f'-detail-{n}.jpg',plan['label'])+' <br> '+plan['label'] for n,plan in enumerate(f['details'],1))+' |')
lines+=['','[Mimari ve tekrar üretim](README.md) · [Cycles ve süre/maliyet notu](CYCLES.md) · [Dosya doğrulaması](artifact-verification.json)']
page.write_text('\n'.join(lines)+'\n',encoding='utf-8')
