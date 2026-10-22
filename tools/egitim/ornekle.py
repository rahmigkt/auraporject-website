"""E2 CPU-only sampling and quarantine, not training. Explicit pinned local files.

prepare freezes fresh requests, code/runtime/model/tokenizer SHA and settings.
run writes every attempt (including failures) once. score calls the E1 CLI.
"""
from pathlib import Path
import argparse,hashlib,json,os,socket,subprocess,sys,time,urllib.request,contextlib
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/qwen-local'))
from egitim01_features import LocalTextTokenizer,prepare_features,normalize_messages,END,EMPTY_THINK
SETTINGS={'n_predict':512,'temperature':0.8,'top_p':0.95,'top_k':40,'min_p':0.0,'repeat_penalty':1.0,
          'presence_penalty':0.0,'frequency_penalty':0.0,'dry_multiplier':0.0,'cache_prompt':False,
          'ignore_eos':False,'stream':False,'return_tokens':True,'stop':[]}
THRESHOLD=4/6  # Fixed before sampling: four mechanical components, all hard gates.
MODEL_SHA='37ae482d336108d23516fa35e8e0c4126688d81018b87178a18d752a1357814f'
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()
def save(p,x):Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def rows(p):return [json.loads(x) for x in Path(p).read_text(encoding='utf-8').splitlines() if x]
def dump(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def now():return datetime.now(timezone.utc).isoformat()
def generation_truncated(response):
 # Native `truncated` refers to context; token-limit completion is stop_type.
 return bool(response.get('truncated') or response.get('stop_type')=='limit' or response.get('stopped_limit'))
def code_files():return ['tools/egitim/ornekle.py','tools/egitim/e2-istekler.mjs','tools/egitim/puanla.mjs','tools/egitim/strict-json.mjs','tools/qwen-local/egitim01_features.py']
def engine():
 names=subprocess.check_output(['git','ls-files','-z','--','assets','tools/studyo-motoru'],cwd=ROOT).decode().split('\0')
 return hashlib.sha256(dump({n:sha(ROOT/n) for n in names if n}).encode()).hexdigest()
def prepare(a):
 out=a.output.resolve();out.mkdir(parents=True,exist_ok=True)
 if (out/'PROTOCOL.json').exists():raise ValueError('Preserve existing protocol')
 c=json.loads(a.config.read_text(encoding='utf-8'));build=json.loads(subprocess.check_output(['node','tools/egitim/e2-istekler.mjs',str(a.config.resolve())],cwd=ROOT,text=True,encoding='utf-8'))
 tok=LocalTextTokenizer(a.tokenizer);tasks=build['tasks'];prompts=[]
 for t in tasks:
  prefix=tok.template.render(messages=t['messages'],add_generation_prompt=True,enable_thinking=False,add_vision_id=False,tools=None,eos_token=tok.eos_token,bos_token='')
  assert prefix.endswith('<|im_start|>assistant\n'+EMPTY_THINK)
  ids=tok.backend.encode(prefix,add_special_tokens=False).ids
  payload='{"reply":"Ön kontrol.","actions":[]}'
  messages=t['messages']+[{'role':'assistant','content':payload}]
  assert tok.render(normalize_messages({'messages':messages}))==prefix+payload+END+'\n'
  features,_=prepare_features(tok,[{'id':t['id'],'messages':messages}],8192)
  assert features[0]['input_ids'][:len(ids)]==ids and all(n==-100 for n in features[0]['labels'][:len(ids)])
  assert len(ids)+SETTINGS['n_predict']<=8192
  prompts.append({'id':t['id'],'prompt':prefix,'token_ids':ids})
 for name,data in [('tasks.jsonl',tasks),('prompts.jsonl',prompts)]:
  (out/name).write_text(''.join(dump(t)+'\n' for t in data),encoding='utf-8',newline='\n')
 runtime=a.runtime.resolve();binary=runtime/'llama-server.exe';assert binary.exists()
 assert all(f.is_file() for f in runtime.iterdir()),'CPU-only runtime must not include GPU subdirectories'
 p={'schema':'aura.e2.cpu-dry-run/1','at':now(),'model':str(a.model.resolve()),'model_sha256':sha(a.model),
  'required_model_sha256':MODEL_SHA,
  'model_identity':'Qwen/Qwen3.5-0.8B Q8_0; untrained AURA control, not Qwen-EGITIM-01',
  'tokenizer':str(a.tokenizer.resolve()),'tokenizer_files':tok.file_hashes,'runtime':str(runtime),
  'runtime_files':{f.name:sha(f) for f in runtime.iterdir() if f.is_file()},'settings':SETTINGS,'samples_per_request':a.samples,
  'production_samples_per_request':8,'expected_requests':20,'expected_attempts':20*a.samples,'seeds':[20261023+i for i in range(a.samples)],
  'threads':6,'context':8192,'condition':'raw_sampled','selection_threshold':THRESHOLD,
  'files':{f:sha(out/f) for f in ['tasks.jsonl','prompts.jsonl']},'source_files':{f:sha(ROOT/f) for f in code_files()},
  'input_files':{str(Path(f).resolve()):sha(f) for f in [c['h4'],c['train'],c['dev'],*c['exams']]},
  'h1_sources':{str(f.resolve()):sha(f) for f in Path(c['h1']).glob('*.jsonl')},
  'engine_working_files_sha256':engine(),'code_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
  'data_checks':build['checks'],'model_run':False,'training_started':False,'training_approved':False,'no_schema_constraint':True}
 assert p['model_sha256']==p['required_model_sha256']
 save(out/'PROTOCOL.json',p);print(dump({'prepared':20,'attempts':p['expected_attempts'],'tokenizer_masks_checked':20,'max_prompt_tokens':max(len(x['token_ids']) for x in prompts)}),flush=True)
def verify(out,p):
 assert sha(p['model'])==p['model_sha256']==p['required_model_sha256']==MODEL_SHA
 for base,table in [(out,p['files']),(ROOT,p['source_files']),(Path(p['runtime']),p['runtime_files']),(Path(p['tokenizer']),p['tokenizer_files'])]:
  for f,h in table.items():assert sha(base/f)==h,str(base/f)
 for f,h in {**p['input_files'],**p['h1_sources']}.items():assert sha(f)==h,f
 assert engine()==p['engine_working_files_sha256'],'Engine changed; preserve existing journal'
@contextlib.contextmanager
def exclusive(out):
 import msvcrt
 with (out/'runner.lock').open('a+b') as f:
  if f.seek(0,2)==0:f.write(b'0');f.flush()
  f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_NBLCK,1)
  try:yield
  finally:f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_UNLCK,1)
class Server:
 def __init__(self,out,p):self.out,self.p,self.process=out,p,None
 def http(self,route,body=None,timeout=180):
  op=urllib.request.build_opener(urllib.request.ProxyHandler({}));req=urllib.request.Request(self.url+route,data=dump(body).encode() if body is not None else None,headers={'Content-Type':'application/json'})
  with op.open(req,timeout=timeout) as r:return json.loads(r.read())
 def __enter__(self):
  p=self.p
  with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
  self.url=f'http://127.0.0.1:{port}';rt=Path(p['runtime'])
  cmd=[str(rt/'llama-server.exe'),'-m',p['model'],'--host','127.0.0.1','--port',str(port),'--device','none','-ngl','0','--no-op-offload','--fit','off','--offline','--parallel','1','--ctx-size','8192','-t','6','-tb','6','--ctx-checkpoints','0','--no-context-shift','--no-warmup','--verbosity','5']
  env={k:os.environ[k] for k in ['SystemRoot','WINDIR','PATH','PATHEXT','TEMP','TMP','COMSPEC'] if k in os.environ};env.update(CUDA_VISIBLE_DEVICES='-1',HIP_VISIBLE_DEVICES='-1',ROCR_VISIBLE_DEVICES='-1',GGML_VK_VISIBLE_DEVICES='',HF_HUB_OFFLINE='1')
  self.logpath=self.out/f'server-{time.time_ns()}.log';self.log=self.logpath.open('ab')
  self.process=subprocess.Popen(cmd,cwd=rt,env=env,stdout=self.log,stderr=self.log,creationflags=subprocess.CREATE_NO_WINDOW)
  save(self.out/'server-owner.json',{'pid':self.process.pid,'runner_pid':os.getpid(),'command':cmd,'url':self.url,'at':now()})
  try:
   for _ in range(120):
    if self.process.poll() is not None:raise RuntimeError('Server exited')
    try:
     if self.http('/health',timeout=1).get('status')=='ok':break
    except Exception:time.sleep(.5)
   else:raise RuntimeError('Startup timeout')
   log=self.logpath.read_text(encoding='utf-8',errors='replace');assert 'CPU' in log and not any(x in log for x in ['CUDA0','Vulkan0','ROCm0'])
   return self
  except BaseException:self.__exit__();raise
 def __exit__(self,*args):
  if self.process and self.process.poll() is None:
   self.process.terminate()
   try:self.process.wait(10)
   except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
  if hasattr(self,'log'):self.log.close()
def run(a):
 out=a.output.resolve();p=json.loads((out/'PROTOCOL.json').read_text(encoding='utf-8'))
 assert a.protocol_sha==sha(out/'PROTOCOL.json'),'Explicit reviewed protocol SHA required'
 if (out/'RUN-COMPLETE.json').exists():raise ValueError('Run complete; never repeat')
 with exclusive(out):
  verify(out,p);prompts=rows(out/'prompts.jsonl');journal=out/'predictions.jsonl';prior=rows(journal) if journal.exists() else []
  seen={(r['id'],r['sample']) for r in prior};assert len(seen)==len(prior)
  valid={(r['id'],s) for r in prompts for s in range(p['samples_per_request'])};assert seen<=valid
  with Server(out,p) as server:
   for r in prompts:assert server.http('/tokenize',{'content':r['prompt'],'add_special':False,'parse_special':True})['tokens']==r['token_ids']
   save(out/'runtime-tokenizer-match.json',{'checked':20,'exact_matches':20,'at':now()})
   with journal.open('a',encoding='utf-8',newline='\n') as f:
    for r in prompts:
     for sample,seed in enumerate(p['seeds']):
      if (r['id'],sample) in seen:continue
      begin=time.monotonic();record={'id':r['id'],'sample':sample,'seed':seed,'at':now()}
      try:
       response=server.http('/completion',{**p['settings'],'seed':seed,'prompt':r['prompt']})
       record.update(status='ok',output=response.get('content',''),truncated=generation_truncated(response),response=response)
      except Exception as e:record.update(status='error',output='',error=str(e),truncated=False)
      record['seconds']=time.monotonic()-begin;f.write(dump(record)+'\n');f.flush();os.fsync(f.fileno());seen.add((r['id'],sample))
      print(dump({'completed':len(seen),'total':p['expected_attempts'],'id':r['id'],'sample':sample,'status':record['status']}),flush=True)
  verify(out,p);assert len(seen)==p['expected_attempts']
  save(out/'RUN-COMPLETE.json',{'at':now(),'attempts':len(seen),'journal_sha256':sha(journal),'protocol_sha256':sha(out/'PROTOCOL.json'),'server_closed':True,'training_started':False})
def score(a):
 out=a.output.resolve();p=json.loads((out/'PROTOCOL.json').read_text(encoding='utf-8'));verify(out,p)
 assert a.protocol_sha==sha(out/'PROTOCOL.json'),'Explicit reviewed protocol SHA required'
 done=json.loads((out/'RUN-COMPLETE.json').read_text(encoding='utf-8'));assert sha(out/'predictions.jsonl')==done['journal_sha256']
 tasks={r['id']:r for r in rows(out/'tasks.jsonl')};predictions=rows(out/'predictions.jsonl');assert len(predictions)==p['expected_attempts']
 inputs=[{**tasks[r['id']],'text':r['output'],'generation':{'condition':'raw_sampled','status':r['status'],'truncated':r['truncated']}} for r in predictions]
 (out/'score-input.jsonl').write_text(''.join(dump(x)+'\n' for x in inputs),encoding='utf-8',newline='\n')
 scores=[json.loads(x) for x in subprocess.check_output(['node','tools/egitim/puanla.mjs',str(out/'score-input.jsonl')],cwd=ROOT,text=True,encoding='utf-8').splitlines()]
 assert len(scores)==p['expected_attempts']
 candidates=[];hard=[]
 for id,t in tasks.items():
  subset=[(r,s) for r,s in zip(predictions,scores) if r['id']==id]
  good=[(r,s) for r,s in subset if s['mechanical_candidate'] and s['score_lower_bound']>=THRESHOLD]
  if good:
   r,s=max(good,key=lambda rs:(rs[1]['score_lower_bound'],-rs[0]['sample']))
   candidates.append({'id':id,'producer':'Qwen3.5-0.8B-untrained-CPU','intended_future_producer':'Qwen-EGITIM-01',
    'source':t['source'],'state':t['state'],'user':t['user'],'output':r['output'],'score':s,'sample':r['sample'],
    'review':{'status':'quarantine','required_reviewer':'Claude or explicitly authorized reviewer','training_approved':False}})
  else:hard.append({'id':id,'user':t['user'],'source':t['source'],'attempts':p['samples_per_request'],'reasons':[s['components'] for _,s in subset]})
 for name,data in [('scores.jsonl',scores),('candidates.jsonl',candidates),('hard-requests.jsonl',hard)]:
  (out/name).write_text(''.join(dump(x)+'\n' for x in data),encoding='utf-8',newline='\n')
 report={'attempts':p['expected_attempts'],'requests':len(tasks),'mechanical_candidates':len(candidates),'hard_requests':len(hard),'training_approved':0,
  'transport_errors':sum(r['status']!='ok' for r in predictions),'truncated':sum(r['truncated'] for r in predictions),
  'components':{k:{v:sum(s['components'][k]['status']==v for s in scores) for v in ['pass','fail','review']} for k in scores[0]['components']},
  'score_lower_bounds':[s['score_lower_bound'] for s in scores],'threshold':THRESHOLD,'threshold_selected_before_sampling':True,
  'no_training_or_dataset_merge':True,'model_identity':p['model_identity'],'data_checks':p['data_checks']}
 save(out/'SCORES.json',report);print(dump(report),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','run','score']);p.add_argument('--output',type=Path,required=True)
 for name in ['config','model','tokenizer','runtime']:p.add_argument('--'+name,type=Path)
 p.add_argument('--samples',type=int,choices=[4,8],default=8);p.add_argument('--protocol-sha');a=p.parse_args();{'prepare':prepare,'run':run,'score':score}[a.command](a)
