const fs = require('fs');
const path = require('path');
const http = require('http');
const {chromium} = require('playwright');
const root = process.cwd();
const fixtures = path.resolve(process.argv[2] || 'outputs/ev-qwen-00/viewer');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{
  const name=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!name.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.writeHead(200,{'Content-Type':mime[path.extname(name)]||'application/octet-stream'});res.end(fs.readFileSync(name));}catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  const results=[];
  try{
    browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const name of fs.readdirSync(fixtures).filter(n=>/-level-\d+\.json$/.test(n))){
      const data=fs.readFileSync(path.join(fixtures,name),'utf8');
      const expected=JSON.parse(data).spaces.length;
      const page=await browser.newPage({viewport:{width:1100,height:800}});const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/assets/ev/ornek-plan.json*',r=>r.fulfill({contentType:'application/json',body:data}));
      await page.goto(`http://127.0.0.1:${server.address().port}/ev.html`);
      await page.waitForFunction(()=>document.querySelectorAll('#side .room').length>0,{},{timeout:20000});
      const rooms=await page.locator('#side .room').count();
      await page.locator('[data-v="maket"]').click();
      await page.waitForFunction(()=>!document.querySelector('#three').hidden);
      if(name==='detached_3-level-0.json')await page.screenshot({path:path.join(fixtures,'detached_3-smoke.png')});
      results.push({file:name,expected_rooms:expected,rendered_rooms:rooms,errors,passed:rooms===expected&&errors.length===0,mode:'per-floor fixture interception, no assets changes; not stairs/site visual validation'});
      await page.close();
    }
  }finally{if(browser)await browser.close();server.closeAllConnections();server.close();}
  fs.writeFileSync(path.join(fixtures,'viewer-results.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify({tested:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)}));
})().catch(e=>{server.closeAllConnections();server.close();console.error(e);process.exitCode=1;});
