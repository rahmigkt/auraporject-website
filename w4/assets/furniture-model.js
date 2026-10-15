import {metricSnap,cellBounds,PANEL_RULES} from './morti-metrics.js';
export const MODELS={
 console:{tr:'Konsol',en:'Sideboard',tag:['Sade çizgiler, size göre ölçüler.','Clean lines, made around your space.'],defaults:{width:160,height:80,depth:42,columns:3,rows:1,front:'closed'},limits:{width:[80,240],height:[55,110],depth:[30,60],columns:[2,4],rows:[1,2]}},
 shelf:{tr:'Kitaplık',en:'Bookcase',tag:['Kitaplara ve sevdiğiniz parçalara yer.','Room for books and the things you love.'],defaults:{width:120,height:180,depth:32,columns:3,rows:4,front:'open'},limits:{width:[60,220],height:[100,220],depth:[25,45],columns:[2,4],rows:[3,6]}},
 bench:{tr:'Döşemeli bank',en:'Upholstered bench',tag:['Ahşapla dokunun buluştuğu bir köşe.','A meeting of wood, texture and comfort.'],defaults:{width:140,height:46,depth:45,columns:2,rows:1,front:'open'},limits:{width:[90,200],height:[40,55],depth:[35,65],columns:[2,2],rows:[1,1]}}
};
export const WOODS={oak:{tr:'Doğal meşe',en:'Natural oak',hex:'#b99b70'},walnut:{tr:'Sıcak ceviz',en:'Warm walnut',hex:'#79523d'},dark:{tr:'Koyu ahşap',en:'Dark wood',hex:'#393b32'}};
export const FABRICS={linen:{tr:'Kum beji',en:'Sand beige',ground:'#ded5bf',ink:'#475541',accent:'#a77a55',soft:'#a5ad8a'},clay:{tr:'Kiremit',en:'Terracotta',ground:'#ad6c53',ink:'#f0dfc2',accent:'#5d3438',soft:'#d5ae8f'},indigo:{tr:'Çivit mavisi',en:'Indigo blue',ground:'#273e50',ink:'#e4d8bf',accent:'#b58755',soft:'#88a3a1'},charcoal:{tr:'Antrasit',en:'Charcoal',ground:'#333833',ink:'#e9e5d7',accent:'#a59d7b',soft:'#7d8d7c'}};
export const INITIAL={version:1,model:'console',...MODELS.console.defaults,wood:'walnut',fabric:'linen',pattern:'none'};
const has=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const bound=(v,range,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.min(range[1],Math.max(range[0],Math.round(v))):fallback;
export function normalizeDesign(value={}){
 if(!value||typeof value!=='object'||Array.isArray(value))value={};
 const model=has(MODELS,value.model)?value.model:'console',m=MODELS[model],r={version:1,model};
 for(const key of ['width','height','depth','columns','rows'])r[key]=bound(value[key],m.limits[key],m.defaults[key]);
 // Keep modules comfortably legible in the concept model; this is not a structural calculation.
 r.columns=Math.min(r.columns,Math.max(2,Math.floor(r.width/28)));
 r.rows=Math.min(r.rows,Math.max(1,Math.floor((r.height-(model==='console'?16:0))/22)));
 if(model==='bench'){r.columns=2;r.rows=1;}
 r.front=model==='console'&&value.front==='closed'?'closed':model==='console'&&value.front!=='open'?m.defaults.front:'open';
 r.wood=has(WOODS,value.wood)?value.wood:'walnut';r.fabric=has(FABRICS,value.fabric)?value.fabric:'linen';r.pattern='none';
 return r;
}
export function decodeDesign(text){try{const value=JSON.parse(text);return value?.version===1&&has(MODELS,value.model)&&['width','height','depth'].every(k=>typeof value[k]==='number'&&Number.isFinite(value[k]))?normalizeDesign(value):null}catch{return null}}
export function compileDesign(raw){
 const s=normalizeDesign(raw),W=s.width/100,H=s.height/100,D=s.depth/100,t=PANEL_RULES.panelThickness,parts=[];
 const box=(role,x,y,z,w,h,d,material='wood')=>{const size=[w,h,d].map(metricSnap);if(size.some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid geometry');parts.push({role,position:[x,y,z].map(metricSnap),size,material});};
 if(s.model==='bench'){
  const cushion=.085,seat=.035,leg=.055,legTop=H-cushion-seat;
  box('seat',0,legTop+seat/2,0,W,seat,D);
  box('cushion',0,H-cushion/2,0,W-.025,cushion,D-.025,'fabric');
  for(const signX of [-1,1])for(const signZ of [-1,1])box('leg',signX*(W/2-.09),legTop/2,signZ*(D/2-.075),leg,legTop,leg);
  box('rail',0,.15,-D/2+.075,W-.18,.065,.035);box('rail',0,.15,D/2-.075,W-.18,.065,.035);
 }else{
  const lift=s.model==='console'?.16:.04,body=H-lift,bottom=lift+t/2,top=H-t/2;
  box('top',0,top,0,W,t,D);box('base',0,bottom,0,W,t,D);
  const closed=s.front==='closed',bodyDepth=closed?D-.022:D,bodyZ=closed?-.011:0;
  for(const x of [-W/2+t/2,W/2-t/2])box('side',x,lift+body/2,bodyZ,t,body-2*t,bodyDepth);
  box('back',0,lift+body/2,-D/2+.008/2,W-2*t,body-2*t,.008);
  const colWidth=(W-t)/s.columns,cellH=(body-t)/s.rows;
  for(let c=1;c<s.columns;c++)box('divider',-W/2+t/2+c*colWidth,lift+body/2,bodyZ,t,body-2*t,bodyDepth-.018);
  for(let row=1;row<s.rows;row++)for(let col=0;col<s.columns;col++){
   const cell=cellBounds(colWidth,cellH,D);
   box('shelf',-W/2+t/2+(col+.5)*colWidth,lift+t/2+row*cellH,bodyZ,cell.width,t,Math.min(cell.depth,bodyDepth-.018));
  }
  if(s.front==='closed')for(let col=0;col<s.columns;col++){
   const cell=cellBounds(colWidth,body,D),x=-W/2+t/2+(col+.5)*colWidth;
   box('door',x,lift+body/2,D/2-.009,cell.frontWidth,body-.008,.018);
   box('pull',x+cell.frontWidth*.31,lift+body*.74,D/2-.001,.012,.085,.002,'metal');
  }
  if(s.model==='console')for(const x of [-W/2+.1,W/2-.1])for(const z of [-D/2+.08,D/2-.08])box('leg',x,lift/2,z,.045,lift,.045);
  else box('plinth',0,lift/2,0,W-.055,lift,D-.045);
 }
 return {state:s,width:W,height:H,depth:D,parts};
}
