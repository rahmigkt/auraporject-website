"""Spain continuation audit; project targets are not statutory certification."""
import json
import sys
from build02 import ROOT
from es import OUT,dump,REGIONS
from denetim import check,sentences

def records():return [json.loads(p.read_text(encoding='utf-8')) for p in sorted(OUT.glob('ev-sohbet-es-*.json'))]

def audit(batch=None):
    batch=records() if batch is None else batch;prior=[];errors=[];seen={}
    for folder,pattern in [('ev-sohbet-02','ev-sohbet-02-*.json'),('ev-sohbet-uk-ie','ev-sohbet-uk-ie-*.json'),('ev-sohbet-dk','ev-sohbet-dk-*.json')]:
        prior.extend(json.loads(p.read_text(encoding='utf-8')) for p in sorted((OUT.parent/folder).glob(pattern)))
    results=[check(r,OUT/'kaynaklar') for r in batch]
    if len(batch)!=4 or any(r['country']!='ES' or r['language']!='es' for r in batch):errors.append('country_language_distribution')
    if [r['region'] for r in batch]!=REGIONS:errors.append('regional_distribution')
    if len({r['source']['id'] for r in prior+batch})!=36:errors.append('source_reuse')
    for r in prior+batch:
        for m in r['dialogue']:
            if m['role']=='assistant':
                for text in sentences(m['content']):
                    if text in seen:errors.append('duplicate_sentence:'+r['id']+':'+seen[text])
                    seen[text]=r['id']
    for r in batch:
        if [m['role'] for m in r['dialogue']]!=['user','assistant']*8:errors.append('dialogue_turns:'+r['id'])
        if r['training_started'] or len(r['plan']['levels'])!=1 or r['source']['multi_floor_source']:errors.append('execution_scope:'+r['id'])
        if r['plan']['dwelling']['source_country']!='CH' or r['plan']['dwelling']['existing_house_claim']:errors.append('local_survey_claim:'+r['id'])
        j=r['jurisdiction_review']
        if j['jurisdiction']!=r['region'] or j['compliance']!='unknown_not_certified':errors.append('unearned_compliance:'+r['id'])
        for key in ('statutory_useful_area_m2','cadastral_built_area_m2','clear_door_passage_mm','ventilation_compliance'):
            if j[key] is not None:errors.append('unmeasured_legal_input:'+key+':'+r['id'])
        if not r.get('designer_summary_tr'):errors.append('missing_handover:'+r['id'])
        for it in r['plan']['items']:
            if it['design']['kind']=='bed':
                room=next(s for s in r['plan']['spaces'] if s['id']==it['space_id'])
                if it['design']['params']['mattressWidth']!=room['requested_mattress_width_mm']:errors.append('bed_request_mismatch:'+r['id'])
        if any(not a['result']['ok'] for req in r['layout_requests'] for a in req['attempts']):errors.append('dialogue_requires_failed_attempt_update:'+r['id'])
    return dict(records=len(batch),exchanges=sum(len(r['dialogue'])//2 for r in batch),messages=sum(len(r['dialogue']) for r in batch),
       accepted=sum(r['accepted_with_documented_source_exceptions'] for r in results),strict_pass=sum(r['strict_pass'] for r in results),
       source_exception_count=sum(len(r['source_exceptions']) for r in results),suite_errors=errors,results=results,
       passed=not errors and all(r['accepted_with_documented_source_exceptions'] for r in results),
       legal_compliance='unknown_not_certified',scope='Geometric targets with retained source exceptions; no useful-area/cadastral/clear-passage/ventilation substitution.')

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');r=audit();dump(OUT/'denetim-sonucu.json',r);print(json.dumps({k:v for k,v in r.items() if k!='results'},ensure_ascii=False,indent=2))
    for x in r['results']:
        if x['errors']:print(x['id'],x['errors'])
    sys.exit(0 if r['passed'] else 1)
