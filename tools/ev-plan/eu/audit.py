"""Offline evidence audit; model outputs are never repaired or oracle-replaced."""
import argparse, hashlib, json
from collections import Counter
from pathlib import Path
from common import DATA, read, write
from eu.contract import SYSTEM, response
from real.geometry import validate_record

def audit(directory, review, baseline):
    directory,review,baseline=map(Path,(directory,review,baseline))
    rows=[];groups={};signatures={}
    for split in ('train','validation','test'):
        chunk=[json.loads(line) for line in (directory/f'{split}.jsonl').read_text(encoding='utf8').splitlines()]
        assert all(r['split']==split and r['source_split']==split for r in chunk)
        rows+=chunk;groups[split]={r['source_building_group'] for r in chunk};signatures[split]={r['source_signature'] for r in chunk}
    assert len(rows)==2400 and Counter(r['language'] for r in rows)==dict.fromkeys(('tr','en','de','fr','nl','da','es','it'),300)
    texts=[]
    profiles=read(DATA/'ulke-profilleri.eu.json')['countries']
    heldout={t['id'] for p in profiles.values() for t in p['typologies'] if t['held_out_from_training']}
    for r in rows:
        assert r['messages'][0]==dict(role='system',content=SYSTEM)
        assert r['synthetic'] and not r['human_approved'] and r['source_country']=='CH' and r['license']=='CC-BY-4.0'
        answer=response(json.loads(r['messages'][-1]['content']))
        texts.append(next(m['content'] for m in reversed(r['messages']) if m['role']=='user'))
        if r['housing_type'] in heldout:assert r['split']=='test'
        if answer['plan_program']:
            p=answer['plan_program'];assert (p['country'],p['region'],p['housing_type'])==(r['country'],r['region'],r['housing_type'])
            assert p['bedrooms']==sum(x['kind']=='bedroom' for x in p['rooms'])
    assert len(set(texts))==2400
    for a,b in [('train','test'),('train','validation'),('validation','test')]:
        assert not groups[a]&groups[b] and not signatures[a]&signatures[b]
    assert heldout <= {r['housing_type'] for r in rows if r['split']=='test'}
    cases=read(review/'cases.json');assert len(cases)==52
    geometry=[]
    for c in cases:
        source=read(review/'records'/f"{c['id']}-source.json");proposal=read(review/'records'/f"{c['id']}-proposal.json")
        assert source['country']=='CH' and proposal['country']=='CH'
        assert proposal['target_context']['country']==c['target_country']
        result=validate_record(proposal,source);assert result['valid'],result
        geometry.append(c['id'])
    raw=[json.loads(x) for x in (baseline/'responses.jsonl').read_text(encoding='utf8').splitlines()]
    assert len(raw)==16
    executions=[]
    for row in raw:
        # If a future valid program appears, this audit refuses to invent an execution score.
        if row['format_valid'] and row['response']['status']=='program':
            raise ValueError('Valid model program needs an actual planner execution before scoring')
        if row['case']=='complete_program':executions.append(dict(id=row['id'],passed=False,reason='no valid model program; planner not invoked'))
    report=dict(rows=len(rows),languages=dict(Counter(r['language'] for r in rows)),response_contract_passed=len(rows),
        unique_final_user_utterances=len(set(texts)),source_building_overlap=0,source_signature_overlap=0,heldout_type_leakage=0,
        review_cases=len(cases),first_option_geometry_valid=len(geometry),human_approved=0,
        model=dict(examples=16,format_valid=sum(r['format_valid'] for r in raw),status_correct=sum(r['status_correct'] for r in raw),
            program_to_valid_geometry=dict(denominator=8,passed=0,cases=executions),
            errors=dict(Counter((r['error'] or 'none').split(':')[0] for r in raw)),
            truncated=sum(r.get('done_reason')=='length' for r in raw)),
        system_sha256=hashlib.sha256(SYSTEM.encode()).hexdigest(),gpu_gate='closed',training_started=False)
    write(directory/'audit.json',report);return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',required=True);p.add_argument('--review',required=True);p.add_argument('--baseline',required=True);a=p.parse_args()
    print(json.dumps(audit(a.data,a.review,a.baseline)))
