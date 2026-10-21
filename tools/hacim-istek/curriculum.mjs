import {DEFAULT} from '../../assets/ev/tekstil.js';
export const colorIds=['kirik-beyaz','kum','adacayi','zeytin','kil'];
export const rugIds=['duz-dokuma','jut','kisa-hav','bukle','rolyef'];
export const names=['reading','guests','family','quiet','music'];
export const headings=['wave','pencil','double_pinch','triple_pinch','eyelet'];
export function initial(room='living'){
 const spaces=[['living',0,0,6000,5000,'living'],['bedroom',6000,0,11000,5000,'bedroom'],['child',6000,5000,11000,9000,'bedroom'],['hall',0,5000,2000,9000,'hall'],['dining',2000,5000,6000,9000,'living']].map(([id,x,y,X,Y,kind])=>({id,kind,name:id,boundary_xy_mm:[[x,y],[X,y],[X,Y],[x,Y]]}));
 const walls=new Map(),xs=[0,2000,6000,11000],ys=[0,5000,9000];
 for(const s of spaces)for(let i=0;i<4;i++){
  const a=s.boundary_xy_mm[i],b=s.boundary_xy_mm[(i+1)%4],vertical=a[0]===b[0],axis=vertical?1:0;
  const lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]);
  const cuts=(vertical?ys:xs).filter(v=>v>=lo&&v<=hi);
  for(let j=0;j<cuts.length-1;j++){
   const from=vertical?[a[0],cuts[j]]:[cuts[j],a[1]],to=vertical?[a[0],cuts[j+1]]:[cuts[j+1],a[1]];
   const id=(vertical?'v':'h')+'-'+(vertical?a[0]:a[1])+'-'+cuts[j]+'-'+cuts[j+1];
   walls.set(id,{id,from_xy_mm:from,to_xy_mm:to,thickness:120});
  }
 }
 walls.delete('h-0-0-2000');walls.delete('h-0-2000-6000');walls.set('h-0-0-6000',{id:'h-0-0-6000',from_xy_mm:[0,0],to_xy_mm:[6000,0],thickness:120});
 const openings=[['living-entry','v-0-0-5000',3500],['bedroom-entry','v-6000-0-5000',3500],['child-entry','v-6000-5000-9000',2600],['hall-entry','h-5000-0-2000',500],['dining-entry','h-5000-2000-6000',500]].map(([id,wall_id,offset_from_wall_start])=>({id,wall_id,offset_from_wall_start,kind:'door',width:900,height:2100,sill_height:0,swing:'unknown'}));
 for(const [id,wall_id,offset_from_wall_start,width]of [['living-window','v-0-0-5000',500,1500],['bedroom-window','h-0-6000-11000',1500,1400],['child-window','h-9000-6000-11000',1500,1200],['dining-window','h-9000-2000-6000',2300,1200]])openings.push({id,wall_id,offset_from_wall_start,width,kind:'window',height:1400,sill_height:900});
 return {plan:{walls:[...walls.values()],openings,spaces,items:[]},tekstil:DEFAULT(),selection:{room,wall:'h-0-0-6000'},context:{geometry:'AURA fictional connected one-storey home; not a surveyed or certified building',coordinates:'millimetres; x east, y south',request_measurement_unit:'cm; dimensions omitted in a short utterance refer to the supplied scenario inventory',textile_scope:'current room editing context only'}};
}
const item=(tur,en,derinlik,id=tur)=>({tur,en,derinlik,id});
export function spec(i,j){
 const n=[190,200,210,220,230][j],bed=[140,150,160,170,180][j],desk=[110,120,130,140,150][j];
 const layout=(room,esyalar,kisitlar=[])=>{const state=initial(room);state.context.scenario_inventory=structuredClone(esyalar);return{state,actions:[{katman:'yerlesim',type:'yerlestir',oda:room,esyalar,kisitlar}],observations:[],variables:{n,bed,desk},family:i};};
 const near=(a,b,mm)=>({tur:'yakin',a,b,mm}),far=(a,b,mm)=>({tur:'uzak',a,b,mm});
 const sofa=item('sofa',n*10,900),tv=item('tv',1600,400),coffee=item('coffee',900,550),chair=item('armchair',800,800),b=item('bed',bed*10,2100),wardrobe=item('wardrobe',1800,600),d=item('desk',desk*10,600),bookcase=item('bookcase',900,350),table=item('dining',1600,900),buffet=item('sideboard',1400,400);
 if(i===0)return layout('living',[sofa,tv],[{tur:'bakar',a:'sofa',b:'tv'}]);
 if(i===1)return layout('bedroom',[b,item('nightstand',450,400,'night-a'),item('nightstand',450,400,'night-b')],[near('bed','night-a',1800),near('bed','night-b',1800)]);
 if(i===2)return layout('living',[sofa,coffee],[near('sofa','coffee',1300)]);
 if(i===3)return layout('child',[d,bookcase],[far('desk','bookcase',3000)]);
 if(i===4)return layout('bedroom',[b,wardrobe],[far('bed','wardrobe',1800)]);
 if(i===5)return layout('living',[sofa,chair],[near('sofa','armchair',2500)]);
 if(i===6)return layout('living',[sofa,tv],[{tur:'bakar',a:'sofa',b:'tv'},far('sofa','tv',2200)]);
 if(i===7)return layout('dining',[table,buffet],[far('dining','sideboard',1800)]);
 if(i===8)return layout('living',[sofa,item('loveseat',1600,800),chair]);
 if(i===9){const s=layout('bedroom',[item('wardrobe',[1200,1400,1600,1800,2000][j],600)]);s.variables.width=[120,140,160,180,200][j];return s;}
 if(i===10)return layout('child',[item('bed',900,2000),d]);
 if(i===11)return layout('hall',[item('shoe',800,350),item('coatrack',700,350)]);
 if(i===12){const s=layout('dining',[item('dining',[1300,1400,1500,1600,1700][j],900)]);s.variables.width=[130,140,150,160,170][j];return s;}
 const s={state:initial(),actions:[],observations:[],variables:{n,bed,desk},family:i};
 const tx=(type,payload,observations)=>{s.actions=[{katman:'tekstil',type,...payload}];s.observations=observations;return s;};
 if(i===13){s.state.selection.room='child';s.actions=[{katman:'ev',type:'oda_tanimla',id:'child',ad:'Guest bedroom',tur:'bedroom'}];s.observations=[['plan.spaces.2.name','Guest bedroom'],['plan.spaces.2.kind','bedroom']];return s;}
 if(i===14)return tx('hali',{construction:rugIds[j],on:true},[['tekstil.rug.construction',rugIds[j]],['tekstil.rug.on',true]]);
 if(i===15)return tx('perde',{drape:{color:colorIds[j]}},[['tekstil.curtain.drape.color',colorIds[j]]]);
 if(i===16){const family=j%2?'leno-yun':'acik-keten';return tx('perde',{system:'tul-fon',sheer:{family}},[['tekstil.curtain.sheer.family',family],['tekstil.curtain.system','tul-fon']]);}
 if(i===17)return tx('perde',{system:'tul-fon',drape:{family:'blackout'}},[['tekstil.curtain.drape.family','blackout'],['tekstil.curtain.system','tul-fon']]);
 if(i===18)return tx('hali',{on:false},[['tekstil.rug.on',false]]);
 if(i===19)return tx('hali',{color:colorIds[j]},[['tekstil.rug.color',colorIds[j]]]);
 if(i===20){s.actions=[{katman:'ev',type:'oda_tanimla',id:'living',ad:names[j]}];s.observations=[['plan.spaces.0.name',names[j]]];return s;}
 if(i===21)return tx('perde',{heading:headings[j]},[['tekstil.curtain.heading',headings[j]]]);
 const window=i===22,wall=window?'h-0-0-6000':'h-9000-2000-6000',width=window?[1000,1100,1200,1300,1400][j]:[750,800,850,900,950][j];
 s.state.selection.wall=wall;s.actions=[{katman:'ev',type:'aciklik_ekle',id:'requested-opening',wall_id:wall,tur:window?'window':'door',konum:window?1500:500,en:width}];
 s.observations=[['plan.openings.9.kind',window?'window':'door'],['plan.openings.9.width',width],['plan.openings.9.offset_from_wall_start',window?1500:500]];s.variables.width=width/10;return s;
}
export const multiPairs=[[0,15],[1,17],[2,14],[3,16],[4,15],[5,19],[6,18],[7,21],[15,14],[16,17]];
