import {readLink} from '../forma/link.js';
import {normalizeDesign} from '../forma/generate.js';
export async function importDesignLink(input){
  if(typeof input!=='string'||input.length>263000)throw Error('Bağlantı çok uzun. JSON yedeğini kullanın.');
  let url;try{url=new URL(input.trim());}catch{throw Error('Tam tasarım bağlantısını yapıştırın.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||!url.pathname.endsWith('/tasarla.html'))throw Error('AURA stüdyo tasarım bağlantısı gerekli.');
  // No request is made to this URL: only its local fragment is decoded.
  if(!/^#[dp]=[A-Za-z0-9_-]+$/.test(url.hash))throw Error('Bu adres tasarım içermiyor. Stüdyo → Proje → Bu tasarımın bağlantısını al.');
  const result=await readLink(url.hash);if(!result)throw Error('Tasarım bağlantısı bozuk veya sürümü desteklenmiyor.');
  function design(d){if(!d||!['seating','table','storage','kitchen','bath','bedroom','set'].includes(d.family)||typeof d.kind!=='string'||!d.params||typeof d.params!=='object'||Array.isArray(d.params)||!d.materials||typeof d.materials!=='object')throw Error('Tasarımın aile, ölçü veya malzeme verisi eksik.');return normalizeDesign(structuredClone(d));}
  if(result.design)return design(result.design);
  return {items:result.items.map((it,i)=>({id:'link-'+i,qty:Math.max(1,Math.min(99,Number(it.qty)||1)),design:design(it.design)}))};
}
