import {config} from './config.js';
export const params = new URLSearchParams(location.search);
export const lang=params.get('lang')==='en'?'en':'tr';
export const t=(tr,en)=>lang==='en'?en:tr;
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const href=(page='index',args={})=>`${page}.html?${new URLSearchParams({lang,...args})}`;
export function safeUrl(value){try{const u=new URL(value,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}}
export const imageUrl=path=>!path?'':/^https?:\/\//.test(path)?safeUrl(path):path.startsWith('assets/')?path:`${config.supabaseUrl}/storage/v1/object/public/${config.catalogBucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
export const localize=(obj,key)=>lang==='en'?(obj[key+'_en']||obj[key]||''):(obj[key]||'');
export function money(price,currency='TRY'){return price==null?'':new Intl.NumberFormat(lang==='en'?'en-GB':'tr-TR',{style:'currency',currency}).format(Number(price))}
export async function request(path,options={}){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
 try{const r=await fetch(`${config.supabaseUrl}${path}`,{...options,signal:controller.signal,headers:{apikey:config.supabaseAnonKey,Authorization:`Bearer ${config.supabaseAnonKey}`,'Content-Type':'application/json',...options.headers}});let data;try{data=await r.json()}catch{data=null}if(!r.ok)throw new Error(data?.error||data?.message||`HTTP ${r.status}`);return data;}finally{clearTimeout(timer)}
}
export const demoProducts=[
 {id:'demo-lounge',slug:'sunum-berjer',title:'Berjer / sunum örneği',title_en:'Lounge chair / sample',description:'Bu görsel Furni şablonundan bir sunum örneğidir. AURA tarafından üretilmiş bir ürün veya satış teklifi değildir.',description_en:'This Furni template image is a presentation sample, not an AURA product or an offer for sale.',image_url:'assets/product-1.png',category_id:'oturma',demo:true},
 {id:'demo-chair',slug:'sunum-sandalye',title:'Sandalye / sunum örneği',title_en:'Chair / sample',description:'Yerleşimi göstermek için kullanılan örnek görsel. Gerçek ürün bilgileri ve özgün fotoğraflar yayımlandığında değiştirilecektir.',description_en:'A layout sample. It will be replaced with actual product specifications and original photography.',image_url:'assets/product-2.png',category_id:'oturma',demo:true},
 {id:'demo-armchair',slug:'sunum-koltuk',title:'Koltuk / sunum örneği',title_en:'Armchair / sample',description:'Bu örnek satın alınamaz ve teklif listesine eklenemez. Özel üretim talebinizi proje formundan paylaşabilirsiniz.',description_en:'This sample cannot be purchased or added to an enquiry. You can describe your bespoke furniture request using the project form.',image_url:'assets/product-3.png',category_id:'oturma',demo:true}
];
export async function catalog(){try{const [products,categories]=await Promise.all([request('/rest/v1/aura_v2_products?select=*&status=eq.published&order=sort_order.asc,created_at.desc'),request('/rest/v1/aura_v2_categories?select=*&order=sort_order.asc')]);return {products,categories,demo:false,error:false}}catch{return {products:demoProducts,categories:[{id:'oturma',slug:'oturma',name:'Oturma',name_en:'Seating'}],demo:true,error:true}}}
const CART='aura_v2_enquiry';
export function cart(){try{const value=JSON.parse(localStorage.getItem(CART)||'[]');return Array.isArray(value)?value.filter(v=>v&&/^[\w-]{1,100}$/.test(v.id)&&Number.isInteger(v.qty)&&v.qty>0&&v.qty<=99).slice(0,30):[]}catch{return []}}
export function saveCart(items){try{localStorage.setItem(CART,JSON.stringify(items));window.dispatchEvent(new Event('cartchange'));return true}catch{return false}}
export function addCart(product,qty=1){if(product.demo||!Number.isInteger(qty)||qty<1||qty>99)return false;const items=cart();const item=items.find(x=>x.id===product.id);if(item)item.qty=Math.min(99,item.qty+qty);else if(items.length<30)items.push({id:product.id,slug:product.slug,title:product.title,title_en:product.title_en,image:product.image_url,qty});else return false;return saveCart(items)}
export const wa=message=>`https://wa.me/${config.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(message)}`;
export function toast(message){const el=document.getElementById('toast');el.textContent=message;el.style.display='block';setTimeout(()=>el.style.display='none',3200)}
export function formData(form){const data=Object.fromEntries(new FormData(form));return {...data,consent:form.elements.consent.checked,locale:lang}}
