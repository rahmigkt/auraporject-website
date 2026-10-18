// Isolated Microsoft Edge path checks. Requires an explicitly provided local exe.
import{createRequire}from'node:module';import fs from'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.ATMOSFER_ORIGIN,executablePath=process.env.EDGE_EXECUTABLE;if(!origin||!executablePath)throw Error('ATMOSFER_ORIGIN and EDGE_EXECUTABLE required');
const report={packageSource:process.env.EDGE_PACKAGE_SOURCE||'User-provided Microsoft Edge executable; runtime version below',packageSha256:process.env.EDGE_PACKAGE_SHA256||null,personalProfileUsed:false,runs:[]};
for(const backend of ['d3d11','vulkan']){
 let browser,page;const run={requestedBackend:backend},start=Date.now();console.log('Edge backend:',backend);
 try{
  browser=await chromium.launch({executablePath,headless:true,args:['--no-proxy-server',`--use-angle=${backend}`],timeout:30000});run.browser=browser.version();
  const context=await browser.newContext();await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||u.protocol==='data:'?r.continue():r.abort()});page=await context.newPage();
  await page.goto(origin+'/tests/visual/atmosfer-01/review.html',{timeout:45000});await page.waitForFunction(()=>window.reviewReady,null,{timeout:45000});
  run.gpu=await page.evaluate(()=>{const gl=document.querySelector('#studio canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
  let timer;try{run.result=await Promise.race([page.evaluate(()=>window.renderFinal({id:'seating-02',mode:'path',width:192,height:128,samples:4})),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('180 second render deadline')),180000)})]);}finally{clearTimeout(timer)}
  delete run.result.jpeg;run.status='PASS';
 }catch(e){run.status='FAIL';run.reason=e.message;}
 finally{await browser?.close();}
 run.seconds=Math.round((Date.now()-start)/1000);report.runs.push(run);await fs.writeFile(new URL('../../../knowledge/atmosfer/edge-diagnostics.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(run));
}
