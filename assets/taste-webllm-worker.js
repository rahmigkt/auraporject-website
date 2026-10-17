import {classifierPrompt,TASTE_SCHEMA,groundedTasteReply} from './assistant-classifier.js?v=20261016s';
import {CreateMLCEngine} from 'https://esm.run/@mlc-ai/web-llm@0.2.85';
let engine;
self.onmessage=async({data})=>{try{
 if(data.type==='init'){engine=await CreateMLCEngine(data.model,{initProgressCallback:p=>self.postMessage({type:'progress',progress:p.progress,text:p.text})},{context_window_size:4096});self.postMessage({type:'ready',model:data.model});return;}
 if(data.type==='chat'){if(!engine)throw Error('Not ready');const completion=await engine.chat.completions.create({messages:[{role:'system',content:classifierPrompt(data.taste)},...data.messages.slice(-4).map(m=>({role:m.role,content:m.content.slice(0,1200)}))],temperature:0,max_tokens:180,response_format:{type:'json_object',schema:JSON.stringify(TASTE_SCHEMA)}});const result=groundedTasteReply(JSON.parse(completion.choices[0].message.content),data.taste,data.language,data.messages.at(-1).content);self.postMessage({type:'answer',id:data.id,result:{...result,engine:'webllm',trainedOnCustomerData:false}});}
 }catch(e){self.postMessage({type:'error',id:data.id,message:String(e.message||e).slice(0,250)});}};
