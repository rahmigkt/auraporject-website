// Actual local studio UI, no production services; optional PLAYWRIGHT_MODULE points at an existing install.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {createRequire} from 'node:module';
import {sample, normalizeDesign} from '../../assets/forma/generate.js';
const {chromium} = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve('.'), out = resolve(process.env.AURA_TEST_OUTPUT || 'work/storage-bay-ui'); mkdirSync(out, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.wasm':'application/wasm'};
const server = createServer((req,res) => {
  if (req.method !== 'GET') {res.writeHead(405);return res.end();}
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if (pathname.startsWith('/api/')) {res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({available:false}));}
  const file = resolve(root,'.'+pathname);
  if (!file.startsWith(root+sep) || !existsSync(file)) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');
  if(pathname==='/assets/forma/scene.js'){const code=readFileSync(file,'utf8').replace('scene.add(group);','scene.add(group); window.__visibleParts=()=>{const ids=[];group.traverse(o=>{if(o.isMesh&&o.userData.part)ids.push(o.userData.part);});return [...new Set(ids)];};');return res.end(code);}
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0,'127.0.0.1',r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({headless:true,...(process.env.AURA_CHROME_PATH ? {executablePath:process.env.AURA_CHROME_PATH} : {}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[],want=process.env.AURA_EXPECT_INTERIOR==='visible';
try{
 for(const width of (process.env.AURA_CASE_WIDTHS||'1440,390').split(',').map(Number)){
  const design=JSON.parse(readFileSync(resolve('../../outputs/gardirop-olculu-dxf/model.json'),'utf8')).design;
  const ctx=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
  await ctx.route('**/*',r=>r.request().url().startsWith(base+'/')?r.continue():r.abort());
  await ctx.addInitScript(d=>{localStorage.setItem('aura-forma-design-storage',JSON.stringify(d));localStorage.setItem('aura-forma-family','"storage"');localStorage.setItem('aura-forma-lang','"tr"');localStorage.setItem('aura-forma-guide-seen','1');localStorage.setItem('aura-forma-account-skip','1');},design);
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/tasarla.html');await page.waitForFunction(()=>window.__visibleParts&&window.formaDebug?.viewer);
  const initial=await page.evaluate(()=>formaDebug.state.design);
  const expected=['b1c1-rail','b3c1-rail','b3c1-idrawer1-front','b3c1-idrawer2-front','b3c1-shelf-over',...Array.from({length:5},(_,i)=>'b2c1-shelf'+(i+1))];
  const before=await page.evaluate(()=>__visibleParts());assert(expected.every(id=>!before.includes(id)),'closed interiors hidden');
  await page.locator('#openBtn').click();assert.equal(await page.evaluate(()=>formaDebug.state.openFronts),true);
  const after=await page.evaluate(()=>__visibleParts()),visible=expected.filter(id=>after.includes(id));assert.equal(visible.length,want?expected.length:0,'rendered interior meshes');
  await page.screenshot({path:resolve(out,`${want?'after':'before'}-${width}.png`)});
  await page.locator('#openBtn').click();const restored=await page.evaluate(()=>__visibleParts());assert(expected.every(id=>!restored.includes(id)));
  assert.deepEqual(await page.evaluate(()=>formaDebug.state.design),initial);assert.equal(await page.evaluate(()=>innerWidth),width);assert.deepEqual(errors,[]);
  results.push({width,expected_parts:expected.length,visible_when_open:visible.length,closed_restored:true,source_design_preserved:true,page_errors:0});writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS '+width+' visible='+visible.length);await ctx.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
