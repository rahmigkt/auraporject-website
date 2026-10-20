"""Independent geometry audit plus country-transfer and dialogue invariants."""
import copy
import json
import sys
from collections import Counter
from build02 import ROOT,dump
from uk_ie import OUT,REGIONS
from denetim import check,sentences

def records():return [json.loads(p.read_text(encoding='utf-8')) for p in sorted(OUT.glob('ev-sohbet-uk-ie-*.json'))]

def audit(batch=None):
    batch=records() if batch is None else batch
    parent=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((ROOT/'knowledge/ai-egitim/veri/ev-sohbet-02').glob('ev-sohbet-02-*.json'))]
    errors=[];seen={};results=[check(r,OUT/'kaynaklar') for r in batch]
    if len(batch)!=8 or Counter(r['country'] for r in batch)!=Counter(GB=4,IE=4):errors.append('country_distribution')
    if [r['region'] for r in batch]!=REGIONS:errors.append('jurisdiction_distribution')
    if len({r['source']['id'] for r in parent+batch})!=28:errors.append('source_reuse')
    for r in parent+batch:
        for m in r['dialogue']:
            if m['role']=='assistant':
                for sentence in sentences(m['content']):
                    if sentence in seen:errors.append('duplicate_sentence:'+r['id']+':'+seen[sentence])
                    seen[sentence]=r['id']
    for r in batch:
        if [m['role'] for m in r['dialogue']]!=['user','assistant']*8:errors.append('dialogue_turns:'+r['id'])
        if r['language']!='en' or r['training_started']:errors.append('execution_scope:'+r['id'])
        if len(r['plan']['levels'])!=1 or r['source']['multi_floor_source']:errors.append('invented_floor:'+r['id'])
        if r['plan']['dwelling']['source_country']!='CH' or r['plan']['dwelling']['existing_house_claim']:errors.append('geographic_claim:'+r['id'])
        if r.get('jurisdiction_review',{}).get('compliance')!='unknown_not_certified':errors.append('unearned_compliance:'+r['id'])
        if r.get('jurisdiction_review',{}).get('gross_internal_area_m2','missing') is not None:errors.append('net_as_gia:'+r['id'])
        if r.get('jurisdiction_review',{}).get('jurisdiction')!=r['region']:errors.append('wrong_jurisdiction:'+r['id'])
        for it in r['plan']['items']:
            if it['design']['kind']=='bed':
                room=next(s for s in r['plan']['spaces'] if s['id']==it['space_id'])
                if it['design']['params']['mattressWidth']!=room['requested_mattress_width_mm']:errors.append('bed_request_mismatch:'+r['id'])
        if any(not a['result']['ok'] for req in r['layout_requests'] for a in req['attempts']):errors.append('dialogue_needs_no_fit_update:'+r['id'])
    return dict(records=len(batch),exchanges=sum(len(r['dialogue'])//2 for r in batch),messages=sum(len(r['dialogue']) for r in batch),
        accepted=sum(x['accepted_with_documented_source_exceptions'] for x in results),strict_pass=sum(x['strict_pass'] for x in results),
        source_exception_count=sum(len(x['source_exceptions']) for x in results),suite_errors=errors,results=results,
        passed=not errors and all(x['accepted_with_documented_source_exceptions'] for x in results),
        legal_scope='Internal project targets are not national legal thresholds; all local statutory compliance remains unknown.')

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');result=audit();dump(OUT/'denetim-sonucu.json',result)
    print(json.dumps({k:v for k,v in result.items() if k!='results'},ensure_ascii=False,indent=2))
    for r in result['results']:
        if r['errors']:print(r['id'],r['errors'])
    sys.exit(0 if result['passed'] else 1)
