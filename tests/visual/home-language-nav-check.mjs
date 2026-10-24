// Local real Chrome flow; no production services, forms, accounts or file sends.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve('.'),out=resolve(process.env.AURA_TEST_OUTPUT||'work/home-language-nav-check');mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const server=createServer((req,res)=>{if(req.method!=='GET'){res.writeHead(405);return res.end();}const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.startsWith('/api/')){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({available:false}));}const f=resolve(root,'.'+path);if(!f.startsWith(root+sep)||!existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');res.end(readFileSync(f));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;

const browser=await chromium.launch({headless:true,...(process.env.AURA_CHROME_PATH?{executablePath:process.env.AURA_CHROME_PATH}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
console.log('READY Chrome');
const results=[];
try{for(const [lang,width,stored]of [['ar',320,null],['de',390,null],['ar',390,'fr'],['fr',1440,null]]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,locale:'en-US'});const posts=[],errors=[],downloads=[];
 await context.route('**/*',r=>{if(r.request().method()!=='GET'){posts.push(r.request().url());return r.abort();}return r.request().url().startsWith(base+'/')?r.continue():r.abort();});
 await context.addInitScript(stored=>{if(!sessionStorage.getItem('seeded')){if(stored)localStorage.setItem('aura-forma-lang',JSON.stringify(stored));localStorage.setItem('daily-sentinel','keep');localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');sessionStorage.setItem('seeded','1');}},stored);
 const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));
 const press=async q=>width<500?page.locator(q).tap():page.locator(q).click();
 await page.goto(base+'/index.html?lang='+lang);await page.locator('#homeLang').waitFor();
 const snapshot=async()=>page.evaluate(()=>({lang:document.documentElement.lang,dir:document.documentElement.dir,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,stored:localStorage.getItem('aura-forma-lang'),sentinel:localStorage.getItem('daily-sentinel')}));
 const initial=await snapshot();assert.equal(initial.lang,lang);assert.equal(initial.dir,lang==='ar'?'rtl':'ltr');assert.ok(initial.scrollWidth<=width+1);assert.equal(initial.stored,stored?JSON.stringify(stored):null);
 const links=await page.locator('.h-pick a').evaluateAll(xs=>xs.map(x=>x.href));assert.equal(links.length,5);for(const link of links)assert.equal(new URL(link).searchParams.get('lang'),lang);
 await press('.a-brand');await page.waitForURL(base+'/index.html?lang='+lang);await page.locator('#homeLang').waitFor();const back=await snapshot();assert.equal(back.lang,lang);assert.equal(back.dir,initial.dir);assert.equal(back.stored,initial.stored);assert.equal(back.sentinel,'keep');
 await press('.h-pick a[href*="family=table"]');await page.waitForFunction(()=>window.formaDebug?.viewer);assert.equal(await page.evaluate(()=>formaDebug.state.lang),lang);assert.equal(await page.evaluate(()=>formaDebug.state.design.family),'table');
 await press('.f-brand');await page.waitForURL(base+'/index.html?lang='+lang);await page.locator('#homeLang').waitFor();const final=await snapshot();assert.equal(final.lang,lang);assert.equal(final.dir,initial.dir);assert.equal(final.sentinel,'keep');assert.ok(final.scrollWidth<=width+1);
 await page.screenshot({path:resolve(out,lang+'-'+width+(stored?'-saved-fr':'')+'.png')});assert.deepEqual(errors,[]);assert.deepEqual(downloads,[]);assert.deepEqual(posts,[]);
 results.push({lang,width,stored_before:initial.stored,brand_retains_language:true,catalogue_studio_home:true,rtl:final.dir,overflow:final.scrollWidth>width,unrelated_storage_preserved:true,page_errors:0,downloads:0,non_get_requests:0});writeFileSync(resolve(out,'results.json'),JSON.stringify({passed:results.length,results},null,2));console.log('PASS '+lang+'/'+width);await context.close();
}}finally{await browser.close();server.closeAllConnections();server.close();}
