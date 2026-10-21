from pathlib import Path
import hashlib,html,json
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-arap-olculu'
esc=lambda x:html.escape(str(x),quote=True)
def build():
 cards=[];manifest=[]
 for f in sorted(OUT.glob('ev-sohbet-arap-olculu-*.json')):
  r=json.loads(f.read_text(encoding='utf-8'));p=r['plan'];points=[q for s in p['spaces'] for q in s['boundary_xy_mm']];xmin=min(q[0] for q in points)-300;ymin=min(q[1] for q in points)-300;xmax=max(q[0] for q in points)+300;ymax=max(q[1] for q in points)+300
  point=lambda q:f'{q[0]:.3f},{ymax+ymin-q[1]:.3f}'
  svg=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{xmin} {ymin} {xmax-xmin} {ymax-ymin}" role="img"><title>{esc(r["id"])} — measured single-level reference; family room only</title>']
  for s in p['spaces']:
   color='#e8e1b7' if s['id']==r['layout_scope']['room_id'] else '#eff1ed'
   svg.append(f'<polygon points="{" ".join(map(point,s["boundary_xy_mm"]))}" fill="{color}" stroke="#b0b6af" stroke-width="12"/>')
  for w in p['walls']:
   a,b=w['from_xy_mm'],w['to_xy_mm'];svg.append(f'<polyline points="{point(a)} {point(b)}" fill="none" stroke="#59645b" stroke-width="{w["thickness"]["value"]}"/>')
  for o in p['openings']:
   a,b=o['full_opening_span_xy_mm'];svg.append(f'<polyline points="{point(a)} {point(b)}" stroke="{"#b0ccd0" if o["kind"]=="window" else "#fcfaf2"}" stroke-width="170"/>')
  for it in p['items']:
   svg.append(f'<polygon points="{" ".join(map(point,it["footprint_xy_mm"]))}" fill="{"#628879" if it["design"]["kind"]=="sofa" else "#b68b60"}" stroke="#263d34" stroke-width="20"/>')
   x,y=it['pos_xy_mm'];sz=it['compiled_size_mm'];svg.append(f'<text x="{x}" y="{ymax+ymin-y}" text-anchor="middle" font-family="sans-serif" font-size="145" fill="#152c23">{sz["w"]:.0f} × {sz["d"]:.0f} mm</text>')
  svg.append('</svg>');drawing=OUT/'cizimler'/(r['id']+'.svg');drawing.parent.mkdir(exist_ok=True);drawing.write_text(''.join(svg),encoding='utf-8',newline='\n')
  rel='veri/ev-sohbet-arap-olculu/cizimler/'+drawing.name;layout=r['layout_results'][0]
  cards.append('<article><h2>'+esc(r['city'])+' · '+esc(r['country'])+'</h2><p>'+esc(r['id'])+' · Yerleşim: '+('iki parça sığdı' if layout['ok'] else 'sığmadı')+' · Kaynak istisnası: '+str(len(r['source_exceptions']))+'</p><p>Kanepe: '+str(r['product_request']['sofa_width_mm'])+' × 820 mm; sehpa: 900 × 550 mm. Gösterilen seçenek: '+str(r['layout_requests'][0]['selected_alternative']+1)+'.</p><a href="'+rel+'"><img src="'+rel+'" alt="Ölçülü tek seviye plan ve aile salonunda gerçek çözücüyle yerleştirilmiş kanepe/sehpa"></a><p class="meta">Sarı alan: aile salonu. Yeşil: kanepe; kahverengi: sehpa. Ölçüler gerçek derlenmiş ayak izi, mm. Diğer odalar bu turda döşenmedi. Planı büyütmek için tıklayın.</p><p class="meta">CH kaynak: '+esc(r['source']['id'])+' · CC BY 4.0 · Gerçek yerel ev değil. '+('Üst kat ve merdiven bekliyor. ' if r['layout_scope']['upper_floor_and_stair_pending'] else '')+('Meclis ayrı ve bekliyor.' if r['layout_scope']['majlis_pending'] else '')+'</p><details><summary>8 turluk Arapça görüşme</summary><div lang="ar" dir="rtl">'+''.join('<p class="'+m['role']+'"><strong>'+('المستخدم' if m['role']=='user' else 'المساعد')+'</strong> '+esc(m['content'])+'</p>' for m in r['dialogue'])+'</div></details><details><summary>Kaynak istisnaları</summary><pre>'+esc(json.dumps(r['source_exceptions'],ensure_ascii=False,indent=2))+'</pre></details></article>')
  manifest.append({'record':f.name,'record_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'svg':str(drawing.relative_to(OUT)).replace('\\','/'),'svg_sha256':hashlib.sha256(drawing.read_bytes()).hexdigest()})
 page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Arapça ölçülü yerleşimler</title><style>body{font:17px/1.7 system-ui;background:#f5f2e9;color:#243e33;max-width:1400px;margin:25px auto;padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr));gap:22px}article{background:#fffdf7;padding:22px;border:1px solid #d7d6c9}img{width:100%;height:420px;object-fit:contain}.meta{font-size:14px}details{margin:14px 0}.user{border-right:4px solid #bea57c;padding:10px}.assistant{border-right:4px solid #6c9281;padding:10px}pre{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}</style><h1>12 ölçülü referans · aile salonu yerleşimleri</h1><p>12 farklı Swiss Dwellings tek seviye planı, 6 ülke için özgün ve kurmaca Arapça görüşmeler. 192 mesaj, 24 parça. 12 geometri denetimi kaynak istisnalarıyla kabul; sıkı geçiş 1/12, korunmuş kaynak istisnası 36. Yerel mevzuat/üretim onayı yok. Tamamlanan bütün ev, iki katlı geometri ve meclis: 0. Eğitim başlatılmadı.</p><p><a href="https://zenodo.org/records/7788422">Kaynak ve CC BY 4.0 lisansı</a> · Standfest ve diğerleri, Swiss Dwellings 3.0.0. AURA: birim/koordinat aktarımı, kurmaca konuşma ve yeni yerleşim. Ön görüşme taslakları ayrı korunuyor; bu kayıtlar onları tekrar kopyalamaz.</p><div class="grid">'+''.join(cards)+'</div></html>'
 (ROOT/'knowledge/ai-egitim/EV-ARAP-OLCULU-01-inceleme.html').write_text(page,encoding='utf-8',newline='\n')
 (OUT/'inceleme-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n');print('12 measured SVG cards + Arabic conversation review written')
if __name__=='__main__':build()
