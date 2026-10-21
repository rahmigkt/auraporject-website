"""Refresh only editorial projections after verified non-text invariants.
Retains motor evidence only when its source tree and exact plan/operation inputs stayed unchanged.
"""
from pathlib import Path
import collections,importlib.util,json,sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from uslup_duzelt import body,digest,ARCHIVE
from uslup_denetim import ALL
spec=importlib.util.spec_from_file_location('convert',ROOT/'tools/egitim-donustur/donustur.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def run():
    out=ROOT/'knowledge/ai-egitim/veri/birlesik';old=json.loads(ARCHIVE.read_text(encoding='utf8'));report=json.loads((out/'sayim-raporu.json').read_text(encoding='utf8'));assert report['source_lock']==m.source_lock()
    contents=m.CAT.blobs();rows=[json.loads(x) for x in (out/'adaylar.jsonl').read_text(encoding='utf8').splitlines()];updated=[]
    for r in rows:
        if not r['kaynak']['veri_seti'].startswith('ev-sohbet-'):continue
        src=json.loads(contents[r['kaynak']['dosya']].decode('utf8'))
        if 'style_revision' not in src:continue # New intake drafts have no old geometry/text approval to reuse.
        saved=old[src['id']]
        assert digest(body(src))==saved['body_sha256']
        before=m.conversation({'dialogue':saved['dialogue']});after=m.conversation(src)
        assert r['mesajlar'] in [before,after]
        r['mesajlar']=after;r['kaynak']['sha256']=m.sha(contents[r['kaynak']['dosya']])
        d=r['denetim'];d['yasakli_terim']=sum(len(ALL.findall(t['metin'])) for t in after if t['rol']!='system');assert d['yasakli_terim']==0
        d['uyarilar']=[w for w in d['uyarilar'] if w!='preliminary_internal_terms_found']
        d['gecti']=False;d['insan_onayi']=False;d['dil_tutarli']=None;updated.append(r['id'])
    assert len(updated)==40
    report['warning_counts']=dict(collections.Counter(w for r in rows for w in r['denetim']['uyarilar']))
    report['editorial_refresh']={'conversations':40,'geometry_and_operation_inputs_unchanged':True,'retained_engine_evidence':40,'fresh_engine_runs':0,'source_tree_unchanged':True,'approval_reused':False,'qualification_changed':False,'method':'Verified body hashes + current-source exact request/result replay; only messages and source document hashes refreshed.'}
    (out/'adaylar.jsonl').write_text(''.join(m.canonical(r)+'\n' for r in rows),encoding='utf8',newline='\n');(out/'sayim-raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');print('Refreshed 40 text projections; retained 40 engine reports; qualified rows remain 0')
if __name__=='__main__':run()
