// Independent inputs for the historical stair correction and numeric-boundary review.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {uygula} from '../studyo-motoru/motor.mjs';
const source='knowledge/ai-egitim/inceleme/codex-motor-184-denetim.json';
const old=JSON.parse(fs.readFileSync(source,'utf8'));
const room={id:'ground',kind:'living',boundary_xy_mm:[[0,0],[6000,0],[6000,8000],[0,8000]]};
const state={plan:{walls:[],openings:[],spaces:[room],items:[]}};
const setup=[{katman:'ev',type:'kat_ekle',id:'k1',yukseklik:2800},{katman:'ev',type:'oda_tanimla',kat:'k1',id:'upper',tur:'living',kose:room.boundary_xy_mm}];
const stair={katman:'ev',type:'merdiven',alt:'k0',ust:'k1',konum:[3000,1000],en:900};
const probes=old.results.map(r=>({id:'historical:'+r.id,expected:r.expected,operations:r.operations}));
for(const [key,values] of Object.entries({basamak_sayisi:[0,14.8,'15',null],basamak_derinlik:[0,'257',null],sahanlik:[0,'900'],en:['900',false],aci:['0'],konum:[[3000],[3000,'1000'],[3000,1000,0],[3000,null]]}))for(const value of values)
 probes.push({id:`invalid:${key}:${JSON.stringify(value)}`,expected:'reject',operations:[...setup,{...stair,[key]:value}]});
probes.push({id:'invalid:string-floor-height',expected:'reject',operations:[{katman:'ev',type:'kat_ekle',id:'k1',yukseklik:'2800'}]});
probes.push({id:'valid:explicit-numeric',expected:'accept',operations:[...setup,{...stair,basamak_sayisi:15,basamak_derinlik:257,sahanlik:900,aci:0}]});
for(const [height,count,going] of [[2400,16,330],[2850,15,250]])probes.push({id:`valid:riser-boundary:${height/count}`,expected:'accept',operations:[{...setup[0],yukseklik:height},setup[1],{...stair,en:800,sahanlik:800,basamak_sayisi:count,basamak_derinlik:going}]});
probes.push({id:'recovery:invalid-then-valid-stair',expected:'reject',expected_stairs:1,operations:[...setup,{...stair,basamak_derinlik:'257'},stair]});
const results=probes.map(p=>{const before=JSON.stringify({state,operations:p.operations});let r,error;try{r=uygula(state,p.operations);}catch(e){error=e.message;}
 const accepted=r?.rapor.gecti===true;
 const inputPreserved=JSON.stringify({state,operations:p.operations})===before,stairs=r?.state.merdivenler||[];
 return {...p,accepted,error:error||null,pass:!error&&accepted===(p.expected==='accept')&&inputPreserved&&stairs.length===(p.expected_stairs??(p.expected==='accept'?1:0)),
  input_preserved:inputPreserved,report:r?.rapor||null,stairs};});
const outIndex=process.argv.indexOf('--out'),out=outIndex<0?'work/c7-stair-current.json':process.argv[outIndex+1];
const evidence={scope:'Five historical inputs replayed on a separately constructed ground room, plus numeric boundary probes. Not a training-row, full stair design or building-code approval.',
 source_code_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 hashes:Object.fromEntries([source,'tools/studyo-motoru/motor.mjs','tools/c7-audit/motor-stair.mjs'].map(f=>[f,createHash('sha256').update(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex')])),
 reviewer:'Codex',review_mode:'user_authorized_self_review',training_approved:false,results};
fs.mkdirSync('work',{recursive:true});fs.writeFileSync(out,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({out,total:results.length,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).map(r=>({id:r.id,accepted:r.accepted,error:r.error}))}));
if(process.argv.includes('--assert')&&results.some(r=>!r.pass))process.exitCode=1;
