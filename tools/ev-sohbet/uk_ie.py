"""Next-country batch: 4 UK jurisdictions + 4 Republic of Ireland scenarios.

Single-floor Swiss references, no claims of authentic local house typology.
No model, training, paid service, new geometry template, or assets mutation.
"""
import argparse
import copy
import json
import sqlite3
import sys
from pathlib import Path
from build02 import ROOT,normalize,node_walls,dump,sha,area,net

OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-uk-ie'
IDS=['004691117f23c987a692849c','00e3970d9c34d5e4f1d3116f','01557bd6a494a662d8005fdd','0165ea3ec9c8956a3c59c8c4',
     '0294d6ea603c2bd88be9ee03','02f0a42cff9f59fc3d355a2c','03133a1c0173b8e825c6ff3c','031a7f9da8eccc474ea12138']
CITIES=['London','Edinburgh','Cardiff','Belfast','Dublin','Cork','Galway','Limerick']
REGIONS=['England','Scotland','Wales','Northern Ireland']+['Republic of Ireland']*4
NAMES=dict(living='Living room',bedroom='Bedroom',kitchen='Kitchen',bath='Bathroom',wc='Toilet',hall='Hall',utility='Storage',other='Room',balcony='Balcony',terrace='Terrace')

def build(source=None):
    conn=sqlite3.connect(source/'index.sqlite') if source else None
    stream=(source/'plans.jsonl').open('rb') if source else None
    for i,unit in enumerate(IDS,1):
        sid='sd-'+unit;fp=OUT/'kaynaklar'/f'{sid}.json'
        if source:
            off,length=conn.execute('select offset,length from plans where id=?',(sid,)).fetchone();stream.seek(off);r=json.loads(stream.read(length));fixture=dict(id=sid,plan=r['plan'],geometry=r['geometry']);dump(fp,fixture)
        else:fixture=json.loads(fp.read_text(encoding='utf-8'))
        p,transform=normalize(fixture);node_walls(p)
        ops=[dict(transform,conversation_turn=2),dict(kind='node_compatibility_wall_axes',conversation_turn=2)]
        if not any(s['kind']=='living' for s in p['spaces']):
            living=max((s for s in p['spaces'] if s['kind']=='other'),key=area)
            ops.append(dict(kind='confirm_room_use',space_id=living['id'],before='other',after='living',conversation_turn=3));living['kind']='living'
        for s in p['spaces']:
            if s['kind']=='other':
                ops.append(dict(kind='confirm_room_use',space_id=s['id'],before='other',after='bedroom',conversation_turn=3));s['kind']='bedroom'
            s['name']=NAMES[s['kind']]
        bedrooms=sorted((s for s in p['spaces'] if s['kind']=='bedroom'),key=area,reverse=True)
        for j,s in enumerate(bedrooms):s['requested_mattress_width_mm']=1400 if j==0 else 900
        country='GB' if i<=4 else 'IE';city=CITIES[i-1]
        p.update(schema_version='0.1',project_id=f'ev-sohbet-uk-ie-{i:02}',revision=2,language=dict(customer='en',designer='tr'),example_only=True)
        p['levels'][0]['name']='Reference floor';p['brief']['goals']=[];p['brief']['budget']['currency']='GBP' if country=='GB' else 'EUR'
        p['items']=[];p['notes']=[];p['issues']=[];p['connections']=[];p['finishes']=[]
        p['dwelling']=dict(kind='apartment_reference',source_country='CH',scenario_country=country,existing_house_claim=False)
        record=dict(id=p['project_id'],country=country,region=REGIONS[i-1],city=city,language='en',
          source=dict(dataset='Swiss Dwellings',version='3.0.0',id=sid,license='CC BY 4.0',doi='10.5281/zenodo.7788422',attribution=fixture['geometry']['attribution'],fixture='kaynaklar/'+sid+'.json',fixture_sha256=sha(fixture),hash_mode='canonical_json_sort_keys_ensure_ascii_false',multi_floor_source=False,geographic_transfer='Swiss geometry used for fictional local dialogue, not measured local housing'),
          plan=p,operations=ops,dialogue=[],claimed_net_area_m2=round(net(p),1),source_exceptions=[],layout_requests=[],layout_results=[],training_started=False,
          area_definition='Net interior room polygon sum, excludes balconies/terraces; NOT GIA.',scenario_status='fictional_manual_conversation_not_model_or_customer_transcript')
        dump(OUT/(record['id']+'.json'),record);print(record['id'],record['claimed_net_area_m2'],city)

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');p=argparse.ArgumentParser();p.add_argument('--source',type=Path);build(p.parse_args().source)
