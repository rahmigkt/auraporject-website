// Real file-input integration in unmodified ev.html; no fixture interception.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const root=process.cwd(),dir=path.join(root,'knowledge/ai-egitim/ev-sohbet-02-ornekler');
const results=[],mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const bounded=p=>Promise.race([p,new Promise(r=>setTimeout(r,5000))]);
(async()=>{let owner,browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 owner=await chromium.launchServer({host:'127.0.0.1',channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});browser=await chromium.connect(owner.wsEndpoint());
 const page=await browser.newPage({viewport:{width:1440,height:1050}});let errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Page error:',e.message);});page.on('dialog',async d=>{errors.push(d.message());console.error('Dialog:',d.message());await d.dismiss();});
 await page.goto(`http://127.0.0.1:${server.address().port}/ev.html`,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>Boolean(window.__ev?.D),null,{timeout:20000});
 for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.json')&&!n.startsWith('viewer'))){
  const d=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));errors=[];
  console.log('Opening',file);
  await page.locator('#openFile').setInputFiles(path.join(dir,file));
  await page.waitForFunction(id=>window.__ev?.D?.project_id===id,d.project_id,{timeout:20000});
  // Upper/lower share project ID: wait for the actual uploaded level too.
  await page.waitForFunction(id=>window.__ev.D.levels[0].id===id,d.levels[0].id);
  const rooms=await page.locator('#side .room').count();
  const areaHeadings=await page.locator('#side h2').allTextContents();
  const expectedArea=d.review_export.net_interior_area_m2.toFixed(1);
  const areaMatches=areaHeadings.some(s=>s.includes('Odalar')&&s.includes(expectedArea));
  await page.locator('[data-v="plan"]').click();
  await page.screenshot({path:path.join(dir,file.replace('.json','.png'))});
  await page.locator('[data-v="maket"]').click();
  await page.waitForFunction(()=>!document.querySelector('#three').hidden);
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:path.join(dir,file.replace('.json','-maket.png'))});
  results.push({file,expected_rooms:d.spaces.length,rendered_rooms:rooms,expected_net_interior_m2:expectedArea,area_matches:areaMatches,uploaded_via:'Plan dosyası aç',modes:['plan','maket'],errors:[...errors],passed:rooms===d.spaces.length&&errors.length===0&&areaMatches});
  await page.locator('[data-v="plan"]').click();
 }
 fs.writeFileSync(path.join(dir,'viewer-results.json'),JSON.stringify(results,null,2)+'\n');
 if(results.length!==4||results.some(r=>!r.passed))throw Error(JSON.stringify(results));console.log(JSON.stringify(results));
}catch(e){console.error(e);process.exitCode=1;}finally{if(browser)await bounded(browser.close().catch(()=>{}));if(owner){owner.process().kill('SIGKILL');await bounded(owner.kill().catch(()=>{}));}server.closeAllConnections();server.close();process.exit(process.exitCode||0);}})();
