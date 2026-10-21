import {classifierPrompt,TASTE_SCHEMA,groundedTasteReply} from '../../../../assets/assistant-classifier.js';
export async function runTasteAgent({model,language='tr',taste={},messages,origin='http://127.0.0.1:11434'}){
 if(!Array.isArray(messages)||!messages.length||messages.length>12||messages.at(-1)?.role!=='user'||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>2500))throw Error('Invalid conversation');
 const response=await fetch(new URL('/api/chat',origin),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,think:false,keep_alive:'5m',format:TASTE_SCHEMA,options:{temperature:.2,num_predict:180,num_ctx:4096},messages:[{role:'system',content:classifierPrompt(taste)},...messages]}),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Model unavailable');const data=await response.json(),result=groundedTasteReply(JSON.parse(data.message?.content||'null'),taste,language,messages.at(-1).content);
 return {...result,engine:'ollama',model,knowledgeVersion:'aura-style-directions-20261016',trainedOnCustomerData:false};
}
