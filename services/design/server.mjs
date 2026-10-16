import {runTasteAgent} from './taste-agent.mjs';
import {runStudioAgent} from './studio-agent.mjs';
import {DESIGN_FIELDS,STUDIO_TOOLS,studioPrompt,applyStudioCalls} from './studio-tools.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {FAMILIES,DETAILS,LANGUAGES,normalizeStudio} from '../../w4/assets/design-library.js';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const HOST=process.env.AURA_BIND||'127.0.0.1',PORT=Number(process.env.PORT||8770),MODEL=process.env.AURA_MODEL||'qwen2.5:7b-instruct';
// Only the application server talks to Ollama. Never expose Ollama publicly.
const ASSISTANT_MODEL=process.env.AURA_ASSISTANT_MODEL||process.env.AURA_MODEL||'qwen3.5:9b';
const OLLAMA=new URL(process.env.AURA_OLLAMA_URL||'http://127.0.0.1:11434');
if(!['127.0.0.1','localhost','[::1]'].includes(OLLAMA.hostname))throw Error('Ollama must be on this server or a local SSH tunnel.');
const ORIGINS=new Set((process.env.AURA_ALLOWED_ORIGINS||`http://127.0.0.1:${PORT},http://localhost:${PORT}`).split(','));
let active=0;const limits=new Map();
const schema={type:'object',additionalProperties:false,required:['reply','patch'],properties:{reply:{type:'string',maxLength:2500},patch:{type:'object',additionalProperties:false,properties:DESIGN_FIELDS}}};

export function validateModelReply(raw){
 if(!raw||typeof raw.reply!=='string'||!raw.reply.trim()||!raw.patch||typeof raw.patch!=='object'||Array.isArray(raw.patch))throw Error('Invalid model response');
 const patch={};for(const [key,value] of Object.entries(raw.patch)){const rule=schema.properties.patch.properties[key];if(!rule)continue;if(rule.enum&&!rule.enum.includes(value))throw Error('Invalid option');if(rule.type==='number'&&(typeof value!=='number'||!Number.isFinite(value)))throw Error('Invalid dimension');if(rule.type==='integer'&&!Number.isInteger(value))throw Error('Invalid integer');patch[key]=value;}
 return {reply:raw.reply.slice(0,2500),patch};
}


const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function json(res,status,data){res.writeHead(status,headers);res.end(JSON.stringify(data));}
async function body(req){const chunks=[];let bytes=0;for await(const part of req){bytes+=part.length;if(bytes>50000)throw Error('Body too large');chunks.push(part);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.txt':'text/plain; charset=utf-8'};
export const server=http.createServer(async(req,res)=>{
 try{const url=new URL(req.url,`http://127.0.0.1:${PORT}`);
  if(req.headers.origin&&!ORIGINS.has(req.headers.origin)){json(res,403,{error:'Origin denied'});return;}
  if(url.pathname==='/api/assistant/health'&&req.method==='GET'){
   try{const r=await fetch(new URL('/api/tags',OLLAMA),{signal:AbortSignal.timeout(3000)});const d=await r.json();json(res,200,{available:r.ok&&d.models?.some(m=>m.name===ASSISTANT_MODEL),model:ASSISTANT_MODEL,knowledgeVersion:'aura-style-directions-20261016'});}catch{json(res,503,{available:false});}return;
  }
  if(url.pathname==='/api/assistant/chat'&&req.method==='POST'){
   if(!req.headers.origin||!ORIGINS.has(req.headers.origin)){json(res,403,{error:'Origin denied'});return;}
   if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'JSON required'});return;}
   const now=Date.now(),ip=req.socket.remoteAddress;const rate=limits.get(ip);if(active>=1||rate&&now-rate.start<60000&&rate.count>=12){json(res,429,{error:'Busy'});return;}
   limits.set(ip,{start:rate&&now-rate.start<60000?rate.start:now,count:rate&&now-rate.start<60000?rate.count+1:1});
   let data;try{data=await body(req);}catch{json(res,400,{error:'Invalid JSON'});return;}
   if(!Array.isArray(data.messages)||!data.messages.length||data.messages.length>12||data.messages.at(-1)?.role!=='user'||data.messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>2500)){json(res,400,{error:'Invalid conversation'});return;}
   active++;try{json(res,200,await runTasteAgent({model:ASSISTANT_MODEL,language:['tr','en','fr','da'].includes(data.language)?data.language:'tr',taste:data.taste,messages:data.messages,origin:OLLAMA}));}catch{json(res,502,{error:'Model unavailable or invalid reply'});}finally{active--;}return;
  }
  if(url.pathname==='/api/design/health'&&req.method==='GET'){
   try{const r=await fetch(new URL('/api/tags',OLLAMA),{signal:AbortSignal.timeout(3000)});const d=await r.json();json(res,200,{available:r.ok&&d.models?.some(m=>m.name===MODEL),model:MODEL});}catch{json(res,503,{available:false});}return;
  }
  if(url.pathname==='/api/design/chat'&&req.method==='POST'){
   if(!req.headers.origin||!ORIGINS.has(req.headers.origin)){json(res,403,{error:'Origin required'});return;}
   if(!req.headers['content-type']?.startsWith('application/json')){json(res,415,{error:'JSON required'});return;}
   const now=Date.now(),ip=req.socket.remoteAddress;for(const [k,v] of limits)if(now-v.start>60000)limits.delete(k);
   const rate=limits.get(ip)||{start:now,count:0};if(rate.count>=12||active>=1){json(res,429,{error:'Busy; retry shortly'});return;}rate.count++;limits.set(ip,rate);
   let data;try{data=await body(req);}catch{json(res,400,{error:'Invalid request'});return;}
   if(!Array.isArray(data.messages)||!data.messages.length||data.messages.length>16||data.messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>2500)||data.messages.at(-1).role!=='user'){json(res,400,{error:'Invalid conversation'});return;}
   const language=Object.hasOwn(LANGUAGES,data.language)?data.language:'en';const design=normalizeStudio(data.design);active++;
   try{const answer=await runStudioAgent({model:MODEL,language,design,messages:data.messages,origin:OLLAMA,maxRounds:3,onRound:process.env.AURA_LOCAL_EVAL==='1'?(r=>console.log(JSON.stringify({round:r.round,seconds:r.seconds,tools:r.calls.map(c=>c.function.name)}))):undefined});
    const applied=applyStudioCalls(design,answer.operations);const patch={...applied.patch};for(const key of Object.keys(patch))patch[key]=applied.state[key];
    let reply=answer.reply;if(answer.adjustedFields.length)reply+=' '+(language==='tr'?'Çizim sınırlarına uyarlanan alanlar: ':'Fields adjusted to drawing limits: ')+answer.adjustedFields.join(', ');
    json(res,200,{reply:reply.slice(0,2500),patch,operations:answer.operations,actions:applied.actions,adjustedFields:answer.adjustedFields,complete:answer.complete,...(process.env.AURA_LOCAL_EVAL==='1'?{trace:answer.rounds,seconds:answer.seconds}:{})});
   }catch{json(res,502,{error:'Model unavailable or invalid reply'});}finally{active--;}return;
  }
  if(url.pathname.startsWith('/api/')){json(res,404,{error:'Not found'});return;}
  // Serve only public W4 assets; never source services, dotfiles or credentials.
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{json(res,400,{error:'Invalid path'});return;}
  if(pathname==='/')pathname='/w4/birlikte.html';
  if(!pathname.startsWith('/w4/')||pathname.split('/').some(p=>p==='..'||p.startsWith('.'))||pathname.includes('\\')){json(res,404,{error:'Not found'});return;}
  const filename=path.resolve(ROOT,'.'+pathname),ext=path.extname(filename);if(!filename.startsWith(path.join(ROOT,'w4')+path.sep)||!mime[ext]||!['GET','HEAD'].includes(req.method)){json(res,404,{error:'Not found'});return;}
  try{const file=await readFile(filename);res.writeHead(200,{'Content-Type':mime[ext],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:file);}catch{json(res,404,{error:'Not found'});}
 }catch{json(res,500,{error:'Request failed'});}
});
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))server.listen(PORT,HOST,()=>console.log(`AURA co-design: http://${HOST}:${PORT}/w4/birlikte.html`));
