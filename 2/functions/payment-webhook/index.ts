// Disabled by default. A chosen PSP adapter must verify the provider's ORIGINAL webhook,
// then sign this normalized event with a separate AURA_WEBHOOK_SECRET. Not a PSP endpoint.
import {env,json,db,uuid} from '../_shared/server.ts';
Deno.serve(async req=>{
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405);
 if(env('AURA_PAYMENTS_ENABLED')!=='true'||!env('AURA_WEBHOOK_SECRET'))return json(req,{error:'Payments disabled'},503);
 try{const raw=await req.text();if(raw.length>16000)return json(req,{error:'Too large'},413);
 const timestamp=req.headers.get('x-aura-timestamp')||'',signature=req.headers.get('x-aura-signature')||'';
 if(!/^\d{10}$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300||!/^[a-f0-9]{64}$/i.test(signature))return json(req,{error:'Invalid signature'},401);
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env('AURA_WEBHOOK_SECRET')),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const bytes=new Uint8Array(signature.match(/../g)!.map(x=>parseInt(x,16)));
 if(!await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(timestamp+'.'+raw)))return json(req,{error:'Invalid signature'},401);
 const b=JSON.parse(raw);if(!uuid(b.order_id)||typeof b.event_id!=='string'||b.event_id.length>200||typeof b.payment_reference!=='string'||b.payment_reference.length>200||!Number.isSafeInteger(b.amount_minor)||b.status!=='paid'||!['TRY','EUR','USD','GBP'].includes(b.currency))return json(req,{error:'Invalid event'},400);
 await db('rpc/aura_v2_record_payment',{method:'POST',body:JSON.stringify({p_event:b.event_id,p_order:b.order_id,p_amount:b.amount_minor,p_currency:b.currency,p_reference:b.payment_reference})});return json(req,{received:true});
 }catch{return json(req,{error:'Payment not reconciled'},409)}
});
