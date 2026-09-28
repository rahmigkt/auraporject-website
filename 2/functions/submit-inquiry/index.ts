import {env,json,guard,body,db,uuid,clean,digest} from '../_shared/server.ts';
Deno.serve(async req=>{const blocked=guard(req);if(blocked)return blocked;
 try{
  if(env('AURA_INQUIRIES_ENABLED')!=='true')return json(req,{error:'Enquiries not configured'},503);
  const b=await body(req);if(b.website)return json(req,{error:'Invalid request'},400);
  if(!uuid(b.idempotency_key)||b.consent!==true||!['tr','en'].includes(b.locale)||!['quote','project'].includes(b.kind))return json(req,{error:'Invalid request'},400);
  const name=clean(b.name),email=clean(b.email,254),country=clean(b.country),city=clean(b.city),message=clean(b.message,4000);
  if(name.length<2||!/^\S+@\S+\.\S+$/.test(email)||!country||!city||message.length<3)return json(req,{error:'Required fields missing'},400);
  if(!env('AURA_RATE_SALT'))return json(req,{error:'Rate limiting not configured'},503);
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
  const allowed=await db('rpc/aura_v2_rate_limit',{method:'POST',body:JSON.stringify({p_key:await digest(env('AURA_RATE_SALT')+ip)})});if(!allowed)return json(req,{error:'Please try again later'},429);
  const prior=await db('aura_v2_inquiries?idempotency_key=eq.'+b.idempotency_key+'&select=reference');if(prior.length)return json(req,{reference:prior[0].reference});
  if(!Array.isArray(b.items)||b.items.length>30)return json(req,{error:'Invalid items'},400);
  const seen=new Set<string>();const items=[];
  for(const item of b.items){if(!uuid(item.id)||!Number.isInteger(item.qty)||item.qty<1||item.qty>99||seen.has(item.id))return json(req,{error:'Invalid product'},400);seen.add(item.id);const products=await db('aura_v2_products?id=eq.'+item.id+'&status=eq.published&select=id,title,slug');if(!products.length)return json(req,{error:'Product unavailable'},409);items.push({...products[0],qty:item.qty})}
  const reference='AP-'+crypto.randomUUID();
  await db('aura_v2_inquiries',{method:'POST',body:JSON.stringify({reference,idempotency_key:b.idempotency_key,kind:b.kind,name,email,phone:clean(b.phone),country,city,company:clean(b.company),budget:clean(b.budget,100),deadline:clean(b.deadline,20),message,locale:b.locale,items,privacy_version:env('AURA_PRIVACY_VERSION')||'preview-2026-09'})});
  return json(req,{reference},201);
 }catch{return json(req,{error:'Unable to save enquiry. Please retry or contact AURA.'},503)}
});
