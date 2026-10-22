import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {uygula,SOZLUK} from '../studyo-motoru/motor.mjs';
export const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const encode=x=>JSON.stringify(canonical(x));
export const sha=x=>createHash('sha256').update(x).digest('hex');
export const get=(s,p)=>p.split('/').slice(1).reduce((v,k)=>v?.[k],s);
export function layer(type){const matches=Object.entries(SOZLUK).filter(([,ops])=>Object.hasOwn(ops,type));assert.equal(matches.length,1,`Ambiguous/unknown action ${type}`);return matches[0][0];}
export function replay(row){return uygula(row.input.state,row.expected.actions.map(op=>({...op,katman:layer(op.type)})));}
export function validate(row){
 assert(row.source.training_forbidden);assert(row.input.text.trim());assert.equal(row.lang,row.input.lang);
 const before=encode(row.input.state),e=row.expected;
 if(e.intent!=='apply'){
  assert.equal(e.actions.length,0,'clarify/refuse/route must not change the plan');
  assert(['clarify','refuse','studio_redirect'].includes(e.intent));
  if(e.intent==='studio_redirect'){
   assert(['seating','table','storage'].includes(e.route.family));
   assert.equal(e.route.url,`tasarla.html?family=${e.route.family}`);
   assert(e.route.designer_review_required);
  }
  assert.deepEqual(replay(row).state,row.input.state);return {id:row.id,intent:e.intent,actions:0,state_unchanged:true};
 }
 assert(e.actions.length>0);const r=replay(row);assert.equal(encode(row.input.state),before,'engine mutated supplied input');
 assert.equal(r.rapor.gecti,true,`${row.id}: engine rejected`);assert.deepEqual(r.rapor.red,[]);assert.deepEqual(r.rapor.uyari,[],`${row.id}: warning is not success`);
 for(const[p,want]of Object.entries(e.observations))assert.deepEqual(get(r.state,p),want,`${row.id}: ${p}`);
 if(e.actions.some(a=>a.type==='yerlestir')){
  const action=e.actions.find(a=>a.type==='yerlestir'),measure=r.rapor.olcum.yerlesim;
  assert.deepEqual(action.kisitlar,e.layout_constraints,'gold omitted or changed requested constraints');
  assert(measure.sigdi);assert.equal(measure.kisit_karsilanan,action.kisitlar.length);
  assert.deepEqual(action.esyalar,row.input.context.available_items,'gold changed supplied dimensions');
  assert.equal(r.state.plan.items.length,action.esyalar.length);
  for(const item of action.esyalar){const actual=r.state.plan.items.find(x=>x.id===item.id);assert(actual);assert.deepEqual(actual.size_mm,{w:item.en,d:item.derinlik,h:item.yukseklik});}
  assert.deepEqual(r.state.plan.openings,row.input.state.plan.openings,'door changed');
 }else{
  assert(Object.keys(e.observations).length>0,'positive gold needs explicit independent target observations');
  if(!e.actions.some(a=>a.type==='oda_tanimla'||a.type.startsWith('duvar_'))){assert.deepEqual(r.state.plan.walls,row.input.state.plan.walls);assert.deepEqual(r.state.plan.spaces,row.input.state.plan.spaces);}
  if(e.actions.some(a=>a.type==='oda_tanimla')){assert.deepEqual(r.state.plan.walls,row.input.state.plan.walls);assert.deepEqual(r.state.plan.spaces[0].boundary_xy_mm,row.input.state.plan.spaces[0].boundary_xy_mm);}
 }
 return {id:row.id,intent:e.intent,actions:e.actions.length,accepted:r.rapor.kabul.length,warnings:0,state_sha256:sha(encode(r.state)),measurements:r.rapor.olcum};
}
