// Thin adapter: no alternative studio implementation.
import fs from 'node:fs';
import {uygula,VERSION,SOZLUK} from '../studyo-motoru/motor.mjs';
import {compileItem} from '../../assets/ev/items.js';
import {decodeOperations} from './operations.mjs';
const input=JSON.parse(fs.readFileSync(0,'utf8'));
if(input.dictionary){console.log(JSON.stringify({version:VERSION,layers:SOZLUK}));}
else if(input.prepare){
 const r=input.record, ops=[];
 for(const request of r.layout_requests||[]){
  const attempt=[...request.attempts].reverse().find(a=>a.result?.ok);
  if(!attempt)continue;
  ops.push({tur:'yerlestir',katman:'yerlesim',oda:request.space_id,esyalar:attempt.items.map(it=>{const size=it.size||compileItem(it).size;return {id:it.id,tur:it.design.kind,en:size.w,derinlik:size.d,yukseklik:size.h};}),kisitlar:[]});
 }
 const plan=structuredClone(r.plan);plan.items=[];
 console.log(JSON.stringify({state:{plan},operations:ops}));
}else{
 const ops=decodeOperations(input.operations);
 try{const {rapor}=uygula(input.state,ops);console.log(JSON.stringify({engine:VERSION,report:rapor}));}
 catch(error){console.log(JSON.stringify({engine:VERSION,error:error.message}));}
}
