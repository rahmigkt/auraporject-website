export const validProductId=id=>typeof id==='string'&&/^AURA-P-[a-f0-9]{32}$/.test(id);
export function identifyDesign(design,previous=null){
  if(validProductId(design.productId))return design;
  const productId=previous?.family===design.family&&previous?.kind===design.kind&&validProductId(previous.productId)?previous.productId:'AURA-P-'+crypto.randomUUID().replaceAll('-','');
  return {...design,productId};
}
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
export async function designRevision(d){
  const source={family:d.family,kind:d.kind,style:d.style,seed:d.seed,params:d.params,materials:d.materials,overrides:d.overrides||[]};
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(source))));
  return 'AURA-R-'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
