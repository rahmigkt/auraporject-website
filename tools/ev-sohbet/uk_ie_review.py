"""Build bounded jurisdiction notes and an offline review from audited records."""
import copy
import html
import json
from build02 import ROOT,dump,area
from uk_ie import OUT
from uk_ie_audit import records
from review02 import svg

EXAMPLES=ROOT/'knowledge/ai-egitim/ev-sohbet-uk-ie-ornekler'
PROFILES={
 'England':dict(url='https://www.gov.uk/government/publications/technical-housing-standards-nationally-described-space-standard/technical-housing-standards-nationally-described-space-standard',document='NDSS, published 2015',access='primary_page_read',scope='New dwelling planning where locally adopted; not an automatic existing-rental certificate. Net room sum is not GIA.',unknown=['local adoption','actual GIA','headroom','applicability']),
 'Scotland':dict(url='https://www.gov.scot/publications/building-standards-technical-handbook-january-2025-domestic/',document='Domestic handbook January 2025; page updated July 2025',access='primary_landing_page_read_not_all_pdf_clauses',scope='Scottish building standards; establish warrant/work date and relevant edition. Do not import England NDSS.',unknown=['warrant and work dates','applicable edition','room-specific technical clauses']),
 'Wales':dict(url='https://www.gov.wales/development-quality-requirements-housing-associations-and-local-authorities-2021',document='Development quality requirements 2021; landing page updated March 2026',access='primary_landing_page_read_not_all_pdf_clauses',scope='Housing associations/local authorities and social housing context; not a blanket private-flat approval.',unknown=['funding and tenure','applicability to proposed work','accessibility survey']),
 'Northern Ireland':dict(url='https://www.finance-ni.gov.uk/publications/technical-booklet-k',document='Technical Booklet K, 2012, ventilation',access='primary_landing_page_read',scope='Northern Ireland jurisdiction. Booklet K concerns ventilation, not an imported England stair approval.',unknown=['applicable work and statutory provisions','upper-floor survey','stair geometry and headroom']),
 'Republic of Ireland':dict(url='https://www.gov.ie/en/department-of-housing-local-government-and-heritage/publications/minimum-standards-in-rented-accommodation/',document='Minimum standards in rented accommodation; 2019 regulations referenced by official index',access='official_search_index_only_full_page_403',scope='Rental lighting/ventilation require actual evidence. Apartment planning policy version and applicability not numerically certified here.',unknown=['current applicable planning policy','existing use and rental scope','ventilation and actual daylight'])}

def annotate():
    dump(OUT/'ulke-kaynaklari.json',dict(checked_on='2026-10-21',profiles=PROFILES,numeric_national_rules_implemented=False))
    for r in records():
        r['jurisdiction_review']=dict(jurisdiction=r['region'],source_url=PROFILES[r['region']]['url'],compliance='unknown_not_certified',gross_internal_area_m2=None,unresolved=PROFILES[r['region']]['unknown'])
        dump(OUT/(r['id']+'.json'),r)

def build():
    audit=json.loads((OUT/'denetim-sonucu.json').read_text(encoding='utf-8'));cards=[];EXAMPLES.mkdir(exist_ok=True)
    for r in records():
        findings=next(x for x in audit['results'] if x['id']==r['id']);profile=PROFILES[r['region']]
        talks=''.join(f'<p class="{m["role"]}"><b>{"Kullanıcı" if m["role"]=="user" else "Asistan"}:</b> {html.escape(m["content"])}</p>' for m in r['dialogue'])
        exceptions=''.join(f'<li>{html.escape(x["check"])}: {x["actual"]:.3f}</li>' for x in findings['source_exceptions'])
        cards.append(f'<article><h2>{r["city"]} · {r["region"]} · {r["id"][-2:]}</h2><p>{r["claimed_net_area_m2"]} m² net · {len(r["plan"]["items"])} hesaplanan ürün · 8 alışveriş · İngilizce</p><p>Swiss Dwellings / {r["source"]["id"]} / <a href="https://zenodo.org/records/7788422">CC BY 4.0</a>. Yerel ev keşfi değildir; geometri tek katlı İsviçre referansıdır.</p>{svg(r["plan"],r["plan"]["levels"][0]["id"])}<details><summary>{len(findings["source_exceptions"])} korunmuş kaynak hedef sapması</summary><ul>{exceptions}</ul></details><p>Mevzuat uygunluğu: bilinmiyor. <a href="{profile["url"]}">Yetki alanı kaynağı</a>; erişim: {profile["access"]}.</p><details open><summary>Sohbeti oku</summary>{talks}</details><a href="veri/ev-sohbet-uk-ie/{r["id"]}.json">Tam kayıt JSON</a></article>')
        if int(r['id'][-2:]) in (1,4,5,6):
            p=copy.deepcopy(r['plan']);omitted=[s for s in p['spaces'] if s['kind'] in ('balcony','terrace')];p['spaces']=[s for s in p['spaces'] if s not in omitted]
            p['review_export']=dict(source_conversation=r['id'],whole_home=False,net_interior_area_m2=round(sum(area(s) for s in p['spaces']),3),omitted_exterior_spaces=omitted,reason='Interior-only viewer export; original record retains exterior spaces.')
            p['notes']=['Swiss Dwellings CC BY 4.0; fictional country dialogue, not surveyed local property.']
            dump(EXAMPLES/(r['id']+'.json'),p)
    page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>UK–İrlanda inceleme</title><style>body{font:17px system-ui;max-width:1100px;margin:auto;padding:24px;background:#f5f2eb;color:#26343a}article{background:white;margin:28px 0;padding:24px;border-radius:12px}svg{width:100%;max-height:580px}.user{border-left:4px solid #b8a17a;padding:12px}.assistant{border-left:4px solid #6598a3;padding:12px}summary{cursor:pointer;padding:12px}a{color:#25657d}</style><h1>Birleşik Krallık ve İrlanda · 8 yeni sohbet</h1><p>Bu tur inceleme içindir; eğitim ve canlı site değişikliği yapılmadı. 4 Birleşik Krallık yetki alanı + İrlanda Cumhuriyeti için 4 senaryo. Sekizinin dili de İngilizce; Galce, İskoç Galcesi ve İrlandaca kapsanmıyor.</p><p>Önceki 20 sohbet korunur. Yeni geometri hatası: 0; kaynak ölçüsü istisnaları ve yerel mevzuat açıkları aşağıda. Kör onay veya ruhsat belgesi değildir.</p>'+''.join(cards)+'</html>'
    (ROOT/'knowledge/ai-egitim/EV-SOHBET-UK-IE-inceleme.html').write_text(page,encoding='utf-8')

if __name__=='__main__':
    import sys
    annotate() if '--annotate' in sys.argv else build()
