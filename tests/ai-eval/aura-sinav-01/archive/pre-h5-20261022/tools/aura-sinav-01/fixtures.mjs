import {sample,normalizeDesign} from '../../assets/forma/generate.js';
import {DEFAULT as textileDefault} from '../../assets/ev/tekstil.js';
export function design(family){const d=sample({family,kind:family==='table'?'dining':family==='storage'?'wardrobe':'sofa',style:'aura',seed:1});if(d.materials?.wood)d.materials.wood.stain='natural';return normalizeDesign(d);}
export function room(index=0,small=false,tiny=false){
 const w=tiny?500:small?3157+index*2:5603+index*2,h=tiny?500:small?2851+index*2:4807+index*2;
 return {walls:[{id:'entry-wall',from_xy_mm:[0,0],to_xy_mm:[w,0],thickness:120},{id:'east-wall',from_xy_mm:[w,0],to_xy_mm:[w,h],thickness:120},{id:'outer-wall',from_xy_mm:[w,h],to_xy_mm:[0,h],thickness:120},{id:'west-wall',from_xy_mm:[0,h],to_xy_mm:[0,0],thickness:120}],openings:[],spaces:[{id:'main',kind:'other',name:'Room',boundary_xy_mm:[[0,0],[w,0],[w,h],[0,h]]}],items:[]};
}
export function items(kind){return kind==='sleeping'?[{id:'bed',tur:'bed',en:1600,derinlik:2100,yukseklik:900},{id:'wardrobe',tur:'wardrobe',en:1200,derinlik:580,yukseklik:2000}]:[{id:'sofa',tur:'sofa',en:1900,derinlik:850,yukseklik:800},{id:'tv',tur:'tv',en:1400,derinlik:400,yukseklik:600},...(kind==='living'?[{id:'coffee',tur:'coffee',en:900,derinlik:550,yukseklik:400}]:[])];}
export const emptyTextile=()=>({tekstil:textileDefault()});
export function layer(type){return ['set','delta','enum','material','style','kind','family','seats','drawers','mattress'].includes(type)?'mobilya':['yerlestir','secenek_sec'].includes(type)?'yerlesim':['perde','hali'].includes(type)?'tekstil':['projeye_ekle','tasarimciya_gonder'].includes(type)?'proje':'ev';}
export function canonical(x){if(Array.isArray(x))return x.map(canonical);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));return x;}
export const encode=x=>JSON.stringify(canonical(x));
export const get=(obj,path)=>path.split('/').slice(1).reduce((v,k)=>v?.[k],obj);
