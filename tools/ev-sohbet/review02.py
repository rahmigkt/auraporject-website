"""Local review/export; SVG derived from licensed geometry, no generated image API."""
import copy
import html
import json
from pathlib import Path
from build02 import ROOT,OUT,dump,area

EXAMPLES=ROOT/'knowledge/ai-egitim/ev-sohbet-02-ornekler'
COLORS=dict(living='#ead9b4',bedroom='#d3e1eb',kitchen='#d9e4c8',hall='#eee8dd',bath='#c2e0e4',wc='#c3d4e4',utility='#e6ddeb',stair='#ded1e9',study='#e8dcbf')

def svg(plan,level):
    rooms=[s for s in plan['spaces'] if s['level_id']==level]
    coords=[p for s in rooms for p in s['boundary_xy_mm']]
    x0,y0=min(p[0] for p in coords),min(p[1] for p in coords);x1,y1=max(p[0] for p in coords),max(p[1] for p in coords)
    def points(x):return ' '.join(f'{a:.2f},{-b:.2f}' for a,b in x)
    from shapely.geometry import Polygon
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0-500} {-y1-500} {x1-x0+1000} {y1-y0+1000}" role="img" aria-label="Measured source-derived plan">']
    for s in rooms:
        out.append(f'<polygon points="{points(s["boundary_xy_mm"])}" fill="{COLORS.get(s["kind"],"#e5eadb")}" stroke="#aaa" stroke-width="8"/>')
    walls={w['id']:w for w in plan['walls'] if w['level_id']==level}
    for w in walls.values():
        a,b=w['from_xy_mm'],w['to_xy_mm'];out.append(f'<path d="M{a[0]},{-a[1]} L{b[0]},{-b[1]}" stroke="#414c51" stroke-width="{min(250,w["thickness"]["value"])}"/>')
    for o in plan['openings']:
        if o['level_id']!=level:continue
        w=walls[o['wall_id']];a,b=w['from_xy_mm'],w['to_xy_mm'];dx,dy=b[0]-a[0],b[1]-a[1];L=(dx*dx+dy*dy)**.5
        p,q=o['offset_from_wall_start']['value'],o['width']['value'];x,y=a[0]+dx*p/L,a[1]+dy*p/L
        out.append(f'<path d="M{x},{-y} l{dx*q/L},{-dy*q/L}" stroke="{"#4b9dc0" if o["kind"]=="window" else "#faf8f1"}" stroke-width="{min(260,w["thickness"]["value"]+8)}"/>')
    for it in plan['items']:
        if it['space_id'] not in {s['id'] for s in rooms}:continue
        out.append(f'<polygon points="{points(it["footprint_xy_mm"])}" fill="#fffaf1" stroke="#776b5b" stroke-width="18"/>')
    for stair in plan.get('stairs',[]):
        from shapely import affinity
        poly=affinity.rotate(Polygon(stair['footprint_xy_mm']),-stair['orientation_deg'],origin=(0,0));x,y,xx,yy=poly.bounds
        from shapely.geometry import LineString
        for step in range(8):
            for left,right in [(x,x+900),(xx-900,xx)]:
                line=affinity.rotate(LineString([(left,y+step*280),(right,y+step*280)]),stair['orientation_deg'],origin=(0,0))
                a,b=list(line.coords);out.append(f'<path d="M{a[0]},{-a[1]} L{b[0]},{-b[1]}" stroke="#785c86" stroke-width="16"/>')
        if level=='level-1':out.append(f'<polygon points="{points(stair["upper_void_xy_mm"])}" fill="none" stroke="#985c7a" stroke-width="20" stroke-dasharray="80 50"/>')
    for s in rooms:
        p=Polygon(s['boundary_xy_mm']).representative_point();label=html.escape(s['name'])
        out.append(f'<text x="{p.x}" y="{-p.y}" text-anchor="middle" font-size="150" fill="#27353a">{label}<tspan x="{p.x}" dy="180">{area(s):.1f} m²</tspan></text>')
    return ''.join(out)+'</svg>'

def build():
    EXAMPLES.mkdir(parents=True,exist_ok=True)
    records=[json.loads(p.read_text(encoding='utf-8')) for p in sorted(OUT.glob('ev-sohbet-02-*.json'))]
    audit=json.loads((OUT/'denetim-sonucu.json').read_text(encoding='utf-8'))
    cards=[]
    for r in records:
        images=''.join('<section><h3>'+html.escape(l['name'])+'</h3>'+svg(r['plan'],l['id'])+'</section>' for l in r['plan']['levels'])
        talks=''.join(f'<p class="{m["role"]}"><b>{"Kullanıcı" if m["role"]=="user" else "Asistan"}</b> {html.escape(m["content"])}</p>' for m in r['dialogue'])
        findings=next(x for x in audit['results'] if x['id']==r['id'])
        exceptions=''.join(f'<li>{html.escape(x["check"])}: {x["actual"]:.3f} — korunmuş kaynak ölçüsü</li>' for x in findings['source_exceptions'])
        cards.append(f'<article id="{r["id"]}"><h2>{r["id"]} · {html.escape(r["city"])} · {r["language"]}</h2><p>Net {r["claimed_net_area_m2"]} m² · {len(r["plan"]["levels"])} kat · {len(r["plan"]["items"])} hesaplanmış ürün</p><p>Kaynak: <a href="https://zenodo.org/records/7788422">Swiss Dwellings CC BY 4.0</a> / {r["source"]["id"]}. İsviçre referansı; şehirde ölçülmüş gerçek müşteri evi değildir.</p><div class="plans">{images}</div><details><summary>Kaynakta kalan {len(findings["source_exceptions"])} hedef sapması</summary><ul>{exceptions}</ul></details><details><summary>Sohbeti oku · 8 alışveriş</summary>{talks}</details><p><a href="veri/ev-sohbet-02/{r["id"]}.json" download>Konuşma + plan + işlemler JSON</a></p></article>')
        if int(r['id'][-2:]) in (3,13,18):
            for l in r['plan']['levels']:
                p=copy.deepcopy(r['plan']);level=l['id'];p['levels']=[l]
                for k in ('spaces','walls','openings'):p[k]=[v for v in p[k] if v['level_id']==level]
                omitted=[s for s in p['spaces'] if s['kind'] in ('balcony','terrace')]
                p['spaces']=[s for s in p['spaces'] if s['kind'] not in ('balcony','terrace')]
                ids={s['id'] for s in p['spaces']};p['items']=[it for it in p['items'] if it['space_id'] in ids]
                p['notes']=[f'PER-FLOOR REVIEW EXPORT: {r["id"]}, {level}. Full record includes all levels and operations. Swiss Dwellings / CC BY 4.0.']
                p['review_export']=dict(source_conversation=r['id'],level=level,whole_home=False,
                    net_interior_area_m2=round(sum(area(s) for s in p['spaces']),3),omitted_exterior_spaces=omitted,
                    reason='ev.html sums every supplied space, including balconies, and draws all levels together. Interior-only per-floor projection keeps displayed area equal to measured net interior; full record preserves balconies and levels. No assets change.')
                dump(EXAMPLES/(r['id']+'-'+level+'.json'),p)
    nav=' '.join(f'<a href="#{r["id"]}">{r["id"][-2:]}</a>' for r in records)
    page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>EV-SOHBET-02 inceleme</title><style>body{font:17px system-ui;background:#f5f2eb;color:#26343a;max-width:1400px;margin:auto;padding:24px}a{color:#276e89}article{background:#fffdf8;padding:22px;margin:26px 0;border:1px solid #ded7c9;border-radius:12px}.plans{display:flex;gap:18px;flex-wrap:wrap}.plans section{flex:1;min-width:320px}svg{width:100%;max-height:650px}summary{cursor:pointer;padding:16px 0}.user{border-left:4px solid #b8a17a;padding:12px}.assistant{border-left:4px solid #6598a3;padding:12px}nav{position:sticky;top:0;background:#f5f2eb;padding:12px;display:flex;gap:14px;flex-wrap:wrap}li{font-size:14px}</style><h1>EV-SOHBET-02 · Gerçek referanslardan 20 sohbet</h1><p>Üç iki katlı örnek, tek katlı kaynaktan açıkça işlenmiş tasarım önerisidir; gerçek dubleks keşfi değildir. Geometri hatası yok; kaynak ölçüsü istisnaları aşağıda ayrı durur. Bu sayfa yapı ruhsatı veya üretim onayı değildir.</p><nav>'+nav+'</nav>'+''.join(cards)+'</html>'
    (ROOT/'knowledge/ai-egitim/EV-SOHBET-02-inceleme.html').write_text(page,encoding='utf-8')
    print('Review HTML and four EV exports from three conversations written')

if __name__=='__main__':build()
