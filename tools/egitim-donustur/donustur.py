"""Convert candidate records conservatively. Unqualified rows stay quarantined.
Does not invent executable labels for old program-only or prose-only datasets.
"""
from pathlib import Path
import collections, copy, hashlib, importlib.util, json, os, re, subprocess, sys
ROOT=Path(__file__).resolve().parents[2]
SPEC=importlib.util.spec_from_file_location('aura_catalog',ROOT/'tools/toparlama/katalog.py')
CAT=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(CAT)
OUT=ROOT/'knowledge/ai-egitim/veri/birlesik'
TERMS=re.compile(r'çözücü|solver|source exception|kaynak istisnası|reference plan|referans plan|circulation envelope|dolaşım zarfı|licensed source|lisanslı kaynak|proje hedefi',re.I)
def canonical(x):return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def sha(x):return hashlib.sha256(x).hexdigest()
def source_lock():
    tree=subprocess.check_output(['git','ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],cwd=ROOT)
    subprocess.check_call(['git','diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],cwd=ROOT,stdout=subprocess.DEVNULL)
    return {'git_tree_sha256':sha(tree),'scope':['assets/','tools/studyo-motoru/'],'policy':'Exact Git tree (paths and blob IDs); refuses dirty engine sources'}
def approval_digest(row):
    return sha(canonical({k:v for k,v in row.items() if k not in ['denetim','bolum']}).encode())
def qualify(row,decisions):
    """A review is bound to the complete model input/target, never just an ID."""
    d=decisions.get(row['id'],{})
    if d.get('approved') is True and d.get('language_ok') is True and d.get('reviewer') and d.get('row_sha256')==approval_digest(row):
        row['denetim']['insan_onayi']=True;row['denetim']['dil_tutarli']=True
        row['denetim']['uyarilar']=[w for w in row['denetim']['uyarilar'] if w not in ['human_review_pending','language_review_pending']]
    d=row['denetim']
    d['gecti']=bool(d['insan_onayi'] and d['dil_tutarli'] is True and not d['uyarilar'] and d['yasakli_terim']==0 and row['dil'] and (not row['islemler'] or d['motor_gecti'] is True))
    return row
def node(payload,timeout=45):
    try:
        r=subprocess.run(['node',str(ROOT/'tools/egitim-donustur/motor.mjs')],input=canonical(payload),cwd=ROOT,text=True,encoding='utf8',capture_output=True,timeout=timeout)
        if r.returncode:return {'error':r.stderr[-1000:]}
        return json.loads(r.stdout)
    except subprocess.TimeoutExpired:return {'error':'motor_timeout_'+str(timeout)+'s'}

def conversation(r):
    raw=r.get('dialogue',r.get('turns',r.get('messages',[])))
    if not raw and 'user' in r:raw=[{'role':'user','content':r['user']},{'role':'assistant','content':r.get('assistant',{})}]
    out=[]
    for t in raw:
        role=t.get('role',t.get('rol'));value=t.get('content',t.get('text',t.get('metin','')))
        if isinstance(value,dict):value=' '.join(str(value.get(k,'')) for k in ['reply','reason','question']).strip()
        if role=='assistant' and isinstance(value,str):
            try:
                v=json.loads(value)
                if isinstance(v,dict) and isinstance(v.get('reply'),str):value=v['reply']
            except (ValueError,TypeError):pass
        if role in ['user','assistant','system'] and isinstance(value,str) and value.strip():out.append({'rol':role,'metin':value})
    return out

def groups_for(r,dataset,file):
    src=r.get('source',{});src=src if isinstance(src,dict) else {}
    keys=['row:'+dataset+':'+str(r.get('id'))]
    pid=r.get('source_plan_id') or (src.get('id') if src.get('geometry_source','not-explicitly-missing') is not None else None)
    if pid:keys.append('plan:'+str(pid))
    bg=r.get('source_building_group',r.get('building_group'))
    if src.get('fixture'):
        f=ROOT/Path(file).parent/src['fixture']
        if f.exists():bg=json.loads(f.read_text(encoding='utf8')).get('geometry',{}).get('building_group') or bg
    if bg:keys.append('building:'+str(bg))
    if r.get('source_signature'):keys.append('geometry:'+r['source_signature'])
    if dataset=='style-training':keys.append('style:'+str(r.get('id','')).rsplit('-',1)[0])
    if r.get('group'):keys.append('studio-group:'+str(r['group']))
    return sorted(set(keys))

def convert(dataset,r,file,file_hash):
    id=dataset['id']+':'+str(r.get('id',sha(canonical(r).encode())[:20]));messages=conversation(r)
    warnings=['human_review_pending','language_review_pending'];state=None;ops=[];engine=None
    if dataset['id'].startswith('ev-sohbet-') and r.get('plan') is None:
        warnings.extend(['awaiting_measured_plan','no_solver_placement_delivered'])
        if r.get('majlis_requested'):warnings.append('majlis_support_pending')
        if r.get('requested_floors',1)>1:warnings.append('two_storey_geometry_missing_and_engine_unsupported')
    elif dataset['id'].startswith('ev-sohbet-'):
        prepared=node({'prepare':True,'record':r})
        if 'error' in prepared:warnings.append('adapter:'+prepared['error'])
        else:
            state=prepared['state'];ops=prepared['operations']
            if ops:
                evaluation=node({'state':state,'operations':ops});engine=evaluation
                if evaluation.get('error'):warnings.append('motor:'+evaluation['error'])
                else:
                    rep=evaluation['report']
                    warnings.extend('motor_warning:'+str(x.get('kod')) for x in rep['uyari'])
                    warnings.extend('motor_reject:'+str(x.get('neden')) for x in rep['red'])
            else:warnings.append('no_supported_layout_operations')
        if r.get('source_exceptions'):warnings.append('retained_source_geometry_exceptions')
        if r.get('layout_scope'):
            warnings.extend(['partial_family_room_scope','selected_layout_not_replayed_turn_by_turn'])
            if r['layout_scope'].get('upper_floor_and_stair_pending'):warnings.append('upper_floor_and_stair_pending')
            if r['layout_scope'].get('majlis_pending'):warnings.append('majlis_support_pending')
            if any(q.get('selected_alternative',0)>0 for q in r.get('layout_requests',[])):warnings.append('selected_alternative_not_encoded_in_native_target')
    elif dataset['id'] in ['ev-plan-eu-00c','ev-plan-reel-00d']:
        warnings.append('legacy_program_targets_not_native_studio_operations')
    elif dataset['id']=='sohbet-ornekleri':
        state={'plan':r.get('result_plan')};warnings.append('no_recorded_native_operation_sequence')
    elif dataset['id']=='perde-diyaloglar':warnings.append('prose_only_no_measured_textile_operation_target')
    elif dataset['id']=='style-training':warnings.append('style_reply_not_studio_action_target')
    elif dataset['id']=='metin-denemeleri':warnings.append('text_trial_not_studio_action_target')
    else:warnings.append('unmapped_candidate_contract')
    if not dataset['license']:warnings.append('license_unverified')
    if not messages:warnings.append('missing_messages');messages=[{'rol':'system','metin':'Source record has no dialogue; withheld from training.'}]
    count=sum(len(TERMS.findall(t['metin'])) for t in messages if t['rol']!='system')
    if count:warnings.append('preliminary_internal_terms_found')
    src=r.get('source',{});src=src if isinstance(src,dict) else {}
    result={'id':id,'dil':r.get('language',r.get('lang',r.get('customer_language'))),'ulke':r.get('country'),'katman':dataset['layer'],'kaynak':{'veri_seti':dataset['id'],'kayit':str(r.get('id',id)),'lisans':r.get('license',src.get('license',dataset['license'])),'dosya':file,'sha256':file_hash,'gruplar':groups_for(r,dataset['id'],file)},'durum_once':state,'mesajlar':messages,'islemler':ops,'denetim':{'gecti':False,'uyarilar':sorted(set(warnings)),'yasakli_terim':count,'dil_tutarli':None,'motor_gecti':engine.get('report',{}).get('gecti') if engine else None,'insan_onayi':False,'grup':''},'bolum':'train'}
    return result,engine

def seed_ledger(rows):
    ledger={}
    for r in rows:
        for key in r['kaynak']['gruplar']:
            value={'bolum':r['bolum'],'grup':r['denetim']['grup']}
            if key in ledger and ledger[key]['bolum']!=value['bolum']:raise ValueError('Prior split ledger conflict: '+key)
            ledger[key]=value
    return ledger

def assign(rows, ledger=None):
    # Existing assignments are immutable across added languages/countries/data.
    ledger={} if ledger is None else ledger
    parent={}
    def find(k):
        parent.setdefault(k,k)
        if parent[k]!=k:parent[k]=find(parent[k])
        return parent[k]
    for row in rows:
        keys=row['kaynak']['gruplar'];root=find(keys[0])
        for k in keys[1:]:
            other=find(k)
            if root!=other:parent[other]=root
    grouped=collections.defaultdict(list)
    for row in rows:grouped[find(row['kaynak']['gruplar'][0])].append(row)
    for records in grouped.values():
        keys=sorted({k for r in records for k in r['kaynak']['gruplar']})
        known=[ledger[k] for k in keys if k in ledger]
        parts={x['bolum'] for x in known}
        if len(parts)>1:raise ValueError('Source bridge joins frozen train/dev/test groups; quarantine and review instead of reassigning')
        if known:part=known[0]['bolum'];gid=min(x['grup'] for x in known)
        else:
            physical=next(([k for k in keys if k.startswith(prefix)] for prefix in ['building:','plan:','geometry:','studio-group:','style:'] if any(k.startswith(prefix) for k in keys)),keys)
            identity=min(physical);gid=sha(identity.encode());bucket=int(gid[:16],16)%100
            part='train' if bucket<80 else 'dev' if bucket<90 else 'test'
        for r in records:r['bolum']=part;r['denetim']['grup']=gid
        for key in keys:ledger[key]={'bolum':part,'grup':gid}
    return len(grouped)

def leakage(rows):
    seen={};errors=[]
    for row in rows:
        for key in row['kaynak']['gruplar']+['cluster:'+row['denetim']['grup']]:
            if key in seen and seen[key]!=row['bolum']:errors.append(key)
            seen[key]=row['bolum']
    return sorted(set(errors))

def main():
    from jsonschema import Draft202012Validator
    OUT.mkdir(parents=True,exist_ok=True);catalog=json.loads((ROOT/'knowledge/ai-egitim/KATALOG.json').read_text(encoding='utf8'));contents=CAT.blobs()
    rows=[];engines=[];receipts=[]
    for dataset in catalog['datasets']:
        if dataset['status'] not in ['egitim-adayi','inceleme-bekliyor']:
            receipts.append({'dataset':dataset['id'],'status':'excluded_'+dataset['status'],'records_converted':0});continue
        converted=0
        for file in dataset['primary_files']:
            text=contents[file].decode('utf-8-sig');obj=[json.loads(x) for x in text.splitlines() if x.strip()] if file.endswith('.jsonl') else json.loads(text);records=obj if isinstance(obj,list) else [obj]
            for r in records:
                row,evidence=convert(dataset,r,file,sha(contents[file]));rows.append(row);converted+=1
                if evidence:engines.append({'id':row['id'],**evidence})
        receipts.append({'dataset':dataset['id'],'status':'quarantined' if converted else 'missing_source','records_converted':converted})
        print(dataset['id'],converted,flush=True)
    ledger_path=OUT/'split-ledger.json'
    if ledger_path.exists():ledger=json.loads(ledger_path.read_text(encoding='utf8'))['keys']
    else:
        previous=[json.loads(x) for x in (OUT/'adaylar.jsonl').read_text(encoding='utf8').splitlines()] if (OUT/'adaylar.jsonl').exists() else []
        ledger=seed_ledger(previous)
    groups=assign(rows,ledger);assert not leakage(rows)
    approval_path=OUT/'onaylar.json'
    decisions=json.loads(approval_path.read_text(encoding='utf8')) if approval_path.exists() else {}
    rows=[qualify(r,decisions) for r in rows]
    schema=json.loads((ROOT/'knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf8'));v=Draft202012Validator(schema)
    for r in rows:v.validate(r)
    # Approval is deliberately not inferred from geometry, catalogue presence or old review packets.
    eligible=[r for r in rows if r['denetim']['gecti']];rejected=[r for r in rows if not r['denetim']['gecti']]
    for split in ['train','dev','test']:(OUT/(split+'.jsonl')).write_text(''.join(canonical(r)+'\n' for r in eligible if r['bolum']==split),encoding='utf8',newline='\n')
    (OUT/'adaylar.jsonl').write_text(''.join(canonical(r)+'\n' for r in rejected),encoding='utf8',newline='\n')
    report={'version':'aura-conversion/1','candidate_rows':len(rows),'qualified_training_rows':len(eligible),'quarantined_rows':len(rejected),'source_clusters':groups,'candidate_split_rows':dict(collections.Counter(r['bolum'] for r in rows)),'candidate_split_groups':dict(collections.Counter({r['denetim']['grup']:r['bolum'] for r in rows}.values())),'leakage':leakage(rows),'warning_counts':dict(collections.Counter(x for r in rows for x in r['denetim']['uyarilar'])),'datasets':receipts,'engine_evidence':engines,'dictionary':node({'dictionary':True}),'source_hashes':{p:sha((ROOT/p).read_bytes().replace(b'\r\n',b'\n')) for p in ['tools/studyo-motoru/motor.mjs','assets/forma/actions.js','assets/ev/yerlesim.js','assets/ev/tekstil.js']},'training_started':False}
    (OUT/'split-ledger.json').write_text(json.dumps({'version':'aura-split-ledger/1','keys':ledger},ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    report['source_lock']=source_lock()
    report['split_policy']='Frozen existing source assignments; new source groups use a stable 80/10/10 hash bucket. Cross-partition source bridges fail.'
    report['approval_policy']='Hash-bound approvals require reviewer, language_ok and complete row digest. No approval is inferred from old packets.'
    report['target_scope']='Final accepted room requests after the complete conversation; not a per-turn operation alignment claim.'
    (OUT/'sayim-raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
    print(json.dumps({k:report[k] for k in ['candidate_rows','qualified_training_rows','source_clusters','candidate_split_rows','candidate_split_groups','leakage']}),flush=True)
if __name__=='__main__':main()
