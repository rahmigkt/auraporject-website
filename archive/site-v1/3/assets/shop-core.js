import {config} from './config.js';
export const params=new URLSearchParams(location.search),lang=params.get('lang')==='en'?'en':'tr';
export const t=(a,b)=>lang==='en'?b:a;
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const link=(p='index',args={})=>`${p}.html?${new URLSearchParams({lang,...args})}`;
export const localized=(p,k)=>lang==='en'?(p[k+'_en']||p[k]||''):(p[k]||'');
export const money=(v,c='TRY')=>new Intl.NumberFormat(lang==='tr'?'tr-TR':'en-GB',{style:'currency',currency:c,minimumFractionDigits:0,maximumFractionDigits:2}).format(v);
export const image=p=>!p?'':p.startsWith('../2/assets/')?p:/^https?:\/\//.test(p)?p:`${config.supabaseUrl}/storage/v1/object/public/${config.catalogBucket}/${p.split('/').map(encodeURIComponent).join('/')}`;
export const wa=s=>`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(s)}`;
export async function request(path,opts={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const r=await fetch(config.supabaseUrl+path,{...opts,signal:controller.signal,headers:{apikey:config.supabaseAnonKey,Authorization:'Bearer '+config.supabaseAnonKey,'Content-Type':'application/json',...opts.headers}});const d=await r.json();if(!r.ok)throw Error(d.message||d.error||'Request failed');return d}finally{clearTimeout(timer)}}
export const samples=[
{id:'demo-1',slug:'lounge-berjer',title:'Lounge Berjer',title_en:'Lounge Armchair',category_id:'berjer',price:14900,currency:'TRY',image_url:'../2/assets/product-1.png',demo:true,description:'Yumuşak hatlar, sade bir siluet. Ürün sayfası ve sepet deneyimini göstermek için kullanılan Furni örneği.',description_en:'Soft curves and a simple silhouette. A Furni sample for demonstrating the product page and cart.'},
{id:'demo-2',slug:'nordic-sandalye',title:'Nordic Sandalye',title_en:'Nordic Chair',category_id:'sandalye',price:8900,currency:'TRY',image_url:'../2/assets/product-2.png',demo:true,description:'Gündelik yaşamın içine kolayca yerleşen bir form. Bu ürün ve fiyat yalnızca mağaza önizlemesine aittir.',description_en:'An easy-going form for everyday living. This product and price are for the store preview only.'},
{id:'demo-3',slug:'soft-berjer',title:'Soft Berjer',title_en:'Soft Armchair',category_id:'berjer',price:18900,currency:'TRY',image_url:'../2/assets/product-3.png',demo:true,description:'Dinlenme köşesi için yalın bir görünüm. Görsel ve fiyat örnektir; gerçek bir satış teklifi değildir.',description_en:'A pared-back look for a reading corner. The image and price are examples, not an offer for sale.'}
];
export async function getCatalog(){try{const [products,categories]=await Promise.all([request('/rest/v1/aura_v2_products?select=*&status=eq.published&order=sort_order.asc'),request('/rest/v1/aura_v2_categories?select=*&order=sort_order.asc')]);return {products,categories,demo:false}}catch{return {products:samples,categories:[{id:'berjer',name:'Berjerler',name_en:'Armchairs'},{id:'sandalye',name:'Sandalyeler',name_en:'Chairs'}],demo:true}}}
const KEY='aura_v3_cart';
export function cart(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(i=>i&&/^[a-zA-Z0-9-]{1,100}$/.test(i.id)&&Number.isInteger(i.qty)&&i.qty>=1&&i.qty<=99).slice(0,30):[]}catch{return []}}
export function save(items){try{localStorage.setItem(KEY,JSON.stringify(items));window.dispatchEvent(new Event('cartchange'));return true}catch{return false}}
export function add(id,qty=1){if(!/^[a-zA-Z0-9-]{1,100}$/.test(id)||!Number.isInteger(qty)||qty<1||qty>99)return false;const items=cart(),row=items.find(i=>i.id===id);if(row)row.qty=Math.min(99,row.qty+qty);else if(items.length<30)items.push({id,qty});else return false;return save(items)}
export function lines(products){return cart().map(i=>({...i,product:products.find(p=>p.id===i.id)}))}
export function totals(rows){const result={};for(const {product:p,qty} of rows){if(!p||p.price==null)continue;result[p.currency||'TRY']=(result[p.currency||'TRY']||0)+Math.round(Number(p.price)*100)*qty}return result}
