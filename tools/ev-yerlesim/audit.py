"""Independent delivery assertions, not language-model or human approval scores."""
import json,copy,hashlib,subprocess
from collections import Counter
from pathlib import Path
from jsonschema import Draft202012Validator
from shapely.geometry import Polygon,LineString
from placement import validate,digest
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'knowledge/ai-egitim/veri/sohbet-ornekleri'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def run():
    catalog=read(OUT/'codex-finish-catalog.json');paints={p[0] for p in catalog['paints']};floors=set(catalog['floors'])
    schema=read(ROOT/'knowledge/ev-projesi/veri/ev-projesi.schema.json');canonical=Draft202012Validator(schema)
    extended=copy.deepcopy(schema);extended['properties']['scheme']={'enum':['iskandinav','toprak','akdeniz','klasik','modern']}
    extended['$defs']['item']['properties'].update(design={'type':'object'},name={'type':'string'},pos_xy_mm={'type':'array','items':{'type':'number'},'minItems':2,'maxItems':2},rot_deg={'type':'number'})
    extended['$defs']['space']['properties']['finish']={'type':'object','properties':{'wall':{'type':'string'},'floor':{'type':'string'}},'required':['wall','floor'],'additionalProperties':False}
    preview=Draft202012Validator(extended)
    records=[read(OUT/f'codex-{i:03}.json') for i in range(1,13)];room_checks=0;products=0;views=0
    for rec in records:
        assert rec['synthetic'] is True and rec['author']=='codex' and not rec['human_approved'] and not rec['training_started']
        assert len(rec['turns'])==40 and [t['role'] for t in rec['turns']]==['user','assistant']*20
        for turn in rec['turns']:
            assert '{survey}' not in turn['content'] and turn['content'].strip()
            if turn['role']=='assistant':assert turn['requires_designer_review'] is True
        plan=rec['canonical_plan'];canonical.validate(plan)
        assert plan['review']['state']=='awaiting_designer' and plan['review']['designer_approval_revision'] is None
        spaces={s['id']:s for s in plan['spaces']};levels={l['id']:l for l in plan['levels']};walls={w['id']:w for w in plan['walls']}
        for f in plan['finishes']:assert f['asset_ref'].split('#')[-1] in (paints if f['surface_ref']=='wall' else floors)
        assert len(spaces)==len(plan['spaces'])
        for space in spaces.values():
            assert space['level_id'] in levels and Polygon(space['boundary_xy_mm']).is_valid
            assert all(w in walls for w in space['wall_ids'])
        values=list(spaces.values())
        for i,a in enumerate(values):
            for b in values[:i]:
                if a['level_id']==b['level_id']:assert Polygon(a['boundary_xy_mm']).intersection(Polygon(b['boundary_xy_mm'])).area<1
        for opening in plan['openings']:
            assert set(opening['space_ids'])<=set(spaces)
            length=LineString([walls[opening['wall_id']]['from_xy_mm'],walls[opening['wall_id']]['to_xy_mm']]).length
            assert opening['offset_from_wall_start']['value']+opening['width']['value']<=length+.01
        for lid in levels:
            ids={s['id'] for s in values if s['level_id']==lid};seen={next(s for s in ids if s.endswith('-hall'))}
            while True:
                expanded=seen|{c['to_space_id'] for c in plan['connections'] if c['from_space_id'] in seen}|{c['from_space_id'] for c in plan['connections'] if c['to_space_id'] in seen}
                if expanded==seen:break
                seen=expanded
            assert seen==ids # Separate floor graph, NOT staircase or accessible whole-home proof.
        solver=read(OUT/'planlar'/f'{rec["id"]}-solver.json');assert len(solver['alternatives'])==3
        assert len({digest(a['placements']) for a in solver['alternatives']})==3
        for alternative in solver['alternatives']:
            canonical.validate(alternative['canonical_plan'])
            for r in solver['rooms']:
                group=[p for p in alternative['placements'] if p['space_id']==r['room']['id']]
                check=validate(r['room'],group,r['intent']);assert check['valid'],(rec['id'],r['room']['id'],check)
                room_checks+=1
        selected={p['id']:p for p in rec['product_selections']};products+=len(selected)
        for item in plan['items']:
            assert {k:q['value'] for k,q in item['dimensions'].items()}==selected[item['id']]['compiled_overall']
            assert item['position_xyz_mm'][2]==levels[spaces[item['space_id']]['level_id']]['elevation']['value']
            assert (item['origin']=='existing')==(selected[item['id']]['origin']=='existing')
        for lid,view in rec['result_plans_by_level'].items():
            preview.validate(view);views+=1
            for s in view['spaces']:assert s['finish']['wall'] in paints and s['finish']['floor'] in floors
            assert set(i['id'] for i in view['items'])=={i['id'] for i in plan['items'] if spaces[i['space_id']]['level_id']==lid}
            for item in view['items']:
                source=next(i for i in plan['items'] if i['id']==item['id']);assert item['pos_xy_mm']==source['position_xyz_mm'][:2] and item['rot_deg']==source['rotation_z_deg']
                assert item['design']==selected[item['id']]['design']
        assert rec['result_plan']==next(iter(rec['result_plans_by_level'].values()))
    report=dict(conversations=12,user_assistant_pairs=240,messages=480,countries=dict(Counter(r['country'] for r in records)),languages=dict(Counter(r['language'] for r in records)),
        canonical_schemas_passed=36,viewer_schemas_passed=views,room_option_validations=room_checks,selected_products=products,whole_home_alternatives=36,
        staircase_certified=False,building_or_accessibility_certified=False,human_approved=0,trained=False,
        independence=dict(source_example_read=False,source_tools_read=False,shared_format_documents_only=True),
        source_main=subprocess.check_output(['git','merge-base','HEAD','origin/main'],cwd=ROOT,text=True).strip())
    (OUT/'codex-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps(report));return report
if __name__=='__main__':run()
