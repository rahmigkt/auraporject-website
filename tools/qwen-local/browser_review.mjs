// Local-only browser replay. Test hook is appended in HTTP response memory; no assets edited.
import {createServer} from 'node:http';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
import {ROOT,snapshot,sha} from './current_studio.mjs';
const req=createRequire(import.meta.url);
const {chromium}=req(process.env.PLAYWRIGHT_MODULE||'playwright');
const run=resolve(process.argv[2]||'');
const manifest=JSON.parse(readFileSync(resolve(run,'manifest.json'),'utf8'));
if(snapshot().sourceSha256!==manifest.source.sourceSha256)throw Error('Stale source');
const pool=readFileSync(resolve(run,'candidates.jsonl'),'utf8');
if(sha(pool)!==manifest.files['candidates.jsonl'])throw Error('Candidates changed');
const rows=pool.trim().split('\n').map(JSON.parse),selected=[];
// Forty train-only candidates, distributed across available families and task types.
const groups=Object.groupBy(rows.filter(r=>r.split==='train'&&r.natural),r=>r.input.design.family);
const queues=Object.values(groups).map(group=>{
  const specials=group.filter(r=>r.decision!=='edit'||r.expected.actions.length>1);
  const edits=group.filter(r=>!specials.includes(r));return [...specials,...edits];
});
while(selected.length<40&&queues.some(q=>q.length))for(const q of queues)if(q.length&&selected.length<40)selected.push(q.shift());
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){response.writeHead(200,{'content-type':'application/json'});response.end('{"available":false,"vision":false}');return;}
  if(url.pathname!=='/tasarla.html'&&(!url.pathname.startsWith('/assets/')||!['.js','.css','.json','.svg','.png','.jpg','.jpeg','.webp','.woff2','.woff','.hdr','.exr','.glb'].includes(extname(url.pathname)))){response.writeHead(403);response.end();return;}
  const path=resolve(ROOT,'.'+decodeURIComponent(url.pathname));
  if(!path.startsWith(resolve(ROOT)+'/')&&!path.startsWith(resolve(ROOT)+'\\')){response.writeHead(403);response.end();return;}
  if(!existsSync(path)){response.writeHead(404);response.end();return;}
  let contents=readFileSync(path);
  if(url.pathname==='/assets/forma/studio.js')contents=Buffer.concat([contents,Buffer.from('\nwindow.__qwenReplay={applyActions,setDesign,state};\n')]);
  response.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'});response.end(contents);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;const results=[];
try{
  browser=await chromium.launch({...process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{channel:process.env.BROWSER_CHANNEL||'msedge'},headless:true});
  const page=await browser.newPage();const base=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  await page.addInitScript(()=>{localStorage.setItem('aura-forma-account-skip','1');localStorage.setItem('aura-forma-guide-seen','1');});
  await page.goto(base+'/tasarla.html');await page.waitForFunction(()=>!!window.__qwenReplay);
  for(const row of selected){
    try{
      const evidence=await page.evaluate(async row=>{
        const {applyActions,setDesign,state}=window.__qwenReplay;
        const {analyse}=await import('/assets/forma/physics.js');
        const {compileDesign}=await import('/assets/forma/generate.js');
        setDesign(structuredClone(row.input.design),{record:false,sync:false});
        const before=structuredClone(state.design);applyActions(row.expected.actions);
        const after=structuredClone(state.design),compiled=compileDesign(after);
        return {before,after,partCount:compiled.parts.length,physics:analyse(compiled,after.materials,after.family).checks,
          changedParams:Object.keys(before.params).filter(k=>JSON.stringify(before.params[k])!==JSON.stringify(after.params[k]))};
      },row);
      let consistent=true;
      for(const a of row.expected.actions){if(a.type==='set')consistent&&=evidence.after.params[a.key]===a.value;if(a.type==='delta')consistent&&=evidence.after.params[a.key]===evidence.before.params[a.key]+a.value;}
      if(!row.expected.actions.length)consistent&&=JSON.stringify(evidence.before)===JSON.stringify(evidence.after);
      results.push({...row,replay:consistent?'passed':'target_normalized',evidence,review:'unreviewed'});
    }catch(error){results.push({...row,replay:'failed',error:String(error)});}
  }
  writeFileSync(resolve(run,'review-40.jsonl'),results.map(JSON.stringify).join('\n')+'\n');
  const htmlEscape=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  const cards=results.map((r,i)=>`<section><h2>${i+1}. ${htmlEscape(r.input.design.family)} / ${htmlEscape(r.decision)}</h2><p>${htmlEscape(r.input.text)}</p><pre>${htmlEscape(JSON.stringify(r.expected,null,2))}</pre><p>Tarayıcı: ${htmlEscape(r.replay)} · İnsan onayı: bekliyor</p><details><summary>Gerçek sonuç ve fizik uyarıları</summary><pre>${htmlEscape(JSON.stringify(r.evidence||r.error,null,2))}</pre></details><small>${r.id}</small></section>`).join('');
  writeFileSync(resolve(run,'okuma.html'),`<!doctype html><html lang="tr"><meta charset="utf-8"><title>QWEN-YEREL-02 inceleme</title><style>body{font:18px system-ui;max-width:900px;margin:30px auto}section{border-bottom:1px solid #aaa;padding:20px}pre{white-space:pre-wrap;font-size:14px}</style><h1>40 aday — eğitim başlamadı</h1><p>Metinler şablon üretimidir. Anlam, dil, netleştirme ve ret uygunluğu insan tarafından onaylanmalıdır. Fizik uyarıları güvenlik sertifikası değildir. Kimlikleriyle onay/düzeltme bildirin.</p>${cards}</html>`);
  writeFileSync(resolve(run,'review-evidence.json'),JSON.stringify({source:manifest.source.sourceSha256,candidatePool:sha(pool),reviewCount:results.length,passed:results.filter(r=>r.replay==='passed').length,modelEvaluated:false,humanReviewed:false,files:Object.fromEntries(['review-40.jsonl','okuma.html'].map(name=>[name,sha(readFileSync(resolve(run,name)))]))},null,2)+'\n');
  console.log(JSON.stringify({reviewCount:results.length,replay:Object.fromEntries([...new Set(results.map(r=>r.replay))].map(k=>[k,results.filter(r=>r.replay===k).length])),trainingStarted:false}));
}finally{await browser?.close();await new Promise(done=>server.close(done));}
