"""H1 common-contract quarantine. Existing combined exports/assignments untouched.
Raw language JSONLs are the only primary count; this projection is not extra data.
"""
from pathlib import Path
import collections,hashlib,importlib.util,json
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('converter',ROOT/'tools/egitim-donustur/donustur.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
BASE=ROOT/'knowledge/ai-egitim/veri/hacim-1-komut'
def run():
 manifest=json.loads((BASE/'sayim-raporu.json').read_text(encoding='utf-8'))
 lock=m.source_lock()
 assert all(manifest['source_lock'][k]==lock[k] for k in ['git_tree_sha256','scope'])
 rows=[]
 for lang in ['tr','en','de','fr','nl','da','es','it','ar']:
  file=BASE/(lang+'.jsonl');b=file.read_bytes();assert b'\r' not in b
  for r in map(json.loads,b.decode('utf-8').splitlines()):
   ops=[{'tur':a['type'],'katman':'mobilya',**{k:v for k,v in a.items() if k!='type'}} for a in r['assistant']['actions']]
   warnings=['human_review_pending','language_review_pending','combined_corpus_dedup_review_pending']
   if r['motor']['report']['red'] or r['motor']['target_mismatches']:warnings.append('motor_target_failed')
   warnings+=['motor_warning:'+w['kod'] for w in r['motor']['report']['uyari']]
   family=r['state']['design']['family']
   row={'id':r['id'],'dil':lang,'ulke':None,'katman':'mobilya','kaynak':{'veri_seti':'hacim-1-komut','kayit':r['id'],'lisans':'AURA original authored text','dosya':file.relative_to(ROOT).as_posix(),'sha256':m.sha(b),'gruplar':['row:hacim-1-komut:'+r['id'],'studio-group:hacim-1-komut:'+family]},'durum_once':r['state'],'mesajlar':[{'rol':'user','metin':r['user']},{'rol':'assistant','metin':r['assistant']['reply']}],'islemler':ops,'denetim':{'gecti':False,'uyarilar':warnings,'yasakli_terim':0,'dil_tutarli':None,'motor_gecti':bool(r['motor']['report']['gecti'] and not r['motor']['target_mismatches']),'insan_onayi':False,'grup':''},'bolum':'train'}
   rows.append(row)
 ledger={};groups=m.assign(rows,ledger);assert not m.leakage(rows)
 from jsonschema import Draft202012Validator
 validator=Draft202012Validator(json.loads((ROOT/'knowledge/ai-egitim/AURA-EGITIM-1.schema.json').read_text(encoding='utf-8')))
 for row in rows:validator.validate(row)
 (BASE/'karantina.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in rows),encoding='utf-8',newline='\n')
 manifest['common_contract']={'schema':'AURA-EGITIM-1','projection':'karantina.jsonl','rows':len(rows),'primary':False,'source_clusters':groups,'split_rows':dict(collections.Counter(r['bolum'] for r in rows)),'leakage':[],'policy':'All translations/value variants sharing a base product stay in one group. Split labels are prospective, not exported training data.'}
 old=json.loads((ROOT/'knowledge/ai-egitim/veri/birlesik/sayim-raporu.json').read_text(encoding='utf-8'))
 manifest['inventory']={'existing_combined_candidates':old['candidate_rows'],'new_h1_candidates':len(rows),'total_candidate_rows_not_unique_projects':old['candidate_rows']+len(rows),'qualified_training_rows':0,'existing_combined_unchanged':True}
 (BASE/'sayim-raporu.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps(manifest['inventory']))
if __name__=='__main__':run()
