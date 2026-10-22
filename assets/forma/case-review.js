import {worldPositions} from './build.js';
function box(q){const p=worldPositions(q),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];if(!p.length||!Array.from(p).every(Number.isFinite))throw Error('Invalid part geometry');for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],p[i+k]);hi[k]=Math.max(hi[k],p[i+k]);}return {lo,hi};}
const near=(a,b)=>a.lo.every((v,k)=>v<=b.hi[k]+.6&&a.hi[k]>=b.lo[k]-.6);
export function caseReview(c){
 if(!['storage','kitchen','bath'].includes(c.family))return {status:'not_applicable',findings:[],shelves:[]};
 const findings=[],shelves=[];
 const sides=c.parts.filter(p=>['side','divider'].includes(p.role));
 for(const q of c.parts.filter(q=>q.role==='shelf-adj')){
  const pins=c.parts.filter(p=>p.role==='shelf-pin'&&p.id.startsWith(q.id+'-pin-'));
  let contact=0,anchored=0;try{const b=box(q);for(const p of pins){const pb=box(p);if(near(b,pb))contact++;if(sides.some(s=>near(pb,box(s))))anchored++;}}catch{}
  shelves.push({id:q.id,supports:pins.length,potential_contacts:contact,potential_side_contacts:anchored});
  if(pins.length!==4||contact!==4||anchored!==4)findings.push({code:'shelfSupportReview',level:'review',parts:[q.id]});
 }
 if(c.parts.some(q=>q.role==='shelf-glass'))findings.push({code:'glassShelfReview',level:'review'});
 if(c.parts.some(q=>q.role==='door'||q.role==='hinge'))findings.push({code:'hingeSelectionReview',level:'review'});
 if(c.parts.some(q=>q.role==='runner'))findings.push({code:'runnerSelectionReview',level:'review'});
 findings.push({code:'cabinetFixingReview',level:'review'},{code:'cabinetUseReview',level:'review'});
 if(['kitchen','bath'].includes(c.family))findings.push({code:'wetRoomReview',level:'review'});
 if(c.family==='kitchen')findings.push({code:'applianceInstallationReview',level:'review'});
 return {status:'designer_review_required',production_approved:false,findings,shelves,
  scope:'Potential shelf/pin and pin/side-panel AABB contact only (0.6 mm tolerance); no drilled joint, hardware load rating, wall-anchor capacity, creep, impact or regulatory conformity inferred.'};
}
export function textileReview(tx){
 const findings=[];
 if(tx?.curtain?.system&&tx.curtain.system!=='yok'){
  findings.push({code:'curtainMountingReview',level:'review'});
  if(['stor','plise'].includes(tx.curtain.system))findings.push({code:'blindCordReview',level:'review'});
 }
 if(tx?.rug?.on)findings.push({code:'rugUseReview',level:'review'});
 return {schema:'aura.textile-review/1',status:'designer_review_required',production_approved:false,findings,
  scope:'Configuration notes only; textile view is separate from furniture project submission. No wall fixings, cord mechanism or real floor friction specified.'};
}
