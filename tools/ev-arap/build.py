from pathlib import Path
import json,hashlib,sys
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'knowledge/ai-egitim/veri/ev-sohbet-arap'
sys.path.insert(0,str(ROOT/'tools/ev-sohbet'))
from uslup_denetim import inspect
from dialogues import CASES

def build():
 OUT.mkdir(parents=True,exist_ok=True);rs=[]
 for i,(country,city,house,floors,majlis,pairs) in enumerate(CASES,1):
  assert len(pairs)==8
  dialogue=[{'role':role,'content':text} for pair in pairs for role,text in zip(['user','assistant'],pair)]
  r={'id':f'ev-sohbet-arap-{i:02}','country':country,'city':city,'language':'ar','requested_housing_type':house,'requested_floors':floors,'majlis_requested':majlis,'dialogue':dialogue,'synthetic':True,'author':'codex','human_review':'pending','native_review':'pending','source':{'dataset':'AURA original fictional intake dialogue','id':f'arap-intake-{i:02}','license':'AURA original authored text','geometry_source':None,'customer_photos_used':False},'plan':None,'operations':[],'layout_requests':[],'layout_results':[],'plan_status':'awaiting_measured_plan','layout_status':'pending_majlis_support_and_measurements' if majlis else 'pending_measurements_and_native_targets','training_started':False,'denetim':{'gecti':False,'reasons':['no_measured_plan_or_verified_local_geometry','no_solver_placement_delivered','human_and_native_review_pending']}}
  (OUT/(r['id']+'.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');rs.append(r)
 result=inspect(rs);assert result['passed']
 result.update(qualified_solver_conversations=0,two_storey_villa_requests=2,two_storey_villa_geometries=0,source_policy='No unlicensed Bahrain drawing imported; no invented second storey; no claim that intake dialogue is a completed layout delivery.')
 (OUT/'denetim-sonucu.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
 print(json.dumps({k:result[k] for k in ['conversations','messages','qualified_solver_conversations','two_storey_villa_requests','two_storey_villa_geometries']},ensure_ascii=False))
if __name__=='__main__':build()
