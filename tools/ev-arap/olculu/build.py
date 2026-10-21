"""New measured-reference scenarios; original intake packets remain immutable."""
from pathlib import Path
import copy,hashlib,json,subprocess,sys
ROOT=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from denetim import check
from uslup_denetim import inspect
from cases import INTRO,PAIRS,WIDTHS
OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-arap-olculu'
def dump(p,x):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
def blob(path):return subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT)
def sha(b):return hashlib.sha256(b).hexdigest()
def node(payload):
 r=subprocess.run(['node','tools/egitim-donustur/motor.mjs'],input=json.dumps(payload,ensure_ascii=False),cwd=ROOT,text=True,encoding='utf-8',capture_output=True,check=True);return json.loads(r.stdout)
def build():
 for i in range(1,13):
  # Geography is fictional; no local survey or second-storey geometry is asserted.
  profile=json.loads(blob(f'knowledge/ai-egitim/veri/ev-sohbet-arap/ev-sohbet-arap-{i:02}.json'))
  donor=f'knowledge/ai-egitim/veri/ev-sohbet-uk-ie/ev-sohbet-uk-ie-{i:02}.json' if i<=8 else f'knowledge/ai-egitim/veri/ev-sohbet-it/ev-sohbet-it-{i-8:02}.json'
  original=blob(donor);d=json.loads(original);p=copy.deepcopy(d['plan']);p['items']=[]
  assert len(p['levels'])==1 and not any(op['kind']=='propose_second_floor_and_stair' for op in d['operations']),'Only verified single-level donors allowed'
  ident=f'ev-sohbet-arap-olculu-{i:02}';p.update(project_id=ident,language={'customer':'ar','designer':'tr'},example_only=True)
  p['dwelling']={'kind':'apartment_reference','source_country':'CH','scenario_country':profile['country'],'requested_type':profile['requested_housing_type'],'existing_house_claim':False}
  p['brief']['budget']['currency']={'AE':'AED','SA':'SAR','QA':'QAR','KW':'KWD','EG':'EGP','MA':'MAD'}[profile['country']]
  labels={'living':'الصالة العائلية','bedroom':'غرفة نوم','kitchen':'المطبخ','bath':'الحمام','wc':'دورة المياه','hall':'الممر','utility':'غرفة خدمات','other':'غرفة','balcony':'الشرفة','terrace':'التراس'}
  for s in p['spaces']:s['name']=labels.get(s['kind'],'غرفة')
  target=next(s for s in p['spaces'] if s['kind']=='living')
  operations=copy.deepcopy(d['operations'])
  for op in operations:op['conversation_turn']=9
  source=copy.deepcopy(d['source']);source['geographic_transfer']='Adapted Swiss single-level measured reference, NOT an Arab local survey, villa or measured upper floor.'
  source['donor_document']={'path':donor,'sha256':sha(original)}
  fixture_path=str(Path(donor).parent/source['fixture']).replace('\\','/')
  fixture=blob(fixture_path);fp=OUT/'kaynaklar'/Path(source['fixture']).name;fp.parent.mkdir(parents=True,exist_ok=True);fp.write_bytes(fixture)
  r={'id':ident,'country':profile['country'],'city':profile['city'],'language':'ar','source':source,'plan':p,'operations':operations,'source_exceptions':copy.deepcopy(d['source_exceptions']),'layout_requests':[],'layout_results':[],'dialogue':[],
   'synthetic':True,'author':'codex','human_review':'pending','native_review':'pending','training_started':False,'claimed_net_area_m2':d['claimed_net_area_m2'],'area_definition':'Interior polygon sum; not local statutory area or a surveyed Arab property.',
   'requested_housing_type':profile['requested_housing_type'],'requested_floors':profile['requested_floors'],'majlis_requested':profile['majlis_requested'],
   'scenario_status':'new_independent_fictional_measured_reference_conversation; old intake dialogue not copied',
   'layout_scope':{'room_id':target['id'],'kind':'family_living_room_only','whole_home_completed':False,'upper_floor_and_stair_pending':profile['requested_floors']>1,'majlis_pending':profile['majlis_requested'],'source_level_count':len(p['levels'])},
   'product_request':{'sofa_width_mm':WIDTHS[i-1],'sofa_depth_mm':820,'coffee_length_mm':900,'coffee_width_mm':550},
   'jurisdiction_review':{'compliance':'unknown_not_certified','clear_door_passage_mm':None,'local_minimum_room_area_m2':None,'door_hinge_confirmed':False},
   'designer_summary_tr':'Yalnız aile salonu için ölçülü referans yerleşimi. Bütün ev, üst kat, merdiven ve meclis tamamlandı sayılmaz; yerel ölçüm, tasarımcı ve ana dil onayı gerekir.'}
  dump(OUT/(ident+'.json'),r)
 subprocess.run(['node',str(ROOT/'tools/ev-arap/olculu/place.mjs'),str(OUT)],cwd=ROOT,check=True)
 results=[];rows=[]
 for i,f in enumerate(sorted(OUT.glob('ev-sohbet-arap-olculu-*.json'))):
  r=json.loads(f.read_text(encoding='utf-8'));s=next(x for x in r['plan']['spaces'] if x['id']==r['layout_scope']['room_id'])
  from shapely.geometry import Polygon
  ok=r['layout_results'][0]['ok'];outcome='ظهرت القطعتان داخل حدود الصالة دون تداخل بينهما.' if ok else 'لم أجد موضعًا يحقق الطلب بهذين المقاسين؛ لم أصغّر أي قطعة ولم أثبت موضعًا غير مناسب.'
  pairs=INTRO[i]+[(a.format(area=round(Polygon(s['boundary_xy_mm']).area/1e6,2),width=WIDTHS[i],outcome=outcome),b.format(area=0,width=WIDTHS[i],outcome=outcome)) for a,b in PAIRS[i]]
  r['dialogue']=[{'role':role,'content':text} for pair in pairs for role,text in zip(['user','assistant'],pair)]
  r['candidate_audits']=[]
  for candidate in r['layout_candidates']:
   r['plan']['items']=copy.deepcopy(candidate['items']);r['layout_requests'][0]['selected_alternative']=candidate['index']
   g=check(r,OUT/'kaynaklar');r['candidate_audits'].append({'index':candidate['index'],'errors':g['errors'],'accepted':g['accepted_with_documented_source_exceptions']})
   if g['accepted_with_documented_source_exceptions']:break
  if not r['layout_candidates']:g=check(r,OUT/'kaynaklar')
  r['selection_policy']='First actual solver alternative passing independent geometry/door-swing validation; no manually authored position.'
  r['source_exceptions']=g['source_exceptions']
  prepared=node({'prepare':True,'record':r});engine=node({'state':prepared['state'],'operations':prepared['operations']})
  r['native_motor']={'operations':prepared['operations'],'result':engine,'scope':'Contract acceptance only; selected alternative is not a turn-by-turn native target. No parity or training approval claim.'}
  r['denetim']={'gecti':False,'geometry_accepted_with_source_exceptions':g['accepted_with_documented_source_exceptions'],'strict_geometry_pass':g['strict_pass'],'native_motor_pass':engine.get('report',{}).get('gecti',False),'reasons':['human_and_native_review_pending','partial_home_scope','turn_by_turn_action_alignment_pending']}
  dump(f,r);results.append(g);rows.append(r)
 style=inspect(rows)
 report={'records':12,'messages':192,'measured_source_plans':len({r['source']['id'] for r in rows}),'family_room_layouts_fit':sum(r['layout_results'][0]['ok'] for r in rows),'geometry_accepted':sum(g['accepted_with_documented_source_exceptions'] for g in results),'strict_geometry_pass':sum(g['strict_pass'] for g in results),'source_exceptions':sum(len(g['source_exceptions']) for g in results),'native_motor_pass':sum(r['denetim']['native_motor_pass'] for r in rows),'whole_homes_complete':0,'two_storey_geometries':0,'majlis_layouts':0,'qualified_training_rows':0,'style':style,'results':results,'model_or_training_started':False}
 dump(OUT/'denetim-sonucu.json',report)
 print(json.dumps({k:v for k,v in report.items() if k not in ['style','results']},ensure_ascii=False))
 if not style['passed'] or any(g['errors'] for g in results):raise RuntimeError('Audit failed; see denetim-sonucu.json')
if __name__=='__main__':build()
