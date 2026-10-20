import copy,math,unittest
from placement import validate,solve,opening_zones,footprint
from house import house
from scenarios import CASES
from adapter import room_from_ev
ROOM=dict(boundary=[[0,0],[6000,0],[6000,6000],[0,6000]],openings=[dict(kind='door',a=[6000,400],b=[6000,1400],hinge='start',swing='in'),dict(kind='window',a=[0,3600],b=[0,2200])],radiators=[])
def item(id,role,x,y,w=1000,d=600,rot=0):return dict(id=id,role=role,xy=[x,y],rot=rot,size=dict(width=w,depth=d,height=800))
class PlacementTests(unittest.TestCase):
 def test_overlap(self):self.assertIn('collision',validate(ROOM,[item('a','tv',3000,3000),item('b','tv',3200,3000)],complete=False)['errors'])
 def test_outside_concave_room(self):
  room=dict(ROOM,boundary=[[0,0],[6000,0],[6000,2000],[2000,2000],[2000,6000],[0,6000]])
  self.assertFalse(validate(room,[item('a','tv',4000,4000)],complete=False)['valid'])
 def test_door_sweep(self):self.assertTrue(any(e.startswith('door:') for e in validate(ROOM,[item('a','tv',5500,900,300,300)],complete=False)['errors']))
 def test_window_and_radiator(self):
  self.assertTrue(any(e.startswith('window:') for e in validate(ROOM,[item('a','tv',300,3000,300,300)],complete=False)['errors']))
  room=dict(ROOM,radiators=[[[2400,2400],[3600,2400],[3600,3600],[2400,3600]]]);self.assertTrue(any(e.startswith('radiator:') for e in validate(room,[item('a','tv',3000,3000)],complete=False)['errors']))
 def test_front_use_clearance(self):self.assertIn('use_clearance_product',validate(ROOM,[item('a','wardrobe',3000,3200),item('b','tv',3000,2400)],complete=False)['errors'])
 def test_bed_access_at_wall(self):self.assertFalse(validate(ROOM,[item('bed','bed',700,3500,1600,2100)],complete=False)['valid'])
 def test_focus(self):
  r=validate(ROOM,[item('sofa','sofa',2200,3200,1800,850,0),item('tv','tv',4200,3200,1000,350,180)])
  self.assertIn('sofa_tv_focus',r['errors'])
 def test_minimum_tv_distance(self):
  from placement import relations
  errors,_=relations([item('sofa','sofa',3000,3000,1800,850,0),item('tv','tv',3000,1500,1000,350,180)],ROOM,dict(screen_height_mm=1000,screen_resolution='hd'))
  self.assertIn('tv_distance',errors)
 def test_desk_light(self):
  from placement import relations
  errors,_=relations([item('desk','desk',3000,2900,1200,600,90)],ROOM,dict(desk_side_light=True));self.assertIn('desk_window_relation',errors)
 def test_unknown_hinge(self):
  room=copy.deepcopy(ROOM);room['openings'][0]['hinge']='unknown'
  with self.assertRaises(ValueError):opening_zones(room)
 def test_end_hinge_is_different(self):
  other=copy.deepcopy(ROOM);other['openings'][0]['hinge']='end'
  a,_=opening_zones(ROOM);b,_=opening_zones(other);self.assertGreater(a[0][1].symmetric_difference(b[0][1]).area,100000)
 def test_invalid_size_and_coordinate_intent(self):
  with self.assertRaises(ValueError):solve(ROOM,[item('x','tv',0,0,w=float('nan'))])
  with self.assertRaises(ValueError):solve(ROOM,[item('x','tv',0,0)],{'x':3000})
 def test_rotation_matches_viewer(self):
  shape=footprint(item('x','tv',2000,2000,1200,600,90));self.assertEqual(tuple(round(v) for v in shape.bounds),(1700,1400,2300,2600))
 def test_disconnected_walk_route(self):
  room=dict(ROOM,openings=ROOM['openings'][:1])
  r=validate(room,[item('barrier','coffee',3000,3000,6000,400),item('upper','tv',3000,4500,1000,350,180)])
  self.assertTrue(any(e.startswith('disconnected_access:') for e in r['errors']),r)
 def test_ceiling(self):
  room=dict(ROOM,ceiling_height_mm=700);self.assertTrue(any(e.startswith('ceiling_collision:') for e in validate(room,[item('tall','tv',3000,3000)],complete=False)['errors']))
 def test_fixture_ev_adapter(self):
  plan,rooms,_=house(CASES[0]);r=rooms[0];detail={r['id']+'-door':dict(hinge='start')};adapted=room_from_ev(plan,r['id'],detail,r['radiators'])
  self.assertEqual(adapted['openings'],r['openings']);self.assertEqual(adapted['boundary'],r['boundary'])
 def test_no_silent_unknown_measurements(self):
  plan,rooms,_=house(CASES[0]);plan['spaces'][0]['geometry_status']='estimated'
  with self.assertRaises(ValueError):room_from_ev(plan,rooms[0]['id'])
 def test_unsatisfiable_is_clarification(self):
  room=dict(boundary=[[0,0],[500,0],[500,500],[0,500]],openings=[],radiators=[])
  result=solve(room,[item('large','bed',0,0,2000,2200)]);self.assertEqual(result['status'],'clarify');self.assertEqual(result['options'],[])
if __name__=='__main__':unittest.main()
