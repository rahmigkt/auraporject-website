"""Import explicit human decisions; never infer approval from opening HTML."""
import argparse
from common import read,write,digest


def gold(records,reviews):
    lookup={r['id']:r for r in records};seen=set();selected=[];needs_resplit=[]
    for decision in reviews:
        id=decision['id']
        if id not in lookup or id in seen:raise ValueError('Unknown/duplicate review id')
        seen.add(id);record=lookup[id]
        if decision['plan_sha256']!=digest(record['plan']):raise ValueError('Stale review')
        if decision['rating'] not in (None,'good','weak'):raise ValueError('Unknown rating')
        if decision['rating'] is None:continue
        if decision['status']!='reviewed' or not decision.get('reviewer'):raise ValueError('Missing explicit reviewer')
        if decision['rating']=='good':
            if record['split']=='test':selected.append(dict(id=id,plan_sha256=decision['plan_sha256'],topology_class=record['topology_class']))
            else:needs_resplit.append(id)
    return dict(gold=selected,approved_outside_test_requires_new_frozen_split=needs_resplit,training_allowed=False)


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--records',required=True);p.add_argument('--reviews',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    write(a.output,gold(read(a.records),read(a.reviews)))
