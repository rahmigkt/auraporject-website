"""Audited Spanish conversations, local review and viewer exports."""
import copy
import html
import json
from build02 import ROOT,area
from es import OUT,dump
from es_audit import records
from review02 import svg

EXAMPLES=ROOT/'knowledge/ai-egitim/ev-sohbet-es-ornekler'
SOURCES=[
 dict(id='CTE-SUA',url='https://www.codigotecnico.org/DocumentosCTE/SeguridadUtilizacionAccesibilidad.html',document_url='https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf',access='primary_landing_and_pdf_opened_not_complete_clause_audit',version='Landing lists commentary 15 July 2024; normative and commentary documents are separate.',finding='Safety/accessibility framework; not a blanket certificate from a furniture layout.'),
 dict(id='CTE-HS',url='https://www.codigotecnico.org/DocumentosCTE/Salubridad.html',document_url='https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf',access='primary_landing_and_pdf_introduction_read',version='Normative PDF 14 June 2022; landing lists commentary 12 February 2025.',finding='HS3 concerns indoor air and ventilation; a drawn window alone is not a system assessment.'),
 dict(id='CAT-habitability',url='https://habitatge.gencat.cat/ca/ambits/cedules-habitabilitat/decret-141-2012/index.html',access='primary_interpretation_page_read',finding='Catalan habitability interpretation distinguishes annexes/building histories.',limits='Actual building age, intervention and applicable annex unknown; no cedula issued.'),
 dict(id='MAD-consumer',url='https://www.comunidad.madrid/consumo/informacion-completa-comprar-vivienda',access='primary_page_read',finding='Purchase information and documentation context.',limits='Not a full current municipal room-dimension code; no Madrid numeric thresholds inferred.'),
 dict(id='VAL-design',url='https://dogv.gva.es/datos/2023/11/23/pdf/2023_11769.pdf',access='official_index_only_full_pdf_timeout',finding='Historical amendment to Valencian design decree 80/2023 identified.',limits='Full current consolidated applicability and later changes NOT verified; no borrowed Catalan thresholds.'),
 dict(id='AND-access',url='https://www.juntadeandalucia.es/fomentoyvivienda/portal-web/web/servicios/buscador_normativas/95339977-1fea-11e0-89b8-998a90d310ed',access='primary_regional_landing_read_not_full_current_consolidation',finding='Regional accessibility decree 293/2009 and correction identified.',limits='Not a current full accessibility certification; actual route, levels and bathroom unknown.'),
 dict(id='CATASTRO-area-context',url='https://www.catastro.hacienda.gob.es/documentos/publicaciones/ct/ct89/Catastro_89_accesible.pdf',access='official_journal_index',version='Historical journal issue 89, not a current normative area definition.',finding='Built area with common parts differs from private/net measurement.',limits='No numeric conversion or statutory useful-area determination made.')]

def build():
    dump(OUT/'ulke-kaynaklari.json',dict(checked_on='2026-10-21',sources=SOURCES,not_a_complete_statutory_checker=True))
    audit=json.loads((OUT/'denetim-sonucu.json').read_text(encoding='utf-8'))
    if not audit['passed']:raise RuntimeError('Geometry audit must pass with source exceptions separately shown')
    EXAMPLES.mkdir(exist_ok=True);cards=[]
    for r in records():
        a=next(x for x in audit['results'] if x['id']==r['id']);name=r['id']
        talk=''.join(f'<p class="{m["role"]}" lang="es"><b>{"Kullanıcı" if m["role"]=="user" else "Asistan"}:</b> {html.escape(m["content"])}</p>' for m in r['dialogue'])
        exceptions=''.join(f'<li>{html.escape(x["check"])}: {x["actual"]:.3f} · korunmuş kaynak hedef sapması</li>' for x in a['source_exceptions'])
        links=f'<p><a href="ev-sohbet-es-ornekler/{name}.png">Stüdyoda plan</a> · <a href="ev-sohbet-es-ornekler/{name}-maket.png">Stüdyoda maket</a> · <a href="ev-sohbet-es-ornekler/{name}.json">Stüdyoda açılabilir dosya</a></p>'
        cards.append(f'<article id="{name}"><h2>{r["city"]} · {r["region"]}</h2><p>{r["claimed_net_area_m2"]} m² net iç alan · {len(r["plan"]["items"])} hesaplanan ürün · 8 alışveriş · İspanyolca</p><p>Swiss Dwellings / {r["source"]["id"]} / <a href="https://zenodo.org/records/7788422">CC BY 4.0</a>. Tek katlı İsviçre kaynağı; İspanya\'da ölçülmüş yerel konut değildir.</p>{svg(r["plan"],r["plan"]["levels"][0]["id"])}{links}<p><strong>Tasarımcı için Türkçe özet:</strong> {html.escape(r["designer_summary_tr"])}</p><details><summary>{len(a["source_exceptions"])} kaynak ölçüsü istisnası</summary><ul>{exceptions}</ul></details><details open><summary>İspanyolca sohbeti oku</summary>{talk}</details><a href="veri/ev-sohbet-es/{name}.json">Tam kayıt JSON</a></article>')
        p=copy.deepcopy(r['plan']);omitted=[s for s in p['spaces'] if s['kind'] in ('balcony','terrace')];p['spaces']=[s for s in p['spaces'] if s not in omitted]
        p['review_export']=dict(source_conversation=name,whole_home=False,net_interior_area_m2=round(sum(area(s) for s in p['spaces']),3),omitted_exterior_spaces=omitted,reason='Interior-only viewer projection; full record retains exterior spaces; not statutory Spanish area.')
        p['notes']=['Swiss Dwellings CC BY 4.0; fictional Spanish dialogue, not a local survey. Viewer height, compass and light defaults unverified.'];dump(EXAMPLES/(name+'.json'),p)
    nav=' · '.join(f'<a href="#{r["id"]}">{r["city"]}</a>' for r in records())
    page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>İspanya ev sohbetleri</title><style>body{font:17px system-ui;max-width:1100px;margin:auto;padding:24px;background:#f5f2eb;color:#26343a}article{background:#fffefb;margin:28px 0;padding:24px;border-radius:12px}svg{width:100%;max-height:570px}.user{border-left:4px solid #b8a17a;padding:12px}.assistant{border-left:4px solid #6598a3;padding:12px}summary{cursor:pointer;padding:12px}a{color:#25657d}</style><h1>İspanya · Dört yeni ev sohbeti</h1><p>Önceki 32 kayda ek inceleme turu; eğitim başlatılmadı. Dört ayrı İspanyolca konuşma, Türkçe tasarımcı özeti ve lisanslı referans plan.</p><p>Yeni geometri hatası 0; '+str(audit['source_exception_count'])+' kaynak hedef sapması korunuyor. Bütün ölçü hedeflerinden istisnasız geçen 0/4. Yerel mevzuat onayı, gerçek üst kat/patio veya erişilebilirlik belgesi verilmedi.</p><nav>'+nav+'</nav>'+''.join(cards)+'</html>'
    (ROOT/'knowledge/ai-egitim/EV-SOHBET-ES-inceleme.html').write_text(page,encoding='utf-8')

if __name__=='__main__':build()
