"""Offline review/export and bounded Danish primary-source evidence."""
import copy
import html
import json
from build02 import ROOT,dump,area
from dk import OUT
from dk_audit import records
from review02 import svg

EXAMPLES=ROOT/'knowledge/ai-egitim/ev-sohbet-dk-ornekler'

def build():
    sources=[
      dict(id='BR18-layout',url='https://www.bygningsreglementet.dk/tekniske-bestemmelser/09/krav/199_213/',access='primary_current_page_read',edition='BR18 Aktuelt, accessed 2026-10-21',clauses=['199','205','208'],finding='Layout evidence matters; height is contextual; entry-level door clear passage minimum 0.77 m, not raw drawing aperture.',numeric_rule=dict(clear_passage_min_mm=770),application='Actual property and work applicability unknown; no national pass computed'),
      dict(id='BR18-daylight',url='https://www.bygningsreglementet.dk/tekniske-bestemmelser/18/vejledninger/generel_vejledning/dagslys/',access='primary_current_guidance_read',clauses=['379-381 guidance'],finding='10-percent documentation uses actual glass with corrections, not raw aperture area.',unknown=['glass area excluding frame','glass transmittance','shading and obstructions'],application='Project raw-opening check remains separate; no daylight pass'),
      dict(id='DST-area',url='https://www.dst.dk/en/Statistik/dokumentation/documentationofstatistics/census-of-housing/statistical-presentation',access='primary_page_read',finding='Registered dwelling area is measured externally and includes allocated stairwell share in multi-dwelling houses; not net polygon sum.',application='No invented conversion factor or BBR area'),
      dict(id='DST-types',url='https://www.dst.dk/en/Statistik/emner/borgere/boligforhold/boligbestanden',access='primary_page_read',finding='Housing-stock source distinguishes dwelling types.',application='No national furniture taste or local typology inferred from Swiss plans')]
    dump(OUT/'ulke-kaynaklari.json',dict(checked_on='2026-10-21',sources=sources,legal_compliance='unknown_not_certified',not_a_complete_BR18_checker=True))
    results=json.loads((OUT/'denetim-sonucu.json').read_text(encoding='utf-8'))
    if not results['passed']:raise RuntimeError('Review requires a passing geometry/source audit, with source exceptions shown separately.')
    EXAMPLES.mkdir(exist_ok=True);cards=[]
    for r in records():
        a=next(x for x in results['results'] if x['id']==r['id']);talks=''.join(f'<p class="{m["role"]}" lang="da"><b>{"Kullanıcı" if m["role"]=="user" else "Asistan"}:</b> {html.escape(m["content"])}</p>' for m in r['dialogue'])
        exceptions=''.join(f'<li>{html.escape(x["check"])}: {x["actual"]:.3f} · korunmuş kaynak hedef sapması</li>' for x in a['source_exceptions'])
        filename=r['id'];screen=f'<p><a href="ev-sohbet-dk-ornekler/{filename}.png">Stüdyoda plan</a> · <a href="ev-sohbet-dk-ornekler/{filename}-maket.png">Stüdyoda maket</a> · <a href="ev-sohbet-dk-ornekler/{filename}.json">Stüdyoda açılabilir dosya</a></p>'
        cards.append(f'<article id="{filename}"><h2>{r["city"]} · {filename[-2:]}</h2><p>{r["claimed_net_area_m2"]} m² net iç alan · {len(r["plan"]["items"])} hesaplanmış ürün · 8 alışveriş · Danca</p><p>Swiss Dwellings / {r["source"]["id"]} / <a href="https://zenodo.org/records/7788422">CC BY 4.0</a>. Tek katlı İsviçre referansı; Danimarka\'da ölçülmüş ev değildir.</p>{svg(r["plan"],r["plan"]["levels"][0]["id"])}{screen}<p><strong>Tasarımcı için Türkçe özet:</strong> {html.escape(r["designer_summary_tr"])}</p><details><summary>{len(a["source_exceptions"])} kaynak ölçüsü istisnası</summary><ul>{exceptions}</ul></details><details open><summary>Danca sohbeti oku</summary>{talks}</details><a href="veri/ev-sohbet-dk/{filename}.json">Tam sohbet + plan + işlem kaydı</a></article>')
        p=copy.deepcopy(r['plan']);omitted=[s for s in p['spaces'] if s['kind'] in ('balcony','terrace')];p['spaces']=[s for s in p['spaces'] if s not in omitted]
        p['review_export']=dict(source_conversation=r['id'],whole_home=False,net_interior_area_m2=round(sum(area(s) for s in p['spaces']),3),omitted_exterior_spaces=omitted,reason='Viewer interior-only export; original record retains exterior spaces. Not BBR area.')
        p['notes']=['Swiss Dwellings CC BY 4.0; fictional Danish dialogue, not surveyed Danish home. Viewer default ceiling and compass are unverified.']
        dump(EXAMPLES/(filename+'.json'),p)
    nav=' · '.join(f'<a href="#{r["id"]}">{r["city"]}</a>' for r in records())
    page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Danimarka ev sohbetleri</title><style>body{font:17px system-ui;max-width:1100px;margin:auto;padding:24px;background:#f5f2eb;color:#26343a}article{background:#fffefb;margin:28px 0;padding:24px;border-radius:12px}svg{width:100%;max-height:570px}.user{border-left:4px solid #b8a17a;padding:12px}.assistant{border-left:4px solid #6598a3;padding:12px}summary{cursor:pointer;padding:12px}a{color:#25657d}</style><h1>Danimarka · Dört yeni ev sohbeti</h1><p>Önceki 28 kayda ek inceleme turu. Eğitim başlatılmadı. Dört farklı lisanslı tek kat referansı, Danca konuşma ve Türkçe tasarımcı özeti.</p><p>Yeni geometri hatası 0; 22 kaynak hedef sapması korunuyor. BR18 uygunluğu, BBR alanı, gerçek serbest kapı geçişi ve düzeltilmiş günışığı doğrulanmadı. Sıra ev üst katı uydurulmadı; gerçek ölçülü plan gerekiyor.</p><nav>'+nav+'</nav>'+''.join(cards)+'</html>'
    page=page.replace('22 kaynak hedef sapması',str(results['source_exception_count'])+' kaynak hedef sapması')
    (ROOT/'knowledge/ai-egitim/EV-SOHBET-DK-inceleme.html').write_text(page,encoding='utf-8')

if __name__=='__main__':build()
