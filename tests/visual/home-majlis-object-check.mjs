// Real productObject and mesh bounds in Chrome; no WebGL renderer or external network.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),server=createServer(async(req,res)=>{
 try{
  if(req.url==='/audit'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><title>Local geometry audit</title>');}
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!file.startsWith(path.join(root,'assets')+path.sep)||req.method!=='GET'){res.writeHead(403);return res.end();}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.wasm')?'application/wasm':'application/octet-stream');res.end(await fs.readFile(file));
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser,context;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu']});context=await browser.newContext();
 await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/audit');
 const parts=await page.evaluate(async()=>{
  const [{solveRoom},{applyRoomLayout,placedItems},{compileItem},{productObject},THREE]=await Promise.all([
   import('/assets/ev/yerlesim.js'),import('/assets/ev/layout-state.js'),import('/assets/ev/items.js'),import('/assets/forma/scene.js'),import('/assets/vendor/three.module.js?v=20261016b')]);
  const room={id:'R1',boundary_xy_mm:[[0,0],[4000,0],[4000,4000],[0,4000]]};
  const item={id:'M1',space_id:'R1',design:{kind:'majlis',params:{depth:800,layout:'U'}},size:{w:0,d:800,h:450}};
  const result=solveRoom(room,[item],{walls:[],ops:[]},{count:1,beam:2});
  return placedItems(applyRoomLayout([item],result.alternatives[0].placements,'R1')).map(item=>{
   const {compiled,materials}=compileItem(item),object=productObject(compiled,materials),box=new THREE.Box3().setFromObject(object),v=box.getSize(new THREE.Vector3());
   return {id:item.id,expected:item.size_mm,actual:{w:v.x*1000,h:v.y*1000,d:v.z*1000},meshes:object.children.length};
  });
 });
 assert.equal(parts.length,3);for(const part of parts){assert(part.meshes>0);for(const k of ['w','d','h'])assert(Math.abs(part.actual[k]-part.expected[k])<0.1,`${part.id} ${k} changed scale`);}
 assert.deepEqual(errors,[]);await fs.mkdir('work',{recursive:true});await fs.writeFile('work/home-majlis-object-report.json',JSON.stringify({browser:browser.version(),scope:'Actual CPU mesh/productObject; no WebGL or external requests',parts,errors},null,2));
 console.log('PASS actual productObject:3 majlis segments at solver width/depth/height; no page errors');
}finally{await context?.close();await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
