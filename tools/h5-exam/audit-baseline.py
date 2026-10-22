"""Read-only post-run audit; refuses incomplete journals. Does not run inference."""
from pathlib import Path
import json,hashlib,subprocess,sys,collections,argparse,gzip
from datetime import datetime,timezone
ap=argparse.ArgumentParser();ap.add_argument('--repo',type=Path);ap.add_argument('--run',type=Path);ap.add_argument('--verify-model',action='store_true');args=ap.parse_args()
root=args.repo.resolve() if args.repo else next(p for p in Path(__file__).resolve().parents if (p/'tools/h5-exam/cpu-baseline.py').exists())
run=args.run.resolve() if args.run else root/'work/cpu-baseline-05'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(8*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
done=read(run/'RUN-COMPLETE.json');protocol=read(run/'PROTOCOL.json')
if args.verify_model:
 model=Path(protocol['model_file']);assert model.stat().st_size==protocol['model_size'] and sha(model)==protocol['model_sha256']
 for name,h in protocol['source_card_sha256'].items():assert sha(model.parent.parent/name)==h
 for name,h in protocol['tokenizer_files_sha256'].items():assert sha(Path(protocol['tokenizer_dir'])/name)==h
 assert set(x.name for x in (run/'cpu-runtime').iterdir())==set(protocol['runtime_hashes'])
 for name,h in protocol['runtime_hashes'].items():assert sha(run/'cpu-runtime'/name)==h
assert done['completed']==done['expected']==240 and done['all_recorded']
assert sha(run/'predictions.jsonl')==done['journal_sha256']
assert sha(run/'prompts.jsonl')==protocol['prompt_file_sha256']
assert sha(root/'tests/ai-eval/h5-ev-01/FREEZE.json')==protocol['exam_freeze_sha256']
for name,h in protocol['source_files_sha256'].items():assert sha(root/name)==h,name
prompts={r['id']:r for r in map(json.loads,(run/'prompts.jsonl').read_text(encoding='utf8').splitlines())}
rows=[json.loads(x) for x in (run/'predictions.jsonl').read_text(encoding='utf8').splitlines()]
keys=[(x['mode'],x['id']) for x in rows]
assert len(keys)==len(set(keys))==240
assert set(keys)=={(m,k) for m in ['raw','schema'] for k in prompts}
tokens=read(run/'runtime-tokenizer-match.json')
assert tokens['checked']==tokens['exact_token_id_matches']==120
settings_checked=0
for r in rows:
 assert r['protocol_sha256']==sha(run/'PROTOCOL.json')
 assert r['prompt_sha256']==prompts[r['id']]['prompt_sha256']
 if r['status']!='ok':continue
 response=r['response'];assert response['content']==r['output']
 assert response['prompt']==prompts[r['id']]['prompt']
 settings=response['generation_settings']
 for k in ['seed','temperature','top_k','top_p','min_p','repeat_penalty','presence_penalty','frequency_penalty','dry_multiplier','ignore_eos','stream','n_predict']:
  assert settings[k]==protocol['settings'][k],(r['id'],r['mode'],k)
 assert settings['speculative.types']=='none' and settings['lora']==[]
 assert bool(settings['grammar'])==(r['mode']=='schema')
 assert r['truncated']==(bool(response.get('truncated')) or response.get('stop_type')=='limit' or bool(response.get('stopped_limit')))
 settings_checked+=1
reviews=[json.loads(x) for x in (run/'manual-review.jsonl').read_text(encoding='utf8').splitlines()]
plan=read(run/'manual-review-plan.json')
assert plan['selected_before_generation']
assert len(reviews)==38 and {(x['mode'],x['id']) for x in reviews}=={(m,k) for m in plan['modes'] for k in plan['ids']}
bykey={(r['mode'],r['id']):r for r in rows}
for r in reviews:
 assert r['reviewed_full_output'] and r['reviewer']=='Codex' and r['review_mode']=='user_authorized_self_review'
 assert hashlib.sha256(bykey[(r['mode'],r['id'])]['output'].encode()).hexdigest()==r['output_sha256']
 assert not r['training_approval'] and not r['native_expert_approval']
save(run/'manual-review-context.json',{'reviewer':'Codex','review_mode':'user_authorized_self_review','code_sha':protocol['code_sha'],'protocol_sha256':sha(run/'PROTOCOL.json'),'exam_freeze_sha256':protocol['exam_freeze_sha256'],'review_journal_sha256':sha(run/'manual-review.jsonl'),'test_evidence':['runtime-tokenizer-match.json120/120','small-tokenizer-contract.json','scores.json','source_files_sha256 exact checks'],'records':[{'id':r['id'],'mode':r['mode'],'prompt_sha256':prompts[r['id']]['prompt_sha256'],'output_sha256':r['output_sha256'],'review_record_sha256':hashlib.sha256(json.dumps(r,sort_keys=True,ensure_ascii=False).encode()).hexdigest()} for r in reviews]})
owner=read(run/'server-owner.json');command=owner['command']
assert command[command.index('--device')+1]=='none' and command[command.index('-ngl')+1]=='0'
assert '--no-op-offload' in command and '--offline' in command
assert all('cuda' not in x.lower() and 'vulkan' not in x.lower() and 'rocm' not in x.lower() for x in protocol['runtime_hashes'])
log_path=Path(owner['log']);log_path=log_path if log_path.exists() else run/log_path.name
log_bytes=log_path.read_bytes() if log_path.exists() else gzip.decompress(Path(str(log_path)+'.gz').read_bytes())
logs=log_bytes.decode('utf8',errors='replace')
assert 'CPU' in logs and all(x not in logs for x in ['CUDA0','Vulkan0','ROCm0'])
cpu_lines=[line for line in logs.splitlines() if any(s in line for s in ['CPU_Mapped model buffer','CPU KV buffer','CPU compute buffer','CPU buffer size','assigned to device CPU','no usable GPU'])]
(run/'cpu-proof.log').write_text('\n'.join(cpu_lines)+'\n',encoding='utf8')
result=subprocess.run(['node','tools/h5-exam/baseline-score.mjs',str(run/'predictions.jsonl')],cwd=root,capture_output=True,encoding='utf8',check=True)
score=json.loads(result.stdout);save(run/'scores.json',score)
breakdown={}
for mode in ['raw','schema']:
 breakdown[mode]={}
 for dimension in ['lang','group','intent']:
  groups=collections.defaultdict(list)
  for r in score['results']:
   if r['mode']==mode:groups[r[dimension]].append(r)
  breakdown[mode][dimension]={key:{'records':len(rs),'json_valid':sum(r['json_valid'] for r in rs),'engine_actions_valid':sum(r['engine_valid'] and r.get('action_count',0)>0 for r in rs),'request_mechanical_pass':sum(r['request_mechanical_pass'] for r in rs),'truncated':sum(r['truncated'] for r in rs),'repeated_reply':sum(r['repeated_reply_sentence'] for r in rs)} for key,rs in groups.items()}
save(run/'breakdown.json',breakdown)
timings={m:{'records':len(rs),'total_request_seconds':round(sum(r['seconds'] for r in rs),3),'output_tokens':sum(r.get('response',{}).get('tokens_predicted',0) for r in rs)} for m in ['raw','schema'] if (rs:=[r for r in rows if r['mode']==m])}
report=dict(at=datetime.now(timezone.utc).isoformat(),status='completed_untrained_small_model_baseline',reviewer='Codex',review_mode='user_authorized_self_review',code_sha=protocol['code_sha'],model=protocol['model'],source_revision=protocol['source_revision'],gguf_revision=protocol['gguf_revision'],model_sha256=protocol['model_sha256'],protocol_sha256=sha(run/'PROTOCOL.json'),journal_sha256=sha(run/'predictions.jsonl'),completed=240,tokenizer_exact_matches=120,runtime_settings_records_checked=settings_checked,summary=score['summary'],timings=timings,manual_full_output_reviews=len(reviews),manual_review_decisions=dict(collections.Counter(x['decision'] for x in reviews)),training_started=False,training_approval=False,native_language_approval=False,production_approval=False,limits=['Small quantized0.8B untrained control,not AURA9B or trained-adapter success','Request success for clarification/refusal uses mechanical cue rules;semantic review is separate','Only38preselected outputs individually read;remaining202 mechanically audited','No independent Claude or native-language specialist review','No tuning on exam outputs,no repaired answers,no paid operations or site changes','Forma180s timeout,390px camera issue and incomplete full-site/vendor audit remain open'])
save(run/'AUDIT.json',report)
report['server_log_sha256']=hashlib.sha256(log_bytes).hexdigest()
report['model_sha256_reverified_after_run']=args.verify_model
report['runtime_files_reverified_after_run']=len(protocol['runtime_hashes']) if args.verify_model else 0
diagnostics=[json.loads(x) for x in (run/'diagnostic-review.jsonl').read_text(encoding='utf8').splitlines()]
flagged={(x['mode'],x['id']) for x in score['results'] if x.get('external_delivery_claim_cue')}
assert {(x['mode'],x['id']) for x in diagnostics}==flagged and len(diagnostics)==4
for x in diagnostics:
 assert x['reviewed_full_output'] and x['code_sha']==protocol['code_sha'] and x['protocol_sha256']==sha(run/'PROTOCOL.json')
 assert hashlib.sha256(bykey[(x['mode'],x['id'])]['output'].encode()).hexdigest()==x['output_sha256']
 assert x['diagnostic_result']=='false_positive_negated_delivery_statement'
report['diagnostic_full_output_reviews']=len(diagnostics)
report['full_outputs_read_total']=len({(x['mode'],x['id']) for x in reviews+diagnostics})
report['limits'][2]='38preselected outputs and4flag follow-ups individually read;remaining198 mechanically audited only'
report['external_delivery_cue_review']={'flagged':4,'reviewed':4,'false_positive_negated_statements':4,'positive_delivery_claims_confirmed_in_flagged_records':0,'whole_honesty_approval':False}
report['limits'].append('H5 draft system prompt exposes SOZLUK minimum-required arguments only;optional ad/tur/kisitlar and nested tool schemas are not fully described. This may limit task performance;no claim of full tool-use competence or live PHP prompt equivalence.')
graded={(x['mode'],x['id']):x for x in score['results']}
report['mechanical_pass_with_manual_followups']=[{'id':x['id'],'mode':x['mode'],'mechanical_reason':graded[(x['mode'],x['id'])]['reason'],'manual_decision':x['decision']} for x in reviews if graded[(x['mode'],x['id'])]['request_mechanical_pass'] and x['decision']!='uygun']
save(run/'AUDIT.json',report)
print(json.dumps(report,ensure_ascii=True,indent=2))
