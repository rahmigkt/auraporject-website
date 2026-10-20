"""Audited Italian conversations, local review and viewer exports."""
import copy
import html
import json
from build02 import ROOT,area
from it import OUT,dump
from it_audit import records
from review02 import svg

EXAMPLES=ROOT/'knowledge/ai-egitim/ev-sohbet-it-ornekler'
SOURCES=[
 dict(id='DM236',url='https://www.gazzettaufficiale.it/atto/serie_generale/caricaDettaglioAtto/originario?atto.codiceRedazionale=089G0298&atto.dataPubblicazioneGazzetta=1989-06-23',access='primary_act_landing_read_not_complete_current_consolidation',finding='Accessibility, adaptability and visitability are distinct assessment scopes.',limits='No certification from a furniture placement; actual access and functional needs unknown.'),
 dict(id='MIT-salvacasa',url='https://www.mit.gov.it/nfsmitgov/files/media/basic/2025-01/Linee%20Guida%20DL%20Salva%20Casa.pdf',access='official_index_only_full_pdf_502',version='January 2025 guidance',finding='Height derogations are conditional, not an automatic 2.40 m approval.',limits='No assertion of full current October 2026 legal consolidation.'),
 dict(id='CAMERA-2026',url='https://documenti.camera.it/leg19/dossier/testi/D26066a.htm',access='primary_dossier_section_on_article24_read',version='19 June 2026, provisional parliamentary dossier',finding='Discussion of article 24 5-bis/5-ter retains professional attestation and other requirements.',limits='Explanatory dossier on a bill, not final consolidated law; no universal minimum-height rule implemented.'),
 dict(id='MIL-SUE',url='https://www.comune.milano.it/aree-tematiche/edilizia/sportello-unico-edilizia',access='official_index_only_full_page_403',finding='Municipal building office and regulations are relevant.',limits='Current municipal numeric requirements not audited.'),
 dict(id='ROM-agibilita',url='https://www.comune.roma.it/web/it/dipartimento-attuazione-urbanistica-uffici-e-contatti.page?contentId=UFF28592',access='primary_municipal_page_read',finding='Municipal agibilita procedure context.',limits='Not an approval of this fictional home or a complete Lazio rules inventory.'),
 dict(id='TO-1975-history',url='https://www.comune.torino.it/informacasa/politiche_casa/idoneita_alloggiativa/doc/Istruzioni_per_richiesta_attestato_idoneita_alloggiativa_06-04-2021.pdf',access='official_search_index_only_old_pdf_redirects_to_general_housing_page',version='Historical 2021 instructions',finding='Historical room-area reference 9 m2 single / 14 m2 double.',limits='Not current national certification, nor municipal rule for all four cities.'),
 dict(id='IT-housing-context',url='https://www.integrazionemigranti.gov.it/it-it/Ricerca-news/Dettaglio-news/id/3620',access='primary_government_information_page_read',finding='Idoneita alloggiativa is a separate administrative/technical topic.',limits='No occupancy, cadastral-area or actual-building certificate issued.')]


def build():
    dump(OUT/'ulke-kaynaklari.json',dict(checked_on='2026-10-21',sources=SOURCES,not_a_complete_statutory_checker=True))
    audit=json.loads((OUT/'denetim-sonucu.json').read_text(encoding='utf-8'))
    if not audit['passed']:raise RuntimeError('Geometry audit must pass with source exceptions separately shown')
    EXAMPLES.mkdir(exist_ok=True);cards=[]
    for r in records():
        a=next(x for x in audit['results'] if x['id']==r['id']);name=r['id']
        talk=''.join(f'<p class="{m["role"]}" lang="it"><b>{"Kullanıcı" if m["role"]=="user" else "Asistan"}:</b> {html.escape(m["content"])}</p>' for m in r['dialogue'])
        exceptions=''.join(f'<li>{html.escape(x["check"])}: {x["actual"]:.3f} · korunmuş kaynak hedef sapması</li>' for x in a['source_exceptions'])
        links=f'<p><a href="ev-sohbet-it-ornekler/{name}.png">Stüdyoda plan</a> · <a href="ev-sohbet-it-ornekler/{name}-maket.png">Stüdyoda maket</a> · <a href="ev-sohbet-it-ornekler/{name}.json">Stüdyoda açılabilir dosya</a></p>'
        cards.append(f'<article id="{name}"><h2>{r["city"]} · {r["region"]}</h2><p>{r["claimed_net_area_m2"]} m² net iç alan · {len(r["plan"]["items"])} hesaplanan ürün · 8 alışveriş · İtalyanca</p><p>Swiss Dwellings / {r["source"]["id"]} / <a href="https://zenodo.org/records/7788422">CC BY 4.0</a>. Tek katlı İsviçre kaynağı; İtalya\'da ölçülmüş yerel konut değildir.</p>{svg(r["plan"],r["plan"]["levels"][0]["id"])}{links}<p><strong>Tasarımcı için Türkçe özet:</strong> {html.escape(r["designer_summary_tr"])}</p><details><summary>{len(a["source_exceptions"])} kaynak ölçüsü istisnası</summary><ul>{exceptions}</ul></details><details open><summary>İtalyanca sohbeti oku</summary>{talk}</details><a href="veri/ev-sohbet-it/{name}.json">Tam kayıt JSON</a></article>')
        p=copy.deepcopy(r['plan']);omitted=[s for s in p['spaces'] if s['kind'] in ('balcony','terrace')];p['spaces']=[s for s in p['spaces'] if s not in omitted]
        p['review_export']=dict(source_conversation=name,whole_home=False,net_interior_area_m2=round(sum(area(s) for s in p['spaces']),3),omitted_exterior_spaces=omitted,reason='Interior-only viewer projection; full record retains exterior spaces; not statutory Italian area.')
        p['notes']=['Swiss Dwellings CC BY 4.0; fictional Italian dialogue, not a local survey. Viewer height, compass and light defaults unverified.'];dump(EXAMPLES/(name+'.json'),p)
    nav=' · '.join(f'<a href="#{r["id"]}">{r["city"]}</a>' for r in records())
    page='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>İtalya ev sohbetleri</title><style>body{font:17px system-ui;max-width:1100px;margin:auto;padding:24px;background:#f5f2eb;color:#26343a}article{background:#fffefb;margin:28px 0;padding:24px;border-radius:12px}svg{width:100%;max-height:570px}.user{border-left:4px solid #b8a17a;padding:12px}.assistant{border-left:4px solid #6598a3;padding:12px}summary{cursor:pointer;padding:12px}a{color:#25657d}</style><h1>İtalya · Dört yeni ev sohbeti</h1><p>Önceki 36 kayda ek inceleme turu; eğitim başlatılmadı. Dört ayrı İtalyanca konuşma, Türkçe tasarımcı özeti ve lisanslı referans plan.</p><p>Yeni geometri hatası 0; '+str(audit['source_exception_count'])+' kaynak hedef sapması korunuyor. '+str(audit['strict_pass'])+'/4 plan bütün mevcut geometri hedeflerini istisnasız karşılıyor; bu yasal uygunluk değil. Teknik iç terimler konuşmada yok; yerel mevzuat, üst kat/teras veya erişilebilirlik onayı verilmedi.</p><nav>'+nav+'</nav>'+''.join(cards)+'</html>'
    (ROOT/'knowledge/ai-egitim/EV-SOHBET-IT-inceleme.html').write_text(page,encoding='utf-8')

if __name__=='__main__':build()
