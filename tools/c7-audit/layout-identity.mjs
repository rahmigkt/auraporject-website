// Local synthetic data only: repeated product identities must not substitute sizes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {uygula} from '../studyo-motoru/motor.mjs';
const state={plan:{walls:[],openings:[],spaces:[{id:'salon',kind:'living',boundary_xy_mm:[[0,0],[6000,0],[6000,5000],[0,5000]]}],items:[{id:'saved',space_id:'salon',size_mm:{w:300,d:300,h:500},pos_xy_mm:[1000,1000],rot_deg:0}]}};
const items=[{tur:'kanepe',en:2100,derinlik:900},{tur:'tv',en:1600,derinlik:450},{tur:'yan_sehpa',id:'side-a',en:500,derinlik:500},{tur:'yan_sehpa',id:'side-b',en:450,derinlik:450}];
const op={katman:'yerlesim',type:'yerlestir',oda:'salon',esyalar:items};
const edit=(index,change)=>items.map((e,i)=>i===index?{...e,...change}:{...e});
const probes=[
 {id:'duplicate-default-ids',op:{...op,esyalar:items.map(({id,...e})=>e)}},
 {id:'duplicate-explicit-ids',op:{...op,esyalar:edit(3,{id:'side-a'})}},
 {id:'not-array',op:{...op,esyalar:{}}},
 {id:'empty-array',op:{...op,esyalar:[]}},
 {id:'null-item',op:{...op,esyalar:[null]}},
 {id:'string-width',op:{...op,esyalar:edit(2,{en:'500'})}},
 {id:'zero-height',op:{...op,esyalar:edit(2,{yukseklik:0})}},
 {id:'empty-explicit-id',op:{...op,esyalar:edit(2,{id:''})}},
 {id:'inherited-kind',op:{...op,esyalar:[{tur:'constructor',en:500,derinlik:500}]}},
 {id:'constraints-not-array',op:{...op,kisitlar:{}}},
 {id:'ambiguous-constraint-alias',op:{...op,kisitlar:[{tur:'yakin',a:'yan_sehpa',b:'kanepe',mm:20000}]}},
 {id:'valid-explicit-ids',op,valid:true},
 {id:'valid-explicit-constraint-ids',op:{...op,kisitlar:[{tur:'yakin',a:'side-a',b:'side-b',mm:20000}]},valid:true}
];
const results=probes.map(p=>{const original=JSON.stringify({state,op:p.op});let result,error;
 try{result=uygula(state,[p.op]);}catch(e){error=e.message;}
 const unchangedInput=original===JSON.stringify({state,op:p.op}),out=result?.state.plan.items||[];
 const correctSizes=out.find(x=>x.id==='side-a')?.size_mm.w===500&&out.find(x=>x.id==='side-b')?.size_mm.w===450;
 const noMutation=result&&JSON.stringify(result.state.plan)===JSON.stringify(state.plan);
 const accepted=result?.rapor.gecti===true&&result?.rapor.olcum.yerlesim?.sigdi===true;
 return {id:p.id,input:p.op,expected:p.valid?'accept-preserve-distinct-sizes':'reject-without-changing-saved-plan',error:error||null,pass:!error&&unchangedInput&&(p.valid?accepted&&correctSizes:result?.rapor.red.length>0&&noMutation),input_preserved:unchangedInput,report:result?.rapor||null,output_items:out};
});
const i=process.argv.indexOf('--out'),out=i<0?'work/c7-layout-identity.json':process.argv[i+1];
const evidence={scope:'13 synthetic layout identity/input probes; not full solver or training approval.',source_code_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reviewer:'Codex',review_mode:'user_authorized_self_review',training_approved:false,
 sources_sha256_lf:Object.fromEntries(['tools/studyo-motoru/motor.mjs','tools/c7-audit/layout-identity.mjs'].map(f=>[f,createHash('sha256').update(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')])),results};
fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({out,probes:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>({id:r.id,error:r.error}))}));
if(process.argv.includes('--assert'))assert(results.every(r=>r.pass));
