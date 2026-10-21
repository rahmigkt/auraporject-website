"""Current solver output gallery; original historical viewer snapshots stay intact."""
from pathlib import Path
import html,json
ROOT=Path(__file__).resolve().parents[2]
def run():
 cards=[]
 for batch in ['02','uk-ie','dk','es','it','arap-olculu']:
  directory=ROOT/('knowledge/ai-egitim/veri/ev-sohbet-'+batch)
  for f in sorted(directory.glob('ev-sohbet-*.json')):
   r=json.loads(f.read_text(encoding='utf-8'));p=r['plan'];levels=p['levels']
   for level in levels:
    spaces=[s for s in p['spaces'] if s['level_id']==level['id']]
    if not spaces:continue
    pts=[q for s in spaces for q in s['boundary_xy_mm']];xmin=min(q[0] for q in pts)-300;ymin=min(q[1] for q in pts)-300;xmax=max(q[0] for q in pts)+300;ymax=max(q[1] for q in pts)+300
    point=lambda q:f'{q[0]:.2f},{ymax+ymin-q[1]:.2f}'
    svg=[f'<svg viewBox="{xmin} {ymin} {xmax-xmin} {ymax-ymin}" role="img" aria-label="{html.escape(r["id"])}">']
    for s in spaces:svg.append('<polygon points="'+' '.join(map(point,s['boundary_xy_mm']))+'" fill="#edf0e8" stroke="#9ba59a" stroke-width="12"/>')
    for w in p['walls']:
     if w['level_id']==level['id']:svg.append('<polyline points="'+point(w['from_xy_mm'])+' '+point(w['to_xy_mm'])+'" stroke="#626d63" stroke-width="45"/>')
    ids={s['id'] for s in spaces}
    for it in p['items']:
     if it['space_id'] in ids:svg.append('<polygon points="'+' '.join(map(point,it['footprint_xy_mm']))+'" fill="#709c83" stroke="#263e30" stroke-width="15"><title>'+html.escape(it['name']+' · '+it['id'])+'</title></polygon>')
    svg.append('</svg>')
    cards.append('<article><h2>'+html.escape(r['id']+' · '+r['country']+' · '+str(level['id']))+'</h2>'+''.join(svg)+'<p>'+str(len([i for i in p['items'] if i['space_id'] in ids]))+' parça · Kaynak ve tasarımcı onayı bekliyor.</p><a href="veri/ev-sohbet-'+batch+'/'+f.name+'">Tam kayıt ve istekler</a></article>')
 page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>HACİM-01 · Güncel yerleşimler</title><style>body{font:16px/1.6 system-ui;max-width:1200px;margin:24px auto;padding:0 18px;background:#faf9f5;color:#26372c}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,450px),1fr));gap:20px}article{background:white;padding:16px;border:1px solid #c4cfc4}h2{font-size:17px}svg{width:100%;height:420px}</style><h1>52 kayıt · güncel motor yerleşimleri</h1><p>40 Avrupa görüşmesi ve 12 Arapça referans salonu. Yeşil alanlar ürün ayak izleridir. Konuşmalar, ürün ölçüleri, eski deneme sayıları ve sığdı/sığmadı sonuçları korunur; koordinatları güncel üretim çözücüsü verir. Yeni ülke sohbeti veya insan onayı sayılmaz.</p><p>Kaynak istisnaları, tarihî ek kat önerileri ve kısmi kapsam aynen kayıtlardadır. Bu görünüşler yerel ölçüm, yapı onayı veya tamamlanmış ev projesi değildir. Eski 3B sayfalar önceki motorun tarihî görüntüleridir; aşağıdakiler güncel izdüşümlerdir.</p><div class="grid">'+''.join(cards)+'</div></html>'
 (ROOT/'knowledge/ai-egitim/HACIM-01-YERLESIM-inceleme.html').write_text(page,encoding='utf-8',newline='\n');print('Current gallery:',len(cards),'level cards / 52 records')
if __name__=='__main__':run()
