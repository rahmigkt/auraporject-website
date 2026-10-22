"""Pinned, untrained, loopback-only CPU baseline. No trainer or paid provider.

prepare -> calibrate (synthetic only) -> run (120 raw +120 schema).
Original outputs and transport failures are append-only; no JSON repair/retry.
"""
from pathlib import Path
import argparse
import contextlib
import hashlib
import json
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from datetime import datetime,timezone

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/qwen-local'))
from egitim01_features import LocalTextTokenizer,normalize_messages,prepare_features,END,EMPTY_THINK
SCHEMA={'type':'object','properties':{'reply':{'type':'string'},'actions':{'type':'array','items':{'type':'object'}}},'required':['reply','actions'],'additionalProperties':False}
SETTINGS={'n_predict':512,'temperature':0,'seed':42,'cache_prompt':False,'repeat_penalty':1.0,'presence_penalty':0.0,'frequency_penalty':0.0,'dry_multiplier':0.0,'top_k':1,'top_p':1.0,'min_p':0.0,'ignore_eos':False,'stop':[],'stream':False,'return_tokens':True}
def now():return datetime.now(timezone.utc).isoformat()
def rawjson(x):return json.dumps(x,ensure_ascii=False,separators=(',',':'))
def sha(data):return hashlib.sha256(data).hexdigest()
def file_sha(p):
    h=hashlib.sha256()
    with Path(p).open('rb') as f:
        for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
    return h.hexdigest()
def save(p,x):Path(p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def node_prompts():
    text=subprocess.check_output(['node','tools/h5-exam/prompts.mjs'],cwd=ROOT,encoding='utf8')
    return [json.loads(line) for line in text.splitlines() if line.strip()]
def render(t,messages):return t.template.render(messages=messages,add_generation_prompt=True,enable_thinking=False,add_vision_id=False,tools=None,eos_token=t.eos_token,bos_token='')
def prepare(args):
    out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    if (out/'PROTOCOL.json').exists():raise ValueError('Protocol already exists; do not overwrite')
    pin=args.pin_dir.resolve();g=json.loads((pin/'gguf-api.json').read_text(encoding='utf8'));q=json.loads((pin/'source-api.json').read_text(encoding='utf8'))
    meta=next(x for x in g['siblings'] if x['rfilename']=='Qwen3.5-0.8B-Q8_0.gguf')
    t=LocalTextTokenizer(pin/'tokenizer');prompts=node_prompts();rows=[]
    for p in prompts:
        prefix=render(t,p['messages']);ids=t.backend.encode(prefix,add_special_tokens=False).ids
        assert prefix.endswith('<|im_start|>assistant\n'+EMPTY_THINK)
        payload='{"reply":"Contract probe.","actions":[]}'
        messages=p['messages']+[{'role':'assistant','content':payload}]
        assert t.render(normalize_messages({'messages':messages}))==prefix+payload+END+'\n'
        features,_=prepare_features(t,[{'id':p['id'],'messages':messages}],8192)
        assert features[0]['input_ids'][:len(ids)]==ids
        assert all(x==-100 for x in features[0]['labels'][:len(ids)])
        assert len(ids)+SETTINGS['n_predict']<=8192
        rows.append({'id':p['id'],'prompt':prefix,'token_ids':ids,'prompt_sha256':sha(prefix.encode()),'messages':p['messages']})
    assert len(rows)==120 and len({x['id'] for x in rows})==120
    prompt_file=out/'prompts.jsonl';prompt_file.write_text(''.join(rawjson(x)+'\n' for x in rows),encoding='utf8')
    runtime_src=Path('C:/Users/User/AppData/Local/Programs/Ollama/lib/ollama');runtime=out/'cpu-runtime';runtime.mkdir(exist_ok=True)
    # Top-level DLLs are the CPU runtime. GPU subdirectories are never copied.
    for p in [runtime_src/'llama-server.exe',*runtime_src.glob('*.dll')]:shutil.copy2(p,runtime/p.name)
    runtime_hashes={p.name:file_sha(p) for p in runtime.iterdir() if p.is_file()}
    protocol={'schema':'aura.h5.cpu-baseline/1','created_at':now(),'model':'Qwen/Qwen3.5-0.8B','source_revision':q['sha'],'gguf_repository':g['id'],'gguf_revision':g['sha'],'model_file':str(pin/'gguf'/meta['rfilename']),'model_size':meta['size'],'model_sha256':meta['lfs']['sha256'],'tokenizer_dir':str(pin/'tokenizer'),'tokenizer_files_sha256':t.file_hashes,'prompt_file_sha256':file_sha(prompt_file),'exam_freeze_sha256':file_sha(ROOT/'tests/ai-eval/h5-ev-01/FREEZE.json'),'runtime_hashes':runtime_hashes,'runtime_version':subprocess.check_output([str(runtime/'llama-server.exe'),'--version'],text=True,stderr=subprocess.STDOUT).strip(),'runtime_origin':'CPU binaries supplied by installed Ollama0.40.7; no GPU backend directories','settings':SETTINGS,'schema_constraint':SCHEMA,'threads':6,'context':8192,'expected_per_mode':120,'modes':['raw','schema'],'model_loaded':False,'training_started':False,'adapter':False,'draft_model':False,'code_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'source_files_sha256':{name:file_sha(ROOT/name) for name in ['tools/h5-exam/cpu-baseline.py','tools/h5-exam/baseline-score.mjs','tools/h5-exam/prompts.mjs','tools/qwen-local/egitim01_features.py']},'limits':['Small Q8 CPU model, not trained AURA9B performance','GGUF maintainer artifact is hash-pinned; not an independent tensor-by-tensor quantization audit','H5 prompts are draft, not live PHP integration','No official semantic/native-language/training approval']}
    for name in ['tests/ai-eval/aura-sinav-01/score.mjs','tools/h5-exam/contract.mjs','tools/h5-exam/load.mjs']:
        protocol['source_files_sha256'][name]=file_sha(ROOT/name)
    protocol['source_card_sha256']={name:file_sha(pin/name) for name in ['source-README.md','gguf-README.md','source-api.json','gguf-api.json']}
    save(out/'PROTOCOL.json',protocol);print(rawjson({'prepared':120,'maximum_prompt_tokens':max(len(x['token_ids']) for x in rows),'runtime_files':len(runtime_hashes),'protocol_sha256':file_sha(out/'PROTOCOL.json')}),flush=True)

@contextlib.contextmanager
def exclusive(out):
    import msvcrt
    with (out/'runner.lock').open('a+b') as f:
        if f.seek(0,2)==0:f.write(b'0');f.flush()
        f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_NBLCK,1)
        try:yield
        finally:f.seek(0);msvcrt.locking(f.fileno(),msvcrt.LK_UNLCK,1)

class Server:
    def __init__(self,out,protocol):self.out=out;self.protocol=protocol;self.process=None
    def http(self,route,payload=None,timeout=120):
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        request=urllib.request.Request(self.url+route,data=rawjson(payload).encode() if payload is not None else None,headers={'Content-Type':'application/json'})
        with opener.open(request,timeout=timeout) as r:return json.loads(r.read())
    def __enter__(self):
        p=self.protocol
        assert file_sha(p['model_file'])==p['model_sha256'] and Path(p['model_file']).stat().st_size==p['model_size']
        assert set(x.name for x in (self.out/'cpu-runtime').iterdir())==set(p['runtime_hashes']),'Unexpected runtime file/directory'
        for name,h in p['runtime_hashes'].items():assert file_sha(self.out/'cpu-runtime'/name)==h
        for name,h in p['tokenizer_files_sha256'].items():assert file_sha(Path(p['tokenizer_dir'])/name)==h
        for name,h in p['source_files_sha256'].items():assert file_sha(ROOT/name)==h,'Baseline code changed; use reviewed new protocol'
        assert file_sha(ROOT/'tests/ai-eval/h5-ev-01/FREEZE.json')==p['exam_freeze_sha256']
        node_prompts()  # All frozen data/source gates still execute.
        with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
        self.url=f'http://127.0.0.1:{port}'
        self.command=[str(self.out/'cpu-runtime/llama-server.exe'),'-m',p['model_file'],'--host','127.0.0.1','--port',str(port),'--device','none','-ngl','0','--no-op-offload','--fit','off','--offline','--parallel','1','--ctx-size',str(p['context']),'-t',str(p['threads']),'-tb',str(p['threads']),'--ctx-checkpoints','0','--no-context-shift','--no-warmup']
        env={k:os.environ[k] for k in ['SystemRoot','WINDIR','PATH','PATHEXT','TEMP','TMP','COMSPEC'] if k in os.environ}
        env.update(CUDA_VISIBLE_DEVICES='-1',HIP_VISIBLE_DEVICES='-1',ROCR_VISIBLE_DEVICES='-1',GGML_VK_VISIBLE_DEVICES='',HF_HUB_OFFLINE='1')
        self.log=(self.out/'server.log').open('ab')
        self.process=subprocess.Popen(self.command,cwd=self.out/'cpu-runtime',env=env,stdout=self.log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
        save(self.out/'server-owner.json',{'pid':self.process.pid,'runner_pid':os.getpid(),'command':self.command,'url':self.url,'started_at':now()})
        try:
            for _ in range(120):
                if self.process.poll() is not None:raise RuntimeError('CPU server exited; inspect server.log')
                try:
                    if self.http('/health',timeout=1).get('status')=='ok':break
                except Exception:time.sleep(.5)
            else:raise RuntimeError('CPU server startup timeout')
            logs=(self.out/'server.log').read_text(encoding='utf8',errors='replace')
            assert 'CPU' in logs and not any(x in logs for x in ['CUDA0','Vulkan0','ROCm0']),'CPU evidence gate'
            save(self.out/'runtime-props.json',self.http('/props'))
            return self
        except BaseException:self.__exit__(None,None,None);raise
    def __exit__(self,*exc):
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:self.process.wait(10)
            except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
        if hasattr(self,'log'):self.log.close()

def verify_runtime_tokenizer(server,rows,out):
    for row in rows:
        ids=server.http('/tokenize',{'content':row['prompt'],'add_special':False,'parse_special':True})['tokens']
        assert ids==row['token_ids'],f'Runtime/tokenizer mismatch: {row["id"]}'
    save(out/'runtime-tokenizer-match.json',{'checked':len(rows),'exact_token_id_matches':len(rows),'at':now(),'model_loaded':True,'training_started':False})

def execute(args):
    out=args.output.resolve();p=json.loads((out/'PROTOCOL.json').read_text(encoding='utf8'))
    assert file_sha(out/'prompts.jsonl')==p['prompt_file_sha256']
    rows=[json.loads(line) for line in (out/'prompts.jsonl').read_text(encoding='utf8').splitlines()]
    with exclusive(out),Server(out,p) as server:
        if args.command=='calibrate':
            if (out/'calibration.json').exists():raise ValueError('Preserve existing calibration; do not repeat')
            t=LocalTextTokenizer(p['tokenizer_dir'])
            text=render(t,[{'role':'system','content':'Return only JSON with exactly reply and actions. Do not modify any plan.'},{'role':'user','content':'Merhaba. Bir oda planına başlamak için hangi ölçüler gerekir?'}])
            measurements=[]
            for mode in p['modes']:
                body={**p['settings'],'prompt':text,'n_predict':64}
                if mode=='schema':body['json_schema']=p['schema_constraint']
                begin=time.monotonic();r=server.http('/completion',body)
                measurements.append({'mode':mode,'seconds':time.monotonic()-begin,'response':r})
            save(out/'calibration.json',{'synthetic_not_exam':True,'measurements':measurements,'no_settings_changed_from_results':True});print(rawjson({'calibration_seconds':[round(x['seconds'],2) for x in measurements],'timings':[x['response'].get('timings') for x in measurements]}),flush=True);return
        assert (out/'calibration.json').exists(),'Run synthetic calibration first'
        verify_runtime_tokenizer(server,rows,out)
        journal=out/'predictions.jsonl';existing=[json.loads(line) for line in journal.read_text(encoding='utf8').splitlines()] if journal.exists() else []
        seen={(r['mode'],r['id']) for r in existing};assert len(seen)==len(existing)
        expected={(mode,r['id']) for mode in p['modes'] for r in rows};assert seen<=expected
        started=time.monotonic()
        with journal.open('a',encoding='utf8',newline='\n') as f:
            for mode in p['modes']:
                for row in rows:
                    if (mode,row['id']) in seen:continue
                    if server.process.poll() is not None:raise RuntimeError('CPU runtime stopped; preserve journal and inspect before resuming')
                    body={**p['settings'],'prompt':row['prompt']}
                    if mode=='schema':body['json_schema']=p['schema_constraint']
                    begin=time.monotonic()
                    try:
                        response=server.http('/completion',body,timeout=180)
                        if response.get('error') or not isinstance(response.get('content'),str):raise ValueError('Runtime response error or missing text content')
                        record={'id':row['id'],'mode':mode,'status':'ok','output':response.get('content',''),'truncated':bool(response.get('truncated') or response.get('stop_type')=='limit' or response.get('stopped_limit')),'response':response}
                    except Exception as e:record={'id':row['id'],'mode':mode,'status':'transport_error','output':'','truncated':False,'error':str(e)}
                    record.update(at=now(),seconds=round(time.monotonic()-begin,3),prompt_sha256=row['prompt_sha256'],protocol_sha256=file_sha(out/'PROTOCOL.json'))
                    f.write(rawjson(record)+'\n');f.flush();os.fsync(f.fileno());seen.add((mode,row['id']))
                    progress={'at':now(),'pid':os.getpid(),'server_pid':server.process.pid,'completed':len(seen),'expected':240,'last_id':row['id'],'last_mode':mode,'elapsed_seconds':round(time.monotonic()-started,2),'training_started':False}
                    save(out/'progress.json',progress);print(rawjson(progress),flush=True)
        save(out/'RUN-COMPLETE.json',{'at':now(),'completed':len(seen),'expected':240,'journal_sha256':file_sha(journal),'all_recorded':seen==expected,'training_started':False})

def main():
    ap=argparse.ArgumentParser();ap.add_argument('command',choices=['prepare','calibrate','run']);ap.add_argument('--pin-dir',type=Path);ap.add_argument('--output',required=True,type=Path);a=ap.parse_args()
    if a.command=='prepare':assert a.pin_dir;prepare(a)
    else:execute(a)
if __name__=='__main__':main()
