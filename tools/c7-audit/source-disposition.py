"""Finish negative admission review of original sources, never approve raw rows.

All rows are checked, but this tool does not pretend that every coordinate has
been manually read or that every room has been certified. A structurally
ineligible target receives a correction disposition; ProcTHOR test rows are
rejected for training. Positive semantic/motor approval requires a new review
of a corrected native target and is outside these negative dispositions.
"""
import collections
import gzip
import hashlib
import json
import re
import subprocess
from pathlib import Path


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()


def shape(poly):
    points = [tuple(p) for p in poly]
    if points[0] == points[-1]:
        points.pop()
    changed = True
    while changed and len(points) > 3:
        changed = False
        for i, p in enumerate(points):
            a, b = points[i-1], points[(i+1) % len(points)]
            cross = (p[0]-a[0])*(b[1]-p[1])-(p[1]-a[1])*(b[0]-p[0])
            if cross == 0 and (p[0]-a[0])*(p[0]-b[0])+(p[1]-a[1])*(p[1]-b[1]) <= 0:
                points.pop(i)
                changed = True
                break
    variants = []
    for swap in [False, True]:
        for sx, sy in [(1, 1), (-1, 1), (1, -1), (-1, -1)]:
            q = [(sx*(y if swap else x), sy*(x if swap else y)) for x, y in points]
            mx, my = min(x for x, _ in q), min(y for _, y in q)
            q = [(x-mx, y-my) for x, y in q]
            for seq in [q, q[::-1]]:
                variants.extend(tuple(seq[i:]+seq[:i]) for i in range(len(seq)))
    return sha(canonical(min(variants)))


def controls():
    a = [[0, 0], [2000, 0], [2000, 3000], [0, 3000]]
    b = [[100, 100], [100, 1100], [100, 2100], [-2900, 2100], [-2900, 100]]
    assert shape(a) == shape(b), 'Translated/rotated/collinear same geometry must match'
    assert shape(a) != shape([[0, 0], [2001, 0], [2001, 3000], [0, 3000]])


def run():
    controls()
    root = Path('knowledge/ai-egitim/inceleme')
    exam_path = Path('tests/ai-eval/aura-sinav-01/gorevler.jsonl')
    freeze_path = exam_path.with_name('FREEZE.json')
    freeze = json.loads(freeze_path.read_text(encoding='utf8'))
    assert sha(exam_path.read_bytes()) == freeze['files']['gorevler.jsonl']['sha256']
    exam = [json.loads(l) for l in exam_path.read_text(encoding='utf8').splitlines() if l]
    exam_shapes = collections.defaultdict(list)
    for task in exam:
        for room in task['input'].get('state', {}).get('plan', {}).get('spaces', []):
            exam_shapes[shape(room['boundary_xy_mm'])].append(task['id'])
    decisions = json.loads((root/'codex-kararlari.json').read_text(encoding='utf8'))['kararlar']
    leakage = json.loads((root/'C7-yerlesim-tam-metin-sizma.json').read_text(encoding='utf8'))
    assert leakage['sources_sha256_lf']['tools/aura-sinav-01/tasks.mjs'] == sha(Path('tools/aura-sinav-01/tasks.mjs').read_bytes().replace(b'\r\n',b'\n'))
    receipt_path = root/'C7-yerlesim-yapisal-kayitlar.jsonl.gz'
    with gzip.open(receipt_path, 'rt', encoding='utf8') as f:
        receipts = {(r['file'], r['line']): r for r in map(json.loads, f)}
    summaries, entries, styles, overlaps = [], [], collections.Counter(), []
    code_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    for name in ['procthor-denetimli.jsonl.gz', 'procthor-aura-cozucu.jsonl.gz']:
        path = Path('knowledge/ai-egitim/veri/yerlesim')/name
        source_sha = sha(path.read_bytes())
        assert next(x for x in leakage['files'] if x['file'] == path.as_posix())['compressed_source_sha256'] == source_sha
        counts, splits = collections.Counter(), collections.Counter()
        with gzip.open(path, 'rt', encoding='utf8') as f:
            for line_no, line in enumerate(f, 1):
                r = json.loads(line)
                check = receipts[(path.as_posix(), line_no)]
                row_sha = sha(canonical(r))
                assert check['row_sha256'] == row_sha and check['id'] == r['id']
                assert [m['role'] for m in r['messages']] == ['user', 'assistant']
                target = json.loads(r['messages'][-1]['content'])
                native = isinstance(target, dict) and isinstance(target.get('reply'), str) and isinstance(target.get('actions'), list)
                assert not native, 'Changed/native source requires individual review; no automatic verdict allowed'
                split = r['source']['split']
                splits[split] += 1
                counts['rows'] += 1
                match = re.search(r'Köşeler \(mm(?:, plan)?\): (\[\[.*?\]\])', r['messages'][0]['content'])
                assert match
                polygon = json.loads(match[1])
                hits = exam_shapes.get(shape(polygon), [])
                if hits:
                    overlaps.append({'id':r['id'], 'tasks':hits})
                if isinstance(target, list):
                    assert all(isinstance(x, dict) and {'parca', 'merkez_mm', 'on_derece'} <= x.keys() for x in target)
                    counts['coordinate_array_without_customer_reply'] += 1
                else:
                    assert set(target) <= {'yerlesim', 'gerekce', 'secenek_sayisi'} and isinstance(target['gerekce'], list)
                    for text in target['gerekce']:
                        styles[text] += 1
                    if target['yerlesim'] is None:
                        counts['null_solver_response_not_infeasibility_proof'] += 1
                    else:
                        counts['coordinate_object_without_native_actions'] += 1
                reason = ['raw_coordinate_task_not_EGITIM01_native_reply_actions']
                if split == 'test':
                    reason.append('ProcTHOR_test_split_reserved_not_training')
                elif split == 'val':
                    reason.append('ProcTHOR_validation_split_keep_out_of_training')
                if target is not None and isinstance(target, dict) and target.get('yerlesim') is None:
                    reason.append('beam_search_refusal_is_not_exhaustive_no_fit_proof')
                if check.get('ambiguous_dimension_names'):
                    reason.append('same_name_different_size_binding_unresolved')
                verdict = 'ret' if split == 'test' else 'duzelt'
                counts['verdict:'+verdict] += 1
                # Existing manual correction decisions are never overwritten.
                old = decisions.get(r['id'])
                scope = 'verified_negative_native_contract_or_source_split_only;not_manual_semantic_approval'
                if old is None or old.get('kapsam') == scope:
                    entry = {'karar':verdict,'denetci':'Codex','ureten':'Claude conversion; procedural ProcTHOR','review_mode':'cross_review',
                                              'kapsam':'verified_negative_native_contract_or_source_split_only;not_manual_semantic_approval',
                                              'source_code_sha':code_sha,'row_sha256':row_sha,'source_sha256':source_sha,
                                              'kaynak_dosya':path.as_posix(),'satir':line_no,'gerekce':reason,
                                              'kanit':'knowledge/ai-egitim/inceleme/C7-kaynak-sonuc.json','training_approved':False,'semantik_onay':False}
                    if old is not None:
                        assert all(old[k] == entry[k] for k in ['karar','row_sha256','source_sha256','gerekce','training_approved','semantik_onay'])
                    entries.append((r['id'], old or entry))
                else:
                    assert decisions[r['id']]['karar'] in ['duzelt', 'ret']
                    counts['prior_manual_decision_preserved'] += 1
        summaries.append({'file':path.as_posix(),'source_sha256':source_sha,'counts':dict(counts),'source_splits':dict(splits)})
    assert sum(s['counts']['rows'] for s in summaries) == 17167
    assert len(entries) == 17161, 'Six previous original-source decisions must remain intact'
    assert sum(s['source_splits'].get('test',0) for s in summaries) == 984
    assert sum(s['source_splits'].get('val',0) for s in summaries) == 845
    plan = json.loads(Path('assets/ev/ornekler/sohbet-1.json').read_text(encoding='utf8'))
    conversation_hits = [{'space':sp['id'],'tasks':exam_shapes[shape(sp['boundary_xy_mm'])]} for sp in plan['spaces'] if shape(sp['boundary_xy_mm']) in exam_shapes]
    report = {'scope':'Disposition of every original placement source for current training admission. Negative contract/split review is complete; no raw row is approved and no full semantic/room/production certification is claimed.',
              'source_code_sha':code_sha,'reviewer':'Codex','review_mode':'cross_review','training_approved':False,'files':summaries,
              'automated_negative_dispositions':len(entries),'prior_original_decisions_preserved':6,
              'style_review':{'source':'Both conversion scripts fully read; all39 unique solver explanation strings read; all120 current exam intents and full sohbet001 read.',
                              'observed_explanations':dict(styles),'conclusion':'Original prompts ask for technical coordinate output, not customer-dialogue/native actions. Refusal certainty and heuristic success notes cannot be approved as physical facts. Rewrite/review required before training.'},
              'leakage_review':{'current_frozen_exam_sha256':sha(exam_path.read_bytes()),'exam_tasks':len(exam),'exact_user_text_matches':sum(len(x['exact_normalized_overlaps']) for x in leakage['files']),
                                'placement_exact_room_shape_matches_translation_rotation_reflection_invariant':overlaps,'conversation_room_shape_matches':conversation_hits,
                                'manual_semantic_conclusion':'Shared placement/facing/no-fit concepts are domain overlap, not proof of copied held-out gold. No blanket semantic clearance: all raw rows remain blocked. Source test984 and validation845 retain original holdout status; H5 must use its own reviewed held-out groups.',
                                'limits':'Exact shape comparison ignores furniture/openings; absence of identical geometry is not proof against paraphrase or solution leakage. Frozen exam engine gate is unchanged; no exam build/model run.'},
              'tool_self_review':{'reviewer':'Codex','review_mode':'user_authorized_self_review','controls':'Translated/rotated/collinear geometry positive control;1mm-size-change negative;every source row hash and ID bound to prior receipt;native source change aborts rather than auto-approves'},
              'source_hashes_lf':{str(p).replace('\\','/'):sha(p.read_bytes().replace(b'\r\n',b'\n')) for p in [Path(__file__),Path('tools/yerlesim-veri/procthor_donustur.py'),Path('tools/yerlesim-veri/cozucu_ornekleri.mjs'),Path('tools/aura-sinav-01/tasks.mjs'),Path('tools/aura-sinav-01/fixtures.mjs'),Path('tools/aura-sinav-01/build.mjs')]}}
    (root/'C7-kaynak-sonuc.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    Path('work/c7-negative-entries.json').write_text(json.dumps(entries,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    print(json.dumps({'rows':17167,'new_negative_decisions':len(entries),'test_rows':984,'validation_rows':845,'exact_shape_matches':len(overlaps),'conversation_shape_matches':len(conversation_hits),'training_approvals':0}))


if __name__ == '__main__':
    run()
