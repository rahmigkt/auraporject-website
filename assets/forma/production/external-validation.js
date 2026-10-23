// A frozen external result is evidence only for the identical design AND compiled parts.
export const canonical=value=>{
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('Nonfinite external validation input');
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 return JSON.stringify(value);
};
export const externalInput=({design,compiled,review,manufacturing})=>{const m=review?.manufacturing||manufacturing;if(!m)throw Error('Missing manufacturing recipe fingerprint');return canonical({design,parts:compiled.parts,manufacturing:m});};
export async function externalFingerprint(data){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(externalInput(data))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function matchExternalReport(data,report){
 if(report?.schema!=='aura.cad-fcl-pilot/1'||report.production_approved!==false||!/^[a-f0-9]{64}$/.test(report.input_sha256||''))throw Error('Harici rapor şeması veya kapsamı geçersiz.');
 if(await externalFingerprint(data)!==report.input_sha256)return {status:'different_or_changed_model',report:null};
 return {status:'matching_frozen_input_not_production_approval',report};
}
