// A member-level scenario screen, not furniture certification or species grading.
import {SEATING_SCREEN as DATA} from './seating-screen-data.js';
export const structuralGrades = DATA.grades;
export const screenScenario = DATA.scenario;

export function seatingScreen(compiled) {
  if(compiled?.family !== 'seating') return {status:'not_applicable',eligible:[]};
  const legs=compiled.parts.filter(p=>['leg','arm-post'].includes(p.role));
  if(!legs.length) return {status:'unsupported',eligible:[]};
  let eligible=[...structuralGrades];const members=[];
  for(const q of legs){
    const g=q.geom;
    // Cuts, bending overrides and unmodelled connections must not inherit a pass.
    if(q.cuts?.length || g?.fn!=='lathe' || q.mat!=='wood' || !Array.isArray(g.profile) || g.profile.length<2 ||
       g.profile.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||p[1]<=0) ||
       (q.rot||[]).some(v=>!Number.isFinite(v)) || Math.hypot(q.rot?.[0]||0,q.rot?.[2]||0)>20*Math.PI/180)
      return {status:'unsupported',eligible:[],member:q.id};
    const ys=g.profile.map(p=>p[0]),h=Math.max(...ys)-Math.min(...ys),radius=Math.min(...g.profile.map(p=>p[1]));
    if(h<=0||h>DATA.max_height_mm)return {status:'unsupported',eligible:[],member:q.id};
    const shape=g.square?'square':'round',index=Math.ceil(h/DATA.height_step_mm)-1;
    const allowed=structuralGrades.filter(grade=>radius>=DATA.required_radius_mm[shape][grade][index]);
    eligible=eligible.filter(g=>allowed.includes(g));
    members.push({id:q.id,height_mm:h,min_radius_mm:radius,shape,eligible:allowed});
  }
  return {status:'scenario_only',eligible,members,scenario:DATA.scenario.id,certified:false};
}

// Body reference, not universal seat limits. Values checked against printed Table2 p30.
export function seatingErgoReference(compiled) {
  if(compiled?.family!=='seating')return null;
  const m=compiled.meta;
  return {cohort:'Turkey65plus',source:'https://doi.org/10.33439/ergonomi.1353465',
    seat_height_mm:m.seatHeight,usable_depth_mm:m.seatDepth,seat_width_each_mm:m.seatWidthEach,
    female_p5_popliteal_mm:380,female_p5_buttock_popliteal_mm:408,female_p95_hip_breadth_mm:403,
    note:'Body dimensions only; cushion compression, footwear, clearance and individual fit not evaluated',certified:false};
}
