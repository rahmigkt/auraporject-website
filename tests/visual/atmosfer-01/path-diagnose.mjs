const origin=process.env.ATMOSFER_ORIGIN||'http://127.0.0.1:8772';
import{createRequire}from'node:module';import fs from'node:fs/promises';const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const report={physicalDevice:'Intel Iris Xe (single accessible device)',otherPhysicalDevice:'unavailable',runs:[]};
for(const [channel,backend]of[['chrome','d3d11'],['chrome','gl'],['chrome','vulkan'],['msedge','d3d11']]){
 let browser;const run={channel,requestedBackend:backend};const started=Date.now();console.log('path diagnosis',channel,backend);
 try{
 browser=await chromium.launch({channel,headless:true,args:['--no-proxy-server',`--use-angle=${backend}`],timeout:20000});const page=await browser.newPage();page.setDefaultTimeout(90000);
 await page.goto(origin+'/tests/visual/atmosfer-01/review.html',{timeout:30000});await page.waitForFunction(()=>window.reviewReady);
 run.gpu=await page.evaluate(()=>{const gl=document.querySelector('#studio canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
 const result=await Promise.race([page.evaluate(()=>window.renderFinal({id:'seating-02',mode:'path',width:192,height:128,samples:4})),new Promise((_,reject)=>setTimeout(()=>reject(Error('90 second diagnostic deadline')),90000))]);
 run.status='PASS';delete result.jpeg;run.result=result;
 }catch(e){run.status='FAIL';run.reason=e.message;}finally{await browser?.close();}
 run.seconds=Math.round((Date.now()-started)/1000);report.runs.push(run);await fs.writeFile(new URL('../../../knowledge/atmosfer/path-diagnostics.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(run));
}
