import assert from 'node:assert/strict';
import {compileStudio,normalizeStudio} from '../assets/design-library.js';
import {applyStudioCalls} from '../assets/design-tools.js';
let checks=0;
for(const configuration of ['cornerLeft','cornerRight'])for(const width of [220,320,330])for(const depth of [180,260,350])for(const arms of ['rounded','slim','none','paddedWood'])for(const service of ['none','wood','cupholders']){
 const m=compileStudio({family:'sofa',configuration,width,depth,height:90,arms,service,pillows:'yes',legs:'cylindrical',fabric:'taupe',seats:2,returnSeats:2,back:'looseBack'});
 for(const p of m.parts){assert(p.size.every(v=>Number.isFinite(v)&&v>0));for(let a=0;a<3;a++){const extent=[m.width,m.height,m.depth][a],lo=a===1?0:-extent/2,hi=a===1?extent:extent/2;assert(p.position[a]-p.size[a]/2>=lo-.003,JSON.stringify({configuration,width,depth,arms,service,p,a}));assert(p.position[a]+p.size[a]/2<=hi+.003,JSON.stringify({configuration,width,depth,arms,service,p,a}));}}
 assert(m.parts.some(p=>p.role==='return-back-support'));assert(m.parts.some(p=>p.role==='corner-seat'));assert.equal(m.parts.filter(p=>p.role==='cupholder').length,service==='cupholders'?2:0);assert.deepEqual(normalizeStudio(m.state),m.state);checks++;
}
const right=compileStudio({configuration:'cornerRight',width:320,depth:260}),left=compileStudio({configuration:'cornerLeft',width:320,depth:260});assert.deepEqual(left.parts.map(p=>p.position[0]),right.parts.map(p=>-p.position[0]));
const r=applyStudioCalls({},[{function:{name:'update_design',arguments:{family:'sofa',configuration:'cornerRight',width:320,depth:260,seats:2,returnSeats:2,arms:'paddedWood',service:'cupholders',pillows:'yes',fabric:'taupe',legs:'cylindrical'}}}]);assert.equal(r.state.depth,260);assert.equal(r.state.service,'cupholders');assert(r.parts.some(p=>p.role==='arm-wood-tray'));assert(r.parts.some(p=>p.role==='return-throw-pillow'));
for(const cushions of ['fixed','single','split'])for(const back of ['fixedBack','looseBack','channelBack']){const m=compileStudio({...r.state,cushions,back});assert(m.parts.some(p=>p.role===(cushions==='fixed'?'fixed-return-seat':'return-seat-cushion')));assert(m.parts.some(p=>p.role===(back==='fixedBack'?'fixed-return-back':back==='channelBack'?'return-back-channel':'return-back-cushion')));}
console.log(`PASS ${checks} sectional bounds/support variants, mirrored layouts, real tool contract and seat/back variants.`);
