"""Same contract for oracle replay and local Ollama baselines; never calls paid APIs."""
import argparse
import copy
import json
import time
import urllib.request
from pathlib import Path
from common import read, write, compact, sources, digest, SYSTEM, CONTRACT, FAMILIES
from generator import generate
from validate import validate
from shapely.geometry import Polygon


def execute(response, previous=None):
    if not isinstance(response,dict) or set(response)!= {'actions','reply','requires_designer_review'}:
        raise ValueError('Expected exact response object')
    if response['requires_designer_review'] is not True or not isinstance(response['reply'],str) or not response['reply'].strip():raise ValueError('Missing designer review/reply')
    actions=response['actions']
    if not isinstance(actions,list) or len(actions)>1:raise ValueError('At most one typed action')
    if not actions:return None
    action=actions[0]
    if set(action)!= {'type','args'} or action['type'] not in ('plan.create','plan.replace','plan.swap_room_uses'):raise ValueError('Unknown action')
    args=dict(action['args'])
    if action['type'] in ('plan.replace','plan.swap_room_uses'):
        if not previous or args.pop('expected_revision',None)!=previous['revision'] or args.pop('base_project_id',None)!=previous['project_id']:raise ValueError('Stale project/revision')
    if action['type']=='plan.swap_room_uses':
        if set(args)!= {'a','b'}:raise ValueError('Bad swap args')
        plan=copy.deepcopy(previous);a=next(s for s in plan['spaces'] if s['id']==args['a']);b=next(s for s in plan['spaces'] if s['id']==args['b'])
        if a['kind'] not in ('bath','study') or b['kind'] not in ('bath','study') or a['level_id']!=b['level_id']:raise ValueError('Unsupported use swap')
        a['kind'],b['kind']=b['kind'],a['kind'];a['name'],b['name']=b['name'],a['name']
    else:
        if set(args)-{'family','bedrooms','seed','living_extra_mm'} or not {'family','bedrooms','seed'}<=set(args):raise ValueError('Bad create arguments')
        for k in ('bedrooms','seed','living_extra_mm'):
            if k in args and type(args[k]) is not int:raise ValueError('Arguments must use integers')
        if args['seed']<0 or args['seed']>2147483647:raise ValueError('Seed out of range')
        plan=generate(**args)
    if previous:
        plan['project_id']=previous['project_id'];plan['revision']=previous['revision']+1;plan['review']['revision']=plan['revision']
    return plan


def score(row,response):
    try:
        if isinstance(response,str):response=json.loads(response)
        plan=execute(response,row.get('previous_plan'))
        expected=row['expected']
        if expected.get('no_action'):
            reply=response['reply'].lower()
            appropriate=('?' in reply) if expected['mode']=='clarification' else any(w in reply for w in ('onay','yapamam','uzman','cannot','approval','refus'))
            return dict(format_valid=True,valid=plan is None,intent=plan is None and appropriate,violations=0,levels=True,no_action_mode=expected['mode'],semantic_scoring='keyword_heuristic_requires_human_review')
        if plan is None:return dict(format_valid=True,valid=False,intent=False,violations=1,levels=False)
        result=validate(plan)
        intent=(sum(s['kind']=='bedroom' for s in plan['spaces'])==expected['bedrooms'] and plan['dwelling']['kind']==expected['kind'] and plan['dwelling']['family']==expected['family'])
        area=sum(Polygon(s['boundary_xy_mm']).area for s in plan['spaces'])/1e6
        return dict(format_valid=True,valid=result['valid'],intent=intent,violations=len(result['errors']),levels=len(plan['levels'])==expected['levels'],area_consistent=abs(area-row['target_net_area_m2'])<.01,plan_hash_match=digest(plan)==row['target_plan_hash'],error_codes=[e['code'] for e in result['errors']])
    except (ValueError,TypeError,KeyError,StopIteration) as e:
        return dict(format_valid=False,valid=False,intent=False,violations=None,levels=False,error=str(e))


def evaluate(dataset,mode='oracle',model='qwen3.5:9b',limit=4,output=None):
    dataset=Path(dataset);manifest=read(dataset/'manifest.json')
    if manifest['sources']!=sources():raise ValueError('STALE_DATASET: regenerate from current studio/schema/tools')
    rows=[json.loads(line) for line in (dataset/'test.jsonl').read_text(encoding='utf-8').splitlines()]
    # Frozen small pilot: first instance of each held-out layout + no-action, both languages.
    pilot_keys=[('courtyard','tr-simple'),('notch','en-simple'),('courtyard','clarification'),('safety-test','refusal')]
    picked=[next(r for r in rows if (r['group'],r['variant'])==key) for key in pilot_keys][:limit]
    if mode=='oracle':picked=rows
    results=[]
    for row in picked:
        start=time.time();raw=None
        if mode=='oracle':raw=row['messages'][-1]['content']
        else:
            payload=dict(model=model,messages=row['messages'][:-1],stream=False,think=False,format='json',keep_alive=0,
                         options=dict(num_gpu=0,num_ctx=8192,num_predict=768,temperature=0,seed=42))
            req=urllib.request.Request('http://127.0.0.1:11434/api/chat',data=compact(payload).encode(),headers={'Content-Type':'application/json'})
            try:
                with urllib.request.urlopen(req,timeout=180) as r:reply=json.load(r)
                raw=reply['message']['content']
            except Exception as exc:
                results.append(dict(id=row['id'],elapsed_seconds=round(time.time()-start,2),status='unavailable',error=type(exc).__name__));break
        results.append(dict(id=row['id'],status='measured',elapsed_seconds=round(time.time()-start,2),raw=raw,**score(row,raw)))
    measured=[r for r in results if r['status']=='measured'];n=len(measured)
    report=dict(mode=mode,model='oracle_target_replay_NOT_MODEL' if mode=='oracle' else model,contract=CONTRACT,source_fingerprint=digest(sources()),test_file_hash=manifest['files']['test.jsonl'],
                selected_ids=[r['id'] for r in picked],measured=n,total_requested=len(picked),
                rates={key:sum(bool(r.get(key)) for r in measured)/n if n else None for key in ('format_valid','valid','intent','levels')},
                area_consistency_rate=sum(bool(r.get('area_consistent')) for r in measured if 'area_consistent' in r)/sum('area_consistent' in r for r in measured) if any('area_consistent' in r for r in measured) else None,
                rule_violations=sum(r['violations'] or 0 for r in measured),results=results,
                note='Oracle replay tests data/tool plumbing, not model quality. Local model pilot is capped at 768 output tokens and 180s/request; truncation/timeouts are reported, not hidden. No fine-tuning.')
    if output:write(output,report)
    return report


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--dataset',default='outputs/ev-qwen-00');ap.add_argument('--mode',choices=['oracle','ollama'],default='oracle');ap.add_argument('--model',default='qwen3.5:9b');ap.add_argument('--limit',type=int,default=4);ap.add_argument('--output',required=True);a=ap.parse_args();r=evaluate(a.dataset,a.mode,a.model,a.limit,a.output);print(compact({k:v for k,v in r.items() if k!='results'}))
