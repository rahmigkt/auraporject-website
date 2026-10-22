import {normalizeDesign,compileDesign} from './generate.js';
import {familyOf} from './families.js';
import {buildMesh} from './build.js';
import {technicalReview} from './technical-review.js';
import {seatingScreen} from './seating-screen.js';
export function reviewDesign(d){
 const c=compileDesign(d),f=familyOf(d),issues=f.mod.validate?.(c,d.materials,buildMesh)||[];
 return technicalReview(d,c,issues);
}
/** A reversible proposal, never a production approval. Unknowns remain explicit. */
export function autoCorrectDesign(input){
 const original=structuredClone(input),d=normalizeDesign(input),changes=[];
 // Restore only removed generated frame members. Never discard custom shape,
 // machining, material or transform overrides to manufacture a passing result.
 if(d.overrides?.some(o=>o.tool==='remove'&&o.id?.startsWith('frame-'))){
  d.overrides=d.overrides.filter(o=>!(o.tool==='remove'&&o.id?.startsWith('frame-')));
  changes.push('restoreGeneratedFrame');
 }
 if(d.family==='seating'){
  const screen=seatingScreen(compileDesign(d));
  if(screen.status==='scenario_only'&&!screen.eligible.includes('D24')){
   for(let r=d.params.legSize+1;r<=48;r++){
    const next=normalizeDesign({...d,params:{...d.params,legSize:r}});
    if(seatingScreen(compileDesign(next)).eligible.includes('D24')){
     d.params=next.params;changes.push('increaseLegSection');break;
    }
   }
  }
 }
 if(d.family==='table'&&d.params.baseType==='legsOnly'){
  const base=d.materials.base?.surface==='same'?d.materials.top:d.materials.base;
  if(base?.surface==='wood'){
   d.params=normalizeDesign({...d,params:{...d.params,baseType:'legsApron',apronHeight:60,apronThickness:25}}).params;
   changes.push('addTableAprons');
  }
 }
 const after=reviewDesign(d);
 return {schema:'aura.correction/1',original,design:d,changes,review:after,
  status:'designer_review_required',production_approved:false,
  note:'Proposal only. D24 screening assumes an unverified grade; joints, stability, ergonomics and aesthetics still require designer assessment.'};
}
