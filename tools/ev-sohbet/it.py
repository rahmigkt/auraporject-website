"""Italian continuation with measured placement and natural customer dialogue."""
import argparse
import json
import sqlite3
import sys
from pathlib import Path
from build02 import ROOT,normalize,node_walls,sha,area,net
from dk import dump

OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-it'
IDS=['03c78f4f5e232f70d247ff6e','03e7675243b8ff0359a9a52c','03f400af6a7449edb03153fc','03f5d66743677ad404fe8eaa']
CITIES=['Milano','Roma','Bologna','Palermo']
REGIONS=['Lombardia','Lazio','Emilia-Romagna','Sicilia']
TYPES=['appartamento_family','appartamento_access_needs','villetta_schiera_upper_floor_unknown','casa_indipendente_terrace_unknown']
REGIONAL_SOURCES=['MIL-SUE','ROM-agibilita','MIT-salvacasa','DM236']
NAMES=dict(living='Soggiorno',bedroom='Camera',kitchen='Cucina',bath='Bagno',wc='WC',hall='Disimpegno',utility='Ripostiglio',other='Stanza',balcony='Balcone',terrace='Terrazza')

def build(source=None):
    db=sqlite3.connect(source/'index.sqlite') if source else None;stream=(source/'plans.jsonl').open('rb') if source else None
    for i,unit in enumerate(IDS,1):
        sid='sd-'+unit;file=OUT/'kaynaklar'/f'{sid}.json'
        if source:
            off,length=db.execute('select offset,length from plans where id=?',(sid,)).fetchone();stream.seek(off);r=json.loads(stream.read(length));fixture=dict(id=sid,plan=r['plan'],geometry=r['geometry']);dump(file,fixture)
        else:fixture=json.loads(file.read_text(encoding='utf-8'))
        p,transform=normalize(fixture);node_walls(p);ops=[dict(transform,conversation_turn=2),dict(kind='node_compatibility_wall_axes',conversation_turn=2)]
        if not any(s['kind']=='living' for s in p['spaces']):
            s=max((s for s in p['spaces'] if s['kind']=='other'),key=area);s['kind']='living';ops.append(dict(kind='confirm_room_use',space_id=s['id'],before='other',after='living',conversation_turn=3))
        for s in p['spaces']:
            if s['kind']=='other':s['kind']='bedroom';ops.append(dict(kind='confirm_room_use',space_id=s['id'],before='other',after='bedroom',conversation_turn=3))
            s['name']=NAMES[s['kind']]
        for j,s in enumerate(sorted((s for s in p['spaces'] if s['kind']=='bedroom'),key=area,reverse=True)):s['requested_mattress_width_mm']=1400 if j==0 else 900
        p.update(schema_version='0.1',project_id=f'ev-sohbet-it-{i:02}',revision=2,language=dict(customer='it',designer='tr'),example_only=True)
        p['levels'][0]['name']='Piano';p['brief']['goals']=[];p['brief']['budget']['currency']='EUR'
        for key in ('items','notes','issues','connections','finishes'):p[key]=[]
        p['dwelling']=dict(kind='apartment_reference',source_country='CH',scenario_country='IT',requested_type=TYPES[i-1],existing_house_claim=False)
        r=dict(id=p['project_id'],country='IT',region=REGIONS[i-1],city=CITIES[i-1],language='it',
          source=dict(dataset='Swiss Dwellings',version='3.0.0',id=sid,license='CC BY 4.0',doi='10.5281/zenodo.7788422',attribution=fixture['geometry']['attribution'],fixture='kaynaklar/'+sid+'.json',fixture_sha256=sha(fixture),hash_mode='canonical_json_sort_keys_ensure_ascii_false',multi_floor_source=False,geographic_transfer='Swiss reference geometry; fictional Italian conversation, not surveyed local property'),
          plan=p,operations=ops,dialogue=[],synthetic=True,author='codex',human_review='pending',claimed_net_area_m2=round(net(p),1),source_exceptions=[],layout_requests=[],layout_results=[],training_started=False,
          area_definition='Interior room polygon sum excluding balconies/terraces; not certified superficie utile or catastale.',scenario_status='fictional_manual_conversation_not_model_or_customer_transcript',
          jurisdiction_review=dict(jurisdiction=REGIONS[i-1],compliance='unknown_not_certified',statutory_useful_area_m2=None,cadastral_built_area_m2=None,clear_door_passage_mm=None,ventilation_compliance=None,height_compliance=None,source_ids=['DM236','MIT-salvacasa',REGIONAL_SOURCES[i-1]],unresolved=['actual measured home','building date and work scope','regional and municipal applicability','clear door passage and external route','ventilation and daylight','structural and permit review']))
        dump(OUT/(r['id']+'.json'),r);print(r['id'],r['claimed_net_area_m2'],r['city'])

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');p=argparse.ArgumentParser();p.add_argument('--source',type=Path);build(p.parse_args().source)
