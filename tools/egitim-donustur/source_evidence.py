"""Bound mechanical revalidation for the existing all-quarantined snapshot.
Does not approve exports, update a FREEZE, or accept unknown source versions.
"""
from pathlib import Path
from datetime import datetime
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
def h(path):return hashlib.sha256(Path(path).read_bytes().replace(b'\r\n',b'\n')).hexdigest()
def verified_snapshot_lock(report):
    p=json.loads((ROOT/'knowledge/ai-egitim/inceleme/motor-20261023.json').read_text(encoding='utf-8'))
    if p['version']!='aura-mechanical-revalidation/2026-10-23' or p['training_approved'] is not False:raise ValueError('Unknown review profile')
    if p['reviewer']!='Codex' or p['review_mode']!='user_authorized_self_review':raise ValueError('Unknown reviewer/mode')
    if not datetime.fromisoformat('2026-10-21T20:00:00+00:00')<=datetime.fromisoformat(p['at'])<datetime.fromisoformat('2026-10-26T20:00:00+00:00'):raise ValueError('Outside authorized review period')
    required=['knowledge/ai-egitim/veri/birlesik/'+f for f in ['sayim-raporu.json','adaylar.jsonl','train.jsonl','dev.jsonl','test.jsonl']]
    if not all(f in p['artifacts'] for f in required):raise ValueError('Missing snapshot bindings')
    tree=subprocess.check_output(['git','ls-tree','-r','HEAD','--','assets','tools/studyo-motoru'],cwd=ROOT)
    if hashlib.sha256(tree).hexdigest()!=p['current_source_tree']:raise ValueError('Unreviewed engine source')
    subprocess.check_call(['git','diff','--exit-code','HEAD','--','assets','tools/studyo-motoru'],cwd=ROOT,stdout=subprocess.DEVNULL)
    for name,digest in p['artifacts'].items():
        if h(ROOT/name)!=digest:raise ValueError('Changed evidence input: '+name)
    # This receipt covers exactly the original zero-export snapshot. A later
    # approval/target/export needs its own review; it cannot borrow this receipt.
    if report['qualified_training_rows']!=0 or report['candidate_rows']!=2590:raise ValueError('Snapshot qualification/count changed')
    old=json.loads((ROOT/'knowledge/ai-egitim/veri/birlesik/sayim-raporu.json').read_text(encoding='utf-8'))
    if report!=old:raise ValueError('Report differs from bound snapshot')
    if len(p['combined'])!=52 or not all(r['historical_report_identical'] and r['current_previous_state_identical'] for r in p['combined']):raise ValueError('Incomplete current mechanical evidence')
    if sorted(r['id'] for r in p['combined'])!=sorted(r['id'] for r in report['engine_evidence']):raise ValueError('Evidence IDs changed')
    return {'git_tree_sha256':p['current_source_tree'],'scope':['assets/','tools/studyo-motoru/'],'policy':'Exact Git tree (paths and blob IDs); refuses dirty engine sources'}
