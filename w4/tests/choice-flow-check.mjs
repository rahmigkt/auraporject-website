import assert from 'node:assert/strict';
import {FAMILIES,normalizeStudio,compileStudio} from '../assets/design-library.js';
import {stepsFor,choicesFor,applyChoice,projectRecord} from '../assets/choice-flow.js';
let cases=0;
for(const family of Object.keys(FAMILIES)){
 let state=applyChoice({},'family',family);const flow=stepsFor(family);assert.equal(flow[0],'room');assert.equal(flow.at(-1),'review');
 for(const step of flow.filter(k=>!['room','review'].includes(k))){const options=choicesFor(step,state);assert(options.length>0);for(const option of options){const candidate=applyChoice(state,step,option.id),d=compileStudio(candidate);for(const p of d.parts){assert(p.size.every(v=>Number.isFinite(v)&&v>0));const size=p.rotation?[p.size[0],p.size[2],p.size[1]]:p.size;for(let a=0;a<3;a++){const limit=[d.width,d.height,d.depth][a];assert(p.position[a]-size[a]/2>=(a===1?0:-limit/2)-.003,JSON.stringify({family,step,option,p,a}));assert(p.position[a]+size[a]/2<=(a===1?limit:limit/2)+.003,JSON.stringify({family,step,option,p,a}));}}assert.deepEqual(normalizeStudio(JSON.parse(JSON.stringify(candidate))),candidate);cases++;}
  state=applyChoice(state,step,options[0].id);
 }
 const project=projectRecord(state,{room:'living',familyChosen:true,dimensionsEntered:false},'fr');assert.equal(project.submitted,false);assert.equal(project.dimensionsStatus,'suggested');assert(project.parts.length>0);
}
const sofa=applyChoice({},'family','sofa');assert(compileStudio({...sofa,cushions:'fixed'}).parts.some(p=>p.role==='fixed-seat'));assert(!compileStudio({...sofa,cushions:'fixed'}).parts.some(p=>p.role==='seat-cushion'));assert(compileStudio({...sofa,back:'looseBack'}).parts.some(p=>p.role==='back-cushion'));assert(compileStudio({...sofa,arms:'rounded'}).parts.some(p=>p.role==='arm'&&p.shape==='rounded'));assert(compileStudio({...sofa,arms:'sloped'}).parts.some(p=>p.shape==='sloped'));
const two=applyChoice(sofa,'layout','two');assert.equal(applyChoice(two,'size','generous').seats,2);
for(const layout of ['left','right']){const s=applyChoice(sofa,'layout',layout);assert(compileStudio(s).parts.some(p=>p.role==='chaise-frame'));assert(choicesFor('legs',s).every(c=>['straight','tapered'].includes(c.id)));}
const round=applyChoice(applyChoice({},'family','table'),'top','round');assert.equal(round.width,round.depth);assert(compileStudio(round).parts.some(p=>p.shape==='ellipse'));assert(applyChoice(round,'size','generous').width>round.width);
const mixed=applyChoice(applyChoice({},'family','console'),'front','mixed');assert(mixed.columns>=3);assert(!choicesFor('storage',mixed).some(c=>c.id==='2'));
console.log(`PASS ${cases} option variants across ${Object.keys(FAMILIES).length} complete family flows; fixed seats, rounded/sloped arms, back variants, chaise, round tops, project hand-off.`);
