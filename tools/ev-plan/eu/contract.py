"""Versioned EU extension; retain v0.4 as an explicit compatibility boundary."""
import copy
from jsonschema import Draft202012Validator
from common import DATA,read,write
from solver.program import check as base_check,response as base_response,SYSTEM as BASE_SYSTEM

CONTRACT='aura-plan-program/0.5-eu'
SYSTEM=BASE_SYSTEM.replace('version is 0.4','version is 0.5')+'''
EU extension: plan_program version is 0.5 and also requires country (ISO BE, NL,
DE, FR, GB, IE, DK, ES, IT, AT, CH, TR or null), region (string or null),
housing_type (local profile id string or null). Language is only a hint; never
confirm country from language alone. Ask country and region before applying
local rules. T3/F3, 3-Zimmer, trilocale, 3-vaerelses count main rooms, not three
bedrooms: two bedrooms assumes one living room and requires confirmation.
3-bed, 3 dormitorios and 3 slaapkamers explicitly count three bedrooms.
3+1 explicitly means three bedrooms and one living room. Never relabel a Swiss
source as a measured Belgian or other-country plan. Never invent a matching
multi-storey reference. A program is an intent; final decisions belong to the designer.
'''

def schema():
    result=copy.deepcopy(read(DATA/'plan-program.schema.json'))
    result['properties']['version']={'const':'0.5'}
    result['properties']['country']={'enum':['BE','NL','DE','FR','GB','IE','DK','ES','IT','AT','CH','TR',None]}
    result['properties']['region']={'type':['string','null'],'minLength':2,'maxLength':60}
    result['properties']['housing_type']={'type':['string','null'],'minLength':2,'maxLength':80}
    result['required']+=['country','region','housing_type'];result['title']='AURA EU plan program 0.5'
    return result

def response_schema():
    return dict(type='object',additionalProperties=False,required=['status','plan_program','operations','reply','requires_designer_review'],properties=dict(
        status={'enum':['program','clarify','refuse','edit']},plan_program={'anyOf':[schema(),{'type':'null'}]},
        operations={'type':'array','items':{'type':'object'}},reply={'type':'string'},requires_designer_review={'const':True}))

def strip(program):
    Draft202012Validator(schema()).validate(program)
    result={k:v for k,v in program.items() if k not in ('country','region','housing_type')}
    result['version']='0.4';return base_check(result)

def extend(program,country,region=None,housing_type=None):
    base_check(program);result=copy.deepcopy(program)
    result.update(version='0.5',country=country,region=region,housing_type=housing_type)
    strip(result);return result

def response(value):
    if not isinstance(value,dict):raise ValueError('object required')
    adapted=copy.deepcopy(value)
    if value.get('plan_program') is not None:adapted['plan_program']=strip(value['plan_program'])
    base_response(adapted);return value

if __name__=='__main__':write(DATA/'plan-program.eu.schema.json',schema())
