// Local browser regression; PLAYWRIGHT_MODULE may point to an installed playwright package.
// No model is started. All external requests are blocked and API health is mocked offline.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {direction} from '../../assets/style-directions.js';
const avoidPhrase=direction('japandi').name+' istemiyorum.';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)||p.startsWith('/api/')||req.method!=='GET'){res.writeHead(403);return res.end();}const b=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const rows=[];let browser,context;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu']});
 context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();if(u.pathname==='/api/assistant/health')return r.fulfill({contentType:'application/json',body:'{"available":false}'});if(u.pathname.startsWith('/api/'))return r.abort();return r.continue();});
 for(const scenario of ['dropdown','button','remove-avoid','three-style-limit']){
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.addInitScript(({scenario,avoidPhrase})=>sessionStorage.setItem('aura-taste-handoff',JSON.stringify({confirmedByCustomer:true,category:'seating',styles:scenario==='three-style-limit'?['art_deco','bauhaus','minimalism']:[],avoidStyleIds:['japandi'],avoid:avoidPhrase+' Kalın ayak istemiyorum.'})),{scenario,avoidPhrase});
   await page.goto(origin+'/sohbet.html?category=seating',{waitUntil:'networkidle',timeout:30000});
   assert.equal(await page.locator('[data-remove-avoid="japandi"]').count(),1);
   if(scenario==='dropdown'||scenario==='three-style-limit')await page.locator('#moreStyle').selectOption('japandi');
   else if(scenario==='button')await page.locator('[data-style="japandi"]').click();
   else await page.locator('[data-remove-avoid="japandi"]').click();
   await page.locator('#confirmTaste').click();
   const record=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('aura-taste-handoff')));
   if(scenario==='three-style-limit'){assert.equal(record.styles.length,3);assert(!record.styles.includes('japandi'));assert(record.avoidStyleIds.includes('japandi'));assert(record.avoid.includes(avoidPhrase));}
   else{assert(!record.avoidStyleIds.includes('japandi'),'newly chosen style remains in avoided IDs');assert(!record.avoid.includes(avoidPhrase),'old automatic avoidance phrase remains');assert(record.avoid.includes('Kalın ayak istemiyorum.'),'unrelated customer note lost');assert.equal(record.styles.includes('japandi'),scenario!=='remove-avoid');}
   assert.deepEqual(errors,[]);rows.push({scenario,result:'PASS'});
  }catch(e){rows.push({scenario,result:'FAIL',error:e.message});}finally{await page.close();}
 }
 await fs.mkdir('work',{recursive:true});await fs.writeFile('work/assistant-style-browser-report.json',JSON.stringify({scope:'Local mock offline UI only; no model/GPU/API submission',browser:browser.version(),rows},null,2)+'\n');
 console.log(JSON.stringify(rows,null,2));assert(rows.every(r=>r.result==='PASS'),'Assistant style UI regression');
}finally{server.closeAllConnections();server.close();if(context)await context.close();if(browser)await browser.close();}
