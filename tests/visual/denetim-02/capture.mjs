// Read-only family audit through the existing tests/visual/foto/foto.html photo path.
// No assets are rewritten; audit observability is appended to the test page response in memory.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const root=resolve('.'),out=resolve('tests/visual/denetim-02');mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.hdr':'application/octet-stream','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/_audit'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Local audit</title>');return;}
 if(!u.pathname.startsWith('/assets/')&&!u.pathname.startsWith('/tests/visual/foto/')){res.writeHead(403);res.end();return;}
 const p=resolve(root,'.'+decodeURIComponent(u.pathname));
 if(!p.startsWith(root+'/')&&!p.startsWith(root+'\\')||!existsSync(p)||!statSync(p).isFile()){res.writeHead(404);res.end();return;}
 let body=readFileSync(p);
 if(u.pathname.endsWith('/foto.html'))body=Buffer.from(body.toString().replace('sample({family:fam,seed,style})','sample({family:fam,seed,style,kind:q.get("kind")||undefined})').replace('const v=createViewer','window.auditDesign=d; window.auditCompiled=compileDesign(d); const v=createViewer').replace("v.mode('render');", "window.auditViewer=v; v.mode('render');"));
 res.setHeader('content-type',mime[extname(p)]||'application/octet-stream');res.end(body);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`,records=[];let browser;
try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 await page.goto(base+'/_audit');
 const families=await page.evaluate(async()=>{const {FAMILIES}=await import('/assets/forma/families.js');return Object.fromEntries(['table','storage','kitchen','bath'].map(f=>[f,{styles:FAMILIES[f].styles.map(s=>s.id),kinds:Object.keys(FAMILIES[f].kinds)}]));});
 for(const family of ['table','storage','kitchen','bath'])for(let i=0;i<6;i++){
   const seed=i+1,style=families[family].styles[i%families[family].styles.length],kind=families[family].kinds[i%families[family].kinds.length],id=`${family}-${seed}`;
   const general=`${id}-genel.jpg`,close=`${id}-yakin.jpg`;
   if(existsSync(resolve(out,general))&&existsSync(resolve(out,close))&&existsSync(resolve(out,id+'.json'))){records.push(JSON.parse(readFileSync(resolve(out,id+'.json'),'utf8')));continue;}
   const errors=[];const handler=e=>errors.push(e.message);page.on('pageerror',handler);
   const record={id,family,seed,style,kind,source,photoHelper:'tests/visual/foto/foto.html',width:1000,height:667,samples:6,errors};
   try{
     const query=new URLSearchParams({family,seed:String(seed),style,kind,w:'1000',h:'667',n:'6'});
     await page.goto(base+'/tests/visual/foto/foto.html?'+query);
     await page.waitForFunction(()=>window.ready,null,{timeout:180000});
     const data=await page.evaluate(async()=>{
       const {worldPositions}=await import('/assets/forma/build.js');
       const c=window.auditCompiled,d=window.auditDesign;
       const roles={table:['top'],storage:['door','front','drawer-front','case-top'],kitchen:['worktop','front','door'],bath:['vanity-top','basin','front']};
       const part=roles[d.family].map(role=>c.parts.find(p=>p.role===role&&!p.internal)).find(Boolean)||c.parts.find(p=>!p.line&&!p.internal);
       const xyz=Array.from(worldPositions(part)),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
       xyz.forEach((v,i)=>{const k=i%3;lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);});
       const focus=[(lo[0]+3*hi[0])/4,(lo[1]+hi[1])/2,hi[2]].map(v=>v/1000);
       return {shot:window.shot,design:d,partCount:c.parts.length,closeTarget:{partId:part.id,role:part.role,focus}};
     });
     writeFileSync(resolve(out,general),Buffer.from(data.shot.split(',')[1],'base64'));delete data.shot;Object.assign(record,data);
     const shot=await page.evaluate(async focus=>window.auditViewer.photo(2,{width:1000,height:667,samples:6,zoom:3.2,pitch:.16,focus}),data.closeTarget.focus);
     writeFileSync(resolve(out,close),Buffer.from(shot.split(',')[1],'base64'));
     record.images={general,close};record.status='captured_not_yet_visually_reviewed';
   }catch(e){record.status='capture_failed';record.failure=String(e);}
   page.off('pageerror',handler);writeFileSync(resolve(out,id+'.json'),JSON.stringify(record,null,2)+'\n');records.push(record);
   writeFileSync(resolve(out,'manifest.json'),JSON.stringify({source,records},null,2)+'\n');console.log(id,record.status,errors.length);
 }
}finally{await browser?.close();await new Promise(done=>server.close(done));}
if(records.some(r=>r.status==='capture_failed'))process.exitCode=1;
