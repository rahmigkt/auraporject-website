import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {uygula} from '../studyo-motoru/motor.mjs';
import {motorDenetimi} from '../egitim/motor-onbellek.mjs';
const plan={walls:[],openings:[],spaces:[{id:'room',kind:'living',boundary_xy_mm:[[0,0],[6000,0],[6000,5000],[0,5000]]}],items:[]};
const layout={katman:'yerlesim',type:'yerlestir',oda:'room',esyalar:[{id:'sofa',tur:'sofa',en:1900,derinlik:850},{id:'tv',tur:'tv',en:1400,derinlik:400}]};
const cases=[
 {id:'valid-layout',state:{plan},ops:[layout],expect:true},
 {id:'unmet-distance',state:{plan},ops:[{...layout,kisitlar:[{tur:'uzak',a:'sofa',b:'tv',mm:1e9}]}],expect:false},
 {id:'unknown-constraint',state:{plan},ops:[{...layout,kisitlar:[{tur:'unknown',a:'sofa',b:'tv'}]}],expect:false},
 {id:'no-fit-not-positive-layout',state:{plan:{...plan,spaces:[{...plan.spaces[0],boundary_xy_mm:[[0,0],[500,0],[500,500],[0,500]]}]}},ops:[{...layout,esyalar:[{id:'bed',tur:'bed',en:1800,derinlik:2100}]}],expect:false},
 {id:'clamped-furniture-target',state:{},ops:[{katman:'mobilya',type:'set',key:'width',value:9000}],expect:false},
 {id:'self-intersecting-room',state:{plan},ops:[{katman:'ev',type:'oda_tanimla',id:'room',kose:[[0,0],[6000,5000],[6000,0],[0,5000]]}],expect:false}
];
const results=cases.map(c=>{let report;const checked=(s,o)=>{const r=uygula(s,o);report=r.rapor;return r;},cache=motorDenetimi(checked),before=JSON.stringify(c);
 const admitted=cache.kabul(c.state,c.ops),again=cache.kabul(structuredClone(c.state),structuredClone(c.ops));
 return {...c,admitted,pass:admitted===c.expect&&again===admitted&&cache.sayim.benzersiz===1&&JSON.stringify(c)===before,report};});
const i=process.argv.indexOf('--out'),out=i<0?'work/c7-admission.json':process.argv[i+1];
const evidence={scope:'Positive training motor admission gate only. Honest no-fit examples require a separate reviewed negative-outcome contract; they must not be admitted as successful placements.',source_code_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reviewer:'Codex',review_mode:'user_authorized_self_review',training_approved:false,
 hashes:Object.fromEntries(['tools/egitim/motor-onbellek.mjs','tools/studyo-motoru/motor.mjs','tools/c7-audit/admission.mjs'].map(f=>[f,createHash('sha256').update(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')])),results};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({out,cases:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>r.id)}));
if(process.argv.includes('--assert'))assert(results.every(r=>r.pass));
