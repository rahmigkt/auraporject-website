"""Post-run audit. Validates original frozen producer bytes and immutable journal;
derives native token-limit flags separately. No model call, repair or replay.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess,statistics,gzip
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def lines(p):return [json.loads(x) for x in Path(p).read_text(encoding='utf-8').splitlines() if x]
def save(p,x):Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def main(a):
 out=a.output.resolve();p=json.loads((out/'PROTOCOL.json').read_text(encoding='utf-8'));done=json.loads((out/'RUN-COMPLETE.json').read_text(encoding='utf-8'))
 assert sha(out/'PROTOCOL.json')==a.protocol_sha==done['protocol_sha256']
 assert sha(out/'predictions.jsonl')==done['journal_sha256']
 assert sha(p['model'])==p['model_sha256']=='37ae482d336108d23516fa35e8e0c4126688d81018b87178a18d752a1357814f'
 for name,h in p['source_files'].items():
  f=out/'frozen-source'/name;assert sha(f)==h
  git=subprocess.check_output(['git','show',p['code_sha']+':'+name],cwd=ROOT)
  assert f.read_bytes().replace(b'\r\n',b'\n')==git.replace(b'\r\n',b'\n'),name
 # The grader itself is unchanged. Only the post-run termination annotation is
 # corrected; no altered generation code is passed off as the producer.
 for name in ['tools/egitim/puanla.mjs','tools/egitim/strict-json.mjs']:
  assert sha(ROOT/name)==p['source_files'][name]
 for base,table in [(out,p['files']),(Path(p['runtime']),p['runtime_files']),(Path(p['tokenizer']),p['tokenizer_files'])]:
  for name,h in table.items():assert sha(base/name)==h
 for name,h in {**p['input_files'],**p['h1_sources']}.items():assert sha(name)==h
 names=subprocess.check_output(['git','ls-files','-z','--','assets','tools/studyo-motoru'],cwd=ROOT).decode().split('\0')
 digest=hashlib.sha256(json.dumps({n:sha(ROOT/n) for n in names if n},ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
 assert digest==p['engine_working_files_sha256']
 tasks={r['id']:r for r in lines(out/'tasks.jsonl')};records=lines(out/'predictions.jsonl');assert len(records)==80
 assert {(r['id'],r['sample']) for r in records}=={(id,n) for id in tasks for n in range(4)}
 assert len(tasks)==20
 inputs=[];termination=[]
 for r in records:
  response=r.get('response',{});stop=response.get('stop_type')
  if r['status']=='ok':assert stop in ['eos','limit'],'Unknown termination metadata'
  flag=bool(response.get('truncated') or stop=='limit' or response.get('stopped_limit'))
  termination.append({'id':r['id'],'sample':r['sample'],'original_flag':r['truncated'],'audited_flag':flag,'stop_type':stop,
   'generation_limit':stop=='limit','context_truncated':bool(response.get('truncated'))})
  inputs.append({**tasks[r['id']],'text':r['output'],'generation':{'condition':'raw_sampled','status':r['status'],'truncated':flag}})
 (out/'audited-score-input.jsonl').write_text(''.join(json.dumps(x,ensure_ascii=False)+'\n' for x in inputs),encoding='utf-8',newline='\n')
 result=subprocess.check_output(['node','tools/egitim/puanla.mjs',str(out/'audited-score-input.jsonl')],cwd=ROOT,text=True,encoding='utf-8')
 (out/'audited-scores.jsonl').write_text(result,encoding='utf-8',newline='\n');scores=[json.loads(x) for x in result.splitlines()]
 assert len(scores)==80 and not any(s['mechanical_candidate'] for s in scores)
 assert (out/'candidates.jsonl').read_bytes()==b'' and len(lines(out/'hard-requests.jsonl'))==20
 # Strict syntax count, without stripping fences or fixing any response.
 js="import fs from 'node:fs';import {strictJSON} from './tools/egitim/strict-json.mjs';const r=fs.readFileSync(process.argv[1],'utf8').trim().split('\\n').map(JSON.parse);let n=0;for(const x of r){try{strictJSON(x.output);n++;}catch{}}console.log(n);"
 syntax=int(subprocess.check_output(['node','--input-type=module','-e',js,str(out/'predictions.jsonl')],cwd=ROOT,text=True))
 seconds=[r['seconds'] for r in records];tokens=[r.get('response',{}).get('tokens_predicted',0) for r in records]
 audit={'status':'completed_limited_CPU_dry_run;model_not_qualified','producer_code_sha':p['code_sha'],
  'protocol_sha256':a.protocol_sha,'journal_sha256':sha(out/'predictions.jsonl'),'audit_code_sha256':sha(__file__),
  'attempts':80,'requests':20,'strict_json_syntax_valid':syntax,'outer_contract_pass':sum(s['components']['bicim']['status']=='pass' for s in scores),
  'motor_pass':sum(s['components']['motor']['status']=='pass' for s in scores),'request_pass':0,'mechanical_candidates':0,'hard_requests':20,'training_approved':0,
  'transport_errors':sum(r['status']!='ok' for r in records),'generation_token_limit':sum(r['generation_limit'] for r in termination),
  'context_truncated':sum(r['context_truncated'] for r in termination),'original_runner_reported_truncated':sum(r['truncated'] for r in records),
  'counter_bug':'Original producer omitted native stop_type=limit. Original predictions and SCORES remain untouched; separate audited flags are authoritative for cutoff counts. Future producer has a regression-tested correction; no resampling.',
  'selection_unchanged':True,'original_outputs_repaired':False,'all_attempts_retained':True,
  'components':{k:{v:sum(s['components'][k]['status']==v for s in scores) for v in ['pass','fail','review']} for k in scores[0]['components']},
  'seconds':{'sum':sum(seconds),'mean':statistics.mean(seconds),'median':statistics.median(seconds),'min':min(seconds),'max':max(seconds)},
  'output_tokens':sum(tokens),'threshold':p['selection_threshold'],'data_checks':p['data_checks'],
  'model_sha256':p['model_sha256'],'runtime_files_verified':len(p['runtime_files']),'tokenizer_files_verified':len(p['tokenizer_files']),
  'model_run_repeated':False,'training_started':False,'gpu':False,'paid_service':False,'site_changed':False,
  'limits':['20 new Turkish H4-room development requests; no unused H1 rows remained.','Only placement and lighting subset; not general AURA9B, multilingual or live PHP performance.',
   'No trained EGITIM-01 checkpoint; actual producer is untrained0.8B CPU.','20x4 prototype,not activated k8/9B or automatic training integration.','Human review subset is separately bound; mechanical audit is not native/designer approval.']}
 save(out/'termination-audit.json',termination);save(out/'AUDIT.json',audit)
 assert sha(out/'predictions.jsonl')==done['journal_sha256']
 print(json.dumps({k:audit[k] for k in ['attempts','strict_json_syntax_valid','outer_contract_pass','generation_token_limit','context_truncated','mechanical_candidates','hard_requests']}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--protocol-sha',required=True);main(p.parse_args())
