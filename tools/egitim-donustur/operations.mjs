// Common contract uses `tur` for the operation name, while native home actions
// also use `tur` for a room/opening kind. Preserve those arguments losslessly.
export function decodeOperations(operations){
 return operations.map(({tur,katman,arguments:args,...rest})=>{
  if(args!==undefined&&(args===null||typeof args!=='object'||Array.isArray(args)))throw Error('Operation arguments must be an object');
  if(args&&('type' in args||'katman' in args))throw Error('Arguments cannot replace the operation identity');
  return {...rest,...(args||{}),katman,type:tur};
 });
}
