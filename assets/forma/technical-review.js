import {seatingScreen,seatingErgoReference} from './seating-screen.js';
import {constructionReview} from './construction.js';
import {caseReview} from './case-review.js';
export const REVIEW_SCHEMA='aura.technical-review/3';
// Exact serialized input, including designer overrides. Never infer approval
// from an older report after any geometry/material change.
export const reviewInput=d=>JSON.stringify({family:d.family,kind:d.kind,params:d.params,materials:d.materials,overrides:d.overrides||[]});
export const reviewMatches=(r,d)=>r?.schema===REVIEW_SCHEMA&&r.input===reviewInput(d)&&Array.isArray(r.findings)&&r.findings.every(x=>x&&typeof x.code==='string');
export function technicalReview(d,c,issues=[],at=new Date().toISOString()) {
  const findings=issues.map(x=>({code:x.code,level:x.level,value:x.value}));
  const construction=constructionReview(c,d.materials);
  findings.push(...construction.findings);
  const cabinetry=caseReview(c);findings.push(...cabinetry.findings);
  const seating=d.family==='seating'?{member_screen:seatingScreen(c),ergonomic_reference:seatingErgoReference(c)}:null;
  const reviewTopics=['dimensions','material_grade_and_connections','stability_and_durability','ergonomic_fit','aesthetic_proposals'];
  if(seating){
    findings.push({code:'materialGradeUnknown',level:'review'});
    if(seating.member_screen.status!=='scenario_only')findings.push({code:'memberScreenUnknown',level:'review'});
    else if(!seating.member_screen.eligible.length)findings.push({code:'memberScreenReview',level:'review'});
    const er=seating.ergonomic_reference;
    if(er.usable_depth_mm>er.female_p5_buttock_popliteal_mm)findings.push({code:'olderAdultSeatDepth',level:'review',value:er.usable_depth_mm});
  }
  return {schema:REVIEW_SCHEMA,input:reviewInput(d),created_at:at,status:'designer_review_required',
    automatic_changes:false,production_approved:false,findings,review_topics:reviewTopics,seating,construction,cabinetry,
    scope:'Automated concept review notes only; designer must assess technical and aesthetic revisions and return proposals for customer approval.'};
}
