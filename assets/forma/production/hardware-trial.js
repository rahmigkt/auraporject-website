import {matchExternalReport} from './external-validation.js';
export async function matchHardwareTrial(data,report){
 if(report?.schema!=='aura.hardware-assembly-trial/1'||report.production_approved!==false||report.real_hardware_motion_verified!==false||!Array.isArray(report.runner_fit)||!Array.isArray(report.hinge_fit)||!Array.isArray(report.sampled_linear_stress))throw Error('Donanım deneme raporunun kapsamı geçersiz.');
 const r=await matchExternalReport(data,{schema:'aura.cad-fcl-pilot/1',input_sha256:report.input_sha256,production_approved:false});return r.report?report:null;
}
export function validateLocalHardwarePreview(p,sha){
 if(p?.schema!=='aura.local-hardware-preview/1'||p.production_approved!==false||p.input_sha256!==sha||!p.meshes||!Array.isArray(p.instances)||p.instances.length>200)throw Error('Yerel CAD görünüşü bu rapora ait değil.');
 const ids=new Set();
 for(const m of Object.values(p.meshes)){
  if(!Array.isArray(m.positions)||!Array.isArray(m.indices)||!m.positions.length||m.positions.length%3||m.indices.length%3||m.positions.length>3000000||m.indices.length>3000000||!m.positions.every(Number.isFinite)||!m.indices.every(i=>Number.isInteger(i)&&i>=0&&i<m.positions.length/3))throw Error('Yerel CAD mesh verisi geçersiz.');
 }
 for(const q of p.instances){
  if(!q.id||ids.has(q.id)||!p.meshes[q.mesh]||!Array.isArray(q.matrix)||q.matrix.length!==4||q.matrix.some(r=>!Array.isArray(r)||r.length!==4||!r.every(Number.isFinite))||![0,.5,1].includes(q.motion))throw Error('Yerel CAD yerleşimi geçersiz.');ids.add(q.id);
  if(q.matrix[3].some((v,i)=>Math.abs(v-(i===3?1:0))>1e-8))throw Error('Yerel CAD dönüşüm matrisi geçersiz.');
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){const dot=q.matrix[i].slice(0,3).reduce((s,v,k)=>s+v*q.matrix[j][k],0);if(Math.abs(dot-(i===j?1:0))>1e-6)throw Error('Yerel CAD ölçek veya eksenleri geçersiz.');}
 }
 return p;
}
