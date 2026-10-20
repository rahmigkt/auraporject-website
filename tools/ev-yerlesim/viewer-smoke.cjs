const fs=require('fs'),path=require('path'),http=require('http');
const {pathToFileURL}=require('url'),{chromium}=require('playwright');
const root=process.cwd(),directory=path.join(root,'knowledge/ai-egitim/veri/sohbet-ornekleri');
const allowed={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}try{res.writeHead(200,{'Content-Type':allowed[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});
const bounded=p=>Promise.race([p,new Promise(r=>setTimeout(r,5000))]);
(async()=>{let owner,browser;const results=[];try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));owner=await chromium.launchServer({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});browser=await chromium.connect(owner.wsEndpoint());
 const page=await browser.newPage({viewport:{width:1280,height:920}});let errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Do not inspect the site's default source conversation example, even at startup.
 let intercepted=false;
 await page.route('**/assets/ev/ornekler/sohbet-1.json*',route=>{intercepted=true;return route.fulfill({contentType:'application/json',body:fs.readFileSync(path.join(directory,'planlar','codex-001-level-0.json'),'utf8')})});
 await page.goto(`http://127.0.0.1:${server.address().port}/ev.html`,{waitUntil:'networkidle'});await page.locator('#openFile').waitFor();
 if(process.argv.includes('--startup-only')){if(!intercepted)throw Error('Default example was not intercepted');console.log('Startup uses own fixture; source example blocked');return}
 const files=fs.readdirSync(path.join(directory,'planlar')).filter(n=>/^codex-\d{3}-level-\d\.json$/.test(n));if(files.length!==16)throw Error('Expected 16 separate-floor previews');
 for(const file of files){
  errors=[];const record=JSON.parse(fs.readFileSync(path.join(directory,'planlar',file),'utf8'));
  await page.locator('#openFile').setInputFiles(path.join(directory,'planlar',file));
  await page.waitForFunction(name=>document.querySelector('#pickPlan')?.selectedOptions[0]?.textContent===name,file);
  await page.waitForFunction(n=>document.querySelectorAll('#plan [data-item]').length===n,record.items.length);
  const rooms=await page.locator('#side .room').count(),items=await page.locator('#plan [data-item]').count();
  if(rooms!==record.spaces.length||items!==record.items.length)throw Error('Missing room/product in '+file);
  if(file==='codex-001-level-0.json')await page.screenshot({path:path.join(directory,'codex-viewer.png')});
  await page.locator('[data-v="maket"]').click();await page.waitForFunction(()=>!document.querySelector('#three').hidden);
  // productObject is imported asynchronously on first maket use. Verify via module promise plus frame.
  await page.evaluate(async()=>{await import('/assets/forma/scene.js');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
  if(file==='codex-001-level-0.json')await page.screenshot({path:path.join(directory,'codex-maket.png')});
  if(errors.length)throw Error(file+': '+errors.join(';'));
  results.push({file,rooms,items,passed:true,mode:'real file input, SVG footprints and maket open; no architectural approval'});
  await page.locator('[data-v="plan"]').click();console.log(file,'passed',rooms,'rooms',items,'items');
 }
 const gallery=await browser.newPage({viewport:{width:1300,height:1000}});await gallery.goto(pathToFileURL(path.join(directory,'codex-okuma.html')).href);
 if(await gallery.locator('article').count()!==12)throw Error('Missing conversations');
 if(await gallery.locator('svg').count()!==48)throw Error('Missing alternatives/floors');
 await gallery.screenshot({path:path.join(directory,'codex-desktop.png')});await gallery.setViewportSize({width:390,height:844});
 if(!await gallery.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw Error('Gallery mobile overflow');await gallery.screenshot({path:path.join(directory,'codex-mobile.png')});
 fs.writeFileSync(path.join(directory,'codex-viewer-results.json'),JSON.stringify({passed:true,results,gallery:{conversations:12,diagrams:48,mobile_no_overflow:true},human_approval:false},null,2));
}catch(e){console.error(e);process.exitCode=1}finally{if(browser)await bounded(browser.close().catch(()=>{}));if(owner){owner.process().kill();await bounded(owner.kill().catch(()=>{}))}server.closeAllConnections();server.close();process.exit(process.exitCode||0)}})();
