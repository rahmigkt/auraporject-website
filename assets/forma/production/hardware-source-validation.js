import {matchExternalReport} from './external-validation.js';
export async function matchHardwareSources(data,report){
 if(report?.schema!=='aura.hardware-source-review/1'||report.production_approved!==false||report.real_hardware_motion_verified!==false||!Array.isArray(report.products))throw Error('Donanım kaynak raporunun kapsamı geçersiz.');
 const result=await matchExternalReport(data,{schema:'aura.cad-fcl-pilot/1',production_approved:false,input_sha256:report.input_sha256});
 return result.report?report:null;
}
