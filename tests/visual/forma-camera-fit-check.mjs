// Real local designer page; external services blocked. Inspect the actual viewer camera in memory.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {sample,normalizeDesign} from '../../assets/forma/generate.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.AURA_TEST_OUTPUT||'work/camera-ui');mkdirSync(out,{recursive:true});
const old=execFileSync('git',['show','origin/main:assets/forma/scene.js'],{encoding:'utf8'});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg'};
let before=false;
const server=createServer((req,res)=>{
 if(req.method!=='GET'){res.writeHead(405);return res.end();}
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+pathname);
 if(pathname.startsWith('/api/')){res.setHeader('Content-Type','application/json');return res.end('{"available":false}');}
 if(!file.startsWith(root+sep)||!existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');
 if(pathname==='/assets/forma/scene.js'){
  let source=before?old:readFileSync(file,'utf8');
  source=source.replace('  const resize =',`  window.__cameraAudit=()=>{camera.updateMatrixWorld();const b=new THREE.Box3().setFromObject(group),points=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z).project(camera).toArray());return {points,bounds:{min:b.min.toArray(),max:b.max.toArray()},viewport:innerWidth,host:host.getBoundingClientRect().toJSON()};};\n  const resize =`);
  return res.end(source);
 }
 res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`,results=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.AURA_CHROME_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const [mode,family,kind,width] of [['before','table','dining',390],['after','table','dining',390],['after','storage','wardrobe',390],['after','table','dining',1440]]){
  before=mode==='before';let d=sample({family,kind,seed:2});
  if(family==='table')d=normalizeDesign({...d,params:{...d.params,length:1800,width:900,height:750}});
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
  await context.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await context.addInitScript(d=>{localStorage.setItem('aura-forma-design-'+d.family,JSON.stringify(d));localStorage.setItem('aura-forma-family',JSON.stringify(d.family));localStorage.setItem('aura-forma-lang','"tr"');localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');},d);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/tasarimci.html');await page.waitForFunction(()=>window.__atelier?.S?.compiled&&window.__cameraAudit,null,{timeout:60000});
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const data=await page.evaluate(()=>__cameraAudit());assert.equal(data.viewport,width);assert(data.host.width>0&&data.host.height>0);
  const clipped=data.points.some(p=>Math.abs(p[0])>1||Math.abs(p[1])>1||p[2]<-1||p[2]>1);
  assert.equal(clipped,before,`${mode}/${family}/${width}: ${JSON.stringify(data)}`);assert.deepEqual(errors,[]);
  await page.screenshot({path:resolve(out,`${mode}-${family}-${width}.png`)});
  results.push({mode,family,kind,width,clipped,errors,data});writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));
  console.log(`PASS ${mode}/${family}/${width}: clipped=${clipped}`);await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
