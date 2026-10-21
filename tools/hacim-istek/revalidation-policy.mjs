// Main #197 normalization may add only the absent default automatic leaf count.
// Used for historical frozen-state comparison, never to alter frozen targets.
const get=(obj,p)=>p.split('/').slice(1).reduce((v,k)=>v?.[k],obj);
export function automaticLeafDefaultsOnly(previous,next,paths){
 return paths.length>0&&paths.every(p=>/^\/design\/params\/bays\/\d+\/cells\/\d+\/lv$/.test(p)&&get(previous,p)===undefined&&get(next,p)===0);
}
