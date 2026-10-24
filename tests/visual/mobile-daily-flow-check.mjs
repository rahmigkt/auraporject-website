// Local real Chrome flow; no production services, forms, accounts or file sends.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.AURA_TEST_OUTPUT||'work/mobile-daily-flow-check');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const server=createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(405);return res.end();}const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.startsWith('/api/')){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({available:false}));}const f=resolve(root,'.'+path);if(!f.startsWith(root+sep)||!existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');res.end(readFileSync(f));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
console.log('START Chrome daily flow');
const browser=await chromium.launch({headless:true,...(process.env.AURA_CHROME_PATH?{executablePath:process.env.AURA_CHROME_PATH}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
console.log('READY Chrome');
const results=[];
const save=()=>writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2));
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});const external=[],posts=[];
 await context.route('**/*',r=>{const req=r.request();if(req.method()!=='GET'){posts.push(req.url());return r.abort();}if(!req.url().startsWith(base+'/')){external.push(req.url());return r.abort();}return r.continue();});
 await context.addInitScript(()=>{localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');});
 const page=await context.newPage(),errors=[],downloads=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 const press=async locator=>{console.log('ACTION '+width+' '+locator);return width===390?locator.tap():locator.click();};
 const tab=async key=>{await press(page.locator('[data-tab="'+key+'"]'));await page.waitForFunction(k=>formaDebug.state.tab===k,key);};
 console.log('OPEN studio '+width);await page.goto(base+'/tasarla.html?family=table&lang=tr');console.log('LOADED studio '+width);await page.waitForFunction(()=>window.formaDebug?.viewer);assert.equal(await page.evaluate(()=>innerWidth),width);
 await tab('deliver');await press(page.locator('[data-act="add"]'));await press(page.locator('[data-act="qty"][data-d="1"]').first());
 const original=await page.evaluate(()=>structuredClone(formaDebug.state.project.items[0]));assert.equal(original.qty,2);
 for(const family of ['storage','kitchen','bath','seating']){console.log('FAMILY '+family);
  await press(page.locator('#families [data-family="'+family+'"]'));assert.equal(await page.evaluate(()=>formaDebug.state.editing),null,'header family switch must start another item');
  await tab('deliver');await press(page.locator('[data-act="add"]'));assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items[0]),original,'existing saved table unchanged');
 }
 assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items.map(i=>i.design.family)),['table','storage','kitchen','bath','seating']);
 assert.equal(await page.evaluate(()=>new Set(formaDebug.state.project.items.map(i=>i.id)).size),5);
 // Explicit Edit retains identity, quantity and other products; dimensions, undo and redo remain usable.
 await press(page.locator('[data-act="edit"][data-item="'+original.id+'"]'));await tab('size');
 const input=page.locator('input[data-num]').first(),key=await input.getAttribute('data-num'),before=+(await input.inputValue()),step=+(await input.getAttribute('step'))||1,max=+(await input.getAttribute('max'));const next=before+step<=max?before+step:before-step;
 await input.fill(String(next));await input.press('Tab');await page.waitForFunction(({key,next})=>formaDebug.state.design.params[key]===next,{key,next});
 await press(page.locator('#undoBtn'));assert.equal(await page.evaluate(k=>formaDebug.state.design.params[k],key),before);await press(page.locator('#redoBtn'));assert.equal(await page.evaluate(k=>formaDebug.state.design.params[k],key),next);
 await tab('deliver');await press(page.locator('[data-act="add"]'));assert.equal(await page.evaluate(()=>formaDebug.state.project.items.length),5);assert.equal(await page.evaluate(()=>formaDebug.state.project.items[0].qty),2);
 const saved=await page.evaluate(()=>structuredClone(formaDebug.state.project.items));
 await page.reload();await page.waitForFunction(()=>window.formaDebug?.viewer);assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items),saved);
 await tab('deliver');await press(page.locator('#families [data-family="table"]'));assert.equal(await page.evaluate(()=>formaDebug.state.editing),original.id,'same family click does not detach edit');
 await press(page.locator('[data-act="edit"][data-item="'+saved[1].id+'"]'));assert.equal(await page.evaluate(()=>formaDebug.state.editing),saved[1].id,'editing another saved family keeps selected identity');await tab('deliver');
 const sticky=[];
 if(width===390){for(const viewport of [{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.locator('#sendForm [name="name"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const v=document.querySelector('.f-visual').getBoundingClientRect(),r=document.querySelector('.f-tabs').getBoundingClientRect();return r.top>=v.bottom-1;});
  const hit=await page.evaluate(()=>{const t=document.querySelector('[data-tab="size"]'),r=t.getBoundingClientRect(),v=document.querySelector('.f-visual').getBoundingClientRect();return{width:innerWidth,height:innerHeight,tabTop:r.top,visualBottom:v.bottom,clickable:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('[data-tab]')===t,scrollWidth:document.documentElement.scrollWidth};});
  assert.equal(hit.clickable,true,'sticky model cannot intercept tab touch');assert.ok(hit.scrollWidth<=viewport.width+1,'no horizontal page overflow');sticky.push(hit);await tab('size');await tab('deliver');
 }await page.setViewportSize({width:390,height:844});
 // Rebuilding the shell for a different language must rebind the layout observer.
 await page.locator('#lang').selectOption('en');await page.waitForFunction(()=>formaDebug.state.lang==='en'&&formaDebug.viewer);await tab('deliver');await page.locator('#sendForm [name="name"]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.f-tabs').getBoundingClientRect().top>=document.querySelector('.f-visual').getBoundingClientRect().bottom-1);await tab('size');await tab('deliver');
 }
 await page.screenshot({path:resolve(out,'project-'+width+'.png'),fullPage:true});
 // Room preview and item removal are local; remaining records must survive reload and designer handoff.
 await press(page.locator('[data-act="room"]'));assert.ok(await page.evaluate(()=>formaDebug.state.room));await press(page.locator('[data-act="leaveRoom"]'));
 await press(page.locator('[data-act="remove"][data-item="'+saved[4].id+'"]'));const remaining=await page.evaluate(()=>structuredClone(formaDebug.state.project.items));assert.deepEqual(remaining,saved.slice(0,4));
 await page.reload();await page.waitForFunction(()=>window.formaDebug?.viewer);assert.deepEqual(await page.evaluate(()=>formaDebug.state.project.items),remaining);
 await page.goto(base+'/tasarimci.html');await page.waitForFunction(()=>window.__atelier?.S?.items?.length===4);await press(page.locator('#items [data-item="3"]'));assert.equal(await page.evaluate(()=>__atelier.S.cur),3);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('aura-forma-project')).items.length),4);
 assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);assert.deepEqual(posts,[]);
 results.push({width,families:5,original_item_preserved:true,quantity_preserved:true,explicit_edit_undo_redo:true,reload:true,room_preview:true,remove_remaining_preserved:true,designer_handoff:4,sticky,language_shell_resize:width===390,downloads:0,page_errors:0,non_get_requests:0,external_requests_blocked:external.length});save();console.log('PASS daily project flow '+width);await context.close();
}}catch(error){save();writeFileSync(resolve(out,'failure.txt'),String(error.stack));throw error;}finally{await browser.close();server.closeAllConnections();server.close();}
