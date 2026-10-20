"""Loopback Ollama baseline with child-process hard deadlines and per-case evidence.

Never installs/pulls models. Client deadline is not proof the Ollama server unloaded
its model: keep_alive=0 is requested and process status should be inspected.
"""
import argparse
import hashlib
import json
import multiprocessing as mp
import time
import urllib.request
from pathlib import Path
from common import read,write,digest
from build_v2 import source_hashes
from legacy_v03.program import response
from solver.layout import solve
from metrics import measure


def request_worker(payload, path):
    started=time.monotonic()
    try:
        req=urllib.request.Request('http://127.0.0.1:11434/api/chat',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(req,timeout=3600) as res:body=res.read().decode()
        write(path,dict(elapsed_seconds=time.monotonic()-started,raw=body))
    except Exception as exc:write(path,dict(elapsed_seconds=time.monotonic()-started,error=type(exc).__name__+': '+str(exc)))


def run(data,out,model,count,deadline,total):
    data=Path(data);out=Path(out)
    if out.exists():raise ValueError('New run directory required')
    out.mkdir(parents=True)
    manifest=read(data/'manifest.json')
    if manifest['sources']!=source_hashes():raise ValueError('stale dataset sources')
    test=data/'test.jsonl'
    if hashlib.sha256(test.read_bytes()).hexdigest()!=manifest['files']['test.jsonl']:raise ValueError('test file tampered')
    rows=[json.loads(line) for line in test.read_text(encoding='utf8').splitlines()]
    normal=[r for r in rows if r['plan_id']];safety=[r for r in rows if not r['plan_id']]
    selected=(safety[:2]+normal[::25]+safety[2:])[:count]
    write(out/'selection.json',dict(model=model,dataset_fingerprint=manifest['source_fingerprint'],ids=[r['id'] for r in selected],hard_case_seconds=deadline,hard_total_seconds=total,training=False))
    started=time.monotonic();results=[]
    for i,row in enumerate(selected):
        remaining=total-(time.monotonic()-started)
        if remaining<1:break
        raw=out/f'{i:03d}-raw.json'
        payload=dict(model=model,messages=row['messages'][:-1],stream=False,format='json',keep_alive=0,options=dict(num_gpu=0,num_ctx=4096,num_predict=1200,temperature=0,seed=42))
        write(out/f'{i:03d}-request.json',dict(id=row['id'],request=payload))
        proc=mp.get_context('spawn').Process(target=request_worker,args=(payload,str(raw)))
        tick=time.monotonic();proc.start();proc.join(min(deadline,remaining));timed_out=proc.is_alive()
        if timed_out:proc.terminate();proc.join(5)
        result=dict(id=row['id'],elapsed_seconds=round(time.monotonic()-tick,3),timeout=timed_out,completed_response=False,format_valid=False,solver_valid=False)
        if raw.exists():
            evidence=read(raw)
            if 'raw' in evidence:
                try:
                    ollama=json.loads(evidence['raw']);content=ollama['message']['content'];result['completed_response']=bool(ollama.get('done'))
                    answer=response(json.loads(content));result['format_valid']=True
                    target=json.loads(row['messages'][-1]['content']);result['expected_status']=target['status'];result['actual_status']=answer['status'];result['status_match']=answer['status']==target['status']
                    if answer['status']=='program':
                        expected=target['plan_program']
                        result['intent_fields_match']=all(answer['plan_program'][k]==expected[k] for k in ('typology','dwelling','bedrooms','floors','kitchen','envelope','entry','living_face','circulation','stair')) if target['status']=='program' else False
                        plans=solve(answer['plan_program'],limit=1,attempts=2);result['solver_valid']=True;result['quality']=measure(plans[0],answer['plan_program'])
                except Exception as exc:result['evaluation_error']=type(exc).__name__+': '+str(exc)
            else:result['transport_error']=evidence.get('error')
        elif timed_out:write(raw,dict(timeout=True,received_complete_response=False,partial_response_available=False))
        results.append(result);write(out/f'{i:03d}-result.json',result)
        print(row['id'],result,flush=True)
    report=dict(model=model,selected=len(selected),attempted=len(results),completed=sum(r['completed_response'] for r in results),timeouts=sum(r['timeout'] for r in results),format_valid=sum(r['format_valid'] for r in results),solver_valid=sum(r['solver_valid'] for r in results),elapsed_seconds=round(time.monotonic()-started,3),case_results=results,
                interpretation='Transport deadlines are not model quality failures. Unattempted cases have no score. No training performed.',gpu_gate='closed')
    write(out/'baseline.json',report)


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--data',required=True);ap.add_argument('--output',required=True);ap.add_argument('--model',default='qwen2.5:7b-instruct');ap.add_argument('--count',type=int,default=4);ap.add_argument('--case-seconds',type=int,default=30);ap.add_argument('--total-seconds',type=int,default=65);a=ap.parse_args()
    run(a.data,a.output,a.model,a.count,a.case_seconds,a.total_seconds)
