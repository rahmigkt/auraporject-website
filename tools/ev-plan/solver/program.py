"""Strict program boundary shared by dataset, solver and local inference."""
import copy
import math
from jsonschema import Draft202012Validator
from common import DATA, read

CONTRACT = 'aura-plan-program/0.4-real'
TYPES = ('kapali', 'acik', 'yari_acik', 'hol', 'kose', 'cift_cephe',
         'derin', 'dubleks', 'mustakil', 'avlulu')
SYSTEM = '''You are AURA's Turkish/English home planning assistant. Return JSON only,
with exactly status, plan_program, operations, reply, requires_designer_review.
status is program, clarify, refuse, or edit. requires_designer_review is always true.
Never generate wall coordinates. Program version is 0.4; fields: version, typology,
dwelling (apartment/duplex/detached), bedrooms (0..5 or null), floors (1..3), kitchen
(closed/semi_open/open or null when unverified), envelope (rectangle/l/u/notched), entry (south/north/east/west),
living_face (south/north/east/west), circulation (spine/segmented/foyer/unknown), stair
(none/straight/l/u/gallery), setback_m (0..10 or null when unmeasured), rooms, adjacency, forbidden,
fixed, revision. Generic source ROOM is other/unknown, never a confirmed bedroom.
bedrooms, entry and living_face may be null when unknown. A real extracted
program can use typology real_reference. Room fields: id, kind,
zone (day/night/wet/service/unknown), level,
target_m2 (0.1..1000), face (any/south/north/east/west). Use 1..100 rooms.
adjacency and forbidden contain pairs
of room ids. fixed contains existing constraints; do not invent measured geometry.
Rooms describe use and soft area targets, not structural approval. On insufficient
measurements or contradictory area demands ask a question with null plan_program,
empty operations. Refuse unapproved structural removal. Edits use operations
{op:resize,room_id:...,target_m2:...} or {op:kitchen,value:open/closed/semi_open}
with the supplied program revision. Always leave final decisions to the designer.'''


def check(program):
    def finite(value):
        if isinstance(value,dict):return all(finite(v) for v in value.values())
        if isinstance(value,list):return all(finite(v) for v in value)
        return not isinstance(value,float) or math.isfinite(value)
    if not finite(program):raise ValueError('nonfinite program number')
    Draft202012Validator(read(DATA/'plan-program.schema.json')).validate(program)
    ids=[r['id'] for r in program['rooms']]
    if len(ids)!=len(set(ids)):raise ValueError('duplicate room id')
    if program['bedrooms'] is not None and sum(r['kind']=='bedroom' for r in program['rooms'])!=program['bedrooms']:
        raise ValueError('bedroom count mismatch')
    for r in program['rooms']:
        if r['level']>=program['floors']:raise ValueError('room on nonexistent floor')
    edges={frozenset(e) for e in program['adjacency']}
    for e in program['adjacency']+program['forbidden']:
        if len(set(e))!=2 or not set(e)<=set(ids):raise ValueError('invalid adjacency reference')
    if edges & {frozenset(e) for e in program['forbidden']}:raise ValueError('contradictory adjacency')
    if (program['floors']==1)!=(program['stair']=='none'):raise ValueError('stair/floor mismatch')
    return program


def apply_edits(program, operations, expected_revision):
    check(program)
    if expected_revision!=program['revision']:raise ValueError('stale program revision')
    result=copy.deepcopy(program)
    for op in operations:
        if op.get('op')=='resize' and set(op)=={'op','room_id','target_m2'}:
            room=next((r for r in result['rooms'] if r['id']==op['room_id']),None)
            if room is None:raise ValueError('unknown room')
            room['target_m2']=op['target_m2']
        elif op.get('op')=='kitchen' and set(op)=={'op','value'}:
            result['kitchen']=op['value']
            kitchens=[r for r in result['rooms'] if r['kind']=='kitchen']
            for kitchen in kitchens:
                living=next((r for r in result['rooms'] if r['kind']=='living' and r['level']==kitchen['level']),None)
                if living is None:raise ValueError('No same-floor living room for kitchen relation')
                pair={living['id'],kitchen['id']}
                result['adjacency']=[e for e in result['adjacency'] if set(e)!=pair]
                if op['value']!='closed':result['adjacency'].append([living['id'],kitchen['id']])
        else:raise ValueError('unsupported operation')
    result['revision']+=1
    return check(result)


def response(value):
    if not isinstance(value,dict) or set(value)!={'status','plan_program','operations','reply','requires_designer_review'}:
        raise ValueError('response keys')
    if value['requires_designer_review'] is not True or not isinstance(value['reply'],str):raise ValueError('review/reply')
    if not isinstance(value['operations'],list):raise ValueError('operations must be array')
    if value['status']=='program':
        if value['operations']:raise ValueError('create cannot edit')
        check(value['plan_program'])
    elif value['status'] in ('clarify','refuse'):
        if value['plan_program'] is not None or value['operations']:raise ValueError('no action expected')
    elif value['status']=='edit':
        if value['plan_program'] is not None or not value['operations']:raise ValueError('edit contract')
        for operation in value['operations']:
            if not isinstance(operation,dict):raise ValueError('operation object required')
            if operation.get('op')=='resize':
                target=operation.get('target_m2')
                if set(operation)!={'op','room_id','target_m2'} or not isinstance(operation['room_id'],str) or not operation['room_id']:
                    raise ValueError('resize operation fields')
                if isinstance(target,bool) or not isinstance(target,(int,float)) or not math.isfinite(target) or not .1<=target<=1000:
                    raise ValueError('resize operation target')
            elif operation.get('op')=='kitchen':
                if set(operation)!={'op','value'} or operation['value'] not in ('closed','semi_open','open'):raise ValueError('kitchen operation')
            else:raise ValueError('unsupported operation')
    else:raise ValueError('unknown status')
    return value
