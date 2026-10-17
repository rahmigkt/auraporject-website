// Provider-neutral order preparation. No public checkout until a provider adapter is configured.
// Admin prices are always fetched from the database, never accepted from a public browser.
import {env,json,guard,body,db,uuid,clean,requireAdmin} from '../_shared/server.ts';
Deno.serve(async req=>{const blocked=guard(req);if(blocked)return blocked;
 try{await requireAdmin(req)}catch{return json(req,{error:'Not authorized'},403)}
 try{const b=await body(req);if(!uuid(b.inquiry_id)||!Array.isArray(b.items)||!b.items.length||b.items.length>30)return json(req,{error:'Invalid order'},400);
 const inquiry=await db('aura_v2_inquiries?id=eq.'+b.inquiry_id+'&select=id');if(!inquiry.length)return json(req,{error:'Enquiry not found'},404);
 let subtotal=0;let currency='';const items=[];const seen=new Set();
 for(const item of b.items){if(!uuid(item.id)||!Number.isInteger(item.qty)||item.qty<1||item.qty>99||seen.has(item.id))return json(req,{error:'Invalid line'},400);seen.add(item.id);const found=await db('aura_v2_products?id=eq.'+item.id+'&status=eq.published&select=id,title,price,currency');const p=found[0];if(!p||p.price==null)return json(req,{error:'Product price missing'},409);if(currency&&currency!==p.currency)return json(req,{error:'Mixed currencies'},400);currency=p.currency;const unit=Math.round(Number(p.price)*100);if(!Number.isSafeInteger(unit)||unit<0)return json(req,{error:'Invalid price'},400);subtotal+=unit*item.qty;items.push({product_id:p.id,title:p.title,qty:item.qty,unit_minor:unit})}
 const shipping=b.shipping_minor,tax=b.tax_minor;if(!Number.isSafeInteger(shipping)||shipping<0||!Number.isSafeInteger(tax)||tax<0||!clean(b.terms,8000)||!clean(b.delivery_scope,2000))return json(req,{error:'Terms, delivery and totals required'},400);
 const total=subtotal+shipping+tax;if(!Number.isSafeInteger(total)||total<=0)return json(req,{error:'Invalid total'},400);
 const order=await db('aura_v2_orders',{method:'POST',body:JSON.stringify({inquiry_id:b.inquiry_id,items,currency,subtotal_minor:subtotal,shipping_minor:shipping,tax_minor:tax,total_minor:total,terms_snapshot:clean(b.terms,8000),delivery_scope:clean(b.delivery_scope,2000)})});
 return json(req,{order_id:order[0].id,total_minor:total,currency,payment_enabled:false,status:'awaiting_approval'},201);
 }catch{return json(req,{error:'Order could not be prepared'},503)}
});
