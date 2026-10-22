"""Stream every original placement row through narrow mechanical checks.

This is a structural receipt, not manual reading, a semantic review or an approver.
The four explicitly read records have separate decisions; this tool never writes
codex-kararlari.json, changes sources, runs H4, or grants training approval.
"""
import collections
import gzip
import importlib.util
import io
import json
import subprocess
from pathlib import Path

spec = importlib.util.spec_from_file_location('sample', Path(__file__).with_name('placement-sample.py'))
sample = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sample)


def run():
    out = Path('work/c7-placement-structural.jsonl.gz')
    summaries = []
    seen = set()
    out.parent.mkdir(exist_ok=True)
    with out.open('wb') as raw, gzip.GzipFile(filename='', mode='wb', fileobj=raw, mtime=0) as compressed, io.TextIOWrapper(compressed, encoding='utf8', newline='\n') as receipt:
        for name in ['procthor-denetimli.jsonl.gz', 'procthor-aura-cozucu.jsonl.gz']:
            path = Path('knowledge/ai-egitim/veri/yerlesim') / name
            stats = collections.Counter()
            failures = []
            groups = set()
            with gzip.open(path, 'rt', encoding='utf8') as stream:
                for line_no, line in enumerate(stream, 1):
                    row = json.loads(line)
                    target = json.loads(row['messages'][-1]['content'])
                    stats['rows'] += 1
                    key = (name, row['id'])
                    if key in seen:
                        stats['duplicate_ids'] += 1
                    seen.add(key)
                    groups.add((row['source'].get('split'), row['source'].get('house')))
                    native = isinstance(target, dict) and isinstance(target.get('reply'), str) and isinstance(target.get('actions'), list)
                    stats['native_reply_actions_targets' if native else 'legacy_non_native_targets'] += 1
                    record = {'file':path.as_posix(), 'line':line_no, 'id':row['id'],
                              'row_sha256':sample.digest(sample.canonical(row)), 'native_reply_actions_target':native,
                              'manual_review_not_asserted_by_tool':True, 'training_approved':False}
                    try:
                        checked = sample.inspect(row)
                        record.update(input_items=checked['input_items'], output_placements=checked['output_placements'],
                                      ambiguous_dimension_names=checked['ambiguous_dimension_names'])
                        stats['narrow_prompt_checks_completed'] += 1
                        if checked['output_placements'] is None:
                            stats['null_placement_not_success'] += 1
                        if checked['ambiguous_dimension_names']:
                            stats['ambiguous_dimension_name_rows'] += 1
                        strict = [p['part'] for p in checked['footprint_corner_checks']
                                   if any(not c['all_corners_strictly_inside'] for c in p['corner_checks'])]
                        outside = [p['part'] for p in checked['footprint_corner_checks']
                                   if any(not c['all_corners_inside_or_boundary'] for c in p['corner_checks'])]
                        record['parts_with_strict_corner_flag'] = strict
                        record['parts_with_a_corner_outside_under_at_least_one_size_assignment'] = outside
                        if strict:
                            stats['strict_corner_flag_rows_require_review'] += 1
                        if outside:
                            stats['outside_or_ambiguous_assignment_rows_require_review'] += 1
                        elif strict:
                            stats['boundary_or_roundoff_only_rows'] += 1
                    except (ValueError, TypeError, KeyError, IndexError) as error:
                        stats['narrow_check_unavailable'] += 1
                        record['check_error'] = str(error)
                        if len(failures) < 10:
                            failures.append({'id':row['id'], 'line':line_no, 'error':str(error)})
                    receipt.write(json.dumps(record, ensure_ascii=False, separators=(',', ':'))+'\n')
            summaries.append({'file':path.as_posix(), 'compressed_source_sha256':sample.digest(path.read_bytes()),
                              'counts':dict(stats), 'split_house_groups':len(groups), 'first_check_errors':failures})
    summary = {'scope':'100% structural pass only; not manual/semantic reading or approval. Original source targets remain separate from new Codex H4 targets.',
               'source_code_sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
               'reviewer':'Codex','review_mode':'user_authorized_self_review','training_approved':False,
               'files':summaries,'receipt':out.as_posix(),'receipt_sha256':sample.digest(out.read_bytes()),
               'tool_sha256_lf':{str(p).replace('\\','/'):sample.digest(p.read_bytes().replace(b'\r\n',b'\n')) for p in [Path(__file__),Path(__file__).with_name('placement-sample.py')]},
               'limits':['No full-polygon/door/window/clearance/collision/infeasibility certification.',
                         'Corner flags are triage only; ambiguous size bindings and boundary contacts need separate review. Numerical boundary epsilon1e-6mm is not design clearance.',
                         'Native-wrapper classification is structural; no decision or training gate is changed.',
                         'Semantic/paraphrase leakage and human language/design approval remain incomplete.']}
    Path('work/c7-placement-structural-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(json.dumps({'files':summaries,'training_approvals':0},ensure_ascii=True))


if __name__ == '__main__':
    run()
