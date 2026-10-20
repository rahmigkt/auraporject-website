// Bounded, incremental viewer check: one page avoids accumulating WebGL contexts.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const root=process.cwd(),directory=path.resolve(process.argv[2]);
const output=path.join(directory,'viewer-results.json');
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
const results=[];
const save=()=>fs.writeFileSync(output,JSON.stringify(results,null,2));
const bounded=promise=>Promise.race([promise,new Promise(resolve=>setTimeout(resolve,5000))]);
(async()=>{
  let owner,browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    owner=await chromium.launchServer({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    browser=await chromium.connect(owner.wsEndpoint());
    const page=await browser.newPage({viewport:{width:1100,height:800}});
    let payload='',errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/assets/ev/ornek-plan.json*',route=>route.fulfill({contentType:'application/json',body:payload}));
    const names=fs.readdirSync(directory).filter(name=>/-level-\d+\.json$/.test(name));
    for(const name of names){
      payload=fs.readFileSync(path.join(directory,name),'utf8');errors=[];
      const expected=JSON.parse(payload).spaces.length;
      await page.goto(`http://127.0.0.1:${server.address().port}/ev.html`,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.querySelectorAll('#side .room').length>0,null,{timeout:20000});
      const rooms=await page.locator('#side .room').count();
      await page.locator('[data-v="maket"]').click();
      await page.waitForFunction(()=>!document.querySelector('#three').hidden,null,{timeout:20000});
      results.push({file:name,expected_rooms:expected,rendered_rooms:rooms,errors:[...errors],passed:rooms===expected&&errors.length===0,mode:'per-floor fixture interception; compatibility axes only; not architectural approval'});
      save();
      if(results.length%10===0)console.log('checked',results.length,'/',names.length);
    }
    if(names.length!==120 || results.some(r=>!r.passed))throw Error('Incomplete or failed viewer delivery');
    console.log(JSON.stringify({tested:results.length,passed:results.filter(r=>r.passed).length,failures:results.filter(r=>!r.passed)}));
  }catch(error){console.error(error);process.exitCode=1;}
  finally{
    save();
    if(browser)await bounded(browser.close().catch(()=>{}));
    if(owner){owner.process().kill('SIGKILL');await bounded(owner.kill().catch(()=>{}));}
    server.closeAllConnections();server.close();
    process.exit(process.exitCode||0);
  }
})();
